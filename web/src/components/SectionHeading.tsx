import Link from 'next/link';

export function SectionHeading({
  title,
  href,
  linkLabel = 'View all',
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <div className="mb-2 h-1 w-10 rounded-full bg-gradient-to-r from-accent to-accent-dark" />
        <h2 className="text-xl font-extrabold tracking-tight md:text-2xl">{title}</h2>
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-bold text-accent-dark transition hover:border-accent hover:bg-accent/10"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
