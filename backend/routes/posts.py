from fastapi import APIRouter, HTTPException
from database import get_connection
import re
router = APIRouter()

# ============================================================
# HARMFUL CONTENT DETECTION
# ============================================================

CRITICAL_HARMFUL_PATTERNS = [
    r"\bi want to die\b",
    r"\bi wanna die\b",
    r"\bi want to kill myself\b",
    r"\bi wanna kill myself\b",
    r"\bi am going to kill myself\b",
    r"\bi'm going to kill myself\b",
    r"\bi will kill myself\b",
    r"\bi'll kill myself\b",
    r"\bkill myself\b",
    r"\bend my life\b",
    r"\btake my own life\b",
    r"\bno reason to live\b",
    r"\bdon't want to live\b",
    r"\bdo not want to live\b"
]


HIGH_HARMFUL_PATTERNS = [
    r"\bsuicide\b",
    r"\bsuicidal\b",
    r"\bself[- ]?harm\b",
    r"\bhurt myself\b",
    r"\bhurting myself\b",
    r"\bcut myself\b",
    r"\boverdose\b"
]


MEDIUM_HARMFUL_PATTERNS = [
    r"\bhate myself\b",
    r"\bcan't go on\b",
    r"\bcannot go on\b",
    r"\bno hope\b",
    r"\bhopeless\b",
    r"\bworthless\b",
    r"\bnot worth living\b"
]


def detect_post_safety(content):
    """
    Detect explicit harmful-content indicators in an
    anonymous Safe Space post.

    This is a deterministic keyword/pattern detector.
    It is not a clinical assessment.
    """

    if not content:
        return {
            "flagged": False,
            "severity": None,
            "reason": None
        }

    text = content.lower().strip()


    # --------------------------------------------------------
    # CRITICAL
    # --------------------------------------------------------

    for pattern in CRITICAL_HARMFUL_PATTERNS:

        if re.search(pattern, text):

            return {
                "flagged": True,
                "severity": "critical",
                "reason": "Explicit suicidal intent detected"
            }


    # --------------------------------------------------------
    # HIGH
    # --------------------------------------------------------

    for pattern in HIGH_HARMFUL_PATTERNS:

        if re.search(pattern, text):

            return {
                "flagged": True,
                "severity": "high",
                "reason": "Self-harm or suicide-related language detected"
            }


    # --------------------------------------------------------
    # MEDIUM
    # --------------------------------------------------------

    for pattern in MEDIUM_HARMFUL_PATTERNS:

        if re.search(pattern, text):

            return {
                "flagged": True,
                "severity": "medium",
                "reason": "Severe emotional distress language detected"
            }


    # --------------------------------------------------------
    # NORMAL
    # --------------------------------------------------------

    return {
        "flagged": False,
        "severity": None,
        "reason": None
    }
# ============================================================
# SESSION HELPERS
# ============================================================

