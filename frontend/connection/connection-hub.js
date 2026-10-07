
const API_BASE_URL = "http://127.0.0.1:8000";


/* ======================================================
   STATE
====================================================== */

let currentConversationId = null;
let currentConversation = null;
let currentMessages = [];
let conversations = [];
let mentorConversations = [];
let incomingRequests = [];
let currentChatType = "peer";
let currentMentorConversationId = null;


/* ======================================================
   START
====================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadConnectionHub();

    setupHubButtons();

});


/* ======================================================
   LOAD HUB
====================================================== */

async function loadConnectionHub() {

    const sessionToken =
        localStorage.getItem("session_token");


    if (!sessionToken) {

        showHubLoginMessage();

        return;

    }


    await Promise.all([
        loadConnectionRequests(),
        loadConversations(),
        loadMentorConversations()
    ]);

}


/* ======================================================
   LOAD CONNECTION REQUESTS
====================================================== */

async function loadConnectionRequests() {

    const sessionToken =
        localStorage.getItem("session_token");

    const requestsList =
        document.getElementById("requestsList");

    const requestCount =
        document.getElementById("requestCount");


    if (!requestsList) {
        return;
    }


    requestsList.innerHTML = `
        <div class="hub-empty-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading connection requests...</p>
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/connection/requests?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load connection requests."
            );

        }


        /*
           Only pending incoming requests
           should appear in the request section.
        */

        incomingRequests =
            (
                Array.isArray(data.incoming)
                    ? data.incoming
                    : Array.isArray(data.received)
                        ? data.received
                        : []
            ).filter(
                request =>
                    request.status === "pending"
            );


        if (requestCount) {

            requestCount.textContent =
                incomingRequests.length;

        }


        renderConnectionRequests(
            incomingRequests
        );



    }

    catch (error) {

        console.error(
            "Error loading connection requests:",
            error
        );


        requestsList.innerHTML = `
            <div class="hub-empty-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>
                    We couldn't load your requests.
                    Please try again.
                </p>
            </div>
        `;

    }

}


/* ======================================================
   RENDER REQUESTS
====================================================== */

function renderConnectionRequests(requests) {

    const requestsList =
        document.getElementById("requestsList");


    if (!requestsList) {
        return;
    }


    if (!requests || requests.length === 0) {

        requestsList.innerHTML = `
            <div class="hub-empty-state">

                <i class="fa-regular fa-paper-plane"></i>

                <p>
                    No connection requests
                    right now.
                </p>

            </div>
        `;

        return;

    }


    requestsList.innerHTML = "";


    requests.forEach(request => {

        const card =
            createRequestCard(request);

        requestsList.appendChild(card);

    });

}


/* ======================================================
   CREATE REQUEST CARD
====================================================== */

function createRequestCard(request) {

    const card =
        document.createElement("article");

    card.className =
        "connection-request-card";


    const nickname =
        escapeHTML(
            request.nickname ||
            request.sender_nickname ||
            request.username ||
            "Anonymous Member"
        );


    const topic =
        escapeHTML(
            request.topic ||
            "General conversation"
        );


    const message =
        escapeHTML(
            request.message ||
            "I'd like to connect with you."
        );


    const time =
        formatTime(
            request.created_at
        );


    const avatar =
        request.avatar ||
        request.sender_avatar ||
        "";


    const avatarHTML =
        createAvatarHTML(
            avatar
        );


    card.innerHTML = `

        <div class="request-person">

            <div class="request-avatar">
                ${avatarHTML}
            </div>

            <div class="request-person-info">

                <h3>
                    ${nickname}
                </h3>

                <span class="request-topic">
                    ${topic}
                </span>

            </div>

        </div>


        <p class="request-message">
            "${message}"
        </p>


        <div class="request-time">
            ${time}
        </div>


        <div class="request-actions">

            <button
                type="button"
                class="request-action-btn request-decline-btn"
                data-request-id="${request.id}"
            >
                Decline
            </button>

            <button
                type="button"
                class="request-action-btn request-accept-btn"
                data-request-id="${request.id}"
            >
                Accept
            </button>

        </div>

    `;


    const declineButton =
        card.querySelector(
            ".request-decline-btn"
        );


    const acceptButton =
        card.querySelector(
            ".request-accept-btn"
        );


    declineButton.addEventListener(
        "click",
        () => {

            updateConnectionRequestStatus(
                request.id,
                "declined"
            );

        }
    );


    acceptButton.addEventListener(
        "click",
        () => {

            updateConnectionRequestStatus(
                request.id,
                "accepted"
            );

        }
    );


    return card;

}


/* ======================================================
   UPDATE REQUEST STATUS
====================================================== */

async function updateConnectionRequestStatus(
    requestId,
    status
) {

    const sessionToken =
        localStorage.getItem("session_token");


    if (!sessionToken) {

        alert(
            "Your session has expired. Please log in again."
        );

        return;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/connection/request/${requestId}/status`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        session_token:
                            sessionToken,

                        status:
                            status
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                `Unable to ${status} request.`
            );

        }


        if (status === "accepted") {

            showHubNotification(
                "Connection accepted."
            );

        }
        else {

            showHubNotification(
                "Connection request declined."
            );

        }


        await loadConnectionRequests();

        await loadConversations();

    }

    catch (error) {

        console.error(
            "Error updating connection request:",
            error
        );


        showHubNotification(
            error.message ||
            "Something went wrong."
        );

    }

}


