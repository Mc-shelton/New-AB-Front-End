export function getClientId(): string {
  try {
    const k = 'ab_client_id';
    let v = localStorage.getItem(k);
    if (v && /^[a-z0-9]{32}$/i.test(v)) return v;
    // generate 128-bit hex id
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    v = Array.from(bytes).map(b => b.toString(16).padStart(2,'0')).join('');
    localStorage.setItem(k, v);
    return v;
  } catch {
    // fallback: timestamp-based
    return 'cid_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

