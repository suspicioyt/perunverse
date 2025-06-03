// Statyczna tablica osiągnięć
const achievementsData = [
    { 
        id: "01", 
        name: "100 gier", 
        opis: "Zagraj we wszystkie gry w HUBIE", 
        classes: ["beta"], 
        condition: { type: "arrayLength", key: "playedGames", threshold: "gamesNumber" } // Długość tablicy porównana z inną wartością z localStorage
    },
    { 
        id: "02", 
        name: "Runner", 
        opis: "Zbierz 150 pkt w Dino", 
        game: "game/dino.html", 
        classes: ["beta"], 
        condition: { type: "data", key: "dinoBestScore", threshold: 150 } // Pojedyncze dane
    },
    { 
        id: "03", 
        name: "Mistrz odbijania", 
        opis: "Zbierz 11 pkt w Ping Pongu", 
        game: "game/pingpong.html", 
        classes: ["beta"], 
        condition: { type: "data", key: "pingPong", threshold: 11 }
    },
    { 
        id: "04", 
        name: "Wieże czy wierze?", 
        opis: "Zbierz 60 pkt w Flappy Bird", 
        game: "game/flappybird.html", 
        classes: ["beta"], 
        condition: { type: "data", key: "flappyHighScore", threshold: 60 }
    },
    { 
        id: "05", 
        name: "2048", 
        opis: "Zbierz 2048 pkt w 2048", 
        game: "game/2048.html", 
        classes: ["beta"], 
        condition: { type: "data", key: "2048highScore", threshold: 2048 }
    },
    // { 
    //     id: "06", 
    //     name: "Uderzacz", 
    //     opis: "Uderz w 20 kretów w Whack a Mole", 
    //     game: "game/whackamole.html", 
    //     classes: ["beta"], 
    //     condition: { type: "data", key: "whackAMoleHighScore", threshold: 20 }
    // }
    // { 
    //     id: "03", 
    //     name: "Mistrz odbijania", 
    //     opis: "Zbierz 10 pkt w Ping Pongu i ukończ 1 inne osiągnięcie", 
    //     game: "game/pingpong.html", 
    //     classes: ["beta"], 
    //     condition: [ // Wiele warunków
    //         { type: "data", key: "pingPong", threshold: 10 },
    //         { type: "achievementsCount", threshold: 1 }
    //     ]
    // },
];

// Statyczna tablica odznak z warunkami podobnymi do osiągnięć
const badgesData = [
    { 
        id: "B01", 
        name: "Wielkanoc 2025", 
        opis: "Ukończ event Wielkanoc 2025: Zbierz 20 pisanek i zająców oraz zbierz 25 pkt. w Jajka Wielkanocne", 
        icon: "fa-star", 
        condition: [
            { type: "arrayLength", key: "easter2025Buttons", threshold: 20 }, // Jeden warunek
            { type: "data", key: "eventGameHighScore", threshold: 25 }
        ]
    },
    { 
        id: "B02", 
        name: "Gracz", 
        opis: "Ukończ 3 osiągnięcia", 
        icon: "fa-trophy", 
        condition: [ // Wiele warunków
            { type: "achievementsCount", threshold: 3 }
        ]
    },
    { 
        id: "B03", 
        name: "Mistrz", 
        opis: "Zagraj w 10 gier, i ukończ 5 osiągnięcia", 
        icon: "fa-crown", 
        condition: [ // Wiele warunków
            { type: "arrayLength", key: "playedGames", threshold: 10 },
            //{ type: "data", key: "2048highScore", threshold: 2049 },
            { type: "achievementsCount", threshold:5 }
        ]
    }
];

function getLocalStorageData(keys) {
    const data = {};
    keys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value) {
            try {
                data[key] = JSON.parse(value);
            } catch (e) {
                console.warn(`Błąd parsowania ${key} z localStorage:`, e);
                data[key] = 0;
            }
        }
    });
    return data;
}

