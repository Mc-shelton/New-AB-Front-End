import { writeFile, mkdir, readFile } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://adventband.org';

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

const tpl = (item) => {
  const title = item.name || 'Advent Band Merch';
  const description = item.description || item.impact || 'Support Advent Band street ministry.';
  const image = item.image || item.colors?.find((c) => c?.image)?.image || 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1200&q=80';
  const url = `${BASE}/merchandise?item=${encodeURIComponent(item.slug)}`;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)} — Advent Band Merch</title>
<meta property="og:title" content="${escapeHtml(title)} — Advent Band" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:image" content="${escapeHtml(image)}" />
<meta property="og:url" content="${escapeHtml(url)}" />
<meta property="og:type" content="product" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(title)} — Advent Band" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta name="twitter:image" content="${escapeHtml(image)}" />
<link rel="canonical" href="${escapeHtml(url)}" />
<meta http-equiv="refresh" content="0; url=${escapeHtml(url)}" />
<script>location.replace(${JSON.stringify(url)});</script>
</head><body>
<noscript>Redirecting… <a href="${escapeHtml(url)}">Click here</a>.</noscript>
</body></html>`;
};

async function run() {
  const dataPath = `${__dirname}/../public/data/merch.json`;
  const outDir = `${__dirname}/../public/share/merchandise`;
  const raw = await readFile(dataPath, 'utf8').catch(() => '[]');
  const items = JSON.parse(raw);
  await mkdir(outDir, { recursive: true });
  await Promise.all(items.map((item) => writeFile(`${outDir}/${item.slug}.html`, tpl(item), 'utf8')));
  console.log('Generated merch share pages:', items.map((item) => item.slug).join(', '));
}

run().catch((error) => { console.error(error); process.exit(1); });
