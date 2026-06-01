import { useParams, useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import { fetchBlogBySlug } from '../../content/blogsClient';
import ab_about from '../../assets/images/ab_about.jpeg';
import { trackEvent } from '../../utils/track';
import { LinkOutlined, PauseCircleFilled, PlayCircleFilled } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import ReadingProgress from '../../components/ReadingProgress';
import ShareBar from '../../components/ShareBar';
import Reactions from '../../components/Reactions';
import SubscribeInline from '../../components/SubscribeInline';
import RelatedPosts from '../../components/RelatedPosts';
import Poll from '../../components/Poll';

type YouTubePlayer = {
  playVideo?: () => void;
  pauseVideo?: () => void;
  stopVideo?: () => void;
  destroy?: () => void;
  setVolume?: (volume: number) => void;
};

type YouTubePlayerState = -1 | 0 | 1 | 2 | 3 | 5;

type YouTubeReadyEvent = {
  target: YouTubePlayer;
};

type YouTubeStateChangeEvent = {
  target: YouTubePlayer;
  data: YouTubePlayerState;
};

type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      height: string;
      width: string;
      videoId: string;
      playerVars: Record<string, unknown>;
      events?: {
        onReady?: (event: YouTubeReadyEvent) => void;
        onStateChange?: (event: YouTubeStateChangeEvent) => void;
      };
    },
  ) => YouTubePlayer;
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function BlogDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [blogState, setBlogState] = useState<any>(null);
  const blog = blogState as any;
  const [frameAllowed, setFrameAllowed] = useState(true);
  const hiddenPlayerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [youtubeApiReady, setYoutubeApiReady] = useState(false);
  const [audioVideoId, setAudioVideoId] = useState('');
  const [playerState, setPlayerState] = useState<YouTubePlayerState | null>(null);
  const [userPaused, setUserPaused] = useState(false);
  const shouldAutoPlayRef = useRef(true);

  useEffect(() => {
    // LinkedIn usually sets X-Frame-Options, so we keep a note if iframe fails
    const timer = setTimeout(() => setFrameAllowed(false), 2000);
    fetchBlogBySlug(slug || '').then(setBlogState).catch(() => setBlogState(null));
    // Track view event
    if (slug) {
      fetch('/api/track.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'blog.view', slug, src: 'site', ref: document.referrer || undefined }),
      }).catch(() => {});
    }
    return () => clearTimeout(timer);
  }, [slug]);

  useEffect(() => {
    if (!blog) {
      setAudioVideoId('');
      return;
    }
    const nextId = typeof blog.audioVideoId === 'string' ? blog.audioVideoId.trim() : '';
    setAudioVideoId(nextId);
    shouldAutoPlayRef.current = true;
    setUserPaused(false);
  }, [blog]);

  useEffect(() => {
    if (!audioVideoId) return;
    if (typeof window === 'undefined') return;

    if (window.YT && window.YT.Player) {
      setYoutubeApiReady(true);
      return;
    }

    const scriptId = 'youtube-iframe-api';
    let scriptTag = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = scriptId;
      scriptTag.src = 'https://www.youtube.com/iframe_api';
      scriptTag.async = true;
      document.body.appendChild(scriptTag);
    }

    const previousHandler = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousHandler?.();
      setYoutubeApiReady(true);
    };

    return () => {
      if (previousHandler) {
        window.onYouTubeIframeAPIReady = previousHandler;
      } else {
        delete window.onYouTubeIframeAPIReady;
      }
    };
  }, [audioVideoId]);

  useEffect(() => {
    if (!audioVideoId || !youtubeApiReady) return;
    if (typeof window === 'undefined') return;
    if (!hiddenPlayerContainerRef.current) return;
    if (!window.YT || !window.YT.Player) return;

    const player = new window.YT.Player(hiddenPlayerContainerRef.current, {
      height: '1',
      width: '1',
      videoId: audioVideoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
      },
      events: {
        onReady: (event: YouTubeReadyEvent) => {
          try {
            event.target.setVolume?.(70);
          } catch (error) {
            void error; // non-fatal volume adjustment issue
          }
          if (shouldAutoPlayRef.current) {
            try {
              event.target.playVideo?.();
            } catch (error) {
              void error; // autoplay rejection, handled by scroll fallback
            }
          }
        },
        onStateChange: (event: YouTubeStateChangeEvent) => {
          setPlayerState(event.data ?? null);
        },
      },
    });

    playerRef.current = player;

    return () => {
      playerRef.current?.destroy?.();
      playerRef.current = null;
      setPlayerState(null);
    };
  }, [audioVideoId, youtubeApiReady]);

  useEffect(() => {
    if (!audioVideoId) return;
    if (typeof window === 'undefined') return;
    if (userPaused) return;

    const handleScroll = () => {
      const player = playerRef.current;
      if (player && typeof player.playVideo === 'function') {
        try {
          player.playVideo();
        } catch (error) {
          void error;
        }
      }
      window.removeEventListener('scroll', handleScroll);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [audioVideoId, userPaused]);

  useEffect(
    () => () => {
      try {
        playerRef.current?.destroy?.();
      } catch (error) {
        void error;
      }
      playerRef.current = null;
    },
    [],
  );

  const hasAudio = audioVideoId.length > 0;
  const isPlaying = playerState === 1 && !userPaused;

  if (!blog) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
        <main className="flex-1">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
            <h1 className="text-2xl font-bold">Article not found</h1>
            <button onClick={() => navigate('/blogs')} className="mt-4 rounded-full border px-5 py-3 font-semibold hover:bg-neutral-50">Back to Blogs</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <ReadingProgress />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="mb-5 rounded-2xl overflow-hidden bg-neutral-100">
            <img src={(blog as any).image || ab_about} alt="Cover" className="w-full h-[240px] sm:h-[320px] object-cover" />
          </div>
          <button onClick={() => navigate('/blogs')} className="text-sm underline underline-offset-4">← Back to Blogs</button>
          <h1 className="mt-2 text-3xl sm:text-4xl font-extrabold leading-tight">{blog.title}</h1>
          <div className="mt-2 text-sm text-neutral-600">
            {blog.author && <span>By {blog.author}</span>}
            {blog.author && blog.date && <span> • </span>}
            {blog.date && <span>{blog.date}</span>}
          </div>
          <ShareBar title={blog.title} slug={blog.slug} />
          <p className="mt-3 text-neutral-700">{blog.summary}</p>

          {blog.contentHtml ? (
            <article className="prose prose-neutral max-w-none mt-6">
              {/* eslint-disable-next-line react/no-danger */}
              <div dangerouslySetInnerHTML={{ __html: blog.contentHtml }} />
            </article>
          ) : (
            <div className="mt-6">
              <div className="rounded-2xl border border-neutral-200 overflow-hidden">
                <iframe
                  title={blog.title}
                  src={blog.url}
                  className="w-full h-[70vh] bg-white"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
              <div className="mt-3 text-sm text-neutral-700">
                {frameAllowed ? (
                  <span>Loading reader… If it doesn’t display, use the original link below.</span>
                ) : (
                  <span>Reader may be blocked by the source site. Open the original article below.</span>
                )}
              </div>
              <a
                href={blog.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-600 text-white px-5 py-3 font-semibold hover:bg-amber-500"
                onClick={() => {
                  try {
                    trackEvent('blog.open_linkedin', { slug: blog.slug });
                  } catch (error) {
                    void error;
                  }
                }}
              >
                Read on LinkedIn <LinkOutlined />
              </a>
            </div>
          )}

          <Reactions slug={blog.slug} />
          <Poll
            id={`blog-${blog.slug}-feedback`}
            question="How do you feel about this post?"
            options={["Inspired me", "Learned something", "Will share it", "Prayed"]}
            showCounts={false}
            personalOnly
          />
          <SubscribeInline source={`blogs:${blog.slug}`} />
          <RelatedPosts currentSlug={blog.slug} tags={blog.tags || []} />
        </div>
      </main>
      <Footer variant="neutral" />
      {hasAudio && (
        <>
          <div
            ref={hiddenPlayerContainerRef}
            style={{ position: 'fixed', bottom: 0, left: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' }}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => {
              const player = playerRef.current;
              if (!player) return;
              if (isPlaying) {
                shouldAutoPlayRef.current = false;
                setUserPaused(true);
                try {
                  player.pauseVideo?.();
                } catch (error) {
                  void error;
                }
              } else {
                shouldAutoPlayRef.current = true;
                setUserPaused(false);
                try {
                  player.playVideo?.();
                } catch (error) {
                  void error;
                }
              }
            }}
            className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-neutral-900/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur transition hover:bg-neutral-800/90"
          >
            {isPlaying ? <PauseCircleFilled /> : <PlayCircleFilled />}
            <span>{isPlaying ? 'Pause audio' : 'Play audio'}</span>
          </button>
        </>
      )}
    </div>
  );
}
