"use strict";

const CONFIG = {
  baseUrl: "https://suspicioyt.github.io/perunverse/gameverse/",
  gamesData: "data/games.json"
};

let games = [];

function loadPerunPremium() {
  try {
    const storedValue = sessionStorage.getItem("perunPremium");
    return storedValue === "true";
  } catch (e) {
    return false;
  }
}

function isLoggedIn() {
  return !!localStorage.getItem("authToken");
}

function computeClassesFromTags(tags = []) {
  const classes = [];
  if (tags.includes("nowosc")) classes.push("nowosc");
  if (tags.includes("premium")) classes.push("premium");
  if (tags.includes("ukonczona")) classes.push("ukonczona");
  if (tags.includes("internet")) classes.push("internet");
  if (tags.includes("login")) classes.push("login");
  return classes;
}

function copyToClipboard(text) {
  try {
    navigator.clipboard.writeText(text);
  } catch (e) {}
}

function createGameBox(game, lastPlayedGameId) {
  const gameBox = document.createElement("div");
  gameBox.classList.add("game-box");
  gameBox.dataset.gameId = game.id;

  const tagClasses = computeClassesFromTags(game.tags);
  tagClasses.forEach(cls => gameBox.classList.add(cls));

  if (tagClasses.includes("premium")) {
    const status = document.createElement("span");
    status.innerHTML = '<i class="fas fa-crown"></i>';
    status.classList.add("premium-label");
    status.setAttribute("aria-label", "Premium game");
    gameBox.appendChild(status);
  }
  if (tagClasses.includes("ukonczona")) {
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

  if (tagClasses.includes("internet") && game.internet) {
    const icon = document.createElement("span");
    icon.innerHTML = '<i class="fas fa-globe-americas"></i>';
    icon.classList.add("game-status-internet");
    icon.setAttribute("aria-label", "Copy game URL");
    icon.addEventListener("click", (e) => {
      e.stopPropagation();
      copyToClipboard(game.internet);
    });
    iconContainer.appendChild(icon);
  }
  gameBox.appendChild(iconContainer);

  const title = document.createElement("h2");
  title.textContent = game.name;
  gameBox.appendChild(title);

  const link = document.createElement("a");
  link.classList.add("game-link");

  const requiresLogin = tagClasses.includes("login");
  const loggedIn = isLoggedIn();

  if (requiresLogin && !loggedIn) {
    link.innerHTML = '<i class="fas fa-lock"></i>';
    link.classList.add("locked");
    link.title = "Zaloguj się, aby zagrać";
    link.style.pointerEvents = "none";
    link.style.opacity = "0.6";
    link.style.cursor = "not-allowed";
  } else {
    link.innerHTML = '<i class="fas fa-play"></i>';
    link.addEventListener("click", (e) => {
      e.preventDefault();
      if (game.id !== "999") {
        localStorage.setItem("lastPlayedGame", game.id);
      }
      window.open(CONFIG.baseUrl + game.link, "_blank");
    });
  }

  gameBox.appendChild(link);

  return gameBox;
}

function loadGames(gamesList = games) {
  const containers = document.querySelectorAll(".game-container");
  const lastPlayedGameId = localStorage.getItem("lastPlayedGame");
  const perunPremium = loadPerunPremium();

  let filteredGames = gamesList.filter(game => {
    const tagClasses = computeClassesFromTags(game.tags);
    if (tagClasses.includes("premium") && !perunPremium) return false;
    return true;
  });

  filteredGames.sort((a, b) => {
    if (a.id === lastPlayedGameId) return -1;
    if (b.id === lastPlayedGameId) return 1;
    return 0;
  });

  if (filteredGames.length === 0) {
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

  containers.forEach(container => {
    const fragment = document.createDocumentFragment();
    const maxGames = parseInt(container.getAttribute("max"), 10) || filteredGames.length;

    for (let i = 0; i < maxGames && gameIndex < filteredGames.length; i++) {
      const game = filteredGames[gameIndex++];
      if (!game.id || !game.name || !game.link) continue;
      const gameBox = createGameBox(game, lastPlayedGameId);
      fragment.appendChild(gameBox);
    }

    container.innerHTML = "";
    container.appendChild(fragment);
  });
}

async function initialize() {
  try {
    const response = await fetch(`${CONFIG.baseUrl}${CONFIG.gamesData}`);
    if (!response.ok) throw new Error(`HTTP error ${response.status}`);
    const data = await response.json();
    games = data.games.map(game => ({
      ...game,
      classes: computeClassesFromTags(game.tags)
    }));

    const validGamesCount = games.filter(game => game.id !== "999").length;
    localStorage.setItem("gamesNumber", validGamesCount);

    loadGames();
  } catch (e) {
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Nie udało się załadować gier. Spróbuj ponownie później.";
    errorMessage.setAttribute("aria-live", "assertive");
    document.body.prepend(errorMessage);
    console.error(e);
  }
}

document.getElementById('searchInput')?.addEventListener('keyup', () => {
  const filter = document.getElementById('searchInput').value.trim().toUpperCase();

  let filteredGames = games;

  if (filter) {
    filteredGames = filteredGames.filter(game => 
      game.name.toUpperCase().includes(filter)
    );
  }

  const isPremium = loadPerunPremium();
  if (!isPremium) {
    filteredGames = filteredGames.filter(game => 
      !computeClassesFromTags(game.tags).includes("premium")
    );
  }

  loadGames(filteredGames);
});

window.onload = initialize;