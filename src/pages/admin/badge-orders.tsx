import { useEffect, useMemo, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import Footer from '../../components/Footer';
import { BadgeTemplate, PosterTemplate, TIERS } from '../event';

type BadgeOrder = {
  id: string;
  createdAt: string;
  approvedAt?: string;
  updatedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  name: string;
  email: string;
  phone?: string;
  tierKey: string;
  tierName: string;
  amount: number;
  paymentReference: string;
  hardCopy?: boolean;
  notes?: string;
  badgePath?: string | null;
  posterPath?: string | null;
  adminNote?: string;
  delivery?: { ok: boolean; detail?: string };
  shareUrl?: string;
  portraitPath?: string | null;
};

const STATUS_FILTERS: Array<{ label: string; value: '' | 'pending' | 'approved' | 'rejected' }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

export default function AdminBadgeOrders() {
  const [orders, setOrders] = useState<BadgeOrder[]>([]);
  const [adminKey, setAdminKey] = useState('');
  const [filter, setFilter] = useState<'' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const posterRef = useRef<HTMLDivElement | null>(null);
  const badgeRef = useRef<HTMLDivElement | null>(null);
  const [renderContext, setRenderContext] = useState<
    | null
    | {
        tier: (typeof TIERS)[number];
        attendeeName: string;
        shareUrl: string;
        portraitSrc: string | null;
      }
  >(null);

  const readJson = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Server returned malformed JSON');
    }
  };

  const loadOrders = async () => {
    if (!adminKey) {
      setMessage('Admin key required.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      if (search.trim()) params.set('q', search.trim());
      const url = `/api/badge_orders.php${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url, { headers: { 'X-Admin-Key': adminKey } });
      const data = await readJson(res);
      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.error || `Failed to load orders (status ${res.status})`);
      }
      setOrders(Array.isArray(data.items) ? data.items.reverse() : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const ensureRenderReady = async (
    context: {
      tier: (typeof TIERS)[number];
      attendeeName: string;
      shareUrl: string;
      portraitSrc: string | null;
    }
  ) => {
    setRenderContext(context);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };

  const tierByKey = useMemo(() => {
    return TIERS.reduce<Record<string, (typeof TIERS)[number]>>((acc, tier) => {
      acc[tier.key] = tier;
      return acc;
    }, {});
  }, []);

  const generateAssets = async (order: BadgeOrder) => {
    if (!adminKey) {
      setMessage('Admin key required before generating assets.');
      return;
    }
    const tier = tierByKey[order.tierKey] ?? TIERS[0];
    if (!tier) {
      setMessage('Tier configuration missing.');
      return;
    }
    try {
      setGeneratingId(order.id);
      setMessage('Generating badge kit…');
      const portraitSrc = order.portraitPath ? toPublicUrl(order.portraitPath) : null;
      const shareUrl = order.shareUrl || `https://adventband.org/event?tier=${encodeURIComponent(order.tierKey)}`;
      await ensureRenderReady({
        tier,
        attendeeName: order.name,
        shareUrl,
        portraitSrc,
      });
      const posterNode = posterRef.current;
      const badgeNode = badgeRef.current;
      if (!posterNode || !badgeNode) {
        throw new Error('Templates not ready for export.');
      }
      const [posterDataUrl, badgeDataUrl] = await Promise.all([
        toPng(posterNode, { cacheBust: true, pixelRatio: 1 }),
        toPng(badgeNode, { cacheBust: true, pixelRatio: 1 }),
      ]);

      const res = await fetch('/api/badge_orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({
          id: order.id,
          posterDataUrl,
          badgeDataUrl,
        }),
      });
      const data = await readJson(res);
      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.error || `Failed to save assets (status ${res.status})`);
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
      setMessage('Badge and poster attached to order.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate assets';
      setMessage(msg);
    } finally {
      setGeneratingId(null);
      setRenderContext(null);
    }
  };

  const updateStatus = async (order: BadgeOrder, status: 'approved' | 'rejected') => {
    if (!adminKey) {
      setMessage('Admin key required.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/badge_orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ id: order.id, status }),
      });
      const data = await readJson(res);
      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.error || `Unable to update order (status ${res.status})`);
      }
      setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
      setMessage(status === 'approved' ? 'Order approved and email triggered.' : 'Order rejected.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update order';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminKey) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const humanStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);
  const toPublicUrl = (path: string | null | undefined) => {
    if (!path) return '#';
    const idx = path.indexOf('/data/badge_orders/');
    if (idx !== -1) return path.slice(idx);
    const pubIdx = path.indexOf('/public/');
    if (pubIdx !== -1) return path.slice(pubIdx + '/public'.length);
    return path;
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: -9999,
          pointerEvents: 'none',
          display: 'flex',
          gap: '32px',
        }}
        aria-hidden="true"
      >
        {renderContext && (
          <>
            <div ref={posterRef} style={{ width: 1080, height: 1080 }}>
              <PosterTemplate
                tier={renderContext.tier}
                attendeeName={renderContext.attendeeName}
                shareUrl={renderContext.shareUrl}
                portraitSrc={renderContext.portraitSrc}
              />
            </div>
            <div ref={badgeRef} style={{ width: 1080, height: 1080 }}>
              <BadgeTemplate
                tier={renderContext.tier}
                attendeeName={renderContext.attendeeName}
                portraitSrc={renderContext.portraitSrc}
              />
            </div>
          </>
        )}
      </div>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl font-bold">Badge Orders</h1>
          <p className="text-sm text-neutral-600 mt-1">Approve badge purchases after confirming payment. Approved orders automatically email badges and posters to supporters.</p>

          <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-4 flex flex-col gap-3">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium">Admin Key</label>
                <input type="password" value={adminKey} onChange={(e)=>setAdminKey(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 text-black" />
              </div>
              <div className="lg:col-span-2">
                <label className="block text-xs font-medium">Search Orders</label>
                <div className="mt-1 flex rounded-full border border-neutral-200 px-3 py-2 focus-within:ring-2 focus-within:ring-amber-500">
                  <input
                    type="search"
                    placeholder="Name, email, Mpesa code, tier, or order id"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') loadOrders();
                    }}
                    className="w-full bg-transparent text-sm text-neutral-900 outline-none"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      className="ml-2 text-xs text-neutral-500 hover:text-neutral-700"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-end lg:col-span-2">
                {STATUS_FILTERS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => setFilter(item.value)}
                    className={`rounded-full px-4 py-2 text-sm border ${filter === item.value ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-neutral-700 hover:bg-neutral-100'}`}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="flex items-end lg:justify-end">
                <button onClick={loadOrders} disabled={!adminKey || loading} className="w-full rounded-full bg-amber-600 text-white px-4 py-3 font-semibold hover:bg-amber-500 disabled:opacity-60 lg:w-auto lg:px-6">{loading ? 'Loading…' : 'Load Orders'}</button>
              </div>
            </div>
            {message && <div className="text-sm text-neutral-600">{message}</div>}
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-neutral-100 text-neutral-700">
                <tr>
                  <th className="px-4 py-2 text-left">Supporter</th>
                  <th className="px-4 py-2 text-left">Tier</th>
                  <th className="px-4 py-2 text-left">Payment Ref</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Created</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-center text-neutral-600">No orders found.</td></tr>
                )}
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-neutral-100 align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900">{order.name}</div>
                      <div>{order.email}</div>
                      {order.phone && <div className="text-xs text-neutral-600">{order.phone}</div>}
                      {order.hardCopy && <div className="text-xs text-amber-600">Hard-copy requested</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div>{order.tierName}</div>
                      <div className="text-xs text-neutral-600">KES {order.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs">{order.paymentReference}</div>
                      {order.notes && <div className="mt-1 text-xs text-neutral-600">{order.notes}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : order.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {humanStatus(order.status)}
                      </span>
                      <div className="mt-1 text-xs text-neutral-500">Created: {order.createdAt}</div>
                      {order.approvedAt && <div className="text-xs text-neutral-500">Approved: {order.approvedAt}</div>}
                      {order.delivery && <div className="text-xs text-neutral-500">Delivery: {order.delivery.ok ? order.delivery.detail : `Failed (${order.delivery.detail || 'unknown'})`}</div>}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-600">{order.createdAt}</td>
                    <td className="px-4 py-3 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => generateAssets(order)}
                          disabled={loading || generatingId === order.id}
                          className="rounded-full bg-neutral-900 text-white px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
                        >
                          {generatingId === order.id ? 'Generating…' : 'Generate assets'}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {order.badgePath && <a href={toPublicUrl(order.badgePath)} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1 hover:bg-neutral-50">Badge</a>}
                        {order.posterPath && <a href={toPublicUrl(order.posterPath)} target="_blank" rel="noreferrer" className="rounded-full border px-3 py-1 hover:bg-neutral-50">Poster</a>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updateStatus(order, 'approved')}
                          disabled={
                            loading ||
                            order.status === 'approved' ||
                            !order.badgePath ||
                            !order.posterPath
                          }
                          className="rounded-full bg-emerald-600 text-white px-4 py-1.5 text-xs font-semibold disabled:opacity-50"
                          title={
                            !order.badgePath || !order.posterPath
                              ? 'Generate assets before approving'
                              : undefined
                          }
                        >
                          Approve
                        </button>
                        <button onClick={() => updateStatus(order, 'rejected')} disabled={loading || order.status === 'rejected'} className="rounded-full bg-rose-100 text-rose-700 px-4 py-1.5 text-xs font-semibold disabled:opacity-50">Reject</button>
                      </div>
                      {(!order.badgePath || !order.posterPath) && (
                        <div className="text-xs text-amber-600">Assets missing</div>
                      )}
                    </td>
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
