/* =========================================================
   MINDSPEAK PROFILE
========================================================= */


/* =========================================================
   API
========================================================= */

const API = "http://127.0.0.1:8000";


/* =========================================================
   STATE
========================================================= */

let currentProfile = null;
let selectedAvatar = "";
let currentNickname = "";
let currentAvatar = "";
let selectedProfilePhoto = null;
let profilePhotoPreviewUrl = "";


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    setupProfileEvents();
    loadProfile();

});


/* =========================================================
   SESSION
========================================================= */

function getSessionToken() {

    return localStorage.getItem("session_token");

}


/* =========================================================
   SESSION CHECK
========================================================= */

function requireSession() {

    const token = getSessionToken();

    if (!token) {

        window.location.href = "../login.html";

        return false;

    }

    return true;

}


/* =========================================================
   SETUP EVENTS
========================================================= */

function setupProfileEvents() {


    /* ---------------------------------------------
       RETRY
    --------------------------------------------- */

    const retryBtn =
        document.getElementById("retryBtn");

    if (retryBtn) {

        retryBtn.addEventListener(
            "click",
            loadProfile
        );

    }


    /* ---------------------------------------------
       SAVE NICKNAME
    --------------------------------------------- */

    const saveNicknameBtn =
        document.getElementById("saveNicknameBtn");

    if (saveNicknameBtn) {

        saveNicknameBtn.addEventListener(
            "click",
            updateNickname
        );

    }


    /* ---------------------------------------------
       AVATAR OPTIONS
    --------------------------------------------- */

    document
        .querySelectorAll(".avatar-option")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectAvatar(button);

                }
            );

        });


    /* ---------------------------------------------
       SAVE AVATAR
    --------------------------------------------- */

    const saveAvatarBtn =
        document.getElementById("saveAvatarBtn");

    if (saveAvatarBtn) {

    saveAvatarBtn.addEventListener(
        "click",
        function () {

            if (selectedProfilePhoto) {

                saveProfilePhoto();

            } else {

                updateAvatar();

            }

        }
    );

}


    /* ---------------------------------------------
       DELETE NICKNAME
    --------------------------------------------- */

    const deleteNicknameBtn =
        document.getElementById(
            "deleteNicknameBtn"
        );

    if (deleteNicknameBtn) {

        deleteNicknameBtn.addEventListener(
            "click",
            deleteNickname
        );

    }


    /* ---------------------------------------------
       DELETE AVATAR
    --------------------------------------------- */

    const deleteAvatarBtn =
        document.getElementById(
            "deleteAvatarBtn"
        );

    if (deleteAvatarBtn) {

        deleteAvatarBtn.addEventListener(
            "click",
            deleteAvatar
        );

    }


    /* ---------------------------------------------
       ENTER KEY FOR NICKNAME
    --------------------------------------------- */

    const nicknameInput =
        document.getElementById(
            "nicknameInput"
        );

    if (nicknameInput) {

        nicknameInput.addEventListener(
            "keydown",
            event => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    updateNickname();

                }

            }
        );

    }

}

    /* ---------------------------------------------
       PROFILE PHOTO UPLOAD
    --------------------------------------------- */

    const chooseProfilePhotoBtn =
        document.getElementById(
            "chooseProfilePhotoBtn"
        );

    const profilePhotoInput =
        document.getElementById(
            "profilePhotoInput"
        );


    if (
        chooseProfilePhotoBtn &&
        profilePhotoInput
    ) {

        chooseProfilePhotoBtn.addEventListener(
            "click",
            function () {

                profilePhotoInput.click();

            }
        );


        profilePhotoInput.addEventListener(
            "change",
            function (event) {

                const file =
                    event.target.files &&
                    event.target.files[0];

                handleProfilePhotoSelection(
                    file
                );

            }
        );

    }
