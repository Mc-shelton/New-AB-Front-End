import { MailConfig } from '../config/mailer';

export type JoinPayload = {
  name: string;
  email: string;
  role: string;
  message?: string;
};

export async function sendJoinEmail(payload: JoinPayload): Promise<{ ok: boolean; detail: string }>
{
  try {
    // 1) Try server-side PHP endpoint (best for cPanel)
    const phpEndpoint = MailConfig.php.endpoint;
    if (phpEndpoint) {
      try {
        const res = await fetch(phpEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, source: 'adventband.org/join' }),
        });
        if (res.ok) return { ok: true, detail: 'Sent via PHP endpoint' };
        // If endpoint exists but fails, fall through to other providers
      } catch {
        // ignore and try next
      }
    }

    // 2) EmailJS next
    const svc = MailConfig.emailjs.serviceId;
    const tpl = MailConfig.emailjs.templateId;
    const pub = MailConfig.emailjs.publicKey;
    if (svc && tpl && pub) {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: svc,
          template_id: tpl,
          user_id: pub,
          template_params: {
            from_name: payload.name,
            reply_to: payload.email,
            role: payload.role,
            message: payload.message ?? '',
            subject: `Join Advent Band — ${payload.role}`,
          },
        }),
      });
      if (res.ok) return { ok: true, detail: 'Sent via EmailJS' };
      const text = await res.text();
      return { ok: false, detail: `EmailJS error: ${text}` };
    }

    // 3) Formspree (optional)
    const fsEndpoint = MailConfig.formspree.endpoint;
    if (fsEndpoint) {
      const res = await fetch(fsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          name: payload.name,
          email: payload.email,
          role: payload.role,
          message: payload.message ?? '',
          source: 'adventband.org/join',
        }),
      });
      if (res.ok) return { ok: true, detail: 'Sent via Formspree' };
      const text = await res.text();
      return { ok: false, detail: `Formspree error: ${text}` };
    }

    return { ok: false, detail: 'No email backend configured' };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}

export async function sendSubscribeEmail(email: string): Promise<{ ok: boolean; detail: string }>
{
  try {
    // 1) Try server-side PHP subscribe endpoint (best for cPanel)
    const phpEndpoint = MailConfig.subscribePhp?.endpoint;
    if (phpEndpoint) {
      try {
        const res = await fetch(phpEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'adventband.org/newsletter' }),
        });
        if (res.ok) return { ok: true, detail: 'Sent via PHP subscribe endpoint' };
      } catch {
        // ignore and try next
      }
    }

    // 2) EmailJS fallback using the same template
    const svc = MailConfig.emailjs.serviceId;
    const tpl = MailConfig.emailjs.templateId;
    const pub = MailConfig.emailjs.publicKey;
    if (svc && tpl && pub) {
      const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: svc,
          template_id: tpl,
          user_id: pub,
          template_params: {
            from_name: '',
            reply_to: email,
            role: 'Newsletter',
            message: 'Subscribe request',
            subject: 'Newsletter Subscription',
          },
        }),
      });
      if (res.ok) return { ok: true, detail: 'Sent via EmailJS' };
      const text = await res.text();
      return { ok: false, detail: `EmailJS error: ${text}` };
    }

    // 3) Formspree (optional)
    const fsEndpoint = MailConfig.formspree.endpoint;
    if (fsEndpoint) {
      const res = await fetch(fsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email,
          role: 'Newsletter',
          message: 'Subscribe request',
          source: 'adventband.org/newsletter',
        }),
      });
      if (res.ok) return { ok: true, detail: 'Sent via Formspree' };
      const text = await res.text();
      return { ok: false, detail: `Formspree error: ${text}` };
    }

    return { ok: false, detail: 'No email backend configured' };
  } catch (err) {
    return { ok: false, detail: (err as Error).message };
  }
}
