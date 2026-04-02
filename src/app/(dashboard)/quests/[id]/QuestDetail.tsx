"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn, formatDateTime, formatTime } from "@/lib/utils";
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
  RefreshCw,
  CheckCircle2,
  Circle,
  Clock,
  Zap,
  Activity,
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

// Surecin adimlari
const LIFECYCLE_STEPS = [
  { key: "created", label: "Oluşturuldu", icon: ScrollText, description: "Görev ilan edildi" },
  { key: "open", label: "İlan Edildi", icon: Clock, description: "Görev kabul bekliyor" },
  { key: "in_progress", label: "Sefer Başladı", icon: Swords, description: "Görev üzerinde çalışılıyor" },
  { key: "completed", label: "Fethedildi", icon: Trophy, description: "Görev başarıyla tamamlandı" },
];

const FAILED_STEP = { key: "failed", label: "Düşmüş", icon: Skull, description: "Görev başarısız oldu" };
const CANCELLED_STEP = { key: "cancelled", label: "Geri Çekildi", icon: Ban, description: "Görev iptal edildi" };

function getStepIndex(status: string): number {
  switch (status) {
    case "open": return 1;
    case "in_progress": return 2;
    case "completed": return 3;
    case "failed": return 3;
    case "cancelled": return 3;
    default: return 0;
  }
}

