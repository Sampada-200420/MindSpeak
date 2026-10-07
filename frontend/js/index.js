


/* ============================================================
   MINDSPEAK HOMEPAGE JAVASCRIPT
   ============================================================ */

const API_URL = "http://127.0.0.1:8000";

let selectedMood = "";
let selectedContext = "general";
let selectedPrivacyOption = "";

let moodThought = "";

let homepagePosts = [];

window.mindspeakHomepagePosts = homepagePosts;


/* ============================================================
   TIME-BASED HERO
   ============================================================ */

function updateHeroGreeting() {

    const greetingElement =
        document.getElementById("timeGreeting");

    const greetingIcon =
        document.getElementById("greetingIcon");

    const heroImage =
        document.getElementById("heroTimeImage");

    const descriptionElement =
        document.querySelector(".hero-description");

    const userNameElement =
        document.getElementById("userName");


    if (!greetingElement) {
        return;
    }


    const hour =
        new Date().getHours();


    let greeting = "";
    let icon = "";
    let image = "";
    let description = "";


    /* ========================================================
       MORNING
       05:00 - 11:59
    ======================================================== */

    if (hour >= 5 && hour < 12) {

        greeting = "Good morning";
        icon = "🌅";

        image =
            "images/hero/morning.jpg";

        description =
            "Start gently. You don't have to have everything figured out today.";

    }


    /* ========================================================
       AFTERNOON
       12:00 - 16:59
    ======================================================== */

    else if (hour >= 12 && hour < 17) {

        greeting = "Good afternoon";
        icon = "☀️";

        image =
            "images/hero/afternoon.jpg";

        description =
            "Take a moment to check in with yourself. How are you really feeling?";

    }


    /* ========================================================
       EVENING
       17:00 - 20:59
    ======================================================== */

    else if (hour >= 17 && hour < 21) {

        greeting = "Good evening";
        icon = "🌇";

        image =
            "images/hero/evening.jpg";

        description =
            "Whatever today brought you, you deserve a moment to pause and breathe.";

    }


    /* ========================================================
       NIGHT
       21:00 - 23:59
    ======================================================== */

    else if (hour >= 21) {

        greeting = "Good night";
        icon = "🌙";

        image =
            "images/hero/night.jpg";

        description =
            "It's okay to slow down. Give yourself permission to rest.";

    }


    /* ========================================================
       STILL AWAKE
       00:00 - 04:59
    ======================================================== */

    else {

        greeting = "Still awake?";
        icon = "🌙";

        image =
            "images/hero/night.jpg";

        description =
            "Be gentle with yourself. You don't have to figure everything out tonight.";

    }


    greetingElement.textContent =
        greeting;


    if (greetingIcon) {

        greetingIcon.className = "";

        greetingIcon.textContent =
            icon;

    }


    if (descriptionElement) {

        descriptionElement.textContent =
            description;

    }


    if (heroImage) {

        heroImage.src =
            image;

    }


    /*
     * Don't force a real name onto the page.
     * Keep "there" when no nickname exists.
     */

    if (userNameElement) {

        const nickname =
            localStorage.getItem("nickname");

        userNameElement.textContent =
            nickname || "there";

    }

}


/* ============================================================
   MAKE ALL MAIN SECTIONS VISIBLE
   ============================================================ */

function showHomepageSections() {

    const sections = [

        "moodShareSection",

        "peopleSection",

        "supportSection"

    ];


    sections.forEach(function (id) {

        const section =
            document.getElementById(id);

        if (!section) {
            return;
        }

        section.hidden = false;

        section.removeAttribute("hidden");

    });

}


/* ============================================================
   MOOD DATA
   ============================================================ */

const moodData = {

    anxious: {
        title: "Anxious",
        icon: "😟",
        message:
            "You don't have to solve everything at once. What's making things feel heavy?"
    },

    stressed: {
        title: "Stressed",
        icon: "😩",
        message:
            "It sounds like you may have a lot on your plate. What is taking up most of your energy?"
    },

    "low-mood": {
        title: "Low Mood",
        icon: "😔",
        message:
            "Some days feel heavier than others. You can take this one moment at a time."
    },

    lonely: {
        title: "Lonely",
        icon: "🥺",
        message:
            "Feeling alone can be difficult. You deserve connection and a place to be heard."
    },

    angry: {
        title: "Angry",
        icon: "😠",
        message:
            "Something may have crossed a line for you. What happened?"
    },

    numb: {
        title: "Numb",
        icon: "😐",
        message:
            "Sometimes feeling nothing can be difficult to understand. You don't have to explain it perfectly."
    },

    tired: {
        title: "Tired",
        icon: "😴",
        message:
            "You deserve a chance to slow down. What's been draining you lately?"
    },

    hopeful: {
        title: "Hopeful",
        icon: "🙂",
        message:
            "Hold onto that little bit of hope. What's helping you feel this way?"
    },

    overwhelmed: {
        title: "Overwhelmed",
        icon: "😵",
        message:
            "When everything feels like too much, we can take it one small thing at a time."
    },

    confused: {
        title: "Confused",
        icon: "😕",
        message:
            "It's okay not to have all the answers. What's feeling unclear right now?"
    },

    guilty: {
        title: "Guilty",
        icon: "😞",
        message:
            "Guilt can weigh heavily. You can take some time to understand what you're feeling."
    },

    insecure: {
        title: "Insecure",
        icon: "🫤",
        message:
            "You don't have to compare yourself to anyone here. What's making you doubt yourself?"
    },

    calm: {
        title: "Calm",
        icon: "😌",
        message:
            "It's nice to have a moment of calm. What's helping you feel this way?"
    },

    happy: {
        title: "Happy",
        icon: "😊",
        message:
            "It's good to have moments that feel lighter. What's behind this feeling?"
    },

    confident: {
        title: "Confident",
        icon: "😎",
        message:
            "It's good to recognize when you feel strong in yourself. What's contributing to that feeling?"
    },

    grateful: {
        title: "Grateful",
        icon: "🥰",
        message:
            "Gratitude can create meaningful moments. What are you appreciating right now?"
    }

};


/* ============================================================
   MOOD BUTTONS
   ============================================================ */

function setupMoodButtons() {

    const buttons =
        document.querySelectorAll(
            ".mood-btn"
        );


    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                /*
                 * Ignore See More.
                 */

                if (
                    this.id ===
                    "allEmotionsBtn"
                ) {
                    return;
                }


                const mood =
                    this.dataset.mood;


                if (!mood) {
                    return;
                }


                selectMood(mood);

            }
        );

    });

}


/* ============================================================
   SELECT MOOD
   ============================================================ */

