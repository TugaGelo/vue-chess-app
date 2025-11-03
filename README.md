# Vue Chess App ♟️

A real-time multiplayer chess application built with Vue 3, Pinia, Socket.IO, and Supabase.

## Description

This application allows multiple users to play chess against each other simultaneously. It's designed with office environments in mind, enabling colleagues to easily find opponents and play, even when connected through the same network IP address. The app features live gameplay, game history viewing, and variation analysis.

## Features ✨

-   **Real-time Multiplayer**: Play chess live against others using Socket.IO for instant move updates.
-   **Matchmaking**: Simple "Play" button to automatically find an available opponent.
-   **Game History**: Stores completed games (using Supabase) for later review.
-   **Replay & Analysis**: View past games move-by-move and create/save analysis variations.
-   **Figurine Notation**: Uses Unicode chess pieces (e.g., ♘f3, ♝c5) in move lists.
-   **Sound Effects**: Audio feedback for moves, captures, checks, game start/end, etc.
-   **Office Friendly**: Designed to handle multiple simultaneous games from users sharing the same public IP address.

## Tech Stack & Architecture

This project runs as a single application. The `package.json` manages both client and server dependencies.

* **Client (Vue)**: The frontend is a **Vue 3** + **Pinia** application built with Vite.
* **Server (Node.js)**: The backend is a single **`server.js`** file using **Express** and **Socket.IO** to manage real-time game logic.
* **Database**: **Supabase** is used for authentication and storing game data.
* **Dev Script**: The `npm run dev` command uses **`concurrently`** to run both the Vite client and the Node.js server at the same time.

---

## Setup & Installation ⚙️

Follow these steps to set up the entire application, including the database, client, and server.

### Step 1: Clone & Install Dependencies

First, clone the repo and install all dependencies from the root `package.json`.

```sh
git clone [https://github.com/TugaGelo/vue-chess-app](https://github.com/TugaGelo/vue-chess-app)
cd vue-chess-app

# Install all client AND server dependencies
npm install
```

### Step 2: Supabase Project Setup

