import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";

interface ConnectAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "fab fa-facebook", color: "bg-blue-600", description: "Pages & Groups" },
  { id: "instagram", name: "Instagram", icon: "fab fa-instagram", color: "bg-gradient-to-br from-purple-600 to-pink-600", description: "Business Profile" },
  { id: "twitter", name: "X (Twitter)", icon: "fab fa-twitter", color: "bg-blue-400", description: "Personal & Business" },
  { id: "linkedin", name: "LinkedIn", icon: "fab fa-linkedin", color: "bg-blue-700", description: "Company Pages" },
  { id: "tiktok", name: "TikTok", icon: "fab fa-tiktok", color: "bg-black", description: "Business Account" },
  { id: "youtube", name: "YouTube", icon: "fab fa-youtube", color: "bg-red-600", description: "Channel Management" },
];

export default function ConnectAccountsModal({ isOpen, onClose }: ConnectAccountsModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: socialAccounts, isLoading } = useQuery({
    queryKey: ["/api/social-accounts"],
    enabled: isOpen,
  });

  const connectMutation = useMutation({
    mutationFn: async (platform: string) => {
      const response = await apiRequest("POST", "/api/social-accounts/connect", { platform });
      return response.json();
    },
    onSuccess: (_, platform) => {
      toast({
        title: t("Connection initiated", "เริ่มการเชื่อมต่อ"),
        description: t(`Connecting to ${platform}...`, `กำลังเชื่อมต่อกับ ${platform}...`),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
      
      // Simulate connection process
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
        toast({
          title: t("Connected successfully!", "เชื่อมต่อสำเร็จ!"),
          description: t(`${platform} account has been connected`, `บัญชี ${platform} ได้รับการเชื่อมต่อแล้ว`),
        });
      }, 3000);
    },
    onError: (error: any) => {
      toast({
        title: t("Connection failed", "การเชื่อมต่อล้มเหลว"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const response = await apiRequest("DELETE", `/api/social-accounts/${accountId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("Account disconnected", "ตัดการเชื่อมต่อบัญชี"),
        description: t("Social account has been disconnected", "บัญชีโซเชียลได้รับการตัดการเชื่อมต่อแล้ว"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/social-accounts"] });
    },
    onError: (error: any) => {
      toast({
        title: t("Failed to disconnect", "ไม่สามารถตัดการเชื่อมต่อได้"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getAccountStatus = (platformId: string) => {
    if (!socialAccounts) return null;
    return socialAccounts.find((account: any) => account.platform === platformId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "status-online";
      case "pending": return "status-pending";
      case "failed": return "status-failed";
      default: return "status-offline";
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      connected: "Connected",
      pending: "Pending",
      failed: "Failed",
      disconnected: "Offline",
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sage"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const connectedCount = socialAccounts?.filter((account: any) => account.status === "connected").length || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("Connect Social Media Accounts", "เชื่อมต่อบัญชีโซเชียลมีเดีย")}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          {/* Info Banner */}
          <div className="mb-6">
            <div className="bg-sage/10 border border-sage/20 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-sage/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-info text-sage text-sm"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {t("Ayrshare API Integration", "การรวม Ayrshare API")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t(
                      "Secure authentication via JWT tokens. Your social media credentials are never stored on our servers.",
                      "การพิสูจน์ตัวตนที่ปลอดภัยผ่าน JWT tokens ข้อมูลประจำตัวโซเชียลมีเดียของคุณไม่เคยถูกเก็บไว้บนเซิร์ฟเวอร์ของเรา"
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {PLATFORMS.map((platform) => {
              const account = getAccountStatus(platform.id);
              const isConnected = account?.status === "connected";
              const isPending = account?.status === "pending";
              const isConnecting = connectMutation.isPending && connectMutation.variables === platform.id;

              return (
                <div key={platform.id} className="border border-gray-200 rounded-xl p-4 hover:border-sage/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${platform.color} rounded-xl flex items-center justify-center`}>
                        <i className={`${platform.icon} text-white text-xl`}></i>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{platform.name}</h3>
                        <p className="text-sm text-gray-500">
                          {t(platform.description, platform.description)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isConnected ? (
                        <>
                          <span className={`${getStatusColor("connected")} px-3 py-1 rounded-full text-xs font-medium`}>
                            {getStatusText("connected")}
                          </span>
                          <button
                            onClick={() => disconnectMutation.mutate(account.id)}
                            disabled={disconnectMutation.isPending}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <i className="fas fa-unlink text-sm"></i>
                          </button>
                        </>
                      ) : isPending ? (
                        <span className={`${getStatusColor("pending")} px-3 py-1 rounded-full text-xs font-medium`}>
                          {getStatusText("pending")}
                        </span>
                      ) : (
                        <Button
                          onClick={() => connectMutation.mutate(platform.id)}
                          disabled={isConnecting}
                          className="bg-sage hover:bg-sage/90 text-white px-4 py-2 rounded-lg text-sm font-medium"
                        >
                          {isConnecting ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2"></i>
                              {t("Connecting...", "กำลังเชื่อมต่อ...")}
                            </>
                          ) : (
                            t("Connect", "เชื่อมต่อ")
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* More Platforms */}
            <div className="md:col-span-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
              <i className="fas fa-plus-circle text-3xl text-gray-300 mb-3"></i>
              <p className="text-gray-600 mb-2">
                {t("13+ Platforms Supported", "รองรับแพลตฟอร์ม 13+ แห่ง")}
              </p>
              <p className="text-sm text-gray-400">
                {t(
                  "Pinterest, Reddit, Telegram, Snapchat, Threads, Bluesky & more",
                  "Pinterest, Reddit, Telegram, Snapchat, Threads, Bluesky และอื่นๆ"
                )}
              </p>
            </div>
          </div>

          {/* Business Plan Info */}
          <div className="mb-6 p-4 bg-gradient-to-r from-sage/10 to-brand-turquoise/10 rounded-xl border border-sage/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-sage/20 rounded-xl flex items-center justify-center">
                <i className="fas fa-crown text-sage"></i>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {t("Ayrshare Business Plan Active", "แผนธุรกิจ Ayrshare ใช้งานอยู่")}
                </p>
                <p className="text-sm text-gray-600">
                  {t(
                    "$499/month - Manage social accounts for unlimited users and clients",
                    "$499/เดือน - จัดการบัญชีโซเชียลสำหรับผู้ใช้และลูกค้าไม่จำกัด"
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {t("Connected:", "เชื่อมต่อแล้ว:")} {connectedCount} {t("platforms", "แพลตฟอร์ม")}
            </p>
            <Button onClick={onClose} className="bg-sage hover:bg-sage/90">
              {t("Done", "เสร็จสิ้น")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