function selectMood(mood) {

    selectedMood =
        String(mood)
            .trim()
            .toLowerCase();


    /*
     * The entire homepage remains visible.
     */

    showHomepageSections();


    /*
     * Remove selected state from every mood.
     */

    document
        .querySelectorAll(".mood-btn")
        .forEach(function (button) {

            button.classList.remove(
                "active",
                "selected"
            );

        });


    /*
     * Select the clicked mood.
     */

    document
        .querySelectorAll(
            `.mood-btn[data-mood="${CSS.escape(selectedMood)}"]`
        )
        .forEach(function (button) {

            button.classList.add(
                "active",
                "selected"
            );

        });


    /*
     * Update mood links.
     */

    updateMoodLinks();


    /*
     * Reload wall with this mood prioritized.
     */

    loadHomepageWallVoices();


    /*
     * Update support descriptions/links.
     */

    updateSupportContext();


    /*
     * Optional backend mood logging.
     */

    logMoodSelection();

}


/* ============================================================
   SEE MORE EMOTIONS
   ============================================================ */

function setupSeeMoreEmotions() {

    const button =
        document.getElementById(
            "allEmotionsBtn"
        );

    const extra =
        document.getElementById(
            "extraMoods"
        );


    if (!button || !extra) {
        return;
    }


    button.addEventListener(
        "click",
        function () {

            const currentlyHidden =
                extra.hasAttribute("hidden");


            if (currentlyHidden) {

                extra.removeAttribute(
                    "hidden"
                );

                button.classList.add(
                    "expanded"
                );

                const icon =
                    button.querySelector(
                        ".mood-emoji"
                    );

                const text =
                    button.querySelector(
                        "span:last-child"
                    );


                if (icon) {
                    icon.textContent = "−";
                }

                if (text) {
                    text.textContent =
                        "Show Less";
                }

            }

            else {

                extra.setAttribute(
                    "hidden",
                    ""
                );

                button.classList.remove(
                    "expanded"
                );

                const icon =
                    button.querySelector(
                        ".mood-emoji"
                    );

                const text =
                    button.querySelector(
                        "span:last-child"
                    );


                if (icon) {
                    icon.textContent = "+";
                }

                if (text) {
                    text.textContent =
                        "See More";
                }

            }

        }
    );

}


/* ============================================================
   THOUGHT BOX
   ============================================================ */

function setupThoughtBox() {

    const textarea =
        document.getElementById(
            "moodThought"
        );

    const counter =
        document.getElementById(
            "moodCounter"
        );


    if (!textarea) {
        return;
    }


    textarea.addEventListener(
        "input",
        function () {

            moodThought =
                this.value;


            if (counter) {

                counter.textContent =
                    `${this.value.length} / 2000`;

            }

        }
    );

}


/* ============================================================
   CONTEXT OPTIONS
   ============================================================ */

function setupContextOptions() {

    const options =
        document.querySelectorAll(
            ".context-option"
        );


    options.forEach(function (option) {

        option.addEventListener(
            "click",
            function () {

                selectedContext =
                    this.dataset.context ||
                    "general";


                options.forEach(
                    function (item) {

                        item.classList.remove(
                            "active",
                            "selected"
                        );

                    }
                );


                this.classList.add(
                    "active",
                    "selected"
                );


                /*
                 * Update links because context changed.
                 */

                updateMoodLinks();


                /*
                 * Re-prioritize community stories.
                 */

                loadHomepageWallVoices();

            }
        );

    });


    /*
     * General is the default category.
     */

    const general =
        document.querySelector(
            '.context-option[data-context="general"]'
        );


    if (general) {

        general.classList.add(
            "active",
            "selected"
        );

    }

}


/* ============================================================
   PRIVACY OPTIONS
   ============================================================ */

function setupPrivacyOptions() {

    const options =
        document.querySelectorAll(
            ".privacy-option"
        );


    options.forEach(function (option) {

        option.addEventListener(
            "click",
            function () {

                selectedPrivacyOption =
                    this.dataset.option || "";


                options.forEach(
                    function (item) {

                        item.classList.remove(
                            "active",
                            "selected"
                        );

                    }
                );


                this.classList.add(
                    "active",
                    "selected"
                );


                updateActionButton();
                console.log(
    "Selected privacy option:",
    selectedPrivacyOption
);
            }
        );

    });

}


/* ============================================================
   ACTION BUTTON
   ============================================================ */
/* ============================================================
   EXISTING ACTION BUTTON
   ============================================================ */

function createActionButton() {

    const button =
        document.getElementById(
            "submitMoodPost"
        );

    if (!button) {
        return;
    }

    /*
     * Use the button already present in the HTML.
     * Do not create another button dynamically.
     */

    if (
        button.dataset.listenerAttached ===
        "true"
    ) {
        return;
    }

    button.dataset.listenerAttached =
        "true";

    button.addEventListener(
        "click",
        handleMoodAction
    );

}


/* ============================================================
   UPDATE ACTION BUTTON
   ============================================================ */

/* ============================================================
   UPDATE ACTION BUTTON
   ============================================================ */

function updateActionButton() {

    const button =
        document.getElementById(
            "submitMoodPost"
        );

    if (!button) {
        return;
    }


    if (
        selectedPrivacyOption ===
        "private"
    ) {

        button.innerHTML =
            `Save privately
             <i class="fa-solid fa-lock"></i>`;

    }

    else if (
        selectedPrivacyOption ===
        "anonymous"
    ) {

        button.innerHTML =
            `Share with community
             <i class="fa-solid fa-arrow-right"></i>`;

    }

    else if (
        selectedPrivacyOption ===
        "similar"
    ) {

        button.innerHTML =
            `See similar stories
             <i class="fa-solid fa-users"></i>`;

    }

    else {

        button.innerHTML =
            `Choose an option
             <i class="fa-solid fa-arrow-right"></i>`;

    }

}


/* ============================================================
   HANDLE MOOD ACTION
   ============================================================ */

/* ============================================================
   HANDLE MOOD ACTION
   ============================================================ */

