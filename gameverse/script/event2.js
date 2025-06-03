function addButtonToStorage(buttonNumber) {
    let buttonArray = JSON.parse(localStorage.getItem('easter2025Buttons')) || [];

    if (!buttonArray.includes(buttonNumber)) {
        buttonArray.push(buttonNumber);
        localStorage.setItem('easter2025Buttons', JSON.stringify(buttonArray));
    }
    checkButtonsVisibility();
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

// Inicjalizacja paska postępu przy załadowaniu strony
document.addEventListener('DOMContentLoaded', () => {
    checkButtonsVisibility();
});

checkButtonsVisibility();
