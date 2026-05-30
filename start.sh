#!/bin/bash

# Currency Tracker - To'liq ishga tushirish skripti
# Server, Client (Admin Panel) va Webappni bir martada ishga tushiradi

set -e

echo "🚀 Currency Tracker loyihasini ishga tushirish..."

# Rangli chiqish uchun funksiyalar
success() { echo -e "\033[0;32m✓ $1\033[0m"; }
info() { echo -e "\033[0;34mℹ $1\033[0m"; }
error() { echo -e "\033[0;31m✗ $1\033[0m"; }
warning() { echo -e "\033[0;33m⚠ $1\033[0m"; }

# .env faylini tekshirish
if [ ! -f .env ]; then
    info ".env fayli topilmadi, .env.example dan nusxa olinmoqda..."
    cp .env.example .env
    success ".env fayli yaratildi"
    warning "Iltimos, .env faylidagi JWT_SECRET va TELEGRAM_BOT_TOKEN qiymatlarini tekshiring!"
fi

# Docker mavjudligini tekshirish
if ! command -v docker &> /dev/null; then
    error "Docker o'rnatilmagan! Iltimos, Docker Desktop yoki Docker CE o'rnating."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    error "Docker Compose o'rnatilmagan!"
    exit 1
fi

# Docker Compose buyrug'ini aniqlash
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

info "Barcha kerakli xizmatlarni o'rnatish va ishga tushirish..."

# Barcha xizmatlarni build qilish va ishga tushirish
$DOCKER_COMPOSE up -d --build

echo ""
success "Barcha xizmatlar muvaffaqiyatli ishga tushdi!"
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
echo "   ├──────────────────────────────────────┤"
echo "   │ 🐘 PostgreSQL:                       │"
echo "   │    localhost:5432                    │"
echo "   └──────────────────────────────────────┘"
echo ""
info "Loglarni kuzatish uchun: $DOCKER_COMPOSE logs -f"
info "Xizmatlarni to'xtatish uchun: $DOCKER_COMPOSE down"
echo ""
success "Loyiha ishga tayyor! 🎉"