/* ======================================================
   LOAD CONVERSATIONS
====================================================== */

async function loadConversations() {

    const sessionToken =
        localStorage.getItem("session_token");

    const conversationList =
        document.getElementById(
            "conversationList"
        );


    if (!conversationList) {
        return;
    }


    conversationList.innerHTML = `
        <div class="hub-empty-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading conversations...</p>
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/connection/conversations?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load conversations."
            );

        }


        conversations =
            Array.isArray(data)
                ? data
                : Array.isArray(data.conversations)
                    ? data.conversations
                    : [];


        renderConversations(
            conversations
        );

    }

    catch (error) {

        console.error(
            "Error loading conversations:",
            error
        );


        conversationList.innerHTML = `
            <div class="hub-empty-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>
                    We couldn't load your
                    conversations.
                </p>
            </div>
        `;

    }

}


/* ======================================================
   LOAD MENTOR CONVERSATIONS
====================================================== */

async function loadMentorConversations() {

    const sessionToken =
        localStorage.getItem("session_token");

    const mentorConversationList =
        document.getElementById(
            "mentorConversationList"
        );

    const mentorConversationCount =
        document.getElementById(
            "mentorConversationCount"
        );

    if (!mentorConversationList) {
        return;
    }

    mentorConversationList.innerHTML = `
        <div class="hub-empty-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading mentor conversations...</p>
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API_BASE_URL}/mentor/conversations?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load mentor conversations."
            );

        }

        mentorConversations =
            Array.isArray(data)
                ? data
                : Array.isArray(data.conversations)
                    ? data.conversations
                    : [];

        if (mentorConversationCount) {

            mentorConversationCount.textContent =
                mentorConversations.length;

        }

        renderMentorConversations(
            mentorConversations
        );

    }

    catch (error) {

        console.error(
            "Error loading mentor conversations:",
            error
        );

        mentorConversations = [];

        if (mentorConversationCount) {
            mentorConversationCount.textContent = "0";
        }

        mentorConversationList.innerHTML = `
            <div class="hub-empty-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>
                    We couldn't load your mentor conversations.
                </p>
            </div>
        `;

    }

}


/* ======================================================
   RENDER MENTOR CONVERSATIONS
====================================================== */

function renderMentorConversations(
    conversationItems
) {

    const mentorConversationList =
        document.getElementById(
            "mentorConversationList"
        );

    if (!mentorConversationList) {
        return;
    }

    if (
        !conversationItems ||
        conversationItems.length === 0
    ) {

        mentorConversationList.innerHTML = `
            <div class="hub-empty-state">
                <i class="fa-regular fa-comments"></i>
                <p>
                    Your mentor conversations
                    will appear here.
                </p>
            </div>
        `;

        return;
    }

    mentorConversationList.innerHTML = "";

    conversationItems.forEach(
        conversation => {

            const item =
                createMentorConversationItem(
                    conversation
                );

            mentorConversationList.appendChild(
                item
            );

        }
    );

}


