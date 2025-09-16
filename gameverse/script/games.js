"use strict";

// Utility: Debounce function to prevent rapid event triggers
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Load switches from localStorage
function loadSettingSwitches() {
    try {
        return JSON.parse(localStorage.getItem("settingSwitches")) || [];
    } catch (e) {
        return [];
    }
}

// Create favorite button HTML
function createFavoriteButton(gameId, isFavorite) {
    return `
        <input type="checkbox" id="check${gameId}" class="favorite-checkbox" data-game-id="${gameId}" ${isFavorite ? "checked" : ""} aria-label="Toggle favorite for game ${gameId}">
        <label for="check${gameId}">
            <svg class="unchecked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40" stroke="#fff" stroke-width="1.5" fill="none">
                <path d="m17.5,29.71c-.55,0-1.02-.2-1.41-.59-.39-.39-.59-.86-.59-1.41v-10.18c0-.27.05-.52.16-.76.11-.24.25-.45.44-.64l5.43-5.4c.25-.23.55-.38.89-.42.34-.05.67,0,.99.17.32.17.55.4.69.7.14.3.17.61.09.92l-1.12,4.6h5.45c.53,0,1,.2,1.4.6.4.4.6.87.6,1.4v2c0,.12-.01.24-.04.38-.02.13-.06-.26-.11-.38l-3,7.05c-.15.33-.4.62-.75.85-.35.23-.72.35-1.1.35h-8Zm-6,0c-.55,0-1.02-.2-1.41-.59-.39-.39-.59-.86-.59-1.41v-9c0-.55.2-1.02.59-1.41.39-.39.86-.59,1.41-.59s1.02.2,1.41.59c.39.39.59.86.59,1.41v9c0,.55-.2,1.02-.59,1.41-.39.39-.86.59-1.41.59Z"/>
            </svg>
            <svg class="checked" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
                <circle class="circle-1" cx="8.85" cy="7.44" r="1.5"/>
                <circle class="circle-2" cx="33.2" cy="33.67" r="1"/>
                <circle class="circle-3" cx="32.08" cy="8.25" r=".75"/>
                <circle class="circle-3" cx="8.33" cy="35.38" r=".75"/>
                <path class="flower-1" d="m9.1,5.37c-.24.14-.54.06-.68-.18s-.06-.54.18-.68.54-.06.68.18.54.06-.18.68Zm-2.42.32c-.28,0-.5.22-.5.5,0,.28.22.5.5.5s.5-.22.5-.5c0-.28-.22-.5-.5-.5Zm-.43,2.75c-.14.24-.06.54.18.68s.54.06.68-.18.06-.54-.18-.68-.54-.06-.68.18Zm2.17,1.75c.14.24.44.32.68.18s.32-.44.18-.68-.44-.32-.68-.18-.32.44-.18.68Zm2.6-1c.28,0,.5-.22.5-.5s-.22-.5-.5-.5-.5.22-.5.5.22.5.5.5Zm.43-2.75c.14-.24.06-.54-.18-.68s-.54-.06-.68.18-.06.54.18.68.54.06.68-.18Z"/>
                <path class="flower-2" d="m7.83,33.13c0-.28.22-.5.5-.5s.5.22.5.5c0,.28-.22.5-.5.5s-.5-.22-.5-.5Zm-1.02,1.38c.14-.24.06-.54-.18-.68s-.54-.06-.68.18-.06.54.18.68.54.06.68-.18Zm0,1.75c-.14-.24-.44-.32-.68-.18s-.32.44-.18.68.44.32.68.18.32-.44.18-.68Zm1.52.88c-.28,0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5Zm1.52-.87c-.14.24-.06.54.18.68s.54.06.68-.18.06-.54-.18-.68-.54-.06-.68.18Zm0-1.75c.14.24.44.32.68.18s.32-.44-.18-.68-.44-.32-.68-.18-.32.44-.18-.68Z"/>
                <path class="flower-3" d="m32.7,36.17c0-.28.22-.5.5-.5s.5.22.5.5c0,.28-.22.5-.5.5s-.5-.22-.5-.5Zm3.1-1c.14-.24.06-.54-.18-.68s-.54-.06-.68.18-.06.54.18.68.54.06.68-.18Zm0-3c-.14-.24-.44-.32-.68-.18s-.32.44-.18.68.44.32.68.18.32-.44.18-.68Zm-2.6-1.5c-.28,0-.5.22-.5.5,0,.28.22.5.5.5s.5-.22.5-.5-.22-.5-.5-.5Zm-2.6,1.5c-.14.24-.06.54.18.68s.54.06.68-.18.06-.54-.18-.68-.54-.06-.68.18A-.5.5,0,0,0,30.1,33Z"/>
                <path class="flower-2" d="m32.58,6c0,.28-.22.5-.5.5s-.5-.22-.5-.5.22-.22.5.5s-.22-.5-.5.5.22.5.5.5Zm-2.88.87c-.14.24-.06.54.18.68s.54.06.68-.18.06-.54-.18-.68-.54-.06-.68.18Zm0,2.75c.14.24.44.32.68.18s.32-.44.18-.68-.44-.32-.68-.18-.32.44-.18-.68Zm2.38,1.38c.28,0,.5-.22.5-.5,0-.28-.22-.5-.5-.5s-.5.22-.5.5c0,.28.22.5.5.5Zm2.38-1.37c.14-.24.06-.54-.18-.68s-.54-.06-.68.18-.06.54.18.68.54.06.68-.18Zm0-2.75c-.14-.24-.44-.32-.68-.18s-.32.44-.18.68.44.32-.68.18.32-.44-.18-.68Z"/>
                <line class="line line-1" x1="33.2" y1="33.67" x2="37.16" y2="37.63"/>
                <line class="line line-4" x1="32.08" y1="8.25" x2="36.74" y2="3.59"/>
                <line class="line line-3" x1="8.73" y1="7.3" x2="4.63" y2="3.2"/>
                <line class="line line-2" x1="8.33" y1="35.38" x2="5.72" y2="37.99"/>
                <path class="line line-2" d="m24.47,8.03c-1.32-1.84,1.6-5.11,2.06-2.97.37,1.74-4.2,0-2.68-2.97"/>
                <path class="line line-6" d="M27.15,32.66c.75,1.37-2.07,5.62-2.82,3.96-.64-1.42,3.02-1.3,3.76,1.36"/>
                <line class="line line-7" x1="33.46" y1="29.71" x2="37.97" y2="29.71"/>
                <line class="line line-5" x1="7.56" y1="13.99" x2="2.91" y2="13.99"/>
                <path class="hand" d="m17.5,29.71c-.55,0-1.02-.2-1.41-.59-.39-.39-.59-.86-.59-1.41v-10.18c0-.27.05-.52.16-.76.11-.24.25-.45.44-.64l5.43-5.4c.25-.23.55-.38.89-.42.34-.05.67,0,.99.17.32.17.55.4.69.7.14.3.17.61.09.92l-1.12,4.6h5.45c.53,0,1,.2,1.4.6.4.4.6.87.6,1.4v2c0,.12-.01.24-.04.38-.02.13-.06.26-.11.38l-3,7.05c-.15.33-.4.62-.75.85-.35.23-.72.35-1.1.35h-8Zm-6,0c-.55,0-1.02-.2-1.41-.59-.39-.39-.59-.86-.59-1.41v-9c0-.55.2-1.02.59-1.41.39-.39.86-.59,1.41-.59s1.02.2,1.41.59c.39.39.59.86.59,1.41v9c0,.55-.2,1.02-.59,1.41-.39.39-.86.59-1.41.59Z"/>
            </svg>
        </label>
    `;
}

