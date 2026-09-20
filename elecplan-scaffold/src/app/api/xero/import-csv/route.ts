import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export const runtime = "nodejs";
const MAX_CSV_BYTES = 5 * 1024 * 1024;

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((values) => values.some((value) => value.trim()));
}

function key(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function clean(value?: string) {
  return value?.trim() || null;
}

function valueFor(row: string[], headerMap: Map<string, number>, names: string[]) {
  for (const name of names) {
    const index = headerMap.get(key(name));
    if (index != null) {
      const value = clean(row[index]);
      if (value) return value;
    }
  }
  return null;
}

export async function POST(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a Xero contacts CSV file." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_CSV_BYTES) {
    return NextResponse.json({ error: "CSV must be between 1 byte and 5 MB." }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".csv") && !["text/csv", "application/vnd.ms-excel", "text/plain"].includes(file.type)) {
    return NextResponse.json({ error: "Choose a CSV exported from Xero." }, { status: 415 });
  }

  const rows = parseCsv(await file.text());
  if (rows.length < 2) return NextResponse.json({ error: "The CSV has no contact rows." }, { status: 400 });

  const headers = rows[0].map((header) => header.trim().replace(/^\uFEFF/, ""));
  const headerMap = new Map(headers.map((header, index) => [key(header), index]));

  let created = 0;
  let matched = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows.slice(1)) {
    const companyName = valueFor(row, headerMap, ["ContactName", "Contact Name", "Name", "Company", "CompanyName"]);
    const firstName = valueFor(row, headerMap, ["FirstName", "First Name"]);
    const lastName = valueFor(row, headerMap, ["LastName", "Last Name"]);
    const contactName = clean([firstName, lastName].filter(Boolean).join(" "));
    const name = companyName || contactName;
    if (!name) {
      skipped += 1;
      continue;
    }

    const xeroContactId = valueFor(row, headerMap, ["ContactID", "Contact ID", "XeroContactID", "Xero Contact ID"]);
    const email = valueFor(row, headerMap, ["EmailAddress", "Email Address", "Email"]);
    const phone = valueFor(row, headerMap, ["PhoneNumber", "Phone Number", "Phone", "Mobile", "MobileNumber", "Mobile Number"]);
    const address = [
      valueFor(row, headerMap, ["AddressLine1", "Address Line 1"]),
      valueFor(row, headerMap, ["AddressLine2", "Address Line 2"]),
      valueFor(row, headerMap, ["City", "Town"]),
      valueFor(row, headerMap, ["Region", "State"]),
      valueFor(row, headerMap, ["PostalCode", "Postal Code", "Postcode"]),
      valueFor(row, headerMap, ["Country"]),
    ].filter(Boolean).join(", ") || null;

    const OR: Array<Record<string, unknown>> = [];
    if (xeroContactId) OR.push({ xeroContactId });
    if (email) OR.push({ email: { equals: email, mode: "insensitive" } });
    OR.push({ name: { equals: name, mode: "insensitive" } });

    const existing = await prisma.client.findFirst({ where: { OR } });
    if (existing) {
      const data = {
        ...(xeroContactId && !existing.xeroContactId ? { xeroContactId } : {}),
        ...(!existing.contactName && contactName ? { contactName } : {}),
        ...(!existing.phone && phone ? { phone } : {}),
        ...(!existing.email && email ? { email } : {}),
        ...(!existing.address && address ? { address } : {}),
      };
      if (Object.keys(data).length) {
        await prisma.client.update({ where: { id: existing.id }, data });
        updated += 1;
      }
      matched += 1;
    } else {
      await prisma.client.create({
        data: {
          name,
          xeroContactId,
          contactName,
          phone,
          email,
          address,
        },
      });
      created += 1;
    }
  }

  await recordAudit({
    actor: user,
    action: "XERO_CSV_CONTACTS_IMPORTED",
    entityType: "Client",
    details: { fileName: file.name, rows: rows.length - 1, created, matched, updated, skipped },
  });

  return NextResponse.json({ rows: rows.length - 1, created, matched, updated, skipped });
}
