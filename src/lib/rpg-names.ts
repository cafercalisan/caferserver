const QUEST_PREFIXES = [
  "Büyük",
  "Kutsal",
  "Epik",
  "Efsanevi",
  "Gizemli",
  "Kritik",
  "Acil",
  "Cesur",
];

const QUEST_ACTIONS = [
  "Yeniden İnşası",
  "Güçlendirilmesi",
  "Korunması",
  "Onarımı",
  "Yükseltilmesi",
  "Dönüşümü",
  "Uyanışı",
];

export function generateQuestName(villageName: string): string {
  const prefix = QUEST_PREFIXES[Math.floor(Math.random() * QUEST_PREFIXES.length)];
  const action = QUEST_ACTIONS[Math.floor(Math.random() * QUEST_ACTIONS.length)];
  return `${prefix} ${villageName} ${action}`;
}

export function generateDeployMessage(villageName: string, status: "pending" | "building" | "success" | "failed"): string {
  switch (status) {
    case "pending":
      return `${villageName} için görev hazırlanıyor...`;
    case "building":
      return `${villageName} surları yeniden örülüyor...`;
    case "success":
      return `${villageName} başarıyla güçlendirildi! 🎉`;
    case "failed":
      return `${villageName} görevi başarısız oldu! Düşman saldırısı! 💀`;
  }
}
