# ============================================================
# FieldPulse Marketing Visits App - Docker Build
# Multi-stage: Build Expo web app, then serve with Node.js
# ============================================================

# ── Stage 1: Build the Expo web app ─────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependency files first (for better Docker layer caching)
COPY package.json package-lock.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the Expo web app into /app/dist
RUN npx expo export --platform web

# ── Stage 2: Production runtime ─────────────────────────────
FROM node:18-alpine AS production

WORKDIR /app

# Only need the server and the built static files
COPY server.js ./
COPY --from=builder /app/dist ./dist

# Create a directory for persistent data with proper permissions
RUN mkdir -p /app/data && chown -R node:node /app/data

ENV NODE_ENV=production
ENV PORT=3000

# Run as non-root user for security
USER node

EXPOSE 3000

# Health check to verify the server is running
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
