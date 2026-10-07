// /* =========================================================
//    MINDSPEAK — MUNA CHATBOT
//    Backend-connected version
//    User-specific conversation history
//    ========================================================= */

// document.addEventListener("DOMContentLoaded", () => {
//     initializeMuna();
// });


// /* =========================================================
//    CONFIGURATION
//    ========================================================= */

// const MUNA_API = "http://127.0.0.1:8000";

// let munaConversationId = null;
// let munaIsSending = false;


// /* =========================================================
//    MUNA MOODS
//    ========================================================= */

// const MUNA_MOODS = {

//     happy: {
//         label: "Happy",
//         emoji: "😊",
//         opening:
//             "I love hearing that you're feeling happy. 💚 What's been making today feel good?"
//     },

//     calm: {
//         label: "Calm",
//         emoji: "😌",
//         opening:
//             "It sounds like you're feeling calm today. 🌱 What's on your mind?"
//     },

//     anxious: {
//         label: "Anxious",
//         emoji: "😟",
//         opening:
//             "I see you're feeling anxious. 💚 I'm here with you. What's been making you feel anxious today?"
//     },

//     sad: {
//         label: "Sad",
//         emoji: "😔",
//         opening:
//             "I'm sorry you're feeling sad. You don't have to pretend to be okay with me. 💚 What's been weighing on you?"
//     },

//     stressed: {
//         label: "Stressed",
//         emoji: "😣",
//         opening:
//             "It sounds like things are feeling pretty overwhelming right now. 💚 What's been stressing you out the most?"
//     },

//     tired: {
//         label: "Tired",
//         emoji: "😴",
//         opening:
//             "You sound like you could really use a little breathing room. 🌱 What's been leaving you feeling so tired?"
//     },

//     lonely: {
//         label: "Lonely",
//         emoji: "😞",
//         opening:
//             "I'm glad you decided to talk to me. 💚 Feeling lonely can be really heavy. What's been making you feel alone lately?"
//     },

//     angry: {
//         label: "Angry",
//         emoji: "😤",
//         opening:
//             "It sounds like something has really upset you. 💚 You can tell me what happened. I'm listening."
//     },

//     other: {
//         label: "Here to listen",
//         emoji: "💭",
//         opening:
//             "That's completely okay. You don't have to put a label on what you're feeling. 💚 Just tell me what's on your mind."
//     }
// };


// /* =========================================================
//    INITIALIZE
//    ========================================================= */

// function initializeMuna() {

//     setupMoodButtons();
//     setupSomethingElseButton();
//     setupNormalConversationButton();
//     setupChangeMoodButton();
//     setupSuggestionButtons();
//     setupChatForm();

//     /* Conversation history */
//     setupMunaHistory();

//     /*
//      * If the user already has a conversation stored
//      * in this browser session, keep its ID available.
//      */

//     const savedConversationId =
//         sessionStorage.getItem("muna_conversation_id");

//     if (savedConversationId) {
//         munaConversationId = savedConversationId;
//     }
// }


// /* =========================================================
//    GET SESSION TOKEN
//    ========================================================= */

// function getSessionToken() {

//     return localStorage.getItem("session_token");
// }


// /* =========================================================
//    CHECK LOGIN
//    ========================================================= */

// function isMunaLoggedIn() {

//     const token = getSessionToken();

//     return Boolean(token);
// }


// /* =========================================================
//    MOOD BUTTONS
//    ========================================================= */

// function setupMoodButtons() {

//     const buttons =
//         document.querySelectorAll(
//             ".mood-option[data-mood]"
//         );

//     buttons.forEach(button => {

//         button.addEventListener("click", () => {

//             const mood =
//                 button.dataset.mood;

//             if (!mood || !MUNA_MOODS[mood]) {
//                 return;
//             }

//             buttons.forEach(item => {
//                 item.classList.remove("selected");
//             });

//             button.classList.add("selected");

//             startMunaConversation(mood);
//         });
//     });
// }


// /* =========================================================
//    SOMETHING ELSE
//    ========================================================= */

// function setupSomethingElseButton() {

//     const button =
//         document.getElementById("somethingElseBtn");

//     if (!button) {
//         return;
//     }

//     button.addEventListener("click", () => {
//         startMunaConversation("other");
//     });
// }


// /* =========================================================
//    TALK NORMALLY
//    ========================================================= */

// function setupNormalConversationButton() {

//     const button =
//         document.getElementById("talkNormallyBtn");

//     if (!button) {
//         return;
//     }

//     button.addEventListener("click", () => {
//         startMunaConversation("other");
//     });
// }


// /* =========================================================
//    START MUNA CONVERSATION
//    ========================================================= */

// async function startMunaConversation(mood) {

//     const moodData =
//         MUNA_MOODS[mood] || MUNA_MOODS.other;

//     const sessionToken =
//         getSessionToken();

//     /*
//      * Muna requires a logged-in user.
//      */

//     if (!sessionToken) {

//         alert(
//             "Please log in to talk with Muna and save your conversation."
//         );

//         window.location.href =
//             "../login.html";

//         return;
//     }


//     /*
//      * Save selected mood locally.
//      */

//     sessionStorage.setItem(
//         "muna_selected_mood",
//         mood
//     );

//     sessionStorage.setItem(
//         "muna_selected_mood_label",
//         moodData.label
//     );

//     sessionStorage.setItem(
//         "muna_selected_mood_emoji",
//         moodData.emoji
//     );


//     /*
//      * Hide history if it is open.
//      */

//     hideMunaHistory();


//     /*
//      * Hide welcome screen.
//      */

//     const welcome =
//         document.getElementById("munaWelcome");

//     if (welcome) {
//         welcome.style.display = "none";
//     }


//     /*
//      * Show chat.
//      */

//     const chat =
//         document.getElementById("munaChat");

//     if (chat) {
//         chat.style.display = "flex";
//     }


//     /*
//      * Update mood display.
//      */

//     updateMoodDisplay(moodData);


//     /*
//      * Clear visible messages.
//      */

//     clearMessages();


//     /*
//      * Show typing while backend creates
//      * the conversation.
//      */

//     showMunaTyping();


//     try {

//         const response =
//             await fetch(
//                 `${MUNA_API}/muna/start`,
//                 {
//                     method: "POST",

//                     headers: {
//                         "Content-Type": "application/json"
//                     },

//                     body: JSON.stringify({
//                         session_token: sessionToken,
//                         selected_mood: mood
//                     })
//                 }
//             );


//         const data =
//             await response.json();

//         hideMunaTyping();


//         /*
//          * Backend error.
//          */

//         if (!response.ok || data.error) {

//             console.error(
//                 "Muna start error:",
//                 data
//             );

//             addMunaMessage(
//                 "I'm having a little trouble connecting right now. 💚 Please try again in a moment."
//             );

//             return;
//         }


//         /*
//          * Save conversation ID.
//          */

//         munaConversationId =
//             data.conversation_id;

//         sessionStorage.setItem(
//             "muna_conversation_id",
//             munaConversationId
//         );


//         /*
//          * Display opening message.
//          */

//         if (
//             data.message &&
//             data.message.message
//         ) {

//             addMunaMessage(
//                 data.message.message,
//                 data.message.created_at
//             );

//         } else {

//             addMunaMessage(
//                 moodData.opening
//             );
//         }


//         focusMunaInput();

//         scrollMessagesToBottom();

//     } catch (error) {

//         hideMunaTyping();

//         console.error(
//             "Muna connection error:",
//             error
//         );

//         addMunaMessage(
//             "I couldn't connect to my support system right now. 💚 Please make sure the MindSpeak server is running and try again."
//         );
//     }
// }


// /* =========================================================
//    UPDATE MOOD DISPLAY
//    ========================================================= */

// function updateMoodDisplay(moodData) {

//     const moodText =
//         document.getElementById(
//             "selectedMoodText"
//         );

//     if (!moodText) {
//         return;
//     }

//     moodText.textContent =
//         `${moodData.emoji} ${moodData.label}`;
// }


// /* =========================================================
//    ADD MUNA MESSAGE
//    ========================================================= */

// function addMunaMessage(message, createdAt = null,  messageId = null) {

//     const messages =
//         document.getElementById(
//             "munaMessages"
//         );

//     if (!messages) {
//         return;
//     }

//     const row =
//         document.createElement("div");
//     if (messageId) {
//     row.dataset.messageId = messageId;
// }

//     row.className =
//         "message-row muna";


//     /*
//      * Muna avatar.
//      */

//     const avatar =
//         document.createElement("img");

//     avatar.src =
//         "../images/chatbot/Muna.jpg";

//     avatar.alt =
//         "Muna";

//     avatar.className =
//         "message-avatar";


//     /*
//      * Message bubble.
//      */

//     const bubble =
//         document.createElement("div");

//     bubble.className =
//         "message-bubble";

//     bubble.textContent =
//         message;


//     /*
//      * Build message.
//      */

//     row.appendChild(avatar);
//     row.appendChild(bubble);

//     /*
//      * Optional timestamp.
//      */

//     if (createdAt) {

//         const time =
//             document.createElement("span");

//         time.className =
//             "message-time";

//         time.textContent =
//             formatMessageTime(createdAt);

//         row.appendChild(time);
//     }

//     messages.appendChild(row);

//     scrollMessagesToBottom();
// }


// /* =========================================================
//    ADD USER MESSAGE
//    ========================================================= */

// function addUserMessage(message, createdAt = null,   messageId = null) {

//     const messages =
//         document.getElementById(
//             "munaMessages"
//         );

//     if (!messages) {
//         return;
//     }

//     const row =
//         document.createElement("div");
//     if (messageId) {
//     row.dataset.messageId = messageId;
// }

//     row.className =
//         "message-row user";


//     const bubble =
//         document.createElement("div");

//     bubble.className =
//         "message-bubble";

//     bubble.textContent =
//         message;


//     row.appendChild(bubble);


//     /*
//      * Optional timestamp.
//      */

//     if (createdAt) {

//         const time =
//             document.createElement("span");

