document.addEventListener("DOMContentLoaded", () => {
    loadMentorProfile();
});


async function loadMentorProfile() {

    const loading =
        document.getElementById("mentorProfileLoading");

    const profileCard =
        document.getElementById("mentorProfileCard");

    const errorState =
        document.getElementById("mentorProfileError");


    const params =
        new URLSearchParams(window.location.search);

    const mentorId =
        params.get("id");


    // Make sure a mentor ID was provided
    if (!mentorId) {

        showProfileError(
            "Mentor profile could not be found."
        );

        return;
    }


    const sessionToken =
        localStorage.getItem("session_token");


    if (!sessionToken) {

        showProfileError(
            "Please login first to view mentor profiles."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `http://127.0.0.1:8000/mentor/profile/${mentorId}?session_token=${encodeURIComponent(sessionToken)}`
            );


        const data =
            await response.json();


        if (!response.ok || data.error) {

            showProfileError(
                data.error ||
                "Unable to load mentor profile."
            );

            return;
        }


        if (!data.mentor) {

            showProfileError(
                "Mentor profile could not be found."
            );

            return;
        }


        displayMentorProfile(
            data.mentor
        );


        if (loading) {
            loading.style.display = "none";
        }


        if (profileCard) {
            profileCard.style.display = "block";
        }


    } catch (error) {

        console.error(
            "Mentor profile error:",
            error
        );


        showProfileError(
            "Unable to connect to the server. Please try again."
        );

    }

}


/* =========================================================
   DISPLAY MENTOR PROFILE
========================================================= */

function displayMentorProfile(mentor) {

    /* =====================================================
       NAME
    ===================================================== */

    const nameElement =
        document.getElementById("mentorName");


    if (nameElement) {

        nameElement.textContent =
            mentor.nickname ||
            "MindSpeak Mentor";

    }


    /* =====================================================
       AVATAR
    ===================================================== */

    const avatarElement =
        document.getElementById("mentorAvatar");


    if (avatarElement) {

        const avatarValue =
            mentor.avatar
                ? String(mentor.avatar).trim()
                : "";


        /*
         * Remove any previously created emoji avatar.
         * This prevents duplicates if the profile is loaded
         * again without refreshing the page.
         */

        const wrapper =
            avatarElement.parentElement;


        if (wrapper) {

            const existingEmoji =
                wrapper.querySelector(
                    ".mentor-profile-avatar-emoji"
                );


            if (existingEmoji) {

                existingEmoji.remove();

            }

        }


        /* =================================================
           NO AVATAR
        ================================================= */

        if (!avatarValue) {

            avatarElement.removeAttribute("src");

            avatarElement.alt = "";

            avatarElement.style.display = "none";

        }


        /* =================================================
           REAL IMAGE AVATAR
        ================================================= */

        else if (
            avatarValue.startsWith("http://") ||
            avatarValue.startsWith("https://") ||
            avatarValue.startsWith("/") ||
            avatarValue.startsWith("data:")
        ) {

            avatarElement.src =
                avatarValue;

            avatarElement.alt =
                `${mentor.nickname || "Mentor"} avatar`;

            avatarElement.style.display =
                "block";


            /*
             * If the image fails to load, hide it instead
             * of showing a broken-image icon.
             */

            avatarElement.onerror =
                function () {

                    console.error(
                        "Unable to load mentor avatar:",
                        avatarValue
                    );

                    avatarElement.removeAttribute(
                        "src"
                    );

                    avatarElement.style.display =
                        "none";

                };

        }


        /* =================================================
           EMOJI AVATAR
           Example: 🌱 ⭐ 💙 🌻 🦋
        ================================================= */

        else {

            avatarElement.removeAttribute(
                "src"
            );

            avatarElement.alt = "";

            avatarElement.style.display =
                "none";


            if (wrapper) {

                const emojiAvatar =
                    document.createElement("div");


                emojiAvatar.className =
                    "mentor-profile-avatar-emoji";


                emojiAvatar.textContent =
                    avatarValue;


                wrapper.insertBefore(
                    emojiAvatar,
                    avatarElement
                );

            }

        }

    }


    /* =====================================================
       ONLINE STATUS
    ===================================================== */

    const statusElement =
        document.getElementById("mentorStatus");


    const statusDot =
        document.getElementById("mentorStatusDot");


    const isOnline =
        mentor.is_mentor_online === 1 ||
        mentor.is_mentor_online === true;


    if (statusElement) {

        /*
         * Keep the existing icon and only update
         * the text inside the status element.
         */

        const statusText =
            statusElement.querySelector("span");


        if (statusText) {

            statusText.textContent =
                isOnline
                    ? "Available"
                    : "Offline";

        } else {

            statusElement.textContent =
                isOnline
                    ? "Available"
                    : "Offline";

        }

    }


    if (statusDot) {

        statusDot.classList.remove(
            "online",
            "offline"
        );


        statusDot.classList.add(
            isOnline
                ? "online"
                : "offline"
        );

    }


    /* =====================================================
       BIO
    ===================================================== */

    const bioElement =
        document.getElementById("mentorBio");


    if (bioElement) {

        if (mentor.bio) {

            bioElement.textContent =
                mentor.bio;

        } else {

            bioElement.textContent =
                "This mentor has not added a bio yet.";

        }

    }


    /* =====================================================
       TOPICS
    ===================================================== */

    renderTags(
        mentor.topics,
        "mentorTopics",
        "mentorTopicsSection"
    );


    /* =====================================================
       LANGUAGES
    ===================================================== */

    renderTags(
        mentor.languages,
        "mentorLanguages",
        "mentorLanguagesSection"
    );


    /* =====================================================
       AVAILABILITY
    ===================================================== */

    renderDetail(
        mentor.availability,
        "mentorAvailability",
        "mentorAvailabilitySection"
    );


    /* =====================================================
       AVERAGE RESPONSE TIME
    ===================================================== */

    renderDetail(
        mentor.average_response_time,
        "mentorResponseTime",
        "mentorResponseSection"
    );


    /* =====================================================
       REQUEST SUPPORT BUTTON
    ===================================================== */

    const requestButton =
        document.getElementById(
            "requestSupportBtn"
        );


    if (requestButton) {

        requestButton.dataset.mentorId =
            mentor.id;


        /*
         * Prevent multiple click listeners if the profile
         * is loaded more than once.
         */

        requestButton.onclick =
            function () {

                requestMentorSupport(
                    mentor.id
                );

            };

    }

}