def get_session_user(session_token):
    """
    Return (user_id, role) for a valid session.
    Returns (None, None) if the session is invalid or expired.
    """

    if not session_token:
        return None, None

    conn = get_connection()

    if not conn:
        return None, None

    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                s.user_id,
                u.role
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
              AND s.expires_at > NOW()
            """,
            (session_token,)
        )

        user = cursor.fetchone()

        if not user:
            return None, None

        return user["user_id"], user["role"]

    except Exception as error:
        print("Session verification error:", error)
        return None, None

    finally:
        cursor.close()
        conn.close()


def verify_admin(session_token):
    """
    Verify that the session belongs to an admin.
    """

    user_id, role = get_session_user(session_token)

    if not user_id or role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )

    return user_id


# ============================================================
# CATEGORY VALIDATION
# ============================================================

VALID_CATEGORIES = [
    "General",
    "Anxiety",
    "Stress",
    "Relationships",
    "Self-Growth",
    "Loneliness",
    "Academic Pressure",
    "Family",
    "Other"
]


def validate_category(category):
    """
    Validate post category.
    """

    if not category:
        return "General"

    if category not in VALID_CATEGORIES:
        return "General"

    return category


# ============================================================
# AUTOMATIC WARM RESPONSES
# ============================================================

def getWarmResponse(mood):
    """
    Generate an initial supportive response based on mood.

    This is used when a user first submits a post.
    Admins can later edit or replace this response.
    """

    responses = {

        "happy":
            "It's lovely to hear that you're feeling happy. Hold on to this moment and enjoy it.",

        "calm":
            "It's nice that you're feeling calm. Give yourself permission to enjoy this peaceful moment.",

        "loved":
            "Feeling loved can be deeply comforting. Cherish the people and moments that make you feel this way.",

        "grateful":
            "Gratitude can help us notice the little things that matter. It's wonderful that you're feeling grateful.",

        "confident":
            "It's great to hear that you're feeling confident. Trust yourself and keep moving forward.",

        "tired":
            "It sounds like you may need a little rest. It's okay to slow down and give yourself some time to recharge.",

        "confused":
            "It's completely okay to feel confused sometimes. You don't need to have everything figured out right away.",

        "sad":
            "I'm sorry you're going through a difficult moment. You don't have to handle everything alone.",

        "worried":
            "It's understandable to feel worried when something matters to you. Take things one step at a time.",

        "anxious":
            "Take a slow breath and be gentle with yourself. You don't have to solve everything at once.",

        "stressed":
            "It sounds like things may feel overwhelming right now. Give yourself permission to pause and take things one step at a time.",

        "angry":
            "It's okay to feel angry. Give yourself some space to understand what you're feeling before deciding what to do next.",

        "lonely":
            "Feeling lonely can be really difficult. Remember that your feelings matter, and you deserve connection and support.",

        "heartbroken":
            "Heartbreak can take time to heal. Be patient with yourself and allow yourself to feel what you're feeling."
    }

    return responses.get(
        mood,
        "Thank you for sharing. Whatever you're going through, remember to be gentle with yourself."
    )


# ============================================================
# 1. SUBMIT A NEW POST
# ============================================================

@router.post("/submit")
def submit_post(data: dict):

    content = data.get("content")
    mood = data.get("mood")
    category = validate_category(data.get("category"))
    session_token = data.get("session_token")

        # --------------------------------------------------------
    # DETECT HARMFUL CONTENT
    # --------------------------------------------------------

    safety = detect_post_safety(content)

    safety_flag = safety["flagged"]
    safety_severity = safety["severity"]
    safety_reason = safety["reason"]

    if not content or not content.strip():
        raise HTTPException(
            status_code=400,
            detail="Post content cannot be empty"
        )

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Please log in to post"
        )

    user_id, role = get_session_user(session_token)

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        # Get anonymous identity
        cursor.execute(
            """
            SELECT nickname, avatar
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )

        user = cursor.fetchone()

        if not user:
            raise HTTPException(
                status_code=404,
                detail="User not found"
            )

        # Generate initial automatic warm response
        warm_response = getWarmResponse(mood)

        # ----------------------------------------------------
        # IMPORTANT:
        # Posts are immediately approved.
        # No admin approval is required.
        # ----------------------------------------------------

        cursor.execute(
    """
    INSERT INTO posts
    (
        anonymous_user_id,
        content,
        mood,
        category,
        status,
        safety_flag,
        safety_severity,
        safety_reason,
        warm_response,
        reaction_count
    )
    VALUES
    (
        %s,
        %s,
        %s,
        %s,
        'approved',
        %s,
        %s,
        %s,
        %s,
        0
    )
    """,
    (
        user_id,
        content.strip(),
        mood,
        category,
        int(safety_flag),
        safety_severity,
        safety_reason,
        warm_response
    )
)
        conn.commit()
        post_id = cursor.lastrowid
        print("========================================")
        print("POST SUCCESSFULLY INSERTED")
        print("POST ID:", post_id)
        print("USER ID:", user_id)
        print("CONTENT:", content.strip())
        print("MOOD:", mood)
        print("CATEGORY:", category)
        print("========================================")
                # ----------------------------------------------------
        # CREATE ADMIN SAFETY ALERT
        # ----------------------------------------------------

        safety_alert_id = None

        if safety_flag:

            cursor.execute(
                """
                INSERT INTO post_safety_alerts
                (
                    post_id,
                    severity,
                    reason,
                    status
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    'pending'
                )
                """,
                (
                    post_id,
                    safety_severity,
                    safety_reason
                )
            )

            safety_alert_id = cursor.lastrowid
            conn.commit()
        return {
    "message": "Post submitted successfully",
    "post_id": post_id,
    "nickname": user["nickname"],
    "avatar": user["avatar"],
    "warm_response": warm_response,
    "safety": {
        "flagged": safety_flag,
        "severity": safety_severity,
        "alert_id": safety_alert_id
    }
}

    except HTTPException:
        raise

    except Exception as error:
        conn.rollback()

        print("Submit post error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to submit post"
        )

    finally:
        cursor.close()
        conn.close()


