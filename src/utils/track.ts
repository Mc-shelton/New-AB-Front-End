import { getClientId } from './clientId';

export function trackPage(page: string) {
  try {
    const cid = getClientId();
    fetch('/api/track.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-Id': cid },
      body: JSON.stringify({ type: 'page.view', page, path: location.pathname, ref: document.referrer || undefined, cid }),
      keepalive: true,
    });
  } catch {}
}

export function trackEvent(name: string, meta?: Record<string, unknown>) {
  try {
    const cid = getClientId();
    fetch('/api/track.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Client-Id': cid },
      body: JSON.stringify({ type: 'event', name, meta, path: location.pathname, ref: document.referrer || undefined, cid }),
      keepalive: true,
    });
  } catch {}
}
