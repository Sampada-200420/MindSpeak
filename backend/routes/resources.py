from fastapi import APIRouter
from database import get_connection

router = APIRouter()


# ======================================================
# ADMIN AUTHENTICATION HELPER
# ======================================================

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

    if not admin or admin["role"] != "admin":
        return None

    return admin


# ======================================================
# GET ALL RESOURCES
# Public
# ======================================================

@router.get("/")
def get_resources(category: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        if category and category != "all":

            cursor.execute(
                """
                SELECT *
                FROM resources
                WHERE category = %s
                ORDER BY created_at DESC
                """,
                (category,)
            )

        else:

            cursor.execute(
                """
                SELECT *
                FROM resources
                ORDER BY created_at DESC
                """
            )

        resources = cursor.fetchall()

        for resource in resources:

            if resource.get("created_at"):
                resource["created_at"] = str(
                    resource["created_at"]
                )

        return {
            "resources": resources
        }

    except Exception as error:

        print(
            "Get resources error:",
            error
        )

        return {
            "error": "Unable to load resources."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET SINGLE RESOURCE
# Public
# ======================================================

@router.get("/{resource_id}")
def get_resource(resource_id: int):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT *
            FROM resources
            WHERE id = %s
            """,
            (resource_id,)
        )

        resource = cursor.fetchone()

        if not resource:

            return {
                "error": "Resource not found"
            }

        if resource.get("created_at"):

            resource["created_at"] = str(
                resource["created_at"]
            )

        return resource

    except Exception as error:

        print(
            "Get resource error:",
            error
        )

        return {
            "error": "Unable to load resource."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET HELPLINES
# Public
# ======================================================

@router.get("/helplines")
def get_helplines():

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT *
            FROM helplines
            """
        )

        helplines = cursor.fetchall()

        return {
            "helplines": helplines
        }

    except Exception as error:

        print(
            "Get helplines error:",
            error
        )

        return {
            "error": "Unable to load helplines."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# LOG RESOURCE VIEW / DOWNLOAD
# Public
# ======================================================

@router.post("/log")
def log_resource(data: dict):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            INSERT INTO resource_logs
            (
                resource_id,
                action,
                session_token
            )
            VALUES (%s, %s, %s)
            """,
            (
                data.get("resource_id"),
                data.get(
                    "action",
                    "view"
                ),
                data.get(
                    "session_token"
                )
            )
        )

        conn.commit()

        return {
            "message": "Logged"
        }

    except Exception as error:

        conn.rollback()

        print(
            "Log resource error:",
            error
        )

        return {
            "error": "Unable to log resource activity."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# ADD RESOURCE
# ADMIN ONLY
# ======================================================

@router.post("/add")
def add_resource(data: dict):

    session_token =  data.get("session_token")

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # VERIFY ADMIN
        admin = verify_admin(
            cursor,
            session_token
        )

        if not admin:

            return {
                "error": "Admin access required"
            }

        title =  data.get("title")

        description = data.get("description")

        category = data.get("category")

        file_url =  data.get("file_url")

        resource_type =  data.get("resource_type")


        if not title:

            return {
                "error": "Resource title is required."
            }

        if not description:

            return {
                "error": "Resource description is required."
            }

        if not category:

            return {
                "error": "Resource category is required."
            }

        if not file_url:

            return {
                "error": "Resource URL is required."
            }

        if not resource_type:

            return {
                "error": "Resource type is required."
            }


        # IMPORTANT:
        # created_by comes from the verified
        # admin session, NOT from the browser.

        cursor.execute(
            """
            INSERT INTO resources
            (
                title,
                description,
                category,
                file_url,
                resource_type,
                created_by
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                title,
                description,
                category,
                file_url,
                resource_type,
                admin["id"]
            )
        )

        conn.commit()

        return {
            "message":
                "Resource added successfully"
        }

    except Exception as error:

        conn.rollback()

        print(
            "Add resource error:",
            error
        )

        return {
            "error":
                "Unable to add resource."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# UPDATE RESOURCE
# ADMIN ONLY
# ======================================================

@router.put("/{resource_id}")
def update_resource(
    resource_id: int,
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

        # VERIFY ADMIN
        admin = verify_admin(
            cursor,
            session_token
        )

        if not admin:

            return {
                "error": "Admin access required"
            }


        title =  data.get("title")

        description = data.get("description")

        category = data.get("category")

        file_url = data.get("file_url")

        resource_type =  data.get("resource_type")


        if not title:

            return {
                "error": "Resource title is required."
            }

        if not description:

            return {
                "error": "Resource description is required."
            }

        if not category:

            return {
                "error": "Resource category is required."
            }

        if not file_url:

            return {
                "error": "Resource URL is required."
            }

        if not resource_type:

            return {
                "error": "Resource type is required."
            }


        # CHECK RESOURCE EXISTS

        cursor.execute(
            """
            SELECT id
            FROM resources
            WHERE id = %s
            """,
            (resource_id,)
        )

        resource = cursor.fetchone()

        if not resource:

            return {
                "error": "Resource not found"
            }


        cursor.execute(
            """
            UPDATE resources
            SET
                title = %s,
                description = %s,
                category = %s,
                file_url = %s,
                resource_type = %s
            WHERE id = %s
            """,
            (
                title,
                description,
                category,
                file_url,
                resource_type,
                resource_id
            )
        )

        conn.commit()

        return {
            "message":
                "Resource updated successfully"
        }

    except Exception as error:

        conn.rollback()

        print(
            "Update resource error:",
            error
        )

        return {
            "error":
                "Unable to update resource."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# DELETE RESOURCE
# ADMIN ONLY
# ======================================================

@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
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
        admin = verify_admin(
            cursor,
            session_token
        )

        if not admin:

            return {
                "error": "Admin access required"
            }


        # CHECK RESOURCE EXISTS

        cursor.execute(
            """
            SELECT id
            FROM resources
            WHERE id = %s
            """,
            (resource_id,)
        )

        resource = cursor.fetchone()

        if not resource:

            return {
                "error": "Resource not found"
            }


        cursor.execute(
            """
            DELETE FROM resources
            WHERE id = %s
            """,
            (resource_id,)
        )

        conn.commit()

        return {
            "message":
                "Resource deleted successfully"
        }

    except Exception as error:

        conn.rollback()

        print(
            "Delete resource error:",
            error
        )

        return {
            "error":
                "Unable to delete resource."
        }

    finally:

        cursor.close()
        conn.close()