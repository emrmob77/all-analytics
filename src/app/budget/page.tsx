import { ComingSoon } from '@/components/ui/coming-soon';

export default function BudgetPage() {
  return (
    <ComingSoon
      title="Budget & Billing"
      description="Track spend, set budget caps and manage billing across all your ad accounts."
      icon={
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="3" y="6" width="22" height="16" rx="2" stroke="#1A73E8" strokeWidth="1.6"/>
          <path d="M3 11h22" stroke="#1A73E8" strokeWidth="1.6"/>
          <path d="M8 16h4M18 16h2" stroke="#1A73E8" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      }
    />
  );
}
