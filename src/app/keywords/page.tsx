import { ComingSoon } from '@/components/ui/coming-soon';

export default function KeywordsPage() {
  return (
    <ComingSoon
      title="Keywords"
      description="Discover, track and optimise keywords driving traffic to your campaigns."
      icon={
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="7" stroke="#1A73E8" strokeWidth="1.6"/>
          <path d="M17.5 17.5L24 24" stroke="#1A73E8" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M9 12h6M12 9v6" stroke="#1A73E8" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      }
    />
  );
}
