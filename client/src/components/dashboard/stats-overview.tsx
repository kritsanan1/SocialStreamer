import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";

export default function StatsOverview() {
  const { t } = useLanguage();

  const { data: overview } = useQuery({
    queryKey: ["/api/analytics/overview"],
  });

  const { data: scheduledPosts } = useQuery({
    queryKey: ["/api/posts/scheduled"],
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["/api/team"],
  });

  const stats = [
    {
      title: t("Total Posts", "โพสต์ทั้งหมด"),
      value: (overview as any)?.totalPosts || 247,
      change: t("+12% from last month", "+12% จากเดือนที่แล้ว"),
      changeType: "positive",
      icon: "fas fa-paper-plane",
      color: "bg-sage/10 text-sage",
    },
    {
      title: t("Scheduled", "กำหนดการ"),
      value: Array.isArray(scheduledPosts) ? scheduledPosts.length : 18,
      change: t("Next: Today 3:00 PM", "ถัดไป: วันนี้ 15:00 น."),
      changeType: "info",
      icon: "fas fa-clock",
      color: "bg-brand-turquoise/10 text-brand-turquoise",
    },
    {
      title: t("Engagement Rate", "อัตราการมีส่วนร่วม"),
      value: `${(overview as any)?.avgEngagementRate?.toFixed(1) || "4.2"}%`,
      change: t("+0.8% this week", "+0.8% สัปดาห์นี้"),
      changeType: "positive",
      icon: "fas fa-heart",
      color: "bg-brand-orange/10 text-brand-orange",
    },
    {
      title: t("Team Members", "สมาชิกทีม"),
      value: Array.isArray(teamMembers) ? teamMembers.length : 8,
      change: t("2 admins, 6 editors", "2 แอดมิน, 6 เอดิเตอร์"),
      changeType: "neutral",
      icon: "fas fa-users",
      color: "bg-dusty-purple/10 text-dusty-purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              <p className={`text-sm mt-2 ${
                stat.changeType === "positive" ? "text-green-600" :
                stat.changeType === "info" ? "text-blue-600" :
                "text-gray-500"
              }`}>
                {stat.changeType === "positive" && <i className="fas fa-arrow-up mr-1"></i>}
                {stat.changeType === "info" && <i className="fas fa-calendar mr-1"></i>}
                {stat.changeType === "neutral" && <i className="fas fa-user-plus mr-1"></i>}
                {stat.change}
              </p>
            </div>
            <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
              <i className={`${stat.icon} text-xl`}></i>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
