// ============================================================
// i18n ERROR MESSAGES - TESTS
// ============================================================
// Ensures all error messages are translated to all languages

import { describe, it, expect } from 'vitest';
import { getLocalizedError, ERROR_MESSAGES_I18N } from './i18n-errors.js';

const SUPPORTED_LANGUAGES = [
  'en', 'pt', 'es', 'fr', 'de', 'it', 'nl', 'ru', 'zh', 'ar',
  'he', 'ja', 'ko', 'tr', 'pl', 'hu', 'hi', 'fa',
];

describe('i18n Error Messages', () => {
  it('should have translations for all supported languages', () => {
    const errorKeys = Object.keys(ERROR_MESSAGES_I18N);
    expect(errorKeys.length).toBeGreaterThan(0);

    for (const errorKey of errorKeys) {
      const messages = ERROR_MESSAGES_I18N[errorKey];
      
      for (const lang of SUPPORTED_LANGUAGES) {
        expect(messages[lang]).toBeDefined();
        expect(messages[lang].length).toBeGreaterThan(0);
        expect(messages[lang]).not.toBe('');
      }
    }
  });

  it('should return English as fallback for unknown language', () => {
    const result = getLocalizedError('INSUFFICIENT_CREDITS', 'unknown-lang');
    expect(result).toBe('Insufficient credits');
  });

  it('should return error key if unknown error key', () => {
    const result = getLocalizedError('UNKNOWN_ERROR_KEY', 'en');
    expect(result).toBe('UNKNOWN_ERROR_KEY');
  });

  it('should translate INSUFFICIENT_CREDITS correctly', () => {
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'en')).toBe('Insufficient credits');
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'pt')).toBe('Créditos insuficientes');
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'es')).toBe('Créditos insuficientes');
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'fr')).toBe('Crédits insuffisants');
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'de')).toBe('Unzureichende Credits');
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'ar')).toBe('أرصدة غير كافية');
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'he')).toBe('אשראי לא מספיק');
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'ja')).toBe('クレジットが不足しています');
    expect(getLocalizedError('INSUFFICIENT_CREDITS', 'zh')).toBe('积分不足');
  });

  it('should translate UNAUTHORIZED correctly', () => {
    expect(getLocalizedError('UNAUTHORIZED', 'en')).toBe('Please log in to continue');
    expect(getLocalizedError('UNAUTHORIZED', 'pt')).toBe('Por favor, faça login para continuar');
    expect(getLocalizedError('UNAUTHORIZED', 'es')).toBe('Por favor, inicia sesión para continuar');
    expect(getLocalizedError('UNAUTHORIZED', 'fr')).toBe('Veuillez vous connecter pour continuer');
  });

  it('should translate ANALYSIS_FAILED correctly', () => {
    expect(getLocalizedError('ANALYSIS_FAILED', 'en')).toBe('Analysis failed');
    expect(getLocalizedError('ANALYSIS_FAILED', 'pt')).toBe('Análise falhou');
    expect(getLocalizedError('ANALYSIS_FAILED', 'es')).toBe('Análisis falló');
  });

  it('should have no duplicate English values across error keys', () => {
    const englishMessages = new Set();
    const duplicates = [];

    for (const [key, messages] of Object.entries(ERROR_MESSAGES_I18N)) {
      const englishMsg = messages.en;
      if (englishMessages.has(englishMsg)) {
        duplicates.push({ key, message: englishMsg });
      }
      englishMessages.add(englishMsg);
    }

    expect(duplicates).toEqual([]);
  });

  it('should not have obvious placeholder text', () => {
    // Check for standalone placeholder words (not substrings of real words)
    const forbiddenWords = ['FIXME', 'XXX', 'TBD', 'placeholder', 'PLACEHOLDER'];
    
    for (const [errorKey, messages] of Object.entries(ERROR_MESSAGES_I18N)) {
      for (const [lang, message] of Object.entries(messages)) {
        for (const word of forbiddenWords) {
          // Exact match only to avoid false positives
          expect(message).not.toContain(word);
        }
      }
    }
  });

  it('should not be empty or just whitespace', () => {
    for (const [errorKey, messages] of Object.entries(ERROR_MESSAGES_I18N)) {
      for (const [lang, message] of Object.entries(messages)) {
        expect(message.trim()).toBeTruthy();
        expect(message.length).toBeGreaterThan(2);
      }
    }
  });
});
