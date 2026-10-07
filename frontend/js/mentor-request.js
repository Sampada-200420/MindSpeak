
const API = "http://127.0.0.1:8000";

const sessionToken = localStorage.getItem("session_token");

let currentMentor = null;


/* =========================================================
   PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    loadMentor();

    setupCharacterCounter();

    setupBackButton();

    setupSubmitButton();

});


/* =========================================================
   LOAD MENTOR
========================================================= */


async function loadMentor() {

    const params = new URLSearchParams(window.location.search);
    const mentorId = params.get("mentor_id");

    console.log("Mentor ID from URL:", mentorId);

    if (!mentorId) {
        showPageError("Mentor information could not be found.");
        return;
    }

    if (!sessionToken) {
        showPageError("Please login first to request mentor support.");
        return;
    }

    try {

        const url =
            `${API}/mentor/profile/${encodeURIComponent(mentorId)}?session_token=${encodeURIComponent(sessionToken)}`;

        console.log("Requesting mentor profile:", url);

        const response = await fetch(url);

        console.log("Response status:", response.status);

        const data = await response.json();

        console.log("Mentor profile response:", data);

        if (!response.ok || data.error) {
            throw new Error(
                data.error || "Unable to load mentor."
            );
        }

        if (!data.mentor) {
            throw new Error("Mentor information was not found.");
        }

        currentMentor = data.mentor;

        displayMentor(currentMentor);

    } catch (error) {

        console.error(
            "Mentor request loading error:",
            error
        );

        showPageError(
            error.message ||
            "Unable to load mentor information."
        );

    }
}
/* =========================================================
   DISPLAY MENTOR
========================================================= */

