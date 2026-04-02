# /rollback — Geri Al

## Trigger
`/rollback <proje-adı>` | `geri al <proje>`

## Orchestration Flow
```
1. deployment-ranger  : Önceki image tag'i bul (/tmp/rollback_info.txt)
2. data-alchemist     : DB rollback gerekiyor mu değerlendir
3. backup-oracle      : Gerekirse DB snapshot hazırla

⚠️  KULLANICI ONAYI (zorunlu):
   "Rollback yapılsın mı?
    Mevcut: v2.1.3 → Geri dönülecek: v2.1.2
    Bu işlem geri alınamaz. (E/H)"

4. deployment-ranger  : Rollback uygula
5. scout-master       : Smoke test (3 deneme)
6. herald             : Rollback bildirimini gönder
7. quest-tracker      : Aktiviteyi POST /api/quests ile logla
```

## ⚠️ KRITIK KURAL
Rollback her zaman kullanıcı onayı gerektirir.
Otomatik rollback SADECE:
- Smoke test 3 denemede başarısız olursa
- Deploy sırasında tetiklenir (deploy sonrası değil)
