const API = "http://127.0.0.1:8000";


/* ==================================================
   GET SESSION TOKEN
================================================== */

function getSessionToken() {

    return localStorage.getItem("session_token");

}


/* ==================================================
   SHOW STATUS
================================================== */

function showApplicationStatus(
    message,
    type
) {

    const status =
        document.getElementById(
            "applicationStatus"
        );


    if (!status) {

        return;

    }


    status.textContent = message;

    status.className =
        `application-status ${type}`;

    status.style.display = "block";

}


/* ==================================================
   SUBMIT APPLICATION
================================================== */

async function submitMentorApplication(
    event
) {

    event.preventDefault();


    const form =
        document.getElementById(
            "mentorApplicationForm"
        );


    const submitButton =
        document.getElementById(
            "submitApplicationBtn"
        );


    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        showApplicationStatus(
            "Your session has expired. Please log in again.",
            "error"
        );

        return;

    }


    const reason =
        document.getElementById(
            "reason"
        ).value.trim();


    const topics =
        document.getElementById(
            "topics"
        ).value.trim();


    const languages =
        document.getElementById(
            "languages"
        ).value.trim();


    const availability =
        document.getElementById(
            "availability"
        ).value.trim();


    const experience =
        document.getElementById(
            "experience"
        ).value.trim();


    const guidelinesAgreed =
        document.getElementById(
            "guidelinesAgreed"
        ).checked;


    if (!reason) {

        showApplicationStatus(
            "Please explain why you want to become a mentor.",
            "error"
        );

        return;

    }


    if (!guidelinesAgreed) {

        showApplicationStatus(
            "Please agree to the mentor guidelines before applying.",
            "error"
        );

        return;

    }


    submitButton.disabled = true;

    submitButton.innerHTML =
        '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';


    try {

        const response =
            await fetch(
                `${API}/mentor/apply`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({

                        session_token: sessionToken,

                        reason: reason,

                        topics: topics || null,

                        languages: languages || null,

                        availability: availability || null,

                        experience: experience || null,

                        guidelines_agreed: true

                    })

                }
            );


        const data =
            await response.json();


        console.log(
            "Mentor application response:",
            data
        );


        if (
            data.error === "Invalid or expired session"
        ) {

            localStorage.removeItem(
                "session_token"
            );

            showApplicationStatus(
                "Your session has expired. Please log in again.",
                "error"
            );

            submitButton.disabled = false;

            submitButton.innerHTML =
                '<i class="fa-solid fa-paper-plane"></i> Submit Application';

            return;

        }


        if (!response.ok || data.error) {

            throw new Error(
                data.error ||
                "Unable to submit mentor application."
            );

        }


        showApplicationStatus(
            "Your mentor application has been submitted successfully. The MindSpeak team will review it.",
            "success"
        );


        form.reset();


        submitButton.disabled = true;

        submitButton.innerHTML =
            '<i class="fa-solid fa-check"></i> Application Submitted';


    }
    catch (error) {

        console.error(
            "Mentor application error:",
            error
        );


        showApplicationStatus(
            error.message ||
            "Unable to submit your application. Please try again.",
            "error"
        );


        submitButton.disabled = false;

        submitButton.innerHTML =
            '<i class="fa-solid fa-paper-plane"></i> Submit Application';

    }

}


/* ==================================================
   CHECK EXISTING APPLICATION
================================================== */

async function checkExistingApplication() {

    const sessionToken =
        getSessionToken();


    if (!sessionToken) {

        return;

    }


    try {

        const response =
            await fetch(
                `${API}/mentor/my-application?session_token=${encodeURIComponent(sessionToken)}`
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        if (
            !data ||
            data.error
        ) {

            return;

        }


        const application =
            data.application ||
            data;


        if (!application || !application.status) {

            return;

        }


        const status =
            application.status;


        if (status === "pending") {

            showApplicationStatus(
                "You already have a mentor application under review.",
                "info"
            );


            disableApplicationForm();

        }


        else if (status === "approved") {

            showApplicationStatus(
                "Your mentor application has already been approved. You are now a MindSpeak mentor.",
                "success"
            );


            disableApplicationForm();

        }


        else if (status === "rejected") {

            showApplicationStatus(
                "Your previous mentor application was rejected.",
                "error"
            );

        }

    }
    catch (error) {

        console.error(
            "Checking mentor application:",
            error
        );

    }

}


/* ==================================================
   DISABLE FORM
================================================== */

function disableApplicationForm() {

    const form =
        document.getElementById(
            "mentorApplicationForm"
        );


    if (!form) {

        return;

    }


    const fields =
        form.querySelectorAll(
            "input, textarea, button"
        );


    fields.forEach(
        field => {

            field.disabled = true;

        }
    );


    const submitButton =
        document.getElementById(
            "submitApplicationBtn"
        );


    if (submitButton) {

        submitButton.innerHTML =
            '<i class="fa-solid fa-check"></i> Application Already Submitted';

    }

}


/* ==================================================
   PAGE INITIALIZATION
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const form =
            document.getElementById(
                "mentorApplicationForm"
            );


        if (form) {

            form.addEventListener(
                "submit",
                submitMentorApplication
            );

        }


        checkExistingApplication();

    }
);