import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ab_header from '../../assets/images/ab_header.jpeg';
// import ab_about from '../../assets/images/ab_about.jpeg';
// import ab_badges from '../../assets/images/ab_badges.jpeg';
import ab_logo from '../../assets/images/ab_logo.png';
import { DownloadOutlined, PlayCircleFilled, TeamOutlined, HeartOutlined, FlagOutlined, ThunderboltOutlined, QuestionCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { AdventBand } from '../../content/adventBand';
import Footer from '../../components/Footer';
import { sendJoinEmail } from '../../utils/sendEmail';
import { useEffect } from 'react';
import { trackPage } from '../../utils/track';
import { trackEvent } from '../../utils/track';

export default function Join() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Front-End Dev');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { trackPage('join'); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    setLoading(true);
    try { trackEvent('form.submit', { page: 'join', role }); } catch {}
    const res = await sendJoinEmail({ name, email, role, message });
    setLoading(false);
    if (res.ok) {
      try { trackEvent('form.success', { page: 'join', role }); } catch {}
      navigate('/join/thanks');
      return;
    } else {
      try { trackEvent('form.error', { page: 'join', role }); } catch {}
      // mailto fallback
      const subject = encodeURIComponent(`Join Advent Band — ${role}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nRole: ${role}\n\n${message}`);
      setStatus({ type: 'error', text: `Could not send automatically (${res.detail}). You can email us directly.` });
      window.open(`mailto:people@adventband.org?subject=${subject}&body=${body}`, '_blank');
    }
  };

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
              onClick={() => navigate('/')}
              className="h-24 w-56 sm:h-28 sm:w-64 bg-no-repeat bg-contain bg-center invert brightness-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] cursor-pointer"
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
          <div className="flex items-start gap-3 text-sm sm:text-lg">
            <PlayCircleFilled className="mt-1" />
            <p className="opacity-95">Join Advent Band</p>
          </div>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-3xl">
            Use your gifts for the Gospel
          </h1>
          <p className="mt-3 max-w-3xl text-sm sm:text-base text-white/90">
            Tell us a bit about you, and where you’d like to serve.
          </p>
        </div>
      </header>

      <main className="bg-white">
        {/* Graphic collage strip */}
        {/* <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-10">
          <div className="grid grid-cols-3 gap-3 sm:gap-5">
            <div className="rounded-2xl overflow-hidden h-24 sm:h-40 bg-neutral-100"><img src={ab_about} alt="About" className="w-full h-full object-cover" /></div>
            <div className="rounded-2xl overflow-hidden h-24 sm:h-40 bg-neutral-100"><img src={ab_badges} alt="Badges" className="w-full h-full object-cover" /></div>
            <div className="rounded-2xl overflow-hidden h-24 sm:h-40 bg-neutral-100"><img src={ab_header} alt="Header" className="w-full h-full object-cover" /></div>
          </div>
        </div> */}

        {/* Culture / Why join */}
        <section>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-bold">Why Advent Band</h2>
            <p className="mt-2 text-neutral-700 max-w-3xl">We’re a volunteer-powered movement. You’ll grow in ownership, excellence, and spiritual joy while serving real needs.</p>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100"><TeamOutlined /></div>
                <h3 className="mt-3 font-semibold text-lg">People & Community</h3>
                <p className="mt-1 text-sm text-neutral-700">Belong to a praying, building, joyful crew that cares for one another.</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100"><HeartOutlined /></div>
                <h3 className="mt-3 font-semibold text-lg">Mission First</h3>
                <p className="mt-1 text-sm text-neutral-700">Every project serves evangelism, discipleship, and the Three Angels’ message.</p>
              </div>
              <div className="rounded-2xl border border-neutral-200 bg-white p-5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100"><FlagOutlined /></div>
                <h3 className="mt-3 font-semibold text-lg">Growth & Ownership</h3>
                <p className="mt-1 text-sm text-neutral-700">Lead lanes, mentor others, and ship ministry-grade work that matters.</p>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-neutral-200 bg-white p-6">
              <h3 className="font-semibold text-lg">Our culture</h3>
              <ul className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-neutral-700 list-disc pl-5">
                {AdventBand.why.map((w) => (<li key={w}>{w}</li>))}
              </ul>
            </div>
          </div>
        </section>

        {/* Roles */}
        <section className="bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-bold">Open volunteer roles</h2>
            <p className="mt-2 text-neutral-700 max-w-3xl">Pick a lane where you can serve best. We match you to a team and help you start well.</p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[{t:'Front-End Dev', d:'React/Tailwind components, accessibility, CMS integrations'},
                {t:'Back-End Dev', d:'APIs, authentication, automations, dashboards'},
                {t:'DevOps', d:'Deployments, monitoring, CI/CD, infra scripts'},
                {t:'UI/UX & Design', d:'Design systems, brand, web/mobile flows'},
                {t:'Writer / Content', d:'Blogs, devotionals, newsletters, testimonies'},
                {t:'Evangelism / Bible Studies', d:'Bible study coordination, interests follow-up'},
                {t:'Media / Video', d:'Filming, editing, reels, storytelling'},
                {t:'Events / Operations', d:'Programs, logistics, volunteer coordination'},
                {t:'Community & Onboarding', d:'Care, mentorship, clear pathways'},
              ].map((r) => (
                <div key={r.t} className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="flex items-center gap-2 text-amber-700 text-sm font-medium"><ThunderboltOutlined /> Role</div>
                  <h3 className="mt-1 font-semibold text-lg">{r.t}</h3>
                  <p className="mt-1 text-sm text-neutral-700">{r.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-bold">What to expect</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
              {[{t:'Apply',d:'Send your details and interests to help us match you.'},
                {t:'Intro & Alignment',d:'Quick call to understand your gifts, availability, and goals.'},
                {t:'Onboarding',d:'Get access, docs, and a buddy. Start on a small, clear task.'},
                {t:'Grow & Serve',d:'Take ownership, mentor others, and ship mission-impacting work.'},
              ].map((s, i) => (
                <div key={s.t} className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="inline-flex items-center gap-2 text-amber-700 text-sm font-medium"><CheckCircleOutlined /> Step {i+1}</div>
                  <h3 className="mt-1 font-semibold">{s.t}</h3>
                  <p className="mt-1 text-sm text-neutral-700">{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-bold">FAQ</h2>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {[{q:'How much time is expected?', a:'Most contributors commit ~6 hours/week. We plan around your availability and encourage sustainable rhythms.'},
                {q:'Is this paid?', a:'We are 100% volunteer-led. Some initiatives may attract sponsorships or small grants to support costs.'},
                {q:'Do I need to be SDA?', a:'We welcome anyone committed to Christ and aligned with our mission to spread the Three Angels’ message.'},
                {q:'Can I serve remotely?', a:'Yes. Many of our projects are fully remote with periodic in-person events and programs.'},
              ].map((f) => (
                <div key={f.q} className="rounded-2xl border border-neutral-200 bg-white p-5">
                  <div className="inline-flex items-center gap-2 text-amber-700 text-sm font-medium"><QuestionCircleOutlined /> Question</div>
                  <h3 className="mt-1 font-semibold">{f.q}</h3>
                  <p className="mt-1 text-sm text-neutral-700">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application form (moved to bottom) */}
        <section>
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
            <h2 className="text-2xl sm:text-3xl font-bold">Apply now</h2>
            <p className="mt-2 text-neutral-700">Tell us about yourself and where you’d love to serve. We’ll get back soon.</p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Full name</label>
                  <input required value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-black placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium">Email</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-black placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="you@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium">Preferred role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1 w-full border rounded-lg px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-amber-500">
                    {['Front-End Dev', 'Back-End Dev', 'DevOps', 'UI/UX & Design', 'Writer / Content', 'Evangelism / Bible Studies', 'Media / Video', 'Events / Operations', 'Community & Onboarding'].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium">Phone (optional)</label>
                  <input className="mt-1 w-full border rounded-lg px-3 py-2 text-black placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="+254 7xx xxx xxx" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Message (optional)</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="mt-1 w-full border rounded-lg px-3 py-2 text-black placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-amber-500" placeholder="Share experience, availability, or questions" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button type="submit" disabled={loading} className="rounded-full bg-amber-600 text-white px-5 py-3 font-semibold hover:bg-amber-500 disabled:opacity-60">{loading ? 'Sending…' : 'Submit'}</button>
                <a className="text-sm underline underline-offset-4" href="mailto:people@adventband.org?subject=Join Advent Band">Prefer email? people@adventband.org</a>
              </div>

              {status && (
                <div className={`mt-2 text-sm ${status.type === 'ok' ? 'text-green-700' : 'text-red-700'}`}>{status.text}</div>
              )}
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
