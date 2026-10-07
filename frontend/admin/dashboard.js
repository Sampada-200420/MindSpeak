const API =
    "http://127.0.0.1:8000";


/* ==================================================
   SESSION
================================================== */

function getSessionToken() {

    return localStorage.getItem(
        "session_token"
    );

}


function handleSessionExpired() {

    localStorage.clear();
    sessionStorage.clear();

    window.location.href =
        "../login.html";

}


/* ==================================================
   SAFE RESPONSE PARSER
================================================== */

async function parseResponse(response) {

    const text =
        await response.text();

    if (!text) {
        return {};
    }

    try {

        return JSON.parse(text);

    } catch (error) {

        throw new Error(
            `Server returned invalid JSON (${response.status})`
        );

    }

}


/* ==================================================
   VERIFY ADMIN
================================================== */

async function verifyAdmin() {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        window.location.href =
            "../login.html";

        return;

    }

    try {

        const response =
            await fetch(
                `${API}/posts/admin/all?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to verify administrator."
            );

        }

        loadAdminIdentity();
        loadDashboardData();

    } catch (error) {

        console.error(
            "Admin verification error:",
            error
        );

        showError(
            error.message ||
            "Unable to verify administrator."
        );

    }

}


/* ==================================================
   ADMIN IDENTITY
================================================== */

function loadAdminIdentity() {

    const nickname =
        localStorage.getItem("nickname") ||
        localStorage.getItem("name") ||
        "Admin";

    const username =
        localStorage.getItem("username") ||
        "—";

    const email =
        localStorage.getItem("email") ||
        "—";

    const avatar =
        localStorage.getItem("avatar") ||
        "👤";

    setText(
        "adminNickname",
        nickname
    );

    setText(
        "profilePageNickname",
        nickname
    );

    setText(
        "profilePageUsername",
        username
    );

    setText(
        "profileDetailNickname",
        nickname
    );

    setText(
        "profileDetailUsername",
        username
    );

    setText(
        "profileDetailEmail",
        email
    );

    const avatarElement =
        document.getElementById(
            "adminProfileAvatar"
        );

    if (avatarElement) {

        if (
            String(avatar)
                .startsWith("/frontend/")
        ) {

            avatarElement.innerHTML = `
                <img
                    src="${escapeHTML(avatar)}"
                    alt="Admin avatar"
                >
            `;

        } else {

            avatarElement.textContent =
                avatar;

        }

    }

}


/* ==================================================
   SECTION NAVIGATION
================================================== */

function showSection(sectionId) {

    document
        .querySelectorAll(".page-section")
        .forEach(section => {

            section.classList.remove("active");

        });

    const target =
        document.getElementById(sectionId);

    if (!target) {

        console.error(
            "Section not found:",
            sectionId
        );

        return;

    }

    target.classList.add("active");

    document
        .querySelectorAll(".nav-button")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        });

    switch (sectionId) {

        case "dashboardSection":
            loadDashboardData();
            break;

        case "postsSection":
            loadPosts();
            break;

        case "usersSection":
            loadUsers();
            break;

        case "mentorApplicationsSection":
            loadMentorApplications();
            break;

        case "currentMentorsSection":
            loadCurrentMentors();
            break;

        case "journalActivitySection":
            loadJournalActivity();
            break;

        case "contactManagementSection":
            loadContactManagement();
            break;

        case "connectionOverviewSection":
            loadConnectionOverview();
            break;

        case "connectionMembersSection":
            loadConnectionMembers();
            break;


        case "resourcesSection":
    loadResources();
    break;
        case "eventsSection":
    loadAdminEvents();
    break;
    case "blogsSection":
    loadAdminBlogs();
    break;

    case "connectionOverviewSection":
    loadConnectionOverview();
    break;
        case "adminProfileSection":
            loadAdminIdentity();
            break;

    }

}

async function loadConnectionOverview() {
    const messageEl = document.getElementById("connectionOverviewMessage");
    const token = localStorage.getItem("session_token");

    if (!token) {
        if (messageEl) {
            messageEl.textContent = "Admin session not found.";
        }
        return;
    }

    try {
        if (messageEl) {
            messageEl.textContent = "Loading connection statistics...";
        }

        const response = await fetch(
            `${API}/connection/admin/overview?session_token=${encodeURIComponent(token)}`
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.detail ||
                data.error ||
                "Failed to load connection overview."
            );
        }

        const overview = data.overview || data;

        document.getElementById("adminConnectionProfiles").textContent =
            overview.total_profiles ?? 0;

        document.getElementById("adminAvailableMembers").textContent =
            overview.available_members ?? 0;

        document.getElementById("adminPendingRequests").textContent =
            overview.pending_requests ?? 0;

        document.getElementById("adminAcceptedRequests").textContent =
            overview.accepted_requests ?? 0;

        document.getElementById("adminActiveConversations").textContent =
            overview.active_conversations ?? 0;

        document.getElementById("adminEndedConversations").textContent =
            overview.ended_conversations ?? 0;

        document.getElementById("adminConnectionMessages").textContent =
            overview.total_messages ?? 0;

        document.getElementById("adminUnreadMessages").textContent =
            overview.unread_messages ?? 0;

        document.getElementById("adminConnectionBlocks").textContent =
            overview.total_blocks ?? 0;

        document.getElementById("adminConnectionReports").textContent =
            overview.total_reports ?? 0;

        document.getElementById("adminPendingReports").textContent =
            overview.pending_reports ?? 0;

        document.getElementById("adminConnectionPendingBreakdown").textContent =
            overview.pending_requests ?? 0;

        document.getElementById("adminConnectionAcceptedBreakdown").textContent =
            overview.accepted_requests ?? 0;

        document.getElementById("adminConnectionDeclinedBreakdown").textContent =
            overview.declined_requests ?? 0;

        document.getElementById("adminConnectionCancelledBreakdown").textContent =
            overview.cancelled_requests ?? 0;

        if (messageEl) {
            messageEl.textContent =
                `Last updated: ${new Date().toLocaleString()}`;
        }

    } catch (error) {
        console.error("Connection overview error:", error);

        if (messageEl) {
            messageEl.textContent =
                error.message || "Unable to load connection overview.";
        }
    }
}
/* ==================================================
   DASHBOARD
================================================== */

async function loadDashboardData() {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) return;

    try {

        const usersResponse =
            await fetch(
                `${API}/admin/users?session_token=${encodeURIComponent(sessionToken)}`
            );

        if (usersResponse.ok) {

            const usersData =
                await parseResponse(
                    usersResponse
                );

            const users =
                Array.isArray(usersData)
                    ? usersData
                    : usersData.users || [];

            setText(
                "totalUsers",
                users.length
            );

        }

    } catch (error) {

        console.error(
            "Dashboard users error:",
            error
        );

    }


    try {

        const postsResponse =
            await fetch(
                `${API}/posts/admin/all?session_token=${encodeURIComponent(sessionToken)}`
            );

        if (postsResponse.ok) {

            const postsData =
                await parseResponse(
                    postsResponse
                );

            const posts =
                Array.isArray(postsData)
                    ? postsData
                    : postsData.posts || [];

            setText(
                "totalPosts",
                posts.length
            );

        }

    } catch (error) {

        console.error(
            "Dashboard posts error:",
            error
        );

    }


    try {

        const applicationsResponse =
            await fetch(
                `${API}/admin/mentor-applications?session_token=${encodeURIComponent(sessionToken)}`
            );

        if (applicationsResponse.ok) {

            const applicationsData =
                await parseResponse(
                    applicationsResponse
                );

            const applications =
                Array.isArray(applicationsData)
                    ? applicationsData
                    : applicationsData.applications || [];

            setText(
                "totalMentorApplications",
                applications.length
            );

        }

    } catch (error) {

        console.error(
            "Dashboard mentor error:",
            error
        );

    }

}
/* ==================================================
   SAFETY ALERTS
================================================== */

async function loadSafetyAlerts() {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API}/posts/admin/safety-alerts?session_token=${encodeURIComponent(sessionToken)}&status=pending`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load safety alerts."
            );

        }

        const alerts =
            Array.isArray(data)
                ? data
                : data.alerts || [];

        console.log(
            "Pending safety alerts:",
            alerts
        );

        /*
         * If the dashboard contains a
         * safety alert count element,
         * update it automatically.
         */
        setText(
            "safetyAlertCount",
            alerts.length
        );

        /*
         * If a safety-alert container exists,
         * render the alerts there.
         */
        const container =
            document.getElementById(
                "safetyAlertsContainer"
            );

        if (!container) {
            return;
        }

        if (!alerts.length) {

            container.innerHTML = `
                <div class="mentor-empty">

                    <div class="mentor-empty-icon">
                        ✅
                    </div>

                    <h3>
                        No pending safety alerts
                    </h3>

                    <p>
                        There are no community posts
                        requiring safety review.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            alerts
                .map(alert =>
                    createSafetyAlertCard(alert)
                )
                .join("");

    } catch (error) {

        console.error(
            "Safety alerts error:",
            error
        );

    }

}
function createSafetyAlertCard(alert) {

    const severity =
        String(
            alert.severity || "unknown"
        ).toLowerCase();

    return `
        <article
            class="safety-alert-card"
            id="safety-alert-${alert.id}"
        >

            <div class="safety-alert-header">

                <div>

                    <strong>
                        ⚠️ Safety Alert
                    </strong>

                    <span>
                        Post #${alert.post_id}
                    </span>

                </div>

                <span
                    class="safety-severity ${escapeHTML(severity)}"
                >
                    ${escapeHTML(
                        severity.toUpperCase()
                    )}
                </span>

            </div>


            <div class="safety-alert-content">

                <span class="safety-alert-label">
                    Community Post
                </span>

                <p>
                    ${escapeHTML(
                        alert.content || ""
                    )}
                </p>

            </div>


            <div class="safety-alert-reason">

                <strong>
                    Detection reason:
                </strong>

                <span>
                    ${escapeHTML(
                        alert.reason ||
                        "Safety-related language detected."
                    )}
                </span>

            </div>


            <div class="safety-alert-response">

                <textarea
                    id="safety-response-${alert.id}"
                    class="contact-textarea"
                    placeholder="Write a supportive response to this post..."
                >${escapeHTML(
                    alert.admin_response || ""
                )}</textarea>

            </div>


            <div class="contact-actions">

                <button
                    type="button"
                    class="contact-action-btn"
                    onclick="respondToSafetyAlert(${alert.id})"
                >
                    💚 Send Response
                </button>

            </div>

        </article>
    `;
}
async function respondToSafetyAlert(alertId) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {
        handleSessionExpired();
        return;
    }

    const textarea =
        document.getElementById(
            `safety-response-${alertId}`
        );

    if (!textarea) {
        alert("Response box not found.");
        return;
    }

    const adminResponse =
        textarea.value.trim();

    if (!adminResponse) {
        alert(
            "Please write a response before sending."
        );
        textarea.focus();
        return;
    }

    try {

        const response =
            await fetch(
                `${API}/posts/admin/safety-alerts/${alertId}/respond?session_token=${encodeURIComponent(sessionToken)}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        session_token:
                            sessionToken,

                        admin_response:
                            adminResponse
                    })
                }
            );

        const data =
            await parseResponse(response);

        if (
            data.error ===
                "Admin access required" ||
            data.error ===
                "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to send response."
            );

        }

        alert(
            "Response sent successfully."
        );

        /*
         * Remove the responded alert from
         * the pending safety-alert list.
         */
        const alertCard =
            document.getElementById(
                `safety-alert-${alertId}`
            );

        if (alertCard) {
            alertCard.remove();
        }

        /*
         * Refresh the pending alert count.
         */
        await loadSafetyAlerts();

    } catch (error) {

        console.error(
            "Safety response error:",
            error
        );

        alert(
            error.message ||
            "Unable to send response."
        );

    }
}
/* ==================================================
   COMMUNITY POSTS
================================================== */

async function loadPosts() {

    const container =
        document.getElementById(
            "postsContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    container.innerHTML = `
        <div class="mentor-loading">
            Loading community posts...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API}/posts/admin/all?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load posts."
            );

        }

        const posts =
            Array.isArray(data)
                ? data
                : data.posts || [];

        if (!posts.length) {

            container.innerHTML = `
                <div class="mentor-empty">

                    <div class="mentor-empty-icon">
                        💬
                    </div>

                    <h3>
                        No community posts
                    </h3>

                    <p>
                        There are currently no posts.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            posts
                .map(post => createPostCard(post))
                .join("");

    } catch (error) {

        console.error(
            "Posts error:",
            error
        );

        container.innerHTML = `
            <div class="mentor-empty">

                <div class="mentor-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load posts
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

    }

}


function createPostCard(post) {

    const postId =
        post.id;

    const nickname =
        post.nickname ||
        post.username ||
        "User";

    const content =
        post.content ||
        post.message ||
        "";

    const warmResponse =
        post.warm_response ||
        "";

    return `
        <article
            class="mentor-application-card"
            id="post-${postId}"
        >

            <div class="mentor-application-header">

                <div class="mentor-applicant">

                    <div class="mentor-applicant-avatar">
                        💬
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(nickname)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                formatDate(
                                    post.created_at
                                )
                            )}
                        </span>

                    </div>

                </div>

            </div>


            <div class="mentor-detail-grid">

                <div
                    class="mentor-detail-item"
                    style="grid-column:1/-1;"
                >

                    <span class="mentor-detail-label">
                        Community Post
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(content)}
                    </div>

                </div>


                <div
                    class="mentor-detail-item"
                    style="grid-column:1/-1;"
                >

                    <span class="mentor-detail-label">
                        💚 Warm Response
                    </span>

                    <textarea
                        id="warm-response-${postId}"
                        class="contact-textarea"
                        placeholder="Write a supportive response..."
                    >${escapeHTML(warmResponse)}</textarea>

                </div>

            </div>


            <div
                class="contact-actions"
                style="margin-top:15px;"
            >

                <button
                    type="button"
                    class="contact-action-btn"
                    onclick="saveWarmResponse(${postId})"
                >
                    ${warmResponse
                        ? "✏️ Update Response"
                        : "💚 Save Response"}
                </button>


                <button
                    type="button"
                    class="contact-action-btn"
                    onclick="clearWarmResponse(${postId})"
                >
                    🗑️ Clear Response
                </button>


                <button
                    type="button"
                    class="contact-action-btn"
                    style="background:#a55555;"
                    onclick="deletePost(${postId})"
                >
                    🗑️ Delete Post
                </button>

            </div>

        </article>
    `;

}


/* ==================================================
   SAVE / UPDATE WARM RESPONSE
================================================== */

async function saveWarmResponse(postId) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    const textarea =
        document.getElementById(
            `warm-response-${postId}`
        );

    if (!textarea) {

        console.error(
            "Warm response field not found."
        );

        return;

    }

    const warmResponse =
        textarea.value.trim();

    if (!warmResponse) {

        alert(
            "Please write a response first."
        );

        textarea.focus();

        return;

    }

    try {

        const response =
            await fetch(
                `${API}/posts/${postId}/warm-response`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        warm_response:
                            warmResponse

                    })

                }
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to save response."
            );

        }

        alert(
            "Response updated successfully."
        );

        await loadPosts();

    } catch (error) {

        console.error(
            "Save warm response error:",
            error
        );

        alert(
            error.message ||
            "Unable to save response."
        );

    }

}


/* ==================================================
   CLEAR WARM RESPONSE
================================================== */

async function clearWarmResponse(postId) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    if (
        !confirm(
            "Are you sure you want to clear this response?"
        )
    ) {

        return;

    }

    try {

        const response =
            await fetch(
                `${API}/posts/${postId}/warm-response`,
                {
                    method: "DELETE",

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

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to clear response."
            );

        }

        await loadPosts();

    } catch (error) {

        console.error(
            "Clear warm response error:",
            error
        );

        alert(
            error.message ||
            "Unable to clear response."
        );

    }

}


/* ==================================================
   DELETE COMMUNITY POST
================================================== */