//         time.className =
//             "message-time";

//         time.textContent =
//             formatMessageTime(createdAt);

//         row.appendChild(time);
//     }


//     messages.appendChild(row);

//     scrollMessagesToBottom();
// }


// /* =========================================================
//    CLEAR MESSAGES
//    ========================================================= */

// function clearMessages() {

//     const messages =
//         document.getElementById(
//             "munaMessages"
//         );

//     if (!messages) {
//         return;
//     }

//     messages.innerHTML = "";
// }


// /* =========================================================
//    CHANGE MOOD
//    ========================================================= */

// function setupChangeMoodButton() {

//     const button =
//         document.getElementById(
//             "changeMoodBtn"
//         );

//     if (!button) {
//         return;
//     }

//     button.addEventListener("click", () => {

//         const chat =
//             document.getElementById(
//                 "munaChat"
//             );

//         const welcome =
//             document.getElementById(
//                 "munaWelcome"
//             );


//         /*
//          * Hide chat.
//          */

//         if (chat) {
//             chat.style.display = "none";
//         }


//         /*
//          * Show mood selection.
//          */

//         if (welcome) {
//             welcome.style.display = "block";
//         }


//         /*
//          * Clear visible messages.
//          */

//         clearMessages();


//         /*
//          * Reset selected mood.
//          */

//         document
//             .querySelectorAll(
//                 ".mood-option"
//             )
//             .forEach(button => {

//                 button.classList.remove(
//                     "selected"
//                 );

//             });


//         /*
//          * The old conversation remains in the database
//          * and can be accessed from History.
//          */

//         munaConversationId = null;

//         sessionStorage.removeItem(
//             "muna_conversation_id"
//         );

//         sessionStorage.removeItem(
//             "muna_selected_mood"
//         );

//         sessionStorage.removeItem(
//             "muna_selected_mood_label"
//         );

//         sessionStorage.removeItem(
//             "muna_selected_mood_emoji"
//         );
//     });
// }


// /* =========================================================
//    SUGGESTION BUTTONS
//    ========================================================= */

// function setupSuggestionButtons() {

//     const buttons =
//         document.querySelectorAll(
//             ".suggestion-btn[data-message]"
//         );

//     buttons.forEach(button => {

//         button.addEventListener(
//             "click",
//             () => {

//                 const message =
//                     button.dataset.message;

//                 if (!message) {
//                     return;
//                 }

//                 sendUserMessage(message);
//             }
//         );
//     });
// }


// /* =========================================================
//    CHAT FORM
//    ========================================================= */

// function setupChatForm() {

//     const form =
//         document.getElementById(
//             "munaChatForm"
//         );

//     const input =
//         document.getElementById(
//             "munaMessageInput"
//         );

//     if (!form || !input) {
//         return;
//     }


//     /*
//      * Submit message.
//      */

//     form.addEventListener(
//         "submit",
//         event => {

//             event.preventDefault();

//             const message =
//                 input.value.trim();

//             if (!message) {
//                 return;
//             }

//             sendUserMessage(message);

//             input.value = "";

//             input.style.height = "auto";
//         }
//     );


//     /*
//      * Enter = send
//      * Shift + Enter = new line
//      */

//     input.addEventListener(
//         "keydown",
//         event => {

//             if (
//                 event.key === "Enter" &&
//                 !event.shiftKey
//             ) {

//                 event.preventDefault();

//                 form.requestSubmit();
//             }
//         }
//     );


//     /*
//      * Auto-expand textarea.
//      */

//     input.addEventListener(
//         "input",
//         () => {

//             input.style.height =
//                 "auto";

//             input.style.height =
//                 `${Math.min(
//                     input.scrollHeight,
//                     120
//                 )}px`;
//         }
//     );
// }


// /* =========================================================
//    SEND USER MESSAGE
//    ========================================================= */

// async function sendUserMessage(message) {

//     if (!message || munaIsSending) {
//         return;
//     }


//     /*
//      * Check login.
//      */

//     const sessionToken =
//         getSessionToken();

//     if (!sessionToken) {

//         addMunaMessage(
//             "Please log in first so I can keep our conversation safe and private. 💚"
//         );

//         return;
//     }


//     /*
//      * Conversation must exist.
//      */

//     if (!munaConversationId) {

//         const savedConversationId =
//             sessionStorage.getItem(
//                 "muna_conversation_id"
//             );

//         if (savedConversationId) {

//             munaConversationId =
//                 savedConversationId;

//         } else {

//             addMunaMessage(
//                 "Let's start our conversation first. 💚 Choose how you're feeling above."
//             );

//             return;
//         }
//     }


//     /*
//      * Prevent duplicate sends.
//      */

//     munaIsSending = true;


//     /*
//      * Display user message immediately.
//      */

//     addUserMessage(message);


//     /*
//      * Show typing indicator.
//      */

//     showMunaTyping();


//     try {

//         const response =
//             await fetch(
//                 `${MUNA_API}/muna/chat`,
//                 {
//                     method: "POST",

//                     headers: {
//                         "Content-Type": "application/json"
//                     },

//                     body: JSON.stringify({

//                         session_token:
//                             sessionToken,

//                         conversation_id:
//                             munaConversationId,

//                         message:
//                             message
//                     })
//                 }
//             );


//         const data =
//             await response.json();

//         hideMunaTyping();


//         /*
//          * Backend error.
//          */

//         if (!response.ok || data.error) {

//             console.error(
//                 "Muna chat error:",
//                 data
//             );

//             addMunaMessage(
//                 "I'm sorry, I couldn't process that message right now. 💚 Please try again."
//             );

//             return;
//         }


//         /*
//          * Display Muna response.
//          */

//         if (
//             data.muna_message &&
//             data.muna_message.message
//         ) {

//             addMunaMessage(
//                 data.muna_message.message,
//                 data.muna_message.created_at
//             );
//         }


//         /*
//          * If a safety alert was created,
//          * show the support section.
//          */

//          if (
//     data.safety &&
//     data.safety.flagged
// ) {

//     showMunaSupportSection(
//         data.actions || {}
//     );
// }

//     } catch (error) {

//         hideMunaTyping();

//         console.error(
//             "Muna chat connection error:",
//             error
//         );

//         addMunaMessage(
//             "I'm having trouble connecting right now. 💚 Please try again in a moment."
//         );

//     } finally {

//         munaIsSending = false;

//         focusMunaInput();
//     }
// }


// /* =========================================================
//    =========================================================
//    CONVERSATION HISTORY
//    =========================================================
//    ========================================================= */


// /* =========================================================
//    SETUP HISTORY
//    ========================================================= */

// function setupMunaHistory() {

//     const historyButton =
//         document.getElementById(
//             "munaHistoryBtn"
//         );

//     const closeButton =
//         document.getElementById(
//             "closeMunaHistoryBtn"
//         );

//     const startNewButton =
//         document.getElementById(
//             "startNewMunaFromHistory"
//         );


//     /*
//      * Open history.
//      */

//     if (historyButton) {

//         historyButton.addEventListener(
//             "click",
//             () => {

//                 openMunaHistory();
//             }
//         );
//     }


//     /*
//      * Close history.
//      */

//     if (closeButton) {

//         closeButton.addEventListener(
//             "click",
//             () => {

//                 hideMunaHistory();
//             }
//         );
//     }


//     /*
//      * Start a new conversation from history.
//      */

//     if (startNewButton) {

//         startNewButton.addEventListener(
//             "click",
//             () => {

//                 hideMunaHistory();

//                 showMunaWelcome();
//             }
//         );
//     }
// }


// /* =========================================================
//    OPEN HISTORY
//    ========================================================= */

// async function openMunaHistory() {

//     const sessionToken =
//         getSessionToken();

//     /*
//      * History is private to logged-in users.
//      */

//     if (!sessionToken) {

//         alert(
//             "Please log in to view your previous conversations."
//         );

//         window.location.href =
//             "../login.html";

//         return;
//     }


//     const history =
//         document.getElementById(
//             "munaHistory"
//         );

//     const chat =
//         document.getElementById(
//             "munaChat"
//         );

//     const welcome =
//         document.getElementById(
//             "munaWelcome"
//         );


//     /*
//      * Show history.
//      */

//     if (history) {
//         history.style.display = "flex";
//     }

//     /*
//      * Hide current chat.
//      */

//     if (chat) {
//         chat.style.display = "none";
//     }

//     /*
//      * Hide welcome.
//      */

//     if (welcome) {
//         welcome.style.display = "none";
//     }


//     /*
//      * Load this user's conversations.
//      */

//     await loadMunaConversations(sessionToken);
// }


// /* =========================================================
//    HIDE HISTORY
//    ========================================================= */

// function hideMunaHistory() {

//     const history =
//         document.getElementById(
//             "munaHistory"
//         );

//     if (history) {
//         history.style.display = "none";
//     }
// }


// /* =========================================================
//    LOAD USER'S CONVERSATIONS
//    ========================================================= */

// async function loadMunaConversations(sessionToken) {

//     const loading =
//         document.getElementById(
//             "munaHistoryLoading"
//         );

//     const empty =
//         document.getElementById(
//             "munaHistoryEmpty"
//         );

//     const list =
//         document.getElementById(
//             "munaHistoryList"
//         );


//     if (!list) {
//         return;
//     }


//     /*
//      * Reset UI.
//      */

//     list.innerHTML = "";

//     if (empty) {
//         empty.style.display = "none";
//     }

//     if (loading) {
//         loading.style.display = "flex";
//     }


//     try {

//         /*
//          * The session token tells the backend
//          * which logged-in user is requesting history.
//          */

//         const response =
//             await fetch(
//                 `${MUNA_API}/muna/conversations?session_token=${encodeURIComponent(sessionToken)}`
//             );


//         const data =
//             await response.json();


//         if (loading) {
//             loading.style.display = "none";
//         }


//         if (!response.ok || data.error) {

//             console.error(
//                 "Muna history error:",
//                 data
//             );

