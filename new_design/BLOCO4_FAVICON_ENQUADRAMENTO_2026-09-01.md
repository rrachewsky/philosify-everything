# Bloco 4 — Favicon só-coruja: análise de enquadramento (medido)

**Data:** 2026-09-01 · **Status:** achado + opções de correção. **Aguardando decisão do Bob.**
**Fonte:** `site/public/icon-512.png` (512×512, fundo `#070708` uniforme — RGB 7,7,8 nas 4 quinas).
**Método:** bounding box dos pixels claros (luminância > 48; coruja = traços claros sobre preto).

---

## 1. O que está LIVE agora (crop `left=91 top=6 lado=330`)

Medido dentro do quadro 330×330:

| métrica | valor |
|---|---|
| coruja — largura | **56,1%** do quadro |
| coruja — altura | **77,0%** do quadro |
| área da bounding box | 43,1% |
| "tinta" real (só os traços) | 12,1% |
| margem **esquerda** | 21,8% |
| margem **direita** | 22,1% |
| margem **topo** | 23,0% |
| margem **base** | **0,0%** |

## 2. Defeito encontrado

- **Garras cortadas.** No `icon-512` a coruja ocupa as linhas **83..345**. O crop atual (top=6, lado=330)
  termina na linha **335** → as **~10 linhas finais (336..345)** das pontas das garras ficaram **de fora**
  (≈3,8% da altura da coruja). É por isso que a margem inferior deu **0%**.
- **Descentrada na vertical.** 23,0% de folga no topo contra 0,0% na base — a coruja está "espremida" contra
  a borda de baixo. Horizontalmente está OK (centrada, ~22% de cada lado).
- **Causa raiz.** A wordmark "philosify" começa nas linhas **366..430**, ou seja **só 21px abaixo** dos pés da
  coruja (345). Esse pouco espaço + um top alto demais no crop empurraram a coruja pra baixo e cortaram as garras.

**Perfil vertical do original (bandas de tinta):** coruja `83..345` (h=263) · vão preto `346..365` ·
wordmark `366..430`. Bounding box da coruja: x **163..347** (185px), y **83..345** (263px) — **retrato**,
78px mais alta que larga, centrada horizontalmente (centro x≈255, imagem 512).

## 3. Correção proposta

Recortar a coruja exata (185×263) e **compor centrada sobre fundo preto `#070708`**, sem corte e sem wordmark.
Como a coruja é retrato, num quadrado as margens laterais ficam naturalmente maiores que topo/base (letterbox
normal de um sujeito retrato). Opções (coruja centrada, garras inteiras):

| alvo (altura da coruja) | quadro | coruja L×A | margem topo/base | margem esq/dir |
|---|---|---|---|---|
| 86% | 306px | 60,5% × 85,9% | 7,0% | 19,8% |
| **80% (recomendado)** | **329px** | **56,2% × 79,9%** | **10,0%** | **21,9%** |
| 74% | 355px | 52,1% × 74,1% | 13,0% | 23,9% |

**Recomendação:** alvo **80%** — coruja centrada de verdade (10% de respiro em cima e embaixo), garras inteiras,
e mantém quase a mesma presença horizontal já aprovada (~22% dos lados).

## 4. Execução (se aprovado)

Regenerar os **3 favicons** (`favicon-16x16.png`, `favicon-32x32.png`, `favicon.ico`) no alvo escolhido via
`sharp` (extract tight bbox → composite/extend centrado em `#070708`) → **redeploy do site** (~2 min).
`icon-192/512`, apple-touch, maskable, `?v=2`, SW `v13/runtime-v12` — inalterados (já no ar).

**Aguardando:** escolha do alvo (86 / **80** / 74 / outro) — ou "deixar como está".

---

## EXECUTADO (2026-09-01) — alvo 86% aplicado

**Decisão do Bob:** alvo **86%** (quadro 306px, garras inteiras, centrada, ~7% topo/base).

- **Regeneração:** recorte exato da coruja (`extract left=163 top=83 185×263`) → composição centrada
  (`extend top=21 bottom=22 left=60 right=61`, fundo `#070708`) → master 306×306 → resize 32/16 →
  `favicon.ico` reconstruído (frames PNG 16+32). Novos tamanhos: **ico 2165 B · 32px 1546 B · 16px 581 B**.
- **Enquadramento medido (preview 256):** coruja **60,2% L × 86,3% A**; margens **L 19,5% · R 20,3% · T 6,6% · B 7,0%**.
  Garras inteiras (base ≠ 0). ✔
- **`icon-192/512`, apple-touch, maskable — inalterados** (Bob manteve); ficam em `?v=2`.

### Cache-busting (lição registrada)
- O conteúdo do favicon mudou mas a URL seguia `?v=2` → o **edge da Cloudflare** serviu os bytes antigos
  (1951/1364/549) mesmo com a origem já atualizada (confirmado com query aleatória: origem = 2165/1546/581).
- **Correção:** bump `?v=2`→**`?v=3`** nos 3 favicons trocados em `index.html` (a razão de existir do `?v=`:
  subir quando o conteúdo muda). Rebuild + redeploy. apple-touch/manifest/browserconfig ficam em `?v=2` (conteúdo intacto).

### Deploy
- **Site (favicons 86%):** deployment `8a493eeb` (3 arquivos).
- **Site (bump `?v=3`):** deployment **`1db09f9f`** — **atual**.
- **Verificação prod:** `favicon.ico?v=3` → 200 **2165 B**; `favicon-32x32.png?v=3` → 200 **1546 B**;
  `favicon-16x16.png?v=3` → 200 **581 B** — todos **byte-match** com os arquivos gerados. ✔

**Aceite (Bob):** aba nova em **Edge** e **Firefox**, em tamanho real → coruja centrada, garras inteiras.
