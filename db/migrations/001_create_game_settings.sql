-- Create game_settings table
CREATE TABLE IF NOT EXISTS game_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ball_count INT NOT NULL DEFAULT 20,
  ball_radius INT NOT NULL DEFAULT 20,
  obstacle_count INT NOT NULL DEFAULT 20,
  max_size FLOAT NOT NULL DEFAULT 1.5,
  movement_speed FLOAT NOT NULL DEFAULT 2.0,
  jump_force FLOAT NOT NULL DEFAULT 0.15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policy for game_settings
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to read only their own settings
CREATE POLICY "User can read their own settings" ON game_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own settings
CREATE POLICY "User can insert their own settings" ON game_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own settings
CREATE POLICY "User can update their own settings" ON game_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create an anonymous settings table that doesn't require authentication
CREATE TABLE IF NOT EXISTS anonymous_game_settings (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  ball_count INT NOT NULL DEFAULT 20,
  ball_radius INT NOT NULL DEFAULT 20,
  obstacle_count INT NOT NULL DEFAULT 20,
  max_size FLOAT NOT NULL DEFAULT 1.5,
  movement_speed FLOAT NOT NULL DEFAULT 2.0,
  jump_force FLOAT NOT NULL DEFAULT 0.15,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id)
);

-- Enable RLS on anonymous settings
ALTER TABLE anonymous_game_settings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous access for this table
CREATE POLICY "Allow anonymous access" ON anonymous_game_settings
  FOR ALL USING (true);
