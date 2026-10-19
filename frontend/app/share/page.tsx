import Image from 'next/image';
import Link from 'next/link';
import QRCode from 'qrcode';
import { PublicInfoPage } from '../../components/public-info-page';

const landingPageUrl = 'https://cs-student-accommodation-finder.vercel.app/';

export default async function SharePage() {
  const qrCodeDataUrl = await QRCode.toDataURL(landingPageUrl, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 1024,
    color: {
      dark: '#2c2420',
      light: '#ffffff',
    },
  });

  return (
    <PublicInfoPage eyebrow="Share Abode" title="Help someone find their place">
      <div className="mx-auto max-w-xl rounded-2xl border border-[var(--beige)] bg-[var(--warm-white)] p-5 text-center shadow-[0_12px_30px_rgba(92,74,56,0.07)] sm:p-8">
        <p className="text-[var(--charcoal)]">
          Scan this code with a phone camera to open the Abode landing page.
        </p>
        <Image
          src={qrCodeDataUrl}
          alt="QR code linking to the Abode student accommodation landing page"
          width={512}
          height={512}
          unoptimized
          className="mx-auto mt-5 aspect-square w-full max-w-80 rounded-lg bg-white p-3"
        />
        <p className="mt-4 break-all font-mono text-sm text-[var(--brown-dark)]">{landingPageUrl}</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            href={qrCodeDataUrl}
            download="abode-landing-page-qr.png"
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--charcoal)] px-5 py-3 text-sm font-semibold text-white hover:bg-[var(--charcoal-mid)]"
          >
            Download QR code PNG
          </a>
          <Link
            href={landingPageUrl}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--beige)] px-5 py-3 text-sm font-semibold text-[var(--brown-dark)] underline underline-offset-4 hover:bg-[var(--cream)]"
          >
            Open landing page
          </Link>
        </div>
        <p className="mt-4 text-xs leading-5 text-[var(--text-muted)]">
          To print, download the PNG and print it at its original size. Keep the white border
          around the code clear so cameras can scan it reliably.
        </p>
      </div>
    </PublicInfoPage>
  );
}
