const notionToken = process.env.NOTION_TOKEN;
const membersDatabaseId = process.env.NOTION_MEMBERS_DATABASE_ID;
const notionVersion = process.env.NOTION_VERSION || "2022-06-28";

const memberDatabaseProperties = {
  Name: {
    title: {}
  },
  "User ID": {
    rich_text: {}
  },
  Username: {
    rich_text: {}
  },
  "Display Name": {
    rich_text: {}
  },
  Server: {
    rich_text: {}
  },
  "Server ID": {
    rich_text: {}
  },
  Status: {
    select: {
      options: [
        { name: "Joined", color: "green" },
        { name: "Rejoined", color: "blue" }
      ]
    }
  },
  Bot: {
    checkbox: {}
  },
  "Joined At": {
    date: {}
  },
  "Account Created": {
    date: {}
  },
  "Avatar URL": {
    url: {}
  }
};

function isNotionConfigured() {
  return Boolean(notionToken && membersDatabaseId);
}

async function notionRequest(path, options = {}) {
  if (!notionToken) {
    throw new Error("Missing NOTION_TOKEN environment variable.");
  }

  const response = await fetch(`https://api.notion.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${notionToken}`,
      "Content-Type": "application/json",
      "Notion-Version": notionVersion,
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion API ${response.status}: ${body}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

function notionText(content) {
  return [{ text: { content: content || "" } }];
}

function memberProperties(member, status) {
  const user = member.user;
  const displayName = member.displayName || user.globalName || user.username;

  return {
    Name: {
      title: notionText(displayName)
    },
    "User ID": {
      rich_text: notionText(member.id)
    },
    Username: {
      rich_text: notionText(user.tag || user.username)
    },
    "Display Name": {
      rich_text: notionText(displayName)
    },
    Server: {
      rich_text: notionText(member.guild.name)
    },
    "Server ID": {
      rich_text: notionText(member.guild.id)
    },
    Status: {
      select: { name: status }
    },
    Bot: {
      checkbox: user.bot
    },
    "Joined At": {
      date: { start: new Date().toISOString() }
    },
    "Account Created": {
      date: { start: user.createdAt.toISOString() }
    },
    "Avatar URL": {
      url: user.displayAvatarURL({ size: 256 })
    }
  };
}

async function findMemberPage(member) {
  const result = await notionRequest(`/v1/databases/${membersDatabaseId}/query`, {
    method: "POST",
    body: JSON.stringify({
      filter: {
        and: [
          {
            property: "User ID",
            rich_text: {
              equals: member.id
            }
          },
          {
            property: "Server ID",
            rich_text: {
              equals: member.guild.id
            }
          }
        ]
      },
      page_size: 1
    })
  });

  return result.results?.[0] || null;
}

async function upsertNotionMember(member) {
  if (!isNotionConfigured()) {
    return { skipped: true, reason: "notion_not_configured" };
  }

  const existingPage = await findMemberPage(member);

  if (existingPage) {
    await notionRequest(`/v1/pages/${existingPage.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        properties: memberProperties(member, "Rejoined")
      })
    });

    return { skipped: false, action: "updated", pageId: existingPage.id };
  }

  const createdPage = await notionRequest("/v1/pages", {
    method: "POST",
    body: JSON.stringify({
      parent: {
        database_id: membersDatabaseId
      },
      properties: memberProperties(member, "Joined")
    })
  });

  return { skipped: false, action: "created", pageId: createdPage.id };
}

module.exports = {
  memberDatabaseProperties,
  notionRequest,
  upsertNotionMember
};
