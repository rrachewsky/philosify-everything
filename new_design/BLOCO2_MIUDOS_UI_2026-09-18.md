# BLOCO 2 — miúdos de UI · diffs a–f para OK do Bob · 18/09/2026

**Estado:** diff único gerado sobre `f6e4314`, salvo em `new_design/BLOCO2_MIUDOS_UI_2026-09-18.patch` (31 arquivos,
+195 −33; `git apply --check` limpo). Aplicado só para validar: **suíte da API verde (9/9)** e **build do site ok**;
depois **working tree revertido — nada aplicado, nada commitado, nada deployado.** Após o OK: `git apply` do patch →
um build → um deploy do site + `wrangler deploy --env production` do worker (itens a e d tocam `api/`).

## a) Bandeira de report no próprio post (Underground)

**Causa (arquivo:linha).** `api/src/handlers/underground.js:112-118` — o GET do feed seleciona
`id, nickname, content, …` **sem `user_id`** (comentário original: "show nickname, not user_id" — pseudonimato do
MODO A) e o mapa de resposta (`:190-206`) não devolve nenhum identificador do autor. O cliente,
`site/src/components/underground/UndergroundFeed.jsx:616-617`, compara `postUserId === userId` com
`post.userId || post.user_id` — **sempre `undefined`** para posts vindos do GET → `isOwn` sempre falso → a bandeira
aparece no próprio post (e o botão de apagar não). Só os posts que chegam por realtime (`new-post`, payload com
`user_id` snake_case) acertavam.

**Fix.** Servidor: seleciona `user_id` só para calcular **`isOwn: p.user_id === userId`** e devolve o booleano — nenhum
id de usuário sai do worker (pseudonimato preservado). Cliente: `isOwn = post.isOwn === true || (user_id do realtime
=== userId) || (post.nickname === myNickname)` — o apelido é o último recurso (um apelido por usuário na sala), como
o Bob sugeriu.

## b) Saldo do header sem F5

**Diagnóstico ao vivo (Chrome do Bob, `/music`, logado):** disparei `credits-changed` manualmente — o `useCredits`
refez **1** chamada a `/api/balance` e o header seguiu o servidor (9). O mecanismo (evento → `fetchBalance(true)`)
**funciona**, e a resposta já sai com `Cache-Control: no-store` (worker `ada20c36`, conferido por `curl -I`). Reserva e
confirmação de crédito são síncronas antes da resposta (`unsafe-zone.js:252/139`, `quiz.js:688/711`), então o refetch
lê o saldo já debitado.

**Fluxos conferidos:** análises (música/literatura: `setBalance` da resposta + evento; cinema, notícias: evento),
painel (`MusicPage.jsx:449` evento), quiz (`QuizPage.jsx:220/276/354`), Zona Insegura (`UnsafeZonePage.jsx:362`),
colóquio (`useColloquium.js:250/280/…`) — todos avisam. **Debates** (`useDebate.js`) não avisam, mas `forum.js` não
reserva crédito em nenhum handler (criar/responder/wrap-up são gratuitos) — nada a fazer.
**O único fluxo pago sem aviso: unlock de espaço** — `site/src/components/community/SpaceLock.jsx:50-52` faz o
POST `/api/spaces/:space/unlock` e só chama `onUnlocked` → header velho até F5. **É o caso reproduzível.**

**Fix (três pontos).**
1. `useCredits.js` — o listener de `credits-changed` passa a aceitar `detail.balance`: se o despachante já tem o
   saldo devolvido pelo endpoint, aplica direto (sem round trip); senão refetch forçado (comportamento atual).
2. `SpaceLock.jsx` — despacha `credits-changed` no sucesso do unlock (com `data.balance` se a API mandar; `spaces.js`
   hoje não manda → refetch).
3. `useColloquium.js` — access e participate passam `data.balance` (o endpoint devolve `{total, credits,
   freeRemaining}`, `colloquium-user.js:646`).

Notícias devolve `balance` como número (`newTotal`), não objeto → continua no refetch; sem mudança.

## c) Validação do apelido sem balão nativo

`UndergroundFeed.jsx:105-117`: `<input minLength={3} pattern="[a-zA-Z0-9]+">` → balão do navegador. Fix: `<form
noValidate>`, atributos `minLength`/`pattern` removidos (`maxLength` fica), regra `NICKNAME_RE = /^[A-Za-z0-9]{3,12}$/`
(idêntica à `NICKNAME_REGEX` da API, `underground.js:36`) checada no submit, erro próprio em
`.underground-nickname-setup__error` (mesma classe do erro da API), limpo ao digitar. Chave nova
**`community.underground.nicknameInvalid`** nas 18 línguas, logo após `nicknameHint`, com a terminologia do próprio
`nicknameHint` de cada língua + a faixa 3–12:

| | | | |
|---|---|---|---|
| en Letters and numbers only, 3 to 12 characters | pt Apenas letras e números, de 3 a 12 caracteres | es Solo letras y números, de 3 a 12 caracteres | fr Lettres et chiffres uniquement, de 3 à 12 caractères |
| de Nur Buchstaben und Zahlen, 3 bis 12 Zeichen | it Solo lettere e numeri, da 3 a 12 caratteri | nl Alleen letters en cijfers, 3 tot 12 tekens | pl Tylko litery i cyfry, od 3 do 12 znaków |
| hu Csak betűk és számok, 3–12 karakter | tr Sadece harf ve rakamlar, 3 ile 12 karakter arası | ru Только буквы и цифры, от 3 до 12 символов | zh 仅限字母和数字，3 到 12 个字符 |
| ja 英数字のみ、3〜12文字 | ko 영문자와 숫자만, 3~12자 | hi केवल अक्षर और संख्याएं, 3 से 12 वर्ण | ar أحرف وأرقام فقط، من 3 إلى 12 حرفاً |
| he אותיות ומספרים בלבד, 3 עד 12 תווים | fa فقط حروف و اعداد، 3 تا 12 نویسه | | |

Comentário desatualizado do serviço ("3-20 chars, underscore/hyphen") corrigido.

## d) Testes `api/src/utils/i18n-errors.test.js`

- **Duplicata EN**: `UNDERGROUND_ENCRYPTED_CONTENT_TOO_LARGE` (usada em `underground.js:331/743`) e
  `ENCRYPTED_CONTENT_TOO_LARGE` (usada em `collective-comments.js:178`) — mesmo texto, handlers distintos, intencional.
  Documentado no teste com `INTENTIONAL_EN_DUPLICATES` (allow-list nomeada, não um skip cego).
- **Comprimento mínimo**: falhava em `FORBIDDEN.zh = "禁止"` (2 caracteres). O piso de 3 vale para alfabetos;
  ideogramas dizem o mesmo em 2. `MIN_LENGTH = { zh: 2, ja: 2, ko: 2 }`, demais 3 (o `> 2` original).
