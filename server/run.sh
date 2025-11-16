#!/bin/bash

# Car Marketplace Philippines - Startup Script
# This script handles server startup with proper checks

set -e  # Exit on error

echo "=========================================="
echo "Car Marketplace Philippines - Server"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ "$1" = "success" ]; then
        echo -e "${GREEN}✓ $2${NC}"
    elif [ "$1" = "error" ]; then
        echo -e "${RED}✗ $2${NC}"
    elif [ "$1" = "warning" ]; then
        echo -e "${YELLOW}⚠ $2${NC}"
    else
        echo "$2"
    fi
}

# Check Python version
echo "Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
REQUIRED_VERSION="3.9"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then 
    print_status "success" "Python $PYTHON_VERSION detected"
else
    print_status "error" "Python $REQUIRED_VERSION or higher is required (found $PYTHON_VERSION)"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_status "warning" "Virtual environment not found. Creating..."
    python3 -m venv venv
    print_status "success" "Virtual environment created"
fi

# Activate virtual environment
print_status "info" "Activating virtual environment..."
source venv/bin/activate

# Check if .env exists
if [ ! -f ".env" ]; then
    print_status "warning" ".env file not found"
    if [ -f ".env.example" ]; then
        print_status "info" "Copying .env.example to .env"
        cp .env.example .env
        print_status "warning" "Please edit .env file with your configuration before running the server"
        exit 1
    else
        print_status "error" "No .env.example file found"
        exit 1
    fi
fi

# Install/Update dependencies
echo ""
echo "Checking dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt
print_status "success" "Dependencies installed"

# Check MySQL connection
echo ""
echo "Checking database connection..."
python3 << END
import sys
from database import test_database_connection
if test_database_connection():
    print("Database connection successful")
    sys.exit(0)
else:
    print("Database connection failed")
    sys.exit(1)
END

if [ $? -eq 0 ]; then
    print_status "success" "Database connection successful"
else
    print_status "error" "Database connection failed. Please check DATABASE_URL in .env"
    exit 1
fi

# Check and start Redis if needed
echo ""
echo "Checking Redis connection..."

# Try to ping Redis
if redis-cli ping &> /dev/null; then
    print_status "success" "Redis is already running"
else
    print_status "warning" "Redis is not running. Starting Redis..."

    # Try to start Redis
    if command -v redis-server &> /dev/null; then
        redis-server --daemonize yes --port 6379
        sleep 2

        # Verify Redis started
        if redis-cli ping &> /dev/null; then
            print_status "success" "Redis started successfully"
        else
            print_status "error" "Failed to start Redis. Email verification will not work!"
            print_status "info" "Please start Redis manually: redis-server --daemonize yes"
        fi
    else
        print_status "error" "Redis server not installed. Please install Redis:"
        print_status "info" "  Ubuntu/Debian: sudo apt-get install redis-server"
        print_status "info" "  macOS: brew install redis"
        print_status "warning" "Email verification will NOT work without Redis!"
    fi
fi

# Verify Redis connection from Python
python3 << END
import sys
from database import test_redis_connection
if test_redis_connection():
    print("Python Redis connection successful")
    sys.exit(0)
else:
    print("Python Redis connection failed")
    sys.exit(1)
END

if [ $? -eq 0 ]; then
    print_status "success" "Redis connection verified"
else
    print_status "warning" "Redis connection failed. Caching will be disabled."
fi

# Create upload directories
echo ""
echo "Creating upload directories..."
mkdir -p uploads/cars
mkdir -p uploads/users
mkdir -p uploads/documents
print_status "success" "Upload directories ready"

# Parse command line arguments
MODE="development"
PORT=8000
HOST="0.0.0.0"
WORKERS=1

while [[ $# -gt 0 ]]; do
    case $1 in
        --production)
            MODE="production"
            WORKERS=4
            shift
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --host)
            HOST="$2"
            shift 2
            ;;
        --workers)
            WORKERS="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: ./run.sh [--production] [--port PORT] [--host HOST] [--workers NUM]"
            exit 1
            ;;
    esac
done

# Start server
echo ""
echo "=========================================="
if [ "$MODE" = "production" ]; then
    print_status "info" "Starting server in PRODUCTION mode"
    print_status "info" "Host: $HOST:$PORT"
    print_status "info" "Workers: $WORKERS"
    echo "=========================================="
    echo ""
    
    # Check if gunicorn is installed
    if ! command -v gunicorn &> /dev/null; then
        print_status "warning" "Gunicorn not found. Installing..."
        pip install gunicorn
    fi
    
    # Start with gunicorn
    gunicorn main:app \
        --workers $WORKERS \
        --worker-class uvicorn.workers.UvicornWorker \
        --bind $HOST:$PORT \
        --access-logfile - \
        --error-logfile - \
        --log-level info
else
    print_status "info" "Starting server in DEVELOPMENT mode"
    print_status "info" "URL: http://$HOST:$PORT"
    print_status "info" "Docs: http://$HOST:$PORT/docs"
    echo "=========================================="
    echo ""
    
    # Start with uvicorn in reload mode
    python main.py
fi