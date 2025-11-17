# QR Code 404 Error Fix - Instructions

## Problem
QR code images are returning 404 errors because they're trying to load from `http://localhost:3000` (frontend) instead of `http://localhost:8000` (backend).

## Root Cause
1. The backend code was constructing QR URLs using the request URL, which captured the frontend URL
2. Old QR code URLs in the database may contain absolute URLs with `localhost:3000`
3. The backend server needs to be restarted to pick up the code changes

## Solution Steps

### Step 1: Fix Database URLs (If Needed)

Run the database fix script to ensure all URLs are using relative paths:

```bash
cd /home/user/AutoHub_/server
python3 fix_qr_urls.py
```

This will:
- Check the current QR code URL in the database
- Convert any absolute URLs to relative paths
- Display the changes made

### Step 2: Restart the Backend Server

**CRITICAL**: You must restart the backend server for the code changes to take effect!

#### If running with `uvicorn` directly:
```bash
cd /home/user/AutoHub_/server
# Stop the current server (Ctrl+C if running in terminal)
# Then restart:
python3 main.py
# OR
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### If running with `run.sh`:
```bash
cd /home/user/AutoHub_/server
./run.sh
```

#### If running with Docker:
```bash
docker-compose restart backend
# OR
docker restart <backend-container-name>
```

### Step 3: Clear Browser Cache

Clear your browser cache or do a hard refresh:
- Chrome/Edge: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- Firefox: `Ctrl + F5` (Windows/Linux) or `Cmd + Shift + R` (Mac)

### Step 4: Re-upload QR Code (Optional)

If the QR code still doesn't appear:

1. Go to Admin Panel → Payments
2. Upload your QR code image again
3. The new upload will use the fixed code

### Step 5: Verify the Fix

1. Navigate to the subscription page: `http://localhost:3000/subscription`
2. The QR code should now load correctly from `http://localhost:8000/uploads/qr/...`
3. Open browser DevTools (F12) → Network tab to verify the URL is correct

## How to Verify Backend Configuration

Check that your `.env` file has the correct backend URL:

```bash
cd /home/user/AutoHub_/server
cat .env | grep BACKEND_URL
```

It should show:
```
BACKEND_URL=http://localhost:8000
```

If the file doesn't exist, create it from the example:
```bash
cp .env.example .env
# Then edit .env and set BACKEND_URL=http://localhost:8000
```

## Expected Behavior After Fix

✅ QR codes load from: `http://localhost:8000/uploads/qr/gcash_qr_....jpg`
❌ QR codes should NOT load from: `http://localhost:3000/uploads/qr/...`

## Troubleshooting

### Issue: Still getting 404 errors

**Check 1**: Verify the file exists
```bash
ls -la /home/user/AutoHub_/server/uploads/qr/
```

**Check 2**: Verify backend server is running
```bash
curl http://localhost:8000/health
```

**Check 3**: Verify static files are being served
```bash
curl http://localhost:8000/uploads/qr/default_payment_qr.svg
```

**Check 4**: Check backend logs for errors
```bash
tail -f /home/user/AutoHub_/server/logs/app.log
```

### Issue: Backend server won't start

Check for port conflicts:
```bash
lsof -i :8000
# OR
netstat -tlnp | grep 8000
```

### Issue: Database connection errors

Verify MySQL is running and credentials are correct in `.env`:
```bash
mysql -u root -p -e "SHOW DATABASES;"
```

## Files Modified

The following files were modified to fix this issue:

1. `server/app/services/subscription_service.py` - Uses BACKEND_URL from settings
2. `server/app/api/v1/subscriptions.py` - Removed request_base_url parameter
3. `server/main.py` - Creates uploads/qr directory on startup
4. `server/fix_qr_urls.py` - NEW: Database fix script

## Prevention

To prevent this issue in the future:

1. Always use `settings.BACKEND_URL` for constructing backend file URLs
2. Store only relative paths in the database (e.g., `/uploads/qr/file.jpg`)
3. Let the service layer construct full URLs when needed
4. Never use `request.url.scheme` or `request.url.netloc` for file URLs

## Need Help?

If you're still experiencing issues:

1. Check the backend server logs
2. Verify the database URL is using relative paths
3. Ensure the backend server has been restarted
4. Try uploading a new QR code through the admin panel
