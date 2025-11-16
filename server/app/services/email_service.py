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
        verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
        
        # Email subject
        subject = "Verify your email - Car Marketplace Philippines"
        
        # Plain text version
        text_body = f"""
Hello{f' {user_name}' if user_name else ''},

Welcome to Car Marketplace Philippines!

Please verify your email address by clicking the link below:
{verification_url}

This link will expire in 24 hours.

If you didn't create an account with us, please ignore this email.

Best regards,
Car Marketplace Philippines Team

---
Need help? Contact us at support@carmarketplace.ph
        """.strip()
        
        # HTML version
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                Car Marketplace PH
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                                Your trusted car marketplace in the Philippines
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                                Welcome{f' {user_name}' if user_name else ''}! 🎉
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Thank you for registering with Car Marketplace Philippines. 
                                We're excited to have you on board!
                            </p>
                            
                            <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                To get started, please verify your email address by clicking the button below:
                            </p>
                            
                            <!-- Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{verification_url}" 
                                           style="display: inline-block; background-color: #2563eb; color: #ffffff; 
                                                  text-decoration: none; padding: 16px 40px; border-radius: 6px; 
                                                  font-size: 16px; font-weight: bold; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                                            Verify Email Address
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                Or copy and paste this link in your browser:
                            </p>
                            
                            <p style="margin: 0 0 30px 0; padding: 15px; background-color: #f3f4f6; 
                                      border-radius: 4px; word-break: break-all;">
                                <a href="{verification_url}" 
                                   style="color: #2563eb; text-decoration: none; font-size: 14px;">
                                    {verification_url}
                                </a>
                            </p>
                            
                            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; 
                                        padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                                    ⏰ <strong>Important:</strong> This verification link will expire in 24 hours.
                                </p>
                            </div>
                            
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                If you didn't create an account with Car Marketplace Philippines, 
                                please ignore this email.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center; 
                                   border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Need help? Contact us at 
                                <a href="mailto:support@carmarketplace.ph" 
                                   style="color: #2563eb; text-decoration: none;">
                                    support@carmarketplace.ph
                                </a>
                            </p>
                            
                            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                                © 2024 Car Marketplace Philippines. All rights reserved.
                            </p>
                            
                            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                                This is an automated email. Please do not reply.
                            </p>
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
        
        subject = "Reset your password - Car Marketplace Philippines"
        
        text_body = f"""
Hello{f' {user_name}' if user_name else ''},

We received a request to reset your password for your Car Marketplace Philippines account.

Click the link below to reset your password:
{reset_url}

This link will expire in 1 hour.

If you didn't request a password reset, please ignore this email and your password will remain unchanged.

Best regards,
Car Marketplace Philippines Team
        """.strip()
        
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Password Reset</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                                Reset Your Password
                            </h2>
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                We received a request to reset your password. Click the button below to create a new password:
                            </p>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 20px 0;">
                                        <a href="{reset_url}" 
                                           style="display: inline-block; background-color: #dc2626; color: #ffffff; 
                                                  text-decoration: none; padding: 16px 40px; border-radius: 6px; 
                                                  font-size: 16px; font-weight: bold;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="margin: 20px 0; color: #6b7280; font-size: 14px;">
                                Or copy this link: <a href="{reset_url}" style="color: #2563eb;">{reset_url}</a>
                            </p>
                            <div style="background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
                                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                                    ⏰ This link will expire in 1 hour.
                                </p>
                            </div>
                            <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px;">
                                If you didn't request this, please ignore this email.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2024 Car Marketplace Philippines
                            </p>
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
        subject = "Welcome to Car Marketplace Philippines! 🎉"
        
        text_body = f"""
Hello {user_name},

Your email has been successfully verified! Welcome to Car Marketplace Philippines.

You can now:
- Browse thousands of cars for sale
- Post your own car listings (after phone verification)
- Connect with verified buyers and sellers
- Access premium features

Get started now: {settings.FRONTEND_URL}

Best regards,
Car Marketplace Philippines Team
        """.strip()
        
        html_body = f"""
<!DOCTYPE html>
<html>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Welcome! 🎉</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937;">Hello {user_name}!</h2>
                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Your email has been successfully verified! You're all set to start using Car Marketplace Philippines.
                            </p>
                            <h3 style="color: #1f2937; margin: 30px 0 15px 0;">What you can do now:</h3>
                            <ul style="color: #4b5563; line-height: 1.8;">
                                <li>Browse thousands of cars for sale</li>
                                <li>Save your favorite listings</li>
                                <li>Contact sellers directly</li>
                                <li>Post your own car listings (after phone verification)</li>
                            </ul>
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center" style="padding: 30px 0;">
                                        <a href="{settings.FRONTEND_URL}"
                                           style="display: inline-block; background-color: #10b981; color: #ffffff;
                                                  text-decoration: none; padding: 16px 40px; border-radius: 6px;
                                                  font-size: 16px; font-weight: bold;">
                                            Start Browsing Cars
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2024 Car Marketplace Philippines
                            </p>
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

        subject = f"New {email_type} for your car: {car_title}"

        car_url = f"{settings.FRONTEND_URL}/cars/{car_id}"

        # Build offer details section
        offer_section = ""
        if is_offer:
            offer_section = f"\n\nOffered Price: ₱{offered_price:,.2f}"

        text_body = f"""
