import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");

      // حماية صفحات الأدمن
      if (isOnAdmin) {
        if (isLoggedIn) return true;
        return false;
      }

      // منع المسجلين من دخول صفحة تسجيل الدخول
      if (isLoggedIn && nextUrl.pathname.startsWith("/login")) {
        return Response.redirect(new URL("/admin/dashboard", nextUrl));
      }

      return true;
    },
  },
  providers: [], // سيتم إضافتها في lib/auth.ts
} satisfies NextAuthConfig;