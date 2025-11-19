"""
===========================================
FILE: app/services/email_service.py
Path: server/app/services/email_service.py
Complete Email Service Implementation
===========================================
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from app.config import settings


class EmailService:
    """Email service for sending transactional emails"""
    
    @staticmethod
    async def send_email(
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None
    ) -> bool:
        """
        Send email via SMTP
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            body: Plain text email body
            html_body: Optional HTML email body
            
        Returns:
            bool: True if email sent successfully
        """
        try:
            # Create message
            message = MIMEMultipart('alternative')
            message['From'] = f"{settings.SMTP_FROM_NAME} <{settings.SMTP_FROM_EMAIL}>"
            message['To'] = to_email
            message['Subject'] = subject
            
            # Add plain text version
            text_part = MIMEText(body, 'plain', 'utf-8')
            message.attach(text_part)
            
            # Add HTML version if provided
            if html_body:
                html_part = MIMEText(html_body, 'html', 'utf-8')
                message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=settings.SMTP_HOST,
                port=settings.SMTP_PORT,
                username=settings.SMTP_USERNAME,
                password=settings.SMTP_PASSWORD,
                use_tls=settings.SMTP_USE_TLS,
                start_tls=settings.SMTP_START_TLS
            )
            
            print(f"✅ Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to send email to {to_email}: {e}")
            return False
    
    @staticmethod
    async def send_verification_email(email: str, token: str, user_name: str = "") -> bool:
        """
        Send email verification link
        
        Args:
            email: User's email address
            token: Verification token
            user_name: User's name for personalization
            
        Returns:
            bool: True if email sent successfully
        """
        # Build verification URL
        verification_url = f"{settings.FRONTEND_URL}/auth/verify-email?token={token}"

        # Email subject
        subject = "Verify your email - AutoHub"

        # Plain text version
        text_body = f"""
Hello{f' {user_name}' if user_name else ''},

Welcome to AutoHub - Your trusted car marketplace!

Please verify your email address by clicking the link below:
{verification_url}

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Best regards,
AutoHub Team

