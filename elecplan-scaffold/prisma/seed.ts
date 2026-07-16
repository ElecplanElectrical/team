/**
 * Elecplan seed — development data.
 *
 * Creates the three demo accounts advertised on the login screen
 * (luke = Admin, reyne = Supervisor, dean = Employee), plus a realistic
 * slice of Melbourne clients, jobs, and calendar events landing in the
 * *current* week so the Calendar has something to show on first run.
 *
 * Password for every demo account: `password123` (see LoginForm demo hint).
 *
 * Idempotent: wipes the tables it owns in FK-safe order, then recreates.
 * Run with `pnpm db:seed`, or automatically via `pnpm db:reset`.
 */
import { PrismaClient, Role, JobStatus, LeadStage } from "@prisma/client";
import { addDays, startOfWeek, setHours, setMinutes } from "date-fns";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Monday of the current week — all seeded events hang off this so the
// calendar is populated whenever the seed is run.
const monday = startOfWeek(new Date(), { weekStartsOn: 1 });

/** A datetime `day` days after Monday, at h:m local time. */
function at(day: number, h: number, m = 0): Date {
  return setMinutes(setHours(addDays(monday, day), h), m);
}

async function main() {
  // Wipe in dependency order (children before parents).
  await prisma.smsLog.deleteMany();
  await prisma.projectPhoto.deleteMany();
  await prisma.document.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.jobEvent.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.reminder.deleteMany();
  await prisma.review.deleteMany();
  await prisma.job.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.stockItem.deleteMany();
  await prisma.user.deleteMany();

  // Password for the seeded accounts. Override via SEED_PASSWORD in any
  // internet-reachable environment — never ship the `password123` default to
  // production. See docs/DEPLOY-railway.md.
  const seedPassword = process.env.SEED_PASSWORD ?? "password123";
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  // --- Users ---------------------------------------------------------------
  const luke = await prisma.user.create({
    data: {
      name: "Luke Phillips",
      email: "luke@elecplan.com.au",
      phone: "0468339432",
      role: Role.ADMIN,
      passwordHash,
    },
  });

  const reyne = await prisma.user.create({
    data: {
      name: "Reyne Carter",
      email: "reyne@elecplan.com.au",
      phone: "+61 400 333 444",
      role: Role.SUPERVISOR,
      passwordHash,
      licenseNumber: "REC-24815",
      licenseExpiry: addDays(new Date(), 210),
    },
  });

  const dean = await prisma.user.create({
    data: {
      name: "Dean Whitfield",
      email: "dean@elecplan.com.au",
      phone: "+61 400 555 666",
      role: Role.EMPLOYEE,
      passwordHash,
      licenseNumber: "REC-31902",
      licenseExpiry: addDays(new Date(), 95),
    },
  });

  const sam = await prisma.user.create({
    data: {
      name: "Sam Iverson",
      email: "sam@elecplan.com.au",
      phone: "+61 400 777 888",
      role: Role.EMPLOYEE,
      passwordHash,
      licenseNumber: "REC-33740",
      licenseExpiry: addDays(new Date(), 320),
    },
  });

  // --- Clients -------------------------------------------------------------
  const [harbourview, prestonReno, brightBuild, meadowCafe] = await Promise.all(
    [
      prisma.client.create({
        data: {
          name: "Harbourview Apartments",
          contactName: "Janet Ho",
          phone: "+61 3 9412 8800",
          email: "strata@harbourview.com.au",
          address: "14 Fenwick St, Clifton Hill VIC 3068",
          billingNotes: "Net 30, invoice via strata manager.",
        },
      }),
      prisma.client.create({
        data: {
          name: "Preston Renovation",
          contactName: "Mark Delaney",
          phone: "+61 411 902 331",
          email: "mark.delaney@gmail.com",
          address: "27 High St, Preston VIC 3072",
        },
      }),
      prisma.client.create({
        data: {
          name: "BrightBuild Constructions",
          contactName: "Priya Nair",
          phone: "+61 3 9330 1140",
          email: "accounts@brightbuild.com.au",
          address: "3 Berry Ave, Coburg VIC 3058",
          billingNotes: "PO required on every job.",
        },
      }),
      prisma.client.create({
        data: {
          name: "Meadow Lane Cafe",
          contactName: "Tom Reyes",
          phone: "+61 419 556 210",
          email: "hello@meadowlane.cafe",
          address: "88 Wiring St, Brunswick VIC 3056",
        },
      }),
    ],
  );

  // --- Leads ---------------------------------------------------------------
  await prisma.lead.createMany({
    data: [
      {
        clientId: meadowCafe.id,
        description: "Rewire kitchen + new 3-phase for espresso machine",
        stage: LeadStage.QUOTED,
        value: 8600,
        source: "Referral",
      },
      {
        clientId: brightBuild.id,
        description: "Rough-in for 4-townhouse development, Coburg",
        stage: LeadStage.NEW,
        value: 42000,
        source: "Website",
      },
    ],
  });

  // --- Jobs ----------------------------------------------------------------
  const switchboard = await prisma.job.create({
    data: {
      title: "Switchboard upgrade — Block C",
      clientId: harbourview.id,
      address: "14 Fenwick St, Clifton Hill VIC 3068",
      status: JobStatus.IN_PROGRESS,
      assignedToId: reyne.id,
      scheduledStart: at(0, 8),
      scheduledEnd: at(1, 16),
      notes: "Isolate one block at a time; residents notified.",
    },
  });

  const prestonJob = await prisma.job.create({
    data: {
      title: "Full house rewire",
      clientId: prestonReno.id,
      address: "27 High St, Preston VIC 3072",
      status: JobStatus.SCHEDULED,
      assignedToId: dean.id,
      scheduledStart: at(2, 8),
      scheduledEnd: at(4, 16),
      notes: "Heritage overlay — keep original fittings where possible.",
    },
  });

  const cafeJob = await prisma.job.create({
    data: {
      title: "Espresso machine 3-phase install",
      clientId: meadowCafe.id,
      address: "88 Wiring St, Brunswick VIC 3056",
      status: JobStatus.QUOTED,
      assignedToId: dean.id,
    },
  });

  const brightJob = await prisma.job.create({
    data: {
      title: "Townhouse rough-in (Unit 1)",
      clientId: brightBuild.id,
      address: "3 Berry Ave, Coburg VIC 3058",
      status: JobStatus.SCHEDULED,
      assignedToId: sam.id,
      scheduledStart: at(3, 7, 30),
      scheduledEnd: at(3, 15, 30),
    },
  });

  // --- Calendar events (current week) --------------------------------------
  await prisma.jobEvent.createMany({
    data: [
      // Job events (linked to a job; title falls back to job title when null)
      {
        jobId: switchboard.id,
        type: "job",
        startsAt: at(0, 8),
        endsAt: at(0, 12),
        assignedToId: reyne.id,
      },
      {
        jobId: switchboard.id,
        type: "job",
        startsAt: at(1, 8),
        endsAt: at(1, 16),
        assignedToId: reyne.id,
      },
      {
        jobId: prestonJob.id,
        type: "job",
        startsAt: at(2, 8),
        endsAt: at(2, 16),
        assignedToId: dean.id,
      },
      {
        jobId: prestonJob.id,
        type: "job",
        startsAt: at(3, 8),
        endsAt: at(3, 16),
        assignedToId: dean.id,
      },
      {
        jobId: brightJob.id,
        type: "job",
        startsAt: at(3, 7, 30),
        endsAt: at(3, 15, 30),
        assignedToId: sam.id,
      },
      // Non-job events
      {
        title: "Call Meadow Lane re: quote",
        type: "call",
        startsAt: at(0, 13),
        endsAt: at(0, 13, 30),
        assignedToId: luke.id,
      },
      {
        title: "Materials pickup — Middy's",
        type: "material",
        startsAt: at(2, 7),
        endsAt: at(2, 8),
        assignedToId: dean.id,
      },
      {
        title: "Weekly admin + invoicing",
        type: "admin",
        startsAt: at(4, 9),
        endsAt: at(4, 11),
        assignedToId: luke.id,
      },
    ],
  });

  // --- A few reminders + timesheets ---------------------------------------
  await prisma.reminder.createMany({
    data: [
      {
        userId: luke.id,
        title: "Renew public liability insurance",
        dueDate: addDays(new Date(), 12),
        tag: "compliance",
      },
      {
        userId: dean.id,
        title: "Order cable for Preston rewire",
        dueDate: addDays(new Date(), 1),
        tag: "materials",
      },
    ],
  });

  await prisma.timesheet.createMany({
    data: [
      { userId: dean.id, date: at(0, 0), hours: 8 },
      { userId: reyne.id, date: at(0, 0), hours: 8.5 },
    ],
  });

  console.log("Seed complete:");
  console.table([
    { email: luke.email, role: luke.role },
    { email: reyne.email, role: reyne.role },
    { email: dean.email, role: dean.role },
    { email: sam.email, role: sam.role },
  ]);
  console.log(
    process.env.SEED_PASSWORD
      ? "Password for all seeded accounts: (from SEED_PASSWORD env)"
      : "Password for all demo accounts: password123",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