/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    if (!requireSession()) {

        return;

    }


    showLoading();


    try {

        const userId =
            localStorage.getItem("user_id");


        if (!userId) {

            handleSessionExpired();

            return;

        }


        const response =
            await fetch(
                `${API}/auth/me/${encodeURIComponent(userId)}`
            );


        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            data = {};

        }


        /* ---------------------------------------------
           SESSION EXPIRED
        --------------------------------------------- */

        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(
                    data,
                    "Unable to load your profile."
                )
            );

        }


        /*
         * Backend may return:
         *
         * {
         *     nickname: "...",
         *     avatar: "..."
         * }
         *
         * OR:
         *
         * {
         *     user: {...}
         * }
         *
         * OR:
         *
         * {
         *     profile: {...}
         * }
         */

        const profile =
            data.user ||
            data.profile ||
            data;


        currentProfile =
            profile;


        currentNickname =
            profile.nickname ||
            "";


        currentAvatar =
            profile.avatar ||
            "";


        /*
         * Keep navbar synchronized with
         * the actual database profile.
         */

        syncNavbarIdentity();


        renderProfile(profile);

        showProfile();


    } catch (error) {

        console.error(
            "Profile loading error:",
            error
        );


        showError(
            error.message ||
            "Unable to load your profile."
        );

    }

}


/* =========================================================
   RENDER PROFILE
========================================================= */

function renderProfile(profile) {


    /* ---------------------------------------------
       NICKNAME
    --------------------------------------------- */

    const nickname =
        profile.nickname ||
        "No MindSpeak name";


    const nicknameInput =
        document.getElementById(
            "nicknameInput"
        );


    if (nicknameInput) {

        nicknameInput.value =
            profile.nickname || "";

    }


    const profileNickname =
        document.getElementById(
            "profileNickname"
        );


    if (profileNickname) {

        profileNickname.textContent =
            nickname;

    }


    const detailNickname =
        document.getElementById(
            "detailNickname"
        );


    if (detailNickname) {

        detailNickname.textContent =
            nickname;

    }


    /* ---------------------------------------------
       ROLE
    --------------------------------------------- */

    const role =
        profile.role ||
        profile.user_role ||
        "User";


    const profileRole =
        document.getElementById(
            "profileRole"
        );


    if (profileRole) {

        profileRole.textContent =
            formatRole(role);

    }


    const detailRole =
        document.getElementById(
            "detailRole"
        );


    if (detailRole) {

        detailRole.textContent =
            formatRole(role);

    }


    /* ---------------------------------------------
       CREATED DATE
    --------------------------------------------- */

    const createdAt =
        profile.created_at ||
        profile.createdAt;


    const detailCreatedAt =
        document.getElementById(
            "detailCreatedAt"
        );


    if (detailCreatedAt) {

        detailCreatedAt.textContent =
            formatDate(createdAt);

    }


    /* ---------------------------------------------
       AVATAR
    --------------------------------------------- */

    currentAvatar =
        profile.avatar ||
        "";


    renderCurrentAvatar(
        currentAvatar
    );


    /* ---------------------------------------------
       SELECT CURRENT AVATAR
    --------------------------------------------- */

    document
        .querySelectorAll(".avatar-option")
        .forEach(button => {

            button.classList.remove(
                "selected"
            );


            if (
                currentAvatar &&
                button.dataset.avatar === currentAvatar
            ) {

                button.classList.add(
                    "selected"
                );

            }

        });


    selectedAvatar =
        currentAvatar;


    /* ---------------------------------------------
       SYNC NAVBAR
    --------------------------------------------- */

    syncNavbarIdentity();


    /* ---------------------------------------------
       RESET AVATAR SAVE BUTTON
    --------------------------------------------- */

    const saveAvatarBtn =
        document.getElementById(
            "saveAvatarBtn"
        );


    if (saveAvatarBtn) {

        saveAvatarBtn.disabled = true;

    }


    hideElement(
        "avatarSelection"
    );


    hideElement(
        "avatarStatus"
    );


    hideElement(
        "identityStatus"
    );

}


/* =========================================================
   CURRENT AVATAR DISPLAY
========================================================= */



/* =========================================================
   CURRENT AVATAR DISPLAY
========================================================= */

