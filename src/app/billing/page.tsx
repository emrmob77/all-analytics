'use client';

import { useQuery } from '@tanstack/react-query';
import { getBillingInfo, type OrgPlan } from '@/lib/actions/billing';

// ---------------------------------------------------------------------------
// Plan definitions
// ---------------------------------------------------------------------------

interface PlanDef {
  id: OrgPlan;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  limits: { campaigns: number | null; adAccounts: number | null; members: number | null };
  highlight?: boolean;
}

const PLANS: PlanDef[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Perfect for getting started with one team.',
    features: [
      '5 campaigns tracked',
      '1 ad account per platform',
      '1 team member',
      '30-day data retention',
      'CSV export',
    ],
    limits: { campaigns: 5, adAccounts: 4, members: 1 },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/month',
    description: 'For growing teams and agencies.',
    features: [
      'Unlimited campaigns',
      'Unlimited ad accounts',
      'Up to 10 team members',
      '1-year data retention',
      'CSV / Excel / PDF export',
      'Email notifications',
      'Priority support',
    ],
    limits: { campaigns: null, adAccounts: null, members: 10 },
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    period: '/month',
    description: 'For large organisations with advanced needs.',
    features: [
      'Everything in Pro',
      'Unlimited team members',
      '3-year data retention',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'SSO / SAML',
    ],
    limits: { campaigns: null, adAccounts: null, members: null },
  },
];

const PLAN_BADGE: Record<OrgPlan, { bg: string; text: string; border: string }> = {
  free:       { bg: 'bg-[#F1F3F4]',  text: 'text-[#5F6368]',  border: 'border-[#E3E8EF]' },
  pro:        { bg: 'bg-[#E8F0FE]',  text: 'text-[#1A73E8]',  border: 'border-[#D2E3FC]' },
  enterprise: { bg: 'bg-[#F3E8FD]',  text: 'text-[#7B1FA2]',  border: 'border-[#E4C6F8]' },
};

const MOCK_INVOICES = [
  { id: 'INV-2026-02', date: 'Feb 1, 2026', amount: '$49.00', status: 'paid' },
  { id: 'INV-2026-01', date: 'Jan 1, 2026', amount: '$49.00', status: 'paid' },
  { id: 'INV-2025-12', date: 'Dec 1, 2025', amount: '$49.00', status: 'paid' },
];

// ---------------------------------------------------------------------------
// Small components
// ---------------------------------------------------------------------------

