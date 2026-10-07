const API = "http://127.0.0.1:8000";

const sessionToken = localStorage.getItem("session_token");

let currentPeriod = "weekly";

/* =========================================================
PAGE LOAD
========================================================= */

document.addEventListener("DOMContentLoaded", function () {

setupPeriodButtons();

loadMoodAnalytics("weekly");

});

/* =========================================================
WEEK / MONTH BUTTONS
========================================================= */

function setupPeriodButtons() {

const weeklyBtn =
    document.getElementById("weeklyBtn");

const monthlyBtn =
    document.getElementById("monthlyBtn");


if (weeklyBtn) {

    weeklyBtn.addEventListener(
        "click",
        function () {

            currentPeriod = "weekly";

            updateActiveButton();

            loadMoodAnalytics("weekly");

        }
    );

}


if (monthlyBtn) {

    monthlyBtn.addEventListener(
        "click",
        function () {

            currentPeriod = "monthly";

            updateActiveButton();

            loadMoodAnalytics("monthly");

        }
    );

}

}

/* =========================================================
ACTIVE BUTTON
========================================================= */

function updateActiveButton() {

const weeklyBtn =
    document.getElementById("weeklyBtn");

const monthlyBtn =
    document.getElementById("monthlyBtn");


if (weeklyBtn) {

    weeklyBtn.classList.toggle(
        "active",
        currentPeriod === "weekly"
    );

}


if (monthlyBtn) {

    monthlyBtn.classList.toggle(
        "active",
        currentPeriod === "monthly"
    );

}

}

/* =========================================================
LOAD MOOD ANALYTICS
========================================================= */

async function loadMoodAnalytics(period) {

const loading =
    document.getElementById("moodLoading");

const analysis =
    document.getElementById("moodAnalysis");

const empty =
    document.getElementById("moodEmpty");

const error =
    document.getElementById("moodError");


/* =====================================================
   Reset display
===================================================== */

if (loading) {
    loading.style.display = "flex";
}

if (analysis) {
    analysis.style.display = "none";
}

if (empty) {
    empty.style.display = "none";
}

if (error) {
    error.style.display = "none";
}


/* =====================================================
   Check login
===================================================== */

if (!sessionToken) {

    if (loading) {
        loading.style.display = "none";
    }

    if (error) {
        error.style.display = "block";
    }

    return;

}


try {

    const response =
        await fetch(
            API +
            "/analytics/moods?session_token=" +
            encodeURIComponent(sessionToken)
        );


    const data =
        await response.json();


    console.log(
        "Mood analytics:",
        data
    );


    if (
        !response.ok ||
        data.error
    ) {

        throw new Error(
            data.error ||
            "Unable to load mood analytics."
        );

    }


    const periodData =
        data[period];


    if (!periodData) {

        throw new Error(
            "No analytics data available."
        );

    }


    const checkIns =
        periodData.check_ins || 0;


    const moodCounts =
        periodData.mood_counts || {};


    if (loading) {
        loading.style.display = "none";
    }


    /* =================================================
       No mood records
    ================================================= */

    if (
        checkIns === 0 ||
        Object.keys(moodCounts).length === 0
    ) {

        if (empty) {
            empty.style.display = "block";
        }

        return;

    }


    /* =================================================
       Show analysis
    ================================================= */

    if (analysis) {
        analysis.style.display = "block";
    }


    renderAnalytics(
        periodData,
        period
    );


} catch (err) {

    console.error(
        "Mood analytics error:",
        err
    );


    if (loading) {
        loading.style.display = "none";
    }

    if (analysis) {
        analysis.style.display = "none";
    }

    if (empty) {
        empty.style.display = "none";
    }

    if (error) {
        error.style.display = "block";
    }

}

}

/* =========================================================
RENDER ANALYTICS
========================================================= */

