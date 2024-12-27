let accessToken = null;

// Add message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAccessToken') {
        // Return the current access token
        sendResponse(accessToken);
        return true;
    } else if (request.action === 'checkSince') {
        // Trigger check since specific timestamp
        checkSharedGames(request.timestamp)
            .then(() => {
                sendResponse({ status: 'success' });
            })
            .catch((error) => {
                console.error('Check failed:', error);
                sendResponse({ status: 'error', message: error.message });
            });
        return true;
    } else if (request.action === 'checkNow') {
        // Trigger manual check
        checkSharedGames()
            .then(() => {
                sendResponse({ status: 'success' });
            })
            .catch((error) => {
                console.error('Check failed:', error);
                sendResponse({ status: 'error', message: error.message });
            });
        return true; // Keep the message channel open for async response
    } else if (request.action === 'testNotification') {
        showNotification({
            appid: '10',
            name: 'Counter-Strike',
            img_icon_hash: '6b0312cda02f5f777efa2f3318c307ff9acafbb5'
        });
    }
});

async function getAccessToken() {
    try {
        // Query all Steam store tabs
        const tabs = await chrome.tabs.query({
            url: 'https://store.steampowered.com/*'
        });

        let targetTab;
        if (tabs.length === 0) {
            // If no Steam tab is open, create one
            targetTab = await chrome.tabs.create({
                url: 'https://store.steampowered.com/',
                active: false
            });
        } else {
            targetTab = tabs[0];
        }

        // Wait for the tab to complete loading
        await new Promise((resolve) => {
            function checkTab() {
                chrome.tabs.get(targetTab.id, (tab) => {
                    if (tab.status === 'complete') {
                        resolve();
                    } else {
                        setTimeout(checkTab, 100);
                    }
                });
            }
            checkTab();
        });

        // Inject the content script manually
        await chrome.scripting.executeScript({
            target: { tabId: targetTab.id },
            files: ['contentScript.js']
        });

        // Send message to the content script
        const response = await chrome.tabs.sendMessage(targetTab.id, {
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

async function checkSharedGames(sinceTimestamp = null) {
    if (!accessToken) {
        accessToken = await getAccessToken();
        if (!accessToken) return;
    }

    // Use provided timestamp or get from storage
    const lastCheckTime = sinceTimestamp ||
        (await chrome.storage.local.get('lastCheckTime')).lastCheckTime || 0;

    try {
        const response = await fetch(
            `https://api.steampowered.com/IFamilyGroupsService/GetSharedLibraryApps/v1/?access_token=${accessToken}&family_groupid=0&include_own=true&include_excluded=true&include_free=true&include_non_games=true`
        );
        const data = await response.json();
        console.log(data);

        // Get user's Steam ID
        const userSteamId = data.response.owner_steamid;

        // Filter games that are:
        // 1. Played after the last check time
        // 2. Not owned by the user (user's Steam ID is not in owner_steamids)
        const newGames = data.response.apps.filter(game =>
            game.rt_time_acquired > lastCheckTime &&
            !game.owner_steamids.includes(userSteamId)
        );

        console.log(newGames);

        if (newGames.length > 0) {
            for (const game of newGames) {
                showNotification(game);
            }
        }

        // Only update last check time if we're not doing a historical check
        if (!sinceTimestamp) {
            chrome.storage.local.set({ lastCheckTime: Math.floor(Date.now() / 1000) });
        }
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
    // Fetch the image first with no-cors mode
    fetch(`https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_hash}.jpg`, {
        mode: 'no-cors'
    }).then(() => {
        chrome.notifications.create(`game-${game.appid}`, {
            type: 'basic',
            iconUrl: `https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/${game.appid}/${game.img_icon_hash}.jpg`,
            title: 'New Shared Game Available',
            message: `${game.name} is now available to play!`,
            buttons: [
                { title: 'Open/Install' },
                { title: 'Open Shop Page' }
            ],
            requireInteraction: true
        });
    }).catch(() => {
        // Fallback to default icon if image loading fails
        chrome.notifications.create(`game-${game.appid}`, {
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'New Shared Game Available',
            message: `${game.name} is now available to play!`,
            buttons: [
                { title: 'Open/Install' },
                { title: 'Open Shop Page' }
            ],
            requireInteraction: true
        });
    });
}

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    const gameId = notificationId.split('-')[1];
    if (buttonIndex === 0) {
        // Open game in Steam using chrome.tabs.create
        chrome.tabs.create({
            url: `steam://run/${gameId}`
        });
    } else if (buttonIndex === 1) {
        // Open Steam family page using chrome.tabs.create
        chrome.tabs.create({
            url: `steam://store/${gameId}`
        });
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