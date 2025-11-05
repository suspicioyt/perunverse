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

// Load switches using getLocalData
function loadSettingSwitches() {
    try {
        return getLocalData('gameverse', STORAGE_KEYS.SETTING_SWITCHES) || window.settingSwitches || [];
    } catch (e) {
        return [];
    }
}

// Save switches using setLocalData
function saveSettingSwitches(switches) {
    try {
        setLocalData('gameverse', STORAGE_KEYS.SETTING_SWITCHES, switches);
    } catch (e) {
        // Silently fail
    }
}

// Create vote button HTML
function createVoteButton(gameId, hasVoted) {
    return `
        <button class="vote-button" data-game-id="${gameId}" title="${hasVoted ? 'Usuń głos' : 'Zagłosuj na tę grę'}" aria-label="${hasVoted ? 'Usuń głos dla gry ' + gameId : 'Zagłosuj na grę ' + gameId}">
            <i class="fa-solid fa-check-to-slot"></i>
        </button>
    `;
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
        const response = await fetch('data/games.json');
        if (!response.ok) {
            console.error('Błąd HTTP podczas pobierania gier z JSON:', response.status, response.statusText);
            return null;
        }
        const data = await response.json();
        console.log('Dane gier z JSON:', data);
        const games = data.games || [];
        games.forEach(game => {
            game.tags = Array.isArray(game.tags) ? game.tags : (game.tags ? game.tags.split(',') : []);
            game.internet = game.internet || '';
        });
        localStorage.setItem('gamesData', JSON.stringify(games));
        window.games = games;
        return games;
    } catch (error) {
        console.error('Błąd podczas pobierania gier z JSON:', error);
        return null;
    }
}

// Create tag label HTML with specific icons
function createTagLabel(tag) {
    const tagName = tag.charAt(0).toUpperCase() + tag.slice(1);
    let icon;
    switch (tag) {
        case 'premium':
            icon = '<i class="fas fa-crown"></i>';
            break;
        case 'ukonczona':
            icon = '<i class="fas fa-check-circle"></i>';
            break;
        case 'money':
            icon = '<i class="fas fa-sack-dollar"></i>';
            break;
        case 'internet':
            icon = '<i class="fas fa-globe-americas"></i>';
            break;
        case 'hot':
            icon = '<i class="fas fa-fire"></i>';
            break;
        case 'event':
            icon = '<i class="fas fa-calendar"></i>';
            break;
        case 'testy':
        case 'alpha':
        case 'beta':
        case 'testy':
        case 'konserwacje':
        case 'nowosc':
        case 'w_tworzeniu':
        case 'nie_dziala':
        case 'przyszla_aktualizacja':
            icon = '<i class="fa-regular fa-circle"></i>';
            break;
        case 'disabled':
            icon = '<i class="fa-solid fa-lock"></i>';
            break;
        default:
            icon = '<i class="fa-regular fa-circle"></i>';
    }
    const html = `
        <span class="tag-label" data-tag="${tag}" title="${tagName}">
            <span class="tag-icon">${icon}</span>
            <span class="tag-name">${tagName}</span>
        </span>
    `;
    return html;
}

