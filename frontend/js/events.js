// =========================================================
// MINDSPEAK EVENTS JAVASCRIPT
// =========================================================

document.addEventListener("DOMContentLoaded", function () {

    const eventsContainer =
        document.getElementById("events-container");

    const filterButtons =
        document.querySelectorAll(".event-filter");

    const registrationForm =
        document.getElementById("registration-form");


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    loadEvents("all");
    loadRegisteredEvents();
    loadFeaturedEvent();


    // =========================================================
    // REGISTRATION FORM SUBMIT
    // =========================================================

    if (registrationForm) {

        registrationForm.addEventListener("submit", function (e) {

            e.preventDefault();

            const modal =
                document.getElementById("registration-modal");

            if (!modal) {

                console.error(
                    "Registration modal not found."
                );

                return;
            }

            const eventId =
                modal.dataset.eventId;

            if (!eventId) {

                alert(
                    "Event information is missing."
                );

                return;
            }

            registerForEvent(eventId);

        });
    }


    // =========================================================
    // EVENT FILTERS
    // =========================================================

    filterButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const category =
                button.dataset.category;

            filterButtons.forEach(function (btn) {

                btn.classList.remove("active");

            });

            button.classList.add("active");

            loadEvents(category);

        });

    });


    // =========================================================
    // CLOSE MODAL WHEN CLICKING OUTSIDE
    // =========================================================

    const registrationModal =
        document.getElementById("registration-modal");

    if (registrationModal) {

        registrationModal.addEventListener("click", function (e) {

            if (e.target === registrationModal) {

                closeRegistrationForm();

            }

        });

    }


    // =========================================================
    // ESCAPE KEY CLOSES MODAL
    // =========================================================

    document.addEventListener("keydown", function (e) {

        if (e.key === "Escape") {

            const modal =
                document.getElementById("registration-modal");

            if (
                modal &&
                modal.style.display === "flex"
            ) {

                closeRegistrationForm();

            }

        }

    });

});


// =========================================================
// GET EVENT IMAGE
// =========================================================
// Uses the image value stored in the database.
// =========================================================

function getEventImage(event) {

    if (event && event.image) {

        let imagePath =
            String(event.image).trim();


        // External image URL
        if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://")
        ) {

            return imagePath;

        }


        // Database already contains images/ path
        if (
            imagePath.startsWith("images/") ||
            imagePath.startsWith("/images/")
        ) {

            return imagePath;

        }


        // Database contains only filename
        return "images/Events/" + imagePath;

    }


    // Fallback image
    return "images/Events/discussion.jpg";
}


// =========================================================
// LOAD ALL / FILTERED EVENTS
// =========================================================

async function loadEvents(category) {

    const eventsContainer =
        document.getElementById("events-container");

    if (!eventsContainer) {

        console.error(
            "Events container not found."
        );

        return;
    }


    // Loading message
    eventsContainer.innerHTML =
        '<div class="events-loading">' +
        'Loading events...' +
        '</div>';


    try {

        let url =
            "http://127.0.0.1:8000/events/";


        // Category filter
        if (
            category &&
            category !== "all"
        ) {

            url =
                url +
                "?category=" +
                encodeURIComponent(category);

        }


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                "Failed to load events. Status: " +
                response.status
            );

        }


        const data =
            await response.json();


        const events =
            data.events || [];


        // =====================================================
        // NO EVENTS
        // =====================================================

        if (events.length === 0) {

            eventsContainer.innerHTML =
                '<div class="events-empty">' +
                '<h3>No upcoming events</h3>' +
                '<p>There are no upcoming events in this category right now.</p>' +
                '</div>';

            return;
        }


        // =====================================================
        // CLEAR CONTAINER
        // =====================================================

        eventsContainer.innerHTML = "";


        // =====================================================
        // CREATE EVENT CARDS
        // =====================================================

        events.forEach(function (event) {

            const card =
                createEventCard(event);

            if (card) {

                eventsContainer.appendChild(card);

            }

        });


    } catch (error) {

        console.error(
            "Error loading events:",
            error
        );


        eventsContainer.innerHTML =
            '<div class="events-error">' +
            '<h3>Unable to load events</h3>' +
            '<p>Please try again later.</p>' +
            '</div>';

    }

}


// =========================================================
// CREATE EVENT CARD
// =========================================================

