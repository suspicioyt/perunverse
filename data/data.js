let SCRIPT_URL = '';
const LOGIN_PAGE = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=';

// Stylistyka logów
const debugStyle = {
  info: 'color: #00aaff; font-weight: bold;',
  success: 'color: #00ff88; font-weight: bold;',
  warn: 'color: #ffaa00; font-weight: bold;',
  error: 'color: #ff4444; font-weight: bold;',
  data: 'color: #cc88ff; font-style: italic;'
};

console.log("%c[DEBUG] System Perun Multiverse zainicjowany", debugStyle.info);

// Pobieranie URL backendu
fetch('https://suspicioyt.github.io/perunverse/config/backend_url.txt')
  .then(r => r.text())
  .then(t => { 
    SCRIPT_URL = t.trim(); 
    console.log("%c[DEBUG] Backend URL załadowany:", debugStyle.success, SCRIPT_URL);
  })
  .catch(e => console.error("%c[DEBUG] BŁĄD ładowania backend_url.txt:", debugStyle.error, e));

let saveTimeout = null;
let isSaving = false;
let pendingChanges = false;

async function initializeUserData() {
  const currentUrl = window.location.href;
  const token = localStorage.getItem('authToken');
  const cached = sessionStorage.getItem('userData');

  console.group("%c[DEBUG] Inicjalizacja danych użytkownika", debugStyle.info);
  console.log("Token w localStorage:", token ? "Obecny" : "BRAK");
  console.log("Dane w cache (sessionStorage):", cached ? "Obecne" : "BRAK");

  if (currentUrl.includes('/account/')) {
    console.log("Strona konta - pomijam auto-inicjalizację.");
    console.groupEnd();
    return cached ? JSON.parse(cached) : {};
  }

  if (!token) {
    console.warn("%c[DEBUG] Brak tokena - przekierowanie do logowania.", debugStyle.warn);
    console.groupEnd();
    redirectToLogin(currentUrl);
    return {};
  }

  let attempts = 0;
  while (!SCRIPT_URL && attempts < 60) {
    if (attempts % 10 === 0) console.log("Oczekiwanie na SCRIPT_URL...");
    await new Promise(r => setTimeout(r, 100));
    attempts++;
  }

  try {
    console.log("Weryfikacja tokena w chmurze...");
    const res = await fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`);
    const data = await res.json();

    if (data.status === 'success') {
      console.log("%c[DEBUG] Weryfikacja udana!", debugStyle.success, data.appData);
      sessionStorage.setItem('userData', JSON.stringify(data.appData || {}));
      pendingChanges = false;
      console.groupEnd();
      return data.appData;
    } else {
      const errorMsg = data.message || "Brak szczegółów błędu (może błąd skryptu GAS?)";
      console.error("%c[DEBUG] Serwer odrzucił token:", debugStyle.error, errorMsg);
      console.log("Pełna odpowiedź serwera:", data); // To pokaże co dokładnie zwrócił GAS

      if (errorMsg === 'invalid_token') {
        clearSessionStorage();
        redirectToLogin(currentUrl);
      }
    }
  } catch (err) {
    console.warn("%c[DEBUG] Błąd sieci/GAS. Używam danych lokalnych (Offline Mode).", debugStyle.warn);
  }

  console.groupEnd();
  return cached ? JSON.parse(cached) : {};
}

async function saveUserDataToSheet() {
  const token = localStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');

  if (!token || !userData || !SCRIPT_URL || isSaving) {
    if (isSaving) console.log("%c[DEBUG] Zapis już trwa, pomijam...", debugStyle.warn);
    return;
  }

  isSaving = true;
  console.log("%c[DEBUG] Chmura: Rozpoczynam zapis danych...", debugStyle.info);

  try {
    await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateUserData',
        token: token,
        appData: JSON.parse(userData)
      })
    });

    pendingChanges = false;
    console.log("%c[DEBUG] Chmura: Dane wysłane (no-cors mode).", debugStyle.success);
  } catch (err) {
    console.error("%c[DEBUG] BŁĄD ZAPISU:", debugStyle.error, err);
  } finally {
    isSaving = false;
  }
}

function getData(section, key) {
  const raw = sessionStorage.getItem('userData');
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    const val = d?.[section]?.[key] ?? null;
    console.log(`%c[DEBUG] Odczyt: [${section}][${key}] =`, debugStyle.data, val);
    return val;
  } catch { return null; }
}

async function setData(section, key, value) {
  let parsed = {};
  const raw = sessionStorage.getItem('userData');

  try { parsed = raw ? JSON.parse(raw) : {}; }
  catch { parsed = {}; }

  if (!parsed[section] || typeof parsed[section] !== 'object') parsed[section] = {};
  
  const oldVal = parsed[section][key];
  if (oldVal === value) return parsed;

  console.log(`%c[DEBUG] Zmiana: [${section}][${key}]:`, debugStyle.info, oldVal, "->", value);

  parsed[section][key] = value;
  sessionStorage.setItem('userData', JSON.stringify(parsed));
  pendingChanges = true;

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    console.log("%c[DEBUG] Auto-zapis uruchomiony (debounce).", debugStyle.warn);
    saveUserDataToSheet();
  }, 2500);

  return parsed;
}

function insertData(el, appId, key) {
  if (!el) return;
  const v = getData(appId, key);
  el.innerHTML = v !== null ? String(v) : '';
}

function redirectToLogin(url) {
  if (!url.includes('/account/')) {
    console.log("%c[DEBUG] Przekierowanie do logowania:", debugStyle.warn, url);
    window.location.href = `${LOGIN_PAGE}${encodeURIComponent(url)}`;
  }
}

function clearSessionStorage() {
  console.log("%c[DEBUG] Czyszczenie sesji i tokena.", debugStyle.error);
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
}

// Funkcja diagnostyczna dostępna z konsoli: window.userData.status()
function printStatus() {
  console.group("%c[DEBUG] Status Systemu", debugStyle.info);
  console.log("Backend URL:", SCRIPT_URL || "Niezaładowany");
  console.log("Zalogowany:", !!localStorage.getItem('authToken'));
  console.log("Oczekujące zmiany:", pendingChanges);
  console.log("Aktualne dane:", JSON.parse(sessionStorage.getItem('userData') || '{}'));
  console.groupEnd();
}

window.addEventListener('beforeunload', () => {
  if (pendingChanges) {
    console.log("%c[DEBUG] Strona zamykana - wymuszam zapis (Beacon).", debugStyle.warn);
    const data = {
      action: 'updateUserData',
      token: localStorage.getItem('authToken'),
      appData: JSON.parse(sessionStorage.getItem('userData') || '{}')
    };
    navigator.sendBeacon(SCRIPT_URL, new Blob([JSON.stringify(data)], { type: 'application/json' }));
  }
});

window.userData = {
  initializeUserData,
  saveUserDataToSheet,
  getData,
  setData,
  insertData,
  status: printStatus,
  logout: () => { clearSessionStorage(); location.reload(); }
};