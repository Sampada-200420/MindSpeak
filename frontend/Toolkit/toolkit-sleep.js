/* =========================================================
   SLEEP TOOLKIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       JOURNEY NAVIGATION
       ========================================================= */

    const journeyCards = document.querySelectorAll(".journey-card");

    journeyCards.forEach((card) => {

        card.addEventListener("click", () => {
            const targetId = card.dataset.target;
            const targetSection = document.getElementById(targetId);

            if (targetSection) {
                targetSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }
        });

        // Keyboard accessibility
        card.addEventListener("keydown", (event) => {

            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                card.click();
            }

        });

    });


    /* =========================================================
       SLEEP CHECK-IN
       ========================================================= */

    const submitButton =
        document.getElementById("submit-sleep-checkin");

    const resultBox =
        document.getElementById("sleep-checkin-result");


    if (submitButton && resultBox) {

        submitButton.addEventListener("click", () => {

            const sleepQuality =
                document.querySelector(
                    'input[name="sleep-quality"]:checked'
                );

            const sleepProblem =
                document.querySelector(
                    'input[name="sleep-problem"]:checked'
                );

            const sleepEnergy =
                document.querySelector(
                    'input[name="sleep-energy"]:checked'
                );


            /* Check that all questions are answered */

            if (!sleepQuality || !sleepProblem || !sleepEnergy) {

                resultBox.innerHTML = `
                    <strong>Almost there 🌿</strong><br>
                    Please answer all three questions first.
                    There are no right or wrong answers.
                `;

                resultBox.classList.add("show");

                return;
            }


            /* =================================================
               CREATE PERSONAL REFLECTION
               ================================================= */

            let reflection = "";


            // Sleep quality
            if (sleepQuality.value === "good") {

                reflection =
                    "It sounds like your sleep has been going reasonably well. Notice what you are already doing that helps you rest.";

            } else if (sleepQuality.value === "okay") {

                reflection =
                    "Your sleep seems to be somewhere in the middle. Small changes to your routine may help you feel more rested.";

            } else if (sleepQuality.value === "poor") {

                reflection =
                    "It sounds like your sleep has been difficult recently. Be patient with yourself and try making one small change at a time.";

            } else if (sleepQuality.value === "very-poor") {

                reflection =
                    "It sounds like sleep has been especially difficult lately. Give yourself some kindness and consider talking with someone you trust if this continues.";
            }


            // Sleep problem
            if (sleepProblem.value === "falling-asleep") {

                reflection +=
                    " Since falling asleep is difficult, creating a calm wind-down routine before bed may be worth trying.";

            } else if (sleepProblem.value === "waking-night") {

                reflection +=
                    " Since you wake during the night, keeping your sleep environment quiet, comfortable, and dark may help.";

            } else if (sleepProblem.value === "waking-early") {

                reflection +=
                    " Since you wake earlier than you would like, keeping a consistent sleep and wake routine may be useful.";

            } else if (sleepProblem.value === "irregular") {

                reflection +=
                    " Since your sleep schedule is irregular, try keeping your wake-up time more consistent from day to day.";

            } else if (sleepProblem.value === "not-sure") {

                reflection +=
                    " If you are not sure what is affecting your sleep, simply observing your routine for a few days can help you notice patterns.";
            }


            // Daytime energy
            if (sleepEnergy.value === "energized") {

                reflection +=
                    " You are still feeling energized during the day, which is a positive sign.";

            } else if (sleepEnergy.value === "okay") {

                reflection +=
                    " Your daytime energy sounds manageable, but there may still be room to improve how rested you feel.";

            } else if (sleepEnergy.value === "tired") {

                reflection +=
                    " Feeling tired during the day can be a sign that your body needs more consistent recovery.";

            } else if (sleepEnergy.value === "exhausted") {

                reflection +=
                    " Feeling exhausted during the day can be difficult. If this continues or interferes with daily life, consider reaching out to a healthcare professional or someone you trust.";
            }


            /* =================================================
               SHOW RESULT
               ================================================= */

            resultBox.innerHTML = `
                <strong>A small reflection for you:</strong><br>
                ${reflection}
            `;

            resultBox.classList.add("show");

            resultBox.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        });

    }


    /* =========================================================
       TRY IT BUTTONS
       ========================================================= */

    const tryButtons =
        document.querySelectorAll(".try-button");

    const tipMessage =
        document.getElementById("try-tip-message");


    tryButtons.forEach((button) => {

        button.addEventListener("click", () => {

            const tip = button.dataset.tip;

            if (!tipMessage || !tip) {
                return;
            }

            tipMessage.innerHTML = `
                <strong>Try this:</strong> ${tip}
            `;

            tipMessage.classList.add("show");

            tipMessage.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

        });

    });

});