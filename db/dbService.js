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

// Log the winner of a game
async function logWinner(winnerData) {
    try {
        console.log('[dbService] Logging winner data:', winnerData);
        const sessionId = getSessionId();
        
        const requestBody = {
            sessionId,
            winningBallColor: winnerData.winningBallColor,
            selectedBallColor: winnerData.selectedBallColor,
            ballCount: winnerData.ballCount,
            ballRadius: winnerData.ballRadius,
            obstacleCount: winnerData.obstacleCount,
            maxSize: winnerData.maxSize,
            movementSpeed: winnerData.movementSpeed,
            jumpForce: winnerData.jumpForce
        };
        
        console.log('[dbService] Making API request with body:', JSON.stringify(requestBody));
        
        const response = await fetch('/api/winners', {
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
        console.log('[dbService] Winner logged successfully:', data);
        return data;
    } catch (error) {
        console.error('[dbService] Error logging winner:', error);
        console.trace('[dbService] Error stack trace:');
        return null;
    }
}

// Get color win statistics
async function getColorStats() {
    try {
        // Check if we're running on a file:// protocol
        if (window.location.protocol === 'file:') {
            console.warn('[dbService] Running from file:// protocol. API calls will not work.');
            document.getElementById('loading').innerHTML = `
                <p><strong>Error:</strong> Cannot load statistics when opening directly from filesystem.</p>
                <p>Please access this page through the server at: <a href="http://localhost:3000/color-preview">http://localhost:3000/color-preview</a></p>
            `;
            return {};
        }
        
        console.log('[dbService] Fetching color statistics...');
        
        const apiUrl = window.location.protocol === 'file:' ? 
            'http://localhost:3000/api/color-stats' : '/api/color-stats';
            
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        console.log('[dbService] Color stats response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[dbService] Server error during stats retrieval:', errorText);
            throw new Error(`Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log('[dbService] Color statistics retrieved successfully:', data);
        return data.colorStats;
    } catch (error) {
        console.error('[dbService] Error retrieving color statistics:', error);
        console.trace('[dbService] Error stack trace:');
        return {}; // Return empty object on error
    }
}

// Export functions
window.dbService = {
    saveSettings,
    loadSettings,
    logWinner,
    getColorStats
};
