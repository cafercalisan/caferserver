"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { QUEST_PRIORITIES, QUEST_CATEGORIES, QUEST_XP_BASE } from "@/lib/constants";
import { X, Plus, Sparkles } from "lucide-react";

interface Site {
  id: string;
  name: string;
  villageName: string;
}

interface CreateQuestModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  sites: Site[];
}

export function CreateQuestModal({ open, onClose, onCreated, sites }: CreateQuestModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("general");
  const [siteId, setSiteId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const xpReward = QUEST_XP_BASE[priority] ?? 25;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          category,
          siteId: siteId || null,
          dueDate: dueDate || null,
        }),
      });

      if (res.ok) {
        setTitle("");
        setDescription("");
        setPriority("normal");
        setCategory("general");
        setSiteId("");
        setDueDate("");
        onCreated();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 rpg-card-gold p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-xl font-bold rpg-gradient-text"
            style={{ fontFamily: "var(--font-medieval)" }}
          >
            Yeni Görev İlan Et
          </h2>
          <button onClick={onClose} className="text-parchment-dim hover:text-parchment">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-parchment-dim mb-1.5">Başlık</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Görev başlığı..."
              required
            />
          </div>

          <div>
            <label className="block text-xs text-parchment-dim mb-1.5">Açıklama</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detaylı açıklama (isteğe bağlı)..."
              rows={3}
              className="flex w-full rounded-lg border border-castle-border bg-castle-surface px-3 py-2 text-sm text-parchment placeholder:text-parchment-dim/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 focus-visible:border-gold/50 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-parchment-dim mb-1.5">Öncelik</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-castle-border bg-castle-surface px-3 py-2 text-sm text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 transition-all"
              >
                {QUEST_PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-parchment-dim mb-1.5">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-castle-border bg-castle-surface px-3 py-2 text-sm text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 transition-all"
              >
                {QUEST_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-parchment-dim mb-1.5">Köy (Site)</label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-castle-border bg-castle-surface px-3 py-2 text-sm text-parchment focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 transition-all"
              >
                <option value="">Genel</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.villageName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-parchment-dim mb-1.5">Son Tarih</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-gold/5 border border-gold/20">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-sm text-gold font-semibold">+{xpReward} XP</span>
            <span className="text-xs text-parchment-dim">tamamlandığında kazanılacak</span>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              İptal
            </Button>
            <Button type="submit" disabled={loading || !title.trim()} className="flex-1">
              <Plus className="w-4 h-4" />
              {loading ? "Oluşturuluyor..." : "Görev İlan Et"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
