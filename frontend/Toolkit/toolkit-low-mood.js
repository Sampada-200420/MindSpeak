document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       JOURNEY CARD SMOOTH SCROLL
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

        card.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                card.click();
            }
        });

        card.setAttribute("tabindex", "0");
        card.setAttribute("role", "button");
    });


    /* =========================================================
       LOW MOOD CHECK-IN
       ========================================================= */

    const submitButton = document.getElementById("submit-low-mood-checkin");
    const resultBox = document.getElementById("low-mood-checkin-result");

    if (submitButton && resultBox) {

        submitButton.addEventListener("click", () => {

            const frequency = document.querySelector(
                'input[name="mood-frequency"]:checked'
            );

            const source = document.querySelector(
                'input[name="mood-source"]:checked'
            );

            const interest = document.querySelector(
                'input[name="mood-interest"]:checked'
            );

            if (!frequency || !source || !interest) {
                resultBox.textContent =
                    "Please answer all three questions first. There are no right or wrong answers.";
                resultBox.classList.add("show");
                return;
            }

            let reflection = "";

            if (
                frequency.value === "often" ||
                frequency.value === "very-low"
            ) {
                reflection =
                    "It sounds like your mood has been difficult lately. Be gentle with yourself and focus on small steps rather than trying to fix everything at once.";
            } else if (frequency.value === "up-down") {
                reflection =
                    "Your mood seems to have been changing recently. Notice what makes the difficult moments heavier and what helps you feel a little better.";
            } else {
                reflection =
                    "It sounds like there are still some okay moments for you. Paying attention to what supports those moments can help you build more of them.";
            }

            if (
                interest.value === "much-less" ||
                interest.value === "almost-nothing"
            ) {
                reflection +=
                    " You also mentioned having less interest or enjoyment. Giving yourself support and talking with someone you trust may be helpful.";
            }

            if (source.value === "loneliness") {
                reflection +=
                    " Since loneliness is part of what you are experiencing, even one small connection with another person can be a meaningful step.";
            } else if (source.value === "relationships") {
                reflection +=
                    " Relationships can affect mood deeply, so giving yourself space and choosing someone safe to talk to can help.";
            } else if (source.value === "studies-work") {
                reflection +=
                    " When studies or work are weighing on you, breaking responsibilities into smaller tasks can make things feel more manageable.";
            } else if (source.value === "life-changes") {
                reflection +=
                    " Changes in life can take time to adjust to. You do not have to have everything figured out immediately.";
            }

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
       TRY SECTION
       ========================================================= */

    const tryButtons = document.querySelectorAll(".try-button");
    const tipMessage = document.querySelector(".try-tip-message");

    tryButtons.forEach((button) => {
        button.addEventListener("click", () => {

            const tip = button.dataset.tip;

            if (!tipMessage || !tip) return;

            tipMessage.textContent = tip;
            tipMessage.classList.add("show");

            tipMessage.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        });
    });

});