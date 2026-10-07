const API = "http://127.0.0.1:8000";

let sessionToken = localStorage.getItem("session_token");

let mentorRequests = [];
let mentorConversations = [];

let selectedConversationId = null;
let selectedConversation = null;

let isSendingMessage = false;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    sessionToken = localStorage.getItem("session_token");

    if (!sessionToken) {
        showPageError("Please log in to access Mentor Space.");
        return;
    }

    loadMentorSpace();

    setupComposer();
    setupAttachmentButton();
    setupConversationMenu();
});


/* =========================================================
   LOAD COMPLETE MENTOR SPACE
========================================================= */

async function loadMentorSpace() {

    await Promise.all([
        loadMentorRequests(),
        loadActiveSupport()
    ]);

}


/* =========================================================
   LOAD PENDING REQUESTS
========================================================= */

async function loadMentorRequests() {

    const loading =
        document.getElementById("requestsLoading");

    const empty =
        document.getElementById("requestsEmpty");

    const error =
        document.getElementById("requestsPageError");

    const errorText =
        document.getElementById("requestsPageErrorText");

    const list =
        document.getElementById("requestsList");

    try {

        if (loading) {
            loading.hidden = false;
        }

        if (empty) {
            empty.hidden = true;
        }

        if (error) {
            error.hidden = true;
        }

        const response = await fetch(
            `${API}/mentor/requests?session_token=${encodeURIComponent(sessionToken)}`
        );

        const data = await response.json();

        console.log("Mentor requests:", data);

        if (!response.ok || data.error) {
            throw new Error(
                data.error || "Unable to load mentor requests."
            );
        }

        mentorRequests = data.requests || [];

        updatePendingCounts();

        if (list) {
            list.innerHTML = "";
        }

        if (mentorRequests.length === 0) {

            if (empty) {
                empty.hidden = false;
            }

            return;
        }

        mentorRequests.forEach(function (request) {

            const card =
                createRequestCard(request);

            if (list && card) {
                list.appendChild(card);
            }

        });

    } catch (errorObject) {

        console.error(
            "Error loading mentor requests:",
            errorObject
        );

        if (loading) {
            loading.hidden = true;
        }

        if (error) {
            error.hidden = false;
        }

        if (errorText) {
            errorText.textContent =
                errorObject.message ||
                "Unable to load mentor requests.";
        }

    } finally {

        if (loading) {
            loading.hidden = true;
        }

    }

}


/* =========================================================
   CREATE REQUEST CARD
========================================================= */

function createRequestCard(request) {

    const card =
        document.createElement("article");

    card.className = "request-card";

    const nickname =
        request.nickname ||
        "MindSpeak Member";

    const avatar =
        request.avatar ||
        "🌱";

    const topic =
        request.topic ||
        "Support";

    const message =
        request.message ||
        "No message was provided.";

    const createdAt =
        formatDate(request.created_at);

    card.innerHTML = `

        <div class="request-card-header">

            <div class="request-avatar">
                ${escapeHTML(avatar)}
            </div>

            <div class="request-user">

                <div class="request-user-name">
                    ${escapeHTML(nickname)}
                </div>

                <div class="request-time">
                    ${escapeHTML(createdAt)}
                </div>

            </div>

        </div>


        <div class="request-topic">
            ${escapeHTML(topic)}
        </div>


        <p class="request-message">
            ${escapeHTML(message)}
        </p>


        <div class="request-actions">

            <button
                type="button"
                class="accept-request-btn"
                data-request-id="${request.id}"
            >
                <i class="fa-solid fa-check"></i>
                Accept
            </button>


            <button
                type="button"
                class="decline-request-btn"
                data-request-id="${request.id}"
            >
                <i class="fa-solid fa-xmark"></i>
                Decline
            </button>

        </div>

    `;


    const acceptButton =
        card.querySelector(".accept-request-btn");

    const declineButton =
        card.querySelector(".decline-request-btn");


    if (acceptButton) {

        acceptButton.addEventListener(
            "click",
            function () {

                updateRequestStatus(
                    request.id,
                    "accepted",
                    card,
                    acceptButton,
                    declineButton
                );

            }
        );

    }


    if (declineButton) {

        declineButton.addEventListener(
            "click",
            function () {

                updateRequestStatus(
                    request.id,
                    "declined",
                    card,
                    acceptButton,
                    declineButton
                );

            }
        );

    }


    return card;

}


