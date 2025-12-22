# PrintLux-Dynamic
Веб-приложение

# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## Настройка Telegram Webhook для локальной разработки (ngrok)

Чтобы перенаправить запросы от Telegram на ваш локальный сервер, запущенный через ngrok, используйте следующую команду.

**Важно:** Перед выполнением убедитесь, что ваш ngrok запущен и вы заменили плейсхолдеры (`<... >`) на ваши актуальные значения.

```bash
# Команда для установки Webhook с секретным токеном
curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" \
     --form "url=<YOUR_NGROK_URL>/api/telegram" \
     --form "secret_token=<YOUR_TELEGRAM_SECRET_TOKEN>"
```

### Где взять значения:

1.  **`<YOUR_TELEGRAM_BOT_TOKEN>`**: Ваш токен, полученный от @BotFather. Он хранится в переменных окружения как `TELEGRAM_BOT_TOKEN`.
2.  **`<YOUR_NGROK_URL>`**: Ваш уникальный URL от ngrok (например, `https://abcdef1234.ngrok-free.dev`).
3.  **`<YOUR_TELEGRAM_SECRET_TOKEN>`**: Ваш секретный токен для верификации запросов. Он хранится в переменных окружения как `TELEGRAM_SECRET_TOKEN`.

**Пример заполненной команды:**

```bash
# ПРИМЕР, НЕ ИСПОЛЬЗУЙТЕ ЕГО НАПРЯМУЮ
curl "https://api.telegram.org/bot7248210692:AAFOuF4tyXAtLciy60rmDqIvp7djWgKa5tw/setWebhook" \
     --form "url=https://unrotative-unappreciated-diane.ngrok-free.dev/api/telegram" \
     --form "secret_token=a3e9f8b2-c1d4-4e5f-9a6d-7b8c9d0e1f2a-TelegaBot"
```
