export const RPG_TITLES: Record<number, string> = {
  1: "Çırak Koruyucu",
  5: "Kale Muhafızı",
  10: "Sunucu Lordu",
  20: "Dijital İmparator",
  50: "Efsanevi Yönetici",
};

export const XP_VALUES = {
  DEPLOY_SUCCESS: 50,
  DEPLOY_FAIL_RESOLVED: 100,
  UPTIME_24H: 10,
  SITE_RECOVERED: 75,
} as const;

export const QUEST_XP_BASE: Record<string, number> = {
  common: 10,
  normal: 25,
  rare: 50,
  epic: 75,
  legendary: 150,
};

export const QUEST_PRIORITIES = [
  { value: "legendary", label: "Efsanevi", icon: "crown", color: "#f0c040" },
  { value: "epic", label: "Epik", icon: "flame", color: "#a855f7" },
  { value: "rare", label: "Nadir", icon: "gem", color: "#4488cc" },
  { value: "normal", label: "Normal", icon: "sword", color: "#44cc44" },
  { value: "common", label: "Sıradan", icon: "shield", color: "#888888" },
] as const;

export const QUEST_STATUSES = [
  { value: "open", label: "İlan Edildi", icon: "scroll" },
  { value: "in_progress", label: "Sefer Başladı", icon: "swords" },
  { value: "completed", label: "Fethedildi", icon: "trophy" },
  { value: "failed", label: "Düşmüş", icon: "skull" },
  { value: "cancelled", label: "Geri Çekildi", icon: "ban" },
] as const;

export const QUEST_CATEGORIES = [
  { value: "bug_hunt", label: "Canavar Avı", icon: "bug" },
  { value: "fortification", label: "Tahkim", icon: "castle" },
  { value: "expedition", label: "Keşif", icon: "compass" },
  { value: "patrol", label: "Devriye", icon: "eye" },
  { value: "ritual", label: "Ayin", icon: "sparkles" },
  { value: "general", label: "Genel", icon: "scroll" },
] as const;

export const VILLAGE_TYPES = {
  library: { label: "Kütüphane", color: "#8b5cf6" },
  fortress: { label: "Kale", color: "#ef4444" },
  inn: { label: "Han", color: "#f59e0b" },
  forge: { label: "Ocak", color: "#06b6d4" },
} as const;

export const HEALTH_STATUS = {
  HEALTHY: { label: "Sağlıklı", color: "#44cc44", icon: "🛡️" },
  WARNING: { label: "Uyarı", color: "#ccaa44", icon: "⚠️" },
  DOWN: { label: "Düşmüş", color: "#cc4444", icon: "💀" },
  UNKNOWN: { label: "Bilinmiyor", color: "#888888", icon: "❓" },
} as const;

export const SITES_CONFIG = [
  {
    name: "cafercalisan.com",
    url: "https://cafercalisan.com",
    villageName: "Bilge'nin Kütüphanesi",
    villageType: "library",
    icon: "📚",
    order: 1,
  },
  {
    name: "calisyanyapi.com",
    url: "https://calisyanyapi.com",
    villageName: "Yapıcı'nın Kalesi",
    villageType: "fortress",
    icon: "🏗️",
    order: 2,
  },
  {
    name: "hoteleurodiamond.com",
    url: "https://hoteleurodiamond.com",
    villageName: "Elmas Han",
    villageType: "inn",
    icon: "💎",
    order: 3,
  },
  {
    name: "eurodiamondhotel",
    url: "https://eurodiamondhotel.com",
    villageName: "Elmas Kale",
    villageType: "forge",
    icon: "🏰",
    order: 4,
  },
];

export const ACHIEVEMENTS_CONFIG = [
  {
    key: "first_blood",
    name: "İlk Kan",
    description: "İlk başarılı deploy",
    icon: "⚔️",
    xpReward: 100,
  },
  {
    key: "iron_uptime",
    name: "Demir Uptime",
    description: "7 gün kesintisiz %100 uptime",
    icon: "🛡️",
    xpReward: 500,
  },
  {
    key: "quest_master",
    name: "Görev Ustası",
    description: "50 başarılı deploy",
    icon: "👑",
    xpReward: 1000,
  },
  {
    key: "night_owl",
    name: "Gece Baykuşu",
    description: "Gece yarısından sonra deploy",
    icon: "🦉",
    xpReward: 50,
  },
  {
    key: "speed_demon",
    name: "Hız Şeytanı",
    description: "60 saniyeden kısa sürede deploy",
    icon: "⚡",
    xpReward: 75,
  },
  {
    key: "healer",
    name: "Şifacı",
    description: "Düşmüş bir siteyi ayağa kaldır",
    icon: "💚",
    xpReward: 200,
  },
  {
    key: "full_kingdom",
    name: "Tam Krallık",
    description: "Tüm siteler 30 gün kesintisiz sağlıklı",
    icon: "🏆",
    xpReward: 2000,
  },
  {
    key: "quest_slayer",
    name: "Görev Avcısı",
    description: "10 görevi tamamla",
    icon: "📜",
    xpReward: 200,
  },
  {
    key: "quest_legend",
    name: "Efsanevi Görevci",
    description: "50 görevi tamamla",
    icon: "🏅",
    xpReward: 1000,
  },
  {
    key: "bug_hunter",
    name: "Canavar Avcısı",
    description: "5 canavar avı görevini tamamla",
    icon: "🐛",
    xpReward: 300,
  },
];