function checkCompletedAchievements() {
    // Pobieramy klucze z condition dla osiągnięć
    const localStorageData = getLocalStorageData(
        achievementsData.flatMap(a => 
            Array.isArray(a.condition) 
                ? a.condition.filter(c => c.key).map(c => c.key) 
                : a.condition.key ? [a.condition.key] : []
        )
    );
    const completedAchievementsIds = [];

    achievementsData.forEach(achievement => {
        let isCompleted = false;

        if (Array.isArray(achievement.condition)) {
            // Wiele warunków – wszystkie muszą być spełnione
            isCompleted = achievement.condition.every(cond => {
                switch (cond.type) {
                    case "data":
                        const currentProgress = Number(localStorageData[cond.key]) || 0;
                        return currentProgress >= cond.threshold;
                    case "achievementsCount":
                        // Tymczasowo liczymy ukończone osiągnięcia rekurencyjnie
                        const completedAchievements = completedAchievementsIds.length;
                        return completedAchievements >= cond.threshold;
                    case "arrayLength":
                        const array = JSON.parse(localStorage.getItem(cond.key)) || [];
                        const maxProgress = typeof cond.threshold === "string" ? Number(localStorage.getItem(cond.threshold)) || 0 : cond.threshold;
                        return array.length >= maxProgress;
                    default:
                        console.warn(`Nieznany typ warunku dla osiągnięcia ${achievement.id}: ${cond.type}`);
                        return false;
                }
            });
        } else {
            // Pojedynczy warunek
            switch (achievement.condition.type) {
                case "data":
                    const currentProgress = Number(localStorageData[achievement.condition.key]) || 0;
                    isCompleted = currentProgress >= achievement.condition.threshold;
                    break;
                case "achievementsCount":
                    const completedAchievements = completedAchievementsIds.length;
                    isCompleted = completedAchievements >= achievement.condition.threshold;
                    break;
                case "arrayLength":
                    const array = JSON.parse(localStorage.getItem(achievement.condition.key)) || [];
                    const maxProgress = typeof achievement.condition.threshold === "string" ? Number(localStorage.getItem(achievement.condition.threshold)) || 0 : achievement.condition.threshold;
                    isCompleted = array.length >= maxProgress;
                    break;
                default:
                    console.warn(`Nieznany typ warunku dla osiągnięcia ${achievement.id}: ${achievement.condition.type}`);
            }
        }

        if (isCompleted) completedAchievementsIds.push(achievement.id);
    });

    localStorage.setItem('completedAchievementsIds', JSON.stringify(completedAchievementsIds));
    return { count: completedAchievementsIds.length, ids: completedAchievementsIds };
}

function checkCompletedBadges() {
    // Pobieramy wszystkie klucze z localStorage, które mogą być potrzebne
    const localStorageData = getLocalStorageData(
        badgesData.flatMap(b => 
            Array.isArray(b.condition) 
                ? b.condition.filter(c => c.key).map(c => c.key) 
                : b.condition.key ? [b.condition.key] : []
        )
    );
    const completedBadgesIds = [];

    badgesData.forEach(badge => {
        let isCompleted = false;

        if (Array.isArray(badge.condition)) {
            // Wiele warunków – wszystkie muszą być spełnione
            isCompleted = badge.condition.every(cond => {
                switch (cond.type) {
                    case "data":
                        const currentProgress = Number(localStorageData[cond.key]) || 0;
                        return currentProgress >= cond.threshold;
                    case "achievementsCount":
                        const completedAchievements = checkCompletedAchievements().count;
                        return completedAchievements >= cond.threshold;
                    case "arrayLength":
                        const array = JSON.parse(localStorage.getItem(cond.key)) || [];
                        return array.length >= cond.threshold;
                    default:
                        console.warn(`Nieznany typ warunku dla odznaki ${badge.id}: ${cond.type}`);
                        return false;
                }
            });
        } else {
            // Pojedynczy warunek
            switch (badge.condition.type) {
                case "data":
                    const currentProgress = Number(localStorageData[badge.condition.key]) || 0;
                    isCompleted = currentProgress >= badge.condition.threshold;
                    break;
                case "achievementsCount":
                    const completedAchievements = checkCompletedAchievements().count;
                    isCompleted = completedAchievements >= badge.condition.threshold;
                    break;
                case "arrayLength":
                    const array = JSON.parse(localStorage.getItem(badge.condition.key)) || [];
                    isCompleted = array.length >= badge.condition.threshold;
                    break;
                default:
                    console.warn(`Nieznany typ warunku dla odznaki ${badge.id}: ${badge.condition.type}`);
            }
        }

        if (isCompleted) completedBadgesIds.push(badge.id);
    });

    localStorage.setItem('completedBadgesIds', JSON.stringify(completedBadgesIds));
    return { count: completedBadgesIds.length, ids: completedBadgesIds };
}

