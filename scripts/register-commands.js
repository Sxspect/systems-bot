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
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: commands
  });

  console.log(`Registered ${commands.length} slash commands for guild ${guildId}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
