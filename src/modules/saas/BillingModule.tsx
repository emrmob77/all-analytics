"use client";

import { useEffect, useState } from "react";

import RoleGate from "@/components/auth/RoleGate";
import { requestApi, toCurrency } from "@/modules/saas/shared";
import { toast } from "@/lib/toast";

interface SubscriptionRecord {
  tenantId: string;
  planId: "free" | "pro" | "team" | "enterprise";
  cycle: "monthly" | "yearly";
  status: "trialing" | "active" | "past_due" | "canceled";
  currentPeriodEndsAt?: string;
  trialEndsAt?: string;
  cancelAtPeriodEnd: boolean;
}

interface BillingPlan {
  id: "free" | "pro" | "team" | "enterprise";
  name: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
}

interface Invoice {
  id: string;
  amountUsd: number;
  status: string;
  issuedAt: string;
  hostedInvoiceUrl: string;
}

function BillingModule() {
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [portalUrl, setPortalUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadBilling() {
    setIsLoading(true);

    try {
      const data = await requestApi<{ subscription: SubscriptionRecord; availablePlans: BillingPlan[]; invoices: Invoice[] }>(
        "/api/v1/billing/subscription?tenantId=brand-1"
      );

      setSubscription(data.subscription);
      setPlans(data.availablePlans);
      setInvoices(data.invoices);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load billing info.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadBilling();
  }, []);

  async function updateSubscription(payload: Partial<SubscriptionRecord>) {
    try {
      const data = await requestApi<{ subscription: SubscriptionRecord }>("/api/v1/billing/subscription", {
        method: "PUT",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          tenantId: "brand-1",
          ...payload
        })
      });

      setSubscription(data.subscription);
      toast.success("Subscription updated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Subscription update failed.");
    }
  }

  async function openPortal() {
    try {
      const data = await requestApi<{ portalUrl: string }>("/api/v1/billing/portal", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          tenantId: "brand-1"
        })
      });

      setPortalUrl(data.portalUrl);
      toast.success("Billing portal URL generated.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not open billing portal.");
    }
  }

  if (isLoading || !subscription) {
    return (
      <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
        <p className="text-sm text-text-muted-light dark:text-text-muted-dark">Loading billing data...</p>
      </section>
    );
  }

  return (
    <RoleGate minimumRole="owner">
      <div className="space-y-6">
        <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Subscription Management</h2>
          <p className="mt-1 text-sm text-text-muted-light dark:text-text-muted-dark">
            Current plan: {subscription.planId} · {subscription.cycle} · {subscription.status}
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <select
              className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark"
              defaultValue={subscription.planId}
              onChange={(event) => void updateSubscription({ planId: event.target.value as SubscriptionRecord["planId"] })}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </select>

            <select
              className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark dark:bg-background-dark"
              defaultValue={subscription.cycle}
              onChange={(event) => void updateSubscription({ cycle: event.target.value as SubscriptionRecord["cycle"] })}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>

            <button
              className="rounded-md border border-border-light px-3 py-2 text-sm dark:border-border-dark"
              onClick={() => void updateSubscription({ cancelAtPeriodEnd: !subscription.cancelAtPeriodEnd })}
              type="button"
            >
              {subscription.cancelAtPeriodEnd ? "Resume Subscription" : "Cancel at Period End"}
            </button>

            <button className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={() => void openPortal()} type="button">
              Open Billing Portal
            </button>
          </div>

          {portalUrl ? (
            <p className="mt-3 text-sm text-text-muted-light dark:text-text-muted-dark">
              Portal URL: <a className="font-medium text-primary hover:underline" href={portalUrl}>{portalUrl}</a>
            </p>
          ) : null}
        </section>

        <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <h2 className="text-lg font-semibold text-text-main-light dark:text-text-main-dark">Invoice History</h2>
          <div className="mt-3 space-y-2">
            {invoices.map((invoice) => (
              <article className="rounded-lg border border-border-light p-3 dark:border-border-dark" key={invoice.id}>
                <p className="text-sm font-semibold text-text-main-light dark:text-text-main-dark">
                  {toCurrency(invoice.amountUsd)} · {invoice.status}
                </p>
                <p className="mt-1 text-xs text-text-muted-light dark:text-text-muted-dark">{new Date(invoice.issuedAt).toLocaleDateString()}</p>
                <a className="mt-1 inline-block text-xs font-medium text-primary hover:underline" href={invoice.hostedInvoiceUrl}>
                  View invoice
                </a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </RoleGate>
  );
}

export default BillingModule;
