/* =========================================================
   STUDY & WORK TOOLKIT
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
       STUDY & WORK CHECK-IN
       ========================================================= */

    const submitButton =
        document.getElementById("submit-study-work-checkin");

    const resultBox =
        document.getElementById("study-work-checkin-result");


    if (submitButton && resultBox) {

        submitButton.addEventListener("click", () => {

            const workload =
                document.querySelector(
                    'input[name="workload"]:checked'
                );

            const challenge =
                document.querySelector(
                    'input[name="challenge"]:checked'
                );

            const confidence =
                document.querySelector(
                    'input[name="confidence"]:checked'
                );


            /* Check all questions */

            if (!workload || !challenge || !confidence) {

                resultBox.innerHTML = `
                    <strong>Almost there 🌿</strong><br>
                    Please answer all three questions first.
                    There are no right or wrong answers.
                `;

                resultBox.classList.add("show");

                return;
            }


            /* =================================================
               CREATE REFLECTION
               ================================================= */

            let reflection = "";


            // Workload
            if (workload.value === "manageable") {

                reflection =
                    "Your workload sounds manageable right now. Keep using the routines and habits that are helping you stay in control.";

            } else if (workload.value === "little-overwhelming") {

                reflection =
                    "It sounds like your workload is starting to feel a little heavy. Breaking your responsibilities into smaller steps may make them easier to handle.";

            } else if (workload.value === "very-overwhelming") {

                reflection =
                    "It sounds like you have a lot on your plate right now. You do not need to solve everything at once—start with one small, important task.";

            } else {

                reflection =
                    "It can sometimes be difficult to see how much is on your plate. Taking a moment to list your current tasks may help you understand what needs attention first.";
            }


            // Challenge
            if (challenge.value === "procrastination") {

                reflection +=
                    " Since procrastination is a challenge, try starting with just five minutes instead of waiting until you feel completely motivated.";

            } else if (challenge.value === "lack-of-focus") {

                reflection +=
                    " If focus is difficult, remove one distraction and try a short 10–25 minute focus session.";

            } else if (challenge.value === "low-motivation") {

                reflection +=
                    " When motivation is low, starting with a very small action can be easier than trying to finish the whole task.";

            } else if (challenge.value === "too-much") {

                reflection +=
                    " If there is too much to do, choose the most important task first and break it into smaller actions.";

            } else {

                reflection +=
                    " Whatever your current challenge is, remember that progress does not have to happen all at once.";
            }


            // Confidence
            if (confidence.value === "very-confident") {

                reflection +=
                    " Your confidence is a useful strength—use it to keep building steady progress.";

            } else if (confidence.value === "somewhat-confident") {

                reflection +=
                    " You have some confidence already. Give yourself evidence of progress by noticing the small things you accomplish.";

            } else if (confidence.value === "not-very-confident") {

                reflection +=
                    " It is okay to feel unsure about your goals. Focus on what you can do today rather than judging yourself by the final result.";

            } else {

                reflection +=
                    " You do not need to know everything right now. Taking one small step can help you understand what comes next.";
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
                document.querySelector(".extra-study-info");

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


            extraInfo = document.createElement("p");

            extraInfo.className = "extra-study-info";

            extraInfo.textContent =
                "Try choosing one priority, setting a realistic amount of time to work, and taking short breaks. A routine that you can repeat is often more useful than trying to work perfectly.";

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