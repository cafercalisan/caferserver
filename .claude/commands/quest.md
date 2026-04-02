# /quest — Görev Yönetimi

## Trigger
`/quest "<görev>"` | `görev oluştur` | `yeni task`

## Orchestration Flow
```
1. Orchestrator      : Görevi parse et (proje, öncelik, tip)
2. quest-tracker     : Panel Quest API'ye yönlendir → POST /api/quests
3. quest-tracker     : Quest oluştur (panel üzerinden)
4. herald            : "Görev oluşturuldu" Telegram bildirimi
```

## Usage
```
/quest "cafercalisan.com blog güncelleme - legendary"
/quest "calisyanyapi.com proje sayfası düzenle"
/quest "hoteleurodiamond.com oda fiyat güncellemesi - epic"
/quest "eurodiamondhotel.com rezervasyon sistemi fix - rare"
```

## Priority Mapping
- URGENT / acil → legendary
- HIGH / yüksek → epic
- MEDIUM / orta → rare
- LOW / düşük → normal
- TRIVIAL / önemsiz → common

## API
```
POST /api/quests
Content-Type: application/json

{
  "title": "Görev başlığı",
  "description": "Detaylı açıklama",
  "priority": "legendary|epic|rare|normal|common",
  "status": "active"
}
```