function renderAnalytics(
data,
period
) {

const periodTitle =
    document.getElementById(
        "analysisPeriodTitle"
    );


const periodDescription =
    document.getElementById(
        "analysisPeriodDescription"
    );


const checkInCount =
    document.getElementById(
        "checkInCount"
    );


const commonMood =
    document.getElementById(
        "commonMood"
    );


const moodSummary =
    document.getElementById(
        "moodSummary"
    );


const moodCounts =
    document.getElementById(
        "moodCounts"
    );


const moodSuggestion =
    document.getElementById(
        "moodSuggestion"
    );


const checkIns =
    data.check_ins || 0;


const mostCommonMood =
    data.most_common_mood;


const latestMood =
    data.latest_mood;


const moodVariety =
    data.mood_variety || 0;


/* =========================================
   LATEST MOOD
========================================= */

const latestMoodElement =
    document.getElementById("latestMood");


if (latestMoodElement) {

    if (latestMood) {

        latestMoodElement.textContent =
            getMoodEmoji(latestMood) +
            " " +
            capitalizeMood(latestMood);

    } else {

        latestMoodElement.textContent = "—";

    }

}


/* =========================================
   MOOD VARIETY
========================================= */

const moodVarietyElement =
    document.getElementById("moodVariety");


if (moodVarietyElement) {

    moodVarietyElement.textContent =
        moodVariety;

}


/* =========================================
   DAYS
========================================= */

renderMoodDays(data.days);

renderMoodGlance(data);

/* =====================================================
   FIX 2:
   Render Mood Pattern Chart
===================================================== */

renderMoodPattern(data);


/* =====================================================
   FIX 2:
   Render Final Reflection
===================================================== */

renderFinalReflection(
    data.reflection || {}
);


const counts =
    data.mood_counts || {};


/* =========================================
   PERIOD TITLE
========================================== */

if (periodTitle) {

    periodTitle.textContent =
        period === "weekly"
            ? "This Week"
            : "This Month";

}


/* =========================================
   PERIOD DESCRIPTION
========================================== */

if (periodDescription) {

    periodDescription.textContent =
        period === "weekly"
            ? "A gentle look at your feelings over the last 7 days."
            : "A gentle look at your feelings over the last 30 days.";

}


/* =========================================
   CHECK-IN COUNT
========================================== */

if (checkInCount) {

    checkInCount.textContent =
        checkIns;

}


/* =========================================
   MOST COMMON MOOD
========================================== */

if (commonMood) {

    if (mostCommonMood) {

        commonMood.textContent =
            getMoodEmoji(
                mostCommonMood
            ) +
            " " +
            capitalizeMood(
                mostCommonMood
            );

    } else {

        commonMood.textContent = "—";

    }

}


/* =========================================
   QUICK SUMMARY
========================================== */

if (moodSummary) {

    moodSummary.textContent =
        createMoodSummary(
            mostCommonMood,
            checkIns,
            period
        );

}


/* =========================================
   MOOD BREAKDOWN
========================================== */

if (moodCounts) {

    moodCounts.innerHTML =
        createMoodBreakdown(
            counts,
            data.mood_percentages || {}
        );

}


/* =========================================
   GENTLE SUGGESTION
========================================== */

if (moodSuggestion) {

    moodSuggestion.textContent =
        getMoodSuggestion(
            mostCommonMood
        );

}

}

/* =========================================================
MOOD BREAKDOWN
========================================================= */

function createMoodBreakdown(
moodCounts,
moodPercentages = {}
) {

const entries =
    Object.entries(moodCounts);


if (!entries.length) {

    return `
        <p class="no-mood-data">
            No mood data available.
        </p>
    `;

}


/* Highest count first */

entries.sort(
    function (a, b) {

        return b[1] - a[1];

    }
);


return entries.map(
    function ([mood, count]) {

        const percentage =
            moodPercentages[mood] || 0;


        return `

            <div class="mood-count-row">

                <div class="mood-count-header">

                    <span class="mood-count-name">

                        <span class="mood-count-emoji">
                            ${getMoodEmoji(mood)}
                        </span>

                        ${capitalizeMood(mood)}

                    </span>


                    <strong class="mood-count-number">
                        ${count}
                        <small>
                            (${percentage}%)
                        </small>
                    </strong>

                </div>


                <div class="mood-count-bar">

                    <div
                        class="mood-count-fill"
                        style="width: ${percentage}%"
                    ></div>

                </div>


            </div>

        `;

    }
).join("");

}

