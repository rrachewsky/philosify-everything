# Privacy Policy v2 — Levantamento Factual do Código

**Data:** 2026-08-29
**Método:** leitura direta do código (api/, site/, migrations/). Nenhum arquivo editado.
**Regra:** cada afirmação cita arquivo:linha. Onde o código não responde, está marcado **[não determinável pelo código]** e listado ao final em "Pendente de confirmação do Bob".

> Escopo real do produto é bem maior do que o CLAUDE.md descreve: além de música, há Literatura, Cinema, Notícias, Quiz, Colóquio, Ágora (chat global), DMs, Collective, Underground, Zona Insegura, Constellation, push notifications, TTS e um sistema de anúncios (ads.philosify.org) com app próprio. A Privacy v2 precisa cobrir tudo isso.

---

## 1. ZONA INSEGURA — dados e retenção

### 1a. O que é gravado por sessão

- **Transcrição COMPLETA em texto claro.** A cada turno o handler regrava a conversa inteira (todas as mensagens do usuário + respostas da IA) na coluna JSONB `messages` — `api/src/handlers/unsafe-zone.js:451-460` (`fullConversation = [...messages, {role:'assistant', content: reply}]` → UPDATE).
- **Tabela:** `unsafe_zone_sessions` — `migrations/unsafe_zone_sessions.sql:12-20`: `id`, `user_id` (FK auth.users ON DELETE CASCADE), `messages` JSONB, `turn_count`, `status` ('active'|'completed'), `created_at`, `updated_at`. RLS por usuário (linhas 32-48). Sessão criada em `unsafe-zone.js:266-274`.
- Existe uma tabela antiga `unsafe_zone_conversations` (1 conversa por usuário — `migrations/unsafe_zone_conversations.sql:6-11`). O código atual **não a usa** (todas as queries do handler apontam para `unsafe_zone_sessions`); o DROP dela está comentado na migração nova (`unsafe_zone_sessions.sql:9`). **[não determinável]** se ela ainda existe em produção com dados antigos.
- **Criptografia:** NENHUMA criptografia client-side ou de aplicação para a Zona Insegura. O `useCrypto`/serviço E2E expõe cifra apenas para **DM, Collective e Underground** (`site/src/hooks/useCrypto.js:100-107`; `site/src/services/crypto.js`). Em repouso, só o que o Supabase fizer por padrão — nada adicional no nosso código.
- **No navegador:** o rascunho da mensagem não enviada fica em `sessionStorage` (`site/src/pages/v2/UnsafeZonePage.jsx:255,320,588`; restaurado em :133).
- A UI da Zona Insegura **não faz nenhuma promessa de privacidade/armazenamento** hoje — os textos de boas-vindas dizem só "not therapy, not advice" (`site/src/i18n/translations/en.json:2286-2304`). O painel de privacidade no ponto de uso será novidade.

### 1b. DELETE /api/unsafe-zone/conversation

- Rota: `api/index.js:3988-3990` → `handleUnsafeZoneClear`.
- É **DELETE físico** (PostgREST `.delete()`), **mas apaga SÓ a sessão com `status='active'`** — `api/src/handlers/unsafe-zone.js:673-675`.
- **Sessões encerradas ('completed') ficam para sempre**: o endpoint `/end` só muda o status (`unsafe-zone.js:644-649`), o `/history` lista até 50 sessões com preview de 100 chars (`unsafe-zone.js:553-569`) e `/session/:id` devolve a transcrição íntegra (`unsafe-zone.js:598-621`). **Não existe endpoint para apagar sessões passadas** (rotas completas: `api/index.js:3947-4003`).
- **O que sobra após o delete da ativa:** sessões antigas completed; `credit_reservations` confirmadas com `description = "unsafe-zone:start:<sessionId>"` (`unsafe-zone.js:446-447`); linhas de consumo em `credit_history`; logs do Worker com metadados — contagem de mensagens, idioma, presença de sessionId (`unsafe-zone.js:177`), flag de escalação de crise (`unsafe-zone.js:308`), tokens usados (`unsafe-zone.js:443`). **O conteúdo das mensagens NÃO é logado.**

