# Falling Balls Game

## Tech Stack
- Javascript, HTML and CSS for frontend
- Matter.js for physics simulation
- Express.js for backend API
- Supabase for database persistence
- Python for automated testing

## Features
- Physics-based ball movement and obstacle interaction
- Customizable game settings (ball count, size, obstacle count, etc.)
- Persistent game settings using Supabase database
- Session-based storage of user preferences

## Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up Supabase:
   - Create a new project on [Supabase](https://supabase.com)
   - Get your project URL and API keys
   - Run the setup script:
     ```
     bash db/setup_supabase.sh
     ```
   - Edit the `.env` file with your Supabase credentials
4. Apply database migrations:
   - Use the Supabase dashboard SQL editor to run the SQL in `db/migrations`
   - Or use the Supabase CLI to apply migrations
5. Start the development server:
   ```
   npm start
   ```

## Running the Game
- Start the Express server:
  ```
  npm start
  ```
- Open your browser to `http://localhost:3000`
- Your game settings will automatically be saved to Supabase and restored when you reload the page

## Game Rules
- The game is a physics-based simulation where players control balls that interact with obstacles.
- Customize the number of balls, their size, and obstacle properties before starting.
- Click and drag a ball to select and control it.
- Navigate through moving obstacles to reach the bottom of the screen.
- The last ball to survive wins the game.

## Game Controls
- Click and drag a ball to control it
- Release the ball to let it fall
- Adjust game settings using the controls at the top of the screen
- All settings are automatically saved to Supabase for your next session

## Testing
- Run the tests to verify database persistence functionality:
  ```
  npm test
  ```

## Database Structure
- The game uses two tables in Supabase:
  - `game_settings`: For authenticated users (future implementation)
  - `anonymous_game_settings`: For non-authenticated sessions
- Settings are associated with a unique session ID stored in localStorage