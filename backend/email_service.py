import os
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()


def send_email(
    to_email: str,
    subject: str,
    body: str
):
    """
    Send a plain-text email through the configured SMTP server.
    """

    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_from = os.getenv("SMTP_FROM") or smtp_username

    if not smtp_host:
        raise ValueError("SMTP_HOST is not configured")

    if not smtp_username:
        raise ValueError("SMTP_USERNAME is not configured")

    if not smtp_password:
        raise ValueError("SMTP_PASSWORD is not configured")

    message = EmailMessage()

    message["From"] = smtp_from
    message["To"] = to_email
    message["Subject"] = subject

    message.set_content(body)

    with smtplib.SMTP(smtp_host, smtp_port) as server:
        server.starttls()
        server.login(
            smtp_username,
            smtp_password
        )
        server.send_message(message)

    return True