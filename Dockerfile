# Dockerfile

# --- Stage 1: Build ---
FROM node:23-alpine3.20 AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Runtime ---
FROM node:23-alpine3.20
WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev

# Only copy built files
COPY --from=build /app/dist ./dist

CMD ["node", "dist/index.js"]