//             showMunaHistoryEmpty(
//                 "Unable to load your conversations right now."
//             );

//             return;
//         }


//         /*
//          * Backend normally returns:
//          * { conversations: [...] }
//          */

//         const conversations =
//             Array.isArray(data)
//                 ? data
//                 : (
//                     Array.isArray(data.conversations)
//                         ? data.conversations
//                         : []
//                 );


//         if (conversations.length === 0) {

//             showMunaHistoryEmpty();

//             return;
//         }


//         /*
//          * Render conversations.
//          */

//         conversations.forEach(
//             conversation => {

//                 renderMunaConversationItem(
//                     conversation,
//                     list
//                 );
//             }
//         );

//     } catch (error) {

//         if (loading) {
//             loading.style.display = "none";
//         }

//         console.error(
//             "Muna history connection error:",
//             error
//         );

//         showMunaHistoryEmpty(
//             "I couldn't connect to your conversation history."
//         );
//     }
// }


// /* =========================================================
//    RENDER CONVERSATION ITEM
//    ========================================================= */

// function renderMunaConversationItem(
//     conversation,
//     list
// ) {

//     if (!conversation || !list) {
//         return;
//     }


//     const item =
//         document.createElement("button");

//     item.type = "button";

//     item.className =
//         "muna-history-item";


//     /*
//      * Conversation ID.
//      */

//     const conversationId =
//         conversation.id ||
//         conversation.conversation_id;


//     /*
//      * Mood.
//      */

//     const mood =
//         conversation.selected_mood ||
//         "other";

//     const moodData =
//         MUNA_MOODS[mood] ||
//         MUNA_MOODS.other;


//     /*
//      * Icon.
//      */

//     const icon =
//         document.createElement("div");

//     icon.className =
//         "history-mood-icon";

//     icon.textContent =
//         moodData.emoji;


//     /*
//      * Information wrapper.
//      */

//     const info =
//         document.createElement("div");

//     info.className =
//         "history-conversation-info";


//     /*
//      * Top row.
//      */

//     const top =
//         document.createElement("div");

//     top.className =
//         "history-conversation-top";


//     const moodLabel =
//         document.createElement("span");

//     moodLabel.className =
//         "history-conversation-mood";

//     moodLabel.textContent =
//         moodData.label;


//     const date =
//         document.createElement("span");

//     date.className =
//         "history-conversation-date";

//     date.textContent =
//         formatConversationDate(
//             conversation.last_message_at ||
//             conversation.started_at
//         );


//     top.appendChild(moodLabel);
//     top.appendChild(date);


//     /*
//      * Preview.
//      */

//     const preview =
//         document.createElement("div");

//     preview.className =
//         "history-conversation-preview";

//     preview.textContent =
//         conversation.preview ||
//         conversation.last_message ||
//         "Conversation with Muna";


//     info.appendChild(top);
//     info.appendChild(preview);


//     /*
//      * Arrow.
//      */

//     const arrow =
//         document.createElement("span");

//     arrow.className =
//         "history-conversation-arrow";

//     arrow.textContent =
//         "→";


//     item.appendChild(icon);
//     item.appendChild(info);
//     item.appendChild(arrow);


//     /*
//      * Open selected conversation.
//      */

//     item.addEventListener(
//         "click",
//         () => {

//             if (!conversationId) {

//                 console.error(
//                     "Conversation ID missing:",
//                     conversation
//                 );

//                 return;
//             }

//             openPreviousMunaConversation(
//                 conversationId
//             );
//         }
//     );


//     list.appendChild(item);
// }


// /* =========================================================
//    SHOW EMPTY HISTORY
//    ========================================================= */

// function showMunaHistoryEmpty(
//     message = null
// ) {

//     const empty =
//         document.getElementById(
//             "munaHistoryEmpty"
//         );

//     if (!empty) {
//         return;
//     }


//     const paragraph =
//         empty.querySelector("p");


//     if (paragraph) {

//         paragraph.textContent =
//             message ||
//             "When you talk with Muna, your conversations will appear here.";
//     }


//     empty.style.display =
//         "flex";
// }


// /* =========================================================
//    OPEN PREVIOUS CONVERSATION
//    ========================================================= */

// async function openPreviousMunaConversation(
//     conversationId
// ) {

//     const sessionToken =
//         getSessionToken();


//     if (!sessionToken) {

//         alert(
//             "Please log in to view this conversation."
//         );

//         window.location.href =
//             "../login.html";

//         return;
//     }


//     /*
//      * Store selected conversation.
//      */

//     munaConversationId =
//         conversationId;

//     sessionStorage.setItem(
//         "muna_conversation_id",
//         conversationId
//     );


//     /*
//      * Hide history.
//      */

//     hideMunaHistory();


//     /*
//      * Hide welcome.
//      */

//     const welcome =
//         document.getElementById(
//             "munaWelcome"
//         );

//     if (welcome) {
//         welcome.style.display = "none";
//     }


//     /*
//      * Show chat.
//      */

//     const chat =
//         document.getElementById(
//             "munaChat"
//         );

//     if (chat) {
//         chat.style.display = "flex";
//     }


//     /*
//      * Clear current messages.
//      */

//     clearMessages();


//     /*
//      * Show loading indicator.
//      */

//     showMunaTyping();


//     try {

//         const response =
//             await fetch(
//                 `${MUNA_API}/muna/conversation/${encodeURIComponent(conversationId)}?session_token=${encodeURIComponent(sessionToken)}`
//             );


//         const data =
//             await response.json();


//         hideMunaTyping();


//         if (!response.ok || data.error) {

//             console.error(
//                 "Muna conversation error:",
//                 data
//             );

//             addMunaMessage(
//                 "I couldn't open that conversation right now. 💚 Please try again."
//             );

//             return;
//         }


//         /*
//          * Backend may return:
//          *
//          * {
//          *   conversation: {...},
//          *   messages: [...]
//          * }
//          */

//         const conversation =
//             data.conversation ||
//             null;

//         const messages =
//             Array.isArray(data.messages)
//                 ? data.messages
//                 : [];


//         /*
//          * Restore selected mood.
//          */

//         if (
//             conversation &&
//             conversation.selected_mood
//         ) {

//             restoreMoodFromConversation(
//                 conversation.selected_mood
//             );
//         }


//         /*
//          * Render every saved message.
//          */

//         messages.forEach(
//             message => {

//                 if (
//                     !message ||
//                     !message.message
//                 ) {
//                     return;
//                 }


//                 if (
//                     message.sender_type ===
//                     "user"
//                 ) {

//                     addUserMessage(
//     message.message,
//     message.created_at,
//     message.id
// );

//                 } else {

//                     addMunaMessage(
//     message.message,
//     message.created_at,
//     message.id
// );

// const row = document.createElement("div");
// if (messageId) {
//     row.dataset.messageId = messageId;
// }
//                 }
//             }
//         );


//         /*
//          * If there are no messages.
//          */

//         if (messages.length === 0) {

//             addMunaMessage(
//                 "This conversation doesn't contain any messages yet. 💚"
//             );
//         }


//         focusMunaInput();

//         scrollMessagesToBottom();

//     } catch (error) {

//         hideMunaTyping();

//         console.error(
//             "Muna previous conversation error:",
//             error
//         );

//         addMunaMessage(
//             "I couldn't connect to your previous conversation. 💚 Please try again."
//         );
//     }
// }


// /* =========================================================
//    RESTORE MOOD
//    ========================================================= */

// function restoreMoodFromConversation(mood) {

//     const moodData =
//         MUNA_MOODS[mood] ||
//         MUNA_MOODS.other;


//     /*
//      * Save mood.
//      */

//     sessionStorage.setItem(
//         "muna_selected_mood",
//         mood
//     );

//     sessionStorage.setItem(
//         "muna_selected_mood_label",
//         moodData.label
//     );

//     sessionStorage.setItem(
//         "muna_selected_mood_emoji",
//         moodData.emoji
//     );


//     /*
//      * Update context.
//      */

//     updateMoodDisplay(
//         moodData
//     );


//     /*
//      * Mark matching mood button.
//      */

//     document
//         .querySelectorAll(
//             ".mood-option"
//         )
//         .forEach(button => {

//             button.classList.remove(
//                 "selected"
//             );

//             if (
//                 button.dataset.mood ===
//                 mood
//             ) {

//                 button.classList.add(
//                     "selected"
//                 );
//             }
//         });
// }


// /* =========================================================
//    START NEW CONVERSATION FROM HISTORY
//    ========================================================= */

// function showMunaWelcome() {

//     const history =
//         document.getElementById(
//             "munaHistory"
//         );

//     const chat =
//         document.getElementById(
//             "munaChat"
//         );

//     const welcome =
//         document.getElementById(
//             "munaWelcome"
//         );


//     if (history) {
//         history.style.display = "none";
//     }

//     if (chat) {
//         chat.style.display = "none";
//     }

//     if (welcome) {
//         welcome.style.display = "block";
//     }


//     /*
//      * Do not delete old conversation.
//      */

//     munaConversationId = null;

//     sessionStorage.removeItem(
//         "muna_conversation_id"
//     );

//     sessionStorage.removeItem(
//         "muna_selected_mood"
//     );

//     sessionStorage.removeItem(
//         "muna_selected_mood_label"
//     );

//     sessionStorage.removeItem(
//         "muna_selected_mood_emoji"
//     );


//     clearMessages();


//     /*
//      * Reset mood buttons.
//      */

//     document
//         .querySelectorAll(
//             ".mood-option"
//         )
//         .forEach(button => {

//             button.classList.remove(
//                 "selected"
//             );
//         });
// }


// /* =========================================================
//    SUPPORT SECTION
//    ========================================================= */
// function showMunaSupportSection(actions = {}) {

//     const section =
//         document.getElementById(
//             "munaSupportSection"
//         );

//     if (!section) {
//         return;
//     }

//     const toolkitLink =
//         document.getElementById(
//             "munaToolkitLink"
//         );

//     const mentorLink =
//         document.getElementById(
//             "munaMentorLink"
//         );