async function handleMoodAction() {

    if (!selectedMood) {

        showNotification(
            "Choose how you're feeling first."
        );

        return;
    }


    if (!selectedPrivacyOption) {

        showNotification(
            "Choose what you'd like to do with your thought."
        );

        return;
    }


    const thought =
        moodThought.trim();


    const context =
        selectedContext ||
        "general";


    /* ========================================================
       KEEP PRIVATE
       ======================================================== */

    if (
        selectedPrivacyOption ===
        "private"
    ) {

        if (!thought) {

            showNotification(
                "Please write something before saving privately."
            );

            const textarea =
                document.getElementById(
                    "moodThought"
                );

            if (textarea) {
                textarea.focus();
            }

            return;
        }


        /*
         * Save locally for the private journal.
         * This is NOT sent to the public wall.
         */

        localStorage.setItem(
            "mindspeak_private_thought",
            thought
        );


        const mood =
            encodeURIComponent(
                selectedMood
            );

        const encodedContext =
            encodeURIComponent(
                context
            );

        const encodedThought =
            encodeURIComponent(
                thought
            );


        window.location.href =
            `journal/journal.html?mood=${mood}&context=${encodedContext}&thought=${encodedThought}`;

        return;

    }


    /* ========================================================
       SEE MORE STORIES AS YOURS
       ======================================================== */

    if (
        selectedPrivacyOption ===
        "similar"
    ) {

        const mood =
            encodeURIComponent(
                selectedMood
            );

        const encodedContext =
            encodeURIComponent(
                context
            );


        window.location.href =
            `safe-space.html?mood=${mood}&context=${encodedContext}`;

        return;

    }


    /* ========================================================
       SHARE WITH COMMUNITY
       ======================================================== */

    if (
        selectedPrivacyOption ===
        "anonymous"
    ) {

        await submitCommunityPost();

        return;
    }

}


/* ============================================================
   SUBMIT COMMUNITY POST
   ============================================================ */

async function submitCommunityPost() {

    const thought =
        moodThought.trim();


    if (!thought) {

        showNotification(
            "Please write something before sharing."
        );

        const textarea =
            document.getElementById(
                "moodThought"
            );

        if (textarea) {
            textarea.focus();
        }

        return;

    }


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showNotification(
            "Please log in before sharing with the community."
        );

        return;

    }


    const button =
        document.getElementById(
  "submitMoodPost" 
        );


    const originalHTML =
        button
            ? button.innerHTML
            : "";


    if (button) {

        button.disabled =
            true;

        button.innerHTML =
            "Sharing...";

    }


    try {

        const response =
            await fetch(
                API_URL +
                "/posts/submit",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            content:
                                thought,

                            mood:
                                selectedMood,

                            category:
    getBackendCategory(
        selectedContext
    ),
                            session_token:
                                sessionToken

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to share your thought."
            );

        }


        showNotification(
            "Your thought was shared with the community."
        );


        /*
         * Clear composer.
         */

        const textarea =
            document.getElementById(
                "moodThought"
            );


        if (textarea) {

            textarea.value = "";

        }


        moodThought =
            "";


        const counter =
            document.getElementById(
                "moodCounter"
            );


        if (counter) {

            counter.textContent =
                "0 / 2000";

        }


        /*
         * Reload real wall data.
         */

        await loadHomepageWallVoices();


    }

    catch (error) {

        console.error(
            "Homepage post submission error:",
            error
        );


        showNotification(
            error.message ||
            "Something went wrong while sharing."
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

            button.innerHTML =
                originalHTML;

        }

    }

}

/* ============================================================
   FRONTEND → BACKEND CATEGORY
   ============================================================ */

function getBackendCategory(context) {

    const categoryMap = {

        general:
            "General",

        academic:
            "Academic Pressure",

        anxiety:
            "Anxiety",

        relationships:
            "Relationships",

        family:
            "Family",

        self:
            "Self-Growth",

        others:
            "Other"

    };


    return (
        categoryMap[
            String(context || "")
                .trim()
                .toLowerCase()
        ] ||
        "General"
    );

}
/* ============================================================
   MOOD LINKS
   ============================================================ */

function updateMoodLinks() {

    const mood =
        encodeURIComponent(
            selectedMood || ""
        );


    const context =
        encodeURIComponent(
            selectedContext || ""
        );


    /*
     * Wall
     */

    const wallLink =
        document.getElementById(
            "viewMoodPosts"
        );


    if (wallLink) {

        wallLink.href =
            selectedMood
                ? `safe-space.html?mood=${mood}&context=${context}`
                : "safe-space.html";


        const text =
            document.getElementById(
                "viewMoodPostsText"
            );


        if (text) {

            text.textContent =
                selectedMood
                    ? `View all ${selectedMood} posts`
                    : "View all posts";

        }

    }


    /*
     * Chatbot
     */

    document
        .querySelectorAll(
            ".chatbot-action"
        )
        .forEach(function (link) {

            link.href =
                selectedMood
                    ? `chatbot/chatbot.html?mood=${mood}&category=${context}`
                    : "chatbot/chatbot.html";

        });


    /*
     * Mentor
     */

    document
        .querySelectorAll(
            ".mentor-action"
        )
        .forEach(function (link) {

            link.href =
                selectedMood
                    ? `mentor/mentor-support.html?mood=${mood}&category=${context}`
                    : "mentor/mentor-support.html";

        });


    /*
     * Toolkit
     */

    document
        .querySelectorAll(
            ".toolkit-action"
        )
        .forEach(function (link) {

            link.href =
                selectedMood
                    ? `Toolkit/toolkit.html?mood=${mood}&category=${context}`
                    : "Toolkit/toolkit.html";

        });


    /*
     * Connection
     */

    document
        .querySelectorAll(
            ".connection-action"
        )
        .forEach(function (link) {

            link.href =
                selectedMood
                    ? `connection/connection-hub.html?mood=${mood}&category=${context}`
                    : "connection/connection-hub.html";

        });

}


/* ============================================================
   SUPPORT CONTEXT
   ============================================================ */

function updateSupportContext() {

    const supportText =
        document.querySelector(
            "#supportSection .section-heading p"
        );


    if (
        supportText &&
        selectedMood
    ) {

        supportText.textContent =
            `Practical tools based on how you're feeling about ${selectedMood}.`;

    }

}


/* ============================================================
   LOG MOOD
   ============================================================ */

async function logMoodSelection() {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken || !selectedMood) {
        return;
    }


    try {

        const response =
            await fetch(
                API_URL +
                "/analytics/log-mood",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            mood:
                                selectedMood,

                            session_token:
                                sessionToken

                        })

                }
            );


        if (!response.ok) {

            console.warn(
                "Mood logging failed."
            );

        }

    }

    catch (error) {

        /*
         * Mood logging must NEVER break the homepage.
         */

        console.warn(
            "Mood logging unavailable:",
            error
        );

    }

}


/* ============================================================
   WALL — LOAD REAL POSTS
   ============================================================ */

