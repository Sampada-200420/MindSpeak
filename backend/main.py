# main.py

from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from routes import auth, resources, posts, chat, blogs, events, mentor, admin
from routes import auth, resources, posts, chat, blogs, events, mentor, admin, journal, about, connection, toolkit, contact, contact_applications,muna


app = FastAPI(title="MindSpeak API")


# ======================================================
# FRONTEND
# ======================================================

app.mount(
    "/frontend",
    StaticFiles(directory="../frontend", html=True),
    name="frontend"
)


# ======================================================
# CORS
# ======================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ======================================================
# AUTH ROUTES
# ======================================================

app.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)


# ======================================================
# RESOURCES + HELPLINES
# ======================================================

app.include_router(
    resources.router,
    prefix="/resources",
    tags=["Resources"]
)


# ======================================================
# POSTS / ANONYMOUS WALL
# ======================================================

app.include_router(
    posts.router,
    prefix="/posts",
    tags=["Posts"]
)


# ======================================================
# BLOGS
# ======================================================

app.include_router(
    blogs.router,
    prefix="/blogs",
    tags=["Blogs"]
)


# ======================================================
# EVENTS
# ======================================================

app.include_router(
    events.router,
    prefix="/events",
    tags=["Events"]
)

# ======================================================
# MENTOR SYSTEM
# ======================================================

app.include_router(
    mentor.router,
    prefix="/mentor",
    tags=["Mentor"]
)

# ======================================================
# JOURNAL SYSTEM
# ======================================================

app.include_router(
    journal.router,
    prefix="/journal",
    tags=["Journal"]
)

# ======================================================
# ABOUT SYSTEM
# ======================================================

app.include_router(
    about.router,
    prefix="/about",
    tags=["About"]
)

app.include_router(
    connection.router,
    prefix="/connection",
    tags=["Connection"]
)

# ======================================================
# TOOLKIT SYSTEM
# ======================================================

app.include_router(
    toolkit.router,
    prefix="/toolkit",
    tags=["Toolkit"]
)

# ======================================================
# CONTACT SYSTEM
# ======================================================

app.include_router(
    contact.router,
    tags=["Contact"]
)

app.include_router(
    contact_applications.router
)
# ======================================================
# ADMIN SYSTEM
# ======================================================

app.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"]
)

app.include_router(
    muna.router,
    prefix="/muna",
    tags=["Muna"]
)
# ======================================================
# MOOD LOGGING
# ======================================================

@app.post("/analytics/log-mood")
def log_mood(data: dict):

    from database import get_connection

    conn = get_connection()

    if not conn:
        return {
            "error": "failed"
        }

    cursor = conn.cursor()

    cursor.execute(
        """
        INSERT INTO mood_logs
        (mood, session_token)
        VALUES (%s, %s)
        """,
        (
            data.get("mood"),
            data.get("session_token")
        )
    )

    conn.commit()
    conn.close()

    return {
        "message": "logged"
    }


# ======================================================
# ADMIN DASHBOARD STATISTICS
# ======================================================

@app.get("/admin/stats")
def get_admin_stats(session_token: str = None):

    from database import get_connection

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # ==============================================
        # VERIFY ADMIN SESSION
        # ==============================================

        cursor.execute(
            """
            SELECT u.role
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

            return {
                "error": "Admin access required"
            }


        # ==============================================
        # TOTAL USERS
        # Excludes admin accounts
        # ==============================================

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM users
            WHERE role != 'admin'
            """
        )

        total_users = cursor.fetchone()["total"]


        # ==============================================
        # TOTAL COMMUNITY POSTS
        # ==============================================

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM posts
            """
        )

        total_posts = cursor.fetchone()["total"]


        # ==============================================
        # PENDING POSTS
        # ==============================================

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM posts
            WHERE status = 'pending'
            """
        )

        pending_posts = cursor.fetchone()["total"]


        # ==============================================
        # TOTAL EVENTS
        # ==============================================

        cursor.execute(
            """
            SELECT COUNT(*) AS total
            FROM events
            """
        )

        total_events = cursor.fetchone()["total"]


        # ==============================================
        # RETURN STATISTICS
        # ==============================================

        return {
            "total_users": total_users,
            "total_posts": total_posts,
            "pending_posts": pending_posts,
            "total_events": total_events
        }


    except Exception as error:

        print(
            "Admin stats error:",
            error
        )

        return {
            "error": "Unable to load dashboard statistics."
        }


    finally:

        cursor.close()
        conn.close()