/* =========================================================
   RENDER TOPIC / LANGUAGE TAGS
========================================================= */

/*
 * Supports:
 *
 * Array:
 * ["Anxiety", "Stress"]
 *
 * JSON string:
 * '["Anxiety", "Stress"]'
 *
 * Comma-separated:
 * "Anxiety, Stress"
 */

function renderTags(
    value,
    containerId,
    sectionId
) {

    const container =
        document.getElementById(
            containerId
        );


    const section =
        document.getElementById(
            sectionId
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    const items =
        parseList(value);


    if (items.length === 0) {

        if (section) {

            section.style.display =
                "none";

        }

        return;
    }


    if (section) {

        section.style.display =
            "block";

    }


    items.forEach(
        item => {

            const tag =
                document.createElement(
                    "span"
                );


            tag.className =
                "mentor-tag";


            tag.textContent =
                item;


            container.appendChild(
                tag
            );

        }
    );

}


/* =========================================================
   RENDER AVAILABILITY / RESPONSE TIME
========================================================= */

function renderDetail(
    value,
    elementId,
    sectionId
) {

    const element =
        document.getElementById(
            elementId
        );


    const section =
        document.getElementById(
            sectionId
        );


    if (!element) {
        return;
    }


    if (
        value === null ||
        value === undefined ||
        String(value).trim() === ""
    ) {

        if (section) {

            section.style.display =
                "none";

        }

        return;
    }


    if (section) {

        section.style.display =
            "flex";

    }


    element.textContent =
        value;

}


/* =========================================================
   CONVERT DATABASE VALUES INTO ARRAYS
========================================================= */

function parseList(value) {

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


    /* String values */

    if (typeof value === "string") {

        const trimmed =
            value.trim();


        if (!trimmed) {
            return [];
        }


        /* Try JSON first */

        try {

            const parsed =
                JSON.parse(trimmed);


            if (Array.isArray(parsed)) {

                return parsed
                    .map(
                        item =>
                            String(item).trim()
                    )
                    .filter(Boolean);

            }

        } catch (error) {

            // Not JSON.
            // Continue with comma-separated values.

        }


        /* Comma-separated values */

        return trimmed
            .split(",")
            .map(
                item =>
                    item.trim()
            )
            .filter(Boolean);

    }


    return [
        String(value).trim()
    ].filter(Boolean);

}


/* =========================================================
   REQUEST MENTOR SUPPORT
========================================================= */

function requestMentorSupport(
    mentorId
) {

    if (!mentorId) {
        return;
    }


    window.location.href =
        `mentor-request.html?mentor_id=${encodeURIComponent(mentorId)}`;

}


/* =========================================================
   DISPLAY PROFILE ERROR
========================================================= */

function showProfileError(
    message
) {

    const loading =
        document.getElementById(
            "mentorProfileLoading"
        );


    const profileCard =
        document.getElementById(
            "mentorProfileCard"
        );


    const errorState =
        document.getElementById(
            "mentorProfileError"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (profileCard) {

        profileCard.style.display =
            "none";

    }


    if (errorState) {

        errorState.style.display =
            "block";


        const messageElement =
            errorState.querySelector(
                ".profile-error-message"
            );


        if (messageElement) {

            messageElement.textContent =
                message;

        }

    }

}