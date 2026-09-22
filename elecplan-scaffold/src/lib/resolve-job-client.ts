import type { Prisma } from "@prisma/client";
import { cleanClientName, exactClientMatches, type ClientNameOption } from "./client-name";

export class JobClientError extends Error {
  constructor(message: string, public status: number, public clients: ClientNameOption[] = []) {
    super(message);
    this.name = "JobClientError";
  }
}

// Call inside the job's SERIALIZABLE transaction: a failed job must not leave a new client behind.
export async function resolveJobClient(tx: Pick<Prisma.TransactionClient, "client">, input: { clientId?: string; clientName?: string }) {
  if (input.clientId) {
    const client = await tx.client.findUnique({ where: { id: input.clientId }, select: { id: true, name: true } });
    if (!client) throw new JobClientError("Client not found. Choose a client again.", 404);
    return { client, created: false };
  }
  const name = cleanClientName(input.clientName ?? "");
  if (!name || name.length > 160) throw new JobClientError("Enter a client name of 1 to 160 characters.", 400);
  const clients = await tx.client.findMany({ select: { id: true, name: true } });
  const matches = exactClientMatches(clients, name);
  if (matches.length > 1) {
    throw new JobClientError("More than one client has this name. Select the correct client from the matches.", 409, matches);
  }
  if (matches.length === 1) return { client: matches[0], created: false };
  const client = await tx.client.create({ data: { name }, select: { id: true, name: true } });
  return { client, created: true };
}
