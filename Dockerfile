FROM node:22-slim

# Bibliotecas de sistema exigidas pelo binário headless do Chromium
# (@sparticuz/chromium) em runtime, além do libssl exigido pela engine do Prisma.
RUN apt-get update && apt-get install -y --no-install-recommends \
  ca-certificates \
  openssl \
  libnspr4 \
  libnss3 \
  libdbus-1-3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libcairo2 \
  libx11-6 \
  libxcb1 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3333

CMD ["node", "dist/server.cjs"]
