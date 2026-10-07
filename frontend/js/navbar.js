// ============================================================
// MINDSPEAK NAVBAR
// ============================================================

async function loadNavbar() {

    // ========================================================
    // CURRENT PAGE
    // ========================================================

    const currentPath = window.location.pathname;

    const currentPage =
        currentPath.split("/").pop() || "index.html";


    // ========================================================
    // FOLDER DETECTION
    // ========================================================

    const isAdmin =
        currentPath.toLowerCase().includes("/admin/");

    const isMentorPage =
        currentPath.toLowerCase().includes("/mentor/");

    const isJournalPage =
        currentPath.toLowerCase().includes("/journal/");

    const isConnectionPage =
        currentPath.toLowerCase().includes("/connection/");

    const isToolkitPage =
        currentPath.toLowerCase().includes("/toolkit/");

    const isContactPage =
        currentPath.toLowerCase().includes("/contact/");


    const isSubfolderPage =
        isAdmin ||
        isMentorPage ||
        isJournalPage ||
        isConnectionPage ||
        isToolkitPage ||
        isContactPage;


    // ========================================================
    // NAVBAR PATH
    // ========================================================

    const navbarPath =
        isSubfolderPage
            ? "../components/navbar.html"
            : "components/navbar.html";


    try {

        // ====================================================
        // LOAD NAVBAR
        // ====================================================

        const response =
            await fetch(navbarPath);


        if (!response.ok) {

            throw new Error(
                `Navbar could not be loaded. Status: ${response.status}`
            );

        }


        const navbarHTML =
            await response.text();


        // ====================================================
        // INSERT NAVBAR
        // ====================================================

        document.body.insertAdjacentHTML(
            "afterbegin",
            navbarHTML
        );


        // ====================================================
        // FIX PATHS FOR SUBFOLDERS
        // ====================================================

        if (isSubfolderPage) {

            // ------------------------------------------------
            // LOGO IMAGE
            // ------------------------------------------------

            const logoImage =
                document.querySelector("#nav-logo img");


            if (logoImage) {

                logoImage.src =
                    "../images/mindspeak.jpg";

            }


            // ------------------------------------------------
            // NAVIGATION LINKS
            // ------------------------------------------------

            document
                .querySelectorAll("#nav-links a")
                .forEach(link => {

                    const href =
                        link.getAttribute("href");


                    if (
                        href &&
                        !href.startsWith("http") &&
                        !href.startsWith("#") &&
                        !href.startsWith("../") &&
                        !href.startsWith("/")
                    ) {

                        link.setAttribute(
                            "href",
                            "../" + href
                        );

                    }

                });


            // ------------------------------------------------
            // LOGO LINK
            // ------------------------------------------------

            const navLogo =
                document.getElementById("nav-logo");


            if (navLogo) {

                navLogo.style.cursor =
                    "pointer";


                navLogo.onclick =
                    function () {

                        window.location.href =
                            "../index.html";

                    };

            }

        }


        // ====================================================
        // AUTHENTICATION
        // ====================================================

        setupAuthentication();


        // ====================================================
        // ACCESS CONTROL
        // ====================================================

        setupPageAccess(
            isJournalPage,
            isConnectionPage,
            isMentorPage,
            isAdmin
        );


        // ====================================================
        // MENTOR NAVIGATION
        // ====================================================

        setupMentorNavigation(
            isMentorPage,
            isAdmin
        );


        // ====================================================
        // ACTIVE LINK
        // ====================================================

        setActiveNavigation(
            currentPage
        );


    } catch (error) {

        console.error(
            "Navbar failed to load:",
            error
        );

    }

}


// ============================================================
// AUTHENTICATION
// ============================================================

