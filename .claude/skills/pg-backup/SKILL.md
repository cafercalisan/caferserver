---
name: pg-backup
description: Use when taking PostgreSQL backups before any destructive operation, migration, or on schedule. Triggers on backup, yedek al, before delete, before migrate.
---

# PostgreSQL Backup Skill

## Backup + Upload
```bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
FILE="pg_backup_${TIMESTAMP}.sql.gz"

pg_dump $DATABASE_URL | gzip > /tmp/$FILE
sha256sum /tmp/$FILE > /tmp/${FILE}.sha256
mc cp /tmp/$FILE local/backups/postgresql/$FILE
mc cp /tmp/${FILE}.sha256 local/backups/postgresql/${FILE}.sha256

echo "Backup: $FILE ($(du -sh /tmp/$FILE | cut -f1))"
```

## Verify
```bash
# Download and verify checksum
mc cp local/backups/postgresql/$FILE /tmp/verify_$FILE
sha256sum -c /tmp/${FILE}.sha256 && echo "Checksum OK" || echo "CHECKSUM FAIL"
```

## Gotchas
- Always backup BEFORE any migration or delete operation
- Verify checksum after upload, not just upload success
- Retention: keep 7 daily, 4 weekly, 3 monthly
