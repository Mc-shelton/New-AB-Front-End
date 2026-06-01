import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined, QrcodeOutlined, ShareAltOutlined, TeamOutlined, HeartOutlined, ReadOutlined, EnvironmentOutlined, CalendarOutlined, HighlightOutlined, CustomerServiceOutlined, AudioOutlined, ClockCircleOutlined, FormatPainterOutlined, UsergroupAddOutlined, TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ab_logo from '../../assets/images/ab_logo.png';
import jc_logo from '../../assets/images/jc_logo.png';
import foc_logo from '../../assets/images/foc.png';
import ab_badges from '../../assets/images/ab_badges.jpeg';
import ab_header from '../../assets/images/ab_header.jpeg';
import ab_about from '../../assets/images/ab_about.jpeg';
import eventPoster from '../../assets/images/poster.jpeg';
import Footer from '../../components/Footer';
import { trackEvent, trackPage } from '../../utils/track';
import { sendSubscribeEmail } from '../../utils/sendEmail';

export default function VespersInitiative() {
  const navigate = useNavigate();
  const [showEventModal, setShowEventModal] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeStatus, setSubscribeStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null);
  useEffect(() => { trackPage('vespers'); }, []);

  // Animate on scroll: reveal elements with .reveal-on-scroll
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal-on-scroll')) as HTMLElement[];
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) (e.target as HTMLElement).classList.add('is-visible');
      }
    }, { threshold: 0.15 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const shareUrl = typeof location !== 'undefined' ? location.href : 'https://adventband.org/vespers';
  const partners = [
    { name: 'Advent Band', logo: ab_logo },
    { name: 'Fountains of Christ', logo: foc_logo, initials: 'FoC', gradient: 'from-rose-500 to-amber-500' },
    { name: 'Jabali Chorale', logo: jc_logo, initials: 'JC', gradient: 'from-indigo-500 to-sky-500' },
    { name: 'Every Word', initials: 'EW', gradient: 'from-emerald-500 to-teal-500', showName: true },
  ];

  const marqueeDuration = 26;
  const marqueeStyle = {
    ['--marquee-duration' as string]: `${marqueeDuration}s`,
    ['--partner-gap' as string]: '2rem',
    ['--partner-padding' as string]: '2.25rem',
  } as CSSProperties;

  useEffect(() => {
    const timer = window.setTimeout(() => setShowEventModal(true), 300);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showEventModal) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowEventModal(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showEventModal]);

  const handleShareInvite = async () => {
    const inviteUrl = shareUrl;
    try { trackEvent('vespers.subscribe.share_click'); } catch {}
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join Aga Khan Walk Vespers',
          text: 'Let’s worship together at the Aga Khan Walk vespers. Here are the details.',
          url: inviteUrl,
        });
        try { trackEvent('vespers.subscribe.share_success'); } catch {}
        return;
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
      }
    }
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(inviteUrl);
        setSubscribeStatus({ type: 'ok', text: 'Invite link copied! Share it with a friend.' });
        try { trackEvent('vespers.subscribe.share_copied'); } catch {}
        return;
      }
    } catch {
      // fall through to error handler
    }
    setSubscribeStatus({ type: 'error', text: 'Unable to copy the invite link. Share adventband.org/vespers manually.' });
    try { trackEvent('vespers.subscribe.share_failed'); } catch {}
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes floatY { 0% { transform: translateY(0); } 50% { transform: translateY(-6px); } 100% { transform: translateY(0); } }
        @keyframes partnersMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .reveal-on-scroll { opacity: 0; transform: translateY(10px); transition: opacity .5s ease, transform .5s ease; }
        .reveal-on-scroll.is-visible { opacity: 1; transform: translateY(0); }
        .partners-marquee { position: relative; overflow: hidden; }
        .partners-marquee .partners-track { display: flex; align-items: center; gap: var(--partner-gap, 2.75rem); padding: 1.5rem var(--partner-padding, 2.75rem); width: max-content; will-change: transform; animation: partnersMarquee var(--marquee-duration, 26s) linear infinite; }
        .partners-marquee:hover .partners-track { animation-play-state: paused; }
        .partners-marquee .partner-tile { transition: transform .2s ease; }
        .partners-marquee .partner-tile:hover { transform: translateY(-4px); }
        .partners-marquee .partner-logo { filter: drop-shadow(0 42px 72px rgba(15, 23, 42, 0.5)); }
        @media (max-width: 640px) {
          .partners-marquee .partners-track { gap: 0.65rem; padding: 1rem 1.2rem; }
          .partners-marquee .partner-tile { min-width: 12rem; }
          .partners-marquee .partner-logo { height: 8rem; }
        }
      `}</style>
      {showEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-6" onClick={() => setShowEventModal(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vespers-event-modal-title"
            className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              aria-label="Close event announcement"
              className="absolute right-4 top-4 h-9 w-9 rounded-full border border-black/10 bg-white/80 text-neutral-600 transition hover:bg-neutral-100"
              onClick={() => setShowEventModal(false)}
            >
              <span aria-hidden="true">&times;</span>
            </button>
            <img src={eventPoster} alt="Upcoming Vespers event poster" className="w-full object-cover" />
            <div className="p-5 space-y-3 text-center">
              <h3 id="vespers-event-modal-title" className="text-lg font-semibold text-neutral-900">You are invited!</h3>
              <p className="text-sm text-neutral-700">Join us at our upcoming vespers gathering. Tap below to see all details, RSVP, and share with friends.</p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  className="rounded-full bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-amber-500"
                  onClick={() => {
                    setShowEventModal(false);
                    navigate('/event');
                  }}
                >
                  View Event Details
                </button>
                <button
                  className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-100"
                  onClick={() => setShowEventModal(false)}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* HEADER / HERO */}
      <header className="relative text-white" style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.86), rgba(0,0,0,0.25)), url('${ab_badges}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="w-full bg-gradient-to-b from-black/60 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex items-end justify-between">
            <div onClick={() => navigate('/')} className="h-24 w-56 sm:h-28 sm:w-64 bg-no-repeat bg-contain bg-center invert brightness-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] cursor-pointer" style={{ backgroundImage: `url('${ab_logo}')` }} aria-label="AdventBand logo" role="img" />
            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => { navigate('/event'); try { trackEvent('vespers.cta_badges'); } catch {} }} className="rounded-full border border-white/80 px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap hover:bg-white hover:text-black transition">Get a Badge</button>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" className="rounded-full border border-white/80 px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap hover:bg-white hover:text-black transition"><ShareAltOutlined /> Share</a>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pb-14">
          <p className="opacity-95 text-sm sm:text-base">AGA KHAN WALK STREET VESPERS • INITIATIVE</p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-4xl">Sharing Hope, Transforming Lives</h1>
          <p className="mt-3 max-w-2xl text-sm sm:text-base opacity-95">“Christ's method alone will give true success in reaching the people.” — Ellen G. White, The Ministry of Healing, p. 143</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button onClick={() => { navigate('#vision'); }} className="rounded-full bg-amber-600 px-5 py-3 font-semibold">Explore the Vision</button>
            <button onClick={() => { navigate('/event'); }} className="rounded-full border px-5 py-3 font-semibold hover:bg-white/10">Earn a Badge <ArrowRightOutlined /></button>
            <button
              onClick={() => { navigate('/vespers/gratitude'); try { trackEvent('vespers.cta_gratitude_wall'); } catch {} }}
              className="rounded-full bg-white/90 px-5 py-3 font-semibold text-neutral-900 hover:bg-white"
            >
              Visit the Gratitude Wall <HeartOutlined />
            </button>
          </div>

          {/* Quick info chips */}
          <div className="mt-6 flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5"><EnvironmentOutlined /> Aga Khan Walk, Nairobi</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5"><CalendarOutlined /> Fortnightly Friday Vespers</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5"><QrcodeOutlined /> QR-enabled Badges</span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
          <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm reveal-on-scroll">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-neutral-700 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                <HighlightOutlined /> Initiative Spotlight
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900">The Aga Khan Walk Street Vespers Initiative</h2>
              <p className="text-sm sm:text-base text-neutral-700">
                We exist to share hope and transform lives by ministering to street families in Nairobi through nurturing, caring, and sharing the love of God.
              </p>
              <p className="text-sm sm:text-base text-neutral-700">
                Since 2023, the journey has grown from small gatherings into structured fortnightly vespers, supported by ministries like Jabali Chorale, Fountains of Christ and Advent Band Organization. Together we continue to expand our reach and provide for our street friends.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-neutral-800">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">What&apos;s Next</p>
                  <p className="mt-1 text-lg font-semibold">Jabali Chorale Fundraising Concert · 23 November</p>
                  <p className="mt-2 text-sm text-neutral-600">A vibrant blend of music, testimonies, and impact updates — details coming soon.</p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-neutral-800">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">Partner With Us</p>
                  <p className="mt-1 text-lg font-semibold">Target: 468,500 Ksh</p>
                  <p className="mt-2 text-sm text-neutral-600">Join us as a key impact mover through the various streams we have in support for street families.</p>
                </div>
              </div>
            </div>
          </section>
          <section className="rounded-3xl border border-neutral-200 bg-neutral-950 text-white p-6 sm:p-8 shadow-sm">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px] items-center">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
                  <QrcodeOutlined /> Vespers newsletter
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold leading-tight">Get Involved!</h2>
                <p className="text-sm sm:text-base text-white/80 max-w-2xl">
                  Partner with us in prayer, serving, and resource drives — each email shares how you can step in before the next Aga Khan Walk vespers.
                </p>
                <ul className="space-y-2 text-sm text-white/70">
                  <li className="inline-flex items-start gap-2"><CheckCircleOutlined className="mt-1 text-amber-400" /> <span><span className="font-semibold text-white/90">Individuals</span> — volunteer on-site, sponsor a meal, or invite friends to worship.</span></li>
                  <li className="inline-flex items-start gap-2"><CheckCircleOutlined className="mt-1 text-amber-400" /> <span><span className="font-semibold text-white/90">Organizations &amp; Businesses</span> — provide supplies, professional services, or corporate matching.</span></li>
                  <li className="inline-flex items-start gap-2"><CheckCircleOutlined className="mt-1 text-amber-400" /> <span><span className="font-semibold text-white/90">Churches &amp; Ministries</span> — co-host music, preach, or mobilize prayer and discipleship teams.</span></li>
                </ul>
              </div>
              <div className="w-full rounded-2xl border border-white/15 bg-white/95 p-5 text-neutral-900 shadow-lg">
                <h3 className="text-lg font-semibold">Join the update list</h3>
                <p className="mt-1 text-sm text-neutral-600">Drop your email and we will loop you in right away.</p>
                <label htmlFor="vespers-subscribe" className="sr-only">Email address</label>
                <input
                  id="vespers-subscribe"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="mt-4 w-full rounded-full border border-neutral-300 px-4 py-3 text-sm  text-neutral-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
                      try { trackEvent('vespers.subscribe.click'); } catch {}
                      const result = await sendSubscribeEmail(subscribeEmail.trim());
                      setSubscribeLoading(false);
                      if (result.ok) {
                        setSubscribeStatus({ type: 'ok', text: 'Thanks! We will email vespers stories and event details soon.' });
                        setSubscribeEmail('');
                        try { trackEvent('vespers.subscribe.success'); } catch {}
                      } else {
                        setSubscribeStatus({ type: 'error', text: 'Could not subscribe automatically. Please email people@adventband.org.' });
                        try { trackEvent('vespers.subscribe.error', { detail: result.detail }); } catch {}
                      }
                    }}
                  >
                    {subscribeLoading ? 'Subscribing…' : 'Send me updates'}
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
                  <div className={`mt-3 text-xs ${subscribeStatus.type === 'ok' ? 'text-emerald-600' : 'text-rose-500'}`} aria-live="polite">
                    {subscribeStatus.text}
                  </div>
                )}
                {/* <p className="mt-3 text-xs text-neutral-500">We respect your inbox. Unsubscribe anytime with one click.</p> */}
              </div>
            </div>
          </section>

          {/* Visual Gallery */}
          {/* <section className="rounded-2xl overflow-hidden border border-neutral-200">
            <div className="grid grid-cols-1 sm:grid-cols-3">
              <div className="relative h-56 sm:h-60 md:h-72">
                <img src={ab_header} alt="Worship and fellowship" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white text-sm font-medium">Worship & Fellowship</div>
              </div>
              <div className="relative h-56 sm:h-60 md:h-72">
                <img src={ab_about} alt="Community caring" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white text-sm font-medium">Caring for Community</div>
              </div>
              <div className="relative h-56 sm:h-60 md:h-72">
                <img src={ab_badges} alt="Badges and recognition" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-2 left-2 text-white text-sm font-medium">Badges • Share Your Impact</div>
              </div>
            </div>
          </section> */}
          {/* Vision & Mission */}
          <section id="vision" className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <h2 className="text-xl font-bold">Our Vision</h2>
              <p className="mt-2 text-sm text-neutral-700">To holistically transform the lives of street families through sharing Christ’s love in Nairobi.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <h2 className="text-xl font-bold">Our Mission</h2>
              <p className="mt-2 text-sm text-neutral-700">Through active ministry of fellowship, caring, and sharing, we make disciples of Jesus Christ who live as His loving witnesses and proclaim the everlasting gospel, preparing the world for His soon return.</p>
            </div>
          </section>

          {/* Feature Blocks (inspired layout) */}
          <section className="space-y-16">
            {/* Block A */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="reveal-on-scroll">
                <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">Scale our outreach with ease</h2>
                <p className="mt-3 text-sm sm:text-base text-neutral-700 max-w-xl">Simple, verifiable badges help supporters share their impact to socials, websites, and email — boosting awareness and invitations to Vespers in real-time.</p>
                <a href="/event" className="mt-4 inline-flex items-center gap-2 text-indigo-700 font-medium">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"><ArrowRightOutlined /></span>
                  Get a badge and share your impact
                </a>
              </div>
              <div className="relative rounded-3xl overflow-hidden reveal-on-scroll">
                <img src={ab_about} alt="Smiling supporter" className="w-full h-full object-cover" />
                {/* Floating credential card */}
                <div className="absolute -bottom-6 left-6 sm:left-10 bg-white rounded-2xl shadow-lg border border-purple-200 p-3 w-[260px]">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center"><TrophyOutlined /></div>
                    <div className="text-sm font-semibold">Advent Band • Badge</div>
                  </div>
                  <div className="mt-2 h-1.5 rounded bg-neutral-100 overflow-hidden"><div className="h-full w-2/3 bg-purple-300" /></div>
                  <button className="mt-3 w-full rounded-full bg-indigo-700 text-white py-1.5 text-xs font-semibold">Share Badge</button>
                </div>
              </div>
            </div>

            {/* Block B (inverted) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="relative rounded-3xl overflow-hidden order-1 md:order-none reveal-on-scroll">
                <img src={ab_header} alt="Elder with tablet" className="w-full h-full object-cover" />
                {/* Floating pathway card */}
                <div className="absolute -bottom-6 left-6 bg-white rounded-2xl shadow-lg border border-neutral-200 p-3 w-[260px]">
                  <div className="text-sm font-semibold">Service Pathway</div>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><CheckCircleOutlined className="text-amber-500" /> Join Vespers</span><button className="text-indigo-700 text-xs font-semibold">Earn</button></li>
                    <li className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><CheckCircleOutlined className="text-rose-500" /> Invite a Friend</span><button className="text-indigo-700 text-xs font-semibold">Earn</button></li>
                    <li className="flex items-center justify-between"><span className="inline-flex items-center gap-2"><CheckCircleOutlined className="text-emerald-600" /> Share a Testimony</span><button className="text-indigo-700 text-xs font-semibold">Earn</button></li>
                  </ul>
                </div>
              </div>
              <div className="reveal-on-scroll">
                <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">Increase community engagement</h2>
                <p className="mt-3 text-sm sm:text-base text-neutral-700 max-w-xl">Pathways and micro‑milestones encourage participation, consistent attendance, and joyful sharing — all while keeping the focus on worship and care.</p>
                <a href="/vespers#vision" className="mt-4 inline-flex items-center gap-2 text-indigo-700 font-medium">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white"><ArrowRightOutlined /></span>
                  See our vision and mission
                </a>
              </div>
            </div>
          </section>

          {/* Partners */}
          <section className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-xl font-bold">Partnering for Impact</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm partners-marquee" style={marqueeStyle}>
              <div className="partners-track">
                {partners.concat(partners).map((partner, idx) => (
                  <PartnerTile
                    key={`${partner.name}-${idx}`}
                    name={partner.name}
                    logo={partner.logo}
                    initials={partner.initials}
                    gradient={partner.gradient}
                    showName={partner.showName}
                    ariaHidden={idx >= partners.length ? true : undefined}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* Objectives */}
          <section className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-xl font-bold">Our Objectives: Reaching Hearts in Nairobi's Streets</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Card title="Sustainable Interaction" text="Provide a platform for consistent, meaningful engagement with street families to share God's love." />
              <Card title="Accessible Worship for Adventists" text="Offer a spiritual sanctuary for Adventists in town on Friday evenings or those unable to attend regular vespers." />
              <Card title="Resource Mobilization" text="Gather and distribute essential resources to meet the pressing needs of street family members." />
              <Card title="Community Engagement" text="Invite passers-by to join our worship experience, planting seeds of faith in their hearts." />
            </div>
          </section>

          {/* Journey Timeline */}
          <section className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-xl font-bold">Our Journey So Far</h2>
            <div className="mt-4 relative">
              <div className="absolute left-4 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-200 rounded-full" />
              <TimelineItem year="2023" title="Song to Service" text="Friends singing at Aga Khan Walk recognize a deeper need for ministry." />
              <TimelineItem year="Feb 2025" title="Organizing Team" text="Formed a core team to ensure consistency; set a fortnightly vespers rhythm." />
              <TimelineItem year="2025+" title="Growing Partnerships" text="Partners include Fountains of Christ and Advent Band; choirs like Jabali Chorale and Every Word bless the services." />
            </div>
          </section>

          {/* Who We Serve */}
          <section className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-xl font-bold">Who We Serve</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <WhoCard icon={<HeartOutlined />} title="Street Families & Children" lines={[ 'Sharing God\'s Word', 'Spiritual nourishment', 'Food and clothing donations' ]} />
              <WhoCard icon={<TeamOutlined />} title="Participants" lines={[ 'Inspiring joyful songs', 'Fulfilling worship sessions', 'Networking opportunities' ]} />
              <WhoCard icon={<ReadOutlined />} title="Passers-by" lines={[ 'Comforting praise songs', 'Planting seeds of Christ\'s love', 'Arousing personal awakening' ]} />
            </div>
          </section>

          {/* Sustainable Growth */}
          <section className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-xl font-bold">Sustainable Growth & Development</h2>
            <ul className="mt-3 list-disc pl-6 text-sm text-neutral-800 space-y-1">
              <li>Community Platform: Create a space for like-minded individuals to unite.</li>
              <li>Visionary Inspiration: Ignite passion for our mission and vision.</li>
              <li>Active Participation: Empower members to support and drive growth, fostering true buy-in.</li>
            </ul>
          </section>

          {/* Session Guidelines — visuals + animations */}
          <section className="rounded-2xl border border-neutral-200 p-0 overflow-hidden">
            <div className="px-4 pt-4">
              <h2 className="text-xl font-bold">Ministry Session Guidelines</h2>
              <p className="mt-1 text-sm text-neutral-700">A structured, spirit-led flow that feels intentional and welcoming.</p>
            </div>
            {/* Animated stripe */}
            <div className="mt-3 h-1 w-full bg-gradient-to-r from-amber-500 via-fuchsia-500 to-sky-500" />
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <GuidelineCard
                icon={<HighlightOutlined />}
                title="Themed Sessions"
                text="Each gathering centers on a clear, pre-planned theme for deeper focus."
                color="from-amber-500 to-amber-700"
                className="reveal-on-scroll"
              />
              <GuidelineCard
                icon={<CustomerServiceOutlined />}
                title="Led Music"
                text="Selected choristers guide worship for unity and reverence."
                color="from-emerald-500 to-emerald-700"
                className="reveal-on-scroll"
              />
              <GuidelineCard
                icon={<FormatPainterOutlined />}
                title="Thematic Songs"
                text="Songs selected to echo the day’s message and scripture."
                color="from-fuchsia-500 to-fuchsia-700"
                className="reveal-on-scroll"
              />
              <GuidelineCard
                icon={<AudioOutlined />}
                title="Sound Amplification"
                text="Provide clear, warm audio so all can participate fully."
                color="from-indigo-500 to-indigo-700"
                className="reveal-on-scroll"
              />
              <GuidelineCard
                icon={<ClockCircleOutlined />}
                title="Time Management"
                text="Respectful timing boosts participation and consistent attendance."
                color="from-sky-500 to-sky-700"
                className="reveal-on-scroll"
              />
              <GuidelineCard
                icon={<UsergroupAddOutlined />}
                title="Age-specific Classes"
                text="Dedicated moments for adults, teens, and kids deepen connection."
                color="from-rose-500 to-rose-700"
                className="reveal-on-scroll"
              />
            </div>
          </section>

          {/* SWOT */}
          <section className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-xl font-bold">Operating Environment Analysis</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <Card title="Strengths" text="Strong will to minister; readily available good preachers; young, energetic workforce. Sustained vision and mission; internal ministers minimize costs; logistical capabilities." />
              <Card title="Weaknesses" text="Inadequate funds; low social media presence; inability to enumerate target market. Financial constraints; poor communication; difficulty in focused monitoring and analysis." />
              <Card title="Opportunities" text="Ability to spread God's Word; youth and stakeholders ready to partner; rich member networks." />
              <Card title="Threats" text="Regulations by local authority may restrict operations; potential legal challenges." />
            </div>
          </section>

          {/* Recommendations */}
          <section className="rounded-2xl border border-neutral-200 p-4">
            <h2 className="text-xl font-bold">Recommendations & Mitigation</h2>
            <p className="mt-2 text-sm text-neutral-700">We envision multiple concurrent programs across Nairobi and its outskirts, led by an army of young people molding a godly society. We need a team to identify genuine cases and connect them with social workers to register children into homes, transforming their lives.</p>
          </section>

          
        </div>
      </main>

      <Footer variant="neutral" />
    </div>
  );
}

function Card({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="text-sm font-semibold">{title}</div>
      <p className="mt-1 text-sm text-neutral-700">{text}</p>
    </div>
  );
}

function PartnerTile({ name, logo, initials, gradient = 'from-neutral-500 to-neutral-800', showName = false, ariaHidden }: { name: string; logo?: string; initials?: string; gradient?: string; showName?: boolean; ariaHidden?: boolean }) {
  const label = initials ?? name.charAt(0);

  return (
    <div className="partner-tile flex min-w-[13rem] sm:min-w-[18rem] flex-col items-center" aria-hidden={ariaHidden}>
      {logo ? (
        <img
          src={logo}
          alt={`${name} logo`}
          className="partner-logo h-[12rem] sm:h-48 w-auto max-w-full object-contain"
        />
      ) : (
        <span
          className={`partner-logo inline-flex h-[12rem] sm:h-48 items-center justify-center text-5xl sm:text-7xl font-semibold uppercase tracking-wide bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}
          style={{ textShadow: '0 38px 64px rgba(15, 23, 42, 0.55)' }}
        >
          {label}
        </span>
      )}
      {showName && (
        <div className="mt-3 text-base font-semibold text-neutral-900">{name}</div>
      )}
    </div>
  );
}

