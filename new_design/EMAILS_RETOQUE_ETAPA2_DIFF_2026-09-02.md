# Retoque dos e-mails transacionais — ETAPA 2: diff para OK

**Data:** 2026-09-02 · **Status:** proposto. **Nada editado, sem deploy, sem commit.**
Base: mapeamento em `EMAILS_RETOQUE_ETAPA1_MAPEAMENTO_2026-09-02.md` (18 idiomas no `email.js`; preto do lockup `#070708`;
idioma via `user_metadata.preferred_language`; gap OAuth = inglês).

---

## 1) Wrapper minimalista — `email.js` `generateEmailHtml` (novo)

Fundo **único `#070708`** (= preto do lockup), **sem card, sem divisores/sombras/glow/gradiente**, coluna única,
botão **outline ciano fino**, preto declarado em **todas as camadas** (`body`/`table`/`td`/`bgcolor`) + `color-scheme`.

```html
<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
  <!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#070708;color:#ffffff;font-family:-apple-system,'Segoe UI',Roboto,Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#070708" style="background-color:#070708;">
    <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:48px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#070708" style="max-width:440px;background-color:#070708;">
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0 0 28px;">
          <img src="${LOGO_URL}" alt="Philosify" width="200" style="width:200px;max-width:64%;height:auto;display:block;border:0;" />
        </td></tr>
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0 0 12px;">
          <h1 style="margin:0;color:#ffffff;font-family:Michroma,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0.5px;">${translations.title}</h1>
        </td></tr>
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0 0 26px;">
          <p style="margin:0;color:rgba(255,255,255,0.62);font-size:15px;line-height:1.6;">${translations.body}</p>
        </td></tr>
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0 0 30px;">
          <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:46px;v-text-anchor:middle;width:230px;" arcsize="12%" strokecolor="#00f0ff" fillcolor="#070708"><w:anchorlock/><center style="color:#00f0ff;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:bold;">${translations.button}</center></v:roundrect><![endif]-->
          <!--[if !mso]><!-->
          <a href="${confirmationUrl}" style="display:inline-block;border:1px solid #00f0ff;border-radius:6px;color:#00f0ff;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.5px;padding:12px 38px;text-decoration:none;mso-hide:all;">${translations.button}</a>
          <!--<![endif]-->
        </td></tr>
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0;">
          <p style="margin:0;color:rgba(255,255,255,0.30);font-size:12px;line-height:1.6;">${translations.footer}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
```
Estrutura = **logo + título curto + 1 frase + ação única + rodapé discreto. Nada mais.** (uma ação: só o botão,
sem link duplicado). O logo `#070708` funde no fundo `#070708` → **sem placa.**

## 2) Conteúdo — remover emoji + de-duplicar título↔botão (ponto 2 e 3)

Modelo EN (título curto ≠ frase do botão; sem emoji; frase de contexto enxuta):

| tipo | título (curto) | frase (body) | botão (ação, 1×) | rodapé |
|---|---|---|---|---|
| confirmSignup | Welcome to Philosify | Confirm your email address to activate your account. | Confirm email | If you didn't create an account, you can ignore this email. |
| magicLink | Your login link | Use the button below to sign in — it expires in one hour. | Sign in | If you didn't request this, you can ignore this email. |
| resetPassword | Password reset | We received a request to reset your password — set a new one below. | Set a new password | If you didn't request this, ignore this email; your password stays the same. |
| emailChange | Email change | Confirm your new email address to finish the change. | Confirm new email | If you didn't request this, contact support. |
| invite | You're invited | You've been invited to join Philosify. | Accept invitation | If you weren't expecting this, you can ignore this email. |

**Regra aplicada aos 18 (método cirúrgico byte-estável no `EMAIL_TRANSLATIONS`):**
1. **Tirar emoji** de todos os `title` (5 tipos × 18 = 90) — 🎵🔑🔒📧🎶 fora.
2. **De-duplicar** onde o título repete o botão (hoje: magicLink, resetPassword, emailChange) — título vira **tópico
   curto**, botão fica a **ação**, reusando a **terminologia da UI** de cada língua (ex.: PT título "Redefinição de senha"
   / botão "Definir nova senha"; ES "Restablecer contraseña" → título "Restablecimiento" / botón "Crear nueva contraseña").
