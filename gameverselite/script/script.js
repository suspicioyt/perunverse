"use strict";

const STORAGE_KEYS = {
  HAS_PLAYED: "hasPlayed",
  THEME: 'theme',
  HAS_LOADED: 'hasLoaded',
};

const API_FIELD_MAP = {
  [STORAGE_KEYS.USERNAME]: 'username',
  [STORAGE_KEYS.UUID]: 'uuid',
  [STORAGE_KEYS.POINTS]: 'points',
  [STORAGE_KEYS.RANK]: 'rank',
  [STORAGE_KEYS.PLN]: 'pln',
  [STORAGE_KEYS.COMPLETED_ACHIEVEMENTS]: 'doneAchievements'
};

const Modal = {
  open(id) {
    const modal = document.getElementById(id);
    if (modal && !modal.classList.contains('show')) {
      modal.classList.add('show');
    }
  },
  close(id) {
    const modal = document.getElementById(id);
    if (modal && modal.classList.contains('show')) {
      modal.classList.remove('show');
    }
  },
  toggle(id) {
    const modal = document.getElementById(id);
    if (modal) {
      modal.classList.toggle('show');
    }
  }
};

function progressBar() {
  const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
  const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (winScroll / height) * 100;
  document.getElementById('myBar').style.width = `${scrolled}%`;
}

window.addEventListener('scroll', progressBar);

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

async function initializeUser() {
  const hasPlayed = localStorage.getItem(STORAGE_KEYS.HAS_PLAYED);

  if (hasPlayed) {
    Modal.close('welcomeModal');
  } else {
    const welcomeModal = document.getElementById('welcomeModal');
    if (welcomeModal) {
      Modal.open('welcomeModal');
      loadFireworksStyles();
    }
  }

  document.getElementById('welcomeStartBtn').addEventListener('click', () => {
    localStorage.setItem(STORAGE_KEYS.HAS_PLAYED, true);
    Modal.close('welcomeModal');
    location.reload();
  });
}

function loadFireworksStyles() {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://suspicioyt.github.io/perunverse/gameverse/effects/fireworks.css';
  link.id = 'fireworksStyles';
  document.head.appendChild(link);
}

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

  const hasLoaded = sessionStorage.getItem(STORAGE_KEYS.HAS_LOADED);
  if (hasLoaded) {
    loader.classList.add('hidden');
  } else {
    const tips = await fetchTips();
    const randomTip = getRandomTip(tips);
    tipElement.textContent = randomTip;

    setTimeout(() => {
      loader.classList.add('hidden');
      sessionStorage.setItem(STORAGE_KEYS.HAS_LOADED, 'true');
    }, 5000);
  }
}

function changeTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
  document.body.setAttribute('data-theme', theme);
  document.getElementById('themeSelect').value = theme;
}

function toggleDropdown(dropdownId) {
  document.getElementById(dropdownId).classList.toggle('show');
}

window.addEventListener('click', event => {
  if (!event.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-content').forEach(menu => menu.classList.remove('show'));
  }
});

document.querySelectorAll('.game-container').forEach((container, index) => {
  container.id = `game-container-${index}`;
});

document.addEventListener('DOMContentLoaded', async () => {
  const parallaxElement = document.querySelector('#parallaxEnd');
  const currentScrollY = window.scrollY;
  const elementHeight = parallaxElement?.offsetHeight || 0;
  if (elementHeight <= currentScrollY) {
    document.querySelector('header').classList.add('scrolled');
  }

  await initializeUser();
  await initializeLoader();
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
  }, 1000);
}

window.addEventListener('scroll', function () {
  const currentScrollY = window.scrollY;
  const elementHeight = element?.offsetHeight || 0;

  if (currentScrollY >= 0 && currentScrollY <= (getElementPosition() + elementHeight)) {
    if (Math.abs(currentScrollY - lastScrollY) < threshold) {
      return;
    }

    if (!isScrolling && currentScrollY > lastScrollY) {
      smoothScrollTo(getElementPosition());
      document.querySelector('header').classList.add('scrolled');
    }

    if (!isScrolling && currentScrollY < lastScrollY && currentScrollY > 0) {
      smoothScrollTo(0);
      document.querySelector('header').classList.remove('scrolled');
    }
    lastScrollY = currentScrollY;
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const parallax = document.getElementById("parallax");
  if (parallax) {
    parallax.style.height = `${window.innerWidth * 0.34 + 75}px`;
  }
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
  changeTheme(savedTheme);
});