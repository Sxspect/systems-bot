require("dotenv").config();

const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes,
  ChannelType
} = require("discord.js");
const { commands } = require("./commands");
const { setupServerChannels } = require("./serverSetup");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const port = Number(process.env.PORT || 3000);
const welcomeConfigPath = process.env.WELCOME_CONFIG_PATH || path.join(process.cwd(), "data", "welcome-settings.json");
const defaultWelcomeSettings = {
  enabled: true,
  channelId: null,
  channelName: process.env.WELCOME_CHANNEL_NAME || "welcome",
  bannerPath: process.env.WELCOME_BANNER_PATH || path.join(process.cwd(), "assets", "welcome-banner.png"),
  message:
    process.env.WELCOME_MESSAGE ||
    [
      "Greetings {user}!",
      "",
      "------------------------------",
      "**Welcome to Wealth Operators 2.0**",
      "Your presence is a valuable addition. **Welcome!**",
      "------------------------------",
      "> Make sure to read our rules here {rules}",
      "> Stay updated with {announcements}",
      "------------------------------"
    ].join("\n")
};

if (!token) {
  throw new Error("Missing DISCORD_TOKEN environment variable.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const app = express();

function loadWelcomeSettings() {
  if (!fs.existsSync(welcomeConfigPath)) {
    return { ...defaultWelcomeSettings };
  }

  try {
    const savedSettings = JSON.parse(fs.readFileSync(welcomeConfigPath, "utf8"));
    return { ...defaultWelcomeSettings, ...savedSettings };
  } catch (error) {
    console.warn("Failed to load welcome settings. Using defaults:", error);
    return { ...defaultWelcomeSettings };
  }
}

let welcomeSettings = loadWelcomeSettings();

function saveWelcomeSettings(settings) {
  fs.mkdirSync(path.dirname(welcomeConfigPath), { recursive: true });
  fs.writeFileSync(welcomeConfigPath, `${JSON.stringify(settings, null, 2)}\n`);
  welcomeSettings = settings;
}

app.get("/", (_request, response) => {
  response.json({
    status: "ok",
    bot: client.user ? client.user.tag : "starting"
  });
});

app.get("/health", (_request, response) => {
  response.status(200).send("ok");
});

app.listen(port, () => {
  console.log(`Health server listening on port ${port}`);
});

async function registerGuildCommands() {
  if (!clientId || !guildId) {
    console.warn("Skipping slash command registration. CLIENT_ID and GUILD_ID are required.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands
  });
  console.log(`Registered ${commands.length} slash commands for guild ${guildId}`);
}

async function registerGlobalCommands() {
  if (!clientId) {
    console.warn("Skipping global slash command registration. CLIENT_ID is required.");
    return;
  }

  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationCommands(clientId), {
    body: commands
  });
  console.log(`Registered ${commands.length} global slash commands`);
}

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    await registerGuildCommands();
  } catch (error) {
    console.error("Failed to register guild slash commands:", error);
  }

  try {
    await registerGlobalCommands();
  } catch (error) {
    console.error("Failed to register global slash commands:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === "ping") {
      await interaction.reply({
        content: `Pong. WebSocket latency: ${client.ws.ping}ms`,
        ephemeral: true
      });
      return;
    }

    if (interaction.commandName === "server") {
      const guild = interaction.guild;
      const embed = new EmbedBuilder()
        .setTitle(guild.name)
        .setColor(0x5865f2)
        .addFields(
          { name: "Members", value: String(guild.memberCount), inline: true },
          { name: "Created", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>`, inline: true },
          { name: "Server ID", value: guild.id, inline: false }
        );

      if (guild.iconURL()) {
        embed.setThumbnail(guild.iconURL({ size: 256 }));
      }

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "userinfo") {
      const user = interaction.options.getUser("user") || interaction.user;
      const member = await interaction.guild.members.fetch(user.id).catch(() => null);
      const embed = new EmbedBuilder()
        .setTitle(user.tag)
        .setColor(0x57f287)
        .setThumbnail(user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "User ID", value: user.id, inline: false },
          { name: "Account Created", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`, inline: true }
        );

      if (member) {
        embed.addFields({
          name: "Joined Server",
          value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>`,
          inline: true
        });
      }

      await interaction.reply({ embeds: [embed] });
      return;
    }

    if (interaction.commandName === "say") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "You need Manage Messages permission.", ephemeral: true });
        return;
      }

      const message = interaction.options.getString("message", true);
      await interaction.reply({ content: "Sent.", ephemeral: true });
      await interaction.channel.send(message);
      return;
    }

    if (interaction.commandName === "clear") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageMessages)) {
        await interaction.reply({ content: "You need Manage Messages permission.", ephemeral: true });
        return;
      }

      const amount = interaction.options.getInteger("amount", true);
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({
        content: `Deleted ${deleted.size} message${deleted.size === 1 ? "" : "s"}.`,
        ephemeral: true
      });
      return;
    }

    if (interaction.commandName === "setupserver") {
      const confirmed = interaction.options.getBoolean("confirm", true);
      const me = await interaction.guild.members.fetchMe();
      const missingBotPermissions = [
        ["ManageChannels", PermissionFlagsBits.ManageChannels],
        ["ViewChannel", PermissionFlagsBits.ViewChannel]
      ]
        .filter(([, flag]) => !me.permissions.has(flag))
        .map(([name]) => name);

      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server permission.", ephemeral: true });
        return;
      }

      if (missingBotPermissions.length > 0) {
        await interaction.reply({
          content: `I am missing these permissions: ${missingBotPermissions.join(", ")}.`,
          ephemeral: true
        });
        return;
      }

      if (!confirmed) {
        await interaction.reply({
          content: "Run `/setupserver confirm:true` when you are ready.",
          ephemeral: true
        });
        return;
      }

      await interaction.deferReply({ ephemeral: true });
      try {
        const result = await setupServerChannels(interaction.guild);
        await interaction.editReply([
          `Server setup finished.`,
          `Created: ${result.created.length ? result.created.join(", ") : "nothing new"}`,
          `Skipped existing: ${result.skipped.length ? result.skipped.join(", ") : "none"}`
        ].join("\n"));
      } catch (error) {
        console.error("setupserver failed:", error);
        await interaction.editReply(`Setup failed: ${error?.message || "unknown error"}`);
      }
      return;
    }

    if (interaction.commandName === "welcome") {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.ManageGuild)) {
        await interaction.reply({ content: "You need Manage Server permission.", ephemeral: true });
        return;
      }

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "set") {
        const channel = interaction.options.getChannel("channel", true);
        const message = interaction.options.getString("message", true);
        const settings = {
          enabled: true,
          channelId: channel.id,
          channelName: channel.name,
          message
        };

        saveWelcomeSettings(settings);

        await interaction.reply({
          content: [
            `Welcome messages enabled in ${channel}.`,
            "Preview:",
            buildWelcomeMessage({
              userId: interaction.user.id,
              username: interaction.user.username,
              guildName: interaction.guild.name,
              guild: interaction.guild
            }, settings)
          ].join("\n"),
          ephemeral: true
        });
        return;
      }

      if (subcommand === "preview") {
        const channel = findWelcomeChannel(interaction.guild, welcomeSettings);

        await interaction.reply({
          ...buildWelcomePayload({
            userId: interaction.user.id,
            username: interaction.user.username,
            guildName: interaction.guild.name,
            guild: interaction.guild
          }),
          content: [
            `Status: ${welcomeSettings.enabled ? "on" : "off"}`,
            `Channel: ${channel ? `${channel}` : `#${welcomeSettings.channelName} not found`}`,
            "Preview:",
            buildWelcomeMessage({
              userId: interaction.user.id,
              username: interaction.user.username,
              guildName: interaction.guild.name,
              guild: interaction.guild
            })
          ].join("\n"),
          ephemeral: true
        });
        return;
      }

      if (subcommand === "off") {
        saveWelcomeSettings({ ...welcomeSettings, enabled: false });
        await interaction.reply({ content: "Welcome messages turned off.", ephemeral: true });
        return;
      }
    }

    if (interaction.commandName === "help") {
      await interaction.reply({
        content: [
          "`/ping` - Check bot latency.",
          "`/server` - Show server info.",
          "`/userinfo` - Show user info.",
          "`/say` - Send a bot message. Requires Manage Messages.",
          "`/clear` - Delete recent messages. Requires Manage Messages.",
          "`/setupserver` - Create the default server channel layout. Requires Manage Server.",
          "`/welcome set` - Set the welcome channel and message. Requires Manage Server.",
          "`/welcome preview` - Preview the welcome message.",
          "`/welcome off` - Turn welcome messages off. Requires Manage Server.",
          "`/help` - Show this list."
        ].join("\n"),
        ephemeral: true
      });
    }
  } catch (error) {
    console.error(`Error handling /${interaction.commandName}:`, error);

    const response = {
      content: "Something went wrong while running that command.",
      ephemeral: true
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(response);
    } else {
      await interaction.reply(response);
    }
  }
});

function buildWelcomeMessage(member, settings = welcomeSettings) {
  return settings.message
    .replaceAll("{user}", `<@${member.userId}>`)
    .replaceAll("{username}", member.username)
    .replaceAll("{server}", member.guildName)
    .replaceAll("{rules}", findTextChannelMention(member.guild, "rules"))
    .replaceAll("{announcements}", findTextChannelMention(member.guild, "announcements"))
    .replaceAll("{introductions}", findTextChannelMention(member.guild, "introductions"));
}

function findTextChannelMention(guild, channelName) {
  if (!guild) {
    return `#${channelName}`;
  }

  const channel = guild.channels.cache.find((candidate) =>
    candidate.type === ChannelType.GuildText &&
    candidate.name.toLowerCase() === channelName.toLowerCase()
  );

  return channel ? `${channel}` : `#${channelName}`;
}

function resolveBannerPath(settings = welcomeSettings) {
  const bannerPath = settings.bannerPath || defaultWelcomeSettings.bannerPath;

  if (!bannerPath) {
    return null;
  }

  return path.isAbsolute(bannerPath) ? bannerPath : path.join(process.cwd(), bannerPath);
}

function buildWelcomePayload(member, settings = welcomeSettings) {
  const payload = {
    content: buildWelcomeMessage(member, settings)
  };
  const bannerPath = resolveBannerPath(settings);

  if (bannerPath && fs.existsSync(bannerPath)) {
    payload.files = [bannerPath];
  }

  return payload;
}

function findWelcomeChannel(guild, settings = welcomeSettings) {
  if (settings.channelId) {
    const configuredChannel = guild.channels.cache.get(settings.channelId);

    if (configuredChannel?.type === ChannelType.GuildText) {
      return configuredChannel;
    }
  }

  return guild.channels.cache.find((channel) =>
    channel.type === ChannelType.GuildText &&
    channel.name.toLowerCase() === settings.channelName.toLowerCase()
  );
}

client.on("guildMemberAdd", async (member) => {
  try {
    if (!welcomeSettings.enabled) {
      return;
    }

    const channel = findWelcomeChannel(member.guild);

    if (!channel) {
      console.warn(`No #${welcomeSettings.channelName} channel found in ${member.guild.name}.`);
      return;
    }

    await channel.send(buildWelcomePayload({
      userId: member.id,
      username: member.user.username,
      guildName: member.guild.name,
      guild: member.guild
    }));
  } catch (error) {
    console.error(`Failed to send welcome message for ${member.user.tag}:`, error);
  }
});

client.login(token);
