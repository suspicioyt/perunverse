// function addButtonToStorage(buttonNumber) {
//     let buttonArray = JSON.parse(localStorage.getItem('easter2025Buttons')) || [];

//     if (!buttonArray.includes(buttonNumber)) {
//         buttonArray.push(buttonNumber);

//         localStorage.setItem('easter2025Buttons', JSON.stringify(buttonArray));
//     }
//     checkButtonsVisibility();
// }

// function checkButtonsVisibility() {
//     let buttonArray = JSON.parse(localStorage.getItem('easter2025Buttons')) || [];

//     buttonArray.forEach(buttonNumber => {
//         const button = document.getElementById('addButton' + buttonNumber);
//         if (button) {
//             button.classList.add('hidden');
//         }
//     });
// }
// checkButtonsVisibility();
// gameBox.setAttribute('gameId',game.id)

function addButtonToStorage(buttonNumber) {
    let buttonArray = JSON.parse(localStorage.getItem('easter2025Buttons')) || [];

    if (!buttonArray.includes(buttonNumber)) {
        buttonArray.push(buttonNumber);
        localStorage.setItem('easter2025Buttons', JSON.stringify(buttonArray));
    }
    checkButtonsVisibility();
    updateProgressBar();
}

document.querySelectorAll('.add-button').forEach(button => {
    button.onclick = function() {
        let buttonArray = JSON.parse(localStorage.getItem('easter2025Buttons')) || [];
        const buttonId = this.getAttribute('buttonId');

        if (!buttonArray.includes(buttonId)) {
            buttonArray.push(buttonId);
            localStorage.setItem('easter2025Buttons', JSON.stringify(buttonArray));
        }
        checkButtonsVisibility();
        updateProgressBar();
    };
});

function checkButtonsVisibility() {
    let buttonArray = JSON.parse(localStorage.getItem('easter2025Buttons')) || [];
    document.querySelectorAll('.add-button').forEach(button => {
        const buttonId = button.getAttribute('buttonId');
        if (buttonArray.includes(buttonId)) {
            button.classList.add('hidden');
        }
    });
}

function updateProgressBar(progressContainer) {
    // Pobierz atrybuty z kontenera
    const storageKey = progressContainer.dataset.storageKey;
    const totalButtons = parseInt(progressContainer.dataset.totalButtons, 10);

    // Pobierz dane z localStorage
    let storedValue = JSON.parse(localStorage.getItem(storageKey));

    // Oblicz postęp w zależności od typu wartości
    let currentProgress;
    if (Array.isArray(storedValue)) {
        currentProgress = storedValue.length; // Liczba elementów w tablicy
    } else if (typeof storedValue === 'number') {
        currentProgress = storedValue; // Pojedyncza wartość liczbowa
    } else {
        currentProgress = 0; // Domyślnie 0, jeśli brak danych lub nieprawidłowy typ
    }

    // Oblicz procent postępu
    const progressPercentage = totalButtons > 0 ? (currentProgress / totalButtons) * 100 : 0;

    // Znajdź lub utwórz pasek postępu
    let progressBar = progressContainer.querySelector('.event-progress-bar');
    if (!progressBar) {
        progressBar = document.createElement('div');
        progressBar.classList.add('event-progress-bar');
        progressContainer.appendChild(progressBar);
    }

    // Aktualizuj styl i tekst paska postępu
    progressBar.style.width = `${progressPercentage}%`;
    progressBar.textContent = `${currentProgress}/${totalButtons}`;

    // Atrybuty dostępności
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', currentProgress);
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', totalButtons);
    progressBar.setAttribute('aria-label', `Postęp: ${currentProgress} z ${totalButtons} elementów zebrano`);
}

// Inicjalizacja wszystkich pasków postępu przy załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    // Znajdź wszystkie kontenery pasków postępu
    const progressContainers = document.querySelectorAll('.event-progress-container');

    // Zaktualizuj każdy pasek postępu
    progressContainers.forEach(container => {
        updateProgressBar(container);
    });

    // Wywołaj funkcję do sprawdzania widoczności przycisków (jeśli istnieje)
    if (typeof checkButtonsVisibility === 'function') {
        checkButtonsVisibility();
    }
});

checkButtonsVisibility();
//<button buttonId="1" class="add-button">🐰</button>
