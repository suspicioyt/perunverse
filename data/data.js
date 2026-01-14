let SCRIPT_URL = '';
const LOGIN_PAGE = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=';

// Czyste logowanie bez kolorów
const dLog = (msg) => console.log(`[DEBUG] ${msg}`);

dLog("Inicjalizacja systemu danych...");

// 1. Pobieranie URL backendu
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

// 2. Weryfikacja i Inicjalizacja
async function initializeUserData() {
  const currentUrl = window.location.href;
  const token = localStorage.getItem('authToken');
  const cached = sessionStorage.getItem('userData');

  if (currentUrl.includes('/account/')) return cached ? JSON.parse(cached) : {};

  if (!token) {
    dLog("Brak tokena - przekierowanie do logowania.");
    redirectToLogin(currentUrl);
    return {};
  }

  // Czekaj na SCRIPT_URL (max 3 sekundy)
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
      const app = data.appData || {};
      sessionStorage.setItem('userData', JSON.stringify(app));
      pendingChanges = false;
      return app;
    } 
    
    if (data && data.message === 'invalid_token') {
      dLog("Token unieważniony przez serwer!");
      clearSessionStorage();
      redirectToLogin(currentUrl);
      return {};
    }
  } catch (e) {
    dLog("Błąd sieci podczas weryfikacji. Używam cache (Offline Mode).");
  }

  return cached ? JSON.parse(cached) : {};
}

// 3. Zapisywanie danych
async function saveUserDataToSheet(opts = {}) {
  const { immediate = false } = opts;
  const token = localStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');

  if (!token || !userData || !SCRIPT_URL || isSaving) return;

  isSaving = true;
  dLog("Chmura: Rozpoczynam zapis...");

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateUserData',
        token: token,
        appData: JSON.parse(userData)
      })
    });

    dLog("Chmura: Dane wysłane.");
    pendingChanges = false;
  } catch (e) {
    dLog("BŁĄD ZAPISU! Ponowienie za 5s.");
    if (!immediate) {
       setTimeout(() => { if (pendingChanges) saveUserDataToSheet(); }, 5000);
    }
  } finally {
    isSaving = false;
  }
}

// 4. Pobieranie konkretnych danych
function getData(section, key) {
  const raw = sessionStorage.getItem('userData');
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const val = d?.[section]?.[key] ?? null;
    return val;
  } catch { return null; }
}

// 5. Ustawianie danych (z Debouncem)
async function setData(section, key, value) {
  let parsed = {};
  const raw = sessionStorage.getItem('userData');

  try { parsed = raw ? JSON.parse(raw) : {}; } catch { parsed = {}; }

  if (!parsed[section] || typeof parsed[section] !== 'object') parsed[section] = {};
  
  if (parsed[section][key] === value) return parsed; 

  parsed[section][key] = value;
  sessionStorage.setItem('userData', JSON.stringify(parsed));
  pendingChanges = true;

  dLog(`Zmiana: [${section}][${key}] = ${value}`);

  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    if (pendingChanges) saveUserDataToSheet();
  }, 2500);

  return parsed;
}

// 6. Funkcje pomocnicze
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
}

// Mostek dla starych skryptów
window.loadUserData = initializeUserData;
window.API = {
  updateRanking: () => dLog("Stary ranking nieaktywny."),
  sendLocalData: () => saveUserDataToSheet()
};

// Zapis przy zamykaniu
window.addEventListener('beforeunload', () => {
  if (pendingChanges && SCRIPT_URL) {
    const data = JSON.stringify({
      action: 'updateUserData',
      token: localStorage.getItem('authToken'),
      appData: JSON.parse(sessionStorage.getItem('userData') || '{}')
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