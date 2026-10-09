import { useEffect, useMemo, useState } from "react";
import Footer from "../../components/Footer";
import type { BlogItem } from "../../content/blogs";
import type { SeriesItem } from "../../content/series";

type EditableBlog = BlogItem & { _tagsDraft?: string };
type Status = { type: "ok" | "error"; text: string } | null;
type AdminView = "posts" | "series";
type PostFilter = "all" | "single" | "series";

export default function BlogsAdmin() {
  const [items, setItems] = useState<EditableBlog[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [view, setView] = useState<AdminView>("posts");
  const [postFilter, setPostFilter] = useState<PostFilter>("all");
  const [search, setSearch] = useState("");
  const [expandedSeries, setExpandedSeries] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/blogs.php", { cache: "no-store" }).then((response) => response.json()),
      fetch("/api/series.php", { cache: "no-store" }).then((response) => response.json()),
    ])
      .then(([blogData, seriesData]) => {
        setItems(Array.isArray(blogData) ? blogData : []);
        setSeries(Array.isArray(seriesData) ? seriesData : []);
      })
      .catch((error) => {
        setItems([]);
        setSeries([]);
        setStatus({ type: "error", text: errorMessage(error) });
      })
      .finally(() => setLoading(false));
  }, []);

  const visiblePosts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => {
        if (postFilter === "single" && item.seriesId) return false;
        if (postFilter === "series" && !item.seriesId) return false;
        if (!query) return true;
        return [item.title, item.summary, item.author, item.slug]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      })
      .sort((a, b) => publishedTime(b.item) - publishedTime(a.item) || b.index - a.index);
  }, [items, postFilter, search]);

  const visibleSeries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return series
      .map((item, index) => ({ item, index }))
      .filter(({ item }) =>
        query
          ? [item.title, item.summary, item.seriesId]
              .filter(Boolean)
              .some((value) => String(value).toLowerCase().includes(query))
          : true,
      )
      .sort((a, b) => seriesTime(b.item) - seriesTime(a.item) || b.index - a.index);
  }, [search, series]);

  const addItem = (seriesId = "") => {
    const now = new Date();
    const episodeNumber = seriesId
      ? Math.max(
          0,
          ...items
            .filter((item) => item.seriesId === seriesId)
            .map((item) => Number(item.episodeNumber) || 0),
        ) + 1
      : undefined;
    const title = seriesId ? `Episode ${episodeNumber}` : "New post";
    setItems((previous) => [
      {
        title,
        summary: "",
        url: "",
        author: "",
        date: now.getFullYear().toString(),
        publishedAt: localIsoDate(now),
        tags: [],
        slug: `${slugify(title)}-${Date.now()}`,
        contentHtml: "",
        seriesId: seriesId || undefined,
        episodeNumber,
      },
      ...previous,
    ]);
    setView("posts");
    setPostFilter(seriesId ? "series" : "all");
    setSearch("");
  };

  const addSeries = () => {
    const title = "New series";
    setSeries((previous) => [
      {
        seriesId: `${slugify(title)}-${Date.now()}`,
        title,
        summary: "",
        image: "",
        createdAt: localIsoDate(new Date()),
      },
      ...previous,
    ]);
    setView("series");
    setSearch("");
    setExpandedSeries(0);
  };

  const save = async () => {
    if (!key.trim()) {
      setStatus({ type: "error", text: "Enter the admin key before saving changes." });
      return;
    }
    setSaving(true);
    setStatus(null);
    try {
      validateContent(items, series);
      const cleanBlogs = items.map(({ _tagsDraft, ...item }) => ({
        ...item,
        seriesId: item.seriesId || undefined,
        episodeNumber: item.seriesId ? Number(item.episodeNumber) || undefined : undefined,
        tags: parseTags(_tagsDraft ?? (item.tags || []).join(", ")),
      }));

      const seriesResponse = await fetch("/api/series.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": key },
        body: JSON.stringify({ items: series }),
      });
      if (!seriesResponse.ok) throw new Error(`Series save failed: ${await seriesResponse.text()}`);

      const blogResponse = await fetch("/api/blogs.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": key },
        body: JSON.stringify({ items: cleanBlogs }),
      });
      if (!blogResponse.ok) throw new Error(`Post save failed: ${await blogResponse.text()}`);

      setItems(cleanBlogs);
      setStatus({ type: "ok", text: `Saved ${cleanBlogs.length} posts and ${series.length} series.` });
    } catch (error) {
      setStatus({ type: "error", text: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  };

  const generateShares = async () => {
    setGenLoading(true);
    setStatus(null);
    try {
      const response = await fetch("/api/generate_blog_share.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": key },
        body: "{}",
      });
      const text = await response.text();
      if (!response.ok) throw new Error(`Generate failed: ${text}`);
      setStatus({ type: "ok", text: `Share pages generated: ${text}` });
    } catch (error) {
      setStatus({ type: "error", text: errorMessage(error) });
    } finally {
      setGenLoading(false);
    }
  };

  const notify = async (slug: string) => {
    setStatus(null);
    try {
      const response = await fetch("/api/notify_new_blog.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Admin-Key": key },
        body: JSON.stringify({ slug }),
      });
      const text = await response.text();
      if (!response.ok) throw new Error(text || "Notify failed");
      setStatus({ type: "ok", text: `Notified subscribers: ${text}` });
    } catch (error) {
      setStatus({ type: "error", text: errorMessage(error) });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 sm:py-12">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Content studio</p>
              <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Blogs Admin</h1>
              <p className="mt-1 text-sm text-neutral-600">Publish standalone posts or organize episodes into reusable series.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <a href="/blogs" className="rounded-full border px-4 py-2 font-semibold hover:bg-white">View blogs</a>
              <a href="/admin/activity" className="rounded-full border px-4 py-2 font-semibold hover:bg-white">Activity</a>
            </div>
          </div>

          <section className="sticky top-0 z-20 mt-6 rounded-2xl border border-neutral-200 bg-white/95 p-4 shadow-sm backdrop-blur">
            <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_auto] lg:items-end">
              <label className="block text-sm font-medium">
                Admin key
                <input type="password" value={key} onChange={(event) => setKey(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-black" placeholder="Enter server admin key" />
              </label>
              <label className="block text-sm font-medium">
                Search {view}
                <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-black" placeholder={`Search ${view}…`} />
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => (view === "posts" ? addItem() : addSeries())} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500">
                  {view === "posts" ? "Add post" : "Add series"}
                </button>
                <button type="button" onClick={save} disabled={saving} className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50">
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
              <div className="flex gap-6">
                {(["posts", "series"] as const).map((tab) => (
                  <button type="button" key={tab} onClick={() => { setView(tab); setSearch(""); }} className={`border-b-2 pb-1 text-sm font-semibold capitalize ${view === tab ? "border-amber-600 text-amber-700" : "border-transparent text-neutral-500"}`}>
                    {tab} ({tab === "posts" ? items.length : series.length})
                  </button>
                ))}
              </div>
              <button type="button" onClick={generateShares} disabled={!key || genLoading} className="text-xs font-semibold text-neutral-600 underline disabled:opacity-50">
                {genLoading ? "Generating…" : "Generate social share files"}
              </button>
            </div>

            {status && <p className={`mt-3 text-sm ${status.type === "ok" ? "text-green-700" : "text-red-700"}`}>{status.text}</p>}
          </section>

          {loading ? (
            <p className="mt-8 text-sm">Loading…</p>
          ) : view === "posts" ? (
            <section className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  {(["all", "single", "series"] as const).map((filter) => (
                    <button type="button" key={filter} onClick={() => setPostFilter(filter)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${postFilter === filter ? "bg-neutral-900 text-white" : "border bg-white text-neutral-600"}`}>
                      {filter}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-neutral-500">Newest content appears first.</p>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {visiblePosts.map(({ item, index }, position) => {
                  const parentSeries = series.find((entry) => entry.seriesId === item.seriesId);
                  return (
                    <article key={`${item.slug}-${index}`} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h2 className="font-semibold">Post {position + 1}</h2>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <span className={`rounded-full px-2 py-1 font-semibold ${parentSeries ? "bg-amber-50 text-amber-700" : "bg-neutral-100"}`}>
                              {parentSeries ? `${parentSeries.title} · Episode ${item.episodeNumber || "—"}` : "Standalone"}
                            </span>
                            <span>{item.publishedAt || item.date || "No date"}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-3 text-sm">
                          <button type="button" onClick={save} disabled={saving} className="font-semibold text-amber-700 disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
                          <button type="button" onClick={() => notify(item.slug)} disabled={!key} className="underline disabled:opacity-40">Notify</button>
                          <button type="button" onClick={() => { if (window.confirm(`Remove “${item.title}”? Save all to make this permanent.`)) { setItems((previous) => previous.filter((_, itemIndex) => itemIndex !== index)); } }} className="text-red-700 underline">Remove</button>
                        </div>
                      </div>
                      <PostEditor item={item} series={series} onChange={(next) => updatePost(index, next)} />
                    </article>
                  );
                })}
                {visiblePosts.length === 0 && <EmptyState text="No posts match this view." />}
              </div>
            </section>
          ) : (
            <section className="mt-6 space-y-3">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm text-neutral-600">Create the series first, then add and number its episodes.</p>
                <p className="text-sm text-neutral-500">Newest series appears first.</p>
              </div>
              {visibleSeries.map(({ item, index }) => {
                const episodeCount = items.filter((post) => post.seriesId === item.seriesId).length;
                const isExpanded = expandedSeries === index;
                return (
                  <article key={`${item.seriesId}-${index}`} className="rounded-2xl border bg-white shadow-sm">
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-neutral-100">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</div>
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold">{item.title || "Untitled series"}</h2>
                          <p className="mt-1 text-sm text-neutral-500">{episodeCount} {episodeCount === 1 ? "episode" : "episodes"} · {item.seriesId}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-3 text-sm">
                        <button type="button" onClick={save} disabled={saving} className="font-semibold text-amber-700 disabled:opacity-50">{saving ? "Saving…" : "Save series"}</button>
                        <button type="button" onClick={() => addItem(item.seriesId)} className="font-semibold text-amber-700">Add episode</button>
                        <button type="button" onClick={() => setExpandedSeries(isExpanded ? null : index)} className="font-semibold text-amber-700">{isExpanded ? "Close" : "Edit"}</button>
                        <button type="button" onClick={() => { if (episodeCount > 0) { setStatus({ type: "error", text: "Move or remove this series’ episodes before deleting it." }); return; } if (window.confirm(`Remove “${item.title}”? Save all to make this permanent.`)) { setSeries((previous) => previous.filter((_, seriesIndex) => seriesIndex !== index)); setExpandedSeries(null); } }} className="text-red-700 underline">Remove</button>
                      </div>
                    </div>
                    {isExpanded && <SeriesEditor item={item} onChange={(next) => updateSeries(index, next)} />}
                  </article>
                );
              })}
              {visibleSeries.length === 0 && <EmptyState text="No series match this view." />}
            </section>
          )}
        </div>
      </main>
      <Footer variant="neutral" />
    </div>
  );

  function updatePost(index: number, next: EditableBlog) {
    setItems((previous) => previous.map((item, itemIndex) => (itemIndex === index ? next : item)));
  }

  function updateSeries(index: number, next: SeriesItem) {
    const previousId = series[index]?.seriesId;
    setSeries((previous) => previous.map((item, seriesIndex) => (seriesIndex === index ? next : item)));
    if (previousId && previousId !== next.seriesId) {
      setItems((previous) => previous.map((item) => item.seriesId === previousId ? { ...item, seriesId: next.seriesId } : item));
    }
  }
}

function PostEditor({ item, series, onChange }: { item: EditableBlog; series: SeriesItem[]; onChange: (item: EditableBlog) => void }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Field label="Title"><input value={item.title} onChange={(event) => onChange({ ...item, title: event.target.value })} className="admin-input" /></Field>
      <Field label="Slug"><input value={item.slug} onChange={(event) => onChange({ ...item, slug: slugify(event.target.value) })} className="admin-input" /></Field>
      <Field label="Series">
        <select value={item.seriesId || ""} onChange={(event) => onChange({ ...item, seriesId: event.target.value || undefined, episodeNumber: event.target.value ? item.episodeNumber || 1 : undefined })} className="admin-input">
          <option value="">Standalone post</option>
          {series.map((entry) => <option key={entry.seriesId} value={entry.seriesId}>{entry.title}</option>)}
        </select>
      </Field>
      <Field label="Episode number"><input type="number" min="1" disabled={!item.seriesId} value={item.episodeNumber || ""} onChange={(event) => onChange({ ...item, episodeNumber: Number(event.target.value) || undefined })} className="admin-input disabled:bg-neutral-100" /></Field>
      <Field label="Author"><input value={item.author || ""} onChange={(event) => onChange({ ...item, author: event.target.value })} className="admin-input" /></Field>
      <Field label="Published date"><input type="date" value={item.publishedAt || ""} onChange={(event) => onChange({ ...item, publishedAt: event.target.value })} className="admin-input" /></Field>
      <Field label="Display date"><input value={item.date || ""} onChange={(event) => onChange({ ...item, date: event.target.value })} className="admin-input" placeholder="e.g. October 2026" /></Field>
      <Field label="Original URL (optional)"><input value={item.url} onChange={(event) => onChange({ ...item, url: event.target.value })} className="admin-input" placeholder="https://…" /></Field>
      <Field label="Image URL"><input value={item.image || ""} onChange={(event) => onChange({ ...item, image: event.target.value })} className="admin-input" placeholder="https://…" /></Field>
      <Field label="Preview">
        <div className="mt-1 h-[74px] overflow-hidden rounded-lg bg-neutral-100">
          {item.image ? <img src={item.image} alt="Preview" className="h-full w-full object-cover" /> : <div className="h-full w-full" />}
        </div>
      </Field>
      <Field label="Background audio YouTube ID"><input value={item.audioVideoId || ""} onChange={(event) => onChange({ ...item, audioVideoId: event.target.value })} className="admin-input" /></Field>
      <Field label="Tags (comma separated)" wide><input value={item._tagsDraft ?? (item.tags || []).join(", ")} onChange={(event) => onChange({ ...item, _tagsDraft: event.target.value })} onBlur={(event) => onChange({ ...item, _tagsDraft: event.target.value, tags: parseTags(event.target.value) })} className="admin-input" placeholder="Devotional, Mission, Culture" /></Field>
      <Field label="Summary" wide><textarea value={item.summary} onChange={(event) => onChange({ ...item, summary: event.target.value })} rows={3} className="admin-input" /></Field>
      <Field label="Content HTML" wide><textarea value={item.contentHtml || ""} onChange={(event) => onChange({ ...item, contentHtml: event.target.value })} rows={12} className="admin-input font-mono text-xs" /></Field>
    </div>
  );
}

function SeriesEditor({ item, onChange }: { item: SeriesItem; onChange: (item: SeriesItem) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 border-t bg-neutral-50/70 p-4 sm:grid-cols-2">
      <Field label="Series title"><input value={item.title} onChange={(event) => onChange({ ...item, title: event.target.value })} className="admin-input" /></Field>
      <Field label="Series ID"><input value={item.seriesId} onChange={(event) => onChange({ ...item, seriesId: slugify(event.target.value) })} className="admin-input" /></Field>
      <Field label="Created date" wide><input type="date" value={item.createdAt || ""} onChange={(event) => onChange({ ...item, createdAt: event.target.value })} className="admin-input" /></Field>
      <Field label="Cover image URL"><input value={item.image || ""} onChange={(event) => onChange({ ...item, image: event.target.value })} className="admin-input" placeholder="https://…" /></Field>
      <Field label="Preview">
        <div className="mt-1 h-32 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
          {item.image ? (
            <img src={item.image} alt={`${item.title || "Series"} cover preview`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-neutral-400">Enter an image URL to preview it</div>
          )}
        </div>
      </Field>
      <Field label="Series summary" wide><textarea value={item.summary || ""} onChange={(event) => onChange({ ...item, summary: event.target.value })} rows={4} className="admin-input" /></Field>
    </div>
  );
}

function Field({ label, wide = false, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return <label className={`block text-xs font-semibold text-neutral-700 ${wide ? "sm:col-span-2" : ""}`}>{label}{children}</label>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-sm text-neutral-500">{text}</div>;
}

function validateContent(items: EditableBlog[], series: SeriesItem[]) {
  const seriesIds = new Set<string>();
  series.forEach((entry) => {
    if (!entry.seriesId.trim() || !entry.title.trim()) throw new Error("Every series needs a title and Series ID.");
    if (seriesIds.has(entry.seriesId)) throw new Error(`Duplicate Series ID: ${entry.seriesId}`);
    seriesIds.add(entry.seriesId);
  });
  const slugs = new Set<string>();
  const episodeKeys = new Set<string>();
  items.forEach((item) => {
    if (!item.title.trim() || !item.slug.trim()) throw new Error("Every post needs a title and slug.");
    if (slugs.has(item.slug)) throw new Error(`Duplicate post slug: ${item.slug}`);
    slugs.add(item.slug);
    if (item.seriesId && !seriesIds.has(item.seriesId)) throw new Error(`“${item.title}” references a missing series.`);
    if (item.seriesId && (!item.episodeNumber || item.episodeNumber < 1)) throw new Error(`“${item.title}” needs a valid episode number.`);
    if (item.seriesId && item.episodeNumber) {
      const episodeKey = `${item.seriesId}:${item.episodeNumber}`;
      if (episodeKeys.has(episodeKey)) throw new Error(`Episode ${item.episodeNumber} is duplicated in one series.`);
      episodeKeys.add(episodeKey);
    }
  });
}

function publishedTime(item: BlogItem) {
  const timestamp = Date.parse(item.publishedAt || item.date || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function seriesTime(item: SeriesItem) {
  const timestamp = Date.parse(item.createdAt || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function localIsoDate(date: Date) {
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseTags(input: string) {
  return input.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}
