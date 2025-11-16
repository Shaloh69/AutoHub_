@echo off
REM ==========================================
REM Windows Batch Script to Start Redis
REM ==========================================

echo ==========================================
echo Car Marketplace - Redis Startup (Windows)
echo ==========================================
echo.

REM Check if Redis is already running
redis-cli ping >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Redis is already running
    exit /b 0
)

echo [INFO] Redis is not running. Attempting to start...
echo.

REM Try to start Redis
where redis-server >nul 2>&1
if %errorlevel% equ 0 (
    echo Starting Redis server...
    start /B redis-server

    REM Wait for Redis to start
    timeout /t 2 /nobreak >nul

    REM Verify Redis started
    redis-cli ping >nul 2>&1
    if %errorlevel% equ 0 (
        echo [OK] Redis started successfully!
        exit /b 0
    ) else (
        echo [ERROR] Failed to start Redis
        exit /b 1
    )
) else (
    echo [ERROR] Redis server not found
    echo.
    echo Please install Redis using one of these methods:
    echo.
    echo 1. Using Docker (Recommended):
    echo    docker run -d -p 6379:6379 redis:latest
    echo.
    echo 2. Using WSL:
    echo    wsl sudo apt-get install redis-server
    echo    wsl redis-server --daemonize yes
    echo.
    echo 3. Native Windows Redis:
    echo    Download from: https://github.com/tporadowski/redis/releases
    echo.
    exit /b 1
)