function createAchievementElement(achievement, localStorageData) {
    const element = document.createElement("div");
    element.classList.add("achievement-box");
    if (achievement.game) {
        element.style.cursor = "pointer";
        element.addEventListener("click", () => window.open(achievement.game, "_blank", "noopener,noreferrer"));
    }

    achievement.classes?.forEach(className => { if (typeof className === "string") element.classList.add(className); });

    let isCompleted = false;
    let currentProgress = 0;
    let maxProgress = 0;

    if (Array.isArray(achievement.condition)) {
        // Wiele warunków – wszystkie muszą być spełnione
        isCompleted = achievement.condition.every(cond => {
            switch (cond.type) {
                case "data":
                    currentProgress = Number(localStorageData[cond.key]) || 0;
                    maxProgress = cond.threshold;
                    return currentProgress >= maxProgress;
                case "achievementsCount":
                    const completedAchievements = checkCompletedAchievements().count;
                    return completedAchievements >= cond.threshold;
                case "arrayLength":
                    const array = JSON.parse(localStorage.getItem(cond.key)) || [];
                    maxProgress = typeof cond.threshold === "string" ? Number(localStorage.getItem(cond.threshold)) || 0 : cond.threshold;
                    return array.length >= maxProgress;
                default:
                    console.warn(`Nieznany typ warunku dla osiągnięcia ${achievement.id}: ${cond.type}`);
                    return false;
            }
        });
    } else {
        // Pojedynczy warunek
        switch (achievement.condition.type) {
            case "data":
                currentProgress = Number(localStorageData[achievement.condition.key]) || 0;
                maxProgress = achievement.condition.threshold;
                isCompleted = currentProgress >= maxProgress;
                break;
            case "achievementsCount":
                const completedAchievements = checkCompletedAchievements().count;
                maxProgress = achievement.condition.threshold;
                isCompleted = completedAchievements >= maxProgress;
                break;
            case "arrayLength":
                const array = JSON.parse(localStorage.getItem(achievement.condition.key)) || [];
                maxProgress = typeof achievement.condition.threshold === "string" ? Number(localStorage.getItem(achievement.condition.threshold)) || 0 : achievement.condition.threshold;
                currentProgress = array.length;
                isCompleted = currentProgress >= maxProgress;
                break;
            default:
                console.warn(`Nieznany typ warunku dla osiągnięcia ${achievement.id}: ${achievement.condition.type}`);
        }
    }

    element.style.backgroundColor = isCompleted ? "#4CAF50" : "#FF4C4C";

    const title = document.createElement("h2");
    title.textContent = achievement.name || "Bez nazwy";
    element.appendChild(title);

    const description = document.createElement("p");
    description.textContent = achievement.opis || "Brak opisu";
    element.appendChild(description);

    if (localStorage.getItem('DEVsettings') === "true") {
        const devContent = document.createElement("div");
        devContent.classList.add("DEVachievement-content");
        devContent.textContent = `#${achievement.id ?? "[Brak ID]"}`;
        element.appendChild(devContent);
    }

    const progressBar = document.createElement("div");
    progressBar.classList.add("progress-bar");
    const progressPercentage = maxProgress > 0 ? Math.min(100, (currentProgress / maxProgress) * 100) : 0;
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.textContent = `${currentProgress}/${maxProgress}`;
    progressBar.setAttribute("role", "progressbar");
    progressBar.setAttribute("aria-valuenow", currentProgress);
    progressBar.setAttribute("aria-valuemin", "0");
    progressBar.setAttribute("aria-valuemax", maxProgress);
    progressBar.setAttribute("aria-label", `Postęp: ${currentProgress} z ${maxProgress}`);
    element.appendChild(progressBar);

    return element;
}