### 1c. Retenção automática / expiração

- **NENHUMA.** O handler `scheduled()` (`api/index.js:4566-4712`) não tem nenhuma limpeza de `unsafe_zone_sessions`. Os únicos reapers são: reservas de crédito órfãs >10 min (`api/index.js:4602-4616`) e fila de push 24h/48h (`api/index.js:4644-4651`). Transcrições da Zona Insegura são retidas **indefinidamente**.

### 1d. O que o usuário vê / exporta

- **Vê:** conversa ativa (`GET /api/unsafe-zone/conversation`), lista de sessões com preview (`GET /history`), sessão completa por id (`GET /session/:id`) — `api/index.js:3984-4000`.
- **Exporta:** **NADA.** Não existe nenhuma função de exportação de dados (download/JSON/CSV) em nenhum lugar do produto — nem no AccountModal (`site/src/components/account/AccountModal.jsx` — sem download/export) nem na API. **Lacuna de produto** para a Privacy v2.

---

## 2. PROVEDORES DE IA

### 2a. Mapa provedor → módulo

Chaves configuradas (Secrets Store bindings): OpenAI, Gemini, Anthropic, Grok — `api/wrangler.toml:117-135`. **Não há ElevenLabs nem HeyGen** — TTS é Gemini (atual) e OpenAI (legado).

| Provedor | Módulos | Referências |
|---|---|---|
| **Anthropic** | **Zona Insegura** (exclusivo: `claude-sonnet-5`; crise → `claude-opus-4-8`); análise musical (modelo "claude"); History Graph; Painel de Filósofos | `unsafe-zone.js:305,355`; `ai/models/claude.js:35`; `handlers/history-graph.js:245`; `philosopher-panel.js:18` |
| **OpenAI** | Análise musical (gpt-5.5); TTS legado (`/api/tts-legacy`); ads: vetting de anunciante, moderação e geração de criativos (imagem/vídeo) | `ai/models/openai.js:16,55`; `handlers/tts.js:224`; `ads/vetting.js:46`; `ads/creatives.js:273,346,440` |
| **Google Gemini** | Análise musical; **TTS atual** (`/api/tts`); **tradução de mensagens de usuários** (`/api/translate`); tradução/TTS de notícias; Quiz; Colóquio; busca de filmes; manchetes; Constellation extractor | `ai/models/gemini.js:56`; `tts/gemini.js:1292,1899`; `handlers/translate.js:121`; `news-translate.js:53`; `news-tts.js:18`; `quiz.js:450`; `colloquium.js:3234`; `films/search.js:29`; `news/headlines.js:535`; `constellation-llm-extractor.js:125` |
| **Grok (xAI)** | Análise musical; Painel de Filósofos | `ai/models/grok.js:30`; `philosopher-panel.js:18` |

- **Zona Insegura → SÓ Anthropic.**
- **Underground → NENHUM provedor de IA** (posts usuário↔usuário; `handlers/underground.js` não faz chamadas de IA).
- **Atenção:** `/api/translate` traduz **mensagens de usuários** (chat/DM em texto claro) via Gemini — ou seja, conteúdo de comunidade VAI ao Google quando o usuário pede tradução (`handlers/translate.js:2-7`).

### 2b. O que é enviado a cada provedor

- **Zona Insegura (Anthropic):** system prompt (guia `guide-unsafe-zone` do KV) + as **últimas 60 mensagens** da conversa (janela — `unsafe-zone.js:331-335`). A chamada leva só `model`, `max_tokens`, `system`, `messages` (`unsafe-zone.js:355-366`) — **nenhum user_id, e-mail, IP ou metadado de identidade**.
- **Análises (todos):** prompt com título/artista/letra/guia (ex.: `philosopher-panel.js:33-41`; `ai/models/openai.js:55-66` — sem campo `user`). Verificado nos 4 clients: nenhum envia identificadores do usuário.
- **TTS:** o texto da análise (não conteúdo pessoal) — `handlers/tts.js:33-61`; áudio cacheado no R2 `philosify-tts` (`api/wrangler.toml:112-114`).
- **Tradução:** o texto da mensagem que o usuário pediu para traduzir, sanitizado contra prompt injection (`translate.js:46-64`), máx. 2000 chars (`translate.js:36`).

