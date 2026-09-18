import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { activeXeroAccess, XERO_ACCOUNTING_API_BASE } from "@/lib/xero";
import { recordAudit } from "@/lib/audit";

type XeroContact = {
  ContactID: string;
  Name?: string;
  FirstName?: string;
  LastName?: string;
  EmailAddress?: string;
  IsCustomer?: boolean;
  Addresses?: Array<{ AddressType?: string; AddressLine1?: string; AddressLine2?: string; City?: string; Region?: string; PostalCode?: string; Country?: string }>;
  Phones?: Array<{ PhoneType?: string; PhoneNumber?: string; PhoneAreaCode?: string; PhoneCountryCode?: string }>;
};

function clean(value?: string) { return value?.trim() || null; }
function contactAddress(contact: XeroContact) {
  const address = contact.Addresses?.find((item) => item.AddressType === "STREET") || contact.Addresses?.find((item) => item.AddressType === "POBOX") || contact.Addresses?.[0];
  return address ? [address.AddressLine1, address.AddressLine2, address.City, address.Region, address.PostalCode, address.Country].map((value) => value?.trim()).filter(Boolean).join(", ") || null : null;
}
function contactPhone(contact: XeroContact) {
  const phone = contact.Phones?.find((item) => item.PhoneType === "MOBILE") || contact.Phones?.find((item) => item.PhoneType === "DEFAULT") || contact.Phones?.[0];
  return phone?.PhoneNumber ? [phone.PhoneCountryCode, phone.PhoneAreaCode, phone.PhoneNumber].map((value) => value?.trim()).filter(Boolean).join(" ") : null;
}

export async function POST() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { connection, accessToken } = await activeXeroAccess();
    const contacts: XeroContact[] = [];
    for (let page = 1; page <= 50; page += 1) {
      const url = new URL(`${XERO_ACCOUNTING_API_BASE}/Contacts`);
      url.searchParams.set("where", 'ContactStatus=="ACTIVE"');
      url.searchParams.set("page", String(page));
      url.searchParams.set("order", "Name ASC");
      const response = await fetch(url, { headers: { authorization: `Bearer ${accessToken}`, "xero-tenant-id": connection.tenantId, accept: "application/json" }, cache: "no-store" });
      if (!response.ok) throw new Error(`Xero contacts request failed (${response.status})`);
      const body = await response.json() as { Contacts?: XeroContact[] };
      const batch = body.Contacts || [];
      contacts.push(...batch);
      if (batch.length < 100) break;
    }
    let created = 0;
    let matched = 0;
    let updated = 0;
    const customers = contacts.filter((contact) => contact.IsCustomer === true && contact.ContactID && clean(contact.Name));
    for (const contact of customers) {
      const name = clean(contact.Name)!;
      const email = clean(contact.EmailAddress);
      const phone = contactPhone(contact);
      const address = contactAddress(contact);
      const contactName = clean([contact.FirstName, contact.LastName].filter(Boolean).join(" "));
      const linked = await prisma.client.findFirst({ where: { OR: [{ xeroContactId: contact.ContactID }, ...(email ? [{ email: { equals: email, mode: "insensitive" as const } }] : []), { name: { equals: name, mode: "insensitive" } }] } });
      if (linked) {
        await prisma.client.update({ where: { id: linked.id }, data: { xeroContactId: contact.ContactID, contactName: linked.contactName || contactName, phone: linked.phone || phone, email: linked.email || email, address: linked.address || address } });
        matched += 1;
        if (!linked.xeroContactId || (!linked.contactName && contactName) || (!linked.phone && phone) || (!linked.email && email) || (!linked.address && address)) updated += 1;
      } else {
        await prisma.client.create({ data: { name, xeroContactId: contact.ContactID, contactName, phone, email, address } });
        created += 1;
      }
    }
    await prisma.xeroConnection.update({ where: { id: connection.id }, data: { lastSyncAt: new Date() } });
    await recordAudit({ actor: user, action: "XERO_CONTACTS_IMPORTED", entityType: "XeroConnection", entityId: connection.tenantId, details: { tenantName: connection.tenantName, customers: customers.length, created, matched, updated } });
    return NextResponse.json({ organisation: connection.tenantName, customers: customers.length, created, matched, updated });
  } catch (error) {
    console.error("XERO_CONTACT_IMPORT_FAILED", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not import Xero contacts" }, { status: 502 });
  }
}
