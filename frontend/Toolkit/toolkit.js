// ======================================================
// MINDSPEAK TOOLKIT
// toolkit.js
// ======================================================

const API_BASE = "http://127.0.0.1:8000";


// ======================================================
// TOPIC PAGE MAPPING
// ======================================================

const topicPages = {
    "anxiety": "toolkit-anxiety.html",
    "stress-burnout": "toolkit-stress.html",
    "low-mood": "toolkit-low-mood.html",
    "sleep": "toolkit-sleep.html",
    "study-work": "toolkit-study-work.html",
    "comparison-self-esteem": "toolkit-comparison-self-esteem.html",
    "addiction-habit-change": "toolkit-addiction-habits.html"
};


// ======================================================
// PAGE LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", () => {

    loadToolkitTopics();

});


// ======================================================
// LOAD TOPICS FROM BACKEND
// ======================================================

async function loadToolkitTopics() {

    const topicCards =
        document.querySelectorAll(".topic-grid .topic-card");

    if (!topicCards.length) {

        console.error(
            "Toolkit topic cards were not found."
        );

        return;
    }


    try {

        const response = await fetch(
            `${API_BASE}/toolkit/topics`
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const data = await response.json();


        console.log(
            "Toolkit topics loaded:",
            data
        );


        if (
            !data ||
            !Array.isArray(data.topics) ||
            data.topics.length === 0
        ) {

            console.warn(
                "No Toolkit topics returned."
            );

            return;
        }


        // ----------------------------------------------
        // UPDATE EXISTING CARDS
        // ----------------------------------------------

        data.topics.forEach((topic, index) => {

            if (index >= topicCards.length - 1) {
                return;
            }

            updateTopicCard(
                topicCards[index],
                topic
            );

        });


    } catch (error) {

        console.error(
            "Toolkit topics loading error:",
            error
        );

    }

}


// ======================================================
// UPDATE EXISTING TOPIC CARD
// ======================================================

function updateTopicCard(card, topic) {

    // ----------------------------------------------
    // TITLE
    // ----------------------------------------------

    const title =
        card.querySelector("h3");

    if (title && topic.title) {

        title.textContent =
            topic.title;

    }


    // ----------------------------------------------
    // DESCRIPTION
    // ----------------------------------------------

    const description =
        card.querySelector("p");

    if (
        description &&
        topic.short_description
    ) {

        description.textContent =
            topic.short_description;

    }


    // ----------------------------------------------
    // LINK
    // ----------------------------------------------

    const page =
        topicPages[topic.slug];

    if (page) {

        card.href = page;

    }


    // ----------------------------------------------
    // IMAGE
    // ----------------------------------------------

    const image =
        card.querySelector("img");

    if (image) {

        image.alt =
            topic.title || image.alt;

    }

}


// ======================================================
// HELPER
// ======================================================

window.loadToolkitTopics =
    loadToolkitTopics;