### 2c. Flags de opt-out de treino/retenção

- **NENHUMA flag/header/parâmetro de opt-out no código** (verificado nos 4 clients + unsafe-zone + TTS + translate). Vale a política padrão de API de cada provedor. **[não determinável pelo código — confirmar nos termos de cada provedor]** (OpenAI/Anthropic/Google/xAI declaram, em seus termos de API, não treinar com dados de API por padrão — mas isso é compromisso deles, não do nosso código).

---

## 3. ANALYTICS, COOKIES E TERCEIROS NO FRONT

### 3a. Scripts/beacons de terceiros

- **Nenhum** Google Analytics, Meta Pixel, Hotjar, PostHog, Clarity ou similar. O `site/index.html:1-77` carrega apenas Google Fonts e o bundle próprio.
- **Google Fonts** carregado de `fonts.googleapis.com`/`fonts.gstatic.com` (`site/index.html:52-70`) → Google recebe IP/user-agent dos visitantes.
- **Spotify embed:** preconnect + frame permitido (`site/index.html:54`; `site/public/_headers:49` frame-src `open.spotify.com`) → Spotify recebe IP/UA quando um player embed carrega numa análise.
- **Cloudflare Web Analytics:** o CSP permite `static.cloudflareinsights.com` e `cloudflareinsights.com` (`site/public/_headers:49`), mas **nenhum beacon existe no HTML**. Se estiver ativo, é auto-injeção via dashboard do Pages. **[não determinável pelo código — confirmar no dashboard]** (memória da sessão de cutover: "analytics beacon pending").
- **Sentry (front):** código completo com `browserTracingIntegration` + **Session Replay** (10% das sessões, 100% das com erro, `maskAllText: true`) — `site/src/utils/sentry.js:19-34`; `initSentry()` chamado em `site/src/main.jsx:14`. **PORÉM** o DSN vem de `VITE_SENTRY_DSN`, que **não existe** em `site/wrangler.toml:10-12` nem em `site/.env.production:1-4` → no build atual o SDK inicializa **sem DSN = desativado**. O `setUser(id, email)` existe (`sentry.js:93-99`) mas **nunca é chamado** (único import do módulo: `main.jsx:8`). O CSP ainda referencia `o22381.ingest.us.sentry.io` (`_headers:49`). **[confirmar: projeto Sentry ainda existe? DSN setado em alguma env do shell na hora do build?]**
- **Sentry (worker):** implementação custom (`api/src/utils/sentry.js:10-86`, enviaria erro+stack+URL+userId) que exige `env.SENTRY_DSN` — **não está** nos bindings/secrets (`api/wrangler.toml:117-248`) → **inativo**.
- **Stripe:** CSP permite `js.stripe.com`, mas o checkout é **redirect completo** para `checkout.stripe.com` (`site/src/services/stripe/checkout.js:52-59`) — nenhum dado de cartão passa pela nossa página.

### 3b. Cookies e storage

- **Cookies próprios (essenciais, únicos):**
  - `sb-auth` — sessão Supabase em cookie **HttpOnly, Secure, SameSite=Lax, Domain=.philosify.org, 7 dias** (`api/src/auth/cookies.js:7-16`). Auth não usa localStorage (`site/src/main.jsx:46`).
  - `pkce_id` — cookie curto (5 min de TTL do verifier no KV) durante o login Google (`api/src/auth/proxy.js:673-696`).
  - **Nenhum cookie de tracking próprio. Não existe cookie banner / gestão de consentimento** (nenhum componente em `site/src`).
