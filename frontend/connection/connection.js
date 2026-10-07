/* =========================================================
   MINDSPEAK CONNECTION
   People + Mentors + Requests + Connections
   ========================================================= */


/* =========================================================
   API
   ========================================================= */

const API_BASE_URL =
    "http://127.0.0.1:8000";


/* =========================================================
   STATE
   ========================================================= */

let connectionMembers = [];
let connectionMentors = [];

let incomingRequests = [];
let sentRequests = [];

let peerConversations = [];
let mentorConversations = [];

let activeRequestTab = "incoming";
let activeConnectionTab = "friends";

let selectedConnectionMember = null;

// Show the first 8 members initially.
// "See More" expands the list to all available members.
let showAllMembers = false;


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeConnectionPage();

    }
);


/* =========================================================
   INITIALIZE PAGE
   ========================================================= */

async function initializeConnectionPage() {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showLoginState();

        return;

    }


    /*
     * Load independent sections separately.
     * If one API fails, the others can still load.
     */

    await Promise.allSettled([

        loadConnectionMembers(),

        loadMentors(),

        loadConnectionRequests(),

        loadPeerConversations(),

        loadMentorConversations()

    ]);


    setupTopicFilters();

    setupSearch();

    setupDashboardButtons();

    setupRequestTabs();

    setupConnectionTabs();

}


/* =========================================================
   LOAD CONNECTION MEMBERS
   ========================================================= */

