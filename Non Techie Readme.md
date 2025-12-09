# Quiz0r - Non-Tech Setup Guide

A plain-language checklist for running the Quiz0r multiplayer quiz app with Docker and sharing it over the internet with ngrok.

## What you need
- This project folder (a "repo") on your computer. A repo is just a folder that holds the app's files and version history; you can download it as a ZIP or clone it with Git.
- Docker Desktop installed and running: https://www.docker.com/products/docker-desktop/  
  Think of Docker as a container that bundles everything the app needs so you do not have to install tools one by one.
- An ngrok account (free is fine) and your **authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken  
  ngrok creates a temporary public web link that forwards to your computer so players outside your Wi-Fi can join.
- A terminal/command prompt (the text window where you type commands).
- A web browser on the computer that will host the game.

## How to open a terminal
- Mac: Press Command+Space, type "Terminal", press Enter.
- Windows: Press Windows key, type "PowerShell" (or "Terminal" on Windows 11), press Enter.
Once it is open, you can type commands and press Enter to run them.

## Start the app with Docker
1. Get the project onto your computer (download the ZIP from your repo hosting site, unzip it, and you will have a folder named `quiz0r`).
2. Open a terminal and move into that folder:  
   - Mac example: `cd ~/Downloads/quiz0r` (adjust path if you moved it).  
   - Windows example: `cd \"C:\\Users\\YOURNAME\\Downloads\\quiz0r\"` (replace YOURNAME).
3. Make sure Docker Desktop is running (open it once; leave it running in the background).
4. Start the app in Docker (first run builds everything and can take a few minutes):  
   `docker compose up -d --build`
5. Check that it started:  
   `docker compose logs -f`  
   Wait until you see "Ready on http://localhost:3000". Press Ctrl+C to stop watching logs.
6. Open `http://localhost:3000/admin` on the same computer to create your first quiz. (Admin/host pages only work locally; players join through the links you share.)

Stop/restart later with `docker compose down` and `docker compose up -d`.

## Let players join from anywhere (ngrok)
1. Copy your ngrok **authtoken** from https://dashboard.ngrok.com/get-started/your-authtoken.
2. In your browser go to `http://localhost:3000/admin/settings`.
3. Paste the token and save. The app automatically starts an ngrok tunnel and shows the public link.
4. When you host a game, the QR code/join link uses that ngrok address so remote players can join. Players may see a one-time ngrok warning page - ask them to click through once.

## Running a game
- Build or import a quiz in `/admin`.
- Start the game at `/host`, share the QR code or "copy join link" with players.
- Players join via the link (or `http://localhost:3000/play` on your local network if you are not using ngrok).

## Notes and troubleshooting
- If the logs stop with a "Prisma migrate" or "migrations" error, run this once to create the database, then start again:  
  `docker compose run --rm quiz0r npx prisma db push`
- To keep quiz data between restarts, make sure the database file lives in the mounted volume. Easiest fix: set `DATABASE_URL=file:./prisma/data/quiz.db` in `docker-compose.yml` so it matches the `/app/prisma/data` volume.
- If port 3000 is already in use, stop the other service or change the port mapping in `docker-compose.yml`.
