document.addEventListener("DOMContentLoaded", () => {
    initContactPage();
});


const API_BASE = "http://127.0.0.1:8000";


function initContactPage() {
    initContactMessageForm();
    initNewsletterForm();
    initFeedbackForm();
    initFAQ();
    initFAQViewAll();
}


/* =========================================================
   SAFE RESPONSE PARSER
========================================================= */

async function parseResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch (error) {
        console.error("Invalid JSON response:", text);

        return {
            detail: text
        };
    }
}


/* =========================================================
   CONTACT MESSAGE FORM
========================================================= */

function initContactMessageForm() {

    const form = document.getElementById("contactMessageForm");

    if (!form) {
        console.warn("Contact form not found.");
        return;
    }

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    const messageInput =
        document.getElementById("contactMessage");

    const charCount =
        document.getElementById("messageCount");


    /* Character counter */

    if (messageInput && charCount) {

        const updateCounter = () => {
            charCount.textContent =
                `${messageInput.value.length}/1000`;
        };

        messageInput.addEventListener(
            "input",
            updateCounter
        );

        updateCounter();
    }


    /* Submit */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearContactStatus();


        const name =
            document.getElementById("contactName")
                ?.value.trim() || "";

        const email =
            document.getElementById("contactEmail")
                ?.value.trim() || "";

        const subject =
            document.getElementById("contactSubject")
                ?.value.trim() || "";

        const message =
            document.getElementById("contactMessage")
                ?.value.trim() || "";


        /* Validation */

        if (!name) {
            showContactError("Please enter your name.");
            return;
        }

        if (!email) {
            showContactError(
                "Please enter your email address."
            );
            return;
        }

        if (!isValidEmail(email)) {
            showContactError(
                "Please enter a valid email address."
            );
            return;
        }

        if (!subject) {
            showContactError(
                "Please select a subject."
            );
            return;
        }

        if (!message) {
            showContactError(
                "Please enter your message."
            );
            return;
        }

        if (message.length > 1000) {
            showContactError(
                "Your message must be 1000 characters or less."
            );
            return;
        }


        /* Loading */

        setButtonLoading(
            submitButton,
            true,
            "Sending..."
        );


        try {

            console.log("Sending contact message...", {
                name,
                email,
                subject,
                message
            });


            const response = await fetch(
                `${API_BASE}/api/contact/messages`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email,
                        subject: subject,
                        message: message
                    })
                }
            );


            const data =
                await parseResponse(response);


            console.log(
                "Contact API response:",
                response.status,
                data
            );


            if (!response.ok) {

                const backendError =
                    data.detail ||
                    data.message ||
                    data.error ||
                    `Server returned ${response.status}.`;

                throw new Error(backendError);
            }


            showContactSuccess(
                data.detail ||
                data.message ||
                "Your message has been sent successfully."
            );


            form.reset();


            if (charCount) {
                charCount.textContent = "0/1000";
            }


        } catch (error) {

            console.error(
                "Contact form error:",
                error
            );

            showContactError(
                error.message ||
                "Unable to send your message. Please try again."
            );


        } finally {

            setButtonLoading(
                submitButton,
                false
            );

        }

    });
}


/* =========================================================
   NEWSLETTER
========================================================= */

function initNewsletterForm() {

    const form =
        document.getElementById("newsletterForm");

    if (!form) {
        console.warn("Newsletter form not found.");
        return;
    }

    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearNewsletterStatus();


        const emailInput =
            document.getElementById("newsletterEmail");

        const consent =
            document.getElementById("newsletterConsent");


        const email =
            emailInput?.value.trim() || "";


        if (!email) {
            showNewsletterError(
                "Please enter your email address."
            );
            return;
        }


        if (!isValidEmail(email)) {
            showNewsletterError(
                "Please enter a valid email address."
            );
            return;
        }


        if (consent && !consent.checked) {
            showNewsletterError(
                "Please agree to receive updates from MindSpeak."
            );
            return;
        }


        setButtonLoading(
            submitButton,
            true,
            "Subscribing..."
        );


        try {

            const response = await fetch(
                `${API_BASE}/api/contact/newsletter`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email: email
                    })
                }
            );


            const data =
                await parseResponse(response);


            console.log(
                "Newsletter API response:",
                response.status,
                data
            );


            if (!response.ok) {

                const backendError =
                    data.detail ||
                    data.message ||
                    data.error ||
                    `Server returned ${response.status}.`;

                throw new Error(backendError);
            }


            showNewsletterSuccess(
                data.detail ||
                data.message ||
                "You have successfully subscribed."
            );


            form.reset();


        } catch (error) {

            console.error(
                "Newsletter error:",
                error
            );

            showNewsletterError(
                error.message ||
                "Unable to subscribe. Please try again."
            );


        } finally {

            setButtonLoading(
                submitButton,
                false
            );

        }

    });
}


