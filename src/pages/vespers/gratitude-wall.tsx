import { useMemo, useState, useEffect } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftOutlined, HeartFilled, UserOutlined, SendOutlined, ShareAltOutlined, StarFilled, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import Footer from '../../components/Footer';
import { trackEvent, trackPage } from '../../utils/track';

type Honoree = {
  name: string;
  whatsapp?: string;
};

type GratitudeNote = {
  id: string;
  from: string;
  honorees: Honoree[];
  story: string;
  highlight?: string;
  createdAt: string;
  color: string;
  tapeColor: string;
  rotation: number;
  tags: string[];
};

const stickyPalette = [
  { color: '#FEF3C7', tape: '#D97706' },
  { color: '#FDF0D5', tape: '#E0A96D' },
  { color: '#F8EDEB', tape: '#D4A373' },
  { color: '#FFF7ED', tape: '#E76F51' },
  { color: '#EFE5DC', tape: '#BC8A5F' },
  { color: '#F3EADF', tape: '#C97D60' },
  { color: '#F9E8C9', tape: '#D69E2E' },
];

const seededNotes: GratitudeNote[] = [
  {
    id: 'seed-1',
    from: 'Amina',
    honorees: [{ name: 'Pastor Joel', whatsapp: '+254700123456' }],
    story:
      'When the rains soaked my blanket, you stayed late after vespers to make sure I went to sleep warm. That night I remembered my worth.',
    highlight: 'Shelter & dignity',
    createdAt: '2024-07-12T18:24:00.000Z',
    color: stickyPalette[0].color,
    tapeColor: stickyPalette[0].tape,
    rotation: -2.5,
    tags: ['Street Vespers', 'Care Team'],
  },
  {
    id: 'seed-2',
    from: 'Kamau',
    honorees: [
      { name: 'The Brass Section' },
      { name: 'Elder Mutua', whatsapp: '+254701220110' },
    ],
    story:
      'You let me hold the spare trumpet and blow along to “Onward”. For the first time in years I felt like music was still mine.',
    highlight: 'Music heals',
    createdAt: '2024-07-26T17:55:00.000Z',
    color: stickyPalette[1].color,
    tapeColor: stickyPalette[1].tape,
    rotation: 2.5,
    tags: ['Music Crew', 'Courage'],
  },
  {
    id: 'seed-3',
    from: 'Mwikali',
    honorees: [{ name: 'Njeri', whatsapp: '+254799331144' }],
    story:
      'You sat beside me every Friday until I was ready to join the women’s circle. Now I welcome new sisters the way you welcomed me.',
    highlight: 'Sisters in hope',
    createdAt: '2024-08-02T19:05:00.000Z',
    color: stickyPalette[2].color,
    tapeColor: stickyPalette[2].tape,
    rotation: -1.2,
    tags: ['Women\'s Circle', 'Belonging'],
  },
  {
    id: 'seed-4',
    from: 'Street Art Squad',
    honorees: [{ name: 'DJ Kendi' }],
    story:
      'You gave us the mic during the pop-up cypher and shouted out every artist by name. Our art matters because you say it loud.',
    highlight: 'Voice amplified',
    createdAt: '2024-08-16T21:10:00.000Z',
    color: stickyPalette[3].color,
    tapeColor: stickyPalette[3].tape,
    rotation: 3.4,
    tags: ['Creative City', 'Youth'],
  },
  {
    id: 'seed-5',
    from: 'Ndugu Wa Baridi',
    honorees: [
      { name: 'Faith', whatsapp: '+254735112233' },
      { name: 'Mercy', whatsapp: '+254711889977' },
    ],
    story:
      'Your homemade tea, the clean socks, and the laughter keep our crew coming back. We are seen, fed, and named.',
    highlight: 'Hospitality wins',
    createdAt: '2024-09-06T18:45:00.000Z',
    color: stickyPalette[4].color,
    tapeColor: stickyPalette[4].tape,
    rotation: -4.1,
    tags: ['Hospitality', 'Street Family'],
  },
  {
    id: 'seed-6',
    from: 'Jamal',
    honorees: [{ name: 'Officer Wanjiku', whatsapp: '+254780554433' }],
    story:
      'You walk us safely past River Road and tell the city we belong. Thank you for guarding the light with us.',
    highlight: 'Safety squad',
    createdAt: '2024-09-13T17:15:00.000Z',
    color: stickyPalette[5].color,
    tapeColor: stickyPalette[5].tape,
    rotation: 1.5,
    tags: ['City Allies', 'Protection'],
  },
  {
    id: 'seed-7',
    from: 'Baba Zawadi',
    honorees: [{ name: 'Street Choir Tenors' }],
    story:
      'Your harmonies carried my testimony all the way to my daughter. She called after eight years. We are singing together now.',
    highlight: 'Family restored',
    createdAt: '2024-09-20T20:30:00.000Z',
    color: stickyPalette[6].color,
    tapeColor: stickyPalette[6].tape,
    rotation: -0.8,
    tags: ['Family', 'Reunion'],
  },
  {
    id: 'seed-8',
    from: 'Grace',
    honorees: [{ name: 'Badge Makers' }],
    story:
      'The QR badge let me send my auntie a playlist and a prayer. Our whole flat joined the livestream when they scanned it.',
    highlight: 'Stories that travel',
    createdAt: '2024-09-27T19:40:00.000Z',
    color: stickyPalette[0].color,
    tapeColor: stickyPalette[0].tape,
    rotation: 4.2,
    tags: ['Digital Mission', 'Badges'],
  },
];

