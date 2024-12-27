// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getAccessToken') {
        fetch('https://store.steampowered.com/pointssummary/ajaxgetasyncconfig', {
            credentials: 'include'
        })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.data.webapi_token) {
                    sendResponse({ success: true, token: data.data.webapi_token });
                } else {
                    sendResponse({ success: false, error: 'No token found' });
                }
            })
            .catch(error => {
                sendResponse({ success: false, error: error.message });
            });
        return true; // Required for async response
    }
}); 