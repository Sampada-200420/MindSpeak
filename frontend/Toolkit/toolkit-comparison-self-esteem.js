/* =========================================================
   COMPARISON & SELF-ESTEEM TOOLKIT
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
       COMPARISON CHECK-IN
       ========================================================= */

    const submitButton =
        document.getElementById("submit-comparison-checkin");

    const resultBox =
        document.getElementById("comparison-checkin-result");


    if (submitButton && resultBox) {

        submitButton.addEventListener("click", () => {

            const frequency =
                document.querySelector(
                    'input[name="comparison-frequency"]:checked'
                );

            const area =
                document.querySelector(
                    'input[name="comparison-area"]:checked'
                );

            const feeling =
                document.querySelector(
                    'input[name="comparison-feeling"]:checked'
                );


            /* Check all questions */

            if (!frequency || !area || !feeling) {

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


            // Comparison frequency
            if (frequency.value === "rarely") {

                reflection =
                    "It sounds like comparing yourself to others is not something that happens very often. Keep noticing what helps you stay connected to your own path.";

            } else if (frequency.value === "sometimes") {

                reflection =
                    "You sometimes find yourself comparing. When it happens, taking a short pause can help you remember that you are seeing only one part of someone else’s story.";

            } else if (frequency.value === "often") {

                reflection =
                    "Comparison seems to come up fairly often for you. It may help to notice when it happens and gently bring your attention back to your own goals and values.";

            } else {

                reflection =
                    "It sounds like comparison is a frequent experience for you. Be patient with yourself and start by noticing the situations that trigger it most.";
            }


            // Comparison area
            if (area.value === "appearance") {

                reflection +=
                    " Appearance can be especially easy to compare, particularly when we see carefully selected images. Try reminding yourself that real life is more complex than what is shown.";

            } else if (area.value === "studies-career") {

                reflection +=
                    " Everyone reaches academic and career milestones at different times. Your progress does not need to follow someone else’s timeline.";

            } else if (area.value === "money-lifestyle") {

                reflection +=
                    " Money and lifestyle can look very different from person to person. What you see from the outside rarely shows the complete picture.";

            } else if (area.value === "relationships") {

                reflection +=
                    " Relationships can easily become a source of comparison. Remember that every relationship has its own circumstances and challenges.";

            } else if (area.value === "social-media") {

                reflection +=
                    " Social media often shows selected moments rather than everyday reality. Taking breaks from comparison-heavy content may give your mind more space.";

            } else {

                reflection +=
                    " Whatever the comparison is about, try bringing your attention back to what matters to you personally.";
            }


            // Feeling after comparison
            if (feeling.value === "motivated") {

                reflection +=
                    " If comparison motivates you, use that feeling as inspiration without turning someone else’s journey into a measure of your own worth.";

            } else if (feeling.value === "neutral") {

                reflection +=
                    " Feeling neutral after comparing can be useful. Keep noticing whether certain comparisons affect you differently.";

            } else if (feeling.value === "insecure") {

                reflection +=
                    " If comparison leaves you feeling insecure, try naming one quality or achievement you genuinely value in yourself.";

            } else if (feeling.value === "discouraged") {

                reflection +=
                    " If comparison leaves you discouraged, step back and remind yourself that someone else’s progress does not erase your own.";

            } else {

                reflection +=
                    " You do not need to judge yourself for comparing. Simply noticing the feeling is already a useful first step.";
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
                document.querySelector(".extra-comparison-info");


            /* If already created, toggle it */

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

            extraInfo.className = "extra-comparison-info";

            extraInfo.textContent =
                "When you notice yourself comparing, try asking: “What do I value in my own life?” Redirecting your attention toward your own strengths, goals, and values can help you build a healthier relationship with yourself.";

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