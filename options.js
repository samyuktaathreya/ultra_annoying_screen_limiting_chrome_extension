// Load existing settings
chrome.storage.sync.get(["dailyLimit", "blockEnabled"], (data) => {
    document.getElementById("dailyLimit").value = data.dailyLimit || 30;
    document.getElementById("blockEnabled").value = data.blockEnabled === false ? "false" : "true";
});

// Save settings when clicking Save
document.getElementById("saveBtn").addEventListener("click", () => {
    const dailyLimit = parseInt(document.getElementById("dailyLimit").value, 10);
    const blockEnabled = document.getElementById("blockEnabled").value === "true";

    chrome.storage.sync.set({
        dailyLimit,
        blockEnabled
    }, () => {
        document.getElementById("status").textContent = "Settings saved!";
        setTimeout(() => {
            document.getElementById("status").textContent = "";
        }, 1500);
    });
});
