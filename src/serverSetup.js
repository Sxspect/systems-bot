const { ChannelType, PermissionFlagsBits } = require("discord.js");

const channelLayout = [
  {
    category: "START HERE",
    channels: [
      { name: "rules", type: ChannelType.GuildText, topic: "Server rules and expectations." },
      { name: "announcements", type: ChannelType.GuildText, topic: "Important server updates." },
      { name: "welcome", type: ChannelType.GuildText, topic: "New member welcomes." }
    ]
  },
  {
    category: "COMMUNITY",
    channels: [
      { name: "general", type: ChannelType.GuildText, topic: "Main community chat." },
      { name: "media", type: ChannelType.GuildText, topic: "Share images, clips, and links." },
      { name: "commands", type: ChannelType.GuildText, topic: "Bot commands and testing." }
    ]
  },
  {
    category: "SUPPORT",
    channels: [
      { name: "support", type: ChannelType.GuildText, topic: "Ask for help here." },
      { name: "suggestions", type: ChannelType.GuildText, topic: "Share ideas for the server." }
    ]
  },
  {
    category: "STAFF",
    private: true,
    channels: [
      { name: "staff-chat", type: ChannelType.GuildText, topic: "Private staff discussion." },
      { name: "mod-logs", type: ChannelType.GuildText, topic: "Moderator notes and logs." }
    ]
  },
  {
    category: "VOICE",
    channels: [
      { name: "General Voice", type: ChannelType.GuildVoice },
      { name: "Staff Voice", type: ChannelType.GuildVoice, private: true }
    ]
  }
];

function findExistingChannel(guild, name, type, parentId = null) {
  return guild.channels.cache.find((channel) => {
    const sameParent = parentId ? channel.parentId === parentId : true;
    return channel.name.toLowerCase() === name.toLowerCase() && channel.type === type && sameParent;
  });
}

function privateOverwrites(guild) {
  return [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel]
    }
  ];
}

async function ensureCategory(guild, section, result) {
  const existing = findExistingChannel(guild, section.category, ChannelType.GuildCategory);

  if (existing) {
    result.skipped.push(section.category);
    return existing;
  }

  const category = await guild.channels.create({
    name: section.category,
    type: ChannelType.GuildCategory,
    permissionOverwrites: section.private ? privateOverwrites(guild) : undefined
  });

  result.created.push(section.category);
  return category;
}

async function setupServerChannels(guild) {
  const result = {
    created: [],
    skipped: []
  };

  for (const section of channelLayout) {
    const category = await ensureCategory(guild, section, result);

    for (const channel of section.channels) {
      const existing = findExistingChannel(guild, channel.name, channel.type, category.id);

      if (existing) {
        result.skipped.push(channel.name);
        continue;
      }

      await guild.channels.create({
        name: channel.name,
        type: channel.type,
        parent: category.id,
        topic: channel.topic,
        permissionOverwrites:
          channel.private || section.private ? privateOverwrites(guild) : undefined
      });
      result.created.push(channel.name);
    }
  }

  return result;
}

module.exports = {
  channelLayout,
  setupServerChannels
};
