# Vue Chess App ♟️

A real-time multiplayer chess application built with Vue 3, Pinia, Socket.IO, and Supabase.

## Description

This application allows multiple users to play chess against each other simultaneously. It's designed with office environments in mind, enabling colleagues to easily find opponents and play, even when connected through the same network IP address. The app features live gameplay, game history viewing, and variation analysis.

## Features ✨

- **Real-time Multiplayer**: Play chess live against others using Socket.IO for instant move updates.
- **Matchmaking**: Simple "Play" button to automatically find an available opponent.
- **Game History**: Stores completed games (using Supabase) for later review.
- **Replay & Analysis**: View past games move-by-move and create/save analysis variations.
- **Figurine Notation**: Uses Unicode chess pieces (e.g., ♘f3, ♝c5) in move lists.
- **Sound Effects**: Audio feedback for moves, captures, checks, game start/end, etc.
- **Office Friendly**: Designed to handle multiple simultaneous games from users sharing the same public IP address.

## How it Works (Office Context) 🏢

The application uses a Node.js server with Socket.IO to manage live connections. Each player connects via a unique socket ID, allowing the server to differentiate between users and manage multiple games concurrently, even if many users are connecting from the same office IP address. Game state is managed server-side, and completed games are persisted in a Supabase PostgreSQL database.

## Setup & Installation ⚙️

### Clone the Repo
```sh
git clone https://github.com/TugaGelo/vue-chess-app
cd vue-chess-app
```

### Install Dependencies

```sh
npm install
```

### Supabase Setup

- Create a free Supabase project at supabase.com.
- Go to the SQL Editor in your Supabase dashboard (sidebar > SQL Editor > + New query).
- Run the following SQL queries one by one:
  - Create the games table:
```sh
-- Create the games table
create table public.games (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  white_player_id uuid null,
  black_player_id uuid null,
  result text null,
  pgn text null,
  ended_at timestamp with time zone null,
  variations jsonb null default '[]'::jsonb, -- Stores analysis variations
  constraint games_pkey primary key (id),
  constraint games_black_player_id_fkey foreign key (black_player_id) references auth.users (id) on delete set null,
  constraint games_white_player_id_fkey foreign key (white_player_id) references auth.users (id) on delete set null
);

-- Enable Row Level Security (Important!)
alter table public.games enable row level security;

-- Allow logged-in users to read all games (adjust if needed)
create policy "Allow authenticated read access"
on public.games for select
using ( auth.role() = 'authenticated' );

-- Allow users to insert games (server uses service_role key, bypassing this, but good practice)
create policy "Allow individual user insert access"
on public.games for insert
with check ( auth.uid() = white_player_id OR auth.uid() = black_player_id ); -- Example check

-- Allow users to update games they participated in (primarily for server-side updates via service_key)
create policy "Allow individual user update access"
on public.games for update
using ( auth.uid() = white_player_id OR auth.uid() = black_player_id ); -- Example check
```

  - Drop the old get_game_by_id function (if it exists):
```sh
DROP FUNCTION IF EXISTS public.get_game_by_id(uuid);
```

  - Create the get_game_by_id database function:
```sh
-- Fetches game details including variations and usernames
CREATE OR REPLACE FUNCTION public.get_game_by_id(game_id uuid)
RETURNS TABLE(
    id uuid,
    created_at timestamp with time zone,
    white_player_id uuid,
    black_player_id uuid,
    result text,
    pgn text,
    ended_at timestamp with time zone,
    variations jsonb,
    white_username text,
    black_username text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Allows function to read auth.users safely
SET search_path = public -- Required for SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.*, -- Selects all columns from games, including 'variations'
        -- Assumes username is stored in raw_user_meta_data (default Supabase Auth)
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
```

  - Create get_game_history function 
```sh
-- Example function to get game list with usernames
-- Adjust the SELECT statement as needed for your HistoryView
DROP FUNCTION IF EXISTS public.get_game_history(); -- Add drop for safety
CREATE OR REPLACE FUNCTION public.get_game_history()
RETURNS TABLE(
     id uuid,
     created_at timestamp with time zone,
     white_username text,
     black_username text,
     result text,
     ended_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
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
     ORDER BY g.created_at DESC; -- Example ordering
 END;
 $$;
```

  - Create a .env file in the root project directory (vue-chess-app/.env) for the server:
```sh
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_KEY=<your-supabase-service-key>
```

  - Run the Application
```sh
npm run dev
```

## Usage 🖱️
1. Open the application in your browser (e.g., http://localhost:5173 or your computer's network IP address followed by :5173).
2. Log in or Sign up using Supabase Auth.
3. Click the "Play" button to enter the matchmaking queue.
4. Wait for an opponent. Once found, the game will start automatically.
5. After a game, click "View Game History" to access the list of completed games.
6. Click on a game in the history list to replay it or enter analysis mode.

