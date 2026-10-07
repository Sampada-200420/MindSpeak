from email_service import send_email


send_email(
    to_email="sampadadhakal2@gmail.com",
    subject="MindSpeak Email Test",
    body="""Hello!

This is a test email from MindSpeak.

If you received this email, the MindSpeak email system is working correctly.

MindSpeak 💚"""
)

print("Test email sent successfully!")