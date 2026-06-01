# Deploy qo'llanma — Vercel (frontend) + Render (backend)

Bitta repo, alohida repo SHART EMAS. Backend Render'da, frontend Vercel'da.

## 1. Avval push qiling
```bash
git add .
git commit -m "Add Swagger docs, multi-origin CORS, Vercel config"
git push
```
> Eslatma: backend kodi tayyor (tsc xatosiz). Push'dan keyin Render avtomatik qayta deploy bo'ladi va `swagger-ui-express`ni o'rnatadi.

## 2. Vercel'da frontend(lar)ni deploy qilish
[vercel.com](https://vercel.com) ga GitHub bilan kiring → **Add New → Project** → shu repo'ni **Import**.

Har bir frontend uchun ALOHIDA project oching:

| Project | Root Directory | Framework |
|---------|----------------|-----------|
| Admin panel | `client` | Vite |
| Public webapp | `webapp` | Vite |

Sozlamalar (Vercel o'zi aniqlaydi, tekshiring):
- Build Command: `npm run build`
- Output Directory: `dist`

**Environment Variable** (har bir project'da):
```
VITE_API_BASE_URL = https://currency-tracker-api.onrender.com/api
```
> Render'dagi backend'ning haqiqiy URL'ini Render dashboard'dan oling (yuqoridagi nom taxminiy).

**Deploy** bosing → Vercel sizga linkni beradi:
- Admin: `https://<sizning-admin-project>.vercel.app`
- Webapp: `https://<sizning-webapp-project>.vercel.app`

## 3. Backend CORS'ni Vercel domeniga ulang (MUHIM)
Vercel linklari tayyor bo'lgach, Render dashboard → `currency-tracker-api` → **Environment** → `CLIENT_URL` ni vergul bilan ajratib yangilang:
```
CLIENT_URL = https://<admin-project>.vercel.app,https://<webapp-project>.vercel.app
```
Saqlang → Render qayta deploy bo'ladi. (Kod allaqachon vergulli ro'yxatni qabul qiladi.)

Busiz Vercel'dagi frontend backend API'ga so'rov yubora olmaydi (CORS xatosi).

## 4. Swagger — admin panel API hujjatlari
Deploy'dan keyin:
- UI: `https://currency-tracker-api.onrender.com/api/docs`
- JSON: `https://currency-tracker-api.onrender.com/api/docs.json`

Admin endpoint'larni sinash: `POST /auth/login` orqali token oling → yuqoridagi **Authorize** tugmasiga token qo'ying.
