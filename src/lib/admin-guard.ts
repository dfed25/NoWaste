import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyServerSession } from "@/lib/server-session";

export async function requireAdminPageAccess() {
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";
  const request = new Request("http://localhost/admin", {
    headers: {
      cookie: cookieHeader,
    },
  });

  const session = verifyServerSession(request);
  if (!session.isAuthenticated || session.user?.role !== "admin") {
    redirect("/dashboard");
  }
}
