async function fetchTabsData() {
    try {
        const response = await fetch('https://suspicioyt.github.io/perunverse/gameverse/data/changes.json');
        if (!response.ok) {
            throw new Error('Nie udało się załadować pliku JSON');
        }
        const data = await response.json();
        return data.tabsData;
    } catch (error) {
        console.error('Błąd podczas ładowania danych JSON:', error);
        return [];
    }
}
function loadTabs(tabsData) {
    const tabsContainer = document.getElementById("tabsContainer");
    const tabContentsContainer = document.getElementById("tabContentsContainer");

    if (!tabsContainer || !tabContentsContainer) {
        console.error("Brak wymaganych elementów DOM: tabsContainer lub tabContentsContainer.");
        return;
    }

    tabsData.forEach((tab, index) => {
        const tabButton = document.createElement("button");
        tabButton.innerHTML = tab.name;
        tabButton.classList.add("tablinks");
        tabButton.setAttribute("onclick", `openTab(event, 'tab${index}')`);
        tabsContainer.appendChild(tabButton);

        const tabContent = document.createElement("div");
        tabContent.id = `tab${index}`;
        tabContent.classList.add("tabcontent");

        if (tab.backgroundImage) {
            tabContent.style.backgroundImage = `url(${tab.backgroundImage})`;
            tabContent.style.backgroundSize = "cover";
            tabContent.style.backgroundPosition = "center";
            tabContent.style.backgroundRepeat = "no-repeat";
        }

        tabContent.innerHTML = `
            <h1>${tab.name} (${tab.version})</h1>
            ${tab.date ? `<p style="color:black"><strong>Data publikacji:</strong> ${tab.date}</p>` : ''}
            <cite>${tab.quote}</cite>
        `;

        tab.paragraphs.forEach(paragraph => {
            if (typeof paragraph === "object" && paragraph.title && paragraph.content) {
                const section = document.createElement("div");
                section.innerHTML = `<h2>${paragraph.title}</h2>`;
                paragraph.content.forEach(item => {
                    const p = document.createElement("cite");
                    p.innerHTML = item;
                    section.appendChild(p);
                });
                tabContent.appendChild(section);
            } else {
                const p = document.createElement("cite");
                p.innerHTML = paragraph;
                tabContent.appendChild(p);
            }
        });

        if (tab.backgroundImage) {
            const p = document.createElement("cite");
            p.innerHTML = "Tło";
            p.style.cursor = "pointer";
            p.addEventListener('click', function () {
                copyToClipboard(tab.backgroundImage);
            });
            tabContent.appendChild(p);
        }

        tabContentsContainer.appendChild(tabContent);
    });

    if (tabsContainer.querySelector(".tablinks")) {
        tabsContainer.querySelector(".tablinks").click();
    }
}

function openTab(evt, tabId) {
    document.querySelectorAll(".tabcontent").forEach(tab => tab.style.display = "none");
    document.querySelectorAll(".tablinks").forEach(tab => tab.classList.remove("active"));
    document.getElementById(tabId).style.display = "block";
    evt.currentTarget.classList.add("active");
}

function loadVersion(tabsData) {
    const footerElement = document.getElementById('footerText');
    if (footerElement && tabsData[0]?.version) {
        footerElement.innerHTML = `© 2025 Perun Gameverse & ChatGPT & Grok. Wszelkie prawa zastrzeżone. Wersja ${tabsData[0].version} Lite`;
    } else {
        console.warn("Nie udało się załadować wersji.");
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Skopiowano do schowka: ' + text);
    }).catch(err => {
        console.error('Błąd podczas kopiowania: ', err);
    });
}

async function init() {
    const tabsData = await fetchTabsData();
    if (tabsData.length > 0) {
        loadTabs(tabsData);
        loadVersion(tabsData);
    } else {
        console.error("Brak danych do załadowania.");
    }
}

init();