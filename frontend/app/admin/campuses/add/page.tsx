'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { AuthGuard } from '../../../../components/auth-guard';
import { campusApi } from '../../../../lib/api';
import type { CampusAddressSuggestion, Institution } from '../../../../types';

export default function AddCampusPage() {
  return (
    <Suspense fallback={<p role="status" className="mx-auto max-w-3xl px-4 py-12 text-sm text-[var(--text-muted)]">Loading campus form...</p>}>
      <AddCampusPageContent />
    </Suspense>
  );
}

function AddCampusPageContent() {
  const searchParams = useSearchParams();
  const institutionId = searchParams.get('institutionId') || '';
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState(institutionId);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [address, setAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<CampusAddressSuggestion[]>([]);
  const [searchingAddresses, setSearchingAddresses] = useState(false);
  const [addressSearchMessage, setAddressSearchMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    campusApi.getInstitutions().then((response) => {
      if (active) setInstitutions(response.data);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load institutions.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  async function searchAddresses() {
    if (address.trim().length < 3 || location.trim().length < 2) {
      setAddressSuggestions([]);
      setAddressSearchMessage('Enter part of the address and its city or region before searching.');
      return;
    }
    setSearchingAddresses(true);
    setAddressSuggestions([]);
    setAddressSearchMessage('');
    try {
      const response = await campusApi.getCampusAddressSuggestions(
        address.trim(),
        location.trim(),
        name.trim()
      );
      setAddressSuggestions(response.data);
      if (response.data.length === 0) {
        setAddressSearchMessage('No matching address was found. Try adding a suburb, city, or campus name.');
      }
    } catch (err) {
      setAddressSearchMessage(err instanceof Error ? err.message : 'Unable to search for this address.');
    } finally {
      setSearchingAddresses(false);
    }
  }

  async function saveCampus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await campusApi.createCampus({
        institutionId: selectedInstitutionId,
        name: name.trim(),
        location: location.trim(),
        address: address.trim(),
      });
      setName('');
      setLocation('');
      setAddress('');
      const institutionName = institutions.find((institution) => institution.id === selectedInstitutionId)?.name;
      setNotice(response.message || `Campus created successfully${institutionName ? ` for ${institutionName}` : ''}. You can add another campus to this institution.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create campus.');
    } finally {
      setSaving(false);
    }
  }

  const selectedInstitutionExists = institutions.some((institution) => institution.id === selectedInstitutionId);
  const selectedInstitution = institutions.find((institution) => institution.id === selectedInstitutionId);

  return (
    <AuthGuard allowedRoles={['ADMIN']}>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/admin/dashboard" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brown-dark)] hover:underline">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to dashboard
        </Link>

        <header className="border-b border-[var(--beige)] pb-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Geographic catalog</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Add campus</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            {selectedInstitution ? `Add a campus to ${selectedInstitution.name}. You can add multiple campuses to one institution.` : 'Choose an institution, then add one or more campuses to it.'}
          </p>
        </header>

        {error ? <p role="alert" className="mt-5 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p> : null}
        {notice ? <p role="status" className="mt-5 border-l-4 border-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{notice}</p> : null}
        {!loading && institutionId && !selectedInstitutionExists ? <p role="alert" className="mt-5 border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-sm text-amber-900">The selected institution could not be found. Choose an institution below or return to institution management.</p> : null}
        {!loading && !institutionId ? <p role="status" className="mt-5 text-sm text-[var(--text-muted)]">Choose an institution to continue, or return to institution management.</p> : null}

        <form onSubmit={saveCampus} className="mt-6 grid gap-4 border border-[var(--beige)] bg-white p-5 sm:grid-cols-2">
          <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
            Institution
            <select required disabled={loading} value={selectedInstitutionId} onChange={(event) => setSelectedInstitutionId(event.target.value)} className="border border-[var(--beige)] px-3 py-2.5 text-sm font-normal">
              <option value="">Select an institution</option>
              {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
            Campus name
            <input required minLength={2} value={name} onChange={(event) => setName(event.target.value)} className="border border-[var(--beige)] px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="grid gap-1 text-xs font-semibold">
            City / region
            <input required value={location} onChange={(event) => setLocation(event.target.value)} className="border border-[var(--beige)] px-3 py-2.5 text-sm font-normal" />
          </label>
          <label className="grid gap-1 text-xs font-semibold sm:col-span-2">
            Full campus street address
            <input required minLength={5} value={address} onChange={(event) => { setAddress(event.target.value); setAddressSuggestions([]); setAddressSearchMessage(''); }} placeholder="Street or campus name, suburb, city" className="border border-[var(--beige)] px-3 py-2.5 text-sm font-normal" />
          </label>
          <div className="sm:col-span-2">
            <button type="button" onClick={() => void searchAddresses()} disabled={searchingAddresses || loading} className="border border-[var(--beige)] px-3 py-2 text-sm font-semibold disabled:opacity-50">
              {searchingAddresses ? 'Searching addresses...' : 'Find matching addresses'}
            </button>
            <p className="mt-2 text-xs text-[var(--text-muted)]">Enter a street, suburb, or campus name and the city/region, then choose a matching OpenStreetMap address.</p>
            {addressSearchMessage ? <p role="status" className="mt-2 text-sm text-[var(--text-muted)]">{addressSearchMessage}</p> : null}
            {addressSuggestions.length > 0 ? (
              <ul className="mt-2 divide-y divide-[var(--beige)] border border-[var(--beige)]">
                {addressSuggestions.map((suggestion, index) => (
                  <li key={`${suggestion.address}-${index}`}>
                    <button type="button" onClick={() => { setAddress(suggestion.address); setAddressSuggestions([]); setAddressSearchMessage('Address selected.'); }} className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--cream)]">
                      {suggestion.address}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-3 sm:col-span-2">
            <button disabled={saving || loading || !selectedInstitutionExists} className="bg-[var(--charcoal)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Add campus'}</button>
            <Link href="/admin/campuses" className="border border-[var(--beige)] px-4 py-2.5 text-sm font-semibold">Back to institution management</Link>
          </div>
        </form>
      </main>
    </AuthGuard>
  );
}