/* ======================================================
   CREATE MENTOR CONVERSATION ITEM
====================================================== */

function createMentorConversationItem(
    conversation
) {

    const button =
        document.createElement("button");

    button.type = "button";
    button.className =
        "mentor-conversation-item";

    const nickname =
        escapeHTML(
            conversation.nickname ||
            conversation.mentor_nickname ||
            conversation.other_nickname ||
            "Mentor"
        );

    const avatar =
        conversation.avatar ||
        conversation.mentor_avatar ||
        conversation.other_avatar ||
        "";

    const time =
        formatTime(
            conversation.last_message_at ||
            conversation.updated_at ||
            conversation.started_at
        );

    const status =
        conversation.status === "active"
            ? "Active conversation"
            : "Mentor conversation";

    button.innerHTML = `

        <div class="mentor-conversation-avatar">
            ${createAvatarHTML(avatar)}
        </div>

        <div class="mentor-conversation-info">

            <div class="mentor-conversation-top">

                <h3 class="mentor-conversation-name">
                    ${nickname}
                </h3>

                ${
                    time
                        ? `
                            <span class="mentor-conversation-time">
                                ${time}
                            </span>
                          `
                        : ""
                }

            </div>

            <p class="mentor-conversation-preview">
                ${escapeHTML(status)}
            </p>

        </div>

        <span class="mentor-badge">
            Mentor
        </span>

    `;

    button.addEventListener(
        "click",
        () => {

            openMentorConversation(
                conversation.id
            );

        }
    );

    return button;

}


/* ======================================================
   OPEN EXISTING MENTOR CHAT
====================================================== */

/* ======================================================
   OPEN MENTOR CONVERSATION
   Uses the SAME chat panel as Friends.
====================================================== */

