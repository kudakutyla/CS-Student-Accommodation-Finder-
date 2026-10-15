'use client';

import { FormEvent, useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { AuthGuard } from '../../../components/auth-guard';
import { adminApi } from '../../../lib/api';
import type { User } from '../../../types';

type AuditEntry = { id: string; action: string; targetType: string; targetId: string; description: string; createdAt: string; admin: Pick<User, 'id' | 'name'> };
type AuditFilters = { from: string; to: string; targetType: string };
const emptyFilters: AuditFilters = { from: '', to: '', targetType: '' };

export default function AdminAuditHistoryPage() {
  const [form, setForm] = useState(emptyFilters);
  const [filters, setFilters] = useState(emptyFilters);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    adminApi.getAuditLogs(filters).then((response) => {
      if (active) setEntries(response.data);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load audit history.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (form.from && form.to && form.from > form.to) {
      setError('Start date must be on or before end date.');
      return;
    }
    setLoading(true);
    setFilters(form);
  }

  function resetFilters() {
    setLoading(true);
    setForm(emptyFilters);
    setFilters(emptyFilters);
  }

  function downloadPdf() {
    const pdf = new jsPDF();
    const margin = 42;
    const contentWidth = pdf.internal.pageSize.getWidth() - margin * 2;
    const bottom = pdf.internal.pageSize.getHeight() - margin;
    let y = margin;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.text('Audit history', margin, y);
    y += 24;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
    y += 16;
    pdf.text(`From: ${filters.from || 'Any date'}`, margin, y);
    y += 13;
    pdf.text(`To: ${filters.to || 'Any date'}`, margin, y);
    y += 13;
    pdf.text(`Action category: ${filters.targetType || 'All categories'}`, margin, y);
    y += 20;

    function addText(text: string, bold = false) {
      pdf.setFont('helvetica', bold ? 'bold' : 'normal');
      const lines = pdf.splitTextToSize(text, contentWidth) as string[];
      for (const line of lines) {
        if (y + 13 > bottom) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 13;
      }
    }

    entries.forEach((entry, index) => {
      addText(`${new Date(entry.createdAt).toLocaleString()}  |  ${entry.action.replaceAll('_', ' ')} · ${entry.targetType}`, true);
      addText(entry.description);
      addText(`By ${entry.admin.name}`);
      if (index < entries.length - 1) y += 8;
    });

    const pageCount = pdf.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      pdf.setPage(page);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(`Page ${page} of ${pageCount}`, pdf.internal.pageSize.getWidth() - margin, pdf.internal.pageSize.getHeight() - 18, { align: 'right' });
    }

    pdf.save(`audit-history-${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Accountability</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Audit history</h1></div><button type="button" onClick={downloadPdf} disabled={loading || Boolean(error) || entries.length === 0} className="bg-[var(--charcoal)] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Download PDF</button></header>
        <form onSubmit={applyFilters} className="grid gap-3 border-b border-[var(--beige)] py-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto_auto] lg:items-end">
          <label className="grid gap-1 text-xs font-semibold">From<input type="date" value={form.from} onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))} className="border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">To<input type="date" value={form.to} onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))} className="border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal" /></label>
          <label className="grid gap-1 text-xs font-semibold">Action category<select value={form.targetType} onChange={(event) => setForm((current) => ({ ...current, targetType: event.target.value }))} className="border border-[var(--beige)] bg-white px-3 py-2 text-sm font-normal"><option value="">All categories</option>{['USER', 'REPORT', 'LISTING', 'CAMPUS', 'INSTITUTION', 'SYSTEM'].map((type) => <option key={type} value={type}>{type}</option>)}</select></label>
          <button className="bg-[var(--charcoal)] px-4 py-2 text-sm font-semibold text-white">Apply filters</button><button type="button" onClick={resetFilters} className="border border-[var(--beige)] px-4 py-2 text-sm font-semibold">Reset</button>
        </form>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading audit history...</p> : entries.length === 0 ? <p className="py-8 text-sm text-[var(--text-muted)]">No audit entries match these filters.</p> : <div className="divide-y divide-[var(--beige)]">{entries.map((entry) => <article key={entry.id} className="grid gap-2 py-4 sm:grid-cols-[180px_1fr_160px]"><time className="text-xs text-[var(--text-muted)]">{new Date(entry.createdAt).toLocaleString()}</time><div><p className="text-sm font-semibold">{entry.action.replaceAll('_', ' ')} · {entry.targetType}</p><p className="text-sm text-[var(--text-muted)]">{entry.description}</p></div><p className="text-xs text-[var(--text-muted)]">By {entry.admin.name}</p></article>)}</div>}
      </main>
    </AuthGuard>
  );
}