async function deletePost(postId) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    if (
        !confirm(
            "Are you sure you want to delete this community post?"
        )
    ) {

        return;

    }

    try {

        const response =
            await fetch(
                `${API}/posts/${postId}`,
                {
                    method: "DELETE",

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

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to delete post."
            );

        }

        const postElement =
            document.getElementById(
                `post-${postId}`
            );

        if (postElement) {

            postElement.remove();

        }

        alert(
            "Community post deleted successfully."
        );

        loadDashboardData();

    } catch (error) {

        console.error(
            "Delete post error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete post."
        );

    }

}


/* ==================================================
   USERS
================================================== */

async function loadUsers() {

    const container =
        document.getElementById(
            "usersContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    container.innerHTML = `
        <div class="mentor-loading">
            Loading users...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API}/admin/users?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load users."
            );

        }

        const users =
            Array.isArray(data)
                ? data
                : data.users || [];

        if (!users.length) {

            container.innerHTML = `
                <div class="mentor-empty">

                    <div class="mentor-empty-icon">
                        👥
                    </div>

                    <h3>
                        No users found
                    </h3>

                    <p>
                        There are currently no users.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            users
                .map(user => createUserCard(user))
                .join("");

    } catch (error) {

        console.error(
            "Users error:",
            error
        );

        container.innerHTML = `
            <div class="mentor-empty">

                <div class="mentor-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load users
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

    }

}


function createUserCard(user) {

    return `
        <article class="mentor-application-card">

            <div class="mentor-application-header">

                <div class="mentor-applicant">

                    <div class="mentor-applicant-avatar">
                        ${escapeHTML(
                            user.avatar || "👤"
                        )}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                user.nickname ||
                                user.username ||
                                "User"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                user.email ||
                                "No email"
                            )}
                        </span>

                    </div>

                </div>

            </div>


            <div class="mentor-detail-grid">

                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        User ID
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(
                            String(
                                user.id ?? "—"
                            )
                        )}
                    </div>

                </div>


                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Role
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(
                            user.role || "user"
                        )}
                    </div>

                </div>

            </div>

        </article>
    `;

}


/* ==================================================
   MENTOR APPLICATIONS
================================================== */

async function loadMentorApplications() {

    const container =
        document.getElementById(
            "mentorApplicationsContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {
        handleSessionExpired();
        return;
    }

    container.innerHTML = `
        <div class="mentor-loading">
            Loading mentor applications...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API}/admin/mentor-applications?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {
            handleSessionExpired();
            return;
        }

        if (!response.ok) {
            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load mentor applications."
            );
        }

        const applications =
            Array.isArray(data)
                ? data
                : data.applications || [];

        if (!applications.length) {

            container.innerHTML = `
                <div class="mentor-empty">

                    <div class="mentor-empty-icon">
                        🌱
                    </div>

                    <h3>
                        No mentor applications
                    </h3>

                    <p>
                        There are currently no mentor applications.
                    </p>

                </div>
            `;

            return;
        }

        container.innerHTML =
            applications
                .map(createMentorApplicationCard)
                .join("");

    } catch (error) {

        console.error(
            "Mentor applications error:",
            error
        );

        container.innerHTML = `
            <div class="mentor-empty">

                <div class="mentor-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load applications
                </h3>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Something went wrong while loading applications."
                    )}
                </p>

            </div>
        `;
    }
}


/* ==================================================
   CREATE MENTOR APPLICATION CARD
================================================== */

function createMentorApplicationCard(
    application
) {

    const status =
        String(
            application.status ||
            "pending"
        ).toLowerCase();


    const statusLabel =
        status.charAt(0).toUpperCase() +
        status.slice(1);


    const topics =
        application.topics ||
        "Not provided";


    const languages =
        application.languages ||
        "Not provided";


    const availability =
        application.availability ||
        "Not provided";


    const experience =
        application.experience ||
        "Not provided";


    const reason =
        application.reason ||
        "Not provided";


    const adminNote =
        application.admin_note ||
        "";


    const guidelines =
        application.guidelines_agreed;


    const guidelinesText =
        guidelines === true ||
        guidelines === 1 ||
        guidelines === "1"
            ? "Agreed"
            : "Not agreed";


    const isPending =
        status === "pending";


    return `
        <article
            class="mentor-application-card"
            id="mentor-application-${application.id}"
        >

            <!-- HEADER -->

            <div class="mentor-application-header">

                <div class="mentor-applicant">

                    <div class="mentor-applicant-avatar">
                        ${escapeHTML(
                            application.avatar ||
                            "🌱"
                        )}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(
                                application.nickname ||
                                "Applicant"
                            )}
                        </strong>

                        <span>
                            ${escapeHTML(
                                application.email ||
                                "No email"
                            )}
                        </span>

                    </div>

                </div>


                <span
                    class="contact-status ${escapeHTML(status)}"
                >
                    ${escapeHTML(statusLabel)}
                </span>

            </div>


            <!-- APPLICATION DETAILS -->

            <div class="mentor-detail-grid">

                <!-- REASON -->

                <div
                    class="mentor-detail-item"
                    style="grid-column:1/-1;"
                >

                    <span class="mentor-detail-label">
                        Why do you want to become a mentor?
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(reason)}
                    </div>

                </div>


                <!-- TOPICS -->

                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Topics
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(topics)}
                    </div>

                </div>


                <!-- LANGUAGES -->

                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Languages
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(languages)}
                    </div>

                </div>


                <!-- AVAILABILITY -->

                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Availability
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(availability)}
                    </div>

                </div>


                <!-- GUIDELINES -->

                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Guidelines
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(guidelinesText)}
                    </div>

                </div>


                <!-- EXPERIENCE -->

                <div
                    class="mentor-detail-item"
                    style="grid-column:1/-1;"
                >

                    <span class="mentor-detail-label">
                        Mentoring Experience
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(experience)}
                    </div>

                </div>


                <!-- SUBMITTED -->

                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Submitted
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(
                            formatDate(
                                application.created_at
                            )
                        )}
                    </div>

                </div>


                <!-- REVIEWED -->

                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Reviewed
                    </span>

                    <div class="mentor-detail-value">
                        ${application.reviewed_at
                            ? escapeHTML(
                                formatDate(
                                    application.reviewed_at
                                )
                            )
                            : "Not reviewed yet"
                        }
                    </div>

                </div>


                ${
                    adminNote
                        ? `
                            <div
                                class="mentor-detail-item"
                                style="grid-column:1/-1;"
                            >

                                <span class="mentor-detail-label">
                                    Admin Note
                                </span>

                                <div class="mentor-detail-value">
                                    ${escapeHTML(adminNote)}
                                </div>

                            </div>
                        `
                        : ""
                }

            </div>


            <!-- ADMIN ACTIONS -->

            ${
                isPending
                    ? `
                        <div
                            class="contact-actions"
                            style="margin-top:18px;"
                        >

                            <input
                                type="text"
                                id="mentor-note-${application.id}"
                                class="contact-input"
                                placeholder="Optional admin note..."
                            >


                            <button
                                type="button"
                                class="contact-action-btn"
                                onclick="reviewMentorApplication(
                                    ${application.id},
                                    'approve'
                                )"
                            >
                                ✅ Approve
                            </button>


                            <button
                                type="button"
                                class="contact-action-btn"
                                style="background:#a55555;"
                                onclick="reviewMentorApplication(
                                    ${application.id},
                                    'reject'
                                )"
                            >
                                ❌ Reject
                            </button>

                        </div>
                    `
                    : ""
            }

        </article>
    `;
}


/* ==================================================
   REVIEW MENTOR APPLICATION
================================================== */

async function reviewMentorApplication(
    applicationId,
    action
) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {
        handleSessionExpired();
        return;
    }


    const noteElement =
        document.getElementById(
            `mentor-note-${applicationId}`
        );


    const adminNote =
        noteElement
            ? noteElement.value.trim()
            : "";


    const actionText =
        action === "approve"
            ? "approve"
            : "reject";


    const confirmed =
        confirm(
            `Are you sure you want to ${actionText} this mentor application?`
        );


    if (!confirmed) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/admin/mentor-applications/${applicationId}/review`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        action:
                            action,

                        admin_note:
                            adminNote

                    })
                }
            );


        const data =
            await parseResponse(response);


        if (
            data.error ===
                "Admin access required" ||
            data.error ===
                "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;
        }


        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                `Unable to ${actionText} mentor application.`
            );
        }


        alert(
            data.message ||
            `Mentor application ${actionText}d successfully.`
        );


        await loadMentorApplications();

        await loadCurrentMentors();

        await loadDashboardData();


    } catch (error) {

        console.error(
            "Mentor application review error:",
            error
        );


        alert(
            error.message ||
            `Unable to ${actionText} mentor application.`
        );
    }
}

/* ==================================================
   CURRENT MENTORS
================================================== */

async function loadCurrentMentors() {

    const container =
        document.getElementById(
            "currentMentorsContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    container.innerHTML = `
        <div class="mentor-loading">
            Loading current mentors...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API}/mentor/mentors?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load mentors."
            );

        }

        const mentors =
            Array.isArray(data)
                ? data
                : data.mentors || [];

        updateCurrentMentorCounts(
            mentors
        );

        if (!mentors.length) {

            container.innerHTML = `
                <div class="mentor-empty">

                    <div class="mentor-empty-icon">
                        🌱
                    </div>

                    <h3>
                        No current mentors
                    </h3>

                    <p>
                        There are currently no approved mentors.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            mentors
                .map(createCurrentMentorCard)
                .join("");

    } catch (error) {

        console.error(
            "Current mentors error:",
            error
        );

        container.innerHTML = `
            <div class="mentor-empty">

                <div class="mentor-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load mentors
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

    }

}


function updateCurrentMentorCounts(mentors) {

    const online =
        mentors.filter(
            mentor =>
                Number(
                    mentor.is_online
                ) === 1
        ).length;

    setText(
        "totalCurrentMentors",
        mentors.length
    );

    setText(
        "onlineCurrentMentors",
        online
    );

    setText(
        "offlineCurrentMentors",
        mentors.length - online
    );

}


function createCurrentMentorCard(mentor) {

    const nickname =
        mentor.nickname ||
        "Unknown Mentor";

    const avatar =
        mentor.avatar ||
        "🌿";

    const avatarHTML =
        String(avatar).startsWith("/frontend/")
            ? `
                <img
                    src="${escapeHTML(avatar)}"
                    alt="Mentor avatar"
                >
            `
            : escapeHTML(avatar);

    return `
        <article class="mentor-application-card">

            <div class="mentor-application-header">

                <div class="mentor-applicant">

                    <div class="mentor-applicant-avatar">
                        ${avatarHTML}
                    </div>

                    <div>

                        <strong>
                            ${escapeHTML(nickname)}
                        </strong>

                        <span>
                            ${
                                Number(
                                    mentor.is_online
                                ) === 1
                                    ? "Online"
                                    : "Offline"
                            }
                        </span>

                    </div>

                </div>

            </div>


            <div class="mentor-detail-grid">

                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Mentor ID
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(
                            String(
                                mentor.id ?? "—"
                            )
                        )}
                    </div>

                </div>


                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Availability
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(
                            mentor.availability ||
                            "—"
                        )}
                    </div>

                </div>


                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Last Updated
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(
                            formatDate(
                                mentor.updated_at
                            )
                        )}
                    </div>

                </div>


                <div class="mentor-detail-item">

                    <span class="mentor-detail-label">
                        Profile Created
                    </span>

                    <div class="mentor-detail-value">
                        ${escapeHTML(
                            formatDate(
                                mentor.created_at
                            )
                        )}
                    </div>

                </div>

            </div>

        </article>
    `;

}


/* ==================================================
   JOURNAL ACTIVITY
================================================== */

/* =========================================================
   JOURNAL ACTIVITY
========================================================= */

async function loadJournalActivity() {

    const container =
        document.getElementById(
            "journalActivityContainer"
        );

    if (!container) {
        return;
    }


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        handleSessionExpired();

        return;

    }


    /* -----------------------------------------
       LOADING STATE
    ----------------------------------------- */

    container.innerHTML = `

        <div class="journal-loading">

            <div class="journal-loading-spinner"></div>

            <p>
                Loading journal activity...
            </p>

        </div>

    `;


    try {

        /*
         * Backend endpoint:
         * GET /admin/journal-metadata
         */

        const response =
            await fetch(
                `${API}/admin/journal-metadata?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await parseResponse(response);


        console.log(
            "Journal Activity API:",
            data
        );


        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load journal activity."
            );

        }


        /*
         * Expected backend structure:
         *
         * {
         *   journal_metadata: [
         *      {
         *          user_id,
         *          nickname,
         *          avatar,
         *          entry_count,
         *          first_entry_at,
         *          last_entry_at
         *      }
         *   ]
         * }
         */

        const journalMetadata =
            Array.isArray(
                data.journal_metadata
            )
                ? data.journal_metadata
                : [];


        /* -----------------------------------------
           SUMMARY
        ----------------------------------------- */

        updateJournalSummary(
            journalMetadata
        );


        /* -----------------------------------------
           RENDER USERS
        ----------------------------------------- */

        renderJournalMetadata(
            journalMetadata
        );


    } catch (error) {

        console.error(
            "Journal Activity Error:",
            error
        );


        container.innerHTML = `

            <div class="journal-error">

                <div class="journal-state-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load journal activity
                </h3>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Something went wrong while loading journal activity."
                    )}
                </p>

            </div>

        `;

    }

}


/* =========================================================
   JOURNAL SUMMARY
========================================================= */

function updateJournalSummary(
    journalMetadata
) {

    const usersTotal =
        document.getElementById(
            "journalUsersTotal"
        );

    const entriesTotal =
        document.getElementById(
            "journalEntriesTotal"
        );


    const totalUsers =
        journalMetadata.length;


    const totalEntries =
        journalMetadata.reduce(
            (
                total,
                item
            ) => {

                return (
                    total +
                    Number(
                        item.entry_count || 0
                    )
                );

            },
            0
        );


    if (usersTotal) {

        usersTotal.textContent =
            totalUsers;

    }


    if (entriesTotal) {

        entriesTotal.textContent =
            totalEntries;

    }

}


/* =========================================================
   RENDER JOURNAL METADATA
========================================================= */

function renderJournalMetadata(
    journalMetadata
) {

    const container =
        document.getElementById(
            "journalActivityContainer"
        );


    if (!container) {
        return;
    }


    /* -----------------------------------------
       EMPTY STATE
    ----------------------------------------- */

    if (!journalMetadata.length) {

        container.innerHTML = `

            <div class="journal-empty">

                <div class="journal-state-icon">
                    📖
                </div>

                <h3>
                    No journal activity yet
                </h3>

                <p>
                    No users have created journal entries yet.
                </p>

            </div>

        `;

        return;

    }


    /* -----------------------------------------
       USER CARDS
    ----------------------------------------- */

    container.innerHTML =
        journalMetadata
            .map(
                createJournalUserCard
            )
            .join("");

}


/* =========================================================
   JOURNAL USER CARD
========================================================= */

function createJournalUserCard(
    user
) {

    const nickname =
        user.nickname ||
        "Anonymous User";


    const avatar =
        user.avatar ||
        "🌿";


    const userId =
        user.user_id ??
        "—";


    const entryCount =
        Number(
            user.entry_count || 0
        );


    const avatarHTML =
        String(avatar).startsWith(
            "/frontend/"
        )

            ? `
                <img
                    src="${escapeHTML(avatar)}"
                    alt="User avatar"
                >
            `

            : escapeHTML(
                String(avatar)
            );


    const firstEntry =
        formatJournalDate(
            user.first_entry_at
        );


    const lastEntry =
        formatJournalDate(
            user.last_entry_at
        );


    return `

        <article
            class="journal-user-card"
        >


            <!-- USER -->

            <div
                class="journal-user-info"
            >

                <div
                    class="journal-user-avatar"
                >
                    ${avatarHTML}
                </div>


                <div>

                    <h3
                        class="journal-user-name"
                    >
                        ${escapeHTML(
                            nickname
                        )}
                    </h3>


                    <span
                        class="journal-user-id"
                    >
                        User #${escapeHTML(
                            String(userId)
                        )}
                    </span>


                    <span
                        class="journal-private-badge"
                    >
                        🔒 Private content
                    </span>

                </div>

            </div>


            <!-- ACTIVITY DETAILS -->

            <div
                class="journal-user-details"
            >

                <div
                    class="journal-detail-item"
                >

                    <span>
                        Journal Entries
                    </span>

                    <strong
                        class="journal-entry-count"
                    >
                        ${entryCount}
                    </strong>

                </div>


                <div
                    class="journal-detail-item"
                >

                    <span>
                        First Entry
                    </span>

                    <strong>
                        ${escapeHTML(
                            firstEntry
                        )}
                    </strong>

                </div>


                <div
                    class="journal-detail-item"
                >

                    <span>
                        Last Entry
                    </span>

                    <strong>
                        ${escapeHTML(
                            lastEntry
                        )}
                    </strong>

                </div>

            </div>


        </article>

    `;

}


/* =========================================================
   JOURNAL DATE FORMAT
========================================================= */

function formatJournalDate(
    dateValue
) {

    if (!dateValue) {
        return "—";
    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateValue
        );

    }


    return date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );

}

/* ==================================================
   CONTACT MANAGEMENT
================================================== */

async function loadContactManagement() {

    await Promise.allSettled([

        loadContactApplications(),
        loadContactMessages(),
        loadContactFeedback(),
        loadContactNewsletter()

    ]);

}


/* ==================================================
   CONTACT TABS
================================================== */

function showContactTab(tab) {

    document
        .querySelectorAll(".contact-tab")
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.contactTab === tab
            );

        });

    document
        .querySelectorAll(".contact-panel")
        .forEach(panel => {

            panel.classList.remove("active");

        });

    const panel =
        document.getElementById(
            `contact${capitalize(tab)}Panel`
        );

    if (panel) {

        panel.classList.add("active");

    }

}


/* ==================================================
   CONTACT APPLICATIONS
================================================== */

async function loadContactApplications() {

    const container =
        document.getElementById(
            "contactApplicationsContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    container.innerHTML = `
        <div class="contact-loading">
            Loading applications...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API}/admin/join-applications?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load applications."
            );

        }

        const applications =
            Array.isArray(data)
                ? data
                : data.applications || [];

        const pending =
            applications.filter(
                item =>
                    !item.status ||
                    item.status === "pending"
            ).length;

        setText(
            "contactPendingApplications",
            pending
        );

        if (!applications.length) {

            container.innerHTML = `
                <div class="contact-empty">

                    <div class="contact-empty-icon">
                        🤝
                    </div>

                    <h3>
                        No applications
                    </h3>

                    <p>
                        No contact applications have been submitted.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            applications
                .map(createContactApplicationCard)
                .join("");

    } catch (error) {

        console.error(
            "Contact applications error:",
            error
        );

        container.innerHTML = `
            <div class="contact-empty">

                <div class="contact-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load applications
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

    }

}


