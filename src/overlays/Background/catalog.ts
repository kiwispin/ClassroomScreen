export type CuratedBackground = {
  id: string;
  title: string;
  category: string;
  author: string;
  source: string;
  tags: string[];
  image: string;
  thumbnail: string;
};

const assetUrl = (file: string) => `${import.meta.env.BASE_URL}backgrounds/${file}`;

const CATEGORY_DATA = [
  {
    title: 'Nature',
    photos: [
      {
        id: '17026767',
        title: 'Sunlit forest',
        category: 'Nature',
        author: 'Ludvig Hedenborg',
        source: 'https://www.pexels.com/photo/sun-rays-shining-through-trees-in-forest-17026767/',
        tags: ['forest', 'trees', 'sunlight', 'woodland'],
      },
      {
        id: '32613724',
        title: 'Alpine lake',
        category: 'Nature',
        author: 'Jean-Paul Wettstein',
        source: 'https://www.pexels.com/photo/serene-swiss-alpine-lake-in-summer-32613724/',
        tags: ['mountains', 'lake', 'water', 'alpine'],
      },
    ],
  },
  {
    title: 'Autumn',
    photos: [
      {
        id: '10106742',
        title: 'Golden woodland',
        category: 'Autumn',
        author: 'Justin',
        source: 'https://www.pexels.com/photo/a-forest-during-autumn-10106742/',
        tags: ['forest', 'trees', 'golden', 'leaves'],
      },
      {
        id: '16329552',
        title: 'Autumn canopy',
        category: 'Autumn',
        author: 'Framesbyhsn',
        source: 'https://www.pexels.com/photo/vibrant-autumn-forest-landscape-16329552/',
        tags: ['forest', 'trees', 'leaves', 'colorful'],
      },
    ],
  },
  {
    title: 'Coast',
    photos: [
      {
        id: '1207528',
        title: 'Sandy shore',
        category: 'Coast',
        author: 'Min An',
        source: 'https://www.pexels.com/photo/close-up-photography-of-sand-1207528/',
        tags: ['sand', 'shore', 'coast', 'neutral'],
      },
      {
        id: '16322856',
        title: 'Auckland waves',
        category: 'Coast',
        author: 'Amanda Brabant',
        source: 'https://www.pexels.com/photo/waves-and-horizon-16322856/',
        tags: ['ocean', 'waves', 'sea', 'Auckland'],
      },
    ],
  },
 ] satisfies {
  title: string;
  photos: Omit<CuratedBackground, 'image' | 'thumbnail'>[];
}[];

export const BACKGROUND_CATEGORIES = CATEGORY_DATA.map((category) => ({
  ...category,
  photos: category.photos.map((photo) => ({
    ...photo,
    image: assetUrl(`${photo.id}.jpg`),
    thumbnail: assetUrl(`${photo.id}-thumb.jpg`),
  })),
}));

export const CURATED_BACKGROUNDS: CuratedBackground[] = BACKGROUND_CATEGORIES.flatMap(
  (category) => category.photos,
);

export const getCuratedBackground = (id: string) =>
  CURATED_BACKGROUNDS.find((photo) => photo.id === id);
