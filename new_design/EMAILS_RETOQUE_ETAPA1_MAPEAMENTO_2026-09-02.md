# Retoque dos e-mails transacionais — ETAPA 1: mapeamento (somente leitura)

**Data:** 2026-09-02 · **Status:** mapeamento fechado, **nada editado.** Aguardando OK + spec completa da Etapa 2.

---

## a) Cobertura de idiomas (hoje)

| Template | Idiomas | Fallback |
|---|---|---|
| **`email.js`** (5 tipos: confirmSignup, magicLink, resetPassword, emailChange, invite) | **18** (en,pt,es,de,fr,it,ja,ko,zh,ru,ar,he,hi,fa,hu,nl,pl,tr) | `EMAIL_TRANSLATIONS[lang] \|\| en`, e por-tipo `\|\| en['tipo']` |
| **`security-alerts.js` → `sendPaymentReceiptEmail`** (recibo do cliente) | **só inglês** (texto hardcoded) | — |
| **`ads/emails.js`** (ciclo do anunciante) | **só inglês** (0 localização) | — |
| Admin (`sendSecurityAlertEmail`/`sendNewAnalysisRequestEmail`/`sendNewSubscriberEmail`) | inglês | admin-facing, ok |

**Correção do palpite:** o `email.js` **já cobre os 18** (o comentário "18" está certo; "12" está desatualizado).
Nenhum idioma ausente nos 5 tipos de auth. O que **não** é localizado: o **recibo de pagamento** e os **e-mails de ads**.

## b) Como o idioma é determinado no disparo

- **Fonte:** `user.user_metadata.preferred_language` — setado no **signup por e-mail** (`api/src/auth/proxy.js:320`,
  `preferred_language: language || "en"`, a partir da língua da UI) e espelhado em `profiles.preferred_language`.
  Lido em `email.js:1034` (`preferred_language` → `language` legado → `app_metadata.language` → `'en'`).
- **Reset sem sessão:** o `email.js` é o **Auth Email Hook** do Supabase; o payload traz o **objeto `user`** (com
  `user_metadata`), então **o reset acha o idioma mesmo sem sessão** — desde que o usuário tenha `preferred_language`.
- **É o perfil, não o locale da requisição** — correto para reset (idioma da conta, não do dispositivo).

### ⚠️ GAP (reportar + propor, como pedido)
Usuários que **não** têm `preferred_language` em `user_metadata` caem em **inglês** em TODOS os e-mails de auth
(incl. reset):
- **Google OAuth:** o `signInWithOAuth` **não passa** pelo handler de signup do `proxy.js` (não achei set de
  `preferred_language` no caminho OAuth do frontend); o trigger de `profiles` usa `COALESCE(...,'en')`. → OAuth = inglês.
- **Contas antigas** anteriores à feature.

**Solução proposta (correção separada do retoque de design — agendar):**
1. No callback do OAuth (frontend), se ausente, `supabase.auth.updateUser({ data: { preferred_language: uiLang } })`.
2. Backfill dos existentes a partir de `profiles.preferred_language` (quando houver) para `user_metadata`.
3. (Belt-and-suspenders) o hook não recebe locale da requisição — a via real é (1).

## c) Preto do PNG do lockup (`/brand`)

`site/public/brand/philosify-logo-lockup.png` — **807×646, com alpha**, fundo **`#070708`** (RGB 7,7,8) em todas as
quinas **e** centro. **NÃO é `#000000`.**
→ O fundo único do e-mail tem que ser **`#070708`**. A "placa visível" atual = o PNG (`#070708`) sobre o card
`#0d0d0f`. **Nenhuma reexportação necessária** — basta alinhar o CSS a `#070708` e **eliminar o card `#0d0d0f`**.

---

## Heads-up para a ETAPA 2 (escopo real, p/ o diff)

**Ponto 1 — fundo único preto (`#070708`):** cirurgia nos 3 wrappers. Remover card `#0d0d0f`, bordas e caixas →
coluna única sobre `#070708`; declarar o preto em **todas** as camadas (`body`, `table`, `td`, atributo `bgcolor`)
p/ clientes em modo claro não forçarem branco. No `email.js` isso cobre os **18 automaticamente** (wrapper único).

**Ponto 2 — uma ação só:** é **trabalho de conteúdo** nos títulos. Hoje (EN, espelhado nos 18):
| tipo | título | botão | status |
|---|---|---|---|
| confirmSignup | "Welcome to Philosify! 🎵" | "Confirm Email" | ação 1×, mas **emoji** |
| magicLink | "Sign In to Philosify 🔑" | "Sign In Now" | **duplica** "Sign In" + emoji |
| resetPassword | "Reset Your Password 🔒" | "Reset Password" | **duplica** a frase + emoji |
| emailChange | "Confirm Email Change 📧" | "Confirm New Email" | overlap "Confirm" + emoji |
| invite | "You're Invited! 🎶" | "Accept Invitation" | ação 1×, mas **emoji** |

→ Alinhar à estrutura pedida (logo + **título curto** ≠ ação + **1 frase** de contexto + **ação única** + rodapé):
- **Remover os emojis** dos 5 títulos (v2 é sem emoji) — **5 tipos × 18 = 90 títulos**.
- **De-duplicar** título↔botão (magicLink, resetPassword, emailChange) nos 18.
- Isso toca as strings de tradução do `EMAIL_TRANSLATIONS` (método cirúrgico byte-estável).

**Recibo (security-alerts) e ads:** hoje são inglês — o retoque de fundo/ação se aplica ao template inglês deles;
**localizá-los aos 18 seria tarefa à parte** (traduzir recibo + ads) — confirmar se está no escopo agora ou depois.

## ‼️ Mensagem truncada
Teu ETAPA 2 ponto 2 **cortou** em: *"…rodapé discreto ('se você não pediu, ignore' ou"*. Preciso do **restante**
(texto exato do rodapé + eventuais pontos 3+) para fechar o diff da Etapa 2.

**Aguardando:** (1) o restante da spec da Etapa 2; (2) confirmar se recibo/ads entram na localização-18 agora ou depois;
(3) OK para eu montar o diff. **Nada editado até lá.**
