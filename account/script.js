let SCRIPT_URL = '';

fetch('https://suspicioyt.github.io/perunverse/config/backend_url.txt')
  .then(response => {
    if (!response.ok) throw new Error('Nie udało się pobrać scripturl.txt (status: ' + response.status + ')');
    return response.text();
  })
  .then(text => {
    SCRIPT_URL = text.trim();
    console.log('SCRIPT_URL załadowany pomyślnie:', SCRIPT_URL);
    // Po załadowaniu URL-a uruchamiamy inicjalizację strony
    initPage();
  })
  .catch(err => {
    console.error('Błąd podczas ładowania SCRIPT_URL:', err);
    alert('Błąd ładowania konfiguracji serwera. Sprawdź konsolę (F12) po szczegóły.');
  });

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));
    document.getElementById(tabName).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelectorAll('.error').forEach(error => error.classList.remove('show'));
}

function uuidv4() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

function getRedirectUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('redirect') || '../index.html';
}

function validateEmail(email) {
    if (!email) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return re.test(password);
}

function validateUsername(username) {
    if (!username) return false;
    if (username.length > 20) return false;
    if (username.includes(' ')) return false;
    return true;
}

function validateGender(gender) {
    return ['M', 'F', 'O'].includes(gender);
}

function populateYearSelect() {
    const select = document.getElementById('yearSelect');
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= 1900; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
    }
}

function openYearModal() {
    document.getElementById('yearModal').style.display = 'flex';
}

function closeYearModal() {
    document.getElementById('yearModal').style.display = 'none';
}

function selectYear() {
    const selectedYear = document.getElementById('yearSelect').value;
    document.getElementById('birthYearDisplay').value = selectedYear;
    document.getElementById('birthYear').value = selectedYear;
    closeYearModal();
}

function openGenderModal() {
    document.getElementById('genderModal').style.display = 'flex';
}

function closeGenderModal() {
    document.getElementById('genderModal').style.display = 'none';
}

function selectGender() {
    const selectedGender = document.getElementById('genderSelect').value;
    document.getElementById('genderDisplay').value = selectedGender === 'M' ? 'Mężczyzna' : selectedGender === 'F' ? 'Kobieta' : 'Inna';
    document.getElementById('gender').value = selectedGender;
    closeGenderModal();
}

function toggleButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    const buttonText = button.querySelector('.button-text');
    const spinner = button.querySelector('.spinner');
    button.disabled = isLoading;
    buttonText.style.display = isLoading ? 'none' : 'inline';
    spinner.style.display = isLoading ? 'inline-block' : 'none';
}

