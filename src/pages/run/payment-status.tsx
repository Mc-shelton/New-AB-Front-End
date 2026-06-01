import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftOutlined, LoadingOutlined, CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons';
import { ipayApiUrl } from '../../config/api';
import Footer from '../../components/Footer';
import { trackEvent, trackPage } from '../../utils/track';

type TxStatus = 'pending' | 'success' | 'failed';

export default function PaymentStatus() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const stateInvoice = (location.state as any)?.invoiceCode as string | undefined;
  const statePhone = (location.state as any)?.phone as string | undefined;
  const invoice = useMemo(() => stateInvoice || searchParams.get('invoice') || '', [stateInvoice, searchParams]);
  const phone = statePhone || searchParams.get('phone') || '';

  const [status, setStatus] = useState<TxStatus>('pending');
  const [detail, setDetail] = useState<string>('Waiting for STK push to arrive…');
  const poller = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    trackPage('run-payment-status');
  }, []);

  useEffect(() => {
    if (!invoice) return;
    const start = setTimeout(() => {
      poller.current = setInterval(async () => {
        try {
          const res = await fetch(ipayApiUrl(`/transactions/status/${invoice}`));
          const json = await res.json();
          const txStatus = json?.transaction?.status as string | undefined;
          if (txStatus === 'success' || txStatus === 'failed') {
            setStatus(txStatus);
            setDetail(json?.transaction?.rec_desc || txStatus);
            trackEvent('run.payment.status', { invoice, status: txStatus });
            if (poller.current) clearInterval(poller.current);
          } else {
            setDetail(json?.transaction?.rec_desc || 'Still processing…');
          }
        } catch (err: any) {
          setDetail(err?.message || 'Checking status failed. Retrying…');
        }
      }, 2000);
    }, 10000);

    return () => {
      clearTimeout(start);
      if (poller.current) clearInterval(poller.current);
    };
  }, [invoice]);

  if (!invoice) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="max-w-lg text-center space-y-3">
            <p className="text-lg font-semibold text-rose-600">Missing payment reference.</p>
            <p className="text-sm text-neutral-600">Please start the registration again.</p>
            <button
              onClick={() => navigate('/run/register')}
              className="inline-flex items-center justify-center rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-amber-500"
            >
              Back to register
            </button>
          </div>
        </main>
        <Footer variant="neutral" />
      </div>
    );
  }

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
          <div className="text-sm text-neutral-600">Invoice: {invoice}</div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-3xl bg-white border border-neutral-200 p-6 shadow-sm">
            <h1 className="text-2xl font-bold">Confirm payment</h1>
            <p className="mt-2 text-sm text-neutral-700">
              An STK push will be sent to {phone || 'your phone'}. Enter your M‑Pesa PIN to complete.
              We&apos;ll check the transaction every 2 seconds after an initial 10‑second wait.
              Need help? Email <a className="text-amber-700 underline" href="mailto:run@adventband.org">run@adventband.org</a>.
            </p>

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-800">
              <div className="font-semibold">Invoice / ws_code</div>
              <div className="font-mono text-base text-neutral-900">{invoice}</div>
              <div className="text-xs text-neutral-600">Keep this code for tracking or support.</div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {status === 'pending' && <LoadingOutlined className="text-amber-500 text-xl" />}
              {status === 'success' && <CheckCircleFilled className="text-emerald-600 text-xl" />}
              {status === 'failed' && <CloseCircleFilled className="text-rose-600 text-xl" />}
              <div>
                <div className="text-sm font-semibold capitalize">{status}</div>
                <div className="text-sm text-neutral-700">{detail}</div>
              </div>
            </div>

            {status === 'success' && (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-neutral-700">
                  Payment confirmed. We&apos;re emailing your eBib, ticket, and receipt to you now. Please check your inbox,
                  and if you don&apos;t see it in a few minutes, look in your spam/junk folder.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate('/run')}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500"
                  >
                    Back to run page
                  </button>
                </div>
              </div>
            )}

            {status === 'failed' && (
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={() => navigate('/run/register')}
                  className="inline-flex items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-rose-500"
                >
                  Retry registration
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer variant="neutral" />
    </div>
  );
}
