import { useEffect, useState } from 'react';
import Footer from '../../components/Footer';

type Activity = {
  ts: string;
  type: string;
  message: string;
  actorIp?: string;
  meta?: Record<string, unknown>;
};

export default function AdminActivity() {
  const [items, setItems] = useState<Activity[]>([]);
  const [key, setKey] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeNow, setActiveNow] = useState<number | null>(null);
  const [activeWindow, setActiveWindow] = useState(5);
  const [views, setViews] = useState<{ slug: string; total: number; site: number; share: number; lastSeen?: string }[]>([]);
  const [since, setSince] = useState(30);
  const [pageViews, setPageViews] = useState<{ page: string; total: number; lastSeen?: string }[]>([]);
  const [unique, setUnique] = useState(false);
  const [topEvents, setTopEvents] = useState<{ name: string; total: number; lastSeen?: string }[]>([]);

  const fetchItems = async () => {
    if (!key) return;
    setLoading(true);
    try {
      const url = `/api/activity.php?limit=200${type ? `&type=${encodeURIComponent(type)}` : ''}`;
      const res = await fetch(url, { headers: { 'X-Admin-Key': key } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) setItems(data.items.reverse());
    } finally {
      setLoading(false);
    }
  };

  const loadActiveNow = async () => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics.php?mode=active_now&window=${activeWindow}`, { headers: { 'X-Admin-Key': key } });
      const data = await res.json();
      if (data.ok && typeof data.total === 'number') setActiveNow(data.total);
    } finally {
      setLoading(false);
    }
  };

  const loadViews = async () => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics.php?mode=blog_views&since=${since}${unique ? '&unique=1' : ''}`, { headers: { 'X-Admin-Key': key } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) setViews(data.items);
    } finally {
      setLoading(false);
    }
  };

  const loadPageViews = async () => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics.php?mode=page_views&since=${since}${unique ? '&unique=1' : ''}`, { headers: { 'X-Admin-Key': key } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) setPageViews(data.items);
    } finally {
      setLoading(false);
    }
  };

  const loadTopEvents = async () => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics.php?mode=events&since=${since}`, { headers: { 'X-Admin-Key': key } });
      const data = await res.json();
      if (data.ok && Array.isArray(data.items)) setTopEvents(data.items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // no auto-load; require key
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl font-bold">Admin Activity</h1>
          <div className="mt-4 rounded-xl border border-neutral-200 p-4 bg-white flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium">Admin Key</label>
                <input type="password" value={key} onChange={(e)=>setKey(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-black" />
              </div>
              <div>
                <label className="block text-xs font-medium">Filter by type</label>
                <input value={type} onChange={(e)=>setType(e.target.value)} placeholder="e.g. blogs.save" className="mt-1 w-full border rounded px-3 py-2 text-black" />
              </div>
              <div className="flex items-end">
                <button onClick={fetchItems} disabled={!key || loading} className="rounded-full bg-amber-600 text-white px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-60 w-full">{loading ? 'Loading…' : 'Load Activity'}</button>
              </div>
            </div>
            <p className="text-xs text-neutral-600">Types seen so far: <code>blogs.save</code>, <code>blogs.generate_share</code>, <code>badges.generate_share</code></p>
          </div>

          <div className="mt-6 rounded-xl border border-neutral-200 p-4 bg-white flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="grow">
                <h2 className="text-lg font-semibold">Active Now</h2>
                <p className="text-xs text-neutral-600">Unique clients seen in the last N minutes.</p>
              </div>
              <div>
                <label className="block text-xs font-medium">Window (minutes)</label>
                <input type="number" min={1} max={1440} value={activeWindow} onChange={(e)=>setActiveWindow(parseInt(e.target.value||'5'))} className="mt-1 w-28 border rounded px-2 py-1 text-black" />
              </div>
              <div>
                <button onClick={loadActiveNow} disabled={!key || loading} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">{loading ? 'Loading…' : 'Load Active Now'}</button>
              </div>
            </div>
            <div className="mt-1 text-sm">
              <span className="font-semibold">Currently active:</span> {activeNow ?? '—'}
            </div>
          </div>

          <div className="mt-10 rounded-xl border border-neutral-200 p-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="grow">
                <h2 className="text-lg font-semibold">Blog Views (analytics)</h2>
                <p className="text-xs text-neutral-600">Aggregated counts from the public tracker. Filter by days.</p>
              </div>
              <div>
                <label className="block text-xs font-medium">Since (days)</label>
                <input type="number" min={0} value={since} onChange={(e)=>setSince(parseInt(e.target.value||'0'))} className="mt-1 w-28 border rounded px-2 py-1 text-black" />
              </div>
              <label className="text-xs flex items-center gap-2"><input type="checkbox" checked={unique} onChange={(e)=>setUnique(e.target.checked)} /> Unique</label>
              <div>
                <button onClick={loadViews} disabled={!key || loading} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">{loading ? 'Loading…' : 'Load Views'}</button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100 text-neutral-700">
                  <tr>
                    <th className="text-left px-4 py-2">Slug</th>
                    <th className="text-left px-4 py-2">Total</th>
                    <th className="text-left px-4 py-2">Site</th>
                    <th className="text-left px-4 py-2">Share</th>
                    <th className="text-left px-4 py-2">Last Seen (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {views.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-600">No data</td></tr>
                  )}
                  {views.map((v) => (
                    <tr key={v.slug} className="border-t border-neutral-100">
                      <td className="px-4 py-2">{v.slug}</td>
                      <td className="px-4 py-2">{v.total}</td>
                      <td className="px-4 py-2">{v.site}</td>
                      <td className="px-4 py-2">{v.share}</td>
                      <td className="px-4 py-2">{v.lastSeen || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-neutral-200 p-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="grow">
                <h2 className="text-lg font-semibold">Top Events (analytics)</h2>
                <p className="text-xs text-neutral-600">Counts of custom events from the mobile/web trackers.</p>
              </div>
              <div>
                <label className="block text-xs font-medium">Since (days)</label>
                <input type="number" min={0} value={since} onChange={(e)=>setSince(parseInt(e.target.value||'0'))} className="mt-1 w-28 border rounded px-2 py-1 text-black" />
              </div>
              <div>
                <button onClick={loadTopEvents} disabled={!key || loading} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">{loading ? 'Loading…' : 'Load Top Events'}</button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100 text-neutral-700">
                  <tr>
                    <th className="text-left px-4 py-2">Event</th>
                    <th className="text-left px-4 py-2">Total</th>
                    <th className="text-left px-4 py-2">Last Seen (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {topEvents.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-600">No data</td></tr>
                  )}
                  {topEvents.map((v) => (
                    <tr key={v.name} className="border-t border-neutral-100">
                      <td className="px-4 py-2">{v.name}</td>
                      <td className="px-4 py-2">{v.total}</td>
                      <td className="px-4 py-2">{v.lastSeen || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-neutral-200 p-4 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="grow">
                <h2 className="text-lg font-semibold">Page Views (analytics)</h2>
                <p className="text-xs text-neutral-600">Counts by page across the site.</p>
              </div>
              <div>
                <button onClick={loadPageViews} disabled={!key || loading} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60">{loading ? 'Loading…' : 'Load Page Views'}</button>
              </div>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-100 text-neutral-700">
                  <tr>
                    <th className="text-left px-4 py-2">Page</th>
                    <th className="text-left px-4 py-2">Total</th>
                    <th className="text-left px-4 py-2">Last Seen (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {pageViews.length === 0 && (
                    <tr><td colSpan={3} className="px-4 py-6 text-center text-neutral-600">No data</td></tr>
                  )}
                  {pageViews.map((v) => (
                    <tr key={v.page} className="border-t border-neutral-100">
                      <td className="px-4 py-2">{v.page}</td>
                      <td className="px-4 py-2">{v.total}</td>
                      <td className="px-4 py-2">{v.lastSeen || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-neutral-200 bg-white overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-neutral-700">
                <tr>
                  <th className="text-left px-4 py-2">Time (UTC)</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Message</th>
                  <th className="text-left px-4 py-2">Meta</th>
                  <th className="text-left px-4 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-6 text-center text-neutral-600">No activity yet</td></tr>
                )}
                {items.map((it, idx) => (
                  <tr key={idx} className="border-t border-neutral-100">
                    <td className="px-4 py-2 whitespace-nowrap">{new Date(it.ts).toLocaleString()}</td>
                    <td className="px-4 py-2">{it.type}</td>
                    <td className="px-4 py-2">{it.message}</td>
                    <td className="px-4 py-2 text-xs text-neutral-600">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(it.meta || {}, null, 0)}</pre>
                    </td>
                    <td className="px-4 py-2">{it.actorIp || ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer variant="neutral" />
    </div>
  );
}
