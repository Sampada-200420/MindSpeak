from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from database import get_connection
from passlib.context import CryptContext
from utils import generate_token
from email_service import send_email
from datetime import datetime, timedelta
import os
import secrets
import re


router = APIRouter()


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ======================================================
# MINDSPEAK APPROVED AVATARS
# ======================================================

ALLOWED_AVATARS = [
    "🌱",
    "🌙",
    "⭐",
    "🦋",
    "☁️",
    "🌻",
    "🌊",
    "🍃",
    "🌸",
    "🌈",
    "☀️",
    "🌿",
    "🐻",
    "🐼",
    "🦊",
    "🐨",
    "🐰",
    "🐱",
    "🐶",
    "🦄",
    "💫",
    "🌌",
    "🔥",
    "💚"
]


# ======================================================
# INAPPROPRIATE NAME FILTER
# ======================================================

INAPPROPRIATE_NAME_WORDS = [
    "fuck",
    "fucking",
    "shit",
    "bitch",
    "asshole",
    "bastard",
    "dick",
    "pussy",
    "slut",
    "whore",
    "nazi",
    "terrorist",
]


def validate_nickname(nickname, check_required=True):
    """
    Validate a MindSpeak public nickname.

    Registration requires a nickname.
    Profile editing can allow an empty nickname
    when the user chooses to delete it.
    """

    nickname = str(nickname or "").strip()

    # --------------------------------------------------
    # EMPTY NAME
    # --------------------------------------------------

    if not nickname:
        if check_required:
            return "Please choose a MindSpeak name."
        return None

    # --------------------------------------------------
    # LENGTH
    # --------------------------------------------------

    if len(nickname) < 3:
        return "MindSpeak name must be at least 3 characters."

    if len(nickname) > 30:
        return "MindSpeak name must be 30 characters or less."

    # --------------------------------------------------
    # ALLOWED CHARACTERS
    # --------------------------------------------------

    if not re.match(r"^[\w .'-]+$", nickname, re.UNICODE):
        return (
            "MindSpeak name can contain letters, numbers, "
            "spaces, dots, hyphens, and apostrophes only."
        )

    # --------------------------------------------------
    # INAPPROPRIATE WORD CHECK
    # --------------------------------------------------

    nickname_lower = nickname.casefold()

    for word in INAPPROPRIATE_NAME_WORDS:

        pattern = r"\b" + re.escape(word) + r"\b"

        if re.search(pattern, nickname_lower):
            return "Please choose an appropriate MindSpeak name."

    return None


def nickname_is_available(cursor, nickname, exclude_user_id=None):
    """
    Check whether a nickname is already being used.
    Case-insensitive.
    """

    if not nickname:
        return True

    if exclude_user_id:

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE LOWER(nickname) = LOWER(%s)
            AND id != %s
            LIMIT 1
            """,
            (
                nickname,
                exclude_user_id
            )
        )

    else:

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE LOWER(nickname) = LOWER(%s)
            LIMIT 1
            """,
            (nickname,)
        )

    return cursor.fetchone() is None


def validate_avatar(avatar, allow_empty=False):
    """
    Validate a MindSpeak avatar.
    """

    avatar = str(avatar or "").strip()

    if not avatar:

        if allow_empty:
            return None

        return "Please choose an avatar."

    if avatar not in ALLOWED_AVATARS:

        return "Invalid avatar selected."

    return None


def get_session_user(cursor, session_token):
    """
    Return the logged-in user associated with a session.
    """

    if not session_token:
        return None

    cursor.execute(
        """
        SELECT
            users.id,
            users.username,
            users.email,
            users.nickname,
            users.avatar,
            users.role
        FROM user_sessions
        JOIN users
            ON users.id = user_sessions.user_id
        WHERE user_sessions.session_token = %s
        AND user_sessions.expires_at > NOW()
        LIMIT 1
        """,
        (session_token,)
    )

    return cursor.fetchone()


# ======================================================
# REGISTER
# ======================================================

