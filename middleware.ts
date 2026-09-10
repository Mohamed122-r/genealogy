import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  // تشغيل الميدل وير على جميع المسارات باستثناء الملفات الثابتة والصور
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|fonts|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ttf|woff|woff2)$).*)",
  ],
};