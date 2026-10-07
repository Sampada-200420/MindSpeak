
# utils.py
import random
import secrets

ADJECTIVES = [
    "Gentle", "Brave", "Calm", "Kind",
    "Soft", "Warm", "Still", "Free",
    "Quiet", "Bold", "Safe", "Clear"
]

NATURE_WORDS = [
    "Leaf", "River", "Cloud", "Stone",
    "Tree", "Rain", "Moon", "Star",
    "Wind", "Lake", "Dawn", "Hill"
]

AVATARS = [
    "🌿", "🌸", "🍃", "🌊",
    "🌙", "⭐", "🌱", "🍀",
    "🌻", "🌈", "🦋", "🕊️"
]

def generate_nickname():
    adj = random.choice(ADJECTIVES)
    nature = random.choice(NATURE_WORDS)
    number = random.randint(10, 99)
    return f"{adj}{nature}{number}"

def generate_avatar():
    return random.choice(AVATARS)

def generate_token():
    return secrets.token_urlsafe(32)