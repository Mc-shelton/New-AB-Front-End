import type { BlogItem } from './blogs';

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
  } catch {}
  // Fallback to bundled list if fetch fails
  const { Blogs } = await import('./blogs');
  cache = Blogs;
  return cache;
}

export async function fetchBlogBySlug(slug: string): Promise<BlogItem | undefined> {
  const list = cache ?? (await fetchBlogs());
  return list.find((b) => b.slug === slug);
}

