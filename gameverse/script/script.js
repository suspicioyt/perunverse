const STORAGE_KEYS = {
  USERNAME: 'perunUsername',
  ISFIRSTVISIT: 'isFirstVisit',
  UUID: 'perunUUID',
  POINTS: 'perunPoints',
  RANK: 'perunRank',
  PLN: 'perunPLN',
  THEME: 'theme',
  DEV_SETTINGS: 'DEVsettings',
  LAST_PLAYED_GAME: 'lastPlayedGame',
  SETTING_SWITCHES: 'settingSwitches',
  COMPLETED_ACHIEVEMENTS: 'completedAchievementsIds',
  LAST_CHANGE_TIME: 'lastChangeTime',
  HAS_LOADED: 'hasLoaded',
  OPEN_MODALS: 'openModals',
  PAGE_BUILDER_PAGES: 'pageBuilder_pages',
  VOTING_HISTORY: 'votingHistory'
};

const UPDATE_DATE = 'Sep 14, 2025 20:00:00';

const API_FIELD_MAP = {
  [STORAGE_KEYS.USERNAME]: 'username',
  [STORAGE_KEYS.UUID]: 'uuid',
  [STORAGE_KEYS.POINTS]: 'points',
  [STORAGE_KEYS.RANK]: 'rank',
  [STORAGE_KEYS.PLN]: 'pln',
  [STORAGE_KEYS.COMPLETED_ACHIEVEMENTS]: 'doneAchievements'
};

window.API_URL = 'https://script.google.com/macros/s/AKfycbzLuqmfiDBw9QVDFuPuWmef1n0_mb6JDF8hy0PwAA8cshdgYeFLqL_n_LzuAVwrcXVpGQ/exec';

window.settingSwitches = [
  { switchId: '01', value: false }, // tryb dev
  { switchId: '02', value: false }, // zapis modali
  { switchId: '03', value: true },  // obrazy na chacie
  { switchId: '04', value: true },  // zbanowane słowa
  { switchId: '05', value: false }, // ???
  { switchId: '06', value: true },  // ostatnio grana gra
  { switchId: '07', value: true },  // powiadomienia
  { switchId: '08', value: true },  // grane gry
  { switchId: '09', value: false }, // tryb kompaktowy
  { switchId: '10', value: false }
];

const heartLikeInner1 = '<label for="heart';
const heartLikeInner2 = '"><i class="fas fa-heart"></i></label><input type="checkbox" id="heart';
const heartLikeInner3 = '" />';

const API = {
  async post(url, data) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        mode: 'no-cors'
      });
      console.log('API POST response:', response);
      return response;
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  },
  async get(url) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (!response.ok) throw new Error(`GET failed: ${response.status}`);
      const data = await response.json();
      console.log('API GET response:', data);
      return data;
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  }
};

const Modal = {
  open(id) {
    const modal = document.getElementById(id);
    if (!modal) {
      console.error(`Modal with id '${id}' not found`);
      return;
    }
    if (!modal.classList.contains('show')) {
      modal.classList.add('show');
      saveModalState();
    }
  },
  close(id) {
    const modal = document.getElementById(id);
    if (modal && modal.classList.contains('show')) {
      modal.classList.remove('show');
      saveModalState();
    }
  },
  toggle(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.toggle('show');
      saveModalState();
    }
  }
};

async function saveModalState() {
  let switches;
  try {
    const storedSwitches = localStorage.getItem(STORAGE_KEYS.SETTING_SWITCHES);
    switches = storedSwitches ? JSON.parse(storedSwitches) : window.settingSwitches || [];
    if (!Array.isArray(switches)) {
      switches = window.settingSwitches || [];
      localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
    }
  } catch (error) {
    console.error('Error parsing settingSwitches:', error);
    switches = window.settingSwitches || [];
    localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
  }

  const autoOpenSwitch = switches.find(s => s.switchId === '02');
  if (autoOpenSwitch && autoOpenSwitch.value) {
    const openModals = Array.from(document.querySelectorAll('.modal.show'))
      .map(modal => modal.id)
      .filter(id => id);
    sessionStorage.setItem(STORAGE_KEYS.OPEN_MODALS, JSON.stringify(openModals));
  } else {
    sessionStorage.setItem(STORAGE_KEYS.OPEN_MODALS, null);
  }
}

