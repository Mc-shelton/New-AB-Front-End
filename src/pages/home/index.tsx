import ab_logo from '../../assets/images/ab_logo.png';
import ab_header from '../../assets/images/ab_header.jpeg';
import {
  BookOutlined,
  CameraOutlined,
  DownCircleOutlined,
  DownloadOutlined,
  FireOutlined,
  FormatPainterOutlined,
  FundProjectionScreenOutlined,
  LinkOutlined,
  MenuOutlined,
  PaperClipOutlined,
  PlayCircleFilled,
  SendOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  WechatWorkOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AdventBand } from '../../content/adventBand';
import Footer from '../../components/Footer';
import { useState } from 'react';
import { sendJoinEmail } from '../../utils/sendEmail';
import { useEffect } from 'react';
import { trackPage } from '../../utils/track';
import { trackEvent } from '../../utils/track';

export default function Home() {
  const navigation = useNavigate()
  const [heroEmail, setHeroEmail] = useState('');
  const [heroStatus, setHeroStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null);
  const [heroLoading, setHeroLoading] = useState(false);
  useEffect(() => { trackPage('home'); }, []);
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header
        className="relative text-white"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.25)), url('${ab_header}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="w-full bg-gradient-to-b from-black/60 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex items-end justify-between">
            <div
              className="h-30 w-30 sm:h-34 sm:w-74 bg-no-repeat bg-contain bg-center invert brightness-0  drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
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

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8 pb-16 sm:pb-24 lg:pb-32">
          <div className="flex items-start gap-3 text-sm sm:text-lg">
            <PlayCircleFilled className="mt-1" />
            <p className="opacity-95">Learn About AdventBand .Org</p>
          </div>
          <p className="mt-2 text-sm sm:text-base text-white/90 max-w-xl">
            {/* {AdventBand.tagline} */}
          </p>
          <h1 className="mt-1 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-3xl">
            Join A Team Of Adventist Missionaries To Spread The 3 Angels' Message
          </h1>
          <form
            className="mt-6 w-full max-w-xl"
            onSubmit={async (e) => {
              e.preventDefault();
              setHeroStatus(null);
              setHeroLoading(true);
              try { trackEvent('form.submit', { page: 'home', form: 'hero' }); } catch {}
              const res = await sendJoinEmail({
                name: '',
                email: heroEmail,
                role: 'General Interest',
                message: 'Submitted from Home hero form',
              });
              setHeroLoading(false);
              if (res.ok) { setHeroStatus({ type: 'ok', text: 'Thanks! We will be in touch.' }); try { trackEvent('form.success', { page: 'home', form: 'hero' }); } catch {} }
              else { setHeroStatus({ type: 'error', text: 'Could not send automatically. Email us at people@adventband.org.' }); try { trackEvent('form.error', { page: 'home', form: 'hero' }); } catch {} }
              if (res.ok) setHeroEmail('');
            }}
          >
            <label htmlFor="hero-email" className="sr-only">
              Email address
            </label>
            <div className="flex rounded-full border bg-white/95 overflow-hidden p-[2px]">
              <input
                id="hero-email"
                type="email"
                required
                inputMode="email"
                autoComplete="email"
                placeholder="example@gmail.com"
                className="flex-1 px-5 py-3 text-black placeholder-black/60 focus:outline-none"
                value={heroEmail}
                onChange={(e) => setHeroEmail(e.target.value)}
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-amber-600 px-5 py-3 rounded-full text-white hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-60"
                disabled={heroLoading}
              >
                <SendOutlined />
                <span className='hidden sm:inline'>{heroLoading ? 'Sending…' : 'Submit'}</span>
              </button>
            </div>
          </form>
          {heroStatus && (
            <p className={`mt-2 text-sm ${heroStatus.type === 'ok' ? 'text-green-700' : 'text-red-700'}`}>
              {heroStatus.text}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-white/10 px-3 py-1">Places to get started :</span>
            {navs.map((t) => (
              <button
                key={t.name}
                className="rounded-full border border-white/70 px-3 py-1 hover:bg-white hover:text-black transition"
                type="button"
                onClick={()=>{
                  navigation(t.path)
                }}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="bg-[#3a190b] text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-2xl bg-[#3a2217] p-5">
            <div className=" flex h-12 w-12 items-center justify-center rounded-full bg-[#39281f]">
              <DownCircleOutlined />
            </div>
            <p className="mt-4 text-center text-sm">Download Advent Band App</p>
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-white/30 py-4">
              <DownloadOutlined />
              <a
                href="https://play.google.com/store/apps/details?id=com.mcshelton.mobile_v1&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 text-sm font-medium underline underline-offset-4"
              >
                Download App
              </a>
            </div>
          </div>
          <div className="rounded-2xl bg-[#3a2217] p-5">
            <div className=" flex h-12 w-12 items-center justify-center rounded-full bg-[#39281f]">
              <TeamOutlined />
            </div>
            <h3 className="mt-4 text-xl sm:text-2xl font-bold">
            Transforming Lives Through Spiritual Engagement
            </h3>
            <p className="mt-2 text-sm opacity-90">
            Our core mission is to minister with impact—within and beyond our organization. This pillar
            centers on intentional spiritual outreach and inward spiritual growth.
            </p>
          </div>
          <div className="rounded-2xl bg-[#3a2217] p-5">
            <div className=" flex h-12 w-12 items-center justify-center rounded-full bg-[#39281f]">
              <MenuOutlined />
            </div>
            <h3 className="mt-4 text-xl sm:text-2xl font-bold">
            Cultivating a Thriving Community of Purpose
            </h3>
            <p className="mt-2 text-sm opacity-90">
            We believe that people are the heartbeat of our mission. This pillar focuses on building
            strong, collaborative teams anchored in love, belonging, and shared purpose.
            </p>
          </div>
          <div className="rounded-2xl bg-[#3a2217] p-5">
            <div className=" flex h-12 w-12 items-center justify-center rounded-full bg-[#39281f]">
              <LinkOutlined />
            </div>
            <h3 className="mt-4 text-xl sm:text-2xl font-bold">
            Expanding Impact Through Strategic Alliances and Structure
            </h3>
            <p className="mt-2 text-sm opacity-90">
            We are committed to forging partnerships and building organizational structures that
            empower sustainable growth and amplify our influence. 
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold max-w-3xl">
            Explore multiple opportunities to engage in volunteering work
          </h2>
          <div className="mt-4 flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hidden text-sm sm:text-base">
            {[
              { label: 'Applications', value: '2+' },
              { label: 'Volunteers', value: '20+' },
              { label: 'Avenues', value: '7+' },
              { label: 'Ministries', value: '10+' },
            ].map((s) => (
              <div key={s.label} className="inline-flex items-center gap-2">
                <span className="rounded-full border border-amber-600 px-3 py-0.5 text-amber-600 text-sm font-medium">
                  {s.value}
                </span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hidden" role="list">
            {roles.map((role) => (
              <div
                key={role.label}
                role="listitem"
                className="snap-start shrink-0 rounded-full border border-gray-300 h-24 w-28 sm:h-28 sm:w-36 flex flex-col items-center justify-center text-center"
              >
                <role.icon className="text-3xl sm:text-4xl" />
                <p className="mt-1 text-[11px] sm:text-xs font-medium">{role.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About + Mission/Vision + What We Do */}
      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 space-y-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">About Advent Band</h2>
            <p className="mt-2 text-neutral-700 max-w-3xl">{AdventBand.about}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl border border-neutral-200 p-5">
              <h3 className="font-semibold text-lg">Our Mission</h3>
              <p className="mt-1 text-sm text-neutral-700">{AdventBand.mission}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-5">
              <h3 className="font-semibold text-lg">Our Vision</h3>
              <p className="mt-1 text-sm text-neutral-700">{AdventBand.vision}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xl sm:text-2xl font-bold">What We Do</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {AdventBand.whatWeDo.map((w) => (
                <div key={w.title} className="rounded-2xl border border-neutral-200 p-5 bg-white">
                  <h4 className="font-semibold">{w.title}</h4>
                  <ul className="mt-2 space-y-1 text-sm text-neutral-700 list-disc pl-5">
                    {w.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

const roles = [
  { label: 'Front-End Dev', icon: FundProjectionScreenOutlined },
  { label: 'A/B Writer', icon: FormatPainterOutlined },
  { label: 'Evangelist', icon: PaperClipOutlined },
  { label: 'Missionary', icon: WechatWorkOutlined },
  { label: 'Back-End Dev', icon: FireOutlined },
  { label: 'Colporter', icon: BookOutlined },
  { label: 'Events', icon: ThunderboltOutlined },
  { label: 'Media', icon: CameraOutlined },
];

const navs = [
  {
    path:'join',
    name:'Join a team'
  },
  {
    path:'badges',
    name:"Team walls & badges"
  },
  {
    path:'merchandise',
    name:'Street merch store'
  },
  {
    path:'about',
    name:'About us'
  }
]
