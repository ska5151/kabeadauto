import { createNotionClient, queryFilteredPages } from "../notion/notion-client.js";
import { extractPropertyValue } from "../notion/properties.js";

/** KABEAD PARA 데이터베이스 ID */
export const KABEAD_PARA_DATABASE_ID = "32c90d96-4d3b-807b-801b-d37aff96cb0d";

function todayKst() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
  }).format(new Date());
}

function parseSortValue(value) {
  const n = Number(value.trim());
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function pageToItem(page) {
  const props = page.properties;
  return {
    project: extractPropertyValue(props["프로젝트"]) || "(미지정)",
    name: extractPropertyValue(props["제목"]),
    sort: parseSortValue(extractPropertyValue(props["sort"])),
  };
}

function buildWorkingFilter() {
  return {
    and: [
      { property: "PARA", select: { equals: "Project" } },
      { property: "상태", status: { equals: "진행" } },
    ],
  };
}

function buildArchiveFilter() {
  return { property: "PARA", select: { equals: "Archive" } };
}

function matchesTodayKst(value, today) {
  if (!value) return false;
  const datePart = value.trim().slice(0, 10).replace(/\//g, "-");
  return datePart === today;
}

async function fetchTodayWorkSection(client, databaseId, today) {
  const pages = await queryFilteredPages(
    client,
    databaseId,
    buildArchiveFilter(),
  );
  return pages
    .filter((page) =>
      matchesTodayKst(
        extractPropertyValue(page.properties["기한_마지막"]),
        today,
      ),
    )
    .map(pageToItem)
    .filter((item) => item.name);
}

function buildScheduledFilter() {
  return {
    and: [
      { property: "PARA", select: { equals: "Area" } },
      { property: "상태", status: { equals: "예정" } },
    ],
  };
}

export function groupByProject(items) {
  const groups = new Map();

  for (const item of items) {
    if (!item.name) continue;
    const existing = groups.get(item.project);
    if (!existing) {
      groups.set(item.project, { sort: item.sort, names: [item.name] });
    } else {
      existing.sort = Math.min(existing.sort, item.sort);
      existing.names.push(item.name);
    }
  }

  return [...groups.entries()]
    .map(([project, { sort, names }]) => ({
      project,
      sort,
      names: names.sort((a, b) => a.localeCompare(b, "ko")),
    }))
    .sort(
      (a, b) =>
        a.sort - b.sort || a.project.localeCompare(b.project, "ko"),
    );
}

function formatSection(section) {
  const lines = [section.title, ""];
  const groups = groupByProject(section.items);

  for (const { project, names } of groups) {
    lines.push(`  o ${project}`);
    for (const name of names) {
      lines.push(`    - ${name}`);
    }
  }

  return lines.join("\n");
}

export function formatKabeadParaReport(sections) {
  return sections.map(formatSection).join("\n\n");
}

async function fetchSection(client, databaseId, filter) {
  const pages = await queryFilteredPages(client, databaseId, filter);
  return pages.map(pageToItem).filter((item) => item.name);
}

export function sectionsWithGroups(sections) {
  return sections.map((section) => ({
    title: section.title,
    groups: groupByProject(section.items),
  }));
}

export async function runKabeadParaReport(options) {
  const client = createNotionClient(options.token);
  const databaseId = options.databaseId ?? KABEAD_PARA_DATABASE_ID;
  const today = todayKst();

  const [working, todayDone, scheduled] = await Promise.all([
    fetchSection(client, databaseId, buildWorkingFilter()),
    fetchTodayWorkSection(client, databaseId, today),
    fetchSection(client, databaseId, buildScheduledFilter()),
  ]);

  const sections = [
    { title: "1. 작업중", items: working },
    { title: "2. 금일작업", items: todayDone },
    { title: "3. 예정사항", items: scheduled },
  ];

  const total = working.length + todayDone.length + scheduled.length;
  const output = formatKabeadParaReport(sections);

  return {
    output,
    total,
    today,
    sections: sectionsWithGroups(sections),
  };
}