function renderCurrentAvatar(avatar) {

    const profileAvatar =
        document.getElementById(
            "profileAvatar"
        );


    const fallback =
        document.getElementById(
            "avatarFallback"
        );


    if (!profileAvatar) {

        return;

    }


    /* ---------------------------------------------
       UPLOADED PHOTO
    --------------------------------------------- */

    const isImage =
        avatar &&
        (
            avatar.startsWith("/frontend/") ||
            avatar.startsWith("frontend/") ||
            avatar.startsWith("http://") ||
            avatar.startsWith("https://")
        );


    if (isImage) {

        const imageUrl =
            avatar.startsWith("http")
                ? avatar
                : `${API}${avatar.startsWith("/") ? "" : "/"}${avatar}`;


        profileAvatar.innerHTML = `
            <img
                src="${imageUrl}"
                alt="Profile Avatar"
                class="profile-avatar-image"
            >
        `;


        profileAvatar.classList.remove(
            "profile-avatar-emoji"
        );


        profileAvatar.style.display =
            "flex";


        if (fallback) {

            fallback.style.display =
                "none";

        }


        return;

    }


    /* ---------------------------------------------
       EMOJI AVATAR
    --------------------------------------------- */

    profileAvatar.innerHTML = "";

    profileAvatar.textContent =
        avatar || "👤";


    profileAvatar.classList.add(
        "profile-avatar-emoji"
    );


    profileAvatar.style.display =
        "flex";


    if (fallback) {

        fallback.style.display =
            "none";

    }

}
/* =========================================================
   SELECT PROFILE PHOTO
========================================================= */

function handleProfilePhotoSelection(file) {

    if (!file) {

        return;

    }


    const allowedTypes = [
        "image/jpeg",
        "image/png"
    ];


    if (!allowedTypes.includes(file.type)) {

        showAvatarStatus(
            "Please choose a JPG or PNG image.",
            "error"
        );

        clearProfilePhotoInput();

        return;

    }


    const maxSize =
        5 * 1024 * 1024;


    if (file.size > maxSize) {

        showAvatarStatus(
            "Your image must be smaller than 5 MB.",
            "error"
        );

        clearProfilePhotoInput();

        return;

    }


    selectedProfilePhoto =
        file;


    if (profilePhotoPreviewUrl) {

        URL.revokeObjectURL(
            profilePhotoPreviewUrl
        );

    }


    profilePhotoPreviewUrl =
        URL.createObjectURL(file);


    const preview =
        document.getElementById(
            "profilePhotoPreview"
        );


    if (preview) {

        preview.innerHTML = `
            <img
                src="${profilePhotoPreviewUrl}"
                alt="Profile photo preview"
            >
        `;

    }


    const saveButton =
        document.getElementById(
            "saveAvatarBtn"
        );


    if (saveButton) {

        saveButton.disabled =
            false;

    }


    showAvatarStatus(
        "Photo selected. Click Save Avatar to save it.",
        "success"
    );

}


/* =========================================================
   SAVE PROFILE PHOTO
========================================================= */

async function saveProfilePhoto() {

    if (!requireSession()) {

        return;

    }


    if (!selectedProfilePhoto) {

        showAvatarStatus(
            "Please choose a photo first.",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "saveAvatarBtn"
        );


    setButtonLoading(
        button,
        "Saving..."
    );


    try {

        const formData =
            new FormData();


        formData.append(
            "session_token",
            getSessionToken()
        );


        formData.append(
            "avatar_type",
            "upload"
        );


        formData.append(
            "avatar_file",
            selectedProfilePhoto
        );


        const response =
            await fetch(
                `${API}/auth/update-avatar`,
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(
                    data,
                    "Unable to upload your profile photo."
                )
            );

        }


        if (data.error) {

            throw new Error(
                data.error
            );

        }


        currentAvatar =
            data.avatar || "";


        selectedAvatar =
            currentAvatar;


        syncNavbarIdentity();


        renderCurrentAvatar(
            currentAvatar
        );


        selectedProfilePhoto =
            null;


        clearProfilePhotoInput();


        if (profilePhotoPreviewUrl) {

            URL.revokeObjectURL(
                profilePhotoPreviewUrl
            );

            profilePhotoPreviewUrl =
                "";

        }


        hideElement(
            "avatarSelection"
        );


        showAvatarStatus(
            "Your profile picture has been updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Profile photo upload error:",
            error
        );


        showAvatarStatus(
            error.message ||
            "Unable to upload your profile photo.",
            "error"
        );


    } finally {

        resetButton(
            button,
            "Save Avatar"
        );

    }

}


/* =========================================================
   CLEAR PROFILE PHOTO
========================================================= */

