"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ScrollText, RefreshCw, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface SiteOption {
  id: string;
  name: string;
  villageName: string;
  icon: string;
}

export default function LogsPage() {
  const [sites, setSites] = useState<SiteOption[]>([]);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [logs, setLogs] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const logRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    fetch("/api/sites")
      .then((res) => res.json())
      .then((data) => {
        const siteList = data.map((s: { id: string; name: string; villageName: string; icon: string }) => ({
          id: s.id,
          name: s.name,
          villageName: s.villageName,
          icon: s.icon,
        }));
        setSites(siteList);
        if (siteList.length > 0) {
          setSelectedSite(siteList[0].id);
        }
      })
      .catch(() => {});
  }, []);

  async function fetchLogs() {
    if (!selectedSite) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/sites/${selectedSite}/logs`);
      const data = await res.json();
      setLogs(
        typeof data.logs === "string"
          ? data.logs
          : JSON.stringify(data, null, 2)
      );
    } catch {
      setLogs("Log alınamadı");
    } finally {
      setLoading(false);
      setTimeout(() => {
        logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
      }, 100);
    }
  }

  useEffect(() => {
    if (selectedSite) fetchLogs();
  }, [selectedSite]);

  useEffect(() => {
    if (!autoRefresh || !selectedSite) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, selectedSite]);

  function downloadLogs() {
    const blob = new Blob([logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${selectedSite}-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const selectedSiteInfo = sites.find((s) => s.id === selectedSite);

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold rpg-gradient-text"
            style={{ fontFamily: "var(--font-medieval)" }}
          >
            Krallık Kayıtları
          </h1>
          <p className="text-sm text-parchment-dim mt-1">
            Container log kayıtları
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "success" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Otomatik" : "Manuel"}
          </Button>
        </div>
      </div>

      {/* Site selector */}
      <div className="flex flex-wrap gap-2">
        {sites.map((site) => (
          <button
            key={site.id}
            onClick={() => setSelectedSite(site.id)}
            className={`rpg-card px-3 py-2 text-sm transition-all ${
              selectedSite === site.id
                ? "border-gold/50 text-gold rpg-glow-gold"
                : "text-parchment-dim hover:text-parchment"
            }`}
          >
            <span className="mr-1">{site.icon}</span>
            {site.villageName}
          </button>
        ))}
      </div>

      {/* Log output */}
      <div className="flex-1 rpg-card flex flex-col min-h-[300px]">
        <div className="flex items-center justify-between px-4 py-2 border-b border-castle-border/30">
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-gold" />
            <span className="text-sm text-parchment">
              {selectedSiteInfo?.villageName || "Site seçin"}
            </span>
            {loading && <Badge variant="warning">Yükleniyor...</Badge>}
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={downloadLogs} disabled={!logs}>
              <Download className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setLogs("")}>
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <pre
          ref={logRef}
          className="flex-1 p-4 overflow-auto text-xs font-mono text-parchment-dim leading-relaxed whitespace-pre-wrap"
        >
          {logs || (
            <span className="text-parchment-dim/40">
              {selectedSite
                ? "Log kayıtları yükleniyor...\nCoolify API bağlantısı gereklidir."
                : "Kayıtları görmek için bir site seçin"}
            </span>
          )}
        </pre>
      </div>
    </div>
  );
}