async function loadConnectionMembers(
    topic = ""
) {

    const membersGrid =
        document.getElementById(
            "membersGrid"
        );


    if (!membersGrid) {
        return;
    }


    membersGrid.innerHTML = `
        <div class="member-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Finding people who understand...</p>
        </div>
    `;


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showLoginState();

        return;

    }


    try {

        let url =
            `${API_BASE_URL}/connection/members`;


        if (topic) {

            url +=
                `?topic=${encodeURIComponent(topic)}`;

        }


        const separator =
            url.includes("?")
                ? "&"
                : "?";


        const response =
            await fetch(
                `${url}${separator}session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load members."
            );

        }


        connectionMembers =
            Array.isArray(data)
                ? data
                : Array.isArray(data.members)
                    ? data.members
                    : [];


        renderMembers(
            connectionMembers
        );


    } catch (error) {

        console.error(
            "Connection members error:",
            error
        );


        membersGrid.innerHTML = `
            <div class="member-loading">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>
                    We couldn't load members right now.
                </p>
            </div>
        `;

    }

}


/* =========================================================
   RENDER MEMBERS
   ========================================================= */

function renderMembers(
    members
) {

    const membersGrid =
        document.getElementById(
            "membersGrid"
        );


    if (!membersGrid) {
        return;
    }


    if (
        !members ||
        members.length === 0
    ) {

        membersGrid.innerHTML = `
            <div class="member-loading">
                <i class="fa-regular fa-face-smile"></i>
                <p>
                    No members found for this topic yet.
                </p>
            </div>
        `;

        return;

    }


    membersGrid.innerHTML = "";


    const visibleMembers =
        showAllMembers
            ? members
            : members.slice(0, 8);


    visibleMembers.forEach(
        function (member) {

            membersGrid.appendChild(
                createMemberCard(member)
            );

        }
    );


    updateViewMoreMembersButton(
        members.length
    );

}


/* =========================================================
   UPDATE VIEW MORE MEMBERS BUTTON
   ========================================================= */

function updateViewMoreMembersButton(
    totalMembers
) {

    const button =
        document.getElementById(
            "viewMoreMembersBtn"
        );


    if (!button) {
        return;
    }


    if (
        totalMembers <= 8 ||
        showAllMembers
    ) {

        button.hidden = true;
        return;

    }


    button.hidden = false;

}


/* =========================================================
   CREATE MEMBER CARD
   ========================================================= */

function createMemberCard(
    member
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "member-card";


    const nickname =
        escapeHTML(
            member.nickname ||
            "Anonymous Member"
        );


    const bio =
        escapeHTML(
            member.bio ||
            "Looking for someone who understands."
        );


    const topics =
        parseTopics(
            member.topics
        );


    const avatar =
        member.avatar ||
        "";


    const topicsHTML =
        topics.length

            ? topics
                .slice(0, 2)
                .map(
                    function (topic) {

                        return `
                            <span class="member-topic">
                                ${escapeHTML(topic)}
                            </span>
                        `;

                    }
                )
                .join("")

            : `
                <span class="member-topic">
                    Just here to connect
                </span>
            `;


    card.innerHTML = `

        <div class="member-card-top">

            <div class="member-avatar">

                ${createAvatarHTML(avatar)}

            </div>

            <div class="member-status">

                <span class="status-dot"></span>

                Available

            </div>

        </div>


        <h3 class="member-name">
            ${nickname}
        </h3>


        <p class="member-bio">
            ${bio}
        </p>


        <div class="member-topics">

            ${topicsHTML}

        </div>


        <button
            type="button"
            class="member-connect-btn"
        >
            <i class="fa-solid fa-user-plus"></i>
            Connect
        </button>

    `;


    const button =
        card.querySelector(
            ".member-connect-btn"
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                openConnectionRequest(
                    member
                );

            }
        );

    }


    return card;

}


/* =========================================================
   TOPIC FILTERS
   ========================================================= */

function setupTopicFilters() {

    const topicCards =
        document.querySelectorAll(
            ".topic-card"
        );


    topicCards.forEach(
        function (card) {

            card.addEventListener(
                "click",
                function () {

                    topicCards.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    card.classList.add(
                        "active"
                    );


                    const topic =
                        card.dataset.topic ||
                        "";


                    showAllMembers = false;


                    loadConnectionMembers(
                        topic
                    );

                }
            );

        }
    );

}


/* =========================================================
   LOAD MENTORS
   ========================================================= */

async function loadMentors() {

    const mentorGrid =
        document.getElementById(
            "mentorGrid"
        );


    if (!mentorGrid) {
        return;
    }


    mentorGrid.innerHTML = `
        <div class="mentor-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Finding available mentors...</p>
        </div>
    `;


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/mentor/mentors?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load mentors."
            );

        }


        connectionMentors =
            Array.isArray(data)
                ? data
                : Array.isArray(data.mentors)
                    ? data.mentors
                    : [];


        renderMentors(
            connectionMentors
        );


    } catch (error) {

        console.error(
            "Mentor loading error:",
            error
        );


        mentorGrid.innerHTML = `
            <div class="mentor-loading">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>
                    We couldn't load mentors right now.
                </p>
            </div>
        `;

    }

}


/* =========================================================
   RENDER MENTORS
   ========================================================= */

function renderMentors(
    mentors
) {

    const mentorGrid =
        document.getElementById(
            "mentorGrid"
        );


    if (!mentorGrid) {
        return;
    }


    if (
        !mentors ||
        mentors.length === 0
    ) {

        mentorGrid.innerHTML = `
            <div class="mentor-loading">
                <i class="fa-regular fa-face-smile"></i>
                <p>
                    There are no available mentors right now.
                </p>
            </div>
        `;

        return;

    }


    mentorGrid.innerHTML = "";


    mentors
        .slice(0, 4)
        .forEach(
            function (mentor) {

                mentorGrid.appendChild(
                    createMentorCard(
                        mentor
                    )
                );

            }
        );

}


/* =========================================================
   CREATE MENTOR CARD
   ========================================================= */

function createMentorCard(
    mentor
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "mentor-card";


    const nickname =
        escapeHTML(
            mentor.nickname ||
            "MindSpeak Mentor"
        );


    const bio =
        escapeHTML(
            mentor.bio ||
            "Here to listen, guide, and support you."
        );


    const topics =
        parseTopics(
            mentor.topics
        );


    const isOnline =
        mentor.is_mentor_online === 1 ||
        mentor.is_mentor_online === true;


    const statusText =
        isOnline
            ? "Available now"
            : "Offline";


    const topicsHTML =
        topics
            .slice(0, 2)
            .map(
                function (topic) {

                    return `
                        <span class="mentor-topic">
                            ${escapeHTML(topic)}
                        </span>
                    `;

                }
            )
            .join("");


    card.innerHTML = `

        <div class="mentor-card-top">

            <div class="mentor-avatar">

                ${createAvatarHTML(
                    mentor.avatar
                )}

            </div>


            <div class="mentor-card-info">

                <h3 class="mentor-name">
                    ${nickname}
                </h3>

                <p class="mentor-role">
                    Peer Mentor
                </p>

                <span class="mentor-online">

                    <span class="mentor-online-dot"></span>

                    ${statusText}

                </span>

            </div>

        </div>


        <p class="mentor-bio">
            ${bio}
        </p>


        <div class="mentor-topics">

            ${
                topicsHTML ||
                `
                    <span class="mentor-topic">
                        Support
                    </span>
                `
            }

        </div>


        <button
            type="button"
            class="mentor-talk-btn"
        >
            <i class="fa-solid fa-user-plus"></i>
            Talk to Mentor
        </button>

    `;


    const button =
        card.querySelector(
            ".mentor-talk-btn"
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                if (!mentor.id) {

                    console.error(
                        "Mentor ID missing:",
                        mentor
                    );

                    return;

                }


                /*
                 * Existing Mentor workflow.
                 * Do NOT create a new request system here.
                 */

                window.location.href =
                    `../mentor/mentor-profile.html?id=${encodeURIComponent(mentor.id)}`;

            }
        );

    }


    return card;

}


/* =========================================================
   LOAD CONNECTION REQUESTS
   ========================================================= */

async function loadConnectionRequests() {

    const requestList =
        document.getElementById(
            "connectionRequestList"
        );


    if (!requestList) {
        return;
    }


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {
        return;
    }


    requestList.innerHTML = `
        <div class="side-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading requests...</p>
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
                "Unable to load requests."
            );

        }


        const incoming =
            Array.isArray(data.incoming)
                ? data.incoming
                : Array.isArray(data.received)
                    ? data.received
                    : [];


        const sent =
            Array.isArray(data.sent)
                ? data.sent
                : [];


        incomingRequests =
            incoming.filter(
                function (request) {

                    return request.status === "pending";

                }
            );


        sentRequests =
            sent.filter(
                function (request) {

                    return request.status === "pending";

                }
            );


        updateRequestCounts();


        renderRequestTab();

    } catch (error) {

        console.error(
            "Connection request error:",
            error
        );


        requestList.innerHTML = `
            <div class="side-loading">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>
                    We couldn't load your requests.
                </p>
            </div>
        `;

    }

}


