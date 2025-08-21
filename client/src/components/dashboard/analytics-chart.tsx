import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useState } from "react";

export default function AnalyticsChart() {
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState("7d");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/overview", timeRange],
  });

  const chartData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: t("Likes", "ถูกใจ"),
        data: [120, 190, 300, 500, 200, 300, 450],
        color: "var(--sage)",
      },
      {
        label: t("Shares", "แชร์"), 
        data: [80, 120, 180, 280, 150, 200, 300],
        color: "var(--brand-turquoise)",
      },
      {
        label: t("Comments", "ความคิดเห็น"),
        data: [40, 60, 90, 140, 75, 100, 150],
        color: "var(--brand-orange)",
      },
      {
        label: t("Impressions", "การแสดงผล"),
        data: [800, 1200, 1800, 2800, 1500, 2000, 3000],
        color: "var(--dusty-purple)",
      },
    ],
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {t("Engagement Overview", "ภาพรวมการมีส่วนร่วม")}
          </h2>
          <p className="text-gray-600 text-sm">
            {t("Track your social media performance across platforms", "ติดตามประสิทธิภาพโซเชียลมีเดียข้ามแพลตฟอร์ม")}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-sage/20"
          >
            <option value="7d">{t("Last 7 days", "7 วันที่แล้ว")}</option>
            <option value="30d">{t("Last 30 days", "30 วันที่แล้ว")}</option>
            <option value="90d">{t("Last 3 months", "3 เดือนที่แล้ว")}</option>
          </select>
        </div>
      </div>
      
      {/* Mock Chart Area - In a real app, you'd use a charting library like Chart.js or Recharts */}
      {isLoading ? (
        <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
        </div>
      ) : (
        <div className="h-64 bg-gradient-to-br from-sage/5 via-transparent to-brand-turquoise/5 rounded-xl flex items-center justify-center border border-gray-100 relative overflow-hidden">
          {/* Mock chart visualization */}
          <div className="absolute inset-4 flex items-end justify-between space-x-2">
            {chartData.labels.map((label, index) => (
              <div key={label} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center space-y-1 mb-2">
                  {chartData.datasets.map((dataset, datasetIndex) => (
                    <div
                      key={datasetIndex}
                      className="w-3 rounded-t"
                      style={{
                        height: `${(dataset.data[index] / Math.max(...dataset.data)) * 160}px`,
                        backgroundColor: dataset.color === "var(--sage)" ? "#497552" :
                          dataset.color === "var(--brand-turquoise)" ? "#17a2b8" :
                          dataset.color === "var(--brand-orange)" ? "#fd7e14" : "#8B7BA8",
                        opacity: 0.8,
                      }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80 backdrop-blur-sm">
            <div className="text-center">
              <i className="fas fa-chart-line text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 mb-2">
                {t("Interactive Analytics Chart", "แผนภูมิการวิเคราะห์แบบโต้ตอบ")}
              </p>
              <p className="text-sm text-gray-400">
                {t("Real-time data visualization powered by Ayrshare API", "การแสดงข้อมูลแบบเรียลไทม์ขับเคลื่อนโดย Ayrshare API")}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Chart Legend */}
      <div className="flex items-center justify-center space-x-6 mt-6">
        {chartData.datasets.map((dataset, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: dataset.color === "var(--sage)" ? "#497552" :
                  dataset.color === "var(--brand-turquoise)" ? "#17a2b8" :
                  dataset.color === "var(--brand-orange)" ? "#fd7e14" : "#8B7BA8",
              }}
            />
            <span className="text-sm text-gray-600">{dataset.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
