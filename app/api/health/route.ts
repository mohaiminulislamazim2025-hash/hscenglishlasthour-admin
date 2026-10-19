import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Liveness probe used by checks and monitoring. Contains no sensitive data. */
export function GET() {
  return NextResponse.json({ ok: true, service: "hscenglishlasthour-admin" });
}
