import Link from 'next/link';
import { PublicInfoPage } from '../../components/public-info-page';

export default function AboutPage() {
  return (
    <PublicInfoPage eyebrow="About Abode" title="Student accommodation, closer to campus">
      <p>
        Abode helps students discover accommodation near their campus and helps property
        providers share available homes with student communities.
      </p>
      <section className="rounded-2xl border border-[var(--beige)] bg-[var(--warm-white)] p-5">
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Reviewed before public listing</h2>
        <p className="mt-2">
          Listings are shown in public search only after administrator approval. Approval is
          a platform moderation decision; it is not a physical inspection, legal certification,
          or guarantee of a property, provider, or offer.
        </p>
      </section>
      <p>
        Browse the current accommodation options or contact us at{' '}
        <a className="font-semibold text-[var(--brown-dark)] underline underline-offset-4" href="mailto:luluchif97@gmail.com">
          luluchif97@gmail.com
        </a>.
      </p>
      <Link href="/listings" className="inline-flex rounded-xl bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--charcoal-mid)]">
        Browse accommodation
      </Link>
    </PublicInfoPage>
  );
}
