const API = "http://127.0.0.1:8000";

let journalEntries = [];
let selectedMood = "";
let editingEntryId = null;
let selectedImage = null;
let imageRemoved = false;


// ======================================================
// INITIAL LOAD
// ======================================================

document.addEventListener("DOMContentLoaded", () => {
    checkAuthentication();
});


// ======================================================
// AUTHENTICATION
// ======================================================

function checkAuthentication() {
    const sessionToken = localStorage.getItem("session_token");

    if (!sessionToken) {
        window.location.href = "../login.html";
        return;
    }

    initializeJournal();
}


// ======================================================
// INITIALIZE JOURNAL
// ======================================================

function initializeJournal() {
    setJournalDate();
    setupMoodButtons();
    setupImageUpload();
    setupFormButtons();
    setupFilters();
    setupTipButton();

    loadJournalEntries();
}


// ======================================================
// DATE
// ======================================================

function setJournalDate() {
    const dateElement = document.getElementById("journalDate");

    if (!dateElement) return;

    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}


// ======================================================
// MOOD SELECTION
// ======================================================

function setupMoodButtons() {
    const moodButtons = document.querySelectorAll(".journal-mood");

    moodButtons.forEach(button => {
        button.addEventListener("click", () => {

            moodButtons.forEach(item => {
                item.classList.remove("selected");
            });

            button.classList.add("selected");

            selectedMood = button.dataset.mood || "";
        });
    });
}


// ======================================================
// IMAGE UPLOAD
// ======================================================

function setupImageUpload() {
    const imageInput = document.getElementById("entryImage");
    const preview = document.getElementById("imagePreview");
    const previewImage = document.getElementById("previewImage");
    const removeButton = document.getElementById("removeImageBtn");

    if (!imageInput) return;


    // --------------------------------------------------
    // SELECT IMAGE
    // --------------------------------------------------

    imageInput.addEventListener("change", () => {

        const file = imageInput.files[0];

        if (!file) return;


        if (!file.type.startsWith("image/")) {
            alert("Please choose an image file.");
            imageInput.value = "";
            return;
        }


        selectedImage = file;

        // Selecting a new image means the image is NOT removed
        imageRemoved = false;


        const reader = new FileReader();

        reader.onload = event => {

            if (previewImage) {
                previewImage.src = event.target.result;
            }

            if (preview) {
                preview.style.display = "block";
                preview.hidden = false;
            }
        };

        reader.readAsDataURL(file);
    });


    // --------------------------------------------------
    // REMOVE IMAGE
    // --------------------------------------------------

    if (removeButton) {

        removeButton.addEventListener("click", () => {

            selectedImage = null;

            // Important:
            // This tells saveJournalEntry() that the user
            // intentionally removed the existing image.
            imageRemoved = true;

            imageInput.value = "";


            if (previewImage) {
                previewImage.src = "";
            }


            if (preview) {
                preview.style.display = "none";
                preview.hidden = true;
            }
        });
    }
}


// ======================================================
// FORM BUTTONS
// ======================================================

