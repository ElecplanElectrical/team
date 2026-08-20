import { prisma } from "@/lib/prisma";

export function pushConfigured() {
  return false;
}

// Push delivery is enabled separately once the Railway VAPID credentials are configured.
// Keeping this as a no-op lets Team Chat, unread counts and messaging deploy immediately.
export async function sendTeamChatPush(_senderId: string, _senderName: string, _body: string) {
  void prisma;
  return;
}