// Create vote button HTML
function createVoteButton(gameId, hasVoted) {
    return `
        <button class="vote-button" data-game-id="${gameId}" title="${hasVoted ? 'Usuń głos' : 'Zagłosuj na tę grę'}" aria-label="${hasVoted ? 'Usuń głos dla gry ' + gameId : 'Zagłosuj na grę ' + gameId}">
            <i class="fa-solid fa-check-to-slot"></i>
        </button>
    `;
}

// Save favorite games to localStorage
function saveFavorites(games) {
    try {
        const favoriteGames = games.filter(game => game.ulubione && game.id !== "999").map(game => game.id);
        localStorage.setItem("favoriteGames", JSON.stringify(favoriteGames));
    } catch (e) {
        // Silently fail
    }
}

// Load favorite games from localStorage
function loadFavorites(games) {
    try {
        const favoriteIds = JSON.parse(localStorage.getItem("favoriteGames")) || [];
        games.forEach(game => {
            game.ulubione = favoriteIds.includes(game.id) && game.id !== "999";
        });
    } catch (e) {
        // Silently fail
    }
}

// Save voted game to localStorage
function saveVotedGame(votedGameId) {
    try {
        if (votedGameId) {
            localStorage.setItem("votedGame", JSON.stringify(votedGameId));
        }
    } catch (e) {
        // Silently fail
    }
}

