import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from core.config import settings

logger = logging.getLogger(__name__)

async def send_password_reset_email(user_email: str, user_name: str, reset_token: str) -> bool:
    """
    Send password reset email using Gmail SMTP
    
    Args:
        user_email: User's email address
        user_name: User's name for personalization
        reset_token: Password reset token
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    # Check if emails are enabled
    if not settings.EMAILS_ENABLED:
        logger.info(f"Emails disabled. Password reset token for {user_email}: {reset_token}")
        return False
    
    gmail_user = settings.GMAIL_USER
    gmail_password = settings.GMAIL_APP_PASSWORD
    
    if not gmail_user or not gmail_password:
        logger.error("Gmail credentials not configured")
        return False
    
    try:
        # Create the email message
        message = MIMEMultipart("alternative")
        message["Subject"] = "Password Reset Request"
        message["From"] = f"Nexotype <{gmail_user}>"
        message["To"] = user_email
        
        # Create reset URL using settings
        frontend_url = settings.FRONTEND_URL
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        # Create HTML and plain text versions
        html_content = create_html_template(user_name, reset_url)
        text_content = create_text_template(user_name, reset_url)
        
        # Create MIMEText objects
        text_part = MIMEText(text_content, "plain")
        html_part = MIMEText(html_content, "html")
        
        # Add parts to message
        message.attach(text_part)
        message.attach(html_part)
        
        # Send the email
        await aiosmtplib.send(
            message,
            hostname="smtp.gmail.com",
            port=587,
            start_tls=True,
            username=gmail_user,
            password=gmail_password,
        )
        
        logger.info(f"Password reset email sent successfully to {user_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send password reset email to {user_email}: {str(e)}")
        return False


def create_html_template(user_name: str, reset_url: str) -> str:
    """Create HTML email template for password reset"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset Request</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
            <!-- Header -->
            <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #e0e0e0;">
                <h1 style="color: #333333; margin: 0; font-size: 28px;">Nexotype</h1>
                <p style="color: #666666; margin: 5px 0 0 0;">Genomics Platform</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px 0;">
                <h2 style="color: #333333; margin: 0 0 20px 0; font-size: 24px;">Password Reset Request</h2>
                
                <p style="color: #555555; line-height: 1.6; margin: 0 0 20px 0;">
                    Hi {user_name or 'there'},
                </p>
                
                <p style="color: #555555; line-height: 1.6; margin: 0 0 30px 0;">
                    You requested a password reset for your Nexotype account. Click the button below to create a new password:
                </p>
                
                <!-- Reset Button -->
                <div style="text-align: center; margin: 40px 0;">
                    <a href="{reset_url}" 
                       style="background-color: #007bff; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
                        Reset Password
                    </a>
                </div>
                
                <p style="color: #555555; line-height: 1.6; margin: 0 0 20px 0;">
                    Or copy and paste this link into your browser:
                </p>
                
                <p style="background-color: #f8f9fa; padding: 12px; border-radius: 4px; word-break: break-all; color: #333333; font-family: monospace; font-size: 14px;">
                    {reset_url}
                </p>
                
                <!-- Security Notice -->
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 30px 0;">
                    <p style="color: #856404; margin: 0; font-size: 14px;">
                        <strong>⚠️ Important:</strong><br>
                        • This link will expire in <strong>1 hour</strong><br>
                        • If you didn't request this reset, please ignore this email<br>
                        • Your password will remain unchanged unless you click the link above
                    </p>
                </div>
                
                <p style="color: #555555; line-height: 1.6; margin: 30px 0 0 0;">
                    If you're having trouble with the button above, you can also reset your password by visiting our website and using the "Forgot Password" option.
                </p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e0e0e0; color: #999999; font-size: 12px;">
                <p style="margin: 0;">
                    This email was sent from Nexotype. Please do not reply to this email.
                </p>
                <p style="margin: 10px 0 0 0;">
                    © 2024 Nexotype. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
    """


def create_text_template(user_name: str, reset_url: str) -> str:
    """Create plain text email template for password reset"""
    return f"""
Nexotype - Password Reset Request

Hi {user_name or 'there'},

You requested a password reset for your Nexotype account.

To reset your password, please visit the following link:
{reset_url}

Important:
- This link will expire in 1 hour
- If you didn't request this reset, please ignore this email
- Your password will remain unchanged unless you use the link above

If you're having trouble with the link, you can copy and paste it into your browser's address bar.

This email was sent from Nexotype. Please do not reply to this email.

© 2024 Nexotype. All rights reserved.
    """