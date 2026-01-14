/* ============================================================
   KONFIGURACJA
============================================================ */

let SCRIPT_URL = "";
const LOGIN_PAGE = "https://suspicioyt.github.io/perunverse/account/index.html?redirect=";

fetch("https://suspicioyt.github.io/perunverse/config/backend_url.txt")
  .then(r => r.ok ? r.text() : Promise.reject())
  .then(t => SCRIPT_URL = t.trim())
  .catch(err => console.error("Błąd ładowania backend_url:", err));

let initialized = false;
let isSaving = false;
let pendingChanges = false;
let saveTimeout = null;


/* ============================================================
   FUNKCJA: Czekanie na SCRIPT_URL
============================================================ */

async function waitForScriptUrl() {
  while (!SCRIPT_URL) {
    await new Promise(r => setTimeout(r, 50));
  }
}


/* ============================================================
   FUNKCJA: Inicjalizacja danych użytkownika
============================================================ */

async function initializeUserData() {
  const url = window.location.href;
  const token = localStorage.getItem("authToken");
  const cached = sessionStorage.getItem("userData");

  // Strona logowania nie potrzebuje danych
  if (url.includes("/account/index.html")) return {};

  // Jeśli mamy cache → zwracamy natychmiast
  if (cached) {
    try { return JSON.parse(cached); }
    catch { sessionStorage.removeItem("userData"); }
  }

  // Brak tokena → logowanie
  if (!token) {
    redirectToLogin(url);
    return {};
  }

  await waitForScriptUrl();

  try {
    const res = await fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`);
    if (!res.ok) throw new Error("Błąd połączenia");

    const data = await res.json();

    // Token nieprawidłowy → wylogowanie
    if (data.status !== "success") {
      clearSessionStorage();
      redirectToLogin(url);
      return {};
    }

    const app = data.appData || {};

    // Jeśli backend zwrócił puste dane → NIE nadpisujemy lokalnych
    if (Object.keys(app).length > 0) {
      sessionStorage.setItem("userData", JSON.stringify(app));
      pendingChanges = false;
    }

    initialized = true;
    return app;

  } catch (err) {
    console.warn("Błąd weryfikacji tokena — używam lokalnych danych:", err);

    initialized = true;

    if (cached) {
      try { return JSON.parse(cached); }
      catch {}
    }

    return {};
  }
}


/* ============================================================
   FUNKCJA: Zapis danych do backendu
============================================================ */

async function saveUserDataToSheet(opts = {}) {
  const { immediate = false } = opts;

  const token = localStorage.getItem("authToken");
  const userData = sessionStorage.getItem("userData");

  // Nie zapisujemy jeśli:
  if (!initialized) return;
  if (!token) return;
  if (!userData || userData === "{}") return;
  if (!pendingChanges) return;

  await waitForScriptUrl();

  if (isSaving) return;
  isSaving = true;

  try {
    const res = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        action: "updateUserData",
        token,
        appData: userData
      })
    });

    if (!res.ok) throw new Error("Błąd zapisu");

    const data = await res.json();

    if (data.status !== "success") {
      throw new Error("Backend odrzucił zapis");
    }

    sessionStorage.setItem("userData", JSON.stringify(data.appData || {}));
    pendingChanges = false;

  } catch (err) {
    console.warn("Błąd zapisu danych:", err);

    if (!immediate) {
      setTimeout(() => {
        if (pendingChanges && !isSaving) saveUserDataToSheet().catch(() => {});
      }, 3000);
    }

  } finally {
    isSaving = false;
  }
}


/* ============================================================
   FUNKCJE: Pobieranie i ustawianie danych
============================================================ */

function getData(section, key) {
  const raw = sessionStorage.getItem("userData");
  if (!raw) return null;

  try {
    const obj = JSON.parse(raw);
    return obj?.[section]?.[key] ?? null;
  } catch {
    return null;
  }
}

async function setData(section, key, value) {
  let obj = {};

  try {
    obj = JSON.parse(sessionStorage.getItem("userData") || "{}");
  } catch {
    obj = {};
  }

  if (!obj[section] || typeof obj[section] !== "object") {
    obj[section] = {};
  }

  obj[section][key] = value;

  sessionStorage.setItem("userData", JSON.stringify(obj));
  pendingChanges = true;

  if (saveTimeout) clearTimeout(saveTimeout);

  saveTimeout = setTimeout(() => {
    if (pendingChanges) saveUserDataToSheet().catch(() => {});
  }, 2000);

  return obj;
}


/* ============================================================
   FUNKCJA: Wstawianie danych do elementu HTML
============================================================ */

function insertData(el, section, key) {
  if (!el) return;
  const v = getData(section, key);
  el.innerHTML = v !== null ? String(v) : "";
}


/* ============================================================
   FUNKCJE: Logowanie / czyszczenie
============================================================ */

function redirectToLogin(url) {
  if (!url.includes("/account/index.html")) {
    window.location.href = `${LOGIN_PAGE}${encodeURIComponent(url)}`;
  }
}

function clearSessionStorage() {
  localStorage.removeItem("authToken");
  sessionStorage.removeItem("userData");
}


/* ============================================================
   Zapis przy zamknięciu strony
============================================================ */

window.addEventListener("beforeunload", () => {
  if (pendingChanges) {
    saveUserDataToSheet({ immediate: true });
  }
});


/* ============================================================
   Eksport API
============================================================ */

window.userData = {
  initializeUserData,
  saveUserDataToSheet,
  getData,
  setData,
  insertData
};
