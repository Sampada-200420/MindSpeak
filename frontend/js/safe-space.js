/* ============================================================
   MINDSPEAK — SAFE SPACE
   COMMUNITY WALL
   Uses the SAME community posts as the homepage
============================================================ */

const API_URL = "http://127.0.0.1:8000";

let allPosts = [];
let filteredPosts = [];

let selectedMood = "";
let selectedCategory = "all";
let selectedSort = "latest";

window.mindspeakSafeSpacePosts = allPosts;


/* ============================================================
   INITIALIZATION
============================================================ */

document.addEventListener("DOMContentLoaded", function () {

    setupMoodFilters();

    setupCategoryFilters();

    setupSortFilters();

    setupMoreMoods();

    loadSafeSpaceFromURL();
     setupSafeSpaceToolkit();
    loadSafeSpacePosts();

});


/* ============================================================
   SESSION
============================================================ */

function getSessionToken() {

    return localStorage.getItem(
        "session_token"
    );

}


/* ============================================================
   ESCAPE HTML
============================================================ */

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


/* ============================================================
   ESCAPE ATTRIBUTE
============================================================ */

function escapeAttribute(value) {

    return escapeHTML(value)
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ============================================================
   NORMALIZE VALUE
============================================================ */

function normalizeValue(value) {

    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[_\s]+/g, "-");

}


/* ============================================================
   NORMALIZE CATEGORY

   The Safe Space has exactly 7 categories:

   General
   Academic
   Anxiety
   Relationships
   Family
   Self
   Others
============================================================ */

function normalizeCategory(value) {

    const category =
        normalizeValue(value);

    const map = {

        general: "general",

        academic: "academic",

        studies: "academic",

        "academic-pressure": "academic",

        anxiety: "anxiety",

        anxious: "anxiety",

        relationships: "relationships",

        relationship: "relationships",

        family: "family",

        self: "self",

        "self-growth": "self",

        "self-esteem": "self",

        other: "others",

        others: "others"

    };

    return map[category] || category;

}


/* ============================================================
   DISPLAY CATEGORY
============================================================ */

function formatCategory(value) {

    const category =
        normalizeCategory(value);

    const names = {

        general: "General",

        academic: "Academic",

        anxiety: "Anxiety",

        relationships: "Relationships",

        family: "Family",

        self: "Self",

        others: "Others"

    };

    return (
        names[category] ||
        String(value || "General")
    );

}


/* ============================================================
   DISPLAY MOOD
============================================================ */

function formatMood(value) {

    const mood =
        normalizeValue(value);

    const names = {

        anxious: "Anxious",

        stressed: "Stressed",

        sad: "Low",

        "low-mood": "Low",

        lonely: "Lonely",

        numb: "Numb",

        hopeful: "Hopeful",

        angry: "Angry",

        happy: "Happy",

        calm: "Calm",

        tired: "Tired",

        overwhelmed: "Overwhelmed",

        confused: "Confused",

        guilty: "Guilty",

        insecure: "Insecure",

        confident: "Confident",

        grateful: "Grateful"

    };

    return (
        names[mood] ||
        String(value || "Community")
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
        Math.floor(
            (
                now.getTime() -
                date.getTime()
            ) / 1000
        );

    if (difference < 60) {

        return "Just now";

    }

    const minutes =
        Math.floor(
            difference / 60
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
            minutes / 60
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
            hours / 24
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
   MOOD FILTERS
============================================================ */

function setupMoodFilters() {

    const buttons =
        document.querySelectorAll(
            ".safe-space-mood-btn"
        );

    buttons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                buttons.forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

                this.classList.add(
                    "active"
                );

                selectedMood =
                    this.dataset.safeSpaceMood ||
                    "";

                applySafeSpaceFilters();

            }
        );

    });

}


/* ============================================================
   MORE MOODS
============================================================ */

