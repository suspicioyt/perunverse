const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyJjpTiVWKCSuJOCXLontvI0l34AbgdtAIlZVL3cbSkjMc7QWaCZ04ZnqKRRQYOyEoh/exec';

// Funkcja przełączania zakładek
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
    document.querySelectorAll('.error').forEach(error => error.classList.remove('show'));
}

// Pobieranie URL przekierowania
function getRedirectUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('redirect') || '../index.html';
}

// Walidacja emaila
function validateEmail(email) {
    if (!email) return true; // Email is optional
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Walidacja hasła
function validatePassword(password) {
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return re.test(password);
}

// Walidacja nazwy użytkownika
function validateUsername(username) {
    if (!username) return false;
    if (username.length > 20) return false;
    if (username.includes(' ')) return false;
    return true;
}

// Wypełnianie modala latami
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

// Otwieranie modala
function openYearModal() {
    document.getElementById('yearModal').style.display = 'flex';
}

// Zamykanie modala
function closeYearModal() {
    document.getElementById('yearModal').style.display = 'none';
}

// Wybór roku z modala
function selectYear() {
    const selectedYear = document.getElementById('yearSelect').value;
    document.getElementById('birthYearDisplay').value = selectedYear;
    document.getElementById('birthYear').value = selectedYear;
    closeYearModal();
}

// Funkcja logowania
function login() {
    const identifier = document.getElementById('loginIdentifier').value;
    const password = document.getElementById('loginPassword').value;
    const errorMessage = document.getElementById('loginError');
    errorMessage.textContent = ''; // Reset komunikatu
    errorMessage.classList.remove('show');

    if (!identifier) {
        errorMessage.textContent = 'Wprowadź nazwę użytkownika lub email';
        errorMessage.classList.add('show');
        return;
    }

    fetch(`${SCRIPT_URL}?action=login&identifier=${encodeURIComponent(identifier)}&password=${encodeURIComponent(password)}`, {
        method: 'GET',
        mode: 'cors'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                localStorage.setItem('authToken', data.token);
                window.location.href = getRedirectUrl();
            } else {
                errorMessage.textContent = data.message || 'Błąd logowania';
                errorMessage.classList.add('show');
            }
        })
        .catch(error => {
            errorMessage.textContent = 'Błąd serwera: ' + error.message;
            errorMessage.classList.add('show');
        });
}

// Funkcja rejestracji
function register() {
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const birthYear = document.getElementById('birthYear').value;
    const errorMessage = document.getElementById('registerError');
    errorMessage.textContent = ''; // Reset komunikatu
    errorMessage.classList.remove('show');

    // Walidacja
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

    const params = `action=register&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&birthYear=${birthYear}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
    
    fetch(`${SCRIPT_URL}?${params}`, {
        method: 'GET',
        mode: 'cors'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                localStorage.setItem('authToken', data.token);
                window.location.href = getRedirectUrl();
            } else {
                errorMessage.textContent = data.message || 'Błąd rejestracji';
                errorMessage.classList.add('show');
            }
        })
        .catch(error => {
            errorMessage.textContent = 'Błąd serwera: ' + error.message;
            errorMessage.classList.add('show');
        });
}

// Inicjalizacja modala
window.onload = populateYearSelect;