//     /*
//      * Emergency support card.
//      * This will be created only for
//      * critical/high safety situations.
//      */

//     let emergencyCard =
//         document.getElementById(
//             "munaEmergencyLink"
//         );

//     if (
//         actions.emergency &&
//         !emergencyCard
//     ) {

//         emergencyCard =
//             document.createElement("a");

//         emergencyCard.href = "#";
//         emergencyCard.id =
//             "munaEmergencyLink";

//         emergencyCard.className =
//             "support-card emergency-support-card";

//         emergencyCard.innerHTML = `
//             <div class="support-card-icon">
//                 🆘
//             </div>

//             <div>
//                 <h3>Get Immediate Help</h3>

//                 <p>
//                     If you may be in immediate danger,
//                     contact emergency services or go
//                     to the nearest emergency department.
//                 </p>
//             </div>

//             <span class="support-arrow">→</span>
//         `;

//         emergencyCard.addEventListener(
//             "click",
//             event => {

//                 event.preventDefault();

//                 alert(
//                     "If you are in immediate danger or think you may hurt yourself, please contact your local emergency service or go to the nearest emergency department now. If possible, stay with someone you trust."
//                 );
//             }
//         );

//         const supportGrid =
//             section.querySelector(
//                 ".support-grid"
//             );

//         if (supportGrid) {

//             supportGrid.insertBefore(
//                 emergencyCard,
//                 supportGrid.firstChild
//             );
//         }
//     }


//     /*
//      * Show / hide Toolkit.
//      */

//     if (toolkitLink) {

//         toolkitLink.style.display =
//             actions.toolkit
//                 ? "flex"
//                 : "none";
//     }


//     /*
//      * Show / hide Mentor.
//      */

//     if (mentorLink) {

//         mentorLink.style.display =
//             actions.mentor
//                 ? "flex"
//                 : "none";
//     }


//     /*
//      * Show the complete support section.
//      */

//     section.style.display =
//         "block";


//     /*
//      * Move the user toward
//      * the support options.
//      */

//     setTimeout(() => {

//         section.scrollIntoView({
//             behavior: "smooth",
//             block: "nearest"
//         });

//     }, 100);
// }

// /* =========================================================
//    TYPING INDICATOR
//    ========================================================= */

// function showMunaTyping() {

//     const typing =
//         document.getElementById(
//             "munaTyping"
//         );

//     if (!typing) {
//         return;
//     }

//     typing.style.display =
//         "flex";

//     scrollMessagesToBottom();
// }


// function hideMunaTyping() {

//     const typing =
//         document.getElementById(
//             "munaTyping"
//         );

//     if (!typing) {
//         return;
//     }

//     typing.style.display =
//         "none";
// }


// /* =========================================================
//    FOCUS INPUT
//    ========================================================= */

// function focusMunaInput() {

//     const input =
//         document.getElementById(
//             "munaMessageInput"
//         );

//     if (!input) {
//         return;
//     }

//     setTimeout(() => {

//         input.focus();

//     }, 150);
// }


// /* =========================================================
//    SCROLL
//    ========================================================= */

// function scrollMessagesToBottom() {

//     const messages =
//         document.getElementById(
//             "munaMessages"
//         );

//     if (!messages) {
//         return;
//     }

//     setTimeout(() => {

//         messages.scrollTop =
//             messages.scrollHeight;

//     }, 50);
// }


// /* =========================================================
//    FORMAT MESSAGE TIME
//    ========================================================= */

// function formatMessageTime(
//     value
// ) {

//     if (!value) {
//         return "";
//     }


//     const date =
//         new Date(
//             normalizeDateString(value)
//         );


//     if (Number.isNaN(date.getTime())) {
//         return "";
//     }


//     return date.toLocaleTimeString(
//         [],
//         {
//             hour: "2-digit",
//             minute: "2-digit"
//         }
//     );
// }


// /* =========================================================
//    FORMAT CONVERSATION DATE
//    ========================================================= */

// function formatConversationDate(
//     value
// ) {

//     if (!value) {
//         return "";
//     }


//     const date =
//         new Date(
//             normalizeDateString(value)
//         );


//     if (Number.isNaN(date.getTime())) {
//         return "";
//     }


//     const now =
//         new Date();


//     const today =
//         new Date(
//             now.getFullYear(),
//             now.getMonth(),
//             now.getDate()
//         );


//     const conversationDay =
//         new Date(
//             date.getFullYear(),
//             date.getMonth(),
//             date.getDate()
//         );


//     const difference =
//         today.getTime() -
//         conversationDay.getTime();


//     const oneDay =
//         24 * 60 * 60 * 1000;


//     if (difference === 0) {

//         return "Today";
//     }


//     if (difference === oneDay) {

//         return "Yesterday";
//     }


//     return date.toLocaleDateString(
//         [],
//         {
//             day: "2-digit",
//             month: "short",
//             year:
//                 date.getFullYear() ===
//                 now.getFullYear()
//                     ? undefined
//                     : "numeric"
//         }
//     );
// }


// /* =========================================================
//    NORMALIZE DATABASE DATE
//    ========================================================= */

// function normalizeDateString(
//     value
// ) {

//     if (
//         typeof value !==
//         "string"
//     ) {

//         return value;
//     }


//     /*
//      * MySQL commonly returns:
//      *
//      * 2026-09-25 12:30:00
//      *
//      * JavaScript handles the ISO version more
//      * consistently.
//      */

//     if (
//         /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/
//             .test(value)
//     ) {

//         return value.replace(
//             " ",
//             "T"
//         );
//     }


//     return value;
// }



/* =========================================================
   MINDSPEAK — MUNA CHATBOT
   Backend-connected version
   User-specific conversation history
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeMuna();
});


/* =========================================================
   CONFIGURATION
   ========================================================= */

const MUNA_API = "http://127.0.0.1:8000";

let munaConversationId = null;
let munaIsSending = false;


/* =========================================================
   MUNA MOODS
   ========================================================= */

const MUNA_MOODS = {

    happy: {
        label: "Happy",
        emoji: "😊",
        opening:
            "I love hearing that you're feeling happy. 💚 What's been making today feel good?"
    },

    calm: {
        label: "Calm",
        emoji: "😌",
        opening:
            "It sounds like you're feeling calm today. 🌱 What's on your mind?"
    },

    anxious: {
        label: "Anxious",
        emoji: "😟",
        opening:
            "I see you're feeling anxious. 💚 I'm here with you. What's been making you feel anxious today?"
    },

    sad: {
        label: "Sad",
        emoji: "😔",
        opening:
            "I'm sorry you're feeling sad. You don't have to pretend to be okay with me. 💚 What's been weighing on you?"
    },

    stressed: {
        label: "Stressed",
        emoji: "😣",
        opening:
            "It sounds like things are feeling pretty overwhelming right now. 💚 What's been stressing you out the most?"
    },

    tired: {
        label: "Tired",
        emoji: "😴",
        opening:
            "You sound like you could really use a little breathing room. 🌱 What's been leaving you feeling so tired?"
    },

    lonely: {
        label: "Lonely",
        emoji: "😞",
        opening:
            "I'm glad you decided to talk to me. 💚 Feeling lonely can be really heavy. What's been making you feel alone lately?"
    },

    angry: {
        label: "Angry",
        emoji: "😤",
        opening:
            "It sounds like something has really upset you. 💚 You can tell me what happened. I'm listening."
    },

    other: {
        label: "Here to listen",
        emoji: "💭",
        opening:
            "That's completely okay. You don't have to put a label on what you're feeling. 💚 Just tell me what's on your mind."
    }
};


/* =========================================================
   INITIALIZE
   ========================================================= */

function initializeMuna() {

    setupMoodButtons();
    setupSomethingElseButton();
    setupNormalConversationButton();
    setupChangeMoodButton();
    setupSuggestionButtons();
    setupChatForm();

    /* Conversation history */
    setupMunaHistory();

    /*
     * If the user already has a conversation stored
     * in this browser session, keep its ID available.
     */

    const savedConversationId =
        sessionStorage.getItem("muna_conversation_id");

    if (savedConversationId) {
        munaConversationId = savedConversationId;
    }
}


/* =========================================================
   GET SESSION TOKEN
   ========================================================= */

function getSessionToken() {

    return localStorage.getItem("session_token");
}


/* =========================================================
   CHECK LOGIN
   ========================================================= */

function isMunaLoggedIn() {

    const token = getSessionToken();

    return Boolean(token);
}


/* =========================================================
   MOOD BUTTONS
   ========================================================= */

function setupMoodButtons() {

    const buttons =
        document.querySelectorAll(
            ".mood-option[data-mood]"
        );

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            const mood =
                button.dataset.mood;

            if (!mood || !MUNA_MOODS[mood]) {
                return;
            }

            buttons.forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            startMunaConversation(mood);
        });
    });
}


/* =========================================================
   SOMETHING ELSE
   ========================================================= */

function setupSomethingElseButton() {

    const button =
        document.getElementById("somethingElseBtn");

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        startMunaConversation("other");
    });
}


/* =========================================================
   TALK NORMALLY
   ========================================================= */

function setupNormalConversationButton() {

    const button =
        document.getElementById("talkNormallyBtn");

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        startMunaConversation("other");
    });
}


/* =========================================================
   START MUNA CONVERSATION
   ========================================================= */

