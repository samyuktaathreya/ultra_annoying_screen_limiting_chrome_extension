chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId !== 0) return;

    const url = details.url || "";
    const hostname = new URL(url).hostname;

    // Get blocklist from storage
    chrome.storage.sync.get(["blockedSites"], data => {
        const blocked = data.blockedSites || [];

        for (const site of blocked) {
            if (hostname.includes(site)) {
                chrome.tabs.update(details.tabId, {
                    url: chrome.runtime.getURL("block.html")
                });
                return;
            }
        }
    });

}, {
    url: [{ urlMatches: "https?://.*" }]
});
