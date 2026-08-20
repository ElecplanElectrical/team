import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { sendTeamChatPush } from "@/lib/push";

type ChatRow = { id:string; body:string; createdAt:Date; senderId:string; senderName:string };

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const messages = await prisma.$queryRaw<ChatRow[]>`
    SELECT m."id", m."body", m."createdAt", m."senderId", u."name" AS "senderName"
    FROM "TeamChatMessage" m JOIN "User" u ON u."id" = m."senderId"
    ORDER BY m."createdAt" DESC LIMIT 80
  `;
  const unreadRows = await prisma.$queryRaw<{count:bigint}[]>`
    SELECT COUNT(*)::bigint AS count FROM "TeamChatMessage" m
    WHERE m."senderId" <> ${user.id}
      AND m."createdAt" > COALESCE((SELECT r."lastReadAt" FROM "TeamChatReadState" r WHERE r."userId" = ${user.id}), TIMESTAMP '1970-01-01')
  `;
  return NextResponse.json({ messages: messages.reverse(), unread: Number(unreadRows[0]?.count ?? 0), me: user.id });
}

export async function POST(req:Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json().catch(()=>null) as {body?:string}|null;
  const body = data?.body?.trim();
  if (!body) return NextResponse.json({ error: "Message is required" }, { status: 400 });
  if (body.length > 2000) return NextResponse.json({ error: "Message is too long" }, { status: 400 });
  const id = randomUUID();
  await prisma.$executeRaw`INSERT INTO "TeamChatMessage" ("id","senderId","body") VALUES (${id},${user.id},${body})`;
  await prisma.$executeRaw`
    INSERT INTO "TeamChatReadState" ("userId","lastReadAt") VALUES (${user.id},CURRENT_TIMESTAMP)
    ON CONFLICT ("userId") DO UPDATE SET "lastReadAt" = CURRENT_TIMESTAMP
  `;
  void sendTeamChatPush(user.id, user.name || "Team member", body.slice(0, 160));
  return NextResponse.json({ ok:true, id });
}
