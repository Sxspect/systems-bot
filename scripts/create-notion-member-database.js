require("dotenv").config();

const { memberDatabaseProperties, notionRequest } = require("../src/notionMembers");

const parentPageId = process.env.NOTION_PARENT_PAGE_ID;
const databaseTitle = process.env.NOTION_MEMBERS_DATABASE_TITLE || "Discord Members";

if (!process.env.NOTION_TOKEN || !parentPageId) {
  throw new Error("NOTION_TOKEN and NOTION_PARENT_PAGE_ID are required.");
}

async function main() {
  const database = await notionRequest("/v1/databases", {
    method: "POST",
    body: JSON.stringify({
      parent: {
        type: "page_id",
        page_id: parentPageId
      },
      title: [{ text: { content: databaseTitle } }],
      properties: memberDatabaseProperties
    })
  });

  console.log(`Created Notion database: ${databaseTitle}`);
  console.log(`Database ID: ${database.id}`);
  console.log("Set this in Render as NOTION_MEMBERS_DATABASE_ID.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