/* =========================================================
   REQUEST COUNTS
   ========================================================= */

function updateRequestCounts() {

    const incomingCount =
        document.getElementById(
            "incomingRequestCount"
        );


    const sentCount =
        document.getElementById(
            "sentRequestCount"
        );


    if (incomingCount) {

        incomingCount.textContent =
            incomingRequests.length;

    }


    if (sentCount) {

        sentCount.textContent =
            sentRequests.length;

    }

}


/* =========================================================
   REQUEST TABS
   ========================================================= */

function setupRequestTabs() {

    const tabs =
        document.querySelectorAll(
            ".request-tab"
        );


    tabs.forEach(
        function (tab) {

            tab.addEventListener(
                "click",
                function () {

                    activeRequestTab =
                        tab.dataset.requestTab ||
                        "incoming";


                    tabs.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    tab.classList.add(
                        "active"
                    );


                    renderRequestTab();

                }
            );

        }
    );

}


/* =========================================================
   RENDER REQUEST TAB
   ========================================================= */

function renderRequestTab() {

    const requestList =
        document.getElementById(
            "connectionRequestList"
        );


    if (!requestList) {
        return;
    }


    const requests =
        activeRequestTab === "sent"
            ? sentRequests
            : incomingRequests;


    if (!requests.length) {

        requestList.innerHTML = `

            <div class="side-loading">

                <i class="fa-regular fa-paper-plane"></i>

                <p>
                    ${
                        activeRequestTab === "sent"
                            ? "No sent requests."
                            : "No incoming requests."
                    }
                </p>

            </div>

        `;

        return;

    }


    requestList.innerHTML = "";


    requests
        .slice(0, 5)
        .forEach(
            function (request) {

                requestList.appendChild(
                    createRequestCard(
                        request,
                        activeRequestTab
                    )
                );

            }
        );

}


/* =========================================================
   CREATE REQUEST CARD
   ========================================================= */

function createRequestCard(
    request,
    type
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "connection-request-item";


    const nickname =
        escapeHTML(
            request.nickname ||
            request.sender_nickname ||
            request.receiver_nickname ||
            "Anonymous Member"
        );


    const message =
        escapeHTML(
            request.message ||
            "Would like to connect with you."
        );


    const topic =
        escapeHTML(
            request.topic ||
            "General"
        );


    const time =
        formatTime(
            request.created_at
        );


    const avatar =
        request.avatar ||
        request.sender_avatar ||
        request.receiver_avatar ||
        "";


    let actionsHTML = "";


    if (type === "incoming") {

        actionsHTML = `

            <div class="request-actions">

                <button
                    type="button"
                    class="request-decline-btn"
                >
                    Decline
                </button>

                <button
                    type="button"
                    class="request-accept-btn"
                >
                    Accept
                </button>

            </div>

        `;

    }


    card.innerHTML = `

        <div class="request-person">

            <div class="request-avatar">

                ${createAvatarHTML(avatar)}

            </div>


            <div class="request-person-info">

                <h3>
                    ${nickname}
                </h3>

                <span class="request-time">
                    ${time}
                </span>

            </div>

        </div>


        <p class="request-message">
            ${message}
        </p>


        <div class="request-topics">

            <span class="member-topic">
                ${topic}
            </span>

        </div>


        ${actionsHTML}

    `;


    if (type === "incoming") {

        const acceptButton =
            card.querySelector(
                ".request-accept-btn"
            );


        const declineButton =
            card.querySelector(
                ".request-decline-btn"
            );


        if (acceptButton) {

            acceptButton.addEventListener(
                "click",
                function () {

                    updateConnectionRequestStatus(
                        request.id,
                        "accepted"
                    );

                }
            );

        }


        if (declineButton) {

            declineButton.addEventListener(
                "click",
                function () {

                    updateConnectionRequestStatus(
                        request.id,
                        "declined"
                    );

                }
            );

        }

    }


    return card;

}


