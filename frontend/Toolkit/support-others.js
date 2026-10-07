/* =========================================================
   MINDSPEAK — SUPPORT OTHERS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       SKILL NAVIGATION
       ========================================================= */

    const skillCards = document.querySelectorAll(".skill-nav-card");

    skillCards.forEach((card) => {

        card.addEventListener("click", () => {

            const targetId = card.dataset.skill;
            const targetSection = document.getElementById(targetId);

            if (!targetSection) {
                return;
            }

            /* Update active skill */

            skillCards.forEach((item) => {
                item.classList.remove("active");
            });

            card.classList.add("active");


            /* Scroll to selected skill */

            targetSection.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });


    /* =========================================================
       UPDATE ACTIVE SKILL WHILE SCROLLING
       ========================================================= */

    const skillSections = document.querySelectorAll(
        ".support-skill-section"
    );

    const sectionObserver = new IntersectionObserver(
        (entries) => {

            entries.forEach((entry) => {

                if (!entry.isIntersecting) {
                    return;
                }

                const currentId = entry.target.id;

                skillCards.forEach((card) => {

                    card.classList.toggle(
                        "active",
                        card.dataset.skill === currentId
                    );

                });

            });

        },
        {
            threshold: 0.35
        }
    );


    skillSections.forEach((section) => {
        sectionObserver.observe(section);
    });


    /* =========================================================
       KEYBOARD ACCESSIBILITY
       ========================================================= */

    skillCards.forEach((card) => {

        card.addEventListener("keydown", (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();
                card.click();

            }

        });

    });


    /* =========================================================
       LEARN TO SUPPORT — SMALL INTERACTION
       ========================================================= */

    const skillMainCards =
        document.querySelectorAll(".skill-main-card");

    skillMainCards.forEach((card) => {

        card.addEventListener("mouseenter", () => {
            card.classList.add("skill-card-active");
        });

        card.addEventListener("mouseleave", () => {
            card.classList.remove("skill-card-active");
        });

    });


    /* =========================================================
       CONVERSATION EXAMPLES
       ========================================================= */

    const goodExamples =
        document.querySelectorAll(".example-good");

    goodExamples.forEach((example) => {

        example.addEventListener("click", () => {

            example.classList.toggle("example-highlight");

        });

    });


    /* =========================================================
       BACK TO TOP WHEN RETURNING TO TOOLKIT
       ========================================================= */

    const backButton =
        document.querySelector(".back-to-toolkit");

    if (backButton) {

        backButton.addEventListener("click", () => {

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        });

    }

});