import { useEffect, useMemo, useState } from 'react'
import Footer from '../../components/Footer'
import { fetchMerch } from '../../content/merchClient'
import type { MerchColor, MerchItem } from '../../content/merch'
import ab_logo from '../../assets/images/ab_logo.png'
import ab_badges from '../../assets/images/ab_badges.jpeg'
import {
  ShoppingOutlined,
  HeartOutlined,
  FireOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import { trackEvent, trackPage } from '../../utils/track'

type CartLine = {
  key: string
  itemId: string
  name: string
  price: number
  quantity: number
  color?: {
    label: string
    swatch?: string
    image?: string
  }
  size?: string
  image?: string
  currency?: string
}

type CheckoutStatus = { type: 'ok' | 'error'; text: string }

export default function MerchPage() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<MerchItem | null>(null)
  const [selectedColor, setSelectedColor] = useState<MerchColor | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<CartLine[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [paymentReference, setPaymentReference] = useState('')
  const [optionError, setOptionError] = useState<string | null>(null)
  const [pendingSlug, setPendingSlug] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return new URLSearchParams(window.location.search).get('item')
  })

  useEffect(() => {
    trackPage('merch.store')
    fetchMerch()
      .then((data) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setSelectedColor(selected.colors?.[0] ?? null)
    setSelectedSize(selected.sizes?.[0] ?? '')
    setQuantity(1)
    setOptionError(null)
  }, [selected])

  useEffect(() => {
    if (!pendingSlug || !items.length) return
    const match = items.find((item) => item.slug === pendingSlug)
    if (match) {
      setSelected(match)
    }
    setPendingSlug(null)
  }, [pendingSlug, items])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    if (selected) {
      url.searchParams.set('item', selected.slug)
    } else {
      url.searchParams.delete('item')
    }
    window.history.replaceState(null, '', url)
  }, [selected])

  const hasItems = items.length > 0
  const cartCount = useMemo(() => cart.reduce((total, line) => total + line.quantity, 0), [cart])
  const cartTotal = useMemo(() => cart.reduce((total, line) => total + line.price * line.quantity, 0), [cart])
  const currency = cart[0]?.currency ?? items[0]?.currency ?? 'KES'
  const heroStats = useMemo(
    () => [
      { label: 'Street families supported', value: '46,000+ ' },
      { label: 'Every purchase funds', value: 'Meals, Bibles & blankets' },
      { label: 'Order delivery zones', value: 'Nairobi & metropolitan' },
    ],
    [],
  )
  const activeImage = selected
    ? selectedColor?.image ?? selected.image ?? selected.colors?.find((color) => color.image)?.image ?? null
    : null
  const shareLink = selected && typeof window !== 'undefined' ? `${window.location.origin}/share/merchandise/${selected.slug}.html` : ''
  const shareMessage = selected ? `${selected.name} — support Advent Band Street Merch ${shareLink}` : ''

  const handleCopyShare = async () => {
    if (!shareLink) return
    try {
      await navigator.clipboard.writeText(shareLink)
      alert('Merch share link copied')
      try { trackEvent('merch.share.copy', { slug: selected?.slug }) } catch (error) { void error }
    } catch (error) {
      console.error('Copy share link failed', error)
    }
  }

  const handleNativeShare = async () => {
    if (!selected || !shareLink) return
    if (navigator.share) {
      try {
        await navigator.share({ title: selected.name, text: shareMessage, url: shareLink })
        try { trackEvent('merch.share.native', { slug: selected.slug }) } catch (error) { void error }
      } catch (error) {
        if ((error as DOMException).name !== 'AbortError') {
          console.error('Share failed', error)
        }
      }
    } else {
      await handleCopyShare()
    }
  }

  const addToCart = () => {
    if (!selected) return
    if (selected.colors && selected.colors.length > 0 && !selectedColor) {
      setOptionError('Select a colour to continue.')
      return
    }
    if (selected.sizes && selected.sizes.length > 0 && !selectedSize) {
      setOptionError('Select a size to continue.')
      return
    }
    if (quantity <= 0) {
      setOptionError('Quantity must be at least 1.')
      return
    }

    const colorKey = selectedColor?.label ?? '-'
    const key = [selected.id, colorKey, selectedSize || '-'].join('::')
    setCart((prev) => {
      const existing = prev.find((line) => line.key === key)
      if (existing) {
        return prev.map((line) => (line.key === key ? { ...line, quantity: line.quantity + quantity } : line))
      }
      return [
        ...prev,
        {
          key,
          itemId: selected.id,
          name: selected.name,
          price: selected.price,
          quantity,
          color: selectedColor
            ? {
                label: selectedColor.label,
                swatch: selectedColor.swatch,
                image: selectedColor.image,
              }
            : undefined,
          size: selectedSize || undefined,
          image: selectedColor?.image ?? selected.image,
          currency: selected.currency,
        },
      ]
    })

    try {
      trackEvent('merch.cart.add', {
        id: selected.id,
        color: selectedColor?.label,
        colorSwatch: selectedColor?.swatch,
        colorImage: selectedColor?.image,
        size: selectedSize || undefined,
        quantity,
      })
    } catch (error) {
      void error
    }

    setSelected(null)
    setSelectedColor(null)
    setSelectedSize('')
    setCartOpen(true)
  }

  const updateQuantity = (key: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((line) => (line.key === key ? { ...line, quantity: Math.max(1, line.quantity + delta) } : line))
        .filter((line) => line.quantity > 0),
    )
  }

  const removeFromCart = (key: string) => {
    setCart((prev) => prev.filter((line) => line.key !== key))
  }

  const handleCheckoutSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!cart.length) return

    setCheckoutLoading(true)
    setCheckoutStatus(null)
    try {
      if (!paymentReference.trim()) {
        throw new Error('Enter your M-Pesa confirmation code.')
      }
      try {
        trackEvent('merch.checkout.submit', { items: cart.length, total: cartTotal })
      } catch (error) {
        void error
      }

      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        customerPhone: customerPhone.trim(),
        notes: customerNotes.trim(),
        paymentReference: paymentReference.trim(),
        total: cartTotal,
        currency,
        items: cart.map((line) => ({
          itemId: line.itemId,
          name: line.name,
          price: line.price,
          quantity: line.quantity,
          color: line.color,
          size: line.size,
        })),
      }

      const res = await fetch('/api/merch_orders.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({} as Record<string, unknown>))
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || 'Order could not be submitted.')
      }

      const orderId = typeof data.id === 'string' ? data.id : ''
      setCheckoutStatus({
        type: 'ok',
        text: orderId
          ? `Thank you! Order ${orderId} is pending review — we'll email you once the merch team confirms payment.`
          : 'Thank you! Our merch team will reach out to confirm delivery and payment.',
      })
      setCart([])
      setCartOpen(false)
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setCustomerNotes('')
      setPaymentReference('')
    } catch (error) {
      setCheckoutStatus({
        type: 'error',
        text: error instanceof Error ? error.message : 'Order could not be submitted. Please try again.',
      })
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header className="relative text-white">
        <div
          className="absolute inset-0"
          style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.88), rgba(0,0,0,0.35)), url('${ab_badges}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        />
        <div className="relative">
          <div className="w-full bg-gradient-to-b from-black/70 to-transparent">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex items-end justify-between">
              <a
                href="/"
                className="h-20 w-48 sm:h-24 sm:w-56 bg-no-repeat bg-contain bg-center invert brightness-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
                style={{ backgroundImage: `url('${ab_logo}')` }}
                aria-label="AdventBand home"
              />
              {cartCount > 0 && (
                <button
                  type="button"
                  onClick={() => setCartOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  <ShoppingCartOutlined /> Cart • {cartCount}
                </button>
              )}
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 pt-6 sm:pb-16">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/15 px-3 py-1 text-xs uppercase tracking-wide">
                <ShoppingOutlined /> Street Support Merch
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight">
                Wear impact, fund the street vespers initiative
              </h1>
              <p className="text-sm sm:text-base text-white/90">
                Every tee, hoodie, tote and collectible in this pop-up store keeps the Aga Khan Walk outreach running — covering meals, books and and desired fellowship.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/25 bg-white/10 p-4">
                    <div className="text-xs uppercase text-white/80">{stat.label}</div>
                    <div className="mt-1 text-sm font-semibold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <section className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-50 to-white p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl space-y-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900">Shop the Street Hope collection</h2>
                <p className="text-sm sm:text-base text-neutral-700">
                  Limited-run drops printed with art and testimonies from the outreach family. Add favourites to your bag and check out once when you are ready.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1"><FireOutlined /> Limited runs</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1"><HeartOutlined /> 100% mission funded</span>
                </div>
              </div>
              <a
                href="#catalogue"
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-500"
              >
                Browse catalogue <ArrowRightOutlined />
              </a>
            </div>
          </section>

          <section id="catalogue" className="mt-10">
            {loading ? (
              <p className="text-sm text-neutral-600">Loading merch…</p>
            ) : hasItems ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item) => {
                  const productImage =
                    item.colors?.find((color) => color.image)?.image ||
                    item.colors?.[0]?.image ||
                    item.image

                  return (
                    <div key={item.id} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
                      <div className="relative h-56 w-full overflow-hidden">
                        {productImage ? (
                          <img src={productImage} alt={item.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                        ) : (
                          <div className="h-full w-full bg-neutral-100" />
                        )}
                        {!item.available && (
                          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Restocking</span>
                        )}
                      </div>
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-lg font-semibold text-neutral-900">{item.name}</h3>
                        <div className="text-right text-sm font-bold text-amber-600">
                          {item.currency ?? 'KES'} {item.price.toLocaleString()}
                        </div>
                      </div>
                      {item.tags && item.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-neutral-500">
                          {item.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-neutral-200 px-2 py-1">{tag}</span>
                          ))}
                        </div>
                      )}
                      <p className="mt-3 text-sm text-neutral-700 line-clamp-3">{item.description}</p>
                      {item.impact && (
                        <p className="mt-3 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800">Impact: {item.impact}</p>
                      )}
                      <div className="mt-4 flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelected(item)
                            try {
                              trackEvent('merch.item.view', { id: item.id })
                            } catch (error) {
                              void error
                            }
                          }}
                          className="w-full rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                        >
                          Customise & add
                        </button>
                      </div>
                    </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-neutral-700">No merch listed yet. Check back soon.</p>
            )}
          </section>
        </div>
      </main>

      <Footer variant="neutral" />

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-neutral-800"
      >
        <ShoppingCartOutlined />
        Bag
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
          {cartCount}
        </span>
      </button>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-6 sm:items-center sm:py-10"
          role="dialog"
          aria-modal="true"
          onClick={() => {
            setSelected(null)
            setSelectedColor(null)
          }}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {activeImage ? (
              <img src={activeImage} alt={selected.name} className="h-56 w-full object-cover sm:h-60" />
            ) : (
              <div className="h-56 w-full bg-neutral-200 sm:h-60" />
            )}
            <div className="flex-1 overflow-y-auto space-y-4 p-6 sm:p-8">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900">{selected.name}</h3>
                  <div className="mt-1 text-sm text-neutral-600">SKU: {selected.id}</div>
                </div>
                <div className="rounded-full bg-amber-100 px-4 py-2 text-base font-semibold text-amber-700">
                  {selected.currency ?? 'KES'} {selected.price.toLocaleString()}
                </div>
              </div>
              <p className="text-sm text-neutral-700 whitespace-pre-line">{selected.description}</p>
              {selected.impact && (
                <div className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Your impact</div>
                  <p className="mt-1">{selected.impact}</p>
                </div>
              )}

              {selected.colors && selected.colors.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Colour</div>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {selected.colors.map((color) => {
                      const isActive = selectedColor?.label === color.label
                      return (
                        <button
                          key={color.label}
                          type="button"
                          onClick={() => {
                            setSelectedColor(color)
                            setOptionError(null)
                          }}
                          className={`relative h-10 w-10 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                            isActive ? 'border-amber-500 ring-amber-200' : 'border-neutral-200 focus:ring-neutral-300'
                          }`}
                          style={{ backgroundColor: color.swatch || '#ffffff' }}
                          title={color.label}
                          aria-pressed={isActive}
                        >
                          <span className="sr-only">{color.label}</span>
                          {isActive && (
                            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-white drop-shadow">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <div className="mt-2 text-xs text-neutral-600">{selectedColor?.label}</div>
                </div>
              )}

              {selected.sizes && selected.sizes.length > 0 && (
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Size</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selected.sizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setSelectedSize(size)
                          setOptionError(null)
                        }}
                        className={`rounded-full border px-3 py-1 text-sm ${
                          selectedSize === size ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-neutral-200 text-neutral-700'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Quantity</div>
                <div className="mt-2 inline-flex items-center gap-3 rounded-full border border-neutral-200 px-3 py-2">
                  <button type="button" onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}>
                    <MinusOutlined />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number.parseInt(event.target.value, 10) || 1))}
                    className="w-16 rounded border border-neutral-200 px-2 py-1 text-center"
                  />
                  <button type="button" onClick={() => setQuantity((prev) => prev + 1)}>
                    <PlusOutlined />
                  </button>
                </div>
              </div>

              {optionError && <p className="text-sm text-red-600">{optionError}</p>}

              {shareLink && (
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Share this drop</div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <button
                      type="button"
                      className="rounded-full border border-neutral-200 px-4 py-2 font-semibold hover:bg-white"
                      onClick={handleCopyShare}
                    >
                      Copy link
                    </button>
                    <a
                      className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-500"
                      href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        try { trackEvent('merch.share.whatsapp', { slug: selected.slug }) } catch (error) { void error }
                      }}
                    >
                      WhatsApp
                    </a>
                    <a
                      className="rounded-full border border-neutral-200 px-4 py-2 font-semibold hover:bg-white"
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(selected.name)}&url=${encodeURIComponent(shareLink)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        try { trackEvent('merch.share.twitter', { slug: selected.slug }) } catch (error) { void error }
                      }}
                    >
                      X / Twitter
                    </a>
                    <button
                      type="button"
                      className="rounded-full border border-neutral-200 px-4 py-2 font-semibold hover:bg-white"
                      onClick={handleNativeShare}
                    >
                      Share…
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={addToCart}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-amber-500"
                >
                  <ShoppingCartOutlined /> Add to bag
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null)
                    setSelectedColor(null)
                  }}
                  className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-6 sm:items-center sm:py-10"
          role="dialog"
          aria-modal="true"
          onClick={() => setCartOpen(false)}
        >
          <div
            className="flex w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold">Your bag</h3>
                <p className="text-sm text-neutral-600">{cartCount} item{cartCount === 1 ? '' : 's'} ready to support the street mission.</p>
              </div>
              <button type="button" onClick={() => setCartOpen(false)} className="text-neutral-500 hover:text-neutral-800">
                <CloseOutlined />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-sm text-neutral-600">Your bag is empty. Add merch to keep the outreach moving.</p>
              ) : (
                cart.map((line) => (
                  <div key={line.key} className="flex items-start gap-4 rounded-2xl border border-neutral-200 p-4">
                    {line.image ? (
                      <img src={line.image} alt={line.name} className="h-20 w-20 rounded-xl object-cover" />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-neutral-100" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold text-neutral-900">{line.name}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            {line.color && (
                              <span className="inline-flex items-center gap-1">
                                <span
                                  className="inline-block h-3 w-3 rounded-full border border-neutral-300"
                                  style={{ backgroundColor: line.color.swatch || '#ffffff' }}
                                />
                                Colour: {line.color.label}
                              </span>
                            )}
                            {line.color && line.size && <span className="mx-1">•</span>}
                            {line.size && <span>Size: {line.size}</span>}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-amber-600">
                          {(line.currency ?? 'KES')} {(line.price * line.quantity).toLocaleString()}
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1">
                          <button type="button" onClick={() => updateQuantity(line.key, -1)}>
                            <MinusOutlined />
                          </button>
                          <span className="text-sm font-medium">{line.quantity}</span>
                          <button type="button" onClick={() => updateQuantity(line.key, 1)}>
                            <PlusOutlined />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(line.key)}
                          className="text-xs text-neutral-500 underline hover:text-neutral-800"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-neutral-200 px-6 py-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Subtotal</span>
                <span>
                  {currency} {cartTotal.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-xs text-neutral-500">We will confirm delivery fees and payment options (M-Pesa, card, or cash) after submission.</p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Continue shopping
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!cart.length) return
                    setCheckoutOpen(true)
                    setCheckoutStatus(null)
                    setCartOpen(false)
                  }}
                  disabled={!cart.length}
                  className="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-500 disabled:opacity-60"
                >
                  Proceed to checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 backdrop-blur-sm px-4 py-6 sm:items-center sm:py-10"
          role="dialog"
          aria-modal="true"
          onClick={() => setCheckoutOpen(false)}
        >
          <div
            className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl max-h-[calc(100vh-2rem)] sm:max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4">
              <h3 className="text-lg font-semibold">Checkout</h3>
              <button type="button" onClick={() => setCheckoutOpen(false)} className="text-neutral-500 hover:text-neutral-800">
                <CloseOutlined />
              </button>
            </div>
            <form onSubmit={handleCheckoutSubmit} className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-6">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Payment instructions</div>
                <p className="mt-2">Kindly complete your M-Pesa payment before submitting the order:</p>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm">
                  <li><span className="font-semibold">Paybill:</span> 880100</li>
                  <li><span className="font-semibold">Account:</span> 321325</li>
                  <li><span className="font-semibold">Amount:</span> match the total shown below.</li>
                </ul>
                  
                  <p className="mt-2 text-xs text-neutral-500">We will verify the payment reference and contact you to arrange delivery. <br/>Confirmation details : NCBA (DAVIS AND EFFIE AND SARAH) </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="text-sm font-medium">
                  Full name
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                    placeholder="Jane Doe"
                  />
                </label>
                <label className="text-sm font-medium">
                  Email
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(event) => setCustomerEmail(event.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                    placeholder="you@example.com"
                  />
                </label>
                <label className="text-sm font-medium">
                  Phone (for delivery updates)
                  <input
                    value={customerPhone}
                    onChange={(event) => setCustomerPhone(event.target.value)}
                    className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                    placeholder="07xx xxx xxx"
                  />
                </label>
                <span className="text-sm font-medium text-neutral-500">
                  Total due
                  <div className="mt-1 rounded-lg bg-neutral-100 px-3 py-2 text-sm font-semibold text-neutral-900">
                    {currency} {cartTotal.toLocaleString()}
                  </div>
                </span>
              </div>
              <label className="text-sm font-medium sm:col-span-2">
                M-Pesa confirmation code
                <input
                  value={paymentReference}
                  onChange={(event) => setPaymentReference(event.target.value.toUpperCase())}
                  required
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900"
                  placeholder="Example: QJT1ABC123"
                />
              </label>
              <label className="block text-sm font-medium">
                Notes for the merch team (sizes per person, preferred delivery slot, etc.)
                <textarea
                  value={customerNotes}
                  onChange={(event) => setCustomerNotes(event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-900"
                  placeholder="Share anything we should know before we call you back."
                />
              </label>

              <div className="rounded-2xl bg-neutral-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Order summary</div>
                <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                  {cart.map((line) => (
                    <li key={line.key} className="flex items-start justify-between gap-3">
                      <span>
                        {line.name} × {line.quantity}
                        <span className="text-neutral-500">
                          {line.color ? ` • ${line.color.label}` : ''}
                          {line.size ? ` • ${line.size}` : ''}
                        </span>
                      </span>
                      <span className="font-medium">
                        {currency} {(line.price * line.quantity).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {checkoutStatus && (
                <div
                  className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm ${
                    checkoutStatus.type === 'ok'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}
                >
                  {checkoutStatus.type === 'ok' ? <CheckCircleOutlined /> : <CloseOutlined />}
                  <span>{checkoutStatus.text}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setCheckoutOpen(false)
                    setCheckoutStatus(null)
                    setCheckoutLoading(false)
                  }}
                  className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checkoutLoading || !cart.length}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-500 disabled:opacity-60"
                >
                  {checkoutLoading ? 'Submitting…' : 'Submit order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
