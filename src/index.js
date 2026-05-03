require("dotenv").config();

const express = require("express");
const {
  Client,
  EmbedBuilder,
  GatewayIntentBits,
  PermissionFlagsBits,
  REST,
  Routes
} = require("discord.js");
const { commands } = require("./commands");
const { setupServerChannels } = require("./serverSetup");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const port = Number(process.env.PORT || 3000);

if (!token) {
  throw new Error("Missing DISCORD_TOKEN environment variable.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const app = express();

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

    if (interaction.commandName === "help") {
      await interaction.reply({
        content: [
          "`/ping` - Check bot latency.",
          "`/server` - Show server info.",
          "`/userinfo` - Show user info.",
          "`/say` - Send a bot message. Requires Manage Messages.",
          "`/clear` - Delete recent messages. Requires Manage Messages.",
          "`/setupserver` - Create the default server channel layout. Requires Manage Server.",
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

client.login(token);
