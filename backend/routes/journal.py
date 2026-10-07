
from fastapi import APIRouter, UploadFile, File
import os
import secrets
from database import get_connection


router = APIRouter()


# =========================================================
# GET CURRENT USER FROM SESSION
# =========================================================

def get_current_user(cursor, session_token):

    if not session_token:
        return None

    cursor.execute(
        """
        SELECT
            users.id,
            users.role
        FROM user_sessions
        JOIN users
            ON users.id = user_sessions.user_id
        WHERE user_sessions.session_token = %s
        AND user_sessions.expires_at > NOW()
        """,
        (session_token,)
    )

    return cursor.fetchone()
# ======================================================
# UPLOAD JOURNAL IMAGE
# ======================================================

@router.post("/upload-image")
async def upload_journal_image(
    session_token: str = None,
    image_file: UploadFile = File(...)
):
    conn = get_connection()

    if not conn:
        return {"error": "Database connection failed"}

    cursor = conn.cursor(dictionary=True)

    try:

        # --------------------------------------------------
        # VERIFY USER SESSION
        # --------------------------------------------------

        user = get_current_user(cursor, session_token)

        if not user:
            return {"error": "Authentication required"}


        # --------------------------------------------------
        # VALIDATE FILE TYPE
        # --------------------------------------------------

        allowed_types = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp"
        }

        if image_file.content_type not in allowed_types:
            return {
                "error": "Only JPG, PNG, and WebP images are allowed."
            }


        # --------------------------------------------------
        # READ FILE
        # --------------------------------------------------

        file_data = await image_file.read()


        # --------------------------------------------------
        # MAX 5 MB
        # --------------------------------------------------

        max_size = 5 * 1024 * 1024

        if len(file_data) > max_size:
            return {
                "error": "Image must be smaller than 5 MB."
            }


        # --------------------------------------------------
        # CREATE UPLOAD DIRECTORY
        # --------------------------------------------------

        upload_directory = os.path.abspath(
            os.path.join(
                os.path.dirname(__file__),
                "../../frontend/uploads/journal"
            )
        )

        os.makedirs(
            upload_directory,
            exist_ok=True
        )


        # --------------------------------------------------
        # CREATE UNIQUE FILE NAME
        # --------------------------------------------------

        extension = allowed_types[
            image_file.content_type
        ]

        filename = (
            f"user_{user['id']}_"
            f"{secrets.token_hex(8)}"
            f"{extension}"
        )


        file_path = os.path.join(
            upload_directory,
            filename
        )


        # --------------------------------------------------
        # SAVE IMAGE
        # --------------------------------------------------

        with open(file_path, "wb") as file:
            file.write(file_data)


        # --------------------------------------------------
        # RETURN FRONTEND URL
        # --------------------------------------------------

        image_url = (
            f"/frontend/uploads/journal/{filename}"
        )


        return {
            "message": "Journal image uploaded successfully.",
            "image": image_url
        }


    except Exception as error:

        print(
            "Journal image upload error:",
            error
        )

        return {
            "error": "Unable to upload journal image."
        }


    finally:

        cursor.close()
        conn.close()

# =========================================================
# GET MY JOURNAL ENTRIES
# =========================================================

@router.get("/entries")
def get_journal_entries(session_token: str = None):

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
                "error": "Invalid or expired session."
            }

        cursor.execute(
            """
            SELECT
                id,
                mood,
                title,
                content,
                image,
                tag,
                created_at,
                updated_at
            FROM journal_entries
            WHERE user_id = %s
            ORDER BY created_at DESC
            """,
            (user["id"],)
        )

        entries = cursor.fetchall()

        return {
            "entries": entries
        }

    except Exception as error:

        print(
            "GET JOURNAL ENTRIES ERROR:",
            error
        )

        return {
            "error": "Unable to load journal entries."
        }

    finally:

        cursor.close()
        conn.close()


# =========================================================
# CREATE JOURNAL ENTRY
# =========================================================

