#!/bin/bash

# ==============================================================================
# 🚀 Reidius Infra VPS Deployment Script
# Description: Automates git pull, PM2 python server management, and Nginx reverse proxy
# Usage on VPS: chmod +x deploy.sh && ./deploy.sh
# ==============================================================================

# Exit immediately if a command exits with a non-zero status
set -e

# --- Configuration ---
# Dynamically detect the folder the script is running in (prevents hardcoded path errors)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_NAME="ri-replica"
PORT="8787"
# Configure both .com and .in domains as defaults
DOMAIN="reidiusinfra.com www.reidiusinfra.com reidiusinfra.in www.reidiusinfra.in"

# --- Color Definitions for logs ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0;m' # No Color

log_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

# --- Step 1: Verification and Setup ---
log_info "Starting deployment sequence..."
log_info "Project Directory detected as: $PROJECT_DIR"

if [ "$EUID" -ne 0 ]; then
    log_warning "This script is running without root privileges. Nginx configurations may fail if you are not root."
fi

cd "$PROJECT_DIR"

# Check if git is initialized
if [ ! -d ".git" ]; then
    log_error "This directory is not a git repository. Please clone it first following Phase 1."
    exit 1
fi

# --- Step 2: Fetch and Pull Latest Changes ---
log_info "Fetching latest updates from GitHub..."
git fetch origin main
git reset --hard origin/main
log_success "Repository successfully updated with latest changes."

# --- Step 3: PM2 Continuous Running Setup ---
log_info "Configuring PM2 server instance..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    log_warning "PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Check if application is already running in PM2
if pm2 list | grep -q "$APP_NAME"; then
    log_info "Application is already running. Restarting PM2 process..."
    PORT=$PORT pm2 restart "$APP_NAME"
else
    log_info "Launching new application process with PM2..."
    PORT=$PORT pm2 start serve.py --name "$APP_NAME" --interpreter python3
fi

pm2 save
log_success "PM2 configuration completed. App is running in the background."

# --- Step 4: Nginx Reverse Proxy Setup ---
log_info "Configuring Nginx reverse proxy..."

if ! command -v nginx &> /dev/null; then
    log_warning "Nginx is not installed. Installing Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# Ask if user wants to update Nginx configuration
read -p "Do you want to configure/update Nginx reverse proxy for these domains? (y/N): " configure_nginx

if [[ "$configure_nginx" =~ ^[Yy]$ ]]; then
    read -p "Use pre-configured domains ($DOMAIN)? (Y/n): " use_default_domain
    if [[ "$use_default_domain" =~ ^[Nn]$ ]]; then
        read -p "Enter your custom domain list (space-separated): " CUSTOM_DOMAINS
        if [ -n "$CUSTOM_DOMAINS" ]; then
            DOMAIN=$CUSTOM_DOMAINS
        fi
    fi

    NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
    NGINX_LINK="/etc/nginx/sites-enabled/$APP_NAME"

    log_info "Creating Nginx configuration block for domains: $DOMAIN"
    
    cat << EOF > "$NGINX_CONF"
server {
    listen 80;
    server_name $DOMAIN;

    # Allow custom ranges used by Framer CMS chunks
    proxy_set_header Range \$http_range;
    proxy_set_header If-Range \$http_if_range;

    location /firebase-storage/ {
        # Extract raw suffix from \$request_uri to preserve %2F encoding
        if (\$request_uri ~* "^/firebase-storage/(.*)$") {
            set \$raw_suffix \$1;
        }

        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;

        proxy_pass https://firebasestorage.googleapis.com/v0/b/ri-website-c476b.firebasestorage.app/\$raw_suffix;
        proxy_set_header Host firebasestorage.googleapis.com;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        # Cache control for Cloudflare CDN to cache images aggressively
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        proxy_pass http://127.0.0.1:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

    # Enable the site configuration
    ln -sf "$NGINX_CONF" "$NGINX_LINK"

    log_info "Testing Nginx syntax..."
    nginx -t

    log_info "Restarting Nginx to apply reverse proxy..."
    systemctl restart nginx
    log_success "Nginx successfully configured!"
else
    log_info "Skipping Nginx configuration."
fi

# --- Step 5: Certbot SSL Setup Reminder ---
log_info "Checking SSL Certificate status..."

# Build certbot command dynamically
CERTBOT_ARGS=""
for d in $DOMAIN; do
    CERTBOT_ARGS="$CERTBOT_ARGS -d $d"
done

if command -v certbot &> /dev/null; then
    log_success "Certbot is installed. To enable HTTPS, run:"
    echo -e "${GREEN}sudo certbot --nginx$CERTBOT_ARGS${NC}"
else
    log_warning "Certbot is not installed. To secure your site with HTTPS, run:"
    echo -e "${YELLOW}apt-get install -y certbot python3-certbot-nginx${NC}"
    echo -e "${YELLOW}sudo certbot --nginx$CERTBOT_ARGS${NC}"
fi

log_success "Deployment completed successfully! 🎉"
