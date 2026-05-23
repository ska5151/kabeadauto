import { NextResponse } from "next/server";
import { fetchActionCheck } from "../../../lib/queries/daissue-action-check.js";

export async function GET() {
  try {
    const { recent, daily } = await fetchActionCheck();
    return NextResponse.json({
      recent,
      daily,
      recentCount: recent.length,
      dailyCount: daily.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const db = err.db ?? "daissue";
    console.error("[daissue-action-check] query failed:", { db, message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
