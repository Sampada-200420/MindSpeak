/* =========================================================
   MINDSPEAK — PROFESSIONAL SUPPORT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       EXPLORE PROFESSIONAL PATH
       ========================================================= */

    const exploreButton =
        document.getElementById("explore-professional-btn");

    const professionalGuide =
        document.getElementById("professional-guide");


    if (exploreButton && professionalGuide) {

        exploreButton.addEventListener("click", () => {

            professionalGuide.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    }


    /* =========================================================
       CONTRIBUTION CARD INTERACTION
       ========================================================= */

    const contributionCards =
        document.querySelectorAll(".contribution-card");

    contributionCards.forEach((card) => {

        card.addEventListener("click", () => {

            contributionCards.forEach((item) => {
                item.classList.remove("selected");
            });

            card.classList.add("selected");

        });

    });


    /* =========================================================
       FINAL START BUTTON
       ========================================================= */

    const finalButton =
        document.getElementById("start-professional-btn");


    if (finalButton && professionalGuide) {

        finalButton.addEventListener("click", () => {

            professionalGuide.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    }


    /* =========================================================
       SMOOTH SCROLL FOR CONTRIBUTION CARDS
       ========================================================= */

    const pathwaySteps =
        document.querySelectorAll(".pathway-step");

    pathwaySteps.forEach((step, index) => {

        step.style.cursor = "pointer";

        step.addEventListener("click", () => {

            const targetIds = [
                "professional-involvement",
                "application-verification",
                "community-contribution",
                "mindspeak-participation"
            ];

            const target =
                document.getElementById(targetIds[index]);

            if (target) {

                target.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }

        });

    });


    /* =========================================================
       KEYBOARD ACCESSIBILITY
       ========================================================= */

    contributionCards.forEach((card) => {

        card.setAttribute("tabindex", "0");

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
       HIGHLIGHT SELECTED CONTRIBUTION
       ========================================================= */

    const style =
        document.createElement("style");

    style.textContent = `
        .contribution-card.selected {
            transform: translateY(-4px);
            box-shadow: 0 10px 25px rgba(35, 55, 70, 0.12);
        }

        .pathway-step:hover {
            transform: translateX(4px);
        }

        .pathway-step {
            transition: 0.2s ease;
        }
    `;

    document.head.appendChild(style);

});