function setupMoreMoods() {

    const button =
        document.getElementById(
            "safeSpaceMoreMoods"
        );

    if (!button) {
        return;
    }

    button.addEventListener(
        "click",
        function () {

            /*
             * For now, More simply clears
             * the mood filter and shows all moods.
             */

            document
                .querySelectorAll(
                    ".safe-space-mood-btn"
                )
                .forEach(
                    function (item) {

                        item.classList.remove(
                            "active"
                        );

                    }
                );

            const allButton =
                document.querySelector(
                    '.safe-space-mood-btn[data-safe-space-mood=""]'
                );

            if (allButton) {

                allButton.classList.add(
                    "active"
                );

            }

            selectedMood = "";

            applySafeSpaceFilters();

        }
    );

}


/* ============================================================
   CATEGORY FILTERS

   Replace old categories in HTML dynamically so the page
   always uses the final 7 categories.
============================================================ */

function setupCategoryFilters() {

    const container =
        document.querySelector(
            ".safe-space-category-list"
        );

    if (!container) {
        return;
    }

    const categories = [

        {
            value: "all",
            label: "All Categories"
        },

        {
            value: "general",
            label: "General"
        },

        {
            value: "academic",
            label: "Academic"
        },

        {
            value: "anxiety",
            label: "Anxiety"
        },

        {
            value: "relationships",
            label: "Relationships"
        },

        {
            value: "family",
            label: "Family"
        },

        {
            value: "self",
            label: "Self"
        },

        {
            value: "others",
            label: "Others"
        }

    ];

    container.innerHTML =
        categories
            .map(function (category) {

                return `
                    <button
                        type="button"
                        class="safe-space-category-btn ${
                            category.value === "all"
                                ? "active"
                                : ""
                        }"
                        data-safe-space-category="${category.value}"
                    >
                        ${category.label}
                    </button>
                `;

            })
            .join("");

    container
        .querySelectorAll(
            ".safe-space-category-btn"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    container
                        .querySelectorAll(
                            ".safe-space-category-btn"
                        )
                        .forEach(
                            function (item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );

                    this.classList.add(
                        "active"
                    );

                    selectedCategory =
                        this.dataset.safeSpaceCategory ||
                        "all";

                    applySafeSpaceFilters();

                }
            );

        });

}


/* ============================================================
   SORT FILTERS

   Final options:
   - Most Liked
   - Latest
============================================================ */

function setupSortFilters() {

    const container =
        document.querySelector(
            ".safe-space-sort-list"
        );

    if (!container) {
        return;
    }

    container.innerHTML = `

        <button
            type="button"
            class="safe-space-sort-btn active"
            data-safe-space-sort="latest"
        >
            Latest
        </button>

        <button
            type="button"
            class="safe-space-sort-btn"
            data-safe-space-sort="liked"
        >
            Most Liked
        </button>

        <button
            type="button"
            class="safe-space-sort-btn"
            data-safe-space-sort="my-posts"
        >
            My Posts
        </button>

    `;

    container
        .querySelectorAll(
            ".safe-space-sort-btn"
        )
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    container
                        .querySelectorAll(
                            ".safe-space-sort-btn"
                        )
                        .forEach(
                            function (item) {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );

                    this.classList.add(
                        "active"
                    );

                    selectedSort =
                        this.dataset.safeSpaceSort ||
                        "latest";

                    applySafeSpaceFilters();

                }
            );

        });

}

/* ============================================================
   URL PARAMETERS

   Home can send:
   ?mood=anxious&context=academic&post=123

   Safe Space will use those values as the initial filter
   when explicitly provided.
============================================================ */
function loadSafeSpaceFromURL() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const mood =
        (
            params.get("mood") ||
            ""
        )
            .trim()
            .toLowerCase();

    const context =
        (
            params.get("context") ||
            ""
        )
            .trim()
            .toLowerCase();

    /*
     * Home can send a mood/context to Safe Space.
     *
     * We use the information only to highlight the
     * relevant starting filters.
     *
     * The user can then freely change Category and Sort.
     */

    if (context) {

        const normalized =
            normalizeCategory(context);

        selectedCategory =
            normalized;

        document
            .querySelectorAll(
                ".safe-space-category-btn"
            )
            .forEach(function (button) {

                button.classList.remove(
                    "active"
                );

            });

        const categoryButton =
            document.querySelector(
                `.safe-space-category-btn[data-safe-space-category="${normalized}"]`
            );

        if (categoryButton) {

            categoryButton.classList.add(
                "active"
            );

        }

    }

    /*
     * IMPORTANT:
     *
     * Do NOT set selectedMood from the URL.
     *
     * Otherwise:
     * safe-space.html?mood=lonely&context=anxiety
     *
     * would force:
     * Lonely + Anxiety
     *
     * and could produce 0 posts.
     *
     * Safe Space should show the community posts
     * according to the user's selected filters.
     */

    selectedMood = "";

    document
        .querySelectorAll(
            ".safe-space-mood-btn"
        )
        .forEach(function (button) {

            button.classList.remove(
                "active"
            );

        });
}
/* ============================================================
   PERSONALIZED TOOLKIT
============================================================ */

