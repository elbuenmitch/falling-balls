/**
 * Database service for interacting with Supabase
 * Handles saving and loading game settings
 */

// Generate a random session ID if one doesn't exist
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Get or create a session ID
function getSessionId() {
    let sessionId = localStorage.getItem('gameSessionId');
    if (!sessionId) {
        sessionId = generateSessionId();
        localStorage.setItem('gameSessionId', sessionId);
    }
    return sessionId;
}

// Save game settings to the database
async function saveSettings(settings) {
    try {
        console.log('[dbService] Saving settings to database:', settings);
        const sessionId = getSessionId();
        console.log('[dbService] Using session ID:', sessionId);
        
        const requestBody = {
            sessionId,
            ballCount: settings.ballCount,
            ballRadius: settings.ballRadius,
            obstacleCount: settings.obstacleCount,
            maxSize: settings.maxSize,
            movementSpeed: settings.movementSpeed,
            jumpForce: settings.jumpForce
        };
        
        console.log('[dbService] Making API request with body:', JSON.stringify(requestBody));
        
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('[dbService] Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[dbService] Server error response:', errorText);
            throw new Error(`Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[dbService] Settings saved successfully:', data);
        return data;
    } catch (error) {
        console.error('[dbService] Error saving settings:', error);
        console.trace('[dbService] Error stack trace:');
        return null;
    }
}

// Load game settings from the database
async function loadSettings() {
    try {
        const sessionId = getSessionId();
        console.log('[dbService] Loading settings for session ID:', sessionId);
        
        const response = await fetch(`/api/settings/${sessionId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('[dbService] Load settings response status:', response.status);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('[dbService] No saved settings found, using defaults');
                return null;
            }
            const errorText = await response.text();
            console.error('[dbService] Server error during load:', errorText);
            throw new Error(`Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[dbService] Settings loaded successfully:', data);
        return data.settings;
    } catch (error) {
        console.error('[dbService] Error loading settings:', error);
        console.trace('[dbService] Error stack trace:');
        return null;
    }
}

// Export functions
window.dbService = {
    saveSettings,
    loadSettings
};
