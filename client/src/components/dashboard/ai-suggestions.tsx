import { useLanguage } from "@/hooks/use-language";

export default function AISuggestions() {
  const { t } = useLanguage();

  const suggestions = [
    {
      type: "timing",
      icon: "fas fa-lightbulb",
      title: t("Optimal Posting Time", "เวลาโพสต์ที่เหมาะสม"),
      description: t("Tuesday 2-4 PM for highest engagement", "วันอังคาร 14:00-16:00 น. เพื่อการมีส่วนร่วมสูงสุด"),
      color: "bg-sage/5 border-sage/20",
      iconBg: "bg-sage/20 text-sage",
    },
    {
      type: "hashtags",
      icon: "fas fa-hashtag",
      title: t("Trending Hashtags", "แฮชแท็กที่กำลังมาแรง"),
      description: "#TechTrends #Innovation #Growth",
      color: "bg-brand-turquoise/5 border-brand-turquoise/20",
      iconBg: "bg-brand-turquoise/20 text-brand-turquoise",
    },
    {
      type: "audience",
      icon: "fas fa-users",
      title: t("Audience Insight", "ข้อมูลเชิงลึกผู้ชม"),
      description: t("Your audience is most active on weekdays", "ผู้ชมของคุณใช้งานเข้มข้นในวันทำงาน"),
      color: "bg-brand-orange/5 border-brand-orange/20",
      iconBg: "bg-brand-orange/20 text-brand-orange",
    },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {t("AI Suggestions", "คำแนะนำ AI")}
      </h3>
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className={`p-4 rounded-xl border ${suggestion.color}`}>
            <div className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${suggestion.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                <i className={`${suggestion.icon} text-sm`}></i>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 mb-1">{suggestion.title}</p>
                <p className="text-xs text-gray-600">{suggestion.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
