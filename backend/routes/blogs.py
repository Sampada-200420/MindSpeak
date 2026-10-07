# ============================================================
# MINDSPEAK BLOG ROUTES
# Public blog system + user blogs + interactions + admin
# ============================================================

from fastapi import APIRouter, UploadFile, File
from database import get_connection

import os
import uuid


router = APIRouter()


# ============================================================
# ADMIN AUTHENTICATION
# ============================================================

def verify_admin(cursor, session_token):

    if not session_token:
        return None

    cursor.execute(
        """
        SELECT
            u.id,
            u.role
        FROM user_sessions s
        JOIN users u
            ON s.user_id = u.id
        WHERE s.session_token = %s
        AND s.expires_at > NOW()
        """,
        (session_token,)
    )

    admin = cursor.fetchone()

    if not admin:
        return None

    if admin["role"] != "admin":
        return None

    return admin


# ============================================================
# USER — UPLOAD BLOG COVER IMAGE
# ============================================================

@router.post("/upload-cover")
async def upload_blog_cover(
    file: UploadFile = File(...)
):

    # --------------------------------------------------------
    # Validate file
    # --------------------------------------------------------

    if not file:
        return {
            "error": "No image selected."
        }

    allowed_types = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ]

    if file.content_type not in allowed_types:
        return {
            "error": "Only JPG, PNG or WEBP images are allowed."
        }

    # --------------------------------------------------------
    # Create frontend image directory
    #
    # blogs.py is inside:
    # backend/routes/
    #
    # We need:
    # frontend/images/Blogs/
    # --------------------------------------------------------

    upload_directory = os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "../../frontend/images/Blogs"
        )
    )

    os.makedirs(
        upload_directory,
        exist_ok=True
    )

    # --------------------------------------------------------
    # Generate unique filename
    # --------------------------------------------------------

    original_name = file.filename or "cover-image"

    extension = os.path.splitext(
        original_name
    )[1].lower()

    if extension not in [
        ".jpg",
        ".jpeg",
        ".png",
        ".webp"
    ]:
        extension = ".jpg"

    filename = (
        str(uuid.uuid4())
        + extension
    )

    file_path = os.path.join(
        upload_directory,
        filename
    )

    # --------------------------------------------------------
    # Save file
    # --------------------------------------------------------

    try:

        contents = await file.read()

        with open(
            file_path,
            "wb"
        ) as image_file:

            image_file.write(contents)

    except Exception as error:

        print(
            "Cover image upload error:",
            error
        )

        return {
            "error": "Failed to save cover image."
        }

    # --------------------------------------------------------
    # Return frontend path
    # --------------------------------------------------------

    return {
        "message":
            "Cover image uploaded successfully.",

        "filename":
            filename,

        "cover_image":
            "images/Blogs/" + filename
    }


# ============================================================
# USER — CREATE BLOG
#
# Used by write-blog.js
#
# status:
#   draft
#   pending
# ============================================================

