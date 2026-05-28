#!/bin/bash

# KasirPro Backend Setup Script
# Run this script to set up the Laravel backend environment

set -e

echo "========================================"
echo "KasirPro Backend Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if composer is installed
if ! command -v composer &> /dev/null; then
    echo -e "${RED}ERROR: Composer is not installed${NC}"
    exit 1
fi

# Check if PHP is installed
if ! command -v php &> /dev/null; then
    echo -e "${RED}ERROR: PHP is not installed${NC}"
    exit 1
fi

echo -e "${YELLOW}1. Installing PHP dependencies...${NC}"
composer install

echo -e "${YELLOW}2. Generating APP_KEY...${NC}"
php artisan key:generate

echo -e "${YELLOW}3. Running database migrations...${NC}"
php artisan migrate --force

echo -e "${YELLOW}4. Seeding database with sample data...${NC}"
php artisan db:seed

echo -e "${YELLOW}5. Creating symbolic link for storage...${NC}"
php artisan storage:link

echo -e "${YELLOW}6. Caching configuration...${NC}"
php artisan config:cache
php artisan route:cache

echo -e "${YELLOW}7. Publishing vendor assets...${NC}"
php artisan vendor:publish --tag=laravel-mail --force 2>/dev/null || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backend setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with database and API keys"
echo "2. Start the development server: php artisan serve"
echo "3. For WebSocket support: php artisan reverb:start"
echo ""
echo "API Documentation will be available at: http://localhost:8000/api/docs"
echo ""