/* =========================================================
QUICK SUMMARY
========================================================= */

function createMoodSummary(
mood,
checkIns,
period
) {

const periodText =
    period === "weekly"
        ? "last 7 days"
        : "last 30 days";


if (!mood || checkIns === 0) {

    return (
        "Your mood story is still unfolding. " +
        "Keep checking in with yourself."
    );

}


const positiveMoods = [

    "happy",
    "calm",
    "loved",
    "grateful",
    "confident"

];


const difficultMoods = [

    "tired",
    "confused",
    "sad",
    "worried",
    "anxious",
    "stressed",
    "angry",
    "lonely",
    "heartbroken"

];


if (
    positiveMoods.includes(mood)
) {

    return (

        "Your most common mood over the " +
        periodText +
        " has been " +
        capitalizeMood(mood) +
        ". You've had some positive or steady " +
        "moments recently. Notice what may have " +
        "helped create those moments."

    );

}


if (
    difficultMoods.includes(mood)
) {

    return (

        "Your most common mood over the " +
        periodText +
        " has been " +
        capitalizeMood(mood) +
        ". You may have been carrying some " +
        "difficult feelings lately. Be gentle " +
        "with yourself and give yourself space " +
        "to rest or reach out for support."

    );

}


return (

    "You've checked in " +
    checkIns +
    " time" +
    (checkIns === 1 ? "" : "s") +
    " over the " +
    periodText +
    ". Keep noticing your feelings without judging them."

);

}

/* =========================================================
GENTLE SUGGESTIONS
========================================================= */

function getMoodSuggestion(mood) {

const suggestions = {

    anxious:
        "Try the breathing exercise on Safe Space and break overwhelming tasks into one small next step.",

    worried:
        "Write down what is worrying you and separate what you can control from what you cannot.",

    stressed:
        "Focus on one task at a time, take short breaks, and give yourself permission to rest.",

    sad:
        "Be gentle with yourself and consider spending time with someone you trust.",

    lonely:
        "Reach out to someone you feel safe with. You don't have to handle everything alone.",

    heartbroken:
        "Give yourself time and stay connected with people who make you feel safe and supported.",

    angry:
        "Give yourself some space before reacting, breathe slowly, and notice what triggered the feeling.",

    tired:
        "Give your body permission to rest and try to maintain a consistent sleep routine.",

    confused:
        "Write down the thoughts competing for your attention and focus on one small decision at a time.",

    happy:
        "Notice what contributed to this feeling and make a little more space for those positive moments.",

    calm:
        "Notice what helped you feel calm and try to carry that into another part of your day.",

    loved:
        "Take a moment to appreciate the people and connections that make you feel cared for.",

    grateful:
        "Notice the small things you appreciate and consider sharing your gratitude with someone.",

    confident:
        "Notice what helped you feel confident and remember it when you face a difficult moment."

};


return (

    suggestions[mood] ||

    "Keep checking in with yourself and give yourself some quiet time to understand what you're feeling."

);

}

/* =========================================================
MOOD EMOJIS
========================================================= */

function getMoodEmoji(mood) {

const emojis = {

    happy: "😊",

    calm: "😌",

    loved: "🥰",

    grateful: "🙂",

    confident: "😎",

    tired: "😴",

    confused: "😕",

    sad: "😢",

    worried: "😟",

    anxious: "😰",

    stressed: "😣",

    angry: "😠",

    lonely: "😔",

    heartbroken: "💔"

};


return (
    emojis[mood] ||
    "🙂"
);

}

/* =========================================================
CAPITALIZE MOOD
========================================================= */

function capitalizeMood(mood) {

if (!mood) {
    return "";
}


return (
    mood.charAt(0).toUpperCase() +
    mood.slice(1)
);

}

/* =========================================================
MOOD DAYS
========================================================= */