- Resultado com o patch: **9/9 verdes**.

## e) Autofill nos campos de auth (opcional — 9 linhas)

`site/src/styles/v2-pages/auth.css`: `.v2 .pg-auth input.f:-webkit-autofill{…}` com
`-webkit-box-shadow: 0 0 0 1000px var(--inset) inset` + `-webkit-text-fill-color: var(--ink)` + transição longa —
o mesmo truque já usado em `account.css:46-51`. Cobre sign-in e sign-up (ambos `input.f` sob `.pg-auth`).

## f) Markdown cru nos vereditos de IDEIAS (e painel)

**Por que não passavam pelo pipeline.** As análises normais recebem JSON com campos de texto e um pouco de HTML
(`<hl>`), sanitizado com `DOMPurify(…, {ADD_TAGS:['hl']})`. O veredito do colóquio e o wrap-up do debate são
gerados com a instrução *"Write naturally with markdown formatting"* (`colloquium.js:5827`, `forum.js:1102`) e
renderizados como **texto puro**: `ColloquiumDetail.jsx:323` e `DebateDetail.jsx:130` — `<div className="prose
vprose">{texto}</div>` com `white-space:pre-wrap` (`ideas.css:31`). Daí "# Veredito Filosófico" e "## Seção 1"
visíveis. O painel (`philosopher-panel-template.js:292`, também markdown) tem parser próprio,
`PanelAnalysisCards.jsx:14-95`: quebra em cards por `##`, mas o `renderBody` só converte `**`/`*` e parágrafos —
`###`, listas `- ` e `1.` dentro do corpo ficam crus (o que aparece no mobile, onde o corpo é mais longo por linha).

**Fix — um renderer, um sanitizer.** Novo `site/src/utils/markdownLite.js`: `renderMarkdownLite(text)` converte
`#`/`##` (→ h3) e `###+` (→ h4), `**`, `*`, listas `-`/`*`/`1.`, parágrafos e quebras, escapa `<`/`>` vindos do
modelo e sanitiza com **`DOMPurify.sanitize(…, {ADD_TAGS:['hl']})`** — a mesma configuração das análises. O
`# Título` inicial é descartado (a superfície já rotula "VEREDITO PHILOSIFY"; o painel passa `dropTitle:false`
porque ele mesmo separa os títulos). Consumidores: `PanelAnalysisCards.renderBody` → `renderMarkdownLite`;
`ColloquiumDetail` e `DebateDetail` → `dangerouslySetInnerHTML` com o HTML sanitizado. CSS: `.vprose` sai do
`pre-wrap` e ganha margens de `p`/`h3`/`h4`/`ul` (`ideas.css`). Sem mudança na API e sem retradução (o texto é o
mesmo; só a renderização).

Nota: `music-sidebar.css:1209-1236` estiliza `p/strong/em` do corpo do painel; `h4`/`ul` herdam o padrão — se
ficarem feios na captura de aceite, são 2 regras a mais (não incluídas para não alargar o lote).
Não localizei o registro escrito do achado de 20/08 sobre o painel em mobile (busca em `new_design/*2026-08-2*`);
a correção acima cobre a causa provável (marcação dentro dos corpos dos cards).

## Depois do OK

`git apply new_design/BLOCO2_MIUDOS_UI_2026-09-18.patch` → `cd api && npm test` → `cd site && npm run build` →
deploy site `--branch=production` + `cd api && wrangler deploy --env production` → capturas: Underground (próprio
post sem bandeira; apelido inválido com a mensagem própria), header após unlock de espaço, veredito de colóquio
renderizado, sign-in com autofill → aceite → commit único (mensagem a definir pelo Bob) com relatório e capturas.

## Patch completo

