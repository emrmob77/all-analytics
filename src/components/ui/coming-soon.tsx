interface ComingSoonProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

export function ComingSoon({ title, description, icon }: ComingSoonProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E8F0FE] mb-5">
        {icon}
      </div>
      <h1 className="text-xl font-bold text-[#202124] mb-2">{title}</h1>
      <p className="text-sm text-[#5F6368] text-center max-w-xs">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#FEF3CD] px-3 py-1 text-[11px] font-semibold text-[#92640D]">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
          <circle cx="5" cy="5" r="4" stroke="#92640D" strokeWidth="1.4"/>
          <path d="M5 3v2.5l1.5 1" stroke="#92640D" strokeWidth="1.3" strokeLinecap="round"/>
        </svg>
        Coming soon
      </span>
    </div>
  );
}
