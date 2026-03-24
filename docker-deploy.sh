#!/bin/bash

# ============================================================
# FieldPulse Marketing App - Docker Deployment Script
# Auto-restart enabled | 24/7 production deployment
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="fieldpulse-marketing"
CONTAINER_NAME="fieldpulse-marketing"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() { echo -e "\n${BLUE}══════════════════════════════════════${NC}\n${BLUE}  $1${NC}\n${BLUE}══════════════════════════════════════${NC}"; }
print_ok()     { echo -e "${GREEN}  ✓ $1${NC}"; }
print_err()    { echo -e "${RED}  ✗ $1${NC}"; }
print_info()   { echo -e "${YELLOW}  → $1${NC}"; }

get_lan_ip() {
    hostname -I 2>/dev/null | awk '{print $1}' || \
    ipconfig getifaddr en0 2>/dev/null || \
    echo "<YOUR_IP>"
}

# ── Preflight checks ────────────────────────────────────────
check_prerequisites() {
    if ! command -v docker &>/dev/null; then
        print_err "Docker is not installed! Install from https://docs.docker.com/get-docker/"
        exit 1
    fi
    if ! docker info &>/dev/null; then
        print_err "Docker is not running! Start Docker Desktop and try again."
        exit 1
    fi
    if ! docker compose version &>/dev/null; then
        print_err "Docker Compose not available! Update Docker Desktop."
        exit 1
    fi
    print_ok "Docker & Compose ready"
}

# ── COMMAND: start ───────────────────────────────────────────
cmd_start() {
    print_header "First-Time Deployment"
    check_prerequisites

    print_info "Building image and starting container..."
    docker compose up -d --build

    echo ""
    print_ok "Deployment complete! Container will auto-restart 24/7."
    echo ""
    echo "  Admin:  http://localhost:3000"
    echo "  Agents: http://$(get_lan_ip):3000"
    echo ""
    echo "  Logs:   ./docker-deploy.sh logs"
    echo "  Status: ./docker-deploy.sh status"
}

# ── COMMAND: update (pull from GitHub + rebuild) ─────────────
cmd_update() {
    print_header "Update from GitHub"
    check_prerequisites

    if [ -d ".git" ]; then
        print_info "Pulling latest changes..."

        # Stash local changes if any
        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
            print_info "Stashing local changes..."
            git stash
        fi

        if git pull; then
            print_ok "Code pulled successfully"
        else
            print_err "git pull failed"
            exit 1
        fi
    else
        print_err "Not a git repository. Clone the repo first."
        exit 1
    fi

    print_info "Rebuilding image (no cache)..."
    docker compose build --no-cache

    print_info "Restarting with new image..."
    docker compose up -d

    print_info "Cleaning up old images..."
    docker image prune -f

    echo ""
    print_ok "Update complete! Running at http://localhost:3000"
}

# ── COMMAND: stop ────────────────────────────────────────────
cmd_stop() {
    print_header "Stopping Containers"
    docker compose down
    print_ok "Stopped"
}

# ── COMMAND: restart ─────────────────────────────────────────
cmd_restart() {
    print_header "Restarting Containers"
    docker compose restart
    print_ok "Restarted"
}

# ── COMMAND: logs ────────────────────────────────────────────
cmd_logs() {
    docker compose logs -f --tail=100
}

# ── COMMAND: status ──────────────────────────────────────────
cmd_status() {
    print_header "Deployment Status"
    docker compose ps
    echo ""

    if docker compose ps | grep -q "Up\|running"; then
        print_ok "$APP_NAME is running (auto-restart: always)"
        echo ""
        echo "  URL:    http://localhost:3000"
        echo "  Health: $(docker inspect --format='{{.State.Health.Status}}' $CONTAINER_NAME 2>/dev/null || echo 'N/A')"
        echo "  Uptime: $(docker inspect --format='{{.State.StartedAt}}' $CONTAINER_NAME 2>/dev/null | cut -d'.' -f1 || echo 'N/A')"
    else
        print_err "$APP_NAME is NOT running"
        echo "  Start with: ./docker-deploy.sh start"
    fi
}

# ── COMMAND: backup ──────────────────────────────────────────
cmd_backup() {
    print_header "Backing Up Data"
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).json"

    if docker compose ps | grep -q "Up\|running"; then
        docker cp $CONTAINER_NAME:/app/data/fieldpulse-data.json "./$BACKUP_FILE" 2>/dev/null || \
        docker cp $CONTAINER_NAME:/app/fieldpulse-data.json "./$BACKUP_FILE" 2>/dev/null

        if [ -f "$BACKUP_FILE" ]; then
            print_ok "Backup saved: $BACKUP_FILE"
        else
            print_err "No data file found in container yet"
        fi
    else
        print_err "Container not running. Start first: ./docker-deploy.sh start"
    fi
}

# ── COMMAND: help ────────────────────────────────────────────
cmd_help() {
    echo ""
    echo "  FieldPulse Marketing App - Docker Deploy"
    echo ""
    echo "  Usage: ./docker-deploy.sh <command>"
    echo ""
    echo "  Commands:"
    echo "    start     First-time build & deploy (auto-restart enabled)"
    echo "    update    Pull latest from GitHub, rebuild & restart"
    echo "    stop      Stop containers"
    echo "    restart   Restart containers"
    echo "    logs      Tail container logs"
    echo "    status    Show running status, health & uptime"
    echo "    backup    Export data file from container"
    echo "    help      Show this message"
    echo ""
    echo "  Typical workflow:"
    echo "    1. First deploy:   ./docker-deploy.sh start"
    echo "    2. After git push: ./docker-deploy.sh update"
    echo ""
}

# ── Main dispatcher ──────────────────────────────────────────
case "${1:-help}" in
    start)   cmd_start   ;;
    update)  cmd_update  ;;
    stop)    cmd_stop    ;;
    restart) cmd_restart ;;
    logs)    cmd_logs    ;;
    status)  cmd_status  ;;
    backup)  cmd_backup  ;;
    help|--help|-h) cmd_help ;;
    *)
        print_err "Unknown command: $1"
        cmd_help
        exit 1
        ;;
esac