function clearProfilePhotoInput() {

    const input =
        document.getElementById(
            "profilePhotoInput"
        );


    if (input) {

        input.value = "";

    }


    selectedProfilePhoto =
        null;

}

/* =========================================================
   SELECT AVATAR
========================================================= */

function selectAvatar(button) {

    if (!button) {

        return;

    }


    document
        .querySelectorAll(".avatar-option")
        .forEach(option => {

            option.classList.remove(
                "selected"
            );

        });


    button.classList.add(
        "selected"
    );


    selectedAvatar =
        button.dataset.avatar ||
        "";


    /* ---------------------------------------------
       SHOW PREVIEW
    --------------------------------------------- */

    const selection =
        document.getElementById(
            "avatarSelection"
        );


    const preview =
        document.getElementById(
            "selectedAvatarPreview"
        );


    const name =
        document.getElementById(
            "selectedAvatarName"
        );


    const description =
        document.getElementById(
            "selectedAvatarDescription"
        );


    if (preview) {

        preview.textContent =
            selectedAvatar;

    }


    if (name) {

        name.textContent =
            "New avatar selected";

    }


    if (description) {

        description.textContent =
            "Save this avatar to update how you appear on MindSpeak.";

    }


    if (selection) {

        selection.style.display =
            "flex";

    }


    /* ---------------------------------------------
       ENABLE SAVE BUTTON ONLY IF CHANGED
    --------------------------------------------- */

    const saveAvatarBtn =
        document.getElementById(
            "saveAvatarBtn"
        );


    if (saveAvatarBtn) {

        saveAvatarBtn.disabled =
            selectedAvatar === currentAvatar;

    }

}


/* =========================================================
   SYNC NAVBAR IDENTITY
========================================================= */

function syncNavbarIdentity() {

    const nicknameElement =
        document.getElementById(
            "navNickname"
        );


    const avatarElement =
        document.getElementById(
            "navAvatar"
        );


    /* ---------------------------------------------
       NICKNAME
    --------------------------------------------- */

    if (currentNickname) {

        localStorage.setItem(
            "nickname",
            currentNickname
        );


        if (nicknameElement) {

            nicknameElement.textContent =
                currentNickname;

        }

    } else {

        localStorage.removeItem(
            "nickname"
        );


        if (nicknameElement) {

            nicknameElement.textContent =
                "Friend";

        }

    }


    /* ---------------------------------------------
   AVATAR
--------------------------------------------- */

if (currentAvatar) {

    localStorage.setItem(
        "avatar",
        currentAvatar
    );


    if (avatarElement) {

        const isImage =
            currentAvatar.startsWith("/frontend/") ||
            currentAvatar.startsWith("frontend/") ||
            currentAvatar.startsWith("http://") ||
            currentAvatar.startsWith("https://");


        if (isImage) {

            const imageUrl =
                currentAvatar.startsWith("http")
                    ? currentAvatar
                    : `${API}${currentAvatar.startsWith("/") ? "" : "/"}${currentAvatar}`;


            avatarElement.innerHTML = `
                <img
                    src="${imageUrl}"
                    alt="Profile"
                    class="nav-avatar-image"
                >
            `;

        } else {

            avatarElement.textContent =
                currentAvatar;

        }

    }

} else {

    localStorage.removeItem(
        "avatar"
    );


    if (avatarElement) {

        avatarElement.innerHTML = "";

        avatarElement.textContent =
            "🌿";

    }

}
    /*
     * Notify other parts of MindSpeak
     * that the anonymous identity changed.
     */

    window.dispatchEvent(
        new CustomEvent(
            "mindspeakIdentityUpdated",
            {
                detail: {
                    nickname:
                        currentNickname || "",
                    avatar:
                        currentAvatar || ""
                }
            }
        )
    );

}


/* =========================================================
   UPDATE NICKNAME
========================================================= */

