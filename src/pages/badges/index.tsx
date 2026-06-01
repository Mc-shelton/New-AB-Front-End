import ab_logo from "../../assets/images/ab_logo.png";
import ab_badges from "../../assets/images/ab_badges.jpeg";
import b7a84 from "../../assets/badges/b7a84.png";
import b5d38 from "../../assets/badges/b5d38.png";
import b5692 from "../../assets/badges/b5692.png";
import b2b0a from "../../assets/badges/b2b0a.png";
import b368e from "../../assets/badges/b368e.png";
import b383b from "../../assets/badges/b383b.png";
import b84ed from "../../assets/badges/b84ed.png";
import b8062 from "../../assets/badges/b8062.png";
import b6d56 from "../../assets/badges/b6d56.png";

import {
  CrownOutlined,
  StarFilled,
  StarOutlined,
  FireOutlined,
  TeamOutlined,
  BookOutlined,
  ThunderboltOutlined,
  CameraOutlined,
  TrophyOutlined,
  FlagOutlined,
  DownloadOutlined,
  SearchOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
  CopyOutlined,
  ShareAltOutlined,
  CloseOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import useQuery from "./query";
import Footer from "../../components/Footer";
import { useEffect as useEffectReact } from 'react';
import { trackPage, trackEvent } from '../../utils/track';
// import { sendSubscribeEmail } from "../../utils/sendEmail";

// VALIDATION-LIST VIEW + DETAIL MODAL
// - Mobile-first, matches site theme
// - Search, filter, quick verify
// - "View" modal now shows the actual badge image (replacing progress)

export default function Badges() {
  const [query, setQuery] = useState("");
  const { id } = useQuery();

  const [tab, setTab] = useState<
    "all" | "dev" | "evangelism" | "media" | "community"
  >("all");
  const [ownedOnly, setOwnedOnly] = useState(true);
  // const [subscribeEmail, setSubscribeEmail] = useState("");
  // const [subscribeLoading, setSubscribeLoading] = useState(false);
  // const [subscribeStatus, setSubscribeStatus] = useState<
    // { type: "ok" | "error"; text: string } | null
  // >(null);

  // Simple verifier by Badge ID
  const [verifyId, setVerifyId] = useState("");
  const match = useMemo(
    () =>
      BADGES.find((b) => b.id.toLowerCase() === verifyId.trim().toLowerCase()),
    [verifyId]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BADGES.filter(
      (b) =>
        (tab === "all" || b.category === tab) &&
        (!ownedOnly || b.earned) &&
        (!q ||
          b.title.toLowerCase().includes(q) ||
          b.ownerName.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q))
    );
  }, [query, tab, ownedOnly]);

  // Modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Badge | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (id) {
      setVerifyId(id);
      setQuery(id);
    }
    // return setQuery(t=>'')
  }, []);

  const openModal = (badge: Badge) => {
    setSelected(badge);
    setOpen(true);
    try { trackEvent('badge.view', { id: badge.id }); } catch {}
  };

  const navigate = useNavigate();
  useEffectReact(() => { trackPage('badges'); }, []);
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .modal-enter { opacity: 0; }
        .modal-enter-active { opacity: 1; transition: opacity 150ms; }
      `}</style>

      {/* HERO / HEADER */}
      <header
        className="relative text-white"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.25)), url('${ab_badges}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="w-full bg-gradient-to-b from-black/60 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex items-end justify-between">
            <div
              onClick={() => {
                navigate("/");
              }}
              className="h-24 w-56 sm:h-28 sm:w-64 bg-no-repeat bg-contain bg-center invert brightness-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
              style={{ backgroundImage: `url('${ab_logo}')` }}
              aria-label="AdventBand logo"
              role="img"
            />
            <a
              href="https://play.google.com/store/apps/details?id=com.mcshelton.mobile_v1&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="items-center hidden sm:inline-flex gap-2 rounded-full border border-white/80 px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap hover:bg-white hover:text-black transition"
            >
              <DownloadOutlined />
              <span className="hidden sm:inline">Download App</span>
            </a>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pb-14">
          <p className="opacity-95 text-sm sm:text-base flex items-center gap-2">
            <TrophyOutlined /> Team badges earned by AdventBand volunteers
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-3xl">
            Team Badges
          </h1>
         

          {/* Search / Tabs / Owned filter */}
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 rounded-full bg-white/95 text-black px-4 py-2 w-full sm:w-auto border border-white/70">
                <SearchOutlined className="opacity-70" />
                <input
                  placeholder="Search by title, holder, or badge ID"
                  className="bg-transparent outline-none w-full sm:w-80"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="accent-amber-600 h-4 w-4"
                  checked={ownedOnly}
                  onChange={(e) => setOwnedOnly(e.target.checked)}
                />
                Show only won badges
              </label>
            </div>

            <div className="flex overflow-x-auto hide-scrollbar gap-2 snap-x snap-mandatory">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key as typeof tab)}
                  className={`snap-start shrink-0 rounded-full px-4 py-2 text-sm border transition ${
                    tab === t.key
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white/10 text-white border-white/70 hover:bg-white hover:text-black"
                  }`}
                  type="button"
                >
                  <span className="inline-flex items-center gap-2">
                    <t.icon /> {t.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Verifier */}
          <div className="mt-6 rounded-2xl bg-white/10 backdrop-blur-sm p-4 border border-white/20 max-w-3xl">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <div className="text-sm font-medium">Verify a badge by ID</div>
              <div className="flex items-center gap-2 rounded-full bg-white/95 text-black px-4 py-2 w-full sm:w-auto border border-white/70">
                <input
                  placeholder="Paste badge ID (e.g., b3)"
                  className="bg-transparent outline-none w-full sm:w-64"
                  value={verifyId}
                  onChange={(e) => setVerifyId(e.target.value)}
                />
              </div>
            </div>
            {verifyId.trim() && (
              <div className="mt-3 rounded-xl bg-white/80 text-black p-3 text-sm">
                {match ? (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircleTwoTone twoToneColor="#f59e0b" />
                      <span className="font-semibold">Valid</span>
                      <span>•</span>
                      <span>{match.title}</span>
                      <span className="text-neutral-500">({match.id})</span>
                    </div>
                    <div className="text-xs text-neutral-700">
                      Issued to <b>{match.ownerName}</b> on{" "}
                      <b>{match.issuedAt}</b>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CloseCircleTwoTone twoToneColor="#ef4444" />
                    <span className="font-semibold">Not found</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email Updates CTA */}
          {/* <div className="mt-6 max-w-3xl rounded-2xl border border-white/20 bg-white/10 p-4 sm:p-5 backdrop-blur-sm">
            <div className="space-y-3">
              <div>
                <h3 className="text-lg font-semibold">Stay in the Vespers loop</h3>
                <p className="text-sm text-white/80">Share your email and we’ll send event reminders, badge drops, and ministry highlights from the vespers team.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <label htmlFor="vespers-email" className="sr-only">Email address</label>
                <input
                  id="vespers-email"
                  type="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  className="w-full rounded-full border border-white/40 bg-white/95 px-4 py-3 text-sm text-black placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={subscribeEmail}
                  onChange={(event) => {
                    setSubscribeEmail(event.target.value);
                    if (subscribeStatus) setSubscribeStatus(null);
                  }}
                />
                <button
                  type="button"
                  className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-black shadow-sm transition hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={subscribeLoading || !subscribeEmail.trim()}
                  onClick={async () => {
                    setSubscribeStatus(null);
                    setSubscribeLoading(true);
                    try { trackEvent('badges.subscribe.click'); } catch {}
                    const result = await sendSubscribeEmail(subscribeEmail.trim());
                    setSubscribeLoading(false);
                    if (result.ok) {
                      setSubscribeStatus({ type: 'ok', text: 'Thanks! We\'ll keep you posted on new badges and vespers events.' });
                      setSubscribeEmail('');
                      try { trackEvent('badges.subscribe.success'); } catch {}
                    } else {
                      setSubscribeStatus({ type: 'error', text: 'We could not add you automatically. Please email people@adventband.org.' });
                      try { trackEvent('badges.subscribe.error', { detail: result.detail }); } catch {}
                    }
                  }}
                >
                  {subscribeLoading ? 'Joining…' : 'Get updates'}
                </button>
              </div>
              {subscribeStatus && (
                <div className={`text-xs ${subscribeStatus.type === 'ok' ? 'text-emerald-200' : 'text-rose-200'}`}>
                  {subscribeStatus.text}
                </div>
              )}
            </div>
          </div> */}
        </div>
      </header>

      {/* Badges Grid */}
      <main className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          {filtered.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg font-medium">No badges found</p>
              <p className="text-sm text-neutral-600">
                Try a different search, category, or disable the "won only"
                filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((b) => (
                <BadgeCard key={b.id} badge={b} onView={() => openModal(b)} />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* View Modal */}
      {open && selected && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:my-auto sm:mx-auto sm:max-w-2xl w-full bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh]">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${selected.bg}`}
                >
                  {<selected.icon />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold leading-tight">
                    {selected.title}
                  </h3>
                  <p className="text-xs text-neutral-600">
                    {selected.subtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="p-2 rounded-full hover:bg-neutral-100"
              >
                <CloseOutlined />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="px-5 py-4 overflow-y-auto max-h-[calc(90vh-64px)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-500">Holder</div>
                  <div className="font-medium">{selected.ownerName}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3">
                  <div className="text-xs text-neutral-500">Issued</div>
                  <div className="font-medium">{selected.issuedAt}</div>
                </div>
                <div className="rounded-xl border border-neutral-200 p-3 sm:col-span-2">
                  <div className="text-xs text-neutral-500">Badge ID</div>
                  <div className="flex items-center justify-between gap-2">
                    <code className="font-mono text-sm">{selected.id}</code>
                    <button
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(selected.id);
                        } catch {
                          console.log("catch");
                        }
                      }}
                      className="text-xs inline-flex items-center gap-1 rounded-full px-3 py-1 border hover:bg-neutral-50"
                    >
                      <CopyOutlined /> Copy
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 text-sm text-neutral-700">
                <p>{selected.description}</p>
              </div>

              {/* Badge image replaces progress */}
              <div className="mt-4">
                <div className="text-xs font-medium text-neutral-600 mb-2">
                  Badge
                </div>
                <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-50">
                  <img
                    src={selected.imageSrc}
                    alt={`${selected.title} badge`}
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5">
                <div className="text-xs text-neutral-500">
                  Category:{" "}
                  <span className="font-medium">
                    {LABELS[selected.category]}
                  </span>
                </div>
                {/* Horizontally scrollable actions on small screens */}
                <div className="mt-3 -mx-5 px-5 overflow-x-auto hide-scrollbar">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        // Create a hidden link and click it programmatically
                        const link = document.createElement("a");
                        link.href = selected.imageSrc;
                        link.download = `${selected.title.replace(/\s+/g, "_")}_${
                          selected.id
                        }.png`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        try { trackEvent('badge.download', { id: selected.id }); } catch {}
                      }}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 shrink-0"
                    >
                      <DownloadOutlined /> Download Badge
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const shareLanding = `https://adventband.org/share/${selected.id}.html`;
                        const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                          shareLanding
                        )}`;
                        window.open(linkedinUrl, "_blank", "noopener,noreferrer");
                        try { trackEvent('badge.share.linkedin', { id: selected.id }); } catch {}
                      }}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 shrink-0"
                    >
                      <ShareAltOutlined /> Share
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const link = `${location.origin}/share/${selected.id}.html`;
                        try { await navigator.clipboard.writeText(link); } catch {}
                        try { trackEvent('badge.copy_link', { id: selected.id }); } catch {}
                        alert('Share link copied to clipboard');
                      }}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 shrink-0"
                    >
                      <CopyOutlined /> Copy Link
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const link = `${location.origin}/share/${selected.id}.html`;
                        const wa = `https://wa.me/?text=${encodeURIComponent(selected.title + ' ' + link)}`;
                        window.open(wa, '_blank', 'noopener,noreferrer');
                        try { trackEvent('badge.share.whatsapp', { id: selected.id }); } catch {}
                      }}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 shrink-0"
                    >
                      <ShareAltOutlined /> WhatsApp
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        const key = prompt('Enter admin key to generate share file');
                        if (!key) return;
                        const payload = {
                          id: selected.id,
                          title: selected.title,
                          description: selected.description,
                          ownerName: selected.ownerName,
                          issuedAt: selected.issuedAt,
                          image: `${location.origin}/open/badges/${selected.id}.png`,
                        };
                        try {
                          const res = await fetch('/api/generate_badge_share.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Admin-Key': key },
                            body: JSON.stringify(payload),
                          });
                          const txt = await res.text();
                          if (res.ok) alert('Share file generated'); else alert('Failed: ' + txt);
                        } catch (e) {
                          alert('Failed to generate');
                        }
                      }}
                    className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50 shrink-0"
                    >
                      <ShareAltOutlined /> Gen Share File
                    </button>
                  </div>
                </div>
              </div>

              {/* Info note */}
              {!selected.earned && (
                <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <InfoCircleOutlined className="mt-0.5" />
                  This badge hasn’t been issued to a holder yet. Complete the
                  requirements to earn and verify it.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Badge Card Component
function BadgeCard({ badge, onView }: { badge: Badge; onView: () => void }) {
  const EarnIcon = badge.earned ? StarFilled : StarOutlined;

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(badge.id);
      // no toast lib here; could integrate later
    } catch {
      console.log("catch");
    }
    try { trackEvent('badge.copy_id', { id: badge.id }); } catch {}
  };

  return (
    <div className="group rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full ${badge.bg}`}
          >
            {<badge.icon />}
          </div>
          <div>
            <h3 className="text-base font-semibold leading-tight">
              {badge.title}
            </h3>
            <p className="text-xs text-neutral-600">{badge.subtitle}</p>
          </div>
        </div>
        <EarnIcon
          className={badge.earned ? "text-amber-500" : "text-neutral-300"}
        />
      </div>

      <div className="mt-3 grid grid-cols-1 text-xs text-neutral-600">
        <div>
          Holder:{" "}
          <span className="font-medium text-neutral-800">
            {badge.ownerName}
          </span>
        </div>
        <div>
          Issued:{" "}
          <span className="font-medium text-neutral-800">{badge.issuedAt}</span>
        </div>
        <div>
          Badge ID:{" "}
          <button
            onClick={copyId}
            className="inline-flex items-center gap-1 underline underline-offset-2 hover:text-neutral-800"
          >
            <CopyOutlined className="text-[12px]" />
            {badge.id}
          </button>
        </div>
      </div>

      <div className="mt-3 text-sm text-neutral-700">
        <p>{badge.description}</p>
      </div>

      {/* Badge image replaces progress on card */}
      <div className="mt-4 rounded-xl border border-neutral-200 p-3 bg-neutral-50">
        <img
          src={badge.imageSrc}
          alt={`${badge.title} badge`}
          className="w-full h-auto object-contain rounded-lg"
        />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs text-neutral-500">
          Category:{" "}
          <span className="font-medium">{LABELS[badge.category]}</span>
        </div>
        <button
          type="button"
          onClick={onView}
          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
            badge.earned
              ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              : "bg-amber-600 text-white hover:bg-amber-500"
          }`}
        >
          {badge.earned ? "View" : "Work on this"}
        </button>
      </div>
    </div>
  );
}

// Data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TABS: {
  key: "all" | "dev" | "evangelism" | "media" | "community";
  label: string;
  icon: any;
}[] = [
  { key: "all", label: "All", icon: TrophyOutlined },
  { key: "dev", label: "Developers", icon: ThunderboltOutlined },
  { key: "evangelism", label: "Evangelism", icon: BookOutlined },
  { key: "media", label: "Media", icon: CameraOutlined },
  { key: "community", label: "Community", icon: TeamOutlined },
];

const LABELS = {
  all: "All",
  dev: "Developers",
  evangelism: "Evangelism",
  media: "Media",
  community: "Community",
} as const;

export type Badge = {
  id: string; // public ID (shareable)
  title: string;
  subtitle: string;
  description: string;
  category: keyof typeof LABELS;
  progress: number; // 0 - 1 (kept for potential internal logic)
  earned: boolean; // won? true/false
  ownerName: string;
  issuedAt: string; // formatted date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  bg: string; // tailwind bg class
  imageSrc: string; // image for the badge
};

const BADGES: Badge[] = [
  {
    id: "b6d56",
    title: "Team Lead",
    subtitle: "Articles and Blogs",
    description:
      "Given to members once they move to the Team Lead role",
    category: "community",
    progress: 1,
    earned: true,
    ownerName: "Purity Moraa",
    issuedAt: "Aug 19, 2025",
    icon: CameraOutlined,
    bg: "bg-blue-100 text-blue-700",
    imageSrc: b6d56,
  },
  {
    id: "b7a84",
    title: "Team Lead Founders",
    subtitle: "Lead Generation",
    description:
      "Given to the pioneering leaders who served as our first Team Leads and set the standard.",
    category: "community",
    progress: 1,
    earned: true,
    ownerName: "Debora Misiani",
    issuedAt: "Jul 22, 2025",
    icon: BookOutlined,
    bg: "bg-amber-100 text-amber-700",
    imageSrc: b7a84,
  },
  {
    id: "b5d38",
    title: "Team Lead Founders",
    subtitle: "UI/UX & Designs",
    description:
      "Given to the pioneering leaders who served as our first Team Leads and set the standard.",
    category: "dev",
    progress: 1,
    earned: true,
    ownerName: "Milka Ndeto",
    issuedAt: "Jul 22, 2025",
    icon: ThunderboltOutlined,
    bg: "bg-indigo-100 text-indigo-700",
    imageSrc: b5d38,
  },
  {
    id: "b5692",
    title: "Team Lead Founders",
    subtitle: "Dev Ops",
    description:
      "Given to the pioneering leaders who served as our first Team Leads and set the standard.",
    category: "dev",
    progress: 1,
    earned: true,
    ownerName: "Felix Polo",
    issuedAt: "Jul 22, 2025",
    icon: FlagOutlined,
    bg: "bg-green-100 text-green-700",
    imageSrc: b5692,
  },
  {
    id: "b2b0a",
    title: "Team Lead Founders",
    subtitle: "Front-End",
    description:
      "Given to the pioneering leaders who served as our first Team Leads and set the standard.",
    category: "dev",
    progress: 1,
    earned: true,
    ownerName: "Polland Onderi",
    issuedAt: "Jul 22, 2025",
    icon: CameraOutlined,
    bg: "bg-rose-100 text-rose-700",
    imageSrc: b2b0a,
  },
  {
    id: "b368e",
    title: "Team Lead Founders",
    subtitle: "Articles & Blogs",
    description:
      "Given to the pioneering leaders who served as our first Team Leads and set the standard.",
    category: "community",
    progress: 1,
    earned: true,
    ownerName: "Tevin Morara",
    issuedAt: "Jul 22, 2025",
    icon: TeamOutlined,
    bg: "bg-sky-100 text-sky-700",
    imageSrc: b368e,
  },
  {
    id: "b383b",
    title: "Team Lead coFounders",
    subtitle: "Strategic Commitee",
    description:
      "Given to the pioneering leaders who served as our first Team Leads and set the standard.",
    category: "community",
    progress: 1,
    earned: true,
    ownerName: "Alfred Gachanja",
    issuedAt: "Jul 22, 2025",
    icon: CrownOutlined,
    bg: "bg-yellow-100 text-yellow-700",
    imageSrc: b383b,
  },
  {
    id: "b84ed",
    title: "Team Lead coFounders",
    subtitle: "Strategic Commitee",
    description:
      "Given to the pioneering leaders who served as our first Team Leads and set the standard.",
    category: "dev",
    progress: 1,
    earned: true,
    ownerName: "Denis",
    issuedAt: "Jul 22, 2025",
    icon: FireOutlined,
    bg: "bg-emerald-100 text-emerald-700",
    imageSrc: b84ed,
  },
  {
    id: "b8062",
    title: "Team Lead Founders",
    subtitle: "Back-end",
    description:
      "Given to the pioneering leaders who served as our first Team Leads and set the standard.",
    category: "dev",
    progress: 1,
    earned: true,
    ownerName: "Joseph Oyuko",
    issuedAt: "Jul 22, 2025",
    icon: CameraOutlined,
    bg: "bg-blue-100 text-blue-700",
    imageSrc: b8062,
  },
];
