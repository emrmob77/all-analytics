import { ComingSoon } from '@/components/ui/coming-soon';

export default function CreativesPage() {
  return (
    <ComingSoon
      title="Ads & Creatives"
      description="Design, manage and A/B test your ad creatives across every platform."
      icon={
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="22" height="16" rx="2" stroke="#1A73E8" strokeWidth="1.6"/>
          <path d="M3 15l6-4 4 3 4-5 8 6" stroke="#1A73E8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="10" r="1.5" fill="#1A73E8"/>
        </svg>
      }
    />
  );
}