@router.post("/")
def create_blog(
    data: dict
):

    title = data.get(
        "title"
    )

    content = data.get(
        "content"
    )

    category = data.get(
        "category"
    )

    cover_image = data.get(
        "cover_image"
    )

    author_id = data.get(
        "author_id"
    )

    status = data.get(
        "status",
        "draft"
    )

    # --------------------------------------------------------
    # Validation
    # --------------------------------------------------------

    if not title:
        return {
            "error":
                "Blog title is required."
        }

    if not content:
        return {
            "error":
                "Blog content is required."
        }

    if not author_id:
        return {
            "error":
                "Author ID is required."
        }

    if status not in [
        "draft",
        "pending"
    ]:
        return {
            "error":
                "Invalid blog status."
        }

    # --------------------------------------------------------
    # Database
    # --------------------------------------------------------

    conn = get_connection()

    if not conn:
        return {
            "error":
                "Database connection failed."
        }

    cursor = conn.cursor(
        dictionary=True
    )

    try:

        # ----------------------------------------------------
        # Check author
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id
            FROM users
            WHERE id = %s
            """,
            (author_id,)
        )

        user = cursor.fetchone()

        if not user:

            return {
                "error":
                    "Author not found."
            }

        # ----------------------------------------------------
        # Draft and pending blogs are not published
        # ----------------------------------------------------

        published = 0

        # ----------------------------------------------------
        # Insert blog
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO blogs
            (
                title,
                content,
                category,
                cover_image,
                author_id,
                published,
                status
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
                title,
                content,
                category,
                cover_image,
                author_id,
                published,
                status
            )
        )

        conn.commit()

        blog_id = cursor.lastrowid

        return {
            "message":
                "Blog created successfully.",

            "blog_id":
                blog_id,

            "author_id":
                author_id,

            "status":
                status,

            "cover_image":
                cover_image
        }

    except Exception as error:

        conn.rollback()

        print(
            "Create blog error:",
            error
        )

        return {
            "error":
                "Failed to create blog."
        }

    finally:

        cursor.close()
        conn.close()


# ============================================================
# GET ALL PUBLISHED BLOGS
# PUBLIC
# ============================================================

@router.get("/")
def get_blogs():

    conn = get_connection()

    if not conn:
        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT
            blogs.id,
            blogs.title,
            blogs.content,
            blogs.category,
            blogs.cover_image,
            blogs.author_id,
            users.username AS author,
            blogs.published,
            blogs.created_at,
            blogs.views,
            blogs.likes,
            blogs.status
        FROM blogs
        JOIN users
            ON blogs.author_id = users.id
        WHERE blogs.published = 1
        AND blogs.status = 'published'
        ORDER BY blogs.created_at DESC
        """
    )

    blogs = cursor.fetchall()

    cursor.close()
    conn.close()

    for blog in blogs:

        if blog.get("created_at"):

            blog["created_at"] = str(
                blog["created_at"]
            )

    return blogs


# ============================================================
# ADMIN — GET ALL BLOGS
# Includes drafts, pending, published and rejected
# ============================================================

@router.get("/admin/all")
def admin_get_all_blogs(
    session_token: str = None
):

    conn = get_connection()

    if not conn:
        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        cursor.close()
        conn.close()

        return {
            "error":
                "Admin access required"
        }

    cursor.execute(
        """
        SELECT
            blogs.id,
            blogs.title,
            blogs.content,
            blogs.category,
            blogs.cover_image,
            blogs.author_id,
            users.username AS author,
            blogs.published,
            blogs.created_at,
            blogs.views,
            blogs.likes,
            blogs.status,
            blogs.rejection_reason
        FROM blogs
        LEFT JOIN users
            ON blogs.author_id = users.id
        ORDER BY blogs.created_at DESC
        """
    )

    blogs = cursor.fetchall()

    cursor.close()
    conn.close()

    for blog in blogs:

        if blog.get("created_at"):

            blog["created_at"] = str(
                blog["created_at"]
            )

    return {
        "blogs":
            blogs
    }


# ============================================================
# ADMIN — CREATE BLOG
# ============================================================