# ======================================================
# API HOME
# ======================================================

@app.get("/")
def home():

    return {
        "message": "MindSpeak API is running!"
    }
# ======================================================
# MOOD ANALYTICS
# ======================================================
@app.get("/analytics/moods")
def get_mood_analytics(session_token: str = None):

    print("ANALYTICS TOKEN:", session_token)

    from database import get_connection
    from datetime import datetime, timedelta

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        # =========================================================
        # 1. FIND USER FROM CURRENT SESSION
        # =========================================================

        cursor.execute(
            """
            SELECT user_id
            FROM user_sessions
            WHERE session_token = %s
            AND expires_at > NOW()
            """,
            (session_token,)
        )

        session = cursor.fetchone()

        if not session:
            return {
                "error": "Invalid or expired session."
            }

        user_id = session["user_id"]


        # =========================================================
        # 2. GET THIS USER'S MOOD HISTORY
        # =========================================================

        cursor.execute(
            """
            SELECT
                ml.mood,
                ml.logged_at
            FROM mood_logs ml
            JOIN user_sessions us
                ON ml.session_token = us.session_token
            WHERE us.user_id = %s
            ORDER BY ml.logged_at ASC
            """,
            (user_id,)
        )

        moods = cursor.fetchall()


        # =========================================================
        # 3. CURRENT DATE/TIME
        # =========================================================

        now = datetime.now()

        today = now.date()


        # =========================================================
        # 4. CREATE PERIOD DATES
        # =========================================================

        weekly_start = today - timedelta(days=6)
        monthly_start = today - timedelta(days=29)


        # =========================================================
        # 5. SEPARATE MOODS INTO 7-DAY AND 30-DAY PERIODS
        # =========================================================

        weekly_moods = []
        monthly_moods = []

        for item in moods:

            logged_at = item["logged_at"]

            logged_date = logged_at.date()

            if weekly_start <= logged_date <= today:
                weekly_moods.append(item)

            if monthly_start <= logged_date <= today:
                monthly_moods.append(item)


        # =========================================================
        # 6. MOOD COUNTS
        # =========================================================

        def calculate_counts(mood_list):

            counts = {}

            for item in mood_list:

                mood = item["mood"]

                if mood not in counts:
                    counts[mood] = 0

                counts[mood] += 1

            return counts


        # =========================================================
        # 7. MOST COMMON MOOD
        # =========================================================

        def find_most_common_mood(counts):

            if not counts:
                return None

            return max(
                counts,
                key=counts.get
            )


        # =========================================================
        # 8. MOOD PERCENTAGES
        # =========================================================

        def calculate_percentages(counts, total):

            percentages = {}

            if total == 0:
                return percentages

            for mood, count in counts.items():

                percentages[mood] = round(
                    (count / total) * 100,
                    1
                )

            return percentages


        # =========================================================
        # 9. GET LATEST MOOD
        # =========================================================

        def get_latest_mood(mood_list):

            if not mood_list:
                return None

            latest = max(
                mood_list,
                key=lambda item: item["logged_at"]
            )

            return latest["mood"]


        # =========================================================
        # 10. CREATE DAYS
        #
        # One entry for every calendar day.
        #
        # If the user checked in multiple times on one day,
        # the latest mood becomes the day's displayed mood.
        # =========================================================

        def create_days(mood_list, start_date, number_of_days):

            days = []

            mood_by_date = {}

            for item in mood_list:

                date_value = item["logged_at"].date()

                if date_value not in mood_by_date:
                    mood_by_date[date_value] = []

                mood_by_date[date_value].append(item)


            for i in range(number_of_days):

                current_date = start_date + timedelta(days=i)

                day_entries = mood_by_date.get(
                    current_date,
                    []
                )

                # Latest mood of that day
                latest_mood = None

                if day_entries:

                    latest_entry = max(
                        day_entries,
                        key=lambda item: item["logged_at"]
                    )

                    latest_mood = latest_entry["mood"]


                days.append({

                    "date": current_date.strftime("%Y-%m-%d"),

                    "day": current_date.strftime("%A"),

                    "short_day": current_date.strftime("%a"),

                    "mood": latest_mood,

                    "check_ins": len(day_entries)

                })

            return days


        # =========================================================
        # 11. CREATE MOOD TIMELINE
        #
        # This contains EVERY actual check-in.
        # It will be used for the Mood Pattern Chart.
        # =========================================================

        def create_timeline(mood_list):

            timeline = []

            for item in mood_list:

                logged_at = item["logged_at"]

                timeline.append({

                    "date": logged_at.strftime("%Y-%m-%d"),

                    "time": logged_at.strftime("%H:%M"),

                    "day": logged_at.strftime("%A"),

                    "mood": item["mood"]

                })

            return timeline


        # =========================================================
        # 12. REFLECTION
        # =========================================================

        def create_reflection(mood_list, start_date, number_of_days):

            if not mood_list:

                return {

                    "what_changed":
                        "There are not enough check-ins yet to identify a change.",

                    "what_we_noticed":
                        "You haven't recorded enough moods during this period for a clear pattern.",

                    "thoughts_for_you":
                        "Keep checking in when you can. Your mood history becomes more useful as you build it over time."

                }


            # -----------------------------------------------------
            # Split period into first half and second half
            # -----------------------------------------------------

            midpoint = start_date + timedelta(
                days=(number_of_days // 2)
            )

            first_half = []
            second_half = []

            for item in mood_list:

                logged_date = item["logged_at"].date()

                if logged_date < midpoint:
                    first_half.append(item)

                else:
                    second_half.append(item)


            # -----------------------------------------------------
            # Helper to find dominant mood
            # -----------------------------------------------------

            def dominant_from_list(entries):

                if not entries:
                    return None

                counts = calculate_counts(entries)

                return find_most_common_mood(counts)


            first_mood = dominant_from_list(first_half)
            second_mood = dominant_from_list(second_half)


            # -----------------------------------------------------
            # WHAT HAS CHANGED
            # -----------------------------------------------------

            if not first_half or not second_half:

                what_changed = (
                    "There are not enough check-ins across both parts "
                    "of this period to identify a clear change."
                )

            elif first_mood == second_mood:

                what_changed = (
                    f"{first_mood.capitalize()} remained the most common "
                    f"mood across both parts of this period."
                )

            else:

                what_changed = (
                    f"Earlier in this period, {first_mood} appeared most often. "
                    f"More recently, {second_mood} appeared most often."
                )


            # -----------------------------------------------------
            # WHAT WE NOTICED
            # -----------------------------------------------------

            counts = calculate_counts(mood_list)

            common_mood = find_most_common_mood(counts)

            common_count = counts.get(
                common_mood,
                0
            )

            total = len(mood_list)

            if total == 1:

                what_we_noticed = (
                    f"You recorded one check-in, with {common_mood} "
                    f"as the mood you logged."
                )

            else:

                percentage = round(
                    (common_count / total) * 100
                )

                what_we_noticed = (
                    f"{common_mood.capitalize()} appeared most often "
                    f"in your check-ins, showing up {common_count} "
                    f"out of {total} times ({percentage}%)."
                )


            # -----------------------------------------------------
            # THOUGHTS FOR YOU
            # -----------------------------------------------------

            thoughts = {

                "happy":
                    "It can be worth noticing what was happening around the moments that felt good and whether you can make space for more of them.",

                "calm":
                    "Notice what helped you feel calm. Those small things may be worth returning to when your days feel busy.",

                "confident":
                    "Take a moment to notice what was helping you feel confident. Recognizing those moments can help you understand what supports you.",

                "sad":
                    "Give yourself permission to acknowledge difficult moments without judging yourself for having them.",

                "anxious":
                    "If anxious moments keep appearing, gently notice what was happening around those check-ins. Understanding the context can be a useful first step.",

                "angry":
                    "When anger shows up, it may help to pause and notice what happened before the feeling appeared.",

                "stressed":
                    "Notice what was happening around your stressful moments. Small patterns in your routine may give you useful clues.",

                "tired":
                    "Pay attention to when tiredness tends to show up and whether rest, workload, or routine seem connected to it.",

                "lonely":
                    "Notice the moments when loneliness appears and whether connection with someone or something meaningful helps.",

                "excited":
                    "Notice what was bringing you excitement. Positive emotions can also give you clues about what matters to you.",

                "neutral":
                    "Not every day has to feel intense. Neutral moments are part of your emotional experience too."

            }


            thoughts_for_you = thoughts.get(

                str(common_mood).lower()
                if common_mood
                else "neutral",

                "Keep noticing your feelings with curiosity rather than judgment. Your check-ins are there to help you understand yourself, not to label you."

            )


            return {

                "what_changed": what_changed,

                "what_we_noticed": what_we_noticed,

                "thoughts_for_you": thoughts_for_you

            }


        # =========================================================
        # 13. BUILD COMPLETE ANALYTICS FOR ONE PERIOD
        # =========================================================

        def build_period_analytics(
            mood_list,
            start_date,
            number_of_days
        ):

            counts = calculate_counts(
                mood_list
            )

            total_check_ins = len(
                mood_list
            )

            most_common = find_most_common_mood(
                counts
            )

            latest = get_latest_mood(
                mood_list
            )

            percentages = calculate_percentages(
                counts,
                total_check_ins
            )

            days = create_days(
                mood_list,
                start_date,
                number_of_days
            )

            timeline = create_timeline(
                mood_list
            )

            reflection = create_reflection(
                mood_list,
                start_date,
                number_of_days
            )


            return {

                # ---------------------------------------------
                # BASIC INFORMATION
                # ---------------------------------------------

                "check_ins": total_check_ins,

                "most_common_mood": most_common,

                "latest_mood": latest,

                "mood_variety": len(counts),


                # ---------------------------------------------
                # DAYS
                # ---------------------------------------------

                "days": days,


                # ---------------------------------------------
                # MOOD PATTERN CHART
                # ---------------------------------------------

                "mood_timeline": timeline,


                # ---------------------------------------------
                # MOOD BREAKDOWN
                # ---------------------------------------------

                "mood_counts": counts,

                "mood_percentages": percentages,


                # ---------------------------------------------
                # FINAL REFLECTION
                # ---------------------------------------------

                "reflection": reflection

            }


        # =========================================================
        # 14. BUILD WEEKLY ANALYTICS
        # =========================================================

        weekly_analytics = build_period_analytics(

            weekly_moods,

            weekly_start,

            7

        )


        # =========================================================
        # 15. BUILD MONTHLY ANALYTICS
        # =========================================================

        monthly_analytics = build_period_analytics(

            monthly_moods,

            monthly_start,

            30

        )


        # =========================================================
        # 16. FINAL RESPONSE
        # =========================================================

        return {

            "weekly": weekly_analytics,

            "monthly": monthly_analytics

        }


    except Exception as error:

        print(
            "Mood analytics error:",
            error
        )

        return {
            "error": "Unable to load mood analytics."
        }


    finally:

        cursor.close()
        conn.close()