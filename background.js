chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    try {
        const url = new URL(details.url);

        // Only block real YouTube domains
        if (url.hostname.includes("youtube.com")) {
            chrome.tabs.update(details.tabId, {
                url: chrome.runtime.getURL("block.html")
            });
        }

    } catch (err) {
        // Ignore invalid URLs like chrome://, chrome-search://, etc.
        return;
    }
},
{
    url: [
        { urlMatches: "^https?://(www\\.)?youtube\\.com/.*" }
    ]
});
