from fastapi import APIRouter
from database import get_connection


router = APIRouter()


# ======================================================
# HELPERS
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


def verify_admin(cursor, session_token):

    user = get_current_user(cursor, session_token)

    if not user:
        return None

    if user["role"] != "admin":
        return None

    return user


# ======================================================
# ADMIN — CONNECTION OVERVIEW
# ======================================================

@router.get("/admin/overview")
def get_admin_connection_overview(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        admin = verify_admin(
            cursor,
            session_token
        )

        if not admin:
            return {
                "error": "Admin access required."
            }


        # --------------------------------------------------
        # TOTAL PROFILES
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_profiles
            """
        )

        total_profiles = cursor.fetchone()["total"]


        # --------------------------------------------------
        # AVAILABLE MEMBERS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_profiles cp
            JOIN users u
                ON cp.user_id = u.id
            WHERE cp.is_available = 1
            AND u.role != 'admin'
            """
        )

        available_members = cursor.fetchone()["total"]


        # --------------------------------------------------
        # UNAVAILABLE MEMBERS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_profiles cp
            JOIN users u
                ON cp.user_id = u.id
            WHERE cp.is_available = 0
            AND u.role != 'admin'
            """
        )

        unavailable_members = cursor.fetchone()["total"]


        # --------------------------------------------------
        # PENDING REQUESTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_requests
            WHERE status = 'pending'
            """
        )

        pending_requests = cursor.fetchone()["total"]


        # --------------------------------------------------
        # ACCEPTED REQUESTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_requests
            WHERE status = 'accepted'
            """
        )

        accepted_requests = cursor.fetchone()["total"]


        # --------------------------------------------------
        # DECLINED REQUESTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_requests
            WHERE status = 'declined'
            """
        )

        declined_requests = cursor.fetchone()["total"]


        # --------------------------------------------------
        # CANCELLED REQUESTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_requests
            WHERE status = 'cancelled'
            """
        )

        cancelled_requests = cursor.fetchone()["total"]


        # --------------------------------------------------
        # TOTAL CONVERSATIONS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_conversations
            """
        )

        total_conversations = cursor.fetchone()["total"]


        # --------------------------------------------------
        # ACTIVE CONVERSATIONS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_conversations
            WHERE status = 'active'
            """
        )

        active_conversations = cursor.fetchone()["total"]


        # --------------------------------------------------
        # ENDED CONVERSATIONS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_conversations
            WHERE status = 'ended'
            """
        )

        ended_conversations = cursor.fetchone()["total"]


        # --------------------------------------------------
        # TOTAL MESSAGES
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_messages
            """
        )

        total_messages = cursor.fetchone()["total"]


        # --------------------------------------------------
        # UNREAD MESSAGES
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_messages
            WHERE is_read = 0
            """
        )

        unread_messages = cursor.fetchone()["total"]


        # --------------------------------------------------
        # TOTAL BLOCKS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_blocks
            """
        )

        total_blocks = cursor.fetchone()["total"]


        # --------------------------------------------------
        # TOTAL REPORTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_reports
            """
        )

        total_reports = cursor.fetchone()["total"]


        # --------------------------------------------------
        # PENDING REPORTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM connection_reports
            WHERE status = 'pending'
            """
        )

        pending_reports = cursor.fetchone()["total"]


        return {
            "overview": {
                "total_profiles": total_profiles,
                "available_members": available_members,
                "unavailable_members": unavailable_members,

                "pending_requests": pending_requests,
                "accepted_requests": accepted_requests,
                "declined_requests": declined_requests,
                "cancelled_requests": cancelled_requests,

                "total_conversations": total_conversations,
                "active_conversations": active_conversations,
                "ended_conversations": ended_conversations,

                "total_messages": total_messages,
                "unread_messages": unread_messages,

                "total_blocks": total_blocks,

                "total_reports": total_reports,
                "pending_reports": pending_reports
            }
        }


    except Exception as error:

        print(
            "Admin connection overview error:",
            error
        )

        return {
            "error": "Unable to load connection overview."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# ADMIN — CONNECTION MEMBERS
# ======================================================

@router.get("/admin/members")
def get_admin_connection_members(
    session_token: str,
    search: str = None,
    availability: str = None
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        admin = verify_admin(
            cursor,
            session_token
        )

        if not admin:
            return {
                "error": "Admin access required."
            }


        # --------------------------------------------------
        # BASE QUERY
        # --------------------------------------------------

        query = """
            SELECT
                cp.id AS profile_id,
                cp.user_id,
                u.nickname,
                u.avatar,
                u.role,

                cp.bio,
                cp.topics,
                cp.is_available,
                cp.created_at,
                cp.updated_at,

                (
                    SELECT COUNT(*)
                    FROM connection_requests cr
                    WHERE
                        cr.sender_id = cp.user_id
                        OR cr.receiver_id = cp.user_id
                ) AS request_count,

                (
                    SELECT COUNT(*)
                    FROM connection_conversations cc
                    WHERE
                        cc.user_id = cp.user_id
                        OR cc.other_user_id = cp.user_id
                ) AS conversation_count,

                (
                    SELECT COUNT(*)
                    FROM connection_messages cm
                    WHERE cm.sender_id = cp.user_id
                ) AS message_count,

                (
                    SELECT COUNT(*)
                    FROM connection_blocks cb
                    WHERE cb.user_id = cp.user_id
                ) AS block_count,

                (
                    SELECT COUNT(*)
                    FROM connection_reports rep
                    WHERE
                        rep.reporter_id = cp.user_id
                        OR rep.reported_user_id = cp.user_id
                ) AS report_count

            FROM connection_profiles cp

            JOIN users u
                ON cp.user_id = u.id

            WHERE u.role != 'admin'
        """

        params = []


        # --------------------------------------------------
        # SEARCH
        # --------------------------------------------------

        if search and search.strip():

            query += """
                AND (
                    u.nickname LIKE %s
                    OR cp.bio LIKE %s
                    OR cp.topics LIKE %s
                )
            """

            search_value = "%" + search.strip() + "%"

            params.extend([
                search_value,
                search_value,
                search_value
            ])


        # --------------------------------------------------
        # AVAILABILITY FILTER
        # --------------------------------------------------

        if availability == "available":

            query += """
                AND cp.is_available = 1
            """

        elif availability == "unavailable":

            query += """
                AND cp.is_available = 0
            """


        query += """
            ORDER BY cp.updated_at DESC
        """


        cursor.execute(
            query,
            tuple(params)
        )

        members = cursor.fetchall()


        return {
            "members": members,
            "count": len(members)
        }


    except Exception as error:

        print(
            "Admin connection members error:",
            error
        )

        return {
            "error": "Unable to load connection members."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MY CONNECTION PROFILE
# ======================================================

@router.get("/profile")
def get_connection_profile(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        cursor.execute(
            """
            SELECT
                id,
                user_id,
                bio,
                topics,
                is_available,
                created_at,
                updated_at
            FROM connection_profiles
            WHERE user_id = %s
            LIMIT 1
            """,
            (user["id"],)
        )

        profile = cursor.fetchone()


        return {
            "profile": profile
        }


    except Exception as error:

        print(
            "Get connection profile error:",
            error
        )

        return {
            "error": "Unable to load connection profile."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# CREATE / UPDATE MY CONNECTION PROFILE
# ======================================================

@router.put("/profile")
def update_connection_profile(
    data: dict
):

    session_token = data.get("session_token")
    bio = data.get("bio")
    topics = data.get("topics")
    is_available = data.get(
        "is_available",
        True
    )

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        if bio is not None:

            bio = str(bio).strip()

            if len(bio) > 500:
                return {
                    "error": "Bio must be 500 characters or less."
                }


        if topics is not None:

            topics = str(topics).strip()

            if len(topics) > 1000:
                return {
                    "error": "Topics information is too long."
                }


        is_available = bool(is_available)


        cursor.execute(
            """
            SELECT id
            FROM connection_profiles
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,)
        )

        existing_profile = cursor.fetchone()


        if existing_profile:

            cursor.execute(
                """
                UPDATE connection_profiles
                SET
                    bio = %s,
                    topics = %s,
                    is_available = %s
                WHERE user_id = %s
                """,
                (
                    bio,
                    topics,
                    is_available,
                    user_id
                )
            )

        else:

            cursor.execute(
                """
                INSERT INTO connection_profiles
                (
                    user_id,
                    bio,
                    topics,
                    is_available
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
                    user_id,
                    bio,
                    topics,
                    is_available
                )
            )


        conn.commit()


        return {
            "message": "Connection profile saved successfully."
        }


    except Exception as error:

        conn.rollback()

        print(
            "Update connection profile error:",
            error
        )

        return {
            "error": "Unable to save connection profile."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET ANONYMOUS COMMUNITY MEMBERS
# ======================================================

@router.get("/members")
def get_connection_members(
    session_token: str,
    topic: str = None
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        query = """
            SELECT
                cp.user_id,
                u.nickname,
                u.avatar,
                cp.bio,
                cp.topics,
                cp.is_available
            FROM connection_profiles cp
            JOIN users u
                ON cp.user_id = u.id
            WHERE cp.user_id != %s
                AND cp.is_available = 1
                AND u.role != 'admin'
                AND u.role != 'mentor'
        """

        params = [user_id]


        if topic and topic.strip():

            query += """
                AND cp.topics LIKE %s
            """

            params.append(
                "%" + topic.strip() + "%"
            )


        query += """
            ORDER BY cp.updated_at DESC
        """


        cursor.execute(
            query,
            tuple(params)
        )

        members = cursor.fetchall()


        return {
            "members": members,
            "count": len(members)
        }


    except Exception as error:

        print(
            "Get connection members error:",
            error
        )

        return {
            "error": "Unable to load community members."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# SEND CONNECTION REQUEST
# ======================================================

@router.post("/request")
def create_connection_request(
    data: dict
):

    session_token = data.get("session_token")
    receiver_id = data.get("receiver_id")
    topic = data.get("topic")
    message = data.get("message")


    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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

        sender_id = user["id"]


        if not receiver_id:
            return {
                "error": "Community member is required."
            }

        try:

            receiver_id = int(receiver_id)

        except (TypeError, ValueError):

            return {
                "error": "Invalid community member."
            }


        if sender_id == receiver_id:

            return {
                "error": "You cannot connect with yourself."
            }


        cursor.execute(
            """
            SELECT
                cp.user_id
            FROM connection_profiles cp
            JOIN users u
                ON cp.user_id = u.id
            WHERE cp.user_id = %s
            AND cp.is_available = 1
            AND u.role != 'admin'
            AND u.role != 'mentor'
            LIMIT 1
            """,
            (receiver_id,)
        )

        receiver = cursor.fetchone()


        if not receiver:

            return {
                "error": "Community member is not available."
            }


        cursor.execute(
            """
            SELECT id
            FROM connection_blocks
            WHERE
                (
                    user_id = %s
                    AND blocked_user_id = %s
                )
                OR
                (
                    user_id = %s
                    AND blocked_user_id = %s
                )
            LIMIT 1
            """,
            (
                sender_id,
                receiver_id,
                receiver_id,
                sender_id
            )
        )

        blocked = cursor.fetchone()


        if blocked:

            return {
                "error": "You cannot connect with this member."
            }


        if not topic:

            return {
                "error": "Please select a connection topic."
            }

        topic = str(topic).strip()

        if len(topic) > 100:

            return {
                "error": "Topic must be 100 characters or less."
            }


        if message:

            message = str(message).strip()

            if len(message) > 500:

                return {
                    "error": "Message must be 500 characters or less."
                }


        # --------------------------------------------------
        # PREVENT DUPLICATE CONNECTION REQUESTS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                sender_id,
                receiver_id,
                status
            FROM connection_requests
            WHERE
                (
                    sender_id = %s
                    AND receiver_id = %s
                )
                OR
                (
                    sender_id = %s
                    AND receiver_id = %s
                )
            AND status IN ('pending', 'accepted')
            ORDER BY id DESC
            LIMIT 1
            """,
            (
                sender_id,
                receiver_id,
                receiver_id,
                sender_id
            )
        )

        existing_request = cursor.fetchone()


        if existing_request:

            if existing_request["status"] == "accepted":

                return {
                    "error": "You are already connected with this member."
                }


            if (
                existing_request["sender_id"] == sender_id
                and existing_request["receiver_id"] == receiver_id
            ):

                return {
                    "error": "You already have a pending request with this member."
                }


            return {
                "error": "This member has already sent you a connection request."
            }


        cursor.execute(
            """
            INSERT INTO connection_requests
            (
                sender_id,
                receiver_id,
                topic,
                message
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
                sender_id,
                receiver_id,
                topic,
                message
            )
        )

        request_id = cursor.lastrowid

        conn.commit()


        return {
            "message": "Connection request sent successfully.",
            "status": "pending",
            "request_id": request_id
        }


    except Exception as error:

        conn.rollback()

        print(
            "Create connection request error:",
            error
        )

        return {
            "error": "Unable to send connection request."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MY CONNECTION REQUESTS
# ======================================================

@router.get("/requests")
def get_connection_requests(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
                cr.id,
                cr.sender_id,
                cr.receiver_id,
                cr.topic,
                cr.message,
                cr.status,
                cr.created_at,
                cr.responded_at,
                u.nickname,
                u.avatar
            FROM connection_requests cr
            JOIN users u
                ON cr.sender_id = u.id
            WHERE cr.receiver_id = %s
            ORDER BY cr.created_at DESC
            """,
            (user_id,)
        )

        incoming = cursor.fetchall()


        cursor.execute(
            """
            SELECT
                cr.id,
                cr.sender_id,
                cr.receiver_id,
                cr.topic,
                cr.message,
                cr.status,
                cr.created_at,
                cr.responded_at,
                u.nickname,
                u.avatar
            FROM connection_requests cr
            JOIN users u
                ON cr.receiver_id = u.id
            WHERE cr.sender_id = %s
            ORDER BY cr.created_at DESC
            """,
            (user_id,)
        )

        sent = cursor.fetchall()


        return {
            "incoming": incoming,
            "sent": sent,
            "incoming_count": len(incoming),
            "sent_count": len(sent)
        }


    except Exception as error:

        print(
            "Get connection requests error:",
            error
        )

        return {
            "error": "Unable to load connection requests."
        }

    finally:

        cursor.close()
        conn.close()

