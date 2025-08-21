import crypto from "crypto";
import type { User, OAuthSession, InsertOAuthSession } from "@shared/schema";
import { ayrshareService } from "./ayrshare";
import { storage } from "./storage";

// OAuth configuration for different platforms
const OAUTH_CONFIGS = {
  facebook: {
    authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
    tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
    scope: "pages_manage_posts,pages_read_engagement,instagram_basic,instagram_content_publish",
  },
  instagram: {
    authUrl: "https://api.instagram.com/oauth/authorize",
    tokenUrl: "https://api.instagram.com/oauth/access_token",
    scope: "user_profile,user_media",
  },
  twitter: {
    authUrl: "https://twitter.com/i/oauth2/authorize",
    tokenUrl: "https://api.twitter.com/2/oauth2/token",
    scope: "tweet.read tweet.write users.read offline.access",
  },
  linkedin: {
    authUrl: "https://www.linkedin.com/oauth/v2/authorization",
    tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
    scope: "r_liteprofile r_emailaddress w_member_social",
  },
};

export class OAuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL || "http://localhost:5000";
  }

  /**
   * Generate OAuth state and code verifier for PKCE
   */
  private generateOAuthParams(): { state: string; codeVerifier: string; codeChallenge: string } {
    const state = crypto.randomBytes(32).toString("hex");
    const codeVerifier = crypto.randomBytes(32).toString("base64url");
    const codeChallenge = crypto
      .createHash("sha256")
      .update(codeVerifier)
      .digest("base64url");

    return { state, codeVerifier, codeChallenge };
  }

  /**
   * Start OAuth flow for a platform using Ayrshare's unified approach
   */
  async startOAuthFlow(user: User, platform: string): Promise<{
    authUrl: string;
    state: string;
  }> {
    try {
      // For Ayrshare Business Plan, we use their JWT-based social linking
      if (!user.ayrshareProfileKey) {
        throw new Error("User does not have an Ayrshare profile. Please create one first.");
      }

      // Generate redirect URL back to our app
      const redirectUrl = `${this.baseUrl}/api/oauth/callback/${platform}`;
      
      // Get Ayrshare JWT URL for social linking
      const jwtResponse = await ayrshareService.generateJWT(
        user.ayrshareProfileKey,
        redirectUrl
      );

      if (jwtResponse.status !== "success" || !jwtResponse.url) {
        throw new Error("Failed to generate Ayrshare linking URL");
      }

      // Create OAuth session for tracking
      const { state, codeVerifier } = this.generateOAuthParams();
      
      const oauthSession: InsertOAuthSession = {
        userId: user.id,
        platform,
        state,
        codeVerifier,
        redirectUri: redirectUrl,
        scope: OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS]?.scope || "",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      };

      await storage.createOAuthSession(oauthSession);

      return {
        authUrl: jwtResponse.url,
        state,
      };
    } catch (error) {
      console.error("OAuth flow start error:", error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and complete the connection
   */
  async handleOAuthCallback(
    platform: string,
    code: string,
    state: string
  ): Promise<{
    success: boolean;
    message: string;
    userId?: string;
  }> {
    try {
      // Find OAuth session by state
      const session = await storage.getOAuthSessionByState(state);
      if (!session) {
        throw new Error("Invalid OAuth state or expired session");
      }

      // Check if session is expired
      if (new Date() > session.expiresAt) {
        await storage.deleteOAuthSession(session.id);
        throw new Error("OAuth session expired");
      }

      // Get user
      const user = await storage.getUser(session.userId);
      if (!user || !user.ayrshareProfileKey) {
        throw new Error("User not found or missing Ayrshare profile");
      }

      // For Ayrshare integration, the social account linking happens
      // through their interface, so we just need to sync the accounts
      await this.syncUserSocialAccounts(user);

      // Clean up OAuth session
      await storage.deleteOAuthSession(session.id);

      return {
        success: true,
        message: `Successfully connected ${platform} account`,
        userId: user.id,
      };
    } catch (error) {
      console.error("OAuth callback error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "OAuth callback failed",
      };
    }
  }

  /**
   * Sync user's social accounts from Ayrshare
   */
  async syncUserSocialAccounts(user: User): Promise<void> {
    if (!user.ayrshareProfileKey) {
      throw new Error("User does not have an Ayrshare profile key");
    }

    try {
      // Get connected accounts from Ayrshare
      const ayrshareAccounts = await ayrshareService.getUserSocialAccounts(
        user.ayrshareProfileKey
      );

      // Get existing accounts from our database
      const existingAccounts = await storage.getSocialAccountsByUserId(user.id);
      const existingPlatforms = new Set(existingAccounts.map(acc => acc.platform));

      // Add new accounts that don't exist in our database
      for (const account of ayrshareAccounts) {
        if (!existingPlatforms.has(account.platform)) {
          await storage.createSocialAccount({
            ...account,
            userId: user.id,
          });
        } else {
          // Update existing account status and metadata
          const existingAccount = existingAccounts.find(
            acc => acc.platform === account.platform
          );
          if (existingAccount) {
            await storage.updateSocialAccount(existingAccount.id, {
              status: account.status,
              accountName: account.accountName,
              accountHandle: account.accountHandle,
              avatar: account.avatar,
              followerCount: account.followerCount,
              verifiedAccount: account.verifiedAccount,
              accountMetadata: account.accountMetadata,
              lastSyncAt: new Date(),
            });
          }
        }
      }

      // Mark accounts as disconnected if they're no longer in Ayrshare
      const ayrshareplatforms = new Set(ayrshareAccounts.map(acc => acc.platform));
      for (const existingAccount of existingAccounts) {
        if (!ayrshareplatforms.has(existingAccount.platform)) {
          await storage.updateSocialAccount(existingAccount.id, {
            status: "disconnected",
            lastSyncAt: new Date(),
          });
        }
      }
    } catch (error) {
      console.error("Failed to sync social accounts:", error);
      throw error;
    }
  }

  /**
   * Disconnect a social media account
   */
  async disconnectAccount(user: User, platform: string): Promise<void> {
    if (!user.ayrshareProfileKey) {
      throw new Error("User does not have an Ayrshare profile key");
    }

    try {
      // Disconnect from Ayrshare
      await ayrshareService.disconnectSocialAccount(user.ayrshareProfileKey, platform);

      // Update our database
      const existingAccounts = await storage.getSocialAccountsByUserId(user.id);
      const account = existingAccounts.find(acc => acc.platform === platform);
      
      if (account) {
        await storage.updateSocialAccount(account.id, {
          status: "disconnected",
          lastSyncAt: new Date(),
        });
      }
    } catch (error) {
      console.error("Failed to disconnect account:", error);
      throw error;
    }
  }

  /**
   * Get authorization URL for manual platform connection
   */
  generatePlatformAuthUrl(platform: string, redirectUri: string): string {
    const config = OAUTH_CONFIGS[platform as keyof typeof OAUTH_CONFIGS];
    if (!config) {
      throw new Error(`Platform ${platform} not supported`);
    }

    const { state, codeChallenge } = this.generateOAuthParams();
    
    const params = new URLSearchParams({
      client_id: process.env[`${platform.toUpperCase()}_CLIENT_ID`] || "demo-client-id",
      redirect_uri: redirectUri,
      scope: config.scope,
      response_type: "code",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return `${config.authUrl}?${params.toString()}`;
  }
}

export const oauthService = new OAuthService();