function setupFormButtons() {

    const saveButton =
        document.getElementById("saveEntryBtn");

    const cancelButton =
        document.getElementById("cancelEntryBtn");

    const firstEntryButton =
        document.getElementById("firstEntryBtn");


    if (saveButton) {
        saveButton.addEventListener(
            "click",
            saveJournalEntry
        );
    }


    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            resetJournalForm
        );
    }


    if (firstEntryButton) {

        firstEntryButton.addEventListener("click", () => {

            const titleInput =
                document.getElementById("entryTitle");

            if (titleInput) {
                titleInput.focus();
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }
}


// ======================================================
// FILTERS
// ======================================================

function setupFilters() {

    const searchInput =
        document.getElementById("entrySearch");

    const moodFilter =
        document.getElementById("moodFilter");

    const sortSelect =
        document.getElementById("entrySort");


    if (searchInput) {
        searchInput.addEventListener(
            "input",
            renderEntries
        );
    }


    if (moodFilter) {
        moodFilter.addEventListener(
            "change",
            renderEntries
        );
    }


    if (sortSelect) {
        sortSelect.addEventListener(
            "change",
            renderEntries
        );
    }
}


// ======================================================
// LOAD ENTRIES
// ======================================================

async function loadJournalEntries() {

    const loadingElement =
        document.getElementById("entriesLoading");

    const entriesGrid =
        document.getElementById("entriesGrid");


    if (loadingElement) {
        loadingElement.style.display = "block";
    }


    if (entriesGrid) {
        entriesGrid.innerHTML = "";
    }


    try {

        const sessionToken =
            localStorage.getItem("session_token");


        const response = await fetch(
            `${API}/journal/entries?session_token=${encodeURIComponent(sessionToken)}`
        );


        const data = await response.json();


        if (!response.ok || data.error) {
            throw new Error(
                data.error ||
                "Unable to load journal entries."
            );
        }


        journalEntries =
            Array.isArray(data.entries)
                ? data.entries
                : [];


        renderEntries();
        updateJourneyStats();


    } catch (error) {

        console.error(
            "Journal loading error:",
            error
        );


        if (entriesGrid) {

            entriesGrid.innerHTML = `
                <div class="journal-error">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    <h3>Unable to load your journal</h3>
                    <p>Please refresh the page and try again.</p>
                </div>
            `;
        }


    } finally {

        if (loadingElement) {
            loadingElement.style.display = "none";
        }
    }
}


// ======================================================
// RENDER ENTRIES
// ======================================================

function renderEntries() {

    const entriesGrid =
        document.getElementById("entriesGrid");

    const emptyState =
        document.getElementById("emptyJournalState");


    if (!entriesGrid) return;


    let filteredEntries =
        [...journalEntries];


    const searchInput =
        document.getElementById("entrySearch");

    const moodFilter =
        document.getElementById("moodFilter");

    const sortSelect =
        document.getElementById("entrySort");


    const searchValue =
        searchInput
            ? searchInput.value.trim().toLowerCase()
            : "";


    const selectedFilterMood =
        moodFilter
            ? moodFilter.value
            : "all";


    const sortValue =
        sortSelect
            ? sortSelect.value
            : "newest";


    // ==================================================
    // SEARCH
    // ==================================================

    if (searchValue) {

        filteredEntries =
            filteredEntries.filter(entry => {

                const title =
                    String(entry.title || "")
                        .toLowerCase();

                const content =
                    String(entry.content || "")
                        .toLowerCase();

                const tag =
                    String(entry.tag || "")
                        .toLowerCase();


                return (
                    title.includes(searchValue) ||
                    content.includes(searchValue) ||
                    tag.includes(searchValue)
                );
            });
    }


    // ==================================================
    // MOOD FILTER
    // ==================================================

    if (
        selectedFilterMood &&
        selectedFilterMood !== "all"
    ) {

        filteredEntries =
            filteredEntries.filter(entry =>
                entry.mood === selectedFilterMood
            );
    }


    // ==================================================
    // SORT
    // ==================================================

    filteredEntries.sort((a, b) => {

        const dateA =
            new Date(a.created_at).getTime();

        const dateB =
            new Date(b.created_at).getTime();


        if (sortValue === "oldest") {
            return dateA - dateB;
        }


        return dateB - dateA;
    });


    // ==================================================
    // CLEAR GENERATED CARDS
    // ==================================================

    entriesGrid.innerHTML = "";


    // ==================================================
    // NO RESULTS
    // ==================================================

    if (filteredEntries.length === 0) {

        if (emptyState) {

            emptyState.hidden = false;
            emptyState.style.display = "block";


            const emptyTitle =
                emptyState.querySelector("h3");

            const emptyText =
                emptyState.querySelector("p");


            if (journalEntries.length === 0) {

                if (emptyTitle) {
                    emptyTitle.textContent =
                        "Your journal is waiting for you";
                }


                if (emptyText) {
                    emptyText.textContent =
                        "Write your first entry and start capturing your journey.";
                }

            } else {

                if (emptyTitle) {
                    emptyTitle.textContent =
                        "No entries found";
                }


                if (emptyText) {
                    emptyText.textContent =
                        "Try changing your search or mood filter.";
                }
            }
        }


        return;
    }


    // ==================================================
    // HIDE EMPTY STATE
    // ==================================================

    if (emptyState) {
        emptyState.hidden = true;
        emptyState.style.display = "none";
    }


    // ==================================================
    // RENDER REAL DATABASE ENTRIES
    // ==================================================

    filteredEntries.forEach(entry => {

        const entryCard =
            createEntryCard(entry);

        entriesGrid.appendChild(entryCard);
    });
}


// ======================================================
// CREATE ENTRY CARD
// ======================================================

function createEntryCard(entry) {

    const card =
        document.createElement("article");


    card.className =
        "journal-entry-card";


    const moodLabel =
        formatMood(entry.mood);


    const date =
        formatDate(entry.created_at);


    const content =
        escapeHTML(entry.content || "");


    const title =
        escapeHTML(
            entry.title ||
            "Untitled Entry"
        );


    const tag =
        entry.tag
            ? `<span class="entry-tag">#${escapeHTML(entry.tag)}</span>`
            : "";


    // --------------------------------------------------
    // IMAGE URL
    // --------------------------------------------------

    const imageUrl =
        entry.image
            ? (
                entry.image.startsWith("http")
                    ? entry.image
                    : `${API}${entry.image}`
            )
            : null;


    const image =
        imageUrl
            ? `
                <div class="entry-image">
                    <img
                        src="${escapeHTML(imageUrl)}"
                        alt="Journal entry image"
                    >
                </div>
            `
            : "";


    card.innerHTML = `

        ${image}

        <div class="entry-card-content">

            <div class="entry-card-top">

                <span class="entry-mood">
                    ${getMoodIcon(entry.mood)}
                    ${moodLabel}
                </span>

                <span class="entry-date">
                    ${date}
                </span>

            </div>


            <h3 class="entry-card-title">
                ${title}
            </h3>


            <p class="entry-card-text">
                ${content}
            </p>


            <div class="entry-card-bottom">

                <div class="entry-card-tags">
                    ${tag}
                </div>


                <div class="entry-card-actions">

                    <button
                        type="button"
                        class="entry-action-btn edit-entry-btn"
                        title="Edit entry"
                    >
                        <i class="fa-solid fa-pen"></i>
                    </button>


                    <button
                        type="button"
                        class="entry-action-btn delete-entry-btn"
                        title="Delete entry"
                    >
                        <i class="fa-solid fa-trash"></i>
                    </button>

                </div>

            </div>

        </div>
    `;


    const editButton =
        card.querySelector(".edit-entry-btn");


    const deleteButton =
        card.querySelector(".delete-entry-btn");


    if (editButton) {

        editButton.addEventListener(
            "click",
            () => {
                startEditingEntry(entry);
            }
        );
    }


    if (deleteButton) {

        deleteButton.addEventListener(
            "click",
            () => {
                deleteJournalEntry(entry.id);
            }
        );
    }


    return card;
}


// ======================================================
// SAVE ENTRY
// ======================================================

async function saveJournalEntry() {

    const titleInput =
        document.getElementById("entryTitle");

    const contentInput =
        document.getElementById("entryContent");

    const tagInput =
        document.getElementById("entryTag");

    const saveButton =
        document.getElementById("saveEntryBtn");


    const title =
        titleInput
            ? titleInput.value.trim()
            : "";


    const content =
        contentInput
            ? contentInput.value.trim()
            : "";


    const tag =
        tagInput
            ? tagInput.value.trim()
            : "";


    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!selectedMood) {
        alert("Please choose how you are feeling.");
        return;
    }


    if (!title) {
        alert("Please add a title.");
        return;
    }


    if (!content) {
        alert("Please write something in your journal.");
        return;
    }


    const sessionToken =
        localStorage.getItem("session_token");


    if (!sessionToken) {
        window.location.href = "../login.html";
        return;
    }


    try {

        // ==================================================
        // IMAGE STATE
        // ==================================================

        let uploadedImageUrl = null;


        // --------------------------------------------------
        // EDITING EXISTING ENTRY
        // --------------------------------------------------

        if (editingEntryId) {

            const currentEntry =
                journalEntries.find(
                    entry =>
                        String(entry.id) ===
                        String(editingEntryId)
                );


            if (currentEntry && !imageRemoved) {

                uploadedImageUrl =
                    currentEntry.image || null;
            }
        }


        // --------------------------------------------------
        // NEW IMAGE SELECTED
        // --------------------------------------------------

        if (selectedImage) {

            const imageFormData =
                new FormData();


            imageFormData.append(
                "image_file",
                selectedImage
            );


            const imageResponse =
                await fetch(
                    `${API}/journal/upload-image?session_token=${encodeURIComponent(sessionToken)}`,
                    {
                        method: "POST",
                        body: imageFormData
                    }
                );


            const imageData =
                await imageResponse.json();


            if (
                !imageResponse.ok ||
                imageData.error
            ) {

                throw new Error(
                    imageData.error ||
                    "Unable to upload journal image."
                );
            }


            uploadedImageUrl =
                imageData.image;
        }


        // ==================================================
        // FINAL PAYLOAD
        // ==================================================

        const payload = {

            mood: selectedMood,

            title: title,

            content: content,

            tag: tag || null,

            image: uploadedImageUrl
        };


        // ==================================================
        // BUTTON LOADING STATE
        // ==================================================

        if (saveButton) {

            saveButton.disabled = true;

            saveButton.innerHTML = `
                <i class="fa-solid fa-spinner fa-spin"></i>
                Saving...
            `;
        }


        let response;


        // ==================================================
        // EDIT
        // ==================================================

        if (editingEntryId) {

            response =
                await fetch(
                    `${API}/journal/entries/${editingEntryId}?session_token=${encodeURIComponent(sessionToken)}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );

        }


        // ==================================================
        // CREATE
        // ==================================================

        else {

            response =
                await fetch(
                    `${API}/journal/entries?session_token=${encodeURIComponent(sessionToken)}`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(payload)
                    }
                );
        }


        const data =
            await response.json();


        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                "Unable to save journal entry."
            );
        }


        // ==================================================
        // SUCCESS
        // ==================================================

        resetJournalForm();

        await loadJournalEntries();


    } catch (error) {

        console.error(
            "Save journal entry error:",
            error
        );


        alert(
            error.message ||
            "Unable to save your journal entry."
        );


    } finally {

        if (saveButton) {

            saveButton.disabled = false;

            saveButton.innerHTML = `
                <i class="fa-solid fa-feather-pointed"></i>
                Save Entry
            `;
        }
    }
}


// ======================================================
// EDIT ENTRY
// ======================================================

function startEditingEntry(entry) {

    editingEntryId =
        entry.id;


    // Important:
    // At the beginning of editing, we assume the
    // existing image should remain.
    imageRemoved = false;

    selectedImage = null;


    const titleInput =
        document.getElementById("entryTitle");

    const contentInput =
        document.getElementById("entryContent");

    const tagInput =
        document.getElementById("entryTag");


    if (titleInput) {
        titleInput.value =
            entry.title || "";
    }


    if (contentInput) {
        contentInput.value =
            entry.content || "";
    }


    if (tagInput) {
        tagInput.value =
            entry.tag || "";
    }


    // --------------------------------------------------
    // MOOD
    // --------------------------------------------------

    selectedMood =
        entry.mood || "";


    document
        .querySelectorAll(".journal-mood")
        .forEach(button => {

            button.classList.toggle(
                "selected",
                button.dataset.mood ===
                selectedMood
            );
        });


    // --------------------------------------------------
    // EXISTING IMAGE PREVIEW
    // --------------------------------------------------

    const preview =
        document.getElementById("imagePreview");

    const previewImage =
        document.getElementById("previewImage");


    if (entry.image) {

        const existingImageUrl =
            entry.image.startsWith("http")
                ? entry.image
                : `${API}${entry.image}`;


        if (previewImage) {
            previewImage.src =
                existingImageUrl;
        }


        if (preview) {
            preview.style.display = "block";
            preview.hidden = false;
        }

    } else {

        if (previewImage) {
            previewImage.src = "";
        }


        if (preview) {
            preview.style.display = "none";
            preview.hidden = true;
        }
    }


    // --------------------------------------------------
    // BUTTON
    // --------------------------------------------------

    const saveButton =
        document.getElementById("saveEntryBtn");


    if (saveButton) {

        saveButton.innerHTML = `
            <i class="fa-solid fa-pen"></i>
            Update Entry
        `;
    }


    // --------------------------------------------------
    // SCROLL
    // --------------------------------------------------

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ======================================================
// DELETE ENTRY
// ======================================================

async function deleteJournalEntry(entryId) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this journal entry? This cannot be undone."
        );


    if (!confirmed) {
        return;
    }


    const sessionToken =
        localStorage.getItem("session_token");


    if (!sessionToken) {
        window.location.href = "../login.html";
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/journal/entries/${entryId}?session_token=${encodeURIComponent(sessionToken)}`,
                {
                    method: "DELETE"
                }
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            data.error
        ) {

            throw new Error(
                data.error ||
                "Unable to delete journal entry."
            );
        }


        journalEntries =
            journalEntries.filter(
                entry =>
                    Number(entry.id) !==
                    Number(entryId)
            );


        renderEntries();

        updateJourneyStats();


    } catch (error) {

        console.error(
            "Delete journal entry error:",
            error
        );


        alert(
            error.message ||
            "Unable to delete your journal entry."
        );
    }
}


// ======================================================
// RESET FORM
// ======================================================

function resetJournalForm() {

    editingEntryId = null;

    selectedMood = "";

    selectedImage = null;

    imageRemoved = false;


    const titleInput =
        document.getElementById("entryTitle");

    const contentInput =
        document.getElementById("entryContent");

    const tagInput =
        document.getElementById("entryTag");

    const imageInput =
        document.getElementById("entryImage");


    if (titleInput) {
        titleInput.value = "";
    }


    if (contentInput) {
        contentInput.value = "";
    }


    if (tagInput) {
        tagInput.value = "";
    }


    if (imageInput) {
        imageInput.value = "";
    }


    // --------------------------------------------------
    // RESET MOOD
    // --------------------------------------------------

    document
        .querySelectorAll(".journal-mood")
        .forEach(button => {

            button.classList.remove(
                "selected"
            );
        });


    // --------------------------------------------------
    // RESET IMAGE PREVIEW
    // --------------------------------------------------

    const preview =
        document.getElementById("imagePreview");

    const previewImage =
        document.getElementById("previewImage");


    if (preview) {

        preview.style.display =
            "none";

        preview.hidden =
            true;
    }


    if (previewImage) {
        previewImage.src = "";
    }


    // --------------------------------------------------
    // RESET SAVE BUTTON
    // --------------------------------------------------

    const saveButton =
        document.getElementById("saveEntryBtn");


    if (saveButton) {

        saveButton.innerHTML = `
            <i class="fa-solid fa-feather-pointed"></i>
            Save Entry
        `;
    }
}


// ======================================================
// JOURNEY STATISTICS
// ======================================================

function updateJourneyStats() {

    const totalElement =
        document.getElementById("totalEntries");

    const monthlyElement =
        document.getElementById("monthlyEntries");

    const moodsElement =
        document.getElementById("differentMoods");

    const streakElement =
        document.getElementById("journalStreak");


    const total =
        journalEntries.length;


    if (totalElement) {
        totalElement.textContent =
            total;
    }


    const now =
        new Date();


    const monthlyEntries =
        journalEntries.filter(entry => {

            const date =
                new Date(entry.created_at);


            return (
                date.getMonth() ===
                    now.getMonth() &&

                date.getFullYear() ===
                    now.getFullYear()
            );
        });


    if (monthlyElement) {

        monthlyElement.textContent =
            monthlyEntries.length;
    }


    const moods =
        new Set(
            journalEntries
                .map(entry => entry.mood)
                .filter(Boolean)
        );


    if (moodsElement) {

        moodsElement.textContent =
            moods.size;
    }


    if (streakElement) {

        streakElement.textContent =
            calculateJournalStreak();
    }
}


// ======================================================
// JOURNAL STREAK
// ======================================================

function calculateJournalStreak() {

    if (journalEntries.length === 0) {
        return 0;
    }


    const uniqueDates =
        new Set();


    journalEntries.forEach(entry => {

        const date =
            new Date(entry.created_at);


        if (isNaN(date.getTime())) {
            return;
        }


        uniqueDates.add(
            date.toISOString()
                .split("T")[0]
        );
    });


    const dates =
        Array.from(uniqueDates)
            .map(date => new Date(date))
            .sort(
                (a, b) => b - a
            );


    if (dates.length === 0) {
        return 0;
    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const latest =
        new Date(dates[0]);


    latest.setHours(
        0,
        0,
        0,
        0
    );


    const differenceFromToday =
        Math.floor(
            (today - latest) /
            (1000 * 60 * 60 * 24)
        );


    if (differenceFromToday > 1) {
        return 0;
    }


    let streak = 1;


    for (
        let i = 1;
        i < dates.length;
        i++
    ) {

        const current =
            new Date(dates[i - 1]);

        const previous =
            new Date(dates[i]);


        current.setHours(
            0,
            0,
            0,
            0
        );


        previous.setHours(
            0,
            0,
            0,
            0
        );


        const difference =
            Math.floor(
                (current - previous) /
                (1000 * 60 * 60 * 24)
            );


        if (difference === 1) {

            streak++;

        } else {

            break;
        }
    }


    return streak;
}


// ======================================================
// JOURNAL TIPS
// ======================================================

function setupTipButton() {

    const button =
        document.getElementById("newTipBtn");


    if (!button) return;


    button.addEventListener(
        "click",
        showRandomTip
    );
}


function showRandomTip() {

    const tipElement =
        document.getElementById("journalTip");


    if (!tipElement) return;


    const tips = [

        "You do not have to write perfectly. Just write honestly.",

        "Try describing one small thing that made today easier.",

        "Writing down your feelings can help you understand them more clearly.",

        "There is no right way to journal. Make this space your own.",

        "If today was difficult, start by writing what you needed most.",

        "Notice one thing you are grateful for, even if it feels very small.",

        "You can write about progress, setbacks, thoughts, or simply how today felt."

    ];


    const currentTip =
        tipElement.textContent.trim();


    let newTip =
        currentTip;


    while (
        tips.length > 1 &&
        newTip === currentTip
    ) {

        newTip =
            tips[
                Math.floor(
                    Math.random() *
                    tips.length
                )
            ];
    }


    tipElement.textContent =
        newTip;
}


// ======================================================
// HELPERS
// ======================================================

function formatMood(mood) {

    const moods = {

        happy: "Happy",

        good: "Good",

        okay: "Okay",

        sad: "Sad",

        anxious: "Anxious",

        frustrated: "Frustrated",

        tired: "Tired",

        grateful: "Grateful"
    };


    return moods[mood] ||
        "Mood";
}


function getMoodIcon(mood) {

    const icons = {

        happy: "😊",

        good: "🙂",

        okay: "😐",

        sad: "😔",

        anxious: "😟",

        frustrated: "😤",

        tired: "😴",

        grateful: "🤍"
    };


    return icons[mood] ||
        "🌿";
}


function formatDate(dateValue) {

    const date =
        new Date(dateValue);


    if (isNaN(date.getTime())) {
        return "";
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