async function openMentorConversation(
    conversationId
) {

    currentChatType = "mentor";

    currentMentorConversationId =
        conversationId;

    currentConversationId = null;


    const emptyState =
        document.getElementById(
            "chatEmptyState"
        );

    const activeChat =
        document.getElementById(
            "activeChat"
        );


    if (emptyState) {

        emptyState.hidden =
            true;

    }


    if (activeChat) {

        activeChat.hidden =
            false;

    }


    const selectedConversation =
        mentorConversations.find(
            conversation =>
                Number(conversation.id) ===
                Number(conversationId)
        );


    try {

        const sessionToken =
            localStorage.getItem(
                "session_token"
            );


        if (!sessionToken) {

            showHubLoginMessage();

            return;

        }


        /* ---------------------------------------------
           LOAD REAL MENTOR CONVERSATION
        --------------------------------------------- */

        const response =
            await fetch(
                `${API_BASE_URL}/mentor/conversation/${encodeURIComponent(conversationId)}?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load mentor conversation."
            );

        }


        const conversation =
            data.conversation ||
            data;


        const currentUserId =
            getCurrentUserId();


        /*
           Determine which person should be displayed.

           Student:
           → show mentor

           Mentor:
           → show student
        */

        let displayNickname =
            "Mentor";

        let displayAvatar =
            "🌿";


        if (
            currentUserId &&
            Number(currentUserId) ===
            Number(conversation.mentor_id)
        ) {

            displayNickname =
                conversation.student_nickname ||
                "Student";

            displayAvatar =
                conversation.student_avatar ||
                "🌱";

        } else {

            displayNickname =
                conversation.mentor_nickname ||
                selectedConversation?.nickname ||
                "Mentor";

            displayAvatar =
                conversation.mentor_avatar ||
                selectedConversation?.avatar ||
                "🌿";

        }


        /*
           Convert mentor conversation into the
           same format used by the hub chat header.
        */

        currentConversation = {

            ...conversation,

            display_nickname:
                displayNickname,

            display_avatar:
                displayAvatar,

            topic:
                conversation.topic ||
                selectedConversation?.topic ||
                "Mentor conversation"

        };


        /* ---------------------------------------------
           RENDER SAME CHAT HEADER
        --------------------------------------------- */

        renderChatHeader(
            currentConversation
        );


        /* ---------------------------------------------
           LOAD MENTOR MESSAGES
        --------------------------------------------- */

        await loadMentorConversationMessages(
            conversationId
        );


        /* ---------------------------------------------
           MARK MENTOR MESSAGES AS READ
        --------------------------------------------- */

        await markMentorMessagesAsRead(
            conversationId
        );


    }

    catch (error) {

        console.error(
            "Error opening mentor conversation:",
            error
        );


        showHubNotification(
            error.message ||
            "Unable to open mentor conversation."
        );

    }

}

/* ======================================================
   RENDER CONVERSATIONS
====================================================== */

function renderConversations(
    conversationItems
) {

    const conversationList =
        document.getElementById(
            "conversationList"
        );


    if (!conversationList) {
        return;
    }


    if (
        !conversationItems ||
        conversationItems.length === 0
    ) {

        conversationList.innerHTML = `
            <div class="hub-empty-state">

                <i class="fa-regular fa-comments"></i>

                <p>
                    Your conversations
                    will appear here.
                </p>

            </div>
        `;

        return;

    }


    conversationList.innerHTML = "";


    conversationItems.forEach(
        conversation => {

            const item =
                createConversationItem(
                    conversation
                );

            conversationList.appendChild(
                item
            );

        }
    );

}

/* ======================================================
   CREATE CONVERSATION ITEM
====================================================== */

function createConversationItem(
    conversation
) {

    const button =
        document.createElement("button");


    button.type = "button";

    button.className =
        "conversation-item";


    if (
        Number(conversation.id) ===
        Number(currentConversationId)
    ) {

        button.classList.add("active");

    }


    /*
       /connection/conversations already returns
       the OTHER person's nickname and avatar.
    */

    const nickname =
        escapeHTML(
            conversation.nickname ||
            conversation.other_nickname ||
            conversation.other_user_nickname ||
            "Anonymous Member"
        );


    const preview =
        escapeHTML(
            conversation.last_message ||
            conversation.message ||
            "Start a conversation..."
        );


    const time =
        formatTime(
            conversation.last_message_at ||
            conversation.updated_at ||
            conversation.started_at
        );


    const unread =
        Number(
            conversation.unread_count || 0
        );


    const avatar =
        conversation.avatar ||
        conversation.other_avatar ||
        "";


    button.innerHTML = `

        <div class="conversation-avatar">

            ${createAvatarHTML(avatar)}

        </div>


        <div class="conversation-info">

            <div class="conversation-top">

                <h3 class="conversation-name">
                    ${nickname}
                </h3>

                <span class="conversation-time">
                    ${time}
                </span>

            </div>


            <p class="conversation-preview">
                ${preview}
            </p>

        </div>


        ${
            unread > 0
                ? `
                    <span class="conversation-unread">
                        ${unread > 9 ? "9+" : unread}
                    </span>
                `
                : ""
        }

    `;


    button.addEventListener(
        "click",
        () => {

            openConversation(
                conversation.id
            );

        }
    );


    return button;

}


/* ======================================================
   OPEN CONVERSATION
====================================================== */

async function openConversation(
    conversationId
) {
    currentChatType = "peer";
currentMentorConversationId = null;

    currentConversationId =
        conversationId;


    const emptyState =
        document.getElementById(
            "chatEmptyState"
        );


    const activeChat =
        document.getElementById(
            "activeChat"
        );


    if (emptyState) {

        emptyState.hidden =
            true;

    }


    if (activeChat) {

        activeChat.hidden =
            false;

    }


    /*
       Find the EXACT conversation that
       the user clicked.
    */

    const selectedConversation =
        conversations.find(
            conversation =>
                Number(conversation.id) ===
                Number(conversationId)
        );


    /*
       Capture the selected person's identity
       BEFORE loading backend conversation details.
    */

    const selectedNickname =
        selectedConversation?.nickname ||
        selectedConversation?.other_nickname ||
        selectedConversation?.other_user_nickname ||
        "Anonymous Member";


    const selectedAvatar =
        selectedConversation?.avatar ||
        selectedConversation?.other_avatar ||
        "";


    /*
       Load the full conversation details.
    */

    await loadConversationDetails(
        conversationId
    );


    /*
       Preserve the identity of the person
       whose conversation was actually clicked.

       The backend conversation details may contain
       both participants, so we explicitly use the
       selected conversation-list identity here.
    */

    currentConversation =
        currentConversation || {};


    currentConversation.display_nickname =
        selectedNickname;


    currentConversation.display_avatar =
        selectedAvatar;


    if (selectedConversation) {

        currentConversation.topic =
            selectedConversation.topic ||
            currentConversation.topic ||
            "";

    }


    /*
       Render the selected person's header.
    */

    renderChatHeader(
        currentConversation
    );


    await loadConversationMessages(
        conversationId
    );


    await markMessagesAsRead(
        conversationId
    );


    renderConversations(
        conversations
    );

}


/* ======================================================
   LOAD CONVERSATION DETAILS
====================================================== */

async function loadConversationDetails(
    conversationId
) {

    const sessionToken =
        localStorage.getItem("session_token");


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/connection/conversation/${conversationId}?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load conversation."
            );

        }


        currentConversation =
            data.conversation ||
            data;

    }

    catch (error) {

        console.error(
            "Error loading conversation:",
            error
        );


        showHubNotification(
            "Unable to open this conversation."
        );

    }

}


/* ======================================================
   RENDER CHAT HEADER
====================================================== */

function renderChatHeader(
    conversation
) {

    if (!conversation) {
        return;
    }


    const nickname =
        document.getElementById(
            "chatNickname"
        );


    const topic =
        document.getElementById(
            "chatTopic"
        );


    const avatar =
        document.getElementById(
            "chatAvatar"
        );


    const placeholder =
        document.getElementById(
            "chatAvatarPlaceholder"
        );


    const statusText =
        document.querySelector(
            "#chatStatus span:last-child"
        );


    /*
       IMPORTANT:

       These values are explicitly assigned
       by openConversation() from the selected
       conversation item.

       They always represent the person
       whose conversation was clicked.
    */

    const otherNickname =
        conversation.display_nickname ||
        "Anonymous Member";


    const otherAvatar =
        conversation.display_avatar ||
        "";


    /* -----------------------------------------------
       NAME
    ------------------------------------------------ */

    if (nickname) {

        nickname.textContent =
            otherNickname;

    }


    /* -----------------------------------------------
       TOPIC
    ------------------------------------------------ */

    if (topic) {

        topic.textContent =
            conversation.topic ||
            "Private conversation";

    }


    /* -----------------------------------------------
       STATUS
    ------------------------------------------------ */

    if (statusText) {

        statusText.textContent =
            conversation.status === "active"
                ? "Available"
                : "Ended";

    }


    /* -----------------------------------------------
       AVATAR
    ------------------------------------------------ */

    if (otherAvatar) {

        const avatarURL =
            buildAvatarUrl(
                otherAvatar
            );


        if (avatar) {

            avatar.src =
                avatarURL;


            avatar.style.display =
                "block";


            avatar.onerror = () => {

                avatar.style.display =
                    "none";


                if (placeholder) {

                    placeholder.style.display =
                        "flex";

                }

            };

        }


        if (placeholder) {

            placeholder.style.display =
                "none";

        }

    }

    else {

        if (avatar) {

            avatar.style.display =
                "none";

        }


        if (placeholder) {

            placeholder.style.display =
                "flex";

        }

    }

}


/* ======================================================
   LOAD MESSAGES
====================================================== */

async function loadConversationMessages(
    conversationId
) {

    const sessionToken =
        localStorage.getItem("session_token");


    const messagesContainer =
        document.getElementById(
            "chatMessages"
        );


    if (!messagesContainer) {
        return;
    }


    messagesContainer.innerHTML = `
        <div class="hub-empty-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading messages...</p>
        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/connection/conversation/${conversationId}/messages?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load messages."
            );

        }


        currentMessages =
            Array.isArray(data)
                ? data
                : Array.isArray(data.messages)
                    ? data.messages
                    : [];


        renderMessages(
            currentMessages
        );

    }

    catch (error) {

        console.error(
            "Error loading messages:",
            error
        );


        messagesContainer.innerHTML = `
            <div class="hub-empty-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>
                    We couldn't load the messages.
                </p>
            </div>
        `;

    }

}
/* ======================================================
   LOAD MENTOR MESSAGES
====================================================== */

