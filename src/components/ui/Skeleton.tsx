interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        "animate-pulse rounded-md bg-gray-200/90 dark:bg-gray-700/80",
        className
      ].join(" ")}
    />
  );
}

export default Skeleton;
export type { SkeletonProps };
