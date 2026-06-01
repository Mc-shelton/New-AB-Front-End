import { useEffect, useState } from 'react';
import { fetchBlogs } from '../content/blogsClient';
import ab_about from '../assets/images/ab_about.jpeg';
import { useNavigate } from 'react-router-dom';

type Item = Awaited<ReturnType<typeof fetchBlogs>>[number];

export default function RelatedPosts({ currentSlug, tags = [] as string[] }: { currentSlug: string; tags?: string[] }) {
  const [items, setItems] = useState<Item[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    fetchBlogs().then((all) => {
      const pool = all.filter((b) => b.slug !== currentSlug);
      const scored = pool.map((b) => ({
        item: b,
        score: (b.tags || []).reduce((acc, t) => acc + (tags.includes(t) ? 1 : 0), 0),
      }));
      scored.sort((a, b) => b.score - a.score);
      setItems(scored.filter(s=>s.score>0).slice(0, 3).map((s) => s.item));
    }).catch(() => setItems([]));
  }, [currentSlug, JSON.stringify(tags)]);

  if (!items.length) return null;

  return (
    <div className="mt-10">
      <h3 className="text-lg font-semibold">Related posts</h3>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((b) => (
          <div key={b.slug} className="rounded-xl border p-3 hover:border-amber-300 cursor-pointer" onClick={()=>navigate(`/blogs/${b.slug}`)}>
            <div className="aspect-[16/9] overflow-hidden rounded-lg bg-neutral-100">
              <img src={(b as any).image || ab_about} alt="Cover" className="w-full h-full object-cover" />
            </div>
            <div className="mt-2 text-sm font-semibold">{b.title}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

