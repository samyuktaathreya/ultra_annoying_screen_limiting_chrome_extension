const input = document.getElementById("siteInput");
const addBtn = document.getElementById("addBtn");
const listEl = document.getElementById("blockedList");

let blockedSites = [];

// Detect whether we're inside a Chrome extension
const isExtension = typeof chrome !== "undefined" && chrome.storage;

// Load from correct storage
if (isExtension) {
    chrome.storage.sync.get(["blockedSites"], data => {
        blockedSites = data.blockedSites || [];
        renderList();
    });
} else {
    const saved = localStorage.getItem("blockedSites");
    blockedSites = saved ? JSON.parse(saved) : [];
    renderList();
}

// Render blocked list into the UL
function renderList() {
    listEl.innerHTML = "";

    blockedSites.forEach((site, index) => {
        const li = document.createElement("li");

        const text = document.createElement("span");
        text.textContent = site;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.style.marginLeft = "10px";

        removeBtn.onclick = () => {
            blockedSites.splice(index, 1);
            saveList();
        };

        li.appendChild(text);
        li.appendChild(removeBtn);
        listEl.appendChild(li);
    });
}

// Save updated list
function saveList() {
    if (isExtension) {
        chrome.storage.sync.set({ blockedSites }, () => {
            renderList();
        });
    } else {
        localStorage.setItem("blockedSites", JSON.stringify(blockedSites));
        renderList();
    }
}

// Add a new site
addBtn.onclick = () => {
    let site = input.value.trim().toLowerCase();
    if (!site) return;

    let testUrl = site;
    if (!site.startsWith("http://") && !site.startsWith("https://")) {
        testUrl = "https://" + site;
    }

    let hostname = "";
    try {
        hostname = new URL(testUrl).hostname;
    } catch {
        alert("Please enter a valid website (example: youtube.com)");
        return;
    }

    if (!hostname.includes(".")) {
        alert("Please enter a valid domain name.");
        return;
    }

    if (blockedSites.includes(hostname)) {
        alert("Already added.");
        return;
    }

    blockedSites.push(hostname);
    input.value = "";

    saveList();
};
