'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '../../../components/auth-guard';
import { adminApi } from '../../../lib/api';
import type { ListingReport } from '../../../types';

type ReportStatus = ListingReport['status'];

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ListingReport[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    adminApi.getReports().then((response) => {
      if (active) setReports(response.data);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load reports.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadKey]);

  async function update(report: ListingReport, status: ReportStatus) {
    setBusyId(report.id);
    setError('');
    setNotice('');
    try {
      await adminApi.updateReport(report.id, status, notes[report.id] || '');
      setNotice(`Report ${status.toLowerCase().replace('_', ' ')}. The student has been notified.`);
      setNotes((current) => ({ ...current, [report.id]: '' }));
      setReloadKey((value) => value + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this report.');
    } finally {
      setBusyId('');
    }
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-terracotta)]">Safety and moderation</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Student reports</h1></div><button onClick={() => { setLoading(true); setReloadKey((value) => value + 1); }} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Refresh</button></header>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {notice ? <p role="status" className="mt-4 border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading reports...</p> : error ? null : reports.length === 0 ? <p className="py-8 text-sm text-[var(--text-muted)]">No student reports have been submitted.</p> : <div className="divide-y divide-[var(--beige)]">{reports.map((report) => <article key={report.id} className="grid gap-5 py-6 lg:grid-cols-[1fr_320px]"><div><div className="flex flex-wrap items-baseline gap-3"><h2 className="font-semibold">{report.reason}</h2><span className="text-xs font-semibold uppercase text-[var(--accent-terracotta)]">{report.status.replace('_', ' ')}</span></div><p className="mt-1 text-sm text-[var(--text-muted)]">{report.listing.title} · Reported by {report.user.name}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{report.description}</p><time className="mt-3 block text-xs text-[var(--text-muted)]">{new Date(report.createdAt).toLocaleString()}</time></div><div className="space-y-3"><label className="grid gap-1 text-xs font-semibold">Message to student (optional)<textarea maxLength={2000} value={notes[report.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="This message will be included in the student's in-app update." className="min-h-24 resize-y border border-[var(--beige)] bg-white p-3 text-sm font-normal" /></label><div className="flex flex-wrap gap-2">{report.status === 'PENDING' ? <button disabled={busyId === report.id} onClick={() => void update(report, 'IN_REVIEW')} className="border border-[var(--beige)] px-3 py-2 text-xs font-semibold disabled:opacity-50">{busyId === report.id ? 'Updating...' : 'Mark under review'}</button> : null}{report.status === 'PENDING' || report.status === 'IN_REVIEW' ? <><button disabled={busyId === report.id} onClick={() => void update(report, 'RESOLVED')} className="bg-emerald-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busyId === report.id ? 'Updating...' : 'Resolve'}</button><button disabled={busyId === report.id} onClick={() => void update(report, 'DISMISSED')} className="bg-red-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busyId === report.id ? 'Updating...' : 'Dismiss'}</button></> : <p className="text-xs text-[var(--text-muted)]">This report is closed.</p>}</div></div></article>)}</div>}
      </main>
    </AuthGuard>
  );
}
