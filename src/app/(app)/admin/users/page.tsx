import { Card } from "@/components/ui/card";
import { getAdminTables } from "@/lib/admin-reporting";

export default function AdminUsersPage() {
  const { users } = getAdminTables();
  return (
    <section className="space-y-4">
      <h1 className="text-title-lg">User management</h1>
      <Card className="space-y-2">
        {users.map((user) => (
          <p key={user.id} className="text-sm text-neutral-700">
            {user.id} - {user.email} - {user.role}
          </p>
        ))}
      </Card>
    </section>
  );
}

