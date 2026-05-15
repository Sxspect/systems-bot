const {
  ChannelType,
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
    .setName("setupserver")
    .setDescription("Create the default server channel layout.")
    .addBooleanOption((option) =>
      option
        .setName("confirm")
        .setDescription("Set this to true to create missing categories and channels.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("welcome")
    .setDescription("Configure automatic welcome messages.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setDescription("Set the welcome channel and message.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Where welcome messages should be sent.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("Use {user}, {username}, and {server} as placeholders.")
            .setMaxLength(1800)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("preview")
        .setDescription("Preview the current welcome message.")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("off")
        .setDescription("Turn automatic welcome messages off.")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("rules")
    .setDescription("Post or preview the server rules message.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("post")
        .setDescription("Post the rules banner and rules message.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Where the rules message should be posted.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("preview")
        .setDescription("Preview the rules message privately.")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("announcement")
    .setDescription("Post or preview the launch announcement.")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("post")
        .setDescription("Post the launch announcement.")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("Where the announcement should be posted.")
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("preview")
        .setDescription("Preview the launch announcement privately.")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show available commands.")
];

const commands = commandBuilders.map((command) => command.toJSON());

module.exports = {
  commandBuilders,
  commands
};
