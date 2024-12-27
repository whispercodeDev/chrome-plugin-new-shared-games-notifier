let accessToken = null;

async function getAccessToken() {
    try {
        const response = await fetch('https://store.steampowered.com/pointssummary/ajaxgetasyncconfig', {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success && data.data.webapi_token) {
            return data.data.webapi_token;
        }
        throw new Error('Failed to get access token');
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