import Link from 'next/link';
import { PublicInfoPage } from '../../components/public-info-page';

export default function SafetyPage() {
  return (
    <PublicInfoPage eyebrow="Safety and reporting" title="Make informed accommodation choices">
      <p>
        Administrator approval controls whether a listing can appear publicly on Abode. It
        does not confirm the property&apos;s physical condition or guarantee that every statement
        in an offer is suitable for you.
      </p>
      <section className="rounded-2xl border border-[var(--beige)] bg-[var(--warm-white)] p-5">
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Before making arrangements</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Confirm the address, price, availability, and important terms directly with the provider.</li>
          <li>Arrange to view the accommodation and make your own assessment before committing.</li>
          <li>Abode does not process rent payments; be cautious with requests to transfer money before you have independently confirmed an offer.</li>
        </ul>
      </section>
      <section>
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Report a concern</h2>
        <p className="mt-2">
          Signed-in students can open a listing and use its <strong>Report a concern</strong>
          form to send a report to the administrators. Include clear details so the team can
          review it. For help, email{' '}
          <a className="font-semibold text-[var(--brown-dark)] underline underline-offset-4" href="mailto:luluchif97@gmail.com">
            luluchif97@gmail.com
          </a>.
        </p>
        <Link href="/listings" className="mt-4 inline-flex rounded-xl bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--charcoal-mid)]">
          Browse listings
        </Link>
      </section>
    </PublicInfoPage>
  );
}