async function loadHomepageWallVoices() {

    const container =
        document.getElementById(
            "similarPostsContainer"
        );

    const emptyState =
        document.getElementById(
            "wallEmpty"
        );


    if (!container) {
        return;
    }


    /*
     * Show a neutral loading state.
     */

    container.innerHTML =
        `
            <div class="wall-empty">
                <div class="empty-wall-icon">💚</div>
                <h3>Loading community voices...</h3>
                <p>Finding stories from the MindSpeak community.</p>
            </div>
        `;


    if (emptyState) {
        emptyState.hidden = true;
    }


    try {

        const sessionToken =
            localStorage.getItem(
                "session_token"
            );


        let url =
            API_URL +
            "/posts/approved";


        if (sessionToken) {

            url +=
                "?session_token=" +
                encodeURIComponent(
                    sessionToken
                );

        }


        const response =
            await fetch(url);


        if (!response.ok) {

            throw new Error(
                `Community wall returned ${response.status}.`
            );

        }


        let posts =
            await response.json();


        if (!Array.isArray(posts)) {
            posts = [];
        }


        /*
         * Save globally.
         */

        homepagePosts =
            posts;

        window.mindspeakHomepagePosts =
            posts;


        /*
         * Prioritize based on selected mood/context.
         *
         * 1. Same mood + same category
         * 2. Same mood
         * 3. Same category
         * 4. Everything else
         *
         * We do NOT remove other posts.
         */

        posts =
            sortHomepagePosts(posts);


        /*
         * Homepage preview = maximum 3.
         */

        const previewPosts =
            posts.slice(0, 3);


        if (!previewPosts.length) {

            container.innerHTML =
                "";

            if (emptyState) {

                emptyState.hidden =
                    false;

            }

            return;

        }


        if (emptyState) {

            emptyState.hidden =
                true;

        }


        container.innerHTML =
            previewPosts
                .map(
                    createHomepagePostCard
                )
                .join("");


    }

    catch (error) {

        console.error(
            "Error loading homepage Wall:",
            error
        );


        /*
         * IMPORTANT:
         * No fake post.
         *
         * The rest of the homepage continues
         * working normally.
         */

        container.innerHTML =
            `
                <div class="wall-empty">
                    <div class="empty-wall-icon">💚</div>
                    <h3>Community voices are unavailable right now</h3>
                    <p>
                        We couldn't connect to the community wall.
                        Please try again in a moment.
                    </p>
                </div>
            `;

    }

}


/* ============================================================
   SORT WALL POSTS
   ============================================================ */

function sortHomepagePosts(posts) {

    const mood =
        normalizeValue(
            selectedMood
        );

    const context =
        normalizeCategory(
            selectedContext
        );

    return posts

        .map(function (post, index) {

            const postMood =
                normalizeValue(
                    post.mood
                );

            const postCategory =
                normalizeCategory(
                    post.category
                );

            let score = 0;


            /* ==================================================
               1. SAME MOOD + SAME CATEGORY
            ================================================== */

            if (
                mood &&
                context &&
                postMood === mood &&
                postCategory === context
            ) {

                score += 1000;

            }


            /* ==================================================
               2. SAME MOOD
            ================================================== */

            else if (
                mood &&
                postMood === mood
            ) {

                score += 500;

            }


            /* ==================================================
               3. SAME CATEGORY
            ================================================== */

            else if (
                context &&
                postCategory === context
            ) {

                score += 250;

            }


            /* ==================================================
               4. EVERYTHING ELSE
            ================================================== */

            return {

                post: post,

                score: score,

                originalIndex: index

            };

        })


        .sort(function (a, b) {

            /* Higher relevance first */

            if (
                b.score !==
                a.score
            ) {

                return (
                    b.score -
                    a.score
                );

            }


            /* Newest post first */

            const dateA =
                new Date(
                    a.post.created_at || 0
                ).getTime();

            const dateB =
                new Date(
                    b.post.created_at || 0
                ).getTime();


            if (
                !Number.isNaN(dateA) &&
                !Number.isNaN(dateB)
            ) {

                return (
                    dateB -
                    dateA
                );

            }


            /* Keep original API order */

            return (
                a.originalIndex -
                b.originalIndex
            );

        })


        .map(function (item) {

            return item.post;

        });

}
/* ============================================================
   LOAD MY SAFETY RESPONSES
============================================================ */

async function loadMySafetyResponses() {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );

    if (!sessionToken) {
        return [];
    }

    try {

        const response =
            await fetch(
                API_URL +
                "/posts/my-safety-responses?session_token=" +
                encodeURIComponent(sessionToken)
            );

        if (!response.ok) {
            return [];
        }

        const data =
            await response.json();

        return Array.isArray(data.responses)
            ? data.responses
            : [];

    }

    catch (error) {

        console.error(
            "Safety responses error:",
            error
        );

        return [];

    }

}
/* ============================================================
   CREATE WALL CARD
   ============================================================ */

function createHomepagePostCard(post) {

    const id =
        Number(
            post.id
        );


    const nickname =
        escapeHTML(
            post.nickname ||
            post.student_nickname ||
            "Anonymous"
        );


    const avatar =
        escapeHTML(
            post.avatar ||
            post.student_avatar ||
            "🌱"
        );


    const content =
        escapeHTML(
            post.content ||
            ""
        );


    const mood =
        escapeHTML(
            formatMood(
                post.mood
            )
        );


    const category =
        escapeHTML(
            formatCategory(
                post.category
            )
        );


    const time =
        formatRelativeTime(
            post.created_at
        );


    const reactionCount =
        Number(
            post.reaction_count ||
            0
        );


    const reacted =
        Boolean(
            post.reacted
        );


    const warmResponse =
        escapeHTML(
            post.warm_response ||
            getWarmResponse(
                post.mood
            )
        );


    /*
     * IMPORTANT:
     * Only show Edit/Delete when this post
     * belongs to the currently logged-in user.
     *
     * The backend must ALSO verify ownership.
     */

    const ownerControls =
        post.is_owner === true
            ? `
                <div class="homepage-post-owner-actions">

                    <button
                        type="button"
                        class="homepage-post-edit-btn"
                        onclick="editHomepagePost(${id})"
                        title="Edit your post"
                        aria-label="Edit your post"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Edit
                    </button>


                    <button
                        type="button"
                        class="homepage-post-delete-btn"
                        onclick="deleteHomepagePost(${id})"
                        title="Delete your post"
                        aria-label="Delete your post"
                    >
                        <i class="fa-solid fa-trash"></i>
                        Delete
                    </button>

                </div>
            `
            : "";


    return `

        <article
            class="wall-card"
            data-post-id="${id}"
        >

            <div class="wall-card-header">

                <div class="wall-avatar">
                    ${avatar}
                </div>


                <div class="wall-user-info">

                    <strong>
                        ${nickname}
                    </strong>

                    <span class="wall-meta">
                        ${mood}
                        •
                        ${category}
                    </span>

                </div>


                <span class="wall-time">
                    ${time}
                </span>


                ${ownerControls}

            </div>


            <p class="wall-text">
                ${content}
            </p>


            <div class="warm-response">

                <div class="warm-response-logo">
                    🌿
                </div>


                <div class="warm-response-content">

                    <div class="warm-response-title">

                        MindSpeak

                        <span class="warm-response-badge">
                            Warm Response
                        </span>

                    </div>


                    <p>
                        ${warmResponse}
                        💚
                    </p>

                </div>

            </div>


            <div class="wall-actions">

                <!-- REACTION -->

                <button
                    class="reaction-button ${reacted ? "reacted" : ""}"
                    id="homepage-reaction-${id}"
                    type="button"
                    onclick="reactToHomepagePost(${id})"
                    aria-label="I feel this too"
                >

                    <span class="heart community-reaction-heart">
                        ${reacted ? "💚" : "♡"}
                    </span>

                    <span
                        id="homepage-reaction-count-${id}"
                    >
                        ${reactionCount}
                    </span>

                </button>


                <button
                    class="feel-button"
                    type="button"
                    onclick="reactToHomepagePost(${id})"
                >
                    I feel this too
                </button>


                <!-- COMMENTS -->

                <button
                    class="comment-button"
                    type="button"
                    onclick="toggleHomepageComments(${id})"
                    aria-label="View comments"
                >

                    <i class="fa-regular fa-comment"></i>

                    <span>
                        Comments
                    </span>

                    <span
                        class="homepage-comment-count"
                        id="homepage-comment-count-${id}"
                    >
                        0
                    </span>

                </button>

            </div>


            <!-- COMMENTS SECTION -->

            <div
                class="homepage-comments-section"
                id="homepage-comments-section-${id}"
                style="display: none;"
            >

                <div
                    class="homepage-comments-list"
                    id="homepage-comments-list-${id}"
                >

                    <div class="comments-loading">
                        Loading comments...
                    </div>

                </div>


                <form
                    class="homepage-comment-form"
                    onsubmit="submitHomepageComment(event, ${id})"
                >

                    <textarea
                        id="homepage-comment-input-${id}"
                        class="homepage-comment-input"
                        maxlength="1000"
                        rows="2"
                        placeholder="Write a supportive comment..."
                        required
                    ></textarea>


                    <button
                        type="submit"
                        id="homepage-comment-submit-${id}"
                        class="homepage-comment-submit"
                    >

                        <i class="fa-solid fa-paper-plane"></i>

                        Post Comment

                    </button>

                </form>

            </div>


        </article>

    `;

}

