"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDateTime } from "@/lib/utils";
import { QUEST_PRIORITIES, QUEST_STATUSES, QUEST_CATEGORIES } from "@/lib/constants";
import {
  ArrowLeft,
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
  MessageSquare,
  Send,
  Calendar,
  MapPin,
  Tag,
  User,
  Bot,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface QuestDetailData {
  id: string;
  title: string;
  description: string | null;
  questName: string;
  status: string;
  priority: string;
  category: string;
  labels: string[];
  dueDate: string | null;
  xpReward: number;
  xpAwarded: boolean;
  createdBy: string | null;
  assignee: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  site: { id: string; name: string; villageName: string; villageType: string; icon: string } | null;
  deployment: { id: string; status: string; questName: string; triggeredAt: string } | null;
  comments: { id: string; author: string; content: string; createdAt: string }[];
}

interface QuestDetailProps {
  quest: QuestDetailData;
}

const priorityIcons: Record<string, typeof Crown> = {
  legendary: Crown,
  epic: Flame,
  rare: Gem,
  normal: Sword,
  common: ShieldCheck,
};

const statusBadge: Record<string, "default" | "info" | "success" | "warning" | "danger"> = {
  open: "warning",
  in_progress: "info",
  completed: "success",
  failed: "danger",
  cancelled: "outline" as "success",
};

const authorIcons: Record<string, typeof User> = {
  user: User,
  system: Settings,
};

export function QuestDetail({ quest: initialQuest }: QuestDetailProps) {
  const router = useRouter();
  const [quest, setQuest] = useState(initialQuest);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);

  const priorityConfig = QUEST_PRIORITIES.find((p) => p.value === quest.priority);
  const statusConfig = QUEST_STATUSES.find((s) => s.value === quest.status);
  const categoryConfig = QUEST_CATEGORIES.find((c) => c.value === quest.category);
  const PriorityIcon = priorityIcons[quest.priority] ?? Sword;
  const isOverdue = quest.dueDate && !["completed", "cancelled"].includes(quest.status) && new Date(quest.dueDate) < new Date();
  const isActive = ["open", "in_progress"].includes(quest.status);

  async function updateStatus(newStatus: string) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/quests/${quest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        const updated = await res.json();
        setQuest(updated);
      }
    } finally {
      setUpdating(false);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/quests/${quest.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setQuest((q) => ({ ...q, comments: [...q.comments, newComment] }));
        setComment("");
      }
    } finally {
      setSending(false);
    }
  }

  async function deleteQuest() {
    if (!confirm("Bu görevi iptal etmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/quests/${quest.id}`, { method: "DELETE" });
    if (res.ok) router.push("/quests");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/quests">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm text-gold/80"
            style={{ fontFamily: "var(--font-medieval)" }}
          >
            {quest.questName}
          </p>
          <h1 className="text-xl font-bold text-parchment truncate">{quest.title}</h1>
        </div>
        {isActive && (
          <Button variant="destructive" size="sm" onClick={deleteQuest}>
            <Trash2 className="w-4 h-4" />
            <span className="hidden md:inline">İptal Et</span>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status Actions */}
          {isActive && (
            <div className="rpg-card p-4">
              <h3 className="text-sm font-bold text-parchment mb-3">Durum Değiştir</h3>
              <div className="flex flex-wrap gap-2">
                {quest.status === "open" && (
                  <Button size="sm" onClick={() => updateStatus("in_progress")} disabled={updating}>
                    <Swords className="w-4 h-4" />
                    Sefere Başla
                  </Button>
                )}
                {quest.status === "in_progress" && (
                  <>
                    <Button size="sm" variant="success" onClick={() => updateStatus("completed")} disabled={updating}>
                      <Trophy className="w-4 h-4" />
                      Fethet
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus("failed")} disabled={updating}>
                      <Skull className="w-4 h-4" />
                      Başarısız
                    </Button>
                  </>
                )}
                {quest.status === "open" && (
                  <Button size="sm" variant="success" onClick={() => updateStatus("completed")} disabled={updating}>
                    <Trophy className="w-4 h-4" />
                    Doğrudan Fethet
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {quest.description && (
            <div className="rpg-card p-4">
              <h3 className="text-sm font-bold text-parchment mb-2">Açıklama</h3>
              <p className="text-sm text-parchment-dim whitespace-pre-wrap">{quest.description}</p>
            </div>
          )}

          {/* Comments */}
          <div className="rpg-card p-4">
            <h3 className="text-sm font-bold text-parchment mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Görev Günlüğü ({quest.comments.length})
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
              {quest.comments.length === 0 && (
                <p className="text-xs text-parchment-dim text-center py-4">Henüz kayıt yok</p>
              )}
              {quest.comments.map((c, i) => {
                const AuthorIcon = authorIcons[c.author] ?? Bot;
                const isSystem = c.author === "system";
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={cn(
                      "flex gap-3 p-3 rounded-lg",
                      isSystem ? "bg-castle-border/20" : "bg-castle-surface"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      c.author === "user" ? "bg-gold/20" : isSystem ? "bg-mana-blue/20" : "bg-health-green/20"
                    )}>
                      <AuthorIcon className={cn(
                        "w-3.5 h-3.5",
                        c.author === "user" ? "text-gold" : isSystem ? "text-mana-blue" : "text-health-green"
                      )} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-parchment">
                          {c.author === "user" ? "Sen" : c.author === "system" ? "Sistem" : c.author}
                        </span>
                        <span className="text-xs text-parchment-dim">
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      <p className={cn("text-sm", isSystem ? "text-parchment-dim italic" : "text-parchment")}>
                        {c.content}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Add Comment */}
            <form onSubmit={addComment} className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Görev günlüğüne not ekle..."
                className="flex-1 h-9 rounded-lg border border-castle-border bg-castle-surface px-3 text-sm text-parchment placeholder:text-parchment-dim/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 transition-all"
              />
              <Button size="sm" type="submit" disabled={sending || !comment.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          <div className="rpg-card p-4 space-y-4">
            <div>
              <label className="text-xs text-parchment-dim">Durum</label>
              <div className="mt-1">
                <Badge variant={statusBadge[quest.status] ?? "outline"}>
                  {statusConfig?.label ?? quest.status}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-xs text-parchment-dim">Öncelik</label>
              <div className="flex items-center gap-2 mt-1">
                <PriorityIcon className="w-4 h-4" style={{ color: priorityConfig?.color }} />
                <span className="text-sm text-parchment">{priorityConfig?.label ?? quest.priority}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-parchment-dim">Kategori</label>
              <div className="flex items-center gap-2 mt-1">
                <Tag className="w-4 h-4 text-parchment-dim" />
                <span className="text-sm text-parchment">{categoryConfig?.label ?? quest.category}</span>
              </div>
            </div>

            {quest.site && (
              <div>
                <label className="text-xs text-parchment-dim">Köy</label>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="w-4 h-4 text-parchment-dim" />
                  <Link href={`/sites/${quest.site.id}`} className="text-sm text-gold hover:underline">
                    {quest.site.icon} {quest.site.villageName}
                  </Link>
                </div>
              </div>
            )}

            {quest.deployment && (
              <div>
                <label className="text-xs text-parchment-dim">Bağlı Sefer</label>
                <div className="flex items-center gap-2 mt-1">
                  <Swords className="w-4 h-4 text-parchment-dim" />
                  <span className="text-sm text-parchment">{quest.deployment.questName}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-parchment-dim">XP Ödülü</label>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-sm font-semibold text-gold">
                  +{quest.xpReward} XP {quest.xpAwarded && "(verildi)"}
                </span>
              </div>
            </div>

            {quest.dueDate && (
              <div>
                <label className="text-xs text-parchment-dim">Son Tarih</label>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className={cn("w-4 h-4", isOverdue ? "text-health-red" : "text-parchment-dim")} />
                  <span className={cn("text-sm", isOverdue ? "text-health-red font-medium" : "text-parchment")}>
                    {formatDateTime(quest.dueDate)}
                    {isOverdue && " (Gecikmiş!)"}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-parchment-dim">Oluşturan</label>
              <div className="mt-1">
                <span className="text-sm text-parchment">{quest.createdBy ?? "Bilinmiyor"}</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-parchment-dim">Tarih</label>
              <div className="text-xs text-parchment-dim mt-1 space-y-0.5">
                <div>Oluşturuldu: {formatDateTime(quest.createdAt)}</div>
                {quest.completedAt && <div>Tamamlandı: {formatDateTime(quest.completedAt)}</div>}
              </div>
            </div>

            {quest.labels.length > 0 && (
              <div>
                <label className="text-xs text-parchment-dim">Etiketler</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {quest.labels.map((label) => (
                    <Badge key={label} variant="outline">{label}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
