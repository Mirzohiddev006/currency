# Currency Tracker - To'liq Loyiha

O'zbekiston banklarining valyuta kurslarini kuzatuvchi tizim. Webapp, Admin Panel, API va Telegram Botni o'z ichiga oladi.

## 🚀 Tezkor Ishga Tushirish

### 1. Docker Compose orqali (Tavsiya etiladi)

```bash
# .env faylini sozlang (kerak bo'lsa)
cp .env.example .env

# Barcha servislarni ishga tushirish
docker compose up -d --build

# Loglarni ko'rish
docker compose logs -f
```

**Kirish manzillari:**
- Webapp (Foydalanuvchilar): http://localhost
- Admin Panel: http://localhost/admin
- API: http://localhost/api
- PostgreSQL: localhost:5432

### 2. Render.com ga joylashtirish

1. GitHub repongizni yarating va kodlarni yuklang
2. Render.com da yangi "Web Service" yarating
3. Repongizni ulang
4. Quyidagi environment variables ni sozlang:
   - `POSTGRES_DB` - baza nomi
   - `POSTGRES_USER` - foydalanuvchi
   - `POSTGRES_PASSWORD` - parol
   - `DATABASE_URL` - to'liq PostgreSQL URL (Render avtomatik beradi)
   - `JWT_SECRET` - maxfiy kalit (32+ belgi)
   - `TELEGRAM_BOT_TOKEN` - Telegram bot token (ixtiyoriy)
   - `ADMIN_EMAIL` - admin email
   - `ADMIN_PASSWORD` - admin parol

5. Deploy tugmasini bosing

## 📁 Loyiha Tuzilishi

```
/workspace
├── server/          # Backend API + Telegram Bot
├── client/          # Admin Panel
├── webapp/          # Foydalanuvchilar uchun Web App
├── Dockerfile       # Barchasini birlashtiruvchi multi-stage build
├── docker-compose.yml
└── .env             # Sozlamalar
```

## 🔧 Environment Variables

`.env` faylida quyidagi o'zgaruvchilar mavjud:

```env
POSTGRES_DB=currency_tracker
POSTGRES_USER=postgres
POSTGRES_PASSWORD=password
DATABASE_URL=postgresql://postgres:password@postgres:5432/currency_tracker
JWT_SECRET=change_this_to_a_long_random_secret_key_32_chars_min
TELEGRAM_BOT_TOKEN=your_bot_token_here
ADMIN_EMAIL=admin@currency.uz
ADMIN_PASSWORD=Admin@12345
```

## 🛠 Qo'shimcha Buyruqlar

```bash
# To'xtatish
docker compose down

# Loglarni ko'rish
docker compose logs -f app

# Bazaga ulanish
docker compose exec postgres psql -U postgres -d currency_tracker

# Qayta ishga tushirish
docker compose restart
```

## 🌐 Xususiyatlar

- ✅ Real-time valyuta kurslari (CBU dan avtomatik yuklanadi)
- ✅ Admin panel orqali boshqarish
- ✅ Telegram bot orqali bildirishnomalar
- ✅ Responsive web dizayn
- ✅ JWT autentifikatsiya
- ✅ Docker orqali oson deploy

## 📞 Support

Muammolar yuzaga kelsa, issue oching yoki dokumentatsiyani o'qing.
