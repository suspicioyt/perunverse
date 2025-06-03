let lastDate = "";
let replyingToMessageId = null;
let cachedMessages = [];
let sendingChecker = false;

let isFirstLoad = true;

const sessionId = localStorage.getItem("perunUUID");
const username = localStorage.getItem("perunUsername");

function sanitizeInput(input) {
    const div = document.createElement("div");
    div.textContent = input;
    return div.innerHTML;
}

let displayedActiveUsers = 0;
let lastServerActiveUsers = 0;
const STABILIZATION_DELAY = 5000;

let bannedWords = [];

async function fetchBannedWords() {
    try {
        const response = await fetch("https://suspicioyt.github.io/perungameverse/data/bannedWords.json");
        bannedWords = await response.json();
    } catch (error) {
        console.error("Błąd podczas pobierania zbanowanych słów:", error);
        bannedWords = ["kurwa", "chuj", "pierdol"];
    }
}

function levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i - 1] + 1,
                matrix[j - 1][i] + 1,
                matrix[j - 1][i - 1] + indicator
            );
        }
    }
    return matrix[b.length][a.length];
}

function replaceBannedWords(message) {
    const switches = JSON.parse(localStorage.getItem("settingSwitches")) || defaultSwitches;
    const filterEnabled = switches.find(s => s.switchId === "04")?.value || false;

    if (!filterEnabled || bannedWords.length === 1) return message;

    let words = message.split(/\s+/);
    words = words.map(word => {
        const lowerWord = word.toLowerCase();

        if (bannedWords.includes(lowerWord)) {
            return "[zbanowane]";
        }

        for (const banned of bannedWords) {
            const regex = new RegExp(`\\b${banned}(${banned.slice(-2)}*)\\b`, "i");
            if (regex.test(lowerWord)) {
                return "[zbanowane]";
            }

            const lengthDiff = Math.abs(lowerWord.length - banned.length);
            if (lengthDiff <= 2 && lowerWord.length >= 3) {
                const distance = levenshteinDistance(lowerWord, banned);
                if (distance <= 1) {
                    return "[zbanowane]";
                }
            }
        }

        return word;
    });

    return words.join(" ");
}

function sendHeartbeat() {
    fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            action: "heartbeat",
            sessionId,
            username
        }),
        mode: "no-cors"
    }).catch(error => console.error("Heartbeat error:", error));
}

function displayActiveUsers(activeUsers) {
    const activeUsersList = document.getElementById("activeUsers");

    activeUsersList.innerHTML = "";

    if (activeUsers && Array.isArray(activeUsers) && activeUsers.length > 0) {
        activeUsers.forEach(username => {
            if (username) {
                const li = document.createElement("li");
                li.classList.add("active-user");

                const usernameLabel = document.createElement("span");
                usernameLabel.textContent = username || "Nieznany";

                if (username === "SUSpicio") {
                    const verificationIcon = document.createElement("i");
                    verificationIcon.classList.add("fas", "fa-check-circle", "verified-icon");
                    verificationIcon.style.color = "#ffd700";
                    usernameLabel.appendChild(verificationIcon);
                }

                li.appendChild(usernameLabel);
                activeUsersList.appendChild(li);
            }
        });
    } else {
        console.log("Brak aktywnych użytkowników. activeUsers:", activeUsers);
        const li = document.createElement("li");
        li.textContent = "Brak aktywnych użytkowników";
        li.classList.add("active-user");
        activeUsersList.appendChild(li);
    }
}

function updateActiveUsersCount(serverCount, activeUsers) {
    lastServerActiveUsers = serverCount;
    const currentDisplayed = displayedActiveUsers;

    if (Math.abs(serverCount - currentDisplayed) > 1) {
        setTimeout(() => {
            if (lastServerActiveUsers === serverCount) {
                displayedActiveUsers = serverCount;
                document.getElementById("activeUsersCount").textContent = displayedActiveUsers;
                displayActiveUsers(activeUsers);
            }
        }, STABILIZATION_DELAY);
    } else {
        displayedActiveUsers = serverCount;
        document.getElementById("activeUsersCount").textContent = displayedActiveUsers;
        displayActiveUsers(activeUsers);
    }
}

function toggleEmojiPicker() {
    const picker = document.getElementById("emojiPicker");
    picker.style.display = picker.style.display === "block" ? "none" : "block";
}

function addEmoji(emoji) {
    const input = document.getElementById("chatMessage");
    input.value += emoji;
    toggleEmojiPicker();
    input.focus();
}

