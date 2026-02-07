# PrintLux-Dynamic
Веб-приложение +

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



### Пример заполненной команды для вашей текущей сессии:


```
#  curl -F "url=https://remontprintlux.by/api/telegram" -F "secret_token=a3e9f8b2-c1d4-4e5f-9a6d-7b8c9d0e1f2a-TelegaBot" "https://api.telegram.org/bot7248210692:AAFOuF4tyXAtLciy60rmDqIvp7djWgKa5tw/setWebhook"