# ============================================================
# 2. GET PUBLIC APPROVED POSTS
# ============================================================

@router.get("/approved")
def get_approved_posts(session_token: str = None):

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                p.id,
                p.content,
                p.mood,
                p.category,
                p.status,
                p.warm_response,
                p.reaction_count,
                p.created_at,
                p.anonymous_user_id,
                u.nickname,
                u.avatar
            FROM posts p
            LEFT JOIN users u
                ON p.anonymous_user_id = u.id
            WHERE p.status = 'approved'
            ORDER BY p.created_at DESC
            """
        )

        posts = cursor.fetchall()
        print("========================================")
        print("APPROVED POSTS COUNT:", len(posts))

        if posts:
            print("LATEST POST ID:", posts[0]["id"])
            print("LATEST POST CONTENT:", posts[0]["content"])
            print("LATEST POST MOOD:", posts[0]["mood"])
            print("LATEST POST CATEGORY:", posts[0]["category"])

            print("ALL POST IDS:", [post["id"] for post in posts[:10]])
            print("========================================")

        # Identify the currently logged-in user
        current_user_id = None

        if session_token:
            current_user_id, _ = get_session_user(session_token)

        for post in posts:

            # Tell frontend whether this is the user's own post.
            post["is_owner"] = (
                current_user_id is not None
                and post["anonymous_user_id"] == current_user_id
            )

            # ------------------------------------------------
            # SECURITY:
            # Public users must NEVER receive the internal
            # database user ID.
            # ------------------------------------------------

            del post["anonymous_user_id"]

        return posts

    except Exception as error:

        print("Get approved posts error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to load posts"
        )

    finally:
        cursor.close()
        conn.close()


# ============================================================
# 3. REACT TO A POST
# ============================================================

@router.post("/{post_id}/react")
def react_to_post(
    post_id: int,
    data: dict
):

    session_token = data.get("session_token")

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Session token required"
        )

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        # Check post
        cursor.execute(
            """
            SELECT id, reaction_count
            FROM posts
            WHERE id = %s
            """,
            (post_id,)
        )

        post = cursor.fetchone()

        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )

        # Check whether this session already reacted
        cursor.execute(
            """
            SELECT id
            FROM reactions
            WHERE post_id = %s
              AND session_token = %s
            """,
            (
                post_id,
                session_token
            )
        )

        existing_reaction = cursor.fetchone()

        if existing_reaction:

            # Remove reaction
            cursor.execute(
                """
                DELETE FROM reactions
                WHERE id = %s
                """,
                (existing_reaction["id"],)
            )

            cursor.execute(
                """
                UPDATE posts
                SET reaction_count =
                    GREATEST(reaction_count - 1, 0)
                WHERE id = %s
                """,
                (post_id,)
            )

            reacted = False

        else:

            # Add reaction
            cursor.execute(
                """
                INSERT INTO reactions
                (
                    post_id,
                    session_token
                )
                VALUES
                (
                    %s,
                    %s
                )
                """,
                (
                    post_id,
                    session_token
                )
            )

            cursor.execute(
                """
                UPDATE posts
                SET reaction_count = reaction_count + 1
                WHERE id = %s
                """,
                (post_id,)
            )

            reacted = True

        conn.commit()

        cursor.execute(
            """
            SELECT reaction_count
            FROM posts
            WHERE id = %s
            """,
            (post_id,)
        )

        updated_post = cursor.fetchone()

        return {
            "message": "Reaction updated",
            "reacted": reacted,
            "reaction_count": updated_post["reaction_count"]
        }

    except HTTPException:
        raise

    except Exception as error:

        conn.rollback()

        print("React error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to update reaction"
        )

    finally:
        cursor.close()
        conn.close()


# ============================================================
# 4. ADMIN - GET ALL POSTS
# ============================================================

@router.get("/admin/all")
def get_all_posts_admin(
    session_token: str = None
):

    verify_admin(session_token)

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                p.id,
                p.anonymous_user_id,
                p.content,
                p.mood,
                p.category,
                p.status,
                p.warm_response,
                p.reaction_count,
                p.created_at,
                u.nickname,
                u.avatar
            FROM posts p
            LEFT JOIN users u
                ON p.anonymous_user_id = u.id
            ORDER BY p.created_at DESC
            """
        )

        posts = cursor.fetchall()

        return posts

    except Exception as error:

        print("Admin posts error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to load admin posts"
        )

    finally:
        cursor.close()
        conn.close()