// Load voted game from localStorage
function loadVotedGame() {
    try {
        const votedGame = localStorage.getItem("votedGame");
        return votedGame ? JSON.parse(votedGame) : null;
    } catch (e) {
        return null;
    }
}

// Toggle vote status for a game
function toggleVoteGame(gameId, games) {
    if (gameId === "999") return;
    const currentVotedGame = loadVotedGame();
    if (currentVotedGame === gameId) {
        saveVotedGame(null);
    } else {
        saveVotedGame(gameId);
    }
    updateGameDisplay(games);
}

// Toggle favorite status for a game
function toggleFavoriteGame(gameId, games) {
    if (gameId === "999") return;
    const game = games.find(g => g.id === gameId);
    if (game) {
        game.ulubione = !game.ulubione;
        saveFavorites(games);
        updateGameDisplay(games);
    }
}

// Copy text to clipboard
function copyToClipboard(text) {
    try {
        navigator.clipboard.write(text);
    } catch (e) {
        // Silently fail
    }
}

// Load games from JSON file
async function loadGamesFromJson() {
    try {
        const response = await fetch('./data/games.json');
        if (!response.ok) {
            console.error('Błąd HTTP podczas pobierania gier z JSON:', response.status, response.statusText);
            return null;
        }
        const data = await response.json();
        console.log('Dane gier z JSON:', data);
        // Pobierz tablicę gier z klucza "games"
        const games = data.games || [];
        // Normalizuj dane, aby zapewnić zgodność z oczekiwaną strukturą
        games.forEach(game => {
            game.classes = Array.isArray(game.classes) ? game.classes : (game.classes ? game.classes.split(',') : []);
            game.premium = game.premium === true || game.premium === 'true' || false;
            game.disabled = game.disabled === true || game.disabled === 'true' || false;
            game.internet = game.internet || '';
            game.ulubione = game.ulubione === true || game.ulubione === 'true' || false;
        });
        localStorage.setItem('gamesData', JSON.stringify(games));
        window.games = games;
        return games;
    } catch (error) {
        console.error('Błąd podczas pobierania gier z JSON:', error);
        return null;
    }
}

