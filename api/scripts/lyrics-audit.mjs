#!/usr/bin/env node
// ============================================================
// LYRICS CONTAMINATION AUDIT — local runner
// ============================================================
// Pages through /api/admin/lyrics-audit, writes a reviewable report, and
// NEVER deletes anything. Purging is a separate, explicit second step.
//
//   PowerShell:
//     $env:PHILOSIFY_ADMIN_SECRET = "<your admin secret>"
//     node api/scripts/lyrics-audit.mjs
//
//   Then review api/scripts/out/lyrics-audit.md. To purge the ids you approve:
//     node api/scripts/lyrics-audit.mjs --purge api/scripts/out/purge-approved.json
//
// The secret is read from the environment and is never printed or written to
// any output file.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const API = process.env.PHILOSIFY_API || 'https://api.philosify.org';
const SECRET = process.env.PHILOSIFY_ADMIN_SECRET;
const PAGE = Number(process.env.PHILOSIFY_AUDIT_PAGE || 25);

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'out');

if (!SECRET) {
  console.error('PHILOSIFY_ADMIN_SECRET is not set. Set it in your shell and re-run.');
  process.exit(1);
}

const headers = { 'X-Admin-Secret': SECRET };

async function getJson(url, init = {}) {
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init.headers || {}) } });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} — non-JSON response: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(`${res.status} — ${body.error || text.slice(0, 200)}`);
  return body;
}

// ---------- purge mode -----------------------------------------------------
if (process.argv[2] === '--purge') {
  const file = process.argv[3];
  if (!file) {
    console.error('Usage: node lyrics-audit.mjs --purge <approved.json>');
    process.exit(1);
  }
  const approved = JSON.parse(fs.readFileSync(file, 'utf8'));
  const ids = Array.isArray(approved) ? approved : approved.analysisIds;
  if (!Array.isArray(ids) || !ids.length) {
    console.error('No analysisIds in that file. Nothing done.');
    process.exit(1);
  }
  console.log(`Superseding ${ids.length} analyses (rows are dethroned, never deleted)...`);
  const result = await getJson(`${API}/api/admin/lyrics-audit/purge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ analysisIds: ids, clearLyrics: approved.clearLyrics === true }),
  });
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

// ---------- audit mode -----------------------------------------------------
fs.mkdirSync(OUT, { recursive: true });

const { totalPublishedAnalyses } = await getJson(`${API}/api/admin/lyrics-audit?count=1`);
console.log(`Published analyses in scope (music + news, news is skipped): ${totalPublishedAnalyses ?? 'unknown'}`);

const suspects = [];
const inconclusive = [];
let offset = 0;
let songsChecked = 0;
let clean = 0;

for (;;) {
  process.stdout.write(`\rWindow offset ${offset}... `);
  let page;
  try {
    page = await getJson(`${API}/api/admin/lyrics-audit?offset=${offset}&limit=${PAGE}`);
  } catch (err) {
    console.error(`\nWindow ${offset} failed: ${err.message}`);
    console.error('Stopping here; the report below covers what was checked.');
    break;
  }
  suspects.push(...page.suspects);
  inconclusive.push(...page.inconclusive);
  songsChecked += page.window.songsChecked;
  clean += page.counts.clean;

  if (page.nextOffset == null) break;
  offset = page.nextOffset;
}

process.stdout.write('\r');

const lines = [];
lines.push('# Auditoria de letra contaminada — análises de música em cache');
lines.push('');
lines.push(`- Análises publicadas varridas: **${totalPublishedAnalyses ?? '?'}** (notícias são ignoradas)`);
lines.push(`- Músicas únicas verificadas no Genius: **${songsChecked}**`);
lines.push(`- Limpas: **${clean}** · Suspeitas: **${suspects.length}** · Inconclusivas: **${inconclusive.length}**`);
lines.push('');
lines.push('> Isto é uma reprodução contra o índice ATUAL do Genius, não uma gravação do que');
lines.push('> aconteceu na época. Reveja antes de purgar.');
lines.push('');

if (suspects.length) {
  lines.push('## Suspeitas — analisadas sobre a letra de outra faixa');
  lines.push('');
  lines.push('| Música | Artista | Veredito | Foi analisada como | Deveria ser | Modelos |');
  lines.push('|---|---|---|---|---|---|');
  for (const s of suspects) {
    const models = s.analyses.map((a) => `${a.model}/${a.language}`).join(', ');
    lines.push(
      `| ${s.song} | ${s.artist} | \`${s.verdict}\` | ${s.analysedAs || '—'} | ${s.shouldBe || '— (ausente no Genius)'} | ${models} |`
    );
  }
  lines.push('');
} else {
  lines.push('## Nenhuma suspeita encontrada');
  lines.push('');
}

if (inconclusive.length) {
  lines.push('## Inconclusivas — julgar à mão');
  lines.push('');
  lines.push('| Música | Artista | Veredito | Detalhe |');
  lines.push('|---|---|---|---|');
  for (const s of inconclusive) {
    lines.push(`| ${s.song} | ${s.artist} | \`${s.verdict}\` | ${s.detail} |`);
  }
  lines.push('');
}

fs.writeFileSync(path.join(OUT, 'lyrics-audit.md'), lines.join('\n'), 'utf8');
fs.writeFileSync(
  path.join(OUT, 'lyrics-audit.json'),
  JSON.stringify({ totalPublishedAnalyses, songsChecked, clean, suspects, inconclusive }, null, 2),
  'utf8'
);
fs.writeFileSync(
  path.join(OUT, 'purge-candidates.json'),
  JSON.stringify(
    {
      comment:
        'Review this list. Delete any line you want to KEEP, then run with --purge. clearLyrics also nulls the stored contaminated lyrics.',
      clearLyrics: true,
      analysisIds: suspects.flatMap((s) => s.analyses.map((a) => a.id)),
    },
    null,
    2
  ),
  'utf8'
);

console.log(`Songs checked: ${songsChecked} · clean ${clean} · suspect ${suspects.length} · inconclusive ${inconclusive.length}`);
console.log(`Report:            ${path.join(OUT, 'lyrics-audit.md')}`);
console.log(`Purge candidates:  ${path.join(OUT, 'purge-candidates.json')}  (nothing purged yet)`);
