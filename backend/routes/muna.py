# routes/muna.py
from fastapi import APIRouter
from database import get_connection
from datetime import datetime
import re
import os
import requests
from dotenv import load_dotenv
from openai import OpenAI


router = APIRouter()



# ============================================================
# OPENAI / MUNA AI CONFIGURATION
# ============================================================


# ============================================================
# OPENAI / MUNA AI CONFIGURATION
# ============================================================

from pathlib import Path
from dotenv import load_dotenv

import os

BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE, override=True)

# ============================================================
# LOCAL MUNA AI - OLLAMA
# ============================================================

OLLAMA_URL = "http://localhost:11434/api/chat"
MUNA_MODEL = "qwen3.5:2b"

print("MUNA ENV FILE:", ENV_FILE)
print("MUNA ENV EXISTS:", ENV_FILE.exists())
print("MUNA OLLAMA URL:", OLLAMA_URL)
print("MUNA MODEL:", MUNA_MODEL)
# ============================================================
# AUTHENTICATION
# ============================================================

def get_current_user(cursor, session_token):
    """
    Verify the existing MindSpeak session.

    Uses the same user_sessions table created by auth.py.
    """

    if not session_token:
        return None

    cursor.execute(
        """
        SELECT
            users.id,
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


# ============================================================
# SAFETY DETECTION
# ============================================================

CRITICAL_PATTERNS = [
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
    r"\bdo not want to live\b",
]

HIGH_PATTERNS = [
    r"\bsuicide\b",
    r"\bsuicidal\b",
    r"\bself[- ]harm\b",
    r"\bhurt myself\b",
    r"\bhurting myself\b",
    r"\bcut myself\b",
    r"\boverdose\b",
]

MEDIUM_PATTERNS = [
    r"\bhate myself\b",
    r"\bcan't go on\b",
    r"\bcannot go on\b",
    r"\bno hope\b",
    r"\bhopeless\b",
    r"\bworthless\b",
    r"\bnot worth living\b",
]


def detect_safety_level(message):
    """
    Detect potentially concerning language.

    This is an application-level safety detector,
    not a clinical assessment or diagnosis.
    """

    text = message.lower().strip()

    for pattern in CRITICAL_PATTERNS:
        if re.search(pattern, text):
            return {
                "flagged": True,
                "severity": "critical",
                "reason": (
                    "Message contains language indicating "
                    "possible immediate self-harm or suicide risk."
                )
            }

    for pattern in HIGH_PATTERNS:
        if re.search(pattern, text):
            return {
                "flagged": True,
                "severity": "high",
                "reason": (
                    "Message contains language related "
                    "to self-harm or suicide."
                )
            }

    for pattern in MEDIUM_PATTERNS:
        if re.search(pattern, text):
            return {
                "flagged": True,
                "severity": "medium",
                "reason": (
                    "Message contains language indicating "
                    "significant emotional distress."
                )
            }

    return {
        "flagged": False,
        "severity": None,
        "reason": None
    }


# ============================================================
# MUNA RESPONSE GENERATION
# ============================================================

def generate_muna_response_fallback(
    message,
    selected_mood=None,
    conversation_history=None
):

    text = message.lower().strip()

    # Recent conversation context
    history = conversation_history or []

    recent_user_messages = [
        str(item.get("message", "")).strip()
        for item in history
        if item.get("sender_type") == "user"
    ][-6:]

    previous_context = " ".join(
        recent_user_messages
    ).lower()

    # ========================================================
    # CONTEXT AWARENESS
    # ========================================================

    if len(text.split()) <= 5 and previous_context:

        # STUDY / UNIVERSITY
        if any(word in previous_context for word in [
            "exam",
            "exams",
            "assignment",
            "assignments",
            "study",
            "studying",
            "university",
            "college",
            "class",
            "classes",
            "semester",
            "degree",
            "coursework",
            "deadline"
        ]):
            return (
                "Yes, I'm still with you. 💚 "
                "It sounds like we're still talking about what has been "
                "happening with your studies. Tell me a little more about "
                "what is bothering you right now."
            )

        # LONELINESS
        if any(word in previous_context for word in [
            "lonely",
            "alone",
            "isolated",
            "no friends",
            "nobody",
            "no one"
        ]):
            return (
                "I'm still listening. 💚 "
                "You were telling me about feeling alone. "
                "What part of that is weighing on you the most right now?"
            )

        # STRESS
        if any(word in previous_context for word in [
            "stress",
            "stressed",
            "overwhelmed",
            "pressure",
            "burnout",
            "burned out",
            "exhausted"
        ]):
            return (
                "I'm still here with you. 💚 "
                "Let's stay with what has been making things feel so heavy. "
                "What feels hardest right now?"
            )

        # ANXIETY
        if any(word in previous_context for word in [
            "anxiety",
            "anxious",
            "panic",
            "panicking",
            "worried",
            "worry",
            "nervous",
            "scared",
            "fear"
        ]):
            return (
                "I'm listening. 💚 "
                "You were telling me about your anxiety. "
                "What are you feeling right now?"
            )

        # SADNESS
        if any(word in previous_context for word in [
            "sad",
            "sadness",
            "cry",
            "crying",
            "upset",
            "heartbroken",
            "miserable"
        ]):
            return (
                "I'm still here. 💚 "
                "You don't have to move away from what you were feeling. "
                "What happened next?"
            )

        # RELATIONSHIPS
        if any(word in previous_context for word in [
            "relationship",
            "boyfriend",
            "girlfriend",
            "crush",
            "breakup",
            "break up",
            "partner",
            "friend",
            "friendship"
        ]):
            return (
                "I'm following you. 💚 "
                "You were telling me about that relationship or friendship. "
                "What happened after that?"
            )

        # FAMILY
        if any(word in previous_context for word in [
            "family",
            "parents",
            "mother",
            "mom",
            "father",
            "dad",
            "brother",
            "sister",
            "home"
        ]):
            return (
                "I'm still listening. 💚 "
                "You were telling me about things at home. "
                "What happened next?"
            )

    # ========================================================
    # SAFETY
    # ========================================================

    safety = detect_safety_level(message)

    if safety["severity"] == "critical":
        return (
            "I'm really glad you told me. 💚 "
            "I don't want you to face this alone. "
            "If you are in immediate danger or think you might hurt yourself, "
            "please contact emergency services or go to the nearest emergency "
            "department now. If you can, stay with someone you trust and tell "
            "them what is happening. I'm here to listen too. "
            "Would you like me to help you connect with support right now?"
        )

    if safety["severity"] == "high":
        return (
            "Thank you for trusting me with something this difficult. 💚 "
            "Your safety matters. If you feel that you might hurt yourself, "
            "please move away from anything you could use to hurt yourself "
            "and stay with someone you trust. You can also reach immediate "
            "emergency support where you are. "
            "For now, tell me what has been happening."
        )

    if safety["severity"] == "medium":
        return (
            "That sounds really heavy, and I'm glad you shared it instead of "
            "keeping everything inside. 💚 You don't have to solve everything "
            "at once. What has been making things feel so overwhelming lately?"
        )

    # ========================================================
    # STUDY / UNIVERSITY
    # ========================================================

    if any(word in text for word in [
        "exam",
        "exams",
        "assignment",
        "assignments",
        "study",
        "studying",
        "university",
        "college",
        "class",
        "classes",
        "semester",
        "degree",
        "coursework",
        "deadline"
    ]):
        return (
            "That sounds like a lot to carry, especially when study pressure "
            "keeps building up. 💚 Let's make it smaller instead of trying "
            "to solve everything at once. What is the one academic thing "
            "that is stressing you the most right now?"
        )

    # ========================================================
    # LONELINESS
    # ========================================================

    if any(word in text for word in [
        "lonely",
        "alone",
        "isolated",
        "no friends",
        "nobody",
        "no one"
    ]):
        return (
            "I'm glad you came here and said that. 💚 Feeling alone can be "
            "surprisingly exhausting, even when other people are around. "
            "Do you feel like you want someone to listen, or do you want "
            "help finding someone to connect with?"
        )

    # ========================================================
    # STRESS
    # ========================================================

    if any(word in text for word in [
        "stress",
        "stressed",
        "overwhelmed",
        "pressure",
        "too much",
        "burnout",
        "burned out",
        "exhausted"
    ]):
        return (
            "It sounds like you've got a lot sitting on your shoulders right "
            "now. 💚 Before we try to fix anything, let's slow it down for "
            "a moment. What is taking up the most space in your mind right now?"
        )

    # ========================================================
    # ANXIETY
    # ========================================================

    if any(word in text for word in [
        "anxiety",
        "anxious",
        "panic",
        "panicking",
        "worried",
        "worry",
        "nervous",
        "scared",
        "fear"
    ]):
        return (
            "I hear you. 💚 When anxiety gets loud, everything can feel "
            "urgent at the same time. Let's take one thing at a time. "
            "What happened today that made your anxiety feel stronger?"
        )

    # ========================================================
    # SADNESS
    # ========================================================

    if any(word in text for word in [
        "sad",
        "sadness",
        "cry",
        "crying",
        "upset",
        "hurt",
        "heartbroken",
        "miserable"
    ]):
        return (
            "I'm sorry you're going through that. 💚 You don't have to "
            "pretend that you're okay here. Sometimes being able to say "
            "what happened is the first step. What has been hurting you "
            "the most?"
        )

    # ========================================================
    # ANGER
    # ========================================================

    if any(word in text for word in [
        "angry",
        "anger",
        "mad",
        "furious",
        "annoyed",
        "annoying",
        "frustrated",
        "frustrating"
    ]):
        return (
            "It sounds like something really got under your skin. 💚 "
            "You can tell me about it without worrying about being judged. "
            "What happened?"
        )

    # ========================================================
    # RELATIONSHIPS
    # ========================================================

    if any(word in text for word in [
        "relationship",
        "boyfriend",
        "girlfriend",
        "crush",
        "breakup",
        "break up",
        "partner",
        "friend",
        "friendship"
    ]):
        return (
            "Relationships can affect us much more deeply than we sometimes "
            "expect. 💚 I'm listening. Do you want to tell me what happened "
            "between you and them?"
        )

    # ========================================================
    # FAMILY
    # ========================================================

    if any(word in text for word in [
        "family",
        "parents",
        "mother",
        "mom",
        "father",
        "dad",
        "brother",
        "sister",
        "home"
    ]):
        return (
            "Family situations can be complicated because those relationships "
            "often mean so much to us. 💚 You can talk about it here. "
            "What has been happening at home?"
        )

    # ========================================================
    # SLEEP
    # ========================================================

    if any(word in text for word in [
        "sleep",
        "sleeping",
        "insomnia",
        "can't sleep",
        "cannot sleep",
        "awake"
    ]):
        return (
            "It sounds like your mind might not be getting much of a break. 🌙 "
            "Sleep and emotions can affect each other quite a lot. "
            "Has something been keeping your mind active, or are you simply "
            "finding it difficult to fall asleep?"
        )

    # ========================================================
    # POSITIVE MOODS
    # ========================================================

    if any(word in text for word in [
        "happy",
        "great",
        "good",
        "excited",
        "amazing",
        "better"
    ]):
        return (
            "I love hearing that. 💚 Tell me more — "
            "what made today feel good?"
        )

    if any(word in text for word in [
        "calm",
        "peaceful",
        "relaxed",
        "okay",
        "fine"
    ]):
        return (
            "I'm glad things feel a little calmer. 🌱 "
            "What's on your mind today?"
        )

    # ========================================================
    # SELECTED MOOD
    # ========================================================

    if selected_mood == "happy":
        return (
            "I'm glad you're feeling happy today. 💚 "
            "What's been making you smile?"
        )

    if selected_mood == "calm":
        return (
            "That calm feeling can be a nice space to be in. 🌱 "
            "What's been on your mind?"
        )

    if selected_mood == "anxious":
        return (
            "I'm here with you. 💚 You don't have to explain everything "
            "perfectly. What's making you feel anxious right now?"
        )

    if selected_mood == "sad":
        return (
            "You don't have to pretend to be okay with me. 💚 "
            "What's been weighing on you?"
        )

    if selected_mood == "stressed":
        return (
            "Let's take this one thing at a time. 💚 "
            "What's stressing you out the most?"
        )

    if selected_mood == "tired":
        return (
            "It sounds like you could really use some breathing room. 🌱 "
            "What's been leaving you feeling so tired?"
        )

    if selected_mood == "lonely":
        return (
            "I'm glad you decided to talk to me. 💚 "
            "What's been making you feel alone lately?"
        )

    if selected_mood == "angry":
        return (
            "You can tell me what happened. 💚 "
            "I'm listening. What made you angry?"
        )

    # ========================================================
    # GENERAL
    # ========================================================

    return (
        "I'm listening. 💚 You don't have to explain everything perfectly. "
        "Tell me what's on your mind."
    )
# ============================================================
# REAL AI MUNA
# ============================================================

MUNA_SYSTEM_PROMPT = """
You are Muna, the friendly AI companion inside MindSpeak.

MindSpeak is a student-focused mental wellbeing platform.

Your role is to provide warm, supportive, non-judgmental conversation.
You are not a doctor, therapist, psychiatrist, or emergency service.

PERSONALITY:
- Be genuinely warm, friendly and human.
- Listen before trying to solve the problem.
- Never sound robotic, scripted, or overly formal.
- Let the conversation flow naturally.
- Use simple language.
- Keep responses reasonably concise.
- Ask thoughtful follow-up questions when appropriate.
- Do not ask several questions at once.
- Do not repeatedly say "I'm here for you" in every response.
- Use emojis occasionally and naturally, especially 💚 or 🌱, but do not overuse them.
- Never shame, judge, blame, or lecture the user.
- Do not pretend to have personal experiences or feelings.

CONVERSATION:
- Pay attention to previous messages.
- Remember what the user has already told you during the current conversation.
- Do not make the user repeat information unnecessarily.
- If the user gives a short follow-up such as "yes", "no", "why?", "okay", or "what should I do?",
  understand it using the previous conversation context.
- Respect the mood selected by the user.
- If the user changes topic naturally, follow the new topic.
- If the user seems unsure what to say, gently help them continue.

MENTAL WELLBEING:
- You may discuss emotions, stress, anxiety, loneliness, relationships,
  family problems, study pressure, sleep, confidence, motivation and everyday difficulties.
- Do not diagnose mental health conditions.
- Do not claim certainty about someone's mental health.
- Do not prescribe medication or provide medical treatment instructions.
- For serious concerns, encourage appropriate professional or trusted-person support.

MINDSPEAK:
When relevant, Muna can gently mention that MindSpeak has:
- Toolkit resources
- Safe Space
- Mentor support
- Connection with other people
- Articles and wellbeing content
- MindSpeak events

Do not invent specific article titles, event names, URLs, mentors, or resources.
Only recommend specific MindSpeak resources when they are explicitly provided to you.

SAFETY:
If the user expresses immediate danger, suicide, self-harm, or an intention to seriously hurt themselves,
do not treat the conversation as ordinary emotional support.

Respond calmly and directly:
- acknowledge what they said,
- encourage immediate real-world help,
- encourage contacting emergency services or going to the nearest emergency department
  if they are in immediate danger,
- encourage staying with a trusted person,
- avoid guilt, fear, or judgment.

Never provide instructions for suicide, self-harm, overdose, or other dangerous acts.

IMPORTANT:
You are Muna, not an authority figure.
Your job is to listen, support, clarify, and gently guide the user toward appropriate support.
"""


def generate_muna_response(
    message,
    selected_mood=None,
    conversation_history=None
):
    """
    Generate a real AI response using OpenAI.

    Falls back to the existing rule-based Muna if:
    - OpenAI is not configured
    - the API request fails
    - the AI returns an empty response
    """

    history = conversation_history or []

    # --------------------------------------------------------
    # SAFETY FIRST
    # --------------------------------------------------------

    safety = detect_safety_level(message)

    if safety["severity"] == "critical":
        return (
            "I'm really glad you told me. 💚 "
            "I don't want you to face this alone. "
            "If you are in immediate danger or think you might hurt yourself, "
            "please contact emergency services or go to the nearest emergency "
            "department now. If you can, stay with someone you trust and tell "
            "them what is happening. I'm here to listen too. "
            "Would you like me to help you connect with support right now?"
        )

    if safety["severity"] == "high":
        return (
            "Thank you for trusting me with something this difficult. 💚 "
            "Your safety matters. If you feel that you might hurt yourself, "
            "please move away from anything you could use to hurt yourself "
            "and stay with someone you trust. You can also reach immediate "
            "emergency support where you are. "
            "For now, tell me what has been happening."
        )

    if safety["severity"] == "medium":
        return (
            "That sounds really heavy, and I'm glad you shared it instead of "
            "keeping everything inside. 💚 You don't have to solve everything "
            "at once. What has been making things feel so overwhelming lately?"
        )

    # --------------------------------------------------------
    # CONNECT TO LOCAL OLLAMA
    # --------------------------------------------------------

    print("MUNA DEBUG: Connecting to local Ollama...")

    try:

        # ----------------------------------------------------
        # BUILD CONVERSATION CONTEXT
        # ----------------------------------------------------

        ai_messages = []

        for item in history[-6:]:

            sender_type = item.get("sender_type")

            previous_message = str(
                item.get("message", "")
            ).strip()

            if not previous_message:
                continue

            if sender_type == "user":

                ai_messages.append({
                    "role": "user",
                    "content": previous_message
                })

            elif sender_type == "muna":

                ai_messages.append({
                    "role": "assistant",
                    "content": previous_message
                })

        # ----------------------------------------------------
        # MAKE SURE CURRENT MESSAGE IS INCLUDED
        # ----------------------------------------------------

        if not ai_messages or ai_messages[-1]["role"] != "user":

            ai_messages.append({
                "role": "user",
                "content": message
            })

        # ----------------------------------------------------
        # MOOD CONTEXT
        # ----------------------------------------------------

        mood_context = ""

        if selected_mood:

            mood_context = (
                f"\nThe user selected this mood when starting "
                f"the conversation: {selected_mood}."
            )

        # ----------------------------------------------------
        # ADD MUNA SYSTEM INSTRUCTION
        # ----------------------------------------------------

        ollama_messages = [
            {
                "role": "system",
                "content": MUNA_SYSTEM_PROMPT + mood_context
            }
        ]

        ollama_messages.extend(ai_messages)

        # ----------------------------------------------------
        # CALL LOCAL OLLAMA
        # ----------------------------------------------------

        response = requests.post(
    OLLAMA_URL,
    json={
        "model": MUNA_MODEL,
        "messages": ollama_messages,
        "stream": False,
        "think": False,
        "options": {
            "num_predict": 100,
            "temperature": 0.7
        }
    },
    timeout=120
)
        response.raise_for_status()

        response_data = response.json()

        # ----------------------------------------------------
        # GET MUNA RESPONSE
        # ----------------------------------------------------

        muna_response = (
            response_data
            .get("message", {})
            .get("content", "")
            .strip()
        )

        if muna_response:

            print("MUNA AI RESPONSE GENERATED SUCCESSFULLY")

            return muna_response

        print("MUNA AI returned an empty response.")

    except Exception as error:

        print("=" * 70)
        print("MUNA AI ERROR")
        print("ERROR TYPE:", type(error).__name__)
        print("ERROR:", str(error))
        print("=" * 70)
    # --------------------------------------------------------
    # SAFE FALLBACK
    # --------------------------------------------------------

    return generate_muna_response_fallback(
        message,
        selected_mood,
        history
    )
# ============================================================
# START CONVERSATION
# ============================================================

@router.post("/start")
def start_conversation(data: dict):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        session_token = data.get("session_token")
        selected_mood = data.get("selected_mood")

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:
            return {
                "error": "Invalid or expired session."
            }

        user_id = user["id"]

        cursor.execute(
            """
            INSERT INTO muna_conversations
            (
                user_id,
                selected_mood,
                status
            )
            VALUES
            (
                %s,
                %s,
                'active'
            )
            """,
            (
                user_id,
                selected_mood
            )
        )

        conversation_id = cursor.lastrowid

        opening_messages = {
            "happy": (
                "I love hearing that you're feeling happy. 💚 "
                "What's been making today feel good?"
            ),
            "calm": (
                "It sounds like you're feeling calm today. 🌱 "
                "What's on your mind?"
            ),
            "anxious": (
                "I see you're feeling anxious. 💚 "
                "I'm here with you. What's been making you feel anxious today?"
            ),
            "sad": (
                "I'm sorry you're feeling sad. You don't have to pretend "
                "to be okay with me. 💚 What's been weighing on you?"
            ),
            "stressed": (
                "It sounds like things are feeling pretty overwhelming "
                "right now. 💚 What's been stressing you out the most?"
            ),
            "tired": (
                "You sound like you could really use a little breathing room. "
                "🌱 What's been leaving you feeling so tired?"
            ),
            "lonely": (
                "I'm glad you decided to talk to me. 💚 "
                "Feeling lonely can be really heavy. "
                "What's been making you feel alone lately?"
            ),
            "angry": (
                "It sounds like something has really upset you. 💚 "
                "You can tell me what happened. I'm listening."
            ),
            "other": (
                "That's completely okay. You don't have to put a label "
                "on what you're feeling. 💚 Just tell me what's on your mind."
            )
        }

        opening_message = opening_messages.get(
            selected_mood,
            opening_messages["other"]
        )

        cursor.execute(
            """
            INSERT INTO muna_messages
            (
                conversation_id,
                sender_type,
                message,
                safety_flag
            )
            VALUES
            (
                %s,
                'muna',
                %s,
                FALSE
            )
            """,
            (
                conversation_id,
                opening_message
            )
        )

        conn.commit()

        return {
            "success": True,
            "conversation_id": conversation_id,
            "selected_mood": selected_mood,
            "user": {
                "id": user["id"],
                "nickname": user["nickname"],
                "avatar": user["avatar"]
            },
            "message": {
                "sender_type": "muna",
                "message": opening_message
            }
        }

    except Exception as error:

        conn.rollback()

        print(
            "MUNA START ERROR:",
            error
        )

        return {
            "error": "Unable to start Muna conversation."
        }

    finally:

        cursor.close()
        conn.close()


# ============================================================
# SEND MESSAGE
# ============================================================

@router.post("/chat")
def chat_with_muna(data: dict):
    print("🔥 MUNA CHAT ROUTE LOADED")
    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        session_token = data.get("session_token")
        conversation_id = data.get("conversation_id")

        message = str(
            data.get("message", "")
        ).strip()

        if not message:
            return {
                "error": "Message cannot be empty."
            }

        if len(message) > 5000:
            return {
                "error": "Message is too long."
            }

        if not conversation_id:
            return {
                "error": "Conversation ID is required."
            }

        # ----------------------------------------------------
        # VERIFY USER
        # ----------------------------------------------------

        user = get_current_user(
            cursor,
            session_token
        )

        if not user:
            return {
                "error": "Invalid or expired session."
            }

        user_id = user["id"]

        # ----------------------------------------------------
        # VERIFY CONVERSATION OWNERSHIP
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                selected_mood,
                status
            FROM muna_conversations
            WHERE id = %s
            AND user_id = %s
            LIMIT 1
            """,
            (
                conversation_id,
                user_id
            )
        )

        conversation = cursor.fetchone()

        if not conversation:
            return {
                "error": "Conversation not found."
            }

        if conversation["status"] != "active":
            return {
                "error": "This conversation has been closed."
            }

        # ----------------------------------------------------
        # SAFETY CHECK
        # ----------------------------------------------------

        safety = detect_safety_level(message)

        # ----------------------------------------------------
        # SAVE USER MESSAGE
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO muna_messages
            (
                conversation_id,
                sender_type,
                message,
                safety_flag
            )
            VALUES
            (
                %s,
                'user',
                %s,
                %s
            )
            """,
            (
                conversation_id,
                message,
                safety["flagged"]
            )
        )

        user_message_id = cursor.lastrowid

        # ----------------------------------------------------
        # CREATE SAFETY ALERT
        # ----------------------------------------------------

        safety_alert_id = None

        if safety["flagged"]:

            cursor.execute(
                """
                INSERT INTO muna_safety_alerts
                (
                    conversation_id,
                    message_id,
                    user_id,
                    severity,
                    reason,
                    status
                )
                VALUES
                (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    'pending'
                )
                """,
                (
                    conversation_id,
                    user_message_id,
                    user_id,
                    safety["severity"],
                    safety["reason"]
                )
            )

            safety_alert_id = cursor.lastrowid

        # ----------------------------------------------------
        # LOAD RECENT CONVERSATION CONTEXT
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                sender_type,
                message,
                created_at
            FROM muna_messages
            WHERE conversation_id = %s
            ORDER BY created_at DESC, id DESC
            LIMIT 12
            """,
            (conversation_id,)
        )

        conversation_history = cursor.fetchall()

        # Restore chronological order
        conversation_history.reverse()

        # ----------------------------------------------------
        # GENERATE MUNA RESPONSE
        # ----------------------------------------------------

        muna_response = generate_muna_response(
            message,
            conversation["selected_mood"],
            conversation_history
        )

        # ----------------------------------------------------
        # SAVE MUNA RESPONSE
        # ----------------------------------------------------

        cursor.execute(
            """
            INSERT INTO muna_messages
            (
                conversation_id,
                sender_type,
                message,
                safety_flag
            )
            VALUES
            (
                %s,
                'muna',
                %s,
                FALSE
            )
            """,
            (
                conversation_id,
                muna_response
            )
        )

        muna_message_id = cursor.lastrowid

        # ----------------------------------------------------
        # UPDATE CONVERSATION
        # ----------------------------------------------------

        cursor.execute(
            """
            UPDATE muna_conversations
            SET last_message_at = %s
            WHERE id = %s
            """,
            (
                datetime.now(),
                conversation_id
            )
        )

        conn.commit()

        return {
            "success": True,
            "conversation_id": conversation_id,

            "user_message": {
                "id": user_message_id,
                "sender_type": "user",
                "message": message,
                "safety_flag": safety["flagged"]
            },

            "muna_message": {
                "id": muna_message_id,
                "sender_type": "muna",
                "message": muna_response
            },

            "safety": {
                "flagged": safety["flagged"],
                "severity": safety["severity"]
            },
            "actions": {
    "emergency": safety["severity"] in ["critical", "high"],
    "mentor": safety["flagged"],
    "toolkit": safety["flagged"]
},
            "safety_alert_id": safety_alert_id
        }
            

    except Exception as error:

        conn.rollback()

        print(
            "MUNA CHAT ERROR:",
            error
        )

        return {
            "error": "Unable to process Muna message."
        }

    finally:

        cursor.close()
        conn.close()


