# Discord Render Bot

A small Discord bot ready to deploy on Render.

## Features

- `/ping` checks if the bot is online.
- `/server` shows server info.
- `/userinfo` shows user info.
- `/say` lets moderators send a bot message.
- `/clear` bulk deletes recent messages.
- `/setupserver` creates the default server channel layout.
- `/welcome set` configures automatic welcome messages.
- `/welcome preview` previews the current welcome message.
- `/welcome off` disables automatic welcome messages.
- `/help` lists commands.
- `/health` keeps Render health checks happy.

## Local Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Fill in:
   - `DISCORD_TOKEN`: your bot token from the Discord Developer Portal.
   - `CLIENT_ID`: the Application ID from the General Information page.
   - `GUILD_ID`: your Discord server ID.
   - `WELCOME_CHANNEL_NAME`: fallback welcome channel name.
   - `WELCOME_MESSAGE`: fallback welcome message.
4. Install dependencies:

```bash
npm install
```

5. Register slash commands:

```bash
npm run register
```

6. Start the bot:

```bash
npm start
```

## Discord Invite Link

Replace `YOUR_CLIENT_ID` with your Application ID:

```text
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=274877975552&integration_type=0&scope=bot+applications.commands
```

If `/setupserver` says the bot needs Manage Channels permission, give the bot role Manage Channels in Discord or reinvite it with the needed permissions.

## Welcome Messages

Enable Server Members Intent in the Discord Developer Portal:

1. Open your application.
2. Go to Bot.
3. Turn on Privileged Gateway Intents -> Server Members Intent.
4. Save changes and restart the bot.

Then run this in Discord:

```text
/welcome set channel:#welcome message:Welcome to {server}, {user}! Glad to have you here.
```

Supported placeholders:

- `{user}` mentions the new member.
- `{username}` shows their username.
- `{server}` shows the server name.

The custom welcome settings are saved to `data/welcome-settings.json`. On Render, use a persistent disk if you need command-based welcome settings to survive redeploys. Without that, set `WELCOME_CHANNEL_NAME` and `WELCOME_MESSAGE` as Render environment variables.

## Render Deployment

1. Push this repo to GitHub.
2. In Render, create a new Web Service from the GitHub repo.
3. Use:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Health Check Path: `/health`
4. Add these Environment Variables in Render:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`
   - `WELCOME_CHANNEL_NAME`
   - `WELCOME_MESSAGE`

Do not commit your real token. Keep it only in `.env` locally or Render environment variables.
