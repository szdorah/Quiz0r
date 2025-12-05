# Quiz Master

A real-time multiplayer quiz game application built with Next.js, Socket.io, and Prisma. Host interactive quizzes where players join via QR code on their mobile devices.

## Quick Start

### Prerequisites

- Node.js 18.17.0 or higher
- npm or yarn

### Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open http://localhost:3000

### Production (Docker)

Build and run the Docker container:

```bash
docker-compose up -d --build
```

The app will be available at http://localhost:3000

## Usage

### Creating a Quiz

1. Go to http://localhost:3000/admin
2. Click "New Quiz" to create a quiz
3. Add questions with multiple choice answers
4. Mark correct answers for each question

### Hosting a Game

1. Go to http://localhost:3000/host
2. Select a quiz and click "Start Game"
3. Two windows open:
   - **Display Window** - Shows QR code, questions, and scoreboard (share on screen)
   - **Control Panel** - Manage game flow (keep on your device)

### Joining a Game (Players)

1. Scan the QR code or go to the join URL
2. Enter the 6-character game code
3. Enter your name and wait for the game to start

## External Access (ngrok)

To allow players outside your local network to join:

1. Get a free ngrok auth token at https://dashboard.ngrok.com/get-started/your-authtoken
2. Go to http://localhost:3000/admin/settings
3. Add your ngrok token
4. Start the tunnel

The QR code on the display screen will automatically use the ngrok URL.

### Security

When using ngrok, only the player routes are accessible externally:
- `/play` - Game code entry
- `/play/[gameCode]` - Join and play the quiz

All admin and host routes are blocked from external access.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── admin/              # Quiz management (protected)
│   ├── host/               # Game hosting (protected)
│   ├── play/               # Player join/play (public)
│   └── api/                # API routes
├── components/             # Reusable UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility functions
│   ├── db.ts               # Prisma client
│   └── tunnel.ts           # ngrok tunnel management
├── server/                 # Server-side code
│   └── game-manager.ts     # Socket.io game logic
└── middleware.ts           # Route protection
```

## Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./data/quiz.db"
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.io
- **Styling**: Tailwind CSS + shadcn/ui
- **Tunneling**: ngrok