import React, { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import jsQR from 'jsqr';
import { ipayApiUrl } from '../../config/api';
import Footer from '../../components/Footer';
import ab_logo from '../../assets/images/ab_logo.png';

declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats?: string[] }): {
        detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
      };
      getSupportedFormats?: () => Promise<string[]>;
    };
  }
}

type RunRegistration = {
  id: string;
  createdAt: string;
  approvedAt?: string;
  updatedAt?: string;
  status: 'pending' | 'approved' | 'rejected';
  name: string;
  email: string;
  phone?: string;
  distance: string;
  pack: string;
  city?: string;
  ebibNumber?: string;
  ebibPath?: string | null;
  adminNote?: string;
  delivery?: { ok: boolean; detail?: string };
  paymentCode?: string;
  source: 'ipay' | 'legacy';
};

type AdminTab = 'registrations' | 'verify';

type PromoCodeRecord = {
  id: string;
  code: string;
  usageLimit: number;
  usageCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type IpayTx = {
  id: string;
  ws_code: string;
  status: string;
  amount: number;
  rec_desc?: string | null;
  date: string;
};

type IpayAccount = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  challenge_only?: boolean;
  distance?: string;
  pack?: string;
  organization?: string;
  status?: string;
  createdAt: string;
  unique_code?: string;
  ticketPrice?: number | null;
  walletId?: string;
  promoCodeId?: string | null;
  Wallet?: { walletId: string; balance: number; availableBalance: number };
  Transactions?: IpayTx[];
  PromoCode?: PromoCodeRecord | null;
};

type PromoFormState = {
  code: string;
  usageLimit: string;
  isActive: boolean;
};

const STATUS_FILTERS: Array<{ label: string; value: '' | 'pending' | 'approved' | 'rejected' }> = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' },
];

const PROMO_FORM_INITIAL: PromoFormState = {
  code: '',
  usageLimit: '1',
  isActive: true,
};

