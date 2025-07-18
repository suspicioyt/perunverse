const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxmlSQtCHeCqIwUA527F2IZJ-l4E11lFkNjS19kysW-nsReK7ivNCXF1OmQP6t53nK5/exec'; // Wstaw URL aplikacji webowej Google Apps Script
const APP_ID = 'gameverse'; // Unikalny identyfikator aplikacji
function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '../../../account/index.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    fetch(`${SCRIPT_URL}?action=verify&token=${token}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {

            } else {
                localStorage.removeItem('authToken');
                window.location.href = '../../../account/index.html?redirect=' + encodeURIComponent(window.location.href);
            }
        })
        .catch(error => {
            console.error('Błąd:', error);
            localStorage.removeItem('authToken');
            window.location.href = '../../../account/index.html?redirect=' + encodeURIComponent(window.location.href);
        });
}
function updateAppData() {
    const token = localStorage.getItem('authToken');
    const newData = document.getElementById('newAppData').value;
    if (!newData) {
        alert('Proszę wpisać dane aplikacji');
        return;
    }
    try {
        JSON.parse(newData); // Sprawdzenie poprawności JSON
        fetch(`${SCRIPT_URL}?action=updateAppData&token=${token}&appId=${APP_ID}&data=${encodeURIComponent(newData)}`, {
            method: 'POST'
        })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    document.getElementById('appDataContent').textContent = JSON.stringify(data.appData[APP_ID], null, 2);
                    document.getElementById('newAppData').value = '';
                } else {
                    alert('Błąd aktualizacji danych: ' + (data.message || 'Nieznany błąd'));
                }
            })
            .catch(error => {
                console.error('Błąd:', error);
                alert('Błąd serwera');
            });
    } catch (e) {
        alert('Nieprawidłowy format JSON');
    }
}
window.onload = checkLoginStatus();