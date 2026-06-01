import { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined, CheckCircleFilled } from '@ant-design/icons';
import Footer from '../../components/Footer';
import { trackEvent, trackPage } from '../../utils/track';

export default function PromoConfirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const statePromoCode = (location.state as any)?.promoCode as string | undefined;
  const stateName = (location.state as any)?.name as string | undefined;
  const promoCode = useMemo(() => statePromoCode || searchParams.get('promoCode') || '', [statePromoCode, searchParams]);
  const name = stateName || searchParams.get('name') || '';

  useEffect(() => {
    trackPage('run-promo-confirmation');
    try { trackEvent('run.register.promo_confirmation_view', { promoCode }); } catch {}
  }, [promoCode]);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 text-sm font-semibold text-neutral-700 hover:text-neutral-900"
            onClick={() => navigate('/run')}
          >
            <ArrowLeftOutlined /> Back to run
          </button>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl bg-white border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircleFilled className="text-emerald-600 text-2xl" />
              <div>
                <h1 className="text-2xl font-bold">Registration confirmed</h1>
                <p className="text-sm text-neutral-700">
                  {name ? `${name}, your` : 'Your'} run registration was cleared successfully with a promo code.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
              <div className="font-semibold">Promo code</div>
              <div className="font-mono text-base text-neutral-900">{promoCode || 'Applied'}</div>
              <div className="text-xs text-neutral-600">No STK payment was required for this registration.</div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-neutral-700">
              <p>Your ticket and eBib are being sent to your email. If you do not see them shortly, check your spam or junk folder.</p>
              <p>For support, email <a className="text-amber-700 underline" href="mailto:run@adventband.org">run@adventband.org</a>.</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => navigate('/run')}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500"
              >
                Back to run page
              </button>
              <button
                onClick={() => navigate('/run/register')}
                className="inline-flex items-center justify-center rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
              >
                New registration
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer variant="neutral" />
    </div>
  );
}
