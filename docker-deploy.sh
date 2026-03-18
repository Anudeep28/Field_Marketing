#!/bin/bash

# ============================================================
# FieldPulse Docker Deployment Script
# Production-ready deployment automation
# ============================================================

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed!"
        echo "Please install Docker from https://docs.docker.com/get-docker/"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running!"
        echo "Please start Docker Desktop and try again."
        exit 1
    fi
    
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not available!"
        echo "Please install Docker Compose or update Docker Desktop."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Initial deployment
deploy_initial() {
    print_header "Initial Deployment"
    
    check_docker
    check_docker_compose
    
    print_info "Building and starting FieldPulse..."
    docker compose up -d --build
    
    echo ""
    print_success "Deployment complete!"
    echo ""
    echo "Access the application at:"
    echo "  Admin:  http://localhost:3000"
    echo "  Agents: http://$(hostname -I | awk '{print $1}' 2>/dev/null || echo '<YOUR_IP>'):3000"
    echo ""
    echo "View logs with: ./docker-deploy.sh logs"
}

# Update deployment (pull changes + rebuild)
deploy_update() {
    print_header "Updating Deployment"
    
    check_docker
    check_docker_compose
    
    # Check if git repository
    if [ -d ".git" ]; then
        print_info "Pulling latest changes from repository..."
        
        # Stash any local changes
        if ! git diff-index --quiet HEAD --; then
            print_info "Stashing local changes..."
            git stash
        fi
        
        # Pull latest changes
        git pull
        
        if [ $? -eq 0 ]; then
            print_success "Code updated successfully"
        else
            print_error "Failed to pull changes"
            exit 1
        fi
    else
        print_info "Not a git repository, skipping pull..."
    fi
    
    print_info "Rebuilding Docker image..."
    docker compose build --no-cache
    
    print_info "Restarting container with new image..."
    docker compose up -d
    
    print_info "Cleaning up old images..."
    docker image prune -f
    
    echo ""
    print_success "Update complete!"
    echo ""
    echo "Application is running at http://localhost:3000"
    echo "View logs with: ./docker-deploy.sh logs"
}

# Stop deployment
deploy_stop() {
    print_header "Stopping Deployment"
    
    print_info "Stopping containers..."
    docker compose down
    
    print_success "Containers stopped"
}

# Restart deployment
deploy_restart() {
    print_header "Restarting Deployment"
    
    print_info "Restarting containers..."
    docker compose restart
    
    print_success "Containers restarted"
}

# View logs
deploy_logs() {
    print_header "Container Logs"
    
    docker compose logs -f --tail=100
}

# Check status
deploy_status() {
    print_header "Deployment Status"
    
    docker compose ps
    
    echo ""
    if docker compose ps | grep -q "Up"; then
        print_success "FieldPulse is running"
        echo ""
        echo "Access at: http://localhost:3000"
    else
        print_error "FieldPulse is not running"
        echo ""
        echo "Start with: ./docker-deploy.sh start"
    fi
}

# Backup data
deploy_backup() {
    print_header "Backing Up Data"
    
    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).json"
    
    print_info "Creating backup: $BACKUP_FILE"
    
    if docker compose ps | grep -q "Up"; then
        docker cp fieldpulse-server:/app/data/fieldpulse-data.json "./$BACKUP_FILE" 2>/dev/null || \
        docker cp fieldpulse-server:/app/fieldpulse-data.json "./$BACKUP_FILE"
        
        if [ -f "$BACKUP_FILE" ]; then
            print_success "Backup created: $BACKUP_FILE"
        else
            print_error "Backup failed - container may not have data yet"
        fi
    else
        print_error "Container is not running. Start it first with: ./docker-deploy.sh start"
    fi
}

# Show help
show_help() {
    echo "FieldPulse Docker Deployment Script"
    echo ""
    echo "Usage: ./docker-deploy.sh [command]"
    echo ""
    echo "Commands:"
    echo "  start      - Initial deployment (build and start)"
    echo "  update     - Pull changes from git and rebuild (USE THIS FOR UPDATES)"
    echo "  stop       - Stop the containers"
    echo "  restart    - Restart the containers"
    echo "  logs       - View container logs"
    echo "  status     - Check deployment status"
    echo "  backup     - Backup application data"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./docker-deploy.sh start      # First time deployment"
    echo "  ./docker-deploy.sh update     # Update after git pull"
    echo "  ./docker-deploy.sh logs       # View logs"
}

# Main script logic
case "${1:-help}" in
    start)
        deploy_initial
        ;;
    update)
        deploy_update
        ;;
    stop)
        deploy_stop
        ;;
    restart)
        deploy_restart
        ;;
    logs)
        deploy_logs
        ;;
    status)
        deploy_status
        ;;
    backup)
        deploy_backup
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