function scrollToBottom() {
    const chatWindow = document.getElementById("chat-window");
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

function scrollToTop() {
    const chatWindow = document.getElementById("chat-window");
    chatWindow.scrollTop = 0;
}

function scrollToMessage(messageId) {
    const chatList = document.getElementById("chatMessages");
    const messageElement = chatList.querySelector(`[data-id="${messageId}"]`);
    if (messageElement) {
        messageElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

async function sendChatMessage() {
    const username = localStorage.getItem("perunUsername") || "Anonim";
    const chatMessage = document.getElementById("chatMessage").value.trim();
    const sendButton = document.getElementById("sendButton");

    if (!chatMessage) {
        showError("Nie możesz wysłać pustej wiadomości!");
        return;
    }

    if (chatMessage === '/scrollToBottom') {
        scrollToBottom();
        document.getElementById("chatMessage").value = '';
        return;
    }
    if (chatMessage === '/scrollToTop') {
        scrollToTop();
        document.getElementById("chatMessage").value = '';
        return;
    }

    sendButton.disabled = true;
    sendButton.textContent = "Wysyłanie...";
    sendingChecker = true;

    const timestamp = new Date().toISOString();
    const data = {
        username,
        sessionId: localStorage.getItem('perunUUID'),
        message: sanitizeInput(chatMessage),
        timestamp,
        replyTo: replyingToMessageId,
        reactions: {},
        premium: sessionStorage.getItem("perunPremium") || false,
        verified: sessionStorage.getItem("perunVerified") || false
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            mode: "no-cors"
        });
        document.getElementById("chatMessage").value = "";
        replyingToMessageId = null;
        updateReplyingTo(null);
        await loadChatMessages();
    } catch (error) {
        console.error("Błąd wysyłania:", error);
        showError("Nie udało się wysłać wiadomości.");
    } finally {
        sendButton.disabled = false;
        sendButton.textContent = "Wyślij";
        sendingChecker = false;
        scrollToBottom();
    }
}

async function deleteMessage(messageId) {
    const username = localStorage.getItem("perunUsername") || "Anonim";
    const data = { action: "delete", messageId, username };

    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            mode: "no-cors"
        });
        await loadChatMessages();
    } catch (error) {
        console.error("Błąd usuwania:", error);
        showError("Nie udało się usunąć wiadomości.");
    }
}

async function editMessage(messageId) {
    const messageElement = document.querySelector(`[data-id="${messageId}"] .message-content`);
    const currentText = messageElement.textContent;
    const newText = prompt("Edytuj wiadomość:", currentText);

    if (newText === null || newText.trim() === "" || newText === currentText) return;

    const username = localStorage.getItem("perunUsername") || "Anonim";
    const data = {
        action: "edit",
        messageId,
        username,
        message: sanitizeInput(newText)
    };

    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            mode: "no-cors"
        });
        await loadChatMessages();
    } catch (error) {
        console.error("Błąd edycji:", error);
        showError("Nie udało się edytować wiadomości.");
    }
}

async function addReaction(messageId, reaction) {
    const username = localStorage.getItem("perunUsername") || "Anonim";
    const data = { action: "react", messageId, username, reaction };

    const message = cachedMessages.find(msg => msg.id === messageId);
    if (message && message.reactions && message.reactions[reaction] && message.reactions[reaction].includes(username)) {
        data.action = "unreact";
    }

    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            mode: "no-cors"
        });
        await loadChatMessages();
    } catch (error) {
        console.error("Błąd reakcji:", error);
        showError("Nie udało się zaktualizować reakcji.");
    }
}

async function loadChatMessages() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        const chatList = document.getElementById("chatMessages");

        if (data.error) throw new Error(data.error);
        if (!Array.isArray(data.messages)) throw new Error("Nieprawidłowe dane wiadomości");

        cachedMessages = data.messages;
        chatList.innerHTML = "";
        lastDate = "";

        data.messages.forEach(msg => {
            if (!msg.id) msg.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            displayChatMessage(msg, msg.sessionId === localStorage.getItem("perunUUID"));
        });

        updateActiveUsersCount(data.activeUsers || 0, data.activeUsernames);

        if (isFirstLoad) {
            scrollToBottom();
            isFirstLoad = false;
        }
    } catch (error) {
        console.error("Błąd ładowania:", error);
        showError("Nie udało się załadować wiadomości.");
    }
}

