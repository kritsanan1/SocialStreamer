import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { formatDistanceToNow } from "date-fns";

interface TeamActivity {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  action: string;
  timestamp: Date;
  actionType: "post" | "template" | "account" | "schedule";
}

export default function TeamActivity() {
  const { t } = useLanguage();

  // Mock team activity data since we don't have a real team activity API yet
  const mockActivities: TeamActivity[] = [
    {
      id: "1",
      userId: "user1",
      userName: "Sarah",
      userAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=faces",
      action: t("scheduled 3 posts", "กำหนดเวลา 3 โพสต์"),
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      actionType: "schedule",
    },
    {
      id: "2", 
      userId: "user2",
      userName: "Mike",
      userAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=faces",
      action: t("created new template", "สร้างเทมเพลตใหม่"),
      timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      actionType: "template",
    },
    {
      id: "3",
      userId: "user3", 
      userName: "Lisa",
      userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=faces",
      action: t("added new social account", "เพิ่มบัญชีโซเชียลใหม่"),
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      actionType: "account",
    },
  ];

  const { data: teamMembers } = useQuery({
    queryKey: ["/api/team"],
  });

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t("Team Activity", "กิจกรรมทีม")}
      </h3>
      <div className="space-y-3">
        {mockActivities.map((activity) => (
          <div key={activity.id} className="flex items-center space-x-3">
            <img 
              src={activity.userAvatar}
              alt={`${activity.userName} avatar`}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.userName}</span>{" "}
                <span>{activity.action}</span>
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
              </p>
            </div>
          </div>
        ))}
        
        {(!mockActivities || mockActivities.length === 0) && (
          <div className="text-center py-4">
            <i className="fas fa-users text-2xl text-gray-300 mb-2"></i>
            <p className="text-sm text-gray-500">
              {t("No recent activity", "ไม่มีกิจกรรมล่าสุด")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
