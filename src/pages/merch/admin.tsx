import { useEffect, useMemo, useState } from 'react'
import Footer from '../../components/Footer'
import type { MerchColor, MerchItem } from '../../content/merch'

type EditableMerch = MerchItem & {
  _priceString?: string
  _tagsDraft?: string
  _colorsDraft?: string
  _sizesDraft?: string
}

export default function MerchAdmin() {
  const [items, setItems] = useState<EditableMerch[]>([])
  const [loading, setLoading] = useState(true)
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [status, setStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null)

  useEffect(() => {
    fetch('/api/merch.php', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(
            data.map((item: MerchItem): EditableMerch => ({
              ...item,
              _priceString: item.price?.toString() ?? '',
              _tagsDraft: (item.tags || []).join(', '),
              _colorsDraft: formatColorDraft(item.colors),
              _sizesDraft: (item.sizes || []).join(', '),
            })),
          )
        } else {
          setItems([])
        }
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        name: 'New merch item',
        slug: `merch-${Date.now()}`,
        description: 'Short description of the product and impact.',
        price: 0,
        currency: 'KES',
        impact: '',
        image: '',
        tags: [],
        available: true,
        _priceString: '0',
        _tagsDraft: '',
        _colorsDraft: '',
        _sizesDraft: '',
        colors: [],
        sizes: [],
      },
    ])
  }

  const save = async () => {
    setSaving(true)
    setStatus(null)
    try {
      const clean: MerchItem[] = items.map((item) => {
        const parsedPrice = parseFloat(item._priceString ?? item.price.toString() ?? '0')
        const safePrice = Number.isFinite(parsedPrice) ? parsedPrice : 0
        return {
        id: item.id,
        name: item.name.trim(),
        slug: item.slug.trim() || item.id,
        description: item.description?.trim() ?? '',
        price: safePrice,
        currency: item.currency?.trim() || 'KES',
        impact: item.impact?.trim() || '',
        image: item.image?.trim() || '',
        tags: parseTags(item._tagsDraft ?? (item.tags || []).join(', ')),
        available: item.available !== false,
        colors: parseColors(item._colorsDraft ?? formatColorDraft(item.colors)),
        sizes: parseTags(item._sizesDraft ?? (item.sizes || []).join(', ')),
        }
      })

      const res = await fetch('/api/merch.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
        body: JSON.stringify({ items: clean }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Save failed')
      }
      setStatus({ type: 'ok', text: 'Merchandise saved successfully.' })
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const generateSharePages = async () => {
    setShareLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/generate_merch_share.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
        body: '{}',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Share generation failed')
      }
      setStatus({ type: 'ok', text: `Share pages generated (${data.count ?? 0})` })
    } catch (error) {
      setStatus({ type: 'error', text: error instanceof Error ? error.message : 'Share generation failed' })
    } finally {
      setShareLoading(false)
    }
  }

  const remove = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const canSave = useMemo(() => key.trim().length > 0 && items.length >= 0, [key, items])

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl font-bold">Merch Admin</h1>
          <p className="mt-1 text-sm text-neutral-700">Manage the fundraising merch catalogue. Saving replaces `/data/merch.json` on the server.</p>

          <div className="mt-4 rounded-xl border border-neutral-200 bg-white p-4">
            <label className="block text-sm font-medium">Admin Key</label>
            <input
              type="password"
              value={key}
              onChange={(event) => setKey(event.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-black"
              placeholder="Enter merch admin key"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={addItem} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500">Add Merch Item</button>
              <button
                onClick={save}
                disabled={!canSave || saving}
                className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                onClick={generateSharePages}
                disabled={!key || shareLoading}
                className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-60"
              >
                {shareLoading ? 'Generating…' : 'Generate Share Files'}
              </button>
              <a href="/admin/merch-orders" className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50">View Orders</a>
              <a href="/blogs/admin" className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50">Back to Blogs Admin</a>
            </div>
            {status && (
              <p className={`mt-2 text-sm ${status.type === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{status.text}</p>
            )}
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-neutral-700">Loading merch…</p>
          ) : (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Item {idx + 1}</h3>
                    <button onClick={() => remove(idx)} className="text-sm underline">Remove</button>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium">Name</label>
                      <input
                        value={item.name}
                        onChange={(event) => update(idx, { ...item, name: event.target.value })}
                        className="mt-1 w-full rounded border px-2 py-1 text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Slug</label>
                      <input
                        value={item.slug}
                        onChange={(event) => update(idx, { ...item, slug: event.target.value })}
                        className="mt-1 w-full rounded border px-2 py-1 text-black"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">SKU / ID</label>
                      <input
                        value={item.id}
                        onChange={(event) => update(idx, { ...item, id: event.target.value })}
                        className="mt-1 w-full rounded border px-2 py-1 text-black"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <div>
                        <label className="block text-xs font-medium">Price</label>
                        <input
                          value={item._priceString ?? ''}
                          onChange={(event) => update(idx, { ...item, _priceString: event.target.value })}
                          className="mt-1 w-full rounded border px-2 py-1 text-black"
                          placeholder="3500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium">Currency</label>
                        <input
                          value={item.currency ?? ''}
                          onChange={(event) => update(idx, { ...item, currency: event.target.value })}
                          className="mt-1 w-24 rounded border px-2 py-1 text-black"
                          placeholder="KES"
                        />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium">Description</label>
                      <textarea
                        value={item.description}
                        onChange={(event) => update(idx, { ...item, description: event.target.value })}
                        rows={3}
                        className="mt-1 w-full rounded border px-2 py-1 text-black"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium">Impact blurb</label>
                      <textarea
                        value={item.impact ?? ''}
                        onChange={(event) => update(idx, { ...item, impact: event.target.value })}
                        rows={2}
                        className="mt-1 w-full rounded border px-2 py-1 text-black"
                        placeholder="Explain how this purchase funds street ministry."
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium">Image URL</label>
                      <input
                        value={item.image ?? ''}
                        onChange={(event) => update(idx, { ...item, image: event.target.value })}
                        className="mt-1 w-full rounded border px-2 py-1 text-black"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Colours (Label|#HEX|Image)</label>
                      <textarea
                        value={item._colorsDraft ?? ''}
                        onChange={(event) => update(idx, { ...item, _colorsDraft: event.target.value })}
                        onBlur={(event) => update(idx, { ...item, _colorsDraft: event.target.value, colors: parseColors(event.target.value) })}
                        rows={3}
                        className="mt-1 w-full rounded border px-2 py-1 text-black font-mono text-xs"
                        placeholder="Black|#111827|https://image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium">Sizes (comma separated)</label>
                      <input
                        value={item._sizesDraft ?? ''}
                        onChange={(event) => update(idx, { ...item, _sizesDraft: event.target.value })}
                        onBlur={(event) => update(idx, { ...item, _sizesDraft: event.target.value, sizes: parseTags(event.target.value) })}
                        className="mt-1 w-full rounded border px-2 py-1 text-black"
                        placeholder="S, M, L, XL"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium">Tags (comma separated)</label>
                      <input
                        value={item._tagsDraft ?? ''}
                        onChange={(event) => update(idx, { ...item, _tagsDraft: event.target.value })}
                        onBlur={(event) => update(idx, { ...item, _tagsDraft: event.target.value, tags: parseTags(event.target.value) })}
                        className="mt-1 w-full rounded border px-2 py-1 text-black"
                        placeholder="Apparel, Limited"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <input
                        id={`available-${item.id}`}
                        type="checkbox"
                        checked={item.available !== false}
                        onChange={(event) => update(idx, { ...item, available: event.target.checked })}
                      />
                      <label htmlFor={`available-${item.id}`} className="text-sm">Available for ordering</label>
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
  )

  function update(index: number, next: EditableMerch) {
    setItems((prev) => prev.map((item, i) => (i === index ? next : item)))
  }

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  function parseColors(input: string): MerchColor[] {
    return input
      .split(/\n|;/)
      .map((segment) => segment.trim())
      .filter((segment) => segment.length > 0)
      .map((segment) => {
        const [label = '', swatch = '', image] = segment.split('|').map((part) => part.trim())
        return {
          label: label || swatch || 'Colour',
          swatch: swatch || '#000000',
          image: image && image.length > 0 ? image : undefined,
        }
      })
  }
}

function formatColorDraft(colors?: MerchColor[]): string {
  if (!colors || colors.length === 0) return ''
  return colors
    .map((color) => {
      const parts = [color.label ?? '', color.swatch ?? '', color.image ?? '']
      while (parts.length && !parts[parts.length - 1]) {
        parts.pop()
      }
      return parts.join('|')
    })
    .join('\n')
}
