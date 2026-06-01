import { writeFile, mkdir, readFile } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://adventband.org';

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

const tpl = (b) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(b.title)} — Advent Band Blog</title>
<meta property="og:title" content="${escapeHtml(b.title)} — Advent Band" />
<meta property="og:description" content="${escapeHtml(b.summary || '')}" />
<meta property="og:image" content="${escapeHtml(b.image || BASE + '/assets/og-default.png')}" />
<meta property="og:url" content="${BASE}/blogs/${b.slug}" />
<meta property="og:type" content="article" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(b.title)} — Advent Band" />
<meta name="twitter:description" content="${escapeHtml(b.summary || '')}" />
<meta name="twitter:image" content="${escapeHtml(b.image || BASE + '/assets/og-default.png')}" />
<link rel="canonical" href="${BASE}/blogs/${b.slug}" />
<meta http-equiv="refresh" content="0; url=${BASE}/blogs/${b.slug}" />
<script>location.replace('${BASE}/blogs/${b.slug}');</script>
</head><body>
<noscript>Redirecting… <a href="${BASE}/blogs/${b.slug}">Click here</a>.</noscript>
</body></html>`;

async function run() {
  const dataPath = `${__dirname}/../public/data/blogs.json`;
  const outDir = `${__dirname}/../public/share/blogs`;
  const raw = await readFile(dataPath, 'utf8').catch(() => '[]');
  const items = JSON.parse(raw);
  await mkdir(outDir, { recursive: true });
  await Promise.all(items.map((b) => writeFile(`${outDir}/${b.slug}.html`, tpl(b), 'utf8')));
  console.log('Generated blog share pages:', items.map(b=>b.slug).join(', '));
}

run().catch((e) => { console.error(e); process.exit(1); });

