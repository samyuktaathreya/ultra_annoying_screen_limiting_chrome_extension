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

chrome.webRequest.onBeforeRequest.addListener(
    async (details) => {
        // Ignore internal pages, frames, or non-http
        if (details.frameId !== 0 || !details.url.startsWith("http")) {
            return { cancel: false };
        }

        let url;
        try {
            url = new URL(details.url);
        } catch (e) {
            return { cancel: false };
        }
        
        const hostname = url.hostname;
        
        // C. Get the saved groups from storage
        const storage = await chrome.storage.sync.get("groups");
        const groups = storage.groups || [];

        // D. Check if the hostname is blocked right now
        if (await isHostBlocked(hostname, groups)) {
            // E. Redirect immediately using the blocking option
            return { redirectUrl: BLOCK_PAGE_URL };
        }
        
        return { cancel: false };
    },
    // Filters: Apply to all URLs and main frame
    { urls: ["<all_urls>"], types: ["main_frame"] }, 
    // Blocking type options
    ["blocking"]
);