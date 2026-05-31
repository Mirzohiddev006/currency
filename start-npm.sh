#!/bin/bash

# Currency Tracker - To'liq ishga tushirish skripti (npm orqali)
# Server, Client (Admin Panel) va Webappni npm bilan ishga tushiradi
# Docker talab qilinmaydi

set -e

echo "🚀 Currency Tracker loyihasini npm orqali ishga tushirish..."

# Rangli chiqish uchun funksiyalar
success() { echo -e "\033[0;32m✓ $1\033[0m"; }
info() { echo -e "\033[0;34mℹ $1\033[0m"; }
error() { echo -e "\033[0;31m✗ $1\033[0m"; }
warning() { echo -e "\033[0;33m⚠ $1\033[0m"; }

# Node.js mavjudligini tekshirish
if ! command -v node &> /dev/null; then
    error "Node.js o'rnatilmagan! Iltimos, Node.js 18+ o'rnating."
    exit 1
fi

info "Node.js versiyasi: $(node --version)"

# .env faylini tekshirish
if [ ! -f .env ]; then
    info ".env fayli topilmadi, .env.example dan nusxa olinmoqda..."
    cp .env.example .env
    success ".env fayli yaratildi"
    warning "Iltimos, .env faylidagi JWT_SECRET va TELEGRAM_BOT_TOKEN qiymatlarini tekshiring!"
fi

# Mahalliy ishga tushirish uchun DATABASE_URL ni yangilash
sed -i 's|@postgres:5432|@localhost:5432|g' .env

# PostgreSQL mavjudligini tekshirish
if ! command -v psql &> /dev/null; then
    warning "PostgreSQL o'rnatilmagan! Avval PostgreSQL o'rnating va keyin qayta ishga tushiring."
    warning "Yoki Docker Compose dan foydalaning: docker compose up -d postgres"
fi

# Barcha paketlarni o'rnatish
info "Paketlarni o'rnatish..."

info "Server paketlarini o'rnatish..."
cd server
npm install
npm run db:generate
success "Server tayyor"

info "Client (Admin Panel) paketlarini o'rnatish..."
cd ../client
npm install
success "Client tayyor"

info "Webapp paketlarini o'rnatish..."
cd ../webapp
npm install
success "Webapp tayyor"

echo ""
success "Barcha paketlar o'rnatildi!"
echo ""
echo "📊 Keyingi qadamlar:"
echo ""
echo "1️⃣  PostgreSQL ma'lumotlar bazasini yarating:"
echo "   createdb currency_tracker"
echo ""
echo "2️⃣  Ma'lumotlar bazasini sozlang:"
echo "   cd server && npm run db:push && npm run db:seed"
echo ""
echo "3️⃣  Uchta terminal oynasida quyidagilarni ishga tushiring:"
echo ""
echo "   Terminal 1 (Server):"
echo "   cd server && npm run dev"
echo ""
echo "   Terminal 2 (Admin Panel):"
echo "   cd client && npm run dev"
echo ""
echo "   Terminal 3 (Webapp):"
echo "   cd webapp && npm run dev"
echo ""
echo "📊 Xizmatlar manzillari:"
echo "   ┌──────────────────────────────────────┐"
echo "   │ 🌐 Webapp (Foydalanuvchilar):        │"
echo "   │    http://localhost:5173             │"
echo "   ├──────────────────────────────────────┤"
echo "   │ 🔧 Admin Panel:                      │"
echo "   │    http://localhost:3000             │"
echo "   ├──────────────────────────────────────┤"
echo "   │ ⚙️  API Server:                       │"
echo "   │    http://localhost:5000/api         │"
echo "   └──────────────────────────────────────┘"
echo ""
success "Tayyorgarlik yakunlandi! 🎉"
