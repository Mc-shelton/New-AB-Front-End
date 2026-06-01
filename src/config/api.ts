const IPAY_API_BASE_URL = 'https://ipayapi.ivula.co.ke/api/v1';
// const IPAY_API_BASE_URL = 'http://localhost:3000/api/v1';

// export const IPAY_API_BASE_URL =
//   (import.meta.env.VITE_IPAY_API_BASE_URL as string | undefined)?.replace(/\/+$/, '') ||
//   DEFAULT_IPAY_API_BASE_URL;

export function ipayApiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${IPAY_API_BASE_URL}${normalizedPath}`;
}
