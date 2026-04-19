# ----------- BUILD STAGE -----------
FROM node:22-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build


# ----------- PRODUCTION STAGE -----------
FROM node:22-slim

WORKDIR /app

ENV NODE_ENV=production

# Set hostname to localhost
ENV HOSTNAME="0.0.0.0"

# copy public folder and standalone build files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]