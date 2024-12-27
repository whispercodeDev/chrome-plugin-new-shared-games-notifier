document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const checkNowButton = document.getElementById('checkNow');
    const openFamilyButton = document.getElementById('openFamily');
    const clearHistoryButton = document.getElementById('clearHistory');
    const testNotificationButton = document.getElementById('testNotification');
    const checkSinceDateInput = document.getElementById('checkSinceDate');
    const checkSinceButton = document.getElementById('checkSince');
    const lastUpdatedDiv = document.getElementById('lastUpdated');

    // Check connection status
    const accessToken = await chrome.runtime.sendMessage({ action: 'getAccessToken' });
    if (accessToken) {
        statusDiv.textContent = 'Connected to Steam';
        statusDiv.className = 'status connected';
    } else {
        statusDiv.textContent = 'Not connected to Steam. Please log in.';
        statusDiv.className = 'status disconnected';
    }

    // Add function to format timestamp
    function formatLastUpdated(timestamp) {
        if (!timestamp) return 'Never checked';
        const date = new Date(timestamp * 1000);
        return `Last checked: ${date.toLocaleString()}`;
    }

    // Display initial last check time
    const { lastCheckTime } = await chrome.storage.local.get('lastCheckTime');
    lastUpdatedDiv.textContent = formatLastUpdated(lastCheckTime);

    checkNowButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'checkNow' }, async (response) => {
            if (response.status === 'error') {
                statusDiv.textContent = 'Check failed: ' + response.message;
                statusDiv.className = 'status disconnected';
            } else {
                statusDiv.textContent = 'Check completed successfully';
                statusDiv.className = 'status connected';
                // Update last check time display
                const { lastCheckTime } = await chrome.storage.local.get('lastCheckTime');
                lastUpdatedDiv.textContent = formatLastUpdated(lastCheckTime);
            }
        });
    });

    openFamilyButton.addEventListener('click', () => {
        window.open('https://store.steampowered.com/account/familymanagement/?tab=library');
    });

    clearHistoryButton.addEventListener('click', async () => {
        await chrome.storage.local.set({ lastCheckTime: 0 });
        statusDiv.textContent = 'History cleared. Next check will show all shared games.';
        statusDiv.className = 'status connected';
        lastUpdatedDiv.textContent = formatLastUpdated(0);
    });

    testNotificationButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'testNotification' });
    });

    // Set default value to current date/time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    checkSinceDateInput.value = now.toISOString().slice(0, 16);

    checkSinceButton.addEventListener('click', () => {
        const selectedDate = new Date(checkSinceDateInput.value);
        const timestamp = Math.floor(selectedDate.getTime() / 1000); // Convert to Unix timestamp

        chrome.runtime.sendMessage({
            action: 'checkSince',
            timestamp: timestamp
        }, (response) => {
            if (response.status === 'error') {
                statusDiv.textContent = 'Check failed: ' + response.message;
                statusDiv.className = 'status disconnected';
            } else {
                statusDiv.textContent = 'Check completed successfully';
                statusDiv.className = 'status connected';
            }
        });
    });
}); 