function CheckIcon() {
  return (
    <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="6.5" fill="#E6F4EA" />
      <path d="M4.5 7l2 2 3-3" stroke="#137333" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsageMeter({
  label,
  used,
  limit,
}: {
  label: string;
  used: number;
  limit: number | null;
}) {
  const pct = limit ? Math.min((used / limit) * 100, 100) : 0;
  const barColor = pct >= 90 ? '#C5221F' : pct >= 70 ? '#E37400' : '#1A73E8';

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[12.5px] text-[#5F6368]">{label}</span>
        <span className="text-[12.5px] font-semibold text-[#202124] tabular-nums">
          {used}
          <span className="font-normal text-[#9AA0A6]">
            {limit ? ` / ${limit}` : ' / ∞'}
          </span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-[#E3E8EF] overflow-hidden">
        {limit ? (
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: barColor }}
          />
        ) : (
          /* Unlimited: soft steady fill to signal "no limit" */
          <div className="h-full rounded-full w-1/4 bg-[#1A73E8] opacity-40" />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BillingPage() {
  const { data: result, isLoading } = useQuery({
    queryKey: ['billing'],
    queryFn: () => getBillingInfo(),
    staleTime: 60_000,
  });

  const billing = result?.data;
  const currentPlan: OrgPlan = billing?.plan ?? 'free';
  const planDef  = PLANS.find((p) => p.id === currentPlan) ?? PLANS[0];
  const badge    = PLAN_BADGE[currentPlan];
  const isPaid   = currentPlan !== 'free';

  return (
    <div className="w-full px-6 py-6 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-[22px] font-bold text-[#202124] tracking-tight">Billing</h1>
        <p className="text-sm text-[#5F6368] mt-0.5">
          Manage your subscription, payment method and invoices
        </p>
      </div>

      {/* ── Current Plan ── */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-3">
          Current Plan
        </h2>
        <div className="rounded-xl border border-[#E3E8EF] bg-white px-6 py-5">
          {isLoading ? (
            <div className="h-16 animate-pulse rounded-lg bg-[#F1F3F4]" />
          ) : (
            <div className="flex items-start justify-between gap-6">
              <div>
                {/* Plan badge + renewal */}
                <div className="flex items-center gap-2.5 mb-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wide border ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    {planDef.name}
                  </span>
                  {isPaid && billing?.planRenewalAt && (
                    <span className="text-[12px] text-[#9AA0A6]">
                      Renews{' '}
                      {new Date(billing.planRenewalAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  {!isPaid && (
                    <span className="text-[12px] text-[#9AA0A6]">No renewal date</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-[28px] font-bold text-[#202124]">{planDef.price}</span>
                  <span className="text-[13px] text-[#9AA0A6]">{planDef.period}</span>
                </div>
                <p className="text-[12.5px] text-[#5F6368]">{planDef.description}</p>
              </div>

              {/* CTA */}
              <div className="shrink-0 pt-1">
                {!isPaid ? (
                  <button className="rounded-lg bg-[#1A73E8] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1557b0] transition-colors">
                    Upgrade to Pro
                  </button>
                ) : (
                  <button className="rounded-lg border border-[#E3E8EF] px-5 py-2.5 text-[13px] font-semibold text-[#5F6368] hover:bg-[#F1F3F4] transition-colors">
                    Manage Subscription
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Usage ── */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-3">
          Usage
        </h2>
        <div className="rounded-xl border border-[#E3E8EF] bg-white px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-7 animate-pulse rounded bg-[#F1F3F4]" />
              ))}
            </div>
          ) : (
            <>
              <UsageMeter
                label="Campaigns"
                used={billing?.usage.campaigns ?? 0}
                limit={planDef.limits.campaigns}
              />
              <UsageMeter
                label="Ad Accounts"
                used={billing?.usage.adAccounts ?? 0}
                limit={planDef.limits.adAccounts}
              />
              <UsageMeter
                label="Team Members"
                used={billing?.usage.members ?? 0}
                limit={planDef.limits.members}
              />
            </>
          )}
        </div>
      </section>

      {/* ── Plans ── */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-3">
          Plans
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan;
            const b = PLAN_BADGE[plan.id];
            return (
              <div
                key={plan.id}
                className={`rounded-xl border bg-white px-5 py-5 flex flex-col ${
                  plan.highlight
                    ? 'border-[#1A73E8] shadow-[0_0_0_1px_#1A73E8]'
                    : 'border-[#E3E8EF]'
                }`}
              >
                {plan.highlight && (
                  <span className="mb-3 self-start rounded-full bg-[#1A73E8] px-2.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-white">
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide border ${b.bg} ${b.text} ${b.border}`}
                  >
                    {plan.name}
                  </span>
                </div>
                <p className="text-[11.5px] text-[#9AA0A6] mb-3">{plan.description}</p>

                <p className="text-[24px] font-bold text-[#202124] mb-4 leading-none">
                  {plan.price}
                  <span className="text-[12px] font-normal text-[#9AA0A6] ml-1">{plan.period}</span>
                </p>

                <ul className="space-y-2.5 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12px] text-[#5F6368]">
                      <CheckIcon />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div className="rounded-lg border border-[#E3E8EF] py-2 text-center text-[12px] font-semibold text-[#9AA0A6]">
                    Current plan
                  </div>
                ) : (
                  <button
                    className={`rounded-lg py-2 text-[12.5px] font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-[#1A73E8] text-white hover:bg-[#1557b0]'
                        : 'border border-[#E3E8EF] text-[#5F6368] hover:bg-[#F1F3F4]'
                    }`}
                  >
                    {plan.id === 'free' ? 'Downgrade' : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Payment Method + Invoices side by side (or stacked on narrow) ── */}
      <div className="grid grid-cols-2 gap-6">

        {/* Payment Method */}
        <section>
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-3">
            Payment Method
          </h2>
          <div className="rounded-xl border border-[#E3E8EF] bg-white px-5 py-4 h-[calc(100%-28px)]">
            {isPaid ? (
              <div className="flex items-center gap-3">
                {/* Card artwork */}
                <div className="flex h-10 w-16 shrink-0 items-center justify-center rounded-md border border-[#E3E8EF] bg-[#FAFAFA]">
                  <svg width="30" height="20" viewBox="0 0 30 20" fill="none">
                    <rect width="30" height="20" rx="3" fill="#1A1F71" />
                    <text x="4" y="13" fill="white" fontSize="8" fontFamily="sans-serif" fontWeight="bold">VISA</text>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#202124]">Visa •••• 4242</p>
                  <p className="text-[11.5px] text-[#9AA0A6]">Expires 12 / 2027</p>
                </div>
                <button className="text-[12px] font-medium text-[#1A73E8] hover:underline shrink-0">
                  Update
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3">
                <div>
                  <p className="text-[13px] font-medium text-[#202124]">No payment method</p>
                  <p className="text-[12px] text-[#9AA0A6] mt-0.5">
                    Add a card to upgrade to a paid plan.
                  </p>
                </div>
                <button className="rounded-lg bg-[#1A73E8] px-4 py-2 text-[12.5px] font-semibold text-white hover:bg-[#1557b0] transition-colors">
                  Add Card
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Invoice History */}
        <section>
          <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#9AA0A6] mb-3">
            Invoice History
          </h2>
          <div className="rounded-xl border border-[#E3E8EF] bg-white overflow-hidden">
            {!isPaid ? (
              <div className="px-5 py-8 text-center">
                <p className="text-[13px] text-[#5F6368]">No invoices yet</p>
                <p className="text-[12px] text-[#9AA0A6] mt-0.5">
                  Invoices will appear here once you upgrade.
                </p>
              </div>
            ) : (
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="border-b border-[#E3E8EF] bg-[#FAFAFA]">
                    <th className="px-4 py-2 text-left font-semibold text-[#5F6368]">Invoice</th>
                    <th className="px-4 py-2 text-left font-semibold text-[#5F6368]">Date</th>
                    <th className="px-4 py-2 text-right font-semibold text-[#5F6368]">Amount</th>
                    <th className="px-4 py-2 text-right font-semibold text-[#5F6368]">PDF</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_INVOICES.map((inv, i) => (
                    <tr
                      key={inv.id}
                      className={`border-b border-[#F1F3F4] last:border-0 ${
                        i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAFA]'
                      }`}
                    >
                      <td className="px-4 py-2.5 font-medium text-[#202124]">{inv.id}</td>
                      <td className="px-4 py-2.5 text-[#5F6368]">{inv.date}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-[#202124]">
                        {inv.amount}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button className="text-[11.5px] font-medium text-[#1A73E8] hover:underline">
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

      </div>

    </div>
  );
}
