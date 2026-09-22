export type ClientNameOption = { id: string; name: string };

// Keep punctuation and accents: similar names are suggestions, not proof of identity.
export function cleanClientName(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/gu, " ");
}

export function clientNameKey(name: string): string {
  return cleanClientName(name).toLowerCase();
}

export function exactClientMatches<T extends ClientNameOption>(clients: T[], name: string): T[] {
  const key = clientNameKey(name);
  return key ? clients.filter((client) => clientNameKey(client.name) === key) : [];
}

export function suggestedClients<T extends ClientNameOption>(clients: T[], name: string): T[] {
  const key = clientNameKey(name);
  const words = key.split(" ").filter(Boolean);
  return clients.filter((client) => words.every((word) => clientNameKey(client.name).includes(word)))
    .sort((a, b) => Number(clientNameKey(b.name) === key) - Number(clientNameKey(a.name) === key)
      || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}
