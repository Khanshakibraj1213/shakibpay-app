const token = "8365542422:AAEdETBJTNiokHkpWicf6sZ3p1naFIz4mwM";
const url = "https://shakib-telecom-2-1.vercel.app/api/telegram-webhook";
fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${url}`).then(r => r.json()).then(console.log);
