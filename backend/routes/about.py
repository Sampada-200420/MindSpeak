from fastapi import APIRouter
from database import get_connection


router = APIRouter()


# ======================================================
# ABOUT TEAM MEMBERS
# ======================================================

@router.get("/team")
def get_team_members():

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
                name,
                role,
                image,
                description,
                display_order
            FROM about_team_members
            WHERE is_active = 1
            ORDER BY display_order ASC
            """
        )

        team_members = cursor.fetchall()

        return {
            "team_members": team_members
        }

    except Exception as error:

        print(
            "About team error:",
            error
        )

        return {
            "error": "Unable to load team members."
        }

    finally:

        cursor.close()
        conn.close()