/* ============================================================
   EDIT OWN HOMEPAGE POST
============================================================ */

async function editHomepagePost(postId) {

    const post =
        homepagePosts.find(
            function (item) {

                return Number(item.id) === Number(postId);

            }
        );


    if (!post) {

        showNotification(
            "Post could not be found."
        );

        return;

    }


    /*
     * Extra frontend ownership protection.
     */

    if (post.is_owner !== true) {

        showNotification(
            "You can only edit your own post."
        );

        return;

    }


    const currentContent =
        String(
            post.content || ""
        );


    const newContent =
        window.prompt(
            "Edit your post:",
            currentContent
        );


    /*
     * User pressed Cancel.
     */

    if (newContent === null) {
        return;
    }


    const content =
        newContent.trim();


    if (!content) {

        showNotification(
            "Post content cannot be empty."
        );

        return;

    }


    if (content.length > 2000) {

        showNotification(
            "Post cannot be longer than 2000 characters."
        );

        return;

    }


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showNotification(
            "Please log in again."
        );

        return;

    }


    try {

        const response =
            await fetch(
                API_URL +
                "/posts/" +
                postId +
                "/edit",
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            content:
                                content,

                            mood:
                                post.mood || "",

                            category:
                                post.category || "",

                            session_token:
                                sessionToken

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to edit your post."
            );

        }


        showNotification(
            "Your post was updated."
        );


        /*
         * Reload homepage wall so the
         * edited content appears immediately.
         */

        await loadHomepageWallVoices();

    }


    catch (error) {

        console.error(
            "Homepage post edit error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to edit your post."
        );

    }

}

/* ============================================================
   DELETE OWN HOMEPAGE POST
============================================================ */

async function deleteHomepagePost(postId) {

    const post =
        homepagePosts.find(
            function (item) {

                return Number(item.id) === Number(postId);

            }
        );


    if (!post) {

        showNotification(
            "Post could not be found."
        );

        return;

    }


    /*
     * Extra frontend ownership protection.
     */

    if (post.is_owner !== true) {

        showNotification(
            "You can only delete your own post."
        );

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete this post?"
        );


    if (!confirmed) {
        return;
    }


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showNotification(
            "Please log in again."
        );

        return;

    }


    try {

        const response =
            await fetch(
                API_URL +
                "/posts/" +
                postId,
                {

                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            session_token:
                                sessionToken

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to delete your post."
            );

        }


        showNotification(
            "Your post was deleted."
        );


        /*
         * Remove it from local state.
         */

        homepagePosts =
            homepagePosts.filter(
                function (item) {

                    return Number(item.id) !==
                        Number(postId);

                }
            );


        window.mindspeakHomepagePosts =
            homepagePosts;


        /*
         * Reload the wall.
         */

        await loadHomepageWallVoices();

    }


    catch (error) {

        console.error(
            "Homepage post delete error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to delete your post."
        );

    }

}


/* ============================================================
   REACT TO POST
   ============================================================ */

async function reactToHomepagePost(postId) {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showNotification(
            "Please log in to react to a post."
        );

        return;

    }


    const button =
        document.getElementById(
            "homepage-reaction-" +
            postId
        );


    if (!button) {
        return;
    }


    const heart =
        button.querySelector(
            ".community-reaction-heart"
        );


    const count =
        document.getElementById(
            "homepage-reaction-count-" +
            postId
        );


    button.disabled =
        true;


    try {

        const response =
            await fetch(
                API_URL +
                "/posts/" +
                postId +
                "/react",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            session_token:
                                sessionToken

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to update reaction."
            );

        }


        if (count) {

            count.textContent =
                Number(
                    data.reaction_count ||
                    0
                );

        }


        if (data.reacted) {

            button.classList.add(
                "reacted"
            );

            if (heart) {
                heart.textContent =
                    "💚";
            }

        }

        else {

            button.classList.remove(
                "reacted"
            );

            if (heart) {
                heart.textContent =
                    "♡";
            }

        }


        /*
         * Keep local state synchronized.
         */

        const post =
            homepagePosts.find(
                function (item) {

                    return Number(
                        item.id
                    ) === Number(
                        postId
                    );

                }
            );


        if (post) {

            post.reaction_count =
                data.reaction_count;

            post.reacted =
                data.reacted;

        }

    }

    catch (error) {

        console.error(
            "Homepage reaction error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to update reaction."
        );

    }

    finally {

        button.disabled =
            false;

    }

}


/* ============================================================
   OPEN POST IN SAFE SPACE
   ============================================================ */