type FormHonoree = {
  name: string;
  whatsapp: string;
};

type FormState = {
  from: string;
  honorees: FormHonoree[];
  story: string;
  highlight: string;
};

type FormStatus =
  | { type: 'idle'; message?: string }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

export default function VespersGratitudeWall() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<GratitudeNote[]>(seededNotes);
  const [formState, setFormState] = useState<FormState>({
    from: '',
    honorees: [{ name: '', whatsapp: '' }],
    story: '',
    highlight: '',
  });
  const [formStatus, setFormStatus] = useState<FormStatus>({ type: 'idle' });

  useEffect(() => {
    trackPage('vespers.gratitude_wall');
  }, []);

  const stats = useMemo(() => {
    const encouragers = new Set(notes.map((note) => note.from.trim().toLowerCase()));
    const honorees = new Set(
      notes.flatMap((note) => note.honorees.map((honoree) => honoree.name.trim().toLowerCase())),
    );
    const tags = new Set(notes.flatMap((note) => note.tags));
    return [
      { label: 'Voices uplifted', value: notes.length },
      { label: 'Encouragers speaking up', value: encouragers.size },
      { label: 'Champions celebrated', value: honorees.size },
      { label: 'Themes of impact', value: tags.size },
    ];
  }, [notes]);

  const addHonoreeField = () => {
    setFormState((prev) => ({
      ...prev,
      honorees: [...prev.honorees, { name: '', whatsapp: '' }],
    }));
    try {
      trackEvent('vespers.gratitude.honoree_add_click');
    } catch {}
  };

  const updateHonoreeField = (index: number, field: keyof FormHonoree, value: string) => {
    setFormState((prev) => {
      const honorees = prev.honorees.map((honoree, honoreeIndex) =>
        honoreeIndex === index ? { ...honoree, [field]: value } : honoree,
      );
      return { ...prev, honorees };
    });
  };

  const removeHonoreeField = (index: number) => {
    setFormState((prev) => {
      if (prev.honorees.length === 1) return prev;
      const honorees = prev.honorees.filter((_, honoreeIndex) => honoreeIndex !== index);
      return { ...prev, honorees };
    });
    try {
      trackEvent('vespers.gratitude.honoree_remove_click', { index });
    } catch {}
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormStatus({ type: 'idle' });

    const from = formState.from.trim();
    const story = formState.story.trim();
    const highlight = formState.highlight.trim();
    const honorees = formState.honorees
      .map((honoree) => ({
        name: honoree.name.trim(),
        whatsapp: honoree.whatsapp.trim() || undefined,
      }))
      .filter((honoree) => honoree.name.length > 0);

    if (!from || !story || honorees.length === 0) {
      setFormStatus({
        type: 'error',
        message: 'Please share your name, at least one person who lifted you, and how they impacted you.',
      });
      return;
    }

    if (story.length < 24) {
      setFormStatus({
        type: 'error',
        message: 'Give us a few more words—two heartfelt sentences help the community feel the moment with you.',
      });
      return;
    }

    const palettePick = stickyPalette[(notes.length + 1) % stickyPalette.length];
    const newNote: GratitudeNote = {
      id: `note-${Date.now()}`,
      from,
      honorees,
      story,
      highlight: highlight || undefined,
      createdAt: new Date().toISOString(),
      color: palettePick.color,
      tapeColor: palettePick.tape,
      rotation: randomRotation(),
      tags: deriveTags(story, highlight),
    };

    setNotes((prev) => [newNote, ...prev]);
    setFormState({
      from: '',
      honorees: [{ name: '', whatsapp: '' }],
      story: '',
      highlight: '',
    });
    setFormStatus({ type: 'success', message: 'Beautiful! Your note is now part of the wall.' });
    try {
      trackEvent('vespers.gratitude.note_added', { from, honorees: honorees.map((honoree) => honoree.name) });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col">
      <style>{`
        .gratitude-wall {
          background-image:
            radial-gradient(circle at 20% 20%, rgba(217, 119, 6, 0.08), transparent 55%),
            radial-gradient(circle at 80% 15%, rgba(120, 53, 15, 0.06), transparent 55%),
            radial-gradient(circle at 0% 80%, rgba(234, 179, 8, 0.08), transparent 50%);
        }
        .sticky-note {
          position: relative;
          padding: 1.5rem 1.5rem 2rem;
          border-radius: 1.25rem 1.5rem 1rem 1.5rem;
          box-shadow: 0 14px 30px rgba(30, 41, 59, 0.15);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          min-height: 220px;
        }
        .sticky-note::before {
          content: '';
          position: absolute;
          top: -14px;
          left: 38%;
          width: 72px;
          height: 26px;
          border-radius: 4px;
          background: var(--tape-color, rgba(255, 255, 255, 0.65));
          box-shadow: 0 6px 12px rgba(15, 23, 42, 0.15);
          transform: rotate(-2deg);
        }
        .sticky-note:hover {
          transform: scale(1.02) translateY(-4px) rotate(var(--rotation));
          box-shadow: 0 18px 40px rgba(30, 41, 59, 0.22);
        }
        .sticky-note:hover::before {
          box-shadow: 0 8px 14px rgba(15, 23, 42, 0.18);
        }
        @media (max-width: 768px) {
          .sticky-note {
            min-height: 180px;
            padding: 1.25rem 1.25rem 1.75rem;
          }
        }
      `}</style>

      <header className="bg-[#3a190b] text-white">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
          <button
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/vespers');
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-amber-200 hover:text-white self-start"
          >
            <ArrowLeftOutlined /> Back to Street Vespers
          </button>
          <div className="grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                Living wall of appreciation
              </span>
              <h1 className="text-3xl font-extrabold sm:text-4xl lg:text-5xl">
                Street Vespers Gratitude Wall
              </h1>
              <p className="max-w-2xl text-base text-white/80 sm:text-lg">
                Add your voice to a growing chain of kindness. Every sticky note captures a story of how light,
                music, and friendship are transforming Nairobi’s streets through the Street Vespers Initiative.
              </p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a
                  href="#share"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-5 py-2 font-semibold text-white shadow hover:bg-amber-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#3a190b]"
                >
                  <SendOutlined /> Share who lifted you
                </a>
                <a
                  href="#wall"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2 font-semibold text-white hover:bg-white/10"
                >
                  <ShareAltOutlined /> Witness the wall
                </a>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-amber-200/60">
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-amber-200 via-amber-100 to-transparent opacity-70" />
              <div className="relative z-10 space-y-6 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-100/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
                  Pulse of the wall
                </div>
                <div className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white shadow-[0_20px_45px_rgba(120,53,15,0.25)]">
                  <span className="text-4xl font-black">{stats[0]?.value ?? 0}</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-neutral-900">Voices uplifted</h3>
                  <p className="text-sm text-neutral-600">
                    Every story adds another spark to the Street Vespers tapestry. Your gratitude keeps the wall alive.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="gratitude-wall flex-1">
        <section id="wall" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-12 lg:grid-cols-[1.4fr,0.95fr]">
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl">Living wall of appreciation</h2>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-neutral-600 shadow-sm">
                  <HeartFilled className="text-rose-500" /> {notes.length} notes and counting
                </span>
              </div>
              <p className="text-sm text-neutral-600 sm:text-base">
                Every card is a real story from the Street Vespers family. Swipe, scroll, and soak in the ripple effect of
                kindness—then add yours to keep the chain moving.
              </p>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {notes.map((note) => (
                  <article
                    key={note.id}
                    className="sticky-note"
                    style={{
                      backgroundColor: note.color,
                      ['--rotation' as string]: `${note.rotation}deg`,
                      ['--tape-color' as string]: note.tapeColor,
                    } as CSSProperties}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-neutral-600">
                      <span className="inline-flex items-center gap-2 rounded-full bg-white/50 px-3 py-1 text-neutral-700 shadow-sm">
                        <UserOutlined /> {note.from}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-600">
                      {note.honorees.map((honoree, index) => {
                        return (
                          <span
                            key={`${note.id}-${honoree.name}-${index}`}
                            className="inline-flex items-center gap-2 rounded-full bg-neutral-900/80 px-3 py-1 text-white shadow"
                          >
                            for {honoree.name}
                          </span>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-[15px] font-medium text-neutral-800 leading-relaxed">{note.story}</p>
                    {note.highlight ? (
                      <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-neutral-700">
                        {note.highlight}
                      </p>
                    ) : null}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-semibold text-neutral-700 shadow"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <time className="mt-5 block text-xs uppercase tracking-wide text-neutral-600">
                      {formatDate(note.createdAt)}
                    </time>
                  </article>
                ))}
              </div>
            </div>

            <div id="share" className="rounded-3xl bg-white/95 p-6 shadow-xl ring-1 ring-sky-100">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                  <StarFilled />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Add your note</h3>
                  <p className="text-sm text-neutral-600">
                    Celebrate the person who built you up. Your words can reopen hope for someone else tonight.
                  </p>
                </div>
              </div>

              <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-800" htmlFor="from">
                    Your name
                  </label>
                  <input
                    id="from"
                    name="from"
                    value={formState.from}
                    onChange={(event) => setFormState((prev) => ({ ...prev, from: event.target.value }))}
                    placeholder="Who is sharing this story?"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400/60"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-neutral-800">
                    Who lifted you?
                  </label>
                  <p className="text-xs text-neutral-500">
                    Add each person, crew, or community. Drop a WhatsApp contact so we can pass the gratitude along.
                  </p>
                  <div className="space-y-3">
                    {formState.honorees.map((honoree, index) => (
                      <div
                        key={`honoree-${index}`}
                        className="rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm"
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-3">
                          <div className="sm:flex-1 space-y-2">
                            <label
                              className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
                              htmlFor={`honoree-name-${index}`}
                            >
                              Name
                            </label>
                            <input
                              id={`honoree-name-${index}`}
                              value={honoree.name}
                              onChange={(event) => updateHonoreeField(index, 'name', event.target.value)}
                              placeholder="Faith & Mercy"
                            className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                            />
                          </div>
                          <div className="sm:flex-1 space-y-2">
                            <label
                              className="text-xs font-semibold uppercase tracking-wide text-neutral-600"
                              htmlFor={`honoree-whatsapp-${index}`}
                            >
                              WhatsApp number
                            </label>
                            <input
                              id={`honoree-whatsapp-${index}`}
                              value={honoree.whatsapp}
                              onChange={(event) => updateHonoreeField(index, 'whatsapp', event.target.value)}
                              placeholder="+2547 11 223344"
                              inputMode="tel"
                              className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                            />
                          </div>
                          {formState.honorees.length > 1 ? (
                            <button
                              type="button"
                              onClick={() => removeHonoreeField(index)}
                              className="text-rose-500 transition hover:text-rose-600"
                              aria-label="Remove this person"
                            >
                              <MinusCircleOutlined />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                <button
                  type="button"
                  onClick={addHonoreeField}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100 hover:text-amber-900"
                >
                  <PlusOutlined /> Add another person
                </button>
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-800" htmlFor="story">
                    How did they impact your life?
                  </label>
                  <textarea
                    id="story"
                    name="story"
                    value={formState.story}
                    onChange={(event) => setFormState((prev) => ({ ...prev, story: event.target.value }))}
                    placeholder="Share a moment or detail others should know (2-5 sentences recommended)."
                    rows={5}
                    maxLength={500}
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                  />
                  <p className="text-xs text-neutral-500">{formState.story.length}/500 characters</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-neutral-800" htmlFor="highlight">
                    Give it a short headline (optional)
                  </label>
                  <input
                    id="highlight"
                    name="highlight"
                    value={formState.highlight}
                    onChange={(event) => setFormState((prev) => ({ ...prev, highlight: event.target.value }))}
                    placeholder="e.g., Hope on River Road"
                    className="w-full rounded-2xl border border-neutral-200 px-4 py-3 text-sm shadow-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                  />
                </div>

                {formStatus.type !== 'idle' ? (
                  <div
                    className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                      formStatus.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-rose-200 bg-rose-50 text-rose-600'
                    }`}
                  >
                    {formStatus.message}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-full bg-[#3a190b] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#3a190b]/40 transition hover:bg-[#4c2412] focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                >
                  Post your gratitude
                </button>
                <p className="text-xs text-neutral-500">
                  Notes are currently hosted live in this digital wall. We’re exploring ways to feature stories during
                  upcoming Street Vespers sets—stay tuned!
                </p>
              </form>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}

function deriveTags(story: string, highlight?: string) {
  const normalized = `${story} ${highlight ?? ''}`.toLowerCase();
  const tags = new Set<string>();

  if (normalized.includes('music') || normalized.includes('song')) tags.add('Music');
  if (normalized.includes('badge')) tags.add('Badges');
  if (normalized.includes('tea') || normalized.includes('food')) tags.add('Hospitality');
  if (normalized.includes('guard') || normalized.includes('police')) tags.add('Protection');
  if (normalized.includes('hope') || normalized.includes('light')) tags.add('Hope');
  if (normalized.includes('family')) tags.add('Family');
  if (normalized.includes('prayer')) tags.add('Prayer');
  if (!tags.size) tags.add('Street Vespers');

  return Array.from(tags);
}

function formatDate(dateIso: string) {
  const date = new Date(dateIso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' });
}

function randomRotation() {
  const min = -4.5;
  const max = 4.5;
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}
