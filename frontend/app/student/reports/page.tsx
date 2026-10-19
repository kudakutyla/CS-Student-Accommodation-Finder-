'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '../../../components/auth-guard';
import { reportApi } from '../../../lib/api';
import type { StudentReport } from '../../../types';

const statusLabels: Record<StudentReport['status'], string> = {
  PENDING: 'Submitted',
  IN_REVIEW: 'Under review',
  RESOLVED: 'Resolved',
  DISMISSED: 'Closed',
};

export default function StudentReportsPage() {
  const [reports, setReports] = useState<StudentReport[] | null>(null);
  const [reportError, setReportError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    reportApi.mine().then((response) => {
      if (active) {
        setReports(response.data);
        setReportError('');
      }
    }).catch((err) => {
      if (active) {
        setReports([]);
        setReportError(err instanceof Error ? err.message : 'Unable to load your reports.');
      }
    });

    return () => { active = false; };
  }, [reloadKey]);

  function refresh() {
    setReports(null);
    setReportError('');
    setReloadKey((value) => value + 1);
  }

  const loadingReports = reports === null;

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--beige)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-terracotta)]">Safety and support</p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">My reports</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Track concerns you have submitted and their review status.</p>
          </div>
          <button type="button" onClick={refresh} disabled={loadingReports} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold disabled:opacity-50">
            Refresh
          </button>
        </header>

        <section className="mt-8">
          {reportError ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{reportError}<button type="button" onClick={refresh} className="ml-3 font-semibold underline">Retry</button></p> : null}
          {loadingReports ? <p role="status" className="py-6 text-sm text-[var(--text-muted)]">Loading your reports...</p> : reportError ? null : reports.length === 0 ? (
            <p className="mt-4 border border-[var(--beige)] bg-white p-5 text-sm text-[var(--text-muted)]">You have not submitted any reports yet. You can report a concern from an accommodation listing.</p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--beige)] border-y border-[var(--beige)]">
              {reports.map((report) => (
                <article key={report.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[var(--charcoal)]">
                        <Link
                          href={`/student/reports/${encodeURIComponent(report.id)}#admin-updates`}
                          className="underline decoration-[var(--beige)] underline-offset-4 hover:decoration-[var(--accent-terracotta)]"
                        >
                          {report.reason}
                        </Link>
                      </h3>
                      <Link href={`/listings/${report.listing.id}`} className="mt-1 inline-block text-sm text-[var(--brown-dark)] underline underline-offset-2">
                        {report.listing.title}
                      </Link>
                    </div>
                    <span className="rounded-full border border-[var(--beige)] px-3 py-1 text-xs font-semibold">{statusLabels[report.status]}</span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--text-muted)]">{report.description}</p>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--text-muted)]">
                    <span>Submitted {new Date(report.createdAt).toLocaleString()}</span>
                    <span>Updated {new Date(report.updatedAt).toLocaleString()}</span>
                  </div>
                  <Link href={`/student/reports/${encodeURIComponent(report.id)}#admin-updates`} className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-[var(--accent-terracotta)] px-4 py-2 text-sm font-semibold text-white hover:brightness-95">
                    View report updates
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
