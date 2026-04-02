"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  RefreshCw,
  Server,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HealthBar } from "@/components/rpg/HealthBar";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MetricPoint {
  cpuUsage: number;
  ramUsage: number;
  ramTotal: number;
  diskUsage: number;
  diskTotal: number;
  networkIn: number;
  networkOut: number;
  recordedAt: string;
}

interface MetricsViewProps {
  initialMetrics: MetricPoint[];
}

export function MetricsView({ initialMetrics }: MetricsViewProps) {
  const [metrics, setMetrics] = useState(initialMetrics);
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<Record<string, string> | null>(null);

  const latest = metrics[0];

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/server/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics((prev) => [{ ...data, recordedAt: new Date().toISOString() }, ...prev.slice(0, 59)]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/server/info")
      .then((res) => res.json())
      .then(setServerInfo)
      .catch(() => {});
  }, []);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  const chartData = metrics
    .slice()
    .reverse()
    .map((m) => ({
      time: new Date(m.recordedAt).toLocaleTimeString("tr-TR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      cpu: m.cpuUsage,
      ram: m.ramUsage,
      disk: m.diskUsage,
    }));

  return (
    <div className="space-y-6">
      {/* Server Info */}
      {serverInfo && (
        <motion.div
          className="rpg-card-gold p-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3 mb-3">
            <Server className="w-5 h-5 text-gold" />
            <h3 className="font-bold text-parchment text-sm">Sunucu Bilgisi</h3>
            <div className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMetrics}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Yenile
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-parchment-dim">Hostname:</span>
              <p className="text-parchment font-medium">{serverInfo.hostname}</p>
            </div>
            <div>
              <span className="text-parchment-dim">OS:</span>
              <p className="text-parchment font-medium">{serverInfo.os}</p>
            </div>
            <div>
              <span className="text-parchment-dim">Kernel:</span>
              <p className="text-parchment font-medium">{serverInfo.kernel}</p>
            </div>
            <div>
              <span className="text-parchment-dim">Uptime:</span>
              <p className="text-parchment font-medium">{serverInfo.uptime}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Cpu}
          label="CPU Kullanımı"
          value={latest?.cpuUsage ?? 0}
          color="text-mana-blue"
          suffix="%"
          index={0}
        />
        <MetricCard
          icon={MemoryStick}
          label="RAM Kullanımı"
          value={latest?.ramUsage ?? 0}
          color="text-village-library"
          suffix="%"
          detail={latest ? `${(latest.ramTotal * latest.ramUsage / 100).toFixed(0)}MB / ${latest.ramTotal.toFixed(0)}MB` : undefined}
          index={1}
        />
        <MetricCard
          icon={HardDrive}
          label="Disk Kullanımı"
          value={latest?.diskUsage ?? 0}
          color="text-village-inn"
          suffix="%"
          index={2}
        />
        <MetricCard
          icon={Wifi}
          label="Ağ Trafiği"
          value={0}
          color="text-health-green"
          customValue={
            latest
              ? `↓${latest.networkIn.toFixed(1)} / ↑${latest.networkOut.toFixed(1)} KB/s`
              : "0 KB/s"
          }
          index={3}
        />
      </div>

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="w-4 h-4 text-mana-blue" />
                CPU Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4e" />
                    <XAxis dataKey="time" stroke="#b8b0a0" fontSize={10} />
                    <YAxis stroke="#b8b0a0" fontSize={10} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "#16213e",
                        border: "1px solid #2a2a4e",
                        borderRadius: "8px",
                        color: "#e8e0d0",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="cpu"
                      stroke="#4488cc"
                      fill="#4488cc"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <MemoryStick className="w-4 h-4 text-village-library" />
                RAM Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4e" />
                    <XAxis dataKey="time" stroke="#b8b0a0" fontSize={10} />
                    <YAxis stroke="#b8b0a0" fontSize={10} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "#16213e",
                        border: "1px solid #2a2a4e",
                        borderRadius: "8px",
                        color: "#e8e0d0",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="ram"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {chartData.length <= 1 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-parchment-dim">
              Henüz yeterli metrik verisi yok. Veriler otomatik olarak toplanacak.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
  suffix,
  detail,
  customValue,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  suffix?: string;
  detail?: string;
  customValue?: string;
  index: number;
}) {
  return (
    <motion.div
      className="rpg-card p-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="text-sm text-parchment-dim">{label}</span>
      </div>
      {customValue ? (
        <p className="text-lg font-bold text-parchment">{customValue}</p>
      ) : (
        <>
          <p className="text-2xl font-bold text-parchment">
            {value.toFixed(1)}
            <span className="text-sm text-parchment-dim">{suffix}</span>
          </p>
          <HealthBar percentage={value} size="sm" className="mt-2" />
        </>
      )}
      {detail && <p className="text-xs text-parchment-dim mt-1">{detail}</p>}
    </motion.div>
  );
}
