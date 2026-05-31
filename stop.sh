#!/bin/bash

# Currency Tracker - Xizmatlarni to'xtatish skripti

set -e

echo "🛑 Currency Tracker xizmatlarini to'xtatish..."

# Docker Compose buyrug'ini aniqlash
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

$DOCKER_COMPOSE down

echo ""
echo "✓ Barcha xizmatlar to'xtatildi!"
echo "ℹ Ma'lumotlarni saqlab qolish uchun: $DOCKER_COMPOSE down (volumes o'chirilmaydi)"
echo "ℹ Hamma narsani tozalash uchun: $DOCKER_COMPOSE down -v"