async function updateGameContainers(filteredGames) {
  const containers = document.querySelectorAll('.game-container');
  const lastPlayedGameId = localStorage.getItem(STORAGE_KEYS.LAST_PLAYED_GAME);
  let switches;
  try {
    const storedSwitches = localStorage.getItem(STORAGE_KEYS.SETTING_SWITCHES);
    switches = storedSwitches ? JSON.parse(storedSwitches) : window.settingSwitches || [];
    if (!Array.isArray(switches)) {
      switches = window.settingSwitches || [];
      localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
    }
  } catch (error) {
    console.error('Error parsing settingSwitches:', error);
    switches = window.settingSwitches || [];
    localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
  }
  const lastPlayedSwitch = switches.find(s => s.switchId === '06');

  const sortedGames = filteredGames.sort((a, b) => {
    if (a.id === lastPlayedGameId) return -1;
    if (a.ulubione && !b.ulubione) return -1;
    if (!a.ulubione && b.ulubione) return 1;
    return 0;
  });

  let gameIndex = 0;
  containers.forEach(container => {
    const maxGames = parseInt(container.getAttribute('max'), 10) || sortedGames.length;
    const refreshButton = container.querySelector('.refreshButton');
    container.innerHTML = '';
    if (refreshButton) container.appendChild(refreshButton);

    for (let i = 0; i < maxGames && gameIndex < sortedGames.length; i++) {
      const game = sortedGames[gameIndex++];
      const gameBox = document.createElement('div');
      gameBox.classList.add('game-box');
      gameBox.setAttribute('gameId', game.id);

      if (game.id === lastPlayedGameId && lastPlayedSwitch && lastPlayedSwitch.value) {
        gameBox.classList.add('lastPlayed');
        const status = document.createElement('span');
        status.textContent = 'Ostatnio grane';
        status.classList.add('lastPlayedLabel');
        gameBox.appendChild(status);
      }

      game.classes.forEach(className => gameBox.classList.add(className));
      if (game.ulubione) gameBox.style.backgroundColor = '#FF4C4C';

      if (game.status) {
        const status = document.createElement('span');
        status.textContent = game.status;
        status.classList.add('game-label');
        gameBox.appendChild(status);
      }
      if (game.classes.includes('ukonczona')) {
        const statusEnd = document.createElement('span');
        statusEnd.textContent = 'Ukończona';
        statusEnd.classList.add('game-status');
        gameBox.appendChild(statusEnd);
      }
      if (game.classes.includes('money')) {
        const statusEnd = document.createElement('span');
        statusEnd.innerHTML = '<i class="fas fa-dollar-sign"></i>';
        statusEnd.classList.add('game-status-money');
        gameBox.appendChild(statusEnd);
      }
      if (game.classes.includes('internet')) {
        const statusEnd = document.createElement('span');
        statusEnd.innerHTML = '<i class="fas fa-globe"></i>';
        statusEnd.classList.add('game-status-internet');
        gameBox.appendChild(statusEnd);
      }

      const devSettings = 'true'; // To powinno być dynamiczne, np. z localStorage
      if (devSettings === 'true') {
        const devContent = document.createElement('div');
        devContent.classList.add('DEVgame-content');
        devContent.textContent = `#${game.id || '[Brak ID]'}`;
        gameBox.appendChild(devContent);
      }

      const title = document.createElement('h2');
      title.textContent = game.name;
      gameBox.appendChild(title);

      const link = document.createElement('a');
      link.href = game.link;
      link.textContent = 'Zagraj';
      link.classList.add('game-link');
      link.addEventListener('click', async () => {
        addPlayedGamesToStorage(game.id);
        await window.userData.setData('gameverse', STORAGE_KEYS.LAST_PLAYED_GAME, game.id);
      });
      link.target = '_blank';

      if (game.tooltip) {
        const tooltip = document.createElement('span');
        tooltip.innerHTML = game.tooltip;
        tooltip.classList.add('tooltiptext');
        link.appendChild(tooltip);
      }
      gameBox.appendChild(link);

      const favoriteButton = document.createElement('div');
      favoriteButton.classList.add('favorite-button');
      favoriteButton.innerHTML = `${heartLikeInner1}${game.id}${heartLikeInner2}${game.id}${heartLikeInner3}`;

      const favoriteCheckbox = favoriteButton.querySelector('input');
      favoriteCheckbox.checked = game.ulubione;
      favoriteCheckbox.addEventListener('change', () => {
        game.ulubione = favoriteCheckbox.checked;
        saveFavorites();
      });

      gameBox.appendChild(favoriteButton);
      container.appendChild(gameBox);
    }
  });

  attachFavoriteEvents();
}

// Placeholder Functions
function addPlayedGamesToStorage(gameId) {
  console.log(`Game ${gameId} played`);
}

function saveFavorites() {
  console.log('Favorites saved');
}

function attachFavoriteEvents() {
  console.log('Favorite events attached');
}

document.getElementById('searchInput')?.addEventListener('keyup', async () => {
  const filter = document.getElementById('searchInput').value.toUpperCase();
  let filteredGames = games.filter(game => game.name.toUpperCase().includes(filter));
  
  // Filter out premium games for non-premium users
  const perunPremium = await window.userData.getData('gameverse', 'premium');
  if (!perunPremium) {
    filteredGames = filteredGames.filter(game => !game.premium);
  }
  
  await updateGameContainers(filteredGames);
});

window.addEventListener('click', event => {
  const dropdown = document.getElementById('dropdownFiltres');
  if (
    !event.target.matches('.filterdropbtn') &&
    !event.target.matches('.dropdownFiltres-content') &&
    !event.target.closest('.dropdownFiltres-content')
  ) {
    if (dropdown?.classList.contains('show')) {
      dropdown.classList.remove('show');
    }
  }
});