// Create a game box element
function createGameBox(game, games, switches, lastPlayedGameId, playedGames, votedGame, perunPremium) {
    const gameBox = document.createElement("div");
    gameBox.classList.add("game-box");
    gameBox.setAttribute("data-game-id", game.id);

    if (game.premium) gameBox.classList.add("premium");

    const lastPlayedSwitch = switches?.find(s => s.switchId === "06")?.value ?? false;
    const seenSwitch = switches?.find(s => s.switchId === "08")?.value ?? false;

    if (game.id === lastPlayedGameId && lastPlayedSwitch && game.id !== "999") {
        gameBox.classList.add("lastPlayed");
        const status = document.createElement("span");
        status.innerHTML = "Ostatnio grane";
        status.classList.add("lastPlayedLabel");
        gameBox.appendChild(status);
    }

    game.classes.forEach(className => gameBox.classList.add(className));
    if (game.ulubione && game.id !== "999") gameBox.style.backgroundColor = "#FF4C4C";

    if (game.status) {
        const status = document.createElement("span");
        status.innerHTML = game.status;
        status.classList.add("game-label");
        gameBox.appendChild(status);
    }
    if (game.premium) {
        const status = document.createElement("span");
        status.innerHTML = '<i class="fas fa-crown"></i>';
        status.classList.add("premium-label");
        status.setAttribute("aria-label", "Premium game");
        gameBox.appendChild(status);
    }
    if (game.classes.includes("ukonczona")) {
        const status = document.createElement("span");
        status.innerHTML = '<i class="fas fa-check-circle"></i>';
        status.title = "Ukończona gra";
        status.setAttribute("aria-label", "Completed game");
        status.classList.add("game-status");
        gameBox.appendChild(status);
    }

    const iconContainer = document.createElement("div");
    iconContainer.classList.add("game-icon-container");
    iconContainer.style.zIndex = "10";

    const icons = [];
    if (game.classes.includes("money")) {
        icons.push({
            html: '<i class="fas fa-sack-dollar"></i>',
            class: "game-status-money",
            aria: "Gra z pieniędzmi"
        });
    }
    if (game.classes.includes("internet") && game.internet) {
        const internetIcon = document.createElement("span");
        internetIcon.innerHTML = '<i class="fas fa-globe-americas"></i>';
        internetIcon.classList.add("game-status-internet");
        internetIcon.setAttribute("aria-label", "Copy game URL");
        if (!internetIcon.dataset.listenerAdded) {
            internetIcon.addEventListener("click", e => {
                e.stopPropagation();
                copyToClipboard(game.internet);
            });
            internetIcon.dataset.listenerAdded = "true";
        }
        icons.push({
            element: internetIcon,
            class: "game-status-internet"
        });
    }
    if (seenSwitch && playedGames.includes(game.id) && game.id !== "999") {
        icons.push({
            html: '<i class="fas fa-eye"></i>',
            class: "game-status-seen",
            aria: "Game previously played"
        });
    }

    icons.forEach(icon => {
        const iconElement = icon.element || document.createElement("span");
        if (icon.html) iconElement.innerHTML = icon.html;
        iconElement.classList.add(icon.class);
        if (icon.aria) iconElement.setAttribute("aria-label", icon.aria);
        iconContainer.appendChild(iconElement);
    });

    gameBox.appendChild(iconContainer);

    if (switches?.find(s => s.switchId === "01")?.value) {
        const devContent = document.createElement("div");
        devContent.classList.add("DEVgame-content");
        devContent.textContent = `#${game.id}` || "";
        gameBox.appendChild(devContent);
    }

    const title = document.createElement("h2");
    title.innerHTML = game.name;
    gameBox.appendChild(title);

    const link = document.createElement("a");
    link.innerHTML = game.disabled === true ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-play"></i>';
    link.classList.add("game-link");
    link.style.position = "relative";
    link.style.zIndex = "20";
    link.setAttribute("aria-label", game.disabled === true ? `Gra ${game.name} niedostępna` : `Zagraj w grę ${game.name}`);
    if (game.disabled === true) {
        link.classList.add("disabled");
        link.setAttribute("disabled", "true");
    } else {
        if (!link.dataset.listenerAdded) {
            link.addEventListener("click", e => {
                e.preventDefault();
                if (game.id !== "999") {
                    addPlayedGameToStorage(game.id);
                    localStorage.setItem("lastPlayedGame", game.id);
                }
                const switches = loadSettingSwitches();
                const isConditionTrue = switches?.find(s => s.switchId === "09")?.value ?? false;
                if (isConditionTrue) {
                    Modal.open('gameModal');
                    document.getElementById("gameIframe").src = game.link;
                } else {
                    window.open(game.link, "_blank");
                }
            });
            link.addEventListener("contextmenu", e => {
                e.preventDefault();
                document.getElementById("gameTooltipTitle").innerHTML=game.name;
                document.getElementById("gameTooltipDescribe").innerHTML=game.tooltip;
                document.getElementById("gameTooltipContainer").classList.add("show");
            });
            link.dataset.listenerAdded = "true";
        }
    }

    // if (game.tooltip) {
    //     const tooltip = document.createElement("span");
    //     tooltip.innerHTML = game.tooltip;
    //     tooltip.classList.add("tooltiptext");
    //     tooltip.id = `tooltip-${game.id}`;
    //     tooltip.style.zIndex = "15";
    //     link.setAttribute("aria-describedby", `tooltip-${game.id}`);
    //     link.appendChild(tooltip);
    // }
    gameBox.appendChild(link);

    if (game.id !== "999") {
        const favoriteButton = document.createElement("div");
        favoriteButton.classList.add("favorite-button");
        favoriteButton.style.zIndex = "10";
        favoriteButton.innerHTML = createFavoriteButton(game.id, game.ulubione);
        gameBox.appendChild(favoriteButton);
        // if (loadVotedGame() !== game.id) {
        //     const voteButton = document.createElement("div");
        //     voteButton.classList.add("vote-button");
        //     voteButton.style.zIndex = "10";
        //     voteButton.innerHTML = createVoteButton(game.id, votedGame === game.id);
        //     gameBox.appendChild(voteButton);
        // }
    }

    if (loadVotedGame() === game.id) {
        gameBox.classList.add("votedGame");
        const status = document.createElement("span");
        status.innerHTML = '<i class="fa-solid fa-check-to-slot"></i> Wybrano';
        status.classList.add("voted-label");
        gameBox.appendChild(status);
    }
    
    return gameBox;
}

