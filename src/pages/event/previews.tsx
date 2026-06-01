import { useMemo, useState } from 'react'
import { TIERS, PosterTemplate, BadgeTemplate } from './index'

export default function EventBadgePreviewStudio() {
  const [tierKey, setTierKey] = useState(TIERS[0]?.key ?? '')
  const [attendeeName, setAttendeeName] = useState('Jane Doe')
  const [shareUrl, setShareUrl] = useState('https://adventband.org/event')
  const [portraitSrc, setPortraitSrc] = useState('')

  const tier = useMemo(() => TIERS.find((t) => t.key === tierKey) ?? TIERS[0], [tierKey])

  if (!tier) {
    return (
      <div className="min-h-screen bg-neutral-100 px-6 py-16">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-10 shadow">
          <h1 className="text-2xl font-bold">Event badge preview</h1>
          <p className="mt-4 text-neutral-600">Add tiers in <code>src/pages/event/index.tsx</code> to begin.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="rounded-3xl bg-white p-8 shadow">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">Design surface</p>
              <h1 className="mt-2 text-3xl font-bold text-neutral-900">Event badge &amp; poster preview</h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                Use this page to tweak the JSX templates used for downloadable badges. Adjust copy, colours, and layout, then refresh the badge order modal when you are done.
              </p>
            </div>
          </div>
          <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-medium text-neutral-700">
              Tier
              <select
                value={tierKey}
                onChange={(event) => setTierKey(event.target.value)}
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                {TIERS.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-neutral-700">
              Attendee name
              <input
                value={attendeeName}
                onChange={(event) => setAttendeeName(event.target.value)}
                placeholder="Jane Doe"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </label>
            <label className="text-sm font-medium text-neutral-700 sm:col-span-2">
              Share URL
              <input
                value={shareUrl}
                onChange={(event) => setShareUrl(event.target.value)}
                placeholder="https://adventband.org/event?tier=t1"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </label>
            <label className="text-sm font-medium text-neutral-700 sm:col-span-2">
              Portrait image URL (optional)
              <input
                value={portraitSrc}
                onChange={(event) => setPortraitSrc(event.target.value)}
                placeholder="https://example.com/portrait.jpg"
                className="mt-1 w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              />
            </label>
          </form>
        </header>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-neutral-800">Poster template (1080 x 1080)</h2>
          <div className="w-full flex justify-center">
            <div
              className="overflow-hidden rounded-[48px] border border-neutral-200 shadow-md shrink-0"
              style={{ width: 1080, height: 1080 }}
            >
              <PosterTemplate
                tier={tier}
                attendeeName={attendeeName}
                shareUrl={shareUrl}
                portraitSrc={portraitSrc || null}
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-neutral-800">Badge template (1080 x 1080)</h2>
          <div className="w-full flex justify-center">
            <div
              className="overflow-hidden rounded-[48px] border border-neutral-200 shadow-md shrink-0"
              style={{ width: 1080, height: 1080 }}
            >
              <BadgeTemplate tier={tier} attendeeName={attendeeName} portraitSrc={portraitSrc || null} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