function setupSafeSpaceToolkit() {

    const title =
        document.getElementById(
            "safeSpaceToolkitTitle"
        );

    const description =
        document.getElementById(
            "safeSpaceToolkitDescription"
        );

    const button =
        document.getElementById(
            "safeSpaceToolkitButton"
        );
    const image =
    document.getElementById(
        "safeSpaceToolkitImage"
    );


    if (!title || !description || !button) {
        return;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );


    const mood =
        normalizeValue(
            params.get("mood")
        );


    const context =
        normalizeCategory(
            params.get("context")
        );


    /*
     * Default Toolkit
     */

    let toolkit = {
    title: "Your Toolkit",
    description:
        "Small tools for difficult moments.",
    page: "Toolkit/toolkit.html",
    image: "images/Toolkit/anxiety.jpg"
};

    /*
     * ========================================================
     * CONTEXT FIRST
     * ========================================================
     *
     * Academic situations should recommend
     * Study & Work even when the emotion is
     * anxiety or stress.
     */

    if (
        context === "academic"
    ) {

        toolkit = {
            title: "Your Study & Work Toolkit",
            description:
                "Practical tools for study pressure, deadlines, focus and academic stress.",
            page:
                "Toolkit/toolkit-study-work.html",
            image:
                "images/Toolkit/study&work.jpg"

            
        };

    }


    /*
     * ========================================================
     * MOOD-BASED TOOLKITS
     * ========================================================
     */

    else if (
        mood === "anxious" ||
        mood === "worried"
    ) {

        toolkit = {
            title: "Your Anxiety Toolkit",
            description:
                "Small tools to help you understand anxiety, calm your mind and feel more in control.",
            page:
                "Toolkit/toolkit-anxiety.html",
            image:
                "images/Toolkit/anxiety.jpg"

        };

    }


    else if (
        mood === "stressed" ||
        mood === "overwhelmed" ||
        mood === "angry"
    ) {

        toolkit = {
            title: "Your Stress & Burnout Toolkit",
            description:
                "Practical ways to manage pressure, overwhelm and emotional exhaustion.",
            page:
                "Toolkit/toolkit-stress.html",
            image:
                "images/Toolkit/stress&burnout.jpg"
        };

    }


    else if (
        mood === "sad" ||
        mood === "low-mood" ||
        mood === "lonely" ||
        mood === "numb" ||
        mood === "heartbroken" ||
        mood === "guilty"
    ) {

        toolkit = {
            title: "Your Low Mood Toolkit",
            description:
                "Gentle tools for difficult emotions, low energy and moments when things feel heavy.",
            page:
                "Toolkit/toolkit-low-mood.html",
            image:
                "images/Toolkit/lowmood.jpg"
        };

    }


    else if (
        mood === "tired"
    ) {

        toolkit = {
            title: "Your Sleep Toolkit",
            description:
                "Explore simple ways to improve rest, build healthier sleep habits and recharge.",
            page:
                "Toolkit/toolkit-sleep.html",
            image:
                 "images/Toolkit/sleep.jpg"
        };

    }


    else if (
        mood === "insecure"
    ) {

        toolkit = {
            title:
                "Your Comparison & Self-Esteem Toolkit",
            description:
                "Build a kinder relationship with yourself and step away from unhealthy comparison.",
            page:
                "Toolkit/toolkit-comparison-self-esteem.html",
            image:
                 "images/Toolkit/comparison.jpg"
        };

    }


    /*
     * ========================================================
     * UPDATE CARD
     * ========================================================
     */

    title.textContent =
    toolkit.title;

description.textContent =
    toolkit.description;

button.href =
    toolkit.page;

if (image) {
    image.src =
        toolkit.image;

    image.alt =
        toolkit.title;
}

    /*
     * Update all four small activity links
     * to the recommended toolkit as well.
     */

    const links =
        document.querySelectorAll(
            "#safeSpaceToolkitCard .safe-space-toolkit-item"
        );


    links.forEach(function (link) {

        link.href =
            toolkit.page;

    });


    /*
     * Update the small activity labels
     * according to the recommended toolkit.
     */

    const text1 =
        document.getElementById(
            "safeSpaceToolkitText1"
        );

    const text2 =
        document.getElementById(
            "safeSpaceToolkitText2"
        );

    const text3 =
        document.getElementById(
            "safeSpaceToolkitText3"
        );

    const text4 =
        document.getElementById(
            "safeSpaceToolkitText4"
        );


    if (
        toolkit.title ===
        "Your Anxiety Toolkit"
    ) {

        text1.innerHTML =
            "Calm<br>Your Mind";

        text2.innerHTML =
            "Ground<br>Yourself";

        text3.innerHTML =
            "Manage<br>Overthinking";

        text4.innerHTML =
            "Small<br>Daily Steps";

    }


    else if (
        toolkit.title ===
        "Your Stress & Burnout Toolkit"
    ) {

        text1.innerHTML =
            "Pause<br>& Breathe";

        text2.innerHTML =
            "Reduce<br>Overwhelm";

        text3.innerHTML =
            "Manage<br>Pressure";

        text4.innerHTML =
            "Protect<br>Your Energy";

    }


    else if (
        toolkit.title ===
        "Your Low Mood Toolkit"
    ) {

        text1.innerHTML =
            "Understand<br>Your Feelings";

        text2.innerHTML =
            "Small<br>Steps";

        text3.innerHTML =
            "Lift Your<br>Energy";

        text4.innerHTML =
            "Reconnect<br>With Yourself";

    }


    else if (
        toolkit.title ===
        "Your Sleep Toolkit"
    ) {

        text1.innerHTML =
            "Wind<br>Down";

        text2.innerHTML =
            "Build a<br>Routine";

        text3.innerHTML =
            "Quiet Your<br>Mind";

        text4.innerHTML =
            "Rest &<br>Recover";

    }


    else if (
        toolkit.title ===
        "Your Study & Work Toolkit"
    ) {

        text1.innerHTML =
            "Manage<br>Pressure";

        text2.innerHTML =
            "Improve<br>Focus";

        text3.innerHTML =
            "Handle<br>Deadlines";

        text4.innerHTML =
            "Study<br>Smarter";

    }


    else if (
        toolkit.title ===
        "Your Comparison & Self-Esteem Toolkit"
    ) {

        text1.innerHTML =
            "Be Kinder<br>To Yourself";

        text2.innerHTML =
            "Stop<br>Comparing";

        text3.innerHTML =
            "Build<br>Confidence";

        text4.innerHTML =
            "Value Your<br>Journey";

    }

}