function createContactApplicationCard(item) {

    const status =
        item.status ||
        "pending";

    return `
        <article class="contact-card">

            <div class="contact-card-header">

                <div class="contact-person">

                    <strong>
                        ${escapeHTML(
                            item.name ||
                            "Unknown applicant"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            formatApplicationType(
                                item.application_type
                            )
                        )}
                    </span>

                </div>

                <span class="contact-status ${escapeHTML(status)}">
                    ${escapeHTML(status)}
                </span>

            </div>


            <div class="contact-details">

                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Email
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.email || "—"
                        )}
                    </div>

                </div>


                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Phone
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.phone || "—"
                        )}
                    </div>

                </div>


                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Organization
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.organization || "—"
                        )}
                    </div>

                </div>


                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Availability
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.availability || "—"
                        )}
                    </div>

                </div>


                <div class="contact-detail full">

                    <span class="contact-detail-label">
                        Motivation
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.motivation || "—"
                        )}
                    </div>

                </div>


                <div class="contact-detail full">

                    <span class="contact-detail-label">
                        Experience
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.experience || "—"
                        )}
                    </div>

                </div>


                <div class="contact-detail full">

                    <span class="contact-detail-label">
                        Skills
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.skills || "—"
                        )}
                    </div>

                </div>


                <div class="contact-detail full">

                    <span class="contact-detail-label">
                        Additional Information
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.additional_information ||
                            "—"
                        )}
                    </div>

                </div>

            </div>


            <div class="contact-actions">

                <select
                    class="contact-select"
                    id="application-status-${item.id}"
                >

                    <option
                        value="pending"
                        ${status === "pending" ? "selected" : ""}
                    >
                        Pending
                    </option>

                    <option
                        value="under_review"
                        ${status === "under_review" ? "selected" : ""}
                    >
                        Under Review
                    </option>

                    <option
                        value="accepted"
                        ${status === "accepted" ? "selected" : ""}
                    >
                        Accepted
                    </option>

                    <option
                        value="rejected"
                        ${status === "rejected" ? "selected" : ""}
                    >
                        Rejected
                    </option>

                </select>


                <input
                    type="text"
                    class="contact-input"
                    id="application-notes-${item.id}"
                    placeholder="Admin notes"
                    value="${escapeHTML(
                        item.admin_notes || ""
                    )}"
                >


                <button
                    type="button"
                    class="contact-action-btn"
                    onclick="updateContactApplication(${item.id})"
                >
                    💾 Save
                </button>

            </div>

        </article>
    `;

}


async function updateContactApplication(id) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    const statusElement =
        document.getElementById(
            `application-status-${id}`
        );

    const notesElement =
        document.getElementById(
            `application-notes-${id}`
        );

    if (!statusElement) return;

    try {

        const response =
            await fetch(
                `${API}/admin/join-applications/${id}`,
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
                            statusElement.value,

                        admin_notes:
                            notesElement
                                ? notesElement.value
                                : ""

                    })

                }
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                "Unable to update application."
            );

        }

        await loadContactApplications();

    } catch (error) {

        console.error(
            "Application update error:",
            error
        );

        showError(
            error.message
        );

    }

}


/* ==================================================
   CONTACT MESSAGES
================================================== */

async function loadContactMessages() {

    const container =
        document.getElementById(
            "contactMessagesContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    container.innerHTML = `
        <div class="contact-loading">
            Loading messages...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API}/admin/contact-messages?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        console.log(
            "CONTACT MESSAGES:",
            response.status,
            data
        );

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load contact messages."
            );

        }

        const messages =
            Array.isArray(data)
                ? data
                : data.messages || [];

        const newMessages =
            messages.filter(
                message =>
                    String(
                        message.status || ""
                    ).toLowerCase() === "new"
            ).length;

        setText(
            "contactManagementNewMessages",
            newMessages
        );

        if (!messages.length) {

            container.innerHTML = `
                <div class="contact-empty">

                    <div class="contact-empty-icon">
                        📩
                    </div>

                    <h3>
                        No messages
                    </h3>

                    <p>
                        No contact messages have been submitted.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            messages
                .map(createContactMessageCard)
                .join("");

    } catch (error) {

        console.error(
            "Contact messages error:",
            error
        );

        container.innerHTML = `
            <div class="contact-empty">

                <div class="contact-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load messages
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


function createContactMessageCard(item) {

    const status =
        item.status || "new";

    return `
        <article class="contact-card">

            <div class="contact-card-header">

                <div class="contact-person">

                    <strong>
                        ${escapeHTML(
                            item.name || "Unknown"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            item.email || "No email"
                        )}
                    </span>

                </div>

                <span class="contact-status ${escapeHTML(status)}">
                    ${escapeHTML(status)}
                </span>

            </div>


            <div class="contact-details">

                <div class="contact-detail full">

                    <span class="contact-detail-label">
                        Subject
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.subject || "No subject"
                        )}
                    </div>

                </div>


                <div class="contact-detail full">

                    <span class="contact-detail-label">
                        Message
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.message || ""
                        )}
                    </div>

                </div>


                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Submitted
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            formatDate(
                                item.created_at
                            )
                        )}
                    </div>

                </div>


                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Admin Reply
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.admin_reply ||
                            "No reply yet"
                        )}
                    </div>

                </div>

            </div>


            <div class="contact-actions">

                <select
                    class="contact-select"
                    id="message-status-${item.id}"
                >

                    <option
                        value="new"
                        ${status === "new" ? "selected" : ""}
                    >
                        New
                    </option>

                    <option
                        value="read"
                        ${status === "read" ? "selected" : ""}
                    >
                        Read
                    </option>

                    <option
                        value="replied"
                        ${status === "replied" ? "selected" : ""}
                    >
                        Replied
                    </option>

                    <option
                        value="closed"
                        ${status === "closed" ? "selected" : ""}
                    >
                        Closed
                    </option>

                </select>


                <input
                    type="text"
                    class="contact-input"
                    id="message-reply-${item.id}"
                    placeholder="Admin reply"
                    value="${escapeHTML(
                        item.admin_reply || ""
                    )}"
                >


                <button
                    type="button"
                    class="contact-action-btn"
                    onclick="updateContactMessage(${item.id})"
                >
                    💾 Save
                </button>

            </div>

        </article>
    `;

}


async function updateContactMessage(id) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    const statusElement =
        document.getElementById(
            `message-status-${id}`
        );

    const replyElement =
        document.getElementById(
            `message-reply-${id}`
        );

    if (!statusElement || !replyElement) {

        alert(
            "Unable to find the message fields."
        );

        return;

    }

    try {

        const response =
            await fetch(
                `${API}/admin/contact-messages/${id}`,
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
                            statusElement.value,

                        admin_reply:
                            replyElement.value.trim()

                    })

                }
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to update contact message."
            );

        }

        alert(
            "Contact message updated successfully."
        );

        await loadContactMessages();

    } catch (error) {

        console.error(
            "Contact message update error:",
            error
        );

        alert(
            error.message ||
            "Unable to update contact message."
        );

    }

}


/* ==================================================
   CONTACT FEEDBACK
================================================== */

async function loadContactFeedback() {

    const container =
        document.getElementById(
            "contactFeedbackContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    container.innerHTML = `
        <div class="contact-loading">
            Loading feedback...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API}/admin/feedback?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load feedback."
            );

        }

        const feedback =
            Array.isArray(data)
                ? data
                : data.feedback || [];

        const newFeedback =
            feedback.filter(
                item =>
                    !item.status ||
                    item.status === "new"
            ).length;

        setText(
            "contactNewFeedback",
            newFeedback
        );

        if (!feedback.length) {

            container.innerHTML = `
                <div class="contact-empty">

                    <div class="contact-empty-icon">
                        💚
                    </div>

                    <h3>
                        No feedback
                    </h3>

                    <p>
                        No feedback has been submitted.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            feedback
                .map(createFeedbackCard)
                .join("");

    } catch (error) {

        console.error(
            "Feedback error:",
            error
        );

        container.innerHTML = `
            <div class="contact-empty">

                <div class="contact-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load feedback
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

    }

}


function createFeedbackCard(item) {

    const status =
        item.status || "new";

    const rating =
        Number(item.rating);

    return `
        <article class="contact-card">

            <div class="contact-card-header">

                <div class="contact-person">

                    <strong>
                        ${escapeHTML(
                            item.name ||
                            "Anonymous"
                        )}
                    </strong>

                    <span>
                        ${escapeHTML(
                            item.email ||
                            "No email"
                        )}
                    </span>

                </div>

                <span class="contact-status ${escapeHTML(status)}">
                    ${escapeHTML(status)}
                </span>

            </div>


            <div class="contact-details">

                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Rating
                    </span>

                    <div class="contact-detail-value">
                        ${
                            rating >= 1 &&
                            rating <= 5
                                ? "⭐".repeat(rating)
                                : "Not provided"
                        }
                    </div>

                </div>


                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Submitted
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            formatDate(
                                item.created_at
                            )
                        )}
                    </div>

                </div>


                <div class="contact-detail full">

                    <span class="contact-detail-label">
                        Feedback
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            item.feedback || ""
                        )}
                    </div>

                </div>

            </div>


            <div class="contact-actions">

                <select
                    class="contact-select"
                    id="feedback-status-${item.id}"
                >

                    <option
                        value="new"
                        ${status === "new" ? "selected" : ""}
                    >
                        New
                    </option>

                    <option
                        value="reviewed"
                        ${status === "reviewed" ? "selected" : ""}
                    >
                        Reviewed
                    </option>

                </select>


                <button
                    type="button"
                    class="contact-action-btn"
                    onclick="updateContactFeedback(${item.id})"
                >
                    💾 Save Status
                </button>

            </div>

        </article>
    `;

}


async function updateContactFeedback(id) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    const statusElement =
        document.getElementById(
            `feedback-status-${id}`
        );

    if (!statusElement) return;

    try {

        const response =
            await fetch(
                `${API}/admin/feedback/${id}`,
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
                            statusElement.value

                    })

                }
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                "Unable to update feedback."
            );

        }

        await loadContactFeedback();

    } catch (error) {

        console.error(
            "Feedback update error:",
            error
        );

        showError(
            error.message
        );

    }

}
/* ==================================================
   FAQ MANAGEMENT
================================================== */

async function loadFaqs() {

    const faqList =
        document.getElementById("faqList");

    if (!faqList) {
        console.warn("FAQ list not found.");
        return;
    }

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {
        handleSessionExpired();
        return;
    }

    faqList.innerHTML = `
        <div class="contact-loading">
            Loading FAQs...
        </div>
    `;

    try {

        const response = await fetch(
            `${API}/admin/faqs?session_token=${encodeURIComponent(sessionToken)}`
        );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {
            handleSessionExpired();
            return;
        }

        if (!response.ok || data.error) {
            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load FAQs."
            );
        }

        const faqs =
            Array.isArray(data.faqs)
                ? data.faqs
                : [];

        if (!faqs.length) {

            faqList.innerHTML = `
                <div class="contact-empty">

                    <div class="contact-empty-icon">
                        ❓
                    </div>

                    <h3>
                        No FAQs found
                    </h3>

                    <p>
                        Add your first FAQ using the form above.
                    </p>

                </div>
            `;

            return;
        }

        faqList.innerHTML =
            faqs
                .map(createFaqCard)
                .join("");

    } catch (error) {

        console.error(
            "FAQ loading error:",
            error
        );

        faqList.innerHTML = `
            <div class="contact-empty">

                <div class="contact-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load FAQs
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;
    }
}


/* ==================================================
   FAQ CARD
================================================== */

function createFaqCard(faq) {

    const active =
        Number(faq.is_active) === 1 ||
        faq.is_active === true;

    return `
        <article class="faq-admin-card">

            <div class="faq-admin-header">

                <div>

                    <div class="faq-admin-question">
                        ${escapeHTML(faq.question)}
                    </div>

                    <div class="faq-admin-meta">

                        <span>
                            ${escapeHTML(
                                faq.category ||
                                "General"
                            )}
                        </span>

                        <span>
                            Order:
                            ${escapeHTML(
                                String(
                                    faq.display_order ?? 0
                                )
                            )}
                        </span>

                        <span
                            class="${
                                active
                                    ? "faq-active"
                                    : "faq-inactive"
                            }"
                        >
                            ${
                                active
                                    ? "● Active"
                                    : "● Inactive"
                            }
                        </span>

                    </div>

                </div>

            </div>


            <div class="faq-admin-answer">
                ${escapeHTML(faq.answer)}
            </div>


            <div class="faq-admin-actions">

                <button
                    type="button"
                    class="contact-action-btn"
                    onclick="editFaq(${faq.id})"
                >
                    ✏️ Edit
                </button>


                <button
                    type="button"
                    class="contact-action-btn"
                    onclick="toggleFaqStatus(
                        ${faq.id},
                        ${active}
                    )"
                >
                    ${
                        active
                            ? "⏸️ Deactivate"
                            : "▶️ Activate"
                    }
                </button>


                <button
                    type="button"
                    class="contact-action-btn faq-delete-btn"
                    onclick="deleteFaq(${faq.id})"
                >
                    🗑️ Delete
                </button>

            </div>

        </article>
    `;
}


/* ==================================================
   CREATE FAQ
================================================== */

async function createFaq(event) {

    event.preventDefault();

    const question =
        document
            .getElementById("faqQuestion")
            .value
            .trim();

    const answer =
        document
            .getElementById("faqAnswer")
            .value
            .trim();

    const category =
        document
            .getElementById("faqCategory")
            .value
            .trim();

    const displayOrder =
        document
            .getElementById("faqDisplayOrder")
            .value;

    const isActive =
        document
            .getElementById("faqIsActive")
            .checked;

    if (!question) {

        showFaqMessage(
            "Question is required.",
            "error"
        );

        return;
    }

    if (!answer) {

        showFaqMessage(
            "Answer is required.",
            "error"
        );

        return;
    }

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/admin/faqs`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        question:
                            question,

                        answer:
                            answer,

                        category:
                            category || null,

                        display_order:
                            Number(
                                displayOrder || 0
                            ),

                        is_active:
                            isActive

                    })
                }
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();

            return;
        }

        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to create FAQ."
            );
        }

        showFaqMessage(
            "FAQ created successfully.",
            "success"
        );

        document
            .getElementById("faqForm")
            .reset();

        document
            .getElementById("faqDisplayOrder")
            .value = "0";

        document
            .getElementById("faqIsActive")
            .checked = true;

        await loadFaqs();

    } catch (error) {

        console.error(
            "Create FAQ error:",
            error
        );

        showFaqMessage(
            error.message ||
            "Unable to create FAQ.",
            "error"
        );
    }
}


