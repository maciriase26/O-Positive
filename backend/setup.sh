#!/bin/bash
# Quick setup script for O-Positive database

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          O-Positive Database Setup Script               ║"
echo "║                                                          ║"
echo "║  This script will help you set up the O-Positive       ║"
echo "║  database with all necessary tables and migrations     ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}[1/5] Creating .env file from template...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env created. Please edit it with your PostgreSQL credentials.${NC}"
    echo -e "${YELLOW}Press Enter to continue after updating .env...${NC}"
    read
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Check if PostgreSQL is running
echo -e "${YELLOW}[2/5] Checking PostgreSQL connection...${NC}"
if psql -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw postgres; then
    echo -e "${GREEN}✓ PostgreSQL is running${NC}"
else
    echo -e "${YELLOW}⚠ PostgreSQL may not be running. Starting PostgreSQL...${NC}"
    # Try to start PostgreSQL (command varies by system)
    brew services start postgresql 2>/dev/null || \
    sudo service postgresql start 2>/dev/null || \
    echo -e "${YELLOW}Please start PostgreSQL manually${NC}"
fi

# Create database if it doesn't exist
echo -e "${YELLOW}[3/5] Creating opositive database...${NC}"
createdb opositive 2>/dev/null && echo -e "${GREEN}✓ Database created${NC}" || echo -e "${GREEN}✓ Database already exists${NC}"

# Install dependencies
echo -e "${YELLOW}[4/5] Installing Node dependencies...${NC}"
npm install 2>/dev/null
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Run migrations
echo -e "${YELLOW}[5/5] Running migrations...${NC}"
npm run migrate
MIGRATE_EXIT=$?

if [ $MIGRATE_EXIT -eq 0 ]; then
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════╗"
    echo "║                   Setup Complete! ✓                      ║"
    echo "╚══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Seed initial workouts: npm run seed"
    echo "  2. Start the server: npm start"
    echo "  3. Run tests: npm test"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  - Database Schema: see DB_SCHEMA.md"
    echo "  - Setup Guide: see MIGRATIONS_GUIDE.md"
    echo "  - SQL Queries: see QUERIES.sql"
    echo "  - API Examples: see db/examples.js"
else
    echo -e "${YELLOW}Migration failed. Check the error above.${NC}"
    exit 1
fi