// Nowa funkcja do parsowania kolorów i <br>
function parseColoredText(text) {
    const colorMap = {
        "red": "#ff0000",
        "green": "#00ff00",
        "blue": "#0000ff",
        "yellow": "#ffff00",
        "purple": "#800080",
        "orange": "#ffa500"
    };

    // Zamiana <br> na element HTML
    let result = text.replace(/&lt;br&gt;/gi, '<br>');

    // Parsowanie znaczników kolorów
    for (const [color, hex] of Object.entries(colorMap)) {
        const regex = new RegExp(`&lt;${color}&gt;(.*?)&lt;/${color}&gt;`, "gi");
        result = result.replace(regex, `<span style="color: ${hex}">$1</span>`);
    }

    return result;
}

function displayChatMessage(msg, isSelf) {
    const switches = JSON.parse(localStorage.getItem("settingSwitches")) || defaultSwitches;
    const loadImages = switches.find(s => s.switchId === "03");

    const chatList = document.getElementById("chatMessages");
    let parsedDate;
    try {
        parsedDate = new Date(msg.timestamp);
    } catch (error) {
        parsedDate = new Date();
    }

    const chatMessageDate = parsedDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    if (chatMessageDate !== lastDate) {
        lastDate = chatMessageDate;
        const separator = document.createElement("li");
        separator.classList.add("date-separator");
        separator.innerHTML = `<span>${chatMessageDate}</span>`;
        chatList.appendChild(separator);
    }

    const li = document.createElement("li");
    li.classList.add("chatMessage", isSelf ? "self" : "other");
    li.dataset.id = msg.id;

    const usernameLabel = document.createElement("span");
    usernameLabel.classList.add("username-label");
    usernameLabel.textContent = String(msg.username || "Nieznany");

    if (msg.replyTo) {
        const replyDiv = document.createElement("div");
        replyDiv.classList.add("replying-to");
        const repliedMsg = cachedMessages.find(m => m.id === msg.replyTo);
        if (repliedMsg) {
            replyDiv.textContent = `${repliedMsg.username}: ${repliedMsg.message}`;
            replyDiv.onclick = () => {
                scrollToMessage(repliedMsg.id);
            };
        } else {
            replyDiv.textContent = `Odpowiedź na: [Wiadomość #${msg.replyTo} nie znaleziona]`;
        }
        li.appendChild(replyDiv);
    }

    const content = document.createElement("div");
    content.classList.add("message-content");

    const imagePattern = /^\/img\(([^)]+)\)$/;
    const match = msg.message.match(imagePattern);

    if (match && match[1] && loadImages.value) {
        const imgUrl = match[1].trim();
        content.innerHTML = `<img src="${sanitizeUrl(imgUrl)}" alt="obraz" style="max-width: 100%; height: auto;" onerror="this.style.display='none'; this.nextSibling.style.display='block';"><span style="display: none;">[Błąd ładowania obrazu]</span>`;
        const DEVcontentImg = document.createElement("div");

        const DEVcontent = document.createElement("div");
        if (localStorage.getItem('DEVsettings') === "true") {
            DEVcontent.classList.add("DEVmessage-content");
            DEVcontent.textContent = String(`#${msg.id}` || "[Brak ID]");
            li.appendChild(DEVcontent);
        }

        if (localStorage.getItem('DEVsettings') === "true") {
            DEVcontentImg.classList.add("DEVmessageImg-content");
            DEVcontentImg.textContent = String(imgUrl || "[Brak URL]");
            li.appendChild(DEVcontentImg);
        }
    } else {
        if (match && match[1] && !loadImages.value) {
            content.textContent = "[Obraz wyłączony]";
        } else {
            // Parsowanie kolorów i <br> po zastąpieniu zbanowanych słów
            const sanitizedMessage = replaceBannedWords(String(msg.message || "[Brak treści]"));
            content.innerHTML = parseColoredText(sanitizedMessage);
        }
    }

    function sanitizeUrl(url) {
        if (!/^https?:\/\//i.test(url)) {
            return `https://${url}`;
        }
        return url;
    }

    const usernameContainer = document.createElement("div");
    if (msg.verified) {
        const verificationIcon = document.createElement("i");
        verificationIcon.classList.add("fas", "fa-check-circle", "verified-icon");
        usernameContainer.appendChild(usernameLabel);
        usernameLabel.appendChild(verificationIcon);
        usernameLabel.style.color = "#ffd700";
    } else {
        usernameContainer.appendChild(usernameLabel);
    }

    const time = document.createElement("div");
    time.classList.add("timestamp");
    time.textContent = parsedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const reactionsDiv = document.createElement("div");
    reactionsDiv.classList.add("reactions");
    if (msg.reactions && typeof msg.reactions === "object") {
        for (const [reaction, users] of Object.entries(msg.reactions)) {
            if (Array.isArray(users)) {
                const reactionSpan = document.createElement("span");
                reactionSpan.classList.add("reaction");
                reactionSpan.textContent = reaction;
                reactionSpan.onclick = () => addReaction(msg.id, reaction);
                const countSpan = document.createElement("span");
                countSpan.classList.add("reaction-count");
                countSpan.textContent = users.length;
                reactionSpan.appendChild(countSpan);
                reactionsDiv.appendChild(reactionSpan);
            }
        }
    }

    const addReactionSpan = document.createElement("span");
    addReactionSpan.classList.add("reaction", "messageButtton");
    addReactionSpan.textContent = "👍";
    addReactionSpan.onclick = () => addReaction(msg.id, "👍");
    if (!msg.reactions || Object.keys(msg.reactions).length === 0) reactionsDiv.appendChild(addReactionSpan);

    if (isSelf) {
        const editBtn = document.createElement("span");
        editBtn.classList.add("edit-btn", "messageButton");
        editBtn.textContent = "✏️";
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editMessage(msg.id);
        };

        const deleteBtn = document.createElement("span");
        deleteBtn.classList.add("delete-btn", "messageButton");
        deleteBtn.textContent = "🗑️";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteMessage(msg.id);
        };

        li.appendChild(editBtn);
        li.appendChild(deleteBtn);
    }

    const addReplySpan = document.createElement("span");
    addReplySpan.classList.add("reply-btn", "messageButton");
    addReplySpan.textContent = "↩️";

    addReplySpan.onclick = (e) => {
        if (e.target.classList.contains("reaction") || e.target.classList.contains("edit-btn") || e.target.classList.contains("delete-btn")) return;
        replyingToMessageId = msg.id;
        updateReplyingTo(msg);
    };

    li.appendChild(usernameLabel);
    li.appendChild(content);
    li.appendChild(time);
    li.appendChild(reactionsDiv);
    li.appendChild(addReplySpan);
    chatList.appendChild(li);
}