/* ============================================================
   LOAD THE SAME POSTS USED BY HOME
============================================================ */

async function loadSafeSpacePosts() {

    const container =
        document.getElementById(
            "postsContainer"
        );

    if (!container) {

        console.error(
            "Safe Space posts container not found."
        );

        return;

    }

    container.innerHTML = `

        <div class="empty-posts">

            <p>
                Loading community voices...
            </p>

        </div>

    `;

    try {

        /*
         * IMPORTANT:
         *
         * This is exactly the same endpoint
         * used by the homepage.
         */

        let url =
            API_URL +
            "/posts/approved";

        const sessionToken =
            getSessionToken();

        if (sessionToken) {

            url +=
                "?session_token=" +
                encodeURIComponent(
                    sessionToken
                );

        }

        const response =
            await fetch(
                url
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                "Unable to load community posts."
            );

        }

        allPosts =
            Array.isArray(data)
                ? data
                : (
                    Array.isArray(
                        data.posts
                    )
                        ? data.posts
                        : []
                );

        window.mindspeakSafeSpacePosts =
            allPosts;

        console.log(
            "Safe Space — same posts as Home:",
            allPosts
        );

        applySafeSpaceFilters();

    }

    catch (error) {

        console.error(
            "Safe Space loading error:",
            error
        );

        container.innerHTML = `

            <div class="empty-posts">

                <p>
                    Unable to load community voices right now.
                </p>

                <p>
                    Please try again in a moment. 💚
                </p>

            </div>

        `;

    }

}


