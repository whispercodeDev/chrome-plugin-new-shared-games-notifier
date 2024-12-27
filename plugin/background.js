let accessToken = null;

// Add message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAccessToken') {
        // Return the current access token
        sendResponse(accessToken);
        return true;
    } else if (request.action === 'checkNow') {
        // Trigger manual check
        checkSharedGames();
        sendResponse({ status: 'checking' });
        return true;
    }
});

async function getAccessToken() {
    try {
        // Query all Steam store tabs
        const tabs = await chrome.tabs.query({
            url: 'https://store.steampowered.com/*'
        });

        if (tabs.length === 0) {
            // If no Steam tab is open, create one
            await chrome.tabs.create({
                url: 'https://store.steampowered.com/',
                active: false
            });
            // Wait for the tab to load
            await new Promise(resolve => setTimeout(resolve, 2000));
            return await getAccessToken();
        }

        // Send message to the content script
        const response = await chrome.tabs.sendMessage(tabs[0].id, {
            action: 'getAccessToken'
        });

        if (response && response.success) {
            accessToken = response.token; // Store the token
            return response.token;
        }
        throw new Error(response?.error || 'Failed to get access token');
    } catch (error) {
        console.error('Error getting access token:', error);
        return null;
    }
}

async function checkSharedGames() {
    if (!accessToken) {
        accessToken = await getAccessToken();
        if (!accessToken) return;
    }

    const lastCheckTime = (await chrome.storage.local.get('lastCheckTime')).lastCheckTime || 0;

    try {
        const response = await fetch(
            `https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?access_token=${accessToken}&family_groupid=0&include_own=true&include_excluded=true&include_free=true&include_non_games=true`
        );
        const data = await response.json();

        const newGames = data.response.apps.filter(game => game.rt_last_played > lastCheckTime);

        if (newGames.length > 0) {
            for (const game of newGames) {
                showNotification(game);
            }
        }

        // Update last check time
        chrome.storage.local.set({ lastCheckTime: Math.floor(Date.now() / 1000) });
    } catch (error) {
        console.error('Error checking shared games:', error);
        // If we get an authentication error, clear the token and try again
        if (error.message.includes('401') || error.message.includes('unauthorized')) {
            accessToken = null;
            await checkSharedGames();
        }
    }
}

function showNotification(game) {
    chrome.notifications.create(`game-${game.appid}`, {
        type: 'basic',
        iconUrl: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_hash}.jpg`,
        title: 'New Shared Game Available',
        message: `${game.name} is now available to play!`,
        buttons: [
            { title: 'Open in Steam' },
            { title: 'Open Family Page' }
        ],
        requireInteraction: true
    });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    const gameId = notificationId.split('-')[1];
    if (buttonIndex === 0) {
        // Open game in Steam
        window.open(`steam://run/${gameId}`);
    } else if (buttonIndex === 1) {
        // Open Steam family page
        window.open('https://store.steampowered.com/family/view');
    }
});

// Set up periodic checks (every 5 minutes)
chrome.alarms.create('checkGames', { periodInMinutes: 5 });
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'checkGames') {
        checkSharedGames();
    }
});

// Initial check
checkSharedGames(); 