import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import Navigation from "@/components/navigation";
import Sidebar from "@/components/sidebar";
import StatsOverview from "@/components/dashboard/stats-overview";
import RecentPosts from "@/components/dashboard/recent-posts";
import AISuggestions from "@/components/dashboard/ai-suggestions";
import TeamActivity from "@/components/dashboard/team-activity";
import AnalyticsChart from "@/components/dashboard/analytics-chart";
import UpcomingPosts from "@/components/dashboard/upcoming-posts";
import ComposeModal from "@/components/compose-modal";
import ConnectAccountsModal from "@/components/connect-accounts-modal";
import { useLanguage } from "@/hooks/use-language";
import { useState } from "react";
import { Redirect } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if not authenticated
  if (!loading && !user) {
    return <Redirect to="/login" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sage"></div>
      </div>
    );
  }

  return (
    <div className="bg-cream text-gray-900 font-sans min-h-screen">
      <Navigation 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onOpenCompose={() => setShowComposeModal(true)}
        onOpenConnect={() => setShowConnectModal(true)}
      />
      
      <div className="flex min-h-screen">
        <Sidebar 
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenCompose={() => setShowComposeModal(true)}
          onOpenConnect={() => setShowConnectModal(true)}
        />
        
        <main className="flex-1 lg:pl-0">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Dashboard Header */}
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {t("Social Media Dashboard", "แดชบอร์ดโซเชียลมีเดีย")}
                  </h1>
                  <p className="text-gray-600">
                    {t(
                      "Manage and analyze your social media presence across 13+ platforms",
                      "จัดการและวิเคราะห์การมีอยู่ของโซเชียลมีเดียข้ามแพลตฟอร์ม 13+ แห่ง"
                    )}
                  </p>
                </div>
                <div className="flex items-center space-x-3 mt-4 sm:mt-0">
                  <div className="text-sm text-gray-500">
                    <span>{t("Last updated:", "อัปเดตล่าสุด:")}</span> 2 mins ago
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>
              </div>
            </div>

            <StatsOverview />

            {/* Quick Actions & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <RecentPosts />
              
              <div className="space-y-6">
                <AISuggestions />
                <TeamActivity />
              </div>
            </div>

            <AnalyticsChart />
            <UpcomingPosts />
          </div>
        </main>
      </div>

      {/* Modals */}
      <ComposeModal 
        isOpen={showComposeModal}
        onClose={() => setShowComposeModal(false)}
      />
      
      <ConnectAccountsModal 
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />
    </div>
  );
}
