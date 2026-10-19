import { PublicInfoPage } from '../../components/public-info-page';

export default function PrivacyPage() {
  return (
    <PublicInfoPage eyebrow="Privacy notice · Draft" title="How information is handled">
      <aside className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <strong>Draft for review:</strong> This page is not a final privacy policy or legal
        advice. The service operator must confirm the details below and obtain an appropriate
        legal review before relying on or publishing this notice as final.
      </aside>
      <section>
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Information used by Abode</h2>
        <p className="mt-2">
          The service uses account information such as name, email address, phone number,
          and account role. Depending on how you use Abode, it may also handle listing
          details and photos, favourites, reviews, messages and attachments, reports, and
          notifications.
        </p>
        <p className="mt-2">
          Passwords are stored as password hashes rather than returned to the browser.
          Address lookups and route calculations use OpenStreetMap Nominatim and OSRM;
          map tiles are attributed to OpenStreetMap contributors.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Why information is used</h2>
        <p className="mt-2">
          Information supports account access, accommodation discovery, listing moderation,
          and the platform features you choose to use, including messages and safety reports.
          Public listings must be administrator-approved before appearing in search.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Details to confirm before publication</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>The legal name and contact details of the responsible service operator.</li>
          <li>Applicable lawful bases, data-retention periods, and account-deletion process.</li>
          <li>All hosting, email, mapping, and other service providers, including any cross-border processing.</li>
          <li>How users can make privacy requests or raise a privacy concern.</li>
          <li>Whether analytics, cookies, or other tracking technologies are used.</li>
        </ul>
        <p className="mt-3">
          Contact the current project contact at{' '}
          <a className="font-semibold text-[var(--brown-dark)] underline underline-offset-4" href="mailto:luluchif97@gmail.com">
            luluchif97@gmail.com
          </a>{' '}
          while this draft is being reviewed.
        </p>
      </section>
    </PublicInfoPage>
  );
}