- **localStorage:** `preferredLanguage` (`site/src/i18n/config.js:41,130`); tema (`site/src/utils/theme.js:9,23`); `pendingCreditAction` — ação pendente pré-Stripe, 30 min, pode conter título de música ou título/conteúdo de proposta de colóquio (`site/src/utils/pendingAction.js:8-28`); aceite das regras da Ágora (`site/src/components/chat/AgoraChat.jsx:51,61`); idioma de conteúdo compartilhado (`useSharedContentLanguage.js:32-43`).
- **sessionStorage:** rascunho da Zona Insegura (`UnsafeZonePage.jsx:255`); cache de notícias (`useNews.js:60`, `newsApi.js:67`); `pendingReferralSlug`/`sharedSongData` (`SharedAnalysis.jsx:270,304`); flag do auto-prompt de push (`useAutoSubscribePush.js:10,30`).
- **IndexedDB:** par de chaves E2E no banco `philosify-crypto` (`site/src/crypto/keys.js:9-12,54-83`); a chave privada **nunca sai do navegador** (`keys.js:5`). Migração antiga de localStorage é limpa em `main.jsx:36-43`.

### 3c. Push notifications

- **Web Push padrão (VAPID próprio, RFC 8292)** — sem Firebase SDK ou serviço de push terceirizado nosso (`api/src/push/vapid.js:1-10`). O endpoint da subscription aponta para o serviço de push do navegador do usuário (FCM/Mozilla/Apple — ex. `fcm.googleapis.com` em `vapid.js:107`).
- **Servidor armazena** em `push_subscriptions`: `user_id`, `endpoint`, chaves `p256dh`/`auth`, **`user_agent`**, `updated_at` (`api/src/handlers/push.js:99,118,362`).
- **Padrão "empty push + fetch":** o push enviado ao navegador é vazio (sinal); o conteúdo (título, corpo, nome do remetente) fica na tabela `push_queue` e é buscado pelo service worker (`site/public/sw.js:207-302`). `push_queue` é limpa: entregues >24h, não entregues >48h (`api/index.js:4644-4651`).
- **Auto-prompt:** pedido de permissão disparado automaticamente 2,5s após login, uma vez por sessão de navegador (`site/src/hooks/useAutoSubscribePush.js:9-40`); opt-out em Account → Notifications.

---

## 4. DADOS DE CONTA E PAGAMENTO

### 4a. profiles e adjacentes

- **profiles:** `user_id`, **`email`** (sincronizado de auth.users), `display_name`, `preferred_language`, **telefone opcional** (`phone_country_code`/`phone_area_code`/`phone_number`), timestamps — `api/src/handlers/profile.js:39-45` (select real em produção) + `migrations/schema_reference.sql:111-124`. Sem avatar, bio ou localização no perfil.
- **Telefone:** fornecido pelo usuário para o "Find Friends"; matching é server-side e números **nunca são retornados** na resposta (`api/src/handlers/contacts.js:4-8,155-160`). Os números importados do device são processados **transitoriamente** (só comparação; o handler não os grava — `contacts.js:75-162`). Limite 100/request contra enumeração (`contacts.js:61-66`).
- **auth.users (Supabase):** e-mail, hash de senha, `raw_user_meta_data` com `full_name` e `preferred_language` (lido em `contacts.js:124-127`); via Google, o que o Google mandar (ver 4c).
- **Dados pessoais espalhados por feature:** `quiz_profiles.nickname` + **leaderboard público top-100** (view `quiz_leaderboard` — `migrations/quiz_nicknames.sql:6-34`); nickname do Underground em `space_access`; `display_name` copiado em `chat_messages` (`handlers/chat.js:52`); e **`ads.user_profiles` com geolocalização derivada do IP: país, região, CIDADE, timezone** — atualizada a cada anúncio servido (`ads/targeting.js:395-419`; disparo em `ads/serve.js:398-402`).
- **Histórico comportamental:** `user_analysis_requests` liga usuário→análises pedidas (`handlers/analysis-history.js:37-41`); `credit_history` registra cada consumo com `song_analyzed`/`model_used` (`schema_reference.sql:180-181`) — retenção indefinida.

### 4b. Pagamento — nosso banco vs. Stripe

