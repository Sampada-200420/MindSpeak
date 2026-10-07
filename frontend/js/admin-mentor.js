const API = "http://127.0.0.1:8000";

let applicationsContainer;
let loadingState;
let errorState;
let emptyState;
let refreshButton;
let retryButton;

/* ======================================================
SESSION
====================================================== */

function getSessionToken() {
return localStorage.getItem("session_token");
}

/* ======================================================
LOAD APPLICATIONS
====================================================== */

async function loadApplications() {

const sessionToken = getSessionToken();

if (!sessionToken) {
    window.location.href = "../login.html";
    return;
}

showState("loading");

try {

    const response = await fetch(
        `${API}/admin/mentor-applications?session_token=${encodeURIComponent(sessionToken)}`
    );

    const data = await response.json();

    console.log("Mentor applications response:", data);

    if (
        data.error === "Admin access required" ||
        data.error === "Invalid or expired session"
    ) {
        window.location.href = "../login.html";
        return;
    }

    if (!response.ok || data.error) {
        throw new Error(
            data.error || "Unable to load mentor applications."
        );
    }

    const applications = Array.isArray(data.applications)
        ? data.applications
        : [];

    if (applications.length === 0) {
        showState("empty");
        return;
    }

    renderApplications(applications);

} catch (error) {

    console.error(
        "Load mentor applications error:",
        error
    );

    const errorMessage =
        error.message ||
        "Unable to load mentor applications.";

    if (errorState) {
        const errorText =
            document.getElementById("errorMessage");

        if (errorText) {
            errorText.textContent = errorMessage;
        }
    }

    showState("error");
}

}

/* ======================================================
RENDER APPLICATIONS
====================================================== */

function renderApplications(applications) {

if (!applicationsContainer) {
    console.error(
        "applicationsContainer was not found."
    );
    return;
}

applicationsContainer.innerHTML = "";

applications.forEach(application => {

    const card =
        createApplicationCard(application);

    applicationsContainer.appendChild(card);

});

showState("applications");

}

/* ======================================================
CREATE APPLICATION CARD
====================================================== */

function createApplicationCard(application) {

const card =
    document.createElement("article");

card.className =
    "application-card";


const avatar =
    application.avatar
        ? application.avatar
        : "";


const status =
    application.status || "pending";


const statusClass =
    getStatusClass(status);


const avatarHTML =
    avatar
        ? `
            <img
                src="${escapeHTML(avatar)}"
                alt="Applicant avatar"
                class="applicant-avatar"
            >
        `
        : `
            <div class="applicant-avatar">
                <i class="fa-solid fa-user"></i>
            </div>
        `;


card.innerHTML = `

    <div class="application-header">

        <div class="applicant-info">

            ${avatarHTML}

            <div>

                <h3 class="applicant-name">
                    ${escapeHTML(
                        application.nickname ||
                        "Unknown User"
                    )}
                </h3>

                <p class="application-id">
                    Application #${application.id}
                </p>

            </div>

        </div>


        <span
            class="application-status ${statusClass}"
        >

            <i class="${getStatusIcon(status)}"></i>

            ${escapeHTML(status)}

        </span>

    </div>


    <div class="application-content">

        <div class="application-field full-width">

            <div class="application-field-label">
                Why do you want to become a mentor?
            </div>

            <div class="application-field-value">

                ${formatValue(
                    application.reason
                )}

            </div>

        </div>


        <div class="application-field">

            <div class="application-field-label">
                Topics
            </div>

            <div class="application-field-value">

                ${formatValue(
                    application.topics
                )}

            </div>

        </div>


        <div class="application-field">

            <div class="application-field-label">
                Languages
            </div>

            <div class="application-field-value">

                ${formatValue(
                    application.languages
                )}

            </div>

        </div>


        <div class="application-field">

            <div class="application-field-label">
                Availability
            </div>

            <div class="application-field-value">

                ${formatValue(
                    application.availability
                )}

            </div>

        </div>


        <div class="application-field">

            <div class="application-field-label">
                Experience
            </div>

            <div class="application-field-value">

                ${formatValue(
                    application.experience
                )}

            </div>

        </div>


        <div class="application-field">

            <div class="application-field-label">
                Guidelines
            </div>

            <div class="application-field-value">

                ${
                    application.guidelines_agreed
                        ? "Applicant agreed to the mentor guidelines."
                        : "Guidelines not confirmed."
                }

            </div>

        </div>


        <div class="application-field">

            <div class="application-field-label">
                Submitted
            </div>

            <div class="application-field-value">

                ${formatDate(
                    application.created_at
                )}

            </div>

        </div>


        ${
            application.reviewed_at
                ? `
                    <div class="application-field">

                        <div class="application-field-label">
                            Reviewed
                        </div>

                        <div class="application-field-value">

                            ${formatDate(
                                application.reviewed_at
                            )}

                        </div>

                    </div>
                `
                : ""
        }


        ${
            application.admin_note
                ? `
                    <div class="application-field full-width">

                        <div class="application-field-label">
                            Admin Note
                        </div>

                        <div class="application-field-value">

                            ${formatValue(
                                application.admin_note
                            )}

                        </div>

                    </div>
                `
                : ""
        }

    </div>


    ${
        status === "pending"
            ? createActionArea(application.id)
            : ""
    }

`;


attachActionListeners(
    card,
    application.id
);


const image =
    card.querySelector(".applicant-avatar");


if (
    image &&
    image.tagName === "IMG"
) {

    image.addEventListener(
        "error",
        function () {

            const fallback =
                document.createElement("div");

            fallback.className =
                "applicant-avatar";

            fallback.innerHTML =
                `<i class="fa-solid fa-user"></i>`;

            image.replaceWith(fallback);

        },
        { once: true }
    );

}


return card;

}

