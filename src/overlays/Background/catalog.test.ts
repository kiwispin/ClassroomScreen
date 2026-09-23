import { describe, expect, it } from 'vitest';
import { BACKGROUND_CATEGORIES, CURATED_BACKGROUNDS, getCuratedBackground } from './catalog';

describe('curated background catalogue', () => {
  it('groups all six locally bundled photos and includes source credits', () => {
    expect(BACKGROUND_CATEGORIES.map((category) => category.title)).toEqual(['Nature', 'Autumn', 'Coast']);
    expect(CURATED_BACKGROUNDS).toHaveLength(6);
    expect(CURATED_BACKGROUNDS.every((photo) => photo.author && photo.source.startsWith('https://www.pexels.com/'))).toBe(true);
  });

  it('resolves stable asset ids to BASE_URL-prefixed bundled paths', () => {
    const photo = getCuratedBackground('17026767');
    expect(photo?.image).toBe(`${import.meta.env.BASE_URL}backgrounds/17026767.jpg`);
    expect(photo?.thumbnail).toBe(`${import.meta.env.BASE_URL}backgrounds/17026767-thumb.jpg`);
  });
});