async function filterSelection(category) {
  const filteredGames = category === 'all' ? games : games.filter(game => game.classes.includes(category));
  await updateGameContainers(filteredGames);
}

function changeClass(element) {
  document.querySelectorAll('button').forEach(button => button.classList.remove('active'));
  if (!element.classList.contains('active')) element.classList.add('active');
}

// Progress Bar
function progressBar() {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.getElementById('myBar').style.width = `${scrolled}%`;
}

window.addEventListener('scroll', progressBar);

// Restore Modal State
async function restoreModalState() {
  let switches = localStorage.getItem(STORAGE_KEYS.SETTING_SWITCHES);
  if (!Array.isArray(switches)) {
    switches = window.settingSwitches;
    localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
  }
  const autoOpenSwitch = switches.find(s => s.switchId === '02');

  if (autoOpenSwitch && autoOpenSwitch.value) {
    const openModals = sessionStorage.getItem(STORAGE_KEYS.OPEN_MODALS) || [];
    openModals.forEach(modalId => {
      const modalElement = document.getElementById(modalId);
      if (modalElement && !modalElement.classList.contains('show')) {
        Modal.open(modalId);
      }
    });
  }
}

// Modal Event Listeners
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    const modal = document.querySelector('.modal.show');
    if (modal) {
      Modal.close(modal.id);
    }
  }
});

document.addEventListener('click', event => {
  const modal = document.querySelector('.modal.show');
  if (modal && event.target === modal) {
    Modal.close(modal.id);
  }
});

// User Initialization
async function initializeUser() {
  const opened = await window.userData.getData('gameverse', 'opened');
  if ((!opened || opened === false) && sessionStorage.getItem("authToken") != "test") {
    document.getElementById('welcomeModal').style.display = 'block';
    loadFireworksStyles();
  } else {
    document.getElementById('welcomeModal').style.display = 'none';
  }
  document.getElementById('saveUsernameBtn')?.addEventListener('click', async () => {
    document.getElementById('fireworksStyles')?.remove();
    document.getElementById('welcomeModal').style.display = 'none';
    await window.userData.setData('gameverse', 'opened', true);
  });
}

function loadFireworksStyles() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'effects/fireworks.css';
  link.id = 'fireworksStyles';
  document.head.appendChild(link);
}

// Countdown Timer
const countDownDate = new Date(UPDATE_DATE).getTime();
const timer = setInterval(() => {
  const now = new Date().getTime();
  const distance = countDownDate - now;

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById('demo').textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  if (distance < 0) {
    clearInterval(timer);
    document.getElementById('demo').textContent = 'Kliknij CTRL i przycisk odświeżenia strony, aby wymusić odświeżenie';
  }
}, 1000);

// Slideshow
let slideIndex = 0;
function showSlides(n) {
  const slides = document.querySelectorAll('.slides');
  const dots = document.querySelectorAll('.dot');

  if (n >= slides.length) slideIndex = 0;
  if (n < 0) slideIndex = slides.length - 1;

  slides.forEach(slide => (slide.style.display = 'none'));
  dots.forEach(dot => dot.classList.remove('active'));

  slides[slideIndex].style.display = 'block';
  dots[slideIndex].classList.add('active');
}

function changeSlide(n) {
  showSlides((slideIndex += n));
}

function currentSlide(n) {
  showSlides((slideIndex = n - 1));
}

let autoSlide = setInterval(() => changeSlide(1), 3000);

function resetAutoSlide() {
  clearInterval(autoSlide);
  autoSlide = setInterval(() => changeSlide(1), 3000);
}

document.querySelector('.prev')?.addEventListener('click', () => {
  changeSlide(-1);
  resetAutoSlide();
});

document.querySelector('.next')?.addEventListener('click', () => {
  changeSlide(1);
  resetAutoSlide();
});

document.querySelectorAll('.dot').forEach((dot, index) => {
  dot.addEventListener('click', () => {
    currentSlide(index + 1);
    resetAutoSlide();
  });
});

document.querySelectorAll('.slides').forEach(slide => {
  slide.addEventListener('mouseover', () => clearInterval(autoSlide));
  slide.addEventListener('mouseleave', () => {
    autoSlide = setInterval(() => changeSlide(1), 2000);
  });
});

// Loader
async function initializeLoader() {
  const loader = document.getElementById('loader');
  const tipElement = document.getElementById('loading-tip');
  async function fetchTips() {
    try {
      const response = await fetch('https://suspicioyt.github.io/perunverse/gameverse/data/tips.json');
      const data = await response.json();
      return data.tips || [];
    } catch (error) {
      console.error('Error fetching tips:', error);
      return ['Loading...'];
    }
  }
  function getRandomTip(tips) {
    if (!tips.length) return 'Loading...';
    const randomIndex = Math.floor(Math.random() * tips.length);
    return tips[randomIndex];
  }
  const hasLoaded = await window.userData.getData('gameverse', STORAGE_KEYS.HAS_LOADED);
  if (hasLoaded) {
    loader.classList.add('hidden');
  } else {
    const tips = await fetchTips();
    const randomTip = getRandomTip(tips);
    tipElement.textContent = randomTip;
    setTimeout(async () => {
      loader.classList.add('hidden');
      await window.userData.setData('gameverse', STORAGE_KEYS.HAS_LOADED, 'true');
    }, 7000);
  }
}