function createEventCard(event) {

    const card =
        document.createElement("article");

    card.className =
        "event-card";


    // =========================================================
    // EVENT CATEGORY VALUE
    // =========================================================

    const categoryValue =
        String(
            event.category || ""
        ).toLowerCase();


    // =========================================================
    // FELLOWSHIP CARD STYLE
    // =========================================================
    // Adds a special class only to Fellowship cards.
    // This allows CSS to give them a soft lavender appearance.
    // =========================================================

    if (categoryValue === "fellowship") {

        card.classList.add(
            "fellowship-event-card"
        );

    }


    // =========================================================
    // IMAGE
    // =========================================================

    const imageContainer =
        document.createElement("div");

    imageContainer.className =
        "event-image";


    const image =
        document.createElement("img");


    image.src =
        getEventImage(event);


    image.alt =
        event.title ||
        "MindSpeak Event";


    image.loading =
        "lazy";


    // Image fallback
    image.onerror = function () {

        if (
            !image.src.includes("discussion.jpg")
        ) {

            image.src =
                "images/Events/discussion.jpg";

        }

    };


    imageContainer.appendChild(image);


    // =========================================================
    // CARD CONTENT
    // =========================================================

    const content =
        document.createElement("div");

    content.className =
        "event-card-content";


    // =========================================================
    // CATEGORY
    // =========================================================

    const category =
        document.createElement("span");

    category.className =
        "event-category";

    category.textContent =
        formatCategory(event.category);


    // =========================================================
    // TITLE
    // =========================================================

    const title =
        document.createElement("h3");

    title.className =
        "event-title";

    title.textContent =
        event.title ||
        "MindSpeak Event";


    // =========================================================
    // DESCRIPTION
    // =========================================================

    const description =
        document.createElement("p");

    description.className =
        "event-description";

    description.textContent =
        event.description ||
        "Join us for a meaningful MindSpeak session.";


    // =========================================================
    // EVENT DETAILS
    // =========================================================

    const details =
        document.createElement("div");

    details.className =
        "event-details";


    // Date
    const date =
        document.createElement("div");

    date.className =
        "event-detail";

    date.innerHTML =
        '<i class="fa-regular fa-calendar"></i>' +
        '<span>' +
        formatEventDate(event.event_date) +
        '</span>';


    // Location
    const location =
        document.createElement("div");

    location.className =
        "event-detail";

    location.innerHTML =
        '<i class="fa-solid fa-location-dot"></i>' +
        '<span>' +
        escapeHTML(
            event.location || "Online"
        ) +
        '</span>';


    details.appendChild(date);
    details.appendChild(location);


    // =========================================================
    // ACTION BUTTON
    // =========================================================

    const actionContainer =
        document.createElement("div");

    actionContainer.className =
        "event-action";


    // =========================================================
    // FELLOWSHIP
    // =========================================================

    if (categoryValue === "fellowship") {

        const interestButton =
            document.createElement("button");

        interestButton.type =
            "button";

        interestButton.className =
            "interest-btn";

        interestButton.textContent =
            "I'm Interested";


        interestButton.addEventListener(
            "click",
            function () {

                showFellowshipInterest(event);

            }
        );


        actionContainer.appendChild(
            interestButton
        );

    }


    // =========================================================
    // NORMAL EVENT
    // =========================================================

    else {

        const registerButton =
            document.createElement("button");

        registerButton.type =
            "button";

        registerButton.className =
            "register-event-btn";

        registerButton.textContent =
            "Register";


        registerButton.addEventListener(
            "click",
            function () {

                openRegistrationForm(
                    event.id
                );

            }
        );


        actionContainer.appendChild(
            registerButton
        );

    }


    // =========================================================
    // APPEND CARD
    // =========================================================

    content.appendChild(category);
    content.appendChild(title);
    content.appendChild(description);
    content.appendChild(details);
    content.appendChild(actionContainer);

    card.appendChild(imageContainer);
    card.appendChild(content);


    return card;
}


// =========================================================
// LOAD FEATURED EVENT
// =========================================================

