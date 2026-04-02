export interface ServerMetrics {
  cpuUsage: number;
  ramUsage: number;
  ramTotal: number;
  diskUsage: number;
  diskTotal: number;
  networkIn: number;
  networkOut: number;
}

export interface SiteStatus {
  id: string;
  name: string;
  url: string;
  villageName: string;
  villageType: string;
  icon: string;
  isUp: boolean;
  lastResponseTime: number;
  uptimePercentage: number;
  lastChecked: string;
}

export interface DeploymentInfo {
  id: string;
  siteId: string;
  siteName: string;
  villageName: string;
  status: "pending" | "building" | "success" | "failed";
  questName: string;
  xpAwarded: number;
  triggeredAt: string;
  completedAt: string | null;
}

export interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  title: string;
  xpProgress: {
    current: number;
    needed: number;
    percentage: number;
  };
}

export interface Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt: string | null;
}

export interface ActivityLogEntry {
  id: string;
  type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
