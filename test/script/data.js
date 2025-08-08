const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwWWif3XxfysFKVjrCeX6QEPREXvaGQZuSGUxteniNh44MOOHDYtgLGG0PwGlFyAwFJ/exec';
const LOGIN_PAGE = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=';

function initializeUserData() {
  console.log('initializeUserData: Rozpoczęcie...');
  const token = sessionStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');
  console.log('initializeUserData: authToken=', token, 'userData=', userData);

  const currentUrl = window.location.href;
  if (currentUrl.startsWith('https://suspicioyt.github.io/perunverse/account/index.html')) {
    console.warn('initializeUserData: Już na stronie logowania, pomijanie przekierowania');
    return Promise.resolve({});
  }

  if (userData) {
    try {
      console.log('initializeUserData: Zwracanie sparsowanych userData');
      return Promise.resolve(JSON.parse(userData));
    } catch (e) {
      console.error('initializeUserData: Błąd parsowania userData:', e);
    }
  }

  if (!token) {
    console.log('initializeUserData: Brak tokena, przekierowanie na logowanie');
    const redirectUrl = encodeURIComponent(currentUrl);
    const loginUrl = LOGIN_PAGE + redirectUrl;
    window.location.href = loginUrl;
    return Promise.resolve({});
  }

  console.log('initializeUserData: Pobieranie danych z arkusza z tokenem:', token);
  return fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`, {
    method: 'GET',
    mode: 'cors',
    credentials: 'omit'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Błąd HTTP! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('initializeUserData: Odpowiedź fetch:', data);
      if (data.status === 'success') {
        const userData = data.appData || {};
        sessionStorage.setItem('userData', JSON.stringify(userData));
        console.log('initializeUserData: userData zapisane w sessionStorage:', userData);
        return userData;
      } else {
        console.warn('initializeUserData: Nieprawidłowy token, czyszczenie sessionStorage');
        sessionStorage.removeItem('authToken');
        sessionStorage.removeItem('userData');
        if (!currentUrl.includes('/account/index.html')) {
          const redirectUrl = encodeURIComponent(currentUrl);
          const loginUrl = LOGIN_PAGE + redirectUrl;
          console.log('initializeUserData: Przekierowanie na:', loginUrl);
          window.location.href = loginUrl;
        }
        return {};
      }
    })
    .catch(error => {
      console.error('initializeUserData: Błąd fetch:', error);
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userData');
      if (!currentUrl.includes('/account/index.html')) {
        const redirectUrl = encodeURIComponent(currentUrl);
        const loginUrl = LOGIN_PAGE + redirectUrl;
        console.log('initializeUserData: Przekierowanie na:', loginUrl);
        window.location.href = loginUrl;
      }
      return {};
    });
}

function saveUserDataToSheet() {
  const token = sessionStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');
  console.log('saveUserDataToSheet: token=', token, 'userData=', userData);

  if (!token || !userData) {
    console.error('saveUserDataToSheet: Brak tokena lub danych użytkownika');
    return Promise.reject(new Error('Brak tokena lub danych użytkownika w sessionStorage'));
  }

  return fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      action: 'updateUserData',
      token: token,
      appData: userData
    }).toString(),
    mode: 'cors',
    credentials: 'omit'
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Błąd HTTP! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('saveUserDataToSheet: Odpowiedź:', data);
      if (data.status !== 'success') {
        throw new Error(data.message || 'Błąd zapisywania danych');
      }
      sessionStorage.setItem('userData', JSON.stringify(data.appData || {}));
      return data;
    })
    .catch(error => {
      console.error('saveUserDataToSheet: Błąd:', error);
      throw error;
    });
}

function getData(section, key) {
  const userData = sessionStorage.getItem('userData');
  if (!userData) {
    console.log('getData: Brak userData w sessionStorage');
    return null;
  }
  try {
    const parsedData = JSON.parse(userData);
    const value = parsedData[section] && parsedData[section][key] !== undefined ? parsedData[section][key] : null;
    console.log(`getData: section=${section}, key=${key}, value=`, value);
    return value;
  } catch (e) {
    console.error('getData: Błąd parsowania userData:', e);
    return null;
  }
}

function setData(section, key, value) {
  const userData = sessionStorage.getItem('userData');
  let parsedData;
  try {
    parsedData = userData ? JSON.parse(userData) : {};
  } catch (e) {
    console.error('setData: Błąd parsowania userData:', e);
    parsedData = {};
  }
  if (!parsedData[section]) {
    parsedData[section] = {};
  }
  parsedData[section][key] = value;
  sessionStorage.setItem('userData', JSON.stringify(parsedData));
  console.log(`setData: Zaktualizowane userData:`, parsedData);
  
  return saveUserDataToSheet().then(() => {
    console.log('setData: Dane zapisane do arkusza');
    return parsedData;
  }).catch(error => {
    console.error('setData: Błąd zapisywania danych do arkusza:', error);
    throw error;
  });
}

window.userData = {
  initializeUserData,
  saveUserDataToSheet,
  getData,
  setData
};