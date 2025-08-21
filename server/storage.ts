import { type User, type InsertUser, type SocialAccount, type InsertSocialAccount, type Post, type InsertPost, type TeamMember, type InsertTeamMember, type Analytics, type InsertAnalytics, type PostWithAnalytics, type UserWithSocialAccounts } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getUserWithSocialAccounts(id: string): Promise<UserWithSocialAccounts | undefined>;

  // Social Accounts
  getSocialAccount(id: string): Promise<SocialAccount | undefined>;
  getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]>;
  createSocialAccount(account: InsertSocialAccount): Promise<SocialAccount>;
  updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount>;
  deleteSocialAccount(id: string): Promise<void>;

  // Posts
  getPost(id: string): Promise<Post | undefined>;
  getPostsByUserId(userId: string, limit?: number, offset?: number): Promise<Post[]>;
  getScheduledPosts(userId: string): Promise<Post[]>;
  getPostsWithAnalytics(userId: string, limit?: number): Promise<PostWithAnalytics[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: string, updates: Partial<Post>): Promise<Post>;
  deletePost(id: string): Promise<void>;
  getTemplates(userId: string): Promise<Post[]>;

  // Team Members
  getTeamMember(id: string): Promise<TeamMember | undefined>;
  getTeamMembersByUserId(userId: string): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember>;
  deleteTeamMember(id: string): Promise<void>;

  // Analytics
  getAnalytics(id: string): Promise<Analytics | undefined>;
  getAnalyticsByPostId(postId: string): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;
  updateAnalytics(id: string, updates: Partial<Analytics>): Promise<Analytics>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private socialAccounts: Map<string, SocialAccount> = new Map();
  private posts: Map<string, Post> = new Map();
  private teamMembers: Map<string, TeamMember> = new Map();
  private analytics: Map<string, Analytics> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create a demo admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin",
      email: "admin@example.com",
      password: "$2a$10$hash", // In real app, this would be properly hashed
      firstName: "John",
      lastName: "Smith",
      role: "admin",
      profileKey: "demo-profile-key",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create demo social accounts
    const fbAccount: SocialAccount = {
      id: randomUUID(),
      userId: adminUser.id,
      platform: "facebook",
      accountId: "fb-123456",
      accountName: "Demo Business Page",
      accountHandle: "@demobusiness",
      avatar: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop",
      status: "connected",
      accessToken: "encrypted_token_facebook",
      lastSyncAt: new Date(),
      createdAt: new Date(),
    };

    const igAccount: SocialAccount = {
      id: randomUUID(),
      userId: adminUser.id,
      platform: "instagram",
      accountId: "ig-789012",
      accountName: "demobusiness",
      accountHandle: "@demobusiness",
      avatar: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop",
      status: "connected",
      accessToken: "encrypted_token_instagram",
      lastSyncAt: new Date(),
      createdAt: new Date(),
    };

    const twitterAccount: SocialAccount = {
      id: randomUUID(),
      userId: adminUser.id,
      platform: "twitter",
      accountId: "tw-345678",
      accountName: "Demo Business",
      accountHandle: "@demobusiness",
      avatar: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop",
      status: "connected",
      accessToken: "encrypted_token_twitter",
      lastSyncAt: new Date(),
      createdAt: new Date(),
    };

    this.socialAccounts.set(fbAccount.id, fbAccount);
    this.socialAccounts.set(igAccount.id, igAccount);
    this.socialAccounts.set(twitterAccount.id, twitterAccount);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "user",
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileKey: insertUser.profileKey || null,
      avatar: insertUser.avatar || null,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error("User not found");
    
    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUserWithSocialAccounts(id: string): Promise<UserWithSocialAccounts | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const socialAccounts = Array.from(this.socialAccounts.values()).filter(
      account => account.userId === id
    );

    return { ...user, socialAccounts };
  }

  // Social Accounts
  async getSocialAccount(id: string): Promise<SocialAccount | undefined> {
    return this.socialAccounts.get(id);
  }

  async getSocialAccountsByUserId(userId: string): Promise<SocialAccount[]> {
    return Array.from(this.socialAccounts.values()).filter(
      account => account.userId === userId
    );
  }

  async createSocialAccount(insertAccount: InsertSocialAccount): Promise<SocialAccount> {
    const id = randomUUID();
    const account: SocialAccount = {
      ...insertAccount,
      id,
      status: insertAccount.status || "pending",
      avatar: insertAccount.avatar || null,
      accountHandle: insertAccount.accountHandle || null,
      accessToken: insertAccount.accessToken || null,
      lastSyncAt: insertAccount.lastSyncAt || null,
      createdAt: new Date(),
    };
    this.socialAccounts.set(id, account);
    return account;
  }

  async updateSocialAccount(id: string, updates: Partial<SocialAccount>): Promise<SocialAccount> {
    const account = this.socialAccounts.get(id);
    if (!account) throw new Error("Social account not found");
    
    const updatedAccount: SocialAccount = { ...account, ...updates };
    this.socialAccounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteSocialAccount(id: string): Promise<void> {
    this.socialAccounts.delete(id);
  }

  // Posts
  async getPost(id: string): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async getPostsByUserId(userId: string, limit = 50, offset = 0): Promise<Post[]> {
    const userPosts = Array.from(this.posts.values())
      .filter(post => post.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
    return userPosts;
  }

  async getScheduledPosts(userId: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId && post.status === "scheduled")
      .sort((a, b) => {
        if (!a.scheduledAt || !b.scheduledAt) return 0;
        return a.scheduledAt.getTime() - b.scheduledAt.getTime();
      });
  }

  async getPostsWithAnalytics(userId: string, limit = 10): Promise<PostWithAnalytics[]> {
    const posts = await this.getPostsByUserId(userId, limit);
    return posts.map(post => {
      const postAnalytics = Array.from(this.analytics.values()).filter(
        a => a.postId === post.id
      );
      const totalEngagement = postAnalytics.reduce(
        (sum, a) => sum + (a.likes || 0) + (a.shares || 0) + (a.comments || 0),
        0
      );
      return { ...post, analytics: postAnalytics, totalEngagement };
    });
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = randomUUID();
    const post: Post = {
      ...insertPost,
      id,
      title: insertPost.title || null,
      status: insertPost.status || "draft",
      mediaUrls: insertPost.mediaUrls || null,
      platforms: Array.isArray(insertPost.platforms) ? insertPost.platforms : [],
      scheduledAt: insertPost.scheduledAt || null,
      publishedAt: insertPost.publishedAt || null,
      ayrsharePostId: insertPost.ayrsharePostId || null,
      platformResults: insertPost.platformResults || null,
      isTemplate: insertPost.isTemplate || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: string, updates: Partial<Post>): Promise<Post> {
    const post = this.posts.get(id);
    if (!post) throw new Error("Post not found");
    
    const updatedPost: Post = {
      ...post,
      ...updates,
      updatedAt: new Date(),
    };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: string): Promise<void> {
    this.posts.delete(id);
  }

  async getTemplates(userId: string): Promise<Post[]> {
    return Array.from(this.posts.values())
      .filter(post => post.userId === userId && post.isTemplate);
  }

  // Team Members
  async getTeamMember(id: string): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }

  async getTeamMembersByUserId(userId: string): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(
      member => member.userId === userId
    );
  }

  async createTeamMember(insertMember: InsertTeamMember): Promise<TeamMember> {
    const id = randomUUID();
    const member: TeamMember = {
      ...insertMember,
      id,
      role: insertMember.role || "editor",
      permissions: insertMember.permissions || null,
      invitedBy: insertMember.invitedBy || null,
      joinedAt: new Date(),
    };
    this.teamMembers.set(id, member);
    return member;
  }

  async updateTeamMember(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    const member = this.teamMembers.get(id);
    if (!member) throw new Error("Team member not found");
    
    const updatedMember: TeamMember = { ...member, ...updates };
    this.teamMembers.set(id, updatedMember);
    return updatedMember;
  }

  async deleteTeamMember(id: string): Promise<void> {
    this.teamMembers.delete(id);
  }

  // Analytics
  async getAnalytics(id: string): Promise<Analytics | undefined> {
    return this.analytics.get(id);
  }

  async getAnalyticsByPostId(postId: string): Promise<Analytics[]> {
    return Array.from(this.analytics.values()).filter(
      analytics => analytics.postId === postId
    );
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = randomUUID();
    const analytics: Analytics = {
      ...insertAnalytics,
      id,
      impressions: insertAnalytics.impressions || null,
      likes: insertAnalytics.likes || null,
      shares: insertAnalytics.shares || null,
      comments: insertAnalytics.comments || null,
      clicks: insertAnalytics.clicks || null,
      engagementRate: insertAnalytics.engagementRate || null,
      rawData: insertAnalytics.rawData || null,
      updatedAt: new Date(),
    };
    this.analytics.set(id, analytics);
    return analytics;
  }

  async updateAnalytics(id: string, updates: Partial<Analytics>): Promise<Analytics> {
    const analytics = this.analytics.get(id);
    if (!analytics) throw new Error("Analytics not found");
    
    const updatedAnalytics: Analytics = {
      ...analytics,
      ...updates,
      updatedAt: new Date(),
    };
    this.analytics.set(id, updatedAnalytics);
    return updatedAnalytics;
  }
}

export const storage = new MemStorage();
