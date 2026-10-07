# ============================================================
# MINDSPEAK EVENTS ROUTES
# Handles public events, registrations and admin management
# ============================================================

from fastapi import APIRouter
from database import get_connection

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
# GET ALL UPCOMING EVENTS
# PUBLIC
# ============================================================

@router.get("/")
def get_events(category: str = None):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    if category and category != "all":

        cursor.execute(
            """
            SELECT *
            FROM events
            WHERE category = %s
            AND event_date >= NOW()
            ORDER BY event_date ASC
            """,
            (category,)
        )

    else:

        cursor.execute(
            """
            SELECT *
            FROM events
            WHERE event_date >= NOW()
            ORDER BY event_date ASC
            """
        )

    events = cursor.fetchall()

    conn.close()

    for event in events:

        if event.get("event_date"):
            event["event_date"] = str(
                event["event_date"]
            )

        if event.get("created_at"):
            event["created_at"] = str(
                event["created_at"]
            )

    return {
        "events": events
    }


# ============================================================
# GET FEATURED / NEXT EVENT
# PUBLIC
# ============================================================

@router.get("/featured")
def get_featured_event():

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM events
        WHERE event_date >= NOW()
        ORDER BY event_date ASC
        LIMIT 1
        """
    )

    event = cursor.fetchone()

    conn.close()

    if not event:
        return {
            "event": None
        }

    if event.get("event_date"):
        event["event_date"] = str(
            event["event_date"]
        )

    if event.get("created_at"):
        event["created_at"] = str(
            event["created_at"]
        )

    return {
        "event": event
    }


# ============================================================
# ADMIN — GET ALL EVENTS
# Includes past events and registration counts
# ============================================================

@router.get("/admin/all")
def admin_get_all_events(
    session_token: str = None
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        conn.close()

        return {
            "error": "Admin access required"
        }

    cursor.execute(
        """
        SELECT
            e.*,
            COUNT(er.id) AS registration_count
        FROM events e
        LEFT JOIN event_registrations er
            ON e.id = er.event_id
        GROUP BY e.id
        ORDER BY e.event_date DESC
        """
    )

    events = cursor.fetchall()

    conn.close()

    for event in events:

        if event.get("event_date"):
            event["event_date"] = str(
                event["event_date"]
            )

        if event.get("created_at"):
            event["created_at"] = str(
                event["created_at"]
            )

    return {
        "events": events
    }


# ============================================================
# ADMIN — CREATE EVENT
# ============================================================

@router.post("/admin/create")
def admin_create_event(data: dict):

    session_token = data.get(
        "session_token"
    )

    title = data.get(
        "title"
    )

    description = data.get(
        "description"
    )

    category = data.get(
        "category"
    )

    event_date = data.get(
        "event_date"
    )

    location = data.get(
        "location"
    )

    image = data.get(
        "image"
    )

    if not title:

        return {
            "error": "Event title is required"
        }

    if not event_date:

        return {
            "error": "Event date is required"
        }

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        conn.close()

        return {
            "error": "Admin access required"
        }

    cursor.execute(
        """
        INSERT INTO events
        (
            title,
            description,
            category,
            event_date,
            location,
            image
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
            title,
            description,
            category,
            event_date,
            location,
            image
        )
    )

    conn.commit()

    event_id = cursor.lastrowid

    conn.close()

    return {
        "message": "Event created successfully",
        "event_id": event_id
    }


# ============================================================
# ADMIN — UPDATE EVENT
# ============================================================

@router.put("/admin/{event_id}")
def admin_update_event(
    event_id: int,
    data: dict
):

    session_token = data.get(
        "session_token"
    )

    title = data.get(
        "title"
    )

    description = data.get(
        "description"
    )

    category = data.get(
        "category"
    )

    event_date = data.get(
        "event_date"
    )

    location = data.get(
        "location"
    )

    image = data.get(
        "image"
    )

    if not title:

        return {
            "error": "Event title is required"
        }

    if not event_date:

        return {
            "error": "Event date is required"
        }

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        conn.close()

        return {
            "error": "Admin access required"
        }

    cursor.execute(
        """
        SELECT id
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )

    existing_event = cursor.fetchone()

    if not existing_event:

        conn.close()

        return {
            "error": "Event not found"
        }

    cursor.execute(
        """
        UPDATE events
        SET
            title = %s,
            description = %s,
            category = %s,
            event_date = %s,
            location = %s,
            image = %s
        WHERE id = %s
        """,
        (
            title,
            description,
            category,
            event_date,
            location,
            image,
            event_id
        )
    )

    conn.commit()

    conn.close()

    return {
        "message": "Event updated successfully"
    }


# ============================================================
# ADMIN — DELETE EVENT
# ============================================================

@router.delete("/admin/{event_id}")
def admin_delete_event(
    event_id: int,
    session_token: str = None
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        conn.close()

        return {
            "error": "Admin access required"
        }

    cursor.execute(
        """
        SELECT id
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )

    existing_event = cursor.fetchone()

    if not existing_event:

        conn.close()

        return {
            "error": "Event not found"
        }

    # Delete registrations first
    cursor.execute(
        """
        DELETE FROM event_registrations
        WHERE event_id = %s
        """,
        (event_id,)
    )

    # Delete event
    cursor.execute(
        """
        DELETE FROM events
        WHERE id = %s
        """,
        (event_id,)
    )

    conn.commit()

    conn.close()

    return {
        "message": "Event deleted successfully"
    }