function openPostOnWall(postId) {

    const post =
        homepagePosts.find(
            function (item) {

                return Number(
                    item.id
                ) === Number(
                    postId
                );

            }
        );


    if (!post) {

        window.location.href =
            "safe-space.html";

        return;

    }


    const mood =
        encodeURIComponent(
            post.mood ||
            ""
        );


    const category =
        encodeURIComponent(
            post.category ||
            ""
        );


    window.location.href =
        `safe-space.html?mood=${mood}&context=${category}&post=${postId}`;

}


/* ============================================================
   WARM RESPONSE
   ============================================================ */

function getWarmResponse(mood) {

    const responses = {

        anxious:
            "It's understandable to feel this way. You're not alone in it.",

        stressed:
            "It sounds like you're carrying a lot. It's okay to take things one step at a time.",

        "low-mood":
            "What you're feeling matters. You don't have to go through it alone.",

        lonely:
            "Feeling alone can be difficult. You're worthy of connection and support.",

        angry:
            "Your feelings are valid. Taking a pause can sometimes create space to understand them.",

        numb:
            "You don't have to find the perfect words. It's okay to simply acknowledge how you feel.",

        tired:
            "You've been carrying something. Remember that rest is important too.",

        hopeful:
            "It's good to notice even a small sense of hope. Hold onto what helps.",

        overwhelmed:
            "You don't have to handle everything at once. One small step is enough.",

        confused:
            "It's okay not to have everything figured out. Give yourself time.",

        guilty:
            "Be gentle with yourself while you work through what happened.",

        insecure:
            "You deserve kindness from yourself too. You don't have to compare your journey.",

        calm:
            "It's good to have moments of calm. Take time to appreciate this feeling.",

        happy:
            "It's wonderful to have lighter moments. You deserve them.",

        confident:
            "It's good to recognize your own strength. Keep building on it.",

        grateful:
            "It's beautiful to notice the things that matter to you."

    };


    return (
        responses[
            normalizeValue(mood)
        ] ||
        "You're not alone in what you're feeling. Thank you for sharing."
    );

}


/* ============================================================
   LIBRARY — REAL BLOG DATA
   ============================================================ */

async function loadHomepageLibrary() {

    const container =
        document.getElementById(
            "libraryPreview"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        `
            <div class="library-loading">
                Loading MindSpeak Library...
            </div>
        `;


    try {

        const response =
            await fetch(
                API_URL +
                "/blogs/"
            );


        if (!response.ok) {

            throw new Error(
                `Library returned ${response.status}.`
            );

        }


        const data =
            await response.json();


        const blogs =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(
                        data.blogs
                    )
                        ? data.blogs
                        : []
                );


        if (!blogs.length) {

            container.innerHTML =
                `
                    <div class="library-loading">
                        No library articles available right now.
                    </div>
                `;

            return;

        }


        const latestBlogs =
            blogs.slice(
                0,
                3
            );


        container.innerHTML =
            latestBlogs
                .map(
                    createHomepageBlogCard
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Error loading homepage library:",
            error
        );


        container.innerHTML =
            `
                <div class="library-loading">
                    MindSpeak Library is temporarily unavailable.
                </div>
            `;

    }

}


/* ============================================================
   BLOG CARD
   ============================================================ */

function createHomepageBlogCard(blog) {

    const title =
        escapeHTML(
            blog.title ||
            "MindSpeak Article"
        );


    const category =
        escapeHTML(
            blog.category ||
            "Mind & Wellbeing"
        );


    const rawContent =
        stripHTML(
            blog.content ||
            blog.excerpt ||
            ""
        );


    const excerpt =
        escapeHTML(
            rawContent.length > 105
                ? rawContent.substring(
                    0,
                    105
                ) + "..."
                : rawContent
        );


    const image =
        getBlogImage(
            blog
        );


    const id =
        encodeURIComponent(
            blog.id
        );


    return `

        <article class="library-card">

            <div class="library-card-image">

                <img
                    src="${escapeAttribute(image)}"
                    alt="${escapeAttribute(title)}"
                    loading="lazy"
                    onerror="this.src='images/Blogs/overthinking.jpg'"
                >

            </div>


            <div class="library-card-content">

                <span class="library-type">
                    ${category}
                </span>


                <h3>
                    ${title}
                </h3>


                <p>
                    ${excerpt}
                </p>


                <a
                    href="blog-details.html?id=${id}"
                    class="library-read-link"
                >
                    Read More
                    <i class="fa-solid fa-arrow-right"></i>
                </a>

            </div>

        </article>

    `;

}


/* ============================================================
   BLOG IMAGE
   ============================================================ */

function getBlogImage(blog) {

    if (
        blog.cover_image &&
        String(
            blog.cover_image
        ).trim()
    ) {

        let image =
            String(
                blog.cover_image
            ).trim();


        if (
            image.startsWith(
                "http://"
            ) ||
            image.startsWith(
                "https://"
            ) ||
            image.startsWith(
                "images/"
            ) ||
            image.startsWith("/")
        ) {

            return image;

        }


        return (
            "images/Blogs/" +
            image
        );

    }


    const category =
        String(
            blog.category ||
            ""
        ).toLowerCase();


    const categoryImages = {

        "mental health":
            "images/Blogs/overthinking.jpg",

        "self growth":
            "images/Blogs/selfgrowth.jpg",

        "relationships":
            "images/Blogs/relationships.jpg",

        "student life":
            "images/Blogs/student.jpg",

        "wellbeing":
            "images/Blogs/wellbeing.jpg",

        "personal stories":
            "images/Blogs/story.jpg"

    };


    return (
        categoryImages[category] ||
        "images/Blogs/overthinking.jpg"
    );

}


/* ============================================================
   EVENTS — REAL EVENT DATA
   ============================================================ */

async function loadHomepageEvents() {

    const container =
        document.getElementById(
            "eventsPreview"
        );


    if (!container) {
        return;
    }


    container.innerHTML =
        `
            <div class="library-loading">
                Loading upcoming events...
            </div>
        `;


    try {

        const response =
            await fetch(
                API_URL +
                "/events/"
            );


        if (!response.ok) {

            throw new Error(
                `Events returned ${response.status}.`
            );

        }


        const data =
            await response.json();


        const events =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(
                        data.events
                    )
                        ? data.events
                        : []
                );


        if (!events.length) {

            container.innerHTML =
                `
                    <div class="library-loading">
                        No upcoming events right now.
                    </div>
                `;

            return;

        }


        const upcoming =
            events
                .filter(
                    isUpcomingEvent
                )
                .slice(
                    0,
                    2
                );


        const displayEvents =
            upcoming.length
                ? upcoming
                : events.slice(
                    0,
                    2
                );


        container.innerHTML =
            displayEvents
                .map(
                    createHomepageEventCard
                )
                .join("");

    }

    catch (error) {

        console.error(
            "Error loading homepage events:",
            error
        );


        container.innerHTML =
            `
                <div class="library-loading">
                    Upcoming Events are temporarily unavailable.
                </div>
            `;

    }

}


