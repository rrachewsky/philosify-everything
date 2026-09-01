# Privacy v2 — ETAPA 1: Mapeamento (somente leitura) · AGUARDANDO OK

**Data:** 2026-08-31 · **Status:** mapeamento fechado, **nada editado**. Aguardando OK para a ETAPA 2.
**Canônico:** `docs/philosify-privacy-v2-canonical-EN.md` (confirmado no caminho; 15 seções; seção 5 já MODO A).
**Entidade:** Global Goods Corp · **Contato:** bob@philosify.org · **Data efetiva:** data do deploy.

---

## a) Onde a Privacy vive (caminhos exatos)

- **Rota:** `site/src/Router.jsx:158-159` — `/tos` → `<LegalPage doc="terms"/>`, `/pp` → `<LegalPage doc="privacy"/>` (lazy, linha 42).
- **Componente:** `site/src/pages/v2/LegalPage.jsx` — serve os dois docs. Texto vem da chave i18n
  **`legal.privacy.content`** (HTML), sanitizado com `DOMPurify.sanitize` (config default), h2 → índice (TOC).
  Título: `v2.legal.privacyTitle` → fallback `legal.privacy.title` → `'Privacy Policy'` (linhas 106-108).
- **Chave a substituir:** `legal.privacy.content` nos **18** idiomas (hoje a antiga de 10 seções; 869–2558 chars).
- **Legado:** `site/src/pages/PrivacyPolicy.jsx` e `components/legal/PrivacyModal.jsx` existem mas
  **`PrivacyPolicy.jsx` NÃO está roteado** (grep em Router.jsx vazio) → o `/pp` é só o `LegalPage`.
- **Convenção de HTML** (espelhando `legal.terms.content` v2 já em produção):
  `<p><strong>Effective Date:</strong> …</p>` + `<p>` intro (com `<a href="/tos">`) + `<h2>N. Título</h2>` +
  `<p>`, `<strong>`, `<ul><li>`. **Sem `<h1>`** (o título é do `ModuleHeader`). ToS tem 13 h2; Privacy terá 15.

## b) 18 idiomas + estado dos títulos

Idiomas: **ar, de, en, es, fa, fr, he, hi, hu, it, ja, ko, nl, pl, pt, ru, tr, zh**.
- `v2.legal.privacyTitle` (o que o `/pp` renderiza) está **traduzido nos 18**. ✓
- Legado `legal.privacy.title` **sem tradução** ("Privacy Policy") em **nl, pl, tr** — mas **não afeta o /pp**
  (usa `v2.legal.privacyTitle`) e `PrivacyPolicy.jsx` não é roteado → **chave morta**.
  **Decisão pedida:** corrigir mesmo assim (3 one-liners: Privacybeleid / Polityka Prywatności / Gizlilik Politikası)
  ou deixar fora de escopo. **Recomendo corrigir** (custo zero, coerência).

## c) SPLIT DO TICKER

- **Hoje:** `LegalPage.jsx:136` — `<Ticker>{t('v2.legal.updated', 'Last updated // 29 Aug 2026')}</Ticker>`
  — **mesma chave** nos dois docs → a Privacy exibe a data do ToS (a "mentira visual").
- **Proposta (2 chaves cheias, por idioma):** renomear `v2.legal.updated` → **`v2.legal.termsUpdated`**
  (mantém o valor exato 29 Aug 2026 de cada língua) e adicionar **`v2.legal.privacyUpdated`** (= data do deploy).

  **Diff do componente (linha 136):**
  ```jsx
  // DE:
  <Ticker>{t('v2.legal.updated', 'Last updated // 29 Aug 2026')}</Ticker>
  // PARA:
  <Ticker>{isTerms
    ? t('v2.legal.termsUpdated', 'Last updated // 29 Aug 2026')
    : t('v2.legal.privacyUpdated', 'Last updated // 31 Aug 2026')}</Ticker>
  ```
  **Impacto nos 18 JSONs:** dentro de `v2.legal`, renomear `updated`→`termsUpdated` e adicionar `privacyUpdated`.
  `/tos` preserva **29 ago 2026** (string idêntica por idioma); `/pp` recebe a **data do deploy**.
  Escolhido o par de strings cheias (não parametrizar) porque prefixo e formato de data já são localizados por idioma.

