import { useEffect, useMemo, useState } from 'react';
import Footer from '../../components/Footer';

type ReactionsDB = Record<string, Record<string, number>>; // slug -> reaction -> count
type PollsDB = Record<string, { question: string; options: Record<string, number> }>;
type Subscriber = { email: string; status?: string; source?: string; created_at?: string };

export default function AdminEngagement() {
  const [key, setKey] = useState('');
  const [reactions, setReactions] = useState<ReactionsDB>({});
  const [polls, setPolls] = useState<PollsDB>({});
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');

  const [createId, setCreateId] = useState('');
  const [createQ, setCreateQ] = useState('What do you think?');
  const [createOpts, setCreateOpts] = useState('Yes,No');
  const fill5StepTemplate = () => {
    const feelings = ["Inspired me","Learned something","Will share it","Prayed"];
    const opts: string[] = [];
    for (const f of feelings) for (let n=1;n<=5;n++) opts.push(`${f}:${n}`);
    setCreateOpts(opts.join(','));
  };

  const slugsSorted = useMemo(() => {
    return Object.keys(reactions).sort((a, b) => total(reactions[b]) - total(reactions[a]));
  }, [reactions]);

  const loadAll = async () => {
    if (!key) { setStatus('Enter admin key'); return; }
    setLoading(true); setStatus('');
    try {
      const [rRes, pRes, sRes] = await Promise.all([
        fetch('/api/reactions.php?mode=all', { headers: { 'X-Admin-Key': key } }),
        fetch('/api/polls.php?mode=all', { headers: { 'X-Admin-Key': key } }),
        fetch('/api/subscribers.php?mode=list', { headers: { 'X-Admin-Key': key } }),
      ]);
      const rData = await rRes.json();
      const pData = await pRes.json();
      const sData = await sRes.json();
      if (!rData.ok) throw new Error(rData.error || 'Reactions load failed');
      if (!pData.ok) throw new Error(pData.error || 'Polls load failed');
      if (!sData.ok) throw new Error(sData.error || 'Subscribers load failed');
      setReactions((rData.slugs || {}) as ReactionsDB);
      setPolls((pData.polls || {}) as PollsDB);
      setSubs((sData.items || []) as Subscriber[]);
    } catch (e: any) {
      setStatus(e.message || 'Load failed');
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async () => {
    if (!key) { setStatus('Enter admin key'); return; }
    const id = createId.trim(); if (!id) { setStatus('Poll id required'); return; }
    const options = createOpts.split(',').map((s) => s.trim()).filter(Boolean);
    setLoading(true); setStatus('');
    try {
      const res = await fetch('/api/polls.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
        body: JSON.stringify({ id, question: createQ, initialOptions: options, option: options[0] || 'A' }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Create failed');
      setStatus('Poll created or ensured.');
      await loadAll();
    } catch (e: any) {
      setStatus(e.message || 'Create failed');
      setLoading(false);
    }
  };

  useEffect(() => { /* no auto-load */ }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl font-bold">Engagement Admin</h1>
          <p className="mt-1 text-sm text-neutral-700">View reactions and polls. Uses `/api/reactions.php` and `/api/polls.php` with admin key.</p>

          <div className="mt-4 rounded-xl border border-neutral-200 p-4 bg-white">
            <label className="block text-sm font-medium">Admin Key</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="mt-1 w-full border rounded-lg px-3 py-2 text-black"
              placeholder="Enter server admin key"
            />
            <div className="mt-3 flex gap-2">
              <button onClick={loadAll} disabled={loading || !key} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">{loading ? 'Loading…' : 'Load Data'}</button>
            </div>
            {status && <p className="mt-2 text-sm text-red-700">{status}</p>}
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Reactions</h2>
              {!slugsSorted.length ? (
                <p className="mt-2 text-sm text-neutral-600">No reaction data yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {slugsSorted.map((slug) => (
                    <div key={slug} className="border rounded-lg p-3">
                      <div className="text-sm font-semibold">{slug} <span className="text-xs text-neutral-500">total {total(reactions[slug])}</span></div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {Object.entries(reactions[slug]).map(([k, v]) => (
                          <span key={k} className="rounded-full border px-2 py-1">{k}: {v}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Polls</h2>
              {Object.keys(polls).length === 0 ? (
                <p className="mt-2 text-sm text-neutral-600">No polls yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {Object.entries(polls).map(([id, p]) => (
                    <div key={id} className="border rounded-lg p-3">
                      <div className="text-sm font-semibold">{id}</div>
                      <div className="text-sm text-neutral-700">{p.question}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {Object.entries(p.options).map(([opt, cnt]) => (
                          <span key={opt} className="rounded-full border px-2 py-1">{opt}: {cnt}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 border-t pt-4">
                <div className="text-sm font-semibold">Create/Ensure Poll</div>
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <input value={createId} onChange={(e)=>setCreateId(e.target.value)} placeholder="poll id (e.g., blog-my-slug-feedback)" className="border rounded px-3 py-2 text-black" />
                  <input value={createQ} onChange={(e)=>setCreateQ(e.target.value)} placeholder="Question" className="border rounded px-3 py-2 text-black" />
                  <div className="flex gap-2">
                    <input value={createOpts} onChange={(e)=>setCreateOpts(e.target.value)} placeholder="Options (comma separated)" className="flex-1 border rounded px-3 py-2 text-black" />
                    <button type="button" onClick={fill5StepTemplate} className="rounded-full border px-3 text-sm">5-step template</button>
                  </div>
                  <div>
                    <button onClick={createPoll} disabled={loading || !key} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">{loading ? 'Working…' : 'Create/Ensure'}</button>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-neutral-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Subscribers</h2>
              <div className="mt-1 text-sm text-neutral-700">Total active: {subs.filter(s=> (s.status||'active').toLowerCase()==='active').length} / All: {subs.length}</div>
              {subs.length===0 ? (
                <p className="mt-2 text-sm text-neutral-600">No subscribers yet.</p>
              ) : (
                <div className="mt-3 space-y-1 max-h-64 overflow-auto">
                  {subs.slice(0,100).map((s)=> (
                    <div key={s.email} className="text-sm">
                      <span className="font-mono">{s.email}</span>
                      <span className="text-neutral-500"> — {(s.status||'active')}</span>
                      {s.source && <span className="text-neutral-500"> • {s.source}</span>}
                      {s.created_at && <span className="text-neutral-500"> • {new Date(s.created_at).toLocaleDateString()}</span>}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
      <Footer variant="neutral" />
    </div>
  );

  function total(obj: Record<string, number>) {
    return Object.values(obj || {}).reduce((a, b) => a + b, 0);
  }
}
