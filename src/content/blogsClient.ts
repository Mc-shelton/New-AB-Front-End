import type { BlogItem } from './blogs';
import type { SeriesItem } from './series';

let cache: BlogItem[] | null = null;

export async function fetchBlogs(): Promise<BlogItem[]> {
  try {
    const res = await fetch('/data/blogs.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    if (Array.isArray(data)) {
      cache = data as BlogItem[];
      return cache;
    }
  } catch (error) {
    void error;
  }
  // Fallback to bundled list if fetch fails
  const { Blogs } = await import('./blogs');
  cache = Blogs;
  return cache;
}

export async function fetchBlogBySlug(slug: string): Promise<BlogItem | undefined> {
  const list = cache ?? (await fetchBlogs());
  return list.find((b) => b.slug === slug);
}

export async function fetchSeries(): Promise<SeriesItem[]> {
  try {
    const res = await fetch('/data/series.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed');
    const data = await res.json();
    if (Array.isArray(data)) {
      return data as SeriesItem[];
    }
  } catch (error) {
    void error;
  }
  const { Series } = await import('./series');
  return Series;
}