// Update game display based on current state
function updateGameDisplay(games, perunPremium = false) {
    const containers = document.querySelectorAll(".game-container");
    const lastPlayedGameId = localStorage.getItem("lastPlayedGame");
    const switches = loadSettingSwitches();
    const playedGames = JSON.parse(localStorage.getItem("playedGames")) || [];
    const votedGame = loadVotedGame();

    let filteredGames = perunPremium ? games : games.filter(game => !game.premium);

    const lastPlayedSwitch = switches?.find(s => s.switchId === "06")?.value ?? false;
    const sortedGames = filteredGames.sort((a, b) => {
        if (lastPlayedSwitch && a.id !== "999" && b.id !== "999") {
            if (a.id === lastPlayedGameId) return -1;
            if (b.id === lastPlayedGameId) return 1;
        }
        if (a.ulubione && !b.ulubione && a.id !== "999") return -1;
        if (!a.ulubione && b.ulubione && b.id !== "999") return 1;
        return 0;
    });

    if (sortedGames.length === 0) {
        containers.forEach(container => {
            container.innerHTML = "";
            const message = document.createElement("p");
            message.textContent = "Brak dostępnych gier.";
            message.setAttribute("aria-live", "polite");
            container.appendChild(message);
        });
        return;
    }

    let gameIndex = 0;

    containers.forEach((container, containerIndex) => {
        const fragment = document.createDocumentFragment();
        const maxGames = parseInt(container.getAttribute("max"), 10) || sortedGames.length;

        for (let i = 0; i < maxGames && gameIndex < sortedGames.length; i++) {
            const game = sortedGames[gameIndex++];
            if (!game.id || !game.name || !game.link) continue;
            const gameBox = createGameBox(game, games, switches, lastPlayedGameId, playedGames, votedGame, perunPremium);
            fragment.appendChild(gameBox);
        }

        if (containerIndex === containers.length - 1 && switches?.find(s => s.switchId === "05")?.value) {
            const customGame = document.createElement("div");
            customGame.classList.add("game-box");

            const title = document.createElement("h2");
            title.textContent = "???";
            customGame.appendChild(title);

            const link = document.createElement("a");
            link.textContent = "Stwórz";
            link.classList.add("game-link");
            link.style.position = "relative";
            link.style.zIndex = "20";
            link.setAttribute("aria-label", "Stwórz własną grę");
            if (!link.dataset.listenerAdded) {
                link.addEventListener("click", () => {
                    Modal.open("ownGameModal");
                });
                link.dataset.listenerAdded = "true";
            }
            customGame.appendChild(link);

            fragment.appendChild(customGame);
        }

        container.innerHTML = "";
        container.appendChild(fragment);
    });

    attachFavoriteEvents(games);
    attachVoteEvents(games);
}

// Attach events to favorite checkboxes
function attachFavoriteEvents(games) {
    document.querySelectorAll(".favorite-checkbox").forEach(checkbox => {
        checkbox.removeEventListener("change", handleFavoriteChange);
        checkbox.addEventListener("change", handleFavoriteChange);
    });

    function handleFavoriteChange(event) {
        const gameId = event.target.dataset.gameId;
        toggleFavoriteGame(gameId, games);
    }
}

// Attach events to vote buttons with debounce
function attachVoteEvents(games) {
    document.querySelectorAll(".vote-button").forEach(button => {
        button.removeEventListener("click", handleVoteClick);
        button.addEventListener("click", debounce(handleVoteClick, 300));
    });

    function handleVoteClick(event) {
        event.stopPropagation();
        const gameId = event.target.closest(".vote-button").dataset.gameId;
        toggleVoteGame(gameId, games);
    }
}