/* =========================================================
   FEEDBACK FORM
========================================================= */

function initFeedbackForm() {

    const form =
        document.getElementById("feedbackForm");

    if (!form) {
        console.warn("Feedback form not found.");
        return;
    }


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    const feedbackInput =
        document.getElementById("feedbackMessage");

    const feedbackCount =
        document.getElementById("feedbackCount");


    /* Character counter */

    if (feedbackInput && feedbackCount) {

        const updateFeedbackCounter = () => {

            feedbackCount.textContent =
                `${feedbackInput.value.length}/2000`;

        };

        feedbackInput.addEventListener(
            "input",
            updateFeedbackCounter
        );

        updateFeedbackCounter();
    }


    /* Submit */

    form.addEventListener("submit", async (event) => {

        event.preventDefault();

        clearFeedbackStatus();


        const name =
            document.getElementById("feedbackName")
                ?.value.trim() || "";

        const email =
            document.getElementById("feedbackEmail")
                ?.value.trim() || "";

        const feedback =
            document.getElementById("feedbackMessage")
                ?.value.trim() || "";


        const selectedRating =
            form.querySelector(
                'input[name="rating"]:checked'
            );

        const rating =
            selectedRating
                ? Number(selectedRating.value)
                : null;


        /* Validation */

        if (!name) {
            showFeedbackError(
                "Please enter your name."
            );
            return;
        }


        if (!email) {
            showFeedbackError(
                "Please enter your email address."
            );
            return;
        }


        if (!isValidEmail(email)) {
            showFeedbackError(
                "Please enter a valid email address."
            );
            return;
        }


        if (!rating) {
            showFeedbackError(
                "Please select a rating from 1 to 5."
            );
            return;
        }


        if (rating < 1 || rating > 5) {
            showFeedbackError(
                "Rating must be between 1 and 5."
            );
            return;
        }


        if (!feedback) {
            showFeedbackError(
                "Please enter your feedback."
            );
            return;
        }


        if (feedback.length > 2000) {
            showFeedbackError(
                "Your feedback must be 2000 characters or less."
            );
            return;
        }


        /* Loading */

        setButtonLoading(
            submitButton,
            true,
            "Sending..."
        );


        try {

            console.log(
                "Sending feedback...",
                {
                    name,
                    email,
                    rating,
                    feedback
                }
            );


            const response = await fetch(
                `${API_BASE}/api/contact/feedback`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name: name,
                        email: email,
                        rating: rating,
                        feedback: feedback
                    })
                }
            );


            const data =
                await parseResponse(response);


            console.log(
                "Feedback API response:",
                response.status,
                data
            );


            if (!response.ok) {

                const backendError =
                    data.detail ||
                    data.message ||
                    data.error ||
                    `Server returned ${response.status}.`;

                throw new Error(backendError);
            }


            /* Success */

            showFeedbackSuccess(
                data.detail ||
                data.message ||
                "Thank you for your feedback!"
            );


            /* Reset form */

            form.reset();


            if (feedbackCount) {
                feedbackCount.textContent = "0/2000";
            }


        } catch (error) {

            console.error(
                "Feedback form error:",
                error
            );

            showFeedbackError(
                error.message ||
                "Unable to submit your feedback. Please try again."
            );


        } finally {

            setButtonLoading(
                submitButton,
                false
            );

        }

    });
}


/* =========================================================
   FAQ
========================================================= */