export default function AdminRunRegistrations() {
  const [rows, setRows] = useState<RunRegistration[]>([]);
  const [adminKey, setAdminKey] = useState('');
  const [tab, setTab] = useState<AdminTab | 'promos'>('registrations');
  const [filter, setFilter] = useState<'' | 'pending' | 'approved' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);
  const [verifyMatches, setVerifyMatches] = useState<IpayAccount[]>([]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [promoRows, setPromoRows] = useState<PromoCodeRecord[]>([]);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [promoForm, setPromoForm] = useState<PromoFormState>(PROMO_FORM_INITIAL);
  const [editingPromoId, setEditingPromoId] = useState<string | null>(null);
  const [editPromoForm, setEditPromoForm] = useState<PromoFormState>(PROMO_FORM_INITIAL);
  const ebibRef = useRef<HTMLDivElement | null>(null);
  const scannerVideoRef = useRef<HTMLVideoElement | null>(null);
  const scannerFileRef = useRef<HTMLInputElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const scannerFrameRef = useRef<number | null>(null);
  const [renderContext, setRenderContext] = useState<null | RunRegistration>(null);

  const readJson = async (res: Response) => {
    const text = await res.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      throw new Error('Server returned malformed JSON');
    }
  };

  const makeIpayHeaders = (extra?: HeadersInit): HeadersInit => {
    const base: Record<string, string> = {};
    if (adminKey.trim()) {
      base['X-Admin-Key'] = adminKey.trim();
    }
    return { ...base, ...(extra as Record<string, string> | undefined) };
  };

  const loadRows = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(ipayApiUrl('/accounts/all'), {
        cache: 'no-store',
      });
      const json = await readJson(res);
      const accounts = Array.isArray(json?.data) ? (json.data as IpayAccount[]) : [];
      if (!res.ok || !Array.isArray(accounts)) {
        throw new Error(json?.message || `Failed to load registrations (status ${res.status})`);
      }

      const mapped = accounts.map<RunRegistration>((account) => ({
        id: account.id,
        createdAt: account.createdAt,
        updatedAt: account.createdAt,
        status:
          account.status === 'success' || account.status === 'cleared'
            ? 'approved'
            : account.status === 'failed'
              ? 'rejected'
              : 'pending',
        name: account.name || 'Unnamed account',
        email: account.email || '',
        phone: account.phone || '',
        distance: account.challenge_only ? 'Challenge only' : account.distance || '—',
        pack: account.pack || '—',
        city: account.city || '',
        ebibNumber: '',
        paymentCode: account.unique_code || '',
        source: 'ipay',
      }));

      const filtered = mapped.filter((row) => {
        const statusOk = !filter || row.status === filter;
        const q = search.trim().toLowerCase();
        const searchOk =
          !q ||
          row.name.toLowerCase().includes(q) ||
          row.email.toLowerCase().includes(q) ||
          row.phone?.toLowerCase().includes(q) ||
          row.paymentCode?.toLowerCase().includes(q) ||
          row.distance.toLowerCase().includes(q) ||
          row.pack.toLowerCase().includes(q);
        return statusOk && searchOk;
      });

      setRows(filtered.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
      setMessage(`Loaded ${filtered.length} registration record${filtered.length === 1 ? '' : 's'} from the iPay accounts API.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load registrations';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadPromoCodes = async () => {
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const res = await fetch(ipayApiUrl('/accounts/promo-codes'), {
        cache: 'no-store',
        headers: makeIpayHeaders(),
      });
      const json = await readJson(res);
      const promos = Array.isArray(json?.data) ? (json.data as PromoCodeRecord[]) : [];
      if (!res.ok || !Array.isArray(promos)) {
        throw new Error(json?.message || `Failed to load promo codes (status ${res.status})`);
      }
      setPromoRows(promos.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
      setPromoMessage(`Loaded ${promos.length} promo code${promos.length === 1 ? '' : 's'}.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load promo codes';
      setPromoMessage(msg);
    } finally {
      setPromoLoading(false);
    }
  };

  const createPromoCode = async () => {
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const usageLimit = Number.parseInt(promoForm.usageLimit, 10);
      const res = await fetch(ipayApiUrl('/accounts/promo-codes'), {
        method: 'POST',
        headers: makeIpayHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          code: promoForm.code,
          usageLimit,
          isActive: promoForm.isActive,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.data) {
        throw new Error(json?.message || `Failed to create promo code (status ${res.status})`);
      }
      setPromoForm(PROMO_FORM_INITIAL);
      setPromoMessage(`Promo code ${json.data.code} created.`);
      await loadPromoCodes();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create promo code';
      setPromoMessage(msg);
      setPromoLoading(false);
    }
  };

  const updatePromoCode = async (id: string) => {
    setPromoLoading(true);
    setPromoMessage(null);
    try {
      const usageLimit = Number.parseInt(editPromoForm.usageLimit, 10);
      const res = await fetch(ipayApiUrl(`/accounts/promo-codes/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        headers: makeIpayHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          code: editPromoForm.code,
          usageLimit,
          isActive: editPromoForm.isActive,
        }),
      });
      const json = await readJson(res);
      if (!res.ok || !json?.data) {
        throw new Error(json?.message || `Failed to update promo code (status ${res.status})`);
      }
      setEditingPromoId(null);
      setPromoMessage(`Promo code ${json.data.code} updated.`);
      await loadPromoCodes();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update promo code';
      setPromoMessage(msg);
      setPromoLoading(false);
    }
  };

  const verifyCodes = async () => {
    const normalizedCode = verifyCode.trim().toLowerCase();
    if (!normalizedCode) {
      setVerifyMessage('Enter a code to verify.');
      setVerifyMatches([]);
      return;
    }

    setVerifyLoading(true);
    setVerifyMessage(null);
    try {
      const res = await fetch(ipayApiUrl('/accounts/all'));
      const json = await readJson(res);
      const accounts = Array.isArray(json?.data) ? (json.data as IpayAccount[]) : [];
      if (!res.ok || !accounts.length && !Array.isArray(json?.data)) {
        throw new Error(json?.message || `Failed to load payment records (status ${res.status})`);
      }

      const matches = accounts.filter((account) => {
        const accountCode = (account.unique_code || '').toLowerCase();
        const walletId = (account.Wallet?.walletId || account.walletId || '').toLowerCase();
        const txMatches = (account.Transactions || []).some((tx) =>
          (tx.ws_code || '').toLowerCase().includes(normalizedCode) ||
          (tx.rec_desc || '').toLowerCase().includes(normalizedCode)
        );

        return (
          accountCode.includes(normalizedCode) ||
          walletId.includes(normalizedCode) ||
          txMatches
        );
      });

      setVerifyMatches(matches);
      setVerifyMessage(matches.length ? `Found ${matches.length} matching record${matches.length === 1 ? '' : 's'}.` : 'No matching payment/account code found.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to verify code';
      setVerifyMessage(msg);
      setVerifyMatches([]);
    } finally {
      setVerifyLoading(false);
    }
  };

  const normalizeScannedCode = (raw: string) => {
    const value = raw.trim();
    const wsCodeMatch = value.match(/ws_code\s*[:=]\s*([A-Za-z0-9_-]+)/i);
    if (wsCodeMatch?.[1]) return wsCodeMatch[1];
    return value;
  };

  const stopScanner = () => {
    if (scannerFrameRef.current !== null) {
      cancelAnimationFrame(scannerFrameRef.current);
      scannerFrameRef.current = null;
    }
    const stream = scannerStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }
    const video = scannerVideoRef.current;
    if (video) {
      video.srcObject = null;
    }
  };

  const handleQrPayload = (rawValue: string) => {
    const code = normalizeScannedCode(rawValue);
    setVerifyCode(code);
    setScannerError(null);
    setScannerOpen(false);
  };

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner();
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Live camera scanning is not available here. On phones this usually means the page is not opened over HTTPS. Use the photo upload button below or open the page on HTTPS.');
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        scannerStreamRef.current = stream;
        const video = scannerVideoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const scan = async () => {
          if (cancelled || !scannerOpen || !video) return;
          try {
            if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const result = jsQR(imageData.data, imageData.width, imageData.height);
                if (result?.data) {
                  handleQrPayload(result.data);
                  return;
                }
              }
            }
            if (window.BarcodeDetector) {
              const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
              const barcodes = await detector.detect(video);
              const payload = barcodes.find((item) => item.rawValue?.trim())?.rawValue;
              if (payload) {
                handleQrPayload(payload);
                return;
              }
            }
          } catch {
            // Keep scanning on transient detector failures.
          }
          scannerFrameRef.current = requestAnimationFrame(scan);
        };

        scannerFrameRef.current = requestAnimationFrame(scan);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to start QR scanner.';
        setScannerError(msg);
        setScannerOpen(false);
      }
    };

    setScannerError(null);
    startScanner();

    return () => {
      cancelled = true;
      stopScanner();
    };
  }, [scannerOpen]);

  const handleQrImageUpload = async (file: File) => {
    try {
      setVerifyLoading(true);
      setScannerError(null);
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        throw new Error('Could not read the uploaded image.');
      }
      ctx.drawImage(bitmap, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      bitmap.close();

      if (!result?.data) {
        if (window.BarcodeDetector) {
          const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
          const barcodes = await detector.detect(canvas);
          const payload = barcodes.find((item) => item.rawValue?.trim())?.rawValue;
          if (payload) {
            handleQrPayload(payload);
            return;
          }
        }
        throw new Error('No QR code was found in that image.');
      }

      handleQrPayload(result.data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to read QR image.';
      setScannerError(msg);
    } finally {
      setVerifyLoading(false);
      if (scannerFileRef.current) {
        scannerFileRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    if (verifyCode.trim()) {
      verifyCodes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyCode]);

  const findLinkedRegistration = (account: IpayAccount) => {
    const accountEmail = (account.email || '').trim().toLowerCase();
    const accountPhone = (account.phone || '').replace(/\D/g, '');
    return rows.find((row) => {
      const rowEmail = (row.email || '').trim().toLowerCase();
      const rowPhone = (row.phone || '').replace(/\D/g, '');
      return (
        (accountEmail && rowEmail === accountEmail) ||
        (accountPhone && rowPhone && accountPhone.endsWith(rowPhone)) ||
        (rowPhone && accountPhone && rowPhone.endsWith(accountPhone))
      );
    });
  };

  const ensureRenderReady = async (context: RunRegistration) => {
    setRenderContext(context);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  };

  const generateEbib = async (row: RunRegistration) => {
    if (row.source === 'ipay') {
      setMessage('eBib generation is not available for the iPay API-backed registrations tab.');
      return;
    }
    if (!adminKey) {
      setMessage('Admin key required before generating eBib.');
      return;
    }
    try {
      setGeneratingId(row.id);
      setMessage('Generating eBib…');
      const ebibNumber = row.ebibNumber || `AB${String(Math.floor(Math.random() * 900000) + 100000)}`;
      const context: RunRegistration = { ...row, ebibNumber };
      await ensureRenderReady(context);
      const ebibNode = ebibRef.current;
      if (!ebibNode) throw new Error('Template not ready for export.');
      const ebibDataUrl = await toPng(ebibNode, { cacheBust: true, pixelRatio: 1 });

      const res = await fetch('/api/run_registrations.php', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({
          id: row.id,
          ebibNumber,
          ebibDataUrl,
        }),
      });
      const data = await readJson(res);
      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.error || `Failed to save eBib (status ${res.status})`);
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? data.row : r)));
      setMessage('eBib attached and email triggered.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to generate eBib';
      setMessage(msg);
    } finally {
      setGeneratingId(null);
      setRenderContext(null);
    }
  };

  const updateStatus = async (row: RunRegistration, status: 'approved' | 'rejected') => {
    if (row.source === 'ipay') {
      setMessage(`Status updates are not available for the iPay API-backed registrations tab.`);
      return;
    }
    if (!adminKey) {
      setMessage('Admin key required.');
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/run_registrations.php', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
        body: JSON.stringify({ id: row.id, status }),
      });
      const data = await readJson(res);
      if (!res.ok || !data || !data.ok) {
        throw new Error(data?.error || `Unable to update registration (status ${res.status})`);
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? data.row : r)));
      setMessage(status === 'approved' ? 'Registration approved and email triggered.' : 'Registration rejected.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update registration';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search]);

  const humanStatus = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <header className="bg-white border-b border-neutral-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Run Registrations Admin</div>
            <div className="text-xs text-neutral-600">Review run accounts, verify codes, and use admin actions where supported.</div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Admin key"
              className="rounded-full border border-neutral-200 px-3 py-2 text-sm"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
            />
            <button
              className="rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-semibold"
              onClick={loadRows}
            >
              Load
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { key: 'registrations', label: 'Registrations' },
              { key: 'verify', label: 'Verify Codes' },
              { key: 'promos', label: 'Promo Codes' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  setTab(item.key as AdminTab | 'promos');
                  if (item.key === 'promos') {
                    void loadPromoCodes();
                  }
                }}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${tab === item.key ? 'bg-neutral-900 border-neutral-900 text-white' : 'bg-white border-neutral-200 text-neutral-800'}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'registrations' ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.value || 'all'}
                    onClick={() => setFilter(f.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${filter === f.value ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-neutral-200 text-neutral-800'}`}
                  >
                    {f.label}
                  </button>
                ))}
                <input
                  type="search"
                  placeholder="Search name, email, ebib"
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-semibold bg-white"
                  onClick={loadRows}
                >
                  Refresh
                </button>
                {message && <span className="text-xs text-neutral-600">{message}</span>}
              </div>

              <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-50 text-neutral-600">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Distance</th>
                      <th className="px-3 py-2 text-left">Pack</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-left">Code / eBib</th>
                      <th className="px-3 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id} className="border-t border-neutral-100">
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">{row.distance}</td>
                        <td className="px-3 py-2 capitalize">{row.pack}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            row.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            row.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>{humanStatus(row.status)}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-700">
                          <div>{row.paymentCode || row.ebibNumber || '—'}</div>
                          {row.paymentCode && row.ebibNumber && <div className="text-neutral-500">{row.ebibNumber}</div>}
                        </td>
                        <td className="px-3 py-2 space-x-1">
                          <button
                            className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold"
                            onClick={() => updateStatus(row, 'approved')}
                            disabled={loading || row.source === 'ipay'}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold"
                            onClick={() => updateStatus(row, 'rejected')}
                            disabled={loading || row.source === 'ipay'}
                          >
                            Reject
                          </button>
                          <button
                            className="rounded-full bg-neutral-900 text-white px-3 py-1 text-xs font-semibold"
                            onClick={() => generateEbib(row)}
                            disabled={generatingId === row.id || row.source === 'ipay'}
                          >
                            {generatingId === row.id ? 'Generating…' : 'Generate eBib'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length === 0 && (
                  <div className="p-6 text-sm text-neutral-600">No registrations yet.</div>
                )}
              </div>
            </>
          ) : tab === 'verify' ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="search"
                    placeholder="Enter unique code, ws_code, wallet id, or scan QR"
                    className="flex-1 rounded-full border border-neutral-200 px-4 py-2 text-sm"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') verifyCodes();
                    }}
                  />
                  <button
                    className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold bg-white"
                    onClick={() => setScannerOpen((prev) => !prev)}
                  >
                    {scannerOpen ? 'Close Scanner' : 'Scan QR'}
                  </button>
                  <button
                    className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold bg-white"
                    onClick={() => scannerFileRef.current?.click()}
                  >
                    Upload QR Photo
                  </button>
                  <button
                    className="rounded-full bg-amber-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-60"
                    onClick={verifyCodes}
                    disabled={verifyLoading}
                  >
                    {verifyLoading ? 'Checking…' : 'Verify'}
                  </button>
                  <button
                    className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold bg-white"
                    onClick={() => {
                      setVerifyCode('');
                      setVerifyMatches([]);
                      setVerifyMessage(null);
                    }}
                  >
                    Clear
                  </button>
                </div>
                <div className="mt-3 text-xs text-neutral-600">
                  Checks against stored payment/account data and shows any linked run registration by email or phone. QR payloads like <code>ws_code:INV_1234567</code> are parsed to <code>INV_1234567</code>.
                </div>
                <input
                  ref={scannerFileRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      void handleQrImageUpload(file);
                    }
                  }}
                />
                {scannerOpen && (
                  <div className="mt-4 rounded-2xl border border-neutral-200 bg-neutral-950 p-3">
                    <video
                      ref={scannerVideoRef}
                      className="aspect-video w-full rounded-xl bg-black object-cover"
                      playsInline
                      muted
                    />
                    <div className="mt-2 text-xs text-neutral-300">
                      Point the camera at the QR code. The scanner will auto-fill and verify once it reads a payload. If live camera access is blocked on mobile, use `Upload QR Photo`.
                    </div>
                  </div>
                )}
                {scannerError && <div className="mt-3 text-sm text-rose-700">{scannerError}</div>}
                {verifyMessage && <div className="mt-3 text-sm text-neutral-700">{verifyMessage}</div>}
              </div>

              <div className="grid gap-4">
                {verifyMatches.map((account) => {
                  const linkedRegistration = findLinkedRegistration(account);
                  return (
                    <div key={account.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="text-base font-semibold text-neutral-900">{account.name || 'Unnamed account'}</div>
                          <div className="text-sm text-neutral-600">{account.email || '—'} • {account.phone || '—'}</div>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs">
                            {account.unique_code && <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-800">Code: {account.unique_code}</span>}
                            {(account.Wallet?.walletId || account.walletId) && <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-900">Wallet: {account.Wallet?.walletId || account.walletId}</span>}
                            {account.status && <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">Status: {account.status}</span>}
                            {account.distance && <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">Distance: {account.distance}</span>}
                            {account.pack && <span className="rounded-full bg-rose-100 px-3 py-1 font-semibold text-rose-900">Pack: {account.pack}</span>}
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500">
                          Created {account.createdAt ? new Date(account.createdAt).toLocaleString() : '—'}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div className="rounded-2xl bg-neutral-50 p-4">
                          <div className="text-sm font-semibold text-neutral-900">Transactions</div>
                          <div className="mt-3 space-y-2">
                            {(account.Transactions || []).length ? (
                              (account.Transactions || []).map((tx) => (
                                <div key={tx.id} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-neutral-900">{tx.ws_code}</span>
                                    <span className="text-neutral-500">{tx.status}</span>
                                  </div>
                                  <div className="mt-1 text-neutral-600">
                                    KES {tx.amount} • {tx.date ? new Date(tx.date).toLocaleString() : '—'}
                                  </div>
                                  {tx.rec_desc && <div className="mt-1 text-neutral-500">{tx.rec_desc}</div>}
                                </div>
                              ))
                            ) : (
                              <div className="text-xs text-neutral-500">No transactions on this account.</div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-neutral-50 p-4">
                          <div className="text-sm font-semibold text-neutral-900">Linked Registration</div>
                          {linkedRegistration ? (
                            <div className="mt-3 rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm">
                              <div className="font-semibold text-neutral-900">{linkedRegistration.name}</div>
                              <div className="text-neutral-600">{linkedRegistration.email}</div>
                              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-neutral-100 px-3 py-1 font-semibold text-neutral-800">Status: {humanStatus(linkedRegistration.status)}</span>
                                <span className="rounded-full bg-emerald-100 px-3 py-1 font-semibold text-emerald-900">Distance: {linkedRegistration.distance}</span>
                                <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-900">Pack: {linkedRegistration.pack}</span>
                                {linkedRegistration.ebibNumber && <span className="rounded-full bg-sky-100 px-3 py-1 font-semibold text-sky-900">eBib: {linkedRegistration.ebibNumber}</span>}
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 text-sm text-neutral-500">
                              No loaded registration matched this account. Load registrations first if you want registration cross-checking here.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {!verifyMatches.length && !verifyLoading && verifyCode.trim() && verifyMessage === 'No matching payment/account code found.' && (
                  <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">
                    No records matched that code.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
                <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
                  <div className="text-sm font-semibold text-neutral-900">Create Promo Code</div>
                  <div className="mt-3 space-y-3">
                    <label className="block">
                      <span className="text-xs font-medium text-neutral-700">Code</span>
                      <input
                        type="text"
                        value={promoForm.code}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                        placeholder="STAFF100"
                      />
                    </label>
                    <label className="block">
                      <span className="text-xs font-medium text-neutral-700">Usage limit</span>
                      <input
                        type="number"
                        min={1}
                        value={promoForm.usageLimit}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                        className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-neutral-800">
                      <input
                        type="checkbox"
                        checked={promoForm.isActive}
                        onChange={(e) => setPromoForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                      />
                      Active immediately
                    </label>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                        onClick={createPromoCode}
                        disabled={promoLoading}
                      >
                        {promoLoading ? 'Saving…' : 'Create'}
                      </button>
                      <button
                        className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold bg-white"
                        onClick={() => setPromoForm(PROMO_FORM_INITIAL)}
                        disabled={promoLoading}
                      >
                        Reset
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-neutral-600">
                    Promo-backed registrations skip STK and land in `cleared` status immediately.
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">Promo Codes</div>
                      <div className="text-xs text-neutral-600">Create, deactivate, or expand usage limits.</div>
                    </div>
                    <button
                      className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold bg-white"
                      onClick={loadPromoCodes}
                      disabled={promoLoading}
                    >
                      {promoLoading ? 'Refreshing…' : 'Refresh'}
                    </button>
                  </div>
                  {promoMessage && <div className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-700">{promoMessage}</div>}
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-neutral-50 text-neutral-600">
                        <tr>
                          <th className="px-3 py-2 text-left">Code</th>
                          <th className="px-3 py-2 text-left">Usage</th>
                          <th className="px-3 py-2 text-left">Status</th>
                          <th className="px-3 py-2 text-left">Updated</th>
                          <th className="px-3 py-2 text-left">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {promoRows.map((promo) => {
                          const exhausted = promo.usageCount >= promo.usageLimit;
                          const isEditing = editingPromoId === promo.id;
                          return (
                            <tr key={promo.id} className="border-t border-neutral-100 align-top">
                              <td className="px-3 py-2">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editPromoForm.code}
                                    onChange={(e) => setEditPromoForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                                    className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                  />
                                ) : (
                                  <div className="font-semibold text-neutral-900">{promo.code}</div>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    min={promo.usageCount || 1}
                                    value={editPromoForm.usageLimit}
                                    onChange={(e) => setEditPromoForm((prev) => ({ ...prev, usageLimit: e.target.value }))}
                                    className="w-28 rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                                  />
                                ) : (
                                  <div className="text-neutral-800">
                                    {promo.usageCount} / {promo.usageLimit}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {isEditing ? (
                                  <label className="flex items-center gap-2 text-sm text-neutral-800">
                                    <input
                                      type="checkbox"
                                      checked={editPromoForm.isActive}
                                      onChange={(e) => setEditPromoForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                                    />
                                    Active
                                  </label>
                                ) : (
                                  <div className="flex flex-wrap gap-2">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${promo.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'}`}>
                                      {promo.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    {exhausted && (
                                      <span className="inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                                        Exhausted
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>
                              <td className="px-3 py-2 text-xs text-neutral-600">
                                {new Date(promo.updatedAt).toLocaleString()}
                              </td>
                              <td className="px-3 py-2">
                                {isEditing ? (
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                                      onClick={() => updatePromoCode(promo.id)}
                                      disabled={promoLoading}
                                    >
                                      Save
                                    </button>
                                    <button
                                      className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold bg-white"
                                      onClick={() => setEditingPromoId(null)}
                                      disabled={promoLoading}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    className="rounded-full border border-neutral-200 px-3 py-1 text-xs font-semibold bg-white"
                                    onClick={() => {
                                      setEditingPromoId(promo.id);
                                      setEditPromoForm({
                                        code: promo.code,
                                        usageLimit: String(promo.usageLimit),
                                        isActive: promo.isActive,
                                      });
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!promoRows.length && !promoLoading && (
                      <div className="p-6 text-sm text-neutral-600">No promo codes found.</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer variant="neutral" />

      {/* Hidden eBib template for export */}
      {renderContext && (
        <div className="fixed -left-[9999px] -top-[9999px]">
          <EbibTemplate ref={ebibRef} context={renderContext} />
        </div>
      )}
    </div>
  );
}

type EbibTemplateProps = {
  context: RunRegistration;
};

const EbibTemplate = React.forwardRef<HTMLDivElement, EbibTemplateProps>(({ context }, ref) => {
  return (
    <div
      ref={ref}
      className="relative w-[900px] h-[600px] overflow-hidden rounded-2xl bg-gradient-to-br from-amber-50 via-white to-sky-50 border border-neutral-200 p-6"
    >
      <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(255, 193, 7, 0.12), transparent 35%), radial-gradient(circle at 80% 10%, rgba(59, 130, 246, 0.12), transparent 35%)' }} />
      <div className="relative h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div className="h-16 w-40 bg-no-repeat bg-contain bg-center invert brightness-0" style={{ backgroundImage: `url('${ab_logo}')` }} aria-label="Advent Band logo" />
          <div className="text-right text-sm text-neutral-700 leading-tight">
            <div>Annual Advent Band Run</div>
            <div>2026 Kids Edition • Apr 19</div>
            <div>Virtual Challenge Apr 5–19</div>
          </div>
        </div>
        <div className="mt-6 flex-1 grid grid-cols-[1fr_320px] gap-6 items-center">
          <div className="space-y-3">
            <div className="text-sm font-semibold text-neutral-600">eBib Number</div>
            <div className="text-6xl sm:text-7xl font-black text-neutral-900 tracking-tight">{context.ebibNumber}</div>
            <div className="text-2xl font-semibold text-neutral-800">{context.name}</div>
            <div className="flex flex-wrap gap-2 text-sm text-neutral-700">
              <span className="inline-flex items-center gap-2 rounded-full bg-neutral-900 text-white px-3 py-1 text-xs uppercase tracking-wide">Distance: {context.distance}</span>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 text-amber-900 px-3 py-1 text-xs uppercase tracking-wide">Pack: {context.pack}</span>
              {context.city && <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 text-sky-900 px-3 py-1 text-xs uppercase tracking-wide">City: {context.city}</span>}
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white shadow-lg p-4 flex flex-col justify-between">
            <div>
              <div className="text-sm font-semibold text-neutral-800">Race day</div>
              <div className="text-xl font-bold text-neutral-900">Sunday Apr 19 · 5K | 10K | 21K</div>
              <p className="mt-2 text-xs text-neutral-700">Virtual challenge: 4 km/day (Apr 5–19). Thank you for powering kids&apos; mental health, education, and health support.</p>
            </div>
            <div className="text-xs text-neutral-500">Show this eBib during kit pick-up or on-site check-in.</div>
          </div>
        </div>
      </div>
    </div>
  );
});

EbibTemplate.displayName = 'EbibTemplate';
