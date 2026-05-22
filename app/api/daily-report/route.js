import { NextResponse } from "next/server";
import {
  KABEAD_PARA_DATABASE_ID,
  runKabeadParaReport,
} from "../../../lib/queries/kabead-para-report.js";

export async function GET() {
  const token = process.env.NOTION_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          "NOTION_API_TOKEN이 설정되지 않았습니다. .env.local에 토큰을 추가하세요.",
      },
      { status: 500 },
    );
  }

  const databaseId =
    process.env.NOTION_DATABASE_ID ?? KABEAD_PARA_DATABASE_ID;

  try {
    const { output, total, today, sections } = await runKabeadParaReport({
      token,
      databaseId,
    });

    return NextResponse.json({ output, total, today, sections });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[daily-report] Notion query failed:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
