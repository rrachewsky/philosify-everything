# Privacy v2 — ETAPA 2/3 concluídas · diff final para OK de commit+deploy

**Data:** 2026-08-31 · **Status:** aplicado nos 18 JSONs + componente; **build verde**; amostragem OK.
**NADA commitado, NADA deployado.** Aguardando teu OK. **Data de vigência: 31 de agosto de 2026.**

---

## 1. O que foi aplicado

- **`legal.privacy.content` (18 idiomas)** → Privacy v2 (15 seções). EN = canônico integral; PT = redigido
  (gênero masculino de "Philosify", "registro de auditoria"); 16 demais = traduções cuidadosas com a
  terminologia da UI (Etapa 1d), diacríticos preservados.
- **Split do ticker** (`site/src/pages/v2/LegalPage.jsx`): `v2.legal.updated` → **`termsUpdated`** (mantém
  "29 ago 2026" no /tos) + **`privacyUpdated`** ("31 ago 2026" no /pp). O componente escolhe por documento.
- **Títulos legados** `legal.privacy.title` corrigidos em **nl/pl/tr** (Privacybeleid / Polityka Prywatności / Gizlilik Politikası).
- **Método byte-estável:** round-trip `parse → stringify(2 espaços) → CRLF` confirmado idêntico ao original
  (en/pt/zh/ar testados, 0 linhas divergentes) → diff mínimo: **5 linhas/arquivo** (7 em nl/pl/tr).

## 2. Tabela idioma → arquivo → status

| lang | arquivo | content (chars) | privacyUpdated | invariantes |
|---|---|---|---|---|
| en | en.json | 1988→7790 | Last updated // 31 Aug 2026 | ✅ |
| pt | pt.json | 2321→8918 | Última atualização // 31 ago 2026 | ✅ |
| es | es.json | 2302→9252 | Última actualización // 31 ago 2026 | ✅ |
| fr | fr.json | 2558→9910 | Dernière mise à jour // 31 août 2026 | ✅ |
| it | it.json | 2359→9096 | Ultimo aggiornamento // 31 ago 2026 | ✅ |
| de | de.json | 2542→9247 | Zuletzt aktualisiert // 31. August 2026 | ✅ |
| nl | nl.json | 2367→8740 | Laatst bijgewerkt // 31 aug 2026 | ✅ + título |
| pl | pl.json | 2496→8822 | Ostatnia aktualizacja // 31 sie 2026 | ✅ + título |
| hu | hu.json | 2360→8606 | Utolsó frissítés // 2026. aug. 31. | ✅ |
| tr | tr.json | 2334→8250 | Son güncelleme // 31 Ağu 2026 | ✅ + título |
| ru | ru.json | 2346→8718 | Обновлено // 31 авг 2026 | ✅ |
| zh | zh.json | 869→3349 | 最后更新 // 2026年8月31日 | ✅ |
| ja | ja.json | 1175→4469 | 最終更新 // 2026年8月31日 | ✅ |
| ko | ko.json | 1236→4523 | 최종 업데이트 // 2026년 8월 31일 | ✅ |
| hi | hi.json | 2252→8338 | अंतिम अपडेट // 31 अगस्त 2026 | ✅ |
| ar | ar.json | 1743→7218 | آخر تحديث // 31 أغسطس 2026 | ✅ |
| fa | fa.json | 2053→8056 | آخرین به‌روزرسانی // ۳۱ اوت ۲۰۲۶ | ✅ (dígitos persas) |
| he | he.json | 1737→6699 | עדכון אחרון // 31 באוגוסט 2026 | ✅ |

## 3. Checagem automática de invariantes (língua a língua) — 18/18 OK

Por idioma, verificado: **15 `<h2>`** · link `href="/tos"` · **bob@philosify.org** · **São Paulo** ·
**Anthropic** · **Global Goods Corp** · **2026** · **TLS = 1×** (só no Underground) ·
**expressão "ponta a ponta" = 1×** (só nas DMs — **nunca no Underground**). Este último confirma
automaticamente o invariante mais delicado da §5 em todas as línguas.