# ============================================================
# 5. USER - EDIT OWN POST
# ============================================================

@router.put("/{post_id}/edit")
def edit_post(
    post_id: int,
    data: dict
):

    session_token = data.get("session_token")
    content = data.get("content")
    mood = data.get("mood")
    category = validate_category(data.get("category"))

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Session token required"
        )

    if not content or not content.strip():
        raise HTTPException(
            status_code=400,
            detail="Post content cannot be empty"
        )

    user_id, role = get_session_user(session_token)

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                anonymous_user_id,
                warm_response
            FROM posts
            WHERE id = %s
            """,
            (post_id,)
        )

        post = cursor.fetchone()

        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )

        # ----------------------------------------------------
        # NORMAL USERS CAN EDIT ONLY THEIR OWN POSTS
        # ----------------------------------------------------

        if role != "admin":

            if post["anonymous_user_id"] != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only edit your own post"
                )

        # ----------------------------------------------------
        # Update the post
        # ----------------------------------------------------

        cursor.execute(
            """
            UPDATE posts
            SET
                content = %s,
                mood = %s,
                category = %s
            WHERE id = %s
            """,
            (
                content.strip(),
                mood,
                category,
                post_id
            )
        )

        # ----------------------------------------------------
        # IMPORTANT:
        #
        # We DO NOT automatically overwrite an existing
        # admin response when the user edits their post.
        #
        # This protects a manually written admin response.
        #
        # If there is no response at all, generate one.
        # ----------------------------------------------------

        if not post["warm_response"]:

            new_warm_response = getWarmResponse(mood)

            cursor.execute(
                """
                UPDATE posts
                SET warm_response = %s
                WHERE id = %s
                """,
                (
                    new_warm_response,
                    post_id
                )
            )

        conn.commit()

        return {
            "message": "Post updated successfully"
        }

    except HTTPException:
        raise

    except Exception as error:

        conn.rollback()

        print("Edit post error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to edit post"
        )

    finally:
        cursor.close()
        conn.close()


# ============================================================
# 6. DELETE ENTIRE POST
# ============================================================

@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    data: dict
):

    session_token = data.get("session_token")

    if not session_token:
        raise HTTPException(
            status_code=401,
            detail="Session token required"
        )

    user_id, role = get_session_user(session_token)

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        # Find the post
        cursor.execute(
            """
            SELECT
                id,
                anonymous_user_id
            FROM posts
            WHERE id = %s
            """,
            (post_id,)
        )

        post = cursor.fetchone()

        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )

        # ----------------------------------------------------
        # NORMAL USER:
        # Can delete ONLY their own post.
        #
        # ADMIN:
        # Can delete ANY post.
        # ----------------------------------------------------

        if role != "admin":

            if post["anonymous_user_id"] != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="You can only delete your own post"
                )

        # ----------------------------------------------------
        # Delete reactions first
        # ----------------------------------------------------

        cursor.execute(
            """
            DELETE FROM reactions
            WHERE post_id = %s
            """,
            (post_id,)
        )

        # ----------------------------------------------------
        # Delete entire post
        #
        # This also removes:
        # - user's content
        # - warm response
        # - mood
        # - category
        # - reaction count
        # ----------------------------------------------------

        cursor.execute(
            """
            DELETE FROM posts
            WHERE id = %s
            """,
            (post_id,)
        )

        conn.commit()

        return {
            "message": "Post deleted successfully"
        }

    except HTTPException:
        raise

    except Exception as error:

        conn.rollback()

        print("Delete post error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to delete post"
        )

    finally:
        cursor.close()
        conn.close()


# ============================================================
# 7. ADMIN - SAVE / EDIT WARM RESPONSE
# ============================================================

@router.put("/{post_id}/warm-response")
def update_warm_response(
    post_id: int,
    data: dict
):

    session_token = data.get("session_token")
    warm_response = data.get("warm_response")

    # --------------------------------------------------------
    # Admin authentication
    # --------------------------------------------------------

    verify_admin(session_token)

    # --------------------------------------------------------
    # Validate response
    # --------------------------------------------------------

    if warm_response is None:
        raise HTTPException(
            status_code=400,
            detail="Warm response is required"
        )

    warm_response = warm_response.strip()

    if not warm_response:
        raise HTTPException(
            status_code=400,
            detail="Warm response cannot be empty"
        )

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        # Check post exists
        cursor.execute(
            """
            SELECT id
            FROM posts
            WHERE id = %s
            """,
            (post_id,)
        )

        post = cursor.fetchone()

        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )

        # ----------------------------------------------------
        # This works for BOTH:
        #
        # NEW response:
        # NULL -> response
        #
        # EDIT response:
        # old response -> new response
        # ----------------------------------------------------

        cursor.execute(
            """
            UPDATE posts
            SET warm_response = %s
            WHERE id = %s
            """,
            (
                warm_response,
                post_id
            )
        )

        conn.commit()

        return {
            "message": "Warm response saved successfully",
            "warm_response": warm_response
        }

    except HTTPException:
        raise

    except Exception as error:

        conn.rollback()

        print("Update warm response error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to save warm response"
        )

    finally:
        cursor.close()
        conn.close()


# ============================================================
# 8. ADMIN - CLEAR WARM RESPONSE ONLY
# ============================================================

@router.delete("/{post_id}/warm-response")
def clear_warm_response(
    post_id: int,
    data: dict
):

    session_token = data.get("session_token")

    # --------------------------------------------------------
    # Only admin can clear responses
    # --------------------------------------------------------

    verify_admin(session_token)

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        # Check post exists
        cursor.execute(
            """
            SELECT id
            FROM posts
            WHERE id = %s
            """,
            (post_id,)
        )

        post = cursor.fetchone()

        if not post:
            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )

        # ----------------------------------------------------
        # IMPORTANT:
        #
        # Only warm_response is cleared.
        #
        # The post itself stays.
        # ----------------------------------------------------

        cursor.execute(
            """
            UPDATE posts
            SET warm_response = NULL
            WHERE id = %s
            """,
            (post_id,)
        )

        conn.commit()

        return {
            "message": "Warm response cleared successfully"
        }

    except HTTPException:
        raise

    except Exception as error:

        conn.rollback()

        print("Clear warm response error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to clear warm response"
        )

    finally:
        cursor.close()
        conn.close()


# ============================================================
# 7. ADD COMMENT TO A POST
# ============================================================

@router.post("/{post_id}/comments")
def add_comment(
    post_id: int,
    data: dict
):

    session_token = data.get("session_token")
    content = data.get("content")


    # --------------------------------------------------------
    # VALIDATE SESSION
    # --------------------------------------------------------

    if not session_token:

        raise HTTPException(
            status_code=401,
            detail="Session token required"
        )


    user_id, role = get_session_user(
        session_token
    )


    if not user_id:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )


    # --------------------------------------------------------
    # VALIDATE COMMENT
    # --------------------------------------------------------

    if not content or not content.strip():

        raise HTTPException(
            status_code=400,
            detail="Comment cannot be empty"
        )


    # --------------------------------------------------------
    # CONNECT TO DATABASE
    # --------------------------------------------------------

    conn = get_connection()


    if not conn:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )


    cursor = conn.cursor(
        dictionary=True
    )


    try:

        # ----------------------------------------------------
        # CHECK THAT POST EXISTS
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id
            FROM posts
            WHERE id = %s
              AND status = 'approved'
            """,
            (post_id,)
        )


        post = cursor.fetchone()


        if not post:

            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )


        # ----------------------------------------------------
        # GET USER INFORMATION
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                nickname,
                avatar
            FROM users
            WHERE id = %s
            """,
            (user_id,)
        )


        user = cursor.fetchone()


        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found"
            )


        # ----------------------------------------------------
        # SAVE COMMENT
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO post_comments
            (
                post_id,
                user_id,
                content
            )
            VALUES
            (
                %s,
                %s,
                %s
            )
            """,
            (
                post_id,
                user_id,
                content.strip()
            )
        )


        conn.commit()


        comment_id = cursor.lastrowid


        # ----------------------------------------------------
        # RETURN THE NEW COMMENT
        # ----------------------------------------------------

        return {

            "message":
                "Comment added successfully",

            "comment": {

                "id":
                    comment_id,

                "post_id":
                    post_id,

                "content":
                    content.strip(),

                "nickname":
                    user["nickname"],

                "avatar":
                    user["avatar"],

                "is_owner":
                    True

            }

        }


    except HTTPException:

        raise


    except Exception as error:

        conn.rollback()

        print(
            "Add comment error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to add comment"
        )


    finally:

        cursor.close()
        conn.close()


