import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLanguage } from "@/hooks/use-language";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const registerSchema = loginSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Login() {
  const [isRegister, setIsRegister] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      username: "",
      firstName: "",
      lastName: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: t("Welcome back!", "ยินดีต้อนรับกลับ!"),
        description: t("Successfully logged in", "เข้าสู่ระบบสำเร็จ"),
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: t("Login failed", "เข้าสู่ระบบไม่สำเร็จ"),
        description: error.message || t("Invalid credentials", "ข้อมูลประจำตัวไม่ถูกต้อง"),
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      toast({
        title: t("Account created!", "สร้างบัญชีสำเร็จ!"),
        description: t("Welcome to Social Media Scheduler Pro", "ยินดีต้อนรับสู่ Social Media Scheduler Pro"),
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: t("Registration failed", "การลงทะเบียนไม่สำเร็จ"),
        description: error.message || t("Failed to create account", "ไม่สามารถสร้างบัญชีได้"),
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage/5 via-white to-warm-blue/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-sage rounded-xl flex items-center justify-center shadow-soft">
              <i className="fas fa-calendar-alt text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Social Media Scheduler Pro</h1>
              <p className="text-sm text-gray-500">Powered by Ayrshare API</p>
            </div>
          </div>
        </div>

        <Card className="shadow-medium">
          <CardHeader>
            <CardTitle>
              {isRegister ? t("Create Account", "สร้างบัญชี") : t("Sign In", "เข้าสู่ระบบ")}
            </CardTitle>
            <CardDescription>
              {isRegister 
                ? t("Get started with your social media management", "เริ่มต้นจัดการโซเชียลมีเดียของคุณ")
                : t("Sign in to your account to continue", "เข้าสู่ระบบบัญชีของคุณเพื่อดำเนินการต่อ")
              }
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isRegister ? (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("First Name", "ชื่อ")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("Last Name", "นามสกุล")}</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Username", "ชื่อผู้ใช้")}</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Email", "อีเมล")}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Password", "รหัสผ่าน")}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-sage hover:bg-sage/90"
                    disabled={registerMutation.isPending}
                  >
                    {registerMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {t("Creating Account...", "กำลังสร้างบัญชี...")}
                      </>
                    ) : (
                      t("Create Account", "สร้างบัญชี")
                    )}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Email", "อีเมล")}</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("Password", "รหัสผ่าน")}</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full bg-sage hover:bg-sage/90"
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {t("Signing In...", "กำลังเข้าสู่ระบบ...")}
                      </>
                    ) : (
                      t("Sign In", "เข้าสู่ระบบ")
                    )}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {isRegister ? t("Already have an account?", "มีบัญชีอยู่แล้ว?") : t("Don't have an account?", "ยังไม่มีบัญชี?")}
                <button
                  onClick={() => setIsRegister(!isRegister)}
                  className="ml-1 text-sage hover:text-sage/80 font-medium"
                >
                  {isRegister ? t("Sign In", "เข้าสู่ระบบ") : t("Create Account", "สร้างบัญชี")}
                </button>
              </p>
            </div>

            {/* Demo Account Info */}
            <div className="mt-6 p-4 bg-sage/10 rounded-xl border border-sage/20">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-sage/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-info text-sage text-sm"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 mb-1">
                    {t("Demo Account", "บัญชีทดลอง")}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: admin@example.com<br />
                    Password: password
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
