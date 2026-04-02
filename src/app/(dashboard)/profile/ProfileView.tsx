"use client";

import { motion } from "framer-motion";
import { Shield, Swords, Trophy, Calendar } from "lucide-react";
import { XPBar } from "@/components/rpg/XPBar";
import { AchievementCard } from "@/components/rpg/AchievementCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils";
import type { Achievement } from "@/types";

interface ProfileViewProps {
  user: {
    id: string;
    username: string;
    level: number;
    xp: number;
    title: string;
    xpProgress: { current: number; needed: number; percentage: number };
    createdAt: string;
  };
  achievements: Achievement[];
  stats: { totalDeployments: number };
}

export function ProfileView({ user, achievements, stats }: ProfileViewProps) {
  const unlockedCount = achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold rpg-gradient-text"
          style={{ fontFamily: "var(--font-medieval)" }}
        >
          Karakter Sayfası
        </h1>
        <p className="text-sm text-parchment-dim mt-1">Senin RPG profilin</p>
      </div>

      {/* Character card */}
      <motion.div
        className="rpg-card-gold p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gold/15 border-2 border-gold/40 flex items-center justify-center rpg-glow-gold">
            <Shield className="w-8 h-8 text-gold" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-parchment">{user.username}</h2>
            <Badge variant="default" className="mt-1">
              Seviye {user.level} - {user.title}
            </Badge>
          </div>
        </div>

        <XPBar
          level={user.level}
          current={user.xpProgress.current}
          needed={user.xpProgress.needed}
          percentage={user.xpProgress.percentage}
          className="mb-4"
        />

        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-gold">{user.xp}</p>
            <p className="text-xs text-parchment-dim mt-1">Toplam XP</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-mana-blue">{stats.totalDeployments}</p>
            <p className="text-xs text-parchment-dim mt-1">Görevler</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-health-green">
              {unlockedCount}/{achievements.length}
            </p>
            <p className="text-xs text-parchment-dim mt-1">Başarımlar</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 text-xs text-parchment-dim">
          <Calendar className="w-3 h-3" />
          <span>Katılım: {formatDate(user.createdAt)}</span>
        </div>
      </motion.div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-gold" />
            Başarımlar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((achievement, i) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <AchievementCard achievement={achievement} />
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