@router.post("/admin/create")
def admin_create_blog(
    data: dict
):

    session_token = data.get(
        "session_token"
    )

    title = data.get(
        "title"
    )

    content = data.get(
        "content"
    )

    category = data.get(
        "category"
    )

    cover_image = data.get(
        "cover_image"
    )

    status = data.get(
        "status",
        "draft"
    )

    if not title:

        return {
            "error":
                "Blog title is required"
        }

    if not content:

        return {
            "error":
                "Blog content is required"
        }

    if status not in [
        "draft",
        "pending",
        "published"
    ]:

        return {
            "error":
                "Status must be draft, pending or published"
        }

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        cursor.close()
        conn.close()

        return {
            "error":
                "Admin access required"
        }

    published = (
        1
        if status == "published"
        else 0
    )

    cursor.execute(
        """
        INSERT INTO blogs
        (
            title,
            content,
            category,
            cover_image,
            author_id,
            published,
            status
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
            title,
            content,
            category,
            cover_image,
            admin["id"],
            published,
            status
        )
    )

    conn.commit()

    blog_id = cursor.lastrowid

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog created successfully",

        "blog_id":
            blog_id,

        "status":
            status
    }


# ============================================================
# ADMIN — UPDATE BLOG
# ============================================================

@router.put("/admin/{blog_id}")
def admin_update_blog(
    blog_id: int,
    data: dict
):

    session_token = data.get(
        "session_token"
    )

    title = data.get(
        "title"
    )

    content = data.get(
        "content"
    )

    category = data.get(
        "category"
    )

    cover_image = data.get(
        "cover_image"
    )

    status = data.get(
        "status",
        "draft"
    )

    if not title:

        return {
            "error":
                "Blog title is required"
        }

    if not content:

        return {
            "error":
                "Blog content is required"
        }

    if status not in [
        "draft",
        "pending",
        "published",
        "rejected"
    ]:

        return {
            "error":
                "Invalid blog status"
        }

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        cursor.close()
        conn.close()

        return {
            "error":
                "Admin access required"
        }

    cursor.execute(
        """
        SELECT id
        FROM blogs
        WHERE id = %s
        """,
        (blog_id,)
    )

    existing_blog = cursor.fetchone()

    if not existing_blog:

        cursor.close()
        conn.close()

        return {
            "error":
                "Blog not found"
        }

    published = (
        1
        if status == "published"
        else 0
    )

    cursor.execute(
        """
        UPDATE blogs
        SET
            title = %s,
            content = %s,
            category = %s,
            cover_image = %s,
            published = %s,
            status = %s
        WHERE id = %s
        """,
        (
            title,
            content,
            category,
            cover_image,
            published,
            status,
            blog_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog updated successfully",

        "blog_id":
            blog_id,

        "status":
            status
    }


# ============================================================
# ADMIN — DELETE BLOG
# ============================================================

@router.delete("/admin/{blog_id}")
def admin_delete_blog(
    blog_id: int,
    session_token: str = None
):

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        cursor.close()
        conn.close()

        return {
            "error":
                "Admin access required"
        }

    cursor.execute(
        """
        SELECT id
        FROM blogs
        WHERE id = %s
        """,
        (blog_id,)
    )

    existing_blog = cursor.fetchone()

    if not existing_blog:

        cursor.close()
        conn.close()

        return {
            "error":
                "Blog not found"
        }

    # Remove related likes
    cursor.execute(
        """
        DELETE FROM blog_likes
        WHERE blog_id = %s
        """,
        (blog_id,)
    )

    # Remove saved blog references
    cursor.execute(
        """
        DELETE FROM saved_blogs
        WHERE blog_id = %s
        """,
        (blog_id,)
    )

    # Delete blog
    cursor.execute(
        """
        DELETE FROM blogs
        WHERE id = %s
        """,
        (blog_id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog deleted successfully"
    }


# ============================================================
# ADMIN — APPROVE / PUBLISH BLOG
# ============================================================

@router.put("/{blog_id}/approve")
def approve_blog(
    blog_id: int,
    data: dict
):

    session_token = data.get(
        "session_token"
    )

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        cursor.close()
        conn.close()

        return {
            "error":
                "Admin access required"
        }

    cursor.execute(
        """
        UPDATE blogs
        SET
            status = 'published',
            published = 1,
            rejection_reason = NULL
        WHERE id = %s
        """,
        (blog_id,)
    )

    conn.commit()

    if cursor.rowcount == 0:

        cursor.close()
        conn.close()

        return {
            "error":
                "Blog not found"
        }

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog published successfully",

        "blog_id":
            blog_id,

        "status":
            "published"
    }


# ============================================================
# ADMIN — REJECT BLOG
# ============================================================

@router.put("/{blog_id}/reject")
def reject_blog(
    blog_id: int,
    data: dict
):

    session_token = data.get(
        "session_token"
    )

    reason = data.get(
        "reason"
    )

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        cursor.close()
        conn.close()

        return {
            "error":
                "Admin access required"
        }

    cursor.execute(
        """
        SELECT id
        FROM blogs
        WHERE id = %s
        """,
        (blog_id,)
    )

    blog = cursor.fetchone()

    if not blog:

        cursor.close()
        conn.close()

        return {
            "error":
                "Blog not found"
        }

    cursor.execute(
        """
        UPDATE blogs
        SET
            status = 'rejected',
            published = 0,
            rejection_reason = %s
        WHERE id = %s
        """,
        (
            reason,
            blog_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog rejected successfully",

        "blog_id":
            blog_id,

        "status":
            "rejected",

        "reason":
            reason
    }


# ============================================================
# GET PENDING BLOGS
# PUBLIC / EXISTING USER WORKFLOW
# ============================================================

@router.get("/pending")
def get_pending_blogs():

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT
            blogs.id,
            blogs.title,
            blogs.content,
            blogs.category,
            blogs.cover_image,
            blogs.author_id,
            users.username AS author,
            blogs.created_at,
            blogs.status,
            blogs.views
        FROM blogs
        JOIN users
            ON blogs.author_id = users.id
        WHERE blogs.status = 'pending'
        ORDER BY blogs.created_at DESC
        """
    )

    blogs = cursor.fetchall()

    cursor.close()
    conn.close()

    for blog in blogs:

        if blog.get("created_at"):

            blog["created_at"] = str(
                blog["created_at"]
            )

    return blogs