/* =========================================================
   UPDATE REQUEST STATUS
   ========================================================= */

async function updateConnectionRequestStatus(
    requestId,
    status
) {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


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
                "Unable to update request."
            );

        }


        await loadConnectionRequests();

        await loadPeerConversations();


    } catch (error) {

        console.error(
            "Request status error:",
            error
        );


        alert(
            error.message ||
            "Unable to update connection request."
        );

    }

}


/* =========================================================
   LOAD PEER CONVERSATIONS
   ========================================================= */

async function loadPeerConversations() {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {
        return;
    }


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


        peerConversations =
            Array.isArray(data)
                ? data
                : Array.isArray(data.conversations)
                    ? data.conversations
                    : [];


        renderConnections();

    } catch (error) {

        console.error(
            "Peer conversations error:",
            error
        );


        renderConnectionsError();

    }

}


/* =========================================================
   LOAD MENTOR CONVERSATIONS
   ========================================================= */

async function loadMentorConversations() {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {
        return;
    }


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


        let conversations =
            Array.isArray(data)
                ? data
                : Array.isArray(data.conversations)
                    ? data.conversations
                    : [];


        /*
         * --------------------------------------------------
         * REMOVE DUPLICATE MENTOR CONVERSATIONS
         *
         * A student should have only one visible
         * conversation entry for the same mentor.
         * --------------------------------------------------
         */

        const uniqueMentors = new Map();


        conversations.forEach(
            function (conversation) {

                const mentorId =
                    conversation.mentor_id ||
                    conversation.mentor_user_id ||
                    conversation.other_user_id ||
                    conversation.user_id;


                if (!mentorId) {
                    return;
                }


                const key =
                    String(mentorId);


                /*
                 * If the same mentor appears more than once,
                 * keep the latest conversation.
                 */

                const existing =
                    uniqueMentors.get(
                        key
                    );


                if (!existing) {

                    uniqueMentors.set(
                        key,
                        conversation
                    );

                    return;

                }


                const existingId =
                    Number(
                        existing.id ||
                        existing.conversation_id ||
                        0
                    );


                const currentId =
                    Number(
                        conversation.id ||
                        conversation.conversation_id ||
                        0
                    );


                if (
                    currentId >
                    existingId
                ) {

                    uniqueMentors.set(
                        key,
                        conversation
                    );

                }

            }
        );


        mentorConversations =
            Array.from(
                uniqueMentors.values()
            );


        updateMentorConnectionCount();


        renderConnections();


    } catch (error) {

        console.error(
            "Mentor conversations error:",
            error
        );


        mentorConversations = [];


        updateMentorConnectionCount();

    }

}


/* =========================================================
   CONNECTION TABS
   ========================================================= */

