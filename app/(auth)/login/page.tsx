"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Shield } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("أدخل بريداً إلكترونياً صحيحاً"),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: LoginForm) {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "خطأ",
          description: "بيانات الدخول غير صحيحة",
          variant: "destructive",
        });
      } else {
        toast({ title: "نجاح", description: "تم تسجيل الدخول بنجاح" });
        router.push("/admin/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "خطأ غير متوقع",
        description: "حدث خطأ في النظام",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-dark-bg to-deep-green p-4">
      <Card className="w-full max-w-md border-gold-500/50 shadow-2xl bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-dark-bg flex items-center justify-center text-gold-500 text-4xl font-bold shadow-lg">
            <Shield className="w-10 h-10" />
          </div>
          <CardTitle className="text-3xl font-heritage text-dark-bg">
            شجرة النسب العائلية
          </CardTitle>
          <CardDescription className="text-base">
            تسجيل الدخول إلى لوحة التحكم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-dark-bg font-bold">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                {...form.register("email")}
                className="border-gold-500/30 focus:border-gold-500"
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-dark-bg font-bold">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
                className="border-gold-500/30 focus:border-gold-500"
              />
              {form.formState.errors.password && (
                <p className="text-sm text-red-500">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-gold-500 hover:bg-gold-600 text-dark-bg font-bold py-6 text-lg"
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "دخول"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-500 hover:text-gold-500 transition-colors">
              ← العودة إلى الموقع الرئيسي
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}