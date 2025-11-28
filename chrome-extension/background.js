// background.js

const DAYS_OF_WEEK = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const BLOCK_PAGE_URL = chrome.runtime.getURL("block.html"); // Get path to your block page

// --- Core Utility Functions ---

// 1. Checks if a given time (HH:MM) is between start and end times
function isTimeWithinSchedule(currentTime, startTime, endTime) {
    // Converts "HH:MM" string to a number for comparison (e.g., "09:00" -> 900)
    const timeToMinutes = (time) => {
        if (!time) return null;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const currentMins = timeToMinutes(currentTime);
    const startMins = timeToMinutes(startTime);
    const endMins = timeToMinutes(endTime);

    if (startMins === null || endMins === null) return false;

    // Standard comparison (e.g., 9am to 5pm)
    if (startMins < endMins) {
        return currentMins >= startMins && currentMins <= endMins;
    } 
    // Overnight comparison (e.g., 10pm to 6am)
    else {
        return currentMins >= startMins || currentMins <= endMins;
    }
}

// 2. Checks if a hostname should be blocked right now
async function isHostBlocked(hostname, allGroups) {
    const now = new Date();
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentDayIndex = now.getDay(); 
    const currentDayKey = DAYS_OF_WEEK[currentDayIndex];
    // Get time as HH:MM
    const currentTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

    for (const group of allGroups) {
        // Check if the hostname belongs to this group
        if (group.sites.includes(hostname)) {
            const schedule = group.schedule[currentDayKey];

            // If scheduling is enabled for today AND it's within the scheduled time
            if (schedule.enabled && isTimeWithinSchedule(currentTime, schedule.start, schedule.end)) {
                return true; // Host should be blocked
            }
        }
    }
    return false; // Host is not blocked
}


// --- Main Event Listener ---

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    // Ignore internal chrome pages, non-HTTP/HTTPS, or frames
    if (details.frameId !== 0 || !details.url.startsWith("http")) {
        return;
    }

    // A. Parse the hostname
    let url;
    try {
        url = new URL(details.url);
    } catch (e) {
        return; // Invalid URL, ignore
    }

    const hostname = url.hostname;
    
    // B. Get the saved groups from storage
    const storage = await chrome.storage.sync.get("groups");
    const groups = storage.groups || [];

    // C. Check if the hostname is blocked right now
    if (await isHostBlocked(hostname, groups)) {
        // D. Redirect the user to the block page
        
        // Use chrome.tabs.update to change the current tab's URL
        chrome.tabs.update(details.tabId, { url: BLOCK_PAGE_URL });
        // NOTE: webNavigation does not support returning a blocking response, 
        // so we must use tabs.update to redirect.
    }
});