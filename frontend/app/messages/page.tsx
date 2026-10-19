'use client';

import { FormEvent, Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, MessageCircle, Paperclip, Send } from 'lucide-react';
import { AuthGuard } from '../../components/auth-guard';
import { useAuth } from '../../lib/auth-context';
import { conversationApi, fetchMedia } from '../../lib/api';
import type { Conversation, Message } from '../../types';

export default function MessagesPage() {
  return (
    <Suspense fallback={<p className="px-4 py-12 text-sm text-[var(--text-muted)]">Loading messages...</p>}>
      <MessagesContent />
    </Suspense>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[] | null>(null);
  const [selectedId, setSelectedId] = useState(searchParams.get('conversation') || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const loading = conversations === null;

  async function loadConversations() {
    const response = await conversationApi.list();
    setConversations(response.data);
  }

  useEffect(() => {
    let active = true;
    conversationApi.list().then((response) => {
      if (active) setConversations(response.data);
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
    conversationApi.messages(selectedId).then(async (response) => {
      if (!active) return;
      setMessages(response.data);
      await conversationApi.markRead(selectedId);
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
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
      await loadConversations();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send your message.');
    } finally {
      setSending(false);
    }
  }

  function selectConversation(id: string) {
    setMessages([]);
    setContent('');
    setAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    setSelectedId(id);
    router.replace(`/messages?conversation=${encodeURIComponent(id)}`, { scroll: false });
  }

  function returnToInbox() {
    setSelectedId('');
    setMessages([]);
    setAttachment(null);
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    router.replace('/messages', { scroll: false });
  }

  async function downloadAttachment(message: Message) {
    if (!message.attachmentUrl) return;
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

  const activeConversation = conversations?.find((conversation) => conversation.id === selectedId);
  const otherParticipant = activeConversation
    ? user?.id === activeConversation.studentId ? activeConversation.landlord : activeConversation.student
    : null;

  return (
    <AuthGuard allowedRoles={['STUDENT', 'LANDLORD']}>
      <main className="mx-auto flex min-h-[calc(100dvh-8rem)] w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="shrink-0 pb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--accent-sage)]">Enquiries</p>
          <h1 className="mt-2 font-serif text-4xl text-[var(--charcoal)]">Messages</h1>
        </div>
        {error ? (
          <p role="alert" className="mt-4 border-l-4 border-red-600 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
            <button type="button" onClick={() => { setError(''); void loadConversations().catch((err) => setError(err instanceof Error ? err.message : 'Unable to load conversations.')); }} className="ml-3 font-semibold underline">Retry</button>
          </p>
        ) : null}

        <div className="mt-4 flex min-h-[34rem] flex-1 overflow-hidden rounded-2xl border border-[var(--beige)] bg-[var(--warm-white)] shadow-sm">
          <nav
            aria-label="Conversations"
            className={`w-full shrink-0 overflow-y-auto md:w-80 md:border-r md:border-[var(--beige)] ${selectedId ? 'hidden md:block' : 'block'}`}
          >
            <div className="border-b border-[var(--beige)] px-4 py-4">
              <h2 className="font-semibold text-[var(--charcoal)]">Chats</h2>
            </div>
            {loading ? <p role="status" className="p-4 text-sm text-[var(--text-muted)]">Loading inbox...</p> : conversations.length === 0 ? (
              <p className="p-4 text-sm text-[var(--text-muted)]">No enquiries yet.</p>
            ) : conversations.map((conversation) => {
              const other = user?.id === conversation.studentId ? conversation.landlord : conversation.student;
              return (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => selectConversation(conversation.id)}
                  aria-current={selectedId === conversation.id ? 'true' : undefined}
                  className={`flex w-full items-center gap-3 border-b border-[var(--beige)] px-4 py-4 text-left transition-colors ${selectedId === conversation.id ? 'bg-[var(--cream)]' : 'hover:bg-[var(--cream)]'}`}
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-sage)]/20 text-sm font-semibold text-[var(--charcoal)]">
                    {other.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-[var(--charcoal)]">{other.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-[var(--text-muted)]">{conversation.listing.title}</span>
                    <span className="mt-1 block truncate text-xs text-[var(--text-muted)]">{conversation.lastMessage?.content || 'Enquiry started'}</span>
                  </span>
                  {conversation.lastMessage ? <time className="self-start text-[10px] text-[var(--text-muted)]">{new Date(conversation.lastMessage.createdAt).toLocaleDateString()}</time> : null}
                </button>
              );
            })}
          </nav>

          <section className={`min-w-0 flex-1 flex-col ${selectedId ? 'flex' : 'hidden md:flex'}`} aria-label="Active conversation">
            {selectedId ? (
              <>
                <header className="flex shrink-0 items-center gap-3 border-b border-[var(--beige)] px-3 py-3 sm:px-5">
                  <button type="button" onClick={returnToInbox} aria-label="Back to conversations" className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-[var(--cream)] md:hidden">
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-sage)]/20 text-sm font-semibold text-[var(--charcoal)]">
                    {otherParticipant?.name.slice(0, 1).toUpperCase() || <MessageCircle size={17} aria-hidden="true" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--charcoal)]">{otherParticipant?.name || 'Conversation'}</p>
                    {activeConversation ? <p className="truncate text-xs text-[var(--text-muted)]">{activeConversation.listing.title}</p> : null}
                  </div>
                </header>

                {activeConversation ? (
                  <Link href={`/listings/${activeConversation.listingId}`} className="shrink-0 border-b border-[var(--beige)] bg-[var(--cream)] px-4 py-2 text-xs font-medium text-[var(--brown-dark)] underline-offset-2 hover:underline sm:px-5">
                    View accommodation
                  </Link>
                ) : null}

                <div aria-live="polite" className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-[var(--cream)] p-4 sm:p-6">
                  {messages.length === 0 ? <p className="m-auto rounded-xl bg-[var(--warm-white)] px-4 py-3 text-center text-sm text-[var(--text-muted)]">Start the conversation by sending a message.</p> : messages.map((message) => (
                    <div key={message.id} className={`flex max-w-[85%] flex-col ${message.senderId === user?.id ? 'self-end' : 'self-start'}`}>
                      {message.content ? (
                        <p className={`whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm shadow-sm ${message.senderId === user?.id ? 'rounded-br-sm bg-emerald-800 text-white' : 'rounded-bl-sm bg-white text-[var(--charcoal)]'}`}>
                          {message.content}
                        </p>
                      ) : null}
                      {message.attachmentUrl ? (
                        <button type="button" onClick={() => void downloadAttachment(message)} className="mt-2 inline-flex max-w-full items-center gap-2 rounded-xl border border-[var(--beige)] bg-[var(--warm-white)] px-3 py-2 text-left text-sm text-[var(--charcoal)]">
                          <Paperclip size={15} aria-hidden="true" />
                          <span className="truncate">{message.attachmentName || 'Download attachment'}</span>
                          <span className="rounded bg-[var(--cream)] px-1.5 py-0.5 text-[10px] uppercase tracking-[0.08em]">{message.attachmentType || 'FILE'}</span>
                        </button>
                      ) : null}
                      <time className={`mt-1 block text-[10px] text-[var(--text-muted)] ${message.senderId === user?.id ? 'text-right' : 'text-left'}`}>
                        {new Date(message.createdAt).toLocaleString()}
                      </time>
                    </div>
                  ))}
                </div>

                <form onSubmit={send} className="shrink-0 border-t border-[var(--beige)] bg-[var(--warm-white)] p-3 sm:p-4">
                  <div className="flex items-end gap-2">
                    <label htmlFor="message-content" className="sr-only">Write a message</label>
                    <textarea
                      id="message-content"
                      maxLength={4000}
                      rows={2}
                      value={content}
                      onChange={(event) => setContent(event.target.value)}
                      className="min-h-11 min-w-0 flex-1 resize-y rounded-2xl border border-[var(--beige)] bg-[var(--cream)] px-4 py-3 text-sm text-[var(--charcoal)] outline-none focus:border-[var(--accent-sage)]"
                      placeholder="Write a message"
                    />
                    <button type="submit" disabled={sending || (!content.trim() && !attachment)} aria-label={sending ? 'Sending message' : 'Send message'} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-white transition hover:bg-emerald-900 disabled:opacity-50">
                      <Send size={17} aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <label htmlFor="message-attachment" className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-[var(--brown-dark)] hover:underline">
                      <Paperclip size={14} aria-hidden="true" />
                      Attach image or PDF
                    </label>
                    <input ref={attachmentInputRef} id="message-attachment" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setAttachment(event.target.files?.[0] || null)} className="sr-only" />
                    {attachment ? (
                      <span className="flex min-w-0 items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="max-w-48 truncate">{attachment.name}</span>
                        <button type="button" onClick={() => { setAttachment(null); if (attachmentInputRef.current) attachmentInputRef.current.value = ''; }} className="font-semibold text-[var(--danger)] underline">Remove</button>
                      </span>
                    ) : <span className="text-xs text-[var(--text-muted)]">Up to 10 MB</span>}
                  </div>
                </form>
              </>
            ) : <p className="m-auto p-6 text-sm text-[var(--text-muted)]">Choose an enquiry to read messages.</p>}
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
