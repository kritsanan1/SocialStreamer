import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { formatDistanceToNow, format } from "date-fns";

export default function UpcomingPosts() {
  const { t } = useLanguage();

  const { data: scheduledPosts, isLoading } = useQuery({
    queryKey: ["/api/posts/scheduled"],
  });

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

  const handleEdit = (postId: string) => {
    // TODO: Implement edit functionality
    console.log("Edit post:", postId);
  };

  const handleDelete = (postId: string) => {
    // TODO: Implement delete functionality  
    console.log("Delete post:", postId);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
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
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {t("Upcoming Posts", "โพสต์ที่กำลังมาถึง")}
        </h2>
        <div className="flex items-center space-x-3">
          <button className="text-sage hover:text-sage/80 text-sm font-medium">
            {t("View Calendar", "ดูปฏิทิน")}
          </button>
          <button className="bg-sage hover:bg-sage/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <i className="fas fa-plus mr-2"></i>
            {t("Add Post", "เพิ่มโพสต์")}
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">
                {t("Content", "เนื้อหา")}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">
                {t("Platforms", "แพลตฟอร์ม")}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">
                {t("Scheduled", "กำหนดการ")}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">
                {t("Status", "สถานะ")}
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-900 text-sm">
                {t("Actions", "การดำเนินการ")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Array.isArray(scheduledPosts) && scheduledPosts.length ? (
              scheduledPosts.map((post: any) => (
                <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop" 
                        alt="Post thumbnail" 
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                          {post.title || post.content.substring(0, 40) + "..."}
                        </p>
                        <p className="text-xs text-gray-500">
                          {post.templateName || t("Marketing Campaign", "แคมเปญการตลาด")}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-1">
                      {post.platforms?.map((platform: string) => {
                        const { icon, color } = getPlatformIcon(platform);
                        return <i key={platform} className={`${icon} ${color}`}></i>;
                      })}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-sm text-gray-900">
                      {format(new Date(post.scheduledAt), "MMM d, h:mm a")}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(post.scheduledAt), { addSuffix: true })}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="status-scheduled px-3 py-1 rounded-full text-xs font-medium">
                      {post.status === "scheduled" ? t("Scheduled", "กำหนดเวลาแล้ว") : post.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleEdit(post.id)}
                        className="text-gray-400 hover:text-sage transition-colors"
                        title={t("Edit post", "แก้ไขโพสต์")}
                      >
                        <i className="fas fa-edit text-sm"></i>
                      </button>
                      <button 
                        onClick={() => handleDelete(post.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title={t("Delete post", "ลบโพสต์")}
                      >
                        <i className="fas fa-trash text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center">
                  <i className="fas fa-calendar-alt text-4xl text-gray-300 mb-4"></i>
                  <p className="text-gray-500 mb-2">
                    {t("No scheduled posts", "ไม่มีโพสต์ที่กำหนดเวลาไว้")}
                  </p>
                  <p className="text-sm text-gray-400">
                    {t("Schedule posts to see them here", "กำหนดเวลาโพสต์เพื่อดูในที่นี่")}
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
