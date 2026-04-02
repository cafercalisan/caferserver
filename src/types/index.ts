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

export interface QuestInfo {
  id: string;
  title: string;
  description: string | null;
  questName: string;
  status: "open" | "in_progress" | "completed" | "failed" | "cancelled";
  priority: "legendary" | "epic" | "rare" | "normal" | "common";
  category: string;
  projectKey: string | null;
  siteId: string | null;
  siteName: string | null;
  villageType: string | null;
  deploymentId: string | null;
  labels: string[];
  dueDate: string | null;
  xpReward: number;
  xpAwarded: boolean;
  createdBy: string | null;
  assignee: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  commentCount: number;
}

export interface QuestCommentInfo {
  id: string;
  questId: string;
  author: string;
  content: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface QuestStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
  completedThisWeek: number;
  totalXpFromQuests: number;
}