@router.post("/register")
def register(data: dict):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # GET DATA
        # --------------------------------------------------

        email = str(
            data.get("email", "")
        ).strip()

        username = str(
            data.get("username", "")
        ).strip()

        password = data.get(
            "password",
            ""
        )

        nickname = str(
            data.get("nickname", "")
        ).strip()

        avatar = str(
            data.get("avatar", "")
        ).strip()


        # --------------------------------------------------
        # BASIC VALIDATION
        # --------------------------------------------------

        if not email:

            return {
                "error": "Email is required"
            }


        if not username:

            return {
                "error": "Username is required"
            }


        if not password:

            return {
                "error": "Password is required"
            }


        # --------------------------------------------------
        # NICKNAME VALIDATION
        # --------------------------------------------------

        nickname_error = validate_nickname(
            nickname,
            check_required=True
        )

        if nickname_error:

            return {
                "error": nickname_error
            }


        # --------------------------------------------------
        # AVATAR VALIDATION
        # --------------------------------------------------

        avatar_error = validate_avatar(
            avatar,
            allow_empty=False
        )

        if avatar_error:

            return {
                "error": avatar_error
            }


        # --------------------------------------------------
        # CHECK EMAIL
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        if cursor.fetchone():

            return {
                "error": "Email already registered"
            }


        # --------------------------------------------------
        # CHECK USERNAME
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE username = %s
            LIMIT 1
            """,
            (username,)
        )

        if cursor.fetchone():

            return {
                "error": "Username already taken"
            }


        # --------------------------------------------------
        # CHECK NICKNAME
        # --------------------------------------------------

        if not nickname_is_available(
            cursor,
            nickname
        ):

            return {
                "error": "This MindSpeak name is already taken"
            }


        # --------------------------------------------------
        # HASH PASSWORD
        # --------------------------------------------------

        hashed_password = pwd_context.hash(
            password
        )


        # --------------------------------------------------
        # CREATE USER
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT INTO users
            (
                username,
                email,
                password_hash,
                nickname,
                avatar,
                verify_token,
                is_verified
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                username,
                email,
                hashed_password,
                nickname,
                avatar,
                None,
                True
            )
        )


        user_id = cursor.lastrowid


        # --------------------------------------------------
        # CREATE DEFAULT CONNECTION PROFILE
        # --------------------------------------------------

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
                "Looking for someone who understands.",
                "",
                True
            )
        )


        conn.commit()


        # --------------------------------------------------
        # REGISTRATION RESPONSE
        # --------------------------------------------------

        return {
            "message": "Registered successfully!",
            "nickname": nickname,
            "avatar": avatar
        }


    except Exception as error:

        conn.rollback()

        print(
            "REGISTER ERROR:",
            error
        )

        return {
            "error": (
                "Registration failed. "
                "Please try again."
            )
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# VERIFY EMAIL
# ======================================================

# Kept for compatibility.
# Registration does NOT require email verification.

@router.get("/verify/{token}")
def verify_email(token: str):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE verify_token = %s
            LIMIT 1
            """,
            (token,)
        )

        user = cursor.fetchone()


        if not user:

            return {
                "error": "Invalid or expired token"
            }


        cursor.execute(
            """
            UPDATE users
            SET
                is_verified = TRUE,
                verify_token = NULL
            WHERE id = %s
            """,
            (user["id"],)
        )


        conn.commit()


        return {
            "message": (
                "Email verified successfully! "
                "You can now login."
            )
        }


    except Exception as error:

        conn.rollback()

        print(
            "EMAIL VERIFICATION ERROR:",
            error
        )

        return {
            "error": (
                "Unable to verify email. "
                "Please try again."
            )
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# LOGIN
# ======================================================

@router.post("/login")
def login(data: dict):

    email = str(
        data.get("email", "")
    ).strip()

    password = data.get(
        "password",
        ""
    )


    if not email or not password:

        raise HTTPException(
            status_code=400,
            detail="Email and password are required."
        )


    conn = get_connection()

    if not conn:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )


    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # FIND USER
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                username,
                email,
                password_hash,
                nickname,
                avatar,
                role
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        user = cursor.fetchone()


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )


        # --------------------------------------------------
        # VERIFY PASSWORD
        # --------------------------------------------------

        if not pwd_context.verify(
            password,
            user["password_hash"]
        ):

            raise HTTPException(
                status_code=401,
                detail="Invalid email or password."
            )


        # --------------------------------------------------
        # CREATE SESSION
        # --------------------------------------------------

        session_token = generate_token()

        expires_at = (
            datetime.now()
            + timedelta(days=7)
        )


        cursor.execute(
            """
            INSERT INTO user_sessions
            (
                user_id,
                session_token,
                expires_at
            )
            VALUES
            (
                %s,
                %s,
                %s
            )
            """,
            (
                user["id"],
                session_token,
                expires_at
            )
        )


        conn.commit()


        return {
            "message": "Login successful!",
            "session_token": session_token,
            "user_id": user["id"],
            "username": user["username"],
            "nickname": user["nickname"],
            "avatar": user["avatar"],
            "role": user["role"]
        }


    except HTTPException:

        conn.rollback()
        raise


    except Exception as error:

        conn.rollback()

        print(
            "LOGIN ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Login failed. Please try again."
        )


    finally:

        cursor.close()
        conn.close()


