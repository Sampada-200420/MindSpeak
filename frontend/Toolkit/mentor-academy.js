/* =========================================================
   MINDSPEAK — MENTOR & PROFESSIONAL TRAINING
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       START TRAINING BUTTON
       ========================================================= */

    const startTrainingButton =
        document.getElementById("start-training-btn");

    const trainingJourney =
        document.querySelector(".training-journey");

    if (startTrainingButton && trainingJourney) {

        startTrainingButton.addEventListener("click", () => {

            trainingJourney.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    }


    /* =========================================================
       THREE TRAINING CARDS
       ========================================================= */

    const trainingActions =
        document.querySelectorAll(".training-action");

    trainingActions.forEach((button) => {

        button.addEventListener("click", () => {

            const section = button.dataset.section;

            const card =
                button.closest(".training-card");

            if (!card) {
                return;
            }

            /* Remove previous selection */

            document
                .querySelectorAll(".training-card")
                .forEach((item) => {
                    item.classList.remove("selected");
                });

            /* Select current card */

            card.classList.add("selected");

            /* Small visual feedback */

            const originalText = button.innerHTML;

            if (section === "learn") {

                button.innerHTML =
                    'Learning Started <i class="fa-solid fa-check"></i>';

            } else if (section === "practice") {

                button.innerHTML =
                    'Practice Selected <i class="fa-solid fa-check"></i>';

            } else if (section === "impact") {

                button.innerHTML =
                    'Impact Path Selected <i class="fa-solid fa-check"></i>';

            }

            setTimeout(() => {
                button.innerHTML = originalText;
            }, 1800);

        });

    });


    /* =========================================================
       FINAL START TRAINING BUTTON
       ========================================================= */

    const finalButton =
        document.getElementById("final-training-btn");

    if (finalButton) {

        finalButton.addEventListener("click", () => {

            const firstCard =
                document.querySelector(".learn-card");

            if (!firstCard) {
                return;
            }

            document
                .querySelectorAll(".training-card")
                .forEach((card) => {
                    card.classList.remove("selected");
                });

            firstCard.classList.add("selected");

            firstCard.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        });

    }


    /* =========================================================
       ACCESSIBILITY
       ========================================================= */

    const buttons =
        document.querySelectorAll("button");

    buttons.forEach((button) => {

        button.addEventListener("keydown", (event) => {

            if (event.key === "Enter" || event.key === " ") {

                event.preventDefault();
                button.click();

            }

        });

    });

});