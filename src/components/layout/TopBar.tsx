"use client";

import { useSession } from "next-auth/react";
import { Bell, Crown } from "lucide-react";
import { XPBar } from "@/components/rpg/XPBar";
import { Badge } from "@/components/ui/Badge";

interface TopBarProps {
  user?: {
    level: number;
    xp: number;
    title: string;
    xpProgress: { current: number; needed: number; percentage: number };
  };
}

export function TopBar({ user }: TopBarProps) {
  const { data: session } = useSession();

  return (
    <header className="h-16 bg-castle-surface border-b border-castle-border flex items-center justify-between px-4 md:px-6 shrink-0">
      {/* Left: spacer for mobile hamburger */}
      <div className="w-10 md:w-0" />

      {/* Center: XP Bar (desktop only) */}
      <div className="hidden md:flex flex-1 max-w-md mx-4">
        {user && (
          <XPBar
            level={user.level}
            current={user.xpProgress.current}
            needed={user.xpProgress.needed}
            percentage={user.xpProgress.percentage}
            className="w-full"
          />
        )}
      </div>

      {/* Right: user info + notifications */}
      <div className="flex items-center gap-3">
        {user && (
          <Badge variant="default" className="hidden sm:flex items-center gap-1">
            <Crown className="w-3 h-3" />
            {user.title}
          </Badge>
        )}

        <button className="relative w-9 h-9 rounded-lg bg-castle-border/30 flex items-center justify-center text-parchment-dim hover:text-gold transition-colors">
          <Bell className="w-4 h-4" />
        </button>

        <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-gold text-xs font-bold">
          {session?.user?.name?.[0]?.toUpperCase() || "?"}
        </div>
      </div>
    </header>
  );
}
