const {
  PermissionFlagsBits,
  SlashCommandBuilder
} = require("discord.js");

const commandBuilders = [
  new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Check whether the bot is online."),

  new SlashCommandBuilder()
    .setName("server")
    .setDescription("Show basic information about this server."),

  new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Show information about a server member.")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to look up.")
        .setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("say")
    .setDescription("Make the bot send a message.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send.")
        .setMaxLength(1800)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Bulk delete recent messages from this channel.")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete, from 1 to 100.")
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands.")
];

const commands = commandBuilders.map((command) => command.toJSON());

module.exports = {
  commandBuilders,
  commands
};