/* ==================================================
   EDIT FAQ
================================================== */

async function editFaq(faqId) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/admin/faqs?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to load FAQ."
            );
        }

        const faq =
            (data.faqs || [])
                .find(
                    item =>
                        Number(item.id) ===
                        Number(faqId)
                );

        if (!faq) {

            alert("FAQ not found.");

            return;
        }

        const question =
            prompt(
                "Edit question:",
                faq.question
            );

        if (question === null) return;


        const answer =
            prompt(
                "Edit answer:",
                faq.answer
            );

        if (answer === null) return;


        const category =
            prompt(
                "Edit category:",
                faq.category || ""
            );

        if (category === null) return;


        const displayOrder =
            prompt(
                "Edit display order:",
                faq.display_order ?? 0
            );

        if (displayOrder === null) return;


        if (!question.trim()) {

            alert("Question is required.");

            return;
        }

        if (!answer.trim()) {

            alert("Answer is required.");

            return;
        }

        if (
            displayOrder === "" ||
            isNaN(Number(displayOrder))
        ) {

            alert(
                "Display order must be a number."
            );

            return;
        }

        await updateFaq(
            faqId,
            {
                question:
                    question.trim(),

                answer:
                    answer.trim(),

                category:
                    category.trim() ||
                    null,

                display_order:
                    Number(displayOrder),

                is_active:
                    Number(faq.is_active) === 1
            }
        );

    } catch (error) {

        console.error(
            "Edit FAQ error:",
            error
        );

        alert(
            error.message ||
            "Unable to edit FAQ."
        );
    }
}


/* ==================================================
   UPDATE FAQ
================================================== */

async function updateFaq(
    faqId,
    faqData
) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/admin/faqs/${faqId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        ...faqData

                    })
                }
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();

            return;
        }

        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to update FAQ."
            );
        }

        alert(
            "FAQ updated successfully."
        );

        await loadFaqs();

    } catch (error) {

        console.error(
            "Update FAQ error:",
            error
        );

        alert(
            error.message ||
            "Unable to update FAQ."
        );
    }
}


/* ==================================================
   TOGGLE FAQ STATUS
================================================== */

async function toggleFaqStatus(
    faqId,
    currentlyActive
) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/admin/faqs?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to load FAQ."
            );
        }

        const faq =
            (data.faqs || [])
                .find(
                    item =>
                        Number(item.id) ===
                        Number(faqId)
                );

        if (!faq) {

            alert("FAQ not found.");

            return;
        }

        await updateFaq(
            faqId,
            {
                question:
                    faq.question,

                answer:
                    faq.answer,

                category:
                    faq.category ||
                    null,

                display_order:
                    Number(
                        faq.display_order || 0
                    ),

                is_active:
                    !currentlyActive
            }
        );

    } catch (error) {

        console.error(
            "Toggle FAQ error:",
            error
        );

        alert(
            error.message ||
            "Unable to change FAQ status."
        );
    }
}


/* ==================================================
   DELETE FAQ
================================================== */

async function deleteFaq(faqId) {

    if (
        !confirm(
            "Are you sure you want to permanently delete this FAQ?"
        )
    ) {

        return;
    }

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();

        return;
    }

    try {

        const response =
            await fetch(
                `${API}/admin/faqs/${faqId}?session_token=${encodeURIComponent(sessionToken)}`,
                {
                    method: "DELETE"
                }
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();

            return;
        }

        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to delete FAQ."
            );
        }

        alert(
            "FAQ deleted successfully."
        );

        await loadFaqs();

    } catch (error) {

        console.error(
            "Delete FAQ error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete FAQ."
        );
    }
}


/* ==================================================
   FAQ FORM MESSAGE
================================================== */

function showFaqMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "faqFormMessage"
        );

    if (!element) return;

    element.textContent =
        message;

    element.className =
        `faq-form-message ${type}`;

    setTimeout(
        () => {

            element.textContent = "";

            element.className =
                "faq-form-message";

        },
        4000
    );
}

/* ==================================================
   NEWSLETTER
================================================== */

async function loadContactNewsletter() {

    const container =
        document.getElementById(
            "contactNewsletterContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    container.innerHTML = `
        <div class="contact-loading">
            Loading subscribers...
        </div>
    `;

    try {

        const response =
            await fetch(
                `${API}/admin/newsletter-subscribers?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await parseResponse(response);

        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                "Unable to load subscribers."
            );

        }

        const subscribers =
            Array.isArray(data)
                ? data
                : data.subscribers || [];

        setText(
            "contactSubscribers",
            subscribers.length
        );

        if (!subscribers.length) {

            container.innerHTML = `
                <div class="contact-empty">

                    <div class="contact-empty-icon">
                        📧
                    </div>

                    <h3>
                        No subscribers
                    </h3>

                    <p>
                        No newsletter subscribers found.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            subscribers
                .map(createNewsletterCard)
                .join("");

    } catch (error) {

        console.error(
            "Newsletter error:",
            error
        );

        container.innerHTML = `
            <div class="contact-empty">

                <div class="contact-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load subscribers
                </h3>

                <p>
                    ${escapeHTML(error.message)}
                </p>

            </div>
        `;

    }

}


function createNewsletterCard(subscriber) {

    const status =
        subscriber.status ||
        "active";

    const statusClass =
        status === "active"
            ? "accepted"
            : "closed";

    return `
        <article class="contact-card">

            <div class="contact-card-header">

                <div class="contact-person">

                    <strong>
                        ${escapeHTML(
                            subscriber.email ||
                            "Unknown email"
                        )}
                    </strong>

                    <span>
                        Newsletter subscriber
                    </span>

                </div>

                <span class="contact-status ${statusClass}">
                    ${escapeHTML(status)}
                </span>

            </div>


            <div class="contact-details">

                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Subscribed
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(
                            formatDate(
                                subscriber.subscribed_at
                            )
                        )}
                    </div>

                </div>


                <div class="contact-detail">

                    <span class="contact-detail-label">
                        Status
                    </span>

                    <div class="contact-detail-value">
                        ${escapeHTML(status)}
                    </div>

                </div>

            </div>

        </article>
    `;

}


/* ==================================================
   CONNECTION OVERVIEW
================================================== */

async function loadConnectionOverview() {
    const token = localStorage.getItem("session_token");

    if (!token) {
        console.error("No admin session token found.");
        return;
    }

    const messageEl = document.getElementById("connectionOverviewMessage");

    try {
        if (messageEl) {
            messageEl.textContent = "Loading connection statistics...";
        }

        const response = await fetch(
            `${API}/connection/admin/overview?session_token=${encodeURIComponent(token)}`
        );

        const data = await response.json();

        console.log("Connection Overview API:", data);

        if (!response.ok || data.error) {
            throw new Error(
                data.error ||
                data.detail ||
                "Failed to load connection overview."
            );
        }

        const overview = data.overview;

        if (!overview) {
            throw new Error("Connection overview data is missing.");
        }

        // ================================
        // MAIN STATISTICS
        // ================================

        document.getElementById("adminConnectionProfiles").textContent =
            overview.total_profiles ?? 0;

        document.getElementById("adminAvailableMembers").textContent =
            overview.available_members ?? 0;

        document.getElementById("adminPendingRequests").textContent =
            overview.pending_requests ?? 0;

        document.getElementById("adminAcceptedRequests").textContent =
            overview.accepted_requests ?? 0;

        document.getElementById("adminActiveConversations").textContent =
            overview.active_conversations ?? 0;

        document.getElementById("adminEndedConversations").textContent =
            overview.ended_conversations ?? 0;

        document.getElementById("adminConnectionMessages").textContent =
            overview.total_messages ?? 0;

        document.getElementById("adminUnreadMessages").textContent =
            overview.unread_messages ?? 0;

        document.getElementById("adminConnectionBlocks").textContent =
            overview.total_blocks ?? 0;

        document.getElementById("adminConnectionReports").textContent =
            overview.total_reports ?? 0;

        document.getElementById("adminPendingReports").textContent =
            overview.pending_reports ?? 0;


        // ================================
        // REQUEST BREAKDOWN
        // ================================

        document.getElementById(
            "adminConnectionPendingBreakdown"
        ).textContent = overview.pending_requests ?? 0;

        document.getElementById(
            "adminConnectionAcceptedBreakdown"
        ).textContent = overview.accepted_requests ?? 0;

        document.getElementById(
            "adminConnectionDeclinedBreakdown"
        ).textContent = overview.declined_requests ?? 0;

        document.getElementById(
            "adminConnectionCancelledBreakdown"
        ).textContent = overview.cancelled_requests ?? 0;


        // ================================
        // SUCCESS MESSAGE
        // ================================

        if (messageEl) {
            messageEl.textContent =
                `Updated ${new Date().toLocaleTimeString()}`;
        }

    } catch (error) {

        console.error(
            "Connection overview error:",
            error
        );

        if (messageEl) {
            messageEl.textContent =
                "Unable to load connection overview.";
        }
    }
}

/* ==================================================
   CONNECTION MEMBERS
================================================== */
/* ==================================================
   CONNECTION MEMBERS
================================================== */

let connectionMembersData = [];
let connectionMembersSearch = "";
let connectionMembersAvailability = "all";


async function loadConnectionMembers() {

    const container =
        document.getElementById(
            "connectionMembersContainer"
        );

    const section =
        document.getElementById(
            "connectionMembersSection"
        );

    if (!container || !section) return;


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        handleSessionExpired();

        return;

    }


    createConnectionMembersToolbar();


    container.innerHTML = `
        <div class="connection-members-loading">
            <div class="connection-loading-spinner"></div>
            <p>Loading connection members...</p>
        </div>
    `;


    try {

        /*
         * IMPORTANT:
         * Current backend endpoint:
         * /connection/admin/members
         */

        const response =
            await fetch(
                `${API}/connection/admin/members?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await parseResponse(response);


        if (
            data.error === "Admin access required" ||
            data.error === "Invalid or expired session"
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to load connection members."
            );

        }


        connectionMembersData =
            Array.isArray(data.members)
                ? data.members
                : [];


        updateConnectionMemberSummary(
            connectionMembersData
        );


        renderConnectionMembers();


    } catch (error) {

        console.error(
            "Connection members error:",
            error
        );


        container.innerHTML = `
            <div class="connection-members-empty">

                <div class="connection-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load connection members
                </h3>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Something went wrong."
                    )}
                </p>

            </div>
        `;

    }

}


/* ==================================================
   CONNECTION MEMBERS TOOLBAR
================================================== */

function createConnectionMembersToolbar() {

    const section =
        document.getElementById(
            "connectionMembersSection"
        );

    const container =
        document.getElementById(
            "connectionMembersContainer"
        );


    if (!section || !container) return;


    if (
        document.getElementById(
            "connectionMembersToolbar"
        )
    ) {

        return;

    }


    const toolbar =
        document.createElement("div");

    toolbar.id =
        "connectionMembersToolbar";

    toolbar.className =
        "connection-members-toolbar";


    toolbar.innerHTML = `

        <div class="connection-members-search">

            <span class="connection-search-icon">
                🔎
            </span>

            <input
                type="text"
                id="connectionMemberSearch"
                placeholder="Search members by nickname, bio or topic..."
                autocomplete="off"
            >

        </div>


        <div class="connection-members-filter">

            <label for="connectionMemberAvailability">
                Availability
            </label>

            <select
                id="connectionMemberAvailability"
            >

                <option value="all">
                    All Members
                </option>

                <option value="available">
                    Available
                </option>

                <option value="unavailable">
                    Unavailable
                </option>

            </select>

        </div>

    `;


    container.parentNode.insertBefore(
        toolbar,
        container
    );


    const searchInput =
        document.getElementById(
            "connectionMemberSearch"
        );

    const availabilitySelect =
        document.getElementById(
            "connectionMemberAvailability"
        );


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                connectionMembersSearch =
                    this.value
                        .trim()
                        .toLowerCase();

                renderConnectionMembers();

            }
        );

    }


    if (availabilitySelect) {

        availabilitySelect.addEventListener(
            "change",
            function () {

                connectionMembersAvailability =
                    this.value;

                renderConnectionMembers();

            }
        );

    }

}


/* ==================================================
   SUMMARY
================================================== */

function updateConnectionMemberSummary(
    members
) {

    const total =
        members.length;


    const available =
        members.filter(
            member =>
                Number(
                    member.is_available
                ) === 1
        ).length;


    const unavailable =
        total - available;


    let summary =
        document.getElementById(
            "connectionMembersSummary"
        );


    if (!summary) {

        const container =
            document.getElementById(
                "connectionMembersContainer"
            );

        if (!container) return;


        summary =
            document.createElement("div");

        summary.id =
            "connectionMembersSummary";

        summary.className =
            "connection-members-summary";


        container.parentNode.insertBefore(
            summary,
            container
        );

    }


    summary.innerHTML = `

        <div class="connection-member-summary-card">

            <div class="connection-summary-icon">
                👥
            </div>

            <div>

                <span>
                    Total Members
                </span>

                <strong>
                    ${total}
                </strong>

            </div>

        </div>


        <div class="connection-member-summary-card">

            <div class="connection-summary-icon available">
                🟢
            </div>

            <div>

                <span>
                    Available
                </span>

                <strong>
                    ${available}
                </strong>

            </div>

        </div>


        <div class="connection-member-summary-card">

            <div class="connection-summary-icon unavailable">
                ⚪
            </div>

            <div>

                <span>
                    Unavailable
                </span>

                <strong>
                    ${unavailable}
                </strong>

            </div>

        </div>

    `;

}


/* ==================================================
   RENDER FILTERED MEMBERS
================================================== */