async function loadMentorConversationMessages(
    conversationId
) {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    const messagesContainer =
        document.getElementById(
            "chatMessages"
        );


    if (!messagesContainer) {
        return;
    }


    messagesContainer.innerHTML = `
        <div class="hub-empty-state">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <p>
                Loading messages...
            </p>

        </div>
    `;


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/mentor/conversation/${encodeURIComponent(conversationId)}/messages?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load mentor messages."
            );

        }


        currentMessages =
            Array.isArray(data.messages)
                ? data.messages
                : [];


        renderMessages(
            currentMessages
        );

    }

    catch (error) {

        console.error(
            "Error loading mentor messages:",
            error
        );


        messagesContainer.innerHTML = `
            <div class="hub-empty-state">

                <i class="fa-solid fa-circle-exclamation"></i>

                <p>
                    We couldn't load the mentor messages.
                </p>

            </div>
        `;

    }

}

/* ======================================================
   RENDER MESSAGES
====================================================== */

function renderMessages(
    messages
) {

    const container =
        document.getElementById(
            "chatMessages"
        );


    if (!container) {
        return;
    }


    if (!messages || messages.length === 0) {

        container.innerHTML = `
            <div class="hub-empty-state">

                <i class="fa-regular fa-comment"></i>

                <p>
                    This conversation is ready.
                    Send the first message.
                </p>

            </div>
        `;

        return;

    }


    const currentUserId =
        getCurrentUserId();


    container.innerHTML = "";


    messages.forEach(message => {

        const senderId =
            Number(
                message.sender_id
            );


        const isSent =
            senderId ===
            Number(currentUserId);


        const bubble =
            document.createElement("div");


        bubble.className =
            `chat-message ${
                isSent
                    ? "sent"
                    : "received"
            }`;


        const messageText =
            escapeHTML(
                message.message || ""
            );


        const messageTime =
            formatMessageTime(
                message.created_at
            );


        bubble.innerHTML = `
            ${messageText}

            <span class="message-time">
                ${messageTime}

                ${
                    isSent
                        ? " ✓✓"
                        : ""
                }
            </span>
        `;


        container.appendChild(
            bubble
        );

    });


    container.scrollTop =
        container.scrollHeight;

}


