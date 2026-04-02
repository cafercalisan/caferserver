"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CreateQuestModal } from "@/components/quests/CreateQuestModal";
import { cn, formatDateTime } from "@/lib/utils";
import { QUEST_PRIORITIES, QUEST_STATUSES, QUEST_CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import type { QuestInfo, QuestStats } from "@/types";
import {
  Plus,
  Search,
  Crown,
  Flame,
  Gem,
  Sword,
  ShieldCheck,
  ScrollText,
  Swords,
  Trophy,
  Skull,
  Ban,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Site {
  id: string;
  name: string;
  villageName: string;
}

interface QuestsListProps {
  sites: Site[];
}

const statusIcons: Record<string, typeof ScrollText> = {
  open: ScrollText,
  in_progress: Swords,
  completed: Trophy,
  failed: Skull,
  cancelled: Ban,
};

const priorityIcons: Record<string, typeof Crown> = {
  legendary: Crown,
  epic: Flame,
  rare: Gem,
  normal: Sword,
  common: ShieldCheck,
};

const priorityBadge: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  legendary: "default",
  epic: "info",
  rare: "info",
  normal: "success",
  common: "outline" as "success",
};

const statusBadge: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  open: "warning",
  in_progress: "info",
  completed: "success",
  failed: "danger",
  cancelled: "outline" as "success",
};

export function QuestsList({ sites }: QuestsListProps) {
  const [quests, setQuests] = useState<QuestInfo[]>([]);
  const [stats, setStats] = useState<QuestStats | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const limit = 12;

  const fetchQuests = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter) params.set("priority", priorityFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (search) params.set("search", search);
    params.set("page", page.toString());
    params.set("limit", limit.toString());

    const res = await fetch(`/api/quests?${params}`);
    if (res.ok) {
      const data = await res.json();
      setQuests(data.quests);
      setTotal(data.total);
    }
  }, [statusFilter, priorityFilter, categoryFilter, search, page]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/quests/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Toplam", value: stats.total, icon: ScrollText, color: "text-parchment" },
            { label: "Açık", value: stats.byStatus.open + stats.byStatus.in_progress, icon: Swords, color: "text-mana-blue" },
            { label: "Tamamlanan", value: stats.byStatus.completed, icon: Trophy, color: "text-health-green" },
            { label: "Geciken", value: stats.overdue, icon: Skull, color: "text-health-red" },
            { label: "Kazanılan XP", value: stats.totalXpFromQuests, icon: Sparkles, color: "text-gold" },
          ].map((s) => (
            <div key={s.label} className="rpg-card p-3 text-center">
              <s.icon className={cn("w-5 h-5 mx-auto mb-1", s.color)} />
              <div className={cn("text-xl font-bold", s.color)}>{s.value}</div>
              <div className="text-xs text-parchment-dim">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {[{ value: "all", label: "Tümü" }, ...QUEST_STATUSES].map((s) => (
            <button
              key={s.value}
              onClick={() => { setStatusFilter(s.value); setPage(1); }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all",
                statusFilter === s.value
                  ? "bg-gold/20 text-gold border border-gold/30"
                  : "text-parchment-dim hover:text-parchment hover:bg-castle-border/30 border border-transparent"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 flex-1">
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="h-8 rounded-lg border border-castle-border bg-castle-surface px-2 text-xs text-parchment"
          >
            <option value="">Tüm Öncelikler</option>
            {QUEST_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="h-8 rounded-lg border border-castle-border bg-castle-surface px-2 text-xs text-parchment"
          >
            <option value="">Tüm Kategoriler</option>
            {QUEST_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-parchment-dim" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Görev ara..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Yeni Görev</span>
          </Button>
        </div>
      </div>

      {/* Quest Cards */}
      {quests.length === 0 ? (
        <div className="rpg-card p-12 text-center">
          <p className="text-4xl mb-3">📜</p>
          <p className="text-parchment-dim">Henüz görev bulunamadı</p>
          <p className="text-xs text-parchment-dim/60 mt-1">Yeni bir görev ilan ederek başla</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quests.map((quest, i) => {
            const StatusIcon = statusIcons[quest.status] ?? ScrollText;
            const PriorityIcon = priorityIcons[quest.priority] ?? Sword;
            const priorityConfig = QUEST_PRIORITIES.find((p) => p.value === quest.priority);
            const isOverdue = quest.dueDate && !["completed", "cancelled"].includes(quest.status) && new Date(quest.dueDate) < new Date();

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link href={`/quests/${quest.id}`}>
                  <div
                    className={cn(
                      "rpg-card p-4 hover:border-gold/30 transition-all cursor-pointer group",
                      quest.status === "completed" && "rpg-glow-green",
                      quest.status === "failed" && "rpg-glow-red",
                      isOverdue && "border-health-red/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <StatusIcon className={cn(
                          "w-4 h-4 shrink-0",
                          quest.status === "completed" && "text-health-green",
                          quest.status === "failed" && "text-health-red",
                          quest.status === "in_progress" && "text-mana-blue",
                          quest.status === "open" && "text-health-yellow",
                        )} />
                        <span
                          className="text-xs font-medium text-gold/80 truncate"
                          style={{ fontFamily: "var(--font-medieval)" }}
                        >
                          {quest.questName}
                        </span>
                      </div>
                      <PriorityIcon
                        className="w-4 h-4 shrink-0"
                        style={{ color: priorityConfig?.color }}
                      />
                    </div>

                    <h3 className="text-sm font-medium text-parchment group-hover:text-gold transition-colors line-clamp-2 mb-2">
                      {quest.title}
                    </h3>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <Badge variant={statusBadge[quest.status] ?? "outline"}>
                        {QUEST_STATUSES.find((s) => s.value === quest.status)?.label ?? quest.status}
                      </Badge>
                      <Badge variant={priorityBadge[quest.priority] ?? "outline"}>
                        {priorityConfig?.label ?? quest.priority}
                      </Badge>
                      {quest.siteName && (
                        <Badge variant="outline">{quest.siteName}</Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-parchment-dim">
                      <span>{formatDateTime(quest.createdAt)}</span>
                      <div className="flex items-center gap-2">
                        {quest.commentCount > 0 && (
                          <span>{quest.commentCount} yorum</span>
                        )}
                        {quest.xpReward > 0 && (
                          <span className="text-gold font-semibold">+{quest.xpReward} XP</span>
                        )}
                      </div>
                    </div>

                    {isOverdue && (
                      <div className="mt-2 text-xs text-health-red font-medium">
                        Gecikmiş!
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-parchment-dim">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      <CreateQuestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={fetchQuests}
        sites={sites}
      />
    </div>
  );
}