/* =========================================================
   ACCEPT / DECLINE REQUEST
========================================================= */

async function updateRequestStatus(
    requestId,
    status,
    card,
    acceptButton,
    declineButton
) {

    if (!requestId) {
        return;
    }

    if (acceptButton) {
        acceptButton.disabled = true;
    }

    if (declineButton) {
        declineButton.disabled = true;
    }

    try {

        const response = await fetch(
            `${API}/mentor/request/${encodeURIComponent(requestId)}/status`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    session_token: sessionToken,
                    status: status
                })
            }
        );


        const data =
            await response.json();

        console.log(
            "Request status response:",
            data
        );


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                `Unable to ${status} request.`
            );

        }


        /*
         * Remove request from local list
         */

        mentorRequests =
            mentorRequests.filter(
                function (request) {

                    return String(request.id) !==
                        String(requestId);

                }
            );


        updatePendingCounts();


        /*
         * Remove card from UI
         */

        if (card) {
            card.remove();
        }


        /*
         * If accepted, reload active support.
         */

        if (status === "accepted") {

            await loadActiveSupport();

        }


        /*
         * If there are no remaining requests,
         * show the empty state.
         */

        if (mentorRequests.length === 0) {

            const empty =
                document.getElementById("requestsEmpty");

            if (empty) {
                empty.hidden = false;
            }

        }


    } catch (errorObject) {

        console.error(
            "Request update error:",
            errorObject
        );

        if (acceptButton) {
            acceptButton.disabled = false;
        }

        if (declineButton) {
            declineButton.disabled = false;
        }

        showPageError(
            errorObject.message ||
            "Unable to update request."
        );

    }

}


/* =========================================================
   UPDATE PENDING COUNTS
========================================================= */

function updatePendingCounts() {

    const count =
        mentorRequests.length;


    const mainCount =
        document.getElementById("pendingRequestCount");

    const badge =
        document.getElementById("pendingRequestBadge");


    if (mainCount) {
        mainCount.textContent = count;
    }

    if (badge) {
        badge.textContent = count;
    }

}


/* =========================================================
   LOAD ACTIVE SUPPORT
========================================================= */

async function loadActiveSupport() {

    const loading =
        document.getElementById("activeSupportLoading");

    const list =
        document.getElementById("activeSupportList");

    try {

        if (loading) {
            loading.hidden = false;
        }


        const response = await fetch(
            `${API}/mentor/conversations?session_token=${encodeURIComponent(sessionToken)}`
        );


        const data =
            await response.json();


        console.log(
            "Mentor conversations:",
            data
        );


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to load active support."
            );

        }


        mentorConversations =
            data.conversations || [];


        updateActiveSupportCounts();


        if (list) {
            list.innerHTML = "";
        }


        if (mentorConversations.length === 0) {

            if (list) {

                list.innerHTML = `

                    <div class="panel-empty">

                        <div class="panel-empty-icon">
                            <i class="fa-regular fa-comments"></i>
                        </div>

                        <h3>
                            No active support yet
                        </h3>

                        <p>
                            Accepted support conversations
                            will appear here.
                        </p>

                    </div>

                `;

            }

            return;
        }


        mentorConversations.forEach(
            function (conversation) {

                const card =
                    createActiveSupportCard(
                        conversation
                    );


                if (list && card) {
                    list.appendChild(card);
                }

            }
        );


    } catch (errorObject) {

        console.error(
            "Active support loading error:",
            errorObject
        );

        if (list) {

            list.innerHTML = `

                <div class="panel-empty">

                    <div class="panel-empty-icon">
                        <i class="fa-solid fa-circle-exclamation"></i>
                    </div>

                    <h3>
                        Unable to load support
                    </h3>

                    <p>
                        ${escapeHTML(
                            errorObject.message ||
                            "Please try again."
                        )}
                    </p>

                </div>

            `;

        }

    } finally {

        if (loading) {
            loading.hidden = true;
        }

    }

}


/* =========================================================
   ACTIVE SUPPORT COUNT
========================================================= */

function updateActiveSupportCounts() {

    const count =
        mentorConversations.length;


    const mainCount =
        document.getElementById("activeSupportCount");

    const badge =
        document.getElementById("activeSupportBadge");


    if (mainCount) {
        mainCount.textContent = count;
    }

    if (badge) {
        badge.textContent = count;
    }

}


