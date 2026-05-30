import { NextResponse } from "next/server";
import { deleteOldKbmanagerLogs } from "../../../../lib/queries/kbmanager-logs.js";

export async function POST() {
  try {
    const { db, cutoff, affectedRows } = await deleteOldKbmanagerLogs();

    if (affectedRows === 0) {
      return NextResponse.json({
        ok: false,
        message: "삭제 할 자료가 없거나 삭제 오류 !!!",
        db,
        cutoff,
        affectedRows,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "삭제 완료 !!!",
      db,
      cutoff,
      affectedRows,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const db = err.db ?? "kbmanager";
    console.error("[kbmanager/delete-old-logs] failed:", { db, message });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
