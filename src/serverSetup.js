const { ChannelType, PermissionFlagsBits } = require("discord.js");

const channelLayout = [
  {
    category: "🔰 START HERE",
    channels: [
      { name: "welcome", type: ChannelType.GuildText },
      { name: "rules", type: ChannelType.GuildText },
      { name: "announcements", type: ChannelType.GuildText },
      { name: "get-access", type: ChannelType.GuildText }
    ]
  },
  {
    category: "🧠 COMMUNITY",
    channels: [
      { name: "general", type: ChannelType.GuildText },
      { name: "introductions", type: ChannelType.GuildText },
      { name: "wins", type: ChannelType.GuildText },
      { name: "value-drops", type: ChannelType.GuildText }
    ]
  },
  {
    category: "💼 BUSINESS",
    channels: [
      { name: "agency-talk", type: ChannelType.GuildText },
      { name: "saas", type: ChannelType.GuildText },
      { name: "ai-automation", type: ChannelType.GuildText },
      { name: "growth", type: ChannelType.GuildText }
    ]
  },
  {
    category: "🧲 NETWORKING",
    channels: [
      { name: "connect", type: ChannelType.GuildText },
      { name: "collabs", type: ChannelType.GuildText },
      { name: "hiring", type: ChannelType.GuildText },
      { name: "offers", type: ChannelType.GuildText }
    ]
  },
  {
    category: "🛠 RESOURCES",
    channels: [
      { name: "tools", type: ChannelType.GuildText },
      { name: "guides", type: ChannelType.GuildText },
      { name: "templates", type: ChannelType.GuildText }
    ]
  },
  {
    category: "🎯 OPERATIONS",
    channels: [
      { name: "systems", type: ChannelType.GuildText },
      { name: "funnels", type: ChannelType.GuildText },
      { name: "client-delivery", type: ChannelType.GuildText }
    ]
  },
  {
    category: "🔒 PRIVATE",
    private: true,
    channels: [
      { name: "inner-circle", type: ChannelType.GuildText },
      { name: "high-ticket", type: ChannelType.GuildText }
    ]
  },
  {
    category: "⚙️ SUPPORT",
    channels: [
      { name: "support", type: ChannelType.GuildText },
      { name: "faq", type: ChannelType.GuildText }
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
