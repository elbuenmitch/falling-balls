// A simple script to test Supabase connection and verify table existence
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

console.log('Testing Supabase connection:');
console.log('URL:', supabaseUrl ? `Found (${supabaseUrl})` : 'Not found');
console.log('API Key:', supabaseKey ? `Found (first 10 chars: ${supabaseKey.substring(0, 10)}...)` : 'Not found');

const supabase = createClient(supabaseUrl, supabaseKey);

// Test if the table exists
async function checkTableExists() {
  try {
    console.log('Checking if anonymous_game_settings table exists...');
    
    // List all tables in the database
    const { data, error } = await supabase
      .from('anonymous_game_settings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Error accessing table:', error);
      
      if (error.message === 'relation "anonymous_game_settings" does not exist') {
        console.log('The table "anonymous_game_settings" does not exist in your Supabase database.');
        console.log('You need to create the table using the migration script in db/migrations/001_create_game_settings.sql');
      } else if (error.message === 'Invalid API key') {
        console.log('Your Supabase API key is invalid or not correctly configured.');
        console.log('Please check that the API key in your .env file is correct.');
      }
      
      return false;
    }
    
    console.log('Table exists! Example data:', data);
    return true;
  } catch (err) {
    console.error('Unexpected error:', err);
    return false;
  }
}

checkTableExists();
