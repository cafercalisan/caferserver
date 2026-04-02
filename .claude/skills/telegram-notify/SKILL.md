---
name: telegram-notify
description: Use when sending any notification, alert, or report via Telegram. Triggers on notify, alert, bildir, send message, report completed.
---

# Telegram Notify Skill

## Send Message
```bash
send_telegram() {
  local text="$1"
  curl -s -X POST \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "{\"chat_id\": \"${TELEGRAM_CHAT_ID}\", \"text\": $(echo "$text" | jq -Rs .), \"parse_mode\": \"Markdown\"}" \
    | jq -r '.ok'
}
```

## Templates
- Success: send_telegram "OK: \`${DETAILS}\`"
- Warning: send_telegram "UYARI: \`${DETAILS}\`"
- Critical: send_telegram "KRITIK: ${DETAILS}"

## Gotchas
- Rate limit: 30 msg/sec per bot
- Max message: 4096 chars, truncate long logs
- Escape special Markdown chars: _ * [ ] ( ) ~ > # + - = | { } . !
