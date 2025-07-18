const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby56CL80JeBwzpW_Hlta4xhRPPnytisYsDS_qd4Vh1Q5WGa047x9MXTrVKsifqSlSAI/exec';
const SYNC_INTERVAL = 5000;

let userDataCache = null;
let gamesCache = null;
let isSyncing = false;

async function loadUserData() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Brak tokena uwierzytelnienia w localStorage');
        window.location.href = '../account/index.html?redirect=' + encodeURIComponent(window.location.href);
        return false;
    }

    try {
        console.log('Wysyłanie żądania weryfikacji z tokenem:', token);
        const response = await fetch(`${SCRIPT_URL}?action=verify&token=${token}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            console.error(`Błąd HTTP: ${response.status} ${response.statusText}`);
            userDataCache = null;
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
            return false;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
        userDataCache = null;
        return false;
    }
}

async function loadGamesData() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getGames`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) {
            console.error(`Błąd HTTP podczas pobierania gier: ${response.status} ${response.statusText}`);
            return null;
        }
        const data = await response.json();
        console.log('Dane gier z serwera:', data);
        if (data.status === 'success') {
            gamesCache = data.games;
            window.games = gamesCache;
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
    if (isSyncing) {
        console.log('Synchronizacja w toku, pomijanie...');
        return;
    }
    isSyncing = true;
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.log('Brak tokena, pomijanie synchronizacji');
        isSyncing = false;
        return;
    }

    try {
        console.log('Synchronizacja - wysyłanie żądania z tokenem:', token);
        const userResponse = await fetch(`${SCRIPT_URL}?action=verify&token=${token}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!userResponse.ok) {
            console.error(`Błąd HTTP podczas synchronizacji użytkownika: ${userResponse.status} ${userResponse.statusText}`);
            userDataCache = null;
        } else {
            const userData = await userResponse.json();
            console.log('Synchronizacja - odpowiedź z serwera (użytkownik):', userData);
            if (userData.status === 'success') {
                userDataCache = { ...userData, token };
                console.log('Dane użytkownika zsynchronizowane:', userDataCache);
            } else {
                console.error('Błąd weryfikacji tokena:', userData.message);
                userDataCache = null;
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

async function updateSheetData(key, value) {
    const token = localStorage.getItem('authToken');
    if (!token) {
        console.error('Brak tokena, nie można zapisać danych w arkuszu');
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
async function addData(token, appId, key, value) {
    try {
        // Obsługa tokena 'current'
        const effectiveToken = token === 'current' ? localStorage.getItem('authToken') : token;
        if (!effectiveToken) {
            console.error('Brak tokena uwierzytelnienia');
            return { status: 'error', message: 'Brak tokena uwierzytelnienia' };
        }

        // Pobierz dane użytkownika
        const response = await fetch(`${SCRIPT_URL}?action=verify&token=${effectiveToken}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const userData = await response.json();

        if (userData.status !== 'success') {
            console.error('Błąd weryfikacji tokena:', userData.message);
            return { status: 'error', message: userData.message };
        }

        if (appId === 'sheet') {
            // Mapowanie klucza na kolumnę w arkuszu
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

            // Aktualizacja wartości w arkuszu
            await updateSheetData(key, value);
            userDataCache = { ...userData, [key]: value, token: effectiveToken };
            return { status: 'success', message: `Zaktualizowano ${key} w arkuszu`, [key]: value };
        } else {
            // Pobierz bieżące appData
            let appData = userData.appData || {};

            // Inicjalizuj kategorię, jeśli nie istnieje
            if (!appData[appId]) {
                appData[appId] = {};
            }

            // Sprawdź, czy klucz już istnieje i czy jest tablicą
            if (appData[appId][key] !== undefined && !Array.isArray(appData[appId][key])) {
                console.error(`Klucz ${appId}.${key} istnieje i nie jest tablicą`);
                return { status: 'error', message: `Klucz ${key} nie jest tablicą w ${appId}` };
            }

            // Inicjalizuj tablicę dla klucza, jeśli nie istnieje
            if (!Array.isArray(appData[appId][key])) {
                appData[appId][key] = [];
            }

            // Dodaj wartość do tablicy (powtarzające się wartości są dozwolone)
            appData[appId][key].push(value);

            // Zaktualizuj appData w arkuszu
            const updateResponse = await fetch(`${SCRIPT_URL}?action=updateAppData&token=${effectiveToken}&appId=${appId}&data=${encodeURIComponent(JSON.stringify(appData[appId]))}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const updateResult = await updateResponse.json();

            if (updateResult.status !== 'success') {
                console.error('Błąd aktualizacji danych:', updateResult.message);
                return { status: 'error', message: updateResult.message };
            }

            // Odśwież cache
            userDataCache = { ...userData, appData: updateResult.appData, token: effectiveToken };
            return { status: 'success', message: `Dodano ${value} do ${appId}.${key}`, appData: updateResult.appData };
        }
    } catch (error) {
        console.error('Błąd w addData:', error);
        return { status: 'error', message: 'Wystąpił błąd podczas dodawania danych' };
    }
}
function logout() {
    localStorage.removeItem('authToken');
    userDataCache = null;
    gamesCache = null;
    window.games = null;
    window.location.href = '../account/index.html';
}

setInterval(syncUserData, SYNC_INTERVAL);