# 🚀 Currency Tracker - To'liq ishga tushirish

Loyihani bir buyruq bilan ishga tushiring:

```bash
./start.sh
```

## Xizmatlar manzillari

- **🌐 Webapp (Foydalanuvchilar):** http://localhost:5173
- **🔧 Admin Panel:** http://localhost:3000
- **⚙️ API Server:** http://localhost:5000/api
- **🐘 PostgreSQL:** localhost:5432

## Qo'shimcha buyruqlar

### Loglarni ko'rish
```bash
docker compose logs -f
```

### Xizmatlarni to'xtatish
```bash
./stop.sh
```

### Hamma narsani tozalash (ma'lumotlar bilan)
```bash
docker compose down -v
```

## Talablar

- Docker (20.10+)
- Docker Compose (v2.0+)

## Konfiguratsiya

`.env` fayli avtomatik yaratiladi (agar mavjud bo'lmasa). Quyidagi qiymatlarni tekshiring:

- `JWT_SECRET` - kamida 32 belgi
- `TELEGRAM_BOT_TOKEN` - Telegram bot uchun (ixtiyoriy)
- `ADMIN_EMAIL` va `ADMIN_PASSWORD` - admin panel uchun

## Muammolarni hal qilish

Agar xizmatlar ishga tushmasa:

1. Docker ishlab turganini tekshiring: `docker ps`
2. Portlar band emasligini tekshiring: `netstat -tlnp | grep -E '5000|3000|5173'`
3. Loglarni ko'ring: `docker compose logs server`
