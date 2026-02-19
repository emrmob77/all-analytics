import { randomUUID } from "crypto";

import type { BillingPlanId } from "@/lib/billing/plans";

export type BillingCycle = "monthly" | "yearly";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export interface SubscriptionRecord {
  id: string;
  tenantId: string;
  customerId: string;
  planId: BillingPlanId;
  cycle: BillingCycle;
  status: SubscriptionStatus;
  trialEndsAt?: string;
  currentPeriodEndsAt?: string;
  cancelAtPeriodEnd: boolean;
  updatedAt: string;
}

export interface InvoiceRecord {
  id: string;
  tenantId: string;
  amountUsd: number;
  status: "paid" | "open" | "void";
  issuedAt: string;
  hostedInvoiceUrl: string;
}

export interface CheckoutSessionRecord {
  id: string;
  tenantId: string;
  planId: BillingPlanId;
  cycle: BillingCycle;
  status: "created" | "completed" | "canceled";
  successUrl: string;
  cancelUrl: string;
  createdAt: string;
}

function nowIso() {
  return new Date().toISOString();
}

function plusDays(days: number) {
  const value = new Date();
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString();
}

const subscriptionStore = new Map<string, SubscriptionRecord>();
const checkoutSessionStore = new Map<string, CheckoutSessionRecord>();
const invoiceStore: InvoiceRecord[] = [
  {
    id: `inv_${randomUUID()}`,
    tenantId: "brand-1",
    amountUsd: 79,
    status: "paid",
    issuedAt: plusDays(-25),
    hostedInvoiceUrl: "https://billing.example.com/invoice/inv_demo_01"
  },
  {
    id: `inv_${randomUUID()}`,
    tenantId: "brand-1",
    amountUsd: 79,
    status: "paid",
    issuedAt: plusDays(-55),
    hostedInvoiceUrl: "https://billing.example.com/invoice/inv_demo_02"
  }
];

subscriptionStore.set("brand-1", {
  id: `sub_${randomUUID()}`,
  tenantId: "brand-1",
  customerId: "cus_demo_brand_1",
  planId: "pro",
  cycle: "monthly",
  status: "active",
  currentPeriodEndsAt: plusDays(18),
  cancelAtPeriodEnd: false,
  updatedAt: nowIso()
});

function createCheckoutSession(input: {
  tenantId: string;
  planId: BillingPlanId;
  cycle: BillingCycle;
  successUrl: string;
  cancelUrl: string;
}) {
  const session: CheckoutSessionRecord = {
    id: `cs_${randomUUID()}`,
    tenantId: input.tenantId,
    planId: input.planId,
    cycle: input.cycle,
    status: "created",
    successUrl: input.successUrl,
    cancelUrl: input.cancelUrl,
    createdAt: nowIso()
  };

  checkoutSessionStore.set(session.id, session);
  return session;
}

function completeCheckoutSession(sessionId: string) {
  const session = checkoutSessionStore.get(sessionId);

  if (!session) {
    return null;
  }

  session.status = "completed";

  const nextSubscription: SubscriptionRecord = {
    id: `sub_${randomUUID()}`,
    tenantId: session.tenantId,
    customerId: `cus_${session.tenantId}`,
    planId: session.planId,
    cycle: session.cycle,
    status: "trialing",
    trialEndsAt: plusDays(14),
    currentPeriodEndsAt: plusDays(session.cycle === "monthly" ? 30 : 365),
    cancelAtPeriodEnd: false,
    updatedAt: nowIso()
  };

  subscriptionStore.set(session.tenantId, nextSubscription);
  return nextSubscription;
}

function cancelCheckoutSession(sessionId: string) {
  const session = checkoutSessionStore.get(sessionId);

  if (!session) {
    return null;
  }

  session.status = "canceled";
  return session;
}

function getSubscription(tenantId: string) {
  return subscriptionStore.get(tenantId) ?? null;
}

function updateSubscription(input: {
  tenantId: string;
  planId?: BillingPlanId;
  cycle?: BillingCycle;
  status?: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
}) {
  const current = subscriptionStore.get(input.tenantId);

  if (!current) {
    return null;
  }

  const next: SubscriptionRecord = {
    ...current,
    planId: input.planId ?? current.planId,
    cycle: input.cycle ?? current.cycle,
    status: input.status ?? current.status,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? current.cancelAtPeriodEnd,
    updatedAt: nowIso()
  };

  subscriptionStore.set(input.tenantId, next);
  return next;
}

function listInvoices(tenantId: string) {
  return invoiceStore.filter((invoice) => invoice.tenantId === tenantId);
}

function createBillingPortalUrl(tenantId: string) {
  return `https://billing.example.com/portal/${tenantId}`;
}

export {
  cancelCheckoutSession,
  completeCheckoutSession,
  createBillingPortalUrl,
  createCheckoutSession,
  getSubscription,
  listInvoices,
  updateSubscription
};
