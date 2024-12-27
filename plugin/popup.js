document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const checkNowButton = document.getElementById('checkNow');
    const openFamilyButton = document.getElementById('openFamily');
    const clearHistoryButton = document.getElementById('clearHistory');
    const testNotificationButton = document.getElementById('testNotification');

    // Check connection status
    const accessToken = await chrome.runtime.sendMessage({ action: 'getAccessToken' });
    if (accessToken) {
        statusDiv.textContent = 'Connected to Steam';
        statusDiv.className = 'status connected';
    } else {
        statusDiv.textContent = 'Not connected to Steam. Please log in.';
        statusDiv.className = 'status disconnected';
    }

    checkNowButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'checkNow' }, (response) => {
            if (response.status === 'error') {
                statusDiv.textContent = 'Check failed: ' + response.message;
                statusDiv.className = 'status disconnected';
            } else {
                statusDiv.textContent = 'Check completed successfully';
                statusDiv.className = 'status connected';
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
    });

    testNotificationButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'testNotification' });
    });
}); 