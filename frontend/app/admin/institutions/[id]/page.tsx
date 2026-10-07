'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AuthGuard } from '../../../../components/auth-guard';
import { campusApi } from '../../../../lib/api';
import type { Campus, Institution } from '../../../../types';

type CampusForm = { institutionId: string; name: string; location: string; address: string };
const emptyForm: CampusForm = { institutionId: '', name: '', location: '', address: '' };

export default function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [form, setForm] = useState<CampusForm>(emptyForm);
  const [editingCampusId, setEditingCampusId] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    try {
      const [institutionResponse, campusResponse] = await Promise.all([
        campusApi.getAdminInstitutions(),
        campusApi.getCampuses(true, id),
      ]);
      const selected = institutionResponse.data.find((item) => item.id === id);
      if (!selected) {
        setError('Institution not found.');
        setInstitution(null);
      } else {
        setInstitution(selected);
        setCampuses(campusResponse.data);
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load this institution.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openCampusForm(campus?: Campus) {
    setEditingCampusId(campus?.id || '');
    setForm({
      institutionId: id,
      name: campus?.name || '',
      location: campus?.location || '',
      address: campus?.address || '',
    });
    setFormOpen(true);
    setError('');
  }

  async function saveCampus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      if (editingCampusId) await campusApi.updateCampus(editingCampusId, form);
      else await campusApi.createCampus(form);
      setForm(emptyForm);
      setFormOpen(false);
      setEditingCampusId('');
      setNotice(editingCampusId ? 'Campus updated.' : 'Campus added.');
      setLoading(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this campus.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/campuses" className="text-sm font-semibold text-[var(--brown-dark)] hover:underline">Back to institutions</Link>
        <header className="mt-5 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Institution management</p>
            <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">{institution?.name || 'Institution'}</h1>
            {institution?.shortName ? <p className="mt-1 text-sm text-[var(--text-muted)]">{institution.shortName}</p> : null}
          </div>
          <button type="button" disabled={!institution || loading} onClick={() => openCampusForm()} className="bg-[var(--charcoal)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">Add Campus</button>
        </header>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {notice ? <p role="status" className="mt-4 border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p> : null}
        {formOpen ? (
          <form onSubmit={saveCampus} className="mt-6 grid gap-4 border border-[var(--beige)] bg-white p-5 sm:grid-cols-2">
            <h2 className="font-serif text-2xl text-[var(--charcoal)] sm:col-span-2">{editingCampusId ? 'Edit campus' : `Add a campus to ${institution?.name || 'this institution'}`}</h2>
            <label className="grid gap-1 text-sm font-medium">Campus name<input required minLength={2} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="border border-[var(--beige)] px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium">City / region<input required minLength={2} value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} className="border border-[var(--beige)] px-3 py-2" /></label>
            <label className="grid gap-1 text-sm font-medium sm:col-span-2">Full campus street address<input required minLength={5} value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} placeholder="Street, suburb, city, postal code" className="border border-[var(--beige)] px-3 py-2" /></label>
            <p className="text-xs text-[var(--text-muted)] sm:col-span-2">Campus coordinates are geocoded from this address using the backend Google Maps configuration.</p>
            <div className="flex gap-2 sm:col-span-2">
              <button disabled={saving} className="bg-[var(--charcoal)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editingCampusId ? 'Save campus' : 'Add campus'}</button>
              <button type="button" onClick={() => { setFormOpen(false); setEditingCampusId(''); setForm(emptyForm); }} className="border border-[var(--beige)] px-4 py-2 text-sm">Cancel</button>
            </div>
          </form>
        ) : null}
        <section className="mt-8">
          <h2 className="font-serif text-2xl text-[var(--charcoal)]">Campuses</h2>
          {loading ? <p role="status" className="py-6 text-sm text-[var(--text-muted)]">Loading campuses...</p> : campuses.length === 0 ? <p className="py-6 text-sm text-[var(--text-muted)]">No campuses have been added for this institution.</p> : (
            <div className="mt-4 divide-y divide-[var(--beige)]">
              {campuses.map((campus) => <article key={campus.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div><p className="font-semibold text-[var(--charcoal)]">{campus.name}</p><p className="mt-1 text-sm text-[var(--text-muted)]">{campus.location} · {campus.address}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{campus.listingCount ?? 0} approved listings · {campus.isActive ? 'Active' : 'Inactive'}</p></div>
                <button type="button" onClick={() => openCampusForm(campus)} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Edit campus</button>
              </article>)}
            </div>
          )}
        </section>
      </main>
    </AuthGuard>
  );
}
