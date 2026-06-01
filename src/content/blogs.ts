import ab_about from '../assets/images/ab_about.jpeg';

export type BlogItem = {
  title: string;
  summary: string;
  url: string;
  author?: string;
  date?: string;
  tags?: string[];
  slug: string; // internal route slug
  contentHtml?: string; // optional on-site content
  image?: string; // optional hero/cover image
  audioVideoId?: string; // optional YouTube video id for background audio
};

export const Blogs: BlogItem[] = [
  {
    title: 'Being Salt and Light in Secular Places',
    summary:
      'A reflection on living out the gospel in everyday spaces — and how Advent Band seeks to model practical, Christ-centered witness in the modern world.',
    url: 'https://www.linkedin.com/pulse/being-salt-light-secular-places-advent-band-org-5wggf/',
    author: 'Advent Band',
    date: '2025',
    tags: ['Devotional', 'Mission', 'Culture'],
    slug: 'being-salt-and-light-in-secular-places',
    audioVideoId: 'aJeNUlNY7Iw',
    // contentHtml: '<p>Paste the full HTML content here to render it on-site.</p>',
    image: ab_about,
  },
];
