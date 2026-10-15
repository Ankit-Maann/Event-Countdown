/* =========================================
   PWA UPDATE HANDLING
========================================= */

let refreshing = false;

if ("serviceWorker" in navigator) {

    navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => {

            if (refreshing) return;

            refreshing = true;

            window.location.reload();

        }
    );

}

/* =====================================================
   EVENT COUNTDOWN
   Phase 3
===================================================== */


/* =====================================================
   GLOBAL STATE
===================================================== */

let EVENTS = [];

let currentEvent = null;

let nextEvent = null;

let targetDate = 0;

let celebrationShownForEvent = null;

let deferredPrompt = null;

let countdownInterval = null;

let upcomingInterval = null;

let celebrationEffects = [];


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

const eventsGrid =
    document.getElementById("eventsGrid");

const shareBtn =
    document.getElementById("shareBtn");

const calendarBtn =
    document.getElementById("calendarBtn");

const shareMessage =
    document.getElementById("shareMessage");

const themeBtn =
    document.getElementById("themeBtn");

const installBtn =
    document.getElementById("installBtn");

const celebration =
    document.getElementById("celebration");

const celebrationTitle =
    document.getElementById("celebrationTitle");

const celebrationText =
    document.getElementById("celebrationText");

const celebrationClose =
    document.getElementById("celebrationClose");

const nextEventBadge =
    document.getElementById("nextEventBadge");

const particles =
    document.getElementById("particles");


/* =====================================================
   BASIC HELPERS
===================================================== */

function getEventTime(event) {

    return new Date(
        event.date
    ).getTime();
}


function isEventStarted(event) {

    return getEventTime(event) <= Date.now();
}


function formatEventDate(dateString) {

    return new Date(
        dateString
    ).toLocaleDateString(
        "en-IN",
        {
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}


function getEventById(id) {

    if (!id) {
        return null;
    }

    return EVENTS.find(
        event =>
            event.id === id
    ) || null;
}


/* =====================================================
   LOAD EVENTS
===================================================== */

async function loadEvents() {

    try {

        const response =
            await fetch(
                "./events.json",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                `Failed to load events.json (${response.status})`
            );
        }


        const data =
            await response.json();


        if (!Array.isArray(data)) {

            throw new Error(
                "events.json must contain an array."
            );
        }


        EVENTS =
            data.filter(
                event =>
                    event &&
                    event.id &&
                    event.name &&
                    event.date
            );


        if (!EVENTS.length) {

            throw new Error(
                "No valid events found."
            );
        }


        initializeApp();

    } catch (error) {

        console.error(
            "Unable to load events:",
            error
        );


        showAppError();

    }

}


/* =====================================================
   APP ERROR
===================================================== */

function showAppError() {

    if (!eventName) {
        return;
    }


    eventName.textContent =
        "Unable to load events";


    eventDescription.textContent =
        "Please check your events.json file and refresh the page.";


    formattedDate.textContent =
        "Configuration error";


    eventsGrid.innerHTML = `
        <div class="event-card">
            <h3>Events unavailable</h3>

            <p class="event-card-date">
                Please make sure events.json exists
                beside index.html.
            </p>
        </div>
    `;
}


/* =====================================================
   GET UPCOMING EVENTS
===================================================== */

function getUpcomingEvents() {

    const now =
        Date.now();


    return EVENTS

        .filter(
            event =>
                getEventTime(event) > now
        )

        .sort(
            (a, b) =>
                getEventTime(a)
                -
                getEventTime(b)
        );
}


/* =====================================================
   GET NEXT EVENT
===================================================== */

function getNextEvent() {

    return (
        getUpcomingEvents()[0]
        ||
        null
    );
}


/* =====================================================
   GET EVENT FROM URL
===================================================== */

function getEventFromURL() {

    const customEvent =
        getCustomEventFromURL();

    if (customEvent) {
        return customEvent;
    }


    const params =
        new URLSearchParams(
            window.location.search
        );

    const eventId =
        params.get("event");


    if (!eventId) {
        return null;
    }


    return EVENTS.find(
        event =>
            event.id === eventId
    ) || null;

}


/* =====================================================
   GET INITIAL EVENT
===================================================== */

function getInitialEvent() {

    const urlEvent =
        getEventFromURL();


    if (urlEvent) {

        return urlEvent;

    }


    return getNextEvent() ||
        EVENTS[0] ||
        null;

}

/* =====================================================
   UPDATE URL
===================================================== */

function updateURL(
    event,
    replace = false
) {

    if (!event || !event.id) {
        return;
    }


    const url =
        new URL(
            window.location.href
        );


    url.searchParams.set(
        "event",
        event.id
    );


    if (replace) {

        history.replaceState(
            {
                eventId: event.id
            },
            "",
            url
        );

    } else {

        history.pushState(
            {
                eventId: event.id
            },
            "",
            url
        );

    }

}


/* =====================================================
   APPLY EVENT THEME
===================================================== */

function applyTheme(theme) {

    document.body.classList.remove(
        "theme-diwali",
        "theme-christmas",
        "theme-winter",
        "theme-newyear",
        "theme-holi"
    );

    if (theme && theme !== "default") {
        document.body.classList.add(`theme-${theme}`);
    }
}


/* =====================================================
   STOP CELEBRATION EFFECTS
===================================================== */

function stopCelebrationEffects() {

    celebrationEffects.forEach(
        effect => {

            try {

                effect.cancel();

            } catch {

                // Ignore cancelled animations.

            }

        }
    );


    celebrationEffects = [];


    document
        .querySelectorAll(
            ".celebration-particle"
        )
        .forEach(
            particle =>
                particle.remove()
        );
}


/* =====================================================
   HIDE CELEBRATION
===================================================== */

function hideCelebration() {

    celebration.classList.add(
        "hidden"
    );


    stopCelebrationEffects();
}


/* =====================================================
   APPLY EVENT
===================================================== */

function applyEvent(
    event,
    options = {}
) {

    if (!event) {
        return;
    }


    const {

        updateHistory = true,

        scroll = false

    } = options;


    /*
     * Stop effects from previously
     * selected event.
     */

    hideCelebration();


    currentEvent =
        event;

    updateReminderButton();

    targetDate =
        getEventTime(
            event
        );


    /*
     * Reset celebration state
     * for the newly selected event.
     */

    celebrationShownForEvent =
        null;


    /*
     * Update nearest upcoming event.
     */

    nextEvent =
        getNextEvent();


    /*
     * Update main content.
     */

    eventName.textContent =
        event.name;


    eventIcon.textContent =
        event.icon;


    eventDescription.textContent =
        event.description;


    formattedDate.textContent =
        formatEventDate(
            event.date
        );


    /*
     * Apply event-specific
     * visual theme.
     */

    applyTheme(
        event.theme
    );

    applyCountdownAccent(event.accent || localStorage.getItem("countdownAccent") || "");


    /*
     * Show NEXT badge only when
     * selected event is actually
     * the nearest future event.
     */

    updateNextEventBadge();


    /*
     * Update countdown immediately.
     */

    updateCountdown();


    /*
     * Re-render cards so selected
     * state stays accurate.
     */

    renderUpcomingEvents();


    /*
     * Update URL only when this
     * is a user-driven selection.
     */

    if (updateHistory) {

        updateURL(
            event
        );

    }


    /*
     * Scroll only when the user
     * clicked an event card.
     */

    if (scroll) {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }

}


/* =====================================================
   NEXT EVENT BADGE
===================================================== */

function updateNextEventBadge() {

    if (!nextEventBadge) {
        return;
    }


    const shouldShow =
        currentEvent &&
        nextEvent &&
        currentEvent.id === nextEvent.id &&
        !isEventStarted(currentEvent);


    nextEventBadge.classList.toggle(
        "hidden",
        !shouldShow
    );

}


/* =====================================================
   COUNTDOWN
===================================================== */

function updateCountdown() {

    if (!currentEvent) {
        return;
    }


    const now =
        Date.now();


    const difference =
        targetDate - now;


    /*
     * EVENT HAS STARTED
     */

    if (difference <= 0) {

        daysElement.textContent =
            "00";

        hoursElement.textContent =
            "00";

        minutesElement.textContent =
            "00";

        secondsElement.textContent =
            "00";


        totalDaysElement.textContent =
            "0";


        /*
         * Only change description
         * after event starts.
         */

        eventDescription.textContent =
            `${currentEvent.name} is here! 🎉`;


        /*
         * Celebration runs once
         * for this specific event.
         */

        if (
            celebrationShownForEvent
            !==
            currentEvent.id
        ) {

            showCelebration();

        }


        return;
    }


    /*
     * EVENT IS STILL IN FUTURE
     */

    const totalSeconds =
        Math.floor(
            difference / 1000
        );


    const days =
        Math.floor(
            totalSeconds / 86400
        );


    const hours =
        Math.floor(
            (totalSeconds % 86400)
            /
            3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600)
            /
            60
        );


    const seconds =
        totalSeconds % 60;


    daysElement.textContent =
        String(days)
            .padStart(
                2,
                "0"
            );


    hoursElement.textContent =
        String(hours)
            .padStart(
                2,
                "0"
            );


    minutesElement.textContent =
        String(minutes)
            .padStart(
                2,
                "0"
            );


    secondsElement.textContent =
        String(seconds)
            .padStart(
                2,
                "0"
            );


    totalDaysElement.textContent =
        days;


    /*
     * If an event was previously
     * celebrating and user switches
     * back to a future event, keep
     * the original description.
     */

    if (
        celebrationShownForEvent
        !==
        currentEvent.id
    ) {

        eventDescription.textContent =
            currentEvent.description;

    }


    updateNextEventBadge();

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
   UPCOMING EVENTS
===================================================== */

function renderUpcomingEvents() {

    eventsGrid.innerHTML =
        "";


    const events =
        getUpcomingEvents()
            .slice(
                0,
                6
            );


    if (!events.length) {

        eventsGrid.innerHTML = `
            <div class="event-card">
                <h3>No upcoming events</h3>

                <p class="event-card-date">
                    There are no upcoming events right now.
                </p>
            </div>
        `;

        return;
    }


    events.forEach(
        event => {

            const difference =
                getEventTime(event)
                -
                Date.now();


            const days =
                Math.ceil(
                    difference
                    /
                    86400000
                );


            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "event-card";


            /*
             * Highlight selected event.
             */

            if (
                currentEvent &&
                currentEvent.id === event.id
            ) {

                card.classList.add(
                    "selected"
                );

            }


            const isNext =
                nextEvent &&
                nextEvent.id === event.id;


            card.innerHTML = `

                ${
                    isNext
                        ? `
                            <div class="next-card-badge">
                                ⭐ NEXT EVENT
                            </div>
                        `
                        : ""
                }

                <div class="event-card-icon">
                    ${escapeHTML(event.icon)}
                </div>

                <h3>
                    ${escapeHTML(event.name)}
                </h3>

                <p class="event-card-date">
                    ${formatEventDate(event.date)}
                </p>

                <div class="event-card-days">
                    ${days}
                    <span>days</span>
                </div>

                <button
                    class="event-card-btn"
                    type="button"
                >
                    ${
                        currentEvent &&
                        currentEvent.id === event.id
                            ? "Selected ✓"
                            : "View Countdown →"
                    }
                </button>
            `;


            card
                .querySelector(
                    ".event-card-btn"
                )
                .addEventListener(
                    "click",
                    () => {

                        applyEvent(
                            event,
                            {
                                updateHistory: true,
                                scroll: true
                            }
                        );

                    }
                );


            eventsGrid.appendChild(
                card
            );

        }
    );

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value ?? "");


    return div.innerHTML;
}