async function updateNickname() {

    if (!requireSession()) {

        return;

    }


    const input =
        document.getElementById(
            "nicknameInput"
        );


    if (!input) {

        return;

    }


    const nickname =
        input.value.trim();


    /* ---------------------------------------------
       VALIDATION
    --------------------------------------------- */

    if (!nickname) {

        showIdentityStatus(
            "Please enter a MindSpeak name.",
            "error"
        );

        return;

    }


    if (nickname.length < 3) {

        showIdentityStatus(
            "Your MindSpeak name must be at least 3 characters.",
            "error"
        );

        return;

    }


    if (nickname.length > 30) {

        showIdentityStatus(
            "Your MindSpeak name cannot exceed 30 characters.",
            "error"
        );

        return;

    }


    if (nickname === currentNickname) {

        showIdentityStatus(
            "This is already your current MindSpeak name.",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "saveNicknameBtn"
        );


    setButtonLoading(
        button,
        "Saving..."
    );


    try {

        const response =
            await fetch(
                `${API}/auth/update-identity`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            session_token:
                                getSessionToken(),

                            nickname:
                                nickname
                        })
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(
                    data,
                    "Unable to update your MindSpeak name."
                )
            );

        }


        /* ---------------------------------------------
           UPDATE STATE
        --------------------------------------------- */

        currentNickname =
            data.nickname !== undefined
                ? data.nickname
                : nickname;


        /*
         * Keep navbar/localStorage synchronized
         * immediately after successful update.
         */

        syncNavbarIdentity();


        /* ---------------------------------------------
           UPDATE PROFILE UI
        --------------------------------------------- */

        const profileNickname =
            document.getElementById(
                "profileNickname"
            );


        if (profileNickname) {

            profileNickname.textContent =
                currentNickname ||
                "No MindSpeak name";

        }


        const detailNickname =
            document.getElementById(
                "detailNickname"
            );


        if (detailNickname) {

            detailNickname.textContent =
                currentNickname ||
                "No MindSpeak name";

        }


        if (input) {

            input.value =
                currentNickname;

        }


        showIdentityStatus(
            "Your MindSpeak name has been updated.",
            "success"
        );


    } catch (error) {

        console.error(
            "Nickname update error:",
            error
        );


        showIdentityStatus(
            error.message ||
            "Unable to update your MindSpeak name.",
            "error"
        );

    } finally {

        resetButton(
            button,
            "Save Name"
        );

    }

}


/* =========================================================
   UPDATE AVATAR
========================================================= */

async function updateAvatar() {

    if (!requireSession()) {

        return;

    }


    if (!selectedAvatar) {

        showAvatarStatus(
            "Please choose an avatar first.",
            "error"
        );

        return;

    }


    if (
        selectedAvatar === currentAvatar
    ) {

        showAvatarStatus(
            "This is already your current avatar.",
            "error"
        );

        return;

    }


    const button =
        document.getElementById(
            "saveAvatarBtn"
        );


    setButtonLoading(
        button,
        "Saving..."
    );


    try {

        const response =
            await fetch(
                `${API}/auth/update-identity`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            session_token:
                                getSessionToken(),

                            avatar:
                                selectedAvatar
                        })
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(
                    data,
                    "Unable to update your avatar."
                )
            );

        }


        /* ---------------------------------------------
           UPDATE STATE
        --------------------------------------------- */

        currentAvatar =
            data.avatar !== undefined
                ? data.avatar
                : selectedAvatar;


        selectedAvatar =
            currentAvatar;


        /*
         * IMPORTANT:
         * Update navbar and localStorage too.
         */

        syncNavbarIdentity();


        /* ---------------------------------------------
           UPDATE DISPLAY
        --------------------------------------------- */

        renderCurrentAvatar(
            currentAvatar
        );


        document
            .querySelectorAll(".avatar-option")
            .forEach(option => {

                option.classList.toggle(
                    "selected",
                    option.dataset.avatar ===
                    currentAvatar
                );

            });


        if (button) {

            button.disabled = true;

        }


        hideElement(
            "avatarSelection"
        );


        showAvatarStatus(
            "Your avatar has been updated.",
            "success"
        );


    } catch (error) {

        console.error(
            "Avatar update error:",
            error
        );


        showAvatarStatus(
            error.message ||
            "Unable to update your avatar.",
            "error"
        );

    } finally {

        if (button) {

            button.disabled =
                selectedAvatar === currentAvatar;

            button.textContent =
                "✓ Save Avatar";

        }

    }

}


/* =========================================================
   DELETE NICKNAME
========================================================= */

