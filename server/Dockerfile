FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN npm run build

EXPOSE 5000

CMD ["sh", "./docker-entrypoint.sh"]
