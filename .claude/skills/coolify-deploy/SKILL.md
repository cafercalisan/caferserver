---
name: coolify-deploy
description: Use when deploying any application to Coolify PaaS. Triggers on deploy, publish, release, production push. Handles Coolify API calls, deployment monitoring, and smoke testing.
---

# Coolify Deploy Skill

## API Pattern
```bash
BASE=$COOLIFY_API_URL/api/v1
AUTH="Authorization: Bearer $COOLIFY_API_TOKEN"

# List apps
curl -s -H "$AUTH" $BASE/applications | jq '.[] | {id, name, status}'

# Trigger deploy
curl -s -X POST -H "$AUTH" $BASE/applications/$APP_ID/deploy

# Monitor (poll every 10s, max 5min)
for i in {1..30}; do
  STATUS=$(curl -s -H "$AUTH" $BASE/applications/$APP_ID | jq -r '.status')
  case $STATUS in
    running)   echo "Deploy OK"; break ;;
    failed)    echo "Deploy FAILED"; exit 1 ;;
    deploying) echo "Deploying... ($i/30)"; sleep 10 ;;
    *)         echo "Status: $STATUS"; sleep 10 ;;
  esac
done
```

## Gotchas
- Coolify token expires every 30 days, check before deploy
- status field values: running, stopped, exited, failed, deploying
- After deploy, wait 5s before smoke test for container startup
- Find APP_ID by name: jq '.[] | select(.name == "app-name") | .id'