1.  **Create Project**: Go to [supabase.com](https://supabase.com) and create a new, free project.
2.  **Get API Keys**: Go to your project's **Settings > API**. You will need three values:
    * Project URL (e.g., `https://<your-ref>.supabase.co`)
    * `anon` (public) key
    * `service_role` (secret) key
3.  **Setup Auth**: Our database functions need a `username` for each user.
    * Go to **Authentication > Providers** and ensure **Email** is enabled.
    * Go to **Authentication > Settings** and turn **OFF** the **"Confirm email"** toggle. This makes testing sign-ups *much* easier, as you won't have to check your email.
4.  **Run SQL Setup**: Go to the **SQL Editor** in your Supabase dashboard. Copy and paste the **entire** block below and run it as one query.

```sql
/*
 * =======================================
 * 1. CREATE 'games' TABLE
 * =======================================
 */
CREATE TABLE public.games (
  id uuid NOT NULL DEFAULT gen_random_uuid (),
  created_at timestamp WITH TIME zone NOT NULL DEFAULT NOW(),
  white_player_id uuid NULL,
  black_player_id uuid NULL,
  result text NULL,
  pgn text NULL,
  ended_at timestamp WITH TIME zone NULL,
  variations jsonb NULL DEFAULT '[]'::jsonb,
  CONSTRAINT games_pkey PRIMARY KEY (id),
  CONSTRAINT games_black_player_id_fkey FOREIGN KEY (black_player_id) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT games_white_player_id_fkey FOREIGN KEY (white_player_id) REFERENCES auth.users (id) ON DELETE SET NULL
);

/*
 * =======================================
 * 2. ENABLE ROW LEVEL SECURITY (RLS)
 * We lock the table down. All access
 * will be via the server (service_key) or
 * 'SECURITY DEFINER' functions.
 * =======================================
 */
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;

-- Deny all public access by default.
-- This is secure because our server uses the service_role key
-- (which bypasses RLS) and our client uses the functions below.
CREATE POLICY "Deny all access"
ON public.games
FOR ALL
USING (false)
WITH CHECK (false);

/*
 * =======================================
 * 3. CREATE 'get_game_by_id' FUNCTION
 * Fetches game details & usernames
 * =======================================
 */
DROP FUNCTION IF EXISTS public.get_game_by_id(uuid);

CREATE OR REPLACE FUNCTION public.get_game_by_id(game_id uuid)
RETURNS TABLE(
    id uuid,
    created_at timestamp WITH TIME zone,
    white_player_id uuid,
    black_player_id uuid,
    result text,
    pgn text,
    ended_at timestamp WITH TIME zone,
    variations jsonb,
    white_username text,
    black_username text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public -- Required for SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.*,
        wu.raw_user_meta_data->>'username' AS white_username,
        bu.raw_user_meta_data->>'username' AS black_username
    FROM
        public.games g
    LEFT JOIN
        auth.users wu ON g.white_player_id = wu.id
    LEFT JOIN
        auth.users bu ON g.black_player_id = bu.id
    WHERE
        g.id = game_id;
END;
$$;


/*
 * =======================================
 * 4. CREATE 'get_game_history' FUNCTION
 * Fetches game list & usernames
 * =======================================
 */
DROP FUNCTION IF EXISTS public.get_game_history();

CREATE OR REPLACE FUNCTION public.get_game_history()
RETURNS TABLE(
    id uuid,
    created_at timestamp WITH TIME zone,
    white_username text,
    black_username text,
    result text,
    ended_at timestamp WITH TIME zone
)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.created_at,
        wu.raw_user_meta_data->>'username' AS white_username,
        bu.raw_user_meta_data->>'username' AS black_username,
        g.result,
        g.ended_at
    FROM
        public.games g
    LEFT JOIN auth.users wu ON g.white_player_id = wu.id
    LEFT JOIN auth.users bu ON g.black_player_id = bu.id
    ORDER BY g.created_at DESC;
END;
$$;
```

### Step 3: Configure Environment Variables (CRITICAL!)

You must create **two** files to store your Supabase keys. **Do not commit these files to Git.**

1.  **For the Server (`server.js`)**:
    Create a file named `.env` in the project's **root** directory (`vue-chess-app/.env`). Add your secret `service_role` key here:
    ```ini
    # .env (for the Node.js server)
    SUPABASE_URL=https://<your-project-ref>.supabase.co
    SUPABASE_SERVICE_KEY=<your-supabase-SERVICE-ROLE-key>
    ```

2.  **For the Client (Vue App)**:
    Create a file named `.env.local` in the project's **root** directory (`vue-chess-app/.env.local`). Add your public `anon` key here. **Note the `VITE_` prefix is required by Vite.**
    ```ini
    # .env.local (for the Vue client)
    VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
    VITE_SUPABASE_ANON_KEY=<your-supabase-ANON-key>
    ```

### Step 4: Update Code to Use Environment Variables

You must now modify your code to *use* these new variables.

1.  **Modify `server.js` (Server-side)**:
    This removes your hard-coded secret key. First, you must install the `dotenv` package:
    ```sh
    npm install dotenv
    ```

    Next, find these lines at the top of `server.js`:
    ```javascript
    //...
    import { createClient } from '@supabase/supabase-js';

    const supabase = createClient(
      '[https://iuzyffugeksdulkkvmnh.supabase.co](https://iuzyffugeksdulkkvmnh.supabase.co)',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1enlmZnVnZWtzZHVsa2t2bW5oIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM3MDc1OCwiZXhwIjoyMDc0OTQ2NzU4fQ.xVjn6WGyzVMcwj0wKSfhOUTDhDdOq41J9yCoy2Xxuvk'
    );
    //...
    ```

    **Replace them with this:**
    ```javascript
    //...
    import { createClient } from '@supabase/supabase-js';
    import 'dotenv/config'; // Import dotenv to read .env file

    // Check for environment variables
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file');
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    //...
    ```

2.  **Create Supabase Client (Client-side)**:
    Your Vue app needs its own Supabase client. Create a new file at **`src/supabase.js`** and add the following:
    ```javascript
    // src/supabase.js
    import { createClient } from '@supabase/supabase-js'

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

    export const supabase = createClient(supabaseUrl, supabaseAnonKey)
    ```

3.  **Update Your Auth Logic (Client-side)**:
    Now, tell your `user` store to use this new Supabase client and correctly handle the `username` on sign-up.

    * Find your Pinia store for users (likely at **`src/stores/user.js`**).
    * **Import** the new client at the top of that file:
        ```javascript
        import { supabase } from '@/supabase'; // Import the client we just made
        import { defineStore } from 'pinia';
        // ... other imports
        ```
    * **Find** your `signUp` function.
    * **Replace it** with this version. This is **required** for your SQL functions to get the username.
        ```javascript
        // Inside your defineStore({ ... actions: { ... } })

        async signUp(email, password, username) {
          if (!username) {
            throw new Error('Username is required.');
          }
          
          // This options.data object is CRITICAL
          const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
              data: {
                username: username 
              }
            }
          });

          if (error) throw error;
          return data;
        },
        ```
    * Ensure your other auth functions in that file (like `signIn`, `signOut`, `sendPasswordResetEmail`, `updatePassword`) also use the `supabase` client you just imported. For example:
        ```javascript
        async signIn(email, password) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
          });
          if (error) throw error;
          return data;
        },
        ```

### Step 5: Run the Application

Now you are ready to run the project.

```sh
# This one command runs both the server and client
npm run dev
```

Your server will be running on `http://localhost:3000` and your Vite client will be available at `http://localhost:5173` (or the next available port).

## Usage 🖱️

1.  Open `http://localhost:5173` in your browser.
2.  **Sign Up** for a new account (you must provide a **username**).
3.  Click the "Play" button to enter the matchmaking queue.
4.  Open a **second browser window** (e.g., in Incognito Mode) and sign up with a *different* account.
5.  Click "Play" on the second account. The two users will be matched, and the game will start.
6.  After a game, click "View Game History" to access the list of completed games.