// Load slideshow for hot games
function updateHotSlideshow(games, perunPremium = false) {
    const hotGames = games.filter(game => game.classes.includes("hot") && game.id !== "999" && (perunPremium || !game.premium));
    const slideshowContainer = document.getElementById("hotSlideshow");
    if (!slideshowContainer) return;
    slideshowContainer.innerHTML = "";

    hotGames.forEach((game, index) => {
        const slide = document.createElement("div");
        slide.classList.add("slide", "hot", "game-box");
        slide.style.width = "100%";
        slide.style.maxWidth = "600px";
        slide.style.height = "auto";
        if (index === 0) slide.classList.add("active");

        const title = document.createElement("h2");
        title.textContent = game.name;
        slide.appendChild(title);

        const hotBadge = document.createElement("span");
        hotBadge.classList.add("hot-badge");
        hotBadge.setAttribute("aria-hidden", "true");
        slide.appendChild(hotBadge);

        const link = document.createElement("a");
        link.textContent = game.disabled === true ? "Niedostępne" : "Zagraj";
        link.classList.add("game-link");
        link.style.position = "relative";
        link.style.zIndex = "20";
        link.setAttribute("aria-label", game.disabled === true ? `Gra ${game.name} niedostępna` : `Zagraj w gorącą grę ${game.name}`);
        if (game.disabled === true) {
            link.classList.add("disabled");
            link.setAttribute("disabled", "true");
        } else {
            if (!link.dataset.listenerAdded) {
                link.addEventListener("click", e => {
                    e.preventDefault();
                    if (game.id !== "999") {
                        addPlayedGameToStorage(game.id);
                        localStorage.setItem("lastPlayedGame", game.id);
                    }
                    const switches = loadSettingSwitches();
                    const isConditionTrue = switches?.find(s => s.switchId === "09")?.value ?? false;
                    if (isConditionTrue) {
                        Modal.open('gameModal');
                        document.getElementById("gameIframe").src = game.link;
                    } else {
                        window.open(game.link, "_blank");
                    }
                });
                link.dataset.listenerAdded = "true";
            }
        }
        slide.appendChild(link);

        slideshowContainer.appendChild(slide);
    });

    if (hotGames.length > 1) cycleSlideshow("hotSlideshow");
}

// Load slideshow for event games
function updateEventSlideshow(games, perunPremium = false) {
    const eventGames = games.filter(game => game.classes.includes("event") && game.id !== "999" && (perunPremium || !game.premium));
    const slideshowContainer = document.getElementById("eventSlideshow");
    if (!slideshowContainer) return;
    slideshowContainer.innerHTML = "";

    eventGames.forEach((game, index) => {
        const slide = document.createElement("div");
        slide.classList.add("slide", "event", "game-box");
        slide.style.width = "100%";
        slide.style.maxWidth = "600px";
        slide.style.height = "auto";
        if (index === 0) slide.classList.add("active");

        const title = document.createElement("h2");
        title.textContent = game.name;
        slide.appendChild(title);

        const link = document.createElement("a");
        link.textContent = game.disabled === true ? "Niedostępne" : "Zagraj";
        link.classList.add("game-link");
        link.style.position = "relative";
        link.style.zIndex = "20";
        link.setAttribute("aria-label", game.disabled === true ? `Gra ${game.name} niedostępna` : `Zagraj w grę eventową ${game.name}`);
        if (game.disabled === true) {
            link.classList.add("disabled");
            link.setAttribute("disabled", "true");
        } else {
            if (!link.dataset.listenerAdded) {
                link.addEventListener("click", e => {
                    e.preventDefault();
                    if (game.id !== "999") {
                        addPlayedGameToStorage(game.id);
                        localStorage.setItem("lastPlayedGame", game.id);
                    }
                    const switches = loadSettingSwitches();
                    const isConditionTrue = switches?.find(s => s.switchId === "09")?.value ?? false;
                    if (isConditionTrue) {
                        Modal.open('gameModal');
                        document.getElementById("gameIframe").src = game.link;
                    } else {
                        window.open(game.link, "_blank");
                    }
                });
                link.dataset.listenerAdded = "true";
            }
        }
        slide.appendChild(link);

        slideshowContainer.appendChild(slide);
    });

    if (eventGames.length > 1) cycleSlideshow("eventSlideshow");
}

