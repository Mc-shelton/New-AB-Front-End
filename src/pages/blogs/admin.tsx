import { useEffect, useMemo, useState } from 'react';
import Footer from '../../components/Footer';

type BlogItem = {
  title: string;
  summary: string;
  url: string;
  author?: string;
  date?: string;
  tags?: string[];
  slug: string;
  contentHtml?: string;
  _tagsDraft?: string; // local-only editing buffer for comma-separated tags
  image?: string;
};

export default function BlogsAdmin() {
  const [items, setItems] = useState<BlogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [status, setStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null);

  useEffect(() => {
    fetch('/api/blogs.php', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        title: 'New Title',
        summary: 'Short summary...',
        url: 'https://www.linkedin.com/',
        author: '',
        date: new Date().getFullYear().toString(),
        tags: [],
        slug: `post-${Date.now()}`,
        contentHtml: '',
      },
    ]);
  };

  const save = async () => {
    setSaving(true); setStatus(null);
    try {
      const clean = items.map(({ _tagsDraft, ...rest }) => ({
        ...rest,
        tags: parseTags(_tagsDraft ?? (rest.tags || []).join(', ')),
      }));
      const res = await fetch('/api/blogs.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
        body: JSON.stringify({ items: clean }),
      });
      if (res.ok) setStatus({ type: 'ok', text: 'Saved successfully' });
      else {
        const t = await res.text();
        setStatus({ type: 'error', text: `Save failed: ${t}` });
      }
    } catch (e: any) {
      setStatus({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const generateShares = async () => {
    setGenLoading(true); setStatus(null);
    try {
      const res = await fetch('/api/generate_blog_share.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
        body: '{}',
      });
      const t = await res.text();
      if (res.ok) setStatus({ type: 'ok', text: `Share pages generated: ${t}` });
      else setStatus({ type: 'error', text: `Generate failed: ${t}` });
    } catch (e: any) {
      setStatus({ type: 'error', text: e.message });
    } finally {
      setGenLoading(false);
    }
  };

  const remove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const notify = async (slug: string) => {
    setStatus(null);
    try {
      const res = await fetch('/api/notify_new_blog.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
        body: JSON.stringify({ slug }),
      });
      const text = await res.text();
      if (!res.ok) throw new Error(text || 'Notify failed');
      setStatus({ type: 'ok', text: `Notified subscribers: ${text}` });
    } catch (e: any) {
      setStatus({ type: 'error', text: e.message || 'Notify failed' });
    }
  };

  const canSave = useMemo(() => key.trim().length > 0 && items.length >= 0, [key, items]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl font-bold">Blogs Admin</h1>
          <p className="mt-1 text-sm text-neutral-700">Add or edit blog links and optional on-site content. Changes save to `/data/blogs.json` on the server.</p>

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
              <button onClick={addItem} className="rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-500">Add Post</button>
              <button onClick={save} disabled={!canSave || saving} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">{saving ? 'Saving…' : 'Save Changes'}</button>
              <button onClick={generateShares} disabled={!key || genLoading} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">{genLoading ? 'Generating…' : 'Generate Social Share Files'}</button>
              <a href="/admin/activity" className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50">View Activity</a>
              <a href="/admin/badge-orders" className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50">Badge Orders</a>
              <a href="/merchandise/admin" className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50">Merch Admin</a>
            </div>
            {status && (
              <p className={`mt-2 text-sm ${status.type === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{status.text}</p>
            )}
          </div>

          {loading ? (
            <p className="mt-6 text-sm">Loading…</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
              {items.map((b, idx) => (
                <div key={b.slug} className="rounded-2xl border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Post {idx + 1}</h3>
                    <div className="flex gap-3">
                      <button onClick={() => notify(b.slug)} disabled={!key} className="text-sm underline">Notify Subscribers</button>
                      <button onClick={() => remove(idx)} className="text-sm underline">Remove</button>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium">Title</label>
                      <input value={b.title} onChange={(e)=>update(idx,{...b,title:e.target.value})} className="mt-1 w-full border rounded px-2 py-1 text-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Slug</label>
                      <input value={b.slug} onChange={(e)=>update(idx,{...b,slug:e.target.value})} className="mt-1 w-full border rounded px-2 py-1 text-black" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium">URL (LinkedIn)</label>
                      <input value={b.url} onChange={(e)=>update(idx,{...b,url:e.target.value})} className="mt-1 w-full border rounded px-2 py-1 text-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Author</label>
                      <input value={b.author||''} onChange={(e)=>update(idx,{...b,author:e.target.value})} className="mt-1 w-full border rounded px-2 py-1 text-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Date</label>
                      <input value={b.date||''} onChange={(e)=>update(idx,{...b,date:e.target.value})} className="mt-1 w-full border rounded px-2 py-1 text-black" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Image URL</label>
                      <input value={b.image||''} onChange={(e)=>update(idx,{...b,image:e.target.value})} className="mt-1 w-full border rounded px-2 py-1 text-black" placeholder="https://..." />
                    </div>
                    <div className="sm:col-span-1 flex items-end">
                      <div className="w-full">
                        <label className="block text-xs font-medium">Preview</label>
                        <div className="mt-1 h-[60px] rounded bg-neutral-100 overflow-hidden">
                          {b.image ? (
                            <img src={b.image} alt="Preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium">Tags (comma separated)</label>
                      <input
                        value={b._tagsDraft ?? (b.tags || []).join(', ')}
                        onChange={(e)=>update(idx,{...b,_tagsDraft:e.target.value})}
                        onBlur={(e)=>update(idx,{...b,_tagsDraft:e.target.value, tags: parseTags(e.target.value)})}
                        className="mt-1 w-full border rounded px-2 py-1 text-black"
                        placeholder="e.g. Devotional, Mission, Culture"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium">Summary</label>
                      <textarea value={b.summary} onChange={(e)=>update(idx,{...b,summary:e.target.value})} rows={3} className="mt-1 w-full border rounded px-2 py-1 text-black" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium">Content HTML (optional, renders on site)</label>
                      <textarea value={b.contentHtml||''} onChange={(e)=>update(idx,{...b,contentHtml:e.target.value})} rows={8} className="mt-1 w-full border rounded px-2 py-1 text-black font-mono text-xs" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer variant="neutral" />
    </div>
  );

  function update(index: number, next: BlogItem) {
    setItems((prev) => prev.map((it, i) => (i === index ? next : it)));
  }

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
  }
}