/* =====================================================
   SHARE
===================================================== */

async function shareCurrentEvent() {
    if (!currentEvent) return;

    const shareURL = window.location.href;

    const shareData = {
        title: `${currentEvent.icon || "🎉"} ${currentEvent.name}`,
        text: `${currentEvent.name} — Countdown is on! ⏳`,
        url: shareURL
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return;
        }

        if (!navigator.clipboard?.writeText) {
            throw new Error("Clipboard API unavailable");
        }

        await navigator.clipboard.writeText(shareURL);

        if (shareMessage) {
            shareMessage.textContent = "🔗 Countdown link copied!";
            shareMessage.classList.add("show");

            setTimeout(() => {
                shareMessage.classList.remove("show");
            }, 2500);
        }

    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        console.warn("Share failed:", error);

        try {
            if (!navigator.clipboard?.writeText) {
                throw new Error("Clipboard API unavailable");
            }

            await navigator.clipboard.writeText(shareURL);

            if (shareMessage) {
                shareMessage.textContent = "🔗 Countdown link copied!";
                shareMessage.classList.add("show");

                setTimeout(() => {
                    shareMessage.classList.remove("show");
                }, 2500);
            }
        } catch (clipboardError) {
            console.warn("Could not copy share URL:", clipboardError);
        }
    }
}

shareBtn.addEventListener("click", shareCurrentEvent);

/* =====================================================
   SHARE MESSAGE
===================================================== */

function showShareMessage(message) {

    shareMessage.textContent =
        message;


    clearTimeout(
        showShareMessage.timer
    );


    showShareMessage.timer =
        setTimeout(
            () => {

                shareMessage.textContent =
                    "";

            },
            2500
        );

}


/* =====================================================
   ADD TO CALENDAR
===================================================== */

calendarBtn.addEventListener(
    "click",
    () => {

        if (!currentEvent) {
            return;
        }


        const start =
            new Date(
                currentEvent.date
            );


        const end =
            new Date(
                start.getTime()
                +
                24 * 60 * 60 * 1000
            );


        function formatGoogleDate(date) {

            return date
                .toISOString()
                .replace(
                    /[-:]/g,
                    ""
                )
                .replace(
                    /\.\d{3}Z$/,
                    "Z"
                );

        }


        const googleStart =
            formatGoogleDate(
                start
            );


        const googleEnd =
            formatGoogleDate(
                end
            );


        const googleCalendarURL =
            "https://calendar.google.com/calendar/render" +
            "?action=TEMPLATE" +
            "&text=" +
            encodeURIComponent(
                currentEvent.name
            ) +
            "&dates=" +
            googleStart +
            "/" +
            googleEnd +
            "&details=" +
            encodeURIComponent(
                currentEvent.description
            );


        const calendarWindow =
            window.open(
                googleCalendarURL,
                "_blank"
            );


        if (!calendarWindow) {

            downloadICSFile(
                start,
                end
            );

        }

    }
);


/* =====================================================
   ICS FALLBACK
===================================================== */