function setupConnectionTabs() {

    const tabs =
        document.querySelectorAll(
            ".connection-tab"
        );


    tabs.forEach(
        function (tab) {

            tab.addEventListener(
                "click",
                function () {

                    activeConnectionTab =
                        tab.dataset.connectionTab ||
                        "friends";


                    tabs.forEach(
                        function (item) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    tab.classList.add(
                        "active"
                    );


                    renderConnections();

                }
            );

        }
    );

}


/* =========================================================
   RENDER CONNECTIONS
   ========================================================= */

function renderConnections() {

    const list =
        document.getElementById(
            "connectionList"
        );


    if (!list) {
        return;
    }


    const data =
        activeConnectionTab === "mentors"
            ? mentorConversations
            : peerConversations;


    if (!data.length) {

        list.innerHTML = `

            <div class="side-loading">

                <i class="fa-regular fa-comments"></i>

                <p>
                    ${
                        activeConnectionTab === "mentors"
                            ? "No mentor conversations yet."
                            : "No connections yet."
                    }
                </p>

            </div>

        `;

        return;

    }


    list.innerHTML = "";


    data
        .slice(0, 6)
        .forEach(
            function (conversation) {

                list.appendChild(
                    createConnectionItem(
                        conversation,
                        activeConnectionTab
                    )
                );

            }
        );


    updateConnectionCounts();

}


/* =========================================================
   CREATE CONNECTION ITEM
   ========================================================= */

function createConnectionItem(
    conversation,
    type
) {

    const item =
        document.createElement(
            "div"
        );

    item.className =
        "connection-person";


    const nickname =
        escapeHTML(
            conversation.student_nickname ||
            conversation.mentor_nickname ||
            conversation.nickname ||
            conversation.partner_nickname ||
            "Anonymous Member"
        );


    const avatar =
        conversation.student_avatar ||
        conversation.mentor_avatar ||
        conversation.avatar ||
        conversation.partner_avatar ||
        "";


    const lastMessage =
        escapeHTML(
            conversation.last_message ||
            conversation.message ||
            "Continue your conversation."
        );


    const conversationId =
        conversation.id ||
        conversation.conversation_id;


    item.innerHTML = `

        <div class="connection-person-avatar">

            ${createAvatarHTML(avatar)}

        </div>


        <div class="connection-person-info">

            <h3>
                ${nickname}
            </h3>

            <p>
                ${lastMessage}
            </p>

        </div>


        <button
            type="button"
            class="connection-message-btn"
        >
            Message
        </button>

    `;


    const button =
        item.querySelector(
            ".connection-message-btn"
        );


    if (button) {

        button.addEventListener(
            "click",
            function () {

                /*
                 * NORMAL USER:
                 *
                 * Whether the connection is a friend
                 * or an approved mentor, open the
                 * normal Connection Hub.
                 */

                if (conversationId) {

                    window.location.href =
                        `connection-hub.html?conversation_id=${encodeURIComponent(conversationId)}`;

                } else {

                    window.location.href =
                        "connection-hub.html";

                }

            }
        );

    }


    return item;

}


/* =========================================================
   UPDATE CONNECTION COUNTS
   ========================================================= */

function updateConnectionCounts() {

    const friendCount =
        document.getElementById(
            "friendConnectionCount"
        );


    const mentorCount =
        document.getElementById(
            "mentorConnectionCount"
        );


    if (friendCount) {

        friendCount.textContent =
            peerConversations.length;

    }


    if (mentorCount) {

        mentorCount.textContent =
            mentorConversations.length;

    }

}


/* =========================================================
   UPDATE MENTOR COUNT
   ========================================================= */

function updateMentorConnectionCount() {

    const mentorCount =
        document.getElementById(
            "mentorConnectionCount"
        );


    if (mentorCount) {

        mentorCount.textContent =
            mentorConversations.length;

    }

}


/* =========================================================
   SEARCH
   ========================================================= */

function setupSearch() {

    const input =
        document.getElementById(
            "connectionSearchInput"
        );


    const button =
        document.getElementById(
            "connectionSearchBtn"
        );


    if (!input) {
        return;
    }


    function performSearch() {

        const query =
            input.value
                .trim()
                .toLowerCase();


        showAllMembers = Boolean(query);


        filterPeopleAndMentors(
            query
        );

    }


    input.addEventListener(
        "input",
        performSearch
    );


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                performSearch();

            }

        }
    );


    if (button) {

        button.addEventListener(
            "click",
            performSearch
        );

    }

}


/* =========================================================
   FILTER PEOPLE + MENTORS
   ========================================================= */

function filterPeopleAndMentors(
    query
) {

    const filteredMembers =
        !query

            ? connectionMembers

            : connectionMembers.filter(
                function (member) {

                    const text =
                        [
                            member.nickname,
                            member.bio,
                            member.topics
                        ]
                            .join(" ")
                            .toLowerCase();


                    return text.includes(
                        query
                    );

                }
            );


    const filteredMentors =
        !query

            ? connectionMentors

            : connectionMentors.filter(
                function (mentor) {

                    const text =
                        [
                            mentor.nickname,
                            mentor.bio,
                            mentor.topics,
                            mentor.languages
                        ]
                            .join(" ")
                            .toLowerCase();


                    return text.includes(
                        query
                    );

                }
            );


    renderMembers(
        filteredMembers
    );


    renderMentors(
        filteredMentors
    );

}


/* =========================================================
   DASHBOARD BUTTONS
   ========================================================= */

