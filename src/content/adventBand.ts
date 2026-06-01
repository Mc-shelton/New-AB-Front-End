export const AdventBand = {
  tagline: 'Faith. Technology. Mission. United.',
  about:
    'Advent Band is a volunteer-powered movement building faith-driven digital and on-the-ground mission experiences that inspire spiritual growth, foster community, and drive missionary work aggressively.',
  mission:
    "To equip a generation of believers to serve aggressively through technology, storytelling, Bible studies, design, and outreach — all in the spirit of Christ’s commission.",
  vision:
    'A global ecosystem of faith-based creators, missionaries, developers, and organizers collaborating to build tools and platforms that serve movements for aggressive missionary work.',
  whatWeDo: [
    {
      title: 'Tech for Ministry',
      points: [
        'Faith-based apps and platforms',
        'Backend systems for missions and events',
        'DevOps and infrastructure for digital evangelism',
      ],
    },
    {
      title: 'Creative & Content',
      points: [
        'Blogs, devotionals, and newsletters',
        'Design systems and user-first visual ministry',
        'Testimonies and spiritual media',
      ],
    },
    {
      title: 'Community & Outreach',
      points: [
        'Missionary work in campuses, churches, and schools',
        'Digital outreach and lead generation',
        'Discipleship and Bible study coordination',
      ],
    },
    {
      title: 'Partnerships',
      points: [
        'Align with institutions, schools, and ministries',
        'Co-create projects and tools that scale impact',
        'Run events, expos, and public-facing campaigns',
      ],
    },
  ],
  peopleModel:
    '100% volunteer-led: Directors (vision and strategy), Pillar Leads (execution alignment), Team Leads (day-to-day operations), and Contributors (hands-on ministry work). Each person gives a minimum of 6 hours/week and grows in autonomy, excellence, and spiritual joy.',
  goals: [
    { key: 'AB @ 50', desc: 'Build and deploy 50 trained medical/missionary volunteers' },
    { key: 'AB @ 3K', desc: 'Reach 3,000 active users across platforms' },
    { key: 'AB @ 200K', desc: 'Generate KES 200,000 in self-sustaining revenue for operations and outreach' },
  ],
  needs: [
    'Partners: Organizations and ministries aligned to co-create tools and programs',
    'Supporters: Individuals and churches willing to back growth via mentorship, tools, or small grants',
    'Volunteers: Writers, developers, designers, missionaries, strategists, and drivers',
  ],
  why: [
    'Creative Autonomy — every contributor shapes their path',
    'Practical Impact — hands-on with platforms, people, and ministry',
    'Spiritual Depth — grounded in daily devotion, community, and service',
    'Global Vision — open to anyone, anywhere, committed to Christ',
  ],
  contact: {
    email: 'people@adventband.org',
    web: 'adventband.org',
    socials: 'Instagram/Twitter/YouTube',
    scripture: '“The harvest is great, but the laborers are few…” – Matthew 9:37',
  },
};

export type WhatWeDo = typeof AdventBand.whatWeDo[number];