/* =========================================================
   CREATE ACTIVE SUPPORT CARD
========================================================= */

function createActiveSupportCard(
    conversation
) {

    const card =
        document.createElement("button");

    card.type = "button";

    card.className =
        "active-support-card";


    card.dataset.conversationId =
        conversation.id;


    const nickname =
        conversation.nickname ||
        "MindSpeak Member";


    const avatar =
        conversation.avatar ||
        "🌱";


    const topic =
        conversation.topic ||
        "Support";


    const status =
        conversation.status ||
        "active";


    /*
     * The existing /mentor/conversations endpoint
     * does not necessarily provide last_message.
     *
     * Therefore we do NOT invent a message preview.
     */

    let previewHTML = "";


    if (conversation.last_message) {

        previewHTML = `

            <div class="active-support-preview">

                ${escapeHTML(
                    conversation.last_message
                )}

            </div>

        `;

    }


    card.innerHTML = `

        <div class="active-support-avatar">
            ${escapeHTML(avatar)}
        </div>


        <div class="active-support-info">

            <div class="active-support-name">
                ${escapeHTML(nickname)}
            </div>


            <div class="active-support-topic">
                ${escapeHTML(topic)}
            </div>


            ${previewHTML}

        </div>


        <div class="active-support-status">

            ${escapeHTML(
                formatStatus(status)
            )}

        </div>

    `;


    card.addEventListener(
        "click",
        function () {

            openConversation(
                conversation.id,
                card
            );

        }
    );


    return card;

}


/* =========================================================
   OPEN CONVERSATION
========================================================= */

async function openConversation(
    conversationId,
    selectedCard
) {

    if (!conversationId) {
        return;
    }


    selectedConversationId =
        conversationId;


    /*
     * Highlight selected student.
     */

    document
        .querySelectorAll(".active-support-card")
        .forEach(
            function (card) {

                card.classList.remove("active");

            }
        );


    if (selectedCard) {
        selectedCard.classList.add("active");
    }


    const emptyState =
        document.getElementById(
            "mentorConversationEmpty"
        );


    const activeConversation =
        document.getElementById(
            "mentorActiveConversation"
        );


    if (emptyState) {
        emptyState.hidden = true;
    }


    if (activeConversation) {
        activeConversation.hidden = false;
    }


    /*
     * Find conversation information
     * from already-loaded real data.
     */

    selectedConversation =
        mentorConversations.find(
            function (conversation) {

                return String(conversation.id) ===
                    String(conversationId);

            }
        ) || null;


    updateConversationHeader(
        selectedConversation
    );


    await loadConversationMessages(
        conversationId
    );


    await markMessagesAsRead(
        conversationId
    );

}


/* =========================================================
   UPDATE CONVERSATION HEADER
========================================================= */

function updateConversationHeader(
    conversation
) {

    if (!conversation) {
        return;
    }


    const avatar =
        document.getElementById(
            "mentorChatAvatar"
        );


    const nickname =
        document.getElementById(
            "mentorChatNickname"
        );


    const topic =
        document.getElementById(
            "mentorChatTopic"
        );


    const status =
        document.getElementById(
            "mentorChatStatus"
        );


    if (avatar) {

        avatar.textContent =
            conversation.avatar ||
            "🌱";

    }


    if (nickname) {

        nickname.textContent =
            conversation.nickname ||
            "MindSpeak Member";

    }


    if (topic) {

        topic.textContent =
            conversation.topic ||
            "Support";

    }


    if (status) {

        status.textContent =
            formatStatus(
                conversation.status ||
                "active"
            );

    }

}


/* =========================================================
   LOAD MESSAGES
========================================================= */