// Player Data Updates
async function updatePlayerBadges() {
  try {
    const isVerified = await window.userData.getData('gameverse', 'isVerified');
    const isPremium = await window.userData.getData('gameverse', 'isPremium');

    const verified = isVerified === true || isVerified === 'true';
    const premium = isPremium === true || isPremium === 'true';

    let badges = '';
    if (verified) {
      badges += '<i class="fas fa-check-circle verified-icon" title="Verified User"></i>';
    }
    if (premium) {
      badges += '<i class="fas fa-crown premium-icon" title="Premium User"></i>';
    }

    const badgesElement = document.getElementById('playerBadges');
    if (badgesElement) {
      badgesElement.innerHTML = badges || '???';
    } else {
      console.warn('Element #playerBadges not found');
    }
  } catch (error) {
    console.error('Error updating badges:', error);
    const badgesElement = document.getElementById('playerBadges');
    if (badgesElement) {
      badgesElement.innerHTML = '???';
    }
  }
}

async function updatePlayerPLN() {
  const pln = await window.userData.getData('gameverse', STORAGE_KEYS.PLN);
  const dynamicTextElement = document.getElementById('playerPLN');
  if (dynamicTextElement) {
    dynamicTextElement.textContent = pln && !isNaN(pln) ? `${parseFloat(pln).toFixed(2)} zł` : '0.00 zł';
  }
}

async function updatePlayerRank() {
  const rank = await window.userData.getData('gameverse', STORAGE_KEYS.RANK);
  const dynamicTextElement = document.getElementById('playerRank');
  if (dynamicTextElement) {
    dynamicTextElement.innerHTML = rank && !isNaN(rank) ? `${parseInt(rank)} <i class="fas fa-star"></i>` : '0 <i class="fas fa-star"></i>';
  }
}

window.addEventListener('storage', async event => {
  if (event.key === STORAGE_KEYS.USERNAME) await updatePlayerName();
  if (event.key === STORAGE_KEYS.RANK) await updatePlayerRank();
  if (event.key === STORAGE_KEYS.PLN) await updatePlayerPLN();
});

// Theme Management
async function changeTheme(theme) {
  await window.userData.setData('gameverse', STORAGE_KEYS.THEME, theme);
  document.body.setAttribute('data-theme', theme);
  document.getElementById('themeSelect').value = theme;
}

// Sidenav Toggle
document.getElementById('sidenavOpenButton')?.addEventListener('click', () => {
  document.getElementById('sidenav').classList.toggle('show');
});

function startCountdown(remainingTime) {
  const countdownDisplay = document.getElementById('usernameDemoContainer');
  countdownDisplay.style.display = 'block';

  function updateCountdown() {
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    countdownDisplay.textContent = `Czas do odblokowania: ${hours}h ${minutes}m ${seconds}s`;

    if (remainingTime <= 0) {
      clearInterval(countdownInterval);
      document.getElementById('usernameChangeButton').disabled = false;
      document.getElementById('usernameChangeButton').textContent = 'Zmień nazwę';
      countdownDisplay.textContent = '';
      countdownDisplay.style.display = 'none';
    }
    remainingTime -= 1000;
  }

  updateCountdown();
  const countdownInterval = setInterval(updateCountdown, 1000);
}

async function initializeSwitches() {
  let switches;
  try {
    const storedSwitches = localStorage.getItem(STORAGE_KEYS.SETTING_SWITCHES);
    switches = storedSwitches ? JSON.parse(storedSwitches) : window.settingSwitches || [];
    if (!Array.isArray(switches)) {
      switches = window.settingSwitches || [];
      localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
    }
  } catch (error) {
    console.error('Error parsing settingSwitches from localStorage:', error);
    switches = window.settingSwitches || [];
    localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
  }

  document.querySelectorAll('input[type="checkbox"][switchId]').forEach(checkbox => {
    const switchId = checkbox.getAttribute('switchId');
    const switchData = switches.find(s => s.switchId === switchId);
    if (switchData) {
      checkbox.checked = switchData.value;
      checkbox.addEventListener('change', () => toggleSwitch(switchId));
    }
  });
}