function renderMoodDays(days) {

const container =
    document.getElementById("moodDays");


if (!container) return;


container.innerHTML = "";


if (!days || days.length === 0) {

    container.innerHTML = `
        <div class="no-days-message">
            No mood data available for this period.
        </div>
    `;

    return;

}


days.forEach(day => {

    const date =
        new Date(
            day.date + "T00:00:00"
        );


    const formattedDate =
        date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric"
            }
        );


    const mood =
        day.mood
            ? capitalizeMood(day.mood)
            : "No check-in";


    const emoji =
        day.mood
            ? getMoodEmoji(day.mood)
            : "—";


    const checkIns =
        day.check_ins || 0;


    const dayCard =
        document.createElement("div");


    dayCard.className =
        "mood-day";


    dayCard.innerHTML = `

        <div class="mood-day-date">

            <span class="mood-day-name">
                ${day.day}
            </span>

            <span class="mood-day-date-text">
                ${formattedDate}
            </span>

        </div>

        <div class="mood-day-result">

            <span class="mood-day-emoji">
                ${emoji}
            </span>

            <div class="mood-day-info">

                <strong>
                    ${mood}
                </strong>

                ${
                    checkIns > 0
                        ? `<span>${checkIns} check-in${checkIns > 1 ? "s" : ""}</span>`
                        : `<span>Nothing logged</span>`
                }

            </div>

        </div>

    `;


    container.appendChild(dayCard);

});

}

/* =========================================================
MOOD AT A GLANCE
========================================================= */

function renderMoodGlance(data) {

const container =
    document.getElementById("moodGlance");


if (!container) return;


const counts =
    data.mood_counts || {};


const percentages =
    data.mood_percentages || {};


const entries =
    Object.entries(counts);


if (!entries.length) {

    container.innerHTML = `
        <div class="no-mood-data">
            No mood data available yet.
        </div>
    `;

    return;

}


/* Highest mood count first */

entries.sort(
    function (a, b) {

        return b[1] - a[1];

    }
);


container.innerHTML =
    entries.map(
        function ([mood, count]) {

            const percentage =
                percentages[mood] || 0;


            return `

                <div class="glance-mood-item">

                    <div class="glance-mood-header">

                        <span class="glance-mood-name">

                            <span class="glance-mood-emoji">
                                ${getMoodEmoji(mood)}
                            </span>

                            ${capitalizeMood(mood)}

                        </span>


                        <strong>
                            ${percentage}%
                        </strong>

                    </div>


                    <div class="glance-mood-bar">

                        <div
                            class="glance-mood-fill"
                            style="width: ${percentage}%"
                        ></div>

                    </div>


                    <span class="glance-mood-count">

                        ${count}
                        check-in${count === 1 ? "" : "s"}

                    </span>

                </div>

            `;

        }
    ).join("");

}

/* =========================================================
MOOD PATTERN CHART
========================================================= */