---
Need help? Contact us at support@autohub.ph
        """.strip()
        
        # HTML version with modern AutoHub design
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - AutoHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #EFF6FF 0%, #F3E8FF 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #EFF6FF 0%, #F3E8FF 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <!-- Main Card -->
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid rgba(147, 197, 253, 0.3);">
                    <!-- Header with Gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); padding: 48px 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 12px 28px; border-radius: 50px; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                    AutoHub
                                </h1>
                            </div>
                            <p style="margin: 8px 0 0 0; color: #E0E7FF; font-size: 15px; font-weight: 500;">
                                Your Trusted Car Marketplace
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <!-- Welcome Icon -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%); border-radius: 50%; text-align: center; line-height: 80px; font-size: 40px;">
                                    ✉️
                                </div>
                            </div>

                            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700; text-align: center;">
                                Welcome{f' {user_name}' if user_name else ''} to AutoHub!
                            </h2>

                            <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 16px; line-height: 1.7; text-align: center;">
                                Thank you for joining our community of car enthusiasts. We're thrilled to have you on board!
                            </p>

                            <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.7; text-align: center;">
                                To unlock all features and start your journey, please verify your email address:
                            </p>

                            <!-- Button with Gradient -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 32px 0;">
                                        <a href="{verification_url}"
                                           style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
                                                  color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px;
                                                  font-size: 17px; font-weight: 600; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
                                                  transition: all 0.3s ease;">
                                            Verify My Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Alternative Link -->
                            <div style="background: linear-gradient(135deg, #F0F9FF 0%, #FAF5FF 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #DBEAFE;">
                                <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Or copy this link:
                                </p>
                                <p style="margin: 0; word-break: break-all;">
                                    <a href="{verification_url}"
                                       style="color: #3B82F6; text-decoration: none; font-size: 14px; font-weight: 500;">
                                        {verification_url}
                                    </a>
                                </p>
                            </div>

                            <!-- Important Notice -->
                            <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 4px solid #F59E0B;
                                        padding: 20px; margin: 24px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);">
                                <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6; font-weight: 500;">
                                    ⏰ <strong>Important:</strong> This verification link will expire in 24 hours for security purposes.
                                </p>
                            </div>

                            <p style="margin: 24px 0 0 0; color: #9CA3AF; font-size: 14px; line-height: 1.6; text-align: center;">
                                Didn't create an account with AutoHub? You can safely ignore this email.
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center;
                                   border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                                Need assistance? We're here to help!
                            </p>
                            <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
                                Contact us at
                                <a href="mailto:support@autohub.ph"
                                   style="color: #3B82F6; text-decoration: none; font-weight: 600;">
                                    support@autohub.ph
                                </a>
                            </p>

                            <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 16px;">
                                <p style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 12px; font-weight: 500;">
                                    © 2024 AutoHub Philippines. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #D1D5DB; font-size: 11px;">
                                    This is an automated message. Please do not reply to this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """.strip()
        
        return await EmailService.send_email(email, subject, text_body, html_body)
    
    @staticmethod
    async def send_password_reset_email(email: str, token: str, user_name: str = "") -> bool:
        """Send password reset email"""
        reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"

        subject = "Reset your password - AutoHub"

        text_body = f"""
Hello{f' {user_name}' if user_name else ''},

We received a request to reset your password for your AutoHub account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
AutoHub Team
        """.strip()

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset - AutoHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid rgba(252, 165, 165, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 48px 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 12px 28px; border-radius: 50px; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                    AutoHub
                                </h1>
                            </div>
                            <p style="margin: 8px 0 0 0; color: #FEE2E2; font-size: 15px; font-weight: 500;">
                                Password Reset Request
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <!-- Lock Icon -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); border-radius: 50%; text-align: center; line-height: 80px; font-size: 40px;">
                                    🔐
                                </div>
                            </div>

                            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700; text-align: center;">
                                Reset Your Password
                            </h2>

                            <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 16px; line-height: 1.7; text-align: center;">
                                We received a request to reset the password for your AutoHub account.
                            </p>

                            <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.7; text-align: center;">
                                Click the button below to create a new password:
                            </p>

                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 8px 0 32px 0;">
                                        <a href="{reset_url}"
                                           style="display: inline-block; background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
                                                  color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px;
                                                  font-size: 17px; font-weight: 600; box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);">
                                            Reset My Password
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Alternative Link -->
                            <div style="background: linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #FECACA;">
                                <p style="margin: 0 0 8px 0; color: #6B7280; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Or copy this link:
                                </p>
                                <p style="margin: 0; word-break: break-all;">
                                    <a href="{reset_url}"
                                       style="color: #DC2626; text-decoration: none; font-size: 14px; font-weight: 500;">
                                        {reset_url}
                                    </a>
                                </p>
                            </div>

                            <!-- Security Notice -->
                            <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); border-left: 4px solid #F59E0B;
                                        padding: 20px; margin: 24px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);">
                                <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6; font-weight: 500;">
                                    ⏰ <strong>Security Alert:</strong> This reset link will expire in 1 hour for your protection.
                                </p>
                            </div>

                            <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); padding: 20px; border-radius: 8px; margin: 24px 0;">
                                <p style="margin: 0; color: #1E40AF; font-size: 14px; line-height: 1.6; font-weight: 500;">
                                    🛡️ <strong>Didn't request this?</strong> If you didn't request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                                Need assistance? We're here to help!
                            </p>
                            <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
                                Contact us at
                                <a href="mailto:support@autohub.ph"
                                   style="color: #EF4444; text-decoration: none; font-weight: 600;">
                                    support@autohub.ph
                                </a>
                            </p>

                            <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 16px;">
                                <p style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 12px; font-weight: 500;">
                                    © 2024 AutoHub Philippines. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #D1D5DB; font-size: 11px;">
                                    This is an automated message. Please do not reply to this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """.strip()

        return await EmailService.send_email(email, subject, text_body, html_body)
    
    @staticmethod
    async def send_welcome_email(email: str, user_name: str) -> bool:
        """Send welcome email after verification"""
        subject = "Welcome to AutoHub - Let's Get Started! 🎉"

        text_body = f"""
Hello {user_name},

Your email has been successfully verified! Welcome to AutoHub.

You can now:
- Browse thousands of cars for sale
- Post your own car listings (after phone verification)
- Connect with verified buyers and sellers
- Access premium features

Get started now: {settings.FRONTEND_URL}

