
const API = "http://127.0.0.1:8000";

const sessionToken = localStorage.getItem("session_token");


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadMentors();

    const retryBtn =
        document.getElementById("mentorRetryBtn");

    if (retryBtn) {

        retryBtn.addEventListener(
            "click",
            function () {

                loadMentors();

            }
        );

    }

});


/* =========================================================
   LOAD MENTORS
========================================================= */

async function loadMentors() {

    const loading =
        document.getElementById("mentorLoading");

    const grid =
        document.getElementById("mentorGrid");

    const empty =
        document.getElementById("mentorEmpty");

    const error =
        document.getElementById("mentorError");

    const mentorCount =
        document.getElementById("mentorCount");

    const onlineMentorCount =
        document.getElementById("onlineMentorCount");


    /* =====================================================
       RESET STATES
    ===================================================== */

    if (loading) {
        loading.style.display = "flex";
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (error) {
        error.style.display = "none";
    }


    /* =====================================================
       CHECK LOGIN
    ===================================================== */

    if (!sessionToken) {

        console.log(
            "No session token found."
        );

        if (loading) {
            loading.style.display = "none";
        }

        if (error) {
            error.style.display = "block";
        }

        return;

    }


    try {

        /* =================================================
           CALL MENTOR API
        ================================================= */

        const response =
            await fetch(
                API +
                "/mentor/mentors?session_token=" +
                encodeURIComponent(sessionToken)
            );


        const data =
            await response.json();


        console.log(
            "Mentor API response:",
            data
        );


        /* =================================================
           CHECK API RESPONSE
        ================================================= */

        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                "Unable to load mentors."
            );

        }


        const mentors =
            data.mentors || [];


        /* =================================================
           HIDE LOADING
        ================================================= */

        if (loading) {
            loading.style.display = "none";
        }


        /* =================================================
           UPDATE COUNTS
        ================================================= */

        if (mentorCount) {

            mentorCount.textContent =
                mentors.length;

        }


        const onlineMentors =
            mentors.filter(
                function (mentor) {

                    return (
                        mentor.is_mentor_online === 1 ||
                        mentor.is_mentor_online === true
                    );

                }
            );


        if (onlineMentorCount) {

            onlineMentorCount.textContent =
                onlineMentors.length;

        }


        /* =================================================
           NO MENTORS
        ================================================= */

        if (mentors.length === 0) {

            if (empty) {
                empty.style.display = "block";
            }

            return;

        }


        /* =================================================
           CLEAR LOADING CARD
        ================================================= */

        if (grid) {

            grid.innerHTML = "";

        }


        /* =================================================
           CREATE MENTOR CARDS
        ================================================= */

        mentors.forEach(
            function (mentor) {

                createMentorCard(
                    mentor,
                    grid
                );

            }
        );


    } catch (err) {

        console.error(
            "Mentor loading error:",
            err
        );


        if (loading) {
            loading.style.display = "none";
        }

        if (empty) {
            empty.style.display = "none";
        }

        if (error) {
            error.style.display = "block";
        }

    }

}


/* =========================================================
   CREATE MENTOR CARD
========================================================= */

