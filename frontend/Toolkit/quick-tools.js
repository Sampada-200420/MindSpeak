/* =========================================================
   MINDSPEAK — QUICK TOOLS
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const toolCards = document.querySelectorAll(".tool-card");
    const toolArea = document.getElementById("tool-area");

    const toolTitle = document.getElementById("tool-title");
    const toolDescription = document.getElementById("tool-description");
    const toolContent = document.getElementById("tool-content");
    const completeButton = document.getElementById("complete-tool");


    /* =========================================================
       TOOL DATA
       ========================================================= */

    const tools = {

        breathing: {
            title: "Take a Breath",
            description:
                "Give yourself one quiet minute. Follow the rhythm below and let your breathing become slower and easier.",

            content: `
                <div class="breathing-tool">

                    <div class="breathing-circle" id="breathing-circle">
                        <span id="breathing-text">Get Ready</span>
                    </div>

                    <p class="breathing-instruction" id="breathing-instruction">
                        When you're ready, start the exercise.
                    </p>

                    <button type="button"
                            class="exercise-button"
                            id="start-breathing">
                        Start Breathing
                        <i class="fa-solid fa-play"></i>
                    </button>

                </div>
            `
        },


        grounding: {
            title: "Ground Yourself",
            description:
                "Use your senses to bring your attention back to the present moment.",

            content: `
                <div class="grounding-tool">

                    <p class="exercise-intro">
                        Look around you and notice:
                    </p>

                    <div class="grounding-list">

                        <label>
                            <input type="checkbox">
                            <span>5 things you can see</span>
                        </label>

                        <label>
                            <input type="checkbox">
                            <span>4 things you can touch</span>
                        </label>

                        <label>
                            <input type="checkbox">
                            <span>3 things you can hear</span>
                        </label>

                        <label>
                            <input type="checkbox">
                            <span>2 things you can smell</span>
                        </label>

                        <label>
                            <input type="checkbox">
                            <span>1 thing you appreciate right now</span>
                        </label>

                    </div>

                    <p class="exercise-note">
                        You don't need to rush. Take your time with each one.
                    </p>

                </div>
            `
        },


        reset: {
            title: "One-Minute Reset",
            description:
                "Pause for a moment and give your mind a chance to reset before you continue.",

            content: `
                <div class="reset-tool">

                    <div class="reset-steps">

                        <div class="reset-step">
                            <span>1</span>
                            <div>
                                <strong>Pause</strong>
                                <p>
                                    Put down what you're doing for a moment.
                                </p>
                            </div>
                        </div>

                        <div class="reset-step">
                            <span>2</span>
                            <div>
                                <strong>Breathe</strong>
                                <p>
                                    Take one slow, comfortable breath.
                                </p>
                            </div>
                        </div>

                        <div class="reset-step">
                            <span>3</span>
                            <div>
                                <strong>Notice</strong>
                                <p>
                                    Ask yourself: “What do I need right now?”
                                </p>
                            </div>
                        </div>

                        <div class="reset-step">
                            <span>4</span>
                            <div>
                                <strong>Continue</strong>
                                <p>
                                    Choose only the next small thing to do.
                                </p>
                            </div>
                        </div>

                    </div>

                </div>
            `
        },


        reflection: {
            title: "Quick Reflection",
            description:
                "Putting your thoughts into words can help you understand what is taking up space in your mind.",

            content: `
                <div class="reflection-tool">

                    <label for="reflection-text">
                        What's on your mind right now?
                    </label>

                    <textarea
                        id="reflection-text"
                        placeholder="Write whatever comes to mind..."
                        rows="4"></textarea>

                    <label for="reflection-need">
                        What do you think you need most right now?
                    </label>

                    <textarea
                        id="reflection-need"
                        placeholder="For example: rest, space, support, reassurance..."
                        rows="3"></textarea>

                    <button
                        type="button"
                        class="exercise-button"
                        id="save-reflection">

                        Save Reflection
                        <i class="fa-solid fa-check"></i>

                    </button>

                    <p
                        id="reflection-saved"
                        class="exercise-success">
                    </p>

                </div>
            `
        },


        kindness: {
            title: "Be Kinder to Yourself",
            description:
                "Notice how you are speaking to yourself and try replacing one harsh thought with something more balanced.",

            content: `
                <div class="kindness-tool">

                    <label for="harsh-thought">
                        What is the harsh thought you're having?
                    </label>

                    <textarea
                        id="harsh-thought"
                        placeholder="Write the thought here..."
                        rows="3"></textarea>

                    <div class="kindness-example">

                        <i class="fa-regular fa-heart"></i>

                        <div>
                            <strong>
                                Now imagine a friend said this about themselves.
                            </strong>

                            <p>
                                What would you say to them?
                            </p>
                        </div>

                    </div>

                    <label for="kind-thought">
                        Write a kinder and more realistic response.
                    </label>

                    <textarea
                        id="kind-thought"
                        placeholder="Try speaking to yourself like you would speak to someone you care about..."
                        rows="3"></textarea>

                    <button
                        type="button"
                        class="exercise-button"
                        id="save-kindness">

                        Keep This Thought
                        <i class="fa-solid fa-heart"></i>

                    </button>

                    <p
                        id="kindness-saved"
                        class="exercise-success">
                    </p>

                </div>
            `
        },


        "next-step": {
            title: "Find Your Next Step",
            description:
                "When everything feels like too much, you don't need to solve everything. Just choose one small next step.",

            content: `
                <div class="next-step-tool">

                    <p class="exercise-intro">
                        Which area needs your attention first?
                    </p>

                    <div class="next-step-options">

                        <button type="button" class="next-choice">
                            <i class="fa-solid fa-bed"></i>
                            Rest
                        </button>

                        <button type="button" class="next-choice">
                            <i class="fa-solid fa-glass-water"></i>
                            Take care of myself
                        </button>

                        <button type="button" class="next-choice">
                            <i class="fa-solid fa-message"></i>
                            Talk to someone
                        </button>

                        <button type="button" class="next-choice">
                            <i class="fa-solid fa-list-check"></i>
                            Do one task
                        </button>

                    </div>

                    <div
                        id="next-step-result"
                        class="next-step-result">
                    </div>

                </div>
            `
        }

    };


    /* =========================================================
       OPEN TOOL
       ========================================================= */

    function openTool(toolName) {

        const selectedTool = tools[toolName];

        if (!selectedTool) {
            return;
        }

        /* Update content */

        toolTitle.textContent = selectedTool.title;
        toolDescription.textContent = selectedTool.description;
        toolContent.innerHTML = selectedTool.content;


        /* Show completion button */

        completeButton.classList.add("show");


        /* Highlight selected card */

        toolCards.forEach((card) => {

            card.classList.remove("selected");

            if (card.dataset.tool === toolName) {
                card.classList.add("selected");
            }

        });


        /* Scroll to tool */

        toolArea.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });


        /* Start individual tool interactions */

        setupToolInteractions(toolName);

    }


    /* =========================================================
       TOOL CARD CLICK
       ========================================================= */

    toolCards.forEach((card) => {

        card.addEventListener("click", (event) => {

            /*
             * Prevent the card click from firing twice
             * when the inner button itself is clicked.
             */

            if (event.target.closest(".tool-button")) {
                event.preventDefault();
            }

            const toolName = card.dataset.tool;

            openTool(toolName);

        });


        /* Keyboard support */

        card.addEventListener("keydown", (event) => {

            if (
                event.key === "Enter" ||
                event.key === " "
            ) {

                event.preventDefault();

                openTool(card.dataset.tool);

            }

        });

    });


    /* =========================================================
       INDIVIDUAL TOOL INTERACTIONS
       ========================================================= */

    function setupToolInteractions(toolName) {


        /* -----------------------------------------------------
           BREATHING
           ----------------------------------------------------- */

        if (toolName === "breathing") {

            const startButton =
                document.getElementById("start-breathing");

            const circle =
                document.getElementById("breathing-circle");

            const text =
                document.getElementById("breathing-text");

            const instruction =
                document.getElementById("breathing-instruction");


            if (!startButton) {
                return;
            }


            startButton.addEventListener("click", () => {

                startButton.disabled = true;
                startButton.innerHTML =
                    'Breathing... <i class="fa-solid fa-wind"></i>';

                let cycle = 0;

                const phases = [
                    {
                        name: "Breathe In",
                        duration: 4000
                    },
                    {
                        name: "Hold",
                        duration: 2000
                    },
                    {
                        name: "Breathe Out",
                        duration: 6000
                    }
                ];


                function runPhase(index) {

                    if (cycle >= 3) {

                        text.textContent = "Well Done";
                        instruction.textContent =
                            "Take one more comfortable breath and notice how you feel.";

                        startButton.disabled = false;
                        startButton.innerHTML =
                            'Do It Again <i class="fa-solid fa-rotate"></i>';

                        return;
                    }


                    const phase = phases[index];

                    text.textContent = phase.name;


                    if (phase.name === "Breathe In") {
                        circle.classList.add("breathing-in");
                        circle.classList.remove("breathing-out");
                    }

                    if (phase.name === "Breathe Out") {
                        circle.classList.add("breathing-out");
                        circle.classList.remove("breathing-in");
                    }


                    instruction.textContent =
                        `${phase.name} slowly and comfortably.`;


                    setTimeout(() => {

                        const nextIndex =
                            (index + 1) % phases.length;

                        if (nextIndex === 0) {
                            cycle++;
                        }

                        runPhase(nextIndex);

                    }, phase.duration);

                }


                runPhase(0);

            });

        }


        /* -----------------------------------------------------
           REFLECTION
           ----------------------------------------------------- */

        if (toolName === "reflection") {

            const saveButton =
                document.getElementById("save-reflection");

            const savedMessage =
                document.getElementById("reflection-saved");


            if (saveButton) {

                saveButton.addEventListener("click", () => {

                    const thought =
                        document.getElementById("reflection-text").value.trim();

                    const need =
                        document.getElementById("reflection-need").value.trim();


                    if (!thought && !need) {

                        savedMessage.textContent =
                            "Write a little something first.";

                        savedMessage.classList.add("warning");

                        return;

                    }


                    savedMessage.textContent =
                        "Your reflection has been recorded for this moment.";

                    savedMessage.classList.remove("warning");
                    savedMessage.classList.add("success");

                });

            }

        }


        /* -----------------------------------------------------
           KINDNESS
           ----------------------------------------------------- */

        if (toolName === "kindness") {

            const saveButton =
                document.getElementById("save-kindness");

            const savedMessage =
                document.getElementById("kindness-saved");


            if (saveButton) {

                saveButton.addEventListener("click", () => {

                    const thought =
                        document.getElementById("harsh-thought").value.trim();

                    const kindThought =
                        document.getElementById("kind-thought").value.trim();


                    if (!thought || !kindThought) {

                        savedMessage.textContent =
                            "Complete both thoughts before saving.";

                        savedMessage.classList.add("warning");

                        return;

                    }


                    savedMessage.textContent =
                        "Keep that kinder thought with you.";

                    savedMessage.classList.remove("warning");
                    savedMessage.classList.add("success");

                });

            }

        }


        /* -----------------------------------------------------
           NEXT STEP
           ----------------------------------------------------- */

        if (toolName === "next-step") {

            const choices =
                document.querySelectorAll(".next-choice");

            const result =
                document.getElementById("next-step-result");


            choices.forEach((choice) => {

                choice.addEventListener("click", () => {

                    choices.forEach((item) => {
                        item.classList.remove("selected");
                    });

                    choice.classList.add("selected");


                    const selectedText =
                        choice.textContent.trim();


                    result.innerHTML = `
                        <i class="fa-solid fa-leaf"></i>
                        <span>
                            Your next small step:
                            <strong>${selectedText}</strong>.
                            You don't have to do everything today.
                        </span>
                    `;

                });

            });

        }

    }


    /* =========================================================
       COMPLETE TOOL
       ========================================================= */

    if (completeButton) {

        completeButton.addEventListener("click", () => {

            completeButton.innerHTML =
                'Completed <i class="fa-solid fa-check"></i>';

            completeButton.disabled = true;

            completeButton.style.opacity = "0.75";


            setTimeout(() => {

                completeButton.disabled = false;
                completeButton.style.opacity = "1";

                completeButton.innerHTML =
                    'I’m Done <i class="fa-solid fa-check"></i>';

            }, 1800);

        });

    }


    /* =========================================================
       ADD DYNAMIC TOOL STYLES
       ========================================================= */

    const dynamicStyles =
        document.createElement("style");

    dynamicStyles.textContent = `

        .tool-card.selected {
            transform: translateY(-5px);
            box-shadow: 0 10px 25px rgba(39, 65, 76, 0.12);
            outline: 2px solid rgba(65, 133, 118, 0.35);
            outline-offset: 2px;
        }

        .breathing-tool {
            text-align: center;
            padding: 8px 0;
        }

        .breathing-circle {
            width: 110px;
            height: 110px;
            margin: 0 auto 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #dceee7;
            color: #286d60;
            font-family: Georgia, serif;
            font-size: 13px;
            font-weight: 700;
            transition:
                transform 4s ease,
                background 4s ease;
        }

        .breathing-circle.breathing-in {
            transform: scale(1.25);
        }

        .breathing-circle.breathing-out {
            transform: scale(0.9);
        }

        .breathing-instruction {
            margin-bottom: 12px;
            color: #61747c;
            font-family: Georgia, serif;
            font-size: 12px;
        }

        .exercise-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 9px 17px;
            border: none;
            border-radius: 7px;
            background: #287569;
            color: white;
            font-family: Georgia, serif;
            font-size: 12px;
            font-weight: 700;
            cursor: pointer;
        }

        .exercise-button:hover {
            background: #1e6258;
        }

        .exercise-button:disabled {
            cursor: default;
        }

        .grounding-tool,
        .reflection-tool,
        .kindness-tool,
        .reset-tool,
        .next-step-tool {
            font-family: Georgia, serif;
        }

        .exercise-intro {
            margin-bottom: 12px;
            color: #425d6d;
            font-size: 13px;
            font-weight: 700;
        }

        .grounding-list {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
        }

        .grounding-list label {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 9px 11px;
            border-radius: 7px;
            background: #f3f8f6;
            color: #526b78;
            font-size: 12px;
            cursor: pointer;
        }

        .grounding-list label:has(input:checked) {
            background: #e1f1eb;
            color: #286d60;
        }

        .grounding-list input {
            accent-color: #287569;
        }

        .exercise-note {
            margin-top: 11px;
            color: #7a878c;
            font-size: 11px;
            font-style: italic;
        }

        .reset-steps {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
        }

        .reset-step {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px;
            border-radius: 8px;
            background: #f7faf8;
        }

        .reset-step > span {
            width: 27px;
            height: 27px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: #dceee7;
            color: #287569;
            font-size: 11px;
            font-weight: 700;
        }

        .reset-step strong {
            color: #36556a;
            font-size: 12px;
        }

        .reset-step p {
            margin-top: 2px;
            color: #708087;
            font-size: 10px;
        }

        .reflection-tool,
        .kindness-tool {
            display: grid;
            gap: 8px;
        }

        .reflection-tool label,
        .kindness-tool label {
            color: #425d6d;
            font-size: 12px;
            font-weight: 700;
        }

        .reflection-tool textarea,
        .kindness-tool textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #dce6e2;
            border-radius: 8px;
            outline: none;
            resize: vertical;
            color: #425d6d;
            background: #fbfdfc;
            font-family: Georgia, serif;
            font-size: 12px;
        }

        .reflection-tool textarea:focus,
        .kindness-tool textarea:focus {
            border-color: #70a497;
        }

        .exercise-success {
            min-height: 16px;
            font-size: 11px;
        }

        .exercise-success.success {
            color: #39786d;
        }

        .exercise-success.warning {
            color: #a26732;
        }

        .kindness-example {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            padding: 12px;
            border-radius: 8px;
            background: #fdf1f5;
        }

        .kindness-example > i {
            color: #a83c69;
            font-size: 18px;
        }

        .kindness-example strong {
            color: #465c69;
            font-size: 12px;
        }

        .kindness-example p {
            margin-top: 2px;
            color: #78868b;
            font-size: 11px;
        }

        .next-step-options {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
        }

        .next-choice {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            min-height: 75px;
            padding: 10px;
            border: 1px solid #dce6e2;
            border-radius: 8px;
            background: #ffffff;
            color: #4b6870;
            font-family: Georgia, serif;
            font-size: 11px;
            cursor: pointer;
            transition: 0.2s ease;
        }

        .next-choice i {
            color: #39786d;
            font-size: 17px;
        }

        .next-choice:hover,
        .next-choice.selected {
            border-color: #70a497;
            background: #e8f4ef;
            color: #286d60;
        }

        .next-step-result {
            display: flex;
            align-items: center;
            gap: 9px;
            min-height: 30px;
            margin-top: 12px;
            color: #4a6971;
            font-size: 12px;
        }

        .next-step-result > i {
            color: #438475;
        }

        @media (max-width: 620px) {

            .grounding-list,
            .reset-steps {
                grid-template-columns: 1fr;
            }

            .next-step-options {
                grid-template-columns: 1fr 1fr;
            }

        }

    `;

    document.head.appendChild(dynamicStyles);

});