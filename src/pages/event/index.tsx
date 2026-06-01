import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import ab_logo from "../../assets/images/ab_logo.png";
import jc_logo from "../../assets/images/jc_logo.png";
// import foc_logo from "../../assets/images/foc.png";
import sp_logo from "../../assets/images/sparx.png";
import kcc_logo from "../../assets/images/kcc_logo.png";
import cist_logo from "../../assets/images/cist.png";
import imara_logo from "../../assets/images/IMARAblack.png";
// import cist__logo from "../../assets/images/cist__.png";
import ab_badges from "../../assets/images/ab_badges.jpeg";
import {
  QrcodeOutlined,
  SmileOutlined,
  HeartOutlined,
  TeamOutlined,
  CrownOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import Footer from "../../components/Footer";
import { trackEvent, trackPage } from "../../utils/track";
import { sendSubscribeEmail } from "../../utils/sendEmail";
import QRCode from "react-qr-code";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

type Tier = {
  key: string;
  name: string;
  subtitle: string;
  amount: number;
  color: string;
  impact: string;
  icon: ReactNode;
};

export const TIERS: Tier[] = [
  {
    key: "t1",
    name: "Friends Badge",
    subtitle: "Kids/Students • Tier 5",
    amount: 300,
    color: "from-emerald-500 to-emerald-700",
    impact: "Helps print kids study sheets",
    icon: <SmileOutlined />,
  },
  {
    key: "t2",
    name: "Helping Hand",
    subtitle: "Kids/Students • Tier 4",
    amount: 500,
    color: "from-sky-500 to-sky-700",
    impact: "Supports one child’s workbook",
    icon: <HeartOutlined />,
  },
  {
    key: "t3",
    name: "Big Friend",
    subtitle: "Adults • Tier 3",
    amount: 1300,
    color: "from-amber-500 to-amber-700",
    impact: "Feeds 2–3 kids at an outreach",
    icon: <TeamOutlined />,
  },
  {
    key: "t4",
    name: "Partner",
    subtitle: "Adults • Tier 2",
    amount: 2100,
    color: "from-fuchsia-500 to-fuchsia-700",
    impact: "Feeds 4–5 kids and supplies",
    icon: <UsergroupAddOutlined />,
  },
  {
    key: "t5",
    name: "Champion",
    subtitle: "Adults • Tier 1",
    amount: 3400,
    color: "from-indigo-600 to-indigo-800",
    impact: "Feeds 5+ kids; prestige perks",
    icon: <TrophyOutlined />,
  },
];

const TIER_PALETTE: Record<
  string,
  { primary: string; secondary: string; accent: string; text: string }
> = {
  t1: {
    primary: "#34D399",
    secondary: "#059669",
    accent: "#ECFDF5",
    text: "#065F46",
  },
  t2: {
    primary: "#38BDF8",
    secondary: "#0EA5E9",
    accent: "#E0F2FE",
    text: "#0B1B3B",
  },
  t3: {
    primary: "#F59E0B",
    secondary: "#D97706",
    accent: "#FEF3C7",
    text: "#78350F",
  },
  t4: {
    primary: "#D946EF",
    secondary: "#C026D3",
    accent: "#FCE7F3",
    text: "#701A75",
  },
  t5: {
    primary: "#6366F1",
    secondary: "#4338CA",
    accent: "#E0E7FF",
    text: "#1E1B4B",
  },
};

const FALLBACK_PALETTE = {
  primary: "#6366F1",
  secondary: "#4338CA",
  accent: "#E0E7FF",
  text: "#1E1B4B",
};

function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  if (!parts.length) return "";
  const [first, second] = parts;
  return (first?.[0] ?? "").toUpperCase() + (second?.[0] ?? "").toUpperCase();
}