function WhoCard({ icon, title, lines }: { icon: ReactNode; title: string; lines: string[] }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold">{icon} {title}</div>
      <ul className="mt-2 text-sm text-neutral-700 space-y-1 list-disc pl-5">
        {lines.map((l) => (<li key={l}>{l}</li>))}
      </ul>
    </div>
  );
}

// function Stream({ title, pct, notes, ctaLabel, onCta }: { title: string; pct: number; notes: string; ctaLabel?: string; onCta?: () => void }) {
//   return (
//     <div className="rounded-xl border border-neutral-200 p-3">
//       <div className="flex items-center justify-between">
//         <div className="text-sm font-semibold">{title}</div>
//         <div className="text-xs text-neutral-600">Target {pct}%</div>
//       </div>
//       <p className="mt-1 text-sm text-neutral-700">{notes}</p>
//       {ctaLabel && onCta && (
//         <div className="mt-2"><button onClick={onCta} className="rounded-full border px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50">{ctaLabel}</button></div>
//       )}
//     </div>
//   );
// }

function TimelineItem({ year, title, text }: { year: string; title: string; text: string }) {
  return (
    <div className="relative pl-16 pb-6">
      <div className="absolute left-0 top-0 h-10 w-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold shadow">{year.replace(/[^0-9]/g,'').slice(-2)}</div>
      <div className="text-sm font-semibold">{title}</div>
      <div className="text-sm text-neutral-700 mt-1">{text}</div>
    </div>
  );
}

function GuidelineCard({ icon, title, text, color, className }: { icon: ReactNode; title: string; text: string; color: string; className?: string }) {
  return (
    <div className={`relative rounded-2xl border border-neutral-200 overflow-hidden bg-white p-4 transition-transform duration-200 hover:-translate-y-0.5 ${className||''}`}>
      {/* Decorative gradient blob */}
      <div className={`pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full bg-gradient-to-br ${color} opacity-20 blur-2xl animate-[floatY_6s_ease-in-out_infinite]`} />
      <div className="relative z-10">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-black/5 text-neutral-900">
          {icon}
        </div>
        <div className="mt-2 text-sm font-semibold">{title}</div>
        <p className="mt-1 text-sm text-neutral-700">{text}</p>
      </div>
    </div>
  );
}