/* ======================================================
ACTION AREA
====================================================== */

function createActionArea(applicationId) {

return `

    <div class="application-actions">

        <div class="admin-note-wrapper">

            <label
                class="admin-note-label"
                for="admin-note-${applicationId}"
            >
                Admin note
            </label>

            <textarea
                id="admin-note-${applicationId}"
                class="admin-note-input"
                placeholder="Optional note for the applicant..."
                maxlength="1000"
            ></textarea>

        </div>


        <div class="action-buttons">

            <button
                type="button"
                class="approve-btn"
                data-action="approve"
                data-id="${applicationId}"
            >

                <i class="fa-solid fa-check"></i>
                Approve

            </button>


            <button
                type="button"
                class="reject-btn"
                data-action="reject"
                data-id="${applicationId}"
            >

                <i class="fa-solid fa-xmark"></i>
                Reject

            </button>

        </div>

    </div>

`;

}

/* ======================================================
ACTION LISTENERS
====================================================== */

function attachActionListeners(
card,
applicationId
) {

const buttons =
    card.querySelectorAll(
        "[data-action]"
    );


buttons.forEach(button => {

    button.addEventListener(
        "click",
        function () {

            reviewApplication(
                applicationId,
                this.dataset.action,
                card
            );

        }
    );

});

}

/* ======================================================
REVIEW APPLICATION
====================================================== */

async function reviewApplication(
applicationId,
action,
card
) {

const sessionToken =
    getSessionToken();


if (!sessionToken) {

    window.location.href =
        "../login.html";

    return;

}


const noteInput =
    card.querySelector(
        ".admin-note-input"
    );


const adminNote =
    noteInput
        ? noteInput.value.trim()
        : "";


const confirmed =
    confirm(
        action === "approve"
            ? "Are you sure you want to approve this mentor application?"
            : "Are you sure you want to reject this mentor application?"
    );


if (!confirmed) {
    return;
}


const buttons =
    card.querySelectorAll("button");


buttons.forEach(button => {
    button.disabled = true;
});


try {

    const response =
        await fetch(
            `${API}/admin/mentor-applications/${applicationId}/review`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    session_token:
                        sessionToken,

                    action:
                        action,

                    admin_note:
                        adminNote || null
                })
            }
        );


    const data =
        await response.json();


    if (
        data.error === "Admin access required" ||
        data.error === "Invalid or expired session"
    ) {

        window.location.href =
            "../login.html";

        return;

    }


    if (!response.ok || data.error) {

        throw new Error(
            data.error ||
            "Unable to process application."
        );

    }


    await loadApplications();

} catch (error) {

    console.error(
        "Review mentor application error:",
        error
    );

    alert(
        error.message ||
        "Unable to review the application."
    );


    buttons.forEach(button => {
        button.disabled = false;
    });

}

}

/* ======================================================
PAGE STATES
====================================================== */

function showState(state) {

if (loadingState) {
    loadingState.style.display = "none";
}

if (errorState) {
    errorState.style.display = "none";
}

if (emptyState) {
    emptyState.style.display = "none";
}

if (applicationsContainer) {
    applicationsContainer.style.display = "none";
}


if (state === "loading") {

    if (loadingState) {
        loadingState.style.display = "flex";
    }

    return;
}


if (state === "error") {

    if (errorState) {
        errorState.style.display = "flex";
    }

    return;
}


if (state === "empty") {

    if (emptyState) {
        emptyState.style.display = "flex";
    }

    return;
}


if (state === "applications") {

    if (applicationsContainer) {
        applicationsContainer.style.display = "flex";
    }

}

}

/* ======================================================
STATUS
====================================================== */

function getStatusClass(status) {

if (status === "approved") {
    return "status-approved";
}

if (status === "rejected") {
    return "status-rejected";
}

return "status-pending";

}

function getStatusIcon(status) {

if (status === "approved") {
    return "fa-solid fa-circle-check";
}

if (status === "rejected") {
    return "fa-solid fa-circle-xmark";
}

return "fa-solid fa-clock";

}

/* ======================================================
VALUE FORMATTING
====================================================== */

function formatValue(value) {

if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
) {

    return `
        <span class="empty">
            Not provided
        </span>
    `;

}


return escapeHTML(
    String(value).trim()
);

}

/* ======================================================
DATE
====================================================== */

function formatDate(value) {

if (!value) {
    return "Not available";
}


const date =
    new Date(value);


if (Number.isNaN(date.getTime())) {
    return escapeHTML(
        String(value)
    );
}


return escapeHTML(
    date.toLocaleString(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        }
    )
);

}

/* ======================================================
ESCAPE HTML
====================================================== */

function escapeHTML(value) {

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

/* ======================================================
INITIALIZE
====================================================== */

document.addEventListener(
"DOMContentLoaded",
function () {

    applicationsContainer =
        document.getElementById(
            "applicationsContainer"
        );

    loadingState =
        document.getElementById(
            "loadingState"
        );

    errorState =
        document.getElementById(
            "errorState"
        );

    emptyState =
        document.getElementById(
            "emptyState"
        );

    refreshButton =
        document.getElementById(
            "refreshApplicationsBtn"
        );

    retryButton =
        document.getElementById(
            "retryBtn"
        );


    if (
        !applicationsContainer ||
        !loadingState ||
        !errorState ||
        !emptyState
    ) {

        console.error(
            "Mentor application page elements are missing."
        );

        return;

    }


    if (refreshButton) {

        refreshButton.addEventListener(
            "click",
            loadApplications
        );

    }


    if (retryButton) {

        retryButton.addEventListener(
            "click",
            loadApplications
        );

    }


    loadApplications();

}

);