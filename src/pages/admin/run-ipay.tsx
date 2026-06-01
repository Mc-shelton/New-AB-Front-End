import { useEffect, useMemo, useState } from 'react';
import { ipayApiUrl } from '../../config/api';
import Footer from '../../components/Footer';

type IpayTx = {
  id: string;
  ws_code: string;
  status: string;
  amount: number;
  rec_desc?: string | null;
  date: string;
};

type IpayAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  challenge_only?: boolean;
  distance?: string;
  pack?: string;
  organization?: string;
  status?: string;
  createdAt: string;
  unique_code?: string;
  ticketPrice?: number | null;
  promoCodeId?: string | null;
  walletId?: string;
  Wallet?: { walletId: string; balance: number; availableBalance: number };
  Transactions?: IpayTx[];
  PromoCode?: {
    id: string;
    code: string;
    usageLimit: number;
    usageCount: number;
    isActive: boolean;
  } | null;
};

export default function AdminRunIpay() {
  const [rows, setRows] = useState<IpayAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(ipayApiUrl('/accounts/all'));
      const json = await res.json();
      if (!res.ok || !json?.data) throw new Error(json?.message || 'Failed to load accounts');
      setRows(json.data as IpayAccount[]);
    } catch (err: any) {
      setError(err?.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const summary = useMemo(() => {
    const total = rows.length;
    const clearedAccounts = rows.filter((r) => r.status === 'cleared');
    const successTx = rows.flatMap((r) => r.Transactions || []).filter((t) => t.status === 'success');
    const failedTx = rows.flatMap((r) => r.Transactions || []).filter((t) => t.status === 'failed');
    const pendingTx = rows.flatMap((r) => r.Transactions || []).filter((t) => t.status === 'pending');
    const latest = [...rows].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);
    return { total, clearedAccounts, successTx, failedTx, pendingTx, latest };
  }, [rows]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Run Payments (iPay) Admin</div>
            <div className="text-xs text-neutral-600">View accounts and transaction outcomes.</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          {error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <StatCard label="Accounts" value={summary.total} />
            <StatCard label="Cleared" value={summary.clearedAccounts.length} tone="sky" />
            <StatCard label="Success tx" value={summary.successTx.length} tone="emerald" />
            <StatCard label="Failed tx" value={summary.failedTx.length} tone="rose" />
            <StatCard label="Pending tx" value={summary.pendingTx.length} tone="amber" />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Contact</th>
                  <th className="px-3 py-2 text-left">Distance</th>
                  <th className="px-3 py-2 text-left">Pack</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Wallet</th>
                  <th className="px-3 py-2 text-left">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100 align-top">
                    <td className="px-3 py-2">
                      <div className="font-semibold">{row.name}</div>
                      <div className="text-xs text-neutral-600">{new Date(row.createdAt).toLocaleString()}</div>
                      {row.unique_code && <div className="text-[11px] text-neutral-500">Code: {row.unique_code}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div>{row.email}</div>
                      <div>{row.phone}</div>
                      {row.city && <div className="text-neutral-600">{row.city}</div>}
                    </td>
                    <td className="px-3 py-2 text-xs">{row.distance ?? '—'}</td>
                    <td className="px-3 py-2 text-xs capitalize">{row.pack ?? '—'}</td>
                    <td className="px-3 py-2 text-xs capitalize">
                      <Badge tone={row.status === 'success' ? 'emerald' : row.status === 'failed' ? 'rose' : row.status === 'cleared' ? 'sky' : 'amber'}>
                        {row.status || 'transacting'}
                      </Badge>
                      {row.PromoCode?.code && (
                        <div className="mt-1 text-[11px] text-sky-700">Promo: {row.PromoCode.code}</div>
                      )}
                      {typeof row.ticketPrice === 'number' && (
                        <div className="mt-1 text-[11px] text-neutral-500">Ticket: KES {Math.round(row.ticketPrice)}</div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {row.Wallet ? (
                        <>
                          <div>#{row.Wallet.walletId}</div>
                          <div className="text-neutral-600">Bal: {Math.round(row.Wallet.balance)}</div>
                          <div className="text-neutral-600">Avail: {Math.round(row.Wallet.availableBalance)}</div>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <TxList items={row.Transactions || []} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && !loading && (
              <div className="p-6 text-sm text-neutral-600">No accounts yet.</div>
            )}
            {loading && (
              <div className="p-6 text-sm text-neutral-600">Loading…</div>
            )}
          </div>
        </div>
      </main>

      <Footer variant="neutral" />
    </div>
  );
}

function StatCard({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'emerald' | 'rose' | 'amber' | 'sky' }) {
  const toneMap: Record<string, string> = {
    neutral: 'bg-neutral-100 text-neutral-900',
    emerald: 'bg-emerald-100 text-emerald-900',
    rose: 'bg-rose-100 text-rose-900',
    amber: 'bg-amber-100 text-amber-900',
    sky: 'bg-sky-100 text-sky-900',
  };
  return (
    <div className={`rounded-2xl border border-neutral-200 px-4 py-3 text-sm font-semibold ${toneMap[tone]}`}>
      <div className="text-xs uppercase tracking-wide text-neutral-600">{label}</div>
      <div className="text-2xl font-black">{value}</div>
    </div>
  );
}

function Badge({ tone, children }: { tone: 'emerald' | 'rose' | 'amber' | 'neutral' | 'sky'; children: React.ReactNode }) {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-800',
    rose: 'bg-rose-100 text-rose-700',
    amber: 'bg-amber-100 text-amber-800',
    neutral: 'bg-neutral-100 text-neutral-800',
    sky: 'bg-sky-100 text-sky-800',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

function TxList({ items }: { items: IpayTx[] }) {
  if (!items.length) return <div className="text-neutral-500">—</div>;
  return (
    <div className="space-y-2">
      {items.slice(0, 4).map((tx) => (
        <div key={tx.id} className="rounded-xl bg-neutral-50 border border-neutral-200 px-3 py-2">
          <div className="flex justify-between text-[11px]">
            <span className="font-semibold">{tx.ws_code}</span>
            <span className="text-neutral-600">{new Date(tx.date).toLocaleString()}</span>
          </div>
          <div className="text-xs flex items-center gap-2">
            <Badge tone={tx.status === 'success' ? 'emerald' : tx.status === 'failed' ? 'rose' : 'amber'}>{tx.status}</Badge>
            <span>KES {tx.amount}</span>
          </div>
          {tx.rec_desc && <div className="text-[11px] text-neutral-600 mt-1">{tx.rec_desc}</div>}
        </div>
      ))}
      {items.length > 4 && <div className="text-[11px] text-neutral-500">+{items.length - 4} more…</div>}
    </div>
  );
}
