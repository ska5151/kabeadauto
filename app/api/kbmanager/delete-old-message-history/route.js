import { NextResponse } from "next/server";
import { deleteOldKbmanagerMessageHistory } from "../../../../lib/queries/kbmanager-message-history.js";

export async function POST() {
  try {
    const result = await deleteOldKbmanagerMessageHistory();

    if (!result.ok) {
      return NextResponse.json(
        {
          ...result,
          message: "삭제 할 자료가 없거나 삭제 오류 !!!",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ...result,
      message: "삭제 완료 !!!",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const db = err.db ?? "kbmanager";
    console.error("[kbmanager/delete-old-message-history] failed:", {
      db,
      message,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