/* ============================================================
   EVENT CARD
   ============================================================ */

function createHomepageEventCard(event) {

    const dateValue =
        event.event_date ||
        event.date ||
        event.start_date ||
        event.start_time;


    const date =
        dateValue
            ? new Date(dateValue)
            : null;


    let month = "";
    let day = "";
    let time = "";


    if (
        date &&
        !Number.isNaN(
            date.getTime()
        )
    ) {

        month =
            date
                .toLocaleDateString(
                    "en-US",
                    {
                        month: "short"
                    }
                )
                .toUpperCase();


        day =
            date
                .toLocaleDateString(
                    "en-US",
                    {
                        day: "2-digit"
                    }
                );


        time =
            date
                .toLocaleTimeString(
                    "en-US",
                    {
                        hour: "numeric",
                        minute: "2-digit"
                    }
                );

    }


    const title =
        escapeHTML(
            event.title ||
            "MindSpeak Event"
        );


    const location =
        escapeHTML(
            event.location ||
            "Online"
        );


    const id =
        encodeURIComponent(
            event.id
        );


    return `

        <article class="event-card">

            <div class="event-date">

                <span class="event-month">
                    ${month || "DATE"}
                </span>

                <strong class="event-day">
                    ${day || "—"}
                </strong>

            </div>


            <div class="event-content">

                <h3>
                    ${title}
                </h3>


                <div class="event-details">

                    <span>
                        <i class="fa-regular fa-clock"></i>
                        ${time || "Time TBA"}
                    </span>


                    <span>
                        <i class="fa-solid fa-location-dot"></i>
                        ${location}
                    </span>

                </div>


                <a
                    href="events/events.html?id=${id}"
                    class="event-button"
                >
                    View Event
                </a>

            </div>

        </article>

    `;

}


/* ============================================================
   UPCOMING EVENT CHECK
   ============================================================ */

function isUpcomingEvent(event) {

    const value =
        event.event_date ||
        event.date ||
        event.start_date ||
        event.start_time;


    if (!value) {
        return true;
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return true;

    }


    return date >= new Date();

}


/* ============================================================
   NOTIFICATION
   ============================================================ */

function showNotification(message) {

    const notification =
        document.getElementById(
            "homeNotification"
        );


    if (!notification) {

        alert(message);

        return;

    }


    notification.textContent =
        message;


    notification.classList.add(
        "show"
    );


    clearTimeout(
        window.mindSpeakNotificationTimer
    );


    window.mindSpeakNotificationTimer =
        setTimeout(
            function () {

                notification.classList.remove(
                    "show"
                );

            },
            3500
        );

}


/* ============================================================
   NORMALIZE VALUE
   ============================================================ */

function normalizeValue(value) {

    return String(
        value ||
        ""
    )
        .trim()
        .toLowerCase()
        .replace(
            /[_\s]+/g,
            "-"
        );

}


/* ============================================================
   NORMALIZE CATEGORY
   ============================================================ */

function normalizeCategory(value) {

    const category =
        normalizeValue(
            value
        );


    const map = {

        "general":
            "general",

        "academic":
            "academic",

        "academic-pressure":
            "academic",

        "anxiety":
            "anxiety",

        "relationships":
            "relationships",

        "relationship":
            "relationships",

        "family":
            "family",

        "self":
            "self",

        "self-growth":
            "self",

        "identity-personal":
            "self",

        "others":
            "others",

        "other":
            "others",

        "loneliness":
            "others",

        "stress":
            "others"

    };


    return (
        map[category] ||
        category
    );

}


/* ============================================================
   FORMAT CATEGORY
   ============================================================ */

function formatCategory(value) {

    const normalized =
        normalizeCategory(
            value
        );


    const names = {

        general:
            "General",

        academic:
            "Academic",

        anxiety:
            "Anxiety",

        relationships:
            "Relationships",

        family:
            "Family",

        self:
            "Self",

        others:
            "Others"

    };


    return (
        names[normalized] ||
        String(
            value ||
            "General"
        )
    );

}


/* ============================================================
   FORMAT MOOD
   ============================================================ */

function formatMood(value) {

    const mood =
        normalizeValue(
            value
        );


    const names = {

        "low-mood":
            "Low Mood",

        anxious:
            "Anxious",

        stressed:
            "Stressed",

        lonely:
            "Lonely",

        angry:
            "Angry",

        numb:
            "Numb",

        tired:
            "Tired",

        hopeful:
            "Hopeful",

        overwhelmed:
            "Overwhelmed",

        confused:
            "Confused",

        guilty:
            "Guilty",

        insecure:
            "Insecure",

        calm:
            "Calm",

        happy:
            "Happy",

        confident:
            "Confident",

        grateful:
            "Grateful"

    };


    return (
        names[mood] ||
        String(
            value ||
            "Community"
        )
    );

}


/* ============================================================
   RELATIVE TIME
   ============================================================ */

