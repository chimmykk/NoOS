const AUTH_BASE_URL = "http://localhost:3000";

async function handleAuthRequest(event, { appId, oneTimeCode }) {
    try {
        if (!appId || !oneTimeCode) {
            return { error: 'Missing app_id or oneTimeCode' };
        }

        // Simulate successful authentication
        return {
            auth_token: 'simulated_auth_token_' + Date.now(),
            user: {
                id: appId,
                name: 'User_' + appId.slice(0, 8),
                avatar: '/placeholder.svg?height=48&width=48'
            }
        };
    } catch (error) {
        return { error: `Server error: ${error.message}` };
    }
}

module.exports = { handleAuthRequest }; 