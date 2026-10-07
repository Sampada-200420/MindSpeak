/* =========================================================
   RESOURCE VIDEO PLAYER
   ========================================================= */

(function setupResourceVideoPlayer() {

    function createVideoModal() {

        if (document.getElementById("resourceVideoModal")) {
            return;
        }

        const modal = document.createElement("div");

        modal.id = "resourceVideoModal";
        modal.className = "resource-video-modal";

        modal.innerHTML = `
            <div
                class="resource-video-backdrop"
                data-close-video>
            </div>

            <div
                class="resource-video-dialog"
                role="dialog"
                aria-modal="true"
                aria-label="Resource video player">

                <button
                    type="button"
                    class="resource-video-close"
                    aria-label="Close video"
                    data-close-video>

                    <i class="fa-solid fa-xmark"></i>

                </button>

                <div class="resource-video-frame">

                    <iframe
                        id="resourceVideoFrame"
                        src=""
                        title="MindSpeak resource video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen>
                    </iframe>

                </div>

            </div>
        `;

        document.body.appendChild(modal);


        /* =====================================================
           MODAL CSS
        ===================================================== */

        const style = document.createElement("style");

        style.textContent = `

            .resource-video-modal {
                position: fixed;
                inset: 0;
                z-index: 99999;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 24px;
            }

            .resource-video-modal.active {
                display: flex;
            }

            .resource-video-backdrop {
                position: absolute;
                inset: 0;
                background: rgba(7, 20, 30, 0.80);
                backdrop-filter: blur(4px);
            }

            .resource-video-dialog {
                position: relative;
                z-index: 2;
                width: min(960px, 100%);
                overflow: hidden;
                border-radius: 16px;
                background: #0b1e2d;
                box-shadow:
                    0 25px 70px rgba(0, 0, 0, 0.40);
            }

            .resource-video-frame {
                width: 100%;
                aspect-ratio: 16 / 9;
                background: #000;
            }

            .resource-video-frame iframe {
                width: 100%;
                height: 100%;
                display: block;
                border: none;
            }

            .resource-video-close {
                position: absolute;
                top: 12px;
                right: 12px;
                z-index: 5;

                width: 40px;
                height: 40px;

                display: flex;
                align-items: center;
                justify-content: center;

                border: 1px solid rgba(255,255,255,0.25);
                border-radius: 50%;

                background: rgba(8, 24, 35, 0.80);
                color: white;

                font-size: 16px;
                cursor: pointer;

                transition: 0.2s ease;
            }

            .resource-video-close:hover {
                background: #2f7b5d;
            }

            body.resource-video-open {
                overflow: hidden;
            }

            @media (max-width: 650px) {

                .resource-video-modal {
                    padding: 12px;
                }

                .resource-video-dialog {
                    border-radius: 11px;
                }

                .resource-video-close {
                    width: 35px;
                    height: 35px;
                }

            }

        `;

        document.head.appendChild(style);
    }


    /* =====================================================
       OPEN VIDEO
    ===================================================== */

    function openVideo(videoId) {

        if (!videoId) {
            return;
        }

        createVideoModal();

        const modal =
            document.getElementById(
                "resourceVideoModal"
            );

        const frame =
            document.getElementById(
                "resourceVideoFrame"
            );


        frame.src =
            `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;


        modal.classList.add("active");

        document.body.classList.add(
            "resource-video-open"
        );

    }


    /* =====================================================
       CLOSE VIDEO
    ===================================================== */

    function closeVideo() {

        const modal =
            document.getElementById(
                "resourceVideoModal"
            );

        const frame =
            document.getElementById(
                "resourceVideoFrame"
            );


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "active"
        );


        document.body.classList.remove(
            "resource-video-open"
        );


        /* Stop the YouTube video */

        if (frame) {
            frame.src = "";
        }

    }


    /* =====================================================
       PLAY BUTTON
    ===================================================== */

    document.addEventListener(
        "click",
        function (event) {

            const playButton =
                event.target.closest(
                    ".play-button"
                );


            if (playButton) {

                event.preventDefault();


                const videoId =
                    playButton.dataset.video;


                openVideo(videoId);

                return;

            }


            /* Close button / backdrop */

            if (
                event.target.closest(
                    "[data-close-video]"
                )
            ) {

                closeVideo();

            }

        }
    );


    /* =====================================================
       ESC KEY
    ===================================================== */

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {

                closeVideo();

            }

        }
    );


    /* Create modal when JS loads */

    createVideoModal();

})();


/* =========================================================
   RESOURCE FILTER + SEARCH
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const filterButtons =
        document.querySelectorAll(".filter-btn");

    const resourceCards =
        document.querySelectorAll(".resource-card");

    const searchInput =
        document.getElementById("resourceSearch");

    const noResults =
        document.getElementById("noResults");


    /* -----------------------------------------------
       DEFAULT CATEGORY
       ----------------------------------------------- */

    let currentFilter = "video";


    /* -----------------------------------------------
       FILTER RESOURCES
       ----------------------------------------------- */

    function filterResources() {

        const searchTerm =
            searchInput
                ? searchInput.value
                    .trim()
                    .toLowerCase()
                : "";


        let visibleCount = 0;


        resourceCards.forEach(function (card) {

            const category =
                (
                    card.dataset.category || ""
                ).toLowerCase();


            const title =
                (
                    card.dataset.title || ""
                ).toLowerCase();


            const content =
                card.textContent.toLowerCase();


            /* Category check */

            const categoryMatches =
                category === currentFilter;


            /* Search check */

            const searchMatches =
                !searchTerm ||
                title.includes(searchTerm) ||
                content.includes(searchTerm);


            /* Final result */

            const shouldShow =
                categoryMatches &&
                searchMatches;


            if (shouldShow) {

                card.style.display = "";

                visibleCount++;

            } else {

                card.style.display = "none";

            }

        });


        /* -------------------------------------------
           NO RESULTS
        ------------------------------------------- */

        if (noResults) {

            noResults.hidden =
                visibleCount !== 0;

        }

    }


    /* -----------------------------------------------
       FILTER BUTTON CLICK
       ----------------------------------------------- */

    filterButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                /* Remove active state */

                filterButtons.forEach(
                    function (btn) {

                        btn.classList.remove(
                            "active"
                        );

                        btn.setAttribute(
                            "aria-selected",
                            "false"
                        );

                    }
                );


                /* Activate clicked button */

                button.classList.add(
                    "active"
                );

                button.setAttribute(
                    "aria-selected",
                    "true"
                );


                /* Get selected category */

                currentFilter =
                    (
                        button.dataset.filter || ""
                    ).toLowerCase();


                /* Apply filter */

                filterResources();

            }
        );

    });


    /* -----------------------------------------------
       SEARCH
       ----------------------------------------------- */

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            function () {

                filterResources();

            }
        );

    }


    /* -----------------------------------------------
       INITIAL LOAD
       ----------------------------------------------- */

    filterResources();

});