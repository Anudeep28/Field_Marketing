#!/bin/bash
# ============================================================
# FieldPulse — Hostinger VPS First-Time Setup Script
# Run this once after SSH-ing into your fresh VPS:
#   bash hostinger-setup.sh
# ============================================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  FieldPulse VPS Setup — Hostinger KVM${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ── 1. Install Docker if not present ─────────────────────
if ! command -v docker &> /dev/null; then
  echo -e "${YELLOW}[1/5] Installing Docker...${NC}"
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo -e "${GREEN}      Docker installed.${NC}"
else
  echo -e "${GREEN}[1/5] Docker already installed — skipping.${NC}"
fi

# ── 2. Install Docker Compose plugin if not present ──────
if ! docker compose version &> /dev/null; then
  echo -e "${YELLOW}[2/5] Installing Docker Compose plugin...${NC}"
  apt-get install -y docker-compose-plugin
  echo -e "${GREEN}      Docker Compose installed.${NC}"
else
  echo -e "${GREEN}[2/5] Docker Compose already installed — skipping.${NC}"
fi

# ── 3. Create .env file ───────────────────────────────────
echo -e "${YELLOW}[3/5] Setting up environment variables...${NC}"

if [ -f ".env" ]; then
  echo -e "${YELLOW}      .env already exists — skipping creation.${NC}"
  echo -e "${YELLOW}      Edit it manually if you need to change the password.${NC}"
else
  # Generate a strong random password
  POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '/+=' | head -c 32)
  echo "POSTGRES_PASSWORD=${POSTGRES_PASSWORD}" > .env
  echo -e "${GREEN}      .env created with a generated password.${NC}"
  echo -e "${YELLOW}      Password saved to .env — keep this file safe!${NC}"
fi

# ── 4. Open port 80 in firewall (ufw) ─────────────────────
echo -e "${YELLOW}[4/5] Configuring firewall...${NC}"
if command -v ufw &> /dev/null; then
  ufw allow 22/tcp   > /dev/null 2>&1 || true
  ufw allow 80/tcp   > /dev/null 2>&1 || true
  ufw --force enable > /dev/null 2>&1 || true
  echo -e "${GREEN}      Firewall: port 22 (SSH) and 80 (HTTP) open.${NC}"
else
  echo -e "${YELLOW}      ufw not found — skipping firewall setup.${NC}"
fi

# ── 5. Build and start the app ────────────────────────────
echo -e "${YELLOW}[5/5] Building and starting FieldPulse...${NC}"
echo -e "${YELLOW}      (First build takes 5–10 minutes — installing Node deps and building the web app)${NC}"
echo ""
docker compose up -d --build

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  FieldPulse is up!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# Detect the public IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo -e "  App URL:  ${GREEN}http://${PUBLIC_IP}${NC}"
echo -e "  Share this URL with your field agents."
echo ""
echo -e "  Useful commands:"
echo -e "    View logs:    ${YELLOW}docker compose logs -f${NC}"
echo -e "    Restart app:  ${YELLOW}docker compose restart fieldpulse${NC}"
echo -e "    Stop all:     ${YELLOW}docker compose down${NC}"
echo -e "    Update app:   ${YELLOW}git pull && docker compose up -d --build${NC}"
echo ""