/* ======================================================
   SEND MESSAGE
====================================================== */

async function sendMessage() {

    
    if (
        currentChatType === "mentor"
    ) {

        await sendMentorMessage();

        return;

    }


    if (!currentConversationId) {

        return;

    }


    const input =
        document.getElementById(
            "messageInput"
        );


    const sendButton =
        document.getElementById(
            "sendMessageBtn"
        );


    if (!input) {
        return;
    }


    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    const sessionToken =
        localStorage.getItem("session_token");


    if (!sessionToken) {

        showHubNotification(
            "Please log in again."
        );

        return;

    }


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/connection/conversation/${currentConversationId}/messages`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        session_token:
                            sessionToken,

                        message:
                            message
                    })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to send message."
            );

        }


        input.value = "";


        await loadConversationMessages(
            currentConversationId
        );


        await loadConversations();

    }

    catch (error) {

        console.error(
            "Error sending message:",
            error
        );


        showHubNotification(
            error.message ||
            "Unable to send message."
        );

    }

    finally {

        if (sendButton) {

            sendButton.disabled =
                false;

        }

    }

}

/* ======================================================
   SEND MENTOR MESSAGE
   Uses existing mentor backend.
====================================================== */

async function sendMentorMessage() {

    if (
        !currentMentorConversationId
    ) {

        return;

    }


    const input =
        document.getElementById(
            "messageInput"
        );


    const sendButton =
        document.getElementById(
            "sendMessageBtn"
        );


    if (!input) {
        return;
    }


    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    if (
        message.length > 2000
    ) {

        showHubNotification(
            "Message must be 2000 characters or less."
        );

        return;

    }


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showHubNotification(
            "Please log in again."
        );

        return;

    }


    if (sendButton) {

        sendButton.disabled =
            true;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/mentor/conversation/${encodeURIComponent(currentMentorConversationId)}/messages`,
                {
                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        message:
                            message

                    })

                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to send mentor message."
            );

        }


        input.value = "";


        await loadMentorConversationMessages(
            currentMentorConversationId
        );


        await loadMentorConversations();

    }

    catch (error) {

        console.error(
            "Error sending mentor message:",
            error
        );


        showHubNotification(
            error.message ||
            "Unable to send mentor message."
        );

    }

    finally {

        if (sendButton) {

            sendButton.disabled =
                false;

        }

    }

}
/* ======================================================
   MARK MESSAGES READ
====================================================== */

