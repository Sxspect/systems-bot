require("dotenv").config();

const { REST, Routes } = require("discord.js");
const { commands } = require("../src/commands");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

if (!token || !clientId || !guildId) {
  throw new Error("DISCORD_TOKEN, CLIENT_ID, and GUILD_ID are required.");
}

const rest = new REST({ version: "10" }).setToken(token);

async function main() {
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands
    });
    console.log(`Registered ${commands.length} guild slash commands for guild ${guildId}`);
  }

  await rest.put(Routes.applicationCommands(clientId), {
    body: commands
  });

  console.log(`Registered ${commands.length} global slash commands`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
