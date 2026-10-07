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
# GET ALL ACTIVE TOOLKIT TOPICS
# ======================================================

@router.get("/topics")
def get_toolkit_topics():

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                slug,
                title,
                description,
                image,
                display_order
            FROM toolkit_topics
            WHERE is_active = 1
            ORDER BY display_order ASC
            """
        )

        topics = cursor.fetchall()

        return {
            "topics": topics,
            "count": len(topics)
        }

    except Exception as error:

        print(
            "Get toolkit topics error:",
            error
        )

        return {
            "error": "Unable to load toolkit topics."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET SINGLE TOOLKIT TOPIC
# ======================================================

@router.get("/topics/{topic_slug}")
def get_toolkit_topic(
    topic_slug: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                slug,
                title,
                description,
                image,
                display_order
            FROM toolkit_topics
            WHERE slug = %s
            AND is_active = 1
            LIMIT 1
            """,
            (topic_slug,)
        )

        topic = cursor.fetchone()

        if not topic:

            return {
                "error": "Toolkit topic not found."
            }

        return {
            "topic": topic
        }

    except Exception as error:

        print(
            "Get toolkit topic error:",
            error
        )

        return {
            "error": "Unable to load toolkit topic."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET CONTENT FOR A TOOLKIT TOPIC
# ======================================================

@router.get("/topics/{topic_slug}/content")
def get_toolkit_content(
    topic_slug: str
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                tt.id AS topic_id,
                tt.slug AS topic_slug,
                tt.title AS topic_title,

                tc.id,
                tc.slug,
                tc.title,
                tc.content_type,
                tc.short_description,
                tc.content,
                tc.display_order

            FROM toolkit_topics tt

            LEFT JOIN toolkit_content tc
                ON tc.topic_id = tt.id
                AND tc.is_active = 1

            WHERE tt.slug = %s
            AND tt.is_active = 1

            ORDER BY tc.display_order ASC
            """,
            (topic_slug,)
        )

        rows = cursor.fetchall()

        if not rows:

            return {
                "error": "Toolkit topic not found."
            }

        topic = {
            "id": rows[0]["topic_id"],
            "slug": rows[0]["topic_slug"],
            "title": rows[0]["topic_title"]
        }

        content = []

        for row in rows:

            if row["id"] is not None:

                content.append({
                    "id": row["id"],
                    "slug": row["slug"],
                    "title": row["title"],
                    "content_type": row["content_type"],
                    "short_description": row["short_description"],
                    "content": row["content"],
                    "display_order": row["display_order"]
                })

        return {
            "topic": topic,
            "content": content,
            "count": len(content)
        }

    except Exception as error:

        print(
            "Get toolkit content error:",
            error
        )

        return {
            "error": "Unable to load toolkit content."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET QUICK TOOLS
# ======================================================

@router.get("/quick-tools")
def get_quick_tools():

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                slug,
                title,
                description,
                instructions,
                estimated_minutes,
                display_order
            FROM toolkit_quick_tools
            WHERE is_active = 1
            ORDER BY display_order ASC
            """
        )

        tools = cursor.fetchall()

        return {
            "tools": tools,
            "count": len(tools)
        }

    except Exception as error:

        print(
            "Get quick tools error:",
            error
        )

        return {
            "error": "Unable to load quick tools."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET SUPPORT-OTHERS MODULES
# ======================================================

@router.get("/support-others")
def get_support_others_modules():

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                slug,
                title,
                description,
                content,
                display_order
            FROM toolkit_support_modules
            WHERE is_active = 1
            ORDER BY display_order ASC
            """
        )

        modules = cursor.fetchall()

        return {
            "modules": modules,
            "count": len(modules)
        }

    except Exception as error:

        print(
            "Get support others modules error:",
            error
        )

        return {
            "error": "Unable to load support modules."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MENTOR TRAINING MODULES
# ======================================================

@router.get("/mentor-training")
def get_mentor_training_modules():

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                module_number,
                slug,
                title,
                description,
                content,
                display_order
            FROM mentor_training_modules
            WHERE is_active = 1
            ORDER BY display_order ASC
            """
        )

        modules = cursor.fetchall()

        return {
            "modules": modules,
            "count": len(modules)
        }

    except Exception as error:

        print(
            "Get mentor training modules error:",
            error
        )

        return {
            "error": "Unable to load mentor training modules."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET CURRENT USER'S MENTOR TRAINING PROGRESS
# ======================================================

@router.get("/mentor-training/progress")
def get_mentor_training_progress(
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
                mtp.id,
                mtp.user_id,
                mtp.module_id,
                mtp.status,
                mtp.score,
                mtp.completed_at,
                mtp.updated_at,

                mtm.module_number,
                mtm.slug,
                mtm.title

            FROM mentor_training_progress mtp

            JOIN mentor_training_modules mtm
                ON mtp.module_id = mtm.id

            WHERE mtp.user_id = %s

            ORDER BY mtm.display_order ASC
            """,
            (user_id,)
        )

        progress = cursor.fetchall()

        return {
            "progress": progress,
            "count": len(progress)
        }

    except Exception as error:

        print(
            "Get mentor training progress error:",
            error
        )

        return {
            "error": "Unable to load mentor training progress."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# SAVE / UPDATE MENTOR TRAINING PROGRESS
# ======================================================

@router.put("/mentor-training/progress")
def update_mentor_training_progress(
    data: dict
):

    session_token = data.get("session_token")
    module_id = data.get("module_id")
    status = data.get("status")
    score = data.get("score")

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
        # VALIDATE MODULE
        # --------------------------------------------------

        if not module_id:

            return {
                "error": "Module is required."
            }

        try:
            module_id = int(module_id)
        except (TypeError, ValueError):

            return {
                "error": "Invalid module."
            }


        cursor.execute(
            """
            SELECT id
            FROM mentor_training_modules
            WHERE id = %s
            AND is_active = 1
            LIMIT 1
            """,
            (module_id,)
        )

        module = cursor.fetchone()

        if not module:

            return {
                "error": "Training module not found."
            }


        # --------------------------------------------------
        # VALIDATE STATUS
        # --------------------------------------------------

        if status not in [
            "started",
            "completed"
        ]:

            return {
                "error": "Invalid training status."
            }


        # --------------------------------------------------
        # VALIDATE SCORE
        # --------------------------------------------------

        if score is not None:

            try:
                score = int(score)
            except (TypeError, ValueError):

                return {
                    "error": "Invalid score."
                }

            if score < 0 or score > 100:

                return {
                    "error": "Score must be between 0 and 100."
                }


        # --------------------------------------------------
        # CHECK EXISTING PROGRESS
        # --------------------------------------------------

        cursor.execute(
            """
            SELECT id
            FROM mentor_training_progress
            WHERE user_id = %s
            AND module_id = %s
            LIMIT 1
            """,
            (
                user_id,
                module_id
            )
        )

        existing = cursor.fetchone()


        # --------------------------------------------------
        # UPDATE
        # --------------------------------------------------

        if existing:

            if status == "completed":

                cursor.execute(
                    """
                    UPDATE mentor_training_progress
                    SET
                        status = %s,
                        score = %s,
                        completed_at = CURRENT_TIMESTAMP
                    WHERE user_id = %s
                    AND module_id = %s
                    """,
                    (
                        status,
                        score,
                        user_id,
                        module_id
                    )
                )

            else:

                cursor.execute(
                    """
                    UPDATE mentor_training_progress
                    SET
                        status = %s,
                        score = %s
                    WHERE user_id = %s
                    AND module_id = %s
                    """,
                    (
                        status,
                        score,
                        user_id,
                        module_id
                    )
                )


        # --------------------------------------------------
        # CREATE
        # --------------------------------------------------

        else:

            if status == "completed":

                cursor.execute(
                    """
                    INSERT INTO mentor_training_progress
                    (
                        user_id,
                        module_id,
                        status,
                        score,
                        completed_at
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
                        module_id,
                        status,
                        score
                    )
                )

            else:

                cursor.execute(
                    """
                    INSERT INTO mentor_training_progress
                    (
                        user_id,
                        module_id,
                        status,
                        score
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
                        module_id,
                        status,
                        score
                    )
                )


        conn.commit()


        return {
            "message": "Training progress saved successfully.",
            "status": status,
            "module_id": module_id
        }


    except Exception as error:

        conn.rollback()

        print(
            "Update mentor training progress error:",
            error
        )

        return {
            "error": "Unable to save training progress."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET CHECK-IN QUESTIONS
# ======================================================

@router.get("/checkin")
def get_toolkit_checkin():

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed."
        }

    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute(
            """
            SELECT
                id,
                question,
                question_type,
                display_order
            FROM toolkit_checkin_questions
            WHERE is_active = 1
            ORDER BY display_order ASC
            """
        )

        questions = cursor.fetchall()


        for question in questions:

            cursor.execute(
                """
                SELECT
                    o.id,
                    o.option_text,
                    o.recommended_topic_id,
                    t.slug AS recommended_topic_slug,
                    t.title AS recommended_topic_title,
                    o.display_order

                FROM toolkit_checkin_options o

                LEFT JOIN toolkit_topics t
                    ON o.recommended_topic_id = t.id

                WHERE o.question_id = %s

                ORDER BY o.display_order ASC
                """,
                (question["id"],)
            )

            question["options"] = cursor.fetchall()


        return {
            "questions": questions,
            "count": len(questions)
        }


    except Exception as error:

        print(
            "Get toolkit check-in error:",
            error
        )

        return {
            "error": "Unable to load toolkit check-in."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# SUBMIT CHECK-IN
# ======================================================

@router.post("/checkin")
def submit_toolkit_checkin(
    data: dict
):

    session_token = data.get("session_token")
    option_ids = data.get("option_ids", [])


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
        # VALIDATE OPTIONS
        # --------------------------------------------------

        if not isinstance(option_ids, list):

            return {
                "error": "option_ids must be a list."
            }


        if len(option_ids) == 0:

            return {
                "error": "Please select at least one option."
            }


        recommendations = {}


        # --------------------------------------------------
        # PROCESS SELECTED OPTIONS
        # --------------------------------------------------

        for option_id in option_ids:

            try:
                option_id = int(option_id)
            except (TypeError, ValueError):

                continue


            cursor.execute(
                """
                SELECT
                    id,
                    question_id,
                    recommended_topic_id
                FROM toolkit_checkin_options
                WHERE id = %s
                LIMIT 1
                """,
                (option_id,)
            )

            option = cursor.fetchone()

            if not option:

                continue


            # --------------------------------------------------
            # SAVE USER CHECK-IN
            # --------------------------------------------------

            cursor.execute(
                """
                INSERT INTO toolkit_checkins
                (
                    user_id,
                    question_id,
                    option_id
                )
                VALUES
                (
                    %s,
                    %s,
                    %s
                )
                """,
                (
                    user_id,
                    option["question_id"],
                    option["id"]
                )
            )


            # --------------------------------------------------
            # BUILD RECOMMENDATIONS
            # --------------------------------------------------

            topic_id = option["recommended_topic_id"]

            if topic_id:

                recommendations[topic_id] = (
                    recommendations.get(topic_id, 0) + 1
                )


        if not recommendations:

            conn.rollback()

            return {
                "error": "No valid toolkit recommendation could be found."
            }


        # --------------------------------------------------
        # FIND HIGHEST MATCH
        # --------------------------------------------------

        recommended_topic_id = max(
            recommendations,
            key=recommendations.get
        )


        cursor.execute(
            """
            SELECT
                id,
                slug,
                title,
                description,
                image
            FROM toolkit_topics
            WHERE id = %s
            AND is_active = 1
            LIMIT 1
            """,
            (recommended_topic_id,)
        )

        recommended_topic = cursor.fetchone()


        conn.commit()


        return {
            "message": "Check-in completed successfully.",
            "recommended_topic": recommended_topic
        }


    except Exception as error:

        conn.rollback()

        print(
            "Submit toolkit check-in error:",
            error
        )

        return {
            "error": "Unable to submit toolkit check-in."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# SAVE TOOLKIT PROGRESS
# ======================================================

@router.put("/progress")
def save_toolkit_progress(
    data: dict
):

    session_token = data.get("session_token")
    topic_id = data.get("topic_id")
    content_id = data.get("content_id")
    status = data.get("status", "started")


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
        # VALIDATE TOPIC
        # --------------------------------------------------

        if not topic_id:

            return {
                "error": "Toolkit topic is required."
            }

        try:
            topic_id = int(topic_id)
        except (TypeError, ValueError):

            return {
                "error": "Invalid toolkit topic."
            }


        cursor.execute(
            """
            SELECT id
            FROM toolkit_topics
            WHERE id = %s
            AND is_active = 1
            LIMIT 1
            """,
            (topic_id,)
        )

        topic = cursor.fetchone()

        if not topic:

            return {
                "error": "Toolkit topic not found."
            }


        # --------------------------------------------------
        # VALIDATE STATUS
        # --------------------------------------------------

        if status not in [
            "started",
            "completed"
        ]:

            return {
                "error": "Invalid progress status."
            }


        # --------------------------------------------------
        # CONTENT VALIDATION
        # --------------------------------------------------

        if content_id is not None:

            try:
                content_id = int(content_id)
            except (TypeError, ValueError):

                return {
                    "error": "Invalid content."
                }


            cursor.execute(
                """
                SELECT id
                FROM toolkit_content
                WHERE id = %s
                AND topic_id = %s
                AND is_active = 1
                LIMIT 1
                """,
                (
                    content_id,
                    topic_id
                )
            )

            content = cursor.fetchone()

            if not content:

                return {
                    "error": "Toolkit content not found."
                }


        # --------------------------------------------------
        # SAVE PROGRESS
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT INTO toolkit_progress
            (
                user_id,
                topic_id,
                content_id,
                status,
                started_at,
                completed_at
            )
            VALUES
            (
                %s,
                %s,
                %s,
                %s,
                CURRENT_TIMESTAMP,
                %s
            )
            """,
            (
                user_id,
                topic_id,
                content_id,
                status,
                None if status == "started"
                else __import__("datetime").datetime.now()
            )
        )


        conn.commit()


        return {
            "message": "Toolkit progress saved successfully.",
            "status": status
        }


    except Exception as error:

        conn.rollback()

        print(
            "Save toolkit progress error:",
            error
        )

        return {
            "error": "Unable to save toolkit progress."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# SAVE TOOLKIT REFLECTION
# ======================================================

@router.post("/reflection")
def save_toolkit_reflection(
    data: dict
):

    session_token = data.get("session_token")
    topic_id = data.get("topic_id")
    content_id = data.get("content_id")
    response = data.get("response")
    reflection_text = data.get("reflection_text")


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
        # VALIDATE TOPIC
        # --------------------------------------------------

        if not topic_id:

            return {
                "error": "Toolkit topic is required."
            }

        try:
            topic_id = int(topic_id)
        except (TypeError, ValueError):

            return {
                "error": "Invalid toolkit topic."
            }


        # --------------------------------------------------
        # VALIDATE RESPONSE
        # --------------------------------------------------

        if response not in [
            "better",
            "same",
            "worse"
        ]:

            return {
                "error": "Invalid reflection response."
            }


        # --------------------------------------------------
        # VALIDATE REFLECTION TEXT
        # --------------------------------------------------

        if reflection_text:

            reflection_text = str(
                reflection_text
            ).strip()

            if len(reflection_text) > 2000:

                return {
                    "error": "Reflection must be 2000 characters or less."
                }


        # --------------------------------------------------
        # CONTENT VALIDATION
        # --------------------------------------------------

        if content_id is not None:

            try:
                content_id = int(content_id)
            except (TypeError, ValueError):

                return {
                    "error": "Invalid content."
                }


        # --------------------------------------------------
        # SAVE REFLECTION
        # --------------------------------------------------

        cursor.execute(
            """
            INSERT INTO toolkit_reflections
            (
                user_id,
                topic_id,
                content_id,
                response,
                reflection_text
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
                user_id,
                topic_id,
                content_id,
                response,
                reflection_text
            )
        )

        reflection_id = cursor.lastrowid

        conn.commit()


        return {
            "message": "Reflection saved successfully.",
            "reflection_id": reflection_id
        }


    except Exception as error:

        conn.rollback()

        print(
            "Save toolkit reflection error:",
            error
        )

        return {
            "error": "Unable to save reflection."
        }

    finally:

        cursor.close()
        conn.close()


# ======================================================
# GET MY TOOLKIT PROGRESS
# ======================================================

@router.get("/progress")
def get_toolkit_progress(
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
                tp.id,
                tp.user_id,
                tp.topic_id,
                tp.content_id,
                tp.status,
                tp.started_at,
                tp.completed_at,
                tp.updated_at,

                tt.slug AS topic_slug,
                tt.title AS topic_title,

                tc.title AS content_title,
                tc.content_type

            FROM toolkit_progress tp

            JOIN toolkit_topics tt
                ON tp.topic_id = tt.id

            LEFT JOIN toolkit_content tc
                ON tp.content_id = tc.id

            WHERE tp.user_id = %s

            ORDER BY tp.updated_at DESC
            """,
            (user_id,)
        )

        progress = cursor.fetchall()


        return {
            "progress": progress,
            "count": len(progress)
        }


    except Exception as error:

        print(
            "Get toolkit progress error:",
            error
        )

        return {
            "error": "Unable to load toolkit progress."
        }

    finally:

        cursor.close()
        conn.close()