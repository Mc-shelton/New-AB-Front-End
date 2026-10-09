import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftOutlined,
  LinkOutlined,
  PlayCircleFilled,
  SearchOutlined,
} from "@ant-design/icons";
import abLogo from "../../assets/images/ab_logo.png";
import fallbackCover from "../../assets/images/ab_about.jpeg";
import Footer from "../../components/Footer";
import SubscribeInline from "../../components/SubscribeInline";
import type { BlogItem } from "../../content/blogs";
import type { SeriesItem } from "../../content/series";
import { fetchBlogs, fetchSeries } from "../../content/blogsClient";
import { trackEvent, trackPage } from "../../utils/track";

type BlogTab = "all" | "series" | "single";

export default function BlogsPage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogItem[]>([]);
  const [series, setSeries] = useState<SeriesItem[]>([]);
  const [activeTab, setActiveTab] = useState<BlogTab>("all");
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(9);

  useEffect(() => {
    trackPage("blogs");
    fetchBlogs().then(setBlogs).catch(() => setBlogs([]));
    fetchSeries().then(setSeries).catch(() => setSeries([]));
  }, []);

  useEffect(() => {
    if (activeTab !== "series") setSelectedSeriesId(null);
    setVisibleCount(9);
  }, [activeTab, search, selectedSeriesId]);

  const selectedSeries = series.find((entry) => entry.seriesId === selectedSeriesId);
  const seriesById = useMemo(() => new Map(series.map((entry) => [entry.seriesId, entry])), [series]);

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase();
    const originalOrder = new Map(blogs.map((blog, index) => [blog.slug, index]));
    const filtered = blogs.filter((blog) => {
      if (activeTab === "single" && blog.seriesId) return false;
      if (activeTab === "series" && selectedSeriesId && blog.seriesId !== selectedSeriesId) return false;
      if (!query) return true;
      const seriesTitle = blog.seriesId ? seriesById.get(blog.seriesId)?.title : "";
      return [blog.title, blog.summary, blog.author, ...(blog.tags || []), seriesTitle]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });

    if (selectedSeriesId) {
      return filtered.sort((a, b) =>
        (Number(b.episodeNumber) || 0) - (Number(a.episodeNumber) || 0) ||
        publishedTime(b) - publishedTime(a),
      );
    }
    return filtered.sort(
      (a, b) =>
        publishedTime(b) - publishedTime(a) ||
        (originalOrder.get(b.slug) || 0) - (originalOrder.get(a.slug) || 0),
    );
  }, [activeTab, blogs, search, selectedSeriesId, seriesById]);

  const sortedSeries = useMemo(
    () => [...series].sort((a, b) => seriesTime(b) - seriesTime(a)),
    [series],
  );

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header
        className="relative text-white"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.86), rgba(0,0,0,0.28)), url('${fallbackCover}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="h-24 w-56 bg-contain bg-center bg-no-repeat brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] sm:h-28 sm:w-64"
            style={{ backgroundImage: `url('${abLogo}')` }}
            aria-label="Go to Advent Band home"
          />
          <div className="mt-6 flex items-start gap-3 text-sm sm:text-lg">
            <PlayCircleFilled className="mt-1" />
            <p className="opacity-95">Read warm reflections, mission stories, and ongoing series</p>
          </div>
          <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">Advent Band Blogs</h1>
          <p className="mt-3 max-w-3xl text-sm text-white/90 sm:text-base">The newest stories now appear first, with episodes grouped into collections you can follow.</p>
        </div>
      </header>

      <main className="flex-1 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <section>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-6 overflow-x-auto border-b border-neutral-200 lg:border-0">
                {(["all", "series", "single"] as const).map((tab) => (
                  <button
                    type="button"
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap border-b-2 pb-2 text-sm font-semibold transition-colors ${
                      activeTab === tab
                        ? "border-amber-700 text-amber-700"
                        : "border-transparent text-neutral-500 hover:text-neutral-900"
                    }`}
                  >
                    {tab === "all" ? "Latest" : tab === "single" ? "Standalone" : "Series"}
                  </button>
                ))}
              </div>
              <label className="relative block w-full lg:max-w-sm">
                <span className="sr-only">Search blogs</span>
                <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search stories, authors, or tags"
                  className="w-full rounded-full border border-neutral-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                />
              </label>
            </div>
          </section>

          {activeTab === "series" && !selectedSeriesId ? (
            <section className="mt-8">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Collections</p>
                <h2 className="mt-1 text-2xl font-bold">Choose a series</h2>
              </div>
              <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                {sortedSeries.map((entry) => {
                  const count = blogs.filter((blog) => blog.seriesId === entry.seriesId).length;
                  return (
                    <button
                      type="button"
                      key={entry.seriesId}
                      onClick={() => setSelectedSeriesId(entry.seriesId)}
                      className="group rounded-2xl border border-neutral-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-amber-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <SeriesPile image={entry.image || fallbackCover} title={entry.title} />
                      <h3 className="mt-5 text-xl font-semibold group-hover:text-amber-700">{entry.title}</h3>
                      {entry.summary && <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{entry.summary}</p>}
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-amber-700">{count} {count === 1 ? "episode" : "episodes"}</p>
                    </button>
                  );
                })}
              </div>
              {sortedSeries.length === 0 && <EmptyState text="No series have been published yet." />}
            </section>
          ) : (
            <section className="mt-8">
              {selectedSeries && (
                <div
                  className="mb-8 rounded-2xl bg-neutral-900 bg-cover bg-center p-6 text-white sm:flex sm:min-h-64 sm:items-end sm:justify-between"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.76) 52%, rgba(10,10,10,0.48) 100%), url('${selectedSeries.image || fallbackCover}')`,
                  }}
                >
                  <div>
                    <button type="button" onClick={() => setSelectedSeriesId(null)} className="inline-flex items-center gap-2 text-sm font-semibold text-amber-300">
                      <ArrowLeftOutlined /> All series
                    </button>
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-amber-300">Series</p>
                    <h2 className="mt-1 text-2xl font-bold">{selectedSeries.title}</h2>
                    {selectedSeries.summary && <p className="mt-2 max-w-2xl text-sm text-neutral-300">{selectedSeries.summary}</p>}
                  </div>
                  <div className="mt-4 text-sm text-neutral-300 sm:mt-0">Newest episode first</div>
                </div>
              )}

              {!selectedSeries && (
                <div className="mb-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">{activeTab === "single" ? "Standalone stories" : "Recently published"}</p>
                    <h2 className="mt-1 text-2xl font-bold">{activeTab === "single" ? "Individual blogs" : "Latest from Advent Band"}</h2>
                  </div>
                  <p className="hidden text-sm text-neutral-500 sm:block">Newest first</p>
                </div>
              )}

              <BlogGrid
                blogs={filteredBlogs.slice(0, visibleCount)}
                seriesById={seriesById}
                navigate={navigate}
              />
              {filteredBlogs.length === 0 && <EmptyState text="No blogs match this view." />}
              {visibleCount < filteredBlogs.length && (
                <div className="mt-8 text-center">
                  <button type="button" onClick={() => setVisibleCount((count) => count + 9)} className="rounded-full border border-neutral-300 px-6 py-3 text-sm font-semibold hover:border-amber-500 hover:text-amber-700">Load more</button>
                </div>
              )}
            </section>
          )}

          <SubscribeInline source="blogs:index" />
        </div>
      </main>
      <Footer variant="neutral" />
    </div>
  );
}

