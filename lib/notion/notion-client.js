import { Client, isFullPage } from "@notionhq/client";

function withDashes(id) {
  const raw = id.replace(/-/g, "");
  if (raw.length !== 32) return id;
  return `${raw.slice(0, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}-${raw.slice(16, 20)}-${raw.slice(20)}`;
}

export async function queryFilteredPages(
  client,
  databaseId,
  filter,
  pageSize = 100,
) {
  const results = [];
  let cursor;

  do {
    const response = await client.databases.query({
      database_id: withDashes(databaseId),
      start_cursor: cursor,
      page_size: pageSize,
      filter,
    });

    for (const item of response.results) {
      if (isFullPage(item)) results.push(item);
    }

    cursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (cursor);

  return results;
}

export function createNotionClient(token) {
  return new Client({ auth: token });
}
