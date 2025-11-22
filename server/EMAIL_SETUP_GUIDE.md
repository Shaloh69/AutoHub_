# Email Setup Guide for AutoHub

## Problem
Forgot password and other email features don't work because SMTP is not configured.

## Solution

### Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Google Account:
   - Go to https://myaccount.google.com/security
   - Enable "2-Step Verification"

2. **Generate App Password**:
   - Go to https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device, name it "AutoHub"
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

3. **Update `/server/.env` file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # Your 16-char app password
   SMTP_FROM_EMAIL=your-email@gmail.com
   SMTP_FROM_NAME=AutoHub
   SMTP_START_TLS=True
   SMTP_USE_TLS=False
   ```

4. **Restart the backend server**:
   ```bash
   # Stop the server (Ctrl+C)
   # Then restart it
   cd /home/user/AutoHub_/server
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Option 2: SendGrid (Recommended for Production)

1. **Sign up** at https://sendgrid.com (Free tier: 100 emails/day)

2. **Create API Key**:
   - Go to Settings > API Keys
   - Create API Key with "Full Access"
   - Copy the API key

3. **Update `/server/.env` file**:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USERNAME=apikey
   SMTP_PASSWORD=SG.your-api-key-here
   SMTP_FROM_EMAIL=noreply@yourdomain.com
   SMTP_FROM_NAME=AutoHub
   SMTP_START_TLS=True
   SMTP_USE_TLS=False
   ```

4. **Verify sender identity** in SendGrid dashboard

5. **Restart the backend server**

### Option 3: Mailtrap (For Development/Testing Only)

1. **Sign up** at https://mailtrap.io (Free)

2. **Get credentials**:
   - Go to "Email Testing" > "Inboxes"
   - Copy SMTP credentials

3. **Update `/server/.env` file**:
   ```env
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USERNAME=your-mailtrap-username
   SMTP_PASSWORD=your-mailtrap-password
   SMTP_FROM_EMAIL=noreply@autohub.com
   SMTP_FROM_NAME=AutoHub
   SMTP_START_TLS=True
   SMTP_USE_TLS=False
   ```

4. **Restart the backend server**

**Note**: Mailtrap doesn't send real emails - it catches them for testing.

## Testing

1. Go to http://localhost:3000/auth/forgot-password
2. Enter your email
3. Check:
   - Gmail/SendGrid: Check your inbox and spam folder
   - Mailtrap: Check your Mailtrap inbox

## Troubleshooting

### "Authentication failed" error
- Gmail: Make sure you're using App Password, not regular password
- Gmail: Ensure 2FA is enabled first
- SendGrid: Verify your sender email

### Emails going to spam
- Use a verified domain email for SMTP_FROM_EMAIL
- For Gmail: Use the same email for both SMTP_USERNAME and SMTP_FROM_EMAIL

### "Connection refused" error
- Check if your firewall/antivirus is blocking port 587
- Try port 465 with SMTP_USE_TLS=True and SMTP_START_TLS=False

### Still not working?
Check the backend logs for error messages:
```bash
# Look for lines starting with ❌ or "Failed to send email"
```

## Email Features in AutoHub

The following features require email configuration:
- ✉️ Forgot Password / Password Reset
- ✉️ Email Verification (new user registration)
- ✉️ Welcome Email (after verification)
- ✉️ New Inquiry Notifications (for sellers)
- ✉️ Inquiry Response Notifications (for buyers)

## Security Notes

- **Never commit `.env` file to git** (it's already in `.gitignore`)
- **Use App Passwords** for Gmail, not your regular password
- **Rotate credentials** regularly
- **Use environment-specific credentials** (different for dev/staging/prod)