function setupDashboardButtons() {

    const findPeopleButton =
        document.getElementById(
            "findPeopleBtn"
        );


    const finalMessagesButton =
        document.getElementById(
            "finalFindPeopleBtn"
        );


    const explorePeopleButton =
        document.getElementById(
            "explorePeopleBtn"
        );


    const viewMoreMembersButton =
        document.getElementById(
            "viewMoreMembersBtn"
        );


    const seeAllRequestsButton =
        document.getElementById(
            "seeAllRequestsBtn"
        );


    const seeAllConnectionsButton =
        document.getElementById(
            "seeAllConnectionsBtn"
        );


    if (findPeopleButton) {

        findPeopleButton.addEventListener(
            "click",
            function () {

                document
                    .querySelector(
                        ".people-panel"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    }


    if (explorePeopleButton) {

        explorePeopleButton.addEventListener(
            "click",
            function () {

                document
                    .querySelector(
                        ".people-panel"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    }


    if (viewMoreMembersButton) {

        viewMoreMembersButton.addEventListener(
            "click",
            function () {

                showAllMembers = true;

                renderMembers(
                    connectionMembers
                );

                document
                    .querySelector(
                        ".people-panel"
                    )
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    }


    if (finalMessagesButton) {

        finalMessagesButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "connection-hub.html";

            }
        );

    }


    if (seeAllRequestsButton) {

        seeAllRequestsButton.addEventListener(
            "click",
            function () {

                window.location.href =
                    "connection-hub.html";

            }
        );

    }


    if (seeAllConnectionsButton) {

        seeAllConnectionsButton.addEventListener(
            "click",
            function () {

                if (
                    activeConnectionTab ===
                    "mentors"
                ) {

                    window.location.href =
                        "../mentor/mentor-requests.html";

                } else {

                    window.location.href =
                        "connection-hub.html";

                }

            }
        );

    }

}


/* =========================================================
   OPEN CONNECTION REQUEST MODAL
   ========================================================= */

function openConnectionRequest(
    member
) {

    selectedConnectionMember =
        member;


    window.selectedConnectionMember =
        member;


    const oldModal =
        document.getElementById(
            "connectionRequestModal"
        );


    if (oldModal) {
        oldModal.remove();
    }


    const nickname =
        escapeHTML(
            member.nickname ||
            "Anonymous Member"
        );


    const memberTopics =
        parseTopics(
            member.topics
        );


    const fallbackTopics = [

        "Academic stress",

        "Friendships",

        "Loneliness",

        "Motivation",

        "Relationships",

        "Family",

        "Future & career",

        "Just need someone to talk to"

    ];


    const topics =
        memberTopics.length
            ? memberTopics
            : fallbackTopics;


    const uniqueTopics =
        [
            ...new Set(topics)
        ];


    const modal =
        document.createElement(
            "div"
        );


    modal.id =
        "connectionRequestModal";


    modal.className =
        "connection-request-overlay";


    modal.innerHTML = `

        <div
            class="connection-request-modal"
            role="dialog"
            aria-modal="true"
        >

            <button
                type="button"
                class="connection-request-close"
                id="connectionRequestClose"
                aria-label="Close"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>


            <div class="connection-request-icon">

                <i class="fa-solid fa-comments"></i>

            </div>


            <span class="section-label">
                PRIVATE CONNECTION
            </span>


            <h2>
                Connect with ${nickname}
            </h2>


            <p class="connection-request-intro">
                Start a private, anonymous conversation
                with someone who may understand what
                you're going through.
            </p>


            <form
                id="connectionRequestForm"
            >

                <div class="connection-form-group">

                    <label for="connectionTopic">
                        What would you like to talk about?
                    </label>


                    <select
                        id="connectionTopic"
                        required
                    >

                        <option
                            value=""
                            disabled
                            selected
                        >
                            Choose a topic
                        </option>


                        ${
                            uniqueTopics
                                .map(
                                    function (topic) {

                                        return `
                                            <option
                                                value="${escapeAttribute(topic)}"
                                            >
                                                ${escapeHTML(topic)}
                                            </option>
                                        `;

                                    }
                                )
                                .join("")
                        }

                    </select>

                </div>


                <div class="connection-form-group">

                    <label for="connectionMessage">

                        A short message

                        <span>
                            (optional)
                        </span>

                    </label>


                    <textarea
                        id="connectionMessage"
                        rows="4"
                        maxlength="500"
                        placeholder="Hi, I'd like to connect because..."
                    ></textarea>


                    <div class="connection-message-count">

                        <span
                            id="connectionMessageCount"
                        >
                            0
                        </span>/500

                    </div>

                </div>


                <div
                    id="connectionRequestError"
                    class="connection-request-error"
                    hidden
                ></div>


                <div
                    id="connectionRequestSuccess"
                    class="connection-request-success"
                    hidden
                >

                    <i class="fa-solid fa-circle-check"></i>

                    <div>

                        <strong>
                            Request sent
                        </strong>

                        <p>
                            Your connection request
                            is now pending.
                        </p>

                    </div>

                </div>


                <div class="connection-request-actions">

                    <button
                        type="button"
                        class="connection-cancel-btn"
                        id="connectionRequestCancel"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        class="connection-send-btn"
                        id="connectionRequestSubmit"
                    >
                        Send Request
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>

                </div>

            </form>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    requestAnimationFrame(
        function () {

            modal.classList.add(
                "show"
            );

        }
    );


    setupConnectionRequestModal();

}


/* =========================================================
   REQUEST MODAL
   ========================================================= */

function setupConnectionRequestModal() {

    const modal =
        document.getElementById(
            "connectionRequestModal"
        );


    if (!modal) {
        return;
    }


    const closeButton =
        document.getElementById(
            "connectionRequestClose"
        );


    const cancelButton =
        document.getElementById(
            "connectionRequestCancel"
        );


    const form =
        document.getElementById(
            "connectionRequestForm"
        );


    const messageInput =
        document.getElementById(
            "connectionMessage"
        );


    const messageCount =
        document.getElementById(
            "connectionMessageCount"
        );


    function closeModal() {

        modal.classList.remove(
            "show"
        );


        setTimeout(
            function () {

                modal.remove();

            },
            250
        );

    }


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeModal
        );

    }


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                closeModal();

            }

        }
    );


    if (
        messageInput &&
        messageCount
    ) {

        messageInput.addEventListener(
            "input",
            function () {

                messageCount.textContent =
                    messageInput.value.length;

            }
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();

                await sendConnectionRequest();

            }
        );

    }


    document.addEventListener(
        "keydown",
        function handleEscape(event) {

            if (
                event.key === "Escape" &&
                document.getElementById(
                    "connectionRequestModal"
                )
            ) {

                closeModal();

                document.removeEventListener(
                    "keydown",
                    handleEscape
                );

            }

        }
    );

}


/* =========================================================
   SEND CONNECTION REQUEST
   ========================================================= */

async function sendConnectionRequest() {

    const member =
        selectedConnectionMember ||
        window.selectedConnectionMember;


    if (
        !member ||
        !member.user_id
    ) {

        showConnectionRequestError(
            "We couldn't identify this member. Please try again."
        );

        return;

    }


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showConnectionRequestError(
            "Your session has expired. Please log in again."
        );

        return;

    }


    const topic =
        document.getElementById(
            "connectionTopic"
        )?.value;


    const message =
        document.getElementById(
            "connectionMessage"
        )?.value
            .trim() ||
        "";


    if (!topic) {

        showConnectionRequestError(
            "Please choose a topic."
        );

        return;

    }


    const submitButton =
        document.getElementById(
            "connectionRequestSubmit"
        );


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Sending...
        `;

    }


    try {

        const response =
            await fetch(
                `${API_BASE_URL}/connection/request`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        receiver_id:
                            Number(
                                member.user_id
                            ),

                        topic:
                            topic,

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
                "Unable to send connection request."
            );

        }


        showConnectionRequestSuccess();


        await loadConnectionRequests();


    } catch (error) {

        console.error(
            "Send connection request error:",
            error
        );


        showConnectionRequestError(
            error.message ||
            "Something went wrong."
        );


        if (submitButton) {

            submitButton.disabled =
                false;


            submitButton.innerHTML = `
                Send Request
                <i class="fa-solid fa-arrow-right"></i>
            `;

        }

    }

}


/* =========================================================
   REQUEST ERROR
   ========================================================= */

function showConnectionRequestError(
    message
) {

    const errorBox =
        document.getElementById(
            "connectionRequestError"
        );


    if (!errorBox) {
        return;
    }


    errorBox.textContent =
        message;


    errorBox.hidden =
        false;

}


/* =========================================================
   REQUEST SUCCESS
   ========================================================= */

function showConnectionRequestSuccess() {

    const successBox =
        document.getElementById(
            "connectionRequestSuccess"
        );


    const submitButton =
        document.getElementById(
            "connectionRequestSubmit"
        );


    const cancelButton =
        document.getElementById(
            "connectionRequestCancel"
        );


    if (successBox) {

        successBox.hidden =
            false;

    }


    if (submitButton) {

        submitButton.disabled =
            true;


        submitButton.innerHTML = `
            Request Sent
            <i class="fa-solid fa-check"></i>
        `;

    }


    if (cancelButton) {

        cancelButton.textContent =
            "Close";

    }

}


/* =========================================================
   LOGIN STATE
   ========================================================= */

function showLoginState() {

    const membersGrid =
        document.getElementById(
            "membersGrid"
        );


    const mentorGrid =
        document.getElementById(
            "mentorGrid"
        );


    const message = `
        <div class="member-loading">
            <i class="fa-solid fa-lock"></i>
            <p>
                Please log in to use Connection.
            </p>
        </div>
    `;


    if (membersGrid) {

        membersGrid.innerHTML =
            message;

    }


    if (mentorGrid) {

        mentorGrid.innerHTML =
            message;

    }

}


/* =========================================================
   CONNECTION ERROR
   ========================================================= */

function renderConnectionsError() {

    const list =
        document.getElementById(
            "connectionList"
        );


    if (!list) {
        return;
    }


    list.innerHTML = `
        <div class="side-loading">
            <i class="fa-solid fa-circle-exclamation"></i>
            <p>
                Unable to load connections.
            </p>
        </div>
    `;

}


/* =========================================================
   PARSE TOPICS
   ========================================================= */

function parseTopics(
    topics
) {

    if (!topics) {
        return [];
    }


    if (
        Array.isArray(topics)
    ) {

        return topics;

    }


    try {

        const parsed =
            JSON.parse(
                topics
            );


        if (
            Array.isArray(parsed)
        ) {

            return parsed;

        }

    } catch (error) {

        /*
         * Not JSON.
         * Continue with comma-separated parsing.
         */

    }


    return String(topics)
        .split(",")
        .map(
            function (topic) {

                return topic.trim();

            }
        )
        .filter(Boolean);

}


/* =========================================================
   AVATAR HTML
   ========================================================= */

function createAvatarHTML(
    avatar
) {

    if (!avatar) {

        return `
            <div class="member-avatar-placeholder">
                🌿
            </div>
        `;

    }


    const value =
        String(avatar)
            .trim();


    const isImage =
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        ) ||
        value.startsWith(
            "/"
        ) ||
        value.startsWith(
            "frontend/"
        ) ||
        value.startsWith(
            "Frontend/"
        ) ||
        value.startsWith(
            "uploads/"
        );


    if (!isImage) {

        return `
            <div class="member-avatar-placeholder">
                ${escapeHTML(value)}
            </div>
        `;

    }


    return `
        <img
            src="${escapeAttribute(
                buildAvatarUrl(value)
            )}"
            alt=""
            class="member-avatar-image"
        >
    `;

}


/* =========================================================
   BUILD AVATAR URL
   ========================================================= */

function buildAvatarUrl(
    avatar
) {

    if (!avatar) {
        return "";
    }


    const value =
        String(avatar)
            .trim();


    if (
        value.startsWith(
            "http://"
        ) ||
        value.startsWith(
            "https://"
        )
    ) {

        return value;

    }


    if (
        value.startsWith("/")
    ) {

        return (
            `${API_BASE_URL}${value}`
        );

    }


    if (
        value.startsWith(
            "frontend/"
        ) ||
        value.startsWith(
            "Frontend/"
        )
    ) {

        return (
            `${API_BASE_URL}/${value}`
        );

    }


    if (
        value.startsWith(
            "uploads/"
        )
    ) {

        return (
            `${API_BASE_URL}/frontend/${value}`
        );

    }


    return (
        `${API_BASE_URL}/frontend/uploads/avatars/${value}`
    );

}


/* =========================================================
   FORMAT TIME
   ========================================================= */

function formatTime(
    value
) {

    if (!value) {
        return "Recently";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Recently";

    }


    const now =
        new Date();


    const difference =
        now.getTime() -
        date.getTime();


    if (
        difference < 0
    ) {

        return "Just now";

    }


    const seconds =
        Math.floor(
            difference / 1000
        );


    if (
        seconds < 60
    ) {

        return "Just now";

    }


    const minutes =
        Math.floor(
            seconds / 60
        );


    if (
        minutes < 60
    ) {

        return (
            `${minutes} ${
                minutes === 1
                    ? "minute"
                    : "minutes"
            } ago`
        );

    }


    const hours =
        Math.floor(
            minutes / 60
        );


    if (
        hours < 24
    ) {

        return (
            `${hours} ${
                hours === 1
                    ? "hour"
                    : "hours"
            } ago`
        );

    }


    const days =
        Math.floor(
            hours / 24
        );


    if (
        days < 7
    ) {

        return (
            `${days} ${
                days === 1
                    ? "day"
                    : "days"
            } ago`
        );

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric"
        }
    );

}


/* =========================================================
   HTML SECURITY
   ========================================================= */

function escapeHTML(
    value
) {

    return String(
        value ?? ""
    )
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


/* =========================================================
   ATTRIBUTE SECURITY
   ========================================================= */

function escapeAttribute(
    value
) {

    return escapeHTML(
        value
    );

}