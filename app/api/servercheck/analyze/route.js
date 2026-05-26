import { NextResponse } from "next/server";
import { analyzeFolders } from "../../../../lib/servercheck/analyzeFolder.js";
import { FOLDER_ROWS } from "../../../../lib/servercheck/constants.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const folderPaths = body.folderPaths ?? {};

    const result = await analyzeFolders(folderPaths);
    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    rows: FOLDER_ROWS,
    message: "POST folderPaths로 분석을 요청하세요.",
  });
}