/* ============================================================
   APPLY FILTERS
============================================================ */

function applySafeSpaceFilters() {

    /*
     * ALWAYS start with ALL community posts.
     *
     * This includes:
     * - your posts
     * - other users' posts
     */
    let posts = [...allPosts];


    /* ========================================================
       CATEGORY FILTER
    ======================================================== */

    if (
        selectedCategory &&
        selectedCategory !== "all"
    ) {

        posts = posts.filter(function (post) {

            return (
                normalizeCategory(
                    post.category
                ) ===
                normalizeCategory(
                    selectedCategory
                )
            );

        });

    }


    /* ========================================================
       MY POSTS
       
       Only when the user explicitly selects
       "My Posts".
    ======================================================== */

    if (
        selectedSort === "my-posts"
    ) {

        posts = posts.filter(function (post) {

            return post.is_owner === true;

        });

    }


    /* ========================================================
       MOST LIKED
    ======================================================== */

    if (
        selectedSort === "liked"
    ) {

        posts.sort(function (a, b) {

            return (
                Number(
                    b.reaction_count || 0
                ) -
                Number(
                    a.reaction_count || 0
                )
            );

        });

    }


    /* ========================================================
       LATEST
    ======================================================== */

    else {

        posts.sort(function (a, b) {

            return (
                new Date(
                    b.created_at || 0
                ).getTime() -
                new Date(
                    a.created_at || 0
                ).getTime()
            );

        });

    }


    /* ========================================================
       SAVE FILTERED POSTS
    ======================================================== */

    filteredPosts = posts;


    /* ========================================================
       RENDER
    ======================================================== */

    renderSafeSpacePosts(
        filteredPosts
    );


    /* ========================================================
       UPDATE COUNT
    ======================================================== */

    updateSafeSpacePostCount(
        filteredPosts.length
    );


    /* ========================================================
       UPDATE FILTER LABEL
    ======================================================== */

    updateCurrentFilterText();

}
/* ============================================================
   CURRENT FILTER DISPLAY
============================================================ */

function updateCurrentFilterText() {

    const element =
        document.getElementById(
            "safeSpaceCurrentFilter"
        );

    if (!element) {
        return;
    }

    let text = "All posts";

    if (
        selectedCategory !==
        "all"
    ) {

        text =
            formatCategory(
                selectedCategory
            ) +
            " posts";

    }

    if (selectedMood) {

        text +=
            " · " +
            formatMood(
                selectedMood
            );

    }

    element.innerHTML = `

        <i class="fa-solid fa-users"></i>

        ${escapeHTML(text)}

    `;

}


/* ============================================================
   POST COUNT
============================================================ */

function updateSafeSpacePostCount(
    count
) {

    document
        .querySelectorAll(
            "[data-post-count]"
        )
        .forEach(function (element) {

            element.textContent =
                count +
                (
                    count === 1
                        ? " post"
                        : " posts"
                );

        });

}


/* ============================================================
   RENDER POSTS
============================================================ */

function renderSafeSpacePosts(
    posts
) {

    const container =
        document.getElementById(
            "postsContainer"
        );

    if (!container) {
        return;
    }

    if (
        !posts ||
        posts.length === 0
    ) {

        container.innerHTML = `

            <div class="empty-posts">

                <p>
                    No posts found.
                </p>

                <p>
                    Try another mood or category. 💚
                </p>

            </div>

        `;

        return;

    }

    container.innerHTML =
        posts
            .map(
                createSafeSpacePostCard
            )
            .join("");

}

