// ============================================================
// PANEL TEMPLATE TESTS — media-type whitelist single source of truth
// ============================================================
// The MEDIA table is the one list of types this builder serves; the API
// whitelist derives from PANEL_MEDIA_TYPES. These tests pin both directions:
// every declared type builds, everything else refuses (never defaults).

import { describe, it, expect } from 'vitest';
import {
  buildPhilosopherPanelPrompt,
  PANEL_MEDIA_TYPES,
  UnsupportedMediaTypeError,
} from './philosopher-panel-template.js';

const philosophers = [
  {
    name: 'Ayn Rand',
    school: 'Objectivism',
    era: '1905–1982',
    works: 'Atlas Shrugged',
    doctrines: 'Reason, egoism, capitalism',
    stances: 'Pro-reason, pro-individual',
    style: 'Uncompromising',
  },
  {
    name: 'Aristotle',
    school: 'Peripatetic',
    era: '384–322 BCE',
    works: 'Nicomachean Ethics',
    doctrines: 'Eudaimonia, golden mean',
    stances: 'Pro-reason',
    style: 'Systematic',
  },
  {
    name: 'Seneca',
    school: 'Stoicism',
    era: '4 BCE–65 CE',
    works: 'Letters to Lucilius',
    doctrines: 'Virtue, acceptance',
    stances: 'Duty-oriented',
    style: 'Aphoristic',
  },
];

const baseParams = {
  title: 'Test Work',
  artist: 'Test Creator',
  philosophers,
  guide: 'Test guide text',
  lang: 'en',
};

describe('PANEL_MEDIA_TYPES', () => {
  it('covers the three template-served types (news has its own builder)', () => {
    expect(PANEL_MEDIA_TYPES).toEqual(
      expect.arrayContaining(['music', 'literature', 'cinema']),
    );
    expect(PANEL_MEDIA_TYPES).not.toContain('news');
  });
});

describe('buildPhilosopherPanelPrompt — valid types pass', () => {
  for (const mediaType of PANEL_MEDIA_TYPES) {
    it(`builds a prompt for "${mediaType}"`, () => {
      const prompt = buildPhilosopherPanelPrompt({ ...baseParams, mediaType });
      expect(typeof prompt).toBe('string');
      expect(prompt).toContain('Test Work');
      expect(prompt).toContain('Ayn Rand');
    });
  }

  it('speaks film language for cinema, never song language', () => {
    const prompt = buildPhilosopherPanelPrompt({
      ...baseParams,
      mediaType: 'cinema',
      description: 'A synopsis',
      categories: 'Drama',
    });
    expect(prompt).toContain('FILM TO ANALYZE');
    expect(prompt).toContain('MOTION PICTURE');
  });
});

describe('buildPhilosopherPanelPrompt — unknown types refuse, never default', () => {
  for (const bad of ['podcast', 'painting', undefined, null, '']) {
    it(`throws UNSUPPORTED_MEDIA_TYPE for ${JSON.stringify(bad)}`, () => {
      expect(() =>
        buildPhilosopherPanelPrompt({ ...baseParams, mediaType: bad }),
      ).toThrowError(UnsupportedMediaTypeError);
      try {
        buildPhilosopherPanelPrompt({ ...baseParams, mediaType: bad });
      } catch (err) {
        expect(err.code).toBe('UNSUPPORTED_MEDIA_TYPE');
      }
    });
  }
});
