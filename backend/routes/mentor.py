from fastapi import APIRouter
from database import get_connection


router = APIRouter()


# ======================================================
# HELPER — GET CURRENT USER FROM SESSION
# ======================================================

def get_current_user(cursor, session_token):

    if not session_token:
        return None

    cursor.execute(
        """
        SELECT
            u.id,
            u.role,
            u.nickname,
            u.avatar
        FROM user_sessions s
        JOIN users u
            ON s.user_id = u.id
        WHERE s.session_token = %s
        AND s.expires_at > NOW()
        """,
        (session_token,)
    )

    return cursor.fetchone()


# ======================================================
# APPLY TO BECOME A MENTOR
# ======================================================

@router.post("/apply")
def apply_as_mentor(
    data: dict
):

    session_token = data.get("session_token")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY USER SESSION
        # --------------------------------------------------

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:
            return {
                "error": "Please login first."
            }

        user_id = user["id"]


        # --------------------------------------------------
        # CHECK CURRENT ROLE
        # --------------------------------------------------

        if user["role"] == "mentor":

            return {
                "error": "You are already a mentor."
            }


        # --------------------------------------------------
        # CHECK FOR PENDING APPLICATION
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM mentor_applications
            WHERE user_id = %s
            AND status = 'pending'
            LIMIT 1
            """,
            (user_id,)
        )

        existing = cursor.fetchone()

        if existing:

            return {
                "error": "You already have a pending mentor application."
            }


        # --------------------------------------------------
        # GET APPLICATION DATA
        # --------------------------------------------------

        reason = data.get("reason")
        topics = data.get("topics")
        languages = data.get("languages")
        availability = data.get("availability")
        experience = data.get("experience")
        guidelines_agreed = data.get(
            "guidelines_agreed",
            False
        )


        # --------------------------------------------------
        # VALIDATION
        # --------------------------------------------------

        if not reason:

            return {
                "error": "Please tell us why you want to become a mentor."
            }


        if not guidelines_agreed:

            return {
                "error": "You must agree to the mentor guidelines."
            }


        # --------------------------------------------------
        # INSERT APPLICATION
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT INTO mentor_applications
            (
                user_id,
                reason,
                topics,
                languages,
                availability,
                experience,
                guidelines_agreed
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (
                user_id,
                reason,
                topics,
                languages,
                availability,
                experience,
                guidelines_agreed
            )
        )

        conn.commit()


        return {
            "message": "Mentor application submitted successfully.",
            "status": "pending"
        }


    except Exception as error:

        conn.rollback()

        print(
            "Mentor application error:",
            error
        )

        return {
            "error": "Unable to submit mentor application."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MY MENTOR APPLICATION
# ======================================================

@router.get("/my-application")
def get_my_application(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY USER
        # --------------------------------------------------

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        # --------------------------------------------------
        # GET LATEST APPLICATION
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                reason,
                topics,
                languages,
                availability,
                experience,
                status,
                admin_note,
                created_at,
                reviewed_at
            FROM mentor_applications
            WHERE user_id = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user["id"],)
        )

        application = cursor.fetchone()


        if not application:

            return {
                "application": None
            }


        return {
            "application": application
        }


    except Exception as error:

        print(
            "Get mentor application error:",
            error
        )

        return {
            "error": "Unable to load mentor application."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET AVAILABLE MENTORS
# ======================================================

@router.get("/mentors")
def get_mentors(
    session_token: str = None
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY USER
        # --------------------------------------------------

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        # --------------------------------------------------
        # GET APPROVED MENTORS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                u.id,
                u.nickname,
                u.avatar,
                u.is_mentor_online,
                mp.bio,
                mp.topics,
                mp.languages,
                mp.availability,
                mp.average_response_time
            FROM users u
            JOIN mentor_profiles mp
                ON u.id = mp.user_id
            WHERE u.role = 'mentor'
            ORDER BY
                u.is_mentor_online DESC,
                u.nickname ASC
            """
        )

        mentors = cursor.fetchall()


        return {
            "mentors": mentors
        }


    except Exception as error:

        print(
            "Get mentors error:",
            error
        )

        return {
            "error": "Unable to load mentors."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET SINGLE MENTOR PROFILE
# ======================================================

@router.get("/profile/{mentor_id}")
def get_mentor_profile(
    mentor_id: int,
    session_token: str = None
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY USER SESSION
        # --------------------------------------------------

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        # --------------------------------------------------
        # GET MENTOR PROFILE
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                u.id,
                u.nickname,
                u.avatar,
                u.is_mentor_online,
                mp.bio,
                mp.topics,
                mp.languages,
                mp.availability,
                mp.average_response_time
            FROM users u
            JOIN mentor_profiles mp
                ON u.id = mp.user_id
            WHERE u.id = %s
            AND u.role = 'mentor'
            LIMIT 1
            """,
            (mentor_id,)
        )

        mentor = cursor.fetchone()


        # --------------------------------------------------
        # MENTOR NOT FOUND
        # --------------------------------------------------

        if not mentor:

            return {
                "error": "Mentor not found."
            }


        # --------------------------------------------------
        # RETURN SAFE PUBLIC PROFILE
        # --------------------------------------------------

        return {
            "mentor": mentor
        }


    except Exception as error:

        print(
            "Get mentor profile error:",
            error
        )

        return {
            "error": "Unable to load mentor profile."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# CREATE MENTOR SUPPORT REQUEST
# ======================================================

@router.post("/request")
def create_mentor_request(
    data: dict
):

    session_token = data.get("session_token")
    mentor_id = data.get("mentor_id")
    topic = data.get("topic")
    message = data.get("message")

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY USER SESSION
        # --------------------------------------------------

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }

        user_id = user["id"]


        # --------------------------------------------------
        # VALIDATE MENTOR
        # --------------------------------------------------

        if not mentor_id:

            return {
                "error": "Mentor is required."
            }


        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE id = %s
            AND role = 'mentor'
            LIMIT 1
            """,
            (mentor_id,)
        )

        mentor = cursor.fetchone()


        if not mentor:

            return {
                "error": "Mentor not found."
            }


        # --------------------------------------------------
        # VALIDATE TOPIC
        # --------------------------------------------------

        if not topic:

            return {
                "error": "Please select a support topic."
            }


        if len(topic) > 100:

            return {
                "error": "Topic must be 100 characters or less."
            }


        # --------------------------------------------------
        # VALIDATE MESSAGE
        # --------------------------------------------------

        if message and len(message) > 500:

            return {
                "error": "Message must be 500 characters or less."
            }


        # --------------------------------------------------
        # PREVENT DUPLICATE MENTOR REQUESTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                status
            FROM mentor_requests
            WHERE user_id = %s
            AND mentor_id = %s
            AND status IN ('pending', 'accepted')
            ORDER BY id DESC
            LIMIT 1
            """,
            (
                user_id,
                mentor_id
            )
        )

        existing_request = cursor.fetchone()


        if existing_request:

            if existing_request["status"] == "accepted":

                return {
                    "error": "You are already connected with this mentor."
                }


            return {
                "error": "You already have a pending request with this mentor."
            }


        # --------------------------------------------------
        # CREATE REQUEST
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT INTO mentor_requests
            (
                user_id,
                mentor_id,
                topic,
                message
            )
            VALUES (%s, %s, %s, %s)
            """,
            (
                user_id,
                mentor_id,
                topic,
                message
            )
        )

        conn.commit()


        # --------------------------------------------------
        # RETURN SUCCESS
        # --------------------------------------------------

        return {
            "message": "Support request sent successfully.",
            "status": "pending",
            "request_id": cursor.lastrowid
        }


    except Exception as error:

        conn.rollback()

        print(
            "Create mentor request error:",
            error
        )

        return {
            "error": "Unable to send support request."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET INCOMING MENTOR SUPPORT REQUESTS
# ======================================================

@router.get("/requests")
def get_mentor_requests(
    session_token: str
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY USER SESSION
        # --------------------------------------------------

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        # --------------------------------------------------
        # VERIFY MENTOR ROLE
        # --------------------------------------------------

        if user["role"] != "mentor":

            return {
                "error": "Mentor access required."
            }


        # --------------------------------------------------
        # GET PENDING REQUESTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                mr.id,
                mr.user_id,
                mr.mentor_id,
                mr.topic,
                mr.message,
                mr.status,
                mr.created_at,
                mr.responded_at,

                u.nickname,
                u.avatar

            FROM mentor_requests mr

            JOIN users u
                ON mr.user_id = u.id

            WHERE mr.mentor_id = %s
            AND mr.status = 'pending'

            ORDER BY mr.created_at DESC
            """,
            (user["id"],)
        )

        requests = cursor.fetchall()


        # --------------------------------------------------
        # RETURN REQUESTS
        # --------------------------------------------------

        return {
            "requests": requests,
            "count": len(requests)
        }


    except Exception as error:

        print(
            "Get mentor requests error:",
            error
        )

        return {
            "error": "Unable to load support requests."
        }


    finally:

        cursor.close()
        conn.close()


# =========================================================
# UPDATE MENTOR REQUEST STATUS
# =========================================================

@router.put("/request/{request_id}/status")
def update_mentor_request_status(
    request_id: int,
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

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        if user["role"] != "mentor":

            return {
                "error": "Mentor access required."
            }


        if status not in [
            "accepted",
            "declined"
        ]:

            return {
                "error": "Invalid request status."
            }


        mentor_id = user["id"]


        # -------------------------------------------------
        # FIND THE REQUEST
        # -------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                mentor_id,
                status
            FROM mentor_requests
            WHERE id = %s
            AND mentor_id = %s
            LIMIT 1
            """,
            (
                request_id,
                mentor_id
            )
        )

        request = cursor.fetchone()


        if not request:

            return {
                "error": "Support request not found."
            }


        if request["status"] != "pending":

            return {
                "error": "This request has already been responded to."
            }


        # =================================================
        # ACCEPT REQUEST
        # =================================================

        if status == "accepted":

            # -------------------------------------------------
            # UPDATE REQUEST
            # -------------------------------------------------

            cursor.execute(
                """
                UPDATE mentor_requests
                SET
                    status = 'accepted',
                    responded_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (request_id,)
            )


            # -------------------------------------------------
            # CHECK FOR EXISTING ACTIVE CONVERSATION
            # -------------------------------------------------

            cursor.execute(
                """
                SELECT id
                FROM mentor_conversations
                WHERE user_id = %s
                AND mentor_id = %s
                AND status = 'active'
                LIMIT 1
                """,
                (
                    request["user_id"],
                    mentor_id
                )
            )

            existing_conversation = cursor.fetchone()


            # -------------------------------------------------
            # CREATE CONVERSATION ONLY IF ONE DOES NOT EXIST
            # -------------------------------------------------

            if existing_conversation:

                conversation_id = existing_conversation["id"]

            else:

                cursor.execute(
                    """
                    INSERT INTO mentor_conversations
                    (
                        request_id,
                        user_id,
                        mentor_id,
                        status,
                        started_at
                    )
                    VALUES
                    (
                        %s,
                        %s,
                        %s,
                        'active',
                        CURRENT_TIMESTAMP
                    )
                    """,
                    (
                        request_id,
                        request["user_id"],
                        mentor_id
                    )
                )

                conversation_id = cursor.lastrowid


            conn.commit()


            return {
                "message": "Support request accepted.",
                "status": "accepted",
                "conversation_id": conversation_id
            }


        # =================================================
        # DECLINE REQUEST
        # =================================================

        cursor.execute(
            """
            UPDATE mentor_requests
            SET
                status = 'declined',
                responded_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (request_id,)
        )

        conn.commit()


        return {
            "message": "Support request declined.",
            "status": "declined"
        }


    except Exception as error:

        conn.rollback()

        print(
            "Update mentor request status error:",
            error
        )

        return {
            "error": "Unable to update support request."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MENTOR CONVERSATIONS
# ======================================================

@router.get("/conversations")
def get_mentor_conversations(
    session_token: str
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        user_id = user["id"]
        user_role = user["role"]


        if user_role == "mentor":

            cursor.execute(
                """
                SELECT
                    mc.id,
                    mc.request_id,
                    mc.user_id,
                    mc.mentor_id,
                    mc.status,
                    mc.started_at,
                    mc.ended_at,
                    u.nickname,
                    u.avatar
                FROM mentor_conversations mc
                JOIN users u
                    ON mc.user_id = u.id
                WHERE mc.mentor_id = %s
                ORDER BY mc.started_at DESC
                """,
                (user_id,)
            )

        else:

            cursor.execute(
                """
                SELECT
                    mc.id,
                    mc.request_id,
                    mc.user_id,
                    mc.mentor_id,
                    mc.status,
                    mc.started_at,
                    mc.ended_at,
                    u.nickname,
                    u.avatar
                FROM mentor_conversations mc
                JOIN users u
                    ON mc.mentor_id = u.id
                WHERE mc.user_id = %s
                ORDER BY mc.started_at DESC
                """,
                (user_id,)
            )


        conversations = cursor.fetchall()


        return {
            "conversations": conversations,
            "count": len(conversations)
        }


    except Exception as error:

        print(
            "Get mentor conversations error:",
            error
        )

        return {
            "error": "Unable to load conversations."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET SINGLE MENTOR CONVERSATION
# ======================================================

@router.get("/conversation/{conversation_id}")
def get_mentor_conversation(
    conversation_id: int,
    session_token: str
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        user_id = user["id"]


        cursor.execute(
            """
            SELECT
                mc.id,
                mc.request_id,
                mc.user_id,
                mc.mentor_id,
                mc.status,
                mc.started_at,
                mc.ended_at,

                student.nickname AS student_nickname,
                student.avatar AS student_avatar,

                mentor.nickname AS mentor_nickname,
                mentor.avatar AS mentor_avatar

            FROM mentor_conversations mc

            JOIN users student
                ON mc.user_id = student.id

            JOIN users mentor
                ON mc.mentor_id = mentor.id

            WHERE mc.id = %s
            AND (
                mc.user_id = %s
                OR mc.mentor_id = %s
            )

            LIMIT 1
            """,
            (
                conversation_id,
                user_id,
                user_id
            )
        )

        conversation = cursor.fetchone()


        if not conversation:

            return {
                "error": "Conversation not found or access denied."
            }


        return {
            "conversation": conversation
        }


    except Exception as error:

        print(
            "Get mentor conversation error:",
            error
        )

        return {
            "error": "Unable to load conversation."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MENTOR MESSAGES
# ======================================================

@router.get("/conversation/{conversation_id}/messages")
def get_mentor_messages(
    conversation_id: int,
    session_token: str
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        user_id = user["id"]


        # --------------------------------------------------
        # VERIFY CONVERSATION ACCESS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM mentor_conversations
            WHERE id = %s
            AND (
                user_id = %s
                OR mentor_id = %s
            )
            LIMIT 1
            """,
            (
                conversation_id,
                user_id,
                user_id
            )
        )

        conversation = cursor.fetchone()


        if not conversation:

            return {
                "error": "Conversation not found or access denied."
            }


        # --------------------------------------------------
        # LOAD MESSAGES
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                mm.id,
                mm.conversation_id,
                mm.sender_id,
                mm.message,
                mm.is_read,
                mm.created_at,
                u.nickname,
                u.avatar
            FROM mentor_messages mm
            JOIN users u
                ON mm.sender_id = u.id
            WHERE mm.conversation_id = %s
            ORDER BY mm.created_at ASC, mm.id ASC
            """,
            (conversation_id,)
        )

        messages = cursor.fetchall()


        return {
            "messages": messages,
            "count": len(messages)
        }


    except Exception as error:

        print(
            "Get mentor messages error:",
            error
        )

        return {
            "error": "Unable to load messages."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# SEND MENTOR MESSAGE
# ======================================================

@router.post("/conversation/{conversation_id}/messages")
def send_mentor_message(
    conversation_id: int,
    data: dict
):

    session_token = data.get("session_token")
    message = data.get("message")

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        user_id = user["id"]


        if not message or not message.strip():

            return {
                "error": "Message cannot be empty."
            }


        message = message.strip()


        if len(message) > 2000:

            return {
                "error": "Message must be 2000 characters or less."
            }


        # --------------------------------------------------
        # VERIFY CONVERSATION ACCESS AND STATUS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                mentor_id,
                status
            FROM mentor_conversations
            WHERE id = %s
            AND (
                user_id = %s
                OR mentor_id = %s
            )
            LIMIT 1
            """,
            (
                conversation_id,
                user_id,
                user_id
            )
        )

        conversation = cursor.fetchone()


        if not conversation:

            return {
                "error": "Conversation not found or access denied."
            }


        if conversation["status"] != "active":

            return {
                "error": "This conversation has ended."
            }


        # --------------------------------------------------
        # INSERT MESSAGE
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT INTO mentor_messages
            (
                conversation_id,
                sender_id,
                message,
                is_read
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                conversation_id,
                user_id,
                message,
                0
            )
        )

        conn.commit()


        message_id = cursor.lastrowid


        # --------------------------------------------------
        # FETCH NEW MESSAGE
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                mm.id,
                mm.conversation_id,
                mm.sender_id,
                mm.message,
                mm.is_read,
                mm.created_at,
                u.nickname,
                u.avatar
            FROM mentor_messages mm
            JOIN users u
                ON mm.sender_id = u.id
            WHERE mm.id = %s
            LIMIT 1
            """,
            (message_id,)
        )

        new_message = cursor.fetchone()


        return {
            "message": "Message sent successfully.",
            "data": new_message
        }


    except Exception as error:

        conn.rollback()

        print(
            "Send mentor message error:",
            error
        )

        return {
            "error": "Unable to send message."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# MARK MENTOR MESSAGES AS READ
# ======================================================

@router.put("/conversation/{conversation_id}/messages/read")
def mark_mentor_messages_read(
    conversation_id: int,
    data: dict
):

    session_token = data.get("session_token")

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:

            return {
                "error": "Please login first."
            }


        user_id = user["id"]


        # --------------------------------------------------
        # VERIFY CONVERSATION ACCESS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM mentor_conversations
            WHERE id = %s
            AND (
                user_id = %s
                OR mentor_id = %s
            )
            LIMIT 1
            """,
            (
                conversation_id,
                user_id,
                user_id
            )
        )

        conversation = cursor.fetchone()


        if not conversation:

            return {
                "error": "Conversation not found or access denied."
            }


        # --------------------------------------------------
        # MARK OTHER PERSON'S MESSAGES AS READ
        # --------------------------------------------------

        cursor.execute(
            """
            UPDATE mentor_messages
            SET is_read = 1
            WHERE conversation_id = %s
            AND sender_id != %s
            AND is_read = 0
            """,
            (
                conversation_id,
                user_id
            )
        )

        updated_count = cursor.rowcount

        conn.commit()


        return {
            "message": "Messages marked as read.",
            "updated_count": updated_count
        }


    except Exception as error:

        conn.rollback()

        print(
            "Mark mentor messages read error:",
            error
        )

        return {
            "error": "Unable to mark messages as read."
        }


    finally:

        cursor.close()
        conn.close()