function setupAuthentication() {

    const sessionToken =
        localStorage.getItem("session_token");


    const loggedOutNav =
        document.getElementById("loggedOutNav");


    const loggedInNav =
        document.getElementById("loggedInNav");


    // ========================================================
    // LOGGED OUT
    // ========================================================

    if (!sessionToken) {

        if (loggedOutNav) {

            loggedOutNav.style.display =
                "flex";

        }


        if (loggedInNav) {

            loggedInNav.style.display =
                "none";

        }


        // Hide restricted navigation

        const connectionLink =
            document.getElementById(
                "connectionNavLink"
            );


        const journalLink =
            document.getElementById(
                "journalNavLink"
            );


        const mentorLink =
            document.getElementById(
                "mentorNavLink"
            );


        if (connectionLink) {

            connectionLink.style.display =
                "none";

        }


        if (journalLink) {

            journalLink.style.display =
                "none";

        }


        if (mentorLink) {

            mentorLink.style.display =
                "none";

        }


        return;
    }


    // ========================================================
    // LOGGED IN
    // ========================================================

    if (loggedOutNav) {

        loggedOutNav.style.display =
            "none";

    }


    if (loggedInNav) {

        loggedInNav.style.display =
            "flex";

    }


    // ========================================================
    // SHOW CONNECTION + JOURNAL
    // ========================================================

    const connectionLink =
        document.getElementById(
            "connectionNavLink"
        );


    const journalLink =
        document.getElementById(
            "journalNavLink"
        );


    if (connectionLink) {

        connectionLink.style.display =
            "inline-block";

    }


    if (journalLink) {

        journalLink.style.display =
            "inline-block";

    }


    // ========================================================
    // USER INFORMATION
    // ========================================================

    const nickname =
        localStorage.getItem("nickname") ||
        "Friend";


    const avatar =
        localStorage.getItem("avatar") ||
        "🌿";


    const nicknameElement =
        document.getElementById(
            "navNickname"
        );


    const avatarElement =
        document.getElementById(
            "navAvatar"
        );


    if (nicknameElement) {

        nicknameElement.textContent =
            nickname;

    }


    if (avatarElement) {

        avatarElement.textContent =
            avatar;

    }


    // ========================================================
    // PROFILE BUTTON
    // ========================================================

    const profileButton =
        document.getElementById(
            "profileButton"
        );


    if (profileButton) {

        profileButton.addEventListener(
            "click",
            function () {

                const currentPath =
                    window.location.pathname;


                const isSubfolder =
                    currentPath
                        .toLowerCase()
                        .includes("/admin/") ||

                    currentPath
                        .toLowerCase()
                        .includes("/mentor/") ||

                    currentPath
                        .toLowerCase()
                        .includes("/journal/") ||

                    currentPath
                        .toLowerCase()
                        .includes("/connection/") ||

                    currentPath
                        .toLowerCase()
                        .includes("/toolkit/") ||

                    currentPath
                        .toLowerCase()
                        .includes("/contact/");


                if (isSubfolder) {

                    window.location.href =
                        "../profile.html";

                } else {

                    window.location.href =
                        "profile.html";

                }

            }
        );

    }


    // ========================================================
    // LOGOUT
    // ========================================================

    const logoutButton =
        document.getElementById(
            "logoutButton"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }

}


// ============================================================
// PAGE ACCESS CONTROL
// ============================================================

function setupPageAccess(
    isJournalPage,
    isConnectionPage,
    isMentorPage,
    isAdmin
) {

    const sessionToken =
        localStorage.getItem(
            "session_token"
        );


    const role =
        localStorage.getItem("role");


    const currentPath =
        window.location.pathname
            .toLowerCase();


    const currentPage =
        currentPath
            .split("/")
            .pop();


    // ========================================================
    // STUDENT-FACING MENTOR PAGES
    //
    // These are accessible to normal logged-in users.
    // ========================================================

    const studentMentorPages = [

        "mentor-support.html",

        "mentor-profile.html",

        "mentor-request.html",

        "mentor-conversations.html",

        "mentor-chat.html",

         "mentor-application.html"

    ];


    const isStudentMentorPage =
        studentMentorPages.includes(
            currentPage
        );


    // ========================================================
    // MENTOR-ONLY PAGES
    //
    // These require role === "mentor".
    // ========================================================

    const mentorOnlyPages = [

        "mentor-requests.html",

        "mentor-dashboard.html",

        "mentor-profile-settings.html"

    ];


    const isMentorOnlyPage =
        mentorOnlyPages.includes(
            currentPage
        );


    // ========================================================
    // LOGGED OUT USER
    // ========================================================

    if (!sessionToken) {

        // ----------------------------------------------------
        // Connection requires login
        // ----------------------------------------------------

        if (isConnectionPage) {

            window.location.href =
                getRootPath("login.html");

            return;

        }


        // ----------------------------------------------------
        // Journal requires login
        // ----------------------------------------------------

        if (isJournalPage) {

            window.location.href =
                getRootPath("login.html");

            return;

        }


        // ----------------------------------------------------
        // ANY MENTOR PAGE REQUIRES LOGIN
        // ----------------------------------------------------

        if (isMentorPage) {

            window.location.href =
                getRootPath("login.html");

            return;

        }


        // ----------------------------------------------------
        // Admin requires admin
        // ----------------------------------------------------

        if (isAdmin) {

            window.location.href =
                getRootPath("login.html");

            return;

        }


        return;
    }


    // ========================================================
    // LOGGED-IN NORMAL USER
    // ========================================================

    if (isMentorOnlyPage) {

        if (role === "admin") {

            window.location.href =
                getRootPath(
                    "admin/dashboard.html"
                );

        }

        else if (role !== "mentor") {

            window.location.href =
                getRootPath(
                    "index.html"
                );

        }

        return;
    }


    // ========================================================
    // STUDENT MENTOR PAGES
    //
    // Normal users ARE allowed here.
    // Mentors can also access them.
    // ========================================================

    if (
        isStudentMentorPage
    ) {

        return;

    }


    // ========================================================
    // OTHER MENTOR FOLDER PAGES
    //
    // Any unknown mentor page remains protected.
    // ========================================================

    if (
        isMentorPage &&
        role !== "mentor"
    ) {

        if (role === "admin") {

            window.location.href =
                getRootPath(
                    "admin/dashboard.html"
                );

        } else {

            window.location.href =
                getRootPath(
                    "index.html"
                );

        }

        return;
    }


    // ========================================================
    // ADMIN ACCESS
    // ========================================================

    if (
        isAdmin &&
        role !== "admin"
    ) {

        if (role === "mentor") {

            window.location.href =
                getRootPath(
                    "mentor/mentor-requests.html"
                );

        } else {

            window.location.href =
                getRootPath(
                    "index.html"
                );

        }

    }

}