# ============================================================
# 8. GET COMMENTS FOR A POST
# ============================================================

@router.get("/{post_id}/comments")
def get_comments(
    post_id: int,
    session_token: str = None
):

    conn = get_connection()


    if not conn:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )


    cursor = conn.cursor(
        dictionary=True
    )


    try:

        # ----------------------------------------------------
        # CHECK THAT POST EXISTS
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id
            FROM posts
            WHERE id = %s
              AND status = 'approved'
            """,
            (post_id,)
        )


        post = cursor.fetchone()


        if not post:

            raise HTTPException(
                status_code=404,
                detail="Post not found"
            )


        # ----------------------------------------------------
        # FIND CURRENT USER
        # ----------------------------------------------------

        current_user_id = None


        if session_token:

            current_user_id, _ = (
                get_session_user(
                    session_token
                )
            )


        # ----------------------------------------------------
        # GET COMMENTS
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                c.id,
                c.post_id,
                c.user_id,
                c.content,
                c.created_at,
                u.nickname,
                u.avatar
            FROM post_comments c
            LEFT JOIN users u
                ON c.user_id = u.id
            WHERE c.post_id = %s
            ORDER BY c.created_at ASC
            """,
            (post_id,)
        )


        comments = cursor.fetchall()


        # ----------------------------------------------------
        # ADD OWNER INFORMATION
        # ----------------------------------------------------

        for comment in comments:

            comment["is_owner"] = (
                current_user_id is not None
                and comment["user_id"]
                == current_user_id
            )


            # Never expose the internal user ID
            del comment["user_id"]


        return comments


    except HTTPException:

        raise


    except Exception as error:

        print(
            "Get comments error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load comments"
        )


    finally:

        cursor.close()
        conn.close()