async function login() {
    const identifier = document.getElementById('loginIdentifier').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorMessage = document.getElementById('loginError');
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    if (!identifier) {
        errorMessage.textContent = 'Wprowadź nazwę użytkownika lub email';
        errorMessage.classList.add('show');
        return;
    }
    if (!password) {
        errorMessage.textContent = 'Wprowadź hasło';
        errorMessage.classList.add('show');
        return;
    }

    toggleButtonLoading('loginButton', true);

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'login',
                identifier,
                password
            }),
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) throw new Error(`Błąd HTTP! Status: ${response.status}`);
        const data = await response.json();
        console.log('login response:', data);

        toggleButtonLoading('loginButton', false);
        if (data.status === 'success') {
            const token = data.token;
            const targetUrl = getRedirectUrl();
            
            const url = new URL(targetUrl, window.location.origin);
            url.searchParams.set('token', token);

            console.log('Logowanie udane, przekierowanie do innej domeny...');
            window.location.href = url.toString();
        } else {
            errorMessage.textContent = data.message || 'Błąd logowania';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        toggleButtonLoading('loginButton', false);
        errorMessage.textContent = 'Błąd serwera: Spróbuj ponownie później';
        errorMessage.classList.add('show');
        console.error('Błąd logowania:', error);
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const birthYear = document.getElementById('birthYear').value;
    const gender = document.getElementById('gender').value;
    const errorMessage = document.getElementById('registerError');
    errorMessage.textContent = '';
    errorMessage.classList.remove('show');

    if (!validateUsername(username)) {
        errorMessage.textContent = 'Nazwa użytkownika musi mieć do 20 znaków i nie może zawierać spacji';
        errorMessage.classList.add('show');
        return;
    }
    if (!validateEmail(email)) {
        errorMessage.textContent = 'Nieprawidłowy format emaila';
        errorMessage.classList.add('show');
        return;
    }
    if (!validatePassword(password)) {
        errorMessage.textContent = 'Hasło musi mieć co najmniej 8 znaków, dużą i małą literę, cyfrę oraz znak specjalny';
        errorMessage.classList.add('show');
        return;
    }
    if (password !== confirmPassword) {
        errorMessage.textContent = 'Hasła nie są zgodne';
        errorMessage.classList.add('show');
        return;
    }
    if (!birthYear || isNaN(birthYear) || birthYear < 1900 || birthYear > new Date().getFullYear()) {
        errorMessage.textContent = 'Wybierz prawidłowy rok urodzenia (1900–' + new Date().getFullYear() + ')';
        errorMessage.classList.add('show');
        return;
    }
    if (!validateGender(gender)) {
        errorMessage.textContent = 'Wybierz płeć (Mężczyzna, Kobieta lub Inna)';
        errorMessage.classList.add('show');
        return;
    }

    toggleButtonLoading('registerButton', true);

    const appData = {
        profile: {
            username,
            badges: {},
            uuid: uuidv4(),
            email: email || '',
            birthYear: parseInt(birthYear),
            gender,
            money: 0,
            joined: new Date().toISOString()
        }
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({
                action: 'register',
                username,
                password,
                birthYear,
                gender,
                email: email || '',
                appData: JSON.stringify(appData)
            }),
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) throw new Error(`Błąd HTTP! Status: ${response.status}`);
        const data = await response.json();
        console.log('register response:', data);

        toggleButtonLoading('registerButton', false);
        if (data.status === 'success') {
            const token = data.token;
            const targetUrl = getRedirectUrl();
            
            const url = new URL(targetUrl, window.location.origin);
            url.searchParams.set('token', token);

            console.log('Logowanie udane, przekierowanie do innej domeny...');
            window.location.href = url.toString();
        } else {
            errorMessage.textContent = data.message || 'Błąd rejestracji';
            errorMessage.classList.add('show');
        }
    } catch (error) {
        toggleButtonLoading('registerButton', false);
        errorMessage.textContent = 'Błąd serwera: Spróbuj ponownie później';
        errorMessage.classList.add('show');
        console.error('Błąd rejestracji:', error);
    }
}

async function loadUserData() {
    const token = localStorage.getItem('authToken');
    const userData = sessionStorage.getItem('userData');

    console.log('loadUserData - token:', token);
    console.log('loadUserData - userData:', userData);

    if (!token) {
        console.log('Brak tokena - wyświetlanie loginModal');
        document.getElementById('loginModal').style.display = 'flex';
        showTab('login');
        return false;
    }

    try {
        console.log('Weryfikacja tokena:', token);
        const response = await fetch(`${SCRIPT_URL}?action=verify&token=${encodeURIComponent(token)}`, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit'
        });

        if (!response.ok) throw new Error(`Błąd HTTP! Status: ${response.status}`);
        const data = await response.json();
        console.log('verify response:', data);

        if (data.status === 'success') {
            sessionStorage.setItem('userData', JSON.stringify(data.appData || {}));
            window.location.href = getRedirectUrl();
            return true;
        } else {
            console.log('Nieprawidłowy token - wyświetlanie loginModal');
            document.getElementById('loginModal').style.display = 'flex';
            showTab('login');
            return false;
        }
    } catch (error) {
        console.error('Błąd weryfikacji tokena:', error);
        document.getElementById('loginModal').style.display = 'flex';
        showTab('login');
        return false;
    }
}

window.onload = () => {
    populateYearSelect();
    loadUserData();
};