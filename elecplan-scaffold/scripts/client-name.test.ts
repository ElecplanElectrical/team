import assert from "node:assert/strict";
import test from "node:test";
import { cleanClientName, clientNameKey, exactClientMatches, suggestedClients } from "../src/lib/client-name";
import { JobClientError, resolveJobClient } from "../src/lib/resolve-job-client";

type Client = { id: string; name: string };
function mockTx(initial: Client[]) {
  const clients = [...initial];
  const tx = { client: {
    findUnique: async ({ where }: { where: { id: string } }) => clients.find((client) => client.id === where.id) ?? null,
    findMany: async () => [...clients],
    create: async ({ data }: { data: { name: string } }) => {
      const client = { id: `test-${clients.length}`, name: data.name }; clients.push(client); return client;
    },
  } };
  return { clients, tx: tx as unknown as Parameters<typeof resolveJobClient>[0] };
}

test("normalizes capitals and repeated whitespace without removing punctuation", () => {
  assert.equal(cleanClientName("  Alex   Example\t"), "Alex Example");
  assert.equal(clientNameKey(" ALEX\u00a0EXAMPLE "), "alex example");
  assert.notEqual(clientNameKey("O'Neil"), clientNameKey("ONeil"));
  assert.equal(clientNameKey("Jose\u0301"), clientNameKey("Jos\u00e9"));
});
test("existing client is reused for case and spacing variations", async () => {
  const { tx, clients } = mockTx([{ id: "alex", name: "Alex   Example" }]);
  const result = await resolveJobClient(tx, { clientName: "  ALEX Example  " });
  assert.equal(result.client.id, "alex"); assert.equal(result.created, false); assert.equal(clients.length, 1);
});
test("new client works with an empty client list and only a name", async () => {
  const { tx, clients } = mockTx([]);
  const result = await resolveJobClient(tx, { clientName: "  New   Customer  " });
  assert.equal(result.created, true); assert.equal(result.client.name, "New Customer"); assert.equal(clients.length, 1);
});
test("explicit selection uses the chosen ID even for identical names", async () => {
  const { tx, clients } = mockTx([{ id: "one", name: "John Smith" }, { id: "two", name: "John Smith" }]);
  assert.equal((await resolveJobClient(tx, { clientId: "two" })).client.id, "two"); assert.equal(clients.length, 2);
});
test("ambiguous names require selection rather than silently linking the wrong client", async () => {
  const { tx, clients } = mockTx([{ id: "one", name: "John Smith" }, { id: "two", name: "JOHN SMITH" }]);
  await assert.rejects(resolveJobClient(tx, { clientName: "john smith" }), (error: unknown) =>
    error instanceof JobClientError && error.status === 409 && error.clients.length === 2);
  assert.equal(clients.length, 2);
});
test("missing selected client is not recreated under a new identity", async () => {
  const { tx } = mockTx([]);
  await assert.rejects(resolveJobClient(tx, { clientId: "deleted" }), (error: unknown) => error instanceof JobClientError && error.status === 404);
});
test("blank and oversized names are rejected without creating a client", async () => {
  const { tx, clients } = mockTx([]);
  await assert.rejects(resolveJobClient(tx, { clientName: "   " }));
  await assert.rejects(resolveJobClient(tx, { clientName: "x".repeat(161) }));
  assert.equal(clients.length, 0);
});
test("partial names are suggestions, not automatic merges", async () => {
  const initial = [{ id: "john", name: "John Smith" }, { id: "joan", name: "Joan Smith" }];
  assert.deepEqual(exactClientMatches(initial, "John"), []);
  assert.deepEqual(suggestedClients(initial, "smi john").map((client) => client.id), ["john"]);
  const { tx, clients } = mockTx(initial);
  assert.equal((await resolveJobClient(tx, { clientName: "John" })).created, true); assert.equal(clients.length, 3);
});
test("saving the same newly entered client again reuses its record", async () => {
  const { tx, clients } = mockTx([]);
  const first = await resolveJobClient(tx, { clientName: "New Client" });
  const again = await resolveJobClient(tx, { clientName: "new  CLIENT" });
  assert.equal(first.client.id, again.client.id); assert.equal(again.created, false); assert.equal(clients.length, 1);
});
