import { NextResponse } from "next/server";
import { buildCsvExport } from "@/lib/admin-reporting";

export async function GET() {
  const csv = buildCsvExport();
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="nowaste-report.csv"',
    },
  });
}