# ============================================================
# GET MY BLOGS — CURRENT LOGGED-IN USER
# ============================================================

@router.get("/my")
def get_my_blogs_current_user(
    session_token: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    try:

        # Find the user from the active login session
        cursor.execute(
            """
            SELECT
                u.id
            FROM user_sessions s
            JOIN users u
                ON s.user_id = u.id
            WHERE s.session_token = %s
            AND s.expires_at > NOW()
            LIMIT 1
            """,
            (session_token,)
        )

        user = cursor.fetchone()


        if not user:

            return {
                "error":
                    "Invalid or expired session."
            }


        user_id = user["id"]


        # Get ONLY this user's blogs
        cursor.execute(
            """
            SELECT
                blogs.id,
                blogs.title,
                blogs.content,
                blogs.category,
                blogs.cover_image,
                blogs.author_id,
                users.username AS author,
                blogs.published,
                blogs.created_at,
                blogs.status,
                blogs.rejection_reason,
                blogs.views
            FROM blogs
            JOIN users
                ON blogs.author_id = users.id
            WHERE blogs.author_id = %s
            ORDER BY blogs.created_at DESC
            """,
            (user_id,)
        )


        blogs = cursor.fetchall()


        for blog in blogs:

            if blog.get("created_at"):
                blog["created_at"] = str(
                    blog["created_at"]
                )


        return blogs


    except Exception as error:

        print(
            "Get current user blogs error:",
            error
        )

        return {
            "error":
                "Unable to load your blogs."
        }


    finally:

        cursor.close()
        conn.close()
# ============================================================
# GET MY BLOGS
# ============================================================

@router.get("/my/{author_id}")
def get_my_blogs(
    author_id: int
):

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT
            blogs.id,
            blogs.title,
            blogs.content,
            blogs.category,
            blogs.cover_image,
            blogs.author_id,
            users.username AS author,
            blogs.published,
            blogs.created_at,
            blogs.status,
            blogs.rejection_reason,
            blogs.views
        FROM blogs
        JOIN users
            ON blogs.author_id = users.id
        WHERE blogs.author_id = %s
        ORDER BY blogs.created_at DESC
        """,
        (author_id,)
    )

    blogs = cursor.fetchall()

    cursor.close()
    conn.close()

    for blog in blogs:

        if blog.get("created_at"):

            blog["created_at"] = str(
                blog["created_at"]
            )

    return blogs


# ============================================================
# GET MY SINGLE BLOG
#
# Allows the owner to read:
# - draft
# - pending
# - published
# - rejected
#
# The author_id check prevents users from reading another
# user's unpublished blog.
# ============================================================

@router.get("/my/{author_id}/{blog_id}")
def get_my_blog(
    author_id: int,
    blog_id: int
):

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    try:

        cursor.execute(
            """
            SELECT
                blogs.id,
                blogs.title,
                blogs.content,
                blogs.category,
                blogs.cover_image,
                blogs.author_id,
                users.username AS author,
                blogs.published,
                blogs.created_at,
                blogs.views,
                blogs.likes,
                blogs.status,
                blogs.rejection_reason
            FROM blogs
            JOIN users
                ON blogs.author_id = users.id
            WHERE blogs.id = %s
            AND blogs.author_id = %s
            """,
            (
                blog_id,
                author_id
            )
        )

        blog = cursor.fetchone()

        if not blog:

            return {
                "error":
                    "Blog not found."
            }

        if blog.get("created_at"):

            blog["created_at"] = str(
                blog["created_at"]
            )

        return blog

    finally:

        cursor.close()
        conn.close()


# ============================================================
# RESUBMIT BLOG
# ============================================================

@router.put("/{blog_id}/resubmit")
def resubmit_blog(
    blog_id: int,
    data: dict
):

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id, status
        FROM blogs
        WHERE id = %s
        """,
        (blog_id,)
    )

    blog = cursor.fetchone()

    if not blog:

        cursor.close()
        conn.close()

        return {
            "error":
                "Blog not found"
        }

    cursor.execute(
        """
        UPDATE blogs
        SET
            title = %s,
            content = %s,
            category = %s,
            status = 'pending',
            published = 0,
            rejection_reason = NULL
        WHERE id = %s
        """,
        (
            data.get("title"),
            data.get("content"),
            data.get("category"),
            blog_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog resubmitted successfully",

        "blog_id":
            blog_id,

        "status":
            "pending"
    }


# ============================================================
# GET SINGLE PUBLISHED BLOG
# PUBLIC
# ============================================================

@router.get("/{blog_id}")
def get_blog(
    blog_id: int
):

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    # --------------------------------------------------------
    # Increase views
    # --------------------------------------------------------

    cursor.execute(
        """
        UPDATE blogs
        SET views = views + 1
        WHERE id = %s
        AND published = 1
        AND status = 'published'
        """,
        (blog_id,)
    )

    conn.commit()

    # --------------------------------------------------------
    # Get blog
    # --------------------------------------------------------

    cursor.execute(
        """
        SELECT
            blogs.id,
            blogs.title,
            blogs.content,
            blogs.category,
            blogs.cover_image,
            blogs.author_id,
            users.username AS author,
            blogs.published,
            blogs.created_at,
            blogs.views,
            blogs.likes,
            blogs.status
        FROM blogs
        JOIN users
            ON blogs.author_id = users.id
        WHERE blogs.id = %s
        AND blogs.published = 1
        AND blogs.status = 'published'
        """,
        (blog_id,)
    )

    blog = cursor.fetchone()

    cursor.close()
    conn.close()

    if not blog:

        return {
            "error":
                "Blog not found"
        }

    if blog.get("created_at"):

        blog["created_at"] = str(
            blog["created_at"]
        )

    return blog


# ============================================================
# SAVE BLOG
# ============================================================

@router.post("/{blog_id}/save")
def save_blog(
    blog_id: int,
    data: dict
):

    user_id = data.get(
        "user_id"
    )

    if not user_id:

        return {
            "error":
                "User ID is required"
        }

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM saved_blogs
        WHERE user_id = %s
        AND blog_id = %s
        """,
        (
            user_id,
            blog_id
        )
    )

    existing = cursor.fetchone()

    if existing:

        cursor.close()
        conn.close()

        return {
            "message":
                "Blog already saved"
        }

    cursor.execute(
        """
        INSERT INTO saved_blogs
        (
            user_id,
            blog_id
        )
        VALUES
        (
            %s,
            %s
        )
        """,
        (
            user_id,
            blog_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog saved successfully",

        "blog_id":
            blog_id,

        "user_id":
            user_id
    }


# ============================================================
# LIKE BLOG
# ============================================================

@router.post("/{blog_id}/like")
def like_blog(
    blog_id: int,
    data: dict
):

    user_id = data.get(
        "user_id"
    )

    if not user_id:

        return {
            "error":
                "User ID is required"
        }

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM blog_likes
        WHERE user_id = %s
        AND blog_id = %s
        """,
        (
            user_id,
            blog_id
        )
    )

    existing_like = cursor.fetchone()

    if existing_like:

        cursor.close()
        conn.close()

        return {
            "error":
                "Blog already liked"
        }

    cursor.execute(
        """
        INSERT INTO blog_likes
        (
            user_id,
            blog_id
        )
        VALUES
        (
            %s,
            %s
        )
        """,
        (
            user_id,
            blog_id
        )
    )

    cursor.execute(
        """
        UPDATE blogs
        SET likes = likes + 1
        WHERE id = %s
        AND published = 1
        """,
        (blog_id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog liked"
    }


# ============================================================
# UNLIKE BLOG
# ============================================================

@router.delete("/{blog_id}/like")
def unlike_blog(
    blog_id: int,
    data: dict
):

    user_id = data.get(
        "user_id"
    )

    if not user_id:

        return {
            "error":
                "User ID is required"
        }

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM blog_likes
        WHERE user_id = %s
        AND blog_id = %s
        """,
        (
            user_id,
            blog_id
        )
    )

    if cursor.rowcount > 0:

        cursor.execute(
            """
            UPDATE blogs
            SET likes =
                GREATEST(
                    likes - 1,
                    0
                )
            WHERE id = %s
            AND published = 1
            """,
            (blog_id,)
        )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog unliked"
    }


# ============================================================
# CHECK IF USER LIKED BLOG
# ============================================================

@router.get("/{blog_id}/liked/{user_id}")
def check_if_liked(
    blog_id: int,
    user_id: int
):

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT id
        FROM blog_likes
        WHERE blog_id = %s
        AND user_id = %s
        """,
        (
            blog_id,
            user_id
        )
    )

    liked = (
        cursor.fetchone()
        is not None
    )

    cursor.close()
    conn.close()

    return {
        "liked":
            liked
    }


