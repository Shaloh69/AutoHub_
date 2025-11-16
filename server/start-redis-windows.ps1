# ==========================================
# Windows PowerShell Script to Start Redis
# ==========================================

Write-Host "=========================================="
Write-Host "Car Marketplace - Redis Startup (Windows)"
Write-Host "=========================================="
Write-Host ""

# Check if Redis is already running
try {
    $response = redis-cli ping 2>&1
    if ($response -eq "PONG") {
        Write-Host "✓ Redis is already running" -ForegroundColor Green
        exit 0
    }
} catch {
    # Redis not running, continue
}

Write-Host "⚠ Redis is not running. Attempting to start..." -ForegroundColor Yellow
Write-Host ""

# Try to start Redis
try {
    # Check if redis-server is in PATH
    $redisPath = Get-Command redis-server -ErrorAction SilentlyContinue

    if ($redisPath) {
        Write-Host "Starting Redis server..."

        # Start Redis in background
        Start-Process redis-server -WindowStyle Hidden

        # Wait a moment for Redis to start
        Start-Sleep -Seconds 2

        # Verify Redis started
        $response = redis-cli ping 2>&1
        if ($response -eq "PONG") {
            Write-Host "✓ Redis started successfully!" -ForegroundColor Green
            exit 0
        } else {
            Write-Host "✗ Failed to start Redis" -ForegroundColor Red
        }
    } else {
        Write-Host "✗ Redis server not found in PATH" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please install Redis using one of these methods:"
        Write-Host ""
        Write-Host "1. Using Docker (Recommended):"
        Write-Host "   docker run -d -p 6379:6379 redis:latest"
        Write-Host ""
        Write-Host "2. Using WSL:"
        Write-Host "   wsl sudo apt-get install redis-server"
        Write-Host "   wsl redis-server --daemonize yes"
        Write-Host ""
        Write-Host "3. Native Windows Redis:"
        Write-Host "   Download from: https://github.com/tporadowski/redis/releases"
        Write-Host ""
        exit 1
    }
} catch {
    Write-Host "✗ Error starting Redis: $_" -ForegroundColor Red
    exit 1
}