Best regards,
AutoHub Team
        """.strip()

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to AutoHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid rgba(134, 239, 172, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 48px 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 12px 28px; border-radius: 50px; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                    AutoHub
                                </h1>
                            </div>
                            <p style="margin: 8px 0 0 0; color: #D1FAE5; font-size: 15px; font-weight: 500;">
                                Welcome Aboard! 🎉
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <!-- Success Icon -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; text-align: center; line-height: 80px; font-size: 40px;">
                                    ✅
                                </div>
                            </div>

                            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700; text-align: center;">
                                Hello {user_name}!
                            </h2>

                            <p style="margin: 0 0 24px 0; color: #6B7280; font-size: 16px; line-height: 1.7; text-align: center;">
                                Your email has been successfully verified! You're now a part of the AutoHub community.
                            </p>

                            <p style="margin: 0 0 32px 0; color: #374151; font-size: 16px; line-height: 1.7; text-align: center; font-weight: 500;">
                                Here's what you can do now:
                            </p>

                            <!-- Features Cards -->
                            <div style="margin: 32px 0;">
                                <div style="background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: 20px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #3B82F6;">
                                    <p style="margin: 0; color: #1E40AF; font-size: 15px; font-weight: 600;">
                                        🚗 Browse thousands of cars for sale
                                    </p>
                                </div>

                                <div style="background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); padding: 20px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #10B981;">
                                    <p style="margin: 0; color: #065F46; font-size: 15px; font-weight: 600;">
                                        💬 Connect with verified buyers and sellers
                                    </p>
                                </div>

                                <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 20px; border-radius: 12px; margin-bottom: 16px; border-left: 4px solid #F59E0B;">
                                    <p style="margin: 0; color: #92400E; font-size: 15px; font-weight: 600;">
                                        ❤️ Save your favorite listings
                                    </p>
                                </div>

                                <div style="background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #8B5CF6;">
                                    <p style="margin: 0; color: #5B21B6; font-size: 15px; font-weight: 600;">
                                        📝 Post your own car listings (after phone verification)
                                    </p>
                                </div>
                            </div>

                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 32px 0 16px 0;">
                                        <a href="{settings.FRONTEND_URL}"
                                           style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                                                  color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px;
                                                  font-size: 17px; font-weight: 600; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);">
                                            Start Exploring Cars
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tips Section -->
                            <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); padding: 24px; border-radius: 12px; margin: 32px 0;">
                                <h3 style="margin: 0 0 12px 0; color: #1E40AF; font-size: 16px; font-weight: 700;">
                                    💡 Pro Tips:
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; color: #1E3A8A; font-size: 14px; line-height: 1.8;">
                                    <li>Complete your profile to build trust with sellers</li>
                                    <li>Verify your phone number to post car listings</li>
                                    <li>Set up alerts for your favorite car models</li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                                Questions? We're here to help!
                            </p>
                            <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
                                Contact us at
                                <a href="mailto:support@autohub.ph"
                                   style="color: #10B981; text-decoration: none; font-weight: 600;">
                                    support@autohub.ph
                                </a>
                            </p>

                            <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 16px;">
                                <p style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 12px; font-weight: 500;">
                                    © 2024 AutoHub Philippines. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #D1D5DB; font-size: 11px;">
                                    This is an automated message. Please do not reply to this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """.strip()

        return await EmailService.send_email(email, subject, text_body, html_body)

    @staticmethod
    async def send_new_inquiry_email(
        seller_email: str,
        seller_name: str,
        buyer_name: str,
        buyer_email: str,
        buyer_phone: str,
        car_title: str,
        car_id: int,
        message: str,
        inquiry_type: str,
        offered_price: Optional[float] = None
    ) -> bool:
        """Send email to seller when they receive a new inquiry or offer"""

        # Determine if it's an offer or regular inquiry
        is_offer = offered_price is not None and offered_price > 0
        email_type = "Offer" if is_offer else "Inquiry"

        subject = f"New {email_type} for your car: {car_title} - AutoHub"

        car_url = f"{settings.FRONTEND_URL}/cars/{car_id}"

        # Build offer details section
        offer_section = ""
        if is_offer:
            offer_section = f"\n\nOffered Price: ₱{offered_price:,.2f}"

        text_body = f"""
Hello {seller_name},

Great news! You've received a new {email_type.lower()} for your car listing on AutoHub.

Car: {car_title}
From: {buyer_name or 'Unknown'}
Email: {buyer_email or 'Not provided'}
Phone: {buyer_phone or 'Not provided'}
Type: {inquiry_type.replace('_', ' ').title()}{offer_section}

Message:
{message}

View car listing: {car_url}

You can respond to this inquiry by logging into your dashboard at {settings.FRONTEND_URL}/dashboard

Best regards,
AutoHub Team

---
Need help? Contact us at support@autohub.ph
        """.strip()

        # HTML version with modern design
        # Different gradient based on email type
        header_gradient = "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)" if not is_offer else "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
        bg_gradient = "linear-gradient(135deg, #EFF6FF 0%, #F3E8FF 100%)" if not is_offer else "linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
        icon_emoji = "💬" if not is_offer else "💰"

        # Offer price section
        offer_html = ""
        if is_offer:
            offer_html = f"""
            <div style="background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%); border-left: 4px solid #10B981;
                        padding: 24px; margin: 24px 0; border-radius: 12px; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.1);">
                <p style="margin: 0; color: #065F46; font-size: 20px; font-weight: 700;">
                    💰 Offered Price: ₱{offered_price:,.2f}
                </p>
            </div>
            """

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New {email_type} - AutoHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: {bg_gradient};">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: {bg_gradient}; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: {header_gradient}; padding: 48px 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 12px 28px; border-radius: 50px; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                    AutoHub
                                </h1>
                            </div>
                            <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 15px; font-weight: 500;">
                                New {email_type} Received {icon_emoji}
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700; text-align: center;">
                                Hello {seller_name}!
                            </h2>

                            <p style="margin: 0 0 32px 0; color: #6B7280; font-size: 16px; line-height: 1.7; text-align: center;">
                                Great news! You've received a new {email_type.lower()} for your car listing.
                            </p>

                            <!-- Car Info Card -->
                            <div style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #DBEAFE;">
                                <p style="margin: 0; color: #1E40AF; font-size: 18px; font-weight: 700;">
                                    🚗 {car_title}
                                </p>
                            </div>

                            {offer_html}

                            <!-- Buyer Information Card -->
                            <div style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #E5E7EB;">
                                <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 18px; font-weight: 700;">
                                    👤 Buyer Information
                                </h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #6B7280; font-size: 14px; font-weight: 600; width: 100px;">
                                            Name:
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 500;">
                                            {buyer_name or 'Unknown'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6B7280; font-size: 14px; font-weight: 600;">
                                            Email:
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 15px;">
                                            {f'<a href="mailto:{buyer_email}" style="color: #3B82F6; text-decoration: none; font-weight: 500;">{buyer_email}</a>' if buyer_email else '<span style="color: #9CA3AF;">Not provided</span>'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6B7280; font-size: 14px; font-weight: 600;">
                                            Phone:
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 15px;">
                                            {f'<a href="tel:{buyer_phone}" style="color: #3B82F6; text-decoration: none; font-weight: 500;">{buyer_phone}</a>' if buyer_phone else '<span style="color: #9CA3AF;">Not provided</span>'}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #6B7280; font-size: 14px; font-weight: 600;">
                                            Type:
                                        </td>
                                        <td style="padding: 10px 0; color: #111827; font-size: 15px; font-weight: 500;">
                                            {inquiry_type.replace('_', ' ').title()}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Message Section -->
                            <div style="margin: 24px 0;">
                                <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 700;">
                                    💬 Message
                                </h3>
                                <div style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #3B82F6;">
                                    <p style="margin: 0; color: #374151; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">
{message}
                                    </p>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{settings.FRONTEND_URL}/dashboard/inquiries"
                                           style="display: inline-block; background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
                                                  color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px;
                                                  font-size: 16px; font-weight: 600; margin: 8px; box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);">
                                            View in Dashboard
                                        </a>
                                        <a href="{car_url}"
                                           style="display: inline-block; background-color: #6B7280; color: #ffffff;
                                                  text-decoration: none; padding: 16px 32px; border-radius: 12px;
                                                  font-size: 16px; font-weight: 600; margin: 8px;">
                                            View Listing
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Tip -->
                            <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); padding: 20px; border-radius: 12px; margin: 24px 0;">
                                <p style="margin: 0; color: #1E40AF; font-size: 14px; line-height: 1.6; font-weight: 500;">
                                    💡 <strong>Pro Tip:</strong> Respond quickly to increase your chances of closing the deal! Buyers appreciate fast responses.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                                Need help? We're here to support you!
                            </p>
                            <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
                                Contact us at
                                <a href="mailto:support@autohub.ph"
                                   style="color: #3B82F6; text-decoration: none; font-weight: 600;">
                                    support@autohub.ph
                                </a>
                            </p>

                            <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 16px;">
                                <p style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 12px; font-weight: 500;">
                                    © 2024 AutoHub Philippines. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #D1D5DB; font-size: 11px;">
                                    This is an automated message. Please do not reply to this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """.strip()

        return await EmailService.send_email(seller_email, subject, text_body, html_body)

    @staticmethod
    async def send_inquiry_response_email(
        buyer_email: str,
        buyer_name: str,
        seller_name: str,
        car_title: str,
        car_id: int,
        response_message: str
    ) -> bool:
        """Send email to buyer when seller responds to their inquiry"""

        subject = f"Response to your inquiry: {car_title} - AutoHub"
        car_url = f"{settings.FRONTEND_URL}/cars/{car_id}"

        text_body = f"""
