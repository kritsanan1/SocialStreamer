import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertSocialAccountSchema } from "@shared/schema";
import { ayrshareService } from "./ayrshare";
import { oauthService } from "./oauth";
// JWT type declarations
interface JwtPayload {
  userId: string;
}

// JWT functions
const signJWT = (payload: JwtPayload, secret: string, options?: { expiresIn: string }): string => {
  // Mock JWT implementation for development
  return `jwt_${btoa(JSON.stringify(payload))}_${Date.now()}`;
};

const verifyJWT = (token: string, secret: string): JwtPayload => {
  // Mock JWT verification for development
  try {
    const payload = JSON.parse(atob(token.split('_')[1]));
    return payload;
  } catch {
    throw new Error('Invalid token');
  }
};
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY || "demo-key";

interface AuthRequest extends Request {
  userId?: string;
}

// Auth middleware
const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = verifyJWT(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already taken" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = signJWT({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: "Registration failed", error });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = signJWT({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
      res.json({ 
        user: { ...user, password: undefined }, 
        token 
      });
    } catch (error) {
      res.status(400).json({ message: "Login failed", error });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserWithSocialAccounts(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user", error });
    }
  });

  // Social accounts routes
  app.get("/api/social-accounts", authenticate, async (req: AuthRequest, res) => {
    try {
      const accounts = await storage.getSocialAccountsByUserId(req.userId!);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get social accounts", error });
    }
  });

  app.post("/api/social-accounts/connect", authenticate, async (req: AuthRequest, res) => {
    try {
      const { platform } = req.body;
      
      if (!platform) {
        return res.status(400).json({ message: "Platform is required" });
      }

      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // If user doesn't have an Ayrshare profile, create one
      if (!user.ayrshareProfileKey) {
        console.log("Creating Ayrshare profile for user:", user.email);
        const profileResponse = await ayrshareService.createUserProfile(user);
        
        if (profileResponse.status === "success" && profileResponse.profileKey) {
          await storage.updateUser(user.id, {
            ayrshareProfileKey: profileResponse.profileKey,
            ayrshareUserId: profileResponse.userId,
            ayrshareRefId: profileResponse.refId,
          });
          user.ayrshareProfileKey = profileResponse.profileKey;
        } else {
          return res.status(500).json({ 
            message: "Failed to create Ayrshare profile",
            error: profileResponse.message 
          });
        }
      }

      // Start OAuth flow
      const oauthResult = await oauthService.startOAuthFlow(user, platform);
      
      res.json({
        authUrl: oauthResult.authUrl,
        state: oauthResult.state,
        platform,
        message: "OAuth flow initiated. Please complete authentication in the new window."
      });
    } catch (error) {
      console.error("Connect social account error:", error);
      res.status(500).json({ 
        message: "Failed to initiate social account connection", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/oauth/callback/:platform", async (req, res) => {
    try {
      const { platform } = req.params;
      const { code, state, error: oauthError } = req.query;

      if (oauthError) {
        return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5000"}/?error=${oauthError}`);
      }

      if (!code || !state) {
        return res.redirect(`${process.env.CLIENT_URL || "http://localhost:5000"}/?error=missing_params`);
      }

      const result = await oauthService.handleOAuthCallback(
        platform,
        code as string,
        state as string
      );

      if (result.success) {
        res.redirect(`${process.env.CLIENT_URL || "http://localhost:5000"}/?connected=${platform}`);
      } else {
        res.redirect(`${process.env.CLIENT_URL || "http://localhost:5000"}/?error=${encodeURIComponent(result.message)}`);
      }
    } catch (error) {
      console.error("OAuth callback error:", error);
      res.redirect(`${process.env.CLIENT_URL || "http://localhost:5000"}/?error=callback_failed`);
    }
  });

  app.delete("/api/social-accounts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const account = await storage.getSocialAccount(id);
      
      if (!account || account.userId !== req.userId) {
        return res.status(404).json({ message: "Account not found" });
      }

      const user = await storage.getUser(req.userId!);
      if (user && user.ayrshareProfileKey) {
        // Disconnect from Ayrshare
        await oauthService.disconnectAccount(user, account.platform);
      }

      await storage.deleteSocialAccount(id);
      res.json({ message: "Account disconnected successfully" });
    } catch (error) {
      console.error("Disconnect account error:", error);
      res.status(500).json({ message: "Failed to disconnect account", error });
    }
  });

  // Sync social accounts from Ayrshare
  app.post("/api/social-accounts/sync", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user || !user.ayrshareProfileKey) {
        return res.status(400).json({ 
          message: "User does not have an Ayrshare profile" 
        });
      }

      await oauthService.syncUserSocialAccounts(user);
      const accounts = await storage.getSocialAccountsByUserId(req.userId!);
      
      res.json({ 
        message: "Social accounts synced successfully",
        accounts 
      });
    } catch (error) {
      console.error("Sync accounts error:", error);
      res.status(500).json({ 
        message: "Failed to sync social accounts", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Posts routes
  app.get("/api/posts", authenticate, async (req: AuthRequest, res) => {
    try {
      const { limit = 50, offset = 0, withAnalytics } = req.query;
      
      if (withAnalytics === "true") {
        const posts = await storage.getPostsWithAnalytics(req.userId!, Number(limit));
        res.json(posts);
      } else {
        const posts = await storage.getPostsByUserId(req.userId!, Number(limit), Number(offset));
        res.json(posts);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get posts", error });
    }
  });

  app.get("/api/posts/scheduled", authenticate, async (req: AuthRequest, res) => {
    try {
      const posts = await storage.getScheduledPosts(req.userId!);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get scheduled posts", error });
    }
  });

  app.get("/api/posts/templates", authenticate, async (req: AuthRequest, res) => {
    try {
      const templates = await storage.getTemplates(req.userId!);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get templates", error });
    }
  });

  app.post("/api/posts", authenticate, async (req: AuthRequest, res) => {
    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        userId: req.userId,
      });

      // Validate platforms - ensure it's an array
      const platforms = Array.isArray(postData.platforms) ? postData.platforms : [];
      if (platforms.length === 0) {
        return res.status(400).json({ message: "At least one platform is required" });
      }

      // Check if user has connected accounts for selected platforms
      const socialAccounts = await storage.getSocialAccountsByUserId(req.userId!);
      const connectedPlatforms = socialAccounts
        .filter(acc => acc.status === "connected")
        .map(acc => acc.platform);
      
      const missingPlatforms = platforms.filter(platform => 
        !connectedPlatforms.includes(platform)
      );

      if (missingPlatforms.length > 0) {
        return res.status(400).json({ 
          message: `Please connect accounts for: ${missingPlatforms.join(", ")}` 
        });
      }

      const post = await storage.createPost({
        ...postData,
        platforms: platforms,
      });

      // Handle scheduling vs immediate posting
      const scheduledDate = postData.scheduledAt ? new Date(postData.scheduledAt) : null;
      if (scheduledDate && scheduledDate > new Date()) {
        // Schedule for later
        await storage.updatePost(post.id, { status: "scheduled" });
        console.log(`Post ${post.id} scheduled for ${scheduledDate.toISOString()}`);
      } else {
        // Post immediately via Ayrshare API
        try {
          // In a real implementation, this would call the actual Ayrshare API
          console.log("Publishing post via Ayrshare API:", {
            post: postData.content,
            platforms: platforms,
            media: postData.mediaUrls,
          });

          // Simulate API response
          const ayrshareResponse = {
            id: `ayr_${Date.now()}`,
            status: "success",
            platforms: platforms.reduce((acc: Record<string, any>, platform: string) => {
              acc[platform] = {
                status: "success",
                postId: `${platform}_${Date.now()}`,
                url: `https://${platform}.com/posts/${Date.now()}`,
              };
              return acc;
            }, {}),
          };

          await storage.updatePost(post.id, {
            status: "published",
            publishedAt: new Date(),
            ayrsharePostId: ayrshareResponse.id,
            platformResults: ayrshareResponse.platforms as Record<string, any>,
          });

          // Create mock analytics data for the post
          for (const platform of platforms) {
            await storage.createAnalytics({
              postId: post.id,
              platform,
              impressions: Math.floor(Math.random() * 1000) + 100,
              likes: Math.floor(Math.random() * 50) + 10,
              shares: Math.floor(Math.random() * 20) + 2,
              comments: Math.floor(Math.random() * 15) + 1,
              clicks: Math.floor(Math.random() * 30) + 5,
              engagementRate: Math.floor(Math.random() * 500) + 200, // 2-7%
            });
          }

        } catch (ayrshareError) {
          console.error("Ayrshare API error:", ayrshareError);
          await storage.updatePost(post.id, { 
            status: "failed",
            platformResults: { error: "Failed to publish to social media platforms" }
          });
        }
      }

      const updatedPost = await storage.getPost(post.id);
      res.json(updatedPost);
    } catch (error) {
      console.error("Post creation error:", error);
      res.status(400).json({ message: "Failed to create post", error });
    }
  });

  app.put("/api/posts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getPost(id);
      
      if (!post || post.userId !== req.userId) {
        return res.status(404).json({ message: "Post not found" });
      }

      const updates = insertPostSchema.partial().parse(req.body);
      const updatedPost = await storage.updatePost(id, updates);
      
      res.json(updatedPost);
    } catch (error) {
      res.status(400).json({ message: "Failed to update post", error });
    }
  });

  app.delete("/api/posts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const post = await storage.getPost(id);
      
      if (!post || post.userId !== req.userId) {
        return res.status(404).json({ message: "Post not found" });
      }

      await storage.deletePost(id);
      res.json({ message: "Post deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post", error });
    }
  });

  // Analytics routes
  app.get("/api/analytics", authenticate, async (req: AuthRequest, res) => {
    try {
      const { postId, platform, period = "7d" } = req.query;
      
      if (postId) {
        const analytics = await storage.getAnalyticsByPostId(postId as string);
        res.json(analytics);
      } else {
        // Get aggregated analytics for user's posts
        const posts = await storage.getPostsByUserId(req.userId!);
        const allAnalytics = [];
        
        for (const post of posts) {
          const postAnalytics = await storage.getAnalyticsByPostId(post.id);
          allAnalytics.push(...postAnalytics);
        }
        
        // Filter by platform if specified
        const filteredAnalytics = platform 
          ? allAnalytics.filter(a => a.platform === platform)
          : allAnalytics;
        
        // Calculate aggregated metrics
        const aggregated = {
          totalPosts: new Set(filteredAnalytics.map(a => a.postId)).size,
          totalImpressions: filteredAnalytics.reduce((sum, a) => sum + (a.impressions || 0), 0),
          totalLikes: filteredAnalytics.reduce((sum, a) => sum + (a.likes || 0), 0),
          totalShares: filteredAnalytics.reduce((sum, a) => sum + (a.shares || 0), 0),
          totalComments: filteredAnalytics.reduce((sum, a) => sum + (a.comments || 0), 0),
          totalClicks: filteredAnalytics.reduce((sum, a) => sum + (a.clicks || 0), 0),
          averageEngagementRate: filteredAnalytics.length > 0 
            ? filteredAnalytics.reduce((sum, a) => sum + (a.engagementRate || 0), 0) / filteredAnalytics.length
            : 0,
          analytics: filteredAnalytics,
        };
          
        res.json(aggregated);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics", error });
    }
  });

  // Get dashboard summary
  app.get("/api/dashboard/summary", authenticate, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserWithSocialAccounts(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const posts = await storage.getPostsByUserId(req.userId!, 50);
      const scheduledPosts = await storage.getScheduledPosts(req.userId!);
      const socialAccounts = user.socialAccounts || [];
      const connectedAccounts = socialAccounts.filter(acc => acc.status === "connected");

      // Get recent analytics
      const recentPosts = posts.slice(0, 10);
      const allAnalytics = [];
      for (const post of recentPosts) {
        const postAnalytics = await storage.getAnalyticsByPostId(post.id);
        allAnalytics.push(...postAnalytics);
      }

      const summary = {
        user: { ...user, password: undefined },
        stats: {
          connectedAccounts: connectedAccounts.length,
          totalPosts: posts.length,
          scheduledPosts: scheduledPosts.length,
          recentEngagement: allAnalytics.reduce((sum, a) => sum + (a.likes || 0) + (a.shares || 0) + (a.comments || 0), 0),
        },
        recentPosts: posts.slice(0, 5),
        socialAccounts: connectedAccounts,
        analytics: {
          totalImpressions: allAnalytics.reduce((sum, a) => sum + (a.impressions || 0), 0),
          totalEngagement: allAnalytics.reduce((sum, a) => sum + (a.likes || 0) + (a.shares || 0) + (a.comments || 0), 0),
          averageEngagementRate: allAnalytics.length > 0 
            ? allAnalytics.reduce((sum, a) => sum + (a.engagementRate || 0), 0) / allAnalytics.length
            : 0,
        }
      };

      res.json(summary);
    } catch (error) {
      console.error("Dashboard summary error:", error);
      res.status(500).json({ message: "Failed to get dashboard summary", error });
    }
  });

  app.get("/api/analytics/overview", authenticate, async (req: AuthRequest, res) => {
    try {
      const posts = await storage.getPostsWithAnalytics(req.userId!, 100);
      const scheduledPosts = await storage.getScheduledPosts(req.userId!);
      
      const totalEngagement = posts.reduce((sum, p) => sum + p.totalEngagement, 0);
      const totalPosts = posts.filter(p => p.status === "published").length;
      const avgEngagementRate = posts.length > 0 
        ? posts.reduce((sum, p) => {
            const postAvg = p.analytics.length > 0
              ? p.analytics.reduce((aSum, a) => aSum + (a.engagementRate || 0), 0) / p.analytics.length
              : 0;
            return sum + postAvg;
          }, 0) / posts.length
        : 0;

      const overview = {
        totalPosts,
        scheduledPosts: scheduledPosts.length,
        totalEngagement,
        avgEngagementRate: avgEngagementRate / 100, // Convert back to percentage
      };

      res.json(overview);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics overview", error });
    }
  });

  // Team routes
  app.get("/api/team", authenticate, async (req: AuthRequest, res) => {
    try {
      const teamMembers = await storage.getTeamMembersByUserId(req.userId!);
      res.json(teamMembers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get team members", error });
    }
  });

  app.post("/api/team/invite", authenticate, async (req: AuthRequest, res) => {
    try {
      const { email, role, permissions } = req.body;
      
      // In a real app, you'd send an invitation email here
      const invitation = {
        userId: "pending", // Will be filled when user accepts
        teamId: req.userId!, // Using user ID as team ID for simplicity
        role: role || "editor",
        permissions: permissions || [],
        invitedBy: req.userId!,
      };

      const teamMember = await storage.createTeamMember(invitation);
      res.json(teamMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to invite team member", error });
    }
  });

  // Media upload route
  app.post("/api/media/upload", authenticate, async (req: AuthRequest, res) => {
    try {
      // In a real implementation, you'd handle file upload here
      // For now, return a mock URL
      const mockUrl = `https://example.com/uploads/${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      res.json({
        url: mockUrl,
        type: "image",
        size: Math.floor(Math.random() * 1000000) + 100000,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to upload media", error });
    }
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      ayrshareConnected: !!AYRSHARE_API_KEY && AYRSHARE_API_KEY !== "demo-key"
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
