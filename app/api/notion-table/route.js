import { NextResponse } from "next/server";
import { isFullPage } from "@notionhq/client";
import {
  createNotionClient,
  normalizeDatabaseId,
  queryFilteredPages,
} from "../../../lib/notion/notion-client.js";
import { extractPropertyValue } from "../../../lib/notion/properties.js";

const COLUMN_DEFINITIONS = [
  {
    key: "name",
    label: "이름",
    propertyNames: ["이름", "제목", "Name"],
    control: "text",
  },
  {
    key: "project",
    label: "프로젝트",
    propertyNames: ["프로젝트"],
    control: "select",
  },
  { key: "para", label: "PARA", propertyNames: ["PARA"], control: "select" },
  { key: "status", label: "상태", propertyNames: ["상태"], control: "select" },
  { key: "due", label: "기한", propertyNames: ["기한", "기한_마지막"], control: "dateRange" },
  { key: "repeat", label: "반복", propertyNames: ["반복"], control: "checkbox" },
  { key: "archive", label: "보관", propertyNames: ["보관"], control: "checkbox" },
  { key: "note", label: "비고", propertyNames: ["비고"], control: "textarea" },
  { key: "done", label: "완료", propertyNames: ["완료"], control: "button" },
  {
    key: "review",
    label: "리뷰 예정",
    propertyNames: ["리뷰 예정"],
    control: "button",
  },
];

const BUTTON_WORKFLOWS = {
  done: { para: "Archive", status: "완료" },
  review: { para: "Archive", status: "리뷰 예정" },
};

function getNotionConfig() {
  const token = process.env.NOTION_API_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token) {
    throw new Error("NOTION_API_TOKEN이 설정되지 않았습니다. .env.local에 토큰을 추가하세요.");
  }

  if (!databaseId) {
    throw new Error("NOTION_DATABASE_ID가 설정되지 않았습니다. .env.local에 데이터베이스 ID를 추가하세요.");
  }

  return { token, databaseId };
}

function resolveColumns(database) {
  return COLUMN_DEFINITIONS.map((column) => {
    const propertyName = column.propertyNames.find((name) => database.properties[name]);
    const schema = propertyName ? database.properties[propertyName] : null;
    const options =
      schema?.type === "select"
        ? schema.select.options.map((option) => option.name)
        : schema?.type === "status"
          ? schema.status.options.map((option) => option.name)
          : [];

    return {
      ...column,
      propertyName: propertyName ?? null,
      propertyType: schema?.type ?? null,
      options,
      editable:
        column.control === "button" ||
        (Boolean(propertyName) && isEditable(column.control, schema?.type)),
    };
  });
}

function isEditable(control, type) {
  if (!type) return false;
  if (control === "button") {
    return ["checkbox", "date", "select", "status"].includes(type);
  }
  return ["title", "rich_text", "select", "status", "date", "checkbox"].includes(type);
}

function formatDateForDisplay(value) {
  return value ? value.slice(0, 10).replaceAll("-", "/") : "";
}

function normalizeDateForNotion(value) {
  const date = String(value ?? "").trim().replaceAll("/", "-");
  return date || "";
}

function dateValue(prop) {
  if (prop?.type !== "date") {
    return { start: "", end: "" };
  }

  return {
    start: formatDateForDisplay(prop.date?.start),
    end: formatDateForDisplay(prop.date?.end),
  };
}

function checkboxValue(prop) {
  return prop?.type === "checkbox" ? prop.checkbox : false;
}

function pageToRow(page, columns) {
  const values = {};

  for (const column of columns) {
    const prop = column.propertyName ? page.properties[column.propertyName] : null;
    if (column.control === "dateRange") {
      values[column.key] = dateValue(prop);
    } else if (column.control === "checkbox") {
      values[column.key] = checkboxValue(prop);
    } else {
      values[column.key] = extractPropertyValue(prop);
    }
  }

  return {
    id: page.id,
    url: page.url,
    group: values.para || "(미지정)",
    values,
  };
}

function groupRows(rows) {
  const order = ["Project", "Area"];
  const groups = new Map();

  for (const row of rows) {
    const groupName = row.group;
    if (!groups.has(groupName)) groups.set(groupName, []);
    groups.get(groupName).push(row);
  }

  return [...groups.entries()]
    .map(([name, rowsInGroup]) => ({ name, rows: rowsInGroup }))
    .sort((a, b) => {
      const ai = order.indexOf(a.name);
      const bi = order.indexOf(b.name);
      if (ai !== -1 || bi !== -1) {
        return (ai === -1 ? Number.MAX_SAFE_INTEGER : ai) - (bi === -1 ? Number.MAX_SAFE_INTEGER : bi);
      }
      return a.name.localeCompare(b.name, "ko");
    });
}

function buildFilter() {
  return {
    or: [
      { property: "PARA", select: { equals: "Project" } },
      { property: "PARA", select: { equals: "Area" } },
    ],
  };
}

