import { Link } from 'react-router-dom';
import { useState } from 'react';
import { sendSubscribeEmail } from '../utils/sendEmail';
import { trackEvent } from '../utils/track';

export default function Footer({ variant = 'brown' }: { variant?: 'brown' | 'neutral' }) {
  const isNeutral = variant === 'neutral';
  const wrapper = isNeutral
    ? 'bg-neutral-100 text-neutral-900'
    : 'bg-[#3a190b] text-white';
  const divider = isNeutral ? 'border-neutral-300' : 'border-white/20';
  const sectionTitle = 'font-semibold mb-2';
  const navList = 'space-y-1 opacity-90';
  const navListGrid = 'opacity-90 grid grid-cols-2 gap-x-6 gap-y-1';
  const linkClass = 'hover:underline';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null);

  return (
    <footer className={`${wrapper} mt-auto`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <h4 className={sectionTitle}>Advent Band</h4>
          <p className="text-sm opacity-90">Faith. Technology. Mission. United.</p>
          <div className="mt-4">
            <h5 className="font-semibold mb-1 text-sm">Newsletter</h5>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setStatus(null);
                setLoading(true);
                try { trackEvent('footer.subscribe.submit'); } catch (error) { void error }
                const res = await sendSubscribeEmail(email);
                setLoading(false);
                if (res.ok) {
                  setStatus({ type: 'ok', text: 'Subscribed! Check your inbox soon.' });
                  setEmail('');
                  try { trackEvent('footer.subscribe.success'); } catch (error) { void error }
                } else {
                  setStatus({ type: 'error', text: 'Could not subscribe. Email people@adventband.org.' });
                  try { trackEvent('footer.subscribe.error', { detail: res.detail }); } catch (error) { void error }
                }
              }}
              className="flex items-stretch gap-2"
            >
              <input
                type="email"
                required
                inputMode="email"
                autoComplete="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-full border text-[13px] focus:outline-none ${isNeutral ? 'bg-white border-neutral-300 text-black placeholder-neutral-500' : 'bg-white/95 border-white/40 text-black placeholder-black/60'}`}
              />
              <button
                type="submit"
                disabled={loading || !email}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap ${isNeutral ? 'bg-black text-white hover:bg-neutral-800 disabled:opacity-60' : 'bg-white text-black hover:bg-white/90 disabled:opacity-60'}`}
              >
                {loading ? 'Subscribing…' : 'Subscribe'}
              </button>
            </form>
            {status && (
              <div className={`mt-1 text-xs ${status.type === 'ok' ? 'text-green-200' : isNeutral ? 'text-red-700' : 'text-red-200'}`}>
                {status.text}
              </div>
            )}
          </div>
        </div>
        <nav className="text-sm">
          <h4 className={sectionTitle}>Navigate</h4>
          <ul className={navListGrid}>
            <li><Link className={linkClass} to="/">Home</Link></li>
            <li><Link className={linkClass} to="/vespers">Vespers</Link></li>
            <li><Link className={linkClass} to="/event">Event</Link></li>
            <li><Link className={linkClass} to="/ministry">Ministry</Link></li>
            <li><Link className={linkClass} to="/badges">Badges</Link></li>
            <li><Link className={linkClass} to="/run">Run</Link></li>
            <li><Link className={linkClass} to="/merchandise">Merchandise</Link></li>
            <li><Link className={linkClass} to="/about">About</Link></li>
            <li><Link className={linkClass} to="/blogs">Blogs</Link></li>
            <li><Link className={linkClass} to="/join">Join</Link></li>
            <li><Link className={linkClass} to="/privacy">Privacy</Link></li>
          </ul>
        </nav>
        <div className="text-sm">
          <h4 className={sectionTitle}>Contact</h4>
          <ul className={navList}>
            <li><a href="mailto:people@adventband.org" className={linkClass}>people@adventband.org</a></li>
            <li>adventband.org</li>
          </ul>
        </div>
      </div>
      <div className={`text-center text-xs py-4 border-t ${divider} opacity-70`}>
        © {new Date().getFullYear()} AdventBand. All rights reserved.
      </div>
    </footer>
  );
}
