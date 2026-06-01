import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, MailOutlined, UserOutlined, PhoneOutlined, CalendarOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { ipayApiUrl } from '../../config/api';
import Footer from '../../components/Footer';
import { trackEvent, trackPage } from '../../utils/track';

type Distance = '0' | '5K' | '10K' | '21K';
type Pack = 'standard' | 'premium';
const STORAGE_KEY = 'runRegForm';
const PHONE_REGEX = /^\+254\d{9}$/;
const PACK_PRICE: Record<Pack, number> = { standard: 1500, premium: 2500 };

export default function RunRegistration() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).fullName || '' : '';
  });
  const [email, setEmail] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).email || '' : '';
  });
  const [phone, setPhone] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).phone || '' : '';
  });
  const [distance, setDistance] = useState<Distance>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved).distance as Distance) || '5K' : '5K';
  });
  const [pack, setPack] = useState<Pack>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved).pack as Pack) || 'standard' : 'standard';
  });
  const [challengeOnly, setChallengeOnly] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Boolean(JSON.parse(saved).challengeOnly ?? true) : true;
  });
  const [city, setCity] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).city || '' : '';
  });
  const [addDonation, setAddDonation] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? Boolean(JSON.parse(saved).addDonation) : false;
  });
  const [promoCode, setPromoCode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).promoCode || '' : '';
  });
  const [donationAmount, setDonationAmount] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).donationAmount || '' : '';
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null);
  const [disableSubmit, setDisableSubmit] = useState(false);
  const normalizedPhone = normalizeKenyanPhone(phone);
  const isPhoneValid = PHONE_REGEX.test(normalizedPhone);

  useState(() => { trackPage('run-register'); return undefined; });

  const persist = (next: {
    fullName?: string;
    email?: string;
    phone?: string;
    distance?: Distance;
    pack?: Pack;
    city?: string;
    challengeOnly?: boolean;
    addDonation?: boolean;
    promoCode?: string;
    donationAmount?: string;
  }) => {
    const current = {
      fullName,
      email,
      phone,
      distance,
      pack,
      city,
      challengeOnly,
      addDonation,
      promoCode,
      donationAmount,
    };
    const merged = { ...current, ...next };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPhone = normalizeKenyanPhone(phone);
    setPhone(finalPhone);
    persist({ phone: finalPhone });
    if (!PHONE_REGEX.test(finalPhone)) {
      setStatus({ type: 'error', text: 'Phone must be Kenyan format: +2547XXXXXXXX' });
      return;
    }
    setStatus(null);
    setLoading(true);
    try { trackEvent('run.register.submit', { pack, distance }); } catch {}
    try {
      const donationValue = addDonation ? Math.max(0, Number(donationAmount) || 0) : 0;
      const baseAmount = PACK_PRICE[pack];
      const totalAmount = baseAmount + donationValue;
      const normalizedPromoCode = promoCode.trim().toUpperCase();
      const payload = {
        email,
        phone: finalPhone,
        name: fullName,
        city,
        challenge_only: challengeOnly,
        distance: challengeOnly ? '0' : distance.replace('K', ''),
        pack: pack === 'standard' ? 'standard' : 'premium',
        ticketPrice: totalAmount,
        donation: donationValue,
        organization: 'Advent Band',
        promoCode: normalizedPromoCode || undefined,
      };
      const res = await fetch(ipayApiUrl('/accounts/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.data) {
        throw new Error(json?.message || 'Could not complete registration');
      }

      const registrationMode = json.data.registrationMode as string | undefined;
      const invoiceCode = json.data.transaction?.ws_code as string | undefined;

      if (registrationMode === 'promo') {
        setDisableSubmit(true);
        persist({ promoCode: normalizedPromoCode });
        try { trackEvent('run.register.promo_applied', { pack, distance, promoCode: normalizedPromoCode }); } catch {}
        navigate(`/run/promo-confirmation?promoCode=${encodeURIComponent(normalizedPromoCode)}&name=${encodeURIComponent(fullName)}`, {
          state: {
            promoCode: normalizedPromoCode,
            name: fullName,
          },
          replace: true,
        });
        return;
      }

      if (!invoiceCode) {
        throw new Error(json?.message || 'Could not start payment');
      }

      setStatus({ type: 'ok', text: 'Account created. Waiting for STK push…' });
      setDisableSubmit(true);
      navigate(`/run/payment-status?invoice=${encodeURIComponent(invoiceCode)}&phone=${encodeURIComponent(finalPhone)}`, {
        state: {
          invoiceCode,
          phone: finalPhone,
        },
        replace: true,
      });
      persist({}); // ensure latest is saved
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Could not submit. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftOutlined /> Back
          </button>
          <div className="text-sm text-neutral-600 flex items-center gap-2">
            <CalendarOutlined /> Apr 5–19 virtual • Apr 19 race day
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-3xl bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Register for the Annual Run</h1>
                <p className="text-sm text-neutral-700">Pick your distance and pack. After approval, we will email your eBib number and image.</p>
              </div>
              {/* <div className="text-sm text-neutral-600">Cause for 2026: Kids with neurodivergent disorders.</div> */}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LabeledInput label="Full name" icon={<UserOutlined />} value={fullName} onChange={(v) => { setFullName(v); persist({ fullName: v }); }} required />
                <LabeledInput label="Email" type="email" icon={<MailOutlined />} value={email} onChange={(v) => { setEmail(v); persist({ email: v }); }} required />
                <LabeledInput
                  label="Phone (Kenya only)"
                  type="tel"
                  icon={<PhoneOutlined />}
                  value={phone}
                  placeholder="+2547XXXXXXXX"
                  onChange={(v) => {
                    const normalized = normalizeKenyanPhone(v);
                    setPhone(normalized);
                    persist({ phone: normalized });
                  }}
                  required
                />
                <LabeledInput label="City (for virtual tracker)" icon={<EnvironmentOutlined />} value={city} onChange={(v) => { setCity(v); persist({ city: v }); }} />
                <LabeledInput
                  label="Promo code (optional)"
                  value={promoCode}
                  placeholder="e.g. STAFF100"
                  onChange={(v) => {
                    const normalized = v.toUpperCase().replace(/\s+/g, '');
                    setPromoCode(normalized);
                    persist({ promoCode: normalized });
                  }}
                />
              </div>

                <fieldset className="rounded-2xl border border-neutral-200 p-4">
                  <legend className="text-sm font-semibold text-neutral-800">Participation</legend>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                    onClick={() => {
                      setChallengeOnly(true);
                      setDistance('0');
                      persist({ challengeOnly: true, distance: '0' });
                    }}
                    className={`text-left rounded-xl border px-3 py-2 text-sm font-semibold ${challengeOnly ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:border-neutral-300'}`}
                  >
                    Challenge only (Apr 5–19)
                    <div className="text-xs font-normal text-neutral-200/80 italic">No extra fee required.</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChallengeOnly(false);
                      if (distance === '0') { setDistance('5K'); persist({ distance: '5K' }); }
                      persist({ challengeOnly: false });
                    }}
                    className={`text-left rounded-xl border px-3 py-2 text-sm font-semibold ${!challengeOnly ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:border-neutral-300'}`}
                  >
                    Challenge + race day (Apr 19)
                    <div className="text-xs font-normal text-neutral-200/80 italic">No extra fee required.</div>
                  </button>
                  </div>
                </fieldset>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <fieldset className="rounded-2xl border border-neutral-200 p-4">
                  <legend className="text-sm font-semibold text-neutral-800">Pack</legend>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[
                      { key: 'standard', label: 'Kes 1,500 Standard', sub: 'Finisher medal, hydration & recovery pack, community support system, vibes, impact' },
                      { key: 'premium', label: 'Kes 2,500 Premium', sub: 'Finisher medal, event shirt, hydration & recovery pack, community support system, vibes, impact' },
                    ].map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => { setPack(p.key as Pack); persist({ pack: p.key as Pack }); }}
                        className={`text-left rounded-xl border px-3 py-2 text-sm font-semibold ${pack === p.key ? 'bg-amber-500 border-amber-500 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:border-neutral-300'}`}
                      >
                        <div>{p.label}</div>
                        <div className="text-xs font-normal text-neutral-200/80">{pack === p.key ? p.sub : ''}</div>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="rounded-2xl border border-neutral-200 p-4">
                  <legend className="text-sm font-semibold text-neutral-800">Race day distance</legend>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(['5K', '10K', '21K'] as Distance[]).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { if (!challengeOnly) { setDistance(d); persist({ distance: d }); } }}
                        className={`rounded-xl border px-3 py-2 text-sm font-semibold ${distance === d ? 'bg-amber-500 border-amber-500 text-white' : 'bg-neutral-50 border-neutral-200 text-neutral-800'} ${challengeOnly ? 'opacity-60 cursor-not-allowed' : 'hover:border-neutral-300'}`}
                        disabled={challengeOnly}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-neutral-600">
                    Virtual: 4 km daily (Apr 5–19). Race day distance applies only if you choose Challenge + race day.
                  </p>
                </fieldset>
              </div>

              <fieldset className="rounded-2xl border border-neutral-200 p-4">
                <legend className="text-sm font-semibold text-neutral-800">Add a donation?</legend>
                <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                  <input
                    type="checkbox"
                    checked={addDonation}
                    onChange={(e) => {
                      setAddDonation(e.target.checked);
                      persist({ addDonation: e.target.checked });
                    }}
                    className="h-4 w-4"
                  />
                  I want to add a donation on top of my pack
                </label>
                {addDonation && (
                  <div className="mt-3">
                    <label className="block text-sm font-semibold text-neutral-800">
                      Donation amount (KES)
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={donationAmount}
                        onChange={(e) => {
                          setDonationAmount(e.target.value);
                          persist({ donationAmount: e.target.value });
                        }}
                        className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                        placeholder="e.g., 500"
                      />
                    </label>
                    <p className="mt-1 text-xs text-neutral-600">This is added to your pack total before STK push.</p>
                  </div>
                )}
              </fieldset>

              <div className="text-xs text-neutral-600">
                After you submit, you&apos;ll get an STK push to confirm payment unless a valid promo code clears your registration immediately. Phone must be in +2547XXXXXXXX format. Leave this page open; we&apos;ll check your payment status automatically when payment is required.
                For support, email <a className="text-amber-700 underline" href="mailto:run@adventband.org">run@adventband.org</a>.
              </div>

              <div className="text-xs text-neutral-700" aria-live="polite">
                <span className="font-semibold">By registering, you agree to the run docs: </span>
                <span className="inline-flex flex-wrap items-center gap-2">
                  <a style={{ textDecoration: 'none', color: '#072a5c', fontSize: '13px' }} href="https://adventband.org/run_docs/privacy-policy.html">Privacy Policy</a>
                  <span aria-hidden="true">•</span>
                  <a style={{ textDecoration: 'none', color: '#072a5c', fontSize: '13px' }} href="https://adventband.org/run_docs/terms-of-participation.html">Terms of Participation</a>
                  <span aria-hidden="true">•</span>
                  <a style={{ textDecoration: 'none', color: '#072a5c', fontSize: '13px' }} href="https://adventband.org/run_docs/rulebook.html">Rulebook</a>
                  <span aria-hidden="true">•</span>
                  <a style={{ textDecoration: 'none', color: '#072a5c', fontSize: '13px' }} href="https://adventband.org/run_docs/disclaimer.html">Disclaimer</a>
                </span>
              </div>

              {status && (
                <div className={`text-sm ${status.type === 'ok' ? 'text-emerald-700' : 'text-rose-600'}`} aria-live="polite">
                  {status.text}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-500 disabled:opacity-60"
                  disabled={loading || !fullName || !email || !phone || disableSubmit || !isPhoneValid}
                >
                  {loading ? 'Submitting…' : 'Submit registration'}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
                  onClick={() => navigate('/run')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer variant="neutral" />
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  onBlur,
  type = 'text',
  icon,
  required = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  onBlur?: (val: string) => void;
  type?: string;
  icon?: React.ReactNode;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-semibold text-neutral-800">
      {label}
      <div className="mt-1 flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-2 shadow-sm focus-within:border-amber-500">
        {icon && <span className="text-neutral-500">{icon}</span>}
        <input
          type={type}
          className="w-full border-none focus:outline-none text-sm text-neutral-900"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onBlur?.(e.target.value)}
          required={required}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

function normalizeKenyanPhone(input: string) {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return `+${digits.slice(0, 12)}`; // +254XXXXXXXXX
  if (digits.startsWith('0')) return `+254${digits.slice(1, 10)}`;
  if (digits.startsWith('7')) return `+254${digits.slice(0, 9)}`;
  return `+254${digits.slice(0, 9)}`;
}
