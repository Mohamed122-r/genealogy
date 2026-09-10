"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, GitBranch, ScrollText, Settings, LogOut, TreePine, History } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/admin/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/people", label: "الأشخاص", icon: Users },
  { href: "/admin/branches", label: "الفروع", icon: GitBranch },
  { href: "/admin/logs", label: "سجل العمليات", icon: History },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
  { href: "/tree", label: "عرض الشجرة", icon: TreePine },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-deep-green text-white flex flex-col h-screen sticky top-0">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-2xl font-heritage text-gold-500 text-center">لوحة التحكم</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 px-4 py-3 rounded-lg transition-colors hover:bg-white/10", isActive && "bg-gold-500 text-deep-green font-bold")}>
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <Button variant="ghost" className="w-full justify-start text-white hover:bg-white/10" onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="w-5 h-5 ml-2" /> تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}