# ============================================================
# 9. ADMIN - GET SAFETY ALERTS
# ============================================================

@router.get("/admin/safety-alerts")
def get_safety_alerts(
    session_token: str = None,
    status: str = "pending"
):

    # --------------------------------------------------------
    # ADMIN AUTHENTICATION
    # --------------------------------------------------------

    verify_admin(session_token)

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        # ----------------------------------------------------
        # GET SAFETY ALERTS
        # ----------------------------------------------------

        if status == "all":

            cursor.execute(
                """
                SELECT
                    a.id,
                    a.post_id,
                    a.severity,
                    a.reason,
                    a.status,
                    a.admin_response,
                    a.reviewed_by,
                    a.created_at,
                    a.responded_at,
                    p.content,
                    p.mood,
                    p.category,
                    p.created_at AS post_created_at
                FROM post_safety_alerts a
                INNER JOIN posts p
                    ON a.post_id = p.id
                ORDER BY
                    a.created_at DESC
                """
            )

        else:

            cursor.execute(
                """
                SELECT
                    a.id,
                    a.post_id,
                    a.severity,
                    a.reason,
                    a.status,
                    a.admin_response,
                    a.reviewed_by,
                    a.created_at,
                    a.responded_at,
                    p.content,
                    p.mood,
                    p.category,
                    p.created_at AS post_created_at
                FROM post_safety_alerts a
                INNER JOIN posts p
                    ON a.post_id = p.id
                WHERE a.status = %s
                ORDER BY
                    a.created_at DESC
                """,
                (status,)
            )

        alerts = cursor.fetchall()

        # ----------------------------------------------------
        # RETURN ALERTS
        # ----------------------------------------------------

        return {
            "alerts": alerts,
            "count": len(alerts)
        }

    except Exception as error:

        print(
            "Get safety alerts error:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to load safety alerts"
        )

    finally:

        cursor.close()
        conn.close()