function updateReplyingTo(msg) {
    const input = document.getElementById("chatMessage");
    const container = document.getElementById("input-container");
    const existingReply = container.querySelector(".replying-to");
    if (existingReply) existingReply.remove();

    if (msg) {
        const replyDiv = document.createElement("div");
        replyDiv.classList.add("replying-to");

        const repliedMsg = cachedMessages.find(m => m.id === msg.id);
        const replyText = document.createElement("span");

        if (!repliedMsg) {
            replyText.textContent = `Odpowiadasz na: [Wiadomość nie znaleziona]`;
        } else if (localStorage.getItem('DEVsettings') === "true") {
            replyText.textContent = `Odpowiadasz na #${msg.id} ${repliedMsg.username}: ${repliedMsg.message}`;
        } else {
            replyText.textContent = `Odpowiadasz na ${repliedMsg.username}: ${repliedMsg.message}`;
        }

        replyText.style.cursor = "pointer";
        replyText.onclick = () => {
            if (repliedMsg) {
                scrollToMessage(msg.id);
            }
        };

        const cancelSpan = document.createElement("span");
        cancelSpan.classList.add("cancel-reply");
        cancelSpan.textContent = "Anuluj";
        cancelSpan.onclick = cancelReply;

        replyDiv.appendChild(replyText);
        replyDiv.appendChild(cancelSpan);
        container.insertBefore(replyDiv, input);
        input.placeholder = "";
    } else {
        input.placeholder = "Napisz wiadomość...";
    }
}

function cancelReply() {
    replyingToMessageId = null;
    updateReplyingTo(null);
}

function showError(message) {
    const chatList = document.getElementById("chatMessages");
    const errorLi = document.createElement("li");
    errorLi.classList.add("error-message");
    errorLi.textContent = message;
    chatList.appendChild(errorLi);
    scrollToBottom();
    setTimeout(() => errorLi.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    fetchBannedWords().then(() => {
        loadChatMessages();
        setInterval(loadChatMessages, 2000);
        setInterval(sendHeartbeat, 5000);

        const chatInput = document.getElementById("chatMessage");
        chatInput.addEventListener("keydown", (event) => {
            if (event.key === "Enter" && !sendingChecker) {
                event.preventDefault();
                sendChatMessage();
            }
        });
    });
});