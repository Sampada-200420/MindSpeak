/* =========================================================
   MINDSPEAK — TOOLKIT CHECK-IN
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       ELEMENTS
       ========================================================= */

    const findToolkitButton =
        document.getElementById("find-toolkit-btn");

    const recommendation =
        document.getElementById("toolkit-recommendation");

    const recommendationTitle =
        document.getElementById("recommendation-title");

    const recommendationText =
        document.getElementById("recommendation-text");

    const recommendationLink =
        document.getElementById("recommendation-link");

    const answerCards =
        document.querySelectorAll(".answer-card");

    const simpleAnswers =
        document.querySelectorAll(".simple-answer");

    const helpCards =
        document.querySelectorAll(".help-card");

    const progressSteps =
        document.querySelectorAll(".progress-step");


    /* =========================================================
       ANSWER CARD ACCESSIBILITY
       ========================================================= */

    answerCards.forEach((card) => {

        card.setAttribute("tabindex", "0");

        card.addEventListener("keydown", (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                const input = card.querySelector("input");

                if (input) {
                    input.checked = true;
                    input.dispatchEvent(new Event("change"));
                }

            }

        });

    });


    simpleAnswers.forEach((card) => {

        card.setAttribute("tabindex", "0");

        card.addEventListener("keydown", (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                const input = card.querySelector("input");

                if (input) {
                    input.checked = true;
                    input.dispatchEvent(new Event("change"));
                }

            }

        });

    });


    helpCards.forEach((card) => {

        card.setAttribute("tabindex", "0");

        card.addEventListener("keydown", (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                const input = card.querySelector("input");

                if (input) {
                    input.checked = true;
                    input.dispatchEvent(new Event("change"));
                }

            }

        });

    });


    /* =========================================================
       PROGRESS INDICATOR
       ========================================================= */

    function updateProgress() {

        const feeling =
            document.querySelector('input[name="feeling"]:checked');

        const impact =
            document.querySelector('input[name="impact"]:checked');

        const help =
            document.querySelector('input[name="help"]:checked');


        progressSteps.forEach((step) => {
            step.classList.remove("active");
        });


        if (!feeling) {

            if (progressSteps[0]) {
                progressSteps[0].classList.add("active");
            }

            return;
        }


        if (!impact) {

            if (progressSteps[1]) {
                progressSteps[1].classList.add("active");
            }

            return;
        }


        if (!help) {

            if (progressSteps[2]) {
                progressSteps[2].classList.add("active");
            }

            return;
        }


        progressSteps.forEach((step) => {
            step.classList.add("active");
        });

    }


    document
        .querySelectorAll(
            'input[name="feeling"], input[name="impact"], input[name="help"]'
        )
        .forEach((input) => {

            input.addEventListener("change", updateProgress);

        });


    /* =========================================================
       TOOLKIT RECOMMENDATIONS
       ========================================================= */

    const toolkitData = {

        anxiety: {
            title: "Anxiety Toolkit",
            text: "Explore simple ways to understand anxious thoughts, recognise what may be happening, and practise calming strategies.",
            link: "toolkit-anxiety.html"
        },

        stress: {
            title: "Stress & Burnout Toolkit",
            text: "Learn how to recognise stress and burnout and explore practical ways to create more space for rest and recovery.",
            link: "toolkit-stress-burnout.html"
        },

        "low-mood": {
            title: "Low Mood Toolkit",
            text: "Explore gentle ways to understand low mood, reconnect with yourself, and take small steps forward.",
            link: "toolkit-low-mood.html"
        },

        sleep: {
            title: "Sleep Toolkit",
            text: "Learn more about your sleep and discover simple habits that can help you rest and recharge.",
            link: "toolkit-sleep.html"
        },

        "study-work": {
            title: "Study & Work Toolkit",
            text: "Find practical ways to manage pressure, improve focus, break tasks down, and make study or work feel more manageable.",
            link: "toolkit-study-work.html"
        },

        comparison: {
            title: "Comparison & Self-Esteem Toolkit",
            text: "Understand comparison, build a kinder relationship with yourself, and focus on your own strengths and progress.",
            link: "toolkit-comparison-self-esteem.html"
        },

        habits: {
            title: "Addiction & Habit Change Toolkit",
            text: "Understand repeating habits and explore small, realistic steps towards healthier choices.",
            link: "toolkit-addiction-habits.html"
        },

        unsure: {
            title: "Explore the Toolkit",
            text: "You don't have to know exactly where to begin. Explore all the Toolkit topics and choose what feels most relevant to you.",
            link: "toolkit.html"
        }

    };


    /* =========================================================
       FIND MY TOOLKIT
       ========================================================= */

    if (findToolkitButton) {

        findToolkitButton.addEventListener("click", () => {

            const feeling =
                document.querySelector(
                    'input[name="feeling"]:checked'
                );

            const impact =
                document.querySelector(
                    'input[name="impact"]:checked'
                );

            const help =
                document.querySelector(
                    'input[name="help"]:checked'
                );


            /* ---------------------------------------------
               Check whether all questions are answered
               --------------------------------------------- */

            if (!feeling || !impact || !help) {

                showValidationMessage();

                return;

            }


            /* ---------------------------------------------
               Determine recommendation
               --------------------------------------------- */

            let recommendationKey = feeling.value;


            /*
             * If the user selected "I'm not sure",
             * use the other answers to make a more useful
             * recommendation where possible.
             */

            if (recommendationKey === "unsure") {

                if (impact.value === "sleep") {
                    recommendationKey = "sleep";
                }

                else if (
                    impact.value === "responsibilities" ||
                    impact.value === "thoughts"
                ) {
                    recommendationKey = "stress";
                }

                else if (impact.value === "energy") {
                    recommendationKey = "low-mood";
                }

                else if (impact.value === "habits") {
                    recommendationKey = "habits";
                }

                else {
                    recommendationKey = "unsure";
                }

            }


            const data =
                toolkitData[recommendationKey] ||
                toolkitData.unsure;


            /* ---------------------------------------------
               Display recommendation
               --------------------------------------------- */

            recommendationTitle.textContent =
                data.title;

            recommendationText.textContent =
                data.text;

            recommendationLink.href =
                data.link;


            recommendation.classList.add("show");


            /* ---------------------------------------------
               Change button text
               --------------------------------------------- */

            findToolkitButton.innerHTML =
                'Recommendation Found <i class="fa-solid fa-check"></i>';


            /* ---------------------------------------------
               Scroll to result
               --------------------------------------------- */

            setTimeout(() => {

                recommendation.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

            }, 100);

        });

    }


    /* =========================================================
       VALIDATION MESSAGE
       ========================================================= */

    function showValidationMessage() {

        let message =
            document.getElementById("checkin-validation");

        if (!message) {

            message =
                document.createElement("p");

            message.id = "checkin-validation";

            message.textContent =
                "Please answer all three questions before continuing.";

            message.style.marginTop = "12px";
            message.style.color = "#a44b57";
            message.style.fontFamily = "Georgia, serif";
            message.style.fontSize = "13px";
            message.style.fontWeight = "700";

            findToolkitButton.parentElement.appendChild(message);

        }


        message.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });

    }


    /* =========================================================
       REMOVE VALIDATION MESSAGE WHEN USER ANSWERS
       ========================================================= */

    document
        .querySelectorAll(
            'input[name="feeling"], input[name="impact"], input[name="help"]'
        )
        .forEach((input) => {

            input.addEventListener("change", () => {

                const message =
                    document.getElementById("checkin-validation");

                if (message) {
                    message.remove();
                }

            });

        });


    /* =========================================================
       RESET RECOMMENDATION IF USER CHANGES ANSWERS
       ========================================================= */

    document
        .querySelectorAll(
            'input[name="feeling"], input[name="impact"], input[name="help"]'
        )
        .forEach((input) => {

            input.addEventListener("change", () => {

                if (!recommendation) {
                    return;
                }

                recommendation.classList.remove("show");

                if (findToolkitButton) {

                    findToolkitButton.innerHTML =
                        'Find My Toolkit <i class="fa-solid fa-arrow-right"></i>';

                }

            });

        });


    /* =========================================================
       INITIAL STATE
       ========================================================= */

    updateProgress();

});