# ======================================================
# FORGOT PASSWORD
# ======================================================

@router.post("/forgot-password")
def forgot_password(data: dict):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        email = str(
            data.get("email", "")
        ).strip()


        if not email:

            return {
                "error": "Email is required"
            }


        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,)
        )

        user = cursor.fetchone()


        if not user:

            return {
                "message": (
                    "If this email exists, "
                    "a reset link has been sent"
                )
            }


        reset_token = generate_token()

        expiry = (
            datetime.now()
            + timedelta(hours=1)
        )


        cursor.execute(
            """
            UPDATE users
            SET
                reset_token = %s,
                reset_token_expiry = %s
            WHERE id = %s
            """,
            (
                reset_token,
                expiry,
                user["id"]
            )
        )


        conn.commit()


        # --------------------------------------------------
        # SEND PASSWORD RESET EMAIL
        # --------------------------------------------------

        frontend_url = os.getenv(
            "FRONTEND_URL",
            "http://127.0.0.1:5500"
        ).rstrip("/")


        reset_link = (
            f"{frontend_url}/reset-password.html"
            f"?token={reset_token}"
        )


        send_email(
            to_email=email,
            subject="Reset your MindSpeak password",
            body=f"""Hello,

We received a request to reset your MindSpeak password.

Please open the link below to create a new password:

{reset_link}

This link will expire in 1 hour.

If you did not request a password reset, you can safely ignore this email.

With care,
MindSpeak Team 💚
"""
        )


        return {
            "message": (
                "If this email exists, "
                "a reset link has been sent"
            )
        }


    except Exception as error:

        conn.rollback()

        print(
            "FORGOT PASSWORD ERROR:",
            error
        )

        return {
            "error": (
                "Unable to process the request."
            )
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# RESET PASSWORD
# ======================================================

@router.post("/reset-password")
def reset_password(data: dict):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        token = data.get(
            "token",
            ""
        )

        new_password = data.get(
            "new_password",
            ""
        )


        if not token:

            return {
                "error": "Reset token is required"
            }


        if not new_password:

            return {
                "error": "New password is required"
            }


        cursor.execute(
            """
            SELECT id
            FROM users
            WHERE reset_token = %s
            AND reset_token_expiry > NOW()
            LIMIT 1
            """,
            (token,)
        )

        user = cursor.fetchone()


        if not user:

            return {
                "error": "Invalid or expired reset token"
            }


        hashed_password = pwd_context.hash(
            new_password
        )


        cursor.execute(
            """
            UPDATE users
            SET
                password_hash = %s,
                reset_token = NULL,
                reset_token_expiry = NULL
            WHERE id = %s
            """,
            (
                hashed_password,
                user["id"]
            )
        )


        conn.commit()


        return {
            "message": (
                "Password reset successfully! "
                "You can now login."
            )
        }


    except Exception as error:

        conn.rollback()

        print(
            "RESET PASSWORD ERROR:",
            error
        )

        return {
            "error": (
                "Unable to reset password. "
                "Please try again."
            )
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET PROFILE
# ======================================================

@router.get("/me/{user_id}")
def get_profile(user_id: int):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                nickname,
                avatar,
                role,
                created_at
            FROM users
            WHERE id = %s
            LIMIT 1
            """,
            (user_id,)
        )

        user = cursor.fetchone()


        if not user:

            return {
                "error": "User not found"
            }


        return user


    except Exception as error:

        print(
            "GET PROFILE ERROR:",
            error
        )

        return {
            "error": "Unable to load profile."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# UPDATE PROFILE IDENTITY
# ======================================================

@router.put("/update-identity")
def update_identity(data: dict):

    session_token = data.get(
        "session_token"
    )

    conn = get_connection()

    if not conn:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY SESSION
        # --------------------------------------------------

        user = get_session_user(
            cursor,
            session_token
        )


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session."
            )


        user_id = user["id"]


        # --------------------------------------------------
        # CHECK WHICH FIELDS WERE SENT
        # --------------------------------------------------

        nickname_provided = (
            "nickname" in data
        )

        avatar_provided = (
            "avatar" in data
        )


        if not nickname_provided and not avatar_provided:

            raise HTTPException(
                status_code=400,
                detail="No identity changes were provided."
            )


        # --------------------------------------------------
        # NICKNAME
        # --------------------------------------------------

        if nickname_provided:

            nickname = str(
                data.get("nickname") or ""
            ).strip()


            # Empty nickname means DELETE nickname
            if nickname == "":

                new_nickname = None

            else:

                nickname_error = validate_nickname(
                    nickname,
                    check_required=False
                )

                if nickname_error:

                    raise HTTPException(
                        status_code=400,
                        detail=nickname_error
                    )


                if not nickname_is_available(
                    cursor,
                    nickname,
                    exclude_user_id=user_id
                ):

                    raise HTTPException(
                        status_code=400,
                        detail=(
                            "This MindSpeak name "
                            "is already taken."
                        )
                    )


                new_nickname = nickname

        else:

            new_nickname = user["nickname"]


        # --------------------------------------------------
        # AVATAR
        # --------------------------------------------------

        if avatar_provided:

            avatar = str(
                data.get("avatar") or ""
            ).strip()


            # Empty avatar means DELETE avatar
            if avatar == "":

                new_avatar = None

            else:

                avatar_error = validate_avatar(
                    avatar,
                    allow_empty=False
                )

                if avatar_error:

                    raise HTTPException(
                        status_code=400,
                        detail=avatar_error
                    )


                new_avatar = avatar

        else:

            new_avatar = user["avatar"]


        # --------------------------------------------------
        # UPDATE DATABASE
        # --------------------------------------------------

        cursor.execute(
            """
            UPDATE users
            SET
                nickname = %s,
                avatar = %s
            WHERE id = %s
            """,
            (
                new_nickname,
                new_avatar,
                user_id
            )
        )


        conn.commit()


        return {
            "message": "Identity updated successfully.",
            "nickname": new_nickname,
            "avatar": new_avatar
        }


    except HTTPException:

        conn.rollback()
        raise


    except Exception as error:

        conn.rollback()

        print(
            "UPDATE IDENTITY ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update identity."
        )


    finally:

        cursor.close()
        conn.close()


# ======================================================
# DELETE NICKNAME
# ======================================================

@router.delete("/delete-nickname")
def delete_nickname(data: dict):

    session_token = data.get(
        "session_token"
    )

    conn = get_connection()

    if not conn:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = conn.cursor(dictionary=True)

    try:

        user = get_session_user(
            cursor,
            session_token
        )


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session."
            )


        cursor.execute(
            """
            UPDATE users
            SET nickname = NULL
            WHERE id = %s
            """,
            (user["id"],)
        )


        conn.commit()


        return {
            "message": "MindSpeak name deleted successfully.",
            "nickname": None
        }


    except HTTPException:

        conn.rollback()
        raise


    except Exception as error:

        conn.rollback()

        print(
            "DELETE NICKNAME ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete MindSpeak name."
        )


    finally:

        cursor.close()
        conn.close()


# ======================================================
# DELETE AVATAR
# ======================================================

@router.delete("/delete-avatar")
def delete_avatar(data: dict):

    session_token = data.get(
        "session_token"
    )

    conn = get_connection()

    if not conn:

        raise HTTPException(
            status_code=500,
            detail="Database connection failed."
        )

    cursor = conn.cursor(dictionary=True)

    try:

        user = get_session_user(
            cursor,
            session_token
        )


        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session."
            )


        cursor.execute(
            """
            UPDATE users
            SET avatar = NULL
            WHERE id = %s
            """,
            (user["id"],)
        )


        conn.commit()


        return {
            "message": "Avatar deleted successfully.",
            "avatar": None
        }


    except HTTPException:

        conn.rollback()
        raise


    except Exception as error:

        conn.rollback()

        print(
            "DELETE AVATAR ERROR:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete avatar."
        )


    finally:

        cursor.close()
        conn.close()


# ======================================================
# UPDATE AVATAR
# ======================================================

@router.post("/update-avatar")
async def update_avatar(
    session_token: str = Form(...),
    avatar_type: str = Form(...),
    avatar_file: UploadFile = File(None),
    avatar_value: str = Form(None)
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY SESSION
        # --------------------------------------------------

        user = get_session_user(
            cursor,
            session_token
        )


        if not user:

            return {
                "error": "Invalid or expired session."
            }


        user_id = user["id"]


        # --------------------------------------------------
        # BUILT-IN EMOJI AVATAR
        # --------------------------------------------------

        if avatar_type == "emoji":

            avatar_value = str(
                avatar_value or ""
            ).strip()


            if avatar_value not in ALLOWED_AVATARS:

                return {
                    "error": "Invalid avatar selected."
                }


            cursor.execute(
                """
                UPDATE users
                SET avatar = %s
                WHERE id = %s
                """,
                (
                    avatar_value,
                    user_id
                )
            )


            conn.commit()


            return {
                "message": "Avatar updated successfully.",
                "avatar": avatar_value
            }


        # --------------------------------------------------
        # UPLOADED IMAGE AVATAR
        # --------------------------------------------------

        if avatar_type == "upload":

            if not avatar_file:

                return {
                    "error": "No image file selected."
                }


            allowed_extensions = [
                ".jpg",
                ".jpeg",
                ".png"
            ]


            filename = (
                avatar_file.filename
                or ""
            )


            extension = os.path.splitext(
                filename
            )[1].lower()


            if extension not in allowed_extensions:

                return {
                    "error": (
                        "Only JPG, JPEG, and PNG "
                        "images are allowed."
                    )
                }


            allowed_content_types = [
                "image/jpeg",
                "image/png"
            ]


            if (
                avatar_file.content_type
                not in allowed_content_types
            ):

                return {
                    "error": "Invalid image type."
                }


            image_data = await avatar_file.read()


            max_size = 5 * 1024 * 1024


            if len(image_data) > max_size:

                return {
                    "error": (
                        "Image must be smaller "
                        "than 5 MB."
                    )
                }


            upload_directory = os.path.abspath(
                os.path.join(
                    os.path.dirname(__file__),
                    "../../frontend/uploads/avatars"
                )
            )


            os.makedirs(
                upload_directory,
                exist_ok=True
            )


            new_filename = (
                f"user_{user_id}_"
                f"{secrets.token_hex(8)}"
                f"{extension}"
            )


            file_path = os.path.join(
                upload_directory,
                new_filename
            )


            with open(
                file_path,
                "wb"
            ) as file:

                file.write(image_data)


            avatar_path = (
                "/frontend/uploads/avatars/"
                f"{new_filename}"
            )


            cursor.execute(
                """
                UPDATE users
                SET avatar = %s
                WHERE id = %s
                """,
                (
                    avatar_path,
                    user_id
                )
            )


            conn.commit()


            return {
                "message": (
                    "Avatar uploaded successfully."
                ),
                "avatar": avatar_path
            }


        # --------------------------------------------------
        # INVALID AVATAR TYPE
        # --------------------------------------------------

        return {
            "error": "Invalid avatar type."
        }


    except Exception as error:

        conn.rollback()

        print(
            "UPDATE AVATAR ERROR:",
            error
        )

        return {
            "error": (
                "Unable to update avatar."
            )
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# LOGOUT
# ======================================================

@router.post("/logout")
def logout():

    return {
        "message": "Logged out successfully"
    }