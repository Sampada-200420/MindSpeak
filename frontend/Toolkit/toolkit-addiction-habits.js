/* =========================================================
   ADDICTION & HABIT CHANGE TOOLKIT
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
       ADDICTION & HABIT CHECK-IN
       ========================================================= */

    const submitButton =
        document.getElementById("submit-addiction-checkin");

    const resultBox =
        document.getElementById("addiction-checkin-result");


    if (submitButton && resultBox) {

        submitButton.addEventListener("click", () => {

            const control =
                document.querySelector(
                    'input[name="habit-control"]:checked'
                );

            const trigger =
                document.querySelector(
                    'input[name="habit-trigger"]:checked'
                );

            const feeling =
                document.querySelector(
                    'input[name="habit-feeling"]:checked'
                );


            /* Check all questions */

            if (!control || !trigger || !feeling) {

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


            // Habit control
            if (control.value === "rarely") {

                reflection =
                    "It sounds like you generally feel able to manage this habit. Noticing what already helps you stay in control can be useful.";

            } else if (control.value === "sometimes") {

                reflection =
                    "Sometimes the habit feels difficult to control. Paying attention to what happens before the urge can help you understand the pattern.";

            } else if (control.value === "often") {

                reflection =
                    "The habit often feels difficult to control. Try focusing first on understanding the pattern rather than expecting yourself to change everything immediately.";

            } else {

                reflection =
                    "It sounds like the habit feels very difficult to control right now. Be kind to yourself and consider reaching out for support rather than trying to handle everything alone.";
            }


            // Trigger
            if (trigger.value === "stress") {

                reflection +=
                    " Stress or difficult emotions may be connected to the habit, so finding another way to manage those feelings could be a helpful place to start.";

            } else if (trigger.value === "boredom") {

                reflection +=
                    " If boredom is a common trigger, having a few alternative activities ready can give you another choice when the urge appears.";

            } else if (trigger.value === "social") {

                reflection +=
                    " Social situations may be part of the pattern. Notice which people, places, or situations make the habit easier or harder to resist.";

            } else if (trigger.value === "loneliness") {

                reflection +=
                    " If being alone is a trigger, connecting with someone you trust or choosing a meaningful activity may help you handle the moment differently.";

            } else if (trigger.value === "routine") {

                reflection +=
                    " Because routines can reinforce habits, changing one small part of the routine may create an opportunity for a different choice.";

            } else {

                reflection +=
                    " You do not have to understand every trigger immediately. Simply noticing what happens before the habit is a useful first step.";
            }


            // Feeling after habit
            if (feeling.value === "better") {

                reflection +=
                    " If the habit makes you feel better temporarily, this may be a sign that it is meeting an emotional need in the moment. Finding another way to meet that need can help.";

            } else if (feeling.value === "relieved") {

                reflection +=
                    " Feeling relieved afterward can mean the habit is providing short-term escape from something difficult. Exploring other ways to create that relief may be helpful.";

            } else if (feeling.value === "guilty") {

                reflection +=
                    " Guilt can make change harder. Try replacing self-judgment with curiosity: what happened, what triggered it, and what could you try next time?";

            } else if (feeling.value === "disappointed") {

                reflection +=
                    " Feeling disappointed is understandable, but one difficult moment does not define your progress. Use it as information rather than punishment.";

            } else {

                reflection +=
                    " Mixed feelings are completely possible. Give yourself time to understand what the habit is doing for you and what you would like to change.";
            }


            /* =================================================
               DISPLAY RESULT
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
       LEARN MORE BUTTON
       ========================================================= */

    const learnMoreButton =
        document.querySelector(".learn-more-button");

    if (learnMoreButton) {

        learnMoreButton.addEventListener("click", () => {

            const understandingContent =
                document.querySelector(".understanding-content");

            if (!understandingContent) {
                return;
            }

            let extraInfo =
                document.querySelector(".extra-addiction-info");


            /* Toggle existing information */

            if (extraInfo) {

                extraInfo.classList.toggle("show");

                if (extraInfo.classList.contains("show")) {

                    learnMoreButton.innerHTML =
                        'Show Less <i class="fa-solid fa-arrow-up"></i>';

                } else {

                    learnMoreButton.innerHTML =
                        'Learn More <i class="fa-solid fa-arrow-right"></i>';

                }

                return;
            }


            /* Create additional information */

            extraInfo = document.createElement("p");

            extraInfo.className = "extra-addiction-info";

            extraInfo.textContent =
                "A useful way to understand a habit is to notice the cycle: something triggers an urge, the behaviour happens, and you experience a short-term result. Identifying this pattern can help you decide where a small change might be possible.";

            extraInfo.style.marginTop = "8px";
            extraInfo.style.color = "#23486f";
            extraInfo.style.fontFamily = "Georgia, serif";
            extraInfo.style.fontSize = "13px";
            extraInfo.style.lineHeight = "1.4";

            understandingContent.insertBefore(
                extraInfo,
                learnMoreButton
            );

            extraInfo.classList.add("show");

            learnMoreButton.innerHTML =
                'Show Less <i class="fa-solid fa-arrow-up"></i>';

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