const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzSOXIISrb_FT65cUfo3lMmXQElmLV0Vdbgk_Skr2BJDQKwRZ9NRoMJz26T7h3r8-zr/exec';
const LOGIN_PAGE = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=';
const TEST_DATA_URL = 'https://suspicioyt.github.io/perunverse/data/testData.json';

async function initializeUserData() {
  console.log('initializeUserData: Starting...', { url: window.location.href });

  // Non-production environment (test mode)
  if (!window.location.href.startsWith('https://suspicioyt.github.io/')) {
    console.log('initializeUserData: Running in non-production environment');
    try {
      const token = localStorage.getItem('authToken');
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        console.log('initializeUserData: Returning parsed userData:', JSON.parse(userData));
        return JSON.parse(userData);
      }
      console.log('initializeUserData: Fetching test data from', TEST_DATA_URL);
      const response = await fetch(TEST_DATA_URL);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      console.log('initializeUserData: Test data fetched:', data);

      try {
        if (!token) localStorage.setItem('authToken', 'test');
        sessionStorage.setItem('userData', JSON.stringify(data));
        console.log('initializeUserData: sessionStorage updated', {
          authToken: localStorage.getItem('authToken'),
          userData: sessionStorage.getItem('userData'),
        });
      } catch (storageError) {
        console.error('initializeUserData: Error writing to storage:', storageError);
        return {};
      }
      return data;
    } catch (error) {
      console.error('initializeUserData: Error fetching test data:', error);
      return {};
    }
  }

  // Production environment
  console.log('initializeUserData: Running in production environment');
  const currentUrl = window.location.href;
  const token = localStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');
  console.log('initializeUserData: Current state', { token, userData });

  // Skip if on login page
  if (currentUrl.startsWith('https://suspicioyt.github.io/perunverse/account/index.html')) {
    console.log('initializeUserData: On login page, skipping redirect');
    return {};
  }

  // Return parsed userData if available
  if (userData) {
    try {
      const parsedData = JSON.parse(userData);
      console.log('initializeUserData: Returning parsed userData:', parsedData);
      return parsedData;
    } catch (error) {
      console.error('initializeUserData: Error parsing userData:', error);
      sessionStorage.removeItem('userData');
    }
  }

  // Redirect to login if no token
  if (!token) {
    console.log('initializeUserData: No token, redirecting to login');
    redirectToLogin(currentUrl);
    return {};
  }

  // Try fetching from server
  try {
    console.log('initializeUserData: Verifying token:', token);
    const response = await fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
    });
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    console.log('initializeUserData: Fetch response:', data);

    if (data.status === 'success') {
      const userData = data.appData || {};
      sessionStorage.setItem('userData', JSON.stringify(userData));
      console.log('initializeUserData: userData saved to sessionStorage:', userData);
      return userData;
    } else {
      console.warn('initializeUserData: Invalid token, checking test data');
      try {
        const testResponse = await fetch(TEST_DATA_URL);
        if (!testResponse.ok) throw new Error(`HTTP error! Status: ${testResponse.status}`);
        const testData = await testResponse.json();
        sessionStorage.setItem('userData', JSON.stringify(testData));
        console.log('initializeUserData: Test data saved to sessionStorage:', testData);
        return testData;
      } catch (testError) {
        console.error('initializeUserData: Error fetching test data:', testError);
        clearSessionStorage();
        redirectToLogin(currentUrl);
        return {};
      }
    }
  } catch (error) {
    console.error('initializeUserData: Fetch error:', error);
    try {
      console.log('initializeUserData: Falling back to test data');
      const testResponse = await fetch(TEST_DATA_URL);
      if (!testResponse.ok) throw new Error(`HTTP error! Status: ${testResponse.status}`);
      const testData = await testResponse.json();
      sessionStorage.setItem('userData', JSON.stringify(testData));
      console.log('initializeUserData: Test data saved to sessionStorage:', testData);
      return testData;
    } catch (testError) {
      console.error('initializeUserData: Error fetching test data:', testError);
      clearSessionStorage();
      redirectToLogin(currentUrl);
      return {};
    }
  }
}

async function saveUserDataToSheet() {
  const token = localStorage.getItem('authToken');
  const userData = sessionStorage.getItem('userData');
  console.log('saveUserDataToSheet: Starting...', { token, userData });

  if (!token || !userData) {
    console.error('saveUserDataToSheet: Missing token or userData');
    throw new Error('Missing token or userData in storage');
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
      throw new Error(data.message || 'Error saving user data');
    }

    sessionStorage.setItem('userData', JSON.stringify(data.appData || {}));
    console.log('saveUserDataToSheet: Data saved successfully');
    return data;
  } catch (error) {
    console.error('saveUserDataToSheet: Error:', error);
    throw error;
  }
}

function getData(section, key) {
  const userData = sessionStorage.getItem('userData');
  if (!userData) {
    console.log('getData: No userData in sessionStorage');
    return null;
  }

  try {
    const parsedData = JSON.parse(userData);
    const value = parsedData[section]?.[key] ?? null;
    return value;
  } catch (error) {
    console.error('getData: Error parsing userData:', error);
    return null;
  }
}

async function setData(section, key, value) {
  let parsedData = {};
  const userData = sessionStorage.getItem('userData');

  try {
    parsedData = userData ? JSON.parse(userData) : {};
  } catch (error) {
    console.error('setData: Error parsing userData:', error);
  }

  parsedData[section] = parsedData[section] || {};
  parsedData[section][key] = value;
  try {
    sessionStorage.setItem('userData', JSON.stringify(parsedData));
    console.log('setData: Updated userData:', parsedData);
  } catch (storageError) {
    console.error('setData: Error writing to sessionStorage:', storageError);
    throw storageError;
  }

  try {
    await saveUserDataToSheet();
    console.log('setData: Data saved to sheet');
    return parsedData;
  } catch (error) {
    console.error('setData: Error saving data to sheet:', error);
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
  console.log(`insertData: Inserted value=${value} for appId=${appId}, key=${key}`);
}

function redirectToLogin(currentUrl) {
  if (!currentUrl.includes('/account/index.html')) {
    const redirectUrl = encodeURIComponent(currentUrl);
    const loginUrl = `${LOGIN_PAGE}${redirectUrl}`;
    console.log('redirectToLogin: Redirecting to:', loginUrl);
    window.location.href = loginUrl;
  }
}

function clearSessionStorage() {
  console.warn('clearSessionStorage: Clearing sessionStorage and localStorage', {
    authToken: localStorage.getItem('authToken'),
    userData: sessionStorage.getItem('userData'),
  });
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