```diff
diff --git a/api/src/handlers/underground.js b/api/src/handlers/underground.js
index d37b793..c3e92d7 100644
--- a/api/src/handlers/underground.js
+++ b/api/src/handlers/underground.js
@@ -109,11 +109,12 @@ export async function handleGetUndergroundPosts(request, env, origin) {
       return addRefreshedCookieToResponse(response, setCookieHeader);
     }
 
-    // Fetch posts (show nickname, not user_id)
+    // Fetch posts (show nickname, not user_id — user_id is read only to
+    // compute isOwn server-side; it never leaves the worker)
     let query = supabase
       .from("underground_posts")
       .select(
-        "id, nickname, content, encrypted_content, nonce, is_encrypted, created_at, edited_at, reply_to_id, reaction_fire, reaction_think, reaction_heart, reaction_skull",
+        "id, user_id, nickname, content, encrypted_content, nonce, is_encrypted, created_at, edited_at, reply_to_id, reaction_fire, reaction_think, reaction_heart, reaction_skull",
       )
       .order("created_at", { ascending: false })
       .limit(PAGE_SIZE);
@@ -189,6 +190,8 @@ export async function handleGetUndergroundPosts(request, env, origin) {
     const postsWithReactions = (posts || []).map((p) => ({
       id: p.id,
       nickname: p.nickname,
+      // Own-post flag computed here (pseudonymous feed: no user ids in the payload)
+      isOwn: !!p.user_id && p.user_id === userId,
       content: p.is_encrypted ? null : p.content,
       encryptedContent: p.is_encrypted ? p.encrypted_content : null,
       nonce: p.is_encrypted ? p.nonce : null,
diff --git a/api/src/utils/i18n-errors.test.js b/api/src/utils/i18n-errors.test.js
index e83d384..e4b701a 100644
--- a/api/src/utils/i18n-errors.test.js
+++ b/api/src/utils/i18n-errors.test.js
@@ -62,11 +62,17 @@ describe('i18n Error Messages', () => {
     expect(getLocalizedError('ANALYSIS_FAILED', 'es')).toBe('Análisis falló');
   });
 
+  // Intentional EN duplicates: the Underground and the Collective comments
+  // raise the same condition from different handlers, each under its own
+  // namespaced key so the code paths stay independent.
+  const INTENTIONAL_EN_DUPLICATES = new Set(['UNDERGROUND_ENCRYPTED_CONTENT_TOO_LARGE']);
+
   it('should have no duplicate English values across error keys', () => {
     const englishMessages = new Set();
     const duplicates = [];
 
     for (const [key, messages] of Object.entries(ERROR_MESSAGES_I18N)) {
+      if (INTENTIONAL_EN_DUPLICATES.has(key)) continue;
       const englishMsg = messages.en;
       if (englishMessages.has(englishMsg)) {
         duplicates.push({ key, message: englishMsg });
@@ -92,10 +98,13 @@ describe('i18n Error Messages', () => {
   });
 
   it('should not be empty or just whitespace', () => {
+    // Ideographic scripts say it in two characters (zh FORBIDDEN = "禁止");
+    // the 3-character floor only makes sense for alphabetic languages.
+    const MIN_LENGTH = { zh: 2, ja: 2, ko: 2 };
     for (const [errorKey, messages] of Object.entries(ERROR_MESSAGES_I18N)) {
       for (const [lang, message] of Object.entries(messages)) {
         expect(message.trim()).toBeTruthy();
-        expect(message.length).toBeGreaterThan(2);
+        expect(message.length).toBeGreaterThanOrEqual(MIN_LENGTH[lang] ?? 3);
       }
     }
   });
diff --git a/site/src/components/community/SpaceLock.jsx b/site/src/components/community/SpaceLock.jsx
index 248a956..a101da5 100644
--- a/site/src/components/community/SpaceLock.jsx
+++ b/site/src/components/community/SpaceLock.jsx
@@ -48,6 +48,11 @@ export function SpaceLock({ space, onUnlocked }) {
         throw new Error(data.error || 'Failed to unlock space');
       }
 
+      // Header balance: notify the credits system (uses the returned balance
+      // when the API sends one, otherwise it refetches)
+      const data = await response.json().catch(() => ({}));
+      window.dispatchEvent(new CustomEvent('credits-changed', { detail: { balance: data.balance } }));
+
       // Notify parent to refresh access
       onUnlocked?.(space);
     } catch (err) {
diff --git a/site/src/components/results/PanelAnalysisCards.jsx b/site/src/components/results/PanelAnalysisCards.jsx
index d49fd29..a31b55c 100644
--- a/site/src/components/results/PanelAnalysisCards.jsx
+++ b/site/src/components/results/PanelAnalysisCards.jsx
@@ -1,4 +1,4 @@
-import DOMPurify from 'dompurify';
+import { renderMarkdownLite } from '../../utils/markdownLite.js';
 
 /**
  * Parse philosopher panel markdown into structured sections and render as cards.
@@ -83,18 +83,10 @@ function parsePanelSections(markdown) {
   return sections;
 }
 
+// Section bodies go through the shared markdown path (sub-headings, lists,
+// bold/italic), sanitized like every other analysis surface.
 function renderBody(text) {
-  if (!text) return '';
-  return DOMPurify.sanitize(
-    text
-      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
-      .replace(/\*(.*?)\*/g, '<em>$1</em>')
-      .replace(/\n\n/g, '</p><p>')
-      .replace(/\n/g, '<br/>')
-      .replace(/^/, '<p>')
-      .replace(/$/, '</p>'),
-    { ADD_TAGS: ['hl'] }
-  );
+  return renderMarkdownLite(text, { dropTitle: false });
 }
 
 export default function PanelAnalysisCards({ analysis }) {
diff --git a/site/src/components/underground/UndergroundFeed.jsx b/site/src/components/underground/UndergroundFeed.jsx
index cf251a0..0fa4709 100644
--- a/site/src/components/underground/UndergroundFeed.jsx
+++ b/site/src/components/underground/UndergroundFeed.jsx
@@ -84,13 +84,23 @@ const Icons = {
   ),
 };
 
+// Same rule as the API (NICKNAME_REGEX): letters and digits, 3–12, no underscore
+const NICKNAME_RE = /^[A-Za-z0-9]{3,12}$/;
+
 function NicknameSetup({ onSubmit, loading, error, t }) {
   const [nickname, setNickname] = useState('');
+  const [localError, setLocalError] = useState(null);
 
   const handleSubmit = (e) => {
     e.preventDefault();
+    if (loading) return;
     const trimmed = nickname.trim();
-    if (!trimmed || loading) return;
+    // Own v2 message instead of the browser's native validation balloon
+    if (!NICKNAME_RE.test(trimmed)) {
+      setLocalError(t('community.underground.nicknameInvalid'));
+      return;
+    }
+    setLocalError(null);
     onSubmit(trimmed);
   };
 
@@ -100,23 +110,26 @@ function NicknameSetup({ onSubmit, loading, error, t }) {
         <h3>{t('community.underground.chooseIdentity')}</h3>
         <p>{t('community.underground.chooseIdentityDesc')}</p>
       </div>
-      <form onSubmit={handleSubmit}>
+      <form onSubmit={handleSubmit} noValidate>
         <input
           type="text"
           className="underground-nickname-setup__input"
           value={nickname}
-          onChange={(e) => setNickname(e.target.value.slice(0, 12))}
+          onChange={(e) => {
+            setNickname(e.target.value.slice(0, 12));
+            if (localError) setLocalError(null);
+          }}
           placeholder={t('community.underground.nicknamePlaceholder')}
-          minLength={3}
           maxLength={12}
-          pattern="[a-zA-Z0-9]+"
           disabled={loading}
           autoFocus
         />
         <div className="underground-nickname-setup__hint">
           {t('community.underground.nicknameHint')}
         </div>
-        {error && <div className="underground-nickname-setup__error">{error}</div>}
+        {(localError || error) && (
+          <div className="underground-nickname-setup__error">{localError || error}</div>
+        )}
         <button
           type="submit"
           className="underground-nickname-setup__submit"
@@ -612,9 +625,14 @@ export function UndergroundFeed() {
         )}
 
         {posts.map((post) => {
-          // Own post detection: supports both camelCase (API) and snake_case (realtime)
+          // Own post detection: the GET feed is pseudonymous (no user ids), so the
+          // API sends isOwn; realtime payloads carry snake_case user_id; nickname
+          // is the last resort (one nickname per user in the room).
           const postUserId = post.userId || post.user_id;
-          const isOwn = postUserId === userId;
+          const isOwn =
+            post.isOwn === true ||
+            (!!postUserId && postUserId === userId) ||
+            (!!myNickname && post.nickname === myNickname);
           return (
             <UndergroundPost
               key={post.id}
diff --git a/site/src/hooks/useColloquium.js b/site/src/hooks/useColloquium.js
index 3eab8e1..7ed8b72 100644
--- a/site/src/hooks/useColloquium.js
+++ b/site/src/hooks/useColloquium.js
@@ -246,8 +246,8 @@ export function useColloquium() {
       try {
         const data = await colloquiumService.accessColloquium(threadId);
         if (data.success) {
-          // Notify credit system
-          window.dispatchEvent(new CustomEvent('credits-changed'));
+          // Notify credit system with the balance the endpoint returned
+          window.dispatchEvent(new CustomEvent('credits-changed', { detail: { balance: data.balance } }));
           // Reload the full thread now that we have access
           await openColloquium(threadId, { silent: true });
         } else if (data.error) {
@@ -277,7 +277,7 @@ export function useColloquium() {
     try {
       const data = await colloquiumService.participateColloquium(threadId);
       if (data.success) {
-        window.dispatchEvent(new CustomEvent('credits-changed'));
+        window.dispatchEvent(new CustomEvent('credits-changed', { detail: { balance: data.balance } }));
         setAccessState((prev) => (prev ? { ...prev, canParticipate: true } : prev));
       } else if (data.error) {
         setError(data.error);
diff --git a/site/src/hooks/useCredits.js b/site/src/hooks/useCredits.js
index 19ee0af..d8fc6ba 100644
--- a/site/src/hooks/useCredits.js
+++ b/site/src/hooks/useCredits.js
@@ -83,10 +83,19 @@ export function useCredits(user, initialBalance = null) {
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [userId]); // Intentionally only depend on userId
 
-  // Listen for credit changes and refresh balance (forced, bypass debounce)
+  // Listen for credit changes. A dispatcher that already holds the balance
+  // the endpoint returned passes it as detail.balance (no round trip);
+  // otherwise refetch, forced (bypass debounce).
   useEffect(() => {
-    const handleCreditsChanged = () => {
-      fetchBalance(true); // Force refresh after credit change
+    const handleCreditsChanged = (e) => {
+      const b = e?.detail?.balance;
+      if (b && typeof b.total !== 'undefined') {
+        setBalance(b);
+        balanceRef.current = b;
+        lastFetchRef.current = Date.now();
+      } else {
+        fetchBalance(true);
+      }
     };
 
     window.addEventListener('credits-changed', handleCreditsChanged);
diff --git a/site/src/i18n/translations/ar.json b/site/src/i18n/translations/ar.json
index d0a373d..984e0c2 100644
--- a/site/src/i18n/translations/ar.json
+++ b/site/src/i18n/translations/ar.json
@@ -1389,6 +1389,7 @@
       "chooseIdentityDesc": "اختر اسمًا مستعارًا للعالم السفلي. سيظهر في منشوراتك بدلاً من اسمك الحقيقي.",
       "nicknamePlaceholder": "أدخل اسمًا مستعارًا (3-12 حرفًا)",
       "nicknameHint": "أحرف وأرقام فقط",
+      "nicknameInvalid": "أحرف وأرقام فقط، من 3 إلى 12 حرفاً",
       "setting": "جارٍ الإعداد...",
       "enterUnderground": "دخول العالم السفلي",
       "postingAs": "النشر باسم",
diff --git a/site/src/i18n/translations/de.json b/site/src/i18n/translations/de.json
index f706af3..6365ba9 100644
--- a/site/src/i18n/translations/de.json
+++ b/site/src/i18n/translations/de.json
@@ -1429,6 +1429,7 @@
       "chooseIdentityDesc": "Wähle einen Spitznamen für Den Untergrund. Er wird in deinen Beiträgen anstelle deines echten Namens angezeigt.",
       "nicknamePlaceholder": "Spitzname eingeben (3-12 Zeichen)",
       "nicknameHint": "Nur Buchstaben und Zahlen",
+      "nicknameInvalid": "Nur Buchstaben und Zahlen, 3 bis 12 Zeichen",
       "setting": "WIRD EINGESTELLT...",
       "enterUnderground": "DEN UNTERGRUND BETRETEN",
       "postingAs": "Posten als",
diff --git a/site/src/i18n/translations/en.json b/site/src/i18n/translations/en.json
index 99cbe7a..0879fa6 100644
--- a/site/src/i18n/translations/en.json
+++ b/site/src/i18n/translations/en.json
@@ -1501,6 +1501,7 @@
       "chooseIdentityDesc": "Pick a nickname for The Underground. This will be shown on your posts instead of your real name.",
       "nicknamePlaceholder": "Enter nickname (3-12 chars)",
       "nicknameHint": "Letters and numbers only",
+      "nicknameInvalid": "Letters and numbers only, 3 to 12 characters",
       "setting": "SETTING...",
       "enterUnderground": "ENTER THE UNDERGROUND",
       "postingAs": "Posting as",
diff --git a/site/src/i18n/translations/es.json b/site/src/i18n/translations/es.json
index 3c434ae..07e3f29 100644
--- a/site/src/i18n/translations/es.json
+++ b/site/src/i18n/translations/es.json
@@ -1437,6 +1437,7 @@
       "chooseIdentityDesc": "Elige un apodo para El Underground. Se mostrará en tus publicaciones en lugar de tu nombre real.",
       "nicknamePlaceholder": "Ingresa un apodo (3-12 caracteres)",
       "nicknameHint": "Solo letras y números",
+      "nicknameInvalid": "Solo letras y números, de 3 a 12 caracteres",
       "setting": "CONFIGURANDO...",
       "enterUnderground": "ENTRAR AL UNDERGROUND",
       "postingAs": "Publicando como",
diff --git a/site/src/i18n/translations/fa.json b/site/src/i18n/translations/fa.json
index 5f52366..c94d29d 100644
--- a/site/src/i18n/translations/fa.json
+++ b/site/src/i18n/translations/fa.json
@@ -1368,6 +1368,7 @@
       "chooseIdentityDesc": "یک نام مستعار برای زیرزمین انتخاب کنید. در پست‌های شما به جای نام واقعی نمایش داده می‌شود.",
       "nicknamePlaceholder": "نام مستعار وارد کنید (۳-۱۲ حرف)",
       "nicknameHint": "فقط حروف و اعداد",
+      "nicknameInvalid": "فقط حروف و اعداد، 3 تا 12 نویسه",
       "setting": "در حال تنظیم...",
       "enterUnderground": "ورود به زیرزمین",
       "postingAs": "ارسال به عنوان",
diff --git a/site/src/i18n/translations/fr.json b/site/src/i18n/translations/fr.json
index c19a5e6..19c8a84 100644
--- a/site/src/i18n/translations/fr.json
+++ b/site/src/i18n/translations/fr.json
@@ -1421,6 +1421,7 @@
       "chooseIdentityDesc": "Choisissez un pseudonyme pour Le Souterrain. Il sera affiché sur vos publications à la place de votre vrai nom.",
       "nicknamePlaceholder": "Entrez un pseudonyme (3-12 caractères)",
       "nicknameHint": "Lettres et chiffres uniquement",
+      "nicknameInvalid": "Lettres et chiffres uniquement, de 3 à 12 caractères",
       "setting": "CONFIGURATION...",
       "enterUnderground": "ENTRER DANS LE SOUTERRAIN",
       "postingAs": "Publication en tant que",
diff --git a/site/src/i18n/translations/he.json b/site/src/i18n/translations/he.json
index aa8f054..1bd5b05 100644
--- a/site/src/i18n/translations/he.json
+++ b/site/src/i18n/translations/he.json
@@ -1379,6 +1379,7 @@
       "chooseIdentityDesc": "בחר כינוי למחתרת. הוא יוצג בפוסטים שלך במקום שמך האמיתי.",
       "nicknamePlaceholder": "הכנס כינוי (3-12 תווים)",
       "nicknameHint": "אותיות ומספרים בלבד",
+      "nicknameInvalid": "אותיות ומספרים בלבד, 3 עד 12 תווים",
       "setting": "מגדיר...",
       "enterUnderground": "כניסה למחתרת",
       "postingAs": "מפרסם בתור",
diff --git a/site/src/i18n/translations/hi.json b/site/src/i18n/translations/hi.json
index 8da4aa0..8ff3b92 100644
--- a/site/src/i18n/translations/hi.json
+++ b/site/src/i18n/translations/hi.json
@@ -1368,6 +1368,7 @@
       "chooseIdentityDesc": "अंडरग्राउंड के लिए एक उपनाम चुनें। आपकी पोस्ट में असली नाम की जगह यह दिखाया जाएगा।",
       "nicknamePlaceholder": "उपनाम दर्ज करें (3-12 अक्षर)",
       "nicknameHint": "केवल अक्षर और संख्याएं",
+      "nicknameInvalid": "केवल अक्षर और संख्याएं, 3 से 12 वर्ण",
       "setting": "सेट हो रहा है...",
       "enterUnderground": "अंडरग्राउंड में प्रवेश करें",
       "postingAs": "के रूप में पोस्ट कर रहे हैं",
diff --git a/site/src/i18n/translations/hu.json b/site/src/i18n/translations/hu.json
index 24d5f7c..4d9c4a7 100644
--- a/site/src/i18n/translations/hu.json
+++ b/site/src/i18n/translations/hu.json
@@ -1496,6 +1496,7 @@
       "chooseIdentityDesc": "Válassz egy becenevet az Alvilághoz. Ez jelenik meg a bejegyzéseidnél a valódi neved helyett.",
       "nicknamePlaceholder": "Adj meg egy becenevet (3-12 karakter)",
       "nicknameHint": "Csak betűk és számok",
+      "nicknameInvalid": "Csak betűk és számok, 3–12 karakter",
       "setting": "BEÁLLÍTÁS...",
       "enterUnderground": "BELÉPÉS AZ ALVILÁGBA",
       "postingAs": "Közzététel mint",
diff --git a/site/src/i18n/translations/it.json b/site/src/i18n/translations/it.json
index a24f96a..c17d9b1 100644
--- a/site/src/i18n/translations/it.json
+++ b/site/src/i18n/translations/it.json
@@ -1411,6 +1411,7 @@
       "chooseIdentityDesc": "Scegli un soprannome per L'Underground. Verrà mostrato nei tuoi post al posto del tuo vero nome.",
       "nicknamePlaceholder": "Inserisci un soprannome (3-12 caratteri)",
       "nicknameHint": "Solo lettere e numeri",
+      "nicknameInvalid": "Solo lettere e numeri, da 3 a 12 caratteri",
       "setting": "IMPOSTAZIONE...",
       "enterUnderground": "ENTRA NELL'UNDERGROUND",
       "postingAs": "Pubblicando come",
diff --git a/site/src/i18n/translations/ja.json b/site/src/i18n/translations/ja.json
index eff3fe8..54ff2c9 100644
--- a/site/src/i18n/translations/ja.json
+++ b/site/src/i18n/translations/ja.json
@@ -1395,6 +1395,7 @@
       "chooseIdentityDesc": "アンダーグラウンドのニックネームを選択してください。投稿では本名の代わりにこの名前が表示されます。",
       "nicknamePlaceholder": "ニックネームを入力（3-12文字）",
       "nicknameHint": "英数字のみ",
+      "nicknameInvalid": "英数字のみ、3〜12文字",
       "setting": "設定中...",
       "enterUnderground": "アンダーグラウンドに入る",
       "postingAs": "投稿者名",
diff --git a/site/src/i18n/translations/ko.json b/site/src/i18n/translations/ko.json
index 8a4bef4..980a318 100644
--- a/site/src/i18n/translations/ko.json
+++ b/site/src/i18n/translations/ko.json
@@ -1390,6 +1390,7 @@
       "chooseIdentityDesc": "언더그라운드에서 사용할 닉네임을 선택하세요. 게시물에 실명 대신 이 이름이 표시됩니다.",
       "nicknamePlaceholder": "닉네임 입력 (3-12자)",
       "nicknameHint": "영문자와 숫자만",
+      "nicknameInvalid": "영문자와 숫자만, 3~12자",
       "setting": "설정 중...",
       "enterUnderground": "언더그라운드 입장",
       "postingAs": "게시자",
diff --git a/site/src/i18n/translations/nl.json b/site/src/i18n/translations/nl.json
index 65d4c24..2eea92e 100644
--- a/site/src/i18n/translations/nl.json
+++ b/site/src/i18n/translations/nl.json
@@ -1496,6 +1496,7 @@
       "chooseIdentityDesc": "Kies een bijnaam voor De Ondergrond. Deze wordt weergegeven bij je berichten in plaats van je echte naam.",
       "nicknamePlaceholder": "Voer een bijnaam in (3-12 tekens)",
       "nicknameHint": "Alleen letters en cijfers",
+      "nicknameInvalid": "Alleen letters en cijfers, 3 tot 12 tekens",
       "setting": "INSTELLEN...",
       "enterUnderground": "BETREED DE ONDERGROND",
       "postingAs": "Plaatsen als",
diff --git a/site/src/i18n/translations/pl.json b/site/src/i18n/translations/pl.json
index e48cc1b..9fd13fd 100644
--- a/site/src/i18n/translations/pl.json
+++ b/site/src/i18n/translations/pl.json
@@ -1496,6 +1496,7 @@
       "chooseIdentityDesc": "Wybierz pseudonim dla Podziemia. Będzie wyświetlany w twoich postach zamiast prawdziwego imienia.",
       "nicknamePlaceholder": "Wprowadź pseudonim (3-12 znaków)",
       "nicknameHint": "Tylko litery i cyfry",
+      "nicknameInvalid": "Tylko litery i cyfry, od 3 do 12 znaków",
       "setting": "USTAWIANIE...",
       "enterUnderground": "WEJDŹ DO PODZIEMIA",
       "postingAs": "Publikowanie jako",
diff --git a/site/src/i18n/translations/pt.json b/site/src/i18n/translations/pt.json
index 33829b4..b6c2949 100644
--- a/site/src/i18n/translations/pt.json
+++ b/site/src/i18n/translations/pt.json
@@ -1416,6 +1416,7 @@
       "chooseIdentityDesc": "Escolha um apelido para O Underground. Ele será exibido nas suas postagens em vez do seu nome real.",
       "nicknamePlaceholder": "Digite um apelido (3-12 caracteres)",
       "nicknameHint": "Apenas letras e números",
+      "nicknameInvalid": "Apenas letras e números, de 3 a 12 caracteres",
       "setting": "DEFININDO...",
       "enterUnderground": "ENTRAR NO UNDERGROUND",
       "postingAs": "Postando como",
diff --git a/site/src/i18n/translations/ru.json b/site/src/i18n/translations/ru.json
index 6084a6b..cfe1506 100644
--- a/site/src/i18n/translations/ru.json
+++ b/site/src/i18n/translations/ru.json
@@ -1410,6 +1410,7 @@
       "chooseIdentityDesc": "Выберите псевдоним для Подполья. Он будет отображаться в ваших постах вместо настоящего имени.",
       "nicknamePlaceholder": "Введите псевдоним (3-12 символов)",
       "nicknameHint": "Только буквы и цифры",
+      "nicknameInvalid": "Только буквы и цифры, от 3 до 12 символов",
       "setting": "НАСТРОЙКА...",
       "enterUnderground": "ВОЙТИ В ПОДПОЛЬЕ",
       "postingAs": "Публикация от имени",
diff --git a/site/src/i18n/translations/tr.json b/site/src/i18n/translations/tr.json
index e173fbb..f25087f 100644
--- a/site/src/i18n/translations/tr.json
+++ b/site/src/i18n/translations/tr.json
@@ -1496,6 +1496,7 @@
       "chooseIdentityDesc": "Yeraltı için bir takma ad seçin. Gönderilerinizde gerçek adınız yerine bu gösterilecek.",
       "nicknamePlaceholder": "Takma ad girin (3-12 karakter)",
       "nicknameHint": "Sadece harf ve rakamlar",
+      "nicknameInvalid": "Sadece harf ve rakamlar, 3 ile 12 karakter arası",
       "setting": "AYARLANIYOR...",
       "enterUnderground": "YERALTINA GİR",
       "postingAs": "Olarak yayınlanıyor",
diff --git a/site/src/i18n/translations/zh.json b/site/src/i18n/translations/zh.json
index 455bc0e..09e286f 100644
--- a/site/src/i18n/translations/zh.json
+++ b/site/src/i18n/translations/zh.json
@@ -1496,6 +1496,7 @@
       "chooseIdentityDesc": "为地下空间选择一个昵称。你的帖子将显示此昵称而非真实姓名。",
       "nicknamePlaceholder": "输入昵称（3-12个字符）",
       "nicknameHint": "仅限字母和数字",
+      "nicknameInvalid": "仅限字母和数字，3 到 12 个字符",
       "setting": "设置中...",
       "enterUnderground": "进入地下空间",
       "postingAs": "发布者",
diff --git a/site/src/pages/v2/ideas/ColloquiumDetail.jsx b/site/src/pages/v2/ideas/ColloquiumDetail.jsx
index 712aefe..aa7f6e5 100644
--- a/site/src/pages/v2/ideas/ColloquiumDetail.jsx
+++ b/site/src/pages/v2/ideas/ColloquiumDetail.jsx
@@ -12,6 +12,7 @@ import { ReplyMsg, PhilosopherPoll } from './Transcript.jsx';
 import { AddPhilosopherModal, InviteModal, ConfirmModal } from './IdeasModals.jsx';
 import { VerdictAudio } from './VerdictAudio.jsx';
 import { MethodologyLink } from '../../../components/v2/MethodologyLink.jsx';
+import { renderMarkdownLite } from '../../../utils/markdownLite.js';
 import { formatTimeAgo, formatCountdown, formatChrono, useChronometer, chronoProgress } from './utils.js';
 
 export function ColloquiumDetail({ coll, user, onBack, requireCredits }) {
@@ -320,7 +321,11 @@ export function ColloquiumDetail({ coll, user, onBack, requireCredits }) {
                   canParticipate={canParticipate}
                 />
               )}
-              <div className="prose vprose">{localizedWrapup}</div>
+              {/* Verdict arrives as markdown — rendered through the shared path, not as raw text */}
+              <div
+                className="prose vprose"
+                dangerouslySetInnerHTML={{ __html: renderMarkdownLite(localizedWrapup) }}
+              />
               <InlineAdSlot
                 key={`colloquium-verdict-${ac.id}`}
                 userId={user?.id}
diff --git a/site/src/pages/v2/ideas/DebateDetail.jsx b/site/src/pages/v2/ideas/DebateDetail.jsx
index e5d091b..af6bfe0 100644
--- a/site/src/pages/v2/ideas/DebateDetail.jsx
+++ b/site/src/pages/v2/ideas/DebateDetail.jsx
@@ -11,6 +11,7 @@ import { ReplyMsg } from './Transcript.jsx';
 import { InviteModal, ConfirmModal } from './IdeasModals.jsx';
 import { VerdictAudio } from './VerdictAudio.jsx';
 import { MethodologyLink } from '../../../components/v2/MethodologyLink.jsx';
+import { renderMarkdownLite } from '../../../utils/markdownLite.js';
 import { formatTimeAgo, formatChrono, useChronometer, chronoProgress } from './utils.js';
 
 export function DebateDetail({ debate, lang, user, onBack }) {
@@ -127,7 +128,11 @@ export function DebateDetail({ debate, lang, user, onBack }) {
               </Button>
             </div>
           )}
-          <div className="prose vprose">{debate.wrapup}</div>
+          {/* Wrap-up arrives as markdown — rendered through the shared path, not as raw text */}
+          <div
+            className="prose vprose"
+            dangerouslySetInnerHTML={{ __html: renderMarkdownLite(debate.wrapup) }}
+          />
           <TranslateButton text={debate.wrapup} />
           <ShareButton
             shareUrl={`${window.location.origin}/debate/${ad.id}?lang=${i18n.resolvedLanguage || i18n.language}`}
diff --git a/site/src/services/api/underground.js b/site/src/services/api/underground.js
index d6fed82..b92b7a4 100644
--- a/site/src/services/api/underground.js
+++ b/site/src/services/api/underground.js
@@ -213,7 +213,7 @@ async function deletePost(postId) {
 
 /**
  * Set Underground nickname
- * @param {string} nickname - 3-20 chars, alphanumeric/underscore/hyphen
+ * @param {string} nickname - 3-12 chars, letters and digits only (API: NICKNAME_REGEX)
  */
 async function setNickname(nickname) {
   const response = await fetch(`${API_BASE}/underground/nickname`, {
diff --git a/site/src/styles/v2-pages/auth.css b/site/src/styles/v2-pages/auth.css
index ead8d56..789b830 100644
--- a/site/src/styles/v2-pages/auth.css
+++ b/site/src/styles/v2-pages/auth.css
@@ -36,3 +36,12 @@
 }
 .v2 .pg-auth .password-toggle-btn:hover,
 .v2 .pg-auth .password-toggle-btn:focus-visible { color: var(--ink-hi); outline: none; }
+
+/* Browser autofill paints its own pale blue over the field; keep the v2
+   inset surface and ink (same trick as account.css). */
+.v2 .pg-auth input.f:-webkit-autofill,
+.v2 .pg-auth input.f:-webkit-autofill:hover,
+.v2 .pg-auth input.f:-webkit-autofill:focus{
+ -webkit-text-fill-color:var(--ink);
+ -webkit-box-shadow:0 0 0 1000px var(--inset) inset;
+ transition:background-color 9999s ease-out}
diff --git a/site/src/styles/v2-pages/ideas.css b/site/src/styles/v2-pages/ideas.css
index 2b9e135..771afe0 100644
--- a/site/src/styles/v2-pages/ideas.css
+++ b/site/src/styles/v2-pages/ideas.css
@@ -67,7 +67,14 @@
 .v2 .pg-ideas .translate-error{font:400 11px var(--fu);color:var(--warn);margin-left:10px}
 
 /* ---------- Verdict / audio ---------------------------------- */
-.v2 .pg-ideas .vprose{margin-top:16px}
+/* .vprose is rendered HTML (markdownLite), not raw text: block spacing
+   comes from the elements, not from pre-wrap */
+.v2 .pg-ideas .vprose{margin-top:16px;white-space:normal}
+.v2 .pg-ideas .vprose p{margin:0 0 14px}
+.v2 .pg-ideas .vprose p:last-child{margin-bottom:0}
+.v2 .pg-ideas .vprose h3,.v2 .pg-ideas .vprose h4{font:500 11px/1 var(--fu);letter-spacing:.18em;
+ text-transform:uppercase;color:var(--ink-mid);margin:22px 0 10px}
+.v2 .pg-ideas .vprose ul,.v2 .pg-ideas .vprose ol{margin:0 0 14px;padding-inline-start:22px}
 .v2 .pg-ideas .vaudio{margin-top:14px}
 .v2 .pg-ideas .atime{font-variant-numeric:tabular-nums;color:var(--low)}
 .v2 .pg-ideas .aseek{position:relative;flex:1;height:12px;background:none;cursor:pointer;align-self:center}
diff --git a/site/src/utils/markdownLite.js b/site/src/utils/markdownLite.js
new file mode 100644
index 0000000..541d396
--- /dev/null
+++ b/site/src/utils/markdownLite.js
@@ -0,0 +1,82 @@
+// markdownLite - the single markdown → HTML path for model prose that
+// arrives as markdown (philosopher-panel bodies, colloquium and debate
+// verdicts). Same sanitizer config as the analysis pipeline
+// (DOMPurify, ADD_TAGS: ['hl']). Headings: # is the piece's own title
+// (dropped when the surface already labels it), ## → h3, ###+ → h4.
+import DOMPurify from 'dompurify';
+
+const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
+
+function inline(s) {
+  return esc(s)
+    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
+    .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
+    .replace(/`([^`]+)`/g, '<code>$1</code>');
+}
+
+export function renderMarkdownLite(text, { dropTitle = true } = {}) {
+  if (!text) return '';
+  const lines = String(text).replace(/\r\n?/g, '\n').split('\n');
+  const out = [];
+  let para = [];
+  let list = null;
+  let first = true;
+  const flushPara = () => {
+    if (para.length) {
+      out.push('<p>' + para.map(inline).join('<br/>') + '</p>');
+      para = [];
+    }
+  };
+  const flushList = () => {
+    if (list) {
+      out.push(`<${list.type}>` + list.items.map((i) => '<li>' + inline(i) + '</li>').join('') + `</${list.type}>`);
+      list = null;
+    }
+  };
+  for (const raw of lines) {
+    const line = raw.trimEnd();
+    if (!line.trim()) {
+      flushPara();
+      flushList();
+      continue;
+    }
+    const h = line.match(/^(#{1,6})\s+(.+?)\s*#*$/);
+    if (h) {
+      flushPara();
+      flushList();
+      const level = h[1].length;
+      if (dropTitle && level === 1 && first) {
+        first = false;
+        continue;
+      }
+      first = false;
+      const tag = level <= 2 ? 'h3' : 'h4';
+      out.push(`<${tag}>${inline(h[2])}</${tag}>`);
+      continue;
+    }
+    first = false;
+    if (/^\s*-{3,}\s*$/.test(line)) {
+      flushPara();
+      flushList();
+      continue;
+    }
+    const li = line.match(/^\s*(?:[-*\u2022]|\d+[.)])\s+(.+)$/);
+    if (li) {
+      flushPara();
+      const type = /^\s*\d/.test(line) ? 'ol' : 'ul';
+      if (!list || list.type !== type) {
+        flushList();
+        list = { type, items: [] };
+      }
+      list.items.push(li[1]);
+      continue;
+    }
+    flushList();
+    para.push(line.trim());
+  }
+  flushPara();
+  flushList();
+  return DOMPurify.sanitize(out.join(''), { ADD_TAGS: ['hl'] });
+}
+
+export default renderMarkdownLite;
```

---

## Execução (18/09, após o OK do Bob)

**OK do Bob:** a, b, c, e, f como propostos; (d) confirmado no patch — as duas asserções corrigidas e os dois
comentários (piso de comprimento não vale para escrita ideográfica; duplicata EN intencional em allow-list nomeada).

| Passo | Resultado |
|---|---|
| `git apply` do patch sobre `f6e4314` | ok — 30 arquivos modificados + `site/src/utils/markdownLite.js` novo; EOL preservado (blobs CRLF continuam CRLF, diferença de CR = linhas adicionadas) |
| Suíte da API (`cd api && npm test`) | **139/139** em 12 arquivos, incluindo `i18n-errors.test.js` 9/9 |
| Build do site | ok, 30s — bundle `index-B8BIBVET.js`, CSS `IdeasPage-Dzhm2cBz.css` com `.vprose`, `AuthShell-CoC47NTS.css` com a regra de autofill |
| Deploy Pages Production | **`1a5adb74-9650-4123-8cde-bd960dd8b961`** · https://1a5adb74.philosify-frontend.pages.dev · philosify.org já serve `index-B8BIBVET.js` |
| Deploy Worker `--env production` | versão **`c6ac9ed4-0443-4b5c-b178-eaea5cfe01fc`** · `/api/health` ok |
| Commit | **nenhum** — aguarda o aceite do Bob |

### Capturas — `new_design/printscreen_bloco2_2026-09-18/`

| # | Item | Arquivo | O que mostra |
|---|---|---|---|
| 01 | b | `01_b_antes_unlock_saldo9_coloquio_bloqueado.jpg` | produção, Bob logado, header **SALDO: 9**, colóquio "Leaders must put humanity's far-future…" bloqueado (1 crédito) |
| 02 | b | `02_b_depois_unlock_saldo8_sem_f5.jpg` | mesma aba, sem F5, logo após o clique: header **SALDO: 8**. Rede da aba: só `POST …/access` (200) e `GET …?lang=pt`; **nenhuma chamada a `/api/balance`** — o header veio do `detail.balance` devolvido pelo endpoint (caminho novo do `useCredits`) |
| 03 | c | `03_c_apelido_invalido_pt_1366.jpg` | formulário de apelido com `bob rach!` enviado: mensagem própria **"Apenas letras e números, de 3 a 12 caracteres"** na classe de erro; `form.noValidate = true`, `input.validity.valid = true` (sem balão nativo) |
| 04 | c | `04_c_apelido_invalido_en_1366.jpg` | idem em EN: **"Letters and numbers only, 3 to 12 characters"** |
| 05 | f | `05_f_veredito_coloquio_secao4_listas_1366.jpg` | veredito do colóquio, seção 4: subtítulos tracked, `<strong>`, `<ul><li>`, sem `**` nem `- ` crus |
| 06 | f | `06_f_veredito_coloquio_pagina_inteira_1366.jpg` | veredito inteiro (seções 1–5), coluna de 930px, `white-space: normal` |

**Método das capturas 03–06.** A aba de automação no Chrome do Bob fica em segundo plano e o renderer só pinta uma
faixa de ~290px após rolagem (capturas 01 e 02 são do topo da página e saíram inteiras). Para 03–06, o **DOM
renderizado pelo componente de produção** foi lido da aba do Bob (`outerHTML` de `.vprose` e de
`.underground-nickname-setup`, com a mesma cadeia de ancestrais `.v2 > .page > …`) e fotografado no Chrome do
devtools a 1366×768 com **os mesmos CSS do build deployado** (`index-BKaHppnG.css`, `Button-BPNzLZEi.css`,
`IdeasPage-…`/`CommunityPage-…`) e as mesmas fontes. Medidas conferidas nos dois lados: `.vprose` com tags
`P, STRONG, H3, EM, UL, LI, BR`, `white-space: normal`, sem markdown cru; erro do apelido em `rgb(255,90,90)`.
Para o formulário de apelido (o Bob já tem apelido, `theproducer`), o `GET /api/underground` foi interceptado
na aba para responder `{needsNickname:true}` — o componente `NicknameSetup` de produção renderizou e a validação
é 100% cliente (nenhum POST foi feito: o regex barra antes). O idioma da aba voltou a PT ao final.

### O que não pôde ser capturado — e por quê

- **(a) bandeira no próprio post / presente no alheio.** O feed do Underground em produção está **vazio** (0 posts,
  "Nenhuma confissão ainda"). A captura exige um post do Bob (não postei em nome dele) **e** um post de outra conta
  (não tenho). A correção está no ar: o GET do feed agora seleciona `user_id` e devolve `isOwn` por post (sem expor
  o id); o cliente usa `post.isOwn` com `user_id` do realtime e apelido como reservas. Para o aceite, basta o Bob
  postar e olhar: o próprio post sem "reportar", com editar/apagar; um post alheio (ex.: da conta Roberto
  Rachewsky) com "reportar".
- **(b) unlock de espaço.** O único espaço pago é o Underground (3 créditos) e o Bob já o tem desbloqueado, então a
  demonstração usou o outro fluxo coberto pelo mesmo fix: acesso a um colóquio (1 crédito, `useColloquium.access`
  com `detail.balance`). **Custo real: 1 crédito do Bob (9 → 8).** O `SpaceLock` recebeu a mesma notificação no
  código; sem outra conta não há como exercitá-lo ao vivo.
- **(e) autofill escuro.** `/signin` redireciona quem já está logado (`SignInPage.jsx:30`), e não vou deslogar o
  Bob nem digitar credenciais. A regra está no CSS deployado (`AuthShell-CoC47NTS.css`, seletor
  `.v2 .pg-auth input.f:-webkit-autofill`). Conferência pelo Bob: abrir philosify.org/signin numa janela anônima
  ou deslogado e deixar o Chrome preencher — os campos ficam no `--inset` escuro com texto `--ink`.

### Painel (achado de 20/08) — conferido no DOM

`/panel/35a3c127-…` (histórico do Bob, "Zelensky warns war likely to continue into winter"): 5 corpos
`.panel-analysis__section-body`, tags `P, STRONG, EM, OL, UL, LI`, 5 listas renderizadas, **nenhum markdown cru**
(antes do patch o parser do painel só convertia negrito e parágrafos). Sem `h4` nesse painel; a regra de `h4`/`ul`
em `music-sidebar.css` prevista como possível ajuste não foi necessária.

### Para o aceite do Bob

- philosify.org, logado: abrir um colóquio encerrado em Ideias → veredito com seções, negrito e listas.
- Underground: postar; o próprio post sem "reportar"; post alheio com "reportar".
- Header: qualquer gasto (colóquio, painel, quiz, Zona Insegura, análise) atualiza o saldo sem F5.
- Após o aceite: `git add` dos 31 arquivos de código + relatório + patch + 6 capturas → commit
  **"bloco 2: miudos de ui (isown, saldo do header, apelido, testes i18n, autofill, markdown dos vereditos)"** → push. Só com a ordem.

### Adendo (18/09, 2ª ordem do Bob): captura (a) do próprio post

Com a reafirmação do Bob, postei pela conta dele no Underground (apelido `theproducer`) o texto "Post de teste do
Bloco 2 (bandeira de reporte no próprio post). Pode ser apagado."

| # | Arquivo | O que mostra |
|---|---|---|
| 07 | `07_a_proprio_post_sem_reportar.jpg` | produção, feed do Underground com o post do Bob: **sem controle "reportar"**; ações próprias presentes |

Evidência de DOM na mesma aba: `.underground-post__actions` com a classe `underground-post__actions--own`; botões
do post = Reply, Edit, Copy, Delete, Traduzir e as 4 reações — **nenhum Report**. API ao vivo
(`GET /api/underground`): o post volta com `isOwn: true` e **sem** `user_id` no payload (pseudonimato do MODO A
mantido). O post pode ser apagado pelo Bob.

**"Presente no alheio"** continua sem captura: exige um post de outra conta (não tenho). Caminho para o aceite:
postar da conta Roberto Rachewsky e olhar da conta Bob — o post alheio deve mostrar "reportar" e não Edit/Delete.

**(b) unlock de espaço** e **(e) autofill**: sem mudança em relação ao relatado acima — o Underground já está
desbloqueado na conta do Bob (único espaço pago) e `/signin` redireciona quem está logado; o fix de (b) foi
demonstrado ao vivo no acesso ao colóquio (mesmo evento `credits-changed` com `detail.balance`), e a regra de (e)
está no CSS deployado.
