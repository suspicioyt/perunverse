const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmlSQtCHeCqIwUA527F2IZJ-l4E11lFkNjS19kysW-nsReK7ivNCXF1OmQP6t53nK5/exec';
const SYNC_INTERVAL = 5000;

let userDataCache = null;
let gamesCache = null;

async function loadUserData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Brak tokena uwierzytelnienia w localStorage');
        window.location.href = '../account/index.html?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }

    const cachedData = sessionStorage.getItem('userData');
    if (cachedData) {
        try {
            userDataCache = JSON.parse(cachedData);
            if (userDataCache.token === token) {
                console.log('Użyto buforowanych danych z sessionStorage');
                sessionStorage.setItem('perunPremium', userDataCache.isPremium === true || userDataCache.isPremium === 'true');
                return true;
            } else {
                console.warn('Token w buforze nie zgadza się z bieżącym tokenem');
            }
        } catch (error) {
            console.error('Błąd parsowania buforowanych danych:', error);
        }
    }

    try {
        console.log('Wysyłanie żądania weryfikacji z tokenem:', token);
        const response = await fetch(`${SCRIPT_URL}?action=verify&token=${token}`);
        if (!response.ok) {
            console.error('Błąd HTTP:', response.status, response.statusText);
            sessionStorage.removeItem('userData');
            sessionStorage.removeItem('perunPremium');
            return false;
        }
        const data = await response.json();
        console.log('Odpowiedź z serwera:', data);

        if (data.status === 'success') {
            userDataCache = { ...data, token };
            sessionStorage.setItem('userData', JSON.stringify(userDataCache));
            sessionStorage.setItem('perunPremium', userDataCache.isPremium === true || userDataCache.isPremium === 'true');
            console.log('Dane użytkownika zapisane w sessionStorage:', userDataCache);
            return true;
        } else {
            console.error('Błąd weryfikacji tokena:', data.message);
            sessionStorage.removeItem('userData');
            sessionStorage.removeItem('perunPremium');
            return false;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('perunPremium');
        return false;
    }
}

async function loadGamesData() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getGames`);
        if (!response.ok) {
            console.error('Błąd HTTP podczas pobierania gier:', response.status, response.statusText);
            return null;
        }
        const data = await response.json();
        console.log('Dane gier z serwera:', data);
        if (data.status === 'success') {
            gamesCache = data.games;
            window.games = gamesCache;
            localStorage.setItem('gamesData', JSON.stringify(gamesCache));
            return gamesCache;
        } else {
            console.error('Błąd pobierania gier:', data.message);
            return null;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania gier:', error);
        return null;
    }
}

async function syncUserData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('Brak tokena, pomijanie synchronizacji');
        return;
    }

    try {
        console.log('Synchronizacja - wysyłanie żądania z tokenem:', token);
        const userResponse = await fetch(`${SCRIPT_URL}?action=verify&token=${token}`);
        if (!userResponse.ok) {
            console.error('Błąd HTTP podczas synchronizacji użytkownika:', userResponse.status, userResponse.statusText);
            sessionStorage.removeItem('userData');
            sessionStorage.removeItem('perunPremium');
        } else {
            const userData = await userResponse.json();
            console.log('Synchronizacja - odpowiedź z serwera (użytkownik):', userData);
            if (userData.status === 'success') {
                userDataCache = { ...userData, token };
                sessionStorage.setItem('userData', JSON.stringify(userDataCache));
                sessionStorage.setItem('perunPremium', userDataCache.isPremium === true || userDataCache.isPremium === 'true');
                console.log('Dane użytkownika zsynchronizowane:', userDataCache);
            } else {
                console.error('Błąd weryfikacji tokena:', userData.message);
                sessionStorage.removeItem('userData');
                sessionStorage.removeItem('perunPremium');
            }
        }

        const gamesData = await loadGamesData();
        if (gamesData) {
            console.log('Dane gier zsynchronizowane:', gamesData);
        }

        const elements = document.querySelectorAll('[data-app-id][data-key]');
        elements.forEach(element => {
            const appId = element.getAttribute('data-app-id');
            const key = element.getAttribute('data-key');
            insertData(element, appId, key);
        });

        await updatePlayerBadges();

        if (typeof loadGames === 'function' && window.games) {
            loadFavorites(window.games);
            loadGames(window.games);
        }
    } catch (error) {
        console.error('Błąd podczas synchronizacji danych:', error);
        sessionStorage.removeItem('userData');
        sessionStorage.removeItem('perunPremium');
        await updatePlayerBadges();
        if (typeof loadGames === 'function' && window.games) {
            loadFavorites(window.games);
            loadGames(window.games);
        }
    }
}

async function getSheetData(key) {
    if (!userDataCache) {
        const success = await loadUserData();
        if (!success) return null;
    }
    if (userDataCache && userDataCache[key] !== undefined) {
        console.log(`Pobrano ${key} z bufora:`, userDataCache[key]);
        return userDataCache[key];
    }
    console.error(`Klucz "${key}" nie istnieje w danych użytkownika`);
    return null;
}

async function getAppData(appId, key) {
    if (!userDataCache) {
        const success = await loadUserData();
        if (!success) return null;
    }
    if (userDataCache && userDataCache.appData && userDataCache.appData[appId]) {
        const value = userDataCache.appData[appId][key] !== undefined ? userDataCache.appData[appId][key] : null;
        console.log(`Pobrano ${appId}.${key} z bufora:`, value);
        return value;
    }
    console.error(`Dane dla ${appId}.${key} nie istnieją`);
    return null;
}

async function insertData(element, appId, key) {
    try {
        let value;
        if (appId === 'sheet') {
            value = await getSheetData(key);
        } else {
            value = await getAppData(appId, key);
        }
        element.innerHTML = value !== null && value !== undefined ? value : '???';
        console.log(`Wstawiono ${value || '???'} do elementu dla ${appId}.${key}`);
    } catch (error) {
        console.error(`Błąd podczas wstawiania danych dla ${appId}.${key}:`, error);
        element.innerHTML = '???';
    }
}

async function updatePlayerBadges() {
    try {
        const isVerified = await getSheetData('isVerified');
        const isPremium = await getSheetData('isPremium');

        const verified = isVerified === true || isVerified === 'true';
        const premium = isPremium === true || isPremium === 'true';

        let badges = '';
        if (verified) {
            badges += '<i class="fas fa-check-circle verified-icon" title="Verified User"></i>';
        }
        if (premium) {
            badges += '<i class="fas fa-crown premium-icon" title="Premium User"></i>';
        }

        const badgesElement = document.getElementById('playerBadges');
        if (badgesElement) {
            badgesElement.innerHTML = badges || '???';
            console.log('Odznaki zaktualizowane:', badges || '???');
        } else {
            console.warn('Element #playerBadges nie istnieje');
        }
    } catch (error) {
        console.error('Błąd podczas aktualizacji odznak:', error);
        const badgesElement = document.getElementById('playerBadges');
        if (badgesElement) {
            badgesElement.innerHTML = '???';
        }
    }
}

function logout() {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('userData');
    sessionStorage.removeItem('perunPremium');
    userDataCache = null;
    gamesCache = null;
    window.games = null;
    window.location.href = '../account/index.html';
}

setInterval(syncUserData, SYNC_INTERVAL);