function downloadICSFile(
    start,
    end
) {

    if (!currentEvent) {
        return;
    }


    function formatCalendarDate(date) {

        return date
            .toISOString()
            .replace(
                /[-:]/g,
                ""
            )
            .replace(
                /\.\d{3}Z$/,
                "Z"
            );

    }


    const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Event Countdown//EN
BEGIN:VEVENT
DTSTART:${formatCalendarDate(start)}
DTEND:${formatCalendarDate(end)}
SUMMARY:${escapeICS(currentEvent.name)}
DESCRIPTION:${escapeICS(currentEvent.description)}
END:VEVENT
END:VCALENDAR`;


    const blob =
        new Blob(
            [ics],
            {
                type:
                    "text/calendar;charset=utf-8"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        `${currentEvent.id}.ics`;


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    URL.revokeObjectURL(
        url
    );

}


/* =====================================================
   ESCAPE ICS TEXT
===================================================== */

function escapeICS(value) {

    return String(
        value ?? ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /;/g,
            "\\;"
        )
        .replace(
            /,/g,
            "\\,"
        )
        .replace(
            /\r?\n/g,
            "\\n"
        );

}


/* =====================================================
   DARK / LIGHT MODE
===================================================== */

function updateThemeIcon() {

    themeBtn.textContent =
        document.body.classList.contains(
            "light"
        )
            ? "☀️"
            : "🌙";

}


function loadSavedAppearance() {

    const savedTheme =
        localStorage.getItem(
            "countdown-theme"
        );


    if (
        savedTheme ===
        "light"
    ) {

        document.body.classList.add(
            "light"
        );

    }


    updateThemeIcon();

}


themeBtn.addEventListener(
    "click",
    () => {

        document.body.classList.toggle(
            "light"
        );


        const theme =
            document.body.classList.contains(
                "light"
            )
                ? "light"
                : "dark";


        localStorage.setItem(
            "countdown-theme",
            theme
        );


        updateThemeIcon();

    }
);


/* =====================================================
   PWA INSTALL
===================================================== */

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();


        deferredPrompt =
            event;

if (installBtn) {
        installBtn.classList.remove("hidden");
    }

    }
);
window.addEventListener("appinstalled", () => {
    deferredPrompt = null;

    if (installBtn) {
        installBtn.classList.add("hidden");
    }
});


installBtn.addEventListener(
    "click",
    async () => {

        if (!deferredPrompt) {

            showShareMessage(
                "📲 Install is available when supported by your browser."
            );

            return;
        }


        deferredPrompt.prompt();


        try {

            await deferredPrompt.userChoice;

        } catch {

            // Ignore installation errors.

        }


        deferredPrompt =
            null;


        if (installBtn) {
            installBtn.classList.add("hidden");
        }

    }
);


window.addEventListener(
    "appinstalled",
    () => {

        deferredPrompt =
            null;


        if (installBtn) {
            installBtn.classList.add("hidden");
        }

    }
);


/* =====================================================
   CELEBRATION
===================================================== */

function showCelebration() {

    if (!currentEvent) {
        return;
    }


    /*
     * Safety guard:
     * never celebrate a future event.
     */

    if (
        !isEventStarted(
            currentEvent
        )
    ) {

        return;

    }


    /*
     * Prevent repeated celebration
     * for the same event.
     */

    if (
        celebrationShownForEvent
        ===
        currentEvent.id
    ) {

        return;

    }


    celebrationShownForEvent =
        currentEvent.id;


    celebrationTitle.textContent =
        currentEvent.name;


    celebrationText.textContent =
        `${currentEvent.name} has started! 🎉`;


    celebration.classList.remove(
        "hidden"
    );


    startEventCelebration(
        currentEvent
    );

}


/* =====================================================
   CLOSE CELEBRATION
===================================================== */

celebrationClose.addEventListener(
    "click",
    () => {

        hideCelebration();

    }
);


/* =====================================================
   CLICK OUTSIDE CELEBRATION
===================================================== */

celebration.addEventListener(
    "click",
    event => {

        if (
            event.target ===
            celebration
        ) {

            hideCelebration();

        }

    }
);


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
            &&
            !celebration.classList.contains(
                "hidden"
            )
        ) {

            hideCelebration();

        }

    }
);


/* =====================================================
   EVENT CELEBRATION
===================================================== */

function startEventCelebration(
    event
) {

    // Custom events do not have a configured celebration.
    if (!event || !event.celebration) {
        return;
    }

    /*
     * IMPORTANT:
     *
     * Celebration is started ONLY
     * when the event has actually
     * started.
     *
     * theme is NOT used as the
     * celebration trigger.
     */

    stopCelebrationEffects();


    switch (
        event.celebration
    ) {

        case "diwali":

            createEmojiCelebration(
                [
                    "🪔",
                    "✨",
                    "🌟"
                ],
                45
            );

            break;


        case "christmas":

            createEmojiCelebration(
                [
                    "🎄",
                    "🎁",
                    "❄️",
                    "✨"
                ],
                45
            );

            break;


        case "winter":

            createEmojiCelebration(
                [
                    "❄️",
                    "❄️",
                    "✨",
                    "☃️"
                ],
                45
            );

            break;


        case "newyear":

            createEmojiCelebration(
                [
                    "🎉",
                    "✨",
                    "🎊",
                    "⭐"
                ],
                55
            );

            break;


        case "holi":

            createEmojiCelebration(
                [
                    "🎨",
                    "🩷",
                    "💙",
                    "💛",
                    "💚"
                ],
                55
            );

            break;


        default:

            createEmojiCelebration(
                [
                    "🎉",
                    "✨",
                    "🎊",
                    "⭐"
                ],
                40
            );

            break;

    }

}


/* =====================================================
   EMOJI CELEBRATION
===================================================== */

function createEmojiCelebration(
    symbols,
    amount
) {

    if (!particles) {
        return;
    }


    for (
        let i = 0;
        i < amount;
        i++
    ) {

        const piece =
            document.createElement(
                "span"
            );


        piece.className =
            "celebration-particle";


        piece.textContent =
            symbols[
                Math.floor(
                    Math.random()
                    *
                    symbols.length
                )
            ];


        piece.style.position =
            "fixed";


        piece.style.left =
            `${Math.random() * 100}%`;


        piece.style.top =
            "-30px";


        piece.style.fontSize =
            `${Math.random() * 18 + 14}px`;


        piece.style.zIndex =
            "150";


        piece.style.pointerEvents =
            "none";


        piece.style.willChange =
            "transform, opacity";


        document.body.appendChild(
            piece
        );


        const duration =
            Math.random() * 3000
            +
            2500;


        const animation =
            piece.animate(
                [
                    {
                        transform:
                            "translateY(0) rotate(0deg)",

                        opacity: 1
                    },

                    {
                        transform:
                            `translateY(110vh) rotate(${Math.random() * 720}deg)`,

                        opacity: 0
                    }
                ],
                {
                    duration,

                    easing:
                        "cubic-bezier(.2,.8,.3,1)"
                }
            );


        celebrationEffects.push(
            animation
        );


        animation.onfinish =
            () => {

                piece.remove();

            };

    }

}


/* =====================================================
   BROWSER BACK / FORWARD
===================================================== */

window.addEventListener(
    "popstate",
    () => {

        if (!EVENTS.length) {
            return;
        }


        const urlEvent =
            getEventFromURL();


        if (urlEvent) {

            applyEvent(
                urlEvent,
                {
                    updateHistory: false,
                    scroll: false
                }
            );

            return;
        }


        /*
         * If URL has no event parameter,
         * fall back to nearest future event.
         */

        const fallback =
            getNextEvent()
            ||
            EVENTS[0];


        applyEvent(
            fallback,
            {
                updateHistory: false,
                scroll: false
            }
        );


        updateURL(
            fallback,
            true
        );

    }
);


/* =====================================================
   INITIALIZE APP
===================================================== */

function initializeApp() {

    loadSavedAppearance();


    /*
     * Find selected event from URL,
     * otherwise choose next event.
     */

    const initialEvent =
        getInitialEvent();


    if (!initialEvent) {

        showAppError();

        return;

    }

    if (installBtn) {
    installBtn.classList.add("hidden");
}
    /*
     * If there was no valid event
     * parameter, create a stable
     * shareable URL without adding
     * a browser history entry.
     */

    const urlEvent =
        getEventFromURL();


    applyEvent(
        initialEvent,
        {
            updateHistory: false,
            scroll: false
        }
    );


    if (!urlEvent) {

        updateURL(
            initialEvent,
            true
        );

    }


    /*
     * Main countdown.
     */

    clearInterval(
        countdownInterval
    );


    countdownInterval =
        setInterval(
            updateCountdown,
            1000
        );


    /*
     * Upcoming cards update every
     * minute so that events disappear
     * automatically after starting.
     */

    clearInterval(
        upcomingInterval
    );


    upcomingInterval =
        setInterval(
            () => {

                const oldNextId =
                    nextEvent?.id;


                nextEvent =
                    getNextEvent();


                /*
                 * If nearest upcoming
                 * event changed, refresh
                 * cards and badge.
                 */

                if (
                    oldNextId
                    !==
                    nextEvent?.id
                ) {

                    renderUpcomingEvents();

                    updateNextEventBadge();

                } else {

                    /*
                     * Days on cards may
                     * have changed.
                     */

                    renderUpcomingEvents();

                }

            },
            60000
        );
   /* =========================================
   CHECK FOR SERVICE WORKER UPDATE
========================================= */

if ("serviceWorker" in navigator) {

    navigator.serviceWorker.ready
        .then((registration) => {

            registration.update();

        })
        .catch((error) => {

            console.warn(
                "Service Worker update check failed:",
                error
            );

        });

}

}


/* =====================================================
   START APP
===================================================== */

loadEvents();

/* =========================================
   REMINDER SYSTEM
========================================= */

const reminderBtn = document.getElementById("reminderBtn");
const reminderModal = document.getElementById("reminderModal");
const reminderClose = document.getElementById("reminderClose");
const reminderEventName = document.getElementById("reminderEventName");
const reminderStatus = document.getElementById("reminderStatus");
const reminderOptions = document.querySelectorAll(".reminder-option");

const REMINDER_STORAGE_KEY = "eventCountdownReminders";

let reminderCheckInterval = null;


/* =========================================
   LOCAL STORAGE
========================================= */

function getReminders() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(REMINDER_STORAGE_KEY)
        );
        return Array.isArray(saved) ? saved : [];
    } catch (error) {
        console.warn("Could not read reminders:", error);
        return [];
    }
}


function saveReminders(reminders) {
    try {
        localStorage.setItem(
            REMINDER_STORAGE_KEY,
            JSON.stringify(reminders)
        );
        return true;
    } catch (error) {
        console.warn("Could not save reminders:", error);
        return false;
    }
}


/* =========================================
   OPEN REMINDER MODAL
========================================= */

function openReminderModal() {

    if (!currentEvent) return;

    reminderEventName.textContent =
        `Get notified before ${currentEvent.name} starts.`;

    reminderStatus.textContent = "";

    reminderModal.classList.remove("hidden");

    reminderModal.setAttribute("aria-hidden", "false");

    updateReminderButton();
}


/* =========================================
   CLOSE REMINDER MODAL
========================================= */

function closeReminderModal() {

    reminderModal.classList.add("hidden");

    reminderModal.setAttribute("aria-hidden", "true");

}


/* =========================================
   CHECK EXISTING REMINDER
========================================= */

function hasReminder(eventId) {

    const reminders = getReminders();

    return reminders.some(
        reminder => reminder.eventId === eventId
    );

}


/* =========================================
   UPDATE REMINDER BUTTON
========================================= */

function updateReminderButton() {

    if (!reminderBtn || !currentEvent) return;

    if (hasReminder(currentEvent.id)) {

        reminderBtn.innerHTML = "🔔 Reminder Set";

        reminderBtn.classList.add("reminder-active");

    } else {

        reminderBtn.innerHTML = "🔔 Set Reminder";

        reminderBtn.classList.remove("reminder-active");

    }

}


/* =========================================
   REQUEST NOTIFICATION PERMISSION
========================================= */

async function requestNotificationPermission() {

    if (!("Notification" in window)) {

        return "unsupported";

    }

    if (Notification.permission === "granted") {

        return "granted";

    }

    if (Notification.permission === "denied") {

        return "denied";

    }

    try {

        return await Notification.requestPermission();

    } catch (error) {

        console.warn(
            "Notification permission failed:",
            error
        );

        return "denied";

    }

}


/* =========================================
   SET REMINDER
========================================= */

async function setReminder(minutesBefore) {

    if (!currentEvent || !targetDate) return;

    const eventTime = new Date(targetDate).getTime();
    const reminderTime =
        eventTime - (minutesBefore * 60 * 1000);

    const now = Date.now();

    /*
       Don't allow reminders that are already
       in the past.
    */

    if (reminderTime <= now) {

        reminderStatus.textContent =
            "This reminder time has already passed.";

        return;

    }


    /*
       Ask for notification permission.
    */

    const permission =
        await requestNotificationPermission();


    if (permission === "unsupported") {

        reminderStatus.textContent =
            "Notifications are not supported in this browser.";

        return;

    }


    if (permission === "denied") {

        reminderStatus.textContent =
            "Notification permission was denied. Please enable it in browser settings.";

        return;

    }


    /*
       Remove any previous reminder
       for this event.
    */

    let reminders = getReminders();

    reminders = reminders.filter(
        reminder =>
            reminder.eventId !== currentEvent.id
    );


    /*
       Save new reminder.
    */

    reminders.push({

        eventId: currentEvent.id,

        eventName: currentEvent.name,

        eventTime,

        reminderTime,

        minutesBefore,

        notified: false,

        createdAt: Date.now()

    });


    saveReminders(reminders);

    updateReminderButton();


    const reminderText =
        formatReminderTime(minutesBefore);

    reminderStatus.textContent =
        `Reminder set for ${reminderText}.`;

}


/* =========================================
   FORMAT REMINDER TIME
========================================= */

function formatReminderTime(minutes) {

    if (minutes === 1440) {
        return "1 day before";
    }

    if (minutes === 60) {
        return "1 hour before";
    }

    if (minutes === 10) {
        return "10 minutes before";
    }

    return `${minutes} minutes before`;

}


/* =========================================
   SHOW NOTIFICATION
========================================= */

function showReminderNotification(reminder) {

    if (!("Notification" in window)) return;

    if (Notification.permission !== "granted") return;


    const notification =
        new Notification(
            `🔔 ${reminder.eventName}`,
            {
                body:
                    `${formatReminderTime(reminder.minutesBefore)} — your event is coming up!`,

                icon: "./icon-192.png",

                tag:
                    `event-reminder-${reminder.eventId}`,

                renotify: false
            }
        );


    notification.onclick = () => {

        window.focus();

        notification.close();

    };

}


/* =========================================
   CHECK REMINDERS
========================================= */

function checkReminders() {

    const reminders = getReminders();

    if (!reminders.length) return;

    const now = Date.now();

    let changed = false;


    reminders.forEach((reminder) => {

        /*
           Already notified
        */

        if (reminder.notified) {
            return;
        }


        /*
           Reminder time reached
        */

        if (
            now >= reminder.reminderTime &&
            now < reminder.eventTime
        ) {

            showReminderNotification(reminder);

            reminder.notified = true;

            changed = true;

        }

    });


    if (changed) {

        saveReminders(reminders);

        updateReminderButton();

    }

}


/* =========================================
   START REMINDER CHECKER
========================================= */

function startReminderChecker() {

    if (reminderCheckInterval) {

        clearInterval(reminderCheckInterval);

    }


    checkReminders();


    /*
       Check every 30 seconds.
    */

    reminderCheckInterval =
        setInterval(
            checkReminders,
            30 * 1000
        );

}


/* =========================================
   REMINDER BUTTON
========================================= */

if (reminderBtn) {

    reminderBtn.addEventListener(
        "click",
        openReminderModal
    );

}


/* =========================================
   CLOSE BUTTON
========================================= */

if (reminderClose) {

    reminderClose.addEventListener(
        "click",
        closeReminderModal
    );

}


/* =========================================
   REMINDER OPTIONS
========================================= */

reminderOptions.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            const minutes =
                Number(
                    button.dataset.reminder
                );

            setReminder(minutes);

        }
    );

});


/* =========================================
   CLOSE WHEN CLICKING BACKDROP
========================================= */

if (reminderModal) {

    reminderModal.addEventListener(
        "click",
        (event) => {

            if (
                event.target === reminderModal
            ) {

                closeReminderModal();

            }

        }
    );

}


/* =========================================
   ESCAPE KEY
========================================= */

document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            reminderModal &&
            !reminderModal.classList.contains("hidden")
        ) {

            closeReminderModal();

        }

    }
);


/* =========================================
   UPDATE WHEN EVENT CHANGES
========================================= */



/*
   Start reminder system after app loads.
*/

startReminderChecker();

updateReminderButton();

/* =========================================
   CREATE YOUR COUNTDOWN
========================================= */

const createCountdownForm =
    document.getElementById("createCountdownForm");

const customEventName =
    document.getElementById("customEventName");

const customEventDate =
    document.getElementById("customEventDate");

const customEventTime =
    document.getElementById("customEventTime");

const customEventEmoji =
    document.getElementById("customEventEmoji");

const emojiPreview =
    document.getElementById("emojiPreview");

const customThemeOptions =
    document.querySelectorAll(".theme-option");

const createCountdownStatus =
    document.getElementById("createCountdownStatus");

const customAccent = document.getElementById("customAccent");
const customAccentValue = document.getElementById("customAccentValue");
const customDescription = document.getElementById("customDescription");


let selectedCustomTheme = "default";


/* =========================================
   EMOJI PREVIEW
========================================= */

if (customEventEmoji) {

    customEventEmoji.addEventListener(
        "input",
        () => {

            const emoji =
                customEventEmoji.value.trim();

            emojiPreview.textContent =
                emoji || "🎉";

        }
    );

}


/* =========================================
   THEME SELECTION
========================================= */

customThemeOptions.forEach((button) => {

    button.addEventListener(
        "click",
        () => {

            customThemeOptions.forEach(
                (item) => {
                    item.classList.remove("active");
                }
            );

            button.classList.add("active");

            selectedCustomTheme =
                button.dataset.theme;

        }
    );

});


/* =========================================
   CREATE CUSTOM COUNTDOWN
========================================= */

if (createCountdownForm) {

    createCountdownForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            const name =
                customEventName.value.trim();

            const date =
                customEventDate.value;

            const time =
                customEventTime.value || "00:00";

            const emoji =
                customEventEmoji.value.trim() || "🎉";


            /* -----------------------------
               VALIDATION
            ----------------------------- */

            if (!name) {

                showCreateStatus(
                    "Please enter an event name."
                );

                return;

            }


            if (!date) {

                showCreateStatus(
                    "Please select a date."
                );

                return;

            }


            const target =
                new Date(`${date}T${time}`);


            if (Number.isNaN(target.getTime())) {

                showCreateStatus(
                    "Please enter a valid date and time."
                );

                return;

            }


            if (target.getTime() <= Date.now()) {

                showCreateStatus(
                    "Please choose a future date and time."
                );

                return;

            }


            /* -----------------------------
               CREATE EVENT
            ----------------------------- */

            const customEvent = {

                id:
                    `custom-${Date.now()}`,

                name,

                date:
                    `${date}T${time}`,

                icon:
                    emoji,

                theme:
                    selectedCustomTheme,

                celebration:
                    null,

                description:
                    customDescription?.value.trim() || `${name} is almost here! 🎉`,

                accent:
                    customAccent?.value || "#22d3ee",

                custom:
                    true

            };


            /* -----------------------------
               SAVE LOCALLY
            ----------------------------- */

            saveCustomEvent(customEvent);
            renderMyCountdowns();


            /* -----------------------------
               CREATE SHAREABLE URL
            ----------------------------- */
        const encodedEvent = encodeCustomEvent(customEvent);
const newURL = `${window.location.pathname}?custom=${encodedEvent}`;

            /*
               Use history instead of a normal
               page reload.
            */

            window.history.pushState(
                {
                    customEvent: true
                },
                "",
                newURL
            );


            /* -----------------------------
               LOAD COUNTDOWN
            ----------------------------- */

            applyEvent(
                customEvent,
                {
                    updateHistory: false
                }
            );


            showCreateStatus(
                "✨ Your countdown has been created!"
            );
           /* =========================================
   RESET CREATE FORM
========================================= */

createCountdownForm.reset();

selectedCustomTheme = "default";

/* Reset theme selection */
customThemeOptions.forEach((button) => {
    button.classList.remove("active");
});

const defaultTheme =
    document.querySelector(
        '.theme-option[data-theme="default"]'
    );

if (defaultTheme) {
    defaultTheme.classList.add("active");
}

/* Reset emoji preview */
if (emojiPreview) {
    emojiPreview.textContent = "🎉";
}

/* Reset emoji input */
if (customEventEmoji) {
    customEventEmoji.value = "🎉";
}
if (customAccent) {
    customAccent.value = "#22d3ee";
}
if (customAccentValue) {
    customAccentValue.textContent = "#22D3EE";
}
if (customDescription) {
    customDescription.value = "";
}


            /*
               Scroll back to countdown.
            */

            document
                .getElementById("eventName")
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });

        }
    );

}


/* =========================================
   SAVE CUSTOM EVENT
========================================= */

function saveCustomEvent(event) {

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    "customCountdowns"
                )
            ) || [];


        /*
           Avoid duplicate IDs.
        */

        const filtered =
            saved.filter(
                item =>
                    item.id !== event.id
            );


        filtered.unshift(event);


        /*
           Keep latest 10 custom countdowns.
        */

        localStorage.setItem(
            "customCountdowns",
            JSON.stringify(
                filtered.slice(0, 10)
            )
        );

    } catch (error) {

        console.warn(
            "Could not save custom countdown:",
            error
        );

    }

}
function encodeCustomEvent(event) {
    const data = {
        n: event.name,
        d: event.date,
        i: event.icon,
        t: event.theme,
        a: event.accent || "#22d3ee",
        m: event.description || ""
    };

    const json = JSON.stringify(data);

    return btoa(
        encodeURIComponent(json)
            .replace(/%([0-9A-F]{2})/g, (_, p1) =>
                String.fromCharCode(parseInt(p1, 16))
            )
    )
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}


function decodeCustomEvent(encoded) {
    try {
        const base64 = encoded
            .replace(/-/g, "+")
            .replace(/_/g, "/");

        const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);

        const binary = atob(padded);

        const bytes = Uint8Array.from(
            binary,
            char => char.charCodeAt(0)
        );

        const json = decodeURIComponent(
            Array.from(bytes)
                .map(byte => `%${byte.toString(16).padStart(2, "0")}`)
                .join("")
        );

        const data = JSON.parse(json);

        if (
            !data ||
            typeof data.n !== "string" ||
            typeof data.d !== "string"
        ) {
            return null;
        }

        const date = new Date(data.d);

        if (Number.isNaN(date.getTime())) {
            return null;
        }

        return {
            id: `custom-${Date.now()}`,
            name: data.n,
            date: data.d,
            icon: data.i || "🎉",
            theme: data.t || "default",
            accent: data.a || "#22d3ee",
            celebration: null,
            description: data.m || `${data.n} is almost here! 🎉`,
            custom: true
        };

    } catch (error) {
        console.warn("Invalid custom countdown:", error);
        return null;
    }
}

/* =========================================
   CREATE FORM STATUS
========================================= */

function showCreateStatus(message) {

    if (!createCountdownStatus) return;

    createCountdownStatus.textContent =
        message;

}


/* =========================================
   LOAD CUSTOM EVENT FROM URL
========================================= */

function getCustomEventFromURL() {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("custom");

    if (!encoded) return null;

    return decodeCustomEvent(encoded);
}


/* =========================================
   MY COUNTDOWNS — RENDER, OPEN & DELETE
========================================= */

const myCountdownsSection = document.getElementById("myCountdowns");
const myCountdownsList = document.getElementById("myCountdownsList");

function getSavedCustomCountdowns() {
    try {
        const saved = JSON.parse(
            localStorage.getItem("customCountdowns")
        );

        return Array.isArray(saved)
            ? saved.filter(event =>
                event &&
                typeof event.id === "string" &&
                typeof event.name === "string" &&
                typeof event.date === "string" &&
                !Number.isNaN(new Date(event.date).getTime())
            )
            : [];
    } catch (error) {
        console.warn("Could not read saved countdowns:", error);
        return [];
    }
}

function renderMyCountdowns() {
    if (!myCountdownsSection || !myCountdownsList) return;

    const savedCountdowns = getSavedCustomCountdowns();

    // Hide the entire section when there are no saved countdowns.
    myCountdownsSection.classList.toggle(
        "hidden",
        savedCountdowns.length === 0
    );

    myCountdownsList.replaceChildren();

    savedCountdowns.forEach(event => {
        const card = document.createElement("article");
        card.className = "my-countdown-card";

        const header = document.createElement("div");
        header.className = "my-countdown-card-header";

        const icon = document.createElement("div");
        icon.className = "my-countdown-icon";
        icon.textContent = event.icon || "🎉";

        const info = document.createElement("div");
        info.className = "my-countdown-info";

        const name = document.createElement("h3");
        name.textContent = event.name;

        const date = document.createElement("p");
        const parsedDate = new Date(event.date);

        date.textContent = parsedDate.toLocaleString(undefined, {
            dateStyle: "medium",
            timeStyle: "short"
        });

        info.append(name, date);
        header.append(icon, info);

        const actions = document.createElement("div");
        actions.className = "my-countdown-actions";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "my-countdown-open";
        openButton.textContent = "Open Countdown";

        openButton.addEventListener("click", () => {
            openSavedCountdown(event.id);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "my-countdown-delete";
        deleteButton.textContent = "🗑️";
        deleteButton.setAttribute(
            "aria-label",
            `Delete ${event.name}`
        );
        deleteButton.title = "Delete countdown";

        deleteButton.addEventListener("click", () => {
            deleteSavedCountdown(event.id);
        });

        actions.append(openButton, deleteButton);
        card.append(header, actions);
        myCountdownsList.append(card);
    });
}

function openSavedCountdown(eventId) {
    const event = getSavedCustomCountdowns().find(
        item => item.id === eventId
    );

    if (!event) {
        renderMyCountdowns();
        return;
    }

    const encodedEvent = encodeCustomEvent(event);
    const newURL =
        `${window.location.pathname}?custom=${encodedEvent}`;

    window.history.pushState(
        { customEvent: true },
        "",
        newURL
    );

    applyEvent(event, {
        updateHistory: false
    });

    document.getElementById("eventName")?.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

function deleteSavedCountdown(eventId) {
    const savedCountdowns = getSavedCustomCountdowns();
    const event = savedCountdowns.find(
        item => item.id === eventId
    );

    if (!event) return;

    const confirmed = window.confirm(
        `Delete "${event.name}" from My Countdowns?`
    );

    if (!confirmed) return;

    const remaining = savedCountdowns.filter(
        item => item.id !== eventId
    );

    try {
        localStorage.setItem(
            "customCountdowns",
            JSON.stringify(remaining)
        );

        renderMyCountdowns();
    } catch (error) {
        console.error("Could not delete countdown:", error);
    }
}

// Render saved countdowns on page load.
renderMyCountdowns();


/* =====================================================
   PHASE 5-8 — PRODUCT ENHANCEMENT LAYER
   Built on top of the stable countdown core.
===================================================== */
(function premiumCountdownUpgrade() {
    "use strict";

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
    const STORAGE = {
        appearance: "countdownAppearance",
        history: "countdownShareHistory",
        accent: "countdownAccent"
    };

    function safeStorageGet(key, fallback = null) {
        try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
    }
    function safeStorageSet(key, value) {
        try { localStorage.setItem(key, value); return true; } catch { return false; }
    }

    window.applyCountdownAccent = function applyCountdownAccent(color) {
        if (!color || !/^#[0-9a-f]{6}$/i.test(color)) return;
        document.documentElement.style.setProperty("--accent", color);
        document.documentElement.style.setProperty("--accent-two", color);
        safeStorageSet(STORAGE.accent, color);
    };

    function buildCurrentShareURL() {
        return new URL(window.location.href).toString();
    }

    function shareText() {
        const event = window.currentEvent || currentEvent;
        if (!event) return "Check out this countdown!";
        const date = new Date(event.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
        return `${event.icon || "⏳"} ${event.name}\n${event.description || "A special moment is coming!"}\n${date}\n\nCountdown: ${buildCurrentShareURL()}`;
    }

    function setShareStatus(message) {
        const el = $("#shareCenterStatus");
        if (el) el.textContent = message;
        if (typeof showShareMessage === "function") showShareMessage(message);
    }

    function rememberShare(method) {
        try {
            const history = JSON.parse(safeStorageGet(STORAGE.history, "[]")) || [];
            history.unshift({
                eventId: currentEvent?.id || "unknown",
                eventName: currentEvent?.name || "Countdown",
                method,
                at: new Date().toISOString()
            });
            safeStorageSet(STORAGE.history, JSON.stringify(history.slice(0, 25)));
        } catch { /* non-critical */ }
    }

    async function copyText(text) {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        const input = document.createElement("textarea");
        input.value = text;
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const ok = document.execCommand("copy");
        input.remove();
        return ok;
    }

    function openExternalShare(url) {
        window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");
    }

    function openShareCenter() {
        const modal = $("#shareModal");
        if (!modal) return;
        const event = currentEvent;
        const link = buildCurrentShareURL();
        $("#shareModalTitle").textContent = event ? `Share ${event.name}` : "Share Countdown";
        $("#shareModalText").textContent = event?.description || "Send this countdown to your friends.";
        $("#shareLinkInput").value = link;
        const preview = $("#sharePreview");
        if (preview) preview.innerHTML = `<strong>${escapeHTML(event?.icon || "⏳")} ${escapeHTML(event?.name || "Countdown")}</strong><span>${escapeHTML(formatEventDate(event?.date || new Date().toISOString()))}</span>`;
        modal.classList.remove("hidden");
        document.body.classList.add("modal-open");
        $("#shareModalClose")?.focus();
    }

    function closeModal(id) {
        $(id)?.classList.add("hidden");
        if ($$(".modal:not(.hidden)").length === 0) document.body.classList.remove("modal-open");
    }

    async function performShare(method) {
        const event = currentEvent;
        if (!event) return;
        const link = buildCurrentShareURL();
        const text = shareText();
        try {
            if (method === "native") {
                if (navigator.share) {
                    await navigator.share({ title: event.name, text: `${event.icon || "⏳"} ${event.name}\n${event.description || ""}`, url: link });
                    rememberShare("native");
                    setShareStatus("Shared successfully ✨");
                } else {
                    await copyText(link);
                    rememberShare("copy");
                    setShareStatus("Link copied — your device does not support native sharing.");
                }
                return;
            }
            if (method === "copy") {
                await copyText(link);
                rememberShare("copy");
                setShareStatus("Countdown link copied! 🔗");
                return;
            }
            if (method === "whatsapp") {
                openExternalShare(`https://wa.me/?text=${encodeURIComponent(text)}`);
                rememberShare("whatsapp");
                return;
            }
            if (method === "telegram") {
                openExternalShare(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`${event.icon || "⏳"} ${event.name}`)}`);
                rememberShare("telegram");
                return;
            }
            if (method === "facebook") {
                openExternalShare(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`);
                rememberShare("facebook");
                return;
            }
            if (method === "calendar") {
                if (typeof downloadICSFile === "function") downloadICSFile(event);
                rememberShare("calendar");
                setShareStatus("Calendar file prepared 📅");
            }
        } catch (error) {
            if (error?.name !== "AbortError") setShareStatus("Sharing was not completed. You can copy the link instead.");
        }
    }

    function setupShareCenter() {
        const originalShareButton = $("#shareBtn");
        if (originalShareButton) {
            const shareButton = originalShareButton.cloneNode(true);
            originalShareButton.replaceWith(shareButton);
            shareButton.addEventListener("click", (event) => {
                event.preventDefault();
                openShareCenter();
            });
        }
        $$("[data-tool='share']").forEach(btn => btn.addEventListener("click", openShareCenter));
        $$("[data-tool='history']").forEach(btn => btn.addEventListener("click", () => {
            const target = $("#myCountdowns");
            if (target && !target.classList.contains("hidden")) target.scrollIntoView({ behavior:"smooth", block:"start" });
            else $("#createCountdown")?.scrollIntoView({ behavior:"smooth", block:"start" });
        }));
        $("#shareModalClose")?.addEventListener("click", () => closeModal("#shareModal"));
        $("#shareModal")?.addEventListener("click", e => { if (e.target.id === "shareModal") closeModal("#shareModal"); });
        $$(".share-option").forEach(btn => btn.addEventListener("click", () => performShare(btn.dataset.share)));
        $("#shareCopyBtn")?.addEventListener("click", () => performShare("copy"));
    }

    const APPEARANCE_PRESETS = {
        aurora:  { type:"linear", angle:120, colors:["#0f172a","#312e81","#164e63"], speed:"normal" },
        sunset:  { type:"linear", angle:125, colors:["#1e1b4b","#7c2d12","#f97316"], speed:"slow" },
        ocean:   { type:"linear", angle:135, colors:["#082f49","#0e7490","#06b6d4"], speed:"normal" },
        candy:   { type:"linear", angle:120, colors:["#3b0764","#be185d","#fb7185"], speed:"normal" },
        midnight:{ type:"radial", angle:180, colors:["#020617","#111827","#312e81"], speed:"slow" },
        forest:  { type:"linear", angle:145, colors:["#052e16","#166534","#0f766e"], speed:"slow" }
    };

    const APPEARANCE_DEFAULTS = {
        preset:"aurora",
        backgroundMode:"default",
        type:"linear",
        angle:120,
        colors:["#0f172a","#312e81","#164e63"],
        animation:"on",
        speed:"normal",
        density:"comfortable",
        glow:"on",
        accent:"#22d3ee"
    };

    function setStudioPillState(selector, dataKey, value) {
        $$(selector).forEach(button => {
            button.classList.toggle("active", button.dataset[dataKey] === value);
        });
    }

    function buildUserBackground(settings) {
        const colors = settings.colors || APPEARANCE_DEFAULTS.colors;
        if (settings.type === "radial") {
            return `radial-gradient(circle at 30% 20%, ${colors[2]} 0%, ${colors[1]} 48%, ${colors[0]} 100%)`;
        }
        return `linear-gradient(${settings.angle ?? 120}deg, ${colors[0]} 0%, ${colors[1]} 52%, ${colors[2]} 100%)`;
    }

    function updateStudioPreview(settings) {
        const preview = $("#studioPreview");
        if (!preview) return;
        preview.style.background = buildUserBackground(settings);
    }

    function updateStudioControls(settings) {
        const colors = settings.colors || APPEARANCE_DEFAULTS.colors;
        const ids = ["#studioBgColor1", "#studioBgColor2", "#studioBgColor3"];
        ids.forEach((id, index) => {
            const input = $(id);
            if (input) input.value = colors[index];
        });
        const angle = $("#studioAngle");
        const angleValue = $("#studioAngleValue");
        if (angle) angle.value = settings.angle ?? 120;
        if (angleValue) angleValue.textContent = `${settings.angle ?? 120}°`;
        setStudioPillState("#studioGradientType [data-gradient]", "gradient", settings.type || "linear");
        setStudioPillState("#studioGradientAnimation [data-animation]", "animation", settings.animation || "on");
        setStudioPillState("#studioGradientSpeed [data-speed]", "speed", settings.speed || "normal");
        setStudioPillState("#studioPresets [data-preset]", "preset", settings.preset || "custom");
    }

    function getCurrentAppearanceSettings() {
        const saved = safeStorageGet(STORAGE.appearance);
        let old = {};
        if (saved) {
            try { old = JSON.parse(saved) || {}; } catch { old = {}; }
        }
        return {
            ...APPEARANCE_DEFAULTS,
            ...old,
            colors: Array.isArray(old.colors) && old.colors.length === 3 ? old.colors : APPEARANCE_DEFAULTS.colors,
            angle: Number.isFinite(Number(old.angle)) ? Number(old.angle) : APPEARANCE_DEFAULTS.angle
        };
    }

    function applyAppearance(settings) {
        const merged = {
            ...APPEARANCE_DEFAULTS,
            ...(settings || {}),
            colors: Array.isArray(settings?.colors) && settings.colors.length === 3 ? settings.colors : APPEARANCE_DEFAULTS.colors
        };

        document.body.classList.toggle("density-compact", merged.density === "compact");
        document.body.classList.toggle("glow-off", merged.glow === "off");
        const customBackground = merged.backgroundMode === "custom";
        document.body.classList.toggle("custom-background", customBackground);
        document.body.classList.toggle("gradient-animation-off", customBackground && merged.animation === "off");
        if (customBackground) {
            document.documentElement.style.setProperty("--user-background", buildUserBackground(merged));
            document.documentElement.style.setProperty("--gradient-speed", merged.speed === "slow" ? "32s" : merged.speed === "fast" ? "9s" : "18s");
        } else {
            document.documentElement.style.removeProperty("--user-background");
            document.documentElement.style.removeProperty("--gradient-speed");
        }
        if (merged.accent) applyCountdownAccent(merged.accent);
        updateStudioControls(merged);
        updateStudioPreview(merged);
    }

    function persistAppearance(overrides = {}) {
        const current = getCurrentAppearanceSettings();
        const settings = { ...current, ...overrides };
        safeStorageSet(STORAGE.appearance, JSON.stringify(settings));
        applyAppearance(settings);
    }

    function setupAppearanceStudio() {
        const modal = $("#studioModal");
        if (!modal) return;

        const saved = safeStorageGet(STORAGE.appearance);
        if (saved) {
            try { applyAppearance(JSON.parse(saved)); } catch { applyAppearance(APPEARANCE_DEFAULTS); }
        } else {
            applyAppearance(APPEARANCE_DEFAULTS);
        }

        $$(`[data-tool='studio']`).forEach(btn => btn.addEventListener("click", () => {
            const current = getCurrentAppearanceSettings();
            updateStudioControls(current);
            updateStudioPreview(current);
            modal.classList.remove("hidden");
            document.body.classList.add("modal-open");
            $("#studioClose")?.focus();
        }));

        $("#studioClose")?.addEventListener("click", () => closeModal("#studioModal"));
        $("#studioDone")?.addEventListener("click", () => {
            persistAppearance();
            closeModal("#studioModal");
        });
        $("#studioModal")?.addEventListener("click", e => {
            if (e.target.id === "studioModal") closeModal("#studioModal");
        });

        const accent = $("#studioAccent");
        const accentValue = $("#studioAccentValue");
        accent?.addEventListener("input", () => {
            accentValue.textContent = accent.value.toUpperCase();
            applyCountdownAccent(accent.value);
            persistAppearance({ accent: accent.value });
        });

        $$("#studioPresets [data-preset]").forEach(button => button.addEventListener("click", () => {
            const presetName = button.dataset.preset;
            if (presetName === "custom") {
                persistAppearance({ preset: "custom", backgroundMode: "custom" });
                return;
            }
            const preset = APPEARANCE_PRESETS[presetName];
            if (!preset) return;
            persistAppearance({ ...preset, preset: presetName, backgroundMode: "custom" });
        }));

        $$("#studioGradientType [data-gradient]").forEach(button => button.addEventListener("click", () => {
            persistAppearance({ type: button.dataset.gradient, preset: "custom", backgroundMode: "custom" });
        }));

        ["#studioBgColor1", "#studioBgColor2", "#studioBgColor3"].forEach(id => {
            $(id)?.addEventListener("input", () => {
                const colors = [$("#studioBgColor1").value, $("#studioBgColor2").value, $("#studioBgColor3").value];
                persistAppearance({ colors, preset: "custom", backgroundMode: "custom" });
            });
        });

        $("#studioAngle")?.addEventListener("input", event => {
            const angle = Number(event.target.value);
            $("#studioAngleValue").textContent = `${angle}°`;
            persistAppearance({ angle, preset: "custom", backgroundMode: "custom" });
        });

        $$("#studioGradientAnimation [data-animation]").forEach(button => button.addEventListener("click", () => {
            persistAppearance({ animation: button.dataset.animation, backgroundMode: "custom" });
        }));

        $$("#studioGradientSpeed [data-speed]").forEach(button => button.addEventListener("click", () => {
            persistAppearance({ speed: button.dataset.speed, animation: "on", backgroundMode: "custom" });
        }));

        $$("#studioDensity [data-density]").forEach(btn => btn.addEventListener("click", () => {
            persistAppearance({ density: btn.dataset.density });
        }));

        $$("#studioGlow [data-glow]").forEach(btn => btn.addEventListener("click", () => {
            persistAppearance({ glow: btn.dataset.glow });
        }));

        $("#studioReset")?.addEventListener("click", () => {
            safeStorageSet(STORAGE.appearance, JSON.stringify(APPEARANCE_DEFAULTS));
            applyAppearance(APPEARANCE_DEFAULTS);
        });
    }

    function setupCustomAppearanceFields() {
        const input = $("#customAccent");
        const value = $("#customAccentValue");
        if (input && value) input.addEventListener("input", () => { value.textContent = input.value.toUpperCase(); });
    }

    function setupTimezone() {
        const modal = $("#timezoneModal");
        if (!modal) return;
        $$("[data-tool='timezone']").forEach(btn => btn.addEventListener("click", () => {
            const event = currentEvent;
            $("#timezoneEventName").textContent = event ? `${event.icon || "⏳"} ${event.name}` : "Current countdown";
            $("#userTimezone").textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || "Local time";
            $("#eventTimezoneDate").textContent = event ? new Date(event.date).toLocaleString(undefined, { dateStyle:"full", timeStyle:"short" }) : "—";
            modal.classList.remove("hidden");
        }));
        $("#timezoneClose")?.addEventListener("click", () => closeModal("#timezoneModal"));
        modal.addEventListener("click", e => { if (e.target.id === "timezoneModal") closeModal("#timezoneModal"); });
    }

    function setupMyCountdownEnhancements() {
        const section = $("#myCountdowns");
        const list = $("#myCountdownsList");
        if (!section || !list) return;
        const toolbar = document.createElement("div");
        toolbar.className = "my-countdowns-toolbar";
        toolbar.innerHTML = `<div><strong>Saved locally</strong><span>Up to 10 countdowns on this device</span></div><button type="button" id="scrollCreateBtn">+ New Countdown</button>`;
        section.querySelector(".section-heading")?.after(toolbar);
        $("#scrollCreateBtn")?.addEventListener("click", () => $("#createCountdown")?.scrollIntoView({ behavior:"smooth" }));
    }

    function setupKeyboardAndAccessibility() {
        document.addEventListener("keydown", e => {
            if (e.key !== "Escape") return;
            ["#shareModal", "#studioModal", "#timezoneModal"].forEach(closeModal);
        });
    }

    function initializePremiumLayer() {
        setupShareCenter();
        setupAppearanceStudio();
        setupCustomAppearanceFields();
        setupTimezone();
        setupMyCountdownEnhancements();
        setupKeyboardAndAccessibility();
        const accent = safeStorageGet(STORAGE.accent);
        if (accent) applyCountdownAccent(accent);
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initializePremiumLayer, { once:true });
    else initializePremiumLayer();
})();