async function markMessagesAsRead(
    conversationId
) {

    const sessionToken =
        localStorage.getItem("session_token");


    if (!sessionToken) {
        return;
    }


    try {

        await fetch(
            `${API_BASE_URL}/connection/conversation/${conversationId}/messages/read`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    session_token:
                        sessionToken
                })
            }
        );

    }

    catch (error) {

        console.error(
            "Error marking messages as read:",
            error
        );

    }

}

async function markMentorMessagesAsRead(conversationId) {
    const sessionToken = localStorage.getItem("session_token");
    if (!sessionToken) return;

    try {
        await fetch(
            `${API_BASE_URL}/mentor/conversation/${encodeURIComponent(conversationId)}/messages/read`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    session_token: sessionToken
                })
            }
        );
    } catch (error) {
        console.error(
            "Error marking mentor messages as read:",
            error
        );
    }
}

/* ======================================================
   BUTTONS
====================================================== */

function setupHubButtons() {

    const composer =
        document.getElementById(
            "chatComposer"
        );


    if (composer) {

        composer.addEventListener(
            "submit",
            event => {

                event.preventDefault();

                sendMessage();

            }
        );

    }


    const newConnectionButton =
        document.getElementById(
            "newConnectionBtn"
        );


    if (newConnectionButton) {

        newConnectionButton.addEventListener(
            "click",
            () => {

                window.location.href =
                    "connection.html";

            }
        );

    }


    const viewAllRequestsButton =
        document.getElementById(
            "viewAllRequestsBtn"
        );


    if (viewAllRequestsButton) {

        viewAllRequestsButton.addEventListener(
            "click",
            () => {

                const requests =
                    document.getElementById(
                        "requestsList"
                    );


                if (requests) {

                    requests.scrollIntoView({
                        behavior: "smooth",
                        block: "start"
                    });

                }

            }
        );

    }


    const searchButton =
        document.getElementById(
            "chatSearchBtn"
        );


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            () => {

                showHubNotification(
                    "Conversation search will be added later."
                );

            }
        );

    }


    const menuButton =
        document.getElementById(
            "chatMenuBtn"
        );


    if (menuButton) {

        menuButton.addEventListener(
            "click",
            () => {

                showHubNotification(
                    "Conversation options will be added later."
                );

            }
        );

    }


    const attachmentButton =
        document.getElementById(
            "attachmentBtn"
        );


    if (attachmentButton) {

        attachmentButton.addEventListener(
            "click",
            () => {

                showHubNotification(
                    "Attachments will be added later."
                );

            }
        );

    }


    const emojiButton =
        document.getElementById(
            "emojiBtn"
        );


    if (emojiButton) {

        emojiButton.addEventListener(
            "click",
            () => {

                const input =
                    document.getElementById(
                        "messageInput"
                    );


                if (input) {

                    input.value += " 💚";

                    input.focus();

                }

            }
        );

    }

}

/* ======================================================
   LOGIN MESSAGE
====================================================== */