// Create a game box element
function createGameBox(game, games, switches, lastPlayedGameId, playedGames, votedGame, perunPremium) {
    const gameBox = document.createElement("div");
    gameBox.classList.add("game-box");
    gameBox.setAttribute("data-game-id", game.id);

    if (game.tags.includes("premium")) gameBox.classList.add("premium");

    const lastPlayedSwitch = switches?.find(s => s.switchId === "06")?.value ?? false;

    if (game.id === lastPlayedGameId && lastPlayedSwitch && game.id !== "999") {
        gameBox.classList.add("lastPlayed");
        const status = document.createElement("span");
        status.innerHTML = "Ostatnio grane";
        status.classList.add("lastPlayedLabel");
        gameBox.appendChild(status);
    }

    game.tags.forEach(tag => gameBox.classList.add(tag));


    if(game.tags.length>3) {
        const tagContainerL = document.createElement("div");
        tagContainerL.classList.add("tag-containerL");

        const tagContainerR = document.createElement("div");
        tagContainerR.classList.add("tag-containerR");

        // Przetwarzanie pierwszych 3 tagów
        game.tags.slice(0, 3).forEach(tag => {
            const tagLabel = document.createElement("span");
            tagLabel.innerHTML = createTagLabel(tag);
            if (tag === 'internet' && game.internet) {
                const internetIcon = tagLabel;
                if (internetIcon && !internetIcon.dataset.listenerAdded) {
                    internetIcon.addEventListener("click", e => {
                        e.stopPropagation();
                        window.open(game.internet, "_blank");
                    });
                    internetIcon.dataset.listenerAdded = "true";
                }
            }
            tagContainerL.appendChild(tagLabel);
        });

        // Przetwarzanie pozostałych tagów
        game.tags.slice(3).forEach(tag => {
            const tagLabel = document.createElement("span");
            tagLabel.innerHTML = createTagLabel(tag);
            if (tag === 'internet' && game.internet) {
                const internetIcon = tagLabel;
                if (internetIcon && !internetIcon.dataset.listenerAdded) {
                    internetIcon.addEventListener("click", e => {
                        e.stopPropagation();
                        window.open(game.internet, "_blank");
                    });
                    internetIcon.dataset.listenerAdded = "true";
                }
            }
            tagContainerR.appendChild(tagLabel);
        });

        gameBox.appendChild(tagContainerL);
        gameBox.appendChild(tagContainerR);    
    } else {
        const tagContainer = document.createElement("div");
        tagContainer.classList.add("tag-containerL");
        game.tags.forEach(tag => {
            const tagLabel = document.createElement("span");
            tagLabel.innerHTML = createTagLabel(tag);
            if (tag === 'internet' && game.internet) {
                const internetIcon = tagLabel;
                if (internetIcon && !internetIcon.dataset.listenerAdded) {
                    internetIcon.addEventListener("click", e => {
                        e.stopPropagation();
                        window.open(game.internet, "_blank");
                    });
                    internetIcon.dataset.listenerAdded = "true";
                }
            }
            tagContainer.appendChild(tagLabel);
        });
        gameBox.appendChild(tagContainer);
    }

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
    link.innerHTML = game.tags.includes("disabled") ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-play"></i>';
    link.classList.add("game-link");
    link.style.position = "relative";
    link.style.zIndex = "20";
    link.setAttribute("aria-label", game.tags.includes("disabled") ? `Gra ${game.name} niedostępna` : `Zagraj w grę ${game.name}`);
    if (game.tags.includes("disabled")) {
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
                document.getElementById("gameTooltipDescribe").innerHTML=game.description;
                document.getElementById("gameTooltipContainer").classList.add("show");
            });
            link.dataset.listenerAdded = "true";
        }
    }

    gameBox.appendChild(link);

    // if (game.id !== "999") {
    //     const voteButton = document.createElement("div");
    //     voteButton.classList.add("vote-button");
    //     voteButton.style.zIndex = "10";
    //     voteButton.innerHTML = createVoteButton(game.id, votedGame === game.id);
    //     gameBox.appendChild(voteButton);
    // }

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

    let filteredGames = perunPremium ? games : games.filter(game => !game.tags.includes("premium"));

    const lastPlayedSwitch = switches?.find(s => s.switchId === "06")?.value ?? false;
    const sortedGames = filteredGames.sort((a, b) => {
        if (lastPlayedSwitch && a.id !== "999" && b.id !== "999") {
            if (a.id === lastPlayedGameId) return -1;
            if (b.id === lastPlayedGameId) return 1;
        }
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

    attachVoteEvents(games);
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
    const hotGames = games.filter(game => game.tags.includes("hot") && game.id !== "999" && (perunPremium || !game.tags.includes("premium")));
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

        const tagContainer = document.createElement("div");
        tagContainer.classList.add("tag-container");
        game.tags.forEach(tag => {
            const tagLabel = document.createElement("span");
            tagLabel.innerHTML = createTagLabel(tag);
            if (tag === 'internet' && game.internet) {
                const internetIcon = tagLabel.querySelector('.tag-icon');
                if (internetIcon && !internetIcon.dataset.listenerAdded) {
                    internetIcon.addEventListener("click", e => {
                        e.stopPropagation();
                        copyToClipboard(game.internet);
                    });
                    internetIcon.dataset.listenerAdded = "true";
                }
            }
            tagContainer.appendChild(tagLabel);
        });
        slide.appendChild(tagContainer);

        const link = document.createElement("a");
        link.textContent = game.tags.includes("disabled") ? "Niedostępne" : "Zagraj";
        link.classList.add("game-link");
        link.style.position = "relative";
        link.style.zIndex = "20";
        link.setAttribute("aria-label", game.tags.includes("disabled") ? `Gra ${game.name} niedostępna` : `Zagraj w gorącą grę ${game.name}`);
        if (game.tags.includes("disabled")) {
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
    const eventGames = games.filter(game => game.tags.includes("event") && game.id !== "999" && (perunPremium || !game.tags.includes("premium")));
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

        const tagContainer = document.createElement("div");
        tagContainer.classList.add("tag-container");
        game.tags.forEach(tag => {
            const tagLabel = document.createElement("span");
            tagLabel.innerHTML = createTagLabel(tag);
            if (tag === 'internet' && game.internet) {
                const internetIcon = tagLabel.querySelector('.tag-icon');
                if (internetIcon && !internetIcon.dataset.listenerAdded) {
                    internetIcon.addEventListener("click", e => {
                        e.stopPropagation();
                        copyToClipboard(game.internet);
                    });
                    internetIcon.dataset.listenerAdded = "true";
                }
            }
            tagContainer.appendChild(tagLabel);
        });
        slide.appendChild(tagContainer);

        const link = document.createElement("a");
        link.textContent = game.tags.includes("disabled") ? "Niedostępne" : "Zagraj";
        link.classList.add("game-link");
        link.style.position = "relative";
        link.style.zIndex = "20";
        link.setAttribute("aria-label", game.tags.includes("disabled") ? `Gra ${game.name} niedostępna` : `Zagraj w grę eventową ${game.name}`);
        if (game.tags.includes("disabled")) {
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
        let games = await loadGamesFromJson();
        if (!games) {
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

        updateGameDisplay(games, false);
        updateHotSlideshow(games, false);
        updateEventSlideshow(games, false);

        let userLoaded = false;
        let perunPremium = false;
        if (typeof loadUserData === 'function') {
            userLoaded = await loadUserData();
            if (!userLoaded) {
                console.warn('Nie udało się załadować danych użytkownika, używanie domyślnych wartości');
            } else if (typeof getSheetData === 'function') {
                perunPremium = await getSheetData('isPremium') ?? false;
                updateGameDisplay(games, perunPremium);
                updateHotSlideshow(games, perunPremium);
                updateEventSlideshow(games, perunPremium);
            }
        } else {
            console.warn('Funkcja loadUserData nie jest zdefiniowana, używanie domyślnych wartości');
        }

        if (typeof insertData === 'function' && typeof updatePlayerBadges === 'function') {
            const elements = document.querySelectorAll('[data-app-id][data-key]');
            elements.forEach(element => {
                const appId = element.getAttribute('data-app-id');
                const key = element.getAttribute('data-key');
                insertData(element, appId, key);
            });
        } else {
            console.warn('Funkcje insertData lub updatePlayerBadges nie są zdefiniowane');
            const elements = document.querySelectorAll('[data-app-id][data-key]');
            elements.forEach(element => {
                element.innerHTML = '???';
            });
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