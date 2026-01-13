let SCRIPT_URL = '';
const LOGIN_PAGE = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=';
        
fetch('https://suspicioyt.github.io/perunverse/config/backend_url.txt')
  .then(response => {
    if (!response.ok) throw new Error('Nie udało się pobrać pliku konfiguracyjnego');
    return response.text();
  })
  .then(text => {
    SCRIPT_URL = text.trim();
    console.log('SCRIPT_URL załadowany pomyślnie:', SCRIPT_URL);
  })
  .catch(err => {
    console.error('Błąd ładowania SCRIPT_URL:', err);
  });

async function initializeUserData() {
  console.log('initializeUserData: Starting...', { url: window.location.href });

  const currentUrl = window.location.href;
  const token = localStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');

  console.log('initializeUserData: Current state', { token: !!token, hasUserData: !!userData });

  if (currentUrl.startsWith('https://suspicioyt.github.io/perunverse/account/index.html')) {
    console.log('initializeUserData: On login page, skipping initialization');
    return {};
  }

  if (userData) {
    try {
      const parsedData = JSON.parse(userData);
      console.log('initializeUserData: Returning cached userData');
      return parsedData;
    } catch (error) {
      console.error('initializeUserData: Error parsing cached userData:', error);
      sessionStorage.removeItem('userData');
    }
  }

  if (!token) {
    console.log('initializeUserData: No authToken, redirecting to login');
    redirectToLogin(currentUrl);
    return {};
  }

  try {
    console.log('initializeUserData: Verifying token with server...');
    const response = await fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log('initializeUserData: Server response:', data);

    if (data.status === 'success') {
      const userAppData = data.appData || {};
      sessionStorage.setItem('userData', JSON.stringify(userAppData));
      console.log('initializeUserData: User data loaded and cached');
      return userAppData;
    } else {
      console.warn('initializeUserData: Invalid token received');
      clearSessionStorage();
      redirectToLogin(currentUrl);
      return {};
    }
  } catch (error) {
    console.error('initializeUserData: Failed to verify token:', error);
    clearSessionStorage();
    redirectToLogin(currentUrl);
    return {};
  }
}

async function saveUserDataToSheet() {
  const token = localStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');

  if (!token || !userData) {
    console.error('saveUserDataToSheet: Missing token or userData');
    throw new Error('Brak tokenu lub danych użytkownika');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        action: 'updateUserData',
        token,
        appData: userData,
      }).toString(),
      mode: 'cors',
      credentials: 'omit',
    });

    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log('saveUserDataToSheet: Response:', data);

    if (data.status !== 'success') {
      throw new Error(data.message || 'Błąd podczas zapisywania danych');
    }
-
    sessionStorage.setItem('userData', JSON.stringify(data.appData || {}));
    console.log('saveUserDataToSheet: Data successfully saved');
    return data;
  } catch (error) {
    console.error('saveUserDataToSheet: Error:', error);
    throw error;
  }
}

function getData(section, key) {
  const userData = sessionStorage.getItem('userData');
  if (!userData) return null;

  try {
    const parsed = JSON.parse(userData);
    return parsed[section]?.[key] ?? null;
  } catch (error) {
    console.error('getData: Error parsing userData:', error);
    return null;
  }
}

async function setData(section, key, value) {
  let parsedData = {};
  const stored = sessionStorage.getItem('userData');

  try {
    parsedData = stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('setData: Error parsing existing userData:', error);
    parsedData = {};
  }

  if (!parsedData[section]) parsedData[section] = {};
  parsedData[section][key] = value;

  try {
    sessionStorage.setItem('userData', JSON.stringify(parsedData));
  } catch (error) {
    console.error('setData: Failed to save to sessionStorage:', error);
    throw error;
  }

  try {
    await saveUserDataToSheet();
    return parsedData;
  } catch (error) {
    console.error('setData: Failed to save to server:', error);
    throw error;
  }
}

function insertData(element, appId, key) {
  if (!element) {
    console.error('insertData: Invalid element provided');
    return;
  }

  const value = window.userData.getData(appId, key);
  element.innerHTML = value !== null ? String(value) : '';
}

function redirectToLogin(currentUrl) {
  if (!currentUrl.includes('/account/index.html')) {
    const loginUrl = `${LOGIN_PAGE}${encodeURIComponent(currentUrl)}`;
    console.log('redirectToLogin: Redirecting to', loginUrl);
    window.location.href = loginUrl;
  }
}

function clearSessionStorage() {
  console.warn('clearSessionStorage: Clearing auth data');
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('userData');
}

window.userData = {
  initializeUserData,
  saveUserDataToSheet,
  getData,
  setData,
  insertData,
};