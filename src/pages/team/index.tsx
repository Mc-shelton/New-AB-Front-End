import ab_logo from '../../assets/images/ab_logo.png';
import ab_about from '../../assets/images/ab_about.jpeg';
import {
  TeamOutlined,
  BookOutlined,
  CameraOutlined,
  ThunderboltOutlined,
  FireOutlined,
  HeartOutlined,
  FlagOutlined,
  DownloadOutlined,
  PlayCircleFilled,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AdventBand } from '../../content/adventBand';
import Footer from '../../components/Footer';
import { useEffect, useState } from 'react';
import { trackPage } from '../../utils/track';
import { trackEvent } from '../../utils/track';
import { sendSubscribeEmail } from '../../utils/sendEmail';

export default function About() {
  const navigate = useNavigate()
  const [ctaEmail, setCtaEmail] = useState('');
  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaStatus, setCtaStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null);
  useEffect(() => { trackPage('about'); }, []);
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      {/* Utilities */}
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* HERO / HEADER */}
      <header
        className="relative text-white"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.25)), url('${ab_about}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full bg-gradient-to-b from-black/60 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex items-end justify-between">
            <div
            onClick={()=>{
              navigate("/")
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

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-12 sm:pb-16 lg:pb-20">
          <div className="flex items-start gap-3 text-sm sm:text-lg">
            <PlayCircleFilled className="mt-1" />
            <p className="opacity-95">Learn about AdventBand .Org</p>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-4xl">
            We mobilize Adventist volunteers to spread the Three Angels' Message—online and offline.
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-white/90">
            AdventBand is a community of builders, creators, and missionaries equipping ministries with tools, media, and organized teams. We believe in practical service, digital evangelism, and strong community.
          </p>
        </div>
      </header>

      {/* WHAT WE DO */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h2 className="text-2xl sm:text-3xl font-bold">What we do</h2>
          <p className="mt-2 text-neutral-700 max-w-3xl">
            We design initiatives, ship tools, and support local/global outreach. Our work revolves around three pillars that keep us focused on mission and impact.
          </p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100"><TeamOutlined /></div>
              <h3 className="mt-3 font-semibold text-lg">Spiritual Engagement</h3>
              <p className="mt-1 text-sm text-neutral-700">Intentional outreach and discipleship: Bible studies, prayer networks, and care teams—supporting both online and in-person ministry.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100"><HeartOutlined /></div>
              <h3 className="mt-3 font-semibold text-lg">Community & People</h3>
              <p className="mt-1 text-sm text-neutral-700">We grow people, not just projects—through mentorship, clear roles, contributor pathways, and a culture of love and belonging.</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100"><FlagOutlined /></div>
              <h3 className="mt-3 font-semibold text-lg">Alliances & Structure</h3>
              <p className="mt-1 text-sm text-neutral-700">We build partnerships and lightweight processes so ministries can collaborate, sustain, and scale their impact.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ORG MODEL + GOALS */}
      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h2 className="text-2xl sm:text-3xl font-bold">How we’re organized</h2>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="font-semibold text-lg">Our People Model</h3>
              <p className="mt-1 text-sm text-neutral-700">{AdventBand.peopleModel}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="font-semibold text-lg">Goals (2025–2026)</h3>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700 list-disc pl-5">
                {AdventBand.goals.map((g) => (
                  <li key={g.key}>
                    <span className="font-medium">{g.key}:</span> {g.desc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* GET INVOLVED */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h2 className="text-2xl sm:text-3xl font-bold">Get involved</h2>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="font-semibold text-lg">We’re looking for</h3>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700 list-disc pl-5">
                {AdventBand.needs.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5">
              <h3 className="font-semibold text-lg">Why Advent Band?</h3>
              <ul className="mt-2 space-y-1 text-sm text-neutral-700 list-disc pl-5">
                {AdventBand.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-neutral-200 bg-white p-6">
            <h3 className="font-semibold text-lg">Let’s build together</h3>
            <p className="mt-1 text-sm text-neutral-700">
              If you’re looking to make your time, skills, and spirit count for eternity, Advent Band is your home.
            </p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-xl border border-neutral-200 p-3"><span className="font-medium">Email:</span> {AdventBand.contact.email}</div>
              <div className="rounded-xl border border-neutral-200 p-3"><span className="font-medium">Web:</span> {AdventBand.contact.web}</div>
              <div className="rounded-xl border border-neutral-200 p-3"><span className="font-medium">Socials:</span> {AdventBand.contact.socials}</div>
            </div>
            <p className="mt-3 text-sm text-neutral-700">{AdventBand.contact.scripture}</p>
          </div>
        </div>
      </section>

      {/* TEAMS */}
      <section className="bg-neutral-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <h2 className="text-2xl sm:text-3xl font-bold">Our teams</h2>
          <p className="mt-2 text-neutral-700 max-w-3xl">Each team owns a lane and collaborates across ministries. Here’s how we serve:</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <TeamCard
              icon={<BookOutlined />}
              title="Evangelism"
              desc="Bible studies, outreach campaigns, and speaker coordination. Tracts, Bible lessons, and missionary training."
              bullets={[
                'Online & onsite Bible studies',
                'Door-to-door & public efforts',
                'Follow-up & interests tracking',
              ]}
            />
            <TeamCard
              icon={<CameraOutlined />}
              title="Media"
              desc="Short-form testimonies, event coverage, photo/video, motion, and social distribution strategies."
              bullets={[
                'Story capture & editing',
                'Brand kits & templates',
                'Publishing & scheduling',
              ]}
            />
            <TeamCard
              icon={<ThunderboltOutlined />}
              title="Frontend Development"
              desc="Web apps, landing pages, and design systems for ministry tools."
              bullets={[
                'React/Tailwind components',
                'Accessibility & performance',
                'UI kits & CMS integrations',
              ]}
            />
            <TeamCard
              icon={<FireOutlined />}
              title="Backend Development"
              desc="APIs, authentication, data pipelines, and automation to power our apps."
              bullets={[
                'REST/GraphQL services',
                'Background jobs & queues',
                'Admin dashboards & metrics',
              ]}
            />
            <TeamCard
              icon={<TeamOutlined />}
              title="Community & Operations"
              desc="Recruiting, onboarding, care, and workflows that keep volunteers supported and projects moving."
              bullets={[
                'Onboarding & mentorship',
                'Role clarity & pathways',
                'Docs & lightweight process',
              ]}
            />
            <TeamCard
              icon={<FlagOutlined />}
              title="Events"
              desc="Youth programs, camp meetings, evangelistic series, and logistics for field operations."
              bullets={[
                'Event planning & MC',
                'AV & venue coordination',
                'Volunteer scheduling',
              ]}
            />
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 flex flex-col items-stretch gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold">Ready to serve?</h3>
              <p className="mt-1 text-neutral-700 max-w-2xl">Join a team, mentor newcomers, or subscribe for updates. We’ll match you where you can make the most impact.</p>
            </div>
            <div className="w-full max-w-md">
              <label htmlFor="cta-email" className="sr-only">Email</label>
              <input
                id="cta-email"
                type="email"
                placeholder="Your email address"
                className="w-full px-4 py-3 rounded-full border text-black placeholder-neutral-500 focus:outline-none"
                value={ctaEmail}
                onChange={(e) => setCtaEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => { try { trackEvent('cta.join', { from: 'about' }); } catch {}; navigate('/join'); }} className="rounded-full bg-amber-600 text-white px-5 py-3 font-semibold hover:bg-amber-500 w-full sm:w-auto">Join a team</button>
              <button
                className="rounded-full border px-5 py-3 font-semibold hover:bg-neutral-50 w-full sm:w-auto disabled:opacity-60"
                disabled={ctaLoading || !ctaEmail}
                onClick={async () => {
                  setCtaStatus(null);
                  setCtaLoading(true);
                  try { trackEvent('cta.subscribe.click', { from: 'about' }); } catch {}
                  const res = await sendSubscribeEmail(ctaEmail);
                  setCtaLoading(false);
                  if (res.ok) {
                    setCtaStatus({ type: 'ok', text: 'Subscribed! We will email updates occasionally.' });
                    setCtaEmail('');
                    try { trackEvent('cta.subscribe.success', { from: 'about' }); } catch {}
                  } else {
                    setCtaStatus({ type: 'error', text: 'Could not subscribe automatically. Email people@adventband.org.' });
                    try { trackEvent('cta.subscribe.error', { from: 'about', detail: res.detail }); } catch {}
                  }
                }}
              >
                {ctaLoading ? 'Subscribing…' : 'Subscribe to newsletter'}
              </button>
            </div>
            {ctaStatus && (
              <div className={`text-sm mt-1 ${ctaStatus.type === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
                {ctaStatus.text}
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function TeamCard({ icon, title, desc, bullets }: { icon: React.ReactNode; title: string; desc: string; bullets: string[] }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-xl">{icon}</div>
        <div>
          <h3 className="font-semibold text-lg leading-tight">{title}</h3>
          <p className="text-sm text-neutral-700 mt-1">{desc}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-neutral-700 list-disc pl-6">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
}