function createBadgeElement(badge) {
    const element = document.createElement("div");
    element.classList.add("badge-box");

    let isCompleted = false;
    const localStorageData = getLocalStorageData(
        Array.isArray(badge.condition) 
            ? badge.condition.filter(c => c.key).map(c => c.key) 
            : [badge.condition.key].filter(Boolean)
    );

    if (Array.isArray(badge.condition)) {
        // Wiele warunków – wszystkie muszą być spełnione
        isCompleted = badge.condition.every(cond => {
            switch (cond.type) {
                case "data":
                    const currentProgress = Number(localStorageData[cond.key]) || 0;
                    return currentProgress >= cond.threshold;
                case "achievementsCount":
                    const completedAchievements = checkCompletedAchievements().count;
                    return completedAchievements >= cond.threshold;
                case "arrayLength":
                    const array = JSON.parse(localStorage.getItem(cond.key)) || [];
                    return array.length >= cond.threshold;
                default:
                    console.warn(`Nieznany typ warunku dla odznaki ${badge.id}: ${cond.type}`);
                    return false;
            }
        });
    } else {
        // Pojedynczy warunek
        switch (badge.condition.type) {
            case "data":
                const currentProgress = Number(localStorageData[badge.condition.key]) || 0;
                isCompleted = currentProgress >= badge.condition.threshold;
                break;
            case "achievementsCount":
                const completedAchievements = checkCompletedAchievements().count;
                isCompleted = completedAchievements >= badge.condition.threshold;
                break;
            case "arrayLength":
                const array = JSON.parse(localStorage.getItem(badge.condition.key)) || [];
                isCompleted = array.length >= badge.condition.threshold;
                break;
            default:
                console.warn(`Nieznany typ warunku dla odznaki ${badge.id}: ${badge.condition.type}`);
        }
    }

    element.style.backgroundColor = isCompleted ? "#FFD700" : "#808080";

    const iconContainer = document.createElement("div");
    iconContainer.classList.add("badge-icon");
    const icon = document.createElement("i");
    icon.classList.add("fas", badge.icon);
    iconContainer.appendChild(icon);
    element.appendChild(iconContainer);

    const title = document.createElement("h2");
    title.textContent = badge.name || "Bez nazwy";
    element.appendChild(title);

    if (localStorage.getItem('DEVsettings') === "true") {
        const devContent = document.createElement("div");
        devContent.classList.add("DEVbadge-content");
        devContent.textContent = `#${badge.id ?? "[Brak ID]"}`;
        element.appendChild(devContent);
    }

    const stripe = document.createElement("div");
    stripe.classList.add("badge-stripe");
    stripe.style.backgroundColor = isCompleted ? "#DAA520" : "#666666";
    element.appendChild(stripe);

    element.addEventListener('click', () => {
        quickNotification(badge.opis);
    });

    return element;
}

async function loadAchievementsAndBadges() {
    const container = document.querySelector("#achievementModalContent");
    if (!container) {
        console.error("Nie znaleziono elementu #achievementModalContent");
        return;
    }

    // Pobieramy klucze z condition dla osiągnięć
    const localStorageData = getLocalStorageData(
        achievementsData.flatMap(a => 
            Array.isArray(a.condition) 
                ? a.condition.filter(c => c.key).map(c => c.key) 
                : a.condition.key ? [a.condition.key] : []
        )
    );
    
    container.innerHTML = `
        <button class="refreshButton" aria-label="Odśwież osiągnięcia i odznaki">
            <i class="fas fa-redo"></i>
        </button>
        <div class="content-wrapper">
            <div class="achievements-section">
                <h2>Osiągnięcia</h2>
                <div class="achievements-container"></div>
            </div>
            <div class="badges-section">
                <h2>Odznaki</h2>
            </div>
        </div>
    `;

    const refreshButton = container.querySelector(".refreshButton");
    refreshButton.addEventListener("click", async () => {
        refreshButton.disabled = true;
        refreshButton.querySelector("i").classList.add("rotate");
        await reloadAchievementsAndBadges();
        setTimeout(() => {
            refreshButton.querySelector("i").classList.remove("rotate");
            refreshButton.disabled = false;
        }, 1000);
    });

    const achievementsContainer = container.querySelector(".achievements-container");
    achievementsData.forEach(achievement => {
        achievementsContainer.appendChild(createAchievementElement(achievement, localStorageData));
    });

    const badgesSection = container.querySelector(".badges-section");
    badgesData.forEach(badge => {
        badgesSection.appendChild(createBadgeElement(badge));
    });
}

async function reloadAchievementsAndBadges() {
    await loadAchievementsAndBadges();
    checkCompletedAchievements();
    checkCompletedBadges();
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadAchievementsAndBadges();
    checkCompletedAchievements();
    checkCompletedBadges();
    localStorage.setItem('achievementsNumber', achievementsData.length);
    localStorage.setItem('badgesNumber', badgesData.length);
});