/* ============================================================
   FORMAT RELATIVE TIME
============================================================ */

/* ============================================================
   FORMAT RELATIVE TIME
============================================================ */

function formatRelativeTime(dateValue) {

    if (!dateValue) {
        return "Just now";
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
        return "Recently";
    }


    const now =
        new Date();


    const seconds =
        Math.floor(
            (
                now.getTime() -
                date.getTime()
            ) / 1000
        );


    if (seconds < 60) {
        return "Just now";
    }


    const minutes =
        Math.floor(
            seconds / 60
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
            minutes / 60
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
            hours / 24
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
            day: "numeric",
            year: "numeric"
        }
    );

}
/* ============================================================
   POST CARD

   This intentionally uses the SAME structure as the
   homepage wall card.
============================================================ */
/* ============================================================
   DEFAULT WARM RESPONSE
============================================================ */

function getDefaultWarmResponse(mood) {
    const responses = {
        happy: "It's lovely to hear that you're feeling good. Keep holding onto that positive energy. 💚",

        sad: "It's okay to have difficult days. You don't have to go through them alone. 🌱",

        anxious: "Take a moment to breathe. Whatever you're facing, you can take it one step at a time. 💚",

        stressed: "You don't have to solve everything at once. Give yourself permission to pause and breathe. 🌿",

        angry: "It's okay to feel angry. Give yourself some space to process what you're feeling. 💚",

        lonely: "Feeling lonely can be difficult. Remember that reaching out is a sign of strength, not weakness. 🌱",

        confused: "It's okay not to have all the answers right now. Give yourself time and be gentle with yourself. 💚",

        tired: "You deserve to rest. It's okay to slow down and take care of yourself. 🌿",

        hopeful: "Hold onto that hope. Even small steps forward matter. 💚",

        neutral: "Thank you for sharing how you're feeling. Sometimes simply expressing it can help. 🌱"
    };

    if (!mood) {
        return responses.neutral;
    }

    const normalizedMood = String(mood)
        .toLowerCase()
        .trim();

    return responses[normalizedMood] || responses.neutral;
}
/* ============================================================
   SAFE SPACE POST CARD
   Same structure as the Home community post
============================================================ */

/* ============================================================
   SAFE SPACE POST CARD

   EXACT SAME STRUCTURE AS HOMEPAGE POST CARD
   Only the Safe Space action functions are different.
============================================================ */