- **Cartão NUNCA toca nosso servidor: correto.** Checkout é sessão hospedada no Stripe com redirect validado para `https://checkout.stripe.com/` (`site/src/services/stripe/checkout.js:52-59`); a sessão é criada server-side (`api/src/payments/stripe.js:148-155`).
- **O que ENVIAMOS ao Stripe:** `user_id` (client_reference_id + metadata — `stripe.js:128-129,132`) e **e-mail** na primeira compra (`stripe.js:140`).
- **O que FICA no nosso banco:** `stripe_customers` (user_id ↔ stripe_customer_id, service_role only); `credit_history` com `stripe_session_id`, `stripe_price_id` (`schema_reference.sql:176-177`) e metadata com `tier`, `stripe_customer_id`, **`receipt_url`** (`api/index.js:2233-2244`); tabela `webhooks` de log (`schema_reference.sql:226-251`). Nada de número de cartão, endereço ou nome de cobrança.
- Preços localizados usam taxa de câmbio de `open.er-api.com` (`api/src/payments/localized-pricing.js:60`) — sem dados pessoais na chamada.

### 4c. Login com Google

- Fluxo PKCE via Supabase Auth: `POST /auth/google` monta a URL `{supabase}/auth/v1/authorize?provider=google` (`api/src/auth/proxy.js:666-700`); callback troca o code server-side (`proxy.js:709-744`). Tokens ficam no cookie HttpOnly.
- **Scopes não são definidos no código** → valem os padrões do Supabase/Google (openid, email, profile ⇒ recebemos e-mail, nome e avatar_url em `user_metadata`). **[não determinável pelo código — confirmar scopes exatos no dashboard do Supabase]**

---

## 5. COMUNIDADE E COMPARTILHAMENTO

### 5a. DMs

- **E2E real, mas opcional/best-effort.** X25519 via libsodium (`crypto_box`): chave privada em IndexedDB (nunca sai do navegador — `site/src/crypto/keys.js:4-5`), pública registrada em `user_public_keys` (`api/src/handlers/crypto.js:64-131`).
- **Quando cifrado:** o servidor grava `encrypted_content` + `nonce`, e a coluna `message` recebe o literal `"[Encrypted]"` (`api/src/handlers/dm.js:637-647`). Preview da conversa idem (`dm.js:658-659`). **O servidor não consegue ler o conteúdo.**
- **Fallback em texto claro:** se o remetente não tem keypair ou o destinatário não tem chave pública, a mensagem **vai e fica em plaintext** na coluna `message` (`site/src/services/crypto.js:150-166` retorna null → envio sem cifra; `dm.js:617-624` valida como plaintext). **O servidor consegue ler essas.**
- **Grupos de DM:** chave de grupo cifrada individualmente para cada membro (`services/crypto.js:359-430`; endpoints `/api/dm/conversations/:id/key` — `api/index.js:1699-1707`).
- **O servidor sempre vê os metadados:** quem fala com quem, quando, reações (`dm.js:1549-1575`), read receipts.
- **Apagar mensagem:** DELETE físico com verificação pós-delete (`dm.js:1104-1117`), só o autor (`dm.js:1093-1095`).

### 5b. Análises compartilhadas /a/:slug

- Rota SPA `/a/:slug` (`site/src/Router.jsx:153`). Slug aleatório criptograficamente seguro de 8 chars (`api/src/sharing/index.js:14-23`).
- **O que expõe do autor do share: NADA no payload** — a resposta é a análise + dados da obra/artista (`sharing/index.js:163-181`); não há nome/ID de quem compartilhou.
- **Internamente** o `share_tokens` guarda o `user_id` de quem compartilhou para o programa de referral (quem se cadastra pelo link rende 2 créditos a cada lado — `trackReferral`, `sharing/index.js:197-249`). Ou seja: vínculo compartilhador↔novo usuário fica registrado no banco.
- Ver a análise completa exige login (`api/index.js:2690-2697`); bots sociais recebem só o card Open Graph (`api/index.js:2676-2689`).

