import { trackEvent } from '../utils/track';

export default function ShareBar({ title, slug }: { title: string; slug: string }) {
  const shareUrl = `${location.origin}/share/blogs/${slug}.html`;
  const text = `${title} ${shareUrl}`;
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        onClick={async () => {
          try { await navigator.clipboard.writeText(shareUrl); } catch {}
          alert('Share link copied');
          try { trackEvent('blog.copy_link', { slug }); } catch {}
        }}
        className="rounded-full border px-4 py-2 text-xs font-semibold hover:bg-neutral-50"
      >Copy Link</button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-amber-600 text-white px-4 py-2 text-xs font-semibold hover:bg-amber-500"
        onClick={()=>{ try { trackEvent('blog.share.whatsapp', { slug }); } catch {} }}
      >WhatsApp</a>
      <a
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border px-4 py-2 text-xs font-semibold hover:bg-neutral-50"
        onClick={()=>{ try { trackEvent('blog.share.twitter', { slug }); } catch {} }}
      >X/Twitter</a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border px-4 py-2 text-xs font-semibold hover:bg-neutral-50"
        onClick={()=>{ try { trackEvent('blog.share.facebook', { slug }); } catch {} }}
      >Facebook</a>
    </div>
  );
}

