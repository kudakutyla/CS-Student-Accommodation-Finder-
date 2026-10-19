import { PublicInfoPage } from '../../components/public-info-page';

export default function TermsPage() {
  return (
    <PublicInfoPage eyebrow="Terms of use · Draft" title="Using Abode">
      <aside className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <strong>Draft for review:</strong> These proposed terms are not final legal terms or
        legal advice. The service operator must confirm the missing details and obtain an
        appropriate legal review before publication as final.
      </aside>
      <section>
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Using the platform</h2>
        <p className="mt-2">
          Abode connects students with accommodation providers and supports campus-aware
          listing discovery. Users should provide accurate information, protect their sign-in
          details, and use the platform lawfully and respectfully.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Listings and moderation</h2>
        <p className="mt-2">
          A listing is eligible for public search only after administrator approval. Approval
          is a moderation decision, not a property inspection, independent certification, or
          guarantee. Abode may review submitted content and take moderation action under
          rules the operator must define.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Make your own arrangements carefully</h2>
        <p className="mt-2">
          Students and providers are responsible for confirming property details and agreeing
          any arrangements directly. Abode does not process rent payments through the
          platform. Users should inspect accommodation and independently verify important
          information before committing.
        </p>
      </section>
      <section>
        <h2 className="font-serif text-2xl text-[var(--charcoal)]">Details to confirm before publication</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>The legal entity operating Abode and the applicable governing law and jurisdiction.</li>
          <li>Age and eligibility requirements for students and providers.</li>
          <li>Account suspension, termination, dispute, and appeals procedures.</li>
          <li>Appropriate liability, warranty, intellectual-property, and user-content provisions.</li>
          <li>How and when these terms may be updated and how users will be notified.</li>
        </ul>
        <p className="mt-3">
          For questions about this draft, contact{' '}
          <a className="font-semibold text-[var(--brown-dark)] underline underline-offset-4" href="mailto:luluchif97@gmail.com">
            luluchif97@gmail.com
          </a>.
        </p>
      </section>
    </PublicInfoPage>
  );
}
