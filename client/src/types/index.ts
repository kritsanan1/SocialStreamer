// Re-export shared types for easier imports
export type {
  User,
  InsertUser,
  SocialAccount,
  InsertSocialAccount,
  Post,
  InsertPost,
  TeamMember,
  InsertTeamMember,
  Analytics,
  InsertAnalytics,
  PostWithAnalytics,
  UserWithSocialAccounts,
} from "@shared/schema";

// Frontend-specific types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FormErrors {
  [key: string]: string | string[] | undefined;
}

export interface ToastNotification {
  id: string;
  title: string;
  description?: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: "image" | "video" | "document";
  size: number;
  uploading?: boolean;
  error?: string;
}

export interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  color: string;
  maxLength?: number;
  supportsMedia?: boolean;
  mediaTypes?: string[];
}

export interface PostTemplate {
  id: string;
  name: string;
  content: string;
  platforms: string[];
  mediaUrls?: string[];
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsData {
  platform: string;
  date: string;
  impressions: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  engagementRate: number;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  status: "pending" | "accepted" | "declined";
  invitedBy: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  postPublished: boolean;
  postFailed: boolean;
  teamActivity: boolean;
  weeklyReport: boolean;
}

export interface UserPreferences {
  language: "en" | "th";
  timezone: string;
  dateFormat: string;
  notifications: NotificationPreferences;
}

export interface AyrshareCredentials {
  apiKey: string;
  profileKey?: string;
  businessPlan: boolean;
  accountLimits: {
    posts: number;
    accounts: number;
    users: number;
  };
}

// Social media platform types
export type SocialPlatform = 
  | "facebook" 
  | "instagram" 
  | "twitter" 
  | "linkedin" 
  | "tiktok" 
  | "youtube" 
  | "pinterest" 
  | "reddit" 
  | "telegram" 
  | "snapchat" 
  | "threads" 
  | "bluesky"
  | "google-business";

export type PostStatus = "draft" | "scheduled" | "published" | "failed";

export type AccountStatus = "connected" | "pending" | "failed" | "disconnected";

export type UserRole = "admin" | "editor" | "user";

export type AnalyticsTimeRange = "7d" | "30d" | "90d" | "1y";

// Component prop types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface FormProps<T = any> {
  onSubmit: (data: T) => void;
  loading?: boolean;
  error?: string;
  initialData?: Partial<T>;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

// API hook types
export interface UseQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchInterval?: number;
}

export interface UseMutationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}
