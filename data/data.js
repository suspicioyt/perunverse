let SCRIPT_URL = '';
const LOGIN_PAGE = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=';

let memoryCache = null; 

const dLog = (msg) => console.log(`[DEBUG] ${msg}`);

dLog("Inicjalizacja systemu danych...");

fetch('https://suspicioyt.github.io/perunverse/config/backend_url.txt')
  .then(r => r.ok ? r.text() : Promise.reject())
  .then(t => { 
    SCRIPT_URL = t.trim(); 
    dLog("URL Backendu załadowany: " + SCRIPT_URL);
  })
  .catch(() => console.error("[DEBUG] BŁĄD: Nie udało się pobrać backend_url.txt"));

let saveTimeout = null;
let isSaving = false;
let pendingChanges = false;

async function initializeUserData() {
  const currentUrl = new URL(window.location.href);
  let token = localStorage.getItem('authToken');
  
  const cached = sessionStorage.getItem('userData');
  if (cached) memoryCache = JSON.parse(cached);

  const tokenFromUrl = currentUrl.searchParams.get('token');
  if (tokenFromUrl) {
    dLog("Wykryto token w URL. Zapisywanie...");
    localStorage.setItem('authToken', tokenFromUrl);
    token = tokenFromUrl;
    currentUrl.searchParams.delete('token');
    window.history.replaceState({}, document.title, currentUrl.pathname + currentUrl.search);
  }

  if (window.location.href.includes('/account/')) return memoryCache || {};

  if (!token) {
    dLog("Brak tokena - przekierowanie do logowania.");
    redirectToLogin(window.location.href);
    return {};
  }

  let attempts = 0;
  while (!SCRIPT_URL && attempts < 60) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  try {
    dLog("Weryfikacja tokena w chmurze...");
    const res = await fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`);
    const data = await res.json();

    if (data && data.status === 'success') {
      dLog("Weryfikacja udana. Pobrano świeże dane.");
      memoryCache = data.appData || {}; // Zapisz do RAM
      sessionStorage.setItem('userData', JSON.stringify(memoryCache));
      pendingChanges = false;
      return memoryCache;
    } 
    
    if (data && data.message === 'invalid_token') {
      dLog("Token unieważniony przez serwer!");
      clearSessionStorage();
      redirectToLogin(window.location.href);
      return {};
    }
  } catch (e) {
    dLog("Błąd sieci podczas weryfikacji. Używam cache.");
  }

  return memoryCache || {};
}

async function saveUserDataToSheet(opts = {}) {
  const token = localStorage.getItem('authToken');
  if (!token || !memoryCache || !SCRIPT_URL || isSaving) return;

  isSaving = true;
  dLog("Chmura: Rozpoczynam zapis (Auto-save)...");

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateUserData',
        token: token,
        appData: memoryCache
      })
    });

    dLog("Chmura: Dane wysłane pomyślnie.");
    pendingChanges = false;
  } catch (e) {
    dLog("BŁĄD ZAPISU! Ponowienie nastąpi przy kolejnej zmianie.");
  } finally {
    isSaving = false;
  }
}

function getData(section, key) {
  if (!memoryCache) {
      const raw = sessionStorage.getItem('userData');
      if (raw) memoryCache = JSON.parse(raw);
      else return null;
  }
  return memoryCache?.[section]?.[key] ?? null;
}

async function setData(section, key, value) {
  if (!memoryCache) memoryCache = {};

  if (!memoryCache[section] || typeof memoryCache[section] !== 'object') {
      memoryCache[section] = {};
  }
  
  if (memoryCache[section][key] === value) return memoryCache; 

  memoryCache[section][key] = value;
  sessionStorage.setItem('userData', JSON.stringify(memoryCache));
  pendingChanges = true;

  dLog(`Zmiana lokalna: [${section}][${key}] = ${value}. Zapis za 5s...`);

  if (saveTimeout) clearTimeout(saveTimeout);
  
  saveTimeout = setTimeout(() => {
    if (pendingChanges) {
        saveUserDataToSheet();
    }
  }, 5000);

  return memoryCache;
}

function insertData(el, appId, key) {
  if (!el) return;
  const v = getData(appId, key);
  el.innerHTML = v !== null ? String(v) : '';
}

function redirectToLogin(url) {
  if (!url.includes('/account/')) {
    window.location.href = `${LOGIN_PAGE}${encodeURIComponent(url)}`;
  }
}

function clearSessionStorage() {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
  memoryCache = null;
}

window.loadUserData = initializeUserData;
window.API = {
  updateRanking: () => dLog("Stary ranking nieaktywny."),
  sendLocalData: () => saveUserDataToSheet()
};

window.addEventListener('beforeunload', () => {
  if (pendingChanges && SCRIPT_URL && memoryCache) {
    const data = JSON.stringify({
      action: 'updateUserData',
      token: localStorage.getItem('authToken'),
      appData: memoryCache
    });
    navigator.sendBeacon(SCRIPT_URL, new Blob([data], {type: 'application/json'}));
  }
});

window.userData = {
  initializeUserData,
  saveUserDataToSheet,
  getData,
  setData,
  insertData,
  logout: () => { clearSessionStorage(); location.reload(); }
};

//let money = window.userData.getData('profile', 'money') || 0;

//await window.userData.setData('profile', 'money', newMoney);

//const moneyDisplay = document.getElementById('money-count');
//window.userData.insertData(moneyDisplay, 'profile', 'money');

//const data = await window.userData.initializeUserData();
//console.log("Witaj ponownie, " + data.profile.username);

//<button onclick="window.userData.logout()">Wyloguj się</button>