### 5c. Underground / Ágora / demais espaços

- **Underground:** restrito — desbloqueio pago via `space_access` (`api/src/handlers/spaces.js:64-139`). Posts são **pseudonímicos para os outros usuários** (exibem `nickname`), mas a linha grava **`user_id`** (`api/src/handlers/underground.js:317-325`) — o operador consegue vincular. E2E existe no esquema (`encrypted_content`/`nonce`; chave de sala em `space_access.encrypted_room_key` — `underground.js:54,176`), **mas nenhum código escreve `encrypted_room_key`** (única escrita não existe; greps em api+site só mostram leitura) → na prática o fallback plaintext (`underground.js:320`) tende a valer. **[confirmar em produção se alguma linha tem `encrypted_room_key` preenchida]**
- **Ágora (chat global):** visível a qualquer usuário logado; grava `user_id` + `display_name` + mensagem **em claro** (`api/src/handlers/chat.js:49-55`); autor pode editar/apagar (rotas `api/index.js:1071`; delete físico).
- **Colóquio (propostas de usuários):** título/pergunta do usuário ficam públicos no espaço, exibidos com o **display_name do proponente** buscado de profiles (`api/src/handlers/colloquium-user.js:434-444`).
- **Collective:** grupos com E2E de chave de grupo (mesmo modelo dos DMs — `api/src/handlers/crypto.js:194-329`), com o mesmo fallback plaintext.
- **Quiz:** leaderboard **público** top-100 com nickname + pontuações (`migrations/quiz_nicknames.sql:21-34`).

---

## 6. LOGS E OBSERVABILIDADE

### 6a. console.log do worker

- **Conteúdo de conversas/análises NÃO é logado** (varredura em handlers: logs são `err.message`, contagens, IDs). Zona Insegura loga apenas metadados (`unsafe-zone.js:177,308,443`).
- **O que É logado com dados pessoais:**
  - `user_id` em muitos handlers ([Credits], [Spaces] `spaces.js:194`, [Crypto] `crypto.js:106,124`, [DM] `dm.js:1563,1575`, [Sharing] `sharing/index.js:95`, etc.).
  - **Fragmento do cookie de sessão (50 chars) em [Profile]** — `api/src/handlers/profile.js:24-27`. É pedaço de credencial em log; recomendo remover (fora do escopo desta tarefa).
  - **security-log estruturado com IP, user-agent (120 chars), país e cf-ray** — `api/src/utils/security-log.js:26-31,49` (eventos: auth_failure, rate_limited, etc.).
  - Chave de rate-limit (contém IP) quando o limite dispara — `api/src/rate-limit/check.js:23`.
  - [Stripe] loga `receipt_url` e customer id (`api/index.js:2159`; `payments/stripe.js:137-142`).
- **Persistência:** wrangler.toml **não tem** bloco `[observability]` → se Workers Logs está ativo (e por quanto tempo retém), é configuração de dashboard. **[não determinável pelo código — confirmar no dashboard Cloudflare]**

### 6b. IPs

- **Uso:** chave de rate-limit em dezenas de endpoints (`cf-connecting-ip` — ex.: `api/index.js:448`, `dm.js:214`, `contacts.js:42`; lista completa tem ~60 pontos).
- **Armazenamento em banco:**
  - **`ads.ad_impressions` grava o IP BRUTO por impressão de anúncio, junto com `user_id`** — `api/src/handlers/ads/serve.js:659-668` (`ip_address: ip`, `user_id`). Usado para frequency cap diário por IP (`serve.js:305-307`) e verificação de fraude de clique (`serve.js:819-820`). **Sem limpeza automática** (nada no scheduled). Este é o único lugar do código que persiste IP bruto.
  - **Geolocalização derivada do IP** (país/região/**cidade**/timezone via headers da Cloudflare) gravada por usuário em `ads.user_profiles` para targeting — `api/src/handlers/ads/targeting.js:395-419`.
- Logs: IP aparece nos security events e rate-limit logs (ver 6a).

---

## 7. EXCLUSÃO DE CONTA