Hello {seller_name},

Great news! You've received a new {email_type.lower()} for your car listing.

Car: {car_title}
From: {buyer_name}
Email: {buyer_email}
Phone: {buyer_phone}
Type: {inquiry_type.replace('_', ' ').title()}{offer_section}

Message:
{message}

View car listing: {car_url}

You can respond to this inquiry by logging into your dashboard at {settings.FRONTEND_URL}/dashboard

Best regards,
AutoHub Team

---
Need help? Contact us at support@carmarketplace.ph
        """.strip()

        # HTML version with conditional offer styling
        offer_html = ""
        if is_offer:
            offer_html = f"""
            <div style="background-color: #dcfce7; border-left: 4px solid #10b981;
                        padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: bold;">
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
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">
                                AutoHub
                            </h1>
                            <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 16px;">
                                New {email_type} Received 🎉
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                                Hello {seller_name}!
                            </h2>

                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                Great news! You've received a new {email_type.lower()} for your car listing:
                            </p>

                            <!-- Car Info Box -->
                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                                <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
                                    🚗 {car_title}
                                </p>
                            </div>

                            {offer_html}

                            <!-- Buyer Details -->
                            <div style="margin: 25px 0;">
                                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">
                                    Buyer Information
                                </h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px; width: 100px;">
                                            <strong>Name:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            {buyer_name}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                            <strong>Email:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            <a href="mailto:{buyer_email}" style="color: #2563eb; text-decoration: none;">
                                                {buyer_email}
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                            <strong>Phone:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            <a href="tel:{buyer_phone}" style="color: #2563eb; text-decoration: none;">
                                                {buyer_phone}
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">
                                            <strong>Type:</strong>
                                        </td>
                                        <td style="padding: 8px 0; color: #1f2937; font-size: 14px;">
                                            {inquiry_type.replace('_', ' ').title()}
                                        </td>
                                    </tr>
                                </table>
                            </div>

                            <!-- Message -->
                            <div style="margin: 25px 0;">
                                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">
                                    Message
                                </h3>
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px;
                                            border-left: 4px solid #2563eb;">
                                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
{message}
                                    </p>
                                </div>
                            </div>

                            <!-- Action Buttons -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{settings.FRONTEND_URL}/dashboard/inquiries"
                                           style="display: inline-block; background-color: #2563eb; color: #ffffff;
                                                  text-decoration: none; padding: 16px 32px; border-radius: 6px;
                                                  font-size: 16px; font-weight: bold; margin-right: 10px;
                                                  box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                                            View in Dashboard
                                        </a>
                                        <a href="{car_url}"
                                           style="display: inline-block; background-color: #6b7280; color: #ffffff;
                                                  text-decoration: none; padding: 16px 32px; border-radius: 6px;
                                                  font-size: 16px; font-weight: bold;">
                                            View Car Listing
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <div style="background-color: #dbeafe; border-left: 4px solid #2563eb;
                                        padding: 15px; margin: 20px 0; border-radius: 4px;">
                                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">
                                    💡 <strong>Tip:</strong> Respond quickly to increase your chances of closing the deal!
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 30px; text-align: center;
                                   border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Need help? Contact us at
                                <a href="mailto:support@carmarketplace.ph"
                                   style="color: #2563eb; text-decoration: none;">
                                    support@carmarketplace.ph
                                </a>
                            </p>

                            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                                © 2024 AutoHub. All rights reserved.
                            </p>

                            <p style="margin: 10px 0 0 0; color: #9ca3af; font-size: 12px;">
                                This is an automated email. Please do not reply directly to this email.
                            </p>
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

        subject = f"Response to your inquiry: {car_title}"
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
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px;">AutoHub</h1>
                            <p style="margin: 10px 0 0 0; color: #d1fae5; font-size: 16px;">
                                New Response Received 📧
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px;">
                                Hello {buyer_name}!
                            </h2>

                            <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                                You've received a response to your inquiry about:
                            </p>

                            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
                                <p style="margin: 0 0 10px 0; color: #1f2937; font-size: 18px; font-weight: bold;">
                                    🚗 {car_title}
                                </p>
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    From: {seller_name}
                                </p>
                            </div>

                            <div style="margin: 25px 0;">
                                <h3 style="margin: 0 0 15px 0; color: #1f2937; font-size: 18px;">
                                    Seller's Response
                                </h3>
                                <div style="background-color: #f9fafb; padding: 20px; border-radius: 6px;
                                            border-left: 4px solid #10b981;">
                                    <p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">
{response_message}
                                    </p>
                                </div>
                            </div>

                            <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="{car_url}"
                                           style="display: inline-block; background-color: #10b981; color: #ffffff;
                                                  text-decoration: none; padding: 16px 32px; border-radius: 6px;
                                                  font-size: 16px; font-weight: bold;
                                                  box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                            View Car Listing
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 20px; text-align: center;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © 2024 AutoHub. All rights reserved.
                            </p>
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