# ======================================================
# UPDATE CONNECTION REQUEST STATUS
# ======================================================

@router.put("/request/{request_id}/status")
def update_connection_request_status(
    request_id: int,
    data: dict
):

    session_token = data.get("session_token")
    status = data.get("status")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        if status not in [
            "accepted",
            "declined",
            "cancelled"
        ]:

            return {
                "error": "Invalid request status."
            }


        cursor.execute(
            """
            SELECT
                id,
                sender_id,
                receiver_id,
                status
            FROM connection_requests
            WHERE id = %s
            LIMIT 1
            """,
            (request_id,)
        )

        request = cursor.fetchone()


        if not request:

            return {
                "error": "Connection request not found."
            }


        is_receiver = (
            request["receiver_id"] == user_id
        )

        is_sender = (
            request["sender_id"] == user_id
        )


        if status in ["accepted", "declined"]:

            if not is_receiver:

                return {
                    "error": "Only the receiver can respond to this request."
                }

        elif status == "cancelled":

            if not is_sender:

                return {
                    "error": "Only the sender can cancel this request."
                }


        if request["status"] != "pending":

            return {
                "error": "This request has already been responded to."
            }


        # --------------------------------------------------
        # ACCEPT REQUEST
        # --------------------------------------------------

        if status == "accepted":

            cursor.execute(
                """
                UPDATE connection_requests
                SET
                    status = 'accepted',
                    responded_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (request_id,)
            )


            # --------------------------------------------------
            # PREVENT DUPLICATE ACTIVE CONVERSATIONS
            # --------------------------------------------------

            cursor.execute(
                """
                SELECT id
                FROM connection_conversations
                WHERE
                    (
                        user_id = %s
                        AND other_user_id = %s
                    )
                    OR
                    (
                        user_id = %s
                        AND other_user_id = %s
                    )
                AND status = 'active'
                ORDER BY id DESC
                LIMIT 1
                """,
                (
                    request["sender_id"],
                    request["receiver_id"],
                    request["receiver_id"],
                    request["sender_id"]
                )
            )

            existing_conversation = cursor.fetchone()


            if existing_conversation:

                conversation_id = existing_conversation["id"]

            else:

                cursor.execute(
                    """
                    INSERT INTO connection_conversations
                    (
                        request_id,
                        user_id,
                        other_user_id,
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
                        request["id"],
                        request["sender_id"],
                        request["receiver_id"]
                    )
                )

                conversation_id = cursor.lastrowid


            conn.commit()


            return {
                "message": "Connection request accepted.",
                "status": "accepted",
                "conversation_id": conversation_id
            }


        # --------------------------------------------------
        # DECLINE REQUEST
        # --------------------------------------------------

        if status == "declined":

            cursor.execute(
                """
                UPDATE connection_requests
                SET
                    status = 'declined',
                    responded_at = CURRENT_TIMESTAMP
                WHERE id = %s
                """,
                (request_id,)
            )

            conn.commit()


            return {
                "message": "Connection request declined.",
                "status": "declined"
            }


        # --------------------------------------------------
        # CANCEL REQUEST
        # --------------------------------------------------

        cursor.execute(
            """
            UPDATE connection_requests
            SET
                status = 'cancelled',
                responded_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (request_id,)
        )

        conn.commit()


        return {
            "message": "Connection request cancelled.",
            "status": "cancelled"
        }


    except Exception as error:

        conn.rollback()

        print(
            "Update connection request status error:",
            error
        )

        return {
            "error": "Unable to update connection request."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MY CONNECTION CONVERSATIONS
# ======================================================

@router.get("/conversations")
def get_connection_conversations(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
        # GET ACTIVE/ENDED CONNECTIONS
        #
        # Only the newest conversation between two users
        # is returned. This prevents old duplicate
        # conversation rows from showing twice.
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                cc.id,
                cc.request_id,
                cc.user_id,
                cc.other_user_id,
                cc.status,
                cc.started_at,
                cc.ended_at,
                u.nickname,
                u.avatar
            FROM connection_conversations cc
            JOIN users u
                ON cc.other_user_id = u.id
            WHERE cc.user_id = %s
            AND cc.id = (
                SELECT MAX(cc2.id)
                FROM connection_conversations cc2
                WHERE
                    (
                        cc2.user_id = cc.user_id
                        AND cc2.other_user_id = cc.other_user_id
                    )
                    OR
                    (
                        cc2.user_id = cc.other_user_id
                        AND cc2.other_user_id = cc.user_id
                    )
            )

            UNION ALL

            SELECT
                cc.id,
                cc.request_id,
                cc.user_id,
                cc.other_user_id,
                cc.status,
                cc.started_at,
                cc.ended_at,
                u.nickname,
                u.avatar
            FROM connection_conversations cc
            JOIN users u
                ON cc.user_id = u.id
            WHERE cc.other_user_id = %s
            AND cc.id = (
                SELECT MAX(cc2.id)
                FROM connection_conversations cc2
                WHERE
                    (
                        cc2.user_id = cc.user_id
                        AND cc2.other_user_id = cc.other_user_id
                    )
                    OR
                    (
                        cc2.user_id = cc.other_user_id
                        AND cc2.other_user_id = cc.user_id
                    )
            )

            ORDER BY started_at DESC
            """,
            (
                user_id,
                user_id
            )
        )

        conversations = cursor.fetchall()


        # --------------------------------------------------
        # REMOVE ANY DUPLICATES FROM THE RESULT
        # --------------------------------------------------

        unique_conversations = []
        seen_users = set()

        for conversation in conversations:

            other_user_id = (
                conversation["other_user_id"]
                if conversation["user_id"] == user_id
                else conversation["user_id"]
            )

            if other_user_id in seen_users:
                continue

            seen_users.add(other_user_id)
            unique_conversations.append(conversation)


        return {
            "conversations": unique_conversations,
            "count": len(unique_conversations)
        }


    except Exception as error:

        print(
            "Get connection conversations error:",
            error
        )

        return {
            "error": "Unable to load conversations."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET SINGLE CONNECTION CONVERSATION
# ======================================================

@router.get("/conversation/{conversation_id}")
def get_connection_conversation(
    conversation_id: int,
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
                cc.id,
                cc.request_id,
                cc.user_id,
                cc.other_user_id,
                cc.status,
                cc.started_at,
                cc.ended_at,

                user_one.nickname AS user_nickname,
                user_one.avatar AS user_avatar,

                user_two.nickname AS other_nickname,
                user_two.avatar AS other_avatar

            FROM connection_conversations cc

            JOIN users user_one
                ON cc.user_id = user_one.id

            JOIN users user_two
                ON cc.other_user_id = user_two.id

            WHERE cc.id = %s
            AND (
                cc.user_id = %s
                OR cc.other_user_id = %s
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
            "Get connection conversation error:",
            error
        )

        return {
            "error": "Unable to load conversation."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET CONNECTION MESSAGES
# ======================================================

@router.get("/conversation/{conversation_id}/messages")
def get_connection_messages(
    conversation_id: int,
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
                id,
                status
            FROM connection_conversations
            WHERE id = %s
            AND (
                user_id = %s
                OR other_user_id = %s
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


        cursor.execute(
            """
            SELECT
                cm.id,
                cm.conversation_id,
                cm.sender_id,
                cm.message,
                cm.is_read,
                cm.created_at,
                u.nickname,
                u.avatar
            FROM connection_messages cm
            JOIN users u
                ON cm.sender_id = u.id
            WHERE cm.conversation_id = %s
            ORDER BY cm.created_at ASC, cm.id ASC
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
            "Get connection messages error:",
            error
        )

        return {
            "error": "Unable to load messages."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# SEND CONNECTION MESSAGE
# ======================================================

@router.post("/conversation/{conversation_id}/messages")
def send_connection_message(
    conversation_id: int,
    data: dict
):

    session_token = data.get("session_token")
    message = data.get("message")


    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        if not message or not str(message).strip():

            return {
                "error": "Message cannot be empty."
            }

        message = str(message).strip()


        if len(message) > 2000:

            return {
                "error": "Message must be 2000 characters or less."
            }


        cursor.execute(
            """
            SELECT
                id,
                user_id,
                other_user_id,
                status
            FROM connection_conversations
            WHERE id = %s
            AND (
                user_id = %s
                OR other_user_id = %s
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


        if conversation["user_id"] == user_id:

            other_user_id = conversation["other_user_id"]

        else:

            other_user_id = conversation["user_id"]


        cursor.execute(
            """
            SELECT id
            FROM connection_blocks
            WHERE
                (
                    user_id = %s
                    AND blocked_user_id = %s
                )
                OR
                (
                    user_id = %s
                    AND blocked_user_id = %s
                )
            LIMIT 1
            """,
            (
                user_id,
                other_user_id,
                other_user_id,
                user_id
            )
        )

        blocked = cursor.fetchone()


        if blocked:

            return {
                "error": "Messaging is unavailable for this connection."
            }


        cursor.execute(
            """
            INSERT INTO connection_messages
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
                0
            )
            """,
            (
                conversation_id,
                user_id,
                message
            )
        )

        message_id = cursor.lastrowid

        conn.commit()


        cursor.execute(
            """
            SELECT
                cm.id,
                cm.conversation_id,
                cm.sender_id,
                cm.message,
                cm.is_read,
                cm.created_at,
                u.nickname,
                u.avatar
            FROM connection_messages cm
            JOIN users u
                ON cm.sender_id = u.id
            WHERE cm.id = %s
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
            "Send connection message error:",
            error
        )

        return {
            "error": "Unable to send message."
        }

    finally:

        cursor.close()
        conn.close()

# ======================================================
# MARK CONNECTION MESSAGES AS READ
# ======================================================

@router.put("/conversation/{conversation_id}/messages/read")
def mark_connection_messages_read(
    conversation_id: int,
    data: dict
):

    session_token = data.get("session_token")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
                id
            FROM connection_conversations
            WHERE id = %s
            AND (
                user_id = %s
                OR other_user_id = %s
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


        cursor.execute(
            """
            UPDATE connection_messages cm
            JOIN connection_conversations cc
                ON cm.conversation_id = cc.id
            SET cm.is_read = 1
            WHERE cm.conversation_id = %s
            AND cm.sender_id != %s
            AND (
                cc.user_id = %s
                OR cc.other_user_id = %s
            )
            """,
            (
                conversation_id,
                user_id,
                user_id,
                user_id
            )
        )

        conn.commit()


        return {
            "message": "Messages marked as read."
        }


    except Exception as error:

        conn.rollback()

        print(
            "Mark connection messages read error:",
            error
        )

        return {
            "error": "Unable to mark messages as read."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# END CONNECTION CONVERSATION
# ======================================================

@router.put("/conversation/{conversation_id}/end")
def end_connection_conversation(
    conversation_id: int,
    data: dict
):

    session_token = data.get("session_token")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
                id,
                user_id,
                other_user_id,
                status
            FROM connection_conversations
            WHERE id = %s
            AND (
                user_id = %s
                OR other_user_id = %s
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
                "error": "This conversation has already ended."
            }


        cursor.execute(
            """
            UPDATE connection_conversations
            SET
                status = 'ended',
                ended_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (conversation_id,)
        )

        conn.commit()


        return {
            "message": "Conversation ended successfully.",
            "status": "ended"
        }


    except Exception as error:

        conn.rollback()

        print(
            "End connection conversation error:",
            error
        )

        return {
            "error": "Unable to end conversation."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# BLOCK CONNECTION USER
# ======================================================

@router.post("/block")
def block_connection_user(
    data: dict
):

    session_token = data.get("session_token")
    blocked_user_id = data.get("blocked_user_id")


    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        if not blocked_user_id:

            return {
                "error": "User to block is required."
            }


        try:

            blocked_user_id = int(blocked_user_id)

        except (TypeError, ValueError):

            return {
                "error": "Invalid user ID."
            }


        if blocked_user_id == user_id:

            return {
                "error": "You cannot block yourself."
            }


        cursor.execute(
            """
            SELECT
                id
            FROM users
            WHERE id = %s
            LIMIT 1
            """,
            (blocked_user_id,)
        )

        target_user = cursor.fetchone()


        if not target_user:

            return {
                "error": "User not found."
            }


        cursor.execute(
            """
            SELECT
                id
            FROM connection_blocks
            WHERE
                user_id = %s
                AND blocked_user_id = %s
            LIMIT 1
            """,
            (
                user_id,
                blocked_user_id
            )
        )

        existing_block = cursor.fetchone()


        if existing_block:

            return {
                "error": "This user is already blocked."
            }


        cursor.execute(
            """
            INSERT INTO connection_blocks
            (
                user_id,
                blocked_user_id,
                created_at
            )
            VALUES
            (
                %s,
                %s,
                CURRENT_TIMESTAMP
            )
            """,
            (
                user_id,
                blocked_user_id
            )
        )


        # --------------------------------------------------
        # END ACTIVE CONVERSATIONS
        # --------------------------------------------------

        cursor.execute(
            """
            UPDATE connection_conversations
            SET
                status = 'ended',
                ended_at = CURRENT_TIMESTAMP
            WHERE
                (
                    user_id = %s
                    AND other_user_id = %s
                )
                OR
                (
                    user_id = %s
                    AND other_user_id = %s
                )
            AND status = 'active'
            """,
            (
                user_id,
                blocked_user_id,
                blocked_user_id,
                user_id
            )
        )


        # --------------------------------------------------
        # CANCEL PENDING CONNECTION REQUESTS
        # --------------------------------------------------

        cursor.execute(
            """
            UPDATE connection_requests
            SET
                status = 'cancelled',
                responded_at = CURRENT_TIMESTAMP
            WHERE
                (
                    sender_id = %s
                    AND receiver_id = %s
                )
                OR
                (
                    sender_id = %s
                    AND receiver_id = %s
                )
            AND status = 'pending'
            """,
            (
                user_id,
                blocked_user_id,
                blocked_user_id,
                user_id
            )
        )


        conn.commit()


        return {
            "message": "User blocked successfully."
        }


    except Exception as error:

        conn.rollback()

        print(
            "Block connection user error:",
            error
        )

        return {
            "error": "Unable to block user."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# UNBLOCK CONNECTION USER
# ======================================================

@router.delete("/block/{blocked_user_id}")
def unblock_connection_user(
    blocked_user_id: int,
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
                id
            FROM connection_blocks
            WHERE
                user_id = %s
                AND blocked_user_id = %s
            LIMIT 1
            """,
            (
                user_id,
                blocked_user_id
            )
        )

        block = cursor.fetchone()


        if not block:

            return {
                "error": "This user is not blocked."
            }


        cursor.execute(
            """
            DELETE FROM connection_blocks
            WHERE
                user_id = %s
                AND blocked_user_id = %s
            """,
            (
                user_id,
                blocked_user_id
            )
        )

        conn.commit()


        return {
            "message": "User unblocked successfully."
        }


    except Exception as error:

        conn.rollback()

        print(
            "Unblock connection user error:",
            error
        )

        return {
            "error": "Unable to unblock user."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET BLOCKED USERS
# ======================================================

@router.get("/blocked")
def get_blocked_users(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
                cb.id,
                cb.blocked_user_id,
                cb.created_at,
                u.nickname,
                u.avatar
            FROM connection_blocks cb
            JOIN users u
                ON cb.blocked_user_id = u.id
            WHERE cb.user_id = %s
            ORDER BY cb.created_at DESC
            """,
            (user_id,)
        )

        blocked_users = cursor.fetchall()


        return {
            "blocked": blocked_users,
            "count": len(blocked_users)
        }


    except Exception as error:

        print(
            "Get blocked users error:",
            error
        )

        return {
            "error": "Unable to load blocked users."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# REPORT CONNECTION USER
# ======================================================

@router.post("/report")
def report_connection_user(
    data: dict
):

    session_token = data.get("session_token")
    reported_user_id = data.get("reported_user_id")
    reason = data.get("reason")
    description = data.get("description")


    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        if not reported_user_id:

            return {
                "error": "Reported user is required."
            }


        try:

            reported_user_id = int(reported_user_id)

        except (TypeError, ValueError):

            return {
                "error": "Invalid reported user ID."
            }


        if reported_user_id == user_id:

            return {
                "error": "You cannot report yourself."
            }


        cursor.execute(
            """
            SELECT
                id
            FROM users
            WHERE id = %s
            LIMIT 1
            """,
            (reported_user_id,)
        )

        reported_user = cursor.fetchone()


        if not reported_user:

            return {
                "error": "User not found."
            }


        if not reason:

            return {
                "error": "Report reason is required."
            }


        cursor.execute(
            """
            INSERT INTO connection_reports
            (
                reporter_id,
                reported_user_id,
                reason,
                description,
                created_at
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                CURRENT_TIMESTAMP
            )
            """,
            (
                user_id,
                reported_user_id,
                reason,
                description
            )
        )

        report_id = cursor.lastrowid

        conn.commit()


        return {
            "message": "Report submitted successfully.",
            "report_id": report_id
        }


    except Exception as error:

        conn.rollback()

        print(
            "Report connection user error:",
            error
        )

        return {
            "error": "Unable to submit report."
        }

    finally:

        cursor.close()
        conn.close()

# ======================================================
# ADMIN / MODERATION: GET CONNECTION REPORTS
# ======================================================

@router.get("/reports")
def get_connection_reports(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        if user["role"] != "admin":

            return {
                "error": "Admin access required."
            }


        cursor.execute(
            """
            SELECT
                cr.id,
                cr.reporter_id,
                cr.reported_user_id,
                cr.reason,
                cr.description,
                cr.created_at,

                reporter.nickname AS reporter_nickname,
                reporter.avatar AS reporter_avatar,

                reported.nickname AS reported_nickname,
                reported.avatar AS reported_avatar

            FROM connection_reports cr

            JOIN users reporter
                ON cr.reporter_id = reporter.id

            JOIN users reported
                ON cr.reported_user_id = reported.id

            ORDER BY cr.created_at DESC
            """
        )

        reports = cursor.fetchall()


        return {
            "reports": reports,
            "count": len(reports)
        }


    except Exception as error:

        print(
            "Get connection reports error:",
            error
        )

        return {
            "error": "Unable to load connection reports."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# ADMIN / MODERATION: DELETE CONNECTION REPORT
# ======================================================

@router.delete("/reports/{report_id}")
def delete_connection_report(
    report_id: int,
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        if user["role"] != "admin":

            return {
                "error": "Admin access required."
            }


        cursor.execute(
            """
            SELECT
                id
            FROM connection_reports
            WHERE id = %s
            LIMIT 1
            """,
            (report_id,)
        )

        report = cursor.fetchone()


        if not report:

            return {
                "error": "Report not found."
            }


        cursor.execute(
            """
            DELETE FROM connection_reports
            WHERE id = %s
            """,
            (report_id,)
        )

        conn.commit()


        return {
            "message": "Report deleted successfully."
        }


    except Exception as error:

        conn.rollback()

        print(
            "Delete connection report error:",
            error
        )

        return {
            "error": "Unable to delete report."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET CONNECTION PROFILE
# ======================================================

@router.get("/profile/{user_id}")
def get_connection_profile(
    user_id: int,
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        current_user = get_current_user(
            cursor,
            session_token
        )

        if not current_user:
            return {
                "error": "Please login first."
            }


        cursor.execute(
            """
            SELECT
                u.id,
                u.nickname,
                u.avatar,
                u.role,

                cp.bio,
                cp.interests,
                cp.is_available,
                cp.created_at

            FROM users u

            LEFT JOIN connection_profiles cp
                ON u.id = cp.user_id

            WHERE u.id = %s
            LIMIT 1
            """,
            (user_id,)
        )

        profile = cursor.fetchone()


        if not profile:

            return {
                "error": "User not found."
            }


        return {
            "profile": profile
        }


    except Exception as error:

        print(
            "Get connection profile error:",
            error
        )

        return {
            "error": "Unable to load profile."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MY CONNECTION PROFILE
# ======================================================

@router.get("/profile")
def get_my_connection_profile(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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
                u.id,
                u.nickname,
                u.avatar,
                u.role,

                cp.bio,
                cp.interests,
                cp.is_available,
                cp.created_at

            FROM users u

            LEFT JOIN connection_profiles cp
                ON u.id = cp.user_id

            WHERE u.id = %s
            LIMIT 1
            """,
            (user_id,)
        )

        profile = cursor.fetchone()


        if not profile:

            return {
                "error": "Connection profile not found."
            }


        return {
            "profile": profile
        }


    except Exception as error:

        print(
            "Get my connection profile error:",
            error
        )

        return {
            "error": "Unable to load your connection profile."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# UPDATE MY CONNECTION PROFILE
# ======================================================

@router.put("/profile")
def update_my_connection_profile(
    data: dict
):

    session_token = data.get("session_token")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
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


        bio = data.get("bio")
        interests = data.get("interests")
        is_available = data.get("is_available")


        if bio is not None:

            bio = str(bio).strip()

            if len(bio) > 1000:

                return {
                    "error": "Bio must be 1000 characters or less."
                }


        if interests is not None:

            interests = str(interests).strip()

            if len(interests) > 1000:

                return {
                    "error": "Interests must be 1000 characters or less."
                }


        if is_available is not None:

            if isinstance(is_available, str):

                is_available = (
                    is_available.lower()
                    in ["1", "true", "yes"]
                )

            else:

                is_available = bool(is_available)


        cursor.execute(
            """
            SELECT
                id
            FROM connection_profiles
            WHERE user_id = %s
            LIMIT 1
            """,
            (user_id,)
        )

        existing_profile = cursor.fetchone()


        if existing_profile:

            update_fields = []
            update_values = []


            if bio is not None:

                update_fields.append(
                    "bio = %s"
                )

                update_values.append(bio)


            if interests is not None:

                update_fields.append(
                    "interests = %s"
                )

                update_values.append(interests)


            if is_available is not None:

                update_fields.append(
                    "is_available = %s"
                )

                update_values.append(
                    1 if is_available else 0
                )


            if update_fields:

                update_values.append(user_id)

                cursor.execute(
                    f"""
                    UPDATE connection_profiles
                    SET
                        {", ".join(update_fields)}
                    WHERE user_id = %s
                    """,
                    tuple(update_values)
                )


        else:

            cursor.execute(
                """
                INSERT INTO connection_profiles
                (
                    user_id,
                    bio,
                    interests,
                    is_available,
                    created_at
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    CURRENT_TIMESTAMP
                )
                """,
                (
                    user_id,
                    bio or "",
                    interests or "",
                    1 if is_available is None or is_available else 0
                )
            )


        conn.commit()


        return {
            "message": "Connection profile updated successfully."
        }


    except Exception as error:

        conn.rollback()

        print(
            "Update my connection profile error:",
            error
        )

        return {
            "error": "Unable to update connection profile."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# CONNECTION HEALTH CHECK
# ======================================================

@router.get("/health")
def connection_health():

    conn = get_connection()

    if not conn:

        return {
            "status": "error",
            "message": "Database connection failed."
        }

    cursor = conn.cursor()

    try:

        cursor.execute(
            "SELECT 1"
        )

        cursor.fetchone()


        return {
            "status": "ok",
            "message": "Connection API is working."
        }


    except Exception as error:

        print(
            "Connection health check error:",
            error
        )

        return {
            "status": "error",
            "message": "Connection API is unavailable."
        }

    finally:

        cursor.close()
        conn.close()