async function startMunaConversation(mood) {

    const moodData =
        MUNA_MOODS[mood] || MUNA_MOODS.other;

    const sessionToken =
        getSessionToken();

    /*
     * Muna requires a logged-in user.
     */

    if (!sessionToken) {

        alert(
            "Please log in to talk with Muna and save your conversation."
        );

        window.location.href =
            "../login.html";

        return;
    }


    /*
     * Save selected mood locally.
     */

    sessionStorage.setItem(
        "muna_selected_mood",
        mood
    );

    sessionStorage.setItem(
        "muna_selected_mood_label",
        moodData.label
    );

    sessionStorage.setItem(
        "muna_selected_mood_emoji",
        moodData.emoji
    );


    /*
     * Hide history if it is open.
     */

    hideMunaHistory();


    /*
     * Hide welcome screen.
     */

    const welcome =
        document.getElementById("munaWelcome");

    if (welcome) {
        welcome.style.display = "none";
    }


    /*
     * Show chat.
     */

    const chat =
        document.getElementById("munaChat");

    if (chat) {
        chat.style.display = "flex";
    }


    /*
     * Update mood display.
     */

    updateMoodDisplay(moodData);


    /*
     * Clear visible messages.
     */

    clearMessages();


    /*
     * Show typing while backend creates
     * the conversation.
     */

    showMunaTyping();


    try {

        const response =
            await fetch(
                `${MUNA_API}/muna/start`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        session_token: sessionToken,
                        selected_mood: mood
                    })
                }
            );


        const data =
            await response.json();

        hideMunaTyping();


        /*
         * Backend error.
         */

        if (!response.ok || data.error) {

            console.error(
                "Muna start error:",
                data
            );

            addMunaMessage(
                "I'm having a little trouble connecting right now. 💚 Please try again in a moment."
            );

            return;
        }


        /*
         * Save conversation ID.
         */

        munaConversationId =
            data.conversation_id;

        sessionStorage.setItem(
            "muna_conversation_id",
            munaConversationId
        );


        /*
         * Display opening message.
         */

        if (
            data.message &&
            data.message.message
        ) {

            addMunaMessage(
                data.message.message,
                data.message.created_at,
                data.message.id
            );

        } else {

            addMunaMessage(
                moodData.opening
            );
        }


        focusMunaInput();

        scrollMessagesToBottom();

    } catch (error) {

        hideMunaTyping();

        console.error(
            "Muna connection error:",
            error
        );

        addMunaMessage(
            "I couldn't connect to my support system right now. 💚 Please make sure the MindSpeak server is running and try again."
        );
    }
}


/* =========================================================
   UPDATE MOOD DISPLAY
   ========================================================= */

function updateMoodDisplay(moodData) {

    const moodText =
        document.getElementById(
            "selectedMoodText"
        );

    if (!moodText) {
        return;
    }

    moodText.textContent =
        `${moodData.emoji} ${moodData.label}`;
}


/* =========================================================
   ADD MUNA MESSAGE
   ========================================================= */

function addMunaMessage(
    message,
    createdAt = null,
    messageId = null
) {

    const messages =
        document.getElementById(
            "munaMessages"
        );

    if (!messages) {
        return null;
    }

    const row =
        document.createElement("div");

    row.className =
        "message-row muna";

    if (messageId !== null && messageId !== undefined) {
        row.dataset.messageId = messageId;
    }


    /*
     * Muna avatar.
     */

    const avatar =
        document.createElement("img");

    avatar.src =
        "../images/chatbot/Muna.jpg";

    avatar.alt =
        "Muna";

    avatar.className =
        "message-avatar";


    /*
     * Message bubble.
     */

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message;


    /*
     * Build message.
     */

    row.appendChild(avatar);
    row.appendChild(bubble);


    /*
     * Optional timestamp.
     */

    if (createdAt) {

        const time =
            document.createElement("span");

        time.className =
            "message-time";

        time.textContent =
            formatMessageTime(createdAt);

        row.appendChild(time);
    }


    messages.appendChild(row);

    scrollMessagesToBottom();

    return row;
}


/* =========================================================
   ADD USER MESSAGE
   ========================================================= */

function addUserMessage(
    message,
    createdAt = null,
    messageId = null
) {

    const messages =
        document.getElementById(
            "munaMessages"
        );

    if (!messages) {
        return null;
    }

    const row =
        document.createElement("div");

    row.className =
        "message-row user";

    if (messageId !== null && messageId !== undefined) {
        row.dataset.messageId = messageId;
    }


    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble";

    bubble.textContent =
        message;


    row.appendChild(bubble);


    /*
     * Optional timestamp.
     */

    if (createdAt) {

        const time =
            document.createElement("span");

        time.className =
            "message-time";

        time.textContent =
            formatMessageTime(createdAt);

        row.appendChild(time);
    }


    messages.appendChild(row);

    scrollMessagesToBottom();

    return row;
}


/* =========================================================
   CLEAR MESSAGES
   ========================================================= */

function clearMessages() {

    const messages =
        document.getElementById(
            "munaMessages"
        );

    if (!messages) {
        return;
    }

    messages.innerHTML = "";
}


/* =========================================================
   CHANGE MOOD
   ========================================================= */

function setupChangeMoodButton() {

    const button =
        document.getElementById(
            "changeMoodBtn"
        );

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {

        const chat =
            document.getElementById(
                "munaChat"
            );

        const welcome =
            document.getElementById(
                "munaWelcome"
            );


        /*
         * Hide chat.
         */

        if (chat) {
            chat.style.display = "none";
        }


        /*
         * Show mood selection.
         */

        if (welcome) {
            welcome.style.display = "block";
        }


        /*
         * Clear visible messages.
         */

        clearMessages();


        /*
         * Reset selected mood.
         */

        document
            .querySelectorAll(
                ".mood-option"
            )
            .forEach(button => {

                button.classList.remove(
                    "selected"
                );

            });


        /*
         * The old conversation remains in the database
         * and can be accessed from History.
         */

        munaConversationId = null;

        sessionStorage.removeItem(
            "muna_conversation_id"
        );

        sessionStorage.removeItem(
            "muna_selected_mood"
        );

        sessionStorage.removeItem(
            "muna_selected_mood_label"
        );

        sessionStorage.removeItem(
            "muna_selected_mood_emoji"
        );
    });
}


/* =========================================================
   SUGGESTION BUTTONS
   ========================================================= */

function setupSuggestionButtons() {

    const buttons =
        document.querySelectorAll(
            ".suggestion-btn[data-message]"
        );

    buttons.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const message =
                    button.dataset.message;

                if (!message) {
                    return;
                }

                sendUserMessage(message);
            }
        );
    });
}


/* =========================================================
   CHAT FORM
   ========================================================= */

function setupChatForm() {

    const form =
        document.getElementById(
            "munaChatForm"
        );

    const input =
        document.getElementById(
            "munaMessageInput"
        );

    if (!form || !input) {
        return;
    }


    /*
     * Submit message.
     */

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            const message =
                input.value.trim();

            if (!message) {
                return;
            }

            sendUserMessage(message);

            input.value = "";

            input.style.height = "auto";
        }
    );


    /*
     * Enter = send
     * Shift + Enter = new line
     */

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                form.requestSubmit();
            }
        }
    );


    /*
     * Auto-expand textarea.
     */

    input.addEventListener(
        "input",
        () => {

            input.style.height =
                "auto";

            input.style.height =
                `${Math.min(
                    input.scrollHeight,
                    120
                )}px`;
        }
    );
}


/* =========================================================
   SEND USER MESSAGE
   ========================================================= */

async function sendUserMessage(message) {

    if (!message || munaIsSending) {
        return;
    }


    /*
     * Check login.
     */

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        addMunaMessage(
            "Please log in first so I can keep our conversation safe and private. 💚"
        );

        return;
    }


    /*
     * Conversation must exist.
     */

    if (!munaConversationId) {

        const savedConversationId =
            sessionStorage.getItem(
                "muna_conversation_id"
            );

        if (savedConversationId) {

            munaConversationId =
                savedConversationId;

        } else {

            addMunaMessage(
                "Let's start our conversation first. 💚 Choose how you're feeling above."
            );

            return;
        }
    }


    /*
     * Prevent duplicate sends.
     */

    munaIsSending = true;


    /*
     * Display user message immediately.
     */

    const userRow =
        addUserMessage(message);


    /*
     * Show typing indicator.
     */

    showMunaTyping();


    try {

        const response =
            await fetch(
                `${MUNA_API}/muna/chat`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        conversation_id:
                            munaConversationId,

                        message:
                            message
                    })
                }
            );


        const data =
            await response.json();

        hideMunaTyping();


        /*
         * Backend error.
         */

        if (!response.ok || data.error) {

            console.error(
                "Muna chat error:",
                data
            );

            addMunaMessage(
                "I'm sorry, I couldn't process that message right now. 💚 Please try again."
            );

            return;
        }


        /*
         * Attach the real database ID to the
         * user message that was displayed immediately.
         */

        if (
            userRow &&
            data.user_message &&
            data.user_message.id
        ) {

            userRow.dataset.messageId =
                data.user_message.id;
        }


        /*
         * Display Muna response.
         */

        if (
            data.muna_message &&
            data.muna_message.message
        ) {

            addMunaMessage(
                data.muna_message.message,
                data.muna_message.created_at,
                data.muna_message.id
            );
        }


        /*
         * If a safety alert was created,
         * show the support section.
         */

        if (
            data.safety &&
            data.safety.flagged
        ) {

            showMunaSupportSection(
                data.actions || {}
            );
        }

    } catch (error) {

        hideMunaTyping();

        console.error(
            "Muna chat connection error:",
            error
        );

        addMunaMessage(
            "I'm having trouble connecting right now. 💚 Please try again in a moment."
        );

    } finally {

        munaIsSending = false;

        focusMunaInput();
    }
}

/* =========================================================
   TYPING INDICATOR
   ========================================================= */

function showMunaTyping() {

    const messages =
        document.getElementById(
            "munaMessages"
        );

    if (!messages) {
        return;
    }


    /*
     * Prevent duplicate typing indicators.
     */

    if (
        document.getElementById(
            "munaTypingIndicator"
        )
    ) {
        return;
    }


    const row =
        document.createElement("div");

    row.id =
        "munaTypingIndicator";

    row.className =
        "message-row muna typing-row";


    /*
     * Avatar.
     */

    const avatar =
        document.createElement("img");

    avatar.src =
        "../images/chatbot/Muna.jpg";

    avatar.alt =
        "Muna";

    avatar.className =
        "message-avatar";


    /*
     * Typing bubble.
     */

    const bubble =
        document.createElement("div");

    bubble.className =
        "message-bubble typing-bubble";


    const dot1 =
        document.createElement("span");

    const dot2 =
        document.createElement("span");

    const dot3 =
        document.createElement("span");


    dot1.className =
        "typing-dot";

    dot2.className =
        "typing-dot";

    dot3.className =
        "typing-dot";


    bubble.appendChild(dot1);
    bubble.appendChild(dot2);
    bubble.appendChild(dot3);


    row.appendChild(avatar);
    row.appendChild(bubble);

    messages.appendChild(row);

    scrollMessagesToBottom();
}


