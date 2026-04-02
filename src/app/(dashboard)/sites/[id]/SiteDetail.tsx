"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Swords, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { HealthBar } from "@/components/rpg/HealthBar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";

interface SiteDetailProps {
  site: {
    id: string;
    name: string;
    url: string;
    villageName: string;
    villageType: string;
    icon: string;
    coolifyId: string | null;
    uptimePercentage: number;
    isUp: boolean;
    lastResponseTime: number;
  };
  healthChecks: {
    status: number;
    responseTime: number;
    isUp: boolean;
    checkedAt: string;
  }[];
  deployments: {
    id: string;
    status: string;
    questName: string;
    xpAwarded: number;
    triggeredAt: string;
    completedAt: string | null;
  }[];
}

export function SiteDetail({ site, healthChecks, deployments }: SiteDetailProps) {
  const [deploying, setDeploying] = useState(false);

  async function handleDeploy() {
    if (!site.coolifyId) return;
    setDeploying(true);
    try {
      await fetch(`/api/sites/${site.id}/deploy`, { method: "POST" });
    } finally {
      setDeploying(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start gap-4">
        <Link href="/sites">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{site.icon}</span>
            <div>
              <h1
                className="text-2xl font-bold rpg-gradient-text"
                style={{ fontFamily: "var(--font-medieval)" }}
              >
                {site.villageName}
              </h1>
              <a
                href={site.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-mana-blue hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                {site.name}
              </a>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={site.isUp ? "success" : "danger"} className="text-sm">
            {site.isUp ? "Aktif" : "Düşmüş"}
          </Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Uptime (24s)</CardTitle>
          </CardHeader>
          <CardContent>
            <HealthBar percentage={site.uptimePercentage} showValue size="lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Son Yanıt Süresi</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-gold">{site.lastResponseTime}ms</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Görev Gönder</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleDeploy}
              disabled={!site.coolifyId || deploying}
              className="w-full"
            >
              {deploying ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Swords className="w-4 h-4" />
              )}
              {deploying ? "Gönderiliyor..." : "Göreve Gönder"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Response time history */}
      <Card>
        <CardHeader>
          <CardTitle>Yanıt Süresi Geçmişi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-0.5 h-24">
            {healthChecks
              .slice()
              .reverse()
              .map((check, i) => {
                const maxMs = Math.max(...healthChecks.map((h) => h.responseTime), 1);
                const height = (check.responseTime / maxMs) * 100;
                return (
                  <motion.div
                    key={i}
                    className={`flex-1 rounded-t ${check.isUp ? "bg-health-green/60" : "bg-health-red/60"}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(height, 2)}%` }}
                    transition={{ delay: i * 0.02 }}
                    title={`${check.responseTime}ms - ${formatDateTime(check.checkedAt)}`}
                  />
                );
              })}
          </div>
          {healthChecks.length === 0 && (
            <p className="text-xs text-parchment-dim text-center py-8">
              Henüz sağlık kontrolü verisi yok
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Deployments */}
      <Card>
        <CardHeader>
          <CardTitle>Son Görevler</CardTitle>
        </CardHeader>
        <CardContent>
          {deployments.length === 0 ? (
            <p className="text-xs text-parchment-dim text-center py-4">
              Henüz görev yok
            </p>
          ) : (
            <div className="space-y-2">
              {deployments.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-castle-bg/50 border border-castle-border/50"
                >
                  <div>
                    <p className="text-sm text-parchment">{d.questName}</p>
                    <p className="text-xs text-parchment-dim">
                      {formatDateTime(d.triggeredAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {d.xpAwarded > 0 && (
                      <span className="text-xs text-gold font-bold">+{d.xpAwarded} XP</span>
                    )}
                    <Badge
                      variant={
                        d.status === "success"
                          ? "success"
                          : d.status === "failed"
                          ? "danger"
                          : "warning"
                      }
                    >
                      {d.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