function renderConnectionMembers() {

    const container =
        document.getElementById(
            "connectionMembersContainer"
        );


    if (!container) return;


    let members =
        [...connectionMembersData];


    /* -------------------------------
       AVAILABILITY FILTER
    ------------------------------- */

    if (
        connectionMembersAvailability ===
        "available"
    ) {

        members =
            members.filter(
                member =>
                    Number(
                        member.is_available
                    ) === 1
            );

    }


    if (
        connectionMembersAvailability ===
        "unavailable"
    ) {

        members =
            members.filter(
                member =>
                    Number(
                        member.is_available
                    ) === 0
            );

    }


    /* -------------------------------
       SEARCH
    ------------------------------- */

    if (connectionMembersSearch) {

        members =
            members.filter(
                member => {

                    const searchableText = [

                        member.nickname,

                        member.bio,

                        member.topics,

                        member.user_id

                    ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase();


                    return searchableText.includes(
                        connectionMembersSearch
                    );

                }
            );

    }


    /* -------------------------------
       EMPTY RESULT
    ------------------------------- */

    if (!members.length) {

        container.innerHTML = `

            <div class="connection-members-empty">

                <div class="connection-empty-icon">
                    🔍
                </div>

                <h3>
                    No members found
                </h3>

                <p>
                    Try changing your search or availability filter.
                </p>

            </div>

        `;

        return;

    }


    /* -------------------------------
       MEMBER CARDS
    ------------------------------- */

    container.innerHTML =
        members
            .map(
                createConnectionMemberCard
            )
            .join("");

}


/* ==================================================
   MEMBER CARD
================================================== */

function createConnectionMemberCard(
    member
) {

    const nickname =
        member.nickname ||
        "Anonymous Member";


    const avatar =
        member.avatar ||
        "🌿";


    const isAvailable =
        Number(
            member.is_available
        ) === 1;


    const avatarHTML =
        String(avatar).startsWith(
            "/frontend/"
        )

            ? `
                <img
                    src="${escapeHTML(avatar)}"
                    alt="Member avatar"
                >
            `

            : escapeHTML(avatar);


    const bio =
        member.bio ||
        "No bio provided.";


    const topics =
        member.topics ||
        "No topics provided.";


    return `

        <article
            class="connection-member-admin-card"
        >


            <!-- HEADER -->

            <div
                class="connection-member-card-header"
            >

                <div
                    class="connection-member-profile"
                >

                    <div
                        class="connection-member-avatar"
                    >
                        ${avatarHTML}
                    </div>


                    <div
                        class="connection-member-identity"
                    >

                        <h3>
                            ${escapeHTML(
                                nickname
                            )}
                        </h3>

                        <span>
                            User #${escapeHTML(
                                String(
                                    member.user_id ??
                                    "—"
                                )
                            )}
                        </span>

                    </div>

                </div>


                <span
                    class="
                        connection-member-status
                        ${
                            isAvailable
                                ? "available"
                                : "unavailable"
                        }
                    "
                >

                    <span class="status-dot"></span>

                    ${
                        isAvailable
                            ? "Available"
                            : "Unavailable"
                    }

                </span>

            </div>


            <!-- BIO -->

            <div
                class="connection-member-about"
            >

                <div>

                    <span>
                        BIO
                    </span>

                    <p>
                        ${escapeHTML(
                            bio
                        )}
                    </p>

                </div>


                <div>

                    <span>
                        TOPICS
                    </span>

                    <p>
                        ${escapeHTML(
                            topics
                        )}
                    </p>

                </div>

            </div>


            <!-- ACTIVITY -->

            <div
                class="connection-member-activity"
            >

                <div>

                    <span>
                        Requests
                    </span>

                    <strong>
                        ${member.request_count ?? 0}
                    </strong>

                </div>


                <div>

                    <span>
                        Conversations
                    </span>

                    <strong>
                        ${member.conversation_count ?? 0}
                    </strong>

                </div>


                <div>

                    <span>
                        Messages
                    </span>

                    <strong>
                        ${member.message_count ?? 0}
                    </strong>

                </div>


                <div>

                    <span>
                        Blocks
                    </span>

                    <strong>
                        ${member.block_count ?? 0}
                    </strong>

                </div>


                <div>

                    <span>
                        Reports
                    </span>

                    <strong>
                        ${member.report_count ?? 0}
                    </strong>

                </div>

            </div>


            <!-- DATES -->

            <div
                class="connection-member-dates"
            >

                <div>

                    <span>
                        Profile Created
                    </span>

                    <strong>
                        ${
                            member.created_at
                                ? formatDate(
                                    member.created_at
                                )
                                : "—"
                        }
                    </strong>

                </div>


                <div>

                    <span>
                        Last Updated
                    </span>

                    <strong>
                        ${
                            member.updated_at
                                ? formatDate(
                                    member.updated_at
                                )
                                : "—"
                        }
                    </strong>

                </div>

            </div>


        </article>

    `;

}

/* ==================================================
   HELPERS
================================================== */

function formatApplicationType(type) {

    const labels = {

        volunteer:
            "Volunteer",

        core_team:
            "Core Team",

        technical_support:
            "Technical Support",

        partner:
            "Partner",

        professional:
            "Professional"

    };

    return labels[type] ||
        type ||
        "Unknown";

}


function capitalize(value) {

    if (!value) return "";

    return value.charAt(0).toUpperCase() +
        value.slice(1);

}


function setText(id, value) {

    const element =
        document.getElementById(id);

    if (element) {

        element.textContent =
            value ?? "";

    }

}


function formatDate(dateString) {

    if (!dateString) {

        return "Unknown date";

    }

    const date =
        new Date(dateString);

    if (
        isNaN(
            date.getTime()
        )
    ) {

        return String(
            dateString
        );

    }

    return date.toLocaleString(
        undefined,
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


function escapeHTML(value) {

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


function showError(message) {

    const errorElement =
        document.getElementById(
            "errorMessage"
        );

    if (!errorElement) return;

    errorElement.textContent =
        message;

    errorElement.style.display =
        "block";

    setTimeout(
        () => {

            errorElement.style.display =
                "none";

        },
        5000
    );

}


/* ==================================================
   LOGOUT
================================================== */

function logoutAdmin() {

    localStorage.clear();
    sessionStorage.clear();

    window.location.href =
        "../login.html";

}





// ============================================================
// EVENTS MANAGEMENT
// ============================================================


// ============================================================
// LOAD ADMIN EVENTS
// ============================================================

async function loadAdminEvents() {

    const container =
        document.getElementById("adminEventsContainer");

    if (!container) {
        return;
    }

    const sessionToken = getSessionToken();

    if (!sessionToken) {
        handleSessionExpired();
        return;
    }

    container.innerHTML = `
        <tr>
            <td colspan="7" class="table-loading">
                Loading events...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(
            `${API}/events/admin/all?session_token=${encodeURIComponent(sessionToken)}`
        );

        const data = await response.json();

        if (
            response.status === 401 ||
            data.error === "Admin access required"
        ) {
            handleSessionExpired();
            return;
        }

        if (!response.ok || data.error) {
            throw new Error(
                data.error || "Failed to load events"
            );
        }

        const events = data.events || [];

        window.adminEventsData = events;

        updateEventStatistics(events);
        renderAdminEvents(events);

    } catch (error) {

        console.error(
            "Error loading admin events:",
            error
        );

        container.innerHTML = `
            <tr>
                <td colspan="7" class="table-error">
                    Unable to load events.
                    Please try again.
                </td>
            </tr>
        `;
    }
}


// ============================================================
// EVENT STATISTICS
// ============================================================

function updateEventStatistics(events) {

    const totalElement =
        document.getElementById("adminTotalEvents");

    const upcomingElement =
        document.getElementById("adminUpcomingEvents");

    const pastElement =
        document.getElementById("adminPastEvents");

    const registrationsElement =
        document.getElementById("adminTotalRegistrations");

    const now = new Date();

    let upcoming = 0;
    let past = 0;
    let registrations = 0;

    events.forEach(event => {

        const eventDate =
            new Date(event.event_date);

        if (
            !isNaN(eventDate.getTime()) &&
            eventDate >= now
        ) {
            upcoming++;
        } else {
            past++;
        }

        registrations +=
            Number(event.registration_count || 0);

    });

    if (totalElement) {
        totalElement.textContent =
            events.length;
    }

    if (upcomingElement) {
        upcomingElement.textContent =
            upcoming;
    }

    if (pastElement) {
        pastElement.textContent =
            past;
    }

    if (registrationsElement) {
        registrationsElement.textContent =
            registrations;
    }
}


// ============================================================
// RENDER EVENTS TABLE
// ============================================================

function renderAdminEvents(events) {

    const container =
        document.getElementById(
            "adminEventsContainer"
        );

    if (!container) {
        return;
    }

    const searchInput =
        document.getElementById(
            "eventSearch"
        );

    const categoryFilter =
        document.getElementById(
            "eventCategoryFilter"
        );

    const statusFilter =
        document.getElementById(
            "eventStatusFilter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";

    const selectedCategory =
        categoryFilter
            ? categoryFilter.value
            : "all";

    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "all";


    const now = new Date();


    const filteredEvents =
        events.filter(event => {

            const title =
                String(
                    event.title || ""
                ).toLowerCase();

            const description =
                String(
                    event.description || ""
                ).toLowerCase();

            const location =
                String(
                    event.location || ""
                ).toLowerCase();

            const category =
                String(
                    event.category || ""
                ).toLowerCase();


            const matchesSearch =
                !searchTerm ||
                title.includes(searchTerm) ||
                description.includes(searchTerm) ||
                location.includes(searchTerm);


            const matchesCategory =
                selectedCategory === "all" ||
                category ===
                    selectedCategory.toLowerCase();


            const eventDate =
                new Date(event.event_date);


            let matchesStatus = true;


            if (
                selectedStatus === "upcoming"
            ) {

                matchesStatus =
                    eventDate >= now;

            }

            if (
                selectedStatus === "past"
            ) {

                matchesStatus =
                    eventDate < now;

            }


            return (
                matchesSearch &&
                matchesCategory &&
                matchesStatus
            );

        });


    if (filteredEvents.length === 0) {

        container.innerHTML = `
            <tr>
                <td
                    colspan="7"
                    class="table-empty"
                >
                    <div class="events-table-empty">
                        <i class="fa-regular fa-calendar-xmark"></i>
                        <strong>No events found</strong>
                        <span>
                            Try changing your search or filters.
                        </span>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    container.innerHTML = "";


    filteredEvents.forEach(event => {

        container.appendChild(
            createAdminEventRow(event)
        );

    });
}


// ============================================================
// CREATE EVENT TABLE ROW
// ============================================================

function createAdminEventRow(event) {

    const row =
        document.createElement("tr");


    const eventDate =
        new Date(event.event_date);


    const isUpcoming =
        !isNaN(eventDate.getTime()) &&
        eventDate >= new Date();


    const registrationCount =
        Number(
            event.registration_count || 0
        );


    const image =
        getAdminEventImage(event);


    row.innerHTML = `

        <td>

            <div class="admin-event-info">

                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(
                        event.title || "Event"
                    )}"
                    class="admin-event-thumbnail"
                    onerror="
                        this.onerror=null;
                        this.src='../images/Events/discussion.jpg';
                    "
                

                <div class="admin-event-title">

                    <strong>
                        ${escapeHTML(
                            event.title ||
                            "Untitled Event"
                        )}
                    </strong>

                    <span>
                        ID #${event.id}
                    </span>

                </div>

            </div>

        </td>


        <td>

            <span class="event-admin-category">
                ${escapeHTML(
                    formatAdminEventCategory(
                        event.category
                    )
                )}
            </span>

        </td>


        <td>

            <div class="admin-event-date">

                <strong>
                    ${formatAdminEventDate(
                        event.event_date
                    )}
                </strong>

                <span>
                    ${formatAdminEventTime(
                        event.event_date
                    )}
                </span>

            </div>

        </td>


        <td>

            <div class="admin-event-location">

                <i class="fa-solid fa-location-dot"></i>

                <span>
                    ${escapeHTML(
                        event.location ||
                        "Online"
                    )}
                </span>

            </div>

        </td>


        <td>

            <button
                type="button"
                class="registration-count-btn"
                onclick="viewEventRegistrations(${event.id})"
                title="View registrations"
            >

                <i class="fa-solid fa-users"></i>

                ${registrationCount}

            </button>

        </td>


        <td>

            <span class="
                event-status-badge
                ${isUpcoming
                    ? "upcoming"
                    : "past"}
            ">

                ${isUpcoming
                    ? "Upcoming"
                    : "Past"}

            </span>

        </td>


        <td>

            <div class="event-admin-actions">

                <button
                    type="button"
                    class="admin-action-btn edit"
                    onclick="editEvent(${event.id})"
                    title="Edit event"
                >
                    <i class="fa-solid fa-pen"></i>
                </button>


                <button
                    type="button"
                    class="admin-action-btn registrations"
                    onclick="viewEventRegistrations(${event.id})"
                    title="View registrations"
                >
                    <i class="fa-solid fa-users"></i>
                </button>


                <button
                    type="button"
                    class="admin-action-btn delete"
                    onclick="deleteEvent(${event.id})"
                    title="Delete event"
                >
                    <i class="fa-solid fa-trash"></i>
                </button>

            </div>

        </td>

    `;


    return row;
}


// ============================================================
// EVENT IMAGE
// ============================================================

function getAdminEventImage(event) {

    if (!event || !event.image) {
        return "../images/Events/discussion.jpg";
    }

    const image =
        String(event.image).trim();


    if (
        image.startsWith("http://") ||
        image.startsWith("https://")
    ) {
        return image;
    }


    if (
        image.startsWith("../images/")
    ) {
        return image;
    }


    if (
        image.startsWith("images/")
    ) {
        return "../" + image;
    }


    if (
        image.startsWith("/images/")
    ) {
        return ".." + image;
    }


    return `../images/Events/${image}`;
}


// ============================================================
// SHOW EVENT FORM
// ============================================================

function showEventForm(event = null) {

    const modal =
        document.getElementById(
            "eventFormModal"
        );

    const form =
        document.getElementById(
            "eventForm"
        );

    if (!modal || !form) {
        return;
    }


    form.reset();

    clearEventFormMessage();


    const formTitle =
        document.getElementById(
            "eventFormTitle"
        );


    const eventId =
        document.getElementById(
            "eventId"
        );


    if (event) {

        if (formTitle) {
            formTitle.textContent =
                "Edit Event";
        }

        if (eventId) {
            eventId.value =
                event.id;
        }


        document.getElementById(
            "eventTitle"
        ).value =
            event.title || "";


        document.getElementById(
            "eventCategory"
        ).value =
            event.category || "";


        document.getElementById(
            "eventDate"
        ).value =
            convertToDateTimeLocal(
                event.event_date
            );


        document.getElementById(
            "eventLocation"
        ).value =
            event.location || "";


        document.getElementById(
            "eventImage"
        ).value =
            event.image || "";


        document.getElementById(
            "eventDescription"
        ).value =
            event.description || "";

    } else {

        if (formTitle) {
            formTitle.textContent =
                "Add New Event";
        }

        if (eventId) {
            eventId.value = "";
        }

    }


    modal.classList.add("show");

    document.body.classList.add(
        "modal-open"
    );
}


// ============================================================
// HIDE EVENT FORM
// ============================================================

function hideEventForm() {

    const modal =
        document.getElementById(
            "eventFormModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    document.body.classList.remove(
        "modal-open"
    );
}


// ============================================================
// CLEAR EVENT FORM MESSAGE
// ============================================================

function clearEventFormMessage() {

    const message =
        document.getElementById(
            "eventFormMessage"
        );

    if (!message) {
        return;
    }

    message.textContent = "";

    message.className =
        "form-message";
}


// ============================================================
// SHOW EVENT FORM MESSAGE
// ============================================================

function showEventFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "eventFormMessage"
        );

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        `form-message ${type}`;
}


// ============================================================
// CREATE EVENT
// ============================================================

async function createAdminEvent() {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        handleSessionExpired();
        return;
    }


    const title =
        document.getElementById(
            "eventTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "eventCategory"
        ).value;


    const eventDate =
        document.getElementById(
            "eventDate"
        ).value;


    const location =
        document.getElementById(
            "eventLocation"
        ).value.trim();


    const image =
        document.getElementById(
            "eventImage"
        ).value.trim();


    const description =
        document.getElementById(
            "eventDescription"
        ).value.trim();


    if (!title) {

        showEventFormMessage(
            "Event title is required."
        );

        return;
    }


    if (!category) {

        showEventFormMessage(
            "Please select an event category."
        );

        return;
    }


    if (!eventDate) {

        showEventFormMessage(
            "Event date and time are required."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#eventForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

    }


    try {

        const response =
            await fetch(
                `${API}/events/admin/create`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        title:
                            title,

                        description:
                            description,

                        category:
                            category,

                        event_date:
                            eventDate,

                        location:
                            location,

                        image:
                            image

                    })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401 ||
            data.error ===
                "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Failed to create event"
            );
        }


        showEventFormMessage(
            data.message ||
            "Event created successfully.",
            "success"
        );


        setTimeout(() => {

            hideEventForm();

            loadAdminEvents();

        }, 700);


    } catch (error) {

        console.error(
            "Create event error:",
            error
        );

        showEventFormMessage(
            error.message ||
            "Unable to create event."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Save Event';

        }

    }
}


