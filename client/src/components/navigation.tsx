import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

interface NavigationProps {
  onToggleSidebar: () => void;
  onOpenCompose: () => void;
  onOpenConnect: () => void;
}

export default function Navigation({ onToggleSidebar, onOpenCompose, onOpenConnect }: NavigationProps) {
  const { language, setLanguage, t } = useLanguage();
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sage rounded-xl flex items-center justify-center shadow-soft">
              <i className="fas fa-calendar-alt text-white text-lg"></i>
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Social Media Scheduler Pro</span>
              <div className="text-xs text-gray-500">Powered by Ayrshare API</div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex items-center space-x-6">
              <a href="#dashboard" className="text-gray-600 hover:text-sage transition-colors font-medium">
                {t("Dashboard", "แดชบอร์ด")}
              </a>
              <button onClick={onOpenCompose} className="text-gray-600 hover:text-sage transition-colors font-medium">
                {t("Compose", "เขียนโพสต์")}
              </button>
              <a href="#analytics" className="text-gray-600 hover:text-sage transition-colors font-medium">
                {t("Analytics", "วิเคราะห์")}
              </a>
              <a href="#team" className="text-gray-600 hover:text-sage transition-colors font-medium">
                {t("Team", "ทีม")}
              </a>
            </div>
            
            {/* Language Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  language === "en"
                    ? "bg-white text-gray-700 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage("th")}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  language === "th"
                    ? "bg-white text-gray-700 shadow-sm"
                    : "text-gray-500"
                }`}
              >
                TH
              </button>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-2 text-gray-600 hover:text-sage transition-colors relative">
                  <i className="fas fa-bell text-lg"></i>
                  <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">3</span>
                </button>
              </div>
              <div className="flex items-center space-x-3">
                <img 
                  src={user?.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces"} 
                  alt="User Avatar" 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</div>
                  <div className="text-gray-500 text-xs capitalize">{user?.role}</div>
                </div>
                <button 
                  onClick={logout}
                  className="text-gray-400 hover:text-gray-600"
                  title={t("Logout", "ออกจากระบบ")}
                >
                  <i className="fas fa-sign-out-alt text-sm"></i>
                </button>
              </div>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </nav>
  );
}