async function deleteNickname() {

    if (!requireSession()) {

        return;

    }


    if (!currentNickname) {

        showIdentityStatus(
            "You do not currently have a MindSpeak name.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete your MindSpeak name?"
        );


    if (!confirmed) {

        return;

    }


    const button =
        document.getElementById(
            "deleteNicknameBtn"
        );


    setButtonLoading(
        button,
        "Deleting..."
    );


    try {

        const response =
            await fetch(
                `${API}/auth/delete-nickname`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            session_token:
                                getSessionToken()
                        })
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(
                    data,
                    "Unable to delete your MindSpeak name."
                )
            );

        }


        /* ---------------------------------------------
           CLEAR STATE
        --------------------------------------------- */

        currentNickname = "";


        /* ---------------------------------------------
           CLEAR NAVBAR + LOCAL STORAGE
        --------------------------------------------- */

        syncNavbarIdentity();


        /* ---------------------------------------------
           CLEAR INPUT
        --------------------------------------------- */

        const nicknameInput =
            document.getElementById(
                "nicknameInput"
            );


        if (nicknameInput) {

            nicknameInput.value = "";

        }


        /* ---------------------------------------------
           UPDATE PROFILE
        --------------------------------------------- */

        const profileNickname =
            document.getElementById(
                "profileNickname"
            );


        if (profileNickname) {

            profileNickname.textContent =
                "No MindSpeak name";

        }


        const detailNickname =
            document.getElementById(
                "detailNickname"
            );


        if (detailNickname) {

            detailNickname.textContent =
                "No MindSpeak name";

        }


        showIdentityStatus(
            "Your MindSpeak name has been deleted.",
            "success"
        );


    } catch (error) {

        console.error(
            "Nickname deletion error:",
            error
        );


        showIdentityStatus(
            error.message ||
            "Unable to delete your MindSpeak name.",
            "error"
        );

    } finally {

        resetButton(
            button,
            "Delete Name"
        );

    }

}


/* =========================================================
   DELETE AVATAR
========================================================= */

async function deleteAvatar() {

    if (!requireSession()) {

        return;

    }


    if (!currentAvatar) {

        showAvatarStatus(
            "You do not currently have an avatar.",
            "error"
        );

        return;

    }


    const confirmed =
        window.confirm(
            "Are you sure you want to delete your MindSpeak avatar?"
        );


    if (!confirmed) {

        return;

    }


    const button =
        document.getElementById(
            "deleteAvatarBtn"
        );


    setButtonLoading(
        button,
        "Deleting..."
    );


    try {

        const response =
            await fetch(
                `${API}/auth/delete-avatar`,
                {
                    method: "DELETE",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            session_token:
                                getSessionToken()
                        })
                }
            );


        const data =
            await parseResponse(
                response
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            handleSessionExpired();

            return;

        }


        if (!response.ok) {

            throw new Error(
                getErrorMessage(
                    data,
                    "Unable to delete your avatar."
                )
            );

        }


        /* ---------------------------------------------
           CLEAR STATE
        --------------------------------------------- */

        currentAvatar = "";
        selectedAvatar = "";


        /* ---------------------------------------------
           CLEAR NAVBAR + LOCAL STORAGE
        --------------------------------------------- */

        syncNavbarIdentity();


        /* ---------------------------------------------
           UPDATE PROFILE AVATAR
        --------------------------------------------- */

        renderCurrentAvatar("");


        /* ---------------------------------------------
           CLEAR AVATAR SELECTION
        --------------------------------------------- */

        document
            .querySelectorAll(".avatar-option")
            .forEach(option => {

                option.classList.remove(
                    "selected"
                );

            });


        const saveAvatarBtn =
            document.getElementById(
                "saveAvatarBtn"
            );


        if (saveAvatarBtn) {

            saveAvatarBtn.disabled = true;

        }


        hideElement(
            "avatarSelection"
        );


        showAvatarStatus(
            "Your avatar has been deleted.",
            "success"
        );


    } catch (error) {

        console.error(
            "Avatar deletion error:",
            error
        );


        showAvatarStatus(
            error.message ||
            "Unable to delete your avatar.",
            "error"
        );

    } finally {

        resetButton(
            button,
            "Delete Avatar"
        );

    }

}


/* =========================================================
   STATUS — IDENTITY
========================================================= */

