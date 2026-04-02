import { NextResponse } from "next/server";
import { buildCsvExport } from "@/lib/admin-reporting";
import { ADMIN_ROLE_COOKIE, hasAdminAccess } from "@/lib/admin";

const AUTH_COOKIE_NAME = "nw-authenticated";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookies = Object.fromEntries(
    cookieHeader
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((pair) => {
        const index = pair.indexOf("=");
        if (index < 0) return [pair, ""];
        return [pair.slice(0, index), decodeURIComponent(pair.slice(index + 1))];
      }),
  );
  const isAuthenticated = cookies[AUTH_COOKIE_NAME] === "1";
  const role = cookies[ADMIN_ROLE_COOKIE];
  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!hasAdminAccess(isAuthenticated, role)) {
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

