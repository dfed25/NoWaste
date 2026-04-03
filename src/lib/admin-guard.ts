import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { verifyServerSession } from "@/lib/server-session";

export async function requireAdminPageAccess(currentPath = "/admin") {
  const headerStore = await headers();
  const cookieHeader = headerStore.get("cookie") ?? "";
  const request = new Request("http://localhost/admin", {
    headers: {
      cookie: cookieHeader,
    },
  });

  const session = verifyServerSession(request);
  if (!session.isAuthenticated) {
    redirect(`/auth/login?next=${encodeURIComponent(currentPath)}`);
  }
  if (session.user?.role !== "admin") {
    redirect("/dashboard");
  }
}
