# Redis Setup for Windows - Email Verification Fix

## Problem
Email verification tokens require Redis to be running. On Windows, Redis doesn't start automatically.

## Quick Fix

### Option 1: Docker (Easiest & Recommended)

```bash
docker run -d -p 6379:6379 --name autohub-redis redis:latest
```

**To stop Redis:**
```bash
docker stop autohub-redis
```

**To start again:**
```bash
docker start autohub-redis
```

### Option 2: WSL (Windows Subsystem for Linux)

```bash
# In WSL terminal
sudo apt-get update
sudo apt-get install redis-server
redis-server --daemonize yes
```

**To verify:**
```bash
redis-cli ping
# Should return: PONG
```

### Option 3: Native Windows Redis

1. **Download Redis for Windows:**
   - Go to: https://github.com/tporadowski/redis/releases
   - Download the latest `.zip` file
   - Extract to `C:\Redis` (or your preferred location)

2. **Add Redis to PATH:**
   - Search "Environment Variables" in Windows
   - Add `C:\Redis` to your PATH

3. **Start Redis:**

   **Option A - Run in terminal:**
   ```cmd
   redis-server
   ```

   **Option B - Install as Windows Service:**
   ```cmd
   cd C:\Redis
   redis-server --service-install
   redis-server --service-start
   ```

4. **Verify:**
   ```cmd
   redis-cli ping
   ```
   Should return: `PONG`

## Quick Start Scripts

We've provided helper scripts:

### PowerShell
```powershell
.\start-redis-windows.ps1
```

### Command Prompt
```cmd
start-redis-windows.bat
```

## Troubleshooting

### "Redis connection refused"
- Redis is not running
- Run one of the startup methods above

### "redis-server not found"
- Redis is not installed or not in PATH
- Follow installation steps for your preferred option

### "Port 6379 already in use"
- Redis is already running
- Check with: `redis-cli ping`

### Email verification still not working after starting Redis
1. Verify Redis is running: `redis-cli ping`
2. Check server logs for detailed error messages
3. Restart the backend server after starting Redis
4. Use the debug endpoint to check tokens:
   ```
   GET http://localhost:8000/api/v1/auth/debug/check-token/{your-token}
   ```

## For Development

Add this to your startup routine:

1. Start Redis (choose one method above)
2. Start the backend server
3. Email verification will now work!

## Production Deployment

For production on Windows:
- Use Docker or WSL for better stability
- Set up Redis as a Windows Service for auto-start
- Configure Redis persistence and backup
