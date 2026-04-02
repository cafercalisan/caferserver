# /deploy — Uygulama Deploy Komutu

## Trigger
`/deploy <proje-adı>` veya `deploy <proje-adı>`

## Orchestration Flow
```
Aşama 1 — PARALEL (bağımsız kontroller):
  → infrastructure-warden  : CPU/RAM/Disk sağlık kontrol
  → network-sentinel        : SSL expiry + firewall kontrol
  → scout-master            : Mevcut site uptime kontrol

Aşama 2 — SIRAYLA (zorunlu sıra):
  → backup-oracle           : Deploy öncesi yedek al + ONAY VER

Aşama 3 — KULLANICI ONAYI (human-in-the-loop):
  Orchestrator planı sunar:
    "✅ Kontroller tamam. Deploy başlasın mı? (E/H)"

Aşama 4 — DEPLOY:
  → deployment-ranger       : Coolify deploy tetikle + izle (5dk)

Aşama 5 — PARALEL (deploy sonrası):
  → scout-master            : Smoke test + HTTP 200 kontrol
  → herald                  : Telegram deploy bildirimi gönder

Aşama 6 — LOG:
  → quest-tracker           : Aktiviteyi POST /api/quests ile logla
```

## Fail Handling
```
Smoke test başarısız → deployment-ranger otomatik rollback → herald bildirim
Deploy timeout (>5dk) → kullanıcıya sor → manual/auto rollback
```

## Usage
```
/deploy caferserver
/deploy cafercalisan
/deploy calisyanyapi
/deploy eurodiamondhotel
/deploy hoteleurodiamond
```
