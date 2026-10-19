import type { ReactNode } from 'react';
import Link from 'next/link';

export function PublicInfoPage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
      <Link href="/" className="text-sm font-semibold text-[var(--brown-dark)] underline underline-offset-4">
        Back home
      </Link>
      <header className="mt-8 border-b border-[var(--beige)] pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">{eyebrow}</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)] sm:text-5xl">{title}</h1>
      </header>
      <div className="prose-content mt-8 space-y-6 text-sm leading-7 text-[var(--text-muted)] sm:text-base">
        {children}
      </div>
    </div>
  );
}