3. Manter `subject`/`body`/`footer` já traduzidos; enxugar só onde necessário. `confirmSignup`/`invite` já têm ação 1× —
   só tiram o emoji.
- **Verificação (todos os 18):** nenhum emoji nos títulos; `title` ≠ `button` (nenhuma frase idêntica); os 5 tipos presentes.

## 3) `security-alerts.js` (recibo) e `ads/emails.js` — mesmo wrapper minimalista

Aplicar o **mesmo desenho** (fundo único `#070708`, sem card/glow, botão outline) aos wrappers desses dois.
O recibo perde a "caixa" cinza/`#121216` do bloco de valores → linhas simples sobre preto (rótulo à esquerda, valor
à direita, sem borda de card).

**Decisão de escopo (localização-18):** a linha de ESCOPO pede "todos em 18 idiomas", mas o recibo e o ads são
**só-inglês** hoje e não aparecem nos pontos 1–5. Dimensão:
- **Recibo** (`sendPaymentReceiptEmail`): ~6 rótulos ("Payment Confirmed", "Date", "Credits Purchased", "New Balance",
  "Start Analyzing", "View Stripe Receipt") → **6 × 18 = 108 strings**. É cliente-facing (pós-compra) → **recomendo
  localizar agora** reusando a terminologia da UI (créditos/saldo já existem no i18n).
- **Ads** (`ads/emails.js`): 8+ templates B2B com conteúdo dinâmico (empresa, valores, CTR) → **grande**; público
  anunciante, inglês é aceitável. **Recomendo: retoque de design agora, localização-18 como tarefa à parte.**
→ **Preciso do teu veredito:** (i) recibo localizar agora? (ii) ads localizar agora ou depois?

## 4) Gap do idioma (OAuth) — necessário para o invariante do ponto 5

O invariante "reset em qualquer um dos 18 → e-mail naquele idioma" **só vale para todos** se os usuários **Google
OAuth** (e contas antigas) tiverem `preferred_language`. Hoje **não têm** → recebem inglês. Isso é **frontend**
(deploy do site, não do worker), então proponho como **follow-up ligado**:
- No callback OAuth, `supabase.auth.updateUser({ data: { preferred_language: uiLang } })` se ausente; + backfill.
→ Fora do deploy do worker desta tarefa, mas **listado como dependência do invariante**. Confirmar se entra agora.

## 5) Aceite (ETAPA 3)
Dry-run + deploy do **worker** → **reset real em PT e num 2º idioma**, **Gmail mobile + desktop**: fundo **contínuo
preto** (sem placa sob o logo, mesmo em modo claro), **uma ação**, **sem emoji**, título ≠ botão.

---

**Preciso de você:** OK no wrapper (1) + modelo de conteúdo (2) + wrapper de recibo/ads (3); e o **veredito de escopo**
— recibo/ads localizam agora ou depois (3), e o fix OAuth entra agora ou fica agendado (4). **Nada editado até o OK.**

---

## EXECUTADO (2026-09-02) — veredito do Bob

**Worker deployado** — Version ID **`89c024d1-a9e0-4509-b03d-b9272adecda6`**. Dry-run verde; site buildado (`✓ 53s`).

### email.js (5 tipos × 18)
- **Wrapper minimalista** aplicado: fundo único `#070708` em todas as camadas (body/table/td/`bgcolor`) +
  `color-scheme:dark`; card `#0d0d0f` e linha de acento/divisor/footer-bar **removidos**; botão **outline ciano**;
  título Michroma, corpo Inter.
- **Conteúdo:** **0 emoji** nos 90 títulos; **título ≠ botão** nos 18 (dedup de magicLink/resetPassword/emailChange —
  inclusive ko/zh/ja/ar/he/fa/hu/nl onde reset title=button era idêntico). Reset: título "Redefinição de senha"
  (localizado) / botão "Definir nova senha" (localizado).
- **Preview renderizado (reset PT):** fundo preto contínuo, **sem placa** sob o lockup, uma ação, sem emoji. ✔

