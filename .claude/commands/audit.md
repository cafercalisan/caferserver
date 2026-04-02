# /audit — Güvenlik & Sistem Denetimi

## Trigger
`/audit` | `güvenlik denetimi` | `denetim yap`

## Orchestration Flow
```
Aşama 1 — PARALEL:
  → network-sentinel   : Firewall kuralları + SSL + fail2ban + açık port
  → scout-master       : Son 24h hata/anormallik + 5xx oranı
  → infrastructure-warden : Şüpheli proses + disk anomali

Aşama 2 — SIRAYLA:
  → data-alchemist     : DB erişim log + yetkisiz sorgu kontrolü
  → backup-oracle      : Yedek bütünlük checksum doğrulama

Aşama 3 — RAPOR:
  → herald             : Güvenlik raporu Telegram'a gönder
  → quest-tracker      : Kritik bulgular → POST /api/quests ile panel'e görev oluştur
```

## Severity Levels
- 🔴 CRITICAL: Anlık aksiyon gerekli → kullanıcıya bildir
- 🟠 HIGH: 24h içinde çözülmeli → Panel'e görev oluştur (priority: epic)
  ```
  POST /api/quests { "title": "...", "priority": "epic", "status": "active" }
  ```
- 🟡 MEDIUM: Bu hafta → Panel'e görev oluştur (priority: rare)
  ```
  POST /api/quests { "title": "...", "priority": "rare", "status": "active" }
  ```
- 🟢 LOW: Sonraki sprint → logla
