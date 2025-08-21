import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { formatDistanceToNow } from "date-fns";

export default function RecentPosts() {
  const { t } = useLanguage();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["/api/posts", { withAnalytics: "true", limit: 5 }],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "status-published";
      case "scheduled": return "status-scheduled";
      case "failed": return "status-failed";
      default: return "status-pending";
    }
  };

  const getPlatformIcon = (platform: string) => {
    const icons: Record<string, { icon: string; color: string }> = {
      facebook: { icon: "fab fa-facebook", color: "text-blue-600" },
      instagram: { icon: "fab fa-instagram", color: "text-pink-600" },
      twitter: { icon: "fab fa-twitter", color: "text-blue-400" },
      linkedin: { icon: "fab fa-linkedin", color: "text-blue-700" },
      tiktok: { icon: "fab fa-tiktok", color: "text-black" },
      youtube: { icon: "fab fa-youtube", color: "text-red-600" },
    };
    return icons[platform] || { icon: "fas fa-globe", color: "text-gray-400" };
  };

  if (isLoading) {
    return (
      <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-2 bg-white rounded-2xl shadow-soft border border-gray-100">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("Recent Posts", "โพสต์ล่าสุด")}
          </h2>
          <div className="flex items-center space-x-2">
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-sage/20">
              <option>{t("All platforms", "แพลตฟอร์มทั้งหมด")}</option>
              <option>Facebook</option>
              <option>Instagram</option>
              <option>Twitter/X</option>
              <option>LinkedIn</option>
            </select>
            <button className="text-sage hover:text-sage/80 text-sm font-medium">
              {t("View all", "ดูทั้งหมด")}
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {posts?.length ? (
            posts.map((post: any) => (
              <div key={post.id} className="flex items-start space-x-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=100&h=100&fit=crop" 
                  alt="Post thumbnail" 
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {post.title || post.content.substring(0, 50) + "..."}
                    </span>
                    <span className={`${getStatusColor(post.status)} px-2 py-1 rounded-full text-xs font-medium capitalize`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      {post.platforms?.map((platform: string) => {
                        const { icon, color } = getPlatformIcon(platform);
                        return <i key={platform} className={`${icon} ${color}`}></i>;
                      })}
                    </div>
                    <span>
                      {post.publishedAt 
                        ? formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })
                        : post.scheduledAt 
                          ? t("Scheduled for", "กำหนดเวลาสำหรับ") + " " + new Date(post.scheduledAt).toLocaleDateString()
                          : formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                      }
                    </span>
                    {post.totalEngagement > 0 && (
                      <div className="flex items-center space-x-3">
                        <span><i className="fas fa-heart text-red-500 mr-1"></i>{post.totalEngagement}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">
                {t("No posts yet", "ยังไม่มีโพสต์")}
              </p>
              <p className="text-sm text-gray-400">
                {t("Create your first post to get started", "สร้างโพสต์แรกของคุณเพื่อเริ่มต้น")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