/* =========================================================
   HIDE TYPING INDICATOR
   ========================================================= */

function hideMunaTyping() {

    const typing =
        document.getElementById(
            "munaTypingIndicator"
        );

    if (typing) {
        typing.remove();
    }
}


/* =========================================================
   FOCUS MUNA INPUT
   ========================================================= */

function focusMunaInput() {

    const input =
        document.getElementById(
            "munaMessageInput"
        );

    if (!input) {
        return;
    }

    setTimeout(() => {

        input.focus();

    }, 100);
}


/* =========================================================
   SCROLL MESSAGES TO BOTTOM
   ========================================================= */

function scrollMessagesToBottom() {

    const messages =
        document.getElementById(
            "munaMessages"
        );

    if (!messages) {
        return;
    }

    setTimeout(() => {

        messages.scrollTop =
            messages.scrollHeight;

    }, 50);
}


/* =========================================================
   FORMAT MESSAGE TIME
   ========================================================= */

function formatMessageTime(createdAt) {

    if (!createdAt) {
        return "";
    }

    const date =
        new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toLocaleTimeString(
        [],
        {
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}


/* =========================================================
   MUNA CONVERSATION HISTORY
   ========================================================= */

function setupMunaHistory() {

    const historyButton =
        document.getElementById(
            "munaHistoryBtn"
        );

    const closeButton =
        document.getElementById(
            "closeMunaHistory"
        );

    const historyBackButton =
        document.getElementById(
            "munaHistoryBackBtn"
        );


    /*
     * History button.
     */

    if (historyButton) {

        historyButton.addEventListener(
            "click",
            () => {

                showMunaHistory();

            }
        );
    }


    /*
     * Close button.
     */

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            () => {

                hideMunaHistory();

            }
        );
    }


    /*
     * Optional back button.
     */

    if (historyBackButton) {

        historyBackButton.addEventListener(
            "click",
            () => {

                hideMunaHistory();

            }
        );
    }
}


/* =========================================================
   SHOW HISTORY
   ========================================================= */

async function showMunaHistory() {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        alert(
            "Please log in to view your Muna conversations."
        );

        window.location.href =
            "../login.html";

        return;
    }


    const history =
        document.getElementById(
            "munaHistory"
        );

    const chat =
        document.getElementById(
            "munaChat"
        );

    const welcome =
        document.getElementById(
            "munaWelcome"
        );


    if (history) {
        history.style.display = "flex";
    }

    if (chat) {
        chat.style.display = "none";
    }

    if (welcome) {
        welcome.style.display = "none";
    }


    await loadMunaConversationHistory();
}


/* =========================================================
   HIDE HISTORY
   ========================================================= */

function hideMunaHistory() {

    const history =
        document.getElementById(
            "munaHistory"
        );

    if (history) {
        history.style.display = "none";
    }
}


/* =========================================================
   LOAD CONVERSATION HISTORY
   ========================================================= */

