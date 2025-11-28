chrome.webNavigation.onBeforeNavigate.addListener(details => {
    if (details.url.includes("youtube.com")) {
        chrome.tabs.update(details.tabId, {
            url: chrome.runtime.getURL("block.html")
        });
    }
}, {
    url: [
        { hostContains: "youtube.com" }
    ]
});
