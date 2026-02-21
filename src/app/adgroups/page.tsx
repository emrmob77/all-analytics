import { ComingSoon } from '@/components/ui/coming-soon';

export default function AdGroupsPage() {
  return (
    <ComingSoon
      title="Ad Groups"
      description="Manage and analyse your ad groups across all platforms in one place."
      icon={
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <rect x="3" y="7" width="22" height="5" rx="2" stroke="#1A73E8" strokeWidth="1.6"/>
          <rect x="3" y="16" width="22" height="5" rx="2" stroke="#1A73E8" strokeWidth="1.6"/>
        </svg>
      }
    />
  );
}
