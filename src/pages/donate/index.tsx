import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, MailOutlined, UserOutlined, PhoneOutlined, DollarOutlined } from '@ant-design/icons';
import { ipayApiUrl } from '../../config/api';
import Footer from '../../components/Footer';
import { trackEvent, trackPage } from '../../utils/track';

const PHONE_REGEX = /^\+254\d{9}$/;

export default function DonatePage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { type: 'ok' | 'error'; text: string }>(null);
  const [disableSubmit, setDisableSubmit] = useState(false);

  useState(() => { trackPage('donate'); return undefined; });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    const normalizedPhone = normalizeKenyanPhone(phone);
    setPhone(normalizedPhone);
    if (!PHONE_REGEX.test(normalizedPhone)) {
      setStatus({ type: 'error', text: 'Phone must be Kenyan format: +2547XXXXXXXX' });
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setStatus({ type: 'error', text: 'Enter a valid donation amount.' });
      return;
    }
    setLoading(true);
    try { trackEvent('donate.submit', { amount: Number(amount) }); } catch {}
    try {
      const res = await fetch(ipayApiUrl('/donors'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          phone: normalizedPhone,
          name: fullName,
          amount,
        }),
      });
      const json = await res.json().catch(() => null);
      const invoice = json?.data?.transaction?.ws_code || json?.transaction?.ws_code;
      if (!res.ok || !invoice) throw new Error(json?.message || 'Donation failed, please try again.');
      setStatus({ type: 'ok', text: 'Donation created. Waiting for STK push…' });
      setDisableSubmit(true);
      navigate(`/donate/status?invoice=${encodeURIComponent(invoice)}&phone=${encodeURIComponent(normalizedPhone)}`, {
        state: { invoice, phone: normalizedPhone },
        replace: true,
      });
    } catch (err: any) {
      setStatus({ type: 'error', text: err?.message || 'Could not submit donation.' });
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
          <div className="text-sm text-neutral-600">Support the run — direct donation</div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="rounded-3xl bg-white border border-neutral-200 p-6 shadow-sm">
            <h1 className="text-2xl sm:text-3xl font-bold">Donate to Advent Band Run</h1>
            <p className="text-sm text-neutral-700 mt-2">Your gift powers family counseling, volunteer care squads, and training for caregivers.</p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <LabeledInput label="Full name" icon={<UserOutlined />} value={fullName} onChange={setFullName} required />
                <LabeledInput label="Email" type="email" icon={<MailOutlined />} value={email} onChange={setEmail} required />
                <LabeledInput label="Phone (Kenya only)" type="tel" icon={<PhoneOutlined />} value={phone} onChange={setPhone} required placeholder="+2547XXXXXXXX" />
                <LabeledInput label="Amount (KES)" type="number" icon={<DollarOutlined />} value={amount} onChange={setAmount} required min="50" step="50" />
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
                  disabled={loading || !fullName || !email || !phone || !amount || disableSubmit}
                >
                  {loading ? 'Submitting…' : 'Submit donation'}
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
  type = 'text',
  icon,
  required = false,
  placeholder,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
  icon?: React.ReactNode;
  required?: boolean;
  placeholder?: string;
  min?: string;
  step?: string;
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
          required={required}
          placeholder={placeholder}
          min={min}
          step={step}
        />
      </div>
    </label>
  );
}

function normalizeKenyanPhone(input: string) {
  const digits = input.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254')) return `+${digits.slice(0, 12)}`;
  if (digits.startsWith('0')) return `+254${digits.slice(1, 10)}`;
  if (digits.startsWith('7')) return `+254${digits.slice(0, 9)}`;
  return `+254${digits.slice(0, 9)}`;
}