async function loadConversationMessages(
    conversationId
) {

    const messagesContainer =
        document.getElementById(
            "mentorChatMessages"
        );


    if (!messagesContainer) {
        return;
    }


    messagesContainer.innerHTML = `

        <div class="panel-loading">

            <i class="fa-solid fa-spinner fa-spin"></i>

            <span>
                Loading conversation...
            </span>

        </div>

    `;


    try {

        /*
         * Load conversation details first.
         */

        const conversationResponse =
            await fetch(
                `${API}/mentor/conversation/${encodeURIComponent(conversationId)}?session_token=${encodeURIComponent(sessionToken)}`
            );


        const conversationData =
            await conversationResponse.json();


        console.log(
            "Conversation:",
            conversationData
        );


        if (
            !conversationResponse.ok ||
            conversationData.error
        ) {

            throw new Error(
                conversationData.error ||
                "Unable to load conversation."
            );

        }


        /*
         * Some backend versions return the
         * conversation directly while others
         * wrap it.
         */

        const conversation =
            conversationData.conversation ||
            conversationData;


        if (conversation) {

            selectedConversation =
                conversation;

            updateConversationHeader(
                conversation
            );

        }


        /*
         * Load messages.
         */

        const response =
            await fetch(
                `${API}/mentor/conversation/${encodeURIComponent(conversationId)}/messages?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        console.log(
            "Conversation messages:",
            data
        );


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to load messages."
            );

        }


        const messages =
            data.messages || [];


        renderMessages(
            messages
        );


        await markMessagesAsRead(
            conversationId
        );


    } catch (errorObject) {

        console.error(
            "Message loading error:",
            errorObject
        );


        messagesContainer.innerHTML = `

            <div class="panel-empty">

                <div class="panel-empty-icon">
                    <i class="fa-solid fa-circle-exclamation"></i>
                </div>

                <h3>
                    Unable to load conversation
                </h3>

                <p>
                    ${escapeHTML(
                        errorObject.message ||
                        "Please try again."
                    )}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   RENDER MESSAGES
========================================================= */

function renderMessages(
    messages
) {

    const container =
        document.getElementById(
            "mentorChatMessages"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!messages || messages.length === 0) {

        container.innerHTML = `

            <div class="panel-empty">

                <div class="panel-empty-icon">
                    <i class="fa-regular fa-comments"></i>
                </div>

                <h3>
                    Start the conversation
                </h3>

                <p>
                    Send a supportive message to
                    begin the conversation.
                </p>

            </div>

        `;

        return;
    }


    messages.forEach(
        function (message) {

            const element =
                createMessageElement(
                    message
                );


            if (element) {
                container.appendChild(element);
            }

        }
    );


    scrollMessagesToBottom();

}


/* =========================================================
   CREATE MESSAGE
========================================================= */

function createMessageElement(
    message
) {

    const wrapper =
        document.createElement("div");


    /*
     * Backend implementations can expose
     * sender information in different fields.
     *
     * We determine whether the message belongs
     * to the current mentor using the available
     * sender/user fields.
     */

    const senderId =
        message.sender_id ??
        message.user_id ??
        message.from_user_id;


    const isOwnMessage =
        String(senderId) ===
        String(getCurrentUserId());


    wrapper.className =
        isOwnMessage
            ? "mentor-message sent"
            : "mentor-message received";


    const bubble =
        document.createElement("div");


    bubble.className =
        "mentor-message-bubble";


    const messageText =
        message.message ??
        message.content ??
        message.text ??
        "";


    const textElement =
        document.createElement("div");


    textElement.textContent =
        String(messageText);


    bubble.appendChild(
        textElement
    );


    if (message.created_at) {

        const time =
            document.createElement("span");


        time.className =
            "mentor-message-time";


        time.textContent =
            formatDate(
                message.created_at
            );


        bubble.appendChild(
            time
        );

    }


    wrapper.appendChild(
        bubble
    );


    return wrapper;

}


/* =========================================================
   SEND MESSAGE
========================================================= */

async function sendMessage() {

    if (isSendingMessage) {
        return;
    }


    if (!selectedConversationId) {

        showPageError(
            "Please select a support conversation first."
        );

        return;
    }


    const input =
        document.getElementById(
            "mentorMessageInput"
        );


    const sendButton =
        document.getElementById(
            "mentorSendMessageBtn"
        );


    if (!input) {
        return;
    }


    const message =
        input.value.trim();


    if (!message) {
        return;
    }


    isSendingMessage = true;


    if (sendButton) {
        sendButton.disabled = true;
    }


    try {

        const response =
            await fetch(
                `${API}/mentor/conversation/${encodeURIComponent(selectedConversationId)}/messages`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
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


        console.log(
            "Send message response:",
            data
        );


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to send message."
            );

        }


        input.value = "";


        /*
         * Reload messages from backend so the
         * UI always reflects the real database.
         */

        await loadConversationMessages(
            selectedConversationId
        );


    } catch (errorObject) {

        console.error(
            "Send message error:",
            errorObject
        );


        showPageError(
            errorObject.message ||
            "Unable to send message."
        );

    } finally {

        isSendingMessage = false;

        if (sendButton) {
            sendButton.disabled = false;
        }

        if (input) {
            input.focus();
        }

    }

}


/* =========================================================
   COMPOSER
========================================================= */

function setupComposer() {

    const composer =
        document.getElementById(
            "mentorChatComposer"
        );


    if (!composer) {
        return;
    }


    composer.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            sendMessage();

        }
    );


    const input =
        document.getElementById(
            "mentorMessageInput"
        );


    if (input) {

        input.addEventListener(
            "keydown",
            function (event) {

                if (
                    event.key === "Enter" &&
                    !event.shiftKey
                ) {

                    event.preventDefault();

                    sendMessage();

                }

            }
        );

    }

}


