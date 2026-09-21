"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  ScrollText, 
  Settings, 
  LogOut,
  History,
  TreePine
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const menuItems = [
  { href: "/admin/dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/admin/people", label: "الأشخاص", icon: Users },
  { href: "/admin/logs", label: "سجل العمليات", icon: History },
  { href: "/admin/settings", label: "الإعدادات", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-dark-bg text-white flex flex-col h-screen sticky top-0 border-l border-gold-500/20">
      <div className="p-6 border-b border-gold-500/20">
        <Link href="/admin/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gold-500 flex items-center justify-center">
            <TreePine className="w-5 h-5 text-dark-bg" />
          </div>
          <div>
            <h1 className="text-lg font-heritage text-gold-500 font-bold">لوحة التحكم</h1>
            <p className="text-xs text-gray-400">شجرة النسب العائلية</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                isActive ? "bg-gold-500 text-dark-bg font-bold shadow-lg" : "text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gold-500/20 space-y-2">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 transition-colors"
        >
          <TreePine className="w-5 h-5 text-gold-500" />
          <span>عرض الموقع العام</span>
          <span className="mr-auto text-xs text-gold-500">↗</span>
        </Link>

        <Button 
          variant="ghost" 
          className="w-full justify-start text-white hover:bg-red-500/20 hover:text-red-300"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="w-5 h-5 ml-2" />
          تسجيل الخروج
        </Button>
      </div>
    </aside>
  );
}
