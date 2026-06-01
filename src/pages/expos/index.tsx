import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarOutlined, TeamOutlined, BookOutlined, HeartOutlined, FieldTimeOutlined, EnvironmentOutlined, CompassOutlined, MailOutlined } from '@ant-design/icons';
import ab_logo from '../../assets/images/ab_logo.png';
import ab_about from '../../assets/images/ministry.jpg';
import nextEventImg from '../../assets/images/next_event.jpg';
import jabaliEventImg from '../../assets/images/jabali_event.jpeg';
import tukEventImg from '../../assets/images/tuk_event.jpg';
import mmuExpoImg from '../../assets/images/mmu_expo.jpg';
import stHannah1Img from '../../assets/images/stHan_1_event.jpg';
import stHannah2Img from '../../assets/images/stHan_2_event.jpg';
import Footer from '../../components/Footer';
import { trackEvent, trackPage } from '../../utils/track';

export default function ExposAndChaplaincy() {
  const navigate = useNavigate();

  useEffect(() => { trackPage('ministry'); }, []);

  const inviteHref = 'mailto:ministry@adventband.org?subject=Invite Advent Band to our campus&body=Hello Advent Band%2C%0A%0AWe would like to explore a collaboration with you.%0A%0AEvent or need:%0ADates:%0ALocation:%0AChurch / School / Organization:%0AContact person:%0A%0AThank you.';

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header className="relative text-white" style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.82), rgba(0,0,0,0.35)), url('${ab_about}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="w-full bg-gradient-to-b from-black/60 to-transparent">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 flex items-end justify-between">
            <div
              onClick={() => navigate('/')}
              className="h-24 w-56 sm:h-28 sm:w-64 bg-no-repeat bg-contain bg-center invert brightness-0 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)] cursor-pointer"
              style={{ backgroundImage: `url('${ab_logo}')` }}
              aria-label="AdventBand logo"
              role="img"
            />
            <button
              type="button"
              onClick={() => { window.open(inviteHref, '_blank'); try { trackEvent('expos.hero.invite_click'); } catch {} }}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/80 px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap hover:bg-white hover:text-black transition"
            >
              <MailOutlined /> Invite us
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 pb-10 sm:pb-16">
          <p className="opacity-95 text-sm sm:text-base uppercase tracking-wide">Schools • Missions • Chaplaincy</p>
          <h1 className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight max-w-4xl">Outreach and inreach through practical ministry</h1>
          <p className="mt-4 max-w-3xl text-sm sm:text-base text-white/90">
            We stand with schools and churches to help them build and run ministries and missions. Sponsoring most of the events so everyone is able to hold expos, trainings and missions.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="rounded-full bg-amber-600 px-5 py-3 font-semibold shadow hover:bg-amber-500"
              onClick={() => { window.open(inviteHref, '_blank'); try { trackEvent('expos.hero.invite_cta'); } catch {} }}
            >
              Invite us to your school
            </button>
            <button
              className="rounded-full border px-5 py-3 font-semibold hover:bg-white/10"
              onClick={() => { navigate('#how'); }}
            >
              How we collaborate
            </button>
          </div>
          <div className="mt-6 flex flex-wrap gap-2 text-xs sm:text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5"><EnvironmentOutlined /> Kenya-wide & regionally hybrid</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5"><CalendarOutlined /> Custom dates & rhythms</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5"><TeamOutlined /> Student & staff co-leadership</span>
          </div>
        </div>
      </header>

      <main className="bg-white">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
          <div className="grid gap-8 lg:grid-cols-3">
            <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/5 text-amber-600"><HeartOutlined className="text-lg" /></div>
              <h2 className="mt-4 text-xl font-bold">Medical & cooking expos</h2>
              <p className="mt-2 text-sm text-neutral-700">
                We help campuses host Adventist health-message expos. Our team brings the gear, lifestyle stations, and logistics so yours can minister to people.
              </p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/5 text-amber-600"><BookOutlined className="text-lg" /></div>
              <h2 className="mt-4 text-xl font-bold">Training intensives</h2>
              <p className="mt-2 text-sm text-neutral-700">
                Short labs for music ministry, personal witnessing, and mission planning—rooted in Adventist identity and ready to deploy.
              </p>
            </article>
            <article className="rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-900/5 text-amber-600"><FieldTimeOutlined className="text-lg" /></div>
              <h2 className="mt-4 text-xl font-bold">Chaplaincy support</h2>
              <p className="mt-2 text-sm text-neutral-700">
                Sabbath fellowship, nurture groups, and care rhythms that steady the chaplains already serving on campus.
              </p>
            </article>
          </div>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-center">
              <div className="space-y-4">
                <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Current mission focus</span>
                <h2 className="text-2xl sm:text-3xl font-bold">MMUSDA Mission Week</h2>
                <p className="text-sm sm:text-base text-neutral-700">
                  Morning visitations, afternoon to evening health screenings, and evening open-air sessions at the heart of the varsity—hosted with students.
                </p>
                <ul className="grid gap-2 text-sm text-neutral-700">
                  <li className="flex items-center gap-2"><CalendarOutlined className="text-amber-600" /> 05-18 September 2025</li>
                  <li className="flex items-center gap-2"><EnvironmentOutlined className="text-amber-600" /> Multimedia University SDA Church</li>
                  <li className="flex items-center gap-2"><TeamOutlined className="text-amber-600" /> Joint teams from associates & local churches</li>
                </ul>
              </div>
              <div className="rounded-2xl border border-neutral-200 overflow-hidden">
                <img src={nextEventImg} alt="Students leading worship during Nairobi mission week" className="w-full h-64 object-cover" />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold">Recent campus stories</h2>
              <p className="text-sm text-neutral-600 max-w-2xl">
                Glimpses of how God is working through schools, chaplains, and partners.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <img src={jabaliEventImg} alt="Choir leading worship at university chaplaincy rally" className="h-48 w-full object-cover" />
                <div className="p-5 space-y-2 text-sm text-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900">Jabali Chorale Chaplaincy Rally</h3>
                  <p>Evening revival with Adventist choirs, Sabbath school teacher coaching, and late-night prayer circles.</p>
                  <div className="text-xs text-neutral-500">Maseno University • August 2025</div>
                </div>
              </article>
              <article className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <img src={tukEventImg} alt="Students running health checks at TUK" className="h-48 w-full object-cover" />
                <div className="p-5 space-y-2 text-sm text-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900">TUK City Health Expo</h3>
                  <p>Dental checks, lifestyle counselling, and prayer booths staffed by Adventist student missionaries.</p>
                  <div className="text-xs text-neutral-500">Technical University of Kenya • July 2025</div>
                </div>
              </article>
              <article className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <img src={mmuExpoImg} alt="Students praying during MMU mission" className="h-48 w-full object-cover" />
                <div className="p-5 space-y-2 text-sm text-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900">MMU Mission Sabbath</h3>
                  <p>Sabbath worship, afternoon outreach training, and evening street ministry with Adventist youth fellowships.</p>
                  <div className="text-xs text-neutral-500">Multi Media University • June 2025</div>
                </div>
              </article>
              <article className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <img src={stHannah1Img} alt="Students gathered during St. Hannah's week of prayer" className="h-48 w-full object-cover" />
                <div className="p-5 space-y-2 text-sm text-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900">St. Hannah's School</h3>
                  <p>Chaplaincy sabbath worship.</p>
                  <div className="text-xs text-neutral-500">St. Hannah's School • May 2025</div>
                </div>
              </article>
              <article className="rounded-2xl border border-neutral-200 bg-white overflow-hidden">
                <img src={stHannah2Img} alt="Outdoor health expo during St. Hannah's outreach" className="h-48 w-full object-cover" />
                <div className="p-5 space-y-2 text-sm text-neutral-700">
                  <h3 className="text-lg font-semibold text-neutral-900">St. Hannah's School</h3>
                  <p>Chaplaincy sabbath worship.</p>
                  <div className="text-xs text-neutral-500">St. Hannah's School • May 2025</div>
                </div>
              </article>
            </div>
          </section>

          <section id="how" className="rounded-3xl border border-neutral-200 bg-neutral-50 p-6 sm:p-10 space-y-8">
            <div className="max-w-3xl space-y-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700">Collaboration journey</span>
              <h2 className="text-3xl sm:text-4xl font-bold">How we walk with your school</h2>
              <p className="text-sm sm:text-base text-neutral-700">
                We come as fellow workers in the Advent movement—listening first, planning with you, and leaving tools your leaders can keep using.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { title: 'Map the story', text: 'We listen to your vision, student atmosphere, and community needs to craft a prayerful plan.', icon: <CompassOutlined className="text-lg" /> },
                { title: 'Equip your team', text: 'Training for department leaders, medical missionaries, small-group hosts, and mission coordinators.', icon: <TeamOutlined className="text-lg" /> },
                { title: 'Work together', text: 'Co-lead expos, chaplaincy, and local missions with students at the center.', icon: <HeartOutlined className="text-lg" /> },
                { title: 'Hand over & support', text: 'Resource packs, follow-up systems, and coaching that keep the work moving after we leave.', icon: <BookOutlined className="text-lg" /> },
              ].map((step) => (
                <div key={step.title} className="rounded-2xl border border-neutral-200 bg-white p-5 space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-900/5 text-amber-600">{step.icon}</div>
                  <h3 className="mt-3 text-lg font-semibold text-neutral-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-neutral-700">{step.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-neutral-200 bg-white p-6 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] items-center">
              <div className="space-y-4">
                <h2 className="text-2xl sm:text-3xl font-bold">Ready to collaborate?</h2>
                <p className="text-sm sm:text-base text-neutral-700">
                  Tell us what your campus needs. We shape the schedule together, serve side by side, and stay reachable after the program.
                </p>
                <ul className="grid gap-3 text-sm text-neutral-700">
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-600">•</span> Flexible tracks for Adventist or mixed-faith settings—rooted in present truth.</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-600">•</span> Worship leaders, health volunteers, and storytellers ready to lift up Christ in every segment.</li>
                  <li className="flex items-start gap-2"><span className="mt-0.5 text-amber-600">•</span> Simple follow-up guides so your team keeps momentum after Sabbath.</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-neutral-200 bg-neutral-900 text-white p-6 shadow-xl">
                <h3 className="text-xl font-semibold">Invite us today</h3>
                <p className="mt-2 text-sm text-white/80">Tell us about your school or ministry. We respond within 48 hours.</p>
                <div className="mt-5 space-y-3 text-sm text-white/80">
                  <div className="flex items-center gap-2"><MailOutlined /> ministry@adventband.org</div>
                  <div className="flex items-center gap-2"><CalendarOutlined /> Weekend intensives, mission weeks & semester chaplaincy</div>
                  <div className="flex items-center gap-2"><EnvironmentOutlined /> Nairobi • Kenya • East Africa (virtual support worldwide)</div>
                </div>
                <button
                  className="mt-6 w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-neutral-900 shadow hover:bg-amber-400"
                  onClick={() => { window.open(inviteHref, '_blank'); try { trackEvent('expos.cta.invite'); } catch {} }}
                >
                  Invite us to your school
                </button>
              </div>
            </div>
          </section>
        </section>
      </main>

      <Footer variant="neutral" />
    </div>
  );
}
