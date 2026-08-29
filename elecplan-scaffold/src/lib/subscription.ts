import { prisma } from "@/lib/prisma";

export type SubscriptionStatus = "ACTIVE" | "TRIAL" | "GRACE" | "PAST_DUE" | "SUSPENDED" | "CANCELLED";

export type SubscriptionState = {
  status: SubscriptionStatus;
  setupFee: number;
  gracePeriodDays: number;
  graceEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: Date | null;
  provider: string | null;
  providerCustomerId: string | null;
  providerSubscriptionId: string | null;
};

const DEFAULT_STATE: SubscriptionState = {
  status: "ACTIVE",
  setupFee: 0,
  gracePeriodDays: 7,
  graceEndsAt: null,
  currentPeriodEnd: null,
  cancelAtPeriodEnd: false,
  cancelledAt: null,
  provider: null,
  providerCustomerId: null,
  providerSubscriptionId: null,
};

export function subscriptionAllowsAccess(state: SubscriptionState, now = new Date()): boolean {
  if (state.cancelAtPeriodEnd && state.currentPeriodEnd && state.currentPeriodEnd <= now) return false;
  if (state.status === "ACTIVE" || state.status === "TRIAL") return true;
  if (state.status === "GRACE") return !state.graceEndsAt || state.graceEndsAt >= now;
  if (state.status === "PAST_DUE") return !!state.graceEndsAt && state.graceEndsAt >= now;
  return false;
}

export async function getBusinessSubscription(businessId: string): Promise<SubscriptionState> {
  const rows = await prisma.$queryRaw<Array<{
    status: SubscriptionStatus;
    setupFee: unknown;
    gracePeriodDays: number;
    graceEndsAt: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    cancelledAt: Date | null;
    provider: string | null;
    providerCustomerId: string | null;
    providerSubscriptionId: string | null;
  }>>`
    SELECT "status", "setupFee", "gracePeriodDays", "graceEndsAt", "currentPeriodEnd",
           "cancelAtPeriodEnd", "cancelledAt", "provider", "providerCustomerId", "providerSubscriptionId"
    FROM "BusinessSubscription"
    WHERE "businessId" = ${businessId}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return DEFAULT_STATE;
  return {
    status: row.status,
    setupFee: Number(row.setupFee ?? 0),
    gracePeriodDays: row.gracePeriodDays,
    graceEndsAt: row.graceEndsAt,
    currentPeriodEnd: row.currentPeriodEnd,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    cancelledAt: row.cancelledAt,
    provider: row.provider,
    providerCustomerId: row.providerCustomerId,
    providerSubscriptionId: row.providerSubscriptionId,
  };
}
