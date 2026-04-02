@AGENTS.md

# GUILD SYSTEM — Multi-Agent Server Management
> Owner: Cafer | Stack: Hetzner VPS · Coolify · n8n · MinIO · PostgreSQL
> Architecture: 2026 Multi-Agent Orchestration (Claude Code Agent Teams)

---

## SYSTEM OVERVIEW

Bu proje **RPG tabanlı multi-agent server yönetim sistemi** olan CaferServer panelidir.
Her departman bağımsız bir Claude Code subagent olarak çalışır.
Orchestrator kararları alır, doğru ajanları devreye sokar ve süreci izler.

**Karar → Agent Seçimi → Paralel Çalışma → Deploy → İzleme** akışı otomatiktir.

**Görev yönetimi (quest sistemi) panelin kendi içindedir** — Jira/Trello kullanılmaz.
Görevler: `POST /api/quests`, `GET /api/quests`, `GET /api/quests/stats`

---

## INFRASTRUCTURE

| Bileşen | Değer |
|---------|-------|
| Provider | Hetzner VPS — Helsinki |
| OS | Ubuntu 24.04 LTS |
| PaaS | Coolify (self-hosted) |
| Orchestration | n8n |
| Object Storage | MinIO (self-hosted) |
| Database | PostgreSQL |
| Container | Docker + Docker Compose |
| Notification | Telegram Bot |
| Proxy | Nginx / Traefik |

---

## MANAGED SITES

| Site | Village | Type |
|------|---------|------|
| cafercalisan.com | Bilge'nin Kütüphanesi | library |
| calisyanyapi.com | Yapıcı'nın Kalesi | fortress |
| hoteleurodiamond.com | Elmas Han | inn |
| eurodiamondhotel.com | Elmas Kale | forge |

---

## GUILD RULES

1. **Yetki sınırı**: Her agent yalnızca kendi departman yetkilerini kullanır
2. **Onay eşiği**: Production silme, DB migration, deploy → kullanıcı onayı gerekir
3. **Backup önce**: Silme/değiştirme işlemi öncesi Backup Oracle devreye girer
4. **Bildirim zorunlu**: Kritik operasyonlar Herald → Telegram üzerinden raporlanır
5. **Rollback hazır**: Her deploy öncesi rollback planı hazırlanır
6. **Log tut**: Quest Tracker tüm agent aktivitelerini loglar
7. **Maliyet kontrol**: AI Conjurer aylık $50 USD bütçeyi aşamaz
8. **Bütünlük**: Backup Oracle onayı olmadan production verisi silinemez

---

## QUEST API (Görev Yönetimi)

Tüm görev işlemleri panelin kendi API'si üzerinden yapılır:

```
POST   /api/quests              — Yeni görev oluştur
GET    /api/quests              — Görev listesi (filtre: status, priority, category, siteId, search)
GET    /api/quests/stats        — İstatistikler
GET    /api/quests/[id]         — Görev detayı
PUT    /api/quests/[id]         — Görev güncelle (status değişimi → otomatik XP)
DELETE /api/quests/[id]         — Görev iptal
POST   /api/quests/[id]/comments — Yorum ekle
```

**Priority (öncelik):** legendary, epic, rare, normal, common
**Status:** open, in_progress, completed, failed, cancelled
**Category:** bug_hunt, fortification, expedition, patrol, ritual, general

---

## ENVIRONMENT

```bash
HETZNER_SSH_HOST=
HETZNER_SSH_USER=root
COOLIFY_API_URL=https://coolify.mooreatelierz.com
COOLIFY_API_TOKEN=
N8N_URL=https://n8n.mooreatelierz.com
N8N_API_KEY=
MINIO_ENDPOINT=
MINIO_ACCESS_KEY=
MINIO_SECRET_KEY=
DATABASE_URL=postgresql://...
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

---

## GOTCHAS

- Coolify API token 30 günde bir yenilenmeli
- MinIO'da bucket policy değiştirmek tüm URL'leri etkiler
- PostgreSQL max_connections=100 — bağlantı havuzu kullan
- Docker prune çalıştırmadan önce aktif container'ları kontrol et
- Traefik cert store dolduğunda SSL yenileme durur
