import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import EmployeesView, { type EmployeeRow } from "@/components/EmployeesView";
import { assignableRoles } from "@/lib/access";

export default async function EmployeesPage() {
  const actor = await requireAccess("employees");
  const businessId = actor.businessId ?? "__unassigned__";

  const users = await prisma.user.findMany({
    where: { businessId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      active: true,
      passwordHash: true,
      licenseNumber: true,
      licenseExpiry: true,
    },
    orderBy: [{ active: "desc" }, { name: "asc" }],
  });

  const rows: EmployeeRow[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    active: u.active,
    // Never leak the hash — just whether they've accepted their invite.
    hasPassword: u.passwordHash != null,
    licenseNumber: u.licenseNumber,
    licenseExpiry: u.licenseExpiry?.toISOString() ?? null,
  }));

  return (
    <EmployeesView
      rows={rows}
      currentUserId={actor.id}
      assignableRoles={assignableRoles(actor.role)}
    />
  );
}
