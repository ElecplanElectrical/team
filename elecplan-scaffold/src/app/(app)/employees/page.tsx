import { requireAccess } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import EmployeesView, { type EmployeeRow } from "@/components/EmployeesView";
import { assignableRoles } from "@/lib/access";

const QLS_SITE_TEAM = [
  ["Fergus MacDonald", "fergus.macdonald@pending.qls.local"],
  ["Sam Easthope", "sam.easthope@pending.qls.local"],
  ["Leon Phillis", "leon.phillis@pending.qls.local"],
  ["Zac Jenkins", "zac.jenkins@pending.qls.local"],
  ["Francis Muller", "francis.muller@pending.qls.local"],
  ["Lucas Pettolino", "lucas.pettolino@pending.qls.local"],
] as const;

async function ensureQlsEmployeeProfiles(businessId: string) {
  for (const [name, email] of QLS_SITE_TEAM) {
    const existingByEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingByEmail) {
      await prisma.user.update({ where: { id: existingByEmail.id }, data: { name, role: "EMPLOYEE", businessId, active: true } });
      continue;
    }

    const existingByName = await prisma.user.findFirst({ where: { businessId, name, role: "EMPLOYEE" }, select: { id: true, email: true } });
    if (existingByName) continue;

    await prisma.user.create({
      data: {
        name,
        email,
        role: "EMPLOYEE",
        active: true,
        businessId,
        passwordHash: null,
      },
    });
  }
}

export default async function EmployeesPage() {
  const actor = await requireAccess("employees");
  const businessId = actor.businessId ?? "__unassigned__";

  if (actor.business?.slug === "qls" && actor.businessId) {
    await ensureQlsEmployeeProfiles(actor.businessId);
  }

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
    email: u.email.endsWith("@pending.qls.local") ? "Email to be added" : u.email,
    phone: u.phone,
    role: u.role,
    active: u.active,
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
