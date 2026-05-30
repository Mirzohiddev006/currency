# 🚀 Deploy Qo'llanmasi

## 1. Render.com da Joylashtirish (Tavsiya etiladi)

### Nima uchun Render?
- ✅ Bepul PostgreSQL bazasi
- ✅ Docker orqali avtomatik deploy
- ✅ Doimiy ishlaydi (bot uxlamaydi)
- ✅ HTTPS avtomatik
- ✅ Bitta repoda barcha narsalar

### Qadamlar:

#### 1. GitHub ga Yuklang
```bash
git add .
git commit -m "Production ready"
git push origin main
```

#### 2. Render da Database Yarating
1. https://render.com da ro'yxatdan o'ting
2. "New +" → "PostgreSQL"
3. Nomini kiriting (masalan: `currency-tracker-db`)
4. Bepul tarifni tanlang
5. "Create Database" tugmasini bosing
6. **Internal Database URL** ni nusxalab oling (masalan: `postgresql://user:pass@host:5432/dbname`)

#### 3. Web Service Yarating
1. "New +" → "Web Service"
2. GitHub repongizni ulang
3. Sozlamalar:
   - **Name**: `currency-tracker`
   - **Region**: O'zingizga yaqin joylashuvni tanlang
   - **Branch**: `main`
   - **Root Directory**: (bo'sh qoldiring)
   - **Runtime**: `Docker`
   - **Build Command**: (bo'sh qoldiring)
   - **Start Command**: (bo'sh qoldiring)
   - **Instance Type**: Free

4. **Environment Variables** qo'shing:
   ```
   POSTGRES_DB=currency_tracker
   POSTGRES_USER=<database-user>
   POSTGRES_PASSWORD=<database-password>
   DATABASE_URL=<Render-dan-olgan-URL-ingiz>
   JWT_SECRET=random_uzun_maxfiy_kalit_32_belgidan_ko'p
   TELEGRAM_BOT_TOKEN=<bot-token-ingiz>
   ADMIN_EMAIL=admin@currency.uz
   ADMIN_PASSWORD=SizningParolingiz123!
   NODE_ENV=production
   PORT=5000
   ```

5. "Create Web Service" tugmasini bosing

#### 4. Tayyor!
Deploy 5-10 daqiqa davom etadi. Keyin quyidagi manzillarda kirishingiz mumkin:
- Webapp: `https://currency-tracker.onrender.com`
- Admin Panel: `https://currency-tracker.onrender.com/admin`
- API: `https://currency-tracker.onrender.com/api`

---

## 2. Railway.app da Joylashtirish

### Qadamlar:
1. https://railway.app da ro'yxatdan o'ting
2. "New Project" → "Deploy from GitHub repo"
3. Repongizni tanlang
4. "Variables" bo'limida `.env` faylingizdagi barcha o'zgaruvchilarni qo'shing
5. Railway avtomatik aniqlaydi va deploy qiladi

---

## 3. VPS (Masalan, DigitalOcean, Hetzner)

### Qadamlar:
```bash
# Serverga ulaning
ssh root@your-server-ip

# Docker o'rnating
curl -fsSL https://get.docker.com | sh

# Loyihani yuklang
git clone <repo-url>
cd currency-tracker

# .env faylini sozlang
cp .env.example .env
nano .env  # Kerakli qiymatlarni kiriting

# Ishga tushiring
docker compose up -d --build
```

---

## ⚠️ Muhim Eslatmalar

### Xavfsizlik
1. `JWT_SECRET` ni har doim uzun va tasodifiy qiling
2. Admin parolni o'zgartiring
3. Telegram bot tokenini maxfiy saqlang

### Monitoring
- Render dashboard'da loglarni ko'ring
- Bot ishlamasligi uchun `TELEGRAM_BOT_TOKEN` to'g'riligini tekshiring

### Muammolar
Agar deploy xatolik bersa:
1. Loglarni tekshiring
2. Environment variables to'g'riligini tasdiqlang
3. Database ulanish URL ini tekshiring

---

## 📞 Yordam

Muammolar yuzaga kelsa:
- GitHub Issues oching
- Render support ga murojaat qiling
- Dokumentatsiyani qayta o'qing
