chrome.webNavigation.onBeforeNavigate.addListener((details) => {
    if (details.frameId !== 0) return;
    const url = details.url || "";

    // Only block exact YouTube URL prefix
    if (url.startsWith("https://www.youtube.com/")) {
        chrome.tabs.update(details.tabId, {
            url: chrome.runtime.getURL("block.html")
        });
    }
},
{
    url: [
        { urlPrefix: "https://www.youtube.com/" }
    ]
});