# ============================================================
# GET SAVED BLOGS
# ============================================================

@router.get("/saved/{user_id}")
def get_saved_blogs(
    user_id: int
):

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor(
        dictionary=True
    )

    cursor.execute(
        """
        SELECT
            blogs.id,
            blogs.title,
            blogs.content,
            blogs.category,
            blogs.cover_image,
            blogs.author_id,
            blogs.created_at,
            blogs.views,
            users.nickname AS author
        FROM saved_blogs
        JOIN blogs
            ON saved_blogs.blog_id = blogs.id
        LEFT JOIN users
            ON blogs.author_id = users.id
        WHERE saved_blogs.user_id = %s
        ORDER BY saved_blogs.saved_at DESC
        """,
        (user_id,)
    )

    saved_blogs = cursor.fetchall()

    cursor.close()
    conn.close()

    for blog in saved_blogs:

        if blog.get("created_at"):

            blog["created_at"] = str(
                blog["created_at"]
            )

    return saved_blogs


# ============================================================
# UNSAVE BLOG
# ============================================================

@router.delete("/{blog_id}/save")
def unsave_blog(
    blog_id: int,
    data: dict
):

    user_id = data.get(
        "user_id"
    )

    if not user_id:

        return {
            "error":
                "User ID is required"
        }

    conn = get_connection()

    if not conn:

        return {
            "error":
                "Database connection failed"
        }

    cursor = conn.cursor()

    cursor.execute(
        """
        DELETE FROM saved_blogs
        WHERE user_id = %s
        AND blog_id = %s
        """,
        (
            user_id,
            blog_id
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return {
        "message":
            "Blog removed from saved blogs"
    }