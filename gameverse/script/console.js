const consoleOutput = document.getElementById('consoleOutput');
const consoleInput = document.getElementById('consoleInput');
let commandHistory = [];
let historyIndex = -1;
let variables = {};

// Funkcja logowania
function logToConsole(text, type = 'normal') {
    const timestamp = new Date().toLocaleTimeString();
    const className = type === 'error' ? 'error' : 
                      type === 'info' ? 'info' : 
                      type === 'warning' ? 'warning' : 
                      type === 'browser' ? 'browser' : '';
    consoleOutput.innerHTML += `<span class="${className}">[${timestamp}] ${text}</span><br>`;
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

// Przechwytywanie komunikatów z konsoli przeglądarkowej
(function() {
    const originalConsole = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info,
        debug: console.debug
    };

    console.log = (...args) => { logToConsole(`LOG: ${args.join(' ')}`, 'browser'); originalConsole.log.apply(console, args); };
    console.error = (...args) => { logToConsole(`ERROR: ${args.join(' ')}`, 'error'); originalConsole.error.apply(console, args); };
    console.warn = (...args) => { logToConsole(`WARN: ${args.join(' ')}`, 'warning'); originalConsole.warn.apply(console, args); };
    console.info = (...args) => { logToConsole(`INFO: ${args.join(' ')}`, 'info'); originalConsole.info.apply(console, args); };
    console.debug = (...args) => { logToConsole(`DEBUG: ${args.join(' ')}`, 'browser'); originalConsole.debug.apply(console, args); };

    window.onerror = (message, source, lineno, colno) => {
        logToConsole(`GLOBAL ERROR: ${message} (at ${source}:${lineno}:${colno})`, 'error');
        return false;
    };

    window.onunhandledrejection = (event) => {
        logToConsole(`UNHANDLED PROMISE REJECTION: ${event.reason}`, 'error');
    };
})();

// Obsługa wprowadzania
consoleInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const command = consoleInput.value.trim();
        if (command) {
            commandHistory.unshift(command);
            historyIndex = -1;
            logToConsole(command);
            processCommand(command);
            consoleInput.value = '';
        } else {
            logToConsole('Pusta komenda - wpisz coś!', 'warning');
        }
    }
});

// Historia komend
consoleInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && historyIndex < commandHistory.length - 1) {
        historyIndex++;
        consoleInput.value = commandHistory[historyIndex];
    } else if (e.key === 'ArrowDown' && historyIndex >= 0) {
        historyIndex--;
        consoleInput.value = historyIndex === -1 ? '' : commandHistory[historyIndex];
    }
});

