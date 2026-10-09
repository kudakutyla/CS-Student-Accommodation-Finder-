'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '../../../components/auth-guard';
import { campusApi } from '../../../lib/api';
import type { Campus, Institution } from '../../../types';

type CampusFormValues = { institutionId: string; name: string; location: string; address: string };
const emptyCampus: CampusFormValues = { institutionId: '', name: '', location: '', address: '' };
const duplicateInstitutionMessage = 'An institution with this name already exists';

function normalizeInstitutionName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export default function AdminCampusesPage() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [institutionForm, setInstitutionForm] = useState({ name: '', shortName: '' });
  const [editingInstitutionId, setEditingInstitutionId] = useState('');
  const [campusForm, setCampusForm] = useState<CampusFormValues>(emptyCampus);
  const [editingCampusId, setEditingCampusId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{
    name: string;
    country: string;
    countryCode: string | null;
    domains: string[];
    webPages: string[];
  }>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestionError, setSuggestionError] = useState('');
  const [suggestionRetryKey, setSuggestionRetryKey] = useState(0);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [institutionResponse, campusResponse] = await Promise.all([
        campusApi.getAdminInstitutions(), campusApi.getCampuses(true),
      ]);
      setInstitutions(institutionResponse.data);
      setCampuses(campusResponse.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load institutions and campuses.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    Promise.all([campusApi.getAdminInstitutions(), campusApi.getCampuses(true)]).then(([institutionResponse, campusResponse]) => {
      if (!active) return;
      setInstitutions(institutionResponse.data);
      setCampuses(campusResponse.data);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load institutions and campuses.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const search = suggestionQuery.trim();
    if (search.length < 2) return;
    let active = true;
    const timer = window.setTimeout(() => {
      campusApi.getInstitutionSuggestions(search).then((response) => {
        if (active) setSuggestions(response.data);
      }).catch((err) => {
        if (active) setSuggestionError(err instanceof Error ? err.message : 'Unable to load university suggestions.');
      }).finally(() => {
        if (active) setLoadingSuggestions(false);
      });
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [suggestionQuery, suggestionRetryKey]);

  async function saveInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { name: institutionForm.name.trim(), shortName: institutionForm.shortName.trim() || null };
      if (editingInstitutionId) {
        await campusApi.updateInstitution(editingInstitutionId, payload);
      } else {
        const existingInstitution = institutions.find((institution) =>
          institution.isActive !== false &&
          normalizeInstitutionName(institution.name) === normalizeInstitutionName(payload.name)
        );
        if (existingInstitution) {
          router.push(`/admin/campuses/add?institutionId=${encodeURIComponent(existingInstitution.id)}`);
          return;
        }

        const response = await campusApi.createInstitution(payload);
        router.push(`/admin/campuses/add?institutionId=${encodeURIComponent(response.data.id)}`);
        return;
      }
      setInstitutionForm({ name: '', shortName: '' });
      setEditingInstitutionId('');
      setNotice('Institution updated.');
      await load();
    } catch (err) {
      if (!editingInstitutionId && err instanceof Error &&
        err.message.toLowerCase() === duplicateInstitutionMessage.toLowerCase()) {
        try {
          const response = await campusApi.getAdminInstitutions();
          setInstitutions(response.data);
          const existingInstitution = response.data.find((institution) =>
            institution.isActive !== false &&
            normalizeInstitutionName(institution.name) === normalizeInstitutionName(institutionForm.name)
          );
          if (existingInstitution) {
            router.push(`/admin/campuses/add?institutionId=${encodeURIComponent(existingInstitution.id)}`);
            return;
          }
        } catch (refreshError) {
          setError(refreshError instanceof Error
            ? `The institution already exists, but its campus page could not be loaded: ${refreshError.message}`
            : 'The institution already exists, but its campus page could not be loaded.');
          return;
        }
      }
      setError(err instanceof Error ? err.message : 'Unable to save institution.');
    } finally {
      setSaving(false);
    }
  }

  async function saveCampus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editingCampusId) await campusApi.updateCampus(editingCampusId, campusForm);
      else await campusApi.createCampus(campusForm);
      setCampusForm(emptyCampus);
      setEditingCampusId('');
      setNotice(editingCampusId ? 'Campus updated.' : 'Campus created.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save campus.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleInstitution(institution: Institution) {
    setError('');
    try {
      await campusApi.updateInstitution(institution.id, { isActive: !institution.isActive });
      setNotice(`Institution ${institution.isActive ? 'deactivated' : 'activated'}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update institution status.');
    }
  }

  async function toggleCampus(campus: Campus) {
    setError('');
    try {
      await campusApi.toggleCampusStatus(campus.id, !campus.isActive);
      setNotice(`Campus ${campus.isActive ? 'deactivated' : 'activated'}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update campus status.');
    }
  }

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--beige)] pb-5">
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Geographic catalog</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Institutions and campuses</h1></div>
          <button onClick={() => void load()} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold">Refresh</button>
        </header>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {notice ? <p role="status" className="mt-4 border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p> : null}
        {loading ? <p role="status" className="py-8 text-sm text-[var(--text-muted)]">Loading geographic catalog...</p> : null}

        <section className="grid gap-10 border-b border-[var(--beige)] py-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-terracotta)]">Step 1</p>
            <h2 className="mt-1 font-serif text-2xl">Institutions</h2>
            {!editingInstitutionId ? <div className="mt-4 border border-[var(--beige)] bg-white p-4">
              <label className="grid gap-1 text-xs font-medium"><span className="font-bold">Find a university in South Africa</span>
                <input
                  value={suggestionQuery}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSuggestionQuery(value);
                    setSuggestions([]);
                    setSuggestionError('');
                    setLoadingSuggestions(value.trim().length >= 2);
                  }}
                  placeholder="Type at least 2 characters"
                  className="border border-[var(--beige)] px-3 py-2 text-sm"
                />
              </label>
              {loadingSuggestions ? <p role="status" className="mt-2 text-xs text-[var(--text-muted)]">Searching universities...</p> : null}
              {suggestionError ? <div className="mt-2 flex items-start justify-between gap-3"><p role="alert" className="text-xs text-red-700">{suggestionError}</p><button type="button" onClick={() => { setSuggestionError(''); setLoadingSuggestions(true); setSuggestionRetryKey((value) => value + 1); }} className="shrink-0 text-xs font-semibold underline">Retry</button></div> : null}
              {suggestionQuery.trim().length >= 2 && suggestions.length > 0 ? <ul className="mt-2 max-h-52 divide-y divide-[var(--beige)] overflow-y-auto">{suggestions.map((suggestion) => <li key={`${suggestion.name}-${suggestion.domains[0] || ''}`}><button type="button" onClick={() => { setInstitutionForm((current) => ({ ...current, name: suggestion.name })); setSuggestionQuery(''); setSuggestions([]); }} className="w-full py-2 text-left text-sm hover:bg-[var(--cream)]">{suggestion.name}<span className="ml-2 text-xs text-[var(--text-muted)]">{suggestion.domains[0] || suggestion.country}</span></button></li>)}</ul> : null}
              {suggestionQuery.trim().length >= 2 && !loadingSuggestions && !suggestionError && suggestions.length === 0 ? <p className="mt-2 text-xs text-[var(--text-muted)]">No matching universities found.</p> : null}
            </div> : null}
            <form onSubmit={saveInstitution} className="mt-4 grid gap-3 border border-[var(--beige)] bg-white p-4">
              <label className="grid gap-1 text-xs font-medium">Institution name<input required minLength={2} value={institutionForm.name} onChange={(event) => setInstitutionForm((current) => ({ ...current, name: event.target.value }))} className="border border-[var(--beige)] px-3 py-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium">Short name (optional)<input value={institutionForm.shortName} onChange={(event) => setInstitutionForm((current) => ({ ...current, shortName: event.target.value }))} className="border border-[var(--beige)] px-3 py-2 text-sm" /></label>
              <div className="flex gap-2"><button disabled={saving || (!editingInstitutionId && loading)} className="bg-[var(--charcoal)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editingInstitutionId ? 'Save institution' : 'Add institution'}</button>{editingInstitutionId ? <button type="button" onClick={() => { setEditingInstitutionId(''); setInstitutionForm({ name: '', shortName: '' }); }} className="border border-[var(--beige)] px-3 py-2 text-sm">Cancel</button> : null}</div>
            </form>
            {!editingInstitutionId ? <div className="mt-4 border border-[var(--beige)] bg-white p-4">
              <label className="grid gap-1 text-xs font-medium">Find a university in South Africa
                <input value={suggestionQuery} onChange={(event) => { const value = event.target.value; setSuggestionQuery(value); setSuggestions([]); setSuggestionError(''); setLoadingSuggestions(value.trim().length >= 2); }} placeholder="Type at least 2 characters" className="border border-[var(--beige)] px-3 py-2 text-sm" />
              </label>
              {loadingSuggestions ? <p role="status" className="mt-2 text-xs text-[var(--text-muted)]">Searching universities...</p> : null}
              {suggestionError ? <div className="mt-2 flex items-start justify-between gap-3"><p role="alert" className="text-xs text-red-700">{suggestionError}</p><button type="button" onClick={() => { setSuggestionError(''); setLoadingSuggestions(true); setSuggestionRetryKey((value) => value + 1); }} className="shrink-0 text-xs font-semibold underline">Retry</button></div> : null}
              {suggestionQuery.trim().length >= 2 && suggestions.length ? <ul className="mt-2 max-h-52 divide-y divide-[var(--beige)] overflow-y-auto">{suggestions.map((suggestion) => <li key={`${suggestion.name}-${suggestion.domains[0] || ''}`}><button type="button" onClick={() => setInstitutionForm((current) => ({ ...current, name: suggestion.name }))} className="w-full py-2 text-left text-sm hover:bg-[var(--cream)]">{suggestion.name}<span className="ml-2 text-xs text-[var(--text-muted)]">{suggestion.domains[0] || suggestion.country}</span></button></li>)}</ul> : suggestionQuery.trim().length >= 2 && !loadingSuggestions && !suggestionError && suggestions.length === 0 ? <p className="mt-2 text-xs text-[var(--text-muted)]">No matching universities found.</p> : null}
            </div> : null}
            <div className="mt-4 divide-y divide-[var(--beige)]">
              {institutions.map((institution) => <article key={institution.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{institution.name} {institution.shortName ? <span className="text-xs font-normal text-[var(--text-muted)]">({institution.shortName})</span> : null}</p><p className="text-xs text-[var(--text-muted)]">{institution.campusCount ?? 0} campuses · {institution.isActive ? 'Active' : 'Inactive'}</p></div><div className="flex flex-wrap gap-2"><Link href={`/admin/institutions/${institution.id}`} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">Manage campuses</Link>{institution.isActive ? <Link href={`/admin/campuses/add?institutionId=${encodeURIComponent(institution.id)}`} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">Add campus</Link> : null}<button onClick={() => { setEditingInstitutionId(institution.id); setInstitutionForm({ name: institution.name, shortName: institution.shortName || '' }); }} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">Edit</button><button onClick={() => void toggleInstitution(institution)} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">{institution.isActive ? 'Deactivate' : 'Activate'}</button></div></article>)}
              {!loading && institutions.length === 0 ? <p className="py-4 text-sm text-[var(--text-muted)]">No institutions have been added.</p> : null}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent-sage)]">Step 2</p>
            <h2 className="mt-1 font-serif text-2xl">Campuses</h2>
            <p className="mt-2 text-sm text-[var(--text-muted)]">Campus coordinates are resolved from the full address using OpenStreetMap.</p>
            <form onSubmit={saveCampus} className="mt-4 grid gap-3 border border-[var(--beige)] bg-white p-4 sm:grid-cols-2">
              <label className="grid gap-1 text-xs font-medium">Institution<select required value={campusForm.institutionId} onChange={(event) => setCampusForm((current) => ({ ...current, institutionId: event.target.value }))} className="border border-[var(--beige)] px-3 py-2 text-sm"><option value="">Select an institution</option>{institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}{institution.isActive ? '' : ' (inactive)'}</option>)}</select></label>
              <label className="grid gap-1 text-xs font-medium">Campus name<input required minLength={2} value={campusForm.name} onChange={(event) => setCampusForm((current) => ({ ...current, name: event.target.value }))} className="border border-[var(--beige)] px-3 py-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium">City / region<input required value={campusForm.location} onChange={(event) => setCampusForm((current) => ({ ...current, location: event.target.value }))} className="border border-[var(--beige)] px-3 py-2 text-sm" /></label>
              <label className="grid gap-1 text-xs font-medium sm:col-span-2">Full campus street address<input required minLength={5} value={campusForm.address} onChange={(event) => setCampusForm((current) => ({ ...current, address: event.target.value }))} placeholder="Street, suburb, city, postal code" className="border border-[var(--beige)] px-3 py-2 text-sm" /></label>
              <div className="flex gap-2 sm:col-span-2"><button disabled={saving || institutions.length === 0} className="bg-[var(--charcoal)] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : editingCampusId ? 'Save campus' : 'Add campus'}</button>{editingCampusId ? <button type="button" onClick={() => { setEditingCampusId(''); setCampusForm(emptyCampus); }} className="border border-[var(--beige)] px-3 py-2 text-sm">Cancel</button> : null}</div>
            </form>
            <div className="mt-4 divide-y divide-[var(--beige)]">
              {campuses.map((campus) => <article key={campus.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-semibold">{campus.name} <span className="text-xs font-normal text-[var(--text-muted)]">· {campus.institution?.name || 'Institution not assigned'}</span></p><p className="text-sm text-[var(--text-muted)]">{campus.location} · {campus.address}</p><p className="text-xs text-[var(--text-muted)]">{campus.listingCount ?? 0} approved listings · {campus.isActive ? 'Active' : 'Inactive'}</p></div><div className="flex gap-2"><button onClick={() => { setEditingCampusId(campus.id); setCampusForm({ institutionId: campus.institutionId || '', name: campus.name, location: campus.location, address: campus.address }); }} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">Edit / assign</button><button onClick={() => void toggleCampus(campus)} className="border border-[var(--beige)] px-2.5 py-1.5 text-xs font-semibold">{campus.isActive ? 'Deactivate' : 'Activate'}</button></div></article>)}
              {!loading && campuses.length === 0 ? <p className="py-4 text-sm text-[var(--text-muted)]">No campuses have been added.</p> : null}
            </div>
          </div>
        </section>
      </main>
    </AuthGuard>
  );
}