# ============================================================
# GET ALL USER CONVERSATIONS
# ============================================================

@router.get("/conversations")
def get_conversations(session_token: str):

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
                selected_mood,
                started_at,
                last_message_at,
                status
            FROM muna_conversations
            WHERE user_id = %s
            ORDER BY last_message_at DESC
            """,
            (
                user["id"],
            )
        )

        conversations = cursor.fetchall()

        return {
            "success": True,
            "conversations": conversations
        }

    except Exception as error:

        print(
            "MUNA CONVERSATIONS ERROR:",
            error
        )

        return {
            "error": "Unable to load conversations."
        }

    finally:

        cursor.close()
        conn.close()


# ============================================================
# GET ONE CONVERSATION + MESSAGES
# ============================================================

@router.get("/conversation/{conversation_id}")
def get_conversation(
    conversation_id: int,
    session_token: str
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

        # ----------------------------------------------------
        # VERIFY OWNERSHIP
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                user_id,
                selected_mood,
                started_at,
                last_message_at,
                status
            FROM muna_conversations
            WHERE id = %s
            AND user_id = %s
            LIMIT 1
            """,
            (
                conversation_id,
                user["id"]
            )
        )

        conversation = cursor.fetchone()

        if not conversation:
            return {
                "error": "Conversation not found."
            }

        # ----------------------------------------------------
        # LOAD MESSAGES
        # ----------------------------------------------------

        cursor.execute(
            """
            SELECT
                id,
                sender_type,
                message,
                safety_flag,
                created_at
            FROM muna_messages
            WHERE conversation_id = %s
            ORDER BY created_at ASC, id ASC
            """,
            (
                conversation_id,
            )
        )

        messages = cursor.fetchall()

        return {
            "success": True,
            "conversation": conversation,
            "messages": messages
        }

    except Exception as error:

        print(
            "MUNA CONVERSATION ERROR:",
            error
        )

        return {
            "error": "Unable to load conversation."
        }

    finally:

        cursor.close()
        conn.close()


