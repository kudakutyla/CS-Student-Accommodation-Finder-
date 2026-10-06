'use client';

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, FileText, Paperclip, Search, Send, X } from 'lucide-react';
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
  const [messageLoading, setMessageLoading] = useState(() => Boolean(searchParams.get('conversation')));
  const [search, setSearch] = useState('');
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  async function refreshConversations() {
    const response = await conversationApi.list();
    setConversations(response.data);
    setSelectedId((current) => current && response.data.some((item) => item.id === current)
      ? current
      : response.data[0]?.id || '');
  }

  useEffect(() => {
    let active = true;
    conversationApi.list().then((response) => {
      if (!active) return;
      setConversations(response.data);
      const firstConversationId = searchParams.get('conversation') || response.data[0]?.id || '';
      if (firstConversationId) setMessageLoading(true);
      setSelectedId((current) => current || firstConversationId);
    }).catch((err) => {
      if (!active) return;
      setError(err instanceof Error ? err.message : 'Unable to load conversations.');
      setConversations([]);
    });
    return () => { active = false; };
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    conversationApi.messages(selectedId).then((response) => {
      if (!active) return;
      setMessages(response.data);
      return conversationApi.markRead(selectedId);
    }).catch((err) => {
      if (active) setError(err instanceof Error ? err.message : 'Unable to load this conversation.');
    }).finally(() => {
      if (active) setMessageLoading(false);
    });
    return () => { active = false; };
  }, [selectedId]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const selectedConversation = conversations?.find((conversation) => conversation.id === selectedId) || null;
  const otherParticipant = selectedConversation
    ? user?.id === selectedConversation.studentId ? selectedConversation.landlord : selectedConversation.student
    : null;
  const filteredConversations = (conversations || []).filter((conversation) => {
    const other = user?.id === conversation.studentId ? conversation.landlord : conversation.student;
    const query = search.trim().toLowerCase();
    return !query || other.name.toLowerCase().includes(query) || conversation.listing.title.toLowerCase().includes(query);
  });

  async function downloadAttachment(message: Message) {
    if (!message.attachmentUrl) return;
    setError('');
    try {
      const blob = await fetchMedia(message.attachmentUrl);
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = objectUrl;
      downloadLink.download = message.attachmentName || 'attachment';
      downloadLink.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download attachment.');
    }
  }

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
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      await refreshConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message.');
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthGuard allowedRoles={['STUDENT', 'LANDLORD']}>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-4 border-b border-[var(--beige)] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Enquiries</p>
            <h1 className="mt-1 font-serif text-3xl text-[var(--charcoal)]">Messages</h1>
          </div>
          <span className="text-sm text-[var(--text-muted)]">{conversations?.length ?? 0} conversations</span>
        </div>

        {error ? <p role="alert" className="mb-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">{error}<button onClick={() => { setError(''); void refreshConversations().catch((err) => setError(err instanceof Error ? err.message : 'Unable to reload conversations.')); }} className="ml-3 font-semibold underline">Retry</button></p> : null}

        <div className="grid h-[calc(100dvh-12rem)] min-h-[480px] overflow-hidden border border-[var(--beige)] bg-white shadow-sm md:grid-cols-[300px_minmax(0,1fr)] lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className={`${selectedConversation ? 'hidden md:flex' : 'flex'} min-h-0 flex-col border-r border-[var(--beige)]`}>
            <div className="border-b border-[var(--beige)] p-4">
              <label className="relative block">
                <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <span className="sr-only">Search conversations</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded-full border border-[var(--beige)] bg-[var(--cream)] py-2.5 pl-9 pr-4 text-sm outline-none focus:border-[var(--accent-sage)]" placeholder="Search conversations" />
              </label>
            </div>
            <nav aria-label="Conversations" className="min-h-0 flex-1 overflow-y-auto">
              {conversations === null ? <p role="status" className="p-5 text-sm text-[var(--text-muted)]">Loading conversations...</p> : filteredConversations.length === 0 ? <p className="p-5 text-sm text-[var(--text-muted)]">{search ? 'No matching conversations.' : 'No enquiries yet.'}</p> : filteredConversations.map((conversation) => {
                const other = user?.id === conversation.studentId ? conversation.landlord : conversation.student;
                const preview = conversation.lastMessage?.content || (conversation.lastMessage?.attachmentName ? `Attachment: ${conversation.lastMessage.attachmentName}` : 'Conversation started');
                return (
                  <button key={conversation.id} type="button" onClick={() => { setMessages([]); setMessageLoading(true); setSelectedId(conversation.id); setError(''); }} aria-current={selectedId === conversation.id ? 'true' : undefined} className={`flex w-full items-center gap-3 border-b border-[var(--beige)] px-4 py-3 text-left transition-colors ${selectedId === conversation.id ? 'bg-[var(--cream)]' : 'hover:bg-[var(--warm-white)]'}`}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--beige)] font-semibold text-[var(--charcoal)]">{other.name.slice(0, 1).toUpperCase()}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2"><span className="truncate text-sm font-semibold text-[var(--charcoal)]">{other.name}</span><time className="shrink-0 text-[10px] text-[var(--text-muted)]">{conversation.lastMessage ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</time></span>
                      <span className="mt-0.5 block truncate text-xs font-medium text-[var(--brown-dark)]">{conversation.listing.title}</span>
                      <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{preview}</span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className={`${selectedConversation ? 'flex' : 'hidden md:flex'} min-h-0 min-w-0 flex-col bg-[var(--warm-white)]`}>
            {selectedConversation && otherParticipant ? <>
              <header className="flex items-center gap-3 border-b border-[var(--beige)] bg-white px-4 py-3 sm:px-5">
                <button type="button" aria-label="Back to conversations" onClick={() => setSelectedId('')} className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--charcoal)] hover:bg-[var(--cream)] lg:hidden"><ArrowLeft size={18} aria-hidden="true" /></button>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--beige)] font-semibold text-[var(--charcoal)]">{otherParticipant.name.slice(0, 1).toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--charcoal)]">{otherParticipant.name}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{selectedConversation.listing.title}</p>
                </div>
                <Link href={`/listings/${selectedConversation.listingId}`} className="shrink-0 border border-[var(--beige)] px-3 py-2 text-xs font-semibold text-[var(--charcoal)] hover:bg-[var(--cream)]">View property</Link>
              </header>

              <div aria-live="polite" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
                {messageLoading ? <p role="status" className="py-5 text-center text-sm text-[var(--text-muted)]">Loading messages...</p> : messages.length === 0 ? <p className="mx-auto mt-12 max-w-sm text-center text-sm text-[var(--text-muted)]">This enquiry is ready. Send a message to start the conversation.</p> : <div className="space-y-3">{messages.map((message) => {
                  const mine = message.senderId === user?.id;
                  return <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <article className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[72%] ${mine ? 'rounded-br-sm bg-[#dcefe3] text-[var(--charcoal)]' : 'rounded-bl-sm border border-[var(--beige)] bg-white text-[var(--charcoal)]'}`}>
                      {message.content ? <p className="whitespace-pre-wrap break-words text-sm leading-5">{message.content}</p> : null}
                      {message.attachmentUrl ? <button type="button" onClick={() => void downloadAttachment(message)} className="mt-2 flex max-w-full items-center gap-2 rounded-lg border border-[var(--beige)] bg-white/70 px-3 py-2 text-left hover:bg-white"><FileText size={18} aria-hidden="true" className="shrink-0 text-[var(--accent-sage)]" /><span className="min-w-0"><span className="block truncate text-xs font-semibold">{message.attachmentName || 'Download attachment'}</span><span className="block text-[10px] uppercase text-[var(--text-muted)]">{message.attachmentType || 'FILE'}</span></span></button> : null}
                      <time className="mt-1 block text-right text-[10px] text-[var(--text-muted)]">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                    </article>
                  </div>;
                })}</div>}
                <div ref={messageEndRef} />
              </div>

              <form onSubmit={send} className="border-t border-[var(--beige)] bg-white p-3 sm:px-5 sm:py-4">
                {attachment ? <div className="mb-2 flex items-center justify-between gap-3 border border-[var(--beige)] bg-[var(--cream)] px-3 py-2"><span className="flex min-w-0 items-center gap-2 text-xs"><FileText size={16} aria-hidden="true" className="shrink-0" /><span className="truncate">{attachment.name}</span></span><button type="button" aria-label="Remove attachment" onClick={() => { setAttachment(null); if (attachmentInputRef.current) attachmentInputRef.current.value = ''; }} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full hover:bg-white"><X size={16} aria-hidden="true" /></button></div> : null}
                <div className="flex items-end gap-2">
                  <label className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--cream)] hover:text-[var(--charcoal)]" title="Attach image or PDF">
                    <Paperclip size={19} aria-hidden="true" />
                    <span className="sr-only">Attach image or PDF</span>
                    <input ref={attachmentInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className="sr-only" />
                  </label>
                  <label className="sr-only" htmlFor="message-content">Write a message</label>
                  <textarea id="message-content" maxLength={4000} rows={1} value={content} onChange={(event) => setContent(event.target.value)} className="max-h-32 min-h-11 min-w-0 flex-1 resize-y rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm outline-none focus:border-[var(--accent-sage)]" placeholder="Write a message" />
                  <button type="submit" aria-label="Send message" disabled={sending || (!content.trim() && !attachment)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--charcoal)] text-white hover:bg-[var(--charcoal-mid)] disabled:cursor-not-allowed disabled:opacity-50">{sending ? <span className="text-xs">...</span> : <Send size={17} aria-hidden="true" />}</button>
                </div>
                <p className="mt-2 pl-1 text-[10px] text-[var(--text-muted)]">Images or PDF, up to 10 MB</p>
              </form>
            </> : <div className="m-auto hidden max-w-sm px-8 text-center md:block"><p className="font-serif text-2xl text-[var(--charcoal)]">Select a conversation</p><p className="mt-2 text-sm text-[var(--text-muted)]">Your messages with students and landlords will appear here.</p></div>}
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