## 4. Build e amostragem (ETAPA 3)

- `npm run build` — **verde** (`✓ built in 1m 19s`; só o aviso de chunk pré-existente). Cada idioma vira chunk próprio.
- Amostragem no `dist/`:
  - EN "generated and held by Philosify" → `index-*.js` ✅
  - PT "registro de auditoria" → `pt-*.js` ✅
  - ZH "静态时加密" (cifrado em repouso) → `zh-*.js` ✅
  - `privacyUpdated` presente nos chunks ✅

## 5. Arquivos do commit (proposto)

**Publicação (núcleo):** `site/src/pages/v2/LegalPage.jsx` + os 18 `site/src/i18n/translations/*.json`.
**Relatórios `new_design/`:** `PRIVACY_V2_ETAPA1_MAPEAMENTO`, `PRIVACY_V2_PTBR_VALIDACAO`, este arquivo
(precedente: reports vão junto).

**Decisão pedida:** `docs/philosify-privacy-v2-canonical-EN.md` aparece **modificado** (teu save da versão
final, não editado por mim). **Incluo no commit** (canônico coerente com o publicado) ou deixo de fora?

**Fora do commit (não relacionados):** `docs/LAUNCH_READINESS_REPORT.md`, `docs/MARKET_LAUNCH_PLAN.md`.

## 6. Mensagem de commit proposta (minúsculas PT; autor Bob; sem IA)

```
publica a política de privacidade v2 em todos os idiomas

- legal.privacy.content atualizado nos 18 idiomas para a v2 (15 seções),
  data de vigência 31 de agosto de 2026; EN é o canônico, PT redigido, demais
  traduzidos com a terminologia da UI de cada língua.
- separa o ticker legal: v2.legal.updated -> termsUpdated (mantém 29 ago 2026 no
  /tos) + privacyUpdated (31 ago 2026 no /pp); LegalPage escolhe por documento.
- corrige o título legado legal.privacy.title em nl/pl/tr.
- underground descrito como cifrado em repouso (sem "ponta a ponta"); dms mantêm
  ponta a ponta quando ambas as partes têm chaves.
```

## 7. EXECUTADO (2026-09-01)

**Ajuste de data (OK do Bob):** data do deploy = **1º de setembro de 2026**. Effective Date nos 18
`legal.privacy.content` e os 18 `v2.legal.privacyUpdated` atualizados (formato localizado); canônico
`docs/philosify-privacy-v2-canonical-EN.md` = "September 1, 2026". `termsUpdated` **intacto** em 29 ago (/tos).
Invariantes re-verificados **18/18 OK**. Rebuild **verde** (32.9s).

- **Commit:** `956a4b8de7b11a88357c3c317fd406a2529a0db6` (autor Bob Rach, sem IA) — 23 arquivos
  (18 JSON + LegalPage.jsx + canônico + 3 relatórios).
- **Push:** `1707857..956a4b8` → `origin/redesign/v2`.
- **Deploy:** Cloudflare Pages `--branch=production` → deployment **`8e0cef26`**
  (https://8e0cef26.philosify-frontend.pages.dev) → philosify.org.

### Teste de aceitação (navegador, philosify.org) — ✅ PASSOU
- **/pp:** heading "POLÍTICA DE PRIVACIDADE"; ticker **"Última atualização // 1 set 2026"**;
  Effective Date "1º de setembro de 2026"; conteúdo v2 (audit + Global Goods Corp); §5 "cifradas em
  repouso" + "ponta a ponta" (DMs). **Não** exibe a data do ToS.
- **/tos:** heading "TERMOS DE SERVIÇO"; ticker **"Última atualização // 29 ago 2026"** (intacto).
- **Split do ticker confirmado:** /pp e /tos exibem datas diferentes do mesmo componente. A "mentira
  visual" está resolvida.

**Fora do commit (uncommitted, não relacionados):** docs/LAUNCH_READINESS_REPORT, docs/MARKET_LAUNCH_PLAN,
new_design/RELATORIO_SUPERVISOR_FECHAMENTO_MODO_A, philosify-modules-review.html, printscreen 01/.
