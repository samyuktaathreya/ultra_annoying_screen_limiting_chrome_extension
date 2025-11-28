chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId !== 0) return;

    chrome.storage.sync.get(["blockedSites"], ({ blockedSites }) => {
        if (!blockedSites) return;

        const url = details.url || "";
        const hostname = new URL(url).hostname;

        // Get weekday
        const days = ["sun","mon","tue","wed","thu","fri","sat"];
        const today = days[new Date().getDay()];

        const now = new Date();
        const currentTime = now.toTimeString().slice(0,5); // "HH:MM"

        for (const siteObj of blockedSites) {
            if (!hostname.includes(siteObj.hostname)) continue;

            const config = siteObj.schedule[today];

            if (!config.enabled) continue;

            // FULL DAY block (Option A)
            if (config.start === "00:00" && config.end === "23:59") {
                chrome.tabs.update(details.tabId, {
                    url: chrome.runtime.getURL("block.html")
                });
                return;
            }

            // TIME WINDOW block
            if (currentTime >= config.start && currentTime <= config.end) {
                chrome.tabs.update(details.tabId, {
                    url: chrome.runtime.getURL("block.html")
                });
                return;
            }
        }
    });

}, { url: [{ urlMatches: ".*" }] });