function formatRelativeTime(value) {

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


    if (difference < 0) {
        return "Just now";
    }


    const seconds =
        Math.floor(
            difference /
            1000
        );


    if (seconds < 60) {
        return "Just now";
    }


    const minutes =
        Math.floor(
            seconds /
            60
        );


    if (minutes < 60) {

        return (
            minutes +
            (
                minutes === 1
                    ? " minute ago"
                    : " minutes ago"
            )
        );

    }


    const hours =
        Math.floor(
            minutes /
            60
        );


    if (hours < 24) {

        return (
            hours +
            (
                hours === 1
                    ? " hour ago"
                    : " hours ago"
            )
        );

    }


    const days =
        Math.floor(
            hours /
            24
        );


    if (days < 7) {

        return (
            days +
            (
                days === 1
                    ? " day ago"
                    : " days ago"
            )
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


/* ============================================================
   STRIP HTML
   ============================================================ */

function stripHTML(value) {

    const element =
        document.createElement(
            "div"
        );


    element.innerHTML =
        String(
            value ||
            ""
        );


    return (
        element.textContent ||
        element.innerText ||
        ""
    );

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHTML(value) {

    const element =
        document.createElement(
            "div"
        );


    element.textContent =
        String(
            value ||
            ""
        );


    return element.innerHTML;

}


/* ============================================================
   ESCAPE ATTRIBUTE
   ============================================================ */

function escapeAttribute(value) {

    return escapeHTML(
        value
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
/* ============================================================
   HOMEPAGE COMMENTS
============================================================ */

async function toggleHomepageComments(postId) {

    const commentsSection =
        document.getElementById(
            "homepage-comments-section-" + postId
        );

    if (!commentsSection) {

        console.error(
            "Homepage comments section not found:",
            postId
        );

        return;
    }


    const isHidden =
        commentsSection.style.display === "none" ||
        commentsSection.style.display === "";


    if (isHidden) {

        commentsSection.style.display = "block";


        if (
            commentsSection.dataset.loaded !== "true"
        ) {

            await loadHomepageComments(postId);

        }

    } else {

        commentsSection.style.display = "none";

    }

}


/* ============================================================
   LOAD HOMEPAGE COMMENTS
============================================================ */

async function loadHomepageComments(postId) {

    const commentsList =
        document.getElementById(
            "homepage-comments-list-" + postId
        );


    if (!commentsList) {
        return;
    }


    commentsList.innerHTML = `
        <div class="comments-loading">
            Loading comments...
        </div>
    `;


    try {

        let url =
            API_URL +
            "/posts/" +
            postId +
            "/comments";


        const sessionToken =
            localStorage.getItem(
                "session_token"
            );


        if (sessionToken) {

            url +=
                "?session_token=" +
                encodeURIComponent(
                    sessionToken
                );

        }


        const response =
            await fetch(url);


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to load comments."
            );

        }


        const comments =
            Array.isArray(data)
                ? data
                : Array.isArray(data.comments)
                    ? data.comments
                    : [];


        renderHomepageComments(
            postId,
            comments
        );


        const commentsSection =
            document.getElementById(
                "homepage-comments-section-" +
                postId
            );


        if (commentsSection) {

            commentsSection.dataset.loaded =
                "true";

        }


        const countElement =
            document.getElementById(
                "homepage-comment-count-" +
                postId
            );


        if (countElement) {

            countElement.textContent =
                comments.length;

        }

    }

    catch (error) {

        console.error(
            "Homepage comments loading error:",
            error
        );


        commentsList.innerHTML = `
            <div class="comments-error">
                Unable to load comments right now.
            </div>
        `;

    }

}


/* ============================================================
   RENDER HOMEPAGE COMMENTS
============================================================ */

function renderHomepageComments(
    postId,
    comments
) {

    const commentsList =
        document.getElementById(
            "homepage-comments-list-" +
            postId
        );


    if (!commentsList) {
        return;
    }


    if (
        !comments ||
        comments.length === 0
    ) {

        commentsList.innerHTML = `
            <div class="comments-empty">
                No comments yet.
                Be the first to say something supportive. 💚
            </div>
        `;

        return;

    }


    commentsList.innerHTML =
        comments
            .map(function (comment) {

                const nickname =
                    escapeHTML(
                        comment.nickname ||
                        "Anonymous"
                    );


                const avatar =
                    escapeHTML(
                        comment.avatar ||
                        "🌱"
                    );


                const content =
                    escapeHTML(
                        comment.content ||
                        ""
                    );


                const time =
                    formatHomepageCommentTime(
                        comment.created_at
                    );


                return `
                    <div
                        class="homepage-comment"
                        data-comment-id="${comment.id}"
                    >

                        <div class="homepage-comment-avatar">
                            ${avatar}
                        </div>


                        <div class="homepage-comment-body">

                            <div class="homepage-comment-header">

                                <strong>
                                    ${nickname}
                                </strong>

                                <span>
                                    ${time}
                                </span>

                            </div>


                            <p>
                                ${content}
                            </p>

                        </div>

                    </div>
                `;

            })
            .join("");

}


/* ============================================================
   HOMEPAGE COMMENT TIME
============================================================ */

function formatHomepageCommentTime(
    dateValue
) {

    if (!dateValue) {
        return "";
    }


    const date =
        new Date(dateValue);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const now =
        new Date();


    const difference =
        Math.floor(
            (
                now.getTime() -
                date.getTime()
            ) / 1000
        );


    if (difference < 60) {
        return "Just now";
    }


    if (difference < 3600) {

        const minutes =
            Math.floor(
                difference / 60
            );


        return (
            minutes +
            (
                minutes === 1
                    ? " min ago"
                    : " mins ago"
            )
        );

    }


    if (difference < 86400) {

        const hours =
            Math.floor(
                difference / 3600
            );


        return (
            hours +
            (
                hours === 1
                    ? " hour ago"
                    : " hours ago"
            )
        );

    }


    const days =
        Math.floor(
            difference / 86400
        );


    if (days < 7) {

        return (
            days +
            (
                days === 1
                    ? " day ago"
                    : " days ago"
            )
        );

    }


    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );

}


/* ============================================================
   SUBMIT HOMEPAGE COMMENT
============================================================ */

async function submitHomepageComment(
    event,
    postId
) {

    event.preventDefault();


    const input =
        document.getElementById(
            "homepage-comment-input-" +
            postId
        );


    const submitButton =
        document.getElementById(
            "homepage-comment-submit-" +
            postId
        );


    if (!input) {
        return;
    }


    const content =
        input.value.trim();


    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    if (!sessionToken) {

        showNotification(
            "Please log in to comment on a post."
        );

        return;

    }


    if (!content) {

        input.focus();

        return;

    }


    if (submitButton) {

        submitButton.disabled = true;

        submitButton.innerHTML =
            "Posting...";

    }


    try {

        const response =
            await fetch(
                API_URL +
                "/posts/" +
                postId +
                "/comments",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            content:
                                content,

                            session_token:
                                sessionToken

                        })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to post comment."
            );

        }


        input.value = "";


        const commentsSection =
            document.getElementById(
                "homepage-comments-section-" +
                postId
            );


        if (commentsSection) {

            commentsSection.dataset.loaded =
                "false";

        }


        await loadHomepageComments(
            postId
        );

    }

    catch (error) {

        console.error(
            "Homepage comment submission error:",
            error
        );


        showNotification(
            error.message ||
            "Unable to post your comment right now."
        );

    }

    finally {

        if (submitButton) {

            submitButton.disabled =
                false;

            submitButton.innerHTML =
                '<i class="fa-solid fa-paper-plane"></i> Post Comment';

        }

    }

}

/* ============================================================
   PAGE INITIALIZATION
   ============================================================ */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
         * 1. Hero
         */

        updateHeroGreeting();


        /*
         * 2. ALL homepage sections visible.
         */

        showHomepageSections();


        /*
         * 3. Mood functionality
         */

        setupMoodButtons();

        setupSeeMoreEmotions();

        setupThoughtBox();

        setupContextOptions();

        setupPrivacyOptions();


        /*
         * 4. Create action button.
         */

        createActionButton();


        /*
         * 5. Initial links.
         */

        updateMoodLinks();


        /*
         * 6. Load REAL backend content independently.
         *
         * One failed API must not stop the others.
         */

        loadHomepageWallVoices();

        loadHomepageLibrary();

        loadHomepageEvents();


        console.log(
            "MindSpeak homepage initialized."
        );

    }
);


/* ============================================================
   UPDATE GREETING EVERY MINUTE
   ============================================================ */

setInterval(
    updateHeroGreeting,
    60000
);


