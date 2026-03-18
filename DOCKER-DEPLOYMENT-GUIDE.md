# FieldPulse Docker Deployment Guide

## Prerequisites

- **Docker** installed on the host machine ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose** (included with Docker Desktop; on Linux install separately)
- **Git** (for pulling updates)

---

## Production Deployment (Recommended)

Use the automated deployment script for production-ready setup:

### Initial Deployment

**Linux/macOS:**
```bash
./docker-deploy.sh start
```

**Windows:**
```bat
docker-deploy.bat start
```

### Update After Code Changes (Most Common)

When you pull changes from GitHub, use this **single command**:

**Linux/macOS:**
```bash
./docker-deploy.sh update
```

**Windows:**
```bat
docker-deploy.bat update
```

This will automatically:
1. Pull latest changes from git
2. Rebuild the Docker image with new code
3. Restart the container
4. Clean up old images

### Other Commands

```bash
./docker-deploy.sh status    # Check if running
./docker-deploy.sh logs      # View live logs
./docker-deploy.sh restart   # Restart container
./docker-deploy.sh stop      # Stop container
./docker-deploy.sh backup    # Backup data
./docker-deploy.sh help      # Show all commands
```

---

## Manual Deployment (Alternative)

If you prefer manual control:

### 1. Build and Run

```bash
docker compose up -d --build
```

This will:
- Build the Expo web app inside a container
- Start the Node.js sync server on port **3000**
- Persist all data in a Docker volume

### 2. Access the App

| Role         | URL                              |
|--------------|----------------------------------|
| **Admin**    | `http://localhost:3000`          |
| **Agents**   | `http://<HOST_IP>:3000`         |

### 3. Stop the Server

```bash
docker compose down
```

---

## Default Login Credentials

### Admin
- **Email**: `admin@fieldpulse.in`
- **Password**: `admin123`

### Field Agents (password: `agent123`)
- `arjun@fieldpulse.in` — Arjun Mehta
- `kavitha@fieldpulse.in` — Kavitha Nair
- `rohit@fieldpulse.in` — Rohit Verma

---

## Common Operations

### View Logs

```bash
# Live logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail 100
```

### Restart the Server

```bash
docker compose restart
```

### Rebuild After Code Changes

```bash
docker compose up -d --build
```

### Change the Port

Edit `docker-compose.yml` and change the ports mapping:

```yaml
ports:
  - "8080:3000"   # Access on port 8080 instead of 3000
```

Then restart:

```bash
docker compose up -d
```

---

## Data Persistence

All application data (`fieldpulse-data.json`) is stored in a **named Docker volume** called `fieldpulse-data`. This means:

- Data survives container restarts and rebuilds
- Data persists even if you run `docker compose down`
- Data is only removed if you explicitly delete the volume

### Backup Data

```bash
# Copy data file from container to host
docker cp fieldpulse-server:/app/data/fieldpulse-data.json ./backup-$(date +%Y%m%d).json
```

### Restore Data

```bash
# Copy a backup file into the container
docker cp ./backup-file.json fieldpulse-server:/app/data/fieldpulse-data.json

# Restart to load the restored data
docker compose restart
```

### Delete All Data (Reset)

```bash
docker compose down -v   # -v removes volumes
docker compose up -d --build
```

---

## Exposing to the Internet

### Option A: ngrok

```bash
# On the host machine (not inside the container)
ngrok http 3000
```

Share the generated HTTPS URL with field agents.

### Option B: Reverse Proxy (Nginx/Caddy)

For production, place a reverse proxy in front of the container:

```yaml
# Add to docker-compose.yml
services:
  caddy:
    image: caddy:2-alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy-data:/data
    depends_on:
      - fieldpulse

volumes:
  caddy-data:
```

Example `Caddyfile`:
```
your-domain.com {
    reverse_proxy fieldpulse:3000
}
```

---

## Deploying on a Remote Server

### 1. Copy project to the server

```bash
scp -r ./Marketing_app user@server-ip:/opt/fieldpulse
```

### 2. SSH into the server and start

```bash
ssh user@server-ip
cd /opt/fieldpulse
docker compose up -d --build
```

### 3. Open firewall port

```bash
# Ubuntu/Debian
sudo ufw allow 3000/tcp

# CentOS/RHEL
sudo firewall-cmd --add-port=3000/tcp --permanent
sudo firewall-cmd --reload
```

---

## Troubleshooting

### Container won't start

```bash
# Check container logs
docker compose logs fieldpulse

# Check container status
docker compose ps
```

### Port already in use

```bash
# Find what's using port 3000
lsof -i :3000    # macOS/Linux
netstat -ano | findstr :3000   # Windows

# Change the port in docker-compose.yml
```

### Rebuild from scratch

```bash
docker compose down -v
docker system prune -f
docker compose up -d --build
```

### Check container health

```bash
docker inspect --format='{{.State.Health.Status}}' fieldpulse-server
```

---

## Architecture

```
┌─────────────────────────────────────┐
│  Docker Container (fieldpulse)      │
│                                     │
│  Node.js 18-alpine                  │
│  ├── server.js (sync server)        │
│  ├── dist/ (Expo web build)         │
│  └── /app/data/ ← Docker Volume    │
│       └── fieldpulse-data.json      │
│                                     │
│  Port 3000 ─────────────────────────┼──→ Host Port 3000
└─────────────────────────────────────┘
```