async function toggleSwitch(switchId) {
  let switches;
  try {
    const storedSwitches = localStorage.getItem(STORAGE_KEYS.SETTING_SWITCHES);
    switches = storedSwitches ? JSON.parse(storedSwitches) : window.settingSwitches || [];
    if (!Array.isArray(switches)) {
      switches = window.settingSwitches || [];
      localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
    }
  } catch (error) {
    console.error('Error parsing settingSwitches:', error);
    switches = window.settingSwitches || [];
    localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
  }

  const switchIndex = switches.findIndex(s => s.switchId === switchId);

  notification('Zmiana ustawień wymaga odświeżenia strony', 'reload', {
    actions: [{ label: 'Odśwież stronę', callback: () => location.reload() }]
  });

  if (switchIndex !== -1) {
    switches[switchIndex].value = !switches[switchIndex].value;
    localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));

    if (switchId === '01') {
      localStorage.setItem(STORAGE_KEYS.DEV_SETTINGS, switches[switchIndex].value.toString());
    }
    if (switchId === '02' && !switches[switchIndex].value) {
      localStorage.setItem(STORAGE_KEYS.OPEN_MODALS, null);
    }
  }
}

async function resetSwitches() {
  localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(window.settingSwitches));
  localStorage.setItem(STORAGE_KEYS.DEV_SETTINGS, 'false');
}


// Rating Form
document.getElementById('ratingForm')?.addEventListener('submit', async e => {
  e.preventDefault();
  const submitButton = document.getElementById('opinionSubmit');
  submitButton.disabled = true;

  const rating = document.querySelector('input[name="rating"]:checked');
  const whattodo = document.getElementById('whattodoratingform').value;
  const username = await window.userData.getData('gameverse', STORAGE_KEYS.USERNAME);

  if (!username || !rating) {
    document.getElementById('ratingFormErrorMessage').style.display = 'block';
    submitButton.disabled = false;
    return;
  }

  const formData = {
    action: 'addRating',
    sessionId: (await window.userData.getData('gameverse', STORAGE_KEYS.UUID)) || '',
    username,
    rating: rating.value,
    whattodo,
    timestamp: new Date().toISOString()
  };

  try {
    submitButton.textContent = 'Wysyłanie...';
    await API.post(window.API_URL, formData);
    document.getElementById('ratingForm').reset();
    document.getElementById('ratingFormErrorMessage').style.display = 'none';
    submitButton.textContent = 'Wyślij';
  } catch (error) {
    submitButton.textContent = 'Wyślij';
    console.error('Błąd wysyłania:', error);
    alert('Wystąpił błąd podczas wysyłania oceny.');
  } finally {
    submitButton.disabled = false;
  }
});

document.querySelectorAll('.rating label').forEach(label => {
  label.addEventListener('mouseover', function () {
    const value = this.getAttribute('for').replace('star', '');
    for (let i = 1; i <= 10; i++) {
      const currentLabel = document.querySelector(`label[for="star${i}"]`);
      currentLabel.style.color = i <= value ? '#ffca08' : '#ddd';
    }
  });

  label.addEventListener('mouseout', () => {
    const checked = document.querySelector('input[name="rating"]:checked');
    const checkedValue = checked ? checked.value : 0;
    for (let i = 1; i <= 10; i++) {
      const currentLabel = document.querySelector(`label[for="star${i}"]`);
      currentLabel.style.color = i <= checkedValue ? '#ffca08' : '#ddd';
    }
  });
});

// Dropdown Toggle
function toggleDropdown(dropdownId) {
  document.getElementById(dropdownId).classList.toggle('show');
}

window.addEventListener('click', event => {
  if (!event.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-content').forEach(menu => menu.classList.remove('show'));
  }
});

// Scroll to Section
function scrollToSection(sectionId, gameContainerId) {
  if (sectionId === 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    Modal.close('navigationModal');
    return;
  }

  if (sectionId === 1) {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    Modal.close('navigationModal');
    return;
  }

  let targetElement;
  if (sectionId === 'game-container' && gameContainerId) {
    targetElement = document.getElementById(`game-container-${gameContainerId}`);
  } else {
    targetElement = document.getElementById(sectionId);
  }

  if (targetElement) {
    const elementPosition = targetElement.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: elementPosition - 125, behavior: 'smooth' });
    Modal.close('navigationModal');
  }
}

document.querySelectorAll('.game-container').forEach((container, index) => {
  container.id = `game-container-${index}`;
});