// Cycle through slideshow slides
function cycleSlideshow(slideshowId) {
    const slides = document.querySelectorAll(`#${slideshowId} .slide`);
    if (slides.length === 0) return;
    let current = 0;
    setInterval(() => {
        slides[current].classList.remove("active");
        current = (current + 1) % slides.length;
        slides[current].classList.add("active");
    }, 5000);
}

// Add played game to storage
function addPlayedGameToStorage(gameId) {
    if (gameId === "999") return;
    try {
        let gamesArray = JSON.parse(localStorage.getItem("playedGames")) || [];
        if (!gamesArray.includes(gameId)) {
            gamesArray.push(gameId);
            localStorage.setItem("playedGames", JSON.stringify(gamesArray));
        }
    } catch (e) {
        // Silently fail
    }
}

// Reload games with refresh button
function reloadGames(games, perunPremium = false) {
    const containers = document.querySelectorAll(".game-container");
    containers.forEach(container => {
        const existingButton = container.querySelector(".refreshButton");
        if (!existingButton) {
            const button = document.createElement("button");
            button.classList.add("refreshButton");
            button.setAttribute("aria-label", "Odśwież listę gier");

            const icon = document.createElement("i");
            icon.classList.add("fas", "fa-redo");
            button.appendChild(icon);

            container.appendChild(button);

            button.addEventListener("click", () => {
                icon.classList.add("rotate");
                setTimeout(() => {
                    icon.classList.remove("rotate");
                    updateGameDisplay(games, perunPremium);
                }, 1000);
            });
        }
    });

    updateGameDisplay(games, perunPremium);
}

// Initialize application
async function initialize() {
    try {
        // Pobierz dane gier z JSON tylko raz
        let games = await loadGamesFromJson();
        if (!games) {
            // Fallback na dane z localStorage
            const cachedGames = localStorage.getItem("gamesData");
            if (cachedGames) {
                games = JSON.parse(cachedGames);
                window.games = games;
                console.log('Użyto buforowanych danych gier z localStorage');
            } else {
                throw new Error('Nie udało się załadować gier z JSON ani z localStorage');
            }
        }

        const validGamesCount = games.filter(game => game.id !== "999").length;
        localStorage.setItem("gamesNumber", validGamesCount);
        loadFavorites(games);

        // Początkowo wyświetl tylko gry nie-premium
        updateGameDisplay(games, false);
        updateHotSlideshow(games, false);
        updateEventSlideshow(games, false);

        // Pobierz dane użytkownika, jeśli funkcja dostępna
        let userLoaded = false;
        let perunPremium = false;
        if (typeof loadUserData === 'function') {
            userLoaded = await loadUserData();
            if (!userLoaded) {
                console.warn('Nie udało się załadować danych użytkownika, używanie domyślnych wartości');
            } else if (typeof getSheetData === 'function') {
                perunPremium = await getSheetData('isPremium') ?? false;
                // Zaktualizuj wyświetlanie gier po uzyskaniu statusu premium
                updateGameDisplay(games, perunPremium);
                updateHotSlideshow(games, perunPremium);
                updateEventSlideshow(games, perunPremium);
            }
        } else {
            console.warn('Funkcja loadUserData nie jest zdefiniowana, używanie domyślnych wartości');
        }

        // Inicjalizuj dane użytkownika na stronie, jeśli funkcje dostępne
        if (typeof insertData === 'function' && typeof updatePlayerBadges === 'function') {
            const elements = document.querySelectorAll('[data-app-id][data-key]');
            elements.forEach(element => {
                const appId = element.getAttribute('data-app-id');
                const key = element.getAttribute('data-key');
                insertData(element, appId, key);
            });
            // await updatePlayerBadges();
        } else {
            console.warn('Funkcje insertData lub updatePlayerBadges nie są zdefiniowane');
            const elements = document.querySelectorAll('[data-app-id][data-key]');
            elements.forEach(element => {
                element.innerHTML = '???';
            });
            const badgesElement = document.getElementById('playerBadges');
            // if (badgesElement) badgesElement.innerHTML = '???';
        }
    } catch (e) {
        console.error('Błąd inicjalizacji:', e);
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Nie udało się załadować gier lub danych użytkownika. Spróbuj ponownie później.";
        errorMessage.setAttribute("aria-live", "assertive");
        document.body.prepend(errorMessage);
    }
}

// Start initialization on window load
window.onload = initialize;