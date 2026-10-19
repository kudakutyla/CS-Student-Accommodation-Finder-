'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGuard } from '../../../../components/auth-guard';
import { notificationApi, reportApi } from '../../../../lib/api';
import type { AppNotification, StudentReport } from '../../../../types';

const statusLabels: Record<StudentReport['status'], string> = {
  PENDING: 'Submitted',
  IN_REVIEW: 'Under review',
  RESOLVED: 'Resolved',
  DISMISSED: 'Closed',
};

export default function StudentReportDetailPage() {
  const params = useParams<{ id: string }>();
  const reportId = params.id;
  const [report, setReport] = useState<StudentReport | null>(null);
  const [updates, setUpdates] = useState<AppNotification[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    Promise.all([reportApi.mineById(reportId), notificationApi.list()])
      .then(([reportResponse, notificationResponse]) => {
        if (!active) return;
        setReport(reportResponse.data);
        setUpdates(notificationResponse.data.filter(
          (notification) => notification.type === 'REPORT_STATUS' && notification.reportId === reportId
        ));
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load this report.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [reportId]);

  useEffect(() => {
    if (report && window.location.hash === '#admin-updates') {
      document.getElementById('admin-updates')?.scrollIntoView({ block: 'start' });
    }
  }, [report]);

  return (
    <AuthGuard allowedRoles={['STUDENT']}>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/student/reports" className="text-sm font-semibold text-[var(--brown-dark)] underline underline-offset-2">
          Back to my reports
        </Link>
        <header className="mt-5 border-b border-[var(--beige)] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-terracotta)]">Safety and support</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Report details</h1>
        </header>

        {error ? <p role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading report...</p> : null}
        {!loading && !error && report ? (
          <>
            <section className="mt-6 rounded-2xl border border-[var(--beige)] bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-serif text-2xl text-[var(--charcoal)]">{report.reason}</h2>
                  <Link href={`/listings/${report.listing.id}`} className="mt-2 inline-block text-sm font-semibold text-[var(--brown-dark)] underline underline-offset-2">
                    {report.listing.title}
                  </Link>
                </div>
                <span className="rounded-full border border-[var(--beige)] px-3 py-1 text-xs font-semibold">{statusLabels[report.status]}</span>
              </div>
              <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-[var(--text-muted)]">{report.description}</p>
              <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--text-muted)]">
                <span>Submitted {new Date(report.createdAt).toLocaleString()}</span>
                <span>Updated {new Date(report.updatedAt).toLocaleString()}</span>
              </div>
              {report.adminReviewNote ? (
                <div className="mt-6 border-t border-[var(--beige)] pt-5">
                  <h3 className="text-sm font-semibold text-[var(--charcoal)]">Latest admin note</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-muted)]">{report.adminReviewNote}</p>
                </div>
              ) : null}
            </section>

            <section id="admin-updates" className="mt-8 scroll-mt-6">
              <h2 className="font-serif text-2xl text-[var(--charcoal)]">Admin updates about this report</h2>
              {updates.length === 0 ? (
                <p className="mt-4 border border-[var(--beige)] bg-white p-5 text-sm text-[var(--text-muted)]">There are no admin updates on this report yet.</p>
              ) : (
                <ol className="mt-4 divide-y divide-[var(--beige)] border-y border-[var(--beige)]">
                  {updates.map((update) => (
                    <li key={update.id} className="py-5">
                      <h3 className="font-semibold text-[var(--charcoal)]">{update.title}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--text-muted)]">{update.message}</p>
                      <time className="mt-2 block text-xs text-[var(--text-muted)]">{new Date(update.createdAt).toLocaleString()}</time>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        ) : null}
      </main>
    </AuthGuard>
  );
}
