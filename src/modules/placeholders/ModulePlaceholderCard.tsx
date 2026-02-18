interface ModulePlaceholderCardProps {
  icon: string;
  title: string;
  description: string;
}

function ModulePlaceholderCard({ icon, title, description }: ModulePlaceholderCardProps) {
  return (
    <section className="rounded-xl border border-border-light bg-surface-light p-6 shadow-sm dark:border-border-dark dark:bg-surface-dark">
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary text-primary">
        <span className="material-icons-round text-[24px]">{icon}</span>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-text-main-light dark:text-text-main-dark">{title}</h2>
      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">{description}</p>
    </section>
  );
}

export default ModulePlaceholderCard;