function displayMentor(mentor) {

    const nameElement =
        document.getElementById(
            "requestMentorName"
        );


    const avatar =
        document.getElementById(
            "requestMentorAvatar"
        );


    const placeholder =
        document.getElementById(
            "requestMentorAvatarPlaceholder"
        );


    const status =
        document.getElementById(
            "requestMentorStatus"
        );


    const statusDot =
        document.getElementById(
            "requestMentorStatusDot"
        );


    const responseElement =
        document.getElementById(
            "requestMentorResponse"
        );


    /* =====================================================
       NAME
    ===================================================== */

    if (nameElement) {

        nameElement.textContent =
            mentor.nickname ||
            "MindSpeak Mentor";

    }


    /* =====================================================
   AVATAR
===================================================== */

if (avatar && placeholder) {

    const rawAvatar = mentor.avatar;
    console.log("========== MENTOR AVATAR DEBUG ==========");
console.log("Mentor ID:", mentor.id);
console.log("Mentor nickname:", mentor.nickname);
console.log("Raw avatar value:", rawAvatar);
console.log("Avatar type:", typeof rawAvatar);
console.log("==========================================");

    console.log("Mentor avatar value:", rawAvatar);

    if (rawAvatar) {

        let avatarValue = String(rawAvatar).trim();

        /*
         * Uploaded avatar from FastAPI
         * Example:
         * /frontend/uploads/avatars/user_12_xxxxx.jpg
         */
        if (
            avatarValue.startsWith("/") &&
            !avatarValue.startsWith("//")
        ) {

            avatarValue = `${API}${avatarValue}`;

        }

        /*
         * Handle paths returned without the first /
         */
        else if (
            avatarValue.startsWith("frontend/")
        ) {

            avatarValue = `${API}/${avatarValue}`;

        }

        /*
         * Handle a normal full URL
         */
        if (
            avatarValue.startsWith("http://") ||
            avatarValue.startsWith("https://")
        ) {

            avatar.src = avatarValue;

            avatar.alt =
                `${mentor.nickname || "Mentor"} avatar`;

            avatar.style.display = "block";

            placeholder.style.display = "none";

            avatar.onerror = function () {

                console.error(
                    "Mentor avatar failed to load:",
                    avatarValue
                );

                avatar.removeAttribute("src");

                avatar.style.display = "none";

                placeholder.style.display = "flex";

                placeholder.innerHTML =
                    '<i class="fa-solid fa-user"></i>';

            };

        }

        /*
         * If the avatar is an emoji rather than an image
         */
        else {

            avatar.style.display = "none";

            placeholder.style.display = "flex";

            placeholder.textContent = avatarValue;

        }

    }

    else {

        avatar.removeAttribute("src");

        avatar.style.display = "none";

        placeholder.style.display = "flex";

        placeholder.innerHTML =
            '<i class="fa-solid fa-user"></i>';

    }

}

    /* =====================================================
       ONLINE STATUS
    ===================================================== */

    const isOnline =
        mentor.is_mentor_online === 1 ||
        mentor.is_mentor_online === true;


    if (status) {

        status.textContent =
            isOnline
                ? "Available now"
                : "Currently offline";

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
       RESPONSE TIME
    ===================================================== */

    if (responseElement) {

        const responseValue =
            mentor.average_response_time;


        if (
            responseValue !== null &&
            responseValue !== undefined &&
            String(responseValue).trim() !== ""
        ) {

            responseElement.innerHTML = `

                <i class="fa-regular fa-clock"></i>

                <span>
                    Usually responds in about
                    <strong>
                        ${escapeHTML(
                            String(responseValue)
                        )}
                    </strong>
                    minutes
                </span>

            `;

        } else {

            responseElement.innerHTML = `

                <i class="fa-regular fa-clock"></i>

                <span>
                    Response time varies depending
                    on mentor availability.
                </span>

            `;

        }

    }

}


/* =========================================================
   CHARACTER COUNTER
========================================================= */

function setupCharacterCounter() {

    const textarea =
        document.getElementById(
            "supportMessage"
        );


    const counter =
        document.getElementById(
            "characterCount"
        );


    if (
        !textarea ||
        !counter
    ) {

        return;

    }


    function updateCounter() {

        const length =
            textarea.value.length;


        counter.textContent =
            `${length} / 500`;


        if (length >= 450) {

            counter.style.color =
                "#a95757";

        } else {

            counter.style.color =
                "";

        }

    }


    textarea.addEventListener(
        "input",
        updateCounter
    );


    updateCounter();

}


/* =========================================================
   BACK BUTTON
========================================================= */

function setupBackButton() {

    const backButton =
        document.getElementById(
            "backToMentorProfile"
        );


    if (!backButton) {

        return;

    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const mentorId =
        params.get("mentor_id");


    if (mentorId) {

        backButton.href =
            `mentor-profile.html?id=${encodeURIComponent(mentorId)}`;

    } else {

        backButton.href =
            "mentor-support.html";

    }

}


/* =========================================================
   SUBMIT BUTTON
========================================================= */

function setupSubmitButton() {

    const button =
        document.getElementById(
            "sendSupportRequestBtn"
        );


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        function () {

            submitSupportRequest();

        }
    );

}


/* =========================================================
   VALIDATE FORM
========================================================= */

function validateRequestForm() {

    const topic =
        document.getElementById(
            "supportTopic"
        );


    const message =
        document.getElementById(
            "supportMessage"
        );


    const topicGroup =
        topic
            ? topic.closest(".form-group")
            : null;


    const messageGroup =
        message
            ? message.closest(".form-group")
            : null;


    const topicError =
        document.getElementById(
            "topicError"
        );


    const messageError =
        document.getElementById(
            "messageError"
        );


    let valid = true;


    /* =====================================================
       RESET ERRORS
    ===================================================== */

    if (topicGroup) {

        topicGroup.classList.remove(
            "has-error"
        );

    }


    if (messageGroup) {

        messageGroup.classList.remove(
            "has-error"
        );

    }


    if (topicError) {

        topicError.textContent =
            "";

    }


    if (messageError) {

        messageError.textContent =
            "";

    }


    /* =====================================================
       TOPIC
    ===================================================== */

    if (
        !topic ||
        !topic.value
    ) {

        valid = false;


        if (topicGroup) {

            topicGroup.classList.add(
                "has-error"
            );

        }


        if (topicError) {

            topicError.textContent =
                "Please choose a topic.";

        }

    }


    /* =====================================================
       MESSAGE LENGTH
    ===================================================== */

    if (message) {

        if (message.value.length > 500) {

            valid = false;


            if (messageGroup) {

                messageGroup.classList.add(
                    "has-error"
                );

            }


            if (messageError) {

                messageError.textContent =
                    "Your message must be 500 characters or fewer.";

            }

        }

    }


    return valid;

}


/* =========================================================
   SUBMIT SUPPORT REQUEST
========================================================= */

async function submitSupportRequest() {

    const button =
        document.getElementById(
            "sendSupportRequestBtn"
        );


    const topic =
        document.getElementById(
            "supportTopic"
        );


    const message =
        document.getElementById(
            "supportMessage"
        );


    const params =
        new URLSearchParams(
            window.location.search
        );


    const mentorId =
        params.get("mentor_id");


    /* =====================================================
       BASIC CHECKS
    ===================================================== */

    if (!sessionToken) {

        showFormError(
            "Your session has expired. Please login again."
        );

        return;

    }


    if (!mentorId) {

        showFormError(
            "Mentor information is missing."
        );

        return;

    }


    if (!validateRequestForm()) {

        return;

    }


  /* =====================================================
   SEND REQUEST TO BACKEND
========================================================= */

button.disabled = true;
button.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin"></i>
    Sending...
`;

try {

    const response = await fetch(
        `${API}/mentor/request`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                session_token: sessionToken,
                mentor_id: Number(mentorId),
                topic: topic.value.trim(),
                message: message
                    ? message.value.trim()
                    : ""
            })
        }
    );


    const data = await response.json();


    if (!response.ok || data.error) {

        throw new Error(
            data.error ||
            "Unable to send support request."
        );

    }


    /* =================================================
       SUCCESS
    ================================================= */

    const formCard =
        document.querySelector(
            ".request-form-card"
        );

    const success =
        document.getElementById(
            "requestSuccess"
        );


    if (formCard) {

        formCard.style.display =
            "none";

    }


    if (success) {

        success.style.display =
            "block";

        success.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


} catch (error) {

    console.error(
        "Send mentor request error:",
        error
    );

    showFormError(
        error.message ||
        "Unable to send support request. Please try again."
    );


} finally {

    button.disabled = false;

    button.innerHTML = `
        <i class="fa-regular fa-paper-plane"></i>
        Send Support Request
    `;

}

}


/* =========================================================
   PAGE ERROR
========================================================= */

function showPageError(message) {

    const layout =
        document.querySelector(
            ".request-layout"
        );


    const introduction =
        document.querySelector(
            ".request-introduction"
        );


    if (layout) {

        layout.style.display =
            "none";

    }


    if (introduction) {

        introduction.style.display =
            "none";

    }


    const errorBox =
        document.createElement("div");


    errorBox.className =
        "request-form-error";


    errorBox.style.display =
        "flex";

    errorBox.style.maxWidth =
        "700px";

    errorBox.style.margin =
        "40px auto";


    errorBox.innerHTML = `

        <i class="fa-solid fa-circle-exclamation"></i>

        <span>
            ${escapeHTML(message)}
        </span>

    `;


    const container =
        document.querySelector(
            ".mentor-request-container"
        );


    if (container) {

        container.appendChild(
            errorBox
        );

    }

}


/* =========================================================
   FORM ERROR
========================================================= */

function showFormError(message) {

    const errorBox =
        document.getElementById(
            "requestFormError"
        );


    const errorText =
        document.getElementById(
            "requestFormErrorText"
        );


    if (!errorBox) {

        return;

    }


    if (errorText) {

        errorText.textContent =
            message;

    }


    errorBox.style.display =
        "flex";


    errorBox.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

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