// ============================================================
// EDIT EVENT
// ============================================================

function editEvent(eventId) {

    const events =
        window.adminEventsData || [];


    const event =
        events.find(
            item =>
                Number(item.id) ===
                Number(eventId)
        );


    if (!event) {

        alert(
            "Event information could not be found."
        );

        return;
    }


    showEventForm(event);
}


// ============================================================
// UPDATE EVENT
// ============================================================

async function updateAdminEvent(eventId) {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        handleSessionExpired();
        return;
    }


    const title =
        document.getElementById(
            "eventTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "eventCategory"
        ).value;


    const eventDate =
        document.getElementById(
            "eventDate"
        ).value;


    const location =
        document.getElementById(
            "eventLocation"
        ).value.trim();


    const image =
        document.getElementById(
            "eventImage"
        ).value.trim();


    const description =
        document.getElementById(
            "eventDescription"
        ).value.trim();


    if (!title) {

        showEventFormMessage(
            "Event title is required."
        );

        return;
    }


    if (!eventDate) {

        showEventFormMessage(
            "Event date and time are required."
        );

        return;
    }


    const submitButton =
        document.querySelector(
            "#eventForm button[type='submit']"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';

    }


    try {

        const response =
            await fetch(
                `${API}/events/admin/${eventId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        title:
                            title,

                        description:
                            description,

                        category:
                            category,

                        event_date:
                            eventDate,

                        location:
                            location,

                        image:
                            image

                    })
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401 ||
            data.error ===
                "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Failed to update event"
            );
        }


        showEventFormMessage(
            data.message ||
            "Event updated successfully.",
            "success"
        );


        setTimeout(() => {

            hideEventForm();

            loadAdminEvents();

        }, 700);


    } catch (error) {

        console.error(
            "Update event error:",
            error
        );

        showEventFormMessage(
            error.message ||
            "Unable to update event."
        );

    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                '<i class="fa-solid fa-check"></i> Save Event';

        }

    }
}


// ============================================================
// DELETE EVENT
// ============================================================

async function deleteEvent(eventId) {

    const events =
        window.adminEventsData || [];


    const event =
        events.find(
            item =>
                Number(item.id) ===
                Number(eventId)
        );


    const eventTitle =
        event
            ? event.title
            : "this event";


    const confirmed =
        confirm(
            `Are you sure you want to delete "${eventTitle}"?\n\nAll registrations for this event will also be removed.`
        );


    if (!confirmed) {
        return;
    }


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        handleSessionExpired();
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/events/admin/${eventId}?session_token=${encodeURIComponent(sessionToken)}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            response.status === 401 ||
            data.error ===
                "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Failed to delete event"
            );
        }


        alert(
            data.message ||
            "Event deleted successfully."
        );


        loadAdminEvents();


    } catch (error) {

        console.error(
            "Delete event error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete event."
        );

    }
}


// ============================================================
// VIEW EVENT REGISTRATIONS
// ============================================================

async function viewEventRegistrations(
    eventId
) {

    const modal =
        document.getElementById(
            "eventRegistrationsModal"
        );


    const container =
        document.getElementById(
            "eventRegistrationsContainer"
        );


    const title =
        document.getElementById(
            "registrationsEventTitle"
        );


    if (!modal || !container) {
        return;
    }


    const events =
        window.adminEventsData || [];


    const event =
        events.find(
            item =>
                Number(item.id) ===
                Number(eventId)
        );


    if (title) {

        title.textContent =
            event
                ? event.title
                : "Event Registrations";

    }


    modal.classList.add("show");

    document.body.classList.add(
        "modal-open"
    );


    container.innerHTML = `
        <div class="registrations-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
            Loading registrations...
        </div>
    `;


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        handleSessionExpired();
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/events/admin/${eventId}/registrations?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (
            response.status === 401 ||
            data.error ===
                "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Failed to load registrations"
            );
        }


        const registrations =
            data.registrations || [];


        if (registrations.length === 0) {

            container.innerHTML = `
                <div class="registrations-empty">

                    <i class="fa-regular fa-user"></i>

                    <h4>
                        No registrations yet
                    </h4>

                    <p>
                        No one has registered
                        for this event yet.
                    </p>

                </div>
            `;

            return;
        }


        container.innerHTML = `
            <div class="registrations-summary">

                <strong>
                    ${registrations.length}
                </strong>

                <span>
                    ${registrations.length === 1
                        ? "registered participant"
                        : "registered participants"}
                </span>

            </div>

            <div class="registrations-table-wrapper">

                <table class="registrations-table">

                    <thead>

                        <tr>

                            <th>Name</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th>College</th>
                            <th>Course</th>
                            <th>Semester</th>
                            <th>Registered</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${registrations
                            .map(
                                registration =>
                                    createRegistrationRow(
                                        registration
                                    )
                            )
                            .join("")}

                    </tbody>

                </table>

            </div>
        `;


    } catch (error) {

        console.error(
            "Registration loading error:",
            error
        );


        container.innerHTML = `
            <div class="registrations-error">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <h4>
                    Unable to load registrations
                </h4>

                <p>
                    ${escapeHTML(
                        error.message ||
                        "Please try again."
                    )}
                </p>

            </div>
        `;
    }
}


// ============================================================
// CREATE REGISTRATION ROW
// ============================================================

function createRegistrationRow(
    registration
) {

    return `
        <tr>

            <td>
                <strong>
                    ${escapeHTML(
                        registration.full_name ||
                        "—"
                    )}
                </strong>
            </td>

            <td>
                ${escapeHTML(
                    registration.email ||
                    "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    registration.phone ||
                    "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    registration.college ||
                    "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    registration.course ||
                    "—"
                )}
            </td>

            <td>
                ${escapeHTML(
                    registration.semester ||
                    "—"
                )}
            </td>

            <td>
                ${formatAdminEventDateTime(
                    registration.registered_at
                )}
            </td>

        </tr>
    `;
}


// ============================================================
// HIDE REGISTRATIONS MODAL
// ============================================================

function hideEventRegistrations() {

    const modal =
        document.getElementById(
            "eventRegistrationsModal"
        );

    if (!modal) {
        return;
    }

    modal.classList.remove("show");

    document.body.classList.remove(
        "modal-open"
    );
}


// ============================================================
// FORM SUBMIT HANDLER
// ============================================================

function handleEventFormSubmit(
    event
) {

    event.preventDefault();


    const eventId =
        document.getElementById(
            "eventId"
        ).value;


    if (eventId) {

        updateAdminEvent(
            eventId
        );

    } else {

        createAdminEvent();

    }
}


// ============================================================
// SEARCH / FILTER SETUP
// ============================================================

function setupEventFilters() {

    const searchInput =
        document.getElementById(
            "eventSearch"
        );


    const categoryFilter =
        document.getElementById(
            "eventCategoryFilter"
        );


    const statusFilter =
        document.getElementById(
            "eventStatusFilter"
        );


    const refreshEvents = () => {

        renderAdminEvents(
            window.adminEventsData || []
        );

    };


    if (searchInput) {

        searchInput.addEventListener(
            "input",
            refreshEvents
        );

    }


    if (categoryFilter) {

        categoryFilter.addEventListener(
            "change",
            refreshEvents
        );

    }


    if (statusFilter) {

        statusFilter.addEventListener(
            "change",
            refreshEvents
        );

    }

}


// ============================================================
// INITIALIZE EVENTS MANAGEMENT
// ============================================================

function initializeEventsManagement() {

    const eventForm =
        document.getElementById(
            "eventForm"
        );


    if (eventForm) {

        eventForm.addEventListener(
            "submit",
            handleEventFormSubmit
        );

    }


    setupEventFilters();

    loadAdminEvents();


    // Close modals by clicking background
    const eventFormModal =
        document.getElementById(
            "eventFormModal"
        );


    if (eventFormModal) {

        eventFormModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    eventFormModal
                ) {

                    hideEventForm();

                }

            }
        );

    }


    const registrationsModal =
        document.getElementById(
            "eventRegistrationsModal"
        );


    if (registrationsModal) {

        registrationsModal.addEventListener(
            "click",
            function (event) {

                if (
                    event.target ===
                    registrationsModal
                ) {

                    hideEventRegistrations();

                }

            }
        );

    }

}


// ============================================================
// FORMAT HELPERS
// ============================================================

function formatAdminEventCategory(
    category
) {

    if (!category) {
        return "MindSpeak";
    }

    return String(category)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, letter =>
            letter.toUpperCase()
        );
}


function formatAdminEventDate(
    dateString
) {

    if (!dateString) {
        return "Date TBD";
    }

    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {
        return dateString;
    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function formatAdminEventTime(
    dateString
) {

    if (!dateString) {
        return "";
    }

    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {
        return "";
    }


    return date.toLocaleTimeString(
        "en-US",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


function formatAdminEventDateTime(
    dateString
) {

    if (!dateString) {
        return "—";
    }

    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {
        return escapeHTML(dateString);
    }


    return date.toLocaleString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    );
}


function convertToDateTimeLocal(
    dateString
) {

    if (!dateString) {
        return "";
    }


    const date =
        new Date(dateString);


    if (isNaN(date.getTime())) {
        return "";
    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");


    const day =
        String(
            date.getDate()
        ).padStart(2, "0");


    const hours =
        String(
            date.getHours()
        ).padStart(2, "0");


    const minutes =
        String(
            date.getMinutes()
        ).padStart(2, "0");


    return (
        `${year}-${month}-${day}` +
        `T${hours}:${minutes}`
    );
}

/* ==================================================
   SIDEBAR
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        document.querySelectorAll(".nav-button").forEach(button => {
            button.addEventListener("click", function () {
                showSection(this.dataset.section);
            });
        });

        loadAdminIdentity();
        verifyAdmin();
        loadSafetyAlerts();
        initializeResources();
        initializeEventsManagement();
        initializeBlogManagement();
        /* =========================================
           FAQ FORM
        ========================================= */

        const faqForm =
            document.getElementById("faqForm");

        if (faqForm) {
            faqForm.addEventListener(
                "submit",
                createFaq
            );
        }

    }
);


/* ==================================================
   RESOURCES MANAGEMENT
================================================== */

async function loadResources() {

    const container =
        document.getElementById(
            "resourcesContainer"
        );

    if (!container) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    container.innerHTML = `
        <div class="resource-empty">

            <div class="resource-empty-icon">
                📚
            </div>

            <h3>
                Loading resources...
            </h3>

            <p>
                Please wait while resources are loaded.
            </p>

        </div>
    `;

    try {

        const filterElement =
            document.getElementById(
                "resourceFilter"
            );

        const category =
            filterElement
                ? filterElement.value
                : "all";

        const url =
            category &&
            category !== "all"
                ? `${API}/resources/?category=${encodeURIComponent(category)}`
                : `${API}/resources/`;

        const response =
            await fetch(url);

        const data =
            await parseResponse(response);

        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to load resources."
            );

        }

        const resources =
            Array.isArray(data.resources)
                ? data.resources
                : [];

        setText(
            "resourceCount",
            `${resources.length} ${
                resources.length === 1
                    ? "resource"
                    : "resources"
            }`
        );

        if (!resources.length) {

            container.innerHTML = `
                <div class="resource-empty">

                    <div class="resource-empty-icon">
                        📚
                    </div>

                    <h3>
                        No resources found
                    </h3>

                    <p>
                        There are no resources in this category yet.
                    </p>

                </div>
            `;

            return;

        }

        container.innerHTML =
            resources
                .map(
                    createResourceCard
                )
                .join("");

    } catch (error) {

        console.error(
            "Resources loading error:",
            error
        );

        container.innerHTML = `
            <div class="resource-empty">

                <div class="resource-empty-icon">
                    ⚠️
                </div>

                <h3>
                    Unable to load resources
                </h3>

                <p>
                    ${escapeHTML(
                        error.message
                    )}
                </p>

            </div>
        `;

    }

}


/* ==================================================
   RESOURCE CARD
================================================== */

function createResourceCard(resource) {

    const title =
        resource.title ||
        "Untitled Resource";

    const description =
        resource.description ||
        "No description available.";

    const category =
        resource.category ||
        "General";

    const resourceType =
        resource.resource_type ||
        "Resource";

    const fileUrl =
        resource.file_url ||
        "";

    const resourceId =
        resource.id;

    const createdAt =
        formatDate(
            resource.created_at
        );

    return `
        <article
            class="admin-resource-card"
            id="resource-${resourceId}"
        >

            <div class="admin-resource-header">

                <div class="admin-resource-title-area">

                    <h3 class="admin-resource-title">
                        ${escapeHTML(title)}
                    </h3>

                    <span class="admin-resource-category">
                        ${escapeHTML(category)}
                    </span>

                </div>

                <span class="admin-resource-type">
                    ${escapeHTML(resourceType)}
                </span>

            </div>


            <p class="admin-resource-description">
                ${escapeHTML(description)}
            </p>


            ${
                fileUrl
                    ? `
                        <a
                            href="${escapeHTML(fileUrl)}"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="admin-resource-url"
                        >
                            🔗 ${escapeHTML(fileUrl)}
                        </a>
                    `
                    : `
                        <div class="admin-resource-url">
                            No resource URL available
                        </div>
                    `
            }


            <div class="admin-resource-meta">

                <span>
                    ID: ${escapeHTML(
                        String(resourceId ?? "—")
                    )}
                </span>

                <span>
                    ${escapeHTML(createdAt)}
                </span>

            </div>


            <div class="admin-resource-actions">

                <button
                    type="button"
                    class="resource-action-btn"
                    onclick="editResource(${resourceId})"
                >
                    ✏️ Edit
                </button>


                <button
                    type="button"
                    class="resource-action-btn delete"
                    onclick="deleteResource(${resourceId})"
                >
                    🗑️ Delete
                </button>

            </div>

        </article>
    `;

}


/* ==================================================
   SHOW RESOURCE FORM
================================================== */

function showResourceForm() {

    const container =
        document.getElementById(
            "resourceFormContainer"
        );

    const title =
        document.getElementById(
            "resourceFormTitle"
        );

    if (!container) return;

    container.style.display =
        "block";

    if (title) {

        title.textContent =
            "Add New Resource";

    }

    resetResourceForm();

    container.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}


/* ==================================================
   HIDE RESOURCE FORM
================================================== */

function hideResourceForm() {

    const container =
        document.getElementById(
            "resourceFormContainer"
        );

    if (!container) return;

    container.style.display =
        "none";

    resetResourceForm();

}


/* ==================================================
   RESET RESOURCE FORM
================================================== */

function resetResourceForm() {

    const form =
        document.getElementById(
            "resourceForm"
        );

    if (form) {

        form.reset();

    }

    const resourceId =
        document.getElementById(
            "resourceId"
        );

    if (resourceId) {

        resourceId.value = "";

    }

    const formTitle =
        document.getElementById(
            "resourceFormTitle"
        );

    if (formTitle) {

        formTitle.textContent =
            "Add New Resource";

    }

    clearResourceFormMessage();

}


/* ==================================================
   RESOURCE FORM MESSAGE
================================================== */

function showResourceFormMessage(
    message,
    type = "info"
) {

    const element =
        document.getElementById(
            "resourceFormMessage"
        );

    if (!element) return;

    element.textContent =
        message;

    element.className =
        `admin-form-message ${type}`;

}


function clearResourceFormMessage() {

    const element =
        document.getElementById(
            "resourceFormMessage"
        );

    if (!element) return;

    element.textContent =
        "";

    element.className =
        "admin-form-message";

}


/* ==================================================
   CREATE RESOURCE
================================================== */

async function createResource() {

    const sessionToken = getSessionToken();

    if (!sessionToken) {
        handleSessionExpired();
        return;
    }

    const titleElement =
        document.getElementById("resourceTitle");

    const descriptionElement =
        document.getElementById("resourceDescription");

    const categoryElement =
        document.getElementById("resourceCategory");

    const fileUrlElement =
        document.getElementById("resourceFileUrl");

    const typeElement =
        document.getElementById("resourceType");


    if (
        !titleElement ||
        !descriptionElement ||
        !categoryElement ||
        !fileUrlElement ||
        !typeElement
    ) {

        showResourceFormMessage(
            "Resource form could not be found.",
            "error"
        );

        return;
    }


    const title =
        titleElement.value.trim();

    const description =
        descriptionElement.value.trim();

    const category =
        categoryElement.value;

    const fileUrl =
        fileUrlElement.value.trim();

    const resourceType =
        typeElement.value;


    if (!title) {
        showResourceFormMessage(
            "Please enter a resource title.",
            "error"
        );
        titleElement.focus();
        return;
    }

    if (!description) {
        showResourceFormMessage(
            "Please enter a description.",
            "error"
        );
        descriptionElement.focus();
        return;
    }

    if (!category) {
        showResourceFormMessage(
            "Please select a category.",
            "error"
        );
        categoryElement.focus();
        return;
    }

    if (!fileUrl) {
        showResourceFormMessage(
            "Please enter a resource URL or file path.",
            "error"
        );
        fileUrlElement.focus();
        return;
    }

    if (!resourceType) {
        showResourceFormMessage(
            "Please select a resource type.",
            "error"
        );
        typeElement.focus();
        return;
    }


    try {

        showResourceFormMessage(
            "Saving resource...",
            "info"
        );


        const response =
            await fetch(
                `${API}/resources/add`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        title:
                            title,

                        description:
                            description,

                        category:
                            category,

                        file_url:
                            fileUrl,

                        resource_type:
                            resourceType

                    })
                }
            );


        const data =
            await parseResponse(response);


        if (
            data.error ===
                "Admin access required" ||
            data.error ===
                "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;
        }


        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to create resource."
            );
        }


        showResourceFormMessage(
            "Resource added successfully.",
            "success"
        );


        await loadResources();


        setTimeout(
            () => {
                hideResourceForm();
            },
            700
        );


    } catch (error) {

        console.error(
            "Create resource error:",
            error
        );

        showResourceFormMessage(
            error.message ||
            "Unable to create resource.",
            "error"
        );
    }
}

/* ==================================================
   EDIT RESOURCE
================================================== */

async function editResource(resourceId) {

    if (!resourceId) return;

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        handleSessionExpired();
        return;

    }

    try {

        const response =
            await fetch(
                `${API}/resources/${resourceId}`
            );

        const resource =
            await parseResponse(response);

        if (
            !response.ok ||
            resource.error
        ) {

            throw new Error(
                resource.error ||
                resource.detail ||
                "Unable to load resource."
            );

        }

        document.getElementById(
            "resourceId"
        ).value =
            resource.id || "";

        document.getElementById(
            "resourceTitle"
        ).value =
            resource.title || "";

        document.getElementById(
            "resourceDescription"
        ).value =
            resource.description || "";

        document.getElementById(
            "resourceCategory"
        ).value =
            resource.category || "";

        document.getElementById(
            "resourceFileUrl"
        ).value =
            resource.file_url || "";

        document.getElementById(
            "resourceType"
        ).value =
            resource.resource_type || "";

        const formTitle =
            document.getElementById(
                "resourceFormTitle"
            );

        if (formTitle) {

            formTitle.textContent =
                "Edit Resource";

        }

        const container =
            document.getElementById(
                "resourceFormContainer"
            );

        if (container) {

            container.style.display =
                "block";

            container.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }

        clearResourceFormMessage();

    } catch (error) {

        console.error(
            "Edit resource loading error:",
            error
        );

        alert(
            error.message ||
            "Unable to load resource."
        );

    }

}


/* ==================================================
   UPDATE RESOURCE
================================================== */

async function updateResource(resourceId) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {
        handleSessionExpired();
        return;
    }


    const title =
        document
            .getElementById("resourceTitle")
            .value
            .trim();

    const description =
        document
            .getElementById("resourceDescription")
            .value
            .trim();

    const category =
        document
            .getElementById("resourceCategory")
            .value;

    const fileUrl =
        document
            .getElementById("resourceFileUrl")
            .value
            .trim();

    const resourceType =
        document
            .getElementById("resourceType")
            .value;


    if (
        !title ||
        !description ||
        !category ||
        !fileUrl ||
        !resourceType
    ) {

        showResourceFormMessage(
            "Please complete all resource fields.",
            "error"
        );

        return;
    }


    try {

        showResourceFormMessage(
            "Updating resource...",
            "info"
        );


        const response =
            await fetch(
                `${API}/resources/${resourceId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        title:
                            title,

                        description:
                            description,

                        category:
                            category,

                        file_url:
                            fileUrl,

                        resource_type:
                            resourceType

                    })
                }
            );


        const data =
            await parseResponse(response);


        if (
            data.error ===
                "Admin access required" ||
            data.error ===
                "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;
        }


        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to update resource."
            );
        }


        showResourceFormMessage(
            "Resource updated successfully.",
            "success"
        );


        await loadResources();


        setTimeout(
            () => {
                hideResourceForm();
            },
            700
        );


    } catch (error) {

        console.error(
            "Update resource error:",
            error
        );

        showResourceFormMessage(
            error.message ||
            "Unable to update resource.",
            "error"
        );
    }
}


