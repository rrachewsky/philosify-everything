// ============================================================
// PANEL HANDLER TESTS — whitelist derivation + reservation release
// ============================================================
// Direction 1: a valid mediaType passes the derived whitelist end to end.
// Direction 2: an unknown mediaType is refused before any credit moves.
// Direction 3 (the divergence day the derivation exists for): if the
// whitelist ever admits a type the template refuses, the builder throws
// AFTER the 3 credits are reserved — the handler must release all 3.

import { describe, it, expect, vi, beforeEach } from 'vitest';

const releaseReservation = vi.fn(async () => ({ success: true }));
const reserveCredit = vi.fn(async () => ({
  success: true,
  reservationId: `res-${reserveCredit.mock.calls.length}`,
}));
const confirmReservation = vi.fn(async () => ({
  success: true,
  newTotal: 10,
  credits: 10,
  freeRemaining: 0,
}));

vi.mock('../auth/index.js', () => ({
  getUserFromAuth: vi.fn(async () => ({ userId: '00000000-0000-4000-8000-000000000001' })),
}));
vi.mock('../rate-limit/index.js', () => ({
  checkRateLimit: vi.fn(async () => true),
}));
vi.mock('../guides/index.js', () => ({
  getDebateAestheticGuide: vi.fn(async () => 'guide text'),
}));
vi.mock('../credits/index.js', () => ({
  reserveCredit: (...a) => reserveCredit(...a),
  confirmReservation: (...a) => confirmReservation(...a),
  releaseReservation: (...a) => releaseReservation(...a),
}));
vi.mock('../ai/models/index.js', () => ({
  callClaude: vi.fn(async () => 'panel analysis text '.repeat(20)),
  callGrok: vi.fn(async () => 'panel analysis text '.repeat(20)),
  callGemini: vi.fn(async () => 'panel analysis text '.repeat(20)),
}));
vi.mock('../utils/supabase.js', () => ({
  getSupabaseCredentials: vi.fn(async () => ({ url: 'https://sb.test', key: 'k' })),
}));
vi.mock('./colloquium.js', () => ({
  PHILOSOPHERS: [
    { name: 'Ayn Rand', school: 'Objectivism', era: '1905–1982', works: 'w', doctrines: 'd', stances: 's', style: 'st' },
    { name: 'Aristotle', school: 'Peripatetic', era: '384–322 BCE', works: 'w', doctrines: 'd', stances: 's', style: 'st' },
    { name: 'Seneca', school: 'Stoicism', era: '4 BCE–65 CE', works: 'w', doctrines: 'd', stances: 's', style: 'st' },
  ],
}));

const makeEnv = () => ({
  PHILOSIFY_KV: { get: vi.fn(async () => null), put: vi.fn(async () => {}) },
  ALLOWED_ORIGINS: 'https://philosify.org',
});

const makeRequest = (body) => ({
  json: async () => body,
  headers: { get: () => '1.2.3.4' },
});

const validBody = (mediaType) => ({
  mediaType,
  title: 'Test Work',
  artist: 'Test Creator',
  philosophers: ['Ayn Rand', 'Aristotle', 'Seneca'],
  lang: 'en',
});

beforeEach(() => {
  reserveCredit.mockClear();
  releaseReservation.mockClear();
  confirmReservation.mockClear();
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 201 })));
});

describe('philosopher-panel handler — media-type whitelist', () => {
  it('derives the whitelist from the template MEDIA keys plus news', async () => {
    const { SUPPORTED_MEDIA_TYPES } = await import('./philosopher-panel.js');
    const { PANEL_MEDIA_TYPES } = await import('../ai/prompts/philosopher-panel-template.js');
    for (const t of PANEL_MEDIA_TYPES) expect(SUPPORTED_MEDIA_TYPES).toContain(t);
    expect(SUPPORTED_MEDIA_TYPES).toContain('news');
    expect(SUPPORTED_MEDIA_TYPES).toHaveLength(PANEL_MEDIA_TYPES.length + 1);
  });

  it('valid type passes: cinema panel generates, confirms 3 credits, releases none', async () => {
    const { handlePhilosopherPanel } = await import('./philosopher-panel.js');
    const res = await handlePhilosopherPanel(makeRequest(validBody('cinema')), makeEnv());
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(reserveCredit).toHaveBeenCalledTimes(3);
    expect(confirmReservation).toHaveBeenCalledTimes(3);
    expect(releaseReservation).not.toHaveBeenCalled();
  });

  it('unknown type refuses at the gate: 400 before any credit is reserved', async () => {
    const { handlePhilosopherPanel } = await import('./philosopher-panel.js');
    const res = await handlePhilosopherPanel(makeRequest(validBody('podcast')), makeEnv());
    expect(res.status).toBe(400);
    expect(reserveCredit).not.toHaveBeenCalled();
    expect(releaseReservation).not.toHaveBeenCalled();
  });
});

describe('philosopher-panel handler — divergence safety net', () => {
  it('a type the whitelist admits but the template refuses releases all 3 reservations', async () => {
    // Simulate the divergence the derivation makes impossible today: the
    // whitelist admits "podcast", the MEDIA table does not.
    vi.resetModules();
    vi.doMock('../ai/prompts/philosopher-panel-template.js', async (importOriginal) => {
      const real = await importOriginal();
      return { ...real, PANEL_MEDIA_TYPES: [...real.PANEL_MEDIA_TYPES, 'podcast'] };
    });
    const { handlePhilosopherPanel } = await import('./philosopher-panel.js');
    const res = await handlePhilosopherPanel(makeRequest(validBody('podcast')), makeEnv());
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(reserveCredit).toHaveBeenCalledTimes(3);
    expect(releaseReservation).toHaveBeenCalledTimes(3);
    expect(confirmReservation).not.toHaveBeenCalled();
    vi.doUnmock('../ai/prompts/philosopher-panel-template.js');
    vi.resetModules();
  });
});
