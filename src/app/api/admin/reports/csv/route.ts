import { NextResponse } from "next/server";
import { buildCsvExport } from "@/lib/admin-reporting";
import { hasAdminAccess } from "@/lib/admin";
import { verifyServerSession } from "@/lib/server-session";

export async function GET(request: Request) {
  const session = verifyServerSession(request);
  if (!session.isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminAccess(session.isAuthenticated, session.user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const csv = buildCsvExport();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="nowaste-report.csv"',
      "cache-control": "no-store",
    },
  });
}

