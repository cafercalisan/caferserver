"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Menu,
  X,
  Shield,
  ClipboardList,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/dashboard", icon: Map, label: "Harita" },
  { href: "/sites", icon: Castle, label: "Köyler" },
  { href: "/quests", icon: ClipboardList, label: "Görev Loncası" },
  { href: "/deployments", icon: Swords, label: "Seferler" },
  { href: "/terminal", icon: Terminal, label: "Terminal" },
  { href: "/logs", icon: ScrollText, label: "Kayıtlar" },
  { href: "/files", icon: FolderOpen, label: "Dosyalar" },
  { href: "/metrics", icon: BarChart3, label: "Metrikler" },
  { href: "/profile", icon: User, label: "Karakter" },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-castle-surface border border-castle-border flex items-center justify-center text-parchment-dim hover:text-gold transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 z-50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            {/* Drawer */}
            <motion.aside
              className="fixed left-0 top-0 bottom-0 w-72 bg-castle-surface border-r border-castle-border z-50 md:hidden flex flex-col"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-castle-border">
                <div className="flex items-center gap-3">
                  <Shield className="w-7 h-7 text-gold" />
                  <span
                    className="text-lg font-bold rpg-gradient-text"
                    style={{ fontFamily: "var(--font-medieval)" }}
                  >
                    CaferServer
                  </span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-parchment-dim hover:text-parchment"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-all",
                        isActive
                          ? "text-gold bg-gold/10 border border-gold/20"
                          : "text-parchment-dim hover:text-parchment hover:bg-castle-border/30"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="p-3 border-t border-castle-border">
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm text-parchment-dim hover:text-health-red hover:bg-health-red/10 transition-all w-full"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Kaleden Ayrıl</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