@router.post("/entries")
def create_journal_entry(
    data: dict,
    session_token: str = None
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
                "error": "Invalid or expired session."
            }

        mood = data.get("mood")
        title = data.get("title")
        content = data.get("content")
        image = data.get("image")
        tag = data.get("tag")

        allowed_moods = [
            "happy",
            "good",
            "okay",
            "sad",
            "anxious",
            "frustrated",
            "tired",
            "grateful"
        ]

        if mood not in allowed_moods:
            return {
                "error": "Invalid mood selected."
            }

        if not title or not title.strip():
            return {
                "error": "Entry title is required."
            }

        if not content or not content.strip():
            return {
                "error": "Journal content is required."
            }

        title = title.strip()
        content = content.strip()

        if len(title) > 150:
            return {
                "error": "Entry title is too long."
            }

        if tag:
            tag = tag.strip()

            if len(tag) > 50:
                return {
                    "error": "Tag is too long."
                }

        cursor.execute(
            """
            INSERT INTO journal_entries
            (
                user_id,
                mood,
                title,
                content,
                image,
                tag
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                %s,
                %s
            )
            """,
            (
                user["id"],
                mood,
                title,
                content,
                image,
                tag
            )
        )

        conn.commit()

        entry_id = cursor.lastrowid

        cursor.execute(
            """
            SELECT
                id,
                mood,
                title,
                content,
                image,
                tag,
                created_at,
                updated_at
            FROM journal_entries
            WHERE id = %s
            AND user_id = %s
            """,
            (
                entry_id,
                user["id"]
            )
        )

        entry = cursor.fetchone()

        return {
            "message": "Journal entry created successfully.",
            "entry": entry
        }

    except Exception as error:

        conn.rollback()

        print(
            "CREATE JOURNAL ENTRY ERROR:",
            error
        )

        return {
            "error": "Unable to create journal entry."
        }

    finally:

        cursor.close()
        conn.close()


# =========================================================
# UPDATE MY JOURNAL ENTRY
# =========================================================

@router.put("/entries/{entry_id}")
def update_journal_entry(
    entry_id: int,
    data: dict,
    session_token: str = None
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
                "error": "Invalid or expired session."
            }

        cursor.execute(
            """
            SELECT id
            FROM journal_entries
            WHERE id = %s
            AND user_id = %s
            """,
            (
                entry_id,
                user["id"]
            )
        )

        existing_entry = cursor.fetchone()

        if not existing_entry:
            return {
                "error": "Journal entry not found."
            }

        mood = data.get("mood")
        title = data.get("title")
        content = data.get("content")
        image = data.get("image")
        tag = data.get("tag")

        allowed_moods = [
            "happy",
            "good",
            "okay",
            "sad",
            "anxious",
            "frustrated",
            "tired",
            "grateful"
        ]

        if mood not in allowed_moods:
            return {
                "error": "Invalid mood selected."
            }

        if not title or not title.strip():
            return {
                "error": "Entry title is required."
            }

        if not content or not content.strip():
            return {
                "error": "Journal content is required."
            }

        title = title.strip()
        content = content.strip()

        if len(title) > 150:
            return {
                "error": "Entry title is too long."
            }

        if tag:
            tag = tag.strip()

            if len(tag) > 50:
                return {
                    "error": "Tag is too long."
                }

        cursor.execute(
            """
            UPDATE journal_entries
            SET
                mood = %s,
                title = %s,
                content = %s,
                image = %s,
                tag = %s
            WHERE id = %s
            AND user_id = %s
            """,
            (
                mood,
                title,
                content,
                image,
                tag,
                entry_id,
                user["id"]
            )
        )

        conn.commit()

        cursor.execute(
            """
            SELECT
                id,
                mood,
                title,
                content,
                image,
                tag,
                created_at,
                updated_at
            FROM journal_entries
            WHERE id = %s
            AND user_id = %s
            """,
            (
                entry_id,
                user["id"]
            )
        )

        entry = cursor.fetchone()

        return {
            "message": "Journal entry updated successfully.",
            "entry": entry
        }

    except Exception as error:

        conn.rollback()

        print(
            "UPDATE JOURNAL ENTRY ERROR:",
            error
        )

        return {
            "error": "Unable to update journal entry."
        }

    finally:

        cursor.close()
        conn.close()


# =========================================================
# DELETE MY JOURNAL ENTRY
# =========================================================

@router.delete("/entries/{entry_id}")
def delete_journal_entry(
    entry_id: int,
    session_token: str = None
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
                "error": "Invalid or expired session."
            }

        cursor.execute(
            """
            SELECT id
            FROM journal_entries
            WHERE id = %s
            AND user_id = %s
            """,
            (
                entry_id,
                user["id"]
            )
        )

        existing_entry = cursor.fetchone()

        if not existing_entry:
            return {
                "error": "Journal entry not found."
            }

        cursor.execute(
            """
            DELETE FROM journal_entries
            WHERE id = %s
            AND user_id = %s
            """,
            (
                entry_id,
                user["id"]
            )
        )

        conn.commit()

        return {
            "message": "Journal entry deleted successfully."
        }

    except Exception as error:

        conn.rollback()

        print(
            "DELETE JOURNAL ENTRY ERROR:",
            error
        )

        return {
            "error": "Unable to delete journal entry."
        }

    finally:

        cursor.close()
        conn.close()