function createSafeSpacePostCard(post) {

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
            post.message ||
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
     * EXACT SAME OWNER CONTROLS AS HOME.
     *
     * Only the function names are changed
     * to Safe Space functions.
     */

    const ownerControls =
        post.is_owner === true
            ? `
                <div class="homepage-post-owner-actions">

                    <button
                        type="button"
                        class="homepage-post-edit-btn"
                        onclick="editSafeSpacePost(${id})"
                        title="Edit your post"
                        aria-label="Edit your post"
                    >
                        <i class="fa-solid fa-pen"></i>
                        Edit
                    </button>


                    <button
                        type="button"
                        class="homepage-post-delete-btn"
                        onclick="deleteSafeSpacePost(${id})"
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
                    onclick="reactToSafeSpacePost(${id})"
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
                    onclick="reactToSafeSpacePost(${id})"
                >
                    I feel this too
                </button>


                <!-- COMMENTS -->

                <button
                    class="comment-button"
                    type="button"
                    onclick="toggleSafeSpaceComments(${id})"
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
                    onsubmit="submitSafeSpaceComment(event, ${id})"
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
   SAFE SPACE DATE FORMAT
============================================================ */

function formatSafeSpaceDate(dateValue) {

    if (!dateValue) {
        return "Just now";
    }

    const date =
        new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Recently";
    }

    const now =
        new Date();

    const difference =
        Math.floor(
            (now.getTime() - date.getTime()) /
            1000
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
            (minutes === 1 ? " minute ago" : " minutes ago")
        );
    }


    if (difference < 86400) {

        const hours =
            Math.floor(
                difference / 3600
            );

        return (
            hours +
            (hours === 1 ? " hour ago" : " hours ago")
        );
    }


    if (difference < 604800) {

        const days =
            Math.floor(
                difference / 86400
            );

        return (
            days +
            (days === 1 ? " day ago" : " days ago")
        );
    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );
}


/* ============================================================
   REACT TO POST

   SAME BACKEND ENDPOINT AS HOME
============================================================ */

async function reactToSafeSpacePost(
    postId
) {

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        showSafeSpaceMessage(
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
         * Update the SAME local post data.
         */

        const post =
            allPosts.find(
                function (item) {

                    return (
                        Number(item.id) ===
                        Number(postId)
                    );

                }
            );

        if (post) {

            post.reaction_count =
                Number(
                    data.reaction_count ||
                    0
                );

            post.reacted =
                Boolean(
                    data.reacted
                );

        }

        window.mindspeakSafeSpacePosts =
            allPosts;


        /*
         * Re-sort if Most Liked is selected.
         */

        if (
            selectedSort ===
            "liked"
        ) {

            applySafeSpaceFilters();

        }

    }

    catch (error) {

        console.error(
            "Safe Space reaction error:",
            error
        );

        showSafeSpaceMessage(
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
   COMMENTS
============================================================ */

async function toggleSafeSpaceComments(
    postId
) {

    const section =
        document.getElementById(
            "homepage-comments-section-" +
            postId
        );

    if (!section) {
        return;
    }

    const hidden =
        section.style.display === "none" ||
        section.style.display === "";

    if (hidden) {

        section.style.display =
            "block";

        if (
            section.dataset.loaded !==
            "true"
        ) {

            await loadSafeSpaceComments(
                postId
            );

        }

    }

    else {

        section.style.display =
            "none";

    }

}


/* ============================================================
   LOAD COMMENTS
============================================================ */

async function loadSafeSpaceComments(
    postId
) {

    const list =
        document.getElementById(
            "homepage-comments-list-" +
            postId
        );

    if (!list) {
        return;
    }

    list.innerHTML = `

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
            getSessionToken();

        if (sessionToken) {

            url +=
                "?session_token=" +
                encodeURIComponent(
                    sessionToken
                );

        }

        const response =
            await fetch(
                url
            );

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
                : (
                    Array.isArray(
                        data.comments
                    )
                        ? data.comments
                        : []
                );

        renderSafeSpaceComments(
            postId,
            comments
        );

        const section =
            document.getElementById(
                "homepage-comments-section-" +
                postId
            );

        if (section) {

            section.dataset.loaded =
                "true";

        }

        const count =
            document.getElementById(
                "homepage-comment-count-" +
                postId
            );

        if (count) {

            count.textContent =
                comments.length;

        }

    }

    catch (error) {

        console.error(
            "Safe Space comments error:",
            error
        );

        list.innerHTML = `

            <div class="comments-error">
                Unable to load comments right now.
            </div>

        `;

    }

}


/* ============================================================
   RENDER COMMENTS
============================================================ */