export default function EventBadges() {
  const navigate = useNavigate();
  const [tier, setTier] = useState<Tier | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [notes, setNotes] = useState("");
  const [wantHardCopy, setWantHardCopy] = useState(false);
  const [working, setWorking] = useState(false);
  const [status, setStatus] = useState<null | {
    type: "ok" | "error";
    text: string;
  }>(null);
  const [orderMessage, setOrderMessage] = useState<null | {
    type: "ok" | "error";
    text: string;
    orderId?: string;
  }>(null);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<null | {
    type: "ok" | "error";
    text: string;
  }>(null);
  const [portraitObjectUrl, setPortraitObjectUrl] = useState<string | null>(
    null
  );
  const [portraitSource, setPortraitSource] = useState<string | null>(null);
  const [portraitData, setPortraitData] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [portraitError, setPortraitError] = useState<string | null>(null);
  useEffect(() => {
    trackPage("event.badges");
  }, []);

  useEffect(
    () => () => {
      if (portraitObjectUrl) URL.revokeObjectURL(portraitObjectUrl);
    },
    [portraitObjectUrl]
  );

  const shareUrl = useMemo(() => {
    const base = location.origin + "/event";
    return `${base}?utm_source=share&utm_medium=badge&utm_campaign=event_${
      tier?.key || ""
    }`;
  }, [tier]);

  const handlePortraitFile = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPortraitError("Please choose an image file (PNG, JPG, or WEBP).");
      return;
    }
    const maxSize = 6 * 1024 * 1024;
    if (file.size > maxSize) {
      setPortraitError("Please choose an image smaller than 6MB.");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setPortraitError(null);
    setPortraitObjectUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return objectUrl;
    });
    setPortraitSource(objectUrl);
    setPortraitData(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1.2);
    setCroppedAreaPixels(null);
  }, []);

  const resetPortrait = useCallback(() => {
    setPortraitData(null);
    setPortraitSource(null);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1.2);
    setPortraitError(null);
    setPortraitObjectUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
  }, []);

  const onPortraitInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      if (!file) return;
      handlePortraitFile(file);
      event.target.value = "";
    },
    [handlePortraitFile]
  );

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const generatePortraitData = useCallback(async () => {
    if (portraitData) return portraitData;
    if (!portraitSource) return null;
    try {
      const cropped = await cropImageToDataUrl(
        portraitSource,
        croppedAreaPixels
      );
      if (cropped) {
        setPortraitData(cropped);
        setPortraitError(null);
        return cropped;
      }
      return null;
    } catch (error) {
      console.error("Portrait crop failed", error);
      setPortraitError("Could not process portrait. Try a different image.");
      return null;
    }
  }, [portraitData, portraitSource, croppedAreaPixels]);

  const applyPortrait = useCallback(async () => {
    const data = await generatePortraitData();
    if (!data) {
      setPortraitError(
        "Could not process portrait. Try adjusting the crop or using a different image."
      );
    } else {
      setPortraitError(null);
    }
  }, [generatePortraitData]);

  const handleCloseOrderModal = useCallback(() => {
    resetPortrait();
    setTier(null);
  }, [resetPortrait]);

  async function handleSubmitOrder() {
    if (!tier) return;
    if (!name.trim()) {
      setOrderMessage({ type: "error", text: "Please enter your full name." });
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setOrderMessage({
        type: "error",
        text: "Please provide a valid email address.",
      });
      return;
    }
    if (!paymentRef.trim()) {
      setOrderMessage({
        type: "error",
        text: "Payment confirmation code is required.",
      });
      return;
    }

    try {
      setWorking(true);
      setOrderMessage(null);
      const portraitDataUrl = await generatePortraitData();

      const payload = {
        tierKey: tier.key,
        tierName: tier.name,
        amount: tier.amount,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        paymentReference: paymentRef.trim(),
        hardCopy: wantHardCopy,
        notes: notes.trim(),
        portraitDataUrl,
        shareUrl,
      };

      const res = await fetch("/api/badge_orders.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Could not submit confirmation.");
      }

      setOrderMessage({
        type: "ok",
        text: "Thank you! Your confirmation is pending approval. We will email the badge kit once verified.",
        orderId: data.id,
      });
      try {
        trackEvent("event.badge_order.submitted", { tier: tier.key });
      } catch {}
      setStatus(null);
      setName("");
      setEmail("");
      setPhone("");
      setPaymentRef("");
      setNotes("");
      setWantHardCopy(false);
      resetPortrait();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong while submitting.";
      setOrderMessage({ type: "error", text: message });
      setStatus({ type: "error", text: message });
    } finally {
      setWorking(false);
    }
  }

  const handleShareInvite = async () => {
    try {
      trackEvent("event.subscribe.share_click");
    } catch {}
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Join Advent Band Vespers & Badges",
          text: "Partner with Advent Band — see the vespers event and badge program details.",
          url: shareUrl,
        });
        try {
          trackEvent("event.subscribe.share_success");
        } catch {}
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setSubscribeStatus({
          type: "ok",
          text: "Invite link copied! Share it with your circles.",
        });
        try {
          trackEvent("event.subscribe.share_copied");
        } catch {}
        return;
      }
    } catch {
      // fall through
    }
    setSubscribeStatus({
      type: "error",
      text: "We could not copy the invite link. Share adventband.org/event manually.",
    });
    try {
      trackEvent("event.subscribe.share_failed");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <style>{`
        @keyframes floatY2 { 0% { transform: translateY(0) } 50% { transform: translateY(-4px) } 100% { transform: translateY(0) } }
        .badge-card:hover .badge-crest { transform: translateY(-2px); }
        .badge-crest { transition: transform .2s ease; }
        .pattern-diag { background-image: linear-gradient(135deg, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0) 25%), linear-gradient(225deg, rgba(0,0,0,0.03) 25%, rgba(0,0,0,0) 25%); background-size: 14px 14px; background-position: 0 0, 7px 7px; }
      `}</style>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
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
              onClick={() => navigate("/")}
              className="h-24 w-56 sm:h-28 sm:w-64 bg-no-repeat bg-contain bg-center invert brightness-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
              style={{ backgroundImage: `url('${ab_logo}')` }}
              aria-label="AdventBand logo"
              role="img"
            />
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pb-14">
          <p className="opacity-95 text-sm sm:text-base flex items-center gap-2">
            <QrcodeOutlined /> Event • Community Support Badges
          </p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-3xl">
            Join the cause — earn and share your badge
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base opacity-95">
            Five gamified tiers designed to compound awareness. Download a
            personalized badge with a scannable QR and share it on socials.
            Hard-copy badges available at cost for select tiers.
          </p>
          <section className="mt-6 rounded-3xl border border-white/25 bg-white/10 p-5 sm:p-7 backdrop-blur-sm">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-center">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs uppercase tracking-wide text-white/85">
                  <QrcodeOutlined /> Vespers &amp; badge brief
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
                  Partner with the event before each badge drop
                </h2>
                <p className="text-sm sm:text-base text-white/80 max-w-2xl">
                  We highlight where help is needed most — serving on-site,
                  funding logistics, or mobilizing your community to worship
                  with us.
                </p>
                <ul className="space-y-2 text-sm text-white/75">
                  <li className="inline-flex items-start gap-2">
                    <CheckCircleOutlined className="mt-1 text-amber-400" />{" "}
                    <span>
                      <span className="font-semibold text-white">
                        Individuals
                      </span>{" "}
                      — sponsor a tier, join the volunteer crew, or share the
                      badge toolkit.
                    </span>
                  </li>
                  <li className="inline-flex items-start gap-2">
                    <CheckCircleOutlined className="mt-1 text-amber-400" />{" "}
                    <span>
                      <span className="font-semibold text-white">
                        Businesses &amp; teams
                      </span>{" "}
                      — underwrite equipment, transport, or meals for street
                      families.
                    </span>
                  </li>
                  <li className="inline-flex items-start gap-2">
                    <CheckCircleOutlined className="mt-1 text-amber-400" />{" "}
                    <span>
                      <span className="font-semibold text-white">
                        Churches &amp; ministries
                      </span>{" "}
                      — lead worship segments, preach, or coordinate
                      discipleship follow-up.
                    </span>
                  </li>
                </ul>
              </div>
              <div className="w-full rounded-2xl border border-white/20 bg-white/95 p-5 text-neutral-900 shadow-lg">
                <h3 className="text-lg font-semibold">Join the update list</h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Drop your email and we’ll loop you into the next activation
                  call.
                </p>
                <label htmlFor="event-subscribe" className="sr-only">
                  Email address
                </label>
                <input
                  id="event-subscribe"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-4 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={subscribeEmail}
                  onChange={(event) => {
                    setSubscribeEmail(event.target.value);
                    if (subscribeStatus) setSubscribeStatus(null);
                  }}
                />
                <div className="mt-4 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    className="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={subscribeLoading || !subscribeEmail.trim()}
                    onClick={async () => {
                      if (!subscribeEmail.trim()) return;
                      setSubscribeStatus(null);
                      setSubscribeLoading(true);
                      try {
                        trackEvent("event.subscribe.click");
                      } catch {}
                      const result = await sendSubscribeEmail(
                        subscribeEmail.trim()
                      );
                      setSubscribeLoading(false);
                      if (result.ok) {
                        setSubscribeStatus({
                          type: "ok",
                          text: "Thanks! You are now on the vespers update list.",
                        });
                        setSubscribeEmail("");
                        try {
                          trackEvent("event.subscribe.success");
                        } catch {}
                      } else {
                        setSubscribeStatus({
                          type: "error",
                          text: "Could not subscribe automatically. Please email people@adventband.org.",
                        });
                        try {
                          trackEvent("event.subscribe.error", {
                            detail: result.detail,
                          });
                        } catch {}
                      }
                    }}
                  >
                    {subscribeLoading ? "Subscribing…" : "Send me updates"}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                    onClick={handleShareInvite}
                  >
                    Share invite
                  </button>
                </div>
                {subscribeStatus && (
                  <div
                    className={`mt-3 text-xs ${
                      subscribeStatus.type === "ok"
                        ? "text-emerald-600"
                        : "text-rose-500"
                    }`}
                    aria-live="polite"
                  >
                    {subscribeStatus.text}
                  </div>
                )}
                <p className="mt-3 text-xs text-neutral-500">
                  We respect your inbox. Unsubscribe anytime.
                </p>
              </div>
            </div>
          </section>
        </div>
      </header>

      <main className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TIERS.map((t) => (
              <div
                key={t.key}
                className="badge-card relative rounded-2xl border border-neutral-200 overflow-hidden bg-white"
              >
                <div className="p-4 flex items-start gap-4">
                  <div className="relative badge-crest">
                    <div
                      className={`absolute -inset-1 rounded-full opacity-30 blur-xl bg-gradient-to-br ${t.color} animate-[floatY2_6s_ease-in-out_infinite]`}
                    />
                    <div
                      className={`relative h-16 w-16 rounded-full p-[2px] bg-gradient-to-br ${t.color} shadow`}
                    >
                      <div className="h-full w-full rounded-full bg-white flex items-center justify-center text-2xl text-neutral-900">
                        {t.icon}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-lg font-semibold leading-tight">
                      {t.name}
                    </div>
                    <div className="text-sm text-neutral-600">{t.subtitle}</div>
                    <div className="mt-2 text-2xl font-extrabold">
                      KES {t.amount.toLocaleString()}
                    </div>
                    <div className="mt-1 text-sm text-neutral-700">
                      {t.impact}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      {["t1", "t2"].includes(t.key) ? (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                          <SmileOutlined /> Kids/Students
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                          <CrownOutlined /> Prestige
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                        <QrcodeOutlined /> QR Badge
                      </span>
                    </div>
                  </div>
                </div>
                <div className="pattern-diag h-px w-full" />
                <div className="p-4 pt-3">
                  <button
                    onClick={() => {
                      resetPortrait();
                      setTier(t);
                    }}
                    className="rounded-full border px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                  >
                    Support &amp; confirm
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-neutral-200 p-4">
            <div className="font-semibold">Tier targets</div>
            <p className="text-sm text-neutral-700 mt-1">
              Goal counts: 34, 21, 13, 8, 5 — meeting these doubles the raise
              target for the evening.
            </p>
          </div>
        </div>
      </main>

      <Footer variant="neutral" />

      {tier && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:items-center sm:p-6"
          onClick={handleCloseOrderModal}
        >
          <div
            className="w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto rounded-3xl bg-white text-neutral-900 p-6 shadow-2xl sm:max-h-[90vh] sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">
                  Confirm your {tier.name}
                </h3>
                <p className="mt-1 text-sm text-neutral-600">
                  Share your payment reference and contact. We will email the
                  badge pack once the admin approves it.
                </p>
              </div>
              <button
                onClick={handleCloseOrderModal}
                className="text-sm text-neutral-500 hover:text-neutral-800"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl bg-neutral-100 p-4 text-sm text-neutral-700">
                <div className="font-semibold text-neutral-900">
                  Payment summary
                </div>
                <ul className="mt-2 space-y-1">
                  <li>Tier: {tier.name}</li>
                  <li>Amount: KES {tier.amount.toLocaleString()}</li>
                  {/* <li>Paybill: <span className="font-semibold">880100</span> • Account: <span className="font-semibold">VESPER-{tier.key.toUpperCase()}</span></li> */}
                  <li>
                    Paybill: <span className="font-semibold">880100</span> •
                    Account: <span className="font-semibold">321325#Badge</span>
                  </li>
                </ul>
                <p className="mt-3 text-xs text-neutral-600">
                  Complete the payment above then submit the confirmation code
                  below.
                  <br/>
                  Confirmation details : NCBA (DAVIS AND EFFIE AND SARAH)
                </p>
              </div>

              <form
                className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmitOrder();
                }}
              >
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide">
                    Full name
                  </label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase tracking-wide">
                    Phone (optional)
                  </label>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="07xx xxx xxx"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide">
                    Payment confirmation code
                  </label>
                  <input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    required
                    className="mt-1 w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="M-Pesa reference"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-2xl border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Share any context for the admin team"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium uppercase tracking-wide">
                    Portrait (optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPortraitInputChange}
                    className="mt-1 w-full rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {portraitError && (
                    <p className="mt-2 text-xs text-rose-500">
                      {portraitError}
                    </p>
                  )}
                  {portraitSource && (
                    <div className="mt-4 space-y-3">
                      <div className="relative h-64 overflow-hidden rounded-2xl bg-neutral-200/60">
                        <Cropper
                          image={portraitSource}
                          crop={crop}
                          zoom={zoom}
                          aspect={1}
                          cropShape="round"
                          showGrid={false}
                          onCropChange={setCrop}
                          onZoomChange={setZoom}
                          onCropComplete={onCropComplete}
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-xs text-neutral-600">
                          Zoom
                          <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={zoom}
                            onChange={(event) =>
                              setZoom(Number(event.target.value))
                            }
                            className="h-1 w-36 accent-amber-500"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={applyPortrait}
                          className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-neutral-800"
                        >
                          Use this portrait
                        </button>
                        <button
                          type="button"
                          onClick={resetPortrait}
                          className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                        >
                          Remove portrait
                        </button>
                      </div>
                    </div>
                  )}
                  {portraitData && (
                    <div className="mt-3 flex items-center gap-3 text-xs text-neutral-600">
                      <div className="h-14 w-14 overflow-hidden rounded-full border border-neutral-200 shadow">
                        <img
                          src={portraitData}
                          alt="Portrait preview"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <span>
                        Portrait ready — we will include it in your badge kit.
                      </span>
                    </div>
                  )}
                </div>
                <label className="sm:col-span-2 inline-flex items-start gap-3 text-sm text-neutral-700">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={wantHardCopy}
                    onChange={(e) => setWantHardCopy(e.target.checked)}
                  />
                  <span>
                    Request a hard-copy badge (complimentary for tiers KES 1,300
                    and above — we will coordinate pick-up or delivery).
                  </span>
                </label>
                <div className="sm:col-span-2 flex flex-col sm:flex-row gap-2 mt-2">
                  <button
                    type="submit"
                    disabled={working}
                    className="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow transition hover:bg-amber-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {working ? "Submitting…" : "Submit confirmation"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseOrderModal}
                    className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              {orderMessage && (
                <div
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    orderMessage.type === "ok"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700"
                  }`}
                >
                  <p>{orderMessage.text}</p>
                  {orderMessage.orderId && (
                    <p className="mt-1 text-xs opacity-80">
                      Reference: {orderMessage.orderId}
                    </p>
                  )}
                </div>
              )}

              {status && status.type === "error" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {status.text}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

async function cropImageToDataUrl(
  imageSrc: string,
  crop: Area | null
): Promise<string | null> {
  const image = await loadImage(imageSrc);
  const effectiveCrop = crop ?? {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  };
  const sx = Math.max(0, Math.round(effectiveCrop.x));
  const sy = Math.max(0, Math.round(effectiveCrop.y));
  const sWidth = Math.max(1, Math.round(effectiveCrop.width));
  const sHeight = Math.max(1, Math.round(effectiveCrop.height));
  const dx = Math.min(sx, Math.max(0, image.width - sWidth));
  const dy = Math.min(sy, Math.max(0, image.height - sHeight));
  const finalWidth = Math.min(image.width - dx, sWidth);
  const finalHeight = Math.min(image.height - dy, sHeight);

  const canvas = document.createElement("canvas");
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    image,
    dx,
    dy,
    finalWidth,
    finalHeight,
    0,
    0,
    finalWidth,
    finalHeight
  );
  return canvas.toDataURL("image/png");
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.crossOrigin = "anonymous";
    image.src = src;
  });
}

type PosterTemplateProps = {
  tier: Tier;
  attendeeName: string;
  shareUrl: string;
  portraitSrc?: string | null;
  attendeeTag?: string;
};


export function PosterTemplate({
  tier,
  attendeeName,
  shareUrl,
  portraitSrc,
  attendeeTag,
}: PosterTemplateProps) {
  const palette = TIER_PALETTE[tier.key] ?? FALLBACK_PALETTE;
  const initials = getInitials(attendeeName || tier.name);
  const hasPortrait = Boolean(portraitSrc);
  const shadowColor = hasPortrait
    ? `${palette.accent}aa`
    : "rgba(31,41,55,0.35)";

  return (
    <div
      className="relative h-[1080px] w-[1080px] overflow-hidden rounded-[48px] bg-white"
      style={{ fontFamily: '"Inter", "Helvetica Neue", system-ui, sans-serif' }}
    >
      <div
        className="h-[100%] w-[100%] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('${cist_logo}')`,
          // backgroundSize:'cover'
          backgroundSize: "100%",
          backgroundPosition: '1px 248px',
          // zIndex:0
        }}
      ></div>

      {/* <div
        className="absolute border inset-0"
        style={{ background: `linear-gradient(140deg, ${palette.primary}, ${palette.secondary})` }}
      /> */}
      <div className="absolute -right-36 top-40 h-[760px] w-[760px] rounded-full bg-white/20" style={{
        zIndex:1
      }}/>
      <div className="absolute bottom-8 left-8 right-8 top-8 flex flex-col justify-between" style={{
        zIndex: 2,
      }}>
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-[600px] space-y-6">
            <span className="inline-flex items-center gap-3 rounded-full bg-gray-100 px-6 py-2.5 text-xl font-semibold tracking-wide text-gray-80">
              <QrcodeOutlined /> I'll be Attending
            </span>
            <div className="space-y-4">
              <h1 className="text-[3.25rem] font-extrabold leading-tight">
                {tier.name}
              </h1>
              <p className="text-xl mt-[-14px]">{tier.subtitle}</p>
              <p className="text-base"> • {tier.impact} • </p>
            </div>
          </div>
          <div className="flex flex-col items-center gap-7">
            <div
              className="flex  h-[284px] w-[284px] items-center justify-center overflow-hidden rounded-full text-6xl font-extrabold"
              style={{
                backgroundColor: hasPortrait ? "#ffffff" : palette.accent,
                color: palette.text,
                boxShadow: `0 30px 80px ${shadowColor}`,
              }}
            >
              {hasPortrait ? (
                <img
                  src={
                    portraitSrc ??
                    "https://media.licdn.com/dms/image/v2/D4D03AQFWRhCRT_zJTg/profile-displayphoto-shrink_400_400/B4DZacVR1gGgAg-/0/1746379547205?e=1761782400&v=beta&t=VG7mT54FDsh_AszlpaFMLWs-uvvzvsdFUQJ1ZT10wS4"
                  }
                  alt="Badge portrait"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-6xl font-extrabold tracking-tight">
                  {initials || tier.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="rounded-3xl  bg-white/15 px-10 py-7 text-center text-base " style={{
              boxShadow: "rgba(0, 0, 0, 0.16) 0px 10px 36px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px;"
              // box-shadow: 
            }}>
              <p className="text-xl   font-semibold ">{attendeeName}</p>
              <p className="mt-3   max-w-[260px] text-base ">
                I'm making a difference{" "}
                {attendeeTag || "because Jesus' friends are my friends."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-7 rounded-3xl  bg-white/12 p-10">
          <div className="flex items-center   gap-6 text-left ">
            <div className="rounded-2xl  bg-white p-5 shadow-[0_26px_56px_rgba(15,23,42,0.18)]">
              <div className="relative h-36 w-36 overflow-hidden  bg-white">
                <QRCode
                  value={shareUrl}
                  size={144}
                  bgColor="#ffffff"
                  fgColor="#111827"
                  level="H"
                  style={{ height: "100%", width: "100%" }}
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div
                    className="flex items-center bg-cover bg-center justify-center rounded-2xl border-2 border-white/80 bg-white/95 shadow-[0_14px_34px_rgba(15,23,42,0.22)]"
                    style={{
                      width: '46px',
                      height: '46px',
                      backgroundImage:`url('${jc_logo}')`,
                      // mixBlendMode: 'multiply',
                      backgroundSize:'160%'
                    }}
                  >
                    {/* <img src={jc_logo} alt="JC" className="h-8 w-8 object-contain" /> */}
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-[400px] space-y-3">
              <p className="text-2xl font-semibold">Scan to RSVP &amp; share</p>
              <p className="text-base ">Use the QR or share this link:</p>
              <p className="truncate border rounded-xl bg-black/30 px-5 py-2.5 text-sm font-medium text-white/90">
                https://adventband.org/event
              </p>
            </div>
          </div>
          <div className="space-y-2 text-left  text-base ">
            <p className="text-xl font-semibold">Jabali Chorale Concert</p>
            <p>Aga Khan Walk • Street Families Outreach</p>
            <p>Street Vespers Initiative</p>
            {/* <p>23rd Nov 2025</p> */}
          </div>
        </div>
        <div className="flex items-center justify-center text-base">
          <div className="border-1 h-0 w-24 mr-6" />
          <p className="text-center"> • 23th Nov 2025 • </p>
          <div className="border-1 h-0 w-24 ml-6" />
        </div>
        <div
          className="p-2 rounded-2xl bg-gray-100"
          style={{
            backgroundColor: palette.accent,
            // borderTop:`1px solid ${palette.secondary}`
          }}
        >
          {/* <p className='text-center text-xs'>In Partnership with</p> */}
          <div className="flex flex-row justify-center items-center gap-8">
            <div
              className="h-16 w-16 bg-no-repeat bg-center bg-cover"
              style={{
                backgroundImage: `url('${jc_logo}')`,
                backgroundSize: "190%",
              }}
            ></div>
            <div
              className="h-16 w-16 bg-no-repeat bg-center bg-cover"
              style={{
                backgroundImage: `url('${ab_logo}')`,
                backgroundSize: "110%",
              }}
            ></div>
            <div
              className="h-16 w-16 bg-no-repeat bg-center bg-cover"
              style={{
                backgroundImage: `url('${sp_logo}')`,
              }}
            ></div>
            <div
              className="h-12 w-36 bg-no-repeat bg-center bg-cover"
              style={{
                backgroundImage: `url('${imara_logo}')`,
              }}
            ></div>
            <div
              className="h-16 w-16 bg-no-repeat bg-center bg-cover"
              style={{
                backgroundImage: `url('${kcc_logo}')`,
                backgroundSize: "175%",
              }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
// import { PosterTemplate } from "./PosterTemplate";

function useLockedScale(base = 1080) {
  const [scale, setScale] = React.useState(1);

  React.useLayoutEffect(() => {
    const getMinSide = () => {
      // Prefer visualViewport on mobile (avoids 100vh bugs under URL bars)
      const vv = (window as any).visualViewport;
      const w = vv?.width ?? window.innerWidth;
      const h = vv?.height ?? window.innerHeight;
      return Math.min(w, h);
    };

    const update = () => setScale(getMinSide() / base);

    update();
    const vv = (window as any).visualViewport;
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update); // address bar show/hide
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);

    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [base]);

  return scale;
}

export function FixedScalePoster(
  props: React.ComponentProps<typeof PosterTemplate>
) {
  const SCALE = useLockedScale(1080);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#f7f7f7",
      }}
    >
      <div
        style={{
          width: 1080,
          height: 1080,
          transformOrigin: "top left",
          transform: `scale(${SCALE})`,
          // Smoother on mobile GPUs
          willChange: "transform",
        }}
      >
        <PosterTemplate {...props} />
      </div>
    </div>
  );
}


type BadgeTemplateProps = {
  tier: Tier;
  attendeeName: string;
  portraitSrc?: string | null;
};

export function BadgeTemplate({
  tier,
  attendeeName,
  portraitSrc,
}: BadgeTemplateProps) {
  const palette = TIER_PALETTE[tier.key] ?? FALLBACK_PALETTE;
  const hasPortrait = Boolean(portraitSrc);
  const shadowColor = hasPortrait ? `${palette.accent}aa` : "rgba(0,0,0,0.28)";
  return (
    <div
      className="relative h-[1080px] w-[1080px] overflow-hidden rounded-[48px] text-white"
      style={{ fontFamily: '"Inter", "Helvetica Neue", system-ui, sans-serif' }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(155deg, ${palette.primary}, ${palette.secondary})`,
        }}
      />
      <div className="absolute inset-x-12 top-12 h-32 rounded-3xl bg-white/15 blur-[3px]" />
      <div className="absolute inset-0 bg-black/10 mix-blend-soft-light" />
      <div className="relative flex h-full w-full flex-col justify-between p-20">
        <div className="space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="inline-flex items-center gap-3 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold uppercase tracking-[0.22em] text-white/75">
              Advent Band Vespers
            </div>
            {hasPortrait && (
              <div
                className="hidden sm:flex h-28 w-28 items-center justify-center overflow-hidden rounded-3xl bg-white"
                style={{ boxShadow: `0 20px 64px ${shadowColor}` }}
              >
                <img
                  src={portraitSrc ?? ""}
                  alt="Badge portrait"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
          </div>
          <div className="max-w-[640px] space-y-5">
            <h2 className="text-6xl font-extrabold leading-tight sm:text-7xl">
              {tier.name}
            </h2>
            <p className="text-2xl text-white/85">{tier.subtitle}</p>
            <p className="text-4xl font-black tracking-tight text-white">
              KES {tier.amount.toLocaleString()}
            </p>
            <p className="text-lg text-white/80">{tier.impact}</p>
          </div>
        </div>
        <div className="space-y-5">
          {hasPortrait ? (
            <div
              className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white/15 text-xl font-semibold text-white/90 sm:hidden"
              style={{ boxShadow: `0 20px 64px ${shadowColor}` }}
            >
              <img
                src={portraitSrc ?? ""}
                alt="Badge portrait"
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 text-xl font-semibold text-white/90">
              {getInitials(attendeeName || tier.name)}
            </div>
          )}
          {attendeeName.trim() && (
            <div className="flex items-center justify-between rounded-3xl bg-white/12 px-8 py-6 text-lg font-semibold text-white/90">
              <span>Confirmed for:</span>
              <span>{attendeeName.trim()}</span>
            </div>
          )}
          <div
            className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white/15 px-8 py-6 text-sm text-white/80"
            style={{
              border: `1px solid ${palette.accent}55`,
              boxShadow: `0 18px 48px ${palette.secondary}26`,
            }}
          >
            <span className="font-semibold text-white">
              Aga Khan Walk • Street Families Outreach
            </span>
            <span className="text-white/80">
              Merch table • Badge kit • Worship
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChristInTheStreets() {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-50 overflow-hidden">
      {/* background diagonal lines */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,#e9ecef_0px,#e9ecef_3px,transparent_3px,transparent_30px)]"></div>

      <div className="relative text-center border-4 border-purple-700 px-8 py-6">
        {/* underline */}
        <div className="w-12 h-[3px] bg-blue-900 mx-auto mb-4"></div>

        {/* top text */}
        <div className="yellowtail-regular text-7xl text-blue-900 tracking-widest">
          CHRIST
        </div>

        {/* highlight middle text */}
        <div className="relative inline-block bg-blue-100 px-3 py-1 text-lg italic font-[Allura] -mt-4 mb-2">
          In The
        </div>

        {/* bottom text */}
        <div className="font-[Montserrat] text-7xl font-bold text-amber-700 tracking-wide">
          STREETS
        </div>

        {/* footer */}
        <div className="mt-3 text-lg text-black font-[Raleway]">
          Jabali Chorale
        </div>
      </div>
    </div>
  );
}