### 7a. Fluxo existente

- **No produto principal: NÃO existe.** Nenhuma rota de API, nenhum item de UI (varredura por `deleteAccount`/`delete-account`/`account/delete` em todo o repo).
- O que existe é só no **app de anunciantes** (`ads/src/pages/Settings.jsx:104`; `api/src/handlers/ads/account.js:125`; rota `api/index.js:4091`) — escopo ads, não usuários do site.

### 7b. O que uma exclusão manual (auth.users) apagaria

- **ON DELETE CASCADE confirmado no código para:** `profiles` (`schema_reference.sql:112`), `credits` (:136), `credit_history` (:161), `webhooks` (:234), `email_queue` (:265), `unsafe_zone_sessions` (`unsafe_zone_sessions.sql:14`), `unsafe_zone_conversations` (`unsafe_zone_conversations.sql:7`), `quiz_profiles` (`quiz_nicknames.sql:7`).
- **[não determinável pelo código]** — FKs de `chat_messages`, `direct_messages`, `underground_posts`, `space_access`, `push_subscriptions`, `user_public_keys`, `user_analysis_requests`, `share_tokens`, `ads.user_profiles`, `ads.ad_impressions`: as migrações dessas tabelas não estão no repo (criadas via dashboard). Conferir no SQL Editor o comportamento (CASCADE vs. órfãos).
- **Fica em terceiros de qualquer forma:** customer/faturas no Stripe; e-mails enviados via Resend; conteúdo já enviado a provedores de IA (sujeito à retenção deles).
- **Registro da lacuna:** até existir fluxo, a Privacy v2 promete exclusão mediante pedido a **bob@philosify.org** (e-mail confirmado como roteado pelo Cloudflare Email — `api/wrangler.toml:70-72`).

---

## Terceiros completos (mapa de destinos que recebem dados)

| Terceiro | O que recebe | Referência |
|---|---|---|
| Supabase | Todo o banco + auth + realtime (processador principal) | `api/wrangler.toml:147-160` |
| Cloudflare | Hospedagem (Workers/Pages/KV/R2), e-mail routing, rate-limit; possivelmente Web Analytics | `api/wrangler.toml`; `_headers:49` |
| Anthropic / OpenAI / Google / xAI | Conteúdo dos prompts (ver §2) | §2 |
| Stripe | user_id, e-mail (1ª compra), pagamento em página deles | `payments/stripe.js:128-142` |
| **Resend** | E-mails transacionais de AUTH (confirmação, reset — hook do Supabase) + alertas + e-mails do ads → recebe **endereços de e-mail dos usuários** | `api/src/auth/email.js:1084`; `utils/security-alerts.js:79`; `ads/emails.js:37` |
| Spotify | Queries de busca de música do usuário; embeds no front | `spotify/search.js:61`; `index.html:54` |
| Genius | Título/artista buscados (letras) | `lyrics/genius.js:77,109` |
| Google Books / NYT / Open Library | Queries de busca de livros | `books/search.js:29`; `books-top.js:46,104,152` |
| TMDB | Queries de busca de filmes | `films/search.js:56` |
| NewsAPI.ai (Event Registry) | Queries de busca de notícias | `news/headlines.js:37` |
| Google Fonts | IP/UA de todo visitante | `index.html:59-70` |
| Serviços de push do navegador (FCM/Mozilla/Apple) | Push vazio (sinal) para o endpoint do usuário | `push/vapid.js:107`; `sw.js:209-210` |
| open.er-api.com | Nada pessoal (cotação USD) | `payments/localized-pricing.js:60` |
| Sentry | Hoje: nada (sem DSN). Se reativado: erros, stack, replay de sessão | §3a |

---

## FATOS CONFIRMADOS PELO CÓDIGO (resumo para redação)

