/* =========================================================
   MINDSPEAK — ANXIETY TOOLKIT
   Page-specific JavaScript
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

 


    /* =====================================================
       3. JOURNEY CARDS
       Click a card → scroll to that section
    ====================================================== */

    const journeyCards = document.querySelectorAll(".journey-card");

    journeyCards.forEach(card => {

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

    });


    /* =====================================================
       4. ANXIETY CHECK-IN
    ====================================================== */

    const submitCheckin =
        document.getElementById("submit-anxiety-checkin");

    const checkinResult =
        document.getElementById("anxiety-checkin-result");


    if (submitCheckin && checkinResult) {

        submitCheckin.addEventListener("click", () => {

            const frequency =
                document.querySelector(
                    'input[name="anxiety-frequency"]:checked'
                );

            const trigger =
                document.querySelector(
                    'input[name="anxiety-trigger"]:checked'
                );

            const control =
                document.querySelector(
                    'input[name="anxiety-control"]:checked'
                );


            /* ---------------------------------------------
               Make sure all three questions are answered
            --------------------------------------------- */

            if (!frequency || !trigger || !control) {

                checkinResult.innerHTML = `
                    <strong>Almost there.</strong>
                    Please answer all three questions so you
                    can get a more useful reflection.
                `;

                checkinResult.classList.add("show");

                checkinResult.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest"
                });

                return;
            }


            /* ---------------------------------------------
               Simple reflection based on answers
            --------------------------------------------- */

            let message = "";


            if (
                frequency.value === "Often" ||
                frequency.value === "Almost every day"
            ) {

                message += `
                    It sounds like anxiety has been showing up
                    quite often for you.
                `;

            } else {

                message += `
                    It sounds like anxiety has been showing up
                    from time to time for you.
                `;

            }


            message += `
                Your main trigger seems to be
                <strong>${trigger.value}</strong>.
            `;


            if (
                control.value === "Very difficult"
            ) {

                message += `
                    Since calming yourself feels very difficult,
                    try starting with one small calming activity
                    from the section below.
                `;

            } else if (
                control.value === "A little difficult"
            ) {

                message += `
                    A few simple grounding or breathing habits
                    may help you feel more in control.
                `;

            } else {

                message += `
                    It sounds like you already have some ability
                    to calm yourself. Small habits can help you
                    strengthen that feeling.
                `;

            }


            message += `
                <br><br>
                <strong>Remember:</strong>
                this check-in is simply a moment to understand
                yourself. There are no right or wrong answers.
            `;


            checkinResult.innerHTML = message;

            checkinResult.classList.add("show");


            /* ---------------------------------------------
               Scroll to result
            --------------------------------------------- */

            checkinResult.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        });

    }


    /* =====================================================
       5. "TRY IT" BUTTONS
    ====================================================== */

    const tryButtons =
        document.querySelectorAll(".try-button");

    const tryTipMessage =
        document.getElementById("try-tip-message");


    tryButtons.forEach(button => {

        button.addEventListener("click", () => {

            if (!tryTipMessage) {
                return;
            }

            const tip = button.dataset.tip;

            if (!tip) {
                return;
            }


            tryTipMessage.innerHTML = `
                <strong>Give it a try:</strong>
                ${tip}
            `;

            tryTipMessage.classList.add("show");


            tryTipMessage.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        });

    });


    /* =====================================================
       6. KEYBOARD ACCESSIBILITY
    ====================================================== */

    journeyCards.forEach(card => {

        card.addEventListener("keydown", event => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                card.click();

            }

        });

    });

});