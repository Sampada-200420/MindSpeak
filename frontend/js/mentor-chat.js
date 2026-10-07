document.addEventListener("DOMContentLoaded", function () {

    const API = "http://127.0.0.1:8000";

    const sessionToken = localStorage.getItem("session_token");

    const params = new URLSearchParams(window.location.search);
    const conversationId = params.get("id");


    // =====================================================
    // ELEMENTS
    // =====================================================

    const chatLoading = document.getElementById("chatLoading");
    const chatError = document.getElementById("chatError");
    const chatErrorMessage = document.getElementById("chatErrorMessage");
    const chatRetryBtn = document.getElementById("chatRetryBtn");

    const chatContent = document.getElementById("chatContent");

    const chatAvatar = document.getElementById("chatAvatar");
    const chatPersonName = document.getElementById("chatPersonName");
    const chatStatusText = document.getElementById("chatStatusText");

    const messagesContainer =
        document.getElementById("messagesContainer");

    const messageForm =
        document.getElementById("messageForm");

    const messageInput =
        document.getElementById("messageInput");

    const sendMessageBtn =
        document.getElementById("sendMessageBtn");

    const characterCount =
        document.getElementById("characterCount");


    // =====================================================
    // VALIDATION
    // =====================================================

    if (!sessionToken) {
        showError("Please login to access this conversation.");
        return;
    }

    if (!conversationId) {
        showError("Conversation ID is missing.");
        return;
    }


    // =====================================================
    // LOAD CHAT
    // =====================================================

    async function loadChat() {

        showLoading();

        try {

            // ---------------------------------------------
            // Load conversation details
            // ---------------------------------------------

            const conversationResponse = await fetch(
                `${API}/mentor/conversation/${encodeURIComponent(conversationId)}?session_token=${encodeURIComponent(sessionToken)}`
            );

            const conversationData =
                await conversationResponse.json();


            if (
                !conversationResponse.ok ||
                conversationData.error
            ) {
                showError(
                    conversationData.error ||
                    "Unable to load conversation."
                );
                return;
            }


            const conversation =
                conversationData.conversation;


            // ---------------------------------------------
            // Determine which person to display
            // ---------------------------------------------

            const currentUserId =
                getCurrentUserId();


            let personName = "Mentor";
            let personAvatar = "🌿";


            if (
                currentUserId &&
                Number(currentUserId) === Number(conversation.mentor_id)
            ) {

                personName =
                    conversation.student_nickname || "Student";

                personAvatar =
                    conversation.student_avatar || "🌱";

            } else {

                personName =
                    conversation.mentor_nickname || "Mentor";

                personAvatar =
                    conversation.mentor_avatar || "🌿";
            }


            chatPersonName.textContent = personName;
            chatAvatar.textContent = personAvatar;


            // ---------------------------------------------
            // Conversation status
            // ---------------------------------------------

            if (conversation.status === "active") {

                chatStatusText.textContent = "Active";

            } else {

                chatStatusText.textContent = "Conversation ended";

                messageInput.disabled = true;
                sendMessageBtn.disabled = true;
            }


            // ---------------------------------------------
            // Load messages
            // ---------------------------------------------

            await loadMessages();


            // ---------------------------------------------
            // Mark incoming messages as read
            // ---------------------------------------------

            await markMessagesAsRead();


            hideAllStates();

            chatContent.hidden = false;

        } catch (error) {

            console.error(
                "Load mentor chat error:",
                error
            );

            showError(
                "Unable to connect to MindSpeak. Please try again."
            );
        }
    }


    // =====================================================
    // LOAD MESSAGES
    // =====================================================

    async function loadMessages() {

        const response = await fetch(
            `${API}/mentor/conversation/${encodeURIComponent(conversationId)}/messages?session_token=${encodeURIComponent(sessionToken)}`
        );

        const data = await response.json();


        if (!response.ok || data.error) {

            throw new Error(
                data.error || "Unable to load messages."
            );
        }


        renderMessages(data.messages || []);
    }


    // =====================================================
    // MARK MESSAGES AS READ
    // =====================================================

    async function markMessagesAsRead() {

        try {

            const response = await fetch(
                `${API}/mentor/conversation/${encodeURIComponent(conversationId)}/messages/read`,
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


            const data = await response.json();


            if (!response.ok || data.error) {

                console.warn(
                    "Unable to mark messages as read:",
                    data.error || "Unknown error"
                );

                return;
            }


            console.log(
                "Messages marked as read:",
                data.updated_count
            );

        } catch (error) {

            console.warn(
                "Mark messages as read error:",
                error
            );

        }
    }


    // =====================================================
    // RENDER MESSAGES
    // =====================================================

    function renderMessages(messages) {

        messagesContainer.innerHTML = "";


        if (messages.length === 0) {

            const emptyMessage =
                document.createElement("div");

            emptyMessage.className =
                "messages-empty";

            emptyMessage.innerHTML = `
                <div class="messages-empty-icon">
                    <i class="fa-regular fa-comments"></i>
                </div>

                <h2>Start the conversation</h2>

                <p>
                    This is a private space for you and your mentor.
                    Send a message whenever you're ready.
                </p>
            `;

            messagesContainer.appendChild(emptyMessage);

            return;
        }


        messages.forEach(function (message) {

            const messageElement =
                document.createElement("div");


            const isMine =
                Number(message.sender_id) ===
                Number(getCurrentUserId());


            messageElement.className =
                `message-row ${isMine ? "message-mine" : "message-theirs"}`;


            const bubble =
                document.createElement("div");

            bubble.className = "message-bubble";


            const messageText =
                document.createElement("p");

            messageText.textContent =
                message.message;


            const messageTime =
                document.createElement("span");

            messageTime.className =
                "message-time";

            messageTime.textContent =
                formatMessageTime(message.created_at);


            bubble.appendChild(messageText);
            bubble.appendChild(messageTime);

            messageElement.appendChild(bubble);

            messagesContainer.appendChild(messageElement);

        });


        scrollMessagesToBottom();
    }


    // =====================================================
    // SEND MESSAGE
    // =====================================================

    messageForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                messageInput.value.trim();


            if (!message) {
                return;
            }


            if (message.length > 2000) {

                alert(
                    "Message must be 2000 characters or less."
                );

                return;
            }


            sendMessageBtn.disabled = true;


            try {

                const response = await fetch(
                    `${API}/mentor/conversation/${encodeURIComponent(conversationId)}/messages`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            session_token: sessionToken,
                            message: message
                        })
                    }
                );


                const data =
                    await response.json();


                if (!response.ok || data.error) {

                    alert(
                        data.error ||
                        "Unable to send message."
                    );

                    return;
                }


                messageInput.value = "";

                updateCharacterCount();


                await loadMessages();


            } catch (error) {

                console.error(
                    "Send mentor message error:",
                    error
                );

                alert(
                    "Unable to connect to MindSpeak."
                );

            } finally {

                sendMessageBtn.disabled = false;

                messageInput.focus();
            }

        }
    );


    // =====================================================
    // CHARACTER COUNT
    // =====================================================

    messageInput.addEventListener(
        "input",
        updateCharacterCount
    );


    function updateCharacterCount() {

        const length =
            messageInput.value.length;

        characterCount.textContent =
            `${length} / 2000`;
    }


    // =====================================================
    // TEXTAREA ENTER BEHAVIOR
    // =====================================================

    messageInput.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {

                event.preventDefault();

                messageForm.requestSubmit();
            }

        }
    );


    // =====================================================
    // RETRY
    // =====================================================

    if (chatRetryBtn) {

        chatRetryBtn.addEventListener(
            "click",
            loadChat
        );

    }


    // =====================================================
    // HELPERS
    // =====================================================

    function getCurrentUserId() {

        return (
            localStorage.getItem("user_id") ||
            localStorage.getItem("id")
        );
    }


    function formatMessageTime(dateString) {

        if (!dateString) {
            return "";
        }


        const date =
            new Date(dateString);


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


    function scrollMessagesToBottom() {

        messagesContainer.scrollTop =
            messagesContainer.scrollHeight;
    }


    // =====================================================
    // UI STATES
    // =====================================================

    function showLoading() {

        chatLoading.hidden = false;
        chatError.hidden = true;
        chatContent.hidden = true;

    }


    function showError(message) {

        chatLoading.hidden = true;
        chatError.hidden = false;
        chatContent.hidden = true;

        if (chatErrorMessage) {
            chatErrorMessage.textContent = message;
        }

    }


    function hideAllStates() {

        chatLoading.hidden = true;
        chatError.hidden = true;

    }


    // =====================================================
    // START
    // =====================================================

    loadChat();

});