function renderSafeSpaceComments(
    postId,
    comments
) {

    const list =
        document.getElementById(
            "homepage-comments-list-" +
            postId
        );

    if (!list) {
        return;
    }

    if (
        !comments ||
        comments.length === 0
    ) {

        list.innerHTML = `

            <div class="comments-empty">
                No comments yet.
                Be the first to say something supportive. 💚
            </div>

        `;

        return;

    }

    list.innerHTML =
        comments
            .map(
                function (comment) {

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
                        formatRelativeTime(
                            comment.created_at
                        );

                    return `

                        <div
                            class="community-comment"
                            data-comment-id="${comment.id}"
                        >

                            <div class="community-comment-avatar">
                                ${avatar}
                            </div>

                            <div class="community-comment-body">

                                <div class="community-comment-header">

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

                }
            )
            .join("");

}


/* ============================================================
   SUBMIT COMMENT
============================================================ */

async function submitSafeSpaceComment(
    event,
    postId
) {

    event.preventDefault();

    const input =
        document.getElementById(
            "homepage-comment-input-" +
            postId
        );

    const button =
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
        getSessionToken();

    if (!sessionToken) {

        showSafeSpaceMessage(
            "Please log in to comment."
        );

        return;

    }

    if (!content) {

        input.focus();

        return;

    }

    if (button) {

        button.disabled =
            true;

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

        input.value =
            "";

        const section =
            document.getElementById(
                "homepage-comments-section-" +
                postId
            );

        if (section) {

            section.dataset.loaded =
                "false";

        }

        await loadSafeSpaceComments(
            postId
        );

    }

    catch (error) {

        console.error(
            "Safe Space comment error:",
            error
        );

        showSafeSpaceMessage(
            error.message ||
            "Unable to post comment."
        );

    }

    finally {

        if (button) {

            button.disabled =
                false;

        }

    }

}


/* ============================================================
   EDIT OWN POST
============================================================ */

async function editSafeSpacePost(
    postId
) {

    const post =
        allPosts.find(
            function (item) {

                return (
                    Number(item.id) ===
                    Number(postId)
                );

            }
        );

    if (!post) {

        showSafeSpaceMessage(
            "Post could not be found."
        );

        return;

    }

    if (
        post.is_owner !== true
    ) {

        showSafeSpaceMessage(
            "You can only edit your own post."
        );

        return;

    }

    const newContent =
        window.prompt(
            "Edit your post:",
            post.content || ""
        );

    if (
        newContent ===
        null
    ) {

        return;

    }

    const content =
        newContent.trim();

    if (!content) {

        showSafeSpaceMessage(
            "Post content cannot be empty."
        );

        return;

    }

    if (
        content.length >
        2000
    ) {

        showSafeSpaceMessage(
            "Post cannot be longer than 2000 characters."
        );

        return;

    }

    const sessionToken =
        getSessionToken();

    if (!sessionToken) {

        showSafeSpaceMessage(
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

        showSafeSpaceMessage(
            "Your post was updated."
        );

        await loadSafeSpacePosts();

    }

    catch (error) {

        console.error(
            "Safe Space edit error:",
            error
        );

        showSafeSpaceMessage(
            error.message ||
            "Unable to edit your post."
        );

    }

}


/* ============================================================
   DELETE OWN POST
============================================================ */

async function deleteSafeSpacePost(
    postId
) {

    const post =
        allPosts.find(
            function (item) {

                return (
                    Number(item.id) ===
                    Number(postId)
                );

            }
        );

    if (!post) {

        showSafeSpaceMessage(
            "Post could not be found."
        );

        return;

    }

    if (
        post.is_owner !== true
    ) {

        showSafeSpaceMessage(
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
        getSessionToken();

    if (!sessionToken) {

        showSafeSpaceMessage(
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

        showSafeSpaceMessage(
            "Your post was deleted."
        );

        await loadSafeSpacePosts();

    }

    catch (error) {

        console.error(
            "Safe Space delete error:",
            error
        );

        showSafeSpaceMessage(
            error.message ||
            "Unable to delete your post."
        );

    }

}


/* ============================================================
   WARM RESPONSE

   Same style/content logic as Home.
============================================================ */

function getWarmResponse(
    mood
) {

    const responses = {

        anxious:
            "It's understandable to feel this way. You're not alone in it.",

        stressed:
            "It sounds like you're carrying a lot. It's okay to take things one step at a time.",

        sad:
            "What you're feeling matters. You don't have to go through it alone.",

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
   NOTIFICATION
============================================================ */

function showSafeSpaceMessage(
    message
) {

    /*
     * Use existing showNotification if the
     * shared site already provides it.
     */

    if (
        typeof window.showNotification ===
        "function"
    ) {

        window.showNotification(
            message
        );

        return;

    }

    alert(
        message
    );

}


/* ============================================================
   GLOBAL FUNCTIONS
   Keep functions accessible to inline HTML onclick handlers.
============================================================ */

window.reactToSafeSpacePost =
    reactToSafeSpacePost;

window.toggleSafeSpaceComments =
    toggleSafeSpaceComments;

window.submitSafeSpaceComment =
    submitSafeSpaceComment;

window.editSafeSpacePost =
    editSafeSpacePost;

window.deleteSafeSpacePost =
    deleteSafeSpacePost;

window.loadSafeSpacePosts =
    loadSafeSpacePosts;