### security-alerts.js — recibo localizado (18) + minimalista
- `sendPaymentReceiptEmail` reescrito: wrapper minimalista, **`RECEIPT_I18N` com 9 rótulos × 18** (título, frase,
  data, créditos, saldo, unidade, CTA, link do recibo, "dúvidas?"), data via `toLocaleDateString(locale)`, RTL para ar/fa/he.
- **Idioma:** `getReceiptLanguage(env, userId)` busca `profiles.preferred_language` (fallback `en`); `userId` wirado
  nos 2 call sites do webhook (`index.js`). Emoji dos e-mails admin **removidos** (zero emoji no arquivo).

### ads/emails.js — wrapper minimalista (design)
- `wrapHtml` → coluna única sobre `#070708`, card removido, `bgcolor` nas camadas. **Localização + botões outline +
  flatten dos painéis internos = requisito do Ads Atelier** (registrado abaixo).

### OAuth — fix aplicado (nota de arquitetura)
A app é 100% proxied e o **email.js lê `user_metadata`** (não `profiles`) — então o fix **exigiu uma parte no worker**,
não só frontend:
- **Worker (proxy.js, já no deploy `89c024d1`):** `backfillPreferredLanguage()` — nos handlers de exchange
  (`/auth/exchange-code` PKCE e `/auth/exchange` implícito) faz `PUT /auth/v1/user` com o token do próprio usuário,
  preenchendo `user_metadata.preferred_language` **só quando ausente** (nunca sobrescreve). Cobre OAuth **e** os
  links de e-mail (o `/auth/exchange` atende ambos). **No-op** enquanto o frontend não manda `language` → seguro já no ar.
- **Frontend (site, buildado, aguardando o ciclo do site):** `useAuth.js` envia `language: i18n.language` nos dois
  exchanges. Vai junto do deploy do Orbitron.

### Backfill dos usuários Google existentes (~7)
**Critério:** não há fonte confiável do idioma deles. **NÃO** setar valor agora — preencher `'en'` **bloquearia** a
auto-correção (o backfill do worker só preenche quando o campo está **ausente**). Deixar ausente → recebem `'en'` por
fallback e **se auto-corrigem no próximo login** (worker já no ar; frontend no próximo ciclo). SQL = **diagnóstico**
(ver `migrations/diag_google_users_preferred_language.sql`), sem mutação.

### Aceite pendente (Bob)
Reset real em **PT** e num **2º idioma**, **Gmail mobile + desktop**: fundo contínuo preto sem placa, uma ação, sem emoji.

### Retoque final — lockup transparente (Gmail dark repinta o fundo)
Achado do aceite: Gmail dark repinta o fundo (~`#2c2e30`) sobre o `#070708`, e o PNG opaco vira placa.
Correção: `philosify-logo-lockup-transparent.png` (807×646) gerado com **luminância como alpha** (anti-alias
preservado; monocromático → RGB branco; 84,7% transparente + 11,5% anti-alias + 3,8% opaco; cantos alpha 0).
Templates `email.js`/`security-alerts.js` apontados; `ads/emails.js` não tem `<img>`.

### Ciclo de deploy (2026-09-02) — liberado após aceite do Orbitron
- **Site:** deployment **`da3970da`** — Orbitron/Exo2 erradicados + OAuth frontend (`useAuth.js`) + PNG transparente
  em `/brand`. Prova: `GET /brand/philosify-logo-lockup-transparent.png` → **200, 93.647B** (byte-match local, hasAlpha=true).
- **Worker:** Version ID **`84873c9e-f90a-4ccd-98d7-66d5e7f5424e`** — templates → PNG transparente. Dry-run verde.
- PNG opaco antigo (`philosify-logo-lockup.png`) segue no ar (200) mas **não é mais referenciado** — resquício inofensivo.

### Requisito registrado — Ads Atelier
`ads/emails.js`: **localização aos 18 idiomas** + botões **outline** + **flatten** dos painéis internos (`#1a1a2e`),
para casar com a identidade minimalista v2. (Wrapper minimalista já aplicado nesta tarefa.)