/* ==================================================
   DELETE RESOURCE
================================================== */

async function deleteResource(resourceId) {

    if (!resourceId) return;


    if (
        !confirm(
            "Are you sure you want to permanently delete this resource?"
        )
    ) {
        return;
    }


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {
        handleSessionExpired();
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/resources/${resourceId}?session_token=${encodeURIComponent(sessionToken)}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await parseResponse(response);


        if (
            data.error ===
                "Admin access required" ||
            data.error ===
                "Invalid or expired session"
        ) {

            handleSessionExpired();
            return;
        }


        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                data.detail ||
                "Unable to delete resource."
            );
        }


        const card =
            document.getElementById(
                `resource-${resourceId}`
            );


        if (card) {
            card.remove();
        }


        alert(
            "Resource deleted successfully."
        );


        await loadResources();


    } catch (error) {

        console.error(
            "Delete resource error:",
            error
        );

        alert(
            error.message ||
            "Unable to delete resource."
        );
    }
}

/* ==================================================
   RESOURCE FORM SUBMISSION
================================================== */

function handleResourceFormSubmit(event) {

    event.preventDefault();

    const resourceId =
        document.getElementById(
            "resourceId"
        ).value;

    if (resourceId) {

        updateResource(
            Number(resourceId)
        );

    } else {

        createResource();

    }

}


/* ==================================================
   RESOURCE FILTER
================================================== */

function setupResourceFilter() {

    const filter =
        document.getElementById(
            "resourceFilter"
        );

    if (!filter) return;

    filter.addEventListener(
        "change",
        function () {

            loadResources();

        }
    );

}


/* ==================================================
   RESOURCE INITIALIZATION
================================================== */

function initializeResources() {

    const form =
        document.getElementById(
            "resourceForm"
        );

    if (form) {

        form.addEventListener(
            "submit",
            handleResourceFormSubmit
        );

    }

    setupResourceFilter();

}

// ============================================================
// BLOGS MANAGEMENT
// ============================================================

window.adminBlogsData = [];


// ============================================================
// LOAD ALL ADMIN BLOGS
// ============================================================