1. Zona Insegura: transcrição completa em texto claro no Supabase (`unsafe_zone_sessions.messages`), sem criptografia adicional, enviada só à Anthropic (janela de 60 msgs, sem identificadores), retida indefinidamente; delete apaga fisicamente só a sessão ativa; sessões encerradas não têm como ser apagadas pelo usuário; sem export.
2. Nenhum provedor de IA recebe user_id/e-mail/IP; nenhuma flag de opt-out de treino no código.
3. `/api/translate` envia mensagens de usuários ao Google (Gemini) quando o usuário pede tradução.
4. Front sem analytics/pixel próprios; Sentry presente no código mas desativado por falta de DSN no build atual; sem cookie banner; únicos cookies são essenciais (sb-auth HttpOnly 7d + pkce_id).
5. E2E real (libsodium, chave privada em IndexedDB) para DM/Collective/Underground — com fallback silencioso para texto claro; Zona Insegura fora do E2E.
6. profiles = e-mail, nome, idioma, telefone opcional; contatos importados para matching não são gravados.
7. Stripe: cartão nunca toca nosso servidor; guardamos session/price/customer ids + receipt_url.
8. Push: VAPID próprio; servidor guarda endpoint+chaves+user_agent; conteúdo em push_queue com limpeza 24/48h; prompt automático pós-login.
9. **Ads: IP bruto gravado por impressão (`ads.ad_impressions.ip_address` + user_id, sem expiração) e geolocalização por usuário (país/região/cidade/timezone) em `ads.user_profiles`.**
10. Logs do worker: sem conteúdo de conversas; com user_ids, IPs/UA/país em security events, e um fragmento de cookie de sessão no [Profile] (a corrigir).
11. Sem fluxo de exclusão de conta no produto principal (só no app de anunciantes); sem export de dados; CASCADE confirmado nas tabelas núcleo.
12. Compartilhamento /a/:slug não expõe o autor; referral vincula compartilhador↔novo usuário internamente.
13. Quiz tem leaderboard público (nickname + score); Colóquio user-proposed exibe display_name do proponente; Underground é pseudonímico para usuários mas vinculável pelo operador.
14. Nenhuma retenção/expiração automática de conteúdo de usuário (exceto push_queue e reservas órfãs).

## PENDENTE DE CONFIRMAÇÃO DO BOB (fora do alcance do código)

1. **Cloudflare Web Analytics**: está ativado no dashboard do Pages (auto-injeção do beacon)? (CSP já permite; memória de 30/07 diz "beacon pending".)
2. **Workers Logs / observability**: logs persistentes estão habilitados no dashboard? Qual retenção do plano?
3. **Sentry**: o projeto `o22381` ainda existe/recebe algo? Há `VITE_SENTRY_DSN` em variável de ambiente da máquina de build? Decisão: reativar (e declarar na policy, incluindo Session Replay) ou remover código+CSP.
4. **Supabase**: criptografia em repouso/backups (padrão do plano) e **retenção de backups** — a policy deve dizer que dados apagados podem persistir em backups por X dias.
5. **Google OAuth**: scopes exatos configurados no dashboard do Supabase (presumido openid/email/profile).
6. **Retenção dos provedores de IA**: confirmar termos vigentes de OpenAI, Anthropic, Google (Gemini API) e xAI sobre retenção/treino de dados de API (o código não seta nada).
7. **Stripe/Resend como processadores**: DPAs aceitos? (para a seção de "service providers" da policy).
8. **`unsafe_zone_conversations` (tabela antiga)**: ainda existe em produção com dados? Se sim, decidir apagar.
9. **`space_access.encrypted_room_key`**: alguma linha preenchida em produção? (Define se o Underground é de fato E2E ou plaintext na prática.)
10. **FKs das tabelas de comunidade** (chat, DMs, underground, push_subscriptions, user_public_keys, user_analysis_requests, share_tokens, ads.*): conferir ON DELETE no banco real — necessário para prometer exclusão completa.
11. **`ads.ad_impressions.ip_address`**: definir retenção (hoje é para sempre) — a policy precisa declarar prazo, e idealmente criar um reaper.
12. **E-mail de contato de privacidade**: confirmar bob@philosify.org como canal oficial de direitos do titular (LGPD/GDPR-style requests).
