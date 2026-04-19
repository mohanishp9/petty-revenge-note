# ----------- BUILD STAGE -----------
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build


# ----------- PRODUCTION STAGE -----------
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# copy compiled code only
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/server.js"]