// Ranking
async function updateRanking() {
  try {
    const ranking = await API.get(`${window.API_URL}?action=getRankingData`);
    ranking.sort((a, b) => {
      const rankDiff = parseInt(b.rank) - parseInt(a.rank);
      if (rankDiff !== 0) return rankDiff;
      const pointsDiff = parseInt(b.points) - parseInt(a.points);
      if (pointsDiff !== 0) return pointsDiff;
      return parseFloat(b.pln) - parseFloat(a.pln);
    });

    const tbody = document.getElementById('rankingBody');
    tbody.innerHTML = '';
    ranking.forEach(async (user, index) => {
      if (user.rank != 0 || user.points != 0 || user.pln != 0 || user.achievements != 0) {
        if (user.uuid === (await window.userData.getData('gameverse', STORAGE_KEYS.UUID))) {
          await window.userData.setData('gameverse', 'perunPremium', user.premium);
          await window.userData.setData('gameverse', 'perunVerified', user.verified);
        }

        let badges = '';
        if (user.verified) {
          badges += '<i class="fas fa-check-circle verified-icon" title="Verified User"></i>';
        }
        if (user.premium) {
          badges += '<i class="fas fa-crown premium-icon" title="Premium User"></i>';
        }

        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${badges} ${user.username}</td>
          <td>${user.rank}</td>
          <td>${user.points}</td>
          <td>${parseFloat(user.pln).toFixed(2)}</td>
          <td>${user.achievements || '0'}/${achievementsData.length}</td>
        `;
        tbody.appendChild(row);
      }
    });
    document.getElementById('rankingMessage').textContent = `Ranking zaktualizowany: ${new Date().toLocaleString()}`;
  } catch (error) {
    console.error('Błąd podczas aktualizacji rankingu:', error);
  }
}

async function sendLocalData() {
  const payload = {
    action: 'updateRankingFromLocal',
    perunUUID: (await window.userData.getData('gameverse', STORAGE_KEYS.UUID)) || '',
    perunUsername: (await window.userData.getData('gameverse', STORAGE_KEYS.USERNAME)) || 'Anonim',
    perunPoints: (await window.userData.getData('gameverse', STORAGE_KEYS.POINTS)) || '0',
    perunRank: (await window.userData.getData('gameverse', STORAGE_KEYS.RANK)) || '0',
    perunPLN: (await window.userData.getData('gameverse', STORAGE_KEYS.PLN)) || '0',
    doneAchievements: ((await window.userData.getData('gameverse', STORAGE_KEYS.COMPLETED_ACHIEVEMENTS)) || []).length,
    timestamp: new Date().toISOString()
  };

  await API.post(window.API_URL, payload);
}

const pageBuilder = {
  currentSlide: 1,
  totalSlides: 5,
  storageKey: STORAGE_KEYS.PAGE_BUILDER_PAGES,
  pages: [],
  lastSaveTime: null,
  previewWindow: null,

  async init() {
    try {
      await this.loadPage();
      this.addInputListeners();
      this.updateNavigation();
      this.updateStatus();
    } catch (error) {
      console.error('Error initializing Page Builder:', error);
      this.pages = [this.createEmptyPage()];
      this.loadCurrentData();
      this.updateStatus();
      notification('Błąd podczas ładowania danych gry. Utworzono nową pustą stronę.', 'error');
    }
  },

  async loadPage() {
    const savedPages = await window.userData.getData('gameverse', this.storageKey);
    this.pages = Array.isArray(savedPages) && savedPages.length > 0 ? savedPages : [this.createEmptyPage()];
    this.loadCurrentData();
  },

  createEmptyPage() {
    return { title: '', body: '', style: '', script: '' };
  },

  loadCurrentData() {
    const page = this.pages[0] || this.createEmptyPage();
    const titleField = document.getElementById('pageBuilderTitle');
    const bodyField = document.getElementById('pageBuilderBody');
    const styleField = document.getElementById('pageBuilderStyle');
    const scriptField = document.getElementById('pageBuilderScript');
    const fullCodeField = document.getElementById('pageBuilderFullCode');

    if (titleField) titleField.value = page.title || '';
    if (bodyField) bodyField.value = page.body || '';
    if (styleField) styleField.value = page.style || '';
    if (scriptField) scriptField.value = page.script || '';
    if (fullCodeField) fullCodeField.value = this.generateFullCode(page) || '';
  },

  generateFullCode(page) {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>${page.title || 'Własna Gra'}</title>
  <style>${page.style || ''}</style>
</head>
<body>
  ${page.body || ''}
  <script>${page.script || ''}</script>
</body>
</html>
    `.trim();
  },

  parseFullCode(fullCode) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(fullCode, 'text/html');
      if (!doc || !doc.documentElement) throw new Error('Invalid HTML structure');

      const title = doc.querySelector('title')?.textContent || '';
      const style = doc.querySelector('style')?.textContent || '';
      const script = doc.querySelector('script')?.textContent || '';
      const bodyContent = doc.body.innerHTML
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .trim();

      return { title, body: bodyContent, style, script };
    } catch (error) {
      console.error('Error parsing full code:', error);
      notification('Nieprawidłowy kod HTML. Sprawdź składnię i spróbuj ponownie.', 'error');
      return null;
    }
  },

  async savePage() {
    let page;
    if (this.currentSlide === 5) {
      const fullCode = document.getElementById('pageBuilderFullCode')?.value || '';
      const parsed = this.parseFullCode(fullCode);
      if (!parsed) return;
      page = parsed;
    } else {
      page = {
        title: document.getElementById('pageBuilderTitle')?.value || '',
        body: document.getElementById('pageBuilderBody')?.value || '',
        style: document.getElementById('pageBuilderStyle')?.value || '',
        script: document.getElementById('pageBuilderScript')?.value || ''
      };
    }

    this.pages[0] = page;
    await window.userData.setData('gameverse', this.storageKey, JSON.stringify(this.pages));
    this.lastSaveTime = new Date();
    this.updateStatus();
    this.loadCurrentData();
  },

  addInputListeners() {
    ['Title', 'Body', 'Style', 'Script', 'FullCode'].forEach(field => {
      const element = document.getElementById(`pageBuilder${field}`);
      if (element) {
        element.addEventListener('input', () => this.savePage());
      }
    });
  },

  updateNavigation() {
    const prevBtn = document.getElementById('pageBuilderPrevBtn');
    const nextBtn = document.getElementById('pageBuilderNextBtn');
    if (prevBtn) prevBtn.disabled = this.currentSlide === 1;
    if (nextBtn) nextBtn.disabled = this.currentSlide === this.totalSlides;
  },

  updateStatus() {
    const status = document.getElementById('pageBuilderStatus');
    if (status) {
      status.textContent = this.lastSaveTime ? `Zapisano: ${this.lastSaveTime.toLocaleTimeString()}` : 'Zapisano: Nigdy';
    }
  }
};

function pageBuilderShowSlide(slideNum) {
  for (let i = 1; i <= pageBuilder.totalSlides; i++) {
    const slide = document.getElementById(`pageBuilderSlide${i}`);
    if (slide) slide.classList.remove('active');
  }
  const activeSlide = document.getElementById(`pageBuilderSlide${slideNum}`);
  if (activeSlide) activeSlide.classList.add('active');
  pageBuilder.currentSlide = slideNum;
  pageBuilder.updateNavigation();
}

function pageBuilderNextSlide() {
  if (pageBuilder.currentSlide < pageBuilder.totalSlides) {
    pageBuilder.savePage();
    pageBuilderShowSlide(pageBuilder.currentSlide + 1);
  }
}

function pageBuilderPrevSlide() {
  if (pageBuilder.currentSlide > 1) {
    pageBuilder.savePage();
    pageBuilderShowSlide(pageBuilder.currentSlide - 1);
  }
}

function pageBuilderSaveAndPreview() {
  pageBuilder.savePage();
  const page = pageBuilder.pages[0];
  const htmlContent = pageBuilder.generateFullCode(page);

  if (pageBuilder.previewWindow && !pageBuilder.previewWindow.closed) {
    pageBuilder.previewWindow.close();
  }

  pageBuilder.previewWindow = window.open('', '_blank');
  if (pageBuilder.previewWindow) {
    pageBuilder.previewWindow.document.open();
    pageBuilder.previewWindow.document.write(htmlContent);
    pageBuilder.previewWindow.document.close();
  } else {
    notification('Nie udało się otworzyć podglądu. Sprawdź, czy przeglądarka nie blokuje wyskakujących okien.', 'error');
  }
}

function pageBuilderExport() {
  pageBuilder.savePage();
  const page = pageBuilder.pages[0];
  const htmlContent = pageBuilder.generateFullCode(page);
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${page.title || 'strona'}.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function pageBuilderClear() {
  if (confirm('Czy na pewno chcesz wyczyścić wszystkie dane?')) {
    pageBuilder.pages[0] = pageBuilder.createEmptyPage();
    pageBuilder.loadCurrentData();
    pageBuilder.savePage();
    notification('Dane zostały wyczyszczone.', 'info');
  }
}

// Notifications
function notification(message, type, options = {}) {
  console.log(`Notification: ${message}, Type: ${type}`, options);
}

function quickNotification(message) {
  console.log(`Quick Notification: ${message}`);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text);
  quickNotification('Skopiowano do schowka!');
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!await window.userData.getData('gameverse', STORAGE_KEYS.THEME)) {
    await window.userData.setData('gameverse', STORAGE_KEYS.THEME, 'dark');
  }
  const savedTheme = await window.userData.getData('gameverse', STORAGE_KEYS.THEME);
  changeTheme(savedTheme);

  const parallaxElement = document.querySelector('#parallaxEnd');
  const currentScrollY = window.scrollY;
  const elementHeight = parallaxElement?.offsetHeight || 0;
  if (elementHeight <= currentScrollY) {
    document.querySelector('header').classList.add('scrolled');
    document.getElementById('sidenav').classList.add('scrolled');
  }

  await initializeUser();
  await initializeLoader();
  await initializeSwitches(); // Używa poprawionej wersji
  await restoreModalState();
  await updatePlayerPLN();
  await updatePlayerRank();
  await updateRanking();
  await sendLocalData();

  setInterval(updateRanking, 5000);
  setInterval(sendLocalData, 5000);

  let switches;
  try {
    const storedSwitches = localStorage.getItem(STORAGE_KEYS.SETTING_SWITCHES);
    switches = storedSwitches ? JSON.parse(storedSwitches) : window.settingSwitches || [];
    if (!Array.isArray(switches)) {
      switches = window.settingSwitches || [];
      localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
    }
  } catch (error) {
    console.error('Error parsing settingSwitches:', error);
    switches = window.settingSwitches || [];
    localStorage.setItem(STORAGE_KEYS.SETTING_SWITCHES, JSON.stringify(switches));
  }
  const developerSwitch = switches.find(s => s.switchId === '01');
  document.getElementById('consoleButton').style.display = developerSwitch && developerSwitch.value ? 'block' : 'none';

  await pageBuilder.init();
});

