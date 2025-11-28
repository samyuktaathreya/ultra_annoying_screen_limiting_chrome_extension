chrome.webNavigation.onBeforeNavigate.addListener(details => {
    const url = new URL(details.url);
    const hostname = url.hostname;

    if (hostname.includes("youtube.com")) {
        chrome.tabs.update(details.tabId, {
            url: chrome.runtime.getURL("block.html")
        });
    }
}, {
    url: [{ hostContains: "youtube.com" }]
});
