---
name: docker-ops
description: Use for Docker container management, cleanup, and monitoring. Triggers on docker, container, image, prune, volume operations.
---

# Docker Ops Skill

## Status
```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

## Safe Cleanup
```bash
# Only removes stopped containers and dangling images older than 30 days
docker system prune -f --filter "until=720h"
docker image prune -f --filter "until=168h"
# NEVER: docker system prune -a (removes all unused images including stopped apps)
```

## Gotchas
- Always run docker ps before prune to see active containers
- docker system prune -a removes ALL unused images, can break rollback
- Volume data persists after container removal, clean separately with care
- Check docker stats before restart to confirm resource issue