# ============================================================
# ADMIN — GET EVENT REGISTRATIONS
# ============================================================

@router.get("/admin/{event_id}/registrations")
def admin_get_event_registrations(
    event_id: int,
    session_token: str = None
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    admin = verify_admin(
        cursor,
        session_token
    )

    if not admin:

        conn.close()

        return {
            "error": "Admin access required"
        }

    cursor.execute(
        """
        SELECT
            id,
            event_id,
            user_id,
            full_name,
            email,
            phone,
            address,
            college,
            course,
            semester,
            registered_at
        FROM event_registrations
        WHERE event_id = %s
        ORDER BY registered_at DESC
        """,
        (event_id,)
    )

    registrations = cursor.fetchall()

    conn.close()

    for registration in registrations:

        if registration.get(
            "registered_at"
        ):

            registration[
                "registered_at"
            ] = str(
                registration[
                    "registered_at"
                ]
            )

    return {
        "registrations": registrations
    }


# ============================================================
# GET MY REGISTERED EVENTS
# PUBLIC / LOGGED-IN USER
# ============================================================

@router.get("/registered/{user_id}")
def get_registered_events(
    user_id: int
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT
            e.id,
            e.title,
            e.description,
            e.category,
            e.event_date,
            e.location,
            e.image,
            er.full_name,
            er.email,
            er.phone,
            er.address,
            er.college,
            er.course,
            er.semester,
            er.registered_at
        FROM event_registrations er
        JOIN events e
            ON er.event_id = e.id
        WHERE er.user_id = %s
        ORDER BY e.event_date ASC
        """,
        (user_id,)
    )

    events = cursor.fetchall()

    conn.close()

    for event in events:

        if event.get("event_date"):

            event["event_date"] = str(
                event["event_date"]
            )

        if event.get("registered_at"):

            event["registered_at"] = str(
                event["registered_at"]
            )

    return {
        "events": events
    }


# ============================================================
# GET SINGLE EVENT
# PUBLIC
# ============================================================

@router.get("/{event_id}")
def get_event(
    event_id: int
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        """
        SELECT *
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )

    event = cursor.fetchone()

    conn.close()

    if not event:

        return {
            "error": "Event not found"
        }

    if event.get("event_date"):

        event["event_date"] = str(
            event["event_date"]
        )

    if event.get("created_at"):

        event["created_at"] = str(
            event["created_at"]
        )

    return event


# ============================================================
# REGISTER FOR EVENT
# PUBLIC / LOGGED-IN USER
# ============================================================

@router.post("/{event_id}/register")
def register_for_event(
    event_id: int,
    data: dict
):

    conn = get_connection()

    if not conn:

        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    user_id = data.get(
        "user_id"
    )

    full_name = data.get(
        "full_name"
    )

    email = data.get(
        "email"
    )

    phone = data.get(
        "phone"
    )

    address = data.get(
        "address"
    )

    college = data.get(
        "college"
    )

    course = data.get(
        "course"
    )

    semester = data.get(
        "semester"
    )

    if not user_id:

        conn.close()

        return {
            "error": "User ID is required"
        }

    if (
        not full_name
        or not email
        or not phone
    ):

        conn.close()

        return {
            "error": "Name, email and phone are required"
        }

    cursor.execute(
        """
        SELECT id
        FROM events
        WHERE id = %s
        """,
        (event_id,)
    )

    event = cursor.fetchone()

    if not event:

        conn.close()

        return {
            "error": "Event not found"
        }

    cursor.execute(
        """
        SELECT id
        FROM event_registrations
        WHERE event_id = %s
        AND user_id = %s
        """,
        (
            event_id,
            user_id
        )
    )

    existing_registration = cursor.fetchone()

    if existing_registration:

        conn.close()

        return {
            "error": "Already registered for this event"
        }

    cursor.execute(
        """
        INSERT INTO event_registrations
        (
            event_id,
            user_id,
            full_name,
            email,
            phone,
            address,
            college,
            course,
            semester,
            registered_at
        )
        VALUES
        (
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            %s,
            NOW()
        )
        """,
        (
            event_id,
            user_id,
            full_name,
            email,
            phone,
            address,
            college,
            course,
            semester
        )
    )

    conn.commit()

    conn.close()

    return {
        "message": "Successfully registered for the event"
    }