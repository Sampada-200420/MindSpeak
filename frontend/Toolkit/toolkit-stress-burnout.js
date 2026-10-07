/* =========================================================
   MINDSPEAK — STRESS & BURNOUT TOOLKIT
   Page-specific JavaScript
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {


    /* =====================================================
       1. JOURNEY CARDS
       Click a card → scroll to its section
    ===================================================== */

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
       2. STRESS CHECK-IN
    ===================================================== */

    const submitCheckin =
        document.getElementById("submit-stress-checkin");

    const checkinResult =
        document.getElementById("stress-checkin-result");


    if (submitCheckin && checkinResult) {

        submitCheckin.addEventListener("click", () => {


            const frequency =
                document.querySelector(
                    'input[name="stress-frequency"]:checked'
                );


            const source =
                document.querySelector(
                    'input[name="stress-source"]:checked'
                );


            const rest =
                document.querySelector(
                    'input[name="stress-rest"]:checked'
                );


            /* ---------------------------------------------
               Check that all questions are answered
            --------------------------------------------- */

            if (!frequency || !source || !rest) {

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
               Create simple reflection
            --------------------------------------------- */

            let message = "";


            if (
                frequency.value === "Often" ||
                frequency.value === "Almost every day"
            ) {

                message += `
                    It sounds like stress has been taking up
                    quite a lot of space for you lately.
                `;

            } else {

                message += `
                    It sounds like stress has been showing up
                    from time to time for you.
                `;

            }


            message += `
                Your biggest source of pressure seems to be
                <strong>${source.value}</strong>.
            `;


            /* ---------------------------------------------
               Reflection based on rest
            --------------------------------------------- */

            if (rest.value === "Completely exhausted") {

                message += `
                    You also sound very tired right now.
                    Giving yourself some recovery time may be
                    especially important.
                `;

            } else if (rest.value === "Very tired") {

                message += `
                    Your energy seems to be running low.
                    Try protecting some time for rest and recovery.
                `;

            } else if (rest.value === "Sometimes tired") {

                message += `
                    You may benefit from creating a little more
                    space between responsibilities and recovery.
                `;

            } else {

                message += `
                    It is good that you are getting some rest.
                    Keeping that recovery time protected can help.
                `;

            }


            message += `
                <br><br>

                <strong>Remember:</strong>
                feeling stressed does not mean you are failing.
                You do not have to solve everything at once.
                Start with one small step.
            `;


            checkinResult.innerHTML = message;

            checkinResult.classList.add("show");


            checkinResult.scrollIntoView({
                behavior: "smooth",
                block: "nearest"
            });

        });

    }



    /* =====================================================
       3. "TRY IT" BUTTONS
    ===================================================== */

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
       4. KEYBOARD ACCESSIBILITY
    ===================================================== */

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