## d) Terminologia por idioma (reuso exato da UI)

Fonte: `unsafeZone.title`, `community.underground.title`, `v2.commerce.credits`. ("encryption"/"moderation"
não têm rótulo de UI próprio → registro jurídico natural por idioma.)

| lang | Unsafe Zone | Underground | credits |
|---|---|---|---|
| ar | المنطقة الخطرة | الأندرغراوند | الأرصدة |
| de | Unsichere Zone | Der Underground | Credits |
| en | Unsafe Zone | The Underground | Credits |
| es | Zona Insegura | El Underground | Créditos |
| fa | منطقه خطر | آندرگراوند | اعتبار |
| fr | Zone Dangereuse | L'Underground | Crédits |
| he | אזור לא בטוח | האנדרגראונד | קרדיטים |
| hi | असुरक्षित क्षेत्र | अंडरग्राउंड | क्रेडिट |
| hu | Veszélyes Zóna | Az Underground | Kreditek |
| it | Zona Insicura | L'Underground | Crediti |
| ja | 危険地帯 | アンダーグラウンド | クレジット |
| ko | 위험 구역 | 언더그라운드 | 크레딧 |
| nl | Onveilige Zone | De Underground | Credits |
| pl | Niebezpieczna Strefa | Underground | Kredyty |
| pt | Zona Insegura | O Underground | Créditos |
| ru | Опасная Зона | Андеграунд | Кредиты |
| tr | Güvensiz Bölge | Yeraltı | Krediler |
| zh | 危险区域 | 地下室 | 积分 |

## e) Plano de arquivos

**Fonte (1):** `site/src/pages/v2/LegalPage.jsx` — split do ticker (diff §c).
**i18n (18):** `site/src/i18n/translations/<lang>.json` — cada um:
  1. `legal.privacy.content` → **v2** (EN integral; PT redigido; 16 traduzidos), Effective Date = data do deploy;
  2. `v2.legal.updated` → renomear para `termsUpdated` + adicionar `privacyUpdated` (data do deploy);
  3. (opcional, se OK) `legal.privacy.title` traduzido em nl/pl/tr.
**Método i18n:** cirúrgico, round-trip byte-estável, EOL-aware (todos os 18 são CRLF, como na tarefa do ToS).
**Nada mais** é tocado (sem seções add/remove; `legal.terms.content` intacto).

## Invariantes a garantir em TODAS as línguas (conferência 1-a-1 na ETAPA 2)

- **Seção 4 (Zona Insegura):** "exclusivamente à Anthropic"; exclusão **física**; "nunca … publicidade/perfilamento/treinamento".
- **Seção 5 (Underground):** cifrado **em repouso**; chave **gerada e mantida pelo Philosify** (KEK);
  apelido esconde identidade **dos membros, não da plataforma**; acesso **só p/ moderação (denúncia) ou obrigação legal**,
  **registrado em auditoria**. **SEM "ponta a ponta"** no Underground. **DMs**: "ponta a ponta quando ambas as partes têm chaves".
- **Seção 12:** 16 anos. **Seção 13:** banco primário em São Paulo; processadores nos EUA e outros países; Global Goods Corp nos EUA.
- **E-mail** bob@philosify.org; **nenhuma seção** adicionada/removida (15 no total).

## DECISÕES QUE PRECISO DE OK

1. **Plano de arquivos** (§e) e **split do ticker** (§c) como propostos?
2. **Data efetiva/deploy:** uso **31 August 2026** (hoje) na Effective Date e no `privacyUpdated`? Se o deploy escorregar de dia, ajusto as strings.
3. **Títulos legados nl/pl/tr:** corrijo os 3 one-liners ou deixo fora de escopo?

**Aguardando OK. Nada será editado antes disso.**
