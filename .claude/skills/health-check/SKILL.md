---
name: health-check
description: Use when checking if sites or services are up. Triggers on uptime check, health check, site down, is X running, smoke test.
---

# Health Check Skill

## HTTP Check
```bash
check_url() {
  local url="$1"
  local expected="${2:-200}"
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
  RESPONSE_MS=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$url" | awk '{printf "%.0f", $1*1000}')
  if [[ "$HTTP_CODE" == "$expected" ]]; then
    echo "OK: $url HTTP $HTTP_CODE (${RESPONSE_MS}ms)"; return 0
  else
    echo "FAIL: $url HTTP $HTTP_CODE (expected $expected)"; return 1
  fi
}
```

## Site Registry
- cafercalisan.com
- calisyanyapi.com
- hoteleurodiamond.com
- eurodiamondhotel.com

## Gotchas
- Use /healthz endpoint not / (lighter)
- SSL cert error = site down
- max-time 10s prevents false positives on slow networks