function showIdentityStatus(
    message,
    type
) {

    const element =
        document.getElementById(
            "identityStatus"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `identity-status ${type}`;


    element.style.display =
        "block";


    clearTimeout(
        element._statusTimer
    );


    element._statusTimer =
        setTimeout(
            () => {

                element.style.display =
                    "none";

            },
            5000
        );

}


/* =========================================================
   STATUS — AVATAR
========================================================= */

function showAvatarStatus(
    message,
    type
) {

    const element =
        document.getElementById(
            "avatarStatus"
        );


    if (!element) {

        return;

    }


    element.textContent =
        message;


    element.className =
        `avatar-status ${type}`;


    element.style.display =
        "block";


    clearTimeout(
        element._statusTimer
    );


    element._statusTimer =
        setTimeout(
            () => {

                element.style.display =
                    "none";

            },
            5000
        );

}


/* =========================================================
   LOADING
========================================================= */

function showLoading() {

    const loading =
        document.getElementById(
            "loadingState"
        );


    const profile =
        document.getElementById(
            "profileCard"
        );


    const error =
        document.getElementById(
            "errorState"
        );


    if (loading) {

        loading.style.display =
            "flex";

    }


    if (profile) {

        profile.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "none";

    }

}


/* =========================================================
   SHOW PROFILE
========================================================= */

function showProfile() {

    const loading =
        document.getElementById(
            "loadingState"
        );


    const profile =
        document.getElementById(
            "profileCard"
        );


    const error =
        document.getElementById(
            "errorState"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (error) {

        error.style.display =
            "none";

    }


    if (profile) {

        profile.style.display =
            "block";

    }

}


/* =========================================================
   SHOW ERROR
========================================================= */

function showError(message) {

    const loading =
        document.getElementById(
            "loadingState"
        );


    const profile =
        document.getElementById(
            "profileCard"
        );


    const error =
        document.getElementById(
            "errorState"
        );


    const errorMessage =
        document.getElementById(
            "errorMessage"
        );


    if (loading) {

        loading.style.display =
            "none";

    }


    if (profile) {

        profile.style.display =
            "none";

    }


    if (errorMessage) {

        errorMessage.textContent =
            message;

    }


    if (error) {

        error.style.display =
            "flex";

    }

}


/* =========================================================
   HIDE ELEMENT
========================================================= */

function hideElement(id) {

    const element =
        document.getElementById(id);


    if (element) {

        element.style.display =
            "none";

    }

}


/* =========================================================
   BUTTON LOADING
========================================================= */

function setButtonLoading(
    button,
    text
) {

    if (!button) {

        return;

    }


    button.disabled = true;


    button.dataset.originalText =
        button.textContent;


    button.textContent =
        text;

}


/* =========================================================
   RESET BUTTON
========================================================= */

function resetButton(
    button,
    text
) {

    if (!button) {

        return;

    }


    button.disabled = false;


    button.textContent =
        text;

}


/* =========================================================
   RESPONSE PARSER
========================================================= */

async function parseResponse(
    response
) {

    try {

        return await response.json();

    } catch (error) {

        return {};

    }

}


/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
    data,
    fallback
) {

    if (!data) {

        return fallback;

    }


    if (
        typeof data.detail === "string"
    ) {

        return data.detail;

    }


    if (
        typeof data.error === "string"
    ) {

        return data.error;

    }


    if (
        Array.isArray(data.detail) &&
        data.detail.length > 0
    ) {

        return data.detail
            .map(item => {

                if (
                    typeof item === "string"
                ) {

                    return item;

                }


                return (
                    item.msg ||
                    "Invalid request."
                );

            })
            .join(", ");

    }


    return fallback;

}


/* =========================================================
   FORMAT ROLE
========================================================= */

function formatRole(role) {

    if (!role) {

        return "User";

    }


    return String(role)
        .charAt(0)
        .toUpperCase() +
        String(role)
            .slice(1)
            .toLowerCase();

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return value;

    }


    return date.toLocaleDateString(
        undefined,
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


/* =========================================================
   SESSION EXPIRED
========================================================= */

function handleSessionExpired() {

    localStorage.removeItem(
        "session_token"
    );


    sessionStorage.removeItem(
        "session_token"
    );


    window.location.href =
        "../login.html";

}



function escapeAttribute(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}