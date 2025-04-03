const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON bodies
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Supabase URL from env:', supabaseUrl ? 'Found (length: ' + supabaseUrl.length + ')' : 'Not found');
console.log('Supabase key from env:', supabaseKey ? 'Found (length: ' + supabaseKey.length + ')' : 'Not found');

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Supabase credentials missing from .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test Supabase connection
supabase.auth.getSession()
  .then(response => {
    console.log('Supabase connection test successful:', response ? 'Response received' : 'No response');
  })
  .catch(error => {
    console.error('Error connecting to Supabase:', error);
  });

// API endpoints
app.get('/api/settings/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`[SERVER] GET request for settings with sessionId: ${sessionId}`);
    
    // Query anonymous settings table
    console.log('[SERVER] Querying Supabase for settings...');
    const { data, error } = await supabase
      .from('anonymous_game_settings')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (error) {
      console.error('[SERVER] Supabase error during GET:', error);
      throw error;
    }
    
    if (!data) {
      console.log(`[SERVER] No settings found for session ${sessionId}`);
      return res.status(404).json({ message: 'Settings not found' });
    }
    
    console.log('[SERVER] Settings found:', data);
    res.json({ settings: data });
  } catch (error) {
    console.error('[SERVER] Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings', error: error.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    console.log('[SERVER] Received POST request to /api/settings');
    console.log('[SERVER] Request body:', req.body);
    
    const { 
      sessionId, 
      ballCount, 
      ballRadius, 
      obstacleCount, 
      maxSize, 
      movementSpeed, 
      jumpForce 
    } = req.body;
    
    if (!sessionId) {
      console.error('[SERVER] No sessionId provided in request');
      return res.status(400).json({ message: 'Session ID is required' });
    }
    
    console.log('[SERVER] Preparing to save settings with sessionId:', sessionId);
    
    // Create the settings object
    const settingsObj = {
      session_id: sessionId,
      ball_count: ballCount,
      ball_radius: ballRadius,
      obstacle_count: obstacleCount,
      max_size: maxSize,
      movement_speed: movementSpeed,
      jump_force: jumpForce,
      updated_at: new Date()
    };
    
    console.log('[SERVER] Settings object to upsert:', settingsObj);
    
    // Upsert operation (insert if not exists, update if exists)
    console.log('[SERVER] Sending upsert request to Supabase...');
    const { data, error } = await supabase
      .from('anonymous_game_settings')
      .upsert(settingsObj, { onConflict: 'session_id' })
      .select()
      .single();
    
    if (error) {
      console.error('[SERVER] Supabase error during upsert:', error);
      throw error;
    }
    
    console.log('[SERVER] Settings saved successfully:', data);
    res.status(201).json({ message: 'Settings saved successfully', settings: data });
  } catch (error) {
    console.error('[SERVER] Error saving settings:', error);
    console.error('[SERVER] Stack trace:', error.stack);
    res.status(500).json({ message: 'Failed to save settings', error: error.message });
  }
});

// API endpoint for logging winners
app.post('/api/winners', async (req, res) => {
  try {
    console.log('[SERVER] Received POST request to /api/winners');
    console.log('[SERVER] Request body:', req.body);
    
    const { 
      sessionId, 
      winningBallColor,
      selectedBallColor,
      ballCount, 
      ballRadius, 
      obstacleCount, 
      maxSize, 
      movementSpeed, 
      jumpForce 
    } = req.body;
    
    if (!sessionId || !winningBallColor) {
      console.error('[SERVER] Missing required fields in request');
      return res.status(400).json({ message: 'Session ID and winning ball color are required' });
    }
    
    console.log('[SERVER] Preparing to save winner data with sessionId:', sessionId);
    
    // Create the winner data object
    const winnerObj = {
      session_id: sessionId,
      winning_ball_color: winningBallColor,
      selected_ball_color: selectedBallColor,
      ball_count: ballCount,
      ball_radius: ballRadius,
      obstacle_count: obstacleCount,
      max_size: maxSize,
      movement_speed: movementSpeed,
      jump_force: jumpForce,
      created_at: new Date()
    };
    
    console.log('[SERVER] Winner object to insert:', winnerObj);
    
    // Insert winner data
    console.log('[SERVER] Sending insert request to Supabase...');
    const { data, error } = await supabase
      .from('game_winners')
      .insert(winnerObj)
      .select()
      .single();
    
    if (error) {
      console.error('[SERVER] Supabase error during insert:', error);
      throw error;
    }
    
    console.log('[SERVER] Winner data saved successfully:', data);
    res.status(201).json({ message: 'Winner data saved successfully', winner: data });
  } catch (error) {
    console.error('[SERVER] Error saving winner data:', error);
    console.error('[SERVER] Stack trace:', error.stack);
    res.status(500).json({ message: 'Failed to save winner data', error: error.message });
  }
});

// Add a specific route to serve color_preview.html
app.get('/color-preview', (req, res) => {
  res.sendFile(path.join(__dirname, 'color_preview.html'));
});

// API endpoint for getting color win statistics
app.get('/api/color-stats', async (req, res) => {
  try {
    console.log('[SERVER] Received GET request to /api/color-stats');
    
    // Query the database to get all winner records
    console.log('[SERVER] Querying Supabase for color statistics...');
    const { data, error } = await supabase
      .from('game_winners')
      .select('winning_ball_color');
    
    if (error) {
      console.error('[SERVER] Supabase error during color stats query:', error);
      throw error;
    }
    
    // Count wins manually since groupBy is not supported in the JS client
    const colorStats = {};
    if (data && data.length > 0) {
      data.forEach(winner => {
        const color = winner.winning_ball_color;
        if (colorStats[color]) {
          colorStats[color]++;
        } else {
          colorStats[color] = 1;
        }
      });
    }
    
    console.log('[SERVER] Color statistics retrieved successfully:', colorStats);
    res.json({ colorStats });
  } catch (error) {
    console.error('[SERVER] Error retrieving color statistics:', error);
    console.error('[SERVER] Stack trace:', error.stack);
    res.status(500).json({ message: 'Failed to retrieve color statistics', error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`===================================`);
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
  console.log(`===================================`);
});
