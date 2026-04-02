# /status — Tam Sistem Durumu

## Trigger
`/status` | `durum` | `sistem durumu` | `ne durumda`

## Orchestration Flow
Tüm agentlar PARALEL çalıştırılır, Orchestrator sentezler:

```
[TÜM PARALEL — ~60 saniye]
  → infrastructure-warden : CPU/RAM/Disk/Docker/Coolify
  → network-sentinel       : SSL günler + Firewall + DNS
  → scout-master           : Uptime + Son hatalar + Response süresi
  → automation-mage        : n8n workflow durumu + hata sayısı
  → data-alchemist         : DB bağlantı + yavaş sorgu + boyut
  → ai-conjurer            : Bütçe kullanımı + pipeline durumu
  → backup-oracle          : Son yedek + bütünlük
  → quest-tracker          : GET /api/quests/stats → Açık görev + geciken

[SENTEZ]
  Orchestrator → tek kapsamlı dashboard
```

## Output Format
```
🏰 CAFERSERVER DASHBOARD
📅 [tarih saat]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🖥️  ALTYAPI
  CPU: XX% | RAM: XX% | Disk: XX%
  Docker: XX container | Coolify: ✅

🛡️  AĞ & GÜVENLİK
  SSL: [domain expiry günleri]
  Firewall: ✅ | Fail2ban: XX ban

🚀 SİTELER
  ✅ cafercalisan.com (XXXms)
  ✅ calisyanyapi.com (XXXms)
  ✅ hoteleurodiamond.com (XXXms)
  ✅ eurodiamondhotel.com (XXXms)

🤖 OTOMASYON
  n8n: XX workflow aktif | XX hata
  Cron: sonraki → [saat görev]

✨ AI
  Bu ay: $XX/$50 (XX%)
  Üretilen görsel: XX

📦 YEDEK
  Son yedek: [tarih]
  Durum: ✅

📋 GÖREVLER (GET /api/quests/stats)
  Açık: XX | Geciken: XX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sistem Skoru: XX/100
```
