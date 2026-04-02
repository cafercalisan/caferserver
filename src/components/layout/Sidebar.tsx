"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Map,
  Castle,
  Terminal,
  ScrollText,
  Swords,
  FolderOpen,
  BarChart3,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", icon: Map, label: "Harita" },
  { href: "/sites", icon: Castle, label: "Köyler" },
  { href: "/deployments", icon: Swords, label: "Görevler" },
  { href: "/terminal", icon: Terminal, label: "Terminal" },
  { href: "/logs", icon: ScrollText, label: "Kayıtlar" },
  { href: "/files", icon: FolderOpen, label: "Dosyalar" },
  { href: "/metrics", icon: BarChart3, label: "Metrikler" },
  { href: "/profile", icon: User, label: "Karakter" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-castle-surface border-r border-castle-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-castle-border">
        <Shield className="w-8 h-8 text-gold" />
        <div>
          <h2
            className="text-lg font-bold rpg-gradient-text"
            style={{ fontFamily: "var(--font-medieval)" }}
          >
            CaferServer
          </h2>
          <p className="text-xs text-parchment-dim">Sunucu Krallığı</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative",
                isActive
                  ? "text-gold bg-gold/10 border border-gold/20"
                  : "text-parchment-dim hover:text-parchment hover:bg-castle-border/30"
              )}
            >
              {isActive && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-gold/5"
                  layoutId="sidebar-active"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <item.icon className="w-5 h-5 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-castle-border">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-parchment-dim hover:text-health-red hover:bg-health-red/10 transition-all w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Kaleden Ayrıl</span>
        </button>
      </div>
    </aside>
  );
}
