# Currency Tracker

Uzbekistan bank exchange rates tracker with:

- `server/`: Express API, Prisma, scheduler, Telegram bot, bank scrapers
- `client/`: React + Vite admin panel
- `docker-compose.yml`: ready-to-run production-like stack

## Stack

- Backend: Node.js, Express, TypeScript, Prisma, PostgreSQL
- Frontend: React, Vite, TypeScript, Tailwind CSS, Recharts
- Jobs: `node-cron`
- Bot: Telegraf

## Project Structure

```text
currency-tracker/
|-- client/
|   |-- src/
|   |-- Dockerfile
|   `-- nginx.conf
|-- server/
|   |-- prisma/
|   |-- src/
|   |-- Dockerfile
|   `-- docker-entrypoint.sh
|-- .env.example
`-- docker-compose.yml
```

## Local Development

1. Copy env file:

```bash
cp .env.example .env
```

2. For local database usage, change `DATABASE_URL` in `.env` to use `localhost` instead of `postgres`.

3. Install dependencies:

```bash
cd server && npm install
cd ../client && npm install
```

4. Prepare database:

```bash
cd server
npm run db:generate
npm run db:push
npm run db:seed
```

5. Start services:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

## Docker Deployment

1. Copy env file:

```bash
cp .env.example .env
```

2. Fill these values in `.env`:

- `JWT_SECRET`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CLIENT_URL`
- `TELEGRAM_BOT_TOKEN` if you want the bot enabled

3. Start the stack:

```bash
docker compose up -d --build
```

4. Endpoints:

- Admin panel: `http://localhost:3000`
- API: `http://localhost:5000/api`
- Health: `http://localhost:3000/health`

The backend container waits for PostgreSQL, applies Prisma schema with `db push`, seeds the admin user and banks, then starts the server.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Minimum 32-character secret |
| `ADMIN_EMAIL` | Yes | Initial admin login |
| `ADMIN_PASSWORD` | Yes | Initial admin password |
| `CLIENT_URL` | Yes | Allowed frontend origin for CORS |
| `SCRAPE_INTERVAL` | No | Cron schedule for rate refresh |
| `TELEGRAM_BOT_TOKEN` | No | Enables Telegram bot when set |
| `TELEGRAM_WEBHOOK_URL` | No | Webhook URL for Telegram |

## Available API Routes

Public:

- `GET /api/rates`
- `GET /api/rates/:code`
- `GET /api/rates/history/:bankCode/:currency?days=30`

Protected:

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/admin/refresh`
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/banks`
- `PATCH /api/admin/banks/:id/toggle`
- `GET /api/admin/logs`
- `GET /api/admin/analytics`

## Notes

- Frontend production build is code-split and served by Nginx.
- `/api` and `/health` are proxied from Nginx to the backend container.
- Telegram bot is optional now; if token is missing, the API and admin panel still run.
- Seed is idempotent for admin and bank records.
