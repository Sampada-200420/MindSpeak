
# MindSpeak

> A digital mental wellbeing and peer-support platform designed to help people talk, connect, reflect, and find support in a safe environment.

## Overview

MindSpeak is a full-stack web application focused on mental wellbeing and human connection.

The platform combines AI-assisted conversations, peer support, mentor connections, self-help resources, community interaction, journaling, and educational content in one place.

MindSpeak was developed with the goal of creating a supportive digital environment where users can:

- Talk with an AI companion
- Share experiences with a supportive community
- Connect with mentors
- Explore mental wellbeing resources
- Reflect through journaling
- Read and write blogs
- Participate in events and sessions
- Find practical strategies for everyday challenges

---

## Key Features

### Muna — AI Wellbeing Companion

Muna is the AI companion within MindSpeak.

Users can have supportive conversations with Muna about how they are feeling, what they are experiencing, or situations they want to talk through.

The interface is designed to feel conversational and supportive rather than like a conventional chatbot.

> Muna is an AI companion and is not a replacement for professional mental-health or emergency services.

---

### Safe Space

Safe Space allows users to share experiences and interact with the MindSpeak community.

Posts can be organized into categories such as:

- General
- Academic
- Anxiety
- Relationships
- Family
- Self
- Others

Users can also explore posts using different sorting options, including recent and popular content.

The platform includes safety-oriented handling for potentially harmful content and administrative review workflows.

---

### Mentor Support

MindSpeak provides a structured mentor-support system.

Users can:

1. Explore mentor support
2. Send a mentor request
3. Select a topic
4. Explain what they need help with
5. Receive a mentor response
6. Start a mentor conversation after acceptance

Mentors have their own interface for managing requests and conversations.

---

### MindSpeak Toolkit

The Toolkit provides practical self-help resources organized around different areas of wellbeing.

Topics include:

- Anxiety
- Stress & Burnout
- Low Mood
- Sleep
- Study & Work
- Comparison & Self-Esteem
- Addiction & Habit Change

The Toolkit also includes guided questions, explanations, practical exercises, and pathways toward additional support.

---

### Journaling

Users can use the journal feature for private reflection and personal entries.

The journaling system allows users to record thoughts and experiences as part of their personal wellbeing journey.

User-uploaded content is kept outside the public GitHub repository.

---

### Community & Connections

MindSpeak includes a connection hub designed to help users find meaningful peer interaction.

Users can discover opportunities to talk with others and build supportive connections.

---

### Blog Platform

MindSpeak includes a blogging system where users can:

- Write blogs
- Add cover images
- Save blog content
- View published content
- Manage their own blogs

---

### Authentication & Account Management

The application includes user authentication and account management features such as:

- Registration
- Login
- Protected pages
- Password handling
- Password reset
- Email verification
- User profiles
- Custom usernames and avatars

Passwords are securely hashed on the backend rather than stored as plain text.

---

### Events & Sessions

MindSpeak supports wellbeing-related events and sessions where users can access information about upcoming activities and community sessions.

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript

The frontend is organized into separate HTML, CSS, and JavaScript files to keep the application modular and maintainable.

### Backend

- Python
- FastAPI
- REST APIs
- JSON

### Database

- MySQL

### AI

- Muna AI companion
- Ollama / local AI integration

### Development Tools

- Visual Studio Code
- Git
- GitHub
- XAMPP / local MySQL environment

---

## System Architecture

MindSpeak follows a three-layer application architecture.

```text
                    MINDSPEAK
                        │
                        ▼
              ┌───────────────────┐
              │ Presentation Layer │
              │                   │
              │ HTML / CSS / JS   │
              └─────────┬─────────┘
                        │
                     HTTP / JSON
                        │
                        ▼
              ┌───────────────────┐
              │  Application      │
              │     Layer         │
              │                   │
              │ Python / FastAPI  │
              └─────────┬─────────┘
                        │
                  Database Queries
                        │
                        ▼
              ┌───────────────────┐
              │    Data Layer     │
              │                   │
              │       MySQL       │
              └───────────────────┘


