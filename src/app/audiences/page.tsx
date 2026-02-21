import { ComingSoon } from '@/components/ui/coming-soon';

export default function AudiencesPage() {
  return (
    <ComingSoon
      title="Audiences"
      description="Build and manage custom audiences to reach the right people at the right time."
      icon={
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <circle cx="10" cy="11" r="4" stroke="#1A73E8" strokeWidth="1.6"/>
          <circle cx="20" cy="11" r="3" stroke="#1A73E8" strokeWidth="1.6"/>
          <path d="M3 22c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#1A73E8" strokeWidth="1.6" strokeLinecap="round"/>
          <path d="M20 17c2.2.5 4 2.3 4 5" stroke="#1A73E8" strokeWidth="1.6" strokeLinecap="round"/>
        </svg>
      }
    />
  );
}
