import { useState } from 'react';

export default function SubscribeInline({ source }: { source?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle'|'loading'|'ok'|'error'>('idle');
  const [msg, setMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    setMsg('');
    try {
      const res = await fetch('/api/subscribe.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: source || 'blogs' }),
      });
      const data = await res.json();
      if (data && data.ok) {
        // Best-effort ensure subscriber is stored
        try {
          await fetch('/api/subscribers.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, source: source || 'blogs' }),
          });
        } catch {}
        setStatus('ok');
        setEmail('');
        setMsg('Thanks! We have your email.');
      } else {
        setStatus('error');
        setMsg(data?.error || 'Something went wrong');
      }
    } catch {
      setStatus('error');
      setMsg('Network error');
    }
  };

  return (
    <div className="mt-8 p-4 rounded-xl border border-neutral-200 bg-white">
      <div className="text-sm font-semibold text-neutral-700">Subscribe to updates</div>
      <form onSubmit={submit} className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
          placeholder="you@example.com"
          className="flex-1 rounded-full border px-4 py-2 text-sm text-black"
        />
        <button
          type="submit"
          disabled={status==='loading'}
          className="rounded-full bg-amber-600 text-white px-5 py-2 text-sm font-semibold hover:bg-amber-500 disabled:opacity-50"
        >Subscribe</button>
      </form>
      {msg && <div className="mt-2 text-xs text-neutral-600">{msg}</div>}
    </div>
  );
}