Hello {buyer_name},

You've received a response to your inquiry about: {car_title}

From: {seller_name}

Message:
{response_message}

View car listing: {car_url}
View all your inquiries: {settings.FRONTEND_URL}/dashboard/my-inquiries

Best regards,
AutoHub Team
        """.strip()

        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Inquiry Response - AutoHub</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%);">
    <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border: 1px solid rgba(134, 239, 172, 0.3);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); padding: 48px 32px; text-align: center;">
                            <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.15); backdrop-filter: blur(10px); padding: 12px 28px; border-radius: 50px; margin-bottom: 16px; border: 1px solid rgba(255, 255, 255, 0.2);">
                                <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                                    AutoHub
                                </h1>
                            </div>
                            <p style="margin: 8px 0 0 0; color: #D1FAE5; font-size: 15px; font-weight: 500;">
                                New Response Received 📧
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <!-- Success Icon -->
                            <div style="text-align: center; margin-bottom: 24px;">
                                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #10B981 0%, #059669 100%); border-radius: 50%; text-align: center; line-height: 80px; font-size: 40px;">
                                    📬
                                </div>
                            </div>

                            <h2 style="margin: 0 0 16px 0; color: #111827; font-size: 28px; font-weight: 700; text-align: center;">
                                Hello {buyer_name}!
                            </h2>

                            <p style="margin: 0 0 32px 0; color: #6B7280; font-size: 16px; line-height: 1.7; text-align: center;">
                                Good news! You've received a response to your inquiry.
                            </p>

                            <!-- Car Info Card -->
                            <div style="background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 1px solid #DBEAFE;">
                                <p style="margin: 0 0 12px 0; color: #1E40AF; font-size: 18px; font-weight: 700;">
                                    🚗 {car_title}
                                </p>
                                <p style="margin: 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                                    <strong>From:</strong> {seller_name}
                                </p>
                            </div>

                            <!-- Response Section -->
                            <div style="margin: 32px 0;">
                                <h3 style="margin: 0 0 16px 0; color: #111827; font-size: 18px; font-weight: 700;">
                                    💬 Seller's Response
                                </h3>
                                <div style="background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%); padding: 24px; border-radius: 12px; border-left: 4px solid #10B981;">
                                    <p style="margin: 0; color: #065F46; font-size: 15px; line-height: 1.7; white-space: pre-wrap; font-weight: 500;">
{response_message}
                                    </p>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{car_url}"
                                           style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                                                  color: #ffffff; text-decoration: none; padding: 18px 48px; border-radius: 12px;
                                                  font-size: 17px; font-weight: 600; margin: 8px; box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);">
                                            View Car Listing
                                        </a>
                                    </td>
                                </tr>
                                <tr>
                                    <td align="center" style="padding-top: 12px;">
                                        <a href="{settings.FRONTEND_URL}/dashboard/my-inquiries"
                                           style="display: inline-block; background-color: #6B7280; color: #ffffff;
                                                  text-decoration: none; padding: 14px 36px; border-radius: 12px;
                                                  font-size: 15px; font-weight: 600; margin: 8px;">
                                            View All Inquiries
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <!-- Next Steps -->
                            <div style="background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%); padding: 24px; border-radius: 12px; margin: 24px 0;">
                                <h3 style="margin: 0 0 12px 0; color: #1E40AF; font-size: 16px; font-weight: 700;">
                                    📌 Next Steps:
                                </h3>
                                <ul style="margin: 0; padding-left: 20px; color: #1E3A8A; font-size: 14px; line-height: 1.8;">
                                    <li>Review the seller's response carefully</li>
                                    <li>Contact the seller directly for more details</li>
                                    <li>Schedule a viewing if you're interested</li>
                                    <li>Make an offer if the car meets your needs</li>
                                </ul>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%); padding: 32px 40px; text-align: center; border-top: 1px solid #E5E7EB;">
                            <p style="margin: 0 0 12px 0; color: #6B7280; font-size: 14px; font-weight: 500;">
                                Have questions? We're here to help!
                            </p>
                            <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px;">
                                Contact us at
                                <a href="mailto:support@autohub.ph"
                                   style="color: #10B981; text-decoration: none; font-weight: 600;">
                                    support@autohub.ph
                                </a>
                            </p>

                            <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; margin-top: 16px;">
                                <p style="margin: 0 0 8px 0; color: #9CA3AF; font-size: 12px; font-weight: 500;">
                                    © 2024 AutoHub Philippines. All rights reserved.
                                </p>
                                <p style="margin: 0; color: #D1D5DB; font-size: 11px;">
                                    This is an automated message. Please do not reply to this email.
                                </p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        """.strip()

        return await EmailService.send_email(buyer_email, subject, text_body, html_body)