// ============================================================
// SECURITY TESTS - Input Validation
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  isValidUUID,
  validateSongInput,
  validateModel,
  validateLanguage,
  isValidLanguage,
  safeJsonParse,
} from './validation.js';

describe('isValidUUID', () => {
  it('should accept valid UUIDs', () => {
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isValidUUID('A550E840-E29B-41D4-A716-446655440000')).toBe(true);
  });

  it('should reject non-UUID strings', () => {
    expect(isValidUUID('')).toBe(false);
    expect(isValidUUID('not-a-uuid')).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716')).toBe(false);
    expect(isValidUUID(null)).toBe(false);
    expect(isValidUUID(undefined)).toBe(false);
    expect(isValidUUID(123)).toBe(false);
  });

  it('should reject SQL injection attempts in UUID format', () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-446655440000' OR 1=1--")).toBe(false);
    expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000; DROP TABLE users')).toBe(false);
  });
});

describe('validateSongInput', () => {
  it('should accept valid song input', () => {
    const result = validateSongInput('Bohemian Rhapsody', 'Queen');
    expect(result.song).toBe('Bohemian Rhapsody');
    expect(result.artist).toBe('Queen');
  });

  it('should strip dangerous HTML characters', () => {
    const result = validateSongInput('<script>alert(1)</script>', 'Artist');
    expect(result.song).not.toContain('<');
    expect(result.song).not.toContain('>');
  });

  it('should reject control characters', () => {
    expect(() => validateSongInput('song\x00name', 'artist')).toThrow('invalid control characters');
    expect(() => validateSongInput('song\x0Bname', 'artist')).toThrow('invalid control characters');
  });

  it('should reject too-long inputs', () => {
    expect(() => validateSongInput('x'.repeat(201), 'artist')).toThrow('too long');
    expect(() => validateSongInput('song', 'x'.repeat(201))).toThrow('too long');
  });

  it('should reject empty song', () => {
    expect(() => validateSongInput('', 'artist')).toThrow();
    expect(() => validateSongInput(null, 'artist')).toThrow();
  });

  it('should allow empty artist', () => {
    const result = validateSongInput('Song', '');
    expect(result.artist).toBe('');
  });
});

describe('validateModel', () => {
  it('should accept valid models', () => {
    expect(validateModel('claude')).toBe('claude');
    expect(validateModel('GPT4')).toBe('gpt4');
    expect(validateModel('gemini')).toBe('gemini');
  });

  it('should return default for empty input', () => {
    expect(validateModel(null)).toBe('claude');
    expect(validateModel('')).toBe('claude');
    expect(validateModel(undefined)).toBe('claude');
  });

  it('should reject invalid models', () => {
    expect(() => validateModel('invalid-model')).toThrow('Invalid model');
    expect(() => validateModel('../../etc/passwd')).toThrow('Invalid model');
  });

  it('should not allow injection through model name', () => {
    expect(() => validateModel('claude"; DROP TABLE--')).toThrow();
  });
});

describe('validateLanguage', () => {
  it('should accept valid languages', () => {
    expect(validateLanguage('en')).toBe('en');
    expect(validateLanguage('PT')).toBe('pt');
    expect(validateLanguage('zh')).toBe('zh');
  });

  it('should return default for empty input', () => {
    expect(validateLanguage(null)).toBe('en');
    expect(validateLanguage('')).toBe('en');
  });

  it('should reject invalid languages', () => {
    expect(() => validateLanguage('xx')).toThrow('Invalid language');
    expect(() => validateLanguage('en; DROP TABLE--')).toThrow('Invalid language');
  });
});

describe('isValidLanguage', () => {
  it('should return true for valid languages', () => {
    expect(isValidLanguage('en')).toBe(true);
    expect(isValidLanguage('pt')).toBe(true);
    expect(isValidLanguage('pt-BR')).toBe(true);
  });

  it('should return false for invalid languages', () => {
    expect(isValidLanguage('xx')).toBe(false);
    expect(isValidLanguage(null)).toBe(false);
    expect(isValidLanguage('')).toBe(false);
    expect(isValidLanguage(123)).toBe(false);
  });
});

describe('safeJsonParse', () => {
  it('should parse valid JSON from a request-like object', async () => {
    const fakeRequest = { json: async () => ({ key: 'value' }) };
    const result = await safeJsonParse(fakeRequest);
    expect(result).toEqual({ key: 'value' });
  });

  it('should return null for invalid JSON', async () => {
    const fakeRequest = { json: async () => { throw new Error('Invalid JSON'); } };
    const result = await safeJsonParse(fakeRequest);
    expect(result).toBeNull();
  });

  it('should return null when json() throws', async () => {
    const fakeRequest = { json: () => Promise.reject(new SyntaxError('Unexpected token')) };
    const result = await safeJsonParse(fakeRequest);
    expect(result).toBeNull();
  });
});
