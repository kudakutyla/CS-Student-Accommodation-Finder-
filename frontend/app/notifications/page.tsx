'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '../../components/auth-guard';
import { notificationApi } from '../../lib/api';
import type { AppNotification } from '../../types';

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [error, setError] = useState('');
  const loading = items === null;

  async function load() {
    try {
      const response = await notificationApi.list();
      setItems(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
      setItems([]);
    }
  }

  useEffect(() => {
    let active = true;
    notificationApi.list().then((response) => {
      if (active) setItems(response.data);
    }).catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : 'Unable to load notifications.');
      setItems([]);
    });
    return () => { active = false; };
  }, []);

  async function markRead(id: string) {
    setError('');
    try {
      const response = await notificationApi.markRead(id);
      setItems((current) => (current ?? []).map((item) => item.id === id ? response.data : item));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this notification.');
    }
  }

  return <AuthGuard><main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><div className="border-b border-[var(--beige)] pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Account updates</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Notifications</h1></div>{error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => { setError(''); void load(); }} className="ml-3 font-semibold underline">Retry</button></p> : null}{loading ? <p role="status" className="py-10 text-sm text-[var(--text-muted)]">Loading notifications...</p> : items.length === 0 ? <p className="py-10 text-sm text-[var(--text-muted)]">You are all caught up.</p> : <div className="divide-y divide-[var(--beige)]">{items.map((item) => <article key={item.id} className={`flex flex-wrap items-start justify-between gap-4 py-5 ${item.isRead ? '' : 'bg-[var(--warm-white)]'}`}><div><p className="font-semibold text-[var(--charcoal)]">{item.title}{!item.isRead ? <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[var(--accent-terracotta)]" aria-label="Unread" /> : null}</p><p className="mt-1 whitespace-pre-wrap text-sm text-[var(--text-muted)]">{item.message}</p><time className="mt-2 block text-xs text-[var(--text-muted)]">{new Date(item.createdAt).toLocaleString()}</time></div>{!item.isRead ? <button onClick={() => void markRead(item.id)} className="text-sm font-semibold text-[var(--brown-dark)] underline">Mark read</button> : null}</article>)}</div>}</main></AuthGuard>;
}