function showHubLoginMessage() {

    const requestsList =
        document.getElementById(
            "requestsList"
        );

    const conversationList =
        document.getElementById(
            "conversationList"
        );

    const mentorConversationList =
        document.getElementById(
            "mentorConversationList"
        );


    const message = `
        <div class="hub-empty-state">
            <i class="fa-solid fa-lock"></i>
            <p>
                Please log in to view your
                connections.
            </p>
        </div>
    `;


    if (requestsList) {

        requestsList.innerHTML =
            message;

    }


    if (conversationList) {

        conversationList.innerHTML =
            message;

    }


    if (mentorConversationList) {

        mentorConversationList.innerHTML =
            message;

    }

}


/* ======================================================
   AVATAR
====================================================== */

function createAvatarHTML(
    avatar
) {

    if (!avatar) {

        return `
            <i class="fa-solid fa-leaf"></i>
        `;

    }


    const avatarValue =
        String(avatar);


    const isImage =
        avatarValue.startsWith("http://") ||
        avatarValue.startsWith("https://") ||
        avatarValue.startsWith("/");


    if (!isImage) {

        return escapeHTML(
            avatarValue
        );

    }


    return `
        <img
            src="${escapeAttribute(
                buildAvatarUrl(avatarValue)
            )}"
            alt=""
        >
    `;

}


/* ======================================================
   BUILD AVATAR URL
====================================================== */

function buildAvatarUrl(
    avatar
) {

    if (!avatar) {
        return "";
    }


    if (
        avatar.startsWith("http://") ||
        avatar.startsWith("https://")
    ) {

        return avatar;

    }


    if (avatar.startsWith("/")) {

        return `${API_BASE_URL}${avatar}`;

    }


    return avatar;

}


/* ======================================================
   CURRENT USER ID
====================================================== */

function getCurrentUserId() {

    /*
       Try common localStorage values first.
    */

    const storedId =
        localStorage.getItem("user_id");


    if (storedId) {

        return Number(storedId);

    }


    return null;

}


/* ======================================================
   FORMAT TIME
====================================================== */

function formatTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }


    const date =
        new Date(timestamp);


    if (Number.isNaN(date.getTime())) {

        return "";

    }


    const now =
        new Date();


    const difference =
        now.getTime() -
        date.getTime();


    const minutes =
        Math.floor(
            difference / 60000
        );


    if (minutes < 1) {

        return "Just now";

    }


    if (minutes < 60) {

        return `${minutes} min ago`;

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (hours < 24) {

        return `${hours}h ago`;

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (days === 1) {

        return "Yesterday";

    }


    if (days < 7) {

        return `${days} days ago`;

    }


    return date.toLocaleDateString(
        undefined,
        {
            month: "short",
            day: "numeric"
        }
    );

}


/* ======================================================
   MESSAGE TIME
====================================================== */

function formatMessageTime(
    timestamp
) {

    if (!timestamp) {
        return "";
    }


    const date =
        new Date(timestamp);


    if (Number.isNaN(date.getTime())) {

        return "";

    }


    return date.toLocaleTimeString(
        undefined,
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );

}


/* ======================================================
   NOTIFICATION
====================================================== */

function showHubNotification(
    message
) {

    const existing =
        document.querySelector(
            ".hub-notification"
        );


    if (existing) {

        existing.remove();

    }


    const notification =
        document.createElement("div");


    notification.className =
        "hub-notification";


    notification.textContent =
        message;


    document.body.appendChild(
        notification
    );


    requestAnimationFrame(() => {

        notification.classList.add(
            "show"
        );

    });


    setTimeout(() => {

        notification.classList.remove(
            "show"
        );


        setTimeout(() => {

            notification.remove();

        }, 250);

    }, 3000);

}


/* ======================================================
   HTML SECURITY
====================================================== */

function escapeHTML(
    value
) {

    return String(value ?? "")

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeAttribute(
    value
) {

    return escapeHTML(value);

}


/* ======================================================
   BACK TO CONNECTION
====================================================== */

const backToConnectionBtn =
    document.getElementById(
        "backToConnectionBtn"
    );


if (backToConnectionBtn) {

    backToConnectionBtn.addEventListener(
        "click",
        () => {

            window.location.href =
                "connection.html";

        }
    );

}