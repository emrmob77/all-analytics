export type BillingPlanId = "free" | "pro" | "team" | "enterprise";

export interface BillingPlan {
  id: BillingPlanId;
  name: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  trialDays: number;
  stripeProductId: string;
  stripeMonthlyPriceId: string;
  stripeYearlyPriceId: string;
  limits: {
    brands: number;
    teamMembers: number;
    connectors: number;
  };
  features: string[];
}

const billingPlans: BillingPlan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    trialDays: 0,
    stripeProductId: "prod_free",
    stripeMonthlyPriceId: "price_free_monthly",
    stripeYearlyPriceId: "price_free_yearly",
    limits: {
      brands: 1,
      teamMembers: 2,
      connectors: 2
    },
    features: ["2 connectors", "Basic dashboards", "Community support"]
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPriceUsd: 79,
    yearlyPriceUsd: 790,
    trialDays: 14,
    stripeProductId: "prod_pro",
    stripeMonthlyPriceId: "price_pro_monthly",
    stripeYearlyPriceId: "price_pro_yearly",
    limits: {
      brands: 5,
      teamMembers: 10,
      connectors: 15
    },
    features: ["Advanced analytics", "Connector marketplace", "Priority support"]
  },
  {
    id: "team",
    name: "Team",
    monthlyPriceUsd: 199,
    yearlyPriceUsd: 1990,
    trialDays: 14,
    stripeProductId: "prod_team",
    stripeMonthlyPriceId: "price_team_monthly",
    stripeYearlyPriceId: "price_team_yearly",
    limits: {
      brands: 20,
      teamMembers: 40,
      connectors: 40
    },
    features: ["Cross-brand workspaces", "RBAC controls", "Dedicated CSM"]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    trialDays: 30,
    stripeProductId: "prod_enterprise",
    stripeMonthlyPriceId: "price_enterprise_monthly",
    stripeYearlyPriceId: "price_enterprise_yearly",
    limits: {
      brands: 999,
      teamMembers: 999,
      connectors: 999
    },
    features: ["Custom SLAs", "Private networking", "Security review"]
  }
];

function listBillingPlans() {
  return billingPlans;
}

function getBillingPlan(planId: BillingPlanId) {
  return billingPlans.find((plan) => plan.id === planId) ?? null;
}

export { getBillingPlan, listBillingPlans };
