import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertPostSchema, insertSocialAccountSchema } from "@shared/schema";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-key";
const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY || "demo-key";

interface AuthRequest extends Express.Request {
  userId?: string;
}

// Auth middleware
const authenticate = async (req: AuthRequest, res: Express.Response, next: Express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
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

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
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

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });
      
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

      // Check if account already exists for this platform
      const existingAccounts = await storage.getSocialAccountsByUserId(req.userId!);
      const existingAccount = existingAccounts.find(acc => acc.platform === platform);
      
      if (existingAccount) {
        return res.status(400).json({ message: "Account already connected for this platform" });
      }

      // In real implementation, this would initiate OAuth flow with Ayrshare
      // For now, we'll create a pending connection
      const accountData = {
        userId: req.userId!,
        platform,
        accountId: `${platform}-${Date.now()}`,
        accountName: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Account`,
        accountHandle: `@${platform}account`,
        status: "pending" as const,
      };

      const account = await storage.createSocialAccount(accountData);
      
      // Simulate Ayrshare API connection process
      setTimeout(async () => {
        try {
          await storage.updateSocialAccount(account.id, {
            status: "connected",
            lastSyncAt: new Date(),
            accessToken: `encrypted_token_${Date.now()}`, // In real app, this would be encrypted
          });
        } catch (error) {
          console.error("Failed to update account status:", error);
        }
      }, 2000);

      res.json(account);
    } catch (error) {
      res.status(400).json({ message: "Failed to connect account", error });
    }
  });

  app.delete("/api/social-accounts/:id", authenticate, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const account = await storage.getSocialAccount(id);
      
      if (!account || account.userId !== req.userId) {
        return res.status(404).json({ message: "Account not found" });
      }

      await storage.deleteSocialAccount(id);
      res.json({ message: "Account disconnected" });
    } catch (error) {
      res.status(500).json({ message: "Failed to disconnect account", error });
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

      // Validate platforms
      if (!postData.platforms || postData.platforms.length === 0) {
        return res.status(400).json({ message: "At least one platform is required" });
      }

      // Check if user has connected accounts for selected platforms
      const socialAccounts = await storage.getSocialAccountsByUserId(req.userId!);
      const connectedPlatforms = socialAccounts
        .filter(acc => acc.status === "connected")
        .map(acc => acc.platform);
      
      const missingPlatforms = postData.platforms.filter(platform => 
        !connectedPlatforms.includes(platform)
      );

      if (missingPlatforms.length > 0) {
        return res.status(400).json({ 
          message: `Please connect accounts for: ${missingPlatforms.join(", ")}` 
        });
      }

      const post = await storage.createPost(postData);

      // Handle scheduling vs immediate posting
      if (postData.scheduledAt && new Date(postData.scheduledAt) > new Date()) {
        // Schedule for later
        await storage.updatePost(post.id, { status: "scheduled" });
        console.log(`Post ${post.id} scheduled for ${postData.scheduledAt}`);
      } else {
        // Post immediately via Ayrshare API
        try {
          // In a real implementation, this would call the actual Ayrshare API
          console.log("Publishing post via Ayrshare API:", {
            post: postData.content,
            platforms: postData.platforms,
            media: postData.mediaUrls,
          });

          // Simulate API response
          const ayrshareResponse = {
            id: `ayr_${Date.now()}`,
            status: "success",
            platforms: postData.platforms.reduce((acc, platform) => {
              acc[platform] = {
                status: "success",
                postId: `${platform}_${Date.now()}`,
                url: `https://${platform}.com/posts/${Date.now()}`,
              };
              return acc;
            }, {} as Record<string, any>),
          };

          await storage.updatePost(post.id, {
            status: "published",
            publishedAt: new Date(),
            ayrsharePostId: ayrshareResponse.id,
            platformResults: ayrshareResponse.platforms,
          });

          // Create mock analytics data for the post
          for (const platform of postData.platforms) {
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
