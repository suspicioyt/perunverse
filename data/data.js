let SCRIPT_URL = '';
const LOGIN_PAGE = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=';

fetch('https://suspicioyt.github.io/perunverse/config/backend_url.txt')
  .then(r => { if (!r.ok) throw 0; return r.text(); })
  .then(t => { SCRIPT_URL = t.trim(); })
  .catch(e => console.error(e));

let saveTimeout = null;
let isSaving = false;
let pendingChanges = false;

async function initializeUserData() {
  const currentUrl = window.location.href;
  const token = localStorage.getItem('authToken');
  const cached = sessionStorage.getItem('userData');

  if (currentUrl.includes('/account/index.html')) return {};

  if (cached) {
    try { return JSON.parse(cached); }
    catch { sessionStorage.removeItem('userData'); }
  }

  if (!token) {
    redirectToLogin(currentUrl);
    return {};
  }

  while (!SCRIPT_URL) await new Promise(r => setTimeout(r, 50));

  try {
    const res = await fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`);
    if (!res.ok) throw 0;
    const data = await res.json();

    if (data.status === 'success') {
      const app = data.appData || {};
      sessionStorage.setItem('userData', JSON.stringify(app));
      pendingChanges = false;
      return app;
    }

    clearSessionStorage();
    redirectToLogin(currentUrl);
    return {};
  } catch (e) {
    console.warn("Błąd weryfikacji tokena, ale NIE wylogowuję:", e);
  
    if (cached) {
      try { return JSON.parse(cached); }
      catch {}
    }

    return {};
  }
}

async function saveUserDataToSheet(opts = {}) {
  const { immediate = false } = opts;
  const token = localStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');

  if (!token || !userData) return;

  if (isSaving || !SCRIPT_URL) return;

  isSaving = true;

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'updateUserData',
        token,
        appData: userData
      }).toString()
    });

    if (!res.ok) throw 0;

    const data = await res.json();
    if (data.status !== 'success') throw 0;

    sessionStorage.setItem('userData', JSON.stringify(data.appData || {}));
    pendingChanges = false;
    return data;
  } catch {
    if (!immediate) {
      setTimeout(() => {
        if (pendingChanges && !isSaving) saveUserDataToSheet().catch(() => {});
      }, 3000);
    }
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
  } catch {
    return null;
  }
}

async function setData(section, key, value) {
  let parsed = {};
  const raw = sessionStorage.getItem('userData');

  try { parsed = raw ? JSON.parse(raw) : {}; }
  catch { parsed = {}; }

  if (!parsed[section] || typeof parsed[section] !== 'object') parsed[section] = {};
  parsed[section][key] = value;

  sessionStorage.setItem('userData', JSON.stringify(parsed));
  pendingChanges = true;

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    if (pendingChanges) saveUserDataToSheet().catch(() => {});
  }, 2500);

  return parsed;
}

function insertData(el, appId, key) {
  if (!el) return;
  const v = getData(appId, key);
  el.innerHTML = v !== null ? String(v) : '';
}

function redirectToLogin(url) {
  if (!url.includes('/account/index.html')) {
    window.location.href = `${LOGIN_PAGE}${encodeURIComponent(url)}`;
  }
}

function clearSessionStorage() {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
}

window.addEventListener('beforeunload', () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveUserDataToSheet({ immediate: true });
  }
});

window.userData = {
  initializeUserData,
  saveUserDataToSheet,
  getData,
  setData,
  insertData
};