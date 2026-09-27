import { useNavigate } from "react-router-dom";
import ab_logo from "../../assets/images/ab_logo.png";
import ab_about from "../../assets/images/ab_about.jpeg";
import Footer from "../../components/Footer";
import { useEffect, useMemo, useState } from "react";
import { fetchBlogs, fetchSeries } from "../../content/blogsClient";
import { trackPage, trackEvent } from "../../utils/track";
import {
  LinkOutlined,
  PlayCircleFilled,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import SubscribeInline from "../../components/SubscribeInline";

export default function BlogsPage() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState(
    () => [] as Awaited<ReturnType<typeof fetchBlogs>>,
  );
  const [series, setSeries] = useState(
    () => [] as Awaited<ReturnType<typeof fetchSeries>>,
  );
  const [activeTab, setActiveTab] = useState<"all" | "single" | "series">(
    "all",
  );
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  useEffect(() => {
    trackPage("blogs");
    fetchBlogs()
      .then(setBlogs)
      .catch(() => setBlogs([]));
    fetchSeries()
      .then(setSeries)
      .catch(() => setSeries([]));
  }, []);

  useEffect(() => {
    if (activeTab !== "series") setSelectedSeriesId(null);
  }, [activeTab]);

  const blogsByFilter = useMemo(() => {
    if (activeTab === "single") return blogs.filter((b) => !b.seriesId);
    if (activeTab === "series" && selectedSeriesId)
      return blogs.filter((b) => b.seriesId === selectedSeriesId);
    return blogs; // "all"
  }, [blogs, activeTab, selectedSeriesId]);

  const selectedSeries = series.find((s) => s.seriesId === selectedSeriesId);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header
        className="relative text-white"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.25)), url('${ab_about}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full bg-gradient-to-b from-black/60 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex items-end justify-between">
            <div
              onClick={() => navigate("/")}
              className="h-24 w-56 sm:h-28 sm:w-64 bg-no-repeat bg-contain bg-center invert brightness-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] cursor-pointer"
              style={{ backgroundImage: `url('${ab_logo}')` }}
              aria-label="AdventBand logo"
              role="img"
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pb-14">
          <div className="flex items-start gap-3 text-sm sm:text-lg">
            <PlayCircleFilled className="mt-1" />
            <p className="opacity-95">
              Read warm reflections and mission stories
            </p>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-3xl">
            Advent Band Blogs
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-white/90">
            Advent Band Org articles and blogs — crafted to inspire faith,
            creativity, and mission.
          </p>
        </div>
      </header>

      <main className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex gap-8 border-b border-neutral-200 mb-8">
            {(["all", "series", "single"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 font-medium text-sm uppercase cursor-pointer tracking-wider transition-colors ${
                  activeTab === tab
                    ? "text-amber-700 border-b-2 border-amber-700"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {tab === "all" ? "All" : tab === "single" ? "Single" : "Series"}
              </button>
            ))}
          </div>

          {activeTab === "series" && !selectedSeriesId && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
              {series.map((s) => {
                const count = blogs.filter(
                  (b) => b.seriesId === s.seriesId,
                ).length;
                return (
                  <div
                    key={s.seriesId}
                    onClick={() => setSelectedSeriesId(s.seriesId)}
                    className="group cursor-pointer rounded-b-2xl border-b border-b-neutral-200 bg-white p-6 shadow-[0_2px_2px_-2px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_6px_-4px_rgba(0,0,0,0.1)] transition hover:border-b-amber-300"
                  >
                    <SeriesPile image={s.image || ab_about} />
                    <h3 className="mt-5 text-lg font-semibold group-hover:text-amber-700">
                      {s.title}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-500">
                      {count} {count === 1 ? "blog" : "blogs"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "series" && selectedSeriesId && (
            <div>
              <button
                onClick={() => setSelectedSeriesId(null)}
                className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-amber-700"
              >
                <ArrowLeftOutlined /> All series
              </button>
              {selectedSeries && (
                <h2 className="mb-8 text-2xl font-semibold">
                  {selectedSeries.title}
                </h2>
              )}
              <BlogGrid blogs={blogsByFilter} navigate={navigate} />
            </div>
          )}

          {activeTab !== "series" && (
            <BlogGrid blogs={blogsByFilter} navigate={navigate} />
          )}

          <SubscribeInline source="blogs:index" />
        </div>
      </main>

      <Footer variant="neutral" />
    </div>
  );
}

function BlogGrid({blogs, navigate}: {blogs: any[]; navigate: ReturnType<typeof useNavigate>;}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {blogs.map((b) => (
        <div
          key={b.url}
          className="group cursor-pointer rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm hover:shadow-md transition hover:border-amber-300"
        >
          <div className="-mx-6 -mt-6 mb-4">
            <div className="aspect-[16/9] overflow-hidden rounded-t-2xl bg-neutral-100">
              <img
                src={b.image || ab_about}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="text-xs text-amber-700 font-medium">
            Blog • LinkedIn
          </div>
          <h3 className="mt-2 text-xl font-semibold leading-snug group-hover:text-amber-700">
            {b.title}
          </h3>
          <p className="mt-2 text-sm text-neutral-700">{b.summary}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
            {b.author && <span>By {b.author}</span>}
            {b.author && b.date && <span>•</span>}
            {b.date && <span>{b.date}</span>}
          </div>
          {b.tags?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {b.tags.map((t: string) => (
                <span
                  key={t}
                  className="rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 text-xs"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <button
              onClick={() => navigate(`/blogs/${b.slug}`)}
              className="rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-500"
            >
              Read on site
            </button>
            <a
              href={b.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700"
              onClick={() => {
                try {
                  trackEvent("blog.open_linkedin", { slug: b.slug });
                } catch {}
              }}
            >
              Read on LinkedIn <LinkOutlined />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

function SeriesPile({ image }: { image: string }) {
  return (
    <div className="relative aspect-[4/3] w-full">
      <div
        className="absolute inset-0 rounded-2xl bg-neutral-200 border border-neutral-300"
        style={{ transform: "rotate(-6deg) translate(-6px, 4px)" }}
      />
      <div
        className="absolute inset-0 rounded-2xl bg-neutral-100 border border-neutral-300 shadow-sm"
        style={{ transform: "rotate(4deg) translate(5px, -3px)" }}
      />
      <div className="absolute inset-0 rounded-2xl overflow-hidden shadow-md border border-neutral-200 transition-transform duration-200 group-hover:-rotate-1 group-hover:-translate-y-1">
        <img src={image} alt="" className="w-full h-full object-cover" />
      </div>
    </div>
  );
}