let isScrolling = false;
let lastScrollY = 0;
const threshold = 1;
const element = document.querySelector('#parallaxEnd');

function getElementPosition() {
  const rect = element.getBoundingClientRect();
  return rect.top + window.scrollY - 150;
}

function smoothScrollTo(target) {
  isScrolling = true;
  window.scrollTo({
    top: target,
    behavior: 'smooth',
  });

  setTimeout(() => {
    isScrolling = false;
  }, 100);
}

window.addEventListener('scroll', function () {
  const currentScrollY = window.scrollY;
  const elementHeight = element.offsetHeight;

  if (currentScrollY >= 0 && currentScrollY <= (getElementPosition() + elementHeight)) {
    if (Math.abs(currentScrollY - lastScrollY) < threshold) {
      return;
    }

    if (!isScrolling && currentScrollY > lastScrollY) {
      smoothScrollTo(getElementPosition());
      var header = document.querySelector('header');
      header.classList.add('scrolled');
      document.getElementById('sidenav').classList.add('scrolled');
    }

    if (!isScrolling && currentScrollY < lastScrollY && currentScrollY > 0) {
      smoothScrollTo(0);
      var header = document.querySelector('header');
      header.classList.remove('scrolled');
      document.getElementById('sidenav').classList.remove('scrolled');
    }
    lastScrollY = currentScrollY;
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const parallax = document.getElementById('parallax');
  if (parallax) {
    parallax.style.height = `${window.innerWidth * 0.34 + 75}px`;
  }
  updatePlayerBadges();
});

document.addEventListener('DOMContentLoaded', async () => {
  // if (localStorage.getItem('gameVote1')) {
  //   document.getElementById('sendVoteButton').disabled = true;
  //   document.getElementById('sendVoteButton').setAttribute('aria-busy', 'false');
  // }
});

// async function sendGameVote() {
//   const button = document.querySelector('#sendVoteButton');
//   if (button) {
//     button.disabled = true;
//     button.setAttribute('aria-busy', 'true');
//   }

//   const votedGameId = await window.userData.getData('gameverse', 'votedGame');
//   if (!votedGameId) {
//     alert('Nie wybrano gry do głosowania.');
//     if (button) {
//       button.disabled = false;
//       button.setAttribute('aria-busy', 'false');
//     }
//     return;
//   }
//   if (await window.userData.getData('gameverse', 'gameVote1')) {
//     alert('Już zagłosowano.');
//     if (button) {
//       button.disabled = false;
//       button.setAttribute('aria-busy', 'false');
//     }
//     return;
//   }

//   let parsedGameId;
//   try {
//     parsedGameId = JSON.parse(votedGameId);
//     if (parsedGameId === '999') {
//       alert('Nie można głosować na tę grę.');
//       if (button) {
//         button.disabled = false;
//         button.setAttribute('aria-busy', 'false');
//       }
//       return;
//     }
//   } catch {
//     alert('Nieprawidłowy identyfikator gry.');
//     if (button) {
//       button.disabled = false;
//       button.setAttribute('aria-busy', 'false');
//     }
//     return;
//   }

//   const username = await window.userData.getData('gameverse', STORAGE_KEYS.USERNAME) || 'anonymous';
//   const sessionId = await window.userData.getData('gameverse', STORAGE_KEYS.UUID) || '';

//   const formData = {
//     action: 'addRating',
//     sessionId,
//     username,
//     rating: '',
//     whattodo: `vote:${parsedGameId}`,
//     timestamp: new Date().toISOString()
//   };

//   try {
//     await API.post(window.API_URL, formData);
//     await window.userData.setData('gameverse', 'gameVote1', await window.userData.getData('gameverse', 'votedGame'));
//     notification('Wysłano głos!', 'success', {
//       duration: 3000,
//       title: 'Operacja zakończona',
//       sound: false
//     });
//   } catch {
//     alert('Wystąpił błąd podczas wysyłania głosu. Spróbuj ponownie później.');
//   } finally {
//     if (button) {
//       button.disabled = true;
//       button.setAttribute('aria-busy', 'false');
//     }
//   }
// }

async function checkLoadedGameverse() {
  const opened = await window.userData.getData('gameverse', 'opened');
  if (!opened) {
    await window.userData.setData('gameverse', 'opened', new Date().toString());
  }
}
document.addEventListener('click', event => {
  const gameTooltipContainer = document.querySelector('#gameTooltipContainer');
  if (gameTooltipContainer && event.target === gameTooltipContainer && gameTooltipContainer.classList.contains("show")) {
    gameTooltipContainer.classList.remove("show");
  }
});