# ============================================================
# CLOSE CONVERSATION
# ============================================================

@router.put("/conversation/{conversation_id}/close")
def close_conversation(
    conversation_id: int,
    data: dict
):

    conn = get_connection()

    if not conn:
        return {
            "error": "Database connection failed"
        }

    cursor = conn.cursor(dictionary=True)

    try:

        session_token = data.get("session_token")

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
            FROM muna_conversations
            WHERE id = %s
            AND user_id = %s
            LIMIT 1
            """,
            (
                conversation_id,
                user["id"]
            )
        )

        conversation = cursor.fetchone()

        if not conversation:
            return {
                "error": "Conversation not found."
            }

        cursor.execute(
            """
            UPDATE muna_conversations
            SET status = 'closed'
            WHERE id = %s
            AND user_id = %s
            """,
            (
                conversation_id,
                user["id"]
            )
        )

        conn.commit()

        return {
            "success": True,
            "message": "Muna conversation closed."
        }

    except Exception as error:

        conn.rollback()

        print(
            "MUNA CLOSE ERROR:",
            error
        )

        return {
            "error": "Unable to close conversation."
        }

    finally:

        cursor.close()
        conn.close()


# ============================================================
# DELETE CONVERSATION
# ============================================================

@router.delete("/conversation/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    session_token: str
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
            FROM muna_conversations
            WHERE id = %s
            AND user_id = %s
            LIMIT 1
            """,
            (
                conversation_id,
                user["id"]
            )
        )

        conversation = cursor.fetchone()

        if not conversation:
            return {
                "error": "Conversation not found."
            }

        cursor.execute(
            """
            DELETE FROM muna_conversations
            WHERE id = %s
            AND user_id = %s
            """,
            (
                conversation_id,
                user["id"]
            )
        )

        conn.commit()

        return {
            "success": True,
            "message": "Muna conversation deleted."
        }

    except Exception as error:

        conn.rollback()

        print(
            "MUNA DELETE ERROR:",
            error
        )

        return {
            "error": "Unable to delete conversation."
        }

    finally:

        cursor.close()
        conn.close()