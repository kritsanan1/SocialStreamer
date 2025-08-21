import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCompose: () => void;
  onOpenConnect: () => void;
}

export default function Sidebar({ isOpen, onClose, onOpenCompose, onOpenConnect }: SidebarProps) {
  const { t } = useLanguage();

  const { data: socialAccounts } = useQuery({
    queryKey: ["/api/social-accounts"],
  });

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 bottom-0 z-50 w-72 bg-white border-r border-gray-200 shadow-strong transition-transform duration-300 lg:static lg:top-0 lg:shadow-soft",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex-1 px-6 py-8">
            {/* Quick Actions */}
            <div className="mb-8">
              <button 
                onClick={onOpenCompose}
                className="w-full bg-sage hover:bg-sage/90 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all transform hover:scale-[1.02] shadow-soft mb-4"
              >
                <i className="fas fa-plus mr-2"></i>
                {t("Compose Post", "สร้างโพสต์")}
              </button>
              <button 
                onClick={onOpenConnect}
                className="w-full border-2 border-brand-turquoise text-brand-turquoise hover:bg-brand-turquoise hover:text-white px-6 py-3 rounded-xl font-semibold text-sm transition-all"
              >
                <i className="fas fa-link mr-2"></i>
                {t("Connect Accounts", "เชื่อมต่อบัญชี")}
              </button>
            </div>
            
            {/* Navigation Menu */}
            <nav className="space-y-2">
              <a href="#dashboard" className="flex items-center px-4 py-3 text-gray-700 bg-sage/10 rounded-xl font-medium transition-colors">
                <i className="fas fa-home w-5 text-sage mr-3"></i>
                {t("Dashboard", "แดชบอร์ด")}
              </a>
              <button onClick={onOpenCompose} className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors w-full text-left">
                <i className="fas fa-edit w-5 mr-3"></i>
                {t("Compose", "เขียนโพสต์")}
              </button>
              <a href="#schedule" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <i className="fas fa-calendar w-5 mr-3"></i>
                {t("Schedule", "กำหนดการ")}
              </a>
              <a href="#analytics" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <i className="fas fa-chart-line w-5 mr-3"></i>
                {t("Analytics", "วิเคราะห์")}
              </a>
              <a href="#history" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <i className="fas fa-history w-5 mr-3"></i>
                {t("Post History", "ประวัติโพสต์")}
              </a>
              <a href="#templates" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <i className="fas fa-layer-group w-5 mr-3"></i>
                {t("Templates", "เทมเพลต")}
              </a>
              <a href="#team" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl transition-colors">
                <i className="fas fa-users w-5 mr-3"></i>
                {t("Team", "ทีม")}
              </a>
            </nav>
            
            {/* Connected Accounts */}
            <div className="mt-8 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-4 text-sm">
                {t("Connected Accounts", "บัญชีที่เชื่อมต่อ")}
              </h3>
              <div className="space-y-3">
                {socialAccounts?.length ? (
                  socialAccounts.map((account: any) => (
                    <div key={account.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <i className={`fab fa-${account.platform} ${getPlatformColor(account.platform)}`}></i>
                        <span className="text-sm text-gray-700 capitalize">{account.platform}</span>
                      </div>
                      <span className={`status-${account.status} px-2 py-1 rounded-full text-xs font-medium`}>
                        {getStatusText(account.status)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    {t("No accounts connected", "ไม่มีบัญชีที่เชื่อมต่อ")}
                  </div>
                )}
              </div>
              <button 
                onClick={onOpenConnect}
                className="w-full mt-4 text-sage hover:text-sage/80 text-sm font-medium transition-colors"
              >
                <i className="fas fa-plus mr-1"></i>
                {t("Add More", "เพิ่มเติม")}
              </button>
            </div>
          </div>
          
          {/* Ayrshare Branding */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-2">
                {t("Powered by", "ขับเคลื่อนโดย")}
              </div>
              <div className="font-bold text-sage">Ayrshare API</div>
              <div className="text-xs text-gray-400">Business Plan - $499/month</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

function getPlatformColor(platform: string) {
  const colors: Record<string, string> = {
    facebook: "text-blue-600",
    instagram: "text-pink-600", 
    twitter: "text-blue-400",
    linkedin: "text-blue-700",
    tiktok: "text-black",
    youtube: "text-red-600",
  };
  return colors[platform] || "text-gray-600";
}

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    connected: "Online",
    pending: "Pending",
    failed: "Failed",
    disconnected: "Offline",
  };
  return statusMap[status] || status;
}