async function loadMunaConversationHistory() {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {
        return;
    }


    const list =
        document.getElementById(
            "munaHistoryList"
        );

    if (!list) {
        return;
    }


    /*
     * Clear old list.
     */

    list.innerHTML = "";


    /*
     * Hide empty state while loading.
     */

    const empty =
        document.getElementById(
            "munaHistoryEmpty"
        );

    if (empty) {
        empty.style.display = "none";
    }


    /*
     * Loading message.
     */

    const loading =
        document.createElement("div");

    loading.className =
        "muna-history-loading";

    loading.textContent =
        "Loading your conversations...";

    list.appendChild(loading);


    try {

        const response =
            await fetch(
                `${MUNA_API}/muna/conversations?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        /*
         * Remove loading message.
         */

        list.innerHTML = "";


        if (
            !response.ok ||
            data.error
        ) {

            console.error(
                "Muna history error:",
                data
            );

            showMunaHistoryEmpty(
                "I couldn't load your conversations right now."
            );

            return;
        }


        const conversations =
            Array.isArray(
                data.conversations
            )
                ? data.conversations
                : [];


        /*
         * No conversations.
         */

        if (
            conversations.length === 0
        ) {

            showMunaHistoryEmpty();

            return;
        }


        /*
         * Render conversations.
         */

        conversations.forEach(
            conversation => {

                addMunaHistoryItem(
                    conversation
                );

            }
        );

    } catch (error) {

        console.error(
            "Muna history connection error:",
            error
        );

        list.innerHTML = "";

        showMunaHistoryEmpty(
            "I couldn't connect to your conversation history."
        );
    }
}


/* =========================================================
   ADD HISTORY ITEM
   ========================================================= */

function addMunaHistoryItem(
    conversation
) {

    const list =
        document.getElementById(
            "munaHistoryList"
        );

    if (!list) {
        return;
    }


    if (
        !conversation ||
        !conversation.id
    ) {
        return;
    }


    const item =
        document.createElement("div");

    item.className =
        "muna-history-item";

    item.dataset.conversationId =
        conversation.id;


    /*
     * Main clickable content.
     */

    const content =
        document.createElement("div");

    content.className =
        "muna-history-content";


    /*
     * Mood.
     */

    const mood =
        conversation.selected_mood ||
        "other";

    const moodData =
        MUNA_MOODS[mood] ||
        MUNA_MOODS.other;


    const moodTitle =
        document.createElement("h3");

    moodTitle.textContent =
        `${moodData.emoji} ${moodData.label}`;


    /*
     * Date.
     */

    const date =
        document.createElement("p");

    date.className =
        "muna-history-date";

    date.textContent =
        formatConversationDate(
            conversation.last_message_at ||
            conversation.started_at
        );


    content.appendChild(
        moodTitle
    );

    content.appendChild(
        date
    );


    /*
     * Open conversation.
     */

    content.addEventListener(
        "click",
        () => {

            const conversationId =
                conversation.id;

            if (!conversationId) {

                console.error(
                    "Conversation ID missing:",
                    conversation
                );

                return;
            }

            openPreviousMunaConversation(
                conversationId
            );
        }
    );


    /*
     * Delete conversation button.
     *
     * This uses the backend conversation-delete
     * endpoint that already exists.
     */

    const deleteButton =
        document.createElement("button");

    deleteButton.type =
        "button";

    deleteButton.className =
        "muna-delete-conversation";

    deleteButton.textContent =
        "Delete";

    deleteButton.title =
        "Delete this conversation";


    deleteButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();

            deleteMunaConversation(
                conversation.id
            );
        }
    );


    item.appendChild(
        content
    );

    item.appendChild(
        deleteButton
    );


    list.appendChild(item);
}


/* =========================================================
   FORMAT CONVERSATION DATE
   ========================================================= */

function formatConversationDate(
    dateValue
) {

    if (!dateValue) {
        return "No date available";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "No date available";
    }


    return date.toLocaleDateString(
        [],
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* =========================================================
   SHOW EMPTY HISTORY
   ========================================================= */

function showMunaHistoryEmpty(
    message = null
) {

    const empty =
        document.getElementById(
            "munaHistoryEmpty"
        );

    if (!empty) {
        return;
    }


    const paragraph =
        empty.querySelector("p");


    if (paragraph) {

        paragraph.textContent =
            message ||
            "When you talk with Muna, your conversations will appear here.";
    }


    empty.style.display =
        "flex";
}


/* =========================================================
   OPEN PREVIOUS CONVERSATION
   ========================================================= */

async function openPreviousMunaConversation(
    conversationId
) {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        alert(
            "Please log in to view this conversation."
        );

        window.location.href =
            "../login.html";

        return;
    }


    /*
     * Store selected conversation.
     */

    munaConversationId =
        conversationId;

    sessionStorage.setItem(
        "muna_conversation_id",
        conversationId
    );


    /*
     * Hide history.
     */

    hideMunaHistory();


    /*
     * Hide welcome.
     */

    const welcome =
        document.getElementById(
            "munaWelcome"
        );

    if (welcome) {
        welcome.style.display = "none";
    }


    /*
     * Show chat.
     */

    const chat =
        document.getElementById(
            "munaChat"
        );

    if (chat) {
        chat.style.display = "flex";
    }


    /*
     * Clear current messages.
     */

    clearMessages();


    /*
     * Show loading indicator.
     */

    showMunaTyping();


    try {

        const response =
            await fetch(
                `${MUNA_API}/muna/conversation/${encodeURIComponent(conversationId)}?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        hideMunaTyping();


        if (
            !response.ok ||
            data.error
        ) {

            console.error(
                "Muna conversation error:",
                data
            );

            addMunaMessage(
                "I couldn't open that conversation right now. 💚 Please try again."
            );

            return;
        }


        /*
         * Backend returns:
         *
         * {
         *   conversation: {...},
         *   messages: [...]
         * }
         */

        const conversation =
            data.conversation ||
            null;

        const messages =
            Array.isArray(
                data.messages
            )
                ? data.messages
                : [];


        /*
         * Restore selected mood.
         */

        if (
            conversation &&
            conversation.selected_mood
        ) {

            restoreMoodFromConversation(
                conversation.selected_mood
            );
        }


        /*
         * Render every saved message.
         *
         * IMPORTANT:
         * message.id is passed as the third argument.
         * This is required for future individual
         * message deletion.
         */

        messages.forEach(
            message => {

                if (
                    !message ||
                    !message.message
                ) {
                    return;
                }


                if (
                    message.sender_type ===
                    "user"
                ) {

                    addUserMessage(
                        message.message,
                        message.created_at,
                        message.id
                    );

                } else {

                    addMunaMessage(
                        message.message,
                        message.created_at,
                        message.id
                    );
                }
            }
        );


        /*
         * If there are no messages.
         */

        if (
            messages.length === 0
        ) {

            addMunaMessage(
                "This conversation doesn't contain any messages yet. 💚"
            );
        }


        focusMunaInput();

        scrollMessagesToBottom();

    } catch (error) {

        hideMunaTyping();

        console.error(
            "Muna previous conversation error:",
            error
        );

        addMunaMessage(
            "I couldn't connect to your previous conversation. 💚 Please try again."
        );
    }
}


/* =========================================================
   RESTORE MOOD
   ========================================================= */

function restoreMoodFromConversation(
    mood
) {

    const moodData =
        MUNA_MOODS[mood] ||
        MUNA_MOODS.other;


    /*
     * Save mood.
     */

    sessionStorage.setItem(
        "muna_selected_mood",
        mood
    );

    sessionStorage.setItem(
        "muna_selected_mood_label",
        moodData.label
    );

    sessionStorage.setItem(
        "muna_selected_mood_emoji",
        moodData.emoji
    );


    /*
     * Update context.
     */

    updateMoodDisplay(
        moodData
    );


    /*
     * Mark matching mood button.
     */

    document
        .querySelectorAll(
            ".mood-option"
        )
        .forEach(button => {

            button.classList.remove(
                "selected"
            );

            if (
                button.dataset.mood ===
                mood
            ) {

                button.classList.add(
                    "selected"
                );
            }
        });
}


/* =========================================================
   START NEW CONVERSATION FROM HISTORY
   ========================================================= */

function showMunaWelcome() {

    const history =
        document.getElementById(
            "munaHistory"
        );

    const chat =
        document.getElementById(
            "munaChat"
        );

    const welcome =
        document.getElementById(
            "munaWelcome"
        );


    if (history) {
        history.style.display = "none";
    }

    if (chat) {
        chat.style.display = "none";
    }

    if (welcome) {
        welcome.style.display = "block";
    }


    /*
     * Clear current conversation selection.
     */

    munaConversationId = null;

    sessionStorage.removeItem(
        "muna_conversation_id"
    );


    /*
     * Clear visible messages.
     */

    clearMessages();
}


/* =========================================================
   DELETE ENTIRE MUNA CONVERSATION
   ========================================================= */

async function deleteMunaConversation(
    conversationId
) {

    if (!conversationId) {
        return;
    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete this conversation? This will permanently remove the conversation and its messages."
        );


    if (!confirmed) {
        return;
    }


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        alert(
            "Please log in again to delete this conversation."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `${MUNA_API}/muna/conversation/${encodeURIComponent(conversationId)}?session_token=${encodeURIComponent(sessionToken)}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.error
        ) {

            console.error(
                "Muna conversation delete error:",
                data
            );

            alert(
                data.error ||
                "Unable to delete this conversation."
            );

            return;
        }


        /*
         * If the deleted conversation is currently open,
         * clear it from the session.
         */

        if (
            String(munaConversationId) ===
            String(conversationId)
        ) {

            munaConversationId = null;

            sessionStorage.removeItem(
                "muna_conversation_id"
            );

            clearMessages();

            showMunaWelcome();
        }


        /*
         * Refresh history.
         */

        await loadMunaConversationHistory();


    } catch (error) {

        console.error(
            "Muna conversation deletion error:",
            error
        );

        alert(
            "I couldn't delete this conversation right now. Please try again."
        );
    }
}

/* =========================================================
   MUNA SAFETY SUPPORT SECTION
   ========================================================= */

function showMunaSupportSection(actions = {}) {

    const section =
        document.getElementById(
            "munaSupportSection"
        );

    if (!section) {
        return;
    }


    const toolkitLink =
        document.getElementById(
            "munaToolkitLink"
        );

    const mentorLink =
        document.getElementById(
            "munaMentorLink"
        );


    /*
     * Emergency support card.
     *
     * This is created only when the backend
     * marks the situation as high or critical.
     */

    let emergencyCard =
        document.getElementById(
            "munaEmergencyLink"
        );


    if (
        actions.emergency &&
        !emergencyCard
    ) {

        emergencyCard =
            document.createElement("a");

        emergencyCard.href =
            "#";

        emergencyCard.id =
            "munaEmergencyLink";

        emergencyCard.className =
            "support-card emergency-support-card";


        emergencyCard.innerHTML = `
            <div class="support-card-icon">🆘</div>

            <div>
                <h3>Get Immediate Help</h3>

                <p>
                    If you may be in immediate danger,
                    contact your local emergency service
                    or go to the nearest emergency department.
                </p>
            </div>

            <span class="support-arrow">→</span>
        `;


        emergencyCard.addEventListener(
            "click",
            event => {

                event.preventDefault();

                alert(
                    "If you are in immediate danger or think you may hurt yourself, please contact your local emergency service or go to the nearest emergency department now. If possible, stay with someone you trust."
                );
            }
        );


        const supportGrid =
            section.querySelector(
                ".support-grid"
            );


        if (supportGrid) {

            supportGrid.insertBefore(
                emergencyCard,
                supportGrid.firstChild
            );
        }
    }


    /*
     * Toolkit.
     */

    if (toolkitLink) {

        toolkitLink.style.display =
            actions.toolkit
                ? "flex"
                : "none";
    }


    /*
     * Mentor.
     */

    if (mentorLink) {

        mentorLink.style.display =
            actions.mentor
                ? "flex"
                : "none";
    }


    /*
     * Show support section.
     */

    section.style.display =
        "block";


    /*
     * Scroll gently to support options.
     */

    setTimeout(() => {

        section.scrollIntoView({
            behavior: "smooth",
            block: "nearest"
        });

    }, 100);
}


/* =========================================================
   HIDE MUNA SUPPORT SECTION
   ========================================================= */

function hideMunaSupportSection() {

    const section =
        document.getElementById(
            "munaSupportSection"
        );

    if (!section) {
        return;
    }

    section.style.display =
        "none";
}


/* =========================================================
   MUNA TOOLKIT LINK
   ========================================================= */

function setupMunaToolkitLink() {

    const toolkitLink =
        document.getElementById(
            "munaToolkitLink"
        );

    if (!toolkitLink) {
        return;
    }


    toolkitLink.addEventListener(
        "click",
        event => {

            /*
             * Allow a normal HTML link if one
             * already exists.
             */

            const href =
                toolkitLink.getAttribute(
                    "href"
                );


            if (
                !href ||
                href === "#"
            ) {

                event.preventDefault();

                window.location.href =
                    "../Toolkit/toolkit.html";
            }
        }
    );
}


/* =========================================================
   MUNA MENTOR LINK
   ========================================================= */

function setupMunaMentorLink() {

    const mentorLink =
        document.getElementById(
            "munaMentorLink"
        );

    if (!mentorLink) {
        return;
    }


    mentorLink.addEventListener(
        "click",
        event => {

            const href =
                mentorLink.getAttribute(
                    "href"
                );


            if (
                !href ||
                href === "#"
            ) {

                event.preventDefault();

                window.location.href =
                    "../mentor/mentor-support.html";
            }
        }
    );
}


/* =========================================================
   MUNA MOOD DISPLAY
   ========================================================= */

function updateMoodDisplay(
    moodData
) {

    if (!moodData) {
        return;
    }


    /*
     * Possible mood display elements.
     */

    const emoji =
        document.getElementById(
            "selectedMoodEmoji"
        );

    const label =
        document.getElementById(
            "selectedMoodLabel"
        );

    const moodDisplay =
        document.getElementById(
            "munaSelectedMood"
        );


    if (emoji) {

        emoji.textContent =
            moodData.emoji;
    }


    if (label) {

        label.textContent =
            moodData.label;
    }


    if (moodDisplay) {

        moodDisplay.style.display =
            "flex";
    }
}


/* =========================================================
   MUNA MOOD SELECTION
   ========================================================= */

function setupMunaMoodSelection() {

    const moodButtons =
        document.querySelectorAll(
            ".mood-option"
        );


    if (
        !moodButtons ||
        moodButtons.length === 0
    ) {
        return;
    }


    moodButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const mood =
                        button.dataset.mood;


                    if (!mood) {
                        return;
                    }


                    const moodData =
                        MUNA_MOODS[mood] ||
                        MUNA_MOODS.other;


                    /*
                     * Remove previous selection.
                     */

                    moodButtons.forEach(
                        item => {

                            item.classList.remove(
                                "selected"
                            );
                        }
                    );


                    /*
                     * Select current mood.
                     */

                    button.classList.add(
                        "selected"
                    );


                    /*
                     * Store mood.
                     */

                    sessionStorage.setItem(
                        "muna_selected_mood",
                        mood
                    );

                    sessionStorage.setItem(
                        "muna_selected_mood_label",
                        moodData.label
                    );

                    sessionStorage.setItem(
                        "muna_selected_mood_emoji",
                        moodData.emoji
                    );


                    /*
                     * Update display.
                     */

                    updateMoodDisplay(
                        moodData
                    );


                    /*
                     * Start a conversation if one
                     * doesn't already exist.
                     */

                    if (
                        !munaConversationId
                    ) {

                        createMunaConversation(
                            mood
                        );
                    }
                }
            );
        }
    );
}


/* =========================================================
   CREATE MUNA CONVERSATION
   ========================================================= */

async function createMunaConversation(
    mood
) {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        return null;
    }


    try {

        const response =
            await fetch(
                `${MUNA_API}/muna/conversation`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        session_token:
                            sessionToken,

                        selected_mood:
                            mood
                    })
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.error
        ) {

            console.error(
                "Create Muna conversation error:",
                data
            );

            return null;
        }


        /*
         * Backend may return either:
         *
         * data.conversation.id
         *
         * or
         *
         * data.id
         */

        const conversation =
            data.conversation ||
            data;


        if (
            conversation &&
            conversation.id
        ) {

            munaConversationId =
                conversation.id;


            sessionStorage.setItem(
                "muna_conversation_id",
                conversation.id
            );
        }


        return conversation;


    } catch (error) {

        console.error(
            "Muna conversation creation error:",
            error
        );

        return null;
    }
}


/* =========================================================
   CLEAR CHAT MESSAGES
   ========================================================= */

function clearMessages() {

    const messages =
        document.getElementById(
            "munaMessages"
        );


    if (!messages) {
        return;
    }


    /*
     * Remove every rendered message.
     */

    messages.innerHTML = "";


    /*
     * Remove support section from previous
     * safety conversation.
     */

    hideMunaSupportSection();
}


/* =========================================================
   CLEAR CURRENT CONVERSATION
   ========================================================= */

function resetMunaConversation() {

    munaConversationId =
        null;


    sessionStorage.removeItem(
        "muna_conversation_id"
    );


    sessionStorage.removeItem(
        "muna_selected_mood"
    );

    sessionStorage.removeItem(
        "muna_selected_mood_label"
    );

    sessionStorage.removeItem(
        "muna_selected_mood_emoji"
    );


    clearMessages();


    /*
     * Remove selected mood styling.
     */

    document
        .querySelectorAll(
            ".mood-option"
        )
        .forEach(button => {

            button.classList.remove(
                "selected"
            );
        });


    /*
     * Hide selected mood display.
     */

    const moodDisplay =
        document.getElementById(
            "munaSelectedMood"
        );

    if (moodDisplay) {

        moodDisplay.style.display =
            "none";
    }
}


/* =========================================================
   NEW CHAT BUTTON
   ========================================================= */

function setupNewMunaChat() {

    const buttons =
        document.querySelectorAll(
            "#newMunaChatBtn, .new-muna-chat"
        );


    buttons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    resetMunaConversation();


                    const history =
                        document.getElementById(
                            "munaHistory"
                        );

                    const chat =
                        document.getElementById(
                            "munaChat"
                        );

                    const welcome =
                        document.getElementById(
                            "munaWelcome"
                        );


                    if (history) {

                        history.style.display =
                            "none";
                    }


                    if (chat) {

                        chat.style.display =
                            "none";
                    }


                    if (welcome) {

                        welcome.style.display =
                            "block";
                    }


                    focusMunaInput();
                }
            );
        }
    );
}


/* =========================================================
   MESSAGE SEND ENTER HANDLER
   ========================================================= */

function setupMunaInput() {

    const input =
        document.getElementById(
            "munaMessageInput"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        event => {

            /*
             * Enter sends.
             *
             * Shift + Enter creates a new line.
             */

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                sendUserMessage();
            }
        }
    );
}


/* =========================================================
   SEND BUTTON
   ========================================================= */

function setupMunaSendButton() {

    const button =
        document.getElementById(
            "munaSendButton"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        () => {

            sendUserMessage();

        }
    );
}


/* =========================================================
   MUNA CLOSE BUTTON
   ========================================================= */

function setupMunaCloseButton() {

    const closeButtons =
        document.querySelectorAll(
            "#munaCloseBtn, .muna-close-btn"
        );


    closeButtons.forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    /*
                     * If the chatbot is inside a
                     * modal, close the modal.
                     */

                    const modal =
                        document.getElementById(
                            "munaModal"
                        );


                    if (modal) {

                        modal.style.display =
                            "none";

                        return;
                    }


                    /*
                     * Otherwise return to the
                     * previous page.
                     */

                    if (
                        window.history.length > 1
                    ) {

                        window.history.back();
                    }
                }
            );
        }
    );
}


/* =========================================================
   MUNA ERROR MESSAGE
   ========================================================= */

function showMunaError(
    message
) {

    const existing =
        document.querySelector(
            ".muna-error-message"
        );


    if (existing) {

        existing.remove();
    }


    const container =
        document.getElementById(
            "munaMessages"
        );


    if (!container) {
        return;
    }


    const error =
        document.createElement(
            "div"
        );


    error.className =
        "muna-error-message";


    error.textContent =
        message ||
        "Something went wrong. Please try again.";


    container.appendChild(
        error
    );


    scrollMessagesToBottom();


    /*
     * Automatically remove after a few
     * seconds.
     */

    setTimeout(
        () => {

            if (error.parentNode) {

                error.remove();
            }

        },
        5000
    );
}


/* =========================================================
   DISABLE CHAT INPUT
   ========================================================= */

function setMunaInputDisabled(
    disabled
) {

    const input =
        document.getElementById(
            "munaMessageInput"
        );

    const button =
        document.getElementById(
            "munaSendButton"
        );


    if (input) {

        input.disabled =
            disabled;
    }


    if (button) {

        button.disabled =
            disabled;
    }
}


/* =========================================================
   CHARACTER COUNTER
   ========================================================= */

function setupMunaCharacterCounter() {

    const input =
        document.getElementById(
            "munaMessageInput"
        );

    const counter =
        document.getElementById(
            "munaCharacterCount"
        );


    if (
        !input ||
        !counter
    ) {
        return;
    }


    const maxLength =
        parseInt(
            input.getAttribute(
                "maxlength"
            ),
            10
        ) || 1000;


    const updateCounter =
        () => {

            counter.textContent =
                `${input.value.length}/${maxLength}`;
        };


    input.addEventListener(
        "input",
        updateCounter
    );


    updateCounter();
}


/* =========================================================
   MUNA QUICK PROMPTS
   ========================================================= */

function setupMunaQuickPrompts() {

    const prompts =
        document.querySelectorAll(
            ".muna-quick-prompt"
        );


    if (
        !prompts ||
        prompts.length === 0
    ) {
        return;
    }


    prompts.forEach(
        prompt => {

            prompt.addEventListener(
                "click",
                () => {

                    const text =
                        prompt.dataset.prompt ||
                        prompt.textContent.trim();


                    const input =
                        document.getElementById(
                            "munaMessageInput"
                        );


                    if (!input) {
                        return;
                    }


                    input.value =
                        text;


                    input.dispatchEvent(
                        new Event(
                            "input",
                            {
                                bubbles: true
                            }
                        )
                    );


                    input.focus();
                }
            );
        }
    );
}


/* =========================================================
   INITIAL UI SETUP
   ========================================================= */

function setupMunaUI() {

    setupMunaHistory();

    setupMunaToolkitLink();

    setupMunaMentorLink();

    setupMunaMoodSelection();

    setupNewMunaChat();

    setupMunaInput();

    setupMunaSendButton();

    setupMunaCloseButton();

    setupMunaCharacterCounter();

    setupMunaQuickPrompts();
}


/* =========================================================
   PAGE LOAD
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        setupMunaUI();

    }
);



/* =========================================================
   RESTORE SAVED MUNA STATE
   ========================================================= */

function restoreSavedMunaState() {

    /*
     * Restore conversation ID.
     */

    const savedConversationId =
        sessionStorage.getItem(
            "muna_conversation_id"
        );


    if (savedConversationId) {

        munaConversationId =
            savedConversationId;
    }


    /*
     * Restore selected mood.
     */

    const savedMood =
        sessionStorage.getItem(
            "muna_selected_mood"
        );


    if (savedMood) {

        const moodData =
            MUNA_MOODS[savedMood] ||
            MUNA_MOODS.other;


        updateMoodDisplay(
            moodData
        );


        document
            .querySelectorAll(
                ".mood-option"
            )
            .forEach(button => {

                if (
                    button.dataset.mood ===
                    savedMood
                ) {

                    button.classList.add(
                        "selected"
                    );
                }
            });
    }
}


/* =========================================================
   RESTORE LAST OPEN CONVERSATION
   ========================================================= */

async function restoreLastMunaConversation() {

    const conversationId =
        sessionStorage.getItem(
            "muna_conversation_id"
        );


    if (!conversationId) {
        return;
    }


    /*
     * Only restore if a chat container exists.
     */

    const messages =
        document.getElementById(
            "munaMessages"
        );


    if (!messages) {
        return;
    }


    /*
     * Avoid automatically reopening a conversation
     * if the user is already viewing another state.
     */

    if (
        messages.children.length > 0
    ) {
        return;
    }


    try {

        await openPreviousMunaConversation(
            conversationId
        );

    } catch (error) {

        console.error(
            "Unable to restore Muna conversation:",
            error
        );
    }
}


/* =========================================================
   MUNA PAGE INITIALIZATION
   ========================================================= */

async function initializeMunaPage() {

    /*
     * Restore saved session state first.
     */

    restoreSavedMunaState();


    /*
     * Setup interface.
     */

    setupMunaUI();


    /*
     * Restore previous conversation if
     * one exists.
     */

    await restoreLastMunaConversation();


    /*
     * Focus input.
     */

    focusMunaInput();
}


/* =========================================================
   INITIALIZE WHEN PAGE IS READY
   ========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeMunaPage
    );

} else {

    initializeMunaPage();
}


/* =========================================================
   WINDOW EVENTS
   ========================================================= */

window.addEventListener(
    "resize",
    () => {

        /*
         * Keep the latest message visible when
         * the mobile keyboard or browser window
         * changes the available height.
         */

        scrollMessagesToBottom();

    }
);


/* =========================================================
   VISIBILITY CHANGE
   ========================================================= */

document.addEventListener(
    "visibilitychange",
    () => {

        if (
            !document.hidden
        ) {

            scrollMessagesToBottom();

        }

    }
);


/* =========================================================
   EXPOSE USEFUL FUNCTIONS
   =========================================================
   
   These are intentionally exposed so buttons or
   other frontend files can call them if necessary.
   ========================================================= */

window.Muna = {

    sendMessage:
        sendUserMessage,

    newConversation:
        resetMunaConversation,

    showHistory:
        showMunaHistory,

    hideHistory:
        hideMunaHistory,

    openConversation:
        openPreviousMunaConversation,

    deleteConversation:
        deleteMunaConversation,

    showSupport:
        showMunaSupportSection,

    hideSupport:
        hideMunaSupportSection,

    focusInput:
        focusMunaInput

};