import type { MerchItem } from './merch'
import { Merch as fallbackMerch } from './merch'

let cache: MerchItem[] | null = null

export async function fetchMerch(): Promise<MerchItem[]> {
  if (cache) return cache
  try {
    const res = await fetch('/data/merch.json', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load merch')
    const data = await res.json()
    if (Array.isArray(data)) {
      cache = data as MerchItem[]
      return cache
    }
  } catch (error) {
    void error
  }
  cache = fallbackMerch
  return cache
}

export async function fetchMerchBySlug(slug: string): Promise<MerchItem | undefined> {
  const list = cache ?? (await fetchMerch())
  return list.find((item) => item.slug === slug)
}

export function clearMerchCache() {
  cache = null
}