async function loadAdminBlogs() {

    const container =
        document.getElementById(
            "adminBlogsContainer"
        );

    if (!container) {
        return;
    }

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {
        handleSessionExpired();
        return;
    }

    container.innerHTML = `
        <tr>
            <td
                colspan="8"
                class="table-loading"
            >
                Loading blogs...
            </td>
        </tr>
    `;

    try {

        const response =
            await fetch(
                `${API}/blogs/admin/all?session_token=${encodeURIComponent(sessionToken)}`
            );

        const data =
            await response.json();

        if (
            data.error ===
            "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }

        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Failed to load blogs"
            );
        }

        const blogs =
            data.blogs || [];

        window.adminBlogsData =
            blogs;

        populateBlogCategories(
            blogs
        );

        updateBlogStatistics(
            blogs
        );

        renderAdminBlogs(
            blogs
        );

    } catch (error) {

        console.error(
            "Blog loading error:",
            error
        );

        container.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-error"
                >
                    Unable to load blogs.
                </td>
            </tr>
        `;
    }
}


// ============================================================
// POPULATE CATEGORY FILTER
// ============================================================

function populateBlogCategories(
    blogs
) {

    const select =
        document.getElementById(
            "blogCategoryFilter"
        );

    if (!select) {
        return;
    }

    const currentValue =
        select.value;

    const categories =
        [
            ...new Set(
                blogs
                    .map(
                        blog =>
                            String(
                                blog.category || ""
                            ).trim()
                    )
                    .filter(Boolean)
            )
        ]
        .sort(
            (a, b) =>
                a.localeCompare(b)
        );


    select.innerHTML = `
        <option value="all">
            All Categories
        </option>
    `;


    categories.forEach(
        category => {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                category;

            option.textContent =
                category;

            select.appendChild(
                option
            );

        }
    );


    if (
        categories.includes(
            currentValue
        )
    ) {

        select.value =
            currentValue;

    }
}


// ============================================================
// BLOG STATISTICS
// ============================================================

function updateBlogStatistics(
    blogs
) {

    let published = 0;
    let pending = 0;
    let drafts = 0;


    blogs.forEach(
        blog => {

            const status =
                String(
                    blog.status || ""
                ).toLowerCase();


            if (
                status ===
                "published"
            ) {

                published++;

            } else if (
                status ===
                "pending"
            ) {

                pending++;

            } else if (
                status ===
                "draft"
            ) {

                drafts++;

            }

        }
    );


    const totalElement =
        document.getElementById(
            "adminTotalBlogs"
        );

    const publishedElement =
        document.getElementById(
            "adminPublishedBlogs"
        );

    const pendingElement =
        document.getElementById(
            "adminPendingBlogs"
        );

    const draftElement =
        document.getElementById(
            "adminDraftBlogs"
        );


    if (totalElement) {
        totalElement.textContent =
            blogs.length;
    }

    if (publishedElement) {
        publishedElement.textContent =
            published;
    }

    if (pendingElement) {
        pendingElement.textContent =
            pending;
    }

    if (draftElement) {
        draftElement.textContent =
            drafts;
    }
}


// ============================================================
// RENDER BLOGS
// ============================================================

function renderAdminBlogs(
    blogs
) {

    const container =
        document.getElementById(
            "adminBlogsContainer"
        );

    if (!container) {
        return;
    }


    const searchInput =
        document.getElementById(
            "blogSearch"
        );

    const categoryFilter =
        document.getElementById(
            "blogCategoryFilter"
        );

    const statusFilter =
        document.getElementById(
            "blogStatusFilter"
        );


    const searchTerm =
        searchInput
            ? searchInput.value
                .trim()
                .toLowerCase()
            : "";


    const category =
        categoryFilter
            ? categoryFilter.value
            : "all";


    const status =
        statusFilter
            ? statusFilter.value
            : "all";


    const filtered =
        blogs.filter(
            blog => {

                const title =
                    String(
                        blog.title || ""
                    ).toLowerCase();


                const content =
                    String(
                        blog.content || ""
                    ).toLowerCase();


                const author =
                    String(
                        blog.author || ""
                    ).toLowerCase();


                const blogCategory =
                    String(
                        blog.category || ""
                    );


                const blogStatus =
                    String(
                        blog.status || ""
                    ).toLowerCase();


                const matchesSearch =
                    !searchTerm ||
                    title.includes(
                        searchTerm
                    ) ||
                    content.includes(
                        searchTerm
                    ) ||
                    author.includes(
                        searchTerm
                    );


                const matchesCategory =
                    category === "all" ||
                    blogCategory ===
                        category;


                const matchesStatus =
                    status === "all" ||
                    blogStatus ===
                        status;


                return (
                    matchesSearch &&
                    matchesCategory &&
                    matchesStatus
                );
            }
        );


    if (!filtered.length) {

        container.innerHTML = `
            <tr>
                <td
                    colspan="8"
                    class="table-empty"
                >

                    <div class="blogs-table-empty">

                        <i class="fa-regular fa-newspaper"></i>

                        <strong>
                            No blogs found
                        </strong>

                        <span>
                            Try changing your search or filters.
                        </span>

                    </div>

                </td>
            </tr>
        `;

        return;
    }


    container.innerHTML = "";


    filtered.forEach(
        blog => {

            container.appendChild(
                createAdminBlogRow(
                    blog
                )
            );

        }
    );
}


// ============================================================
// CREATE BLOG TABLE ROW
// ============================================================

// ============================================================
// CREATE BLOG TABLE ROW
// ============================================================

function createAdminBlogRow(
    blog
) {

    const row =
        document.createElement(
            "tr"
        );


    const status =
        String(
            blog.status || "draft"
        ).toLowerCase();


    const coverImage =
        getAdminBlogImage(
            blog
        );


    // ========================================================
    // ACTION BUTTONS
    // ========================================================

    let actions = `

        <!-- VIEW FULL BLOG -->

        <button
            type="button"
            class="admin-action-btn view"
            onclick="showBlogReview(${blog.id})"
            title="View full blog"
        >
            <i class="fa-solid fa-eye"></i>
        </button>


        <!-- EDIT -->

        <button
            type="button"
            class="admin-action-btn edit"
            onclick="editBlog(${blog.id})"
            title="Edit blog"
        >
            <i class="fa-solid fa-pen"></i>
        </button>


        <!-- DELETE -->

        <button
            type="button"
            class="admin-action-btn delete"
            onclick="deleteBlog(${blog.id})"
            title="Delete blog"
        >
            <i class="fa-solid fa-trash"></i>
        </button>

    `;


    // ========================================================
    // PUBLISH
    // ========================================================

    if (
        status !== "published"
    ) {

        actions =
            `
            <button
                type="button"
                class="admin-action-btn publish"
                onclick="publishBlog(${blog.id})"
                title="Publish blog"
            >
                <i class="fa-solid fa-check"></i>
            </button>
            `
            +
            actions;

    }


    // ========================================================
    // REJECT
    // ========================================================

    if (
        status === "pending"
    ) {

        actions =
            `
            <button
                type="button"
                class="admin-action-btn reject"
                onclick="rejectBlog(${blog.id})"
                title="Reject blog"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>
            `
            +
            actions;

    }


    // ========================================================
    // TABLE ROW
    // ========================================================

    row.innerHTML = `

        <td>

            <div class="admin-blog-info">

                <img
                    src="${escapeHTML(coverImage)}"
                    alt="${escapeHTML(
                        blog.title ||
                        "Blog"
                    )}"
                    class="admin-blog-thumbnail"
                    onerror="
                        this.onerror=null;
                        this.src='../images/mindspeak.jpg';
                    "
                >


                <div class="admin-blog-title">

                    <strong>
                        ${escapeHTML(
                            blog.title ||
                            "Untitled Blog"
                        )}
                    </strong>


                    <span>
                        ID #${blog.id}
                    </span>

                </div>

            </div>

        </td>


        <td>

            <span class="blog-category-badge">

                ${escapeHTML(
                    blog.category ||
                    "General"
                )}

            </span>

        </td>


        <td>

            ${escapeHTML(
                blog.author ||
                "Unknown"
            )}

        </td>


        <td>

            ${formatAdminBlogDate(
                blog.created_at
            )}

        </td>


        <td>
            ${Number(
                blog.views || 0
            )}
        </td>


        <td>
            ${Number(
                blog.likes || 0
            )}
        </td>


        <td>

            <span class="
                blog-status-badge
                ${escapeHTML(status)}
            ">

                ${formatBlogStatus(
                    status
                )}

            </span>

        </td>


        <td>

            <div class="blog-admin-actions">

                ${actions}

            </div>

        </td>

    `;


    return row;
}

// ============================================================
// BLOG IMAGE
// ============================================================

function getAdminBlogImage(
    blog
) {

    if (
        !blog ||
        !blog.cover_image
    ) {

        return "../images/mindspeak.jpg";
    }


    const image =
        String(
            blog.cover_image
        ).trim();


    if (
        image.startsWith(
            "http://"
        ) ||
        image.startsWith(
            "https://"
        )
    ) {

        return image;
    }


    if (
        image.startsWith(
            "../images/"
        )
    ) {

        return image;
    }


    if (
        image.startsWith(
            "images/"
        )
    ) {

        return "../" + image;
    }


    if (
        image.startsWith(
            "/images/"
        )
    ) {

        return ".." + image;
    }


    return "../images/Blogs/" + image;
}


// ============================================================
// SHOW BLOG FORM
// ============================================================

function showBlogForm(
    blog = null
) {

    const modal =
        document.getElementById(
            "blogFormModal"
        );


    const form =
        document.getElementById(
            "blogForm"
        );


    if (!modal || !form) {
        return;
    }


    form.reset();


    clearBlogFormMessage();


    const title =
        document.getElementById(
            "blogFormTitle"
        );


    const blogId =
        document.getElementById(
            "blogId"
        );


    if (blog) {

        title.textContent =
            "Edit Blog";


        blogId.value =
            blog.id;


        document.getElementById(
            "blogTitle"
        ).value =
            blog.title || "";


        document.getElementById(
            "blogCategory"
        ).value =
            blog.category || "";


        document.getElementById(
            "blogCoverImage"
        ).value =
            blog.cover_image || "";


        document.getElementById(
            "blogContent"
        ).value =
            blog.content || "";


        document.getElementById(
            "blogStatus"
        ).value =
            blog.status || "draft";


    } else {

        title.textContent =
            "Add New Blog";


        blogId.value =
            "";


        document.getElementById(
            "blogStatus"
        ).value =
            "draft";
    }


    modal.classList.add(
        "show"
    );

    document.body.classList.add(
        "modal-open"
    );
}


// ============================================================
// HIDE BLOG FORM
// ============================================================

function hideBlogForm() {

    const modal =
        document.getElementById(
            "blogFormModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );

    document.body.classList.remove(
        "modal-open"
    );
}
// ============================================================
// SHOW FULL BLOG REVIEW
// ============================================================

function showBlogReview(
    blogId
) {

    const blogs =
        window.adminBlogsData || [];


    const blog =
        blogs.find(
            item =>
                Number(item.id) ===
                Number(blogId)
        );


    if (!blog) {

        alert(
            "Blog could not be found."
        );

        return;
    }


    const modal =
        document.getElementById(
            "blogReviewModal"
        );


    if (!modal) {
        return;
    }


    // ========================================================
    // TITLE
    // ========================================================

    const title =
        document.getElementById(
            "blogReviewTitle"
        );

    if (title) {

        title.textContent =
            blog.title ||
            "Untitled Blog";

    }


    // ========================================================
    // AUTHOR
    // ========================================================

    const author =
        document.getElementById(
            "blogReviewAuthor"
        );

    if (author) {

        author.textContent =
            blog.author ||
            "Unknown";

    }


    // ========================================================
    // CATEGORY
    // ========================================================

    const category =
        document.getElementById(
            "blogReviewCategory"
        );

    if (category) {

        category.textContent =
            blog.category ||
            "General";

    }


    // ========================================================
    // DATE
    // ========================================================

    const date =
        document.getElementById(
            "blogReviewDate"
        );

    if (date) {

        date.textContent =
            formatAdminBlogDate(
                blog.created_at
            );

    }


    // ========================================================
    // STATUS
    // ========================================================

    const statusElement =
        document.getElementById(
            "blogReviewStatus"
        );


    const status =
        String(
            blog.status ||
            "draft"
        ).toLowerCase();


    if (statusElement) {

        statusElement.textContent =
            formatBlogStatus(
                status
            );

        statusElement.className =
            `blog-review-status ${status}`;

    }


    // ========================================================
    // COVER IMAGE
    // ========================================================

    const coverWrapper =
        document.getElementById(
            "blogReviewCoverWrapper"
        );


    const cover =
        document.getElementById(
            "blogReviewCover"
        );


    const imagePath =
        getAdminBlogImage(
            blog
        );


    if (
        coverWrapper &&
        cover
    ) {

        if (
            blog.cover_image
        ) {

            cover.src =
                imagePath;

            cover.alt =
                blog.title ||
                "Blog cover";

            coverWrapper.style.display =
                "block";

        } else {

            coverWrapper.style.display =
                "none";

            cover.src =
                "";

        }


        cover.onerror =
            function () {

                this.onerror =
                    null;

                this.src =
                    "../images/mindspeak.jpg";

            };

    }


    // ========================================================
    // FULL CONTENT
    // ========================================================

    const content =
        document.getElementById(
            "blogReviewContent"
        );


    if (content) {

        if (
            blog.content &&
            String(
                blog.content
            ).trim()
        ) {

            /*
             * Blog content is intentionally inserted
             * as HTML because your blog editor already
             * stores formatted blog content.
             */

            content.innerHTML =
                blog.content;

        } else {

            content.innerHTML = `

                <div class="blog-review-empty">

                    <i class="fa-regular fa-file-lines"></i>

                    <p>
                        This blog does not contain any content yet.
                    </p>

                </div>

            `;

        }

    }


    // ========================================================
    // APPROVE BUTTON
    // ========================================================

    const approveButton =
        document.getElementById(
            "blogReviewApproveBtn"
        );


    if (approveButton) {

        if (
            status === "published"
        ) {

            approveButton.style.display =
                "none";

        } else {

            approveButton.style.display =
                "inline-flex";

            approveButton.onclick =
                function () {

                    hideBlogReview();

                    publishBlog(
                        blog.id
                    );

                };

        }

    }


    // ========================================================
    // REJECT BUTTON
    // ========================================================

    const rejectButton =
        document.getElementById(
            "blogReviewRejectBtn"
        );


    if (rejectButton) {

        if (
            status === "published"
        ) {

            rejectButton.style.display =
                "none";

        } else {

            rejectButton.style.display =
                "inline-flex";

            rejectButton.onclick =
                function () {

                    hideBlogReview();

                    rejectBlog(
                        blog.id
                    );

                };

        }

    }


    // ========================================================
    // SHOW MODAL
    // ========================================================

    modal.classList.add(
        "show"
    );


    document.body.classList.add(
        "modal-open"
    );

}


// ============================================================
// HIDE FULL BLOG REVIEW
// ============================================================

function hideBlogReview() {

    const modal =
        document.getElementById(
            "blogReviewModal"
        );


    if (!modal) {
        return;
    }


    modal.classList.remove(
        "show"
    );


    document.body.classList.remove(
        "modal-open"
    );

}

// ============================================================
// FORM MESSAGE
// ============================================================

function clearBlogFormMessage() {

    const message =
        document.getElementById(
            "blogFormMessage"
        );


    if (!message) {
        return;
    }


    message.textContent =
        "";


    message.className =
        "form-message";
}


function showBlogFormMessage(
    message,
    type = "error"
) {

    const element =
        document.getElementById(
            "blogFormMessage"
        );


    if (!element) {
        return;
    }


    element.textContent =
        message;


    element.className =
        `form-message ${type}`;
}


// ============================================================
// CREATE BLOG
// ============================================================

async function createAdminBlog() {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        handleSessionExpired();
        return;
    }


    const title =
        document.getElementById(
            "blogTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "blogCategory"
        ).value.trim();


    const coverImage =
        document.getElementById(
            "blogCoverImage"
        ).value.trim();


    const content =
        document.getElementById(
            "blogContent"
        ).value.trim();


    const status =
        document.getElementById(
            "blogStatus"
        ).value;


    if (!title) {

        showBlogFormMessage(
            "Blog title is required."
        );

        return;
    }


    if (!content) {

        showBlogFormMessage(
            "Blog content is required."
        );

        return;
    }


    const button =
        document.querySelector(
            "#blogForm button[type='submit']"
        );


    if (button) {

        button.disabled =
            true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
    }


    try {

        const response =
            await fetch(
                `${API}/blogs/admin/create`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        title:
                            title,

                        content:
                            content,

                        category:
                            category,

                        cover_image:
                            coverImage,

                        status:
                            status

                    })
                }
            );


        const data =
            await response.json();


        if (
            data.error ===
            "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Failed to create blog"
            );
        }


        showBlogFormMessage(
            data.message ||
            "Blog created successfully.",
            "success"
        );


        setTimeout(
            () => {

                hideBlogForm();

                loadAdminBlogs();

            },
            600
        );


    } catch (error) {

        console.error(
            "Create blog error:",
            error
        );


        showBlogFormMessage(
            error.message ||
            "Unable to create blog."
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                '<i class="fa-solid fa-check"></i> Save Blog';
        }
    }
}


// ============================================================
// EDIT BLOG
// ============================================================

function editBlog(
    blogId
) {

    const blogs =
        window.adminBlogsData || [];


    const blog =
        blogs.find(
            item =>
                Number(item.id) ===
                Number(blogId)
        );


    if (!blog) {

        alert(
            "Blog could not be found."
        );

        return;
    }


    showBlogForm(
        blog
    );
}


// ============================================================
// UPDATE BLOG
// ============================================================

async function updateAdminBlog(
    blogId
) {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        handleSessionExpired();
        return;
    }


    const title =
        document.getElementById(
            "blogTitle"
        ).value.trim();


    const category =
        document.getElementById(
            "blogCategory"
        ).value.trim();


    const coverImage =
        document.getElementById(
            "blogCoverImage"
        ).value.trim();


    const content =
        document.getElementById(
            "blogContent"
        ).value.trim();


    const status =
        document.getElementById(
            "blogStatus"
        ).value;


    if (!title) {

        showBlogFormMessage(
            "Blog title is required."
        );

        return;
    }


    if (!content) {

        showBlogFormMessage(
            "Blog content is required."
        );

        return;
    }


    const button =
        document.querySelector(
            "#blogForm button[type='submit']"
        );


    if (button) {

        button.disabled =
            true;

        button.innerHTML =
            '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
    }


    try {

        const response =
            await fetch(
                `${API}/blogs/admin/${blogId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        title:
                            title,

                        content:
                            content,

                        category:
                            category,

                        cover_image:
                            coverImage,

                        status:
                            status

                    })
                }
            );


        const data =
            await response.json();


        if (
            data.error ===
            "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Failed to update blog"
            );
        }


        showBlogFormMessage(
            data.message ||
            "Blog updated successfully.",
            "success"
        );


        setTimeout(
            () => {

                hideBlogForm();

                loadAdminBlogs();

            },
            600
        );


    } catch (error) {

        console.error(
            "Update blog error:",
            error
        );


        showBlogFormMessage(
            error.message ||
            "Unable to update blog."
        );


    } finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                '<i class="fa-solid fa-check"></i> Save Blog';
        }
    }
}


// ============================================================
// PUBLISH BLOG
// ============================================================

async function publishBlog(
    blogId
) {

    const confirmed =
        confirm(
            "Publish this blog?"
        );


    if (!confirmed) {
        return;
    }


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        handleSessionExpired();
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/blogs/${blogId}/approve`,
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


        const data =
            await response.json();


        if (
            data.error ===
            "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to publish blog"
            );
        }


        alert(
            data.message ||
            "Blog published successfully."
        );


        loadAdminBlogs();


    } catch (error) {

        console.error(
            "Publish blog error:",
            error
        );


        alert(
            error.message ||
            "Unable to publish blog."
        );
    }
}


// ============================================================
// REJECT BLOG
// ============================================================

async function rejectBlog(
    blogId
) {

    const reason =
        prompt(
            "Why are you rejecting this blog?"
        );


    if (
        reason === null
    ) {
        return;
    }


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        handleSessionExpired();
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/blogs/${blogId}/reject`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        session_token:
                            sessionToken,

                        reason:
                            reason.trim()

                    })
                }
            );


        const data =
            await response.json();


        if (
            data.error ===
            "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to reject blog"
            );
        }


        alert(
            data.message ||
            "Blog rejected successfully."
        );


        loadAdminBlogs();


    } catch (error) {

        console.error(
            "Reject blog error:",
            error
        );


        alert(
            error.message ||
            "Unable to reject blog."
        );
    }
}


// ============================================================
// DELETE BLOG
// ============================================================

async function deleteBlog(
    blogId
) {

    const blogs =
        window.adminBlogsData || [];


    const blog =
        blogs.find(
            item =>
                Number(item.id) ===
                Number(blogId)
        );


    const title =
        blog
            ? blog.title
            : "this blog";


    const confirmed =
        confirm(
            `Are you sure you want to delete "${title}"?`
        );


    if (!confirmed) {
        return;
    }


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        handleSessionExpired();
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/blogs/admin/${blogId}?session_token=${encodeURIComponent(sessionToken)}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            data.error ===
            "Admin access required"
        ) {

            handleSessionExpired();
            return;
        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to delete blog"
            );
        }


        alert(
            data.message ||
            "Blog deleted successfully."
        );


        loadAdminBlogs();


    } catch (error) {

        console.error(
            "Delete blog error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete blog."
        );
    }
}


// ============================================================
// BLOG SEARCH / FILTERS
// ============================================================

function setupBlogFilters() {

    const search =
        document.getElementById(
            "blogSearch"
        );


    const category =
        document.getElementById(
            "blogCategoryFilter"
        );


    const status =
        document.getElementById(
            "blogStatusFilter"
        );


    const refresh =
        () => {

            renderAdminBlogs(
                window.adminBlogsData || []
            );

        };


    if (search) {

        search.addEventListener(
            "input",
            refresh
        );
    }


    if (category) {

        category.addEventListener(
            "change",
            refresh
        );
    }


    if (status) {

        status.addEventListener(
            "change",
            refresh
        );
    }
}


// ============================================================
// BLOG FORM SUBMIT
// ============================================================

function handleBlogFormSubmit(
    event
) {

    event.preventDefault();


    const blogId =
        document.getElementById(
            "blogId"
        ).value;


    if (blogId) {

        updateAdminBlog(
            blogId
        );

    } else {

        createAdminBlog();

    }
}


// ============================================================
// INITIALIZE BLOG MANAGEMENT
// ============================================================

function initializeBlogManagement() {

    const form =
        document.getElementById(
            "blogForm"
        );


    if (form) {

        form.addEventListener(
            "submit",
            handleBlogFormSubmit
        );

    }


    setupBlogFilters();


    const modal =
        document.getElementById(
            "blogFormModal"
        );


    if (modal) {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    hideBlogForm();

                }

            }
        );

    }


    loadAdminBlogs();
}


// ============================================================
// BLOG FORMAT HELPERS
// ============================================================

function formatBlogStatus(
    status
) {

    const labels = {

        published:
            "Published",

        pending:
            "Pending",

        draft:
            "Draft",

        rejected:
            "Rejected"

    };


    return (
        labels[status] ||
        "Unknown"
    );
}


function formatAdminBlogDate(
    dateString
) {

    if (!dateString) {
        return "—";
    }


    const date =
        new Date(
            dateString
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(
            dateString
        );
    }


    return date.toLocaleDateString(
        "en-US",
        {
            year:
                "numeric",

            month:
                "short",

            day:
                "numeric"
        }
    );
}

/* ============================================================
   BLOG REVIEW MODAL - CLOSE HANDLERS
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    const reviewModal =
        document.getElementById("blogReviewModal");

    if (reviewModal) {

        reviewModal.addEventListener("click", function (event) {

            if (event.target === reviewModal) {
                hideBlogReview();
            }

        });

    }

});


/* ============================================================
   ESCAPE KEY - CLOSE MODALS
============================================================ */

document.addEventListener("keydown", function (event) {

    if (event.key === "Escape") {

        if (typeof hideBlogReview === "function") {
            hideBlogReview();
        }

        if (typeof hideBlogForm === "function") {
            hideBlogForm();
        }

        if (typeof hideEventForm === "function") {
            hideEventForm();
        }

        if (typeof hideEventRegistrations === "function") {
            hideEventRegistrations();
        }

    }

});