// Przetwarzanie komend
function processCommand(command) {
    const args = command.split(' ').filter(arg => arg !== '');
    const cmd = args[0].toLowerCase();
    args.shift();

    const builtInCommands = [
        'clear', 'hello', 'date', 'time', 'echo', 'help', 'calc', 'set', 'get', 'random', 
        'reverse', 'upper', 'lower', 'length', 'timer', 'info', 'history', 'js', 'eval', 'dir',
        'store', 'fetch', 'alert', 'count', 'repeat', 'json', 'reload', 'title', 'cookie', 
        'beep', 'wait', 'color', 'size', 'open', 'close', 'prompt', 'confirm', 'copy', 
        'paste', 'speak', 'stop', 'navigate', 'screen', 'memory'
    ];

    if (builtInCommands.includes(cmd)) {
        switch (cmd) {
            // Podstawowe
            case 'clear': clearConsole(); break;
            case 'hello': logToConsole(`Witaj, ${localStorage.getItem('perunUsername')}!`, 'info'); break;
            case 'date': logToConsole(new Date().toLocaleString(), 'info'); break;
            case 'time': logToConsole(new Date().toLocaleTimeString(), 'info'); break;
            case 'echo': logToConsole(args.join(' ') || 'Brak tekstu', 'info'); break;

            // Informacje i pomoc
            case 'help': 
                logToConsole('=== Lista komend ===', 'info');
                logToConsole('Podstawowe: clear, hello [imię], date, time, echo [tekst]', 'info');
                logToConsole('Zmienne: set [nazwa] [wartość], get [nazwa]', 'info');
                logToConsole('Matematyka: calc [wyrażenie], random [min] [max]', 'info');
                logToConsole('Tekst: reverse [tekst], upper [tekst], lower [tekst], length [tekst]', 'info');
                logToConsole('Czas: timer [sekundy], wait [ms]', 'info');
                logToConsole('Informacje: info, history, dir', 'info');
                logToConsole('JavaScript: js [kod], eval [kod]', 'info');
                logToConsole('Przeglądarka: fetch [url], alert [tekst], reload, title [tekst], cookie [key] [value], open [url], close, navigate [url]', 'info');
                logToConsole('Interakcja: prompt [pytanie], confirm [pytanie], copy [tekst], paste, speak [tekst], stop', 'info');
                logToConsole('Wygląd: color [hex], size [px]', 'info');
                logToConsole('System: screen, memory', 'info');
                logToConsole('Inne: count [n], repeat [n] [tekst], json [obiekt], beep', 'info');
                logToConsole('Dowolny kod JS jest również obsługiwany!', 'info');
                break;
            case 'info': logToConsole(`Wersja: 1.0 | Komend w historii: ${commandHistory.length} | Zmiennych: ${Object.keys(variables).length}`, 'info'); break;
            case 'history': 
                if (commandHistory.length === 0) logToConsole('Historia jest pusta', 'info');
                else commandHistory.forEach((cmd, i) => logToConsole(`${i + 1}. ${cmd}`, 'info')); 
                break;

            // Zmienne
            case 'set': 
                if (args.length < 2) logToConsole('Użycie: set [nazwa] [wartość]', 'error');
                else { variables[args[0]] = args.slice(1).join(' '); logToConsole(`Ustawiono ${args[0]} = ${variables[args[0]]}`, 'info'); }
                break;
            case 'get': 
                if (!args[0] || !(args[0] in variables)) logToConsole('Zmienna nie istnieje', 'error');
                else logToConsole(`${args[0]} = ${variables[args[0]]}`, 'info'); 
                break;

            // Matematyka
            case 'calc': 
                try { const result = eval(args.join(' ')); logToConsole(`Wynik: ${result}`, 'info'); } 
                catch (e) { logToConsole(`Błąd: ${e.message}`, 'error'); } 
                break;
            case 'random': 
                const min = parseInt(args[0]) || 0;
                const max = parseInt(args[1]) || 100;
                logToConsole(`Losowa liczba: ${Math.floor(Math.random() * (max - min + 1)) + min}`, 'info'); 
                break;

            // Tekst
            case 'reverse': logToConsole(args.join(' ').split('').reverse().join('') || 'Brak tekstu', 'info'); break;
            case 'upper': logToConsole(args.join(' ').toUpperCase() || 'Brak tekstu', 'info'); break;
            case 'lower': logToConsole(args.join(' ').toLowerCase() || 'Brak tekstu', 'info'); break;
            case 'length': logToConsole(`Długość: ${(args.join(' ') || '').length}`, 'info'); break;

            // Czas
            case 'timer': 
                const seconds = parseInt(args[0]);
                if (isNaN(seconds) || seconds <= 0) logToConsole('Podaj poprawną liczbę sekund', 'error');
                else { logToConsole(`Timer ustawiony na ${seconds} sekund`, 'info'); setTimeout(() => logToConsole('Timer zakończony!', 'warning'), seconds * 1000); }
                break;
            case 'wait': 
                const ms = parseInt(args[0]) || 1000;
                logToConsole(`Czekam ${ms} ms...`, 'info');
                setTimeout(() => logToConsole('Czekanie zakończone!', 'info'), ms); 
                break;

            // JavaScript
            case 'js': 
                try { const result = new Function(args.join(' '))(); logToConsole(`Wynik: ${result !== undefined ? result : 'Wykonano'}`, 'info'); } 
                catch (e) { logToConsole(`Błąd JS: ${e.message}`, 'error'); } 
                break;
            case 'eval': 
                try { const result = eval(args.join(' ')); logToConsole(`Wynik: ${result !== undefined ? result : 'Wykonano'}`, 'info'); } 
                catch (e) { logToConsole(`Błąd eval: ${e.message}`, 'error'); } 
                break;
            case 'dir': logToConsole(JSON.stringify(window, null, 2), 'info'); break;

            // Przeglądarka
            case 'fetch': 
                if (!args[0]) logToConsole('Użycie: fetch [url]', 'error');
                else {
                    logToConsole(`Wysyłanie zapytania do ${args[0]}...`, 'info');
                    fetch(args[0])
                        .then(res => res.text())
                        .then(data => logToConsole(`Odpowiedź: ${data.slice(0, 100)}...`, 'info'))
                        .catch(err => logToConsole(`Błąd fetch: ${err.message}`, 'error'));
                }
                break;
            case 'alert': alert(args.join(' ') || 'Brak tekstu'); logToConsole('Wyświetlono alert', 'info'); break;
            case 'reload': location.reload(); logToConsole('Przeładowanie strony...', 'info'); break;
            case 'title': document.title = args.join(' ') || 'Perun Studios Gameverse'; logToConsole(`Ustawiono tytuł: ${document.title}`, 'info'); break;
            case 'cookie': 
                if (args.length < 2) logToConsole('Użycie: cookie [key] [value]', 'error');
                else { document.cookie = `${args[0]}=${args.slice(1).join(' ')}`; logToConsole(`Ustawiono cookie: ${args[0]} = ${args.slice(1).join(' ')}`, 'info'); }
                break;
            case 'open': 
                const win = window.open(args[0] || 'about:blank'); 
                logToConsole(`Otwarto okno: ${args[0] || 'puste'}`, 'info'); 
                break;
            case 'close': window.close(); logToConsole('Zamykanie okna...', 'info'); break;
            case 'navigate': window.location.href = args[0] || '/'; logToConsole(`Nawigacja do: ${args[0] || 'strona główna'}`, 'info'); break;

            // Interakcja
            case 'prompt': 
                const answer = prompt(args.join(' ') || 'Podaj tekst'); 
                logToConsole(`Odpowiedź: ${answer !== null ? answer : 'Anulowano'}`, 'info'); 
                break;
            case 'confirm': 
                const confirmed = confirm(args.join(' ') || 'Potwierdź'); 
                logToConsole(`Wynik: ${confirmed ? 'Tak' : 'Nie'}`, 'info'); 
                break;
            case 'copy': 
                navigator.clipboard.writeText(args.join(' ') || '').then(() => logToConsole('Skopiowano do schowka', 'info')); 
                break;
            case 'paste': 
                navigator.clipboard.readText().then(text => logToConsole(`Wklejono: ${text}`, 'info')); 
                break;
            case 'speak': 
                const utterance = new SpeechSynthesisUtterance(args.join(' ') || 'Cześć'); 
                speechSynthesis.speak(utterance); 
                logToConsole('Mówię...', 'info'); 
                break;
            case 'stop': 
                speechSynthesis.cancel(); 
                logToConsole('Zatrzymano mowę', 'info'); 
                break;

            // Wygląd
            case 'color': 
                consoleOutput.style.color = args[0] || '#00ff00'; 
                logToConsole(`Ustawiono kolor tekstu: ${args[0] || '#00ff00'}`, 'info'); 
                break;
            case 'size': 
                consoleOutput.style.fontSize = `${args[0] || 16}px`; 
                logToConsole(`Ustawiono rozmiar tekstu: ${args[0] || 16}px`, 'info'); 
                break;

            // System
            case 'screen': 
                logToConsole(`Rozdzielczość: ${screen.width}x${screen.height}`, 'info'); 
                break;
            case 'memory': 
                if (performance.memory) logToConsole(`Użycie pamięci: ${Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)} MB`, 'info'); 
                else logToConsole('Informacje o pamięci niedostępne', 'warning'); 
                break;

            // Inne
            case 'count': 
                const count = parseInt(args[0]) || 10; 
                for (let i = 1; i <= count; i++) logToConsole(`${i}`, 'info'); 
                break;
            case 'repeat': 
                const times = parseInt(args[0]) || 1; 
                const text = args.slice(1).join(' ') || 'Powtórzenie'; 
                for (let i = 0; i < times; i++) logToConsole(text, 'info'); 
                break;
            case 'json': 
                try { const obj = JSON.parse(args.join(' ')); logToConsole(JSON.stringify(obj, null, 2), 'info'); } 
                catch (e) { logToConsole(`Błąd JSON: ${e.message}`, 'error'); } 
                break;
            case 'beep': 
                const audio = new Audio('https://www.soundjay.com/buttons/beep-01a.mp3');
                audio.play()
                    .then(() => logToConsole('Beep!', 'info'))
                    .catch(err => logToConsole(`Błąd odtwarzania: ${err.message}`, 'error')); 
                break;
        }
    } else {
        try { const result = eval(command); logToConsole(`Wynik: ${result !== undefined ? result : 'Wykonano'}`, 'info'); } 
        catch (e) { logToConsole(`Błąd JS: ${e.message}`, 'error'); }
    }
}

// Czyszczenie konsoli
function clearConsole() {
    consoleOutput.innerHTML = '';
    logToConsole('Konsola wyczyszczona', 'info');
}

// Inicjalizacja
logToConsole('Konsola uruchomiona. Wpisz "help" po listę komend lub użyj dowolnego kodu JS.', 'info');
console.log('Test logowania z konsoli przeglądarkowej');
