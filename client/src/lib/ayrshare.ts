// Ayrshare API integration utilities
const AYRSHARE_API_BASE = "https://app.ayrshare.com/api";

interface AyrshareConfig {
  apiKey: string;
  profileKey?: string;
}

interface PostData {
  post: string;
  platforms: string[];
  mediaUrls?: string[];
  scheduleDate?: string;
  shortenLinks?: boolean;
}

interface AyrshareResponse {
  status: "success" | "error";
  id?: string;
  errors?: any[];
  platforms?: Record<string, any>;
}

interface ProfileResponse {
  status: "success" | "error";
  profiles?: any[];
  error?: string;
}

interface SocialAccountData {
  platform: string;
  status: string;
  lastPosted?: string;
}

export class AyrshareAPI {
  private apiKey: string;
  private profileKey?: string;

  constructor(config: AyrshareConfig) {
    this.apiKey = config.apiKey;
    this.profileKey = config.profileKey;
  }

  private async makeRequest(endpoint: string, method: string = "GET", data?: any): Promise<any> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.apiKey}`,
    };

    if (this.profileKey) {
      headers["Profile-Key"] = this.profileKey;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data && method !== "GET") {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${AYRSHARE_API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`Ayrshare API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Create a new post
  async createPost(postData: PostData): Promise<AyrshareResponse> {
    return this.makeRequest("/post", "POST", postData);
  }

  // Get post analytics
  async getAnalytics(postId?: string, platforms?: string[]): Promise<any> {
    const params = new URLSearchParams();
    if (postId) params.append("id", postId);
    if (platforms) params.append("platforms", platforms.join(","));

    const endpoint = `/analytics${params.toString() ? `?${params.toString()}` : ""}`;
    return this.makeRequest(endpoint);
  }

  // Get connected social accounts
  async getSocialAccounts(): Promise<SocialAccountData[]> {
    const response = await this.makeRequest("/profiles");
    
    if (response.status === "success" && response.profiles) {
      return response.profiles.map((profile: any) => ({
        platform: profile.platform,
        status: profile.status || "connected",
        lastPosted: profile.lastPosted,
      }));
    }

    return [];
  }

  // Delete/disconnect a social account
  async deleteSocialAccount(platform: string): Promise<AyrshareResponse> {
    return this.makeRequest("/delete-social", "DELETE", { platform });
  }

  // Get post history
  async getPostHistory(limit?: number, offset?: number): Promise<any> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (offset) params.append("offset", offset.toString());

    const endpoint = `/history${params.toString() ? `?${params.toString()}` : ""}`;
    return this.makeRequest(endpoint);
  }

  // Update or reschedule a post
  async updatePost(postId: string, updates: Partial<PostData>): Promise<AyrshareResponse> {
    return this.makeRequest(`/post/${postId}`, "PUT", updates);
  }

  // Delete a scheduled post
  async deletePost(postId: string): Promise<AyrshareResponse> {
    return this.makeRequest(`/delete/${postId}`, "DELETE");
  }

  // Get user profile information
  async getProfile(): Promise<ProfileResponse> {
    return this.makeRequest("/user");
  }

  // Upload media files
  async uploadMedia(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    const headers: HeadersInit = {
      "Authorization": `Bearer ${this.apiKey}`,
    };

    if (this.profileKey) {
      headers["Profile-Key"] = this.profileKey;
    }

    const response = await fetch(`${AYRSHARE_API_BASE}/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload media: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    return { url: result.url };
  }

  // Generate hashtags using AI
  async generateHashtags(content: string): Promise<string[]> {
    const response = await this.makeRequest("/auto-hashtags", "POST", { post: content });
    return response.hashtags || [];
  }

  // Get optimal posting times
  async getOptimalTimes(platform?: string): Promise<any> {
    const params = platform ? `?platform=${platform}` : "";
    return this.makeRequest(`/analytics/best-times${params}`);
  }

  // Set profile key for multi-user management
  setProfileKey(profileKey: string) {
    this.profileKey = profileKey;
  }
}

// Create singleton instance
export const ayrshareAPI = new AyrshareAPI({
  apiKey: process.env.AYRSHARE_API_KEY || import.meta.env.VITE_AYRSHARE_API_KEY || "",
});

export default ayrshareAPI;