export function QuestDetail({ quest: initialQuest }: QuestDetailProps) {
  const router = useRouter();
  const [quest, setQuest] = useState(initialQuest);
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(["open", "in_progress"].includes(initialQuest.status));
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [statusJustChanged, setStatusJustChanged] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");
  const [agentWorking, setAgentWorking] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const prevCommentCount = useRef(initialQuest.comments.length);

  const priorityConfig = QUEST_PRIORITIES.find((p) => p.value === quest.priority);
  const statusConfig = QUEST_STATUSES.find((s) => s.value === quest.status);
  const categoryConfig = QUEST_CATEGORIES.find((c) => c.value === quest.category);
  const PriorityIcon = priorityIcons[quest.priority] ?? Sword;
  const isOverdue = quest.dueDate && !["completed", "cancelled"].includes(quest.status) && new Date(quest.dueDate) < new Date();
  const isActive = ["open", "in_progress"].includes(quest.status);

  // Auto-refresh: aktif gorevlerde 5sn'de bir guncelle
  const refreshQuest = useCallback(async () => {
    try {
      const res = await fetch(`/api/quests/${quest.id}`);
      if (res.ok) {
        const updated = await res.json();
        // Status degisikligi tespit et
        if (updated.status !== quest.status) {
          setStatusJustChanged(true);
          setTimeout(() => setStatusJustChanged(false), 3000);
        }
        setQuest(updated);
        setLastRefresh(new Date());

        // Yeni yorum geldiyse scroll et
        if (updated.comments.length > prevCommentCount.current) {
          prevCommentCount.current = updated.comments.length;
          setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }

        // Tamamlanmis gorevde auto-refresh kapat
        if (!["open", "in_progress"].includes(updated.status)) {
          setAutoRefresh(false);
        }
      }
    } catch { /* silent fail */ }
  }, [quest.id, quest.status]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(refreshQuest, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshQuest]);

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
        setStatusJustChanged(true);
        setTimeout(() => setStatusJustChanged(false), 3000);
        prevCommentCount.current = updated.comments.length;

        if (!["open", "in_progress"].includes(newStatus)) {
          setAutoRefresh(false);
        } else {
          setAutoRefresh(true);
        }
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
        prevCommentCount.current += 1;
        setTimeout(() => commentsEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } finally {
      setSending(false);
    }
  }

  async function sendToAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!agentMessage.trim() || agentWorking) return;
    const msg = agentMessage.trim();
    setAgentMessage("");
    setAgentWorking(true);
    setAutoRefresh(true); // Agent calisirken canli takip ac

    try {
      const res = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, questId: quest.id }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Agent hatasi" }));
        setQuest((q) => ({
          ...q,
          comments: [...q.comments, {
            id: `err-${Date.now()}`,
            author: "system",
            content: `Agent hatası: ${err.error}`,
            createdAt: new Date().toISOString(),
          }],
        }));
      }

      // Son durumu cek
      await refreshQuest();
    } finally {
      setAgentWorking(false);
    }
  }

  async function deleteQuest() {
    if (!confirm("Bu görevi iptal etmek istediğinize emin misiniz?")) return;
    const res = await fetch(`/api/quests/${quest.id}`, { method: "DELETE" });
    if (res.ok) router.push("/quests");
  }

  // Timeline icin adimlari hazirla
  const currentStepIndex = getStepIndex(quest.status);
  const isFailed = quest.status === "failed";
  const isCancelled = quest.status === "cancelled";
  const steps = [...LIFECYCLE_STEPS];
  if (isFailed) steps[3] = FAILED_STEP;
  if (isCancelled) steps[3] = CANCELLED_STEP;

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
        <div className="flex items-center gap-2">
          {/* Auto-refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all border",
              autoRefresh
                ? "bg-health-green/10 text-health-green border-health-green/30"
                : "bg-castle-surface text-parchment-dim border-castle-border hover:text-parchment"
            )}
            title={autoRefresh ? "Canlı takip açık (5sn)" : "Canlı takip kapalı"}
          >
            <Activity className={cn("w-3.5 h-3.5", autoRefresh && "animate-pulse")} />
            {autoRefresh ? "Canlı" : "Takip"}
          </button>
          <button
            onClick={refreshQuest}
            className="p-1.5 rounded-lg text-parchment-dim hover:text-parchment hover:bg-castle-border/30 transition-all"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {isActive && (
            <Button variant="destructive" size="sm" onClick={deleteQuest}>
              <Trash2 className="w-4 h-4" />
              <span className="hidden md:inline">İptal Et</span>
            </Button>
          )}
        </div>
      </div>

      {/* Status Change Banner */}
      <AnimatePresence>
        {statusJustChanged && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="rpg-card-gold p-4 flex items-center gap-3"
          >
            <Zap className="w-5 h-5 text-gold animate-bounce" />
            <div>
              <span className="text-sm font-bold text-gold">Durum Güncellendi!</span>
              <span className="text-sm text-parchment ml-2">
                {statusConfig?.label}
                {quest.status === "completed" && ` — +${quest.xpReward} XP kazanıldı!`}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Process Timeline / Stepper */}
      <div className="rpg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-sm font-bold text-gold flex items-center gap-2"
            style={{ fontFamily: "var(--font-medieval)" }}
          >
            <Activity className="w-4 h-4" />
            Görev Süreci
          </h3>
          {autoRefresh && (
            <span className="text-xs text-parchment-dim flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-health-green animate-pulse" />
              Son güncelleme: {formatTime(lastRefresh)}
            </span>
          )}
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between relative">
          {/* Background line */}
          <div className="absolute top-5 left-8 right-8 h-0.5 bg-castle-border" />
          {/* Progress line */}
          <motion.div
            className={cn(
              "absolute top-5 left-8 h-0.5",
              isFailed ? "bg-health-red" : isCancelled ? "bg-parchment-dim" : "bg-gold"
            )}
            initial={{ width: "0%" }}
            animate={{
              width: `${Math.min((currentStepIndex / (steps.length - 1)) * 100, 100) * 0.85}%`
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {steps.map((step, i) => {
            const isCompleted = i < currentStepIndex;
            const isCurrent = i === currentStepIndex;
            const isPending = i > currentStepIndex;
            const StepIcon = step.icon;

            // Adimin zamanini bul
            let stepTime: string | null = null;
            if (i === 0) stepTime = quest.createdAt;
            if (step.key === "completed" && quest.completedAt) stepTime = quest.completedAt;
            if (step.key === "failed" && quest.completedAt) stepTime = quest.completedAt;
            // Status degisikligini yorumlardan bul
            if (!stepTime && (isCompleted || isCurrent)) {
              const statusComment = quest.comments.find(c =>
                c.author === "system" && c.content.includes(step.label)
              );
              if (statusComment) stepTime = statusComment.createdAt;
            }

            return (
              <div key={step.key} className="flex flex-col items-center relative z-10 flex-1">
                <motion.div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                    isCompleted && "bg-gold/20 border-gold text-gold",
                    isCurrent && !isFailed && !isCancelled && "bg-mana-blue/20 border-mana-blue text-mana-blue ring-4 ring-mana-blue/10",
                    isCurrent && isFailed && "bg-health-red/20 border-health-red text-health-red ring-4 ring-health-red/10",
                    isCurrent && isCancelled && "bg-parchment-dim/20 border-parchment-dim text-parchment-dim",
                    isCurrent && quest.status === "completed" && "bg-health-green/20 border-health-green text-health-green ring-4 ring-health-green/10",
                    isPending && "bg-castle-surface border-castle-border text-parchment-dim/40"
                  )}
                  animate={isCurrent && isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={isCurrent && isActive ? { repeat: Infinity, duration: 2 } : {}}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isCurrent ? (
                    <StepIcon className={cn("w-5 h-5", isActive && "animate-pulse")} />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </motion.div>
                <span className={cn(
                  "text-xs font-medium mt-2 text-center",
                  isCompleted && "text-gold",
                  isCurrent && !isFailed && "text-parchment",
                  isCurrent && isFailed && "text-health-red",
                  isCurrent && quest.status === "completed" && "text-health-green",
                  isPending && "text-parchment-dim/40"
                )}>
                  {step.label}
                </span>
                {stepTime && (
                  <span className="text-[10px] text-parchment-dim/60 mt-0.5">
                    {formatTime(stepTime)}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Current status description */}
        <div className="mt-4 text-center">
          <p className="text-xs text-parchment-dim">
            {quest.status === "open" && "Görev ilan edildi, sefere başlanması bekleniyor..."}
            {quest.status === "in_progress" && "Görev üzerinde aktif olarak çalışılıyor"}
            {quest.status === "completed" && `Görev başarıyla tamamlandı! +${quest.xpReward} XP kazanıldı`}
            {quest.status === "failed" && "Görev başarısız oldu, yeniden denenebilir"}
            {quest.status === "cancelled" && "Görev iptal edildi"}
          </p>
        </div>
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

          {/* Comments / Process Log */}
          <div className="rpg-card p-4">
            <h3 className="text-sm font-bold text-parchment mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Görev Günlüğü ({quest.comments.length})
              {autoRefresh && (
                <span className="w-1.5 h-1.5 rounded-full bg-health-green animate-pulse ml-1" />
              )}
            </h3>

            <div className="space-y-0 max-h-[500px] overflow-y-auto mb-4 pr-1">
              {quest.comments.length === 0 && (
                <p className="text-xs text-parchment-dim text-center py-4">Henüz kayıt yok</p>
              )}
              {quest.comments.map((c, i) => {
                const AuthorIcon = authorIcons[c.author] ?? Bot;
                const isSystem = c.author === "system";
                const isAgent = !["user", "system"].includes(c.author);
                const isAssistant = c.author === "assistant";
                const isStatusChange = isSystem && c.content.startsWith("Durum değişti:");
                const isNew = i >= prevCommentCount.current - 1 && i === quest.comments.length - 1;

                return (
                  <motion.div
                    key={c.id}
                    initial={isNew ? { opacity: 0, x: -20 } : { opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex gap-3 relative"
                  >
                    {/* Timeline line */}
                    {i < quest.comments.length - 1 && (
                      <div className="absolute left-[13px] top-10 bottom-0 w-px bg-castle-border" />
                    )}

                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-3 relative z-10",
                      c.author === "user" ? "bg-gold/20" : isAssistant ? "bg-purple-500/20" : isSystem ? "bg-mana-blue/20" : "bg-health-green/20"
                    )}>
                      <AuthorIcon className={cn(
                        "w-3.5 h-3.5",
                        c.author === "user" ? "text-gold" : isAssistant ? "text-purple-400" : isSystem ? "text-mana-blue" : "text-health-green"
                      )} />
                    </div>

                    <div className={cn(
                      "flex-1 min-w-0 py-2.5 px-3 rounded-lg mb-1",
                      isStatusChange ? "bg-mana-blue/5 border border-mana-blue/10" :
                      isAssistant ? "bg-purple-500/5 border border-purple-500/10" :
                      isSystem ? "bg-castle-border/10" :
                      isAgent ? "bg-health-green/5 border border-health-green/10" :
                      "bg-castle-surface/50"
                    )}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                          "text-xs font-medium",
                          c.author === "user" ? "text-gold" : isAssistant ? "text-purple-400" : isSystem ? "text-mana-blue" : "text-health-green"
                        )}>
                          {c.author === "user" ? "Sen" : c.author === "assistant" ? "Claude" : c.author === "system" ? "Sistem" : c.author}
                        </span>
                        <span className="text-[10px] text-parchment-dim">
                          {formatDateTime(c.createdAt)}
                        </span>
                        {isStatusChange && (
                          <Badge variant="info" className="text-[10px] px-1.5 py-0">durum</Badge>
                        )}
                        {isAssistant && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-purple-500/20 text-purple-400 border-purple-500/30">claude</Badge>
                        )}
                        {isAgent && !isAssistant && (
                          <Badge variant="success" className="text-[10px] px-1.5 py-0">agent</Badge>
                        )}
                      </div>
                      <p className={cn(
                        "text-sm",
                        isSystem ? "text-parchment-dim" : "text-parchment"
                      )}>
                        {c.content}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={commentsEndRef} />
            </div>

            {/* Agent Chat */}
            <div className="space-y-2">
              <form onSubmit={sendToAgent} className="flex gap-2">
                <div className="relative flex-1">
                  <Bot className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-health-green" />
                  <input
                    value={agentMessage}
                    onChange={(e) => setAgentMessage(e.target.value)}
                    placeholder={agentWorking ? "Agent çalışıyor..." : "Agent'a görev ver... (örn: blog sayfaları oluştur)"}
                    disabled={agentWorking}
                    className="flex-1 w-full h-10 rounded-lg border border-health-green/30 bg-health-green/5 pl-9 pr-3 text-sm text-parchment placeholder:text-parchment-dim/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-health-green/30 transition-all disabled:opacity-50"
                  />
                </div>
                <Button size="default" type="submit" disabled={agentWorking || !agentMessage.trim()} className="bg-health-green/20 text-health-green border-health-green/30 hover:bg-health-green/30">
                  {agentWorking ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">{agentWorking ? "Çalışıyor" : "Gönder"}</span>
                </Button>
              </form>

              {agentWorking && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-health-green/5 border border-health-green/20"
                >
                  <span className="w-2 h-2 rounded-full bg-health-green animate-pulse" />
                  <span className="text-xs text-health-green">Agent sunucuda çalışıyor — ilerleme görev günlüğünde canlı olarak görünecek</span>
                </motion.div>
              )}

              {/* Manual Comment */}
              <form onSubmit={addComment} className="flex gap-2">
                <input
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Not ekle..."
                  className="flex-1 h-8 rounded-lg border border-castle-border bg-castle-surface px-3 text-xs text-parchment placeholder:text-parchment-dim/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 transition-all"
                />
                <Button size="sm" type="submit" disabled={sending || !comment.trim()} variant="outline">
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* Elapsed Time */}
          <div className="rpg-card p-4">
            <h3 className="text-xs font-bold text-parchment-dim mb-2">Süre</h3>
            <ElapsedTime
              createdAt={quest.createdAt}
              completedAt={quest.completedAt}
              isActive={isActive}
            />
          </div>

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

// Gecen sure komponenti - canli sayac
function ElapsedTime({ createdAt, completedAt, isActive }: { createdAt: string; completedAt: string | null; isActive: boolean }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    function calc() {
      const start = new Date(createdAt).getTime();
      const end = completedAt ? new Date(completedAt).getTime() : Date.now();
      const diff = end - start;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const parts = [];
      if (days > 0) parts.push(`${days}g`);
      if (hours > 0) parts.push(`${hours}s`);
      if (minutes > 0) parts.push(`${minutes}dk`);
      if (!completedAt) parts.push(`${seconds}sn`);
      setElapsed(parts.join(" ") || "0sn");
    }
    calc();
    if (isActive) {
      const interval = setInterval(calc, 1000);
      return () => clearInterval(interval);
    }
  }, [createdAt, completedAt, isActive]);

  return (
    <div className="flex items-center gap-2">
      <Clock className={cn("w-4 h-4", isActive ? "text-mana-blue animate-pulse" : "text-parchment-dim")} />
      <span className={cn(
        "text-lg font-mono font-bold",
        isActive ? "text-mana-blue" : "text-parchment"
      )}>
        {elapsed}
      </span>
      {isActive && <span className="text-xs text-parchment-dim">(devam ediyor)</span>}
      {!isActive && completedAt && <span className="text-xs text-parchment-dim">(toplam)</span>}
    </div>
  );
}
