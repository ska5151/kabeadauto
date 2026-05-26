import { NextResponse } from "next/server";
import { loadCompanyDbJson } from "../../../../../lib/baljuanara-deploy/company-db.js";

export async function GET() {
  return NextResponse.json({ companies: loadCompanyDbJson() });
}
