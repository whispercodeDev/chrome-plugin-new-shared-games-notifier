document.addEventListener('DOMContentLoaded', async () => {
    const statusDiv = document.getElementById('status');
    const checkNowButton = document.getElementById('checkNow');
    const openFamilyButton = document.getElementById('openFamily');
    const clearHistoryButton = document.getElementById('clearHistory');

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
        chrome.runtime.sendMessage({ action: 'checkNow' });
    });

    openFamilyButton.addEventListener('click', () => {
        window.open('https://store.steampowered.com/family/view');
    });

    clearHistoryButton.addEventListener('click', async () => {
        await chrome.storage.local.set({ lastCheckTime: 0 });
        statusDiv.textContent = 'History cleared. Next check will show all shared games.';
        statusDiv.className = 'status connected';
    });
}); 