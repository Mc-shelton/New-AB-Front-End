export const MailConfig = {
  // Server-side PHP relay (recommended on cPanel). Leave empty to disable.
  php: {
    endpoint: '/api/send.php',
  },

  // Server-side PHP endpoint for newsletter subscriptions
  subscribePhp: {
    endpoint: '/api/subscribe.php',
  },

  // Optional: Formspree endpoint. Leave empty to disable.
  formspree: {
    endpoint: '',
  },

  // EmailJS config. Public key is safe to embed client-side.
  emailjs: {
    serviceId: 'service_bwaf1sl',
    templateId: 'template_njo0nca',
    publicKey: 'yULII3pEXcL9mFcrQ', // TODO: paste your EmailJS Public Key here
  },
} as const;

export type MailConfigType = typeof MailConfig;