// ============================================================
// MENTOR NAVIGATION
// ============================================================

function setupMentorNavigation(
    isMentorPage,
    isAdmin
) {

    const role =
        localStorage.getItem("role");


    const mentorLink =
        document.getElementById(
            "mentorNavLink"
        );


    if (!mentorLink) {

        return;

    }


    // ========================================================
    // ONLY MENTORS SEE MENTOR SPACE
    // ========================================================

    if (
        role === "mentor" &&
        !isAdmin
    ) {

        mentorLink.style.display =
            "inline-block";


        const currentPath =
            window.location.pathname;


        if (
            currentPath
                .toLowerCase()
                .includes("/mentor/")
        ) {

            mentorLink.classList.add(
                "active"
            );

        }

    } else {

        mentorLink.style.display =
            "none";

    }

}


// ============================================================
// ROOT PATH HELPER
// ============================================================

function getRootPath(page) {

    const currentPath =
        window.location.pathname
            .toLowerCase();


    const isSubfolder =
        currentPath.includes("/admin/") ||
        currentPath.includes("/mentor/") ||
        currentPath.includes("/journal/") ||
        currentPath.includes("/connection/") ||
        currentPath.includes("/toolkit/") ||
        currentPath.includes("/contact/");


    if (isSubfolder) {

        return "../" + page;

    }


    return page;

}


// ============================================================
// ACTIVE NAVIGATION
// ============================================================

function setActiveNavigation(
    currentPage
) {

    const links =
        document.querySelectorAll(
            "#nav-links a"
        );


    links.forEach(link => {

        const href =
            link.getAttribute("href") ||
            "";


        const linkPage =
            href
                .split("/")
                .pop()
                .split("?")[0];


        if (
            linkPage === currentPage
        ) {

            link.classList.add(
                "active"
            );

        }

    });


    // ========================================================
    // HOME
    // ========================================================

    if (
        currentPage === "index.html" ||
        currentPage === ""
    ) {

        const homeLink =
            document.querySelector(
                '#nav-links a[href="index.html"]'
            );


        if (homeLink) {

            homeLink.classList.add(
                "active"
            );

        }

    }

}


// ============================================================
// LOGOUT
// ============================================================

function logout() {

    // ========================================================
    // CLEAR LOGIN DATA
    // ========================================================

    localStorage.removeItem(
        "session_token"
    );

    localStorage.removeItem(
        "user_id"
    );

    localStorage.removeItem(
        "id"
    );

    localStorage.removeItem(
        "nickname"
    );

    localStorage.removeItem(
        "avatar"
    );

    localStorage.removeItem(
        "role"
    );


    sessionStorage.clear();


    // ========================================================
    // RETURN TO LOGIN
    // ========================================================

    window.location.href =
        getRootPath("login.html");

}


// ============================================================
// START NAVBAR
// ============================================================

loadNavbar();