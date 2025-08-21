import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, integer, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // admin, editor, user
  // Ayrshare Business Plan integration
  ayrshareProfileKey: text("ayrshare_profile_key").unique(), // Business Plan profile key
  ayrshareUserId: text("ayrshare_user_id").unique(), // Ayrshare internal user ID
  ayrshareRefId: text("ayrshare_ref_id").unique(), // Reference ID for support and tracking
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  // Two-factor authentication
  twoFactorEnabled: boolean("two_factor_enabled").notNull().default(false),
  twoFactorSecret: text("two_factor_secret"), // TOTP secret
  twoFactorBackupCodes: json("two_factor_backup_codes").$type<string[]>(),
  // Row-level security and permissions
  teamId: uuid("team_id"), // For team-based row-level security
  permissions: json("permissions").$type<string[]>().default([]),
  // Audit and security
  lastLoginAt: timestamp("last_login_at"),
  lastLoginIp: text("last_login_ip"),
  emailVerifiedAt: timestamp("email_verified_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const socialAccounts = pgTable("social_accounts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // facebook, instagram, twitter, linkedin, tiktok, youtube, bluesky, threads, etc.
  accountId: text("account_id").notNull(), // Platform-specific account ID
  accountName: text("account_name").notNull(),
  accountHandle: text("account_handle"),
  avatar: text("avatar"),
  // Ayrshare OAuth integration
  ayrshareAccountId: text("ayrshare_account_id"), // Ayrshare's internal account ID
  accessToken: text("access_token"), // Encrypted OAuth token
  refreshToken: text("refresh_token"), // OAuth refresh token
  tokenExpiresAt: timestamp("token_expires_at"),
  status: text("status").notNull().default("pending"), // connected, pending, failed, disconnected, suspended
  connectionType: text("connection_type").default("oauth"), // oauth, api_key, manual
  // Analytics and metadata
  followerCount: integer("follower_count").default(0),
  verifiedAccount: boolean("verified_account").default(false),
  accountMetadata: json("account_metadata").$type<Record<string, any>>().default({}),
  lastSyncAt: timestamp("last_sync_at"),
  lastPostAt: timestamp("last_post_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  mediaUrls: json("media_urls").$type<string[]>(),
  platforms: json("platforms").$type<string[]>().notNull(), // Array of platform names
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, published, failed, cancelled
  // Ayrshare integration
  ayrsharePostId: text("ayrshare_post_id"), // ID returned by Ayrshare API
  ayrshareJobId: text("ayrshare_job_id"), // For scheduled posts tracking
  platformResults: json("platform_results").$type<Record<string, any>>(),
  // Content optimization and AI
  aiSuggestions: json("ai_suggestions").$type<Record<string, any>>(),
  hashtagSuggestions: json("hashtag_suggestions").$type<string[]>(),
  optimalPostTime: timestamp("optimal_post_time"),
  // Templates and reusability
  templateName: text("template_name"),
  templateCategory: text("template_category"),
  isTemplate: boolean("is_template").notNull().default(false),
  // Team collaboration
  createdBy: uuid("created_by").references(() => users.id),
  lastEditedBy: uuid("last_edited_by").references(() => users.id),
  approvalStatus: text("approval_status").default("approved"), // pending, approved, rejected
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  // Content validation
  contentWarnings: json("content_warnings").$type<string[]>(),
  platformCompliance: json("platform_compliance").$type<Record<string, boolean>>(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Teams table for organization and row-level security
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  // Ayrshare Business Plan settings
  ayrshareBusinessId: text("ayrshare_business_id").unique(),
  billingPlan: text("billing_plan").default("business"), // business, enterprise
  maxUsers: integer("max_users").default(50),
  maxProfiles: integer("max_profiles").default(100),
  // Team settings
  settings: json("settings").$type<Record<string, any>>().default({}),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("editor"), // owner, admin, editor, viewer
  permissions: json("permissions").$type<string[]>().default([]),
  // Access control for row-level security
  accessibleProfiles: json("accessible_profiles").$type<string[]>(), // Profile IDs user can access
  restrictedPlatforms: json("restricted_platforms").$type<string[]>(), // Platforms user cannot post to
  // Invitation and status
  status: text("status").default("active"), // active, pending, suspended, left
  invitedBy: uuid("invited_by").references(() => users.id),
  invitedAt: timestamp("invited_at"),
  joinedAt: timestamp("joined_at").notNull().default(sql`now()`),
  lastActiveAt: timestamp("last_active_at"),
});

export const analytics = pgTable("analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: uuid("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  // Core engagement metrics
  impressions: integer("impressions"),
  reach: integer("reach"),
  likes: integer("likes"),
  shares: integer("shares"),
  comments: integer("comments"),
  clicks: integer("clicks"),
  saves: integer("saves"),
  // Video-specific metrics
  videoViews: integer("video_views"),
  videoCompletes: integer("video_completes"),
  averageWatchTime: integer("average_watch_time"), // in seconds
  // Advanced analytics
  engagementRate: integer("engagement_rate"), // Stored as percentage * 100
  clickThroughRate: integer("click_through_rate"), // CTR as percentage * 100
  // Audience demographics (from Ayrshare analytics)
  audienceDemographics: json("audience_demographics").$type<Record<string, any>>(),
  topCountries: json("top_countries").$type<string[]>(),
  ageGroups: json("age_groups").$type<Record<string, number>>(),
  genderBreakdown: json("gender_breakdown").$type<Record<string, number>>(),
  // Ayrshare raw data
  ayrshareAnalyticsId: text("ayrshare_analytics_id"),
  rawData: json("raw_data").$type<Record<string, any>>(),
  collectedAt: timestamp("collected_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// OAuth sessions for Ayrshare integration
export const oauthSessions = pgTable("oauth_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  state: text("state").notNull().unique(), // OAuth state parameter
  codeVerifier: text("code_verifier"), // PKCE code verifier
  redirectUri: text("redirect_uri").notNull(),
  scope: text("scope"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Activity logs for audit trail and team collaboration
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id),
  teamId: uuid("team_id").references(() => teams.id),
  action: text("action").notNull(), // created_post, scheduled_post, connected_account, etc.
  resourceType: text("resource_type").notNull(), // post, social_account, team_member, etc.
  resourceId: text("resource_id"),
  details: json("details").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Notification preferences and delivery
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // post_published, analytics_report, team_invite, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: json("data").$type<Record<string, any>>(),
  isRead: boolean("is_read").notNull().default(false),
  priority: text("priority").default("normal"), // low, normal, high, urgent
  deliveryMethod: text("delivery_method").default("in_app"), // in_app, email, sms, webhook
  scheduledFor: timestamp("scheduled_for"),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSocialAccountSchema = createInsertSchema(socialAccounts).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  ayrsharePostId: true,
  platformResults: true,
  analytics: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertAnalyticsSchema = createInsertSchema(analytics).omit({
  id: true,
  updatedAt: true,
  collectedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOAuthSessionSchema = createInsertSchema(oauthSessions).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = z.infer<typeof insertSocialAccountSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type OAuthSession = typeof oauthSessions.$inferSelect;
export type InsertOAuthSession = z.infer<typeof insertOAuthSessionSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Extended types for API responses
export type PostWithAnalytics = Post & {
  analytics: Analytics[];
  totalEngagement: number;
};

export type UserWithSocialAccounts = User & {
  socialAccounts: SocialAccount[];
  team?: Team;
  teamMember?: TeamMember;
};

export type TeamWithMembers = Team & {
  members: (TeamMember & { user: User })[];
  owner: User;
};

export type PostWithDetails = Post & {
  analytics: Analytics[];
  totalEngagement: number;
  createdByUser?: User;
  lastEditedByUser?: User;
  approvedByUser?: User;
};