async function loadFeaturedEvent() {

    const container =
        document.getElementById(
            "featured-event-container"
        );


    if (!container) {

        console.error(
            "Featured event container not found."
        );

        return;
    }


    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/events/featured"
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load featured event. Status: " +
                response.status
            );

        }


        const data =
            await response.json();


        const event =
            data.event;


        // =====================================================
        // NO FEATURED EVENT
        // =====================================================

        if (!event) {

            container.innerHTML =
                '<div class="featured-empty">' +
                '<p>No featured event available.</p>' +
                '</div>';

            return;
        }


        // =====================================================
        // FEATURED CARD
        // =====================================================

        const card =
            document.createElement("article");

        card.className =
            "featured-event-card";


        // =====================================================
        // IMAGE
        // =====================================================

        const imageContainer =
            document.createElement("div");

        imageContainer.className =
            "featured-event-image";


        const image =
            document.createElement("img");


        image.src =
            getEventImage(event);


        image.alt =
            event.title ||
            "Featured MindSpeak Event";


        image.loading =
            "lazy";


        image.onerror = function () {

            if (
                !image.src.includes("discussion.jpg")
            ) {

                image.src =
                    "images/Events/discussion.jpg";

            }

        };


        imageContainer.appendChild(image);


        // =====================================================
        // FEATURED CONTENT
        // =====================================================

        const content =
            document.createElement("div");

        content.className =
            "featured-event-content";


        // Badge
        const badge =
            document.createElement("span");

        badge.className =
            "featured-event-badge";

        badge.textContent =
            "FEATURED EVENT";


        // Category
        const category =
            document.createElement("span");

        category.className =
            "featured-event-category";

        category.textContent =
            formatCategory(
                event.category
            );


        // Title
        const title =
            document.createElement("h2");

        title.className =
            "featured-event-title";

        title.textContent =
            event.title ||
            "MindSpeak Event";


        // Description
        const description =
            document.createElement("p");

        description.className =
            "featured-event-description";

        description.textContent =
            event.description ||
            "Join us for this MindSpeak event.";


        // =====================================================
        // FEATURED DETAILS
        // =====================================================

        const details =
            document.createElement("div");

        details.className =
            "featured-event-details";


        details.innerHTML =
            '<div class="event-detail">' +
            '<i class="fa-regular fa-calendar"></i>' +
            '<span>' +
            formatEventDate(
                event.event_date
            ) +
            '</span>' +
            '</div>' +

            '<div class="event-detail">' +
            '<i class="fa-solid fa-location-dot"></i>' +
            '<span>' +
            escapeHTML(
                event.location || "Online"
            ) +
            '</span>' +
            '</div>';


        // =====================================================
        // FEATURED BUTTON
        // =====================================================

        const categoryValue =
            String(
                event.category || ""
            ).toLowerCase();


        let actionButton;


        // Fellowship
        if (
            categoryValue === "fellowship"
        ) {

            actionButton =
                document.createElement(
                    "button"
                );

            actionButton.type =
                "button";

            actionButton.className =
                "featured-interest-btn";

            actionButton.textContent =
                "I'm Interested";


            actionButton.addEventListener(
                "click",
                function () {

                    showFellowshipInterest(
                        event
                    );

                }
            );

        }


        // Normal event
        else {

            actionButton =
                document.createElement(
                    "button"
                );

            actionButton.type =
                "button";

            actionButton.className =
                "featured-register-btn";

            actionButton.textContent =
                "Register for Event";


            actionButton.addEventListener(
                "click",
                function () {

                    openRegistrationForm(
                        event.id
                    );

                }
            );

        }


        // =====================================================
        // APPEND FEATURED CARD
        // =====================================================

        content.appendChild(badge);
        content.appendChild(category);
        content.appendChild(title);
        content.appendChild(description);
        content.appendChild(details);
        content.appendChild(actionButton);

        card.appendChild(imageContainer);
        card.appendChild(content);


        container.innerHTML = "";

        container.appendChild(card);


    } catch (error) {

        console.error(
            "Error loading featured event:",
            error
        );


        container.innerHTML =
            '<div class="featured-error">' +
            '<p>Unable to load featured event.</p>' +
            '</div>';

    }

}


// =========================================================
// OPEN REGISTRATION FORM
// =========================================================

function openRegistrationForm(eventId) {

    const userId =
        localStorage.getItem("user_id");


    if (!userId) {

        alert(
            "Please log in first to register for an event."
        );

        return;
    }


    const modal =
        document.getElementById(
            "registration-modal"
        );


    if (!modal) {

        console.error(
            "Registration modal not found."
        );

        return;
    }


    // Save event ID
    modal.dataset.eventId =
        String(eventId);


    // Move modal directly under body
    if (
        modal.parentElement !==
        document.body
    ) {

        document.body.appendChild(
            modal
        );

    }


    // Show modal
    modal.style.display =
        "flex";


    // Prevent background scrolling
    document.body.classList.add(
        "modal-open"
    );

}


