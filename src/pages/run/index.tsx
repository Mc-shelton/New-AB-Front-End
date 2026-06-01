import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
  TeamOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import ab_logo from '../../assets/images/ab_logo.png';
import medalFront from '../../assets/images/ab_annual_run_medal_front.png.png';
import medalBack from '../../assets/images/ab_annual_run_medal_back.png.png';
import Footer from '../../components/Footer';
import { trackEvent, trackPage } from '../../utils/track';

// const HERO_BG = ab_logo
  // "url('https://images.unsplash.com/photo-1509099836639-18ba02e2e5c5?auto=format&fit=crop&w=1600&q=80&sat=-10')";

export default function AnnualRunKidsEdition() {
  const navigate = useNavigate();

  useEffect(() => {
    trackPage('annual-run-kids');
  }, []);

  const quickLinks = [
    { label: 'Ministry', href: '/ministry', icon: <EnvironmentOutlined /> },
    { label: 'Street Vespers', href: '/vespers', icon: <HeartOutlined /> },
    { label: 'Education Blogs', href: '/blogs', icon: <ReadOutlined /> },
    { label: 'Join Team', href: '/join', icon: <TeamOutlined /> },
  ];

  const supportAreas = [
    { title: 'Family Counseling', text: 'Advent Band counselors host circles for parents and kids, covering coping skills, routines, and emotional safety.', icon: <SafetyCertificateOutlined /> },
    { title: 'Volunteer Care Squads', text: 'Trained volunteers accompany families on-course, offering sensory breaks, pacing help, and practical support.', icon: <TeamOutlined /> },
    { title: 'Training & Workshops', text: 'Hands-on sessions for caregivers, teachers, and youth leaders on neurodiversity, de‑escalation, and inclusive play.', icon: <ReadOutlined /> },
    { title: 'Health & Regulation Kits', text: 'Hydration, nutrition, and regulation tools (ear defenders, fidgets, weighted bands) for kids who need them.', icon: <MedicineBoxOutlined /> },
  ];

  const eventFlow = [
    { title: 'Prep & Guardians', text: 'Family-friendly training plans, safety briefings, and kit pick-ups with QR check-ins.', icon: '01' },
    { title: 'Race Day Kids Edition', text: 'Color-splashed corrals, story stops along the course, and volunteer cheer pods.', icon: '02' },
    { title: 'Impact & Thanks', text: 'Medals unlock stories: track where funds land—mental health circles, school kits, clinics.', icon: '03' },
  ];

  const packTiers = [
    {
      price: 'Kes 1,500',
      name: 'Standard',
      perks: ['Finisher medal', 'Hydration & recovery pack', 'Community support system', 'Vibes', 'Impact'],
    },
    {
      price: 'Kes 2,500',
      name: 'Premium',
      perks: ['Finisher medal', 'Event shirt', 'Hydration & recovery pack','Community support system', 'Vibes', 'Impact'],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-sky-50 text-neutral-900 flex flex-col">
      <header className="relative overflow-hidden">
        <div
          className="absolute bg-cover bg-center pointer-events-none"
  style={{
    backgroundImage: `url(${medalFront})`,
    backgroundPosition: 'center 18%',
    width: 'clamp(320px, 900vw, 520px)',
    height: 'clamp(520px, 95vw, 760px)',
    left: '50%',
    top: '52%',
    transform: 'translate(-70%, -40%) rotate(-6deg)',
    borderRadius: '28px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.45)',
  }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,214,102,0.46),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.42),transparent_40%)] mix-blend-multiply" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/60" aria-hidden />
        <div
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-14 sm:pb-20 lg:pb-24 text-white"
        >
          <div className="flex items-center justify-between">
            <button
              className="h-30 w-30 sm:h-34 sm:w-74 bg-no-repeat bg-contain bg-center drop-shadow-[0_10px_30px_rgba(0,0,0,0.38)] filter invert brightness-0"
              style={{ backgroundImage: `url('${ab_logo}')` }}
              aria-label="Advent Band logo"
              onClick={() => navigate('/')}
            />
            <div className="hidden sm:flex items-center gap-3">
              <button
                className="rounded-full border border-amber-500 bg-amber-500 text-neutral-900 px-4 py-2 text-sm font-semibold shadow-sm hover:bg-amber-400 hover:border-amber-400"
                onClick={() => {
                  navigate('/donate');
                  try { trackEvent('run.cta_donate'); } catch {}
                }}
              >
                Donate
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_420px] items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-3 py-1 text-xs  tracking-wide shadow">
                <TrophyOutlined /> Run For The Kids Edition
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-white">
                <span style={{fontSize:'35px'}}>AB .Org Virtual Challenge & Run </span>
              </h1>
              <p className="text-sm sm:text-base text-white/90 max-w-2xl">
                This is our annual, themed run: each year backs one cause. The 2026 course is a Kids Edition.
              </p>
              <br/>
              <br/>
              <br/>
              <div className="mt-4 flex flex-wrap gap-2 text-xs sm:text-sm text-white/90">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 shadow-sm border border-white/30"><CalendarOutlined /> Apr 5–18, 2026 · 14-days virtual challenge</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 shadow-sm border border-white/30"><EnvironmentOutlined /> Sunday Apr 19 • 5K • 10K • 21K</span>
                {/* <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 shadow-sm border border-white/30"><HeartOutlined /> This year&apos;s cause: kids</span> */}
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  className="rounded-full bg-amber-500 px-5 py-3 text-sm sm:text-base font-semibold text-neutral-900 shadow hover:bg-amber-400"
                  onClick={() => {
                    navigate('/run/register');
                    try { trackEvent('run.cta_join_main'); } catch {}
                  }}
                >
                  Register
                </button>
                <button
                  className="rounded-full border border-white/60 px-5 py-3 text-sm sm:text-base font-semibold text-white hover:bg-white/10"
                  onClick={() => {
                    navigate('/ministry');
                    try { trackEvent('run.cta_ministry'); } catch {}
                  }}
                >
                  About Advent Band .Org <ArrowRightOutlined />
                </button>
              </div>

              
            </div>
            <br/>
            <br/>
            <br/>
            <br/>
            {/* <div className="relative">
              <div className="absolute -left-6 -top-10 h-28 w-28 rounded-full bg-gradient-to-br from-amber-300 via-white to-sky-200 blur-3xl opacity-70" aria-hidden />
              <div className="absolute -right-4 bottom-8 h-24 w-24 rounded-full bg-gradient-to-br from-sky-200 via-white to-amber-200 blur-3xl opacity-60" aria-hidden />
              <div className="relative grid grid-cols-2 gap-4 rounded-3xl bg-white/85 backdrop-blur shadow-2xl border border-white/60 p-4">
                <div className="rounded-2xl overflow-hidden border border-amber-100 bg-white shadow-lg">
                  <img src={medalFront} alt="Kids edition medal front" className="w-full h-full object-cover" />
                  <p className="p-3 text-center text-xs font-semibold text-amber-800 bg-amber-50">Front • Kids Edition motif</p>
                </div>
                <div className="rounded-2xl overflow-hidden border border-sky-100 bg-white shadow-lg">
                  <img src={medalBack} alt="Kids edition medal back" className="w-full h-full object-cover" />
                  <p className="p-3 text-center text-xs font-semibold text-sky-800 bg-sky-50">Back • Story track QR</p>
                </div>
              </div>
              <div className="mt-3 text-xs text-white/80 text-center">Medals inspire the visual language: playful gradients, bold typography, and story-driven QR codes.</div>
            </div> */}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_1fr] items-start">
            <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-3 py-1 text-xs uppercase tracking-wide"><HeartOutlined /> AB Walk/Run Challenge</span>
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight">About The Event</h2>
              <p className="text-sm sm:text-base text-neutral-700">
                Advent Band .Org Walk/Run is a virtual 4.5 km daily challenge, where every step or stride tell a story of impact, with a final culmination in a celebratory run day. 
                <br/>
                <br/>
                This year, we're running a course to fundraise and raise awareness for our year-round child support programs to support children suffering from Nuerodivergent disorders.
                <br/>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <TagChip icon={<SafetyCertificateOutlined />} label="Finisher's Medal" />
                <TagChip icon={<SmileOutlined />} label="Community and Vibes" />
                <TagChip icon={<ReadOutlined />} label="Premium Shirt" />
                <TagChip icon={<MedicineBoxOutlined />} label="On-site first aid & hydration" />
              </div>
            </div>
            <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-100 via-white to-sky-100 p-6 shadow-sm">
              <h3 className="text-lg font-semibold">What your stride funds</h3>
              <div className="mt-4 grid grid-cols-1 gap-3">
                {supportAreas.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-lg">
                        {item.icon}
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{item.title}</div>
                        <p className="mt-1 text-sm text-neutral-700 leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Two-fold experience</h2>
                <p className="text-sm text-neutral-700">Track a 14-day virtual challenge, then celebrate together on race day.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs sm:text-sm text-neutral-700">
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-amber-900 border border-amber-200">Apr 5–19 · 4 km daily virtual walk/run</span>
                <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sky-900 border border-sky-200">Sunday Apr 19 · 5K · 10K · 21K</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-4 items-start">
              <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
                <h3 className="text-lg font-semibold">Virtual Challenge · Apr 5–19</h3>
                <p className="mt-2 text-sm text-neutral-700">Log 4.5 km daily (walk/run). Join Stava community; we tally streaks and unlock digital badges. Perfect for families who want flexible participation.</p>
                <ul className="mt-3 space-y-2 text-sm text-neutral-800 list-disc pl-5">
                  <li>A communal support system</li>
                  <li>Pop in Mini-Challenges.</li>
                  <li>Counts toward your run-day finisher story.</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-4">
                <h3 className="text-lg font-semibold">Race Day · Sunday Apr 19</h3>
                <p className="mt-2 text-sm text-neutral-700">Finish together with mass start corrals. Pick your distance and bring your guardians/crew to the cheer zones.</p>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm font-semibold text-neutral-900">
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">5K</div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">10K</div>
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">21K</div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold">Registration packs</h2>
            <p className="mt-2 text-sm text-neutral-700">Choose your lane - both tiers power child support and community programs.</p>
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {packTiers.map((pack) => (
                <div key={pack.name} className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">{pack.name}</div>
                    <div className="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm font-semibold">{pack.price}</div>
                  </div>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-800 list-disc pl-5">
                    {pack.perks.map((perk) => (<li key={perk}>{perk}</li>))}
                  </ul>
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      className="w-full rounded-full bg-amber-600 text-white py-2.5 text-sm font-semibold hover:bg-amber-500"
                      onClick={() => navigate('/run/register')}
                    >
                      Register for this pack
                    </button>
                    <button
                      className="w-full rounded-full border border-neutral-300 py-2.5 text-sm font-semibold hover:bg-neutral-50"
                    onClick={() => navigate('/donate')}
                    >
                      Donate to kids fund
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold">Annual flow</h2>
                <p className="text-sm text-neutral-700">Clear rhythm so families, volunteers, and partners can plan early.</p>
              </div>
              <button
                className="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
                onClick={() => navigate('/vespers')}
              >
                See how we run vespers <ArrowRightOutlined />
              </button>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {eventFlow.map((item) => (
                <div key={item.title} className="relative rounded-2xl border border-neutral-200 p-4 bg-gradient-to-br from-white via-white to-amber-50">
                  <div className="absolute -top-3 left-4 h-10 w-10 rounded-full bg-amber-600 text-white font-semibold flex items-center justify-center shadow">{item.icon}</div>
                  <div className="mt-6 text-sm font-semibold">{item.title}</div>
                  <p className="mt-2 text-sm text-neutral-700 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm grid gap-6 lg:grid-cols-[minmax(0,1fr)_1fr]">
            <div className="space-y-3">
              <h2 className="text-2xl sm:text-3xl font-bold">Medal-driven storytelling</h2>
              <p className="text-sm sm:text-base text-neutral-700 max-w-xl">Each medal carries a QR that opens gratitude notes, project updates, and ways to keep giving. The kids edition art guides the palette for bibs, banners, and volunteer tees.</p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-neutral-700">
                <li>Front: bold shapes and colors kids can point out and name.</li>
                <li>Back: QR + short pledge to keep serving children beyond race day.</li>
                <li>Ribbon: alternating amber & sky stripes mirroring our ministry kit.</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 shadow-sm">
                <img src={medalFront} alt="Annual run medal front" className="w-full rounded-xl object-cover" />
                <div className="mt-2 text-xs font-semibold text-amber-800 text-center">Front • Iconic kids shapes</div>
              </div>
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3 shadow-sm">
                <img src={medalBack} alt="Annual run medal back" className="w-full rounded-xl object-cover" />
                <div className="mt-2 text-xs font-semibold text-sky-800 text-center">Back • QR gratitude track</div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-gradient-to-br from-neutral-900 via-neutral-900 to-slate-800 text-white p-6 sm:p-8 shadow-lg">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-wide">Stay in the loop</span>
                <h2 className="text-2xl sm:text-3xl font-bold">Want to crew, sponsor, or bring a kids club?</h2>
                <p className="text-sm sm:text-base text-white/80 max-w-2xl">Tell us how you want to serve—on-course, logistics, health, or kids engagement. We&apos;ll match you with a team and share the next coordination call.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-neutral-900 shadow hover:bg-amber-400"
                  onClick={() => navigate('/donate')}
                >
                  Join the Run Crew
                </button>
                <button
                  className="rounded-full border border-white/40 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
                  onClick={() => navigate('/blogs')}
                >
                  Read kids education blog
                </button>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold">Connect with everything else we&apos;re building</h2>
            <p className="mt-2 text-sm text-neutral-700">Explore our other initiatives that complement the annual run.</p>
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {quickLinks.map((item) => (
                <button
                  key={item.label}
                  className="group rounded-2xl border border-neutral-200 bg-gradient-to-br from-white to-neutral-50 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  onClick={() => navigate(item.href)}
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
                    <span className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-amber-100 text-amber-700 text-lg">{item.icon}</span>
                    {item.label}
                  </div>
                  <p className="mt-2 text-xs text-neutral-700 group-hover:text-neutral-900">Tap to see how this ties into the kids run theme.</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer variant="neutral" />
    </div>
  );
}

function TagChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-800 shadow-sm">
      {icon}
      {label}
    </span>
  );
}
