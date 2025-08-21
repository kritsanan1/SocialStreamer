import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("user"), // admin, editor, user
  profileKey: text("profile_key"), // Ayrshare profile key
  avatar: text("avatar"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const socialAccounts = pgTable("social_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // facebook, instagram, twitter, linkedin, tiktok, youtube, etc.
  accountId: text("account_id").notNull(), // Platform-specific account ID
  accountName: text("account_name").notNull(),
  accountHandle: text("account_handle"),
  avatar: text("avatar"),
  accessToken: text("access_token"), // Encrypted token from Ayrshare
  status: text("status").notNull().default("pending"), // connected, pending, failed, disconnected
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const posts = pgTable("posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title"),
  content: text("content").notNull(),
  mediaUrls: json("media_urls").$type<string[]>().default([]),
  platforms: json("platforms").$type<string[]>().notNull(), // Array of platform names
  scheduledAt: timestamp("scheduled_at"),
  publishedAt: timestamp("published_at"),
  status: text("status").notNull().default("draft"), // draft, scheduled, published, failed
  ayrsharePostId: text("ayrshare_post_id"), // ID returned by Ayrshare
  platformResults: json("platform_results").$type<Record<string, any>>().default({}),
  analytics: json("analytics").$type<Record<string, any>>().default({}),
  templateName: text("template_name"),
  isTemplate: boolean("is_template").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const teamMembers = pgTable("team_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamId: varchar("team_id").notNull(),
  role: text("role").notNull().default("editor"), // admin, editor, viewer
  permissions: json("permissions").$type<string[]>().default([]),
  invitedBy: varchar("invited_by").references(() => users.id),
  joinedAt: timestamp("joined_at").notNull().default(sql`now()`),
});

export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  postId: varchar("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  impressions: integer("impressions").default(0),
  likes: integer("likes").default(0),
  shares: integer("shares").default(0),
  comments: integer("comments").default(0),
  clicks: integer("clicks").default(0),
  engagementRate: integer("engagement_rate").default(0), // Stored as percentage * 100
  rawData: json("raw_data").$type<Record<string, any>>().default({}),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
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

// Extended types for API responses
export type PostWithAnalytics = Post & {
  analytics: Analytics[];
  totalEngagement: number;
};

export type UserWithSocialAccounts = User & {
  socialAccounts: SocialAccount[];
};
