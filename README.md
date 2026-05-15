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
- `/rules post` posts the server rules banner and rules text.
- `/rules preview` previews the server rules privately.
- `/announcement post` posts the launch announcement to `#announcements`.
- `/announcement preview` previews the launch announcement privately.
- Tracks new Discord members in a Notion database when Notion env vars are configured.
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
   - `WELCOME_BANNER_PATH`: fallback welcome banner image.
   - `RULES_CHANNEL_NAME`: fallback rules channel name.
   - `RULES_BANNER_PATH`: fallback rules banner image.
   - `ANNOUNCEMENTS_CHANNEL_NAME`: fallback announcements channel name.
   - `NOTION_TOKEN`: your Notion integration secret.
   - `NOTION_MEMBERS_DATABASE_ID`: the database where joined members are tracked.
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

The default welcome message now welcomes members to Wealth Operators 2.0 and attaches `assets/welcome-banner.png`.

## Rules Message

The default rules message uses `assets/rules-banner.png`, copied from `C:\Users\strul\Desktop\rules.png`, and follows the style from `C:\Users\strul\Desktop\abc.png`.

Post it in Discord:

```text
/rules post
```

By default it posts to `#rules`. You can choose another channel:

```text
/rules post channel:#rules
```

The bot sends the banner first, then the rules text underneath.

## Launch Announcement

The default launch announcement was copied from `C:\Users\strul\Desktop\first.txt`.

Post it in Discord:

```text
/announcement post
```

By default it posts to `#announcements`. You can choose another channel:

```text
/announcement post channel:#announcements
```

## Notion Member Tracking

The bot can track every new Discord member in Notion.

The database columns are:

- `Name`
- `User ID`
- `Username`
- `Display Name`
- `Server`
- `Server ID`
- `Status`
- `Bot`
- `Joined At`
- `Account Created`
- `Avatar URL`

Create a Notion integration, give it insert/read/update content capabilities, then share the parent Notion page with that integration.

Add these locally or in Render:

```text
NOTION_TOKEN=secret_your-notion-integration-token
NOTION_PARENT_PAGE_ID=your-notion-parent-page-id
NOTION_MEMBERS_DATABASE_TITLE=Discord Members
```

Create the database once:

```bash
npm run notion:create-database
```

Copy the printed database ID into Render:

```text
NOTION_MEMBERS_DATABASE_ID=created-notion-members-database-id
```

After redeploy, every new Discord join creates or updates a row in that Notion database. If the same user rejoins the same server, the bot updates their row and sets `Status` to `Rejoined`.

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
   - `WELCOME_BANNER_PATH`
   - `RULES_CHANNEL_NAME`
   - `RULES_BANNER_PATH`
   - `ANNOUNCEMENTS_CHANNEL_NAME`
   - `NOTION_TOKEN`
   - `NOTION_MEMBERS_DATABASE_ID`

Do not commit your real token. Keep it only in `.env` locally or Render environment variables.
