import { describe, expect, it } from 'vitest';
import { FeaturesService } from './features.service.js';

describe('FeaturesService', () => {
  it('returns the feature catalogue in its configured display order', () => {
    const response = new FeaturesService().list();

    expect(response.result.map((feature) => feature.type)).toEqual([
      'movies',
      'football',
      'concert',
      'event',
      'theater',
      'flying',
      'train',
    ]);
  });
});
