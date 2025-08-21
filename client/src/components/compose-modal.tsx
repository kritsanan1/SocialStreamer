import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { apiRequest } from "@/lib/queryClient";

const postSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  platforms: z.array(z.string()).min(1, "Select at least one platform"),
  scheduledAt: z.string().optional(),
  templateName: z.string().optional(),
  isTemplate: z.boolean().default(false),
});

type PostForm = z.infer<typeof postSchema>;

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PLATFORMS = [
  { id: "facebook", name: "Facebook", icon: "fab fa-facebook", color: "text-blue-600" },
  { id: "instagram", name: "Instagram", icon: "fab fa-instagram", color: "text-pink-600" },
  { id: "twitter", name: "X/Twitter", icon: "fab fa-twitter", color: "text-blue-400" },
  { id: "linkedin", name: "LinkedIn", icon: "fab fa-linkedin", color: "text-blue-700" },
  { id: "tiktok", name: "TikTok", icon: "fab fa-tiktok", color: "text-black" },
  { id: "youtube", name: "YouTube", icon: "fab fa-youtube", color: "text-red-600" },
];

export default function ComposeModal({ isOpen, onClose }: ComposeModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [scheduleType, setScheduleType] = useState<"now" | "later">("now");

  const { data: socialAccounts } = useQuery({
    queryKey: ["/api/social-accounts"],
    enabled: isOpen,
  });

  const form = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
      platforms: ["facebook", "instagram"],
      isTemplate: false,
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: PostForm) => {
      const postData = {
        ...data,
        scheduledAt: scheduleType === "later" && data.scheduledAt 
          ? new Date(data.scheduledAt).toISOString()
          : undefined,
      };
      const response = await apiRequest("POST", "/api/posts", postData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("Post created!", "สร้างโพสต์สำเร็จ!"),
        description: scheduleType === "now" 
          ? t("Your post has been published", "โพสต์ของคุณได้รับการเผยแพร่แล้ว")
          : t("Your post has been scheduled", "โพสต์ของคุณได้รับการกำหนดเวลาแล้ว"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("Failed to create post", "ไม่สามารถสร้างโพสต์ได้"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PostForm) => {
    createPostMutation.mutate(data);
  };

  const connectedPlatforms = Array.isArray(socialAccounts) 
    ? socialAccounts.filter((account: any) => account.status === "connected")
        .map((account: any) => account.platform) 
    : [];

  const availablePlatforms = PLATFORMS.filter(platform => 
    connectedPlatforms.includes(platform.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {t("Compose New Post", "เขียนโพสต์ใหม่")}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Platform Selection */}
              <FormField
                control={form.control}
                name="platforms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 mb-3">
                      {t("Select Platforms", "เลือกแพลตฟอร์ม")}
                    </FormLabel>
                    <div className="grid grid-cols-3 gap-3">
                      {availablePlatforms.map((platform) => (
                        <FormControl key={platform.id}>
                          <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-colors ${
                            field.value.includes(platform.id)
                              ? "border-sage bg-sage/5"
                              : "border-gray-200 hover:border-sage/50"
                          }`}>
                            <Checkbox
                              checked={field.value.includes(platform.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([...field.value, platform.id]);
                                } else {
                                  field.onChange(field.value.filter((p: string) => p !== platform.id));
                                }
                              }}
                              className="sr-only"
                            />
                            <div className="w-full flex items-center justify-center space-x-2">
                              <i className={`${platform.icon} ${platform.color}`}></i>
                              <span className="text-sm font-medium">{platform.name}</span>
                            </div>
                          </label>
                        </FormControl>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Content Editor */}
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 mb-3">
                      {t("Post Content", "เนื้อหาโพสต์")}
                    </FormLabel>
                    <div className="border-2 border-gray-200 rounded-xl focus-within:border-sage transition-colors">
                      <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center space-x-4">
                          <button type="button" className="text-gray-500 hover:text-gray-700 transition-colors">
                            <i className="fas fa-bold"></i>
                          </button>
                          <button type="button" className="text-gray-500 hover:text-gray-700 transition-colors">
                            <i className="fas fa-italic"></i>
                          </button>
                          <button type="button" className="text-gray-500 hover:text-gray-700 transition-colors">
                            <i className="fas fa-link"></i>
                          </button>
                          <button type="button" className="text-gray-500 hover:text-gray-700 transition-colors">
                            <i className="fas fa-hashtag"></i>
                          </button>
                          <div className="flex-1"></div>
                          <button type="button" className="text-sage hover:text-sage/80 text-sm font-medium">
                            <i className="fas fa-magic mr-1"></i>
                            {t("AI Suggest", "แนะนำ AI")}
                          </button>
                        </div>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="min-h-[120px] border-0 focus:outline-none resize-none"
                          placeholder={t("What's happening? Share your thoughts...", "เกิดอะไรขึ้น? แบ่งปันความคิดของคุณ...")}
                        />
                      </FormControl>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                      <span>{t("Character count:", "จำนวนตัวอักษร:")} {field.value.length}/280</span>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Scheduling Options */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">
                  {t("Scheduling", "กำหนดเวลา")}
                </label>
                <RadioGroup value={scheduleType} onValueChange={(value) => setScheduleType(value as "now" | "later")}>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="now" id="now" />
                      <label htmlFor="now" className="text-sm text-gray-900">
                        {t("Post now", "โพสต์ตอนนี้")}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="later" id="later" />
                      <label htmlFor="later" className="text-sm text-gray-900">
                        {t("Schedule for later", "กำหนดเวลาโพสต์ทีหลัง")}
                      </label>
                    </div>
                  </div>
                </RadioGroup>

                {scheduleType === "later" && (
                  <FormField
                    control={form.control}
                    name="scheduledAt"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <FormLabel className="text-xs font-medium text-gray-700 mb-1">
                              {t("Date & Time", "วันที่และเวลา")}
                            </FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                          </div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Template Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="isTemplate"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-medium text-gray-900">
                          {t("Save as Template", "บันทึกเป็นเทมเพลต")}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                
                {form.watch("isTemplate") && (
                  <FormField
                    control={form.control}
                    name="templateName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={t("Template name (optional)", "ชื่อเทมเพลต (ไม่บังคับ)")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <button type="button" className="flex items-center space-x-1 hover:text-gray-700">
                    <i className="fas fa-eye"></i>
                    <span>{t("Preview", "ตัวอย่าง")}</span>
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <Button type="button" variant="outline" onClick={onClose}>
                    {t("Cancel", "ยกเลิก")}
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-sage hover:bg-sage/90"
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {scheduleType === "now" ? t("Publishing...", "กำลังเผยแพร่...") : t("Scheduling...", "กำลังกำหนดเวลา...")}
                      </>
                    ) : (
                      scheduleType === "now" ? t("Publish Post", "เผยแพร่โพสต์") : t("Schedule Post", "กำหนดเวลาโพสต์")
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
