const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxsblqpKQJ4Y6kXHq2TIwSlz_--i84IKjCCthyaS7IkVeVUijsMywdaCi1snnrz4ESu/exec';
const SYNC_INTERVAL = 10000; // 10 seconds
const MAX_RETRIES = 3; // Max retries for server requests

let userDataCache = null;
let gamesCache = null;
let isSyncing = false;

async function loadUserData(retryCount = 0) {
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
            if (retryCount < MAX_RETRIES) {
                console.log(`Ponawianie próby ${retryCount + 1}/${MAX_RETRIES}...`);
                return await loadUserData(retryCount + 1);
            }
            // Fallback to cached user data if available
            const cachedData = localStorage.getItem('userDataCache');
            if (cachedData) {
                userDataCache = JSON.parse(cachedData);
                console.log('Użyto danych z localStorage:', userDataCache);
                showEvent('Serwer niedostępny, używam danych z pamięci podręcznej.');
                return true;
            }
            return false;
        }
        const data = await response.json();
        console.log('Odpowiedź z serwera:', data);

        if (data.status === 'success') {
            userDataCache = { ...data, token };
            localStorage.setItem('userDataCache', JSON.stringify(userDataCache)); // Cache user data
            console.log('Dane użytkownika załadowane:', userDataCache);
            return true;
        } else if (data.message === 'Nieprawidłowy token') {
            console.error('Błąd weryfikacji tokena:', data.message);
            localStorage.removeItem('authToken');
            localStorage.removeItem('userDataCache');
            window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            return false;
        } else {
            console.error('Błąd serwera:', data.message);
            if (retryCount < MAX_RETRIES) {
                console.log(`Ponawianie próby ${retryCount + 1}/${MAX_RETRIES}...`);
                return await loadUserData(retryCount + 1);
            }
            // Fallback to cached user data
            const cachedData = localStorage.getItem('userDataCache');
            if (cachedData) {
                userDataCache = JSON.parse(cachedData);
                console.log('Użyto danych z localStorage:', userDataCache);
                showEvent('Serwer niedostępny, używam danych z pamięci podręcznej.');
                return true;
            }
            return false;
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych użytkownika:', error);
        if (retryCount < MAX_RETRIES) {
            console.log(`Ponawianie próby ${retryCount + 1}/${MAX_RETRIES}...`);
            return await loadUserData(retryCount + 1);
        }
        // Fallback to cached user data
        const cachedData = localStorage.getItem('userDataCache');
        if (cachedData) {
            userDataCache = JSON.parse(cachedData);
            console.log('Użyto danych z localStorage:', userDataCache);
            showEvent('Serwer niedostępny, używam danych z pamięci podręcznej.');
            return true;
        }
        window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html? Bong=' + encodeURIComponent(window.location.href);
        return false;
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
            const cachedData = localStorage.getItem('userDataCache');
            if (cachedData) {
                userDataCache = JSON.parse(cachedData);
                console.log('Synchronizacja nieudana, używam danych z pamięci podręcznej.');
                showEvent('Nie można zsynchronizować danych, używam pamięci podręcznej.');
            } else {
                userDataCache = null;
                window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            }
        } else {
            const userData = await userResponse.json();
            console.log('Synchronizacja - odpowiedź z serwera (użytkownik):', userData);
            if (userData.status === 'success') {
                userDataCache = { ...userData, token };
                localStorage.setItem('userDataCache', JSON.stringify(userDataCache)); // Update cache
                console.log('Dane użytkownika zsynchronizowane:', userDataCache);
            } else if (userData.message === 'Nieprawidłowy token') {
                console.error('Błąd weryfikacji tokena:', userData.message);
                userDataCache = null;
                localStorage.removeItem('authToken');
                localStorage.removeItem('userDataCache');
                window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            } else {
                console.error('Błąd serwera:', userData.message);
                const cachedData = localStorage.getItem('userDataCache');
                if (cachedData) {
                    userDataCache = JSON.parse(cachedData);
                    console.log('Synchronizacja nieudana, używam danych z pamięci podręcznej.');
                    showEvent('Nie można zsynchronizować danych, używam pamięci podręcznej.');
                } else {
                    userDataCache = null;
                    window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
                }
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
        const cachedData = localStorage.getItem('userDataCache');
        if (cachedData) {
            userDataCache = JSON.parse(cachedData);
            console.log('Synchronizacja nieudana, używam danych z pamięci podręcznej.');
            showEvent('Nie można zsynchronizować danych, używam pamięci podręcznej.');
        } else {
            userDataCache = null;
            window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
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
            showEvent('Błąd zapisywania danych, spróbuj ponownie.');
            return;
        }
        console.log(`Zaktualizowano ${key} w arkuszu`);
        userDataCache = null; // Clear cache to force reload
    } catch (error) {
        console.error(`Błąd aktualizacji ${key} w arkuszu:`, error);
        showEvent('Błąd zapisywania danych, używam pamięci podręcznej.');
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

async function addData(token, appId, key, value) {
    try {
        const effectiveToken = token === 'current' ? localStorage.getItem('authToken') : token;
        if (!effectiveToken) {
            console.error('Brak tokena uwierzytelnienia');
            window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            return { status: 'error', message: 'Brak tokena uwierzytelnienia' };
        }

        const response = await fetch(`${SCRIPT_URL}?action=verify&token=${effectiveToken}`, {
            method: 'GET',
            mode: 'cors'
        });
        const userData = await response.json();

        if (userData.status !== 'success') {
            console.error('Błąd weryfikacji tokena:', userData.message);
            if (userData.message === 'Nieprawidłowy token') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userDataCache');
                window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html?redirect=' + encodeURIComponent(window.location.href);
            }
            return { status: 'error', message: userData.message };
        }

        if (appId === 'sheet') {
            const columnMap = {
                'username': 2,
                'email': 3,
                'birthYear': 5,
                'isVerified': 6,
                'isPremium': 7,
                'token': 8,
                'gender': 10
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
                showEvent('Błąd zapisywania danych gry, używam pamięci podręcznej.');
                return { status: 'error', message: updateResult.message };
            }

            userDataCache = { ...userData, appData: updateResult.appData, token: effectiveToken };
            localStorage.setItem('userDataCache', JSON.stringify(userDataCache)); // Update cache
            return { status: 'success', message: `Dodano ${value} do ${appId}.${key}`, appData: updateResult.appData };
        }
    } catch (error) {
        console.error('Błąd w addData:', error);
        showEvent('Błąd zapisywania danych gry, używam pamięci podręcznej.');
        return { status: 'error', message: 'Wystąpił błąd podczas dodawania danych' };
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userDataCache');
    userDataCache = null;
    gamesCache = null;
    window.games = null;
    window.location.href = 'https://suspicioyt.github.io/perunverse/account/index.html';
}

setInterval(syncUserData, SYNC_INTERVAL);