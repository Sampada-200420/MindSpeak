from fastapi import APIRouter
from database import get_connection

router = APIRouter()


# ======================================================
# GET PENDING MENTOR APPLICATIONS
# ======================================================

@router.get("/mentor-applications")
def get_mentor_applications(session_token: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # GET APPLICATIONS
        cursor.execute(
            """
            SELECT
                ma.id,
                ma.user_id,
                ma.reason,
                ma.topics,
                ma.languages,
                ma.availability,
                ma.experience,
                ma.guidelines_agreed,
                ma.status,
                ma.admin_note,
                ma.created_at,
                ma.reviewed_at,
                u.nickname,
                u.avatar
            FROM mentor_applications ma
            JOIN users u
                ON ma.user_id = u.id
            ORDER BY ma.created_at DESC
            """
        )

        applications = cursor.fetchall()

        return {
            "applications": applications
        }

    except Exception as error:

        print("Get mentor applications error:", error)

        return {
            "error": "Unable to load mentor applications."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# REVIEW MENTOR APPLICATION
# ======================================================

@router.post("/mentor-applications/{application_id}/review")
def review_mentor_application(
    application_id: int,
    data: dict
):

    session_token = data.get("session_token")
    action = data.get("action")
    admin_note = data.get("admin_note")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        admin_id = admin["id"]

        # VALIDATE ACTION
        if action not in ["approve", "reject"]:
            return {
                "error": "Action must be approve or reject."
            }

        # GET APPLICATION
        cursor.execute(
            """
            SELECT
                id,
                user_id,
                status
            FROM mentor_applications
            WHERE id = %s
            """,
            (application_id,)
        )

        application = cursor.fetchone()

        if not application:
            return {
                "error": "Mentor application not found."
            }

        if application["status"] != "pending":
            return {
                "error": "This application has already been reviewed."
            }

        user_id = application["user_id"]

        # APPROVE
        if action == "approve":

            # Change user role
            cursor.execute(
                """
                UPDATE users
                SET role = 'mentor'
                WHERE id = %s
                """,
                (user_id,)
            )

            # Create mentor profile
            cursor.execute(
                """
                INSERT INTO mentor_profiles
                (
                    user_id,
                    bio,
                    topics,
                    languages,
                    availability
                )
                SELECT
                    user_id,
                    reason,
                    topics,
                    languages,
                    availability
                FROM mentor_applications
                WHERE id = %s
                """,
                (application_id,)
            )

            # Update application
            cursor.execute(
                """
                UPDATE mentor_applications
                SET
                    status = 'approved',
                    admin_note = %s,
                    reviewed_by = %s,
                    reviewed_at = NOW()
                WHERE id = %s
                """,
                (
                    admin_note,
                    admin_id,
                    application_id
                )
            )

            conn.commit()

            return {
                "message": "Mentor application approved successfully.",
                "status": "approved",
                "user_id": user_id
            }

        # REJECT
        if action == "reject":

            cursor.execute(
                """
                UPDATE mentor_applications
                SET
                    status = 'rejected',
                    admin_note = %s,
                    reviewed_by = %s,
                    reviewed_at = NOW()
                WHERE id = %s
                """,
                (
                    admin_note,
                    admin_id,
                    application_id
                )
            )

            conn.commit()

            return {
                "message": "Mentor application rejected.",
                "status": "rejected",
                "user_id": user_id
            }

    except Exception as error:

        conn.rollback()

        print(
            "Review mentor application error:",
            error
        )

        return {
            "error": "Unable to review mentor application."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET ALL USERS
# ======================================================

@router.get("/users")
def get_all_users(session_token: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # GET USERS
        cursor.execute(
            """
            SELECT
                id,
                username,
                email,
                nickname,
                avatar,
                role,
                is_mentor_online,
                is_verified,
                created_at
            FROM users
            ORDER BY created_at DESC
            """
        )

        users = cursor.fetchall()

        return {
            "users": users
        }

    except Exception as error:

        print("Get all users error:", error)

        return {
            "error": "Unable to load users."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET JOURNAL ACTIVITY METADATA
# ======================================================

@router.get("/journal-metadata")
def get_journal_metadata(session_token: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # GET JOURNAL ACTIVITY METADATA
        cursor.execute(
            """
            SELECT
                u.id AS user_id,
                u.nickname,
                u.avatar,
                COUNT(je.id) AS entry_count,
                MIN(je.created_at) AS first_entry_at,
                MAX(je.created_at) AS last_entry_at
            FROM users u
            LEFT JOIN journal_entries je
                ON u.id = je.user_id
            GROUP BY
                u.id,
                u.nickname,
                u.avatar
            HAVING COUNT(je.id) > 0
            ORDER BY last_entry_at DESC
            """
        )

        journal_metadata = cursor.fetchall()

        return {
            "journal_metadata": journal_metadata
        }

    except Exception as error:

        print(
            "Get journal metadata error:",
            error
        )

        return {
            "error": "Unable to load journal metadata."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET CONNECTION OVERVIEW
# ======================================================

@router.get("/connection-overview")
def get_connection_overview(session_token: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # CONNECTION PROFILE COUNT
        cursor.execute(
            """
            SELECT COUNT(*) AS total_members
            FROM connection_profiles
            """
        )

        total_members = cursor.fetchone()["total_members"]

        # AVAILABLE MEMBERS
        cursor.execute(
            """
            SELECT COUNT(*) AS available_members
            FROM connection_profiles
            WHERE is_available = 1
            """
        )

        available_members = cursor.fetchone()["available_members"]

        # ACTIVE CONNECTIONS
        cursor.execute(
            """
            SELECT COUNT(*) AS active_connections
            FROM connection_conversations
            WHERE status = 'active'
            """
        )

        active_connections = cursor.fetchone()["active_connections"]

        # PENDING REQUESTS
        cursor.execute(
            """
            SELECT COUNT(*) AS pending_requests
            FROM connection_requests
            WHERE status = 'pending'
            """
        )

        pending_requests = cursor.fetchone()["pending_requests"]

        # ENDED CONNECTIONS
        cursor.execute(
            """
            SELECT COUNT(*) AS ended_connections
            FROM connection_conversations
            WHERE status = 'ended'
            """
        )

        ended_connections = cursor.fetchone()["ended_connections"]

        return {
            "total_members": total_members,
            "available_members": available_members,
            "active_connections": active_connections,
            "pending_requests": pending_requests,
            "ended_connections": ended_connections
        }

    except Exception as error:

        print(
            "Get connection overview error:",
            error
        )

        return {
            "error": "Unable to load connection overview."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET CONNECTION MEMBERS FOR ADMIN
# ======================================================

@router.get("/connection-members")
def get_connection_members_admin(
    session_token: str = None
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # GET CONNECTION MEMBERS
        cursor.execute(
            """
            SELECT
                cp.user_id,
                u.nickname,
                u.avatar,
                cp.bio,
                cp.topics,
                cp.is_available,
                cp.created_at,
                cp.updated_at
            FROM connection_profiles cp
            JOIN users u
                ON cp.user_id = u.id
            WHERE u.role != 'admin'
            ORDER BY cp.updated_at DESC
            """
        )

        members = cursor.fetchall()

        return {
            "members": members,
            "count": len(members)
        }

    except Exception as error:

        print(
            "Get admin connection members error:",
            error
        )

        return {
            "error": "Unable to load connection members."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# CONTACT MESSAGES
# ======================================================

@router.get("/contact-messages")
def get_contact_messages(session_token: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                name,
                email,
                subject,
                message,
                status,
                admin_reply,
                created_at,
                replied_at
            FROM contact_messages
            ORDER BY created_at DESC
            """
        )

        messages = cursor.fetchall()

        return {
            "messages": messages,
            "count": len(messages)
        }

    except Exception as error:

        print(
            "Get contact messages error:",
            error
        )

        return {
            "error": "Unable to load contact messages."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# UPDATE CONTACT MESSAGE
# ======================================================

@router.put("/contact-messages/{message_id}")
def update_contact_message(
    message_id: int,
    data: dict
):

    session_token = data.get("session_token")
    status = data.get("status")
    admin_reply = data.get("admin_reply")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        allowed_statuses = [
            "new",
            "read",
            "replied",
            "closed"
        ]

        if status not in allowed_statuses:
            return {
                "error": "Status must be new, read, replied, or closed."
            }

        # CHECK MESSAGE
        cursor.execute(
            """
            SELECT id
            FROM contact_messages
            WHERE id = %s
            """,
            (message_id,)
        )

        message = cursor.fetchone()

        if not message:
            return {
                "error": "Contact message not found."
            }

        # UPDATE
        if status == "replied":

            cursor.execute(
                """
                UPDATE contact_messages
                SET
                    status = %s,
                    admin_reply = %s,
                    replied_at = NOW()
                WHERE id = %s
                """,
                (
                    status,
                    admin_reply,
                    message_id
                )
            )

        else:

            cursor.execute(
                """
                UPDATE contact_messages
                SET
                    status = %s
                WHERE id = %s
                """,
                (
                    status,
                    message_id
                )
            )

        conn.commit()

        return {
            "message": "Contact message updated successfully.",
            "status": status
        }

    except Exception as error:

        conn.rollback()

        print(
            "Update contact message error:",
            error
        )

        return {
            "error": "Unable to update contact message."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# NEWSLETTER SUBSCRIBERS
# ======================================================

@router.get("/newsletter-subscribers")
def get_newsletter_subscribers(
    session_token: str = None
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                email,
                status,
                subscribed_at,
                unsubscribed_at
            FROM newsletter_subscribers
            ORDER BY subscribed_at DESC
            """
        )

        subscribers = cursor.fetchall()

        return {
            "subscribers": subscribers,
            "count": len(subscribers)
        }

    except Exception as error:

        print(
            "Get newsletter subscribers error:",
            error
        )

        return {
            "error": "Unable to load newsletter subscribers."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET CONTACT FEEDBACK
# ======================================================

@router.get("/feedback")
def get_feedback(session_token: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # GET FEEDBACK
        cursor.execute(
            """
            SELECT
                id,
                user_id,
                name,
                email,
                rating,
                feedback,
                status,
                created_at
            FROM feedback
            ORDER BY created_at DESC
            """
        )

        feedback = cursor.fetchall()

        return {
            "feedback": feedback,
            "count": len(feedback)
        }

    except Exception as error:

        print(
            "Get contact feedback error:",
            error
        )

        return {
            "error": "Unable to load feedback."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# UPDATE CONTACT FEEDBACK
# ======================================================

@router.put("/feedback/{feedback_id}")
def update_feedback(
    feedback_id: int,
    data: dict
):

    session_token = data.get("session_token")
    status = data.get("status")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # VALIDATE STATUS
        if status not in ["new", "reviewed"]:
            return {
                "error": "Invalid feedback status."
            }

        # CHECK FEEDBACK EXISTS
        cursor.execute(
            """
            SELECT id
            FROM feedback
            WHERE id = %s
            """,
            (feedback_id,)
        )

        feedback = cursor.fetchone()

        if not feedback:
            return {
                "error": "Feedback not found."
            }

        # UPDATE
        cursor.execute(
            """
            UPDATE feedback
            SET status = %s
            WHERE id = %s
            """,
            (
                status,
                feedback_id
            )
        )

        conn.commit()

        return {
            "message": "Feedback status updated successfully.",
            "feedback_id": feedback_id,
            "status": status
        }

    except Exception as error:

        conn.rollback()

        print(
            "Update contact feedback error:",
            error
        )

        return {
            "error": "Unable to update feedback."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# JOIN APPLICATIONS
# ======================================================

@router.get("/join-applications")
def get_join_applications(
    session_token: str = None
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                application_type,
                name,
                email,
                phone,
                organization,
                motivation,
                experience,
                skills,
                availability,
                additional_information,
                status,
                admin_notes,
                reviewed_by,
                created_at,
                updated_at
            FROM join_applications
            ORDER BY created_at DESC
            """
        )

        applications = cursor.fetchall()

        return {
            "applications": applications,
            "count": len(applications)
        }

    except Exception as error:

        print(
            "Get join applications error:",
            error
        )

        return {
            "error": "Unable to load join applications."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# REVIEW JOIN APPLICATION
# ======================================================

@router.put("/join-applications/{application_id}")
def review_join_application(
    application_id: int,
    data: dict
):

    session_token = data.get("session_token")
    status = data.get("status")
    admin_notes = data.get("admin_notes")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        allowed_statuses = [
            "pending",
            "under_review",
            "accepted",
            "rejected"
        ]

        if status not in allowed_statuses:
            return {
                "error": "Invalid application status."
            }

        # CHECK APPLICATION
        cursor.execute(
            """
            SELECT id
            FROM join_applications
            WHERE id = %s
            """,
            (application_id,)
        )

        application = cursor.fetchone()

        if not application:
            return {
                "error": "Join application not found."
            }

        # UPDATE APPLICATION
        cursor.execute(
            """
            UPDATE join_applications
            SET
                status = %s,
                admin_notes = %s,
                reviewed_by = %s,
                updated_at = NOW()
            WHERE id = %s
            """,
            (
                status,
                admin_notes,
                admin["id"],
                application_id
            )
        )

        conn.commit()

        return {
            "message": "Join application updated successfully.",
            "status": status
        }

    except Exception as error:

        conn.rollback()

        print(
            "Review join application error:",
            error
        )

        return {
            "error": "Unable to update join application."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# FAQ MANAGEMENT
# ======================================================

@router.get("/faqs")
def get_admin_faqs(session_token: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # GET ALL FAQS
        cursor.execute(
            """
            SELECT
                id,
                question,
                answer,
                category,
                display_order,
                is_active,
                created_at,
                updated_at
            FROM faqs
            ORDER BY display_order ASC, id ASC
            """
        )

        faqs = cursor.fetchall()

        return {
            "faqs": faqs,
            "count": len(faqs)
        }

    except Exception as error:

        print(
            "Get admin FAQs error:",
            error
        )

        return {
            "error": "Unable to load FAQs."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# CREATE FAQ
# ======================================================

@router.post("/faqs")
def create_faq(data: dict):

    session_token = data.get("session_token")
    question = data.get("question")
    answer = data.get("answer")
    category = data.get("category")
    display_order = data.get("display_order", 0)
    is_active = data.get("is_active", True)

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # VALIDATE REQUIRED FIELDS
        if not question or not question.strip():
            return {
                "error": "Question is required."
            }

        if not answer or not answer.strip():
            return {
                "error": "Answer is required."
            }

        try:
            display_order = int(display_order)
        except (TypeError, ValueError):
            return {
                "error": "Display order must be a number."
            }

        # INSERT FAQ
        cursor.execute(
            """
            INSERT INTO faqs
            (
                question,
                answer,
                category,
                display_order,
                is_active
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                question.strip(),
                answer.strip(),
                category.strip()
                    if isinstance(category, str)
                    else None,
                display_order,
                1 if is_active else 0
            )
        )

        faq_id = cursor.lastrowid

        conn.commit()

        return {
            "message": "FAQ created successfully.",
            "faq_id": faq_id
        }

    except Exception as error:

        conn.rollback()

        print(
            "Create FAQ error:",
            error
        )

        return {
            "error": "Unable to create FAQ."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# UPDATE FAQ
# ======================================================

@router.put("/faqs/{faq_id}")
def update_faq(
    faq_id: int,
    data: dict
):

    session_token = data.get("session_token")
    question = data.get("question")
    answer = data.get("answer")
    category = data.get("category")
    display_order = data.get("display_order")
    is_active = data.get("is_active")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # CHECK FAQ
        cursor.execute(
            """
            SELECT id
            FROM faqs
            WHERE id = %s
            """,
            (faq_id,)
        )

        faq = cursor.fetchone()

        if not faq:
            return {
                "error": "FAQ not found."
            }

        # VALIDATE
        if not question or not question.strip():
            return {
                "error": "Question is required."
            }

        if not answer or not answer.strip():
            return {
                "error": "Answer is required."
            }

        try:
            display_order = int(display_order)
        except (TypeError, ValueError):
            return {
                "error": "Display order must be a number."
            }

        # UPDATE FAQ
        cursor.execute(
            """
            UPDATE faqs
            SET
                question = %s,
                answer = %s,
                category = %s,
                display_order = %s,
                is_active = %s
            WHERE id = %s
            """,
            (
                question.strip(),
                answer.strip(),
                category.strip()
                    if isinstance(category, str)
                    else None,
                display_order,
                1 if is_active else 0,
                faq_id
            )
        )

        conn.commit()

        return {
            "message": "FAQ updated successfully.",
            "faq_id": faq_id
        }

    except Exception as error:

        conn.rollback()

        print(
            "Update FAQ error:",
            error
        )

        return {
            "error": "Unable to update FAQ."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# DELETE FAQ
# ======================================================

@router.delete("/faqs/{faq_id}")
def delete_faq(
    faq_id: int,
    session_token: str = None
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        cursor.execute(
            """
            SELECT u.id, u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        admin = cursor.fetchone()

        if not admin or admin["role"] != "admin":
            return {
                "error": "Admin access required"
            }

        # CHECK FAQ
        cursor.execute(
            """
            SELECT id
            FROM faqs
            WHERE id = %s
            """,
            (faq_id,)
        )

        faq = cursor.fetchone()

        if not faq:
            return {
                "error": "FAQ not found."
            }

        # DELETE
        cursor.execute(
            """
            DELETE FROM faqs
            WHERE id = %s
            """,
            (faq_id,)
        )

        conn.commit()

        return {
            "message": "FAQ deleted successfully.",
            "faq_id": faq_id
        }

    except Exception as error:

        conn.rollback()

        print(
            "Delete FAQ error:",
            error
        )

        return {
            "error": "Unable to delete FAQ."
        }

    finally:

        cursor.close()
        conn.close()