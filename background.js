chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    const url = details.url;

    // Only block URLs that start with the exact YouTube prefix
    if (url.startsWith("https://www.youtube.com")) {
        chrome.tabs.update(details.tabId, {
            url: chrome.runtime.getURL("block.html")
        });
    }
}, {
    url: [
        { urlPrefix: "https://www.youtube.com/" }
    ]
});
