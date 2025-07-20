const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGu4orOZhX9Cf0G1tR38dMGiTtYdLIejJSjPC6FOlkBnl2KCnP9ub31-OsamR87lJU/exec';
const SYNC_INTERVAL = 5000; // Zwiększono do 10 sekund

let userDataCache = null;
let gamesCache = null;
let isSyncing = false;

async function loadUserData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Brak tokena uwierzytelnienia w localStorage');
        window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }

    try {
        console.log('Wysyłanie żądania weryfikacji z tokenem:', token);
        const response = await fetch(`${SCRIPT_URL}?action=verify&token=${token}`, {
            method: 'GET',
            mode: 'cors'
        });
        if (!response.ok) {
            console.error(`Błąd HTTP: ${response.status} ${response.statusText}`);
            userDataCache = null;
            window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            return false;
        }
        const data = await response.json();
        console.log('Odpowiedź z serwera:', data);

        if (data.status === 'success') {
            userDataCache = { ...data, token };
            console.log('Dane użytkownika załadowane:', userDataCache);
            return true;
        } else {
            console.error('Błąd weryfikacji tokena:', data.message);
            userDataCache = null;
            window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            return false;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
        userDataCache = null;
        window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }
}

async function loadGamesData() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getGames`, {
            method: 'GET',
            mode: 'cors'
        });
        if (!response.ok) {
            console.error(`Błąd HTTP podczas pobierania gier: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        if (data.status === 'success') {
            gamesCache = data.games;
            window.games = gamesCache;
            return gamesCache;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
}

async function syncUserData() {
    if (isSyncing) {
        console.log('Synchronizacja w toku, pomijanie...');
        return;
    }
    isSyncing = true;
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('Brak tokena, pomijanie synchronizacji');
        window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
        isSyncing = false;
        return;
    }

    try {
        console.log('Synchronizacja - wysyłanie żądania z tokenem:', token);
        const userResponse = await fetch(`${SCRIPT_URL}?action=verify&token=${token}`, {
            method: 'GET',
            mode: 'cors'
        });
        if (!userResponse.ok) {
            console.error(`Błąd HTTP podczas synchronizacji użytkownika: ${userResponse.status} ${userResponse.statusText}`);
            userDataCache = null;
            window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
        } else {
            const userData = await userResponse.json();
            console.log('Synchronizacja - odpowiedź z serwera (użytkownik):', userData);
            if (userData.status === 'success') {
                userDataCache = { ...userData, token };
                console.log('Dane użytkownika zsynchronizowane:', userDataCache);
            } else {
                console.error('Błąd weryfikacji tokena:', userData.message);
                userDataCache = null;
                window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
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
        userDataCache = null;
        window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
        await updatePlayerBadges();
        if (typeof loadGames === 'function' && window.games) {
            loadFavorites(window.games);
            loadGames(window.games);
        }
    } finally {
        isSyncing = false;
    }
}

async function getSheetData(key) {
    if (!userDataCache) {
        const success = await loadUserData();
        if (!success) return null;
    }
    if (userDataCache && userDataCache[key] !== undefined) {
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

async function updateSheetData(key, value) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Brak tokena, nie można zapisać danych w arkuszu');
        window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    try {
        const response = await fetch(`${SCRIPT_URL}?action=update&key=${key}&token=${token}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(value)
        });
        if (!response.ok) {
            console.error(`Błąd HTTP podczas aktualizacji ${key}: ${response.status} ${response.statusText}`);
            return;
        }
        console.log(`Zaktualizowano ${key} w arkuszu`);
        userDataCache = null; // Wymagaj ponownego załadowania danych
    } catch (error) {
        console.error(`Błąd aktualizacji ${key} w arkuszu:`, error);
        window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
    }
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

async function addData(token, appId, key, value) {
    try {
        const effectiveToken = token === 'current' ? localStorage.getItem('authToken') : token;
        if (!effectiveToken) {
            console.error('Brak tokena uwierzytelnienia');
            window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            return { status: 'error', message: 'Brak tokena uwierzytelnienia' };
        }

        const response = await fetch(`${SCRIPT_URL}?action=verify_requestedUserData&token=${effectiveToken}`, {
            method: 'GET',
            mode: 'cors'
        });
        const userData = await response.json();

        if (userData.status !== 'success') {
            console.error('Błąd weryfikacji tokena:', userData.message);
            window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            return { status: 'error', message: userData.message };
        }

        if (appId === 'sheet') {
            const columnMap = {
                'username': 2,
                'email': 3,
                'birthYear': 5,
                'isVerified': 6,
                'isPremium': 7,
                'token': 8
            };
            const columnIndex = columnMap[key];
            if (!columnIndex) {
                console.error(`Nieprawidłowy klucz dla appId='sheet': ${key}`);
                return { status: 'error', message: `Nieprawidłowy klucz: ${key}` };
            }

            await updateSheetData(key, value);
            userDataCache = { ...userData, [key]: value, token: effectiveToken };
            return { status: 'success', message: `Zaktualizowano ${key} w arkuszu`, [key]: value };
        } else {
            let appData = userData.appData || {};
            if (!appData[appId]) {
                appData[appId] = {};
            }
            if (appData[appId][key] !== undefined && !Array.isArray(appData[appId][key])) {
                console.error(`Klucz ${appId}.${key} istnieje i nie jest tablicą`);
                return { status: 'error', message: `Klucz ${key} nie jest tablicą w ${appId}` };
            }
            if (!Array.isArray(appData[appId][key])) {
                appData[appId][key] = [];
            }
            appData[appId][key].push(value);

            const updateResponse = await fetch(`${SCRIPT_URL}?action=updateAppData&token=${effectiveToken}&appId=${appId}&data=${encodeURIComponent(JSON.stringify(appData[appId]))}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const updateResult = await updateResponse.json();

            if (updateResult.status !== 'success') {
                console.error('Błąd aktualizacji danych:', updateResult.message);
                window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
                return { status: 'error', message: updateResult.message };
            }

            userDataCache = { ...userData, appData: updateResult.appData, token: effectiveToken };
            return { status: 'success', message: `Dodano ${value} do ${appId}.${key}`, appData: updateResult.appData };
        }
    } catch (error) {
        console.error('Błąd w addData:', error);
        window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
        return { status: 'error', message: 'Wystąpił błąd podczas dodawania danych' };
    }
}

function logout() {
    localStorage.removeItem('authToken');
    userDataCache = null;
    gamesCache = null;
    window.games = null;
    window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html';
}

setInterval(syncUserData, SYNC_INTERVAL);