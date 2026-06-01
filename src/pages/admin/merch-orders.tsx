import { useEffect, useMemo, useState } from 'react'
import Footer from '../../components/Footer'
import { trackEvent } from '../../utils/track'

type MerchColor = {
  label?: string
  swatch?: string
}

type MerchOrderItem = {
  itemId: string
  name: string
  price: number
  quantity: number
  color?: MerchColor
  size?: string
}

type MerchOrder = {
  id: string
  ts: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  notes?: string
  total: number
  currency?: string
  items: MerchOrderItem[]
  paymentReference?: string
  status?: string
  staffNotes?: string
  reviewedAt?: string
}

const STATUSES: Array<'pending' | 'approved' | 'rejected'> = ['pending', 'approved', 'rejected']

export default function MerchOrdersAdmin() {
  const [orders, setOrders] = useState<MerchOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [key, setKey] = useState('')
  const [filter, setFilter] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    if (key.trim()) {
      void loadOrders(key)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredOrders = useMemo(() => {
    if (!filter.trim()) return orders
    const term = filter.trim().toLowerCase()
    return orders.filter((order) => {
      return (
        order.customerName?.toLowerCase().includes(term) ||
        order.customerEmail?.toLowerCase().includes(term) ||
        order.items.some((item) => item.name.toLowerCase().includes(term)) ||
        order.paymentReference?.toLowerCase().includes(term)
      )
    })
  }, [orders, filter])

  async function loadOrders(adminKey: string) {
    if (!adminKey.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/merch_orders.php', {
        method: 'GET',
        headers: { 'X-Admin-Key': adminKey.trim() },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Could not load orders')
      }
      const list = Array.isArray(data.orders) ? data.orders : []
      setOrders(list)
      try { trackEvent('merch.admin.orders_loaded') } catch (trackErr) { void trackErr }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusUpdate(order: MerchOrder, status: 'pending' | 'approved' | 'rejected') {
    if (!key.trim()) return
    const note = window.prompt('Optional note for this update:', order.staffNotes ?? '') || ''
    setUpdatingId(order.id)
    setError(null)
    try {
      const res = await fetch('/api/merch_orders.php', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key.trim() },
        body: JSON.stringify({ id: order.id, status, notes: note }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Could not update order')
      }
      setOrders((prev) => prev.map((item) => (item.id === order.id ? data.order : item)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update order')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl font-bold">Merch Orders</h1>
          <p className="mt-1 text-sm text-neutral-700">View and manage orders submitted through the Street Support merch checkout.</p>

          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
              <label className="text-sm font-medium">
                Admin key
                <input
                  type="password"
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
                  placeholder="Enter merch admin key"
                />
              </label>
              <button
                type="button"
                onClick={() => loadOrders(key)}
                disabled={!key.trim() || loading}
                className="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-500 disabled:opacity-60"
              >
                {loading ? 'Loading…' : 'Load orders'}
              </button>
            </div>
            <label className="block text-sm font-medium">
              Filter (name, email, product, or reference)
              <input
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900"
                placeholder="Search orders"
              />
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <section className="mt-6 space-y-4">
            {filteredOrders.length === 0 && !loading ? (
              <p className="text-sm text-neutral-600">No orders yet. Once supporters submit the merch form, they will appear here.</p>
            ) : (
              filteredOrders.map((order) => (
                <article key={order.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-3">
                  <header className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{order.customerName || 'Unnamed supporter'}</h2>
                      <div className="text-xs text-neutral-500">{order.customerEmail || 'No email provided'}</div>
                      {order.customerPhone && <div className="text-xs text-neutral-500">{order.customerPhone}</div>}
                      <div className="mt-2 text-xs text-neutral-500">Order ID: {order.id}</div>
                      <div className={`mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusClass(order.status)}`}>
                        {formatStatus(order.status)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-semibold text-amber-600">
                        {(order.currency ?? 'KES')} {order.total?.toLocaleString?.() ?? order.total}
                      </div>
                      <div className="text-xs text-neutral-500">{new Date(order.ts).toLocaleString()}</div>
                      {order.reviewedAt && (
                        <div className="text-xs text-neutral-400">Reviewed: {new Date(order.reviewedAt).toLocaleString()}</div>
                      )}
                    </div>
                  </header>

                  <div className="space-y-2 text-sm">
                    {order.items.map((item, index) => (
                      <div key={`${item.itemId}-${index}`} className="rounded-xl border border-neutral-200 p-3 flex flex-wrap items-center gap-3">
                        <div className="flex-1 min-w-[180px]">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-neutral-500">SKU: {item.itemId}</div>
                          <div className="text-xs text-neutral-500">
                            Qty: {item.quantity}
                            {item.color?.label && (
                              <span>
                                {' '}• Colour: {item.color.label}
                              </span>
                            )}
                            {item.size && (
                              <span>
                                {' '}• Size: {item.size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-amber-600">
                          {(order.currency ?? 'KES')} {(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600">
                      <div className="font-semibold text-neutral-500 uppercase tracking-wide">Notes</div>
                      <p className="mt-1 whitespace-pre-wrap">{order.notes}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-neutral-600">
                    <div>
                      <strong>Payment reference:</strong> {order.paymentReference || '—'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {STATUSES.map((status) => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => handleStatusUpdate(order, status)}
                          disabled={updatingId === order.id}
                          className={
                            status === 'approved'
                              ? 'rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-60'
                              : status === 'rejected'
                                ? 'rounded-full border border-red-300 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60'
                                : 'rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold hover:bg-neutral-100 disabled:opacity-60'
                          }
                        >
                          {status === 'approved' ? 'Approve' : status === 'rejected' ? 'Reject' : 'Mark pending'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {order.staffNotes && (
                    <div className="rounded-xl bg-neutral-100 p-3 text-xs text-neutral-600">
                      <div className="font-semibold text-neutral-500 uppercase tracking-wide">Admin note</div>
                      <p className="mt-1 whitespace-pre-wrap">{order.staffNotes}</p>
                    </div>
                  )}
                </article>
              ))
            )}
          </section>
        </div>
      </main>
      <Footer variant="neutral" />
    </div>
  )
}

function formatStatus(status?: string): string {
  switch (status) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    default:
      return 'Pending review'
  }
}

function statusClass(status?: string): string {
  switch (status) {
    case 'approved':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'rejected':
      return 'border-red-200 bg-red-50 text-red-700'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}
