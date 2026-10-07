document.addEventListener("DOMContentLoaded", function () {

    const API = "http://127.0.0.1:8000";

    const sessionToken = localStorage.getItem("session_token");

    const loadingState = document.getElementById("conversationsLoading");
    const errorState = document.getElementById("conversationsError");
    const errorMessage = document.getElementById("conversationsErrorMessage");
    const emptyState = document.getElementById("conversationsEmpty");
    const conversationsSection = document.getElementById("conversationsSection");
    const conversationsList = document.getElementById("conversationsList");
    const retryButton = document.getElementById("conversationsRetryBtn");


    // =====================================================
    // CHECK LOGIN
    // =====================================================

    if (!sessionToken) {
        showError("Please login to view your mentor conversations.");
        return;
    }


    // =====================================================
    // LOAD CONVERSATIONS
    // =====================================================

    async function loadConversations() {

        showLoading();

        try {

            const response = await fetch(
                `${API}/mentor/conversations?session_token=${encodeURIComponent(sessionToken)}`
            );

            const data = await response.json();

            console.log("Mentor conversations:", data);


            if (!response.ok || data.error) {
                showError(
                    data.error || "Unable to load conversations."
                );
                return;
            }


            const conversations = data.conversations || [];


            if (conversations.length === 0) {
                showEmpty();
                return;
            }


            renderConversations(conversations);

        } catch (error) {

            console.error(
                "Load mentor conversations error:",
                error
            );

            showError(
                "Unable to connect to MindSpeak. Please try again."
            );
        }
    }


    // =====================================================
    // RENDER CONVERSATIONS
    // =====================================================

    function renderConversations(conversations) {

        conversationsList.innerHTML = "";

        conversations.forEach(function (conversation) {

            const card = document.createElement("article");

            card.className = "conversation-card";


            // -------------------------------------------------
            // STATUS
            // -------------------------------------------------

            const statusClass =
                conversation.status === "active"
                    ? "status-active"
                    : "status-ended";

            const statusText =
                conversation.status === "active"
                    ? "Active"
                    : "Ended";


            // -------------------------------------------------
            // DATE
            // -------------------------------------------------

            const formattedDate =
                formatDate(conversation.started_at);


            // -------------------------------------------------
            // CARD
            // -------------------------------------------------

            card.innerHTML = `
                <div class="conversation-person">

                    <div class="conversation-avatar">
                        ${
                            conversation.avatar
                                ? escapeHtml(conversation.avatar)
                                : "🌿"
                        }
                    </div>

                    <div class="conversation-info">

                        <h2>
                            ${escapeHtml(conversation.nickname || "Mentor")}
                        </h2>

                        <p>
                            Mentor Support
                        </p>

                    </div>

                </div>


                <div class="conversation-meta">

                    <span class="conversation-status ${statusClass}">
                        <span class="status-dot"></span>
                        ${statusText}
                    </span>

                    <span class="conversation-date">
                        Started ${formattedDate}
                    </span>

                </div>


                <button
                    type="button"
                    class="open-conversation-btn"
                    data-conversation-id="${conversation.id}"
                >
                    ${
                        conversation.status === "active"
                            ? "Open Conversation"
                            : "View Conversation"
                    }

                    <i class="fa-solid fa-arrow-right"></i>
                </button>
            `;


            conversationsList.appendChild(card);

        });


        hideAllStates();

        conversationsSection.hidden = false;
    }


    // =====================================================
    // OPEN CONVERSATION
    // =====================================================

    document.addEventListener("click", function (event) {

        const button =
            event.target.closest(".open-conversation-btn");

        if (!button) {
            return;
        }


        const conversationId =
            button.dataset.conversationId;


        if (!conversationId) {
            console.error("Conversation ID not found.");
            return;
        }


        window.location.href =
            `mentor-chat.html?id=${encodeURIComponent(conversationId)}`;
    });


    // =====================================================
    // RETRY
    // =====================================================

    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadConversations
        );

    }


    // =====================================================
    // UI STATES
    // =====================================================

    function showLoading() {

        loadingState.hidden = false;
        errorState.hidden = true;
        emptyState.hidden = true;
        conversationsSection.hidden = true;

    }


    function showEmpty() {

        loadingState.hidden = true;
        errorState.hidden = true;
        emptyState.hidden = false;
        conversationsSection.hidden = true;

    }


    function showError(message) {

        loadingState.hidden = true;
        errorState.hidden = false;
        emptyState.hidden = true;
        conversationsSection.hidden = true;

        if (errorMessage) {
            errorMessage.textContent = message;
        }

    }


    function hideAllStates() {

        loadingState.hidden = true;
        errorState.hidden = true;
        emptyState.hidden = true;

    }


    // =====================================================
    // FORMAT DATE
    // =====================================================

    function formatDate(dateString) {

        if (!dateString) {
            return "Unknown date";
        }


        const date = new Date(dateString);


        if (Number.isNaN(date.getTime())) {
            return "Unknown date";
        }


        return date.toLocaleDateString(
            undefined,
            {
                year: "numeric",
                month: "short",
                day: "numeric"
            }
        );
    }


    // =====================================================
    // ESCAPE HTML
    // =====================================================

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =====================================================
    // START
    // =====================================================

    loadConversations();

});