function createMentorCard(
    mentor,
    container
) {

    if (!container) {
        return;
    }


    const card =
        document.createElement("div");


    card.className =
        "mentor-card";


    /* =====================================================
       ONLINE STATUS
    ===================================================== */

    const isOnline =
        mentor.is_mentor_online === 1 ||
        mentor.is_mentor_online === true;


    const statusText =
        isOnline
            ? "Available now"
            : "Offline";


    const statusClass =
        isOnline
            ? "online"
            : "offline";

/* =====================================================
   AVATAR
===================================================== */

let avatarHTML = "";

if (mentor.avatar) {

    const avatarValue =
        String(mentor.avatar).trim();

    /*
     * Uploaded image avatar
     */
    const isImageAvatar =
        avatarValue.startsWith("http://") ||
        avatarValue.startsWith("https://") ||
        avatarValue.startsWith("/") ||
        avatarValue.startsWith("frontend/") ||
        avatarValue.startsWith("uploads/");

    if (isImageAvatar) {

        let avatarUrl = avatarValue;

        /*
         * Backend returns paths such as:
         * /frontend/uploads/avatars/user_12_xxx.jpg
         *
         * These files are served by FastAPI.
         */
        if (
            avatarUrl.startsWith("/") &&
            !avatarUrl.startsWith("//")
        ) {

            avatarUrl =
                `${API}${avatarUrl}`;

        }

        else if (
            avatarUrl.startsWith("frontend/")
        ) {

            avatarUrl =
                `${API}/${avatarUrl}`;

        }

        else if (
            avatarUrl.startsWith("uploads/")
        ) {

            avatarUrl =
                `${API}/${avatarUrl}`;

        }

        avatarHTML = `
            <img
                src="${escapeHTML(avatarUrl)}"
                alt="${escapeHTML(
                    mentor.nickname || "Mentor"
                )}"
                class="mentor-avatar"
            >
        `;

    }

    /*
     * Emoji avatar
     * Example: 🌱
     */
    else {

        avatarHTML = `
            <div
                class="mentor-avatar-emoji"
                aria-label="${escapeHTML(
                    mentor.nickname || "Mentor"
                )} avatar"
            >
                ${escapeHTML(avatarValue)}
            </div>
        `;

    }

}

else {

    /*
     * No avatar
     */
    avatarHTML = `
        <div class="mentor-avatar-placeholder">
            <i class="fa-solid fa-user"></i>
        </div>
    `;

}

    /* =====================================================
       TOPICS
    ===================================================== */

    const topics =
        formatList(
            mentor.topics
        );


    const languages =
        formatList(
            mentor.languages
        );


    /* =====================================================
       RESPONSE TIME
    ===================================================== */

    let responseTime = "";


    if (
        mentor.average_response_time !== null &&
        mentor.average_response_time !== undefined &&
        mentor.average_response_time !== ""
    ) {

        responseTime = `

            <div class="mentor-meta">

                <i class="fa-regular fa-clock"></i>

                <span>
                    ~${escapeHTML(
                        String(
                            mentor.average_response_time
                        )
                    )} min average response
                </span>

            </div>

        `;

    }


    /* =====================================================
       TOPIC HTML
    ===================================================== */

    let topicsHTML = "";


    if (topics.length > 0) {

        topicsHTML = `

            <div class="mentor-topics">

                <span class="mentor-label">
                    Comfortable talking about
                </span>

                <div class="mentor-topic-list">

                    ${topics
                        .slice(0, 5)
                        .map(
                            topic => `
                                <span class="mentor-topic">
                                    ${escapeHTML(topic)}
                                </span>
                            `
                        )
                        .join("")
                    }

                </div>

            </div>

        `;

    }


    /* =====================================================
       LANGUAGES
    ===================================================== */

    let languagesHTML = "";


    if (languages.length > 0) {

        languagesHTML = `

            <div class="mentor-meta">

                <i class="fa-solid fa-language"></i>

                <span>
                    ${languages
                        .map(
                            language =>
                                escapeHTML(language)
                        )
                        .join(" • ")
                    }
                </span>

            </div>

        `;

    }


    /* =====================================================
       CARD
    ===================================================== */

    card.innerHTML = `

        <div class="mentor-card-header">

            <div class="mentor-avatar-wrapper">

                ${avatarHTML}

                <span
                    class="mentor-status-dot ${statusClass}"
                    title="${statusText}"
                ></span>

            </div>


            <div class="mentor-status ${statusClass}">

                <i class="fa-solid fa-circle"></i>

                ${statusText}

            </div>

        </div>


        <div class="mentor-card-body">

            <h3 class="mentor-name">

                ${escapeHTML(
                    mentor.nickname ||
                    "MindSpeak Mentor"
                )}

            </h3>


            <p class="mentor-role">

                Peer Support Mentor

            </p>


            ${
                mentor.bio
                    ? `
                        <p class="mentor-bio">
                            ${escapeHTML(
                                mentor.bio
                            )}
                        </p>
                    `
                    : ""
            }


            ${topicsHTML}


            ${languagesHTML}


            ${responseTime}


            <button
                type="button"
                class="mentor-talk-btn"
                data-mentor-id="${mentor.id}"
            >

                <i class="fa-regular fa-comments"></i>

                Talk to Mentor

            </button>

        </div>

    `;


    container.appendChild(card);

}


/* =========================================================
   FORMAT LIST DATA
========================================================= */

function formatList(value) {

    if (!value) {
        return [];
    }


    /* Already an array */

    if (Array.isArray(value)) {

        return value
            .map(
                item =>
                    String(item).trim()
            )
            .filter(Boolean);

    }


    /* JSON array stored as text */

    if (
        typeof value === "string" &&
        value.trim().startsWith("[")
    ) {

        try {

            const parsed =
                JSON.parse(value);


            if (Array.isArray(parsed)) {

                return parsed
                    .map(
                        item =>
                            String(item).trim()
                    )
                    .filter(Boolean);

            }

        } catch (error) {

            console.warn(
                "Unable to parse list:",
                value
            );

        }

    }


    /* Comma-separated text */

    if (typeof value === "string") {

        return value
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }


    return [];

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(value) {

    return String(value)
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
   TALK TO MENTOR
========================================================= */

document.addEventListener("click", function (event) {

    const button = event.target.closest(".mentor-talk-btn");

    if (!button) {
        return;
    }

    const mentorId = button.dataset.mentorId;

    if (!mentorId) {
        console.error("Mentor ID not found.");
        return;
    }

    window.location.href =
        `mentor-profile.html?id=${encodeURIComponent(mentorId)}`;

});