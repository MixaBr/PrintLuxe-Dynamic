# PrintLux-Dynamic
Веб-приложение

# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

---

## Настройка Telegram Webhook для локальной разработки (ngrok)

Чтобы перенаправить запросы от Telegram на ваш локальный сервер, запущенный через ngrok, используйте следующую команду.

**Важно:** Перед выполнением убедитесь, что ваш ngrok запущен и вы заменили плейсхолдеры (`<... >`) на ваши актуальные значения.

### Команда для установки Webhook

```bash
# Скопируйте эту команду, вставьте ваши токены и выполните
curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" \
     --form "url=<YOUR_NGROK_URL>/api/telegram" \
     --form "secret_token=<YOUR_TELEGRAM_SECRET_TOKEN>"
```

### Где взять значения:

1.  **`<YOUR_TELEGRAM_BOT_TOKEN>`**: Ваш токен, полученный от @BotFather. Он хранится в переменных окружения как `TELEGRAM_BOT_TOKEN`.
2.  **`<YOUR_NGROK_URL>`**: Ваш уникальный URL от ngrok. Судя по вашему скриншоту, ваш текущий URL: `https://unrotative-unappreciated-diane.ngrok-free.dev`.
3.  **`<YOUR_TELEGRAM_SECRET_TOKEN>`**: Ваш секретный токен для верификации запросов. Он хранится в переменных окружения как `TELEGRAM_SECRET_TOKEN`.

### Пример заполненной команды для вашей текущей сессии:

```bash
# ЭТО ПРИМЕР! ЗАМЕНИТЕ ПЛЕЙСХОЛДЕРЫ ВАШИМИ РЕАЛЬНЫМИ ТОКЕНАМИ
curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" \
     --form "url=https://unrotative-unappreciated-diane.ngrok-free.dev/api/telegram" \
     --form "secret_token=<YOUR_TELEGRAM_SECRET_TOKEN>"
```
