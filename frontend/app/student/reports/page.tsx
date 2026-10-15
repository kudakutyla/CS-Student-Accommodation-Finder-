'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '../../../components/auth-guard';
import { notificationApi, reportApi } from '../../../lib/api';
import type { AppNotification, StudentReport } from '../../../types';

const statusLabels: Record<StudentReport['status'], string> = {
  PENDING: 'Submitted',
  IN_REVIEW: 'Under review',
  RESOLVED: 'Resolved',
  DISMISSED: 'Closed',
};

export default function StudentReportsPage() {
  const [reports, setReports] = useState<StudentReport[] | null>(null);
  const [updates, setUpdates] = useState<AppNotification[] | null>(null);
  const [reportError, setReportError] = useState('');
  const [updateError, setUpdateError] = useState('');
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

    notificationApi.list().then((response) => {
      if (active) {
        setUpdates(response.data.filter((item) => item.type === 'REPORT_STATUS'));
        setUpdateError('');
      }
    }).catch((err) => {
      if (active) {
        setUpdates([]);
        setUpdateError(err instanceof Error ? err.message : 'Unable to load report updates.');
      }
    });

    return () => { active = false; };
  }, [reloadKey]);

  function refresh() {
    setReports(null);
    setUpdates(null);
    setReportError('');
    setUpdateError('');
    setReloadKey((value) => value + 1);
  }

  const loadingReports = reports === null;
  const loadingUpdates = updates === null;

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-terracotta)]">Safety and support</p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">My reports</h1>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Track concerns you have submitted and read updates from the admin team.</p>
          </div>
          <button type="button" onClick={refresh} disabled={loadingReports || loadingUpdates} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold disabled:opacity-50">
            Refresh
          </button>
        </header>

        <section className="mt-8">
          <h2 className="font-serif text-2xl text-[var(--charcoal)]">Your submitted reports</h2>
          {reportError ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{reportError}<button type="button" onClick={refresh} className="ml-3 font-semibold underline">Retry</button></p> : null}
          {loadingReports ? <p role="status" className="py-6 text-sm text-[var(--text-muted)]">Loading your reports...</p> : reportError ? null : reports.length === 0 ? (
            <p className="mt-4 border border-[var(--beige)] bg-white p-5 text-sm text-[var(--text-muted)]">You have not submitted any reports yet. You can report a concern from an accommodation listing.</p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--beige)] border-y border-[var(--beige)]">
              {reports.map((report) => (
                <article key={report.id} className="py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-[var(--charcoal)]">{report.reason}</h3>
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
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-serif text-2xl text-[var(--charcoal)]">Admin updates about reports</h2>
          {updateError ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{updateError}<button type="button" onClick={refresh} className="ml-3 font-semibold underline">Retry</button></p> : null}
          {loadingUpdates ? <p role="status" className="py-6 text-sm text-[var(--text-muted)]">Loading report updates...</p> : updateError ? null : updates.length === 0 ? (
            <p className="mt-4 border border-[var(--beige)] bg-white p-5 text-sm text-[var(--text-muted)]">There are no admin updates on your reports yet. Updates will appear here when a report is reviewed.</p>
          ) : (
            <div className="mt-4 divide-y divide-[var(--beige)] border-y border-[var(--beige)]">
              {updates.map((update) => (
                <article key={update.id} className="py-5">
                  <h3 className="font-semibold text-[var(--charcoal)]">{update.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-muted)]">{update.message}</p>
                  <time className="mt-2 block text-xs text-[var(--text-muted)]">{new Date(update.createdAt).toLocaleString()}</time>
                  <Link href="/notifications" className="mt-2 inline-block text-xs font-semibold text-[var(--brown-dark)] underline">View all account updates</Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
