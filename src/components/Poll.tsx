import { useEffect, useMemo, useState } from 'react';
import { getClientId } from '../utils/clientId';

type Options = Record<string, number>;

export default function Poll({ id, question, options, showCounts = true, personalOnly = false }: { id: string; question: string; options: string[]; showCounts?: boolean; personalOnly?: boolean }) {
  const [counts, setCounts] = useState<Options>({});
  const [loading, setLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<string, number>>({}); // option -> 0..5
  const total = useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);

  useEffect(() => {
    let cancel = false;
    // load personal selection if any
    try {
      const savedRatings = localStorage.getItem(`poll:${id}:ratings`);
      if (savedRatings) setRatings(JSON.parse(savedRatings));
    } catch {}

    (async () => {
      try {
        if (personalOnly) {
          // no aggregate load; just init zeros
          const init: Options = {}; options.forEach(o => init[o] = 0); setCounts(init);
        } else {
          const res = await fetch(`/api/polls.php?id=${encodeURIComponent(id)}`);
          const data = await res.json();
          if (!cancel && data && data.ok && data.options) {
            setCounts(data.options as Options);
          } else if (!cancel) {
            const init: Options = {}; options.forEach(o => init[o] = 0); setCounts(init);
          }
        }
      } catch {
        const init: Options = {}; options.forEach(o => init[o] = 0); setCounts(init);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [id, personalOnly]);

  const vote = async (opt: string) => {
    setLoading(true);
    try {
      if (personalOnly) {
        // Do not change local bars based on aggregate; still send to server silently
        await fetch('/api/polls.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Client-Id': getClientId() },
          body: JSON.stringify({ id, option: opt, question, initialOptions: options, cid: getClientId() }),
        }).catch(() => {});
      } else {
        // Optimistic aggregate increment
        setCounts((prev) => ({ ...prev, [opt]: (prev[opt] || 0) + 1 }));
        const res = await fetch('/api/polls.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Client-Id': getClientId() },
          body: JSON.stringify({ id, option: opt, question, initialOptions: options, cid: getClientId() }),
        });
        const data = await res.json();
        if (data && data.ok && data.options) setCounts(data.options as Options);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  // Set rating 1..5 for a given option, persist locally, and post to server (as option `opt:rating`)
  const rate = async (opt: string, value: number) => {
    setRatings((prev) => {
      const next = { ...prev, [opt]: value };
      try { localStorage.setItem(`poll:${id}:ratings`, JSON.stringify(next)); } catch {}
      return next;
    });
    // background post; no aggregate shown to user
    try {
      await fetch('/api/polls.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Client-Id': getClientId() },
        body: JSON.stringify({ id, option: `${opt}:${value}`, question, initialOptions: options.map(o => `${o}:1`), cid: getClientId() }),
      });
    } catch {}
  };

  return (
    <div className="mt-8 p-4 rounded-xl border border-neutral-200 bg-white">
      <div className="text-sm font-semibold text-neutral-800">{question}</div>
      <div className="mt-3 space-y-2">
        {options.map((opt) => {
          if (personalOnly) {
            const value = Math.max(0, Math.min(5, ratings[opt] || 0));
            return (
              <div key={opt} className="py-2">
                <div className="text-xs text-neutral-700 mb-1">{opt}</div>
                <div className="flex gap-1" aria-label={`${opt} rating`}>
                  {Array.from({ length: 5 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => rate(opt, n)}
                      className={`h-3 flex-1 rounded ${n <= value ? 'bg-amber-600' : 'bg-neutral-200'} hover:bg-amber-500`}
                      aria-label={`${opt} ${n}/5`}
                    />
                  ))}
                </div>
              </div>
            );
          } else {
            const c = counts[opt] || 0;
            const pct = total > 0 ? Math.round((c / total) * 100) : 0;
            return (
              <button
                key={opt}
                onClick={() => vote(opt)}
                disabled={loading}
                className="w-full text-left"
              >
                <div className="text-xs text-neutral-700 mb-1 flex justify-between">
                  <span>{opt}</span>
                  {showCounts && <span>{c} {total>0?`(${pct}%)`:''}</span>}
                </div>
                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div className="h-2 bg-amber-600" style={{ width: `${pct}%` }} />
                </div>
              </button>
            );
          }
        })}
      </div>
      {showCounts && !personalOnly && total>0 && <div className="mt-2 text-xs text-neutral-600">{total} votes</div>}
    </div>
  );
}
