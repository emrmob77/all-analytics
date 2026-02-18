interface HeaderProps {
  onMenuClick: () => void;
}

function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="h-20 border-b border-border-light bg-surface-light px-4 dark:border-border-dark dark:bg-surface-dark md:px-8">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between">
        <h1 className="text-xl font-semibold text-text-main-light dark:text-text-main-dark md:text-2xl">Overview Dashboard</h1>

        <button
          aria-label="Open sidebar"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded border border-border-light text-text-muted-light dark:border-border-dark dark:text-text-muted-dark md:hidden"
          onClick={onMenuClick}
          type="button"
        >
          <span className="material-icons-round text-lg">menu</span>
        </button>
      </div>
    </header>
  );
}

export default Header;
