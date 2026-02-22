import { PlatformPlaceholder } from '@/components/platform-placeholder';
export default async function GoogleAdsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const label = section.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return <PlatformPlaceholder platform="google-ads" section={label} />;
}