function BlogGrid({ blogs, seriesById, navigate }: { blogs: BlogItem[]; seriesById: Map<string, SeriesItem>; navigate: ReturnType<typeof useNavigate> }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {blogs.map((blog) => {
        const parentSeries = blog.seriesId ? seriesById.get(blog.seriesId) : undefined;
        return (
          <article key={blog.slug} className="group overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:border-amber-300 hover:shadow-md">
            <div className="aspect-[16/9] overflow-hidden bg-neutral-100">
              <img
                src={blog.image || parentSeries?.image || fallbackCover}
                alt=""
                onError={(event) => { event.currentTarget.src = fallbackCover; }}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
              />
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-700">
                {parentSeries ? <span>{parentSeries.title} · Episode {blog.episodeNumber || "—"}</span> : <span>Standalone blog</span>}
                {(blog.publishedAt || blog.date) && <><span className="text-neutral-300">•</span><span className="font-medium text-neutral-500">{blog.publishedAt || blog.date}</span></>}
              </div>
              <h3 className="mt-2 text-xl font-semibold leading-snug group-hover:text-amber-700">{blog.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-neutral-700">{blog.summary}</p>
              {(blog.author || blog.tags?.length) && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  {blog.author && <span>By {blog.author}</span>}
                  {blog.tags?.slice(0, 2).map((tag) => <span key={tag} className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">{tag}</span>)}
                </div>
              )}
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" onClick={() => navigate(`/blogs/${blog.slug}`)} className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500">Read on site</button>
                {blog.url && (
                  <a
                    href={blog.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-1 py-2 text-sm font-semibold text-amber-700"
                    onClick={() => {
                      try {
                        trackEvent("blog.open_linkedin", { slug: blog.slug });
                      } catch (error) {
                        void error;
                      }
                    }}
                  >
                    Original <LinkOutlined />
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function SeriesPile({ image, title }: { image: string; title: string }) {
  return (
    <div className="relative aspect-[4/3] w-full">
      <div className="absolute inset-0 rounded-2xl border border-neutral-300 bg-neutral-200" style={{ transform: "rotate(-5deg) translate(-5px, 4px)" }} />
      <div className="absolute inset-0 rounded-2xl border border-neutral-300 bg-neutral-100 shadow-sm" style={{ transform: "rotate(3deg) translate(5px, -3px)" }} />
      <div className="absolute inset-0 overflow-hidden rounded-2xl border border-neutral-200 shadow-md transition-transform duration-200 group-hover:-translate-y-1 group-hover:-rotate-1">
        <img src={image} alt={`${title} cover`} onError={(event) => { event.currentTarget.src = fallbackCover; }} className="h-full w-full object-cover" />
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="mt-6 rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500">{text}</div>;
}

function publishedTime(blog: BlogItem) {
  const timestamp = Date.parse(blog.publishedAt || blog.date || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function seriesTime(series: SeriesItem) {
  const timestamp = Date.parse(series.createdAt || "");
  return Number.isNaN(timestamp) ? 0 : timestamp;
}