/* =========================================================
   ATTACHMENT BUTTON
========================================================= */

function setupAttachmentButton() {

    const button =
        document.getElementById(
            "mentorAttachmentBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            /*
             * Attachments are not currently
             * supported by the existing mentor
             * message endpoint.
             *
             * Therefore this button does not
             * pretend to upload anything.
             */

            console.log(
                "Attachments are not available in the current mentor messaging API."
            );

        }
    );

}


/* =========================================================
   CONVERSATION MENU
========================================================= */

function setupConversationMenu() {

    const button =
        document.getElementById(
            "mentorChatMenuBtn"
        );


    if (!button) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            if (!selectedConversationId) {
                return;
            }

            console.log(
                "Conversation options:",
                selectedConversationId
            );

        }
    );

}


/* =========================================================
   MARK MESSAGES AS READ
========================================================= */

async function markMessagesAsRead(
    conversationId
) {

    if (!conversationId) {
        return;
    }


    try {

        await fetch(
            `${API}/mentor/conversation/${encodeURIComponent(conversationId)}/messages/read`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    session_token:
                        sessionToken
                })

            }
        );


    } catch (errorObject) {

        console.error(
            "Mark messages as read error:",
            errorObject
        );

    }

}


/* =========================================================
   GET CURRENT USER ID
========================================================= */

function getCurrentUserId() {

    /*
     * Use values already stored by the
     * existing authentication system if available.
     */

    const possibleKeys = [
        "user_id",
        "current_user_id",
        "userId"
    ];


    for (
        const key of possibleKeys
    ) {

        const value =
            localStorage.getItem(key);


        if (value) {
            return value;
        }

    }


    return null;

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
    status
) {

    if (!status) {
        return "Active";
    }


    const normalized =
        String(status)
            .toLowerCase();


    if (normalized === "active") {
        return "Active";
    }


    if (normalized === "ended") {
        return "Ended";
    }


    if (normalized === "closed") {
        return "Closed";
    }


    return String(status)
        .charAt(0)
        .toUpperCase() +
        String(status)
            .slice(1);

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        new Date(value);


    if (Number.isNaN(
        date.getTime()
    )) {

        return String(value);

    }


    const now =
        new Date();


    const difference =
        now.getTime() -
        date.getTime();


    const minute =
        60 * 1000;

    const hour =
        60 * minute;

    const day =
        24 * hour;


    if (difference >= 0) {

        if (difference < minute) {
            return "Just now";
        }


        if (difference < hour) {

            return (
                Math.floor(
                    difference / minute
                ) +
                " min ago"
            );

        }


        if (difference < day) {

            return (
                Math.floor(
                    difference / hour
                ) +
                "h ago"
            );

        }


        if (difference < 7 * day) {

            return (
                Math.floor(
                    difference / day
                ) +
                "d ago"
            );

        }

    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* =========================================================
   SCROLL CHAT
========================================================= */

function scrollMessagesToBottom() {

    const container =
        document.getElementById(
            "mentorChatMessages"
        );


    if (!container) {
        return;
    }


    requestAnimationFrame(
        function () {

            container.scrollTop =
                container.scrollHeight;

        }
    );

}


/* =========================================================
   PAGE ERROR
========================================================= */

function showPageError(
    message
) {

    const error =
        document.getElementById(
            "requestsPageError"
        );


    const errorText =
        document.getElementById(
            "requestsPageErrorText"
        );


    if (errorText) {
        errorText.textContent =
            message;
    }


    if (error) {
        error.hidden = false;
    }

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    value
) {

    const div =
        document.createElement("div");


    div.textContent =
        value === null ||
        value === undefined
            ? ""
            : String(value);


    return div.innerHTML;

}