function renderMoodPattern(data) {

const container =
    document.getElementById("moodPatterns");


if (!container) return;


const timeline =
    data.mood_timeline || [];


if (!timeline.length) {

    container.innerHTML = `
        <div class="no-mood-data">
            Not enough check-ins to show a mood pattern yet.
        </div>
    `;

    return;

}


/* =========================================
   MOOD LEVELS
========================================== */

const moodLevels = {

    heartbroken: 1,
    sad: 1,
    lonely: 1,
    angry: 1,

    tired: 2,
    confused: 2,
    worried: 2,
    anxious: 2,
    stressed: 2,

    calm: 4,
    loved: 4,
    grateful: 4,

    happy: 5,
    confident: 5

};


/* =========================================
   CREATE CHART DATA
========================================== */

const chartData =
    timeline.map(function (item) {

        return {

            date: item.date,

            day: item.day,

            mood: capitalizeMood(item.mood),

            emoji: getMoodEmoji(item.mood),

            level:
                moodLevels[item.mood] || 3

        };

    });


/* =========================================
   CHART
========================================== */

const chartHeight = 240;

const chartWidth = 1000;

const leftPadding = 70;

const rightPadding = 30;

const topPadding = 20;

const bottomPadding = 50;


const usableWidth =
    chartWidth -
    leftPadding -
    rightPadding;


const usableHeight =
    chartHeight -
    topPadding -
    bottomPadding;


const pointSpacing =
    chartData.length > 1
        ? usableWidth /
          (chartData.length - 1)
        : usableWidth / 2;


const getY =
    function (level) {

        return (
            topPadding +
            (5 - level) *
            (usableHeight / 4)
        );

    };


const getX =
    function (index) {

        if (chartData.length === 1) {

            return (
                leftPadding +
                usableWidth / 2
            );

        }


        return (
            leftPadding +
            index * pointSpacing
        );

    };


/* =========================================
   GRID LINES
========================================== */

const gridLevels =
    [5, 4, 3, 2, 1];


const gridLines =
    gridLevels.map(
        function (level) {

            const y =
                getY(level);


            return `

                <line
                    x1="${leftPadding}"
                    y1="${y}"
                    x2="${chartWidth - rightPadding}"
                    y2="${y}"
                    class="mood-grid-line"
                />

            `;

        }
    ).join("");


/* =========================================
   MOOD LINE
========================================== */

const linePoints =
    chartData.map(
        function (item, index) {

            return (
                getX(index) +
                "," +
                getY(item.level)
            );

        }
    ).join(" ");


/* =========================================
   POINTS
========================================== */

const points =
    chartData.map(
        function (item, index) {

            const x =
                getX(index);


            const y =
                getY(item.level);


            return `

                <g class="mood-chart-point">

                    <circle
                        cx="${x}"
                        cy="${y}"
                        r="7"
                        class="mood-point"
                    />

                    <text
                        x="${x}"
                        y="${y - 14}"
                        text-anchor="middle"
                        class="mood-point-emoji"
                    >
                        ${item.emoji}
                    </text>

                </g>

            `;

        }
    ).join("");


/* =========================================
   DATE LABELS
========================================== */

const labels =
    chartData.map(
        function (item, index) {

            const x =
                getX(index);


            return `

                <text
                    x="${x}"
                    y="${chartHeight - 15}"
                    text-anchor="middle"
                    class="mood-chart-label"
                >
                    ${item.date}
                </text>

            `;

        }
    ).join("");


/* =========================================
   CHART HTML
========================================== */

container.innerHTML = `

    <div class="mood-chart-wrapper">

        <div class="mood-chart-legend">

            <span>
                <strong>Higher</strong>
                positive / steady feelings
            </span>

            <span>
                <strong>Lower</strong>
                difficult feelings
            </span>

        </div>


        <div class="mood-chart-scroll">

            <svg
                viewBox="0 0 ${chartWidth} ${chartHeight}"
                class="mood-chart"
                role="img"
                aria-label="Visual representation of your mood check-ins over time"
            >

                ${gridLines}


                <polyline
                    points="${linePoints}"
                    class="mood-chart-line"
                    fill="none"
                />


                ${points}


                ${labels}

            </svg>

        </div>


        <div class="mood-chart-note">

            Your chart simply shows the moods you selected
            during your check-ins. It is not a measure of
            your mental health or overall wellbeing.

        </div>

    </div>

`;

}

/* =========================================================
FINAL REFLECTION
========================================================= */

function renderFinalReflection(
reflection
) {

const reflectionChanged =
    document.getElementById(
        "reflectionChanged"
    );


const reflectionNoticed =
    document.getElementById(
        "reflectionNoticed"
    );


const reflectionThoughts =
    document.getElementById(
        "reflectionThoughts"
    );


if (reflectionChanged) {

    reflectionChanged.textContent =
        reflection.what_changed ||
        "There isn't enough data to identify a clear change yet.";

}


if (reflectionNoticed) {

    reflectionNoticed.textContent =
        reflection.what_we_noticed ||
        "Keep checking in to help reveal patterns.";

}


if (reflectionThoughts) {

    reflectionThoughts.textContent =
        reflection.thoughts_for_you ||
        "Keep noticing your feelings with kindness.";

}

}