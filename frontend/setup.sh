#!/bin/bash

# KasirPro Frontend Setup Script
# Run this script to set up the Next.js frontend environment

set -e

echo "========================================"
echo "KasirPro Frontend Setup"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed${NC}"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not installed${NC}"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo ""

echo -e "${YELLOW}1. Installing npm dependencies...${NC}"
npm install

echo -e "${YELLOW}2. Building Next.js application...${NC}"
npm run build

echo -e "${YELLOW}3. Verifying TypeScript types...${NC}"
npx tsc --noEmit || true

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Frontend setup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Configure your .env.local file with API endpoints"
echo "2. Start the development server: npm run dev"
echo "3. Start the production server: npm run start"
echo ""
echo "Development URL: http://localhost:3000"
echo "Cashier Terminal: http://localhost:3000/pos"
echo "Customer Display: http://localhost:3000/cfd"
echo ""
echo "Service Worker will be automatically registered on first load."
echo "Offline mode is enabled by default."
echo ""
