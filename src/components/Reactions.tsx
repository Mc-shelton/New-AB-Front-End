import { useEffect, useState, type ReactNode } from 'react';
import {
  LikeOutlined,
  LikeFilled,
  HeartOutlined,
  HeartFilled,
  BulbOutlined,
  BulbFilled,
  ThunderboltOutlined,
  ThunderboltFilled,
  SmileOutlined,
  SmileFilled,
} from '@ant-design/icons';
import { getClientId } from '../utils/clientId';

type Counts = Record<string, number>;

const iconClass = 'text-amber-600';

const REACTIONS: {
  key: string;
  label: string;
  render: (active: boolean) => ReactNode;
}[] = [
  { key: 'like', label: 'Like', render: (a) => a ? <LikeFilled className={iconClass} /> : <LikeOutlined className={iconClass} /> },
  { key: 'love', label: 'Love', render: (a) => a ? <HeartFilled className={iconClass} /> : <HeartOutlined className={iconClass} /> },
  { key: 'insightful', label: 'Insightful', render: (a) => a ? <BulbFilled className={iconClass} /> : <BulbOutlined className={iconClass} /> },
  // Using Smile as a gentle stand-in for "Pray"
  { key: 'pray', label: 'Pray', render: (a) => a ? <SmileFilled className={iconClass} /> : <SmileOutlined className={iconClass} /> },
  { key: 'clap', label: 'Clap', render: (a) => a ? <ThunderboltFilled className={iconClass} /> : <ThunderboltOutlined className={iconClass} /> },
];

export default function Reactions({ slug }: { slug: string }) {
  const [counts, setCounts] = useState<Counts>({});
  const [loading, setLoading] = useState(false);
  const [mine, setMine] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/reactions.php?slug=${encodeURIComponent(slug)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d && d.counts) setCounts(d.counts as Counts);
      })
      .catch(() => {});
    // load my reactions for this slug
    try {
      const raw = localStorage.getItem(`reactions:${slug}`);
      if (raw) setMine(new Set(JSON.parse(raw)));
    } catch {}
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const send = async (reaction: string) => {
    if (loading) return;
    setLoading(true);
    const hasIt = mine.has(reaction);
    // Optimistic update
    setCounts((prev) => ({
      ...prev,
      [reaction]: Math.max(0, (prev[reaction] || 0) + (hasIt ? -1 : 1)),
    }));
    // Optimistic toggle locally
    setMine((prev) => {
      const next = new Set(prev);
      if (hasIt) next.delete(reaction); else next.add(reaction);
      try { localStorage.setItem(`reactions:${slug}`, JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
    try {
      const res = await fetch('/api/reactions.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Id': getClientId() },
        body: JSON.stringify({ slug, reaction, undo: hasIt, cid: getClientId() }),
      });
      const data = await res.json();
      if (data && data.counts) setCounts(data.counts as Counts);
    } catch {
      // Revert on failure (best effort)
      setCounts((prev) => ({
        ...prev,
        [reaction]: Math.max(0, (prev[reaction] || 0) + (hasIt ? 1 : -1)),
      }));
      setMine((prev) => {
        const next = new Set(prev);
        if (hasIt) next.add(reaction); else next.delete(reaction);
        try { localStorage.setItem(`reactions:${slug}`, JSON.stringify(Array.from(next))); } catch {}
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 p-3 rounded-xl border border-neutral-200 bg-white">
      <div className="text-sm font-semibold text-neutral-700">Reactions</div>
      <div className="mt-2 flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const active = mine.has(r.key);
          return (
          <button
            key={r.key}
            onClick={() => send(r.key)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm hover:bg-neutral-50 ${active ? 'border-amber-300 bg-amber-50' : 'border-neutral-200'}`}
            aria-label={r.label}
          >
            <span aria-hidden>{r.render(active)}</span>
            <span className="text-neutral-700">{counts[r.key] || 0}</span>
          </button>
        );})}
      </div>
    </div>
  );
}
