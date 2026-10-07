'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AuthGuard } from '../../components/auth-guard';
import { useAuth } from '../../lib/auth-context';
import { conversationApi, fetchMedia } from '../../lib/api';
import type { Conversation, Message } from '../../types';

export default function MessagesPage() {
  return <Suspense fallback={<p className="mx-auto max-w-6xl px-4 py-12 text-sm text-[var(--text-muted)]">Loading messages...</p>}><MessagesContent /></Suspense>;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selectedId, setSelectedId] = useState(searchParams.get('conversation') || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const loading = conversations === null;

  async function loadConversations() {
    const response = await conversationApi.list();
    setConversations(response.data);
    if (!selectedId && response.data[0]) setSelectedId(response.data[0].id);
  }

  useEffect(() => {
    let active = true;
    conversationApi.list().then((response) => {
      if (!active) return;
      setConversations(response.data);
      if (response.data[0]) setSelectedId((current) => current || response.data[0].id);
    }).catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : 'Unable to load conversations.');
      setConversations([]);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    conversationApi.messages(selectedId).then((response) => {
      if (active) setMessages(response.data);
      return conversationApi.markRead(selectedId);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load this conversation.');
    });
    return () => { active = false; };
  }, [selectedId]);

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId || (!content.trim() && !attachment)) return;
    setSending(true);
    setError('');
    try {
      const response = await conversationApi.send(selectedId, content.trim(), attachment || undefined);
      setMessages((current) => [...current, response.data]);
      setContent('');
      setAttachment(null);
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthGuard allowedRoles={['STUDENT', 'LANDLORD']}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="border-b border-[var(--beige)] pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Enquiries</p><h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Messages</h1></div>
        {error ? <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => { setError(''); void loadConversations().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load conversations.')); }} className="ml-3 font-semibold underline">Retry</button></p> : null}
        <div className="mt-6 grid min-h-[60vh] border border-[var(--beige)] md:grid-cols-[280px_1fr]">
          <nav aria-label="Conversations" className="divide-y divide-[var(--beige)] border-b border-[var(--beige)] md:border-b-0 md:border-r">
            {loading ? <p className="p-4 text-sm text-[var(--text-muted)]">Loading inbox...</p> : conversations.length === 0 ? <p className="p-4 text-sm text-[var(--text-muted)]">No enquiries yet.</p> : conversations.map((conversation) => {
              const other = user?.id === conversation.studentId ? conversation.landlord : conversation.student;
              return <button key={conversation.id} type="button" onClick={() => { setMessages([]); setSelectedId(conversation.id); }} aria-current={selectedId === conversation.id ? 'true' : undefined} className={`block w-full border-l-2 p-4 text-left ${selectedId === conversation.id ? 'border-[var(--accent-terracotta)] bg-[var(--cream)]' : 'border-transparent hover:bg-[var(--warm-white)]'}`}><span className="block text-sm font-semibold text-[var(--charcoal)]">{other.name}</span><span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{conversation.listing.title}</span><span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{conversation.lastMessage?.content ?? 'Enquiry started'}</span></button>;
            })}
          </nav>
          <section className="flex min-h-[60vh] flex-col">
            {selectedId ? <>
              <div className="border-b border-[var(--beige)] p-4"><p className="font-semibold text-[var(--charcoal)]">{(conversations ?? []).find((item) => item.id === selectedId)?.listing.title ?? 'Conversation'}</p></div>
              <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto p-4">
                {messages.map((message) => (
                  <div key={message.id} className={`max-w-[85%] ${message.senderId === user?.id ? 'ml-auto' : ''}`}>
                    {message.content ? <p className={`whitespace-pre-wrap px-3 py-2 text-sm ${message.senderId === user?.id ? 'bg-[var(--charcoal)] text-white' : 'bg-[var(--cream)] text-[var(--charcoal)]'}`}>{message.content}</p> : null}
                    {message.attachmentUrl ? (
                      <a href="#attachment" onClick={async (event) => { event.preventDefault(); try { const blob = await fetchMedia(message.attachmentUrl!); const objectUrl = URL.createObjectURL(blob); const downloadLink = document.createElement('a'); downloadLink.href = objectUrl; downloadLink.download = message.attachmentName || 'attachment'; downloadLink.click(); URL.revokeObjectURL(objectUrl); } catch (err) { setError(err instanceof Error ? err.message : 'Unable to download attachment.'); } }} className={`mt-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-[var(--beige)] bg-white px-3 py-2 text-sm ${message.senderId === user?.id ? 'text-white' : 'text-[var(--charcoal)]'}`}>
                        <span className="truncate">{message.attachmentName || 'Download attachment'}</span>
                        <span className="rounded bg-[var(--cream)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em]">{message.attachmentType || 'FILE'}</span>
                      </a>
                    ) : null}
                    <time className="mt-1 block text-[10px] opacity-70">{new Date(message.createdAt).toLocaleString()}</time>
                  </div>
                ))}
              </div>
              <form onSubmit={send} className="space-y-2 border-t border-[var(--beige)] p-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_220px]">
                  <label className="sr-only" htmlFor="message-content">Write a message</label>
                  <textarea id="message-content" maxLength={4000} value={content} onChange={(event) => setContent(event.target.value)} className="min-h-11 resize-y border border-[var(--beige)] p-3 text-sm" placeholder="Write a message" />
                  <div className="space-y-2">
                    <label className="sr-only" htmlFor="message-attachment">Attach an image or PDF</label>
                    <input id="message-attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className="w-full border border-[var(--beige)] p-2 text-xs" />
                    {attachment ? <div className="flex items-center justify-between gap-2 text-xs"><span className="truncate">{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} className="shrink-0 font-semibold text-red-700">Remove</button></div> : <p className="text-xs text-[var(--text-muted)]">Image or PDF, up to 10 MB</p>}
                  </div>
                </div>
                <button disabled={sending || (!content.trim() && !attachment)} className="w-full bg-[var(--charcoal)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{sending ? 'Sending...' : 'Send'}</button>
              </form>
            </> : <p className="m-auto p-6 text-sm text-[var(--text-muted)]">Choose an enquiry to read messages.</p>}
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}