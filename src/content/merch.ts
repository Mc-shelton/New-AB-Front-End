import hoodieImg from '../assets/images/ab_badges.jpeg'

export type MerchColor = {
  label: string;
  swatch: string;
  image?: string;
};

export type MerchItem = {
  id: string
  name: string
  slug: string
  description: string
  price: number
  currency?: string
  impact?: string
  image?: string
  tags?: string[]
  available?: boolean
  colors?: MerchColor[]
  sizes?: string[]
}

export const Merch: MerchItem[] = [
  {
    id: 'hoodie-classic',
    name: 'Advent Band Street Hoodie',
    slug: 'hoodie-classic',
    description:
      'Heavyweight fleece hoodie with the Advent Band crest. Every purchase funds hot meals for our Friday street vespers crew.',
    price: 3500,
    currency: 'KES',
    impact: 'Covers 10 hot meals or 1 sound-system rental hour on the street stage.',
    image: hoodieImg,
    tags: ['Apparel', 'Limited'],
    available: true,
    colors: [
      { label: 'Black', swatch: '#111827', image: hoodieImg },
      { label: 'Midnight Navy', swatch: '#1E3A8A' },
      { label: 'Sandstone', swatch: '#D1BFA5' },
    ],
    sizes: ['S', 'M', 'L', 'XL', '2XL'],
  },
  {
    id: 'tote-market',
    name: 'Mercy Market Tote Bag',
    slug: 'tote-market',
    description:
      'Organic cotton tote printed with Isaiah 58 artwork sourced from our street discipleship art sessions.',
    price: 1200,
    currency: 'KES',
    impact: 'Pays for 40 discipleship journals for new friends from the street.',
    image: hoodieImg,
    tags: ['Accessories'],
    available: true,
    colors: [
      { label: 'Natural Cotton', swatch: '#F5EDE0', image: hoodieImg },
      { label: 'Charcoal Grey', swatch: '#4B5563' },
    ],
    sizes: ['One size'],
  },
]
