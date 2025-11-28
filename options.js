const input = document.getElementById("siteInput");
const addBtn = document.getElementById("addBtn");
const listEl = document.getElementById("blockedList");

let blockedSites = [];

const isExtension = typeof chrome !== "undefined" && chrome.storage;

// Load stored sites
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

// Save with optional rerender
function saveList(shouldRender = true) {
    if (isExtension) {
        chrome.storage.sync.set({ blockedSites }, () => {
            if (shouldRender) renderList();
        });
    } else {
        localStorage.setItem("blockedSites", JSON.stringify(blockedSites));
        if (shouldRender) renderList();
    }
}

function makeBlankSchedule() {
    return {
        mon: { enabled: false, start: "", end: "" },
        tue: { enabled: false, start: "", end: "" },
        wed: { enabled: false, start: "", end: "" },
        thu: { enabled: false, start: "", end: "" },
        fri: { enabled: false, start: "", end: "" },
        sat: { enabled: false, start: "", end: "" },
        sun: { enabled: false, start: "", end: "" }
    };
}

function renderList() {
    listEl.innerHTML = "";

    blockedSites.forEach((siteObj, index) => {

        const li = document.createElement("li");

        // MAIN ROW
        const mainRow = document.createElement("div");
        mainRow.style.display = "flex";
        mainRow.style.justifyContent = "space-between";
        mainRow.style.alignItems = "center";

        const siteText = document.createElement("span");
        siteText.textContent = siteObj.hostname;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.onclick = () => {
            blockedSites.splice(index, 1);
            saveList(true);
        };

        const settingsBtn = document.createElement("button");
        settingsBtn.textContent = "Settings ▼";

        mainRow.appendChild(siteText);
        mainRow.appendChild(removeBtn);
        mainRow.appendChild(settingsBtn);
        li.appendChild(mainRow);

        // SETTINGS PANEL
        const settingsPanel = document.createElement("div");
        settingsPanel.style.display = "none";
        settingsPanel.style.padding = "10px";
        settingsPanel.style.borderTop = "1px solid #ddd";

        const header = document.createElement("label");
        header.innerHTML = "<b>Weekly Block Schedule:</b>";
        settingsPanel.appendChild(header);

        settingsPanel.appendChild(document.createElement("br"));
        settingsPanel.appendChild(document.createElement("br"));

        const days = ["mon","tue","wed","thu","fri","sat","sun"];

        days.forEach(d => {
            const row = document.createElement("div");
            row.style.marginBottom = "8px";

            // checkbox
            const cb = document.createElement("input");
            cb.type = "checkbox";
            cb.className = "dayCheck";
            cb.dataset.day = d;

            const label = document.createElement("label");
            label.appendChild(cb);
            label.append(" " + d.toUpperCase());

            // start time
            const start = document.createElement("input");
            start.type = "time";
            start.className = "startTime";
            start.dataset.day = d;
            start.style.marginLeft = "10px";

            // end time
            const end = document.createElement("input");
            end.type = "time";
            end.className = "endTime";
            end.dataset.day = d;

            row.appendChild(label);
            row.appendChild(start);
            row.appendChild(end);
            settingsPanel.appendChild(row);
        });

        li.appendChild(settingsPanel);
        listEl.appendChild(li);

        // TOGGLE open/close
        settingsBtn.onclick = () => {
            settingsPanel.style.display =
                settingsPanel.style.display === "none" ? "block" : "none";
        };

        // Load values
        days.forEach(d => {
            const config = siteObj.schedule[d];

            const cb = settingsPanel.querySelector(`.dayCheck[data-day="${d}"]`);
            const start = settingsPanel.querySelector(`.startTime[data-day="${d}"]`);
            const end = settingsPanel.querySelector(`.endTime[data-day="${d}"]`);

            cb.checked = config.enabled;
            start.value = config.start || "";
            end.value = config.end || "";

            start.disabled = !config.enabled;
            end.disabled = !config.enabled;

            // events
            cb.onchange = () => {
                config.enabled = cb.checked;

                if (cb.checked) {
                    // If user turns on day but has no times → full day
                    if (!config.start || !config.end) {
                        config.start = "00:00";
                        config.end = "23:59";
                    }
                    start.disabled = false;
                    end.disabled = false;
                } else {
                    start.disabled = true;
                    end.disabled = true;
                }

                saveList(false);
            };

            start.onchange = () => {
                config.start = start.value;

                // If end is missing but start exists → full day block
                if (config.enabled && config.start && !config.end) {
                    config.start = "00:00";
                    config.end = "23:59";
                }

                saveList(false);
            };

            end.onchange = () => {
                config.end = end.value;

                // If start is missing but end exists → full day block
                if (config.enabled && config.end && !config.start) {
                    config.start = "00:00";
                    config.end = "23:59";
                }

                saveList(false);
            };

        });
    });
}


// ADD NEW SITE
addBtn.onclick = () => {
    let site = input.value.trim().toLowerCase();
    if (!site) return;

    let testUrl = site.startsWith("http") ? site : "https://" + site;

    let hostname = "";
    try {
        hostname = new URL(testUrl).hostname;
    } catch {
        alert("Enter a valid website like youtube.com");
        return;
    }

    if (blockedSites.some(s => s.hostname === hostname)) {
        alert("Already added.");
        return;
    }

    blockedSites.push({
        hostname,
        schedule: makeBlankSchedule() // ← FIXED cloning problem
    });

    input.value = "";
    saveList(true);
};
