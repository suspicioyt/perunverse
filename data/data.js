let SCRIPT_URL = '';
const LOGIN_PAGE = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=';

// Pobieranie URL backendu
fetch('https://suspicioyt.github.io/perunverse/config/backend_url.txt')
  .then(r => r.text())
  .then(t => { SCRIPT_URL = t.trim(); })
  .catch(e => console.error("Nie udało się pobrać URL backendu:", e));

let saveTimeout = null;
let isSaving = false;
let pendingChanges = false;

async function initializeUserData() {
  const currentUrl = window.location.href;
  const token = localStorage.getItem('authToken');
  const cached = sessionStorage.getItem('userData');

  // Jeśli jesteśmy na stronie logowania, nie rób nic
  if (currentUrl.includes('/account/')) return cached ? JSON.parse(cached) : {};

  // Brak tokena = przekierowanie
  if (!token) {
    redirectToLogin(currentUrl);
    return {};
  }

  // Czekaj na SCRIPT_URL (max 3 sekundy)
  let attempts = 0;
  while (!SCRIPT_URL && attempts < 60) {
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }

  if (!SCRIPT_URL) {
    console.warn("Backend URL nie załadował się na czas. Używam cache.");
    return cached ? JSON.parse(cached) : {};
  }

  try {
    const res = await fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error("Server error");
    
    const data = await res.json();

    if (data.status === 'success') {
      const app = data.appData || {};
      sessionStorage.setItem('userData', JSON.stringify(app));
      pendingChanges = false;
      return app;
    } else if (data.message === 'invalid_token') {
      // Tylko wyraźny błąd tokena wylogowuje użytkownika
      clearSessionStorage();
      redirectToLogin(currentUrl);
    }
    
    return cached ? JSON.parse(cached) : {};
  } catch (err) {
    console.warn("Błąd weryfikacji (sieć), zostaję w trybie offline/cache.");
    return cached ? JSON.parse(cached) : {};
  }
}

async function saveUserDataToSheet() {
  const token = localStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');

  if (!token || !userData || !SCRIPT_URL || isSaving) return;

  isSaving = true;
  console.log("%c[System] Zapisywanie danych...", "color: #aaa");

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Stabilniejsze dla Google Apps Script
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateUserData',
        token: token,
        appData: JSON.parse(userData)
      })
    });

    // Przy no-cors nie odczytamy res.json(), więc zakładamy sukces jeśli nie ma błędu sieci
    pendingChanges = false;
    console.log("%c[System] Dane wysłane do chmury", "color: #00ff88");
  } catch (err) {
    console.error("Błąd podczas zapisu:", err);
  } finally {
    isSaving = false;
  }
}

function getData(section, key) {
  const raw = sessionStorage.getItem('userData');
  if (!raw) return null;
  try {
    const d = JSON.parse(raw);
    return d?.[section]?.[key] ?? null;
  } catch { return null; }
}

async function setData(section, key, value) {
  let parsed = {};
  const raw = sessionStorage.getItem('userData');

  try { parsed = raw ? JSON.parse(raw) : {}; }
  catch { parsed = {}; }

  if (!parsed[section] || typeof parsed[section] !== 'object') parsed[section] = {};
  
  // Sprawdź czy wartość się zmieniła, żeby nie zapisywać bez sensu
  if (parsed[section][key] === value) return parsed;

  parsed[section][key] = value;
  sessionStorage.setItem('userData', JSON.stringify(parsed));
  pendingChanges = true;

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
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
    window.location.href = `${LOGIN_PAGE}${encodeURIComponent(url)}`;
  }
}

function clearSessionStorage() {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
}

// Zapis przy zamykaniu strony
window.addEventListener('beforeunload', () => {
  if (pendingChanges) {
    // Przy zamykaniu używamy navigator.sendBeacon dla pewności zapisu
    if (SCRIPT_URL && localStorage.getItem('authToken')) {
      const data = {
        action: 'updateUserData',
        token: localStorage.getItem('authToken'),
        appData: JSON.parse(sessionStorage.getItem('userData') || '{}')
      };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon(SCRIPT_URL, blob);
    }
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