async function initFAQ() {

    const faqList =
        document.querySelector(".faq-list");

    if (!faqList) {
        console.warn("FAQ list not found.");
        return;
    }


    try {

        const response = await fetch(
            `${API_BASE}/api/contact/faqs`
        );


        const data =
            await parseResponse(response);


        console.log(
            "FAQ API response:",
            response.status,
            data
        );


        if (!response.ok) {

            const backendError =
                data.detail ||
                data.message ||
                data.error ||
                `Server returned ${response.status}.`;

            throw new Error(backendError);
        }


        const faqs =
            Array.isArray(data)
                ? data
                : data.faqs || [];


        if (!faqs.length) {

            faqList.innerHTML = `
                <div class="faq-empty">
                    No FAQs are available at the moment.
                </div>
            `;

            return;
        }


        /* Build FAQ items */

        faqList.innerHTML =
            faqs.map((faq) => {

                return `
                    <div class="faq-item">

                        <button
                            type="button"
                            class="faq-question">

                            <span>
                                ${escapeHTML(faq.question)}
                            </span>

                            <i class="fa-solid fa-chevron-down"></i>

                        </button>

                        <div class="faq-answer">

                            ${escapeHTML(faq.answer)}

                        </div>

                    </div>
                `;

            }).join("");


        /* Accordion */

        const faqItems =
            faqList.querySelectorAll(".faq-item");


        faqItems.forEach(item => {

            const question =
                item.querySelector(".faq-question");


            if (!question) {
                return;
            }


            question.addEventListener("click", () => {

                const isOpen =
                    item.classList.contains("active");


                faqItems.forEach(otherItem => {
                    otherItem.classList.remove("active");
                });


                if (!isOpen) {
                    item.classList.add("active");
                }

            });

        });


    } catch (error) {

        console.error(
            "FAQ loading error:",
            error
        );


        faqList.innerHTML = `
            <div class="faq-empty">
                Unable to load FAQs right now.
                Please try again later.
            </div>
        `;

    }
}

function escapeHTML(value) {

    const div =
        document.createElement("div");

    div.textContent =
        value ?? "";

    return div.innerHTML;
}

/* =========================================================
   FAQ VIEW ALL
========================================================= */

function initFAQViewAll() {

    const viewAllButton =
        document.getElementById("viewAllFaqs");


    if (!viewAllButton) {
        return;
    }


    viewAllButton.addEventListener("click", () => {

        const faqItems =
            document.querySelectorAll(".faq-item");


        faqItems.forEach(item => {
            item.classList.add("active");
        });


        viewAllButton.innerHTML =
            'All FAQs Expanded <i class="fa-solid fa-check"></i>';

    });
}


/* =========================================================
   EMAIL VALIDATION
========================================================= */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    loading,
    loadingText = "Loading..."
) {

    if (!button) {
        return;
    }


    if (loading) {

        if (!button.dataset.originalText) {

            button.dataset.originalText =
                button.innerHTML;

        }

        button.disabled = true;
        button.textContent = loadingText;


    } else {

        button.disabled = false;

        if (button.dataset.originalText) {

            button.innerHTML =
                button.dataset.originalText;

        }

    }

}


/* =========================================================
   CONTACT STATUS
========================================================= */

function clearContactStatus() {

    const element =
        document.getElementById("contactFormMessage");


    if (element) {

        element.style.display = "none";
        element.textContent = "";
        element.className = "form-message";

    }

}


function showContactSuccess(message) {

    const element =
        document.getElementById("contactFormMessage");


    if (!element) {
        alert(message);
        return;
    }


    element.textContent = message;
    element.style.display = "block";
    element.className =
        "form-message success";

}


function showContactError(message) {

    const element =
        document.getElementById("contactFormMessage");


    if (!element) {
        alert(message);
        return;
    }


    element.textContent = message;
    element.style.display = "block";
    element.className =
        "form-message error";

}


/* =========================================================
   NEWSLETTER STATUS
========================================================= */

function clearNewsletterStatus() {

    const element =
        document.getElementById("newsletterMessage");


    if (element) {

        element.style.display = "none";
        element.textContent = "";
        element.className = "newsletter-message";

    }

}


function showNewsletterSuccess(message) {

    const element =
        document.getElementById("newsletterMessage");


    if (!element) {
        alert(message);
        return;
    }


    element.textContent = message;
    element.style.display = "block";
    element.className =
        "newsletter-message success";

}


function showNewsletterError(message) {

    const element =
        document.getElementById("newsletterMessage");


    if (!element) {
        alert(message);
        return;
    }


    element.textContent = message;
    element.style.display = "block";
    element.className =
        "newsletter-message error";

}


/* =========================================================
   FEEDBACK STATUS
========================================================= */

function clearFeedbackStatus() {

    const element =
        document.getElementById("feedbackFormMessage");


    if (element) {

        element.style.display = "none";
        element.textContent = "";
        element.className = "form-message";

    }

}


function showFeedbackSuccess(message) {

    const element =
        document.getElementById("feedbackFormMessage");


    if (!element) {
        alert(message);
        return;
    }


    element.textContent = message;
    element.style.display = "block";
    element.className =
        "form-message success";

}


function showFeedbackError(message) {

    const element =
        document.getElementById("feedbackFormMessage");


    if (!element) {
        alert(message);
        return;
    }


    element.textContent = message;
    element.style.display = "block";
    element.className =
        "form-message error";

}