# Quiz0r

A real-time multiplayer quiz game application built with Next.js, Socket.io, and Prisma. Host interactive quizzes where players join via QR code on their mobile devices.

## Features

- 🎯 **Real-time Multiplayer** - Multiple players compete simultaneously
- 📱 **Mobile-First** - Players join via QR code on their devices
- 🎨 **Custom Themes** - Pre-built themes, AI wizard, or custom JSON
- 📤 **Import/Export** - Share quizzes as ZIP files with images
- 🖼️ **Rich Media** - Add images to questions and answers
- 📊 **Live Results** - Real-time scoring and leaderboard
- 🔒 **Secure Hosting** - Admin/host routes protected from external access
- 🌐 **ngrok Integration** - Easy external access with automatic tunnel setup
- 👤 **Player Avatars** - Emoji or image avatars for players
- 📝 **Host Notes** - Private notes visible only to the host
- 🎯 **Question Types** - Single-select, multi-select, and section dividers

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
2. Click "New Quiz" or "Import Quiz" (to import from a ZIP file)
3. Add questions with multiple choice answers
4. Mark correct answers for each question
5. Optionally add images to questions and answers
6. Add host notes for private reminders during the game
7. Reorder questions by dragging and dropping
8. Click "Theme" to customize the visual appearance
9. Click "Export" to save the quiz as a ZIP file

### Customizing Themes

Quiz0r supports three ways to customize your quiz theme:

1. **Presets** - Choose from pre-built themes (Ocean, Sunset, Forest, Neon, etc.)
2. **AI Wizard** - Answer questions and get a custom prompt for ChatGPT/Claude
3. **JSON Editor** - Manually edit the theme JSON for full control

Themes control colors, gradients, animations, fonts, and celebration effects.

### Hosting a Game

1. Go to http://localhost:3000/host
2. Select a quiz and click "Start Game"
3. Two windows open:
   - **Display Window** - Shows QR code, questions, and scoreboard (share on screen/projector)
   - **Control Panel** - Manage game flow, preview questions, see host notes (keep on your device)
4. Use the "Copy Join URL" button to share the ngrok link
5. Click "Next" to advance through questions, "Show Results" to reveal answers

### Joining a Game (Players)

1. Scan the QR code or go to the join URL
2. Enter the 6-character game code
3. Choose an avatar (emoji or upload an image)
4. Enter your name and wait for the game to start
5. Answer questions and watch your score on the leaderboard

## External Access (ngrok)

To allow players outside your local network to join:

1. Get a free ngrok auth token at https://dashboard.ngrok.com/get-started/your-authtoken
2. Go to http://localhost:3000/admin/settings
3. Add your ngrok token (tunnel auto-starts and persists across restarts)

The QR code on the display screen automatically uses the ngrok URL when available.

**Note:** Players will see an ngrok warning page on first visit (ngrok free tier limitation). After clicking through once, ngrok sets a cookie and the warning won't appear again.

### Security

When using ngrok, only the player routes are accessible externally:
- `/play` - Game code entry
- `/play/[gameCode]` - Join and play the quiz

All admin and host routes are blocked from external access.

## Project Structure

```
src/
├── app/                          # Next.js app router pages
│   ├── admin/                    # Quiz management (protected)
│   │   ├── quiz/[quizId]/
│   │   │   ├── questions/        # Question editor
│   │   │   └── theme/            # Theme customization
│   │   └── settings/             # ngrok configuration
│   ├── host/                     # Game hosting (protected)
│   │   └── [gameCode]/
│   │       ├── control/          # Host control panel
│   │       └── display/          # Public display screen
│   ├── play/                     # Player join/play (public)
│   │   └── [gameCode]/           # Game interface
│   └── api/                      # API routes
│       ├── games/                # Game session management
│       ├── quizzes/              # Quiz CRUD + export/import
│       ├── settings/             # Settings management
│       ├── tunnel/               # ngrok tunnel status
│       └── upload/               # Image upload
├── components/                   # Reusable UI components
│   ├── admin/                    # Admin-specific components
│   ├── theme/                    # Theme system components
│   └── ui/                       # shadcn/ui components
├── hooks/                        # Custom React hooks
│   └── useSocket.ts              # Socket.io hook
├── lib/                          # Utility functions
│   ├── db.ts                     # Prisma client
│   ├── tunnel.ts                 # ngrok tunnel management
│   ├── theme.ts                  # Theme parsing/validation
│   ├── theme-presets.ts          # Pre-built themes
│   ├── theme-template.ts         # AI wizard prompt generator
│   ├── validate-import.ts        # Import validation
│   └── sanitize.ts               # XSS prevention
├── types/                        # TypeScript type definitions
│   ├── index.ts                  # Core types
│   ├── theme.ts                  # Theme types
│   └── export.ts                 # Export/import types
├── server/                       # Server-side code
│   └── game-manager.ts           # Socket.io game logic
└── middleware.ts                 # Route protection
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