// =========================================================
// CLOSE REGISTRATION FORM
// =========================================================

function closeRegistrationForm() {

    const modal =
        document.getElementById(
            "registration-modal"
        );


    if (!modal) {

        return;
    }


    modal.style.display =
        "none";


    document.body.classList.remove(
        "modal-open"
    );


    // Keep modal outside event cards
    if (
        modal.parentElement !==
        document.body
    ) {

        document.body.appendChild(
            modal
        );

    }

}


// =========================================================
// REGISTER FOR EVENT
// =========================================================

async function registerForEvent(eventId) {

    const userId =
        localStorage.getItem("user_id");


    if (!userId) {

        alert(
            "Please log in first to register for an event."
        );

        return;
    }


    const form =
        document.getElementById(
            "registration-form"
        );


    if (!form) {

        console.error(
            "Registration form not found."
        );

        return;
    }


    // =========================================================
    // GET FORM VALUES
    // =========================================================

    const fullName =
        document.getElementById(
            "registration-name"
        ).value.trim();


    const email =
        document.getElementById(
            "registration-email"
        ).value.trim();


    const phone =
        document.getElementById(
            "registration-phone"
        ).value.trim();


    const address =
        document.getElementById(
            "registration-address"
        ).value.trim();


    const college =
        document.getElementById(
            "registration-college"
        ).value.trim();


    const course =
        document.getElementById(
            "registration-course"
        ).value.trim();


    const semester =
        document.getElementById(
            "registration-semester"
        ).value.trim();


    // =========================================================
    // VALIDATE REQUIRED FIELDS
    // =========================================================

    if (
        !fullName ||
        !email ||
        !phone
    ) {

        alert(
            "Please fill in your name, email and contact number."
        );

        return;
    }


    // =========================================================
    // SUBMIT BUTTON
    // =========================================================

    const submitButton =
        form.querySelector(
            ".submit-registration-btn"
        );


    if (submitButton) {

        submitButton.disabled =
            true;

        submitButton.textContent =
            "Registering...";

    }


    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/events/" +
                eventId +
                "/register",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        user_id:
                            userId,

                        full_name:
                            fullName,

                        email:
                            email,

                        phone:
                            phone,

                        address:
                            address,

                        college:
                            college,

                        course:
                            course,

                        semester:
                            semester

                    })
                }
            );


        const data =
            await response.json();


        // Backend error
        if (data.error) {

            alert(
                data.error
            );

            return;
        }


        // Successful registration
        if (response.ok) {

            alert(
                data.message ||
                "Successfully registered for the event!"
            );


            closeRegistrationForm();


            form.reset();


            // Refresh registered events
            loadRegisteredEvents();


            // Refresh upcoming events
            const activeFilter =
                document.querySelector(
                    ".event-filter.active"
                );


            const category =
                activeFilter
                    ? activeFilter.dataset.category
                    : "all";


            loadEvents(category);

        }


    } catch (error) {

        console.error(
            "Registration error:",
            error
        );


        alert(
            "Something went wrong while registering. Please try again."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.textContent =
                "Submit Registration";

        }

    }

}


// =========================================================
// LOAD MY REGISTERED EVENTS
// =========================================================

async function loadRegisteredEvents() {

    const container =
        document.getElementById(
            "registered-events-container"
        );


    if (!container) {

        return;
    }


    const userId =
        localStorage.getItem(
            "user_id"
        );


    // =========================================================
    // USER NOT LOGGED IN
    // =========================================================

    if (!userId) {

        container.innerHTML =
            '<div class="registered-empty">' +
            '<h3>Login to view your events</h3>' +
            '<p>Your registered events will appear here after you log in.</p>' +
            '</div>';

        return;
    }


    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/events/registered/" +
                userId
            );


        if (!response.ok) {

            throw new Error(
                "Failed to load registered events. Status: " +
                response.status
            );

        }


        const data =
            await response.json();


        const events =
            data.events || [];


        // =====================================================
        // NO REGISTERED EVENTS
        // =====================================================

        if (events.length === 0) {

            container.innerHTML =
                '<div class="registered-empty">' +
                '<h3>No registered events</h3>' +
                '<p>You haven\'t registered for any upcoming events yet.</p>' +
                '</div>';

            return;
        }


        // Clear container
        container.innerHTML = "";


        // Create registered cards
        events.forEach(function (event) {

            const card =
                createRegisteredEventCard(
                    event
                );

            if (card) {

                container.appendChild(
                    card
                );

            }

        });


    } catch (error) {

        console.error(
            "Error loading registered events:",
            error
        );


        container.innerHTML =
            '<div class="registered-error">' +
            '<h3>Unable to load your events</h3>' +
            '<p>Please try again later.</p>' +
            '</div>';

    }

}