# ============================================================
# 10. ADMIN - RESPOND TO SAFETY ALERT
# ============================================================

@router.put("/admin/safety-alerts/{alert_id}/respond")
def respond_to_safety_alert(
    alert_id: int,
    data: dict,
    session_token: str = None
):
    admin_id = verify_admin(session_token)

    admin_response = data.get("admin_response")

    if not admin_response or not admin_response.strip():
        raise HTTPException(
            status_code=400,
            detail="Admin response is required"
        )

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:
        # Check whether the alert exists
        cursor.execute("""
            SELECT
                id,
                post_id,
                status
            FROM post_safety_alerts
            WHERE id = %s
        """, (alert_id,))

        alert = cursor.fetchone()

        if not alert:
            raise HTTPException(
                status_code=404,
                detail="Safety alert not found"
            )

        # Save admin response
        cursor.execute("""
            UPDATE post_safety_alerts
            SET
                admin_response = %s,
                status = 'responded',
                reviewed_by = %s,
                responded_at = NOW()
            WHERE id = %s
        """, (
            admin_response.strip(),
            admin_id,
            alert_id
        ))
        cursor.execute("""
    UPDATE posts
    SET warm_response = %s
    WHERE id = %s
""", (
    admin_response.strip(),
    alert["post_id"]
))
        conn.commit()

        return {
            "message": "Safety alert response saved successfully",
            "alert_id": alert_id,
            "status": "responded"
        }

    except HTTPException:
        conn.rollback()
        raise

    except Exception as error:
        conn.rollback()
        print("Respond to safety alert error:", error)

        raise HTTPException(
            status_code=500,
            detail="Unable to save admin response"
        )

    finally:
        cursor.close()
        conn.close()
# ============================================================
# USER - VIEW MY SAFETY RESPONSES
# ============================================================

@router.get("/my-safety-responses")
def get_my_safety_responses(
    session_token: str = None
):

    user_id, role = get_session_user(session_token)

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    conn = get_connection()

    if not conn:
        raise HTTPException(
            status_code=500,
            detail="Database connection failed"
        )

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                a.id AS alert_id,
                a.post_id,
                a.admin_response,
                a.status,
                a.responded_at
            FROM post_safety_alerts a
            INNER JOIN posts p
                ON p.id = a.post_id
            WHERE
                p.anonymous_user_id = %s
                AND a.status = 'responded'
                AND a.admin_response IS NOT NULL
                AND a.admin_response != ''
            ORDER BY a.responded_at DESC
            """,
            (user_id,)
        )

        responses = cursor.fetchall()

        return {
            "responses": responses
        }

    finally:

        cursor.close()
        conn.close()