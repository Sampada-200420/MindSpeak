from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from database import get_connection


router = APIRouter(
    prefix="/api/contact",
    tags=["Contact"]
)


# =========================================================
# REQUEST MODELS
# =========================================================

class ContactMessage(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class NewsletterSubscription(BaseModel):
    email: EmailStr

class FeedbackSubmission(BaseModel):
    name: str
    email: EmailStr
    rating: int
    feedback: str

class FAQItem(BaseModel):
    question: str
    answer: str
    category: str | None = None
    display_order: int = 0
    is_active: bool = True
# =========================================================
# SEND CONTACT MESSAGE
# =========================================================
@router.post("/messages")
def submit_contact_message(data: ContactMessage):

    connection = get_connection()

    if connection is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = connection.cursor()

    try:

        query = """
            INSERT INTO contact_messages
            (
                name,
                email,
                subject,
                message,
                status,
                created_at
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                'new',
                NOW()
            )
        """

        cursor.execute(
            query,
            (
                data.name,
                data.email,
                data.subject,
                data.message
            )
        )

        connection.commit()

        return {
            "message": "Your message has been sent successfully."
        }

    except Exception as e:

        connection.rollback()

        print(
            "CONTACT MESSAGE DATABASE ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

    finally:

        cursor.close()
        connection.close()


# =========================================================
# NEWSLETTER SUBSCRIPTION
# =========================================================

@router.post("/newsletter")
def subscribe_newsletter(
    data: NewsletterSubscription
):

    conn = None
    cursor = None

    try:

        conn = get_connection()

        cursor = conn.cursor(dictionary=True)

        email = data.email.strip().lower()


        # -------------------------------------------------
        # CHECK WHETHER EMAIL ALREADY EXISTS
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT id, status
            FROM newsletter_subscribers
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        existing = cursor.fetchone()


        if existing:

            if existing["status"] == "active":

                return {
                    "success": True,
                    "message":
                        "This email is already subscribed."
                }


            # Reactivate previous subscription

            cursor.execute(
                """
                UPDATE newsletter_subscribers
                SET
                    status = 'active',
                    subscribed_at = NOW(),
                    unsubscribed_at = NULL
                WHERE id = %s
                """,
                (existing["id"],)
            )

        else:

            cursor.execute(
                """
                INSERT INTO newsletter_subscribers
                (
                    email,
                    status,
                    subscribed_at
                )
                VALUES
                (
                    %s,
                    'active',
                    NOW()
                )
                """,
                (email,)
            )


        conn.commit()


        return {
            "success": True,
            "message":
                "You're subscribed! Thank you for joining MindSpeak."
        }


    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "Newsletter subscription error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to subscribe right now."
        )


    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()

# =========================================================
# SUBMIT FEEDBACK
# =========================================================

@router.post("/feedback")
def submit_feedback(data: FeedbackSubmission):

    connection = get_connection()

    if connection is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = connection.cursor()

    try:

        # -------------------------------------------------
        # VALIDATE RATING
        # -------------------------------------------------

        if data.rating < 1 or data.rating > 5:
            raise HTTPException(
                status_code=400,
                detail="Rating must be between 1 and 5."
            )

        # -------------------------------------------------
        # INSERT FEEDBACK
        # -------------------------------------------------

        query = """
            INSERT INTO feedback
            (
                name,
                email,
                rating,
                feedback,
                status,
                created_at
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                'new',
                NOW()
            )
        """

        cursor.execute(
            query,
            (
                data.name.strip(),
                data.email,
                data.rating,
                data.feedback.strip()
            )
        )

        connection.commit()

        return {
            "success": True,
            "message":
                "Thank you for your feedback. Your response has been received."
        }

    except HTTPException:
        connection.rollback()
        raise

    except Exception as e:

        connection.rollback()

        print(
            "FEEDBACK DATABASE ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to submit feedback right now."
        )

    finally:

        cursor.close()
        connection.close()

# =========================================================
# GET ACTIVE FAQs
# =========================================================

@router.get("/faqs")
def get_faqs():

    connection = get_connection()

    if connection is None:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = connection.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                question,
                answer,
                category,
                display_order
            FROM faqs
            WHERE is_active = 1
            ORDER BY display_order ASC, id ASC
            """
        )

        faqs = cursor.fetchall()

        return {
            "success": True,
            "faqs": faqs,
            "count": len(faqs)
        }

    except Exception as e:

        print(
            "GET FAQ DATABASE ERROR:",
            repr(e)
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load FAQs."
        )

    finally:

        cursor.close()
        connection.close()