// =========================================================
// REGISTERED EVENT IMAGE
// =========================================================

function getRegisteredEventImage(event) {

    return getEventImage(event);

}


// =========================================================
// CREATE REGISTERED EVENT CARD
// =========================================================

function createRegisteredEventCard(event) {

    const card =
        document.createElement("article");

    card.className =
        "registered-event-card";


    // =========================================================
    // IMAGE
    // =========================================================

    const imageContainer =
        document.createElement("div");

    imageContainer.className =
        "registered-event-image";


    const image =
        document.createElement("img");


    image.src =
        getRegisteredEventImage(event);


    image.alt =
        event.title ||
        "Registered MindSpeak Event";


    image.loading =
        "lazy";


    image.onerror = function () {

        if (
            !image.src.includes(
                "discussion.jpg"
            )
        ) {

            image.src =
                "images/Events/discussion.jpg";

        }

    };


    imageContainer.appendChild(
        image
    );


    // =========================================================
    // CONTENT
    // =========================================================

    const content =
        document.createElement("div");

    content.className =
        "registered-event-content";


    // Category
    const category =
        document.createElement("span");

    category.className =
        "registered-event-category";

    category.textContent =
        formatCategory(
            event.category
        );


    // Title
    const title =
        document.createElement("h3");

    title.className =
        "registered-event-title";

    title.textContent =
        event.title ||
        "MindSpeak Event";


    // Description
    const description =
        document.createElement("p");

    description.className =
        "registered-event-description";

    description.textContent =
        event.description ||
        "You are registered for this event.";


    // =========================================================
    // DETAILS
    // =========================================================

    const details =
        document.createElement("div");

    details.className =
        "registered-event-details";


    details.innerHTML =
        '<div class="event-detail">' +
        '<i class="fa-regular fa-calendar"></i>' +
        '<span>' +
        formatEventDate(
            event.event_date
        ) +
        '</span>' +
        '</div>' +

        '<div class="event-detail">' +
        '<i class="fa-solid fa-location-dot"></i>' +
        '<span>' +
        escapeHTML(
            event.location || "Online"
        ) +
        '</span>' +
        '</div>';


    // =========================================================
    // REGISTERED BADGE
    // =========================================================

    const badge =
        document.createElement("span");

    badge.className =
        "registered-event-badge";


    badge.innerHTML =
        '<i class="fa-solid fa-check"></i>' +
        ' Registered';


    // =========================================================
    // APPEND
    // =========================================================

    content.appendChild(
        category
    );

    content.appendChild(
        title
    );

    content.appendChild(
        description
    );

    content.appendChild(
        details
    );

    content.appendChild(
        badge
    );


    card.appendChild(
        imageContainer
    );

    card.appendChild(
        content
    );


    return card;

}


// =========================================================
// FELLOWSHIP INTEREST
// =========================================================

function showFellowshipInterest(event) {

    const userId =
        localStorage.getItem(
            "user_id"
        );


    if (!userId) {

        alert(
            "Please log in first."
        );

        return;
    }


    const eventTitle =
        event.title ||
        "this fellowship";


    alert(
        "Thank you for your interest in " +
        eventTitle +
        ". We will share more information with you soon."
    );


    const interestKey =
        "mindspeak_fellowship_interest_" +
        event.id;


    localStorage.setItem(
        interestKey,
        "true"
    );

}


// =========================================================
// FORMAT CATEGORY
// =========================================================

function formatCategory(category) {

    if (!category) {

        return "MindSpeak";

    }


    return String(category)
        .replace(/[-_]/g, " ")
        .replace(/\b\w/g, function (letter) {

            return letter.toUpperCase();

        });

}


// =========================================================
// FORMAT EVENT DATE
// =========================================================

function formatEventDate(dateString) {

    if (!dateString) {

        return "Date to be announced";

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


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}