function buildPropertyUpdate(type, value) {
  switch (type) {
    case "title":
      return { title: value ? [{ text: { content: String(value) } }] : [] };
    case "rich_text":
      return { rich_text: value ? [{ text: { content: String(value) } }] : [] };
    case "select":
      return { select: value ? { name: String(value) } : null };
    case "status":
      if (!value) throw new Error("상태 값은 비울 수 없습니다.");
      return { status: { name: String(value) } };
    case "date":
      if (value && typeof value === "object") {
        const start = normalizeDateForNotion(value.start);
        const end = normalizeDateForNotion(value.end);
        if (!start) return { date: null };
        return { date: end ? { start, end } : { start } };
      }
      return { date: normalizeDateForNotion(value) ? { start: normalizeDateForNotion(value) } : null };
    case "checkbox":
      return { checkbox: Boolean(value) };
    default:
      throw new Error(`${type} 속성은 이 화면에서 바로 수정할 수 없습니다.`);
  }
}

async function fetchDatabaseContext(client, databaseId) {
  const database = await client.databases.retrieve({
    database_id: normalizeDatabaseId(databaseId),
  });
  return { database, columns: resolveColumns(database) };
}

function findRequiredColumn(columns, key, label) {
  const column = columns.find((item) => item.key === key);

  if (!column?.propertyName || !column.propertyType) {
    throw new Error(`${label} 속성을 찾을 수 없습니다.`);
  }

  return column;
}

function buildButtonWorkflowProperties(columns, columnKey) {
  const workflow = BUTTON_WORKFLOWS[columnKey];
  if (!workflow) {
    throw new Error("지원하지 않는 버튼 동작입니다.");
  }

  const paraColumn = findRequiredColumn(columns, "para", "PARA");
  const statusColumn = findRequiredColumn(columns, "status", "상태");

  return {
    [paraColumn.propertyName]: buildPropertyUpdate(paraColumn.propertyType, workflow.para),
    [statusColumn.propertyName]: buildPropertyUpdate(
      statusColumn.propertyType,
      workflow.status,
    ),
  };
}

function buildCreateProperties(columns) {
  const nameColumn = columns.find((item) => item.key === "name");
  const paraColumn = findRequiredColumn(columns, "para", "PARA");

  if (!nameColumn?.propertyName || nameColumn.propertyType !== "title") {
    throw new Error("이름(title) 속성을 찾을 수 없습니다.");
  }

  return {
    [nameColumn.propertyName]: buildPropertyUpdate(nameColumn.propertyType, "새 항목"),
    [paraColumn.propertyName]: buildPropertyUpdate(paraColumn.propertyType, "Project"),
  };
}

export async function GET() {
  try {
    const { token, databaseId } = getNotionConfig();
    const client = createNotionClient(token);
    const { columns } = await fetchDatabaseContext(client, databaseId);
    const pages = await queryFilteredPages(client, databaseId, buildFilter());
    const rows = pages.map((page) => pageToRow(page, columns));

    return NextResponse.json({
      columns: columns.map(({ propertyNames, ...column }) => column),
      groups: groupRows(rows),
      total: rows.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notion-table] query failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const { token, databaseId } = getNotionConfig();
    const client = createNotionClient(token);
    const { columns } = await fetchDatabaseContext(client, databaseId);

    const createdPage = await client.pages.create({
      parent: { database_id: normalizeDatabaseId(databaseId) },
      properties: buildCreateProperties(columns),
    });

    if (!isFullPage(createdPage)) {
      return NextResponse.json({ error: "생성된 페이지 정보를 읽을 수 없습니다." }, { status: 500 });
    }

    return NextResponse.json({ row: pageToRow(createdPage, columns) }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notion-table] create failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { token } = getNotionConfig();
    const { pageId } = await request.json();

    if (!pageId) {
      return NextResponse.json({ error: "pageId가 필요합니다." }, { status: 400 });
    }

    const client = createNotionClient(token);
    await client.pages.update({
      page_id: pageId,
      archived: true,
    });

    return NextResponse.json({ ok: true, pageId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notion-table] delete failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { token, databaseId } = getNotionConfig();
    const { pageId, columnKey, value, action } = await request.json();

    if (!pageId || !columnKey) {
      return NextResponse.json({ error: "pageId와 columnKey가 필요합니다." }, { status: 400 });
    }

    const client = createNotionClient(token);
    const { columns } = await fetchDatabaseContext(client, databaseId);
    const column = columns.find((item) => item.key === columnKey);

    if (!column) {
      return NextResponse.json({ error: "수정할 Notion 속성을 찾을 수 없습니다." }, { status: 400 });
    }

    const properties =
      action === "button"
        ? buildButtonWorkflowProperties(columns, columnKey)
        : column.propertyName && column.propertyType
          ? {
              [column.propertyName]: buildPropertyUpdate(column.propertyType, value),
            }
          : null;

    if (!properties) {
      return NextResponse.json({ error: "수정할 Notion 속성을 찾을 수 없습니다." }, { status: 400 });
    }

    const updatedPage = await client.pages.update({
      page_id: pageId,
      properties,
    });

    if (!isFullPage(updatedPage)) {
      return NextResponse.json({ error: "수정된 페이지 정보를 읽을 수 없습니다." }, { status: 500 });
    }

    return NextResponse.json({ row: pageToRow(updatedPage, columns) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[notion-table] update failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
