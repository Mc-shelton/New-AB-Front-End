import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Mirror the data you need (id, title, description, ownerName, issuedAt, image URL)
const BADGES = [
  {
    id: "b6d56",
    title: "Team Lead",
    subtitle: "Articles and Blogs",
    description:
      "Given to members once they move to the Team Lead role",
    category: "community",
    progress: 1,
    earned: true,
    ownerName: "Purity Moraa",
    issuedAt: "Aug 19, 2025",
    bg: "bg-blue-100 text-blue-700",
  }
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'https://adventband.org';

const template = (b) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta property="og:title" content="${escapeHtml(b.title)} — AdventBand Badge" />
<meta property="og:description" content="${escapeHtml(b.description)} Holder: ${escapeHtml(b.ownerName)} • Issued: ${escapeHtml(b.issuedAt)}" />
<meta property="og:image" content="${BASE}${`/open/badges/${b.id}.png`}" />
<meta property="og:url" content="${BASE}/share/${b.id}.html" />
<meta property="og:type" content="website" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeHtml(b.title)} — AdventBand Badge" />
<meta name="twitter:description" content="${escapeHtml(b.description)} Holder: ${escapeHtml(b.ownerName)} • Issued: ${escapeHtml(b.issuedAt)}" />
<meta name="twitter:image" content="${BASE}${`/open/badges/${b.id}.png`}" />
<link rel="canonical" href="${BASE}/badges?id=${b.id}" />
<meta http-equiv="refresh" content="0; url=${BASE}/badges?id=${b.id}" />
<script>location.replace("${BASE}/badges?id=${b.id}");</script>
</head><body>
<noscript>Redirecting… <a href="${BASE}/badges?id=${b.id}">Click here</a>.</noscript>
</body></html>`;

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

async function run(){
  const outDir = `${__dirname}/../public/share`;
  await mkdir(outDir, { recursive: true });
  await Promise.all(BADGES.map(b =>
    writeFile(`${outDir}/${b.id}.html`, template(b), 'utf8')
  ));
  console.log('Generated share pages:', BADGES.map(b=>b.id).join(', '));
}
run().catch(err => { console.error(err); process.exit(1); });
