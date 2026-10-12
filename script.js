/* =====================================================
   COUNTDOWN CONFIGURATION
   =====================================================

===================================================== */

/*const CONFIG = {

    // Event name
    name: "Diwali",

    // Event date
    // Format: YYYY-MM-DDTHH:MM:SS
    date: "2026-11-08T00:00:00",

    // Event icon
    icon: "🪔",

    // Small description
    description:
        "The Festival of Lights is almost here!"

};*/

const CONFIG = {

    // Event name
    name: "Diwali Holidays",

    // Event date
    date: "2026-11-04T00:00:00",

    // Event icon
    icon: "🪔",

    // Small description
    description:
        "Diwali Holidays are almost here! 🎉"

};

/* =====================================================
   ELEMENTS
===================================================== */

const eventName =
    document.getElementById("eventName");

const eventIcon =
    document.getElementById("eventIcon");

const eventDescription =
    document.getElementById("eventDescription");

const formattedDate =
    document.getElementById("formattedDate");

const daysElement =
    document.getElementById("days");

const hoursElement =
    document.getElementById("hours");

const minutesElement =
    document.getElementById("minutes");

const secondsElement =
    document.getElementById("seconds");

const totalDaysElement =
    document.getElementById("totalDays");

const timeCountdown =
    document.getElementById("timeCountdown");

const daysCountdown =
    document.getElementById("daysCountdown");

const timeViewBtn =
    document.getElementById("timeViewBtn");

const daysViewBtn =
    document.getElementById("daysViewBtn");


/* =====================================================
   APPLY CONFIG
===================================================== */

eventName.textContent =
    CONFIG.name;

eventIcon.textContent =
    CONFIG.icon;

eventDescription.textContent =
    CONFIG.description;


/* =====================================================
   EVENT DATE
===================================================== */

const targetDate =
    new Date(CONFIG.date).getTime();


/* =====================================================
   FORMAT DATE
===================================================== */

const eventDateObject =
    new Date(CONFIG.date);

formattedDate.textContent =
    eventDateObject.toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );


/* =====================================================
   COUNTDOWN
===================================================== */

function updateCountdown() {

    const now =
        Date.now();

    const difference =
        targetDate - now;


    // Event has arrived
    if (difference <= 0) {

        daysElement.textContent = "00";
        hoursElement.textContent = "00";
        minutesElement.textContent = "00";
        secondsElement.textContent = "00";

        totalDaysElement.textContent = "0";

        eventDescription.textContent =
            `${CONFIG.name} is here! 🎉`;

        return;
    }


    /* ---------------------------------------------
       CALCULATE TIME
    --------------------------------------------- */

    const totalSeconds =
        Math.floor(difference / 1000);


    const days =
        Math.floor(
            totalSeconds / 86400
        );


    const hours =
        Math.floor(
            (totalSeconds % 86400) / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const seconds =
        totalSeconds % 60;


    /* ---------------------------------------------
       UPDATE TIME VIEW
    --------------------------------------------- */

    daysElement.textContent =
        String(days).padStart(2, "0");

    hoursElement.textContent =
        String(hours).padStart(2, "0");

    minutesElement.textContent =
        String(minutes).padStart(2, "0");

    secondsElement.textContent =
        String(seconds).padStart(2, "0");


    /* ---------------------------------------------
       UPDATE DAYS VIEW
    --------------------------------------------- */

    totalDaysElement.textContent =
        days;
}


/* =====================================================
   TIME VIEW
===================================================== */

timeViewBtn.addEventListener(
    "click",
    () => {

        timeCountdown.classList.remove(
            "hidden"
        );

        daysCountdown.classList.add(
            "hidden"
        );


        timeViewBtn.classList.add(
            "active"
        );

        daysViewBtn.classList.remove(
            "active"
        );
    }
);


/* =====================================================
   DAYS VIEW
===================================================== */

daysViewBtn.addEventListener(
    "click",
    () => {

        timeCountdown.classList.add(
            "hidden"
        );

        daysCountdown.classList.remove(
            "hidden"
        );


        daysViewBtn.classList.add(
            "active"
        );

        timeViewBtn.classList.remove(
            "active"
        );
    }
);


/* =====================================================
   START
===================================================== */

updateCountdown();

setInterval(
    updateCountdown,
    1000
);
