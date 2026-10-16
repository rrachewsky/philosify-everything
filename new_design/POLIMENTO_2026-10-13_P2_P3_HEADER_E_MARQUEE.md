# POLIMENTO · P2 + P3 · flicker de auth no header e clique do marquee do Top 50 — diff para OK

**Status:** DIFF PARA OK do Bob · 13/10/2026 · aplicado **só no working tree** (nada commitado, nada em produção; `git checkout -- site/` desfaz). Deploy do site num comando seu, depois do P1 e da sua ordem.
**Origem:** Bloco 3(e) (`BLOCO3_A_REPORT_SUPERVISOR_2026-09-20.md:75`): "marquee do Top 50 e flicker de auth no primeiro paint".

---

## P2 · Flicker de auth no primeiro paint

### Diagnóstico

- O slot de sessão é `NavAccount.jsx` (montado por `HeaderBar.jsx:16` em todas as páginas v2). Linha 95: `{isAuthenticated ? (saldo · nome ▾) : (Entrar · Cadastrar)}`. Enquanto o `AuthProvider` ainda não resolveu a sessão, `isAuthenticated` é `false` → o header pinta **deslogado** e troca para logado quando a sessão chega. É o flicker.
- O provider já expõe o estado certo: `AuthContext.jsx:25,30` — `loading` = "a checagem inicial da sessão não resolveu"; `useAuth.js:57` devolve `loading: ctx.loading || pending` (pending = ação iniciada por este consumidor, ex. o próprio sign-out).
- **Outros pontos com o mesmo flicker:** nenhum no chrome. `IdeasPage.jsx:287` e `QuizPage.jsx:394` já gateiam por `authLoading`; `CinemaPage`, `LiteraturePage`, `CommunityPage` e `CommerceModals` usam `isAuthenticated` só em handlers de clique ou em fetch condicional, não no render inicial. A exceção cosmética é `CommunityPage.jsx:240` (cadeado do Underground só aparece logado) — fora do escopo, registrado.

### Conserto

`NavAccount`: `authLoading` do `useAuth`; enquanto `true`, o slot renderiza `<span class="navskel">` com duas barras neutras (`var(--line)`, 9 px de altura, 64 e 112 px de largura, o mesmo `gap:26px` do nav), sem texto, sem cor, sem animação. Resolvida a sessão, cai no ramo logado ou deslogado como hoje. Durante um sign-out iniciado no próprio menu o skeleton também aparece (pending), o que é o comportamento desejado. O seletor de idioma à esquerda não depende de sessão e não muda.

## P3 · Clique do marquee abre outra faixa

### Como o marquee anima (`MusicPage.jsx:97-131`, `music.css:9-21`)

- `Top50Line` renderiza a lista **dobrada** (100 `<a>`) dentro de `.t50-run` (`display:inline-flex`), que anima `transform: translateX(0 → -50%)` em loop (`@keyframes pgm-t50`), com duração medida por `useMarqueeDuration` (60 px/s sobre a largura real da fita; hoje 14 791 px por metade → 246 s).
- Pausa no hover já existe: `.t50-strip:hover .t50-run{animation-play-state:paused}` (`music.css:15`).
- **O clique não usa índice calculado:** cada `<a>` tem `onClick={() => onSelect(tr)}` com o próprio `tr` na closure (`:116-123`). `handleSelect` (`:355`) recebe esse objeto e o coloca no card; não há busca nem auto-seleção de resultado depois (`useSpotifySearch.selectTrack` só grava e limpa a lista).

### Reprodução em produção (13/10, Chrome desktop, aba visível, build 34f07a79)

| Medição | Resultado |
|---|---|
| Hit-test instantâneo em 4 pontos da fita (`elementFromPoint` × `getBoundingClientRect` dos `<a>`) | **4/4 coincidem** |
| Ponteiro parado sobre a fita | `animationPlayState: paused`, deslocamento 0 px em 700 ms, `:hover` no `<a>` esperado |
| Clique real (ferramenta de mouse) sobre "#6 Beauty And A Beat" | o card abriu **"BEAUTY AND A BEAT — Justin Bieber, Nicki Minaj"**; campo de busca "Beauty And A Beat - Justin Bieber, Nicki Minaj" |

Com mouse, no desktop, **não reproduz**: visual, hit-test e item aberto coincidem. Velocidade de cruzeiro 60 px/s; um item tem ~296 px; um atraso de um quadro (16 ms) é 1 px.

### Onde o hit-target descola do visual: toque/caneta

Em tela de toque não há `:hover` → a fita **não pausa**. A sequência de um toque é `pointerdown` → `pointerup` → `click`; o alvo do `click` é o elemento sob o dedo e a fita continua andando durante o gesto (e, no primeiro toque de um elemento com estilo de hover, alguns navegadores móveis aplicam o hover e só disparam o clique no segundo toque, com a fita ainda em movimento entre os dois). Toque lento ou com arrasto leve, item de ~300 px a 60 px/s: um gesto de 1-2 s já cruza a fronteira de um item. É o único caminho pelo qual "o item visível" e "o alvo do clique" divergem com este código. Se o seu caso é desktop com mouse, preciso do navegador e do gesto exato (há arrasto? há roda do mouse?) para investigar outro mecanismo; nada no código explica um deslocamento com mouse parado.

### Conserto (os dois lados do contrato que você pediu)

1. **O clique usa o elemento sob o cursor no instante do clique.** `handleClick(e, tr)` resolve `document.elementFromPoint(e.clientX, e.clientY)` → `closest('.t50-run a[data-i]')` → `doubled[data-i]`; a closure `tr` fica só como fallback (sem coordenadas, ex. teclado). Nenhum índice é calculado a partir de posição ou tempo.
2. **A fita pausa durante qualquer gesto de ponteiro**, não só no hover: `.t50-strip` recebe `onPointerDown` → classe `hold` → `.t50-strip.hold .t50-run{animation-play-state:paused}`; `onPointerUp`/`onPointerCancel`/`onPointerLeave` soltam. Cobre toque e caneta; com mouse é redundante com o `:hover`.

**Extensão (OK do Bob, 15/10):** Cinema e Literatura têm cópias do mesmo componente (TopFilmsStrip em CinemaPage.jsx:51, TopBooksStrip em LiteraturePage.jsx:54) e receberam o mesmo conserto neste ciclo: elementFromPoint + data-i no clique, hold por pointer na .t50-strip e a regra .hold em cinema.css e literature.css. Três páginas, contrato idêntico.

## Verificação local

| Passo | Resultado |
|---|---|
| eslint nos 2 JSX tocados | limpo, exceto 2 erros **pré-existentes** em `MusicPage.jsx` (`'Event' is not defined` em `new Event('stopAllAudio')`, já no HEAD) |
| `lint:tokens` | OK (68 arquivos, só tokens) |
| `vite build` | OK |
| `git diff --stat` | 8 arquivos do site, +111 / −42 (com a extensão a Cinema e Literatura) |

## O que peço de OK

- **A.** P2 como está (skeleton de duas barras neutras no slot de sessão).
- **B.** P3 (elemento sob o cursor + pausa por gesto) em Música, Cinema e Literatura.
- **C.** Ordem: deploy do worker (P1) + SQL de correção → deploy do site (P2+P3) → commits.

## Diff (working tree, `git diff -- site/src` em 13/10/2026)

```diff
diff --git a/site/src/components/v2/NavAccount.jsx b/site/src/components/v2/NavAccount.jsx
index 2ed08b0..adc1504 100644
--- a/site/src/components/v2/NavAccount.jsx
+++ b/site/src/components/v2/NavAccount.jsx
@@ -19,7 +19,11 @@ const LOCALES = [
 export function NavAccount() {
   const { t, i18n } = useTranslation();
   const navigate = useNavigate();
-  const { user, isAuthenticated, signOut } = useAuth();
+  // authLoading: the AuthProvider has not resolved the initial session yet
+  // (ctx.loading) — or a sign-out started here is in flight. Until then the
+  // session slot is a neutral skeleton: neither "Sign in" nor the e-mail
+  // (3e: the header used to paint signed-out, then flip to signed-in).
+  const { user, isAuthenticated, signOut, loading: authLoading } = useAuth();
   const { balance } = useCreditsContext();
   const [menu, setMenu] = useState(null); // 'acct' | 'lang' | null
   const [acctOpen, setAcctOpen] = useState(false);
@@ -92,7 +96,12 @@ export function NavAccount() {
         </span>
       </span>
 
-      {isAuthenticated ? (
+      {authLoading ? (
+        <span className="navskel" aria-hidden="true">
+          <span />
+          <span />
+        </span>
+      ) : isAuthenticated ? (
         <>
           <a
             href="#balance"
diff --git a/site/src/pages/v2/CinemaPage.jsx b/site/src/pages/v2/CinemaPage.jsx
index d83d049..3c49550 100644
--- a/site/src/pages/v2/CinemaPage.jsx
+++ b/site/src/pages/v2/CinemaPage.jsx
@@ -48,10 +48,14 @@ const openBuyCredits = () => window.dispatchEvent(new CustomEvent('v2-open-buy-c
 // Top 50 films strip inside the module ticker (GET /api/cinema/top,
 // refreshed every 5 minutes; items select the film — same as the sidebar's
 // TopCinemaTicker).
+// Click contract (3e, 13 Oct 2026, same as MusicPage.Top50Line): the item
+// opened is the one UNDER THE POINTER AT CLICK TIME, resolved from the DOM;
+// `hold` pauses the strip from pointerdown to pointerup (touch/pen have no :hover).
 function TopFilmsStrip({ onSelect }) {
   const { t } = useTranslation();
   const [films, setFilms] = useState([]);
   const [runRef, duration] = useMarqueeDuration([films]);
+  const [held, setHeld] = useState(false);
 
   useEffect(() => {
     let alive = true;
@@ -79,10 +83,26 @@ function TopFilmsStrip({ onSelect }) {
   }
 
   const doubled = [...films, ...films];
+  const handleClick = (e, fallback) => {
+    e.preventDefault();
+    const el =
+      typeof e.clientX === 'number' ? document.elementFromPoint(e.clientX, e.clientY) : null;
+    const a = el && el.closest ? el.closest('.t50-run a[data-i]') : null;
+    const idx = a ? Number(a.dataset.i) : NaN;
+    onSelect(Number.isInteger(idx) && doubled[idx] ? doubled[idx] : fallback);
+  };
+  const hold = () => setHeld(true);
+  const release = () => setHeld(false);
   return (
     <span className="t50">
       <span className="lbl">{t('v2.cinema.top50', 'Top 50 >>>')}</span>
-      <span className="t50-strip">
+      <span
+        className={`t50-strip${held ? ' hold' : ''}`}
+        onPointerDown={hold}
+        onPointerUp={release}
+        onPointerCancel={release}
+        onPointerLeave={release}
+      >
         <span
           className="t50-run"
           ref={runRef}
@@ -92,10 +112,8 @@ function TopFilmsStrip({ onSelect }) {
             <a
               key={`${film.id}-${i}`}
               href="#top50"
-              onClick={(e) => {
-                e.preventDefault();
-                onSelect(film);
-              }}
+              data-i={i}
+              onClick={(e) => handleClick(e, film)}
             >
               #{(i % films.length) + 1} {film.title}
               {film.star ? ` — ${film.star}` : film.year ? ` — ${film.year}` : ''}
diff --git a/site/src/pages/v2/LiteraturePage.jsx b/site/src/pages/v2/LiteraturePage.jsx
index 4f7af17..17aa76f 100644
--- a/site/src/pages/v2/LiteraturePage.jsx
+++ b/site/src/pages/v2/LiteraturePage.jsx
@@ -51,10 +51,14 @@ const openBuyCredits = () => window.dispatchEvent(new CustomEvent('v2-open-buy-c
 // Top 50 books strip inside the module ticker (GET /api/books/top,
 // refreshed every 5 minutes; items select the book — same as the sidebar's
 // TopBooksTicker).
+// Click contract (3e, 13 Oct 2026, same as MusicPage.Top50Line): the item
+// opened is the one UNDER THE POINTER AT CLICK TIME, resolved from the DOM;
+// `hold` pauses the strip from pointerdown to pointerup (touch/pen have no :hover).
 function TopBooksStrip({ onSelect }) {
   const { t } = useTranslation();
   const [books, setBooks] = useState([]);
   const [runRef, duration] = useMarqueeDuration([books]);
+  const [held, setHeld] = useState(false);
 
   useEffect(() => {
     let alive = true;
@@ -82,10 +86,26 @@ function TopBooksStrip({ onSelect }) {
   }
 
   const doubled = [...books, ...books];
+  const handleClick = (e, fallback) => {
+    e.preventDefault();
+    const el =
+      typeof e.clientX === 'number' ? document.elementFromPoint(e.clientX, e.clientY) : null;
+    const a = el && el.closest ? el.closest('.t50-run a[data-i]') : null;
+    const idx = a ? Number(a.dataset.i) : NaN;
+    onSelect(Number.isInteger(idx) && doubled[idx] ? doubled[idx] : fallback);
+  };
+  const hold = () => setHeld(true);
+  const release = () => setHeld(false);
   return (
     <span className="t50">
       <span className="lbl">{t('v2.literature.top50', 'Top 50 >>>')}</span>
-      <span className="t50-strip">
+      <span
+        className={`t50-strip${held ? ' hold' : ''}`}
+        onPointerDown={hold}
+        onPointerUp={release}
+        onPointerCancel={release}
+        onPointerLeave={release}
+      >
         <span
           className="t50-run"
           ref={runRef}
@@ -95,10 +115,8 @@ function TopBooksStrip({ onSelect }) {
             <a
               key={`${book.id}-${i}`}
               href="#top50"
-              onClick={(e) => {
-                e.preventDefault();
-                onSelect(book);
-              }}
+              data-i={i}
+              onClick={(e) => handleClick(e, book)}
             >
               #{(i % books.length) + 1} {book.title}
               {book.author ? ` — ${book.author}` : ''}
diff --git a/site/src/pages/v2/MusicPage.jsx b/site/src/pages/v2/MusicPage.jsx
index b791cb3..cf92aa8 100644
--- a/site/src/pages/v2/MusicPage.jsx
+++ b/site/src/pages/v2/MusicPage.jsx
@@ -94,16 +94,45 @@ const formatModelName = (model) => {
 
 const sanitize = (html) => DOMPurify.sanitize(stripTrailingWordCount(html), { ADD_TAGS: ['hl'] });
 
-// Top-50 marquee rendered inside the v2 ticker line (mockup .tick anatomy)
+// Top-50 marquee rendered inside the v2 ticker line (mockup .tick anatomy).
+// Click contract (3e, 13 Oct 2026): the track opened is the one UNDER THE
+// POINTER AT CLICK TIME, resolved from the DOM, never the closure of the
+// anchor the gesture started on. With a mouse, :hover pauses the strip, so
+// both agree; with touch/pen there is no :hover and the strip keeps moving
+// between pointerdown and click — `hold` pauses it for the gesture and the
+// DOM lookup settles any residual drift. No index is ever computed.
 function Top50Line({ tracks, label, onSelect }) {
   const [runRef, duration] = useMarqueeDuration([tracks]);
+  const [held, setHeld] = useState(false);
   if (!tracks.length) return <span className="t50"><span className="lbl">{label}</span></span>;
   const items = tracks.map((tr, i) => ({ ...tr, rank: i + 1 }));
   const doubled = [...items, ...items];
+  const pick = (tr) =>
+    onSelect({
+      song: tr.song_title,
+      artist: tr.artist,
+      spotify_id: tr.spotify_id,
+      isFree: !!tr.is_free,
+    });
+  const handleClick = (e, fallback) => {
+    const el =
+      typeof e.clientX === "number" ? document.elementFromPoint(e.clientX, e.clientY) : null;
+    const a = el && el.closest ? el.closest(".t50-run a[data-i]") : null;
+    const idx = a ? Number(a.dataset.i) : NaN;
+    pick(Number.isInteger(idx) && doubled[idx] ? doubled[idx] : fallback);
+  };
+  const hold = () => setHeld(true);
+  const release = () => setHeld(false);
   return (
     <span className="t50">
       <span className="lbl">{label}</span>
-      <span className="t50-strip">
+      <span
+        className={`t50-strip${held ? " hold" : ""}`}
+        onPointerDown={hold}
+        onPointerUp={release}
+        onPointerCancel={release}
+        onPointerLeave={release}
+      >
         <span
           className="t50-run"
           ref={runRef}
@@ -112,14 +141,8 @@ function Top50Line({ tracks, label, onSelect }) {
           {doubled.map((tr, i) => (
             <a
               key={`${tr.spotify_id || tr.rank}-${i}`}
-              onClick={() =>
-                onSelect({
-                  song: tr.song_title,
-                  artist: tr.artist,
-                  spotify_id: tr.spotify_id,
-                  isFree: !!tr.is_free,
-                })
-              }
+              data-i={i}
+              onClick={(e) => handleClick(e, tr)}
             >
               #{tr.rank} {tr.song_title} — {tr.artist}
               {tr.is_free ? ' · FREE' : ''}
diff --git a/site/src/styles/v2-components.css b/site/src/styles/v2-components.css
index ed0e979..b893595 100644
--- a/site/src/styles/v2-components.css
+++ b/site/src/styles/v2-components.css
@@ -73,6 +73,12 @@
 .v2 .hdr .navr{position:absolute;top:calc(26px + env(safe-area-inset-top,0px))}
 .v2 .navr a{color:var(--dim);text-decoration:none;font:500 11px/1 var(--fu);letter-spacing:.16em;text-transform:uppercase;cursor:pointer}
 .v2 .navr a:hover{color:var(--ink)}
+/* session slot skeleton (3e): two neutral bars where "Balance · name" or
+   "Sign in · Sign up" will land once the session resolves. Same gap as the
+   nav, line-height of the 11px chrome; no text, no color, no motion. */
+.v2 .navr .navskel{display:flex;gap:26px;align-items:center}
+.v2 .navr .navskel span{display:block;height:9px;width:64px;background:var(--line);border-radius:2px}
+.v2 .navr .navskel span+span{width:112px}
 .v2 .acctmenu{display:none;position:absolute;right:0;top:26px;min-width:168px;background:var(--bg);border:1px solid var(--strong);padding:6px 0;z-index:9}
 .v2 .acctmenu.open{display:block}
 .v2 .acctmenu a{display:block;padding:10px 18px;color:var(--dim);letter-spacing:.14em}
diff --git a/site/src/styles/v2-pages/cinema.css b/site/src/styles/v2-pages/cinema.css
index e8a277e..ecf1ba8 100644
--- a/site/src/styles/v2-pages/cinema.css
+++ b/site/src/styles/v2-pages/cinema.css
@@ -14,6 +14,8 @@
 .v2 .pg-cinema .t50-strip{flex:1;min-width:0;overflow:hidden;position:relative}
 .v2 .pg-cinema .t50-run{display:inline-flex;white-space:nowrap;animation:pgc-t50 linear infinite}
 .v2 .pg-cinema .t50-strip:hover .t50-run{animation-play-state:paused}
+/* touch/pen have no :hover — .hold pauses the strip from pointerdown to pointerup (3e) */
+.v2 .pg-cinema .t50-strip.hold .t50-run{animation-play-state:paused}
 .v2 .pg-cinema .t50-run a{color:var(--mid);text-decoration:none;cursor:pointer;margin-right:22px}
 .v2 .pg-cinema .t50-run a:hover{color:var(--ink)}
 @keyframes pgc-t50{from{transform:translateX(0)}to{transform:translateX(-50%)}}
diff --git a/site/src/styles/v2-pages/literature.css b/site/src/styles/v2-pages/literature.css
index f10795e..d9d4607 100644
--- a/site/src/styles/v2-pages/literature.css
+++ b/site/src/styles/v2-pages/literature.css
@@ -14,6 +14,8 @@
 .v2 .pg-literature .t50-strip{flex:1;min-width:0;overflow:hidden;position:relative}
 .v2 .pg-literature .t50-run{display:inline-flex;white-space:nowrap;animation:pgl-t50 linear infinite}
 .v2 .pg-literature .t50-strip:hover .t50-run{animation-play-state:paused}
+/* touch/pen have no :hover — .hold pauses the strip from pointerdown to pointerup (3e) */
+.v2 .pg-literature .t50-strip.hold .t50-run{animation-play-state:paused}
 .v2 .pg-literature .t50-run a{color:var(--mid);text-decoration:none;cursor:pointer;margin-right:22px}
 .v2 .pg-literature .t50-run a:hover{color:var(--ink)}
 @keyframes pgl-t50{from{transform:translateX(0)}to{transform:translateX(-50%)}}
diff --git a/site/src/styles/v2-pages/music.css b/site/src/styles/v2-pages/music.css
index d429f5d..1e1e288 100644
--- a/site/src/styles/v2-pages/music.css
+++ b/site/src/styles/v2-pages/music.css
@@ -13,6 +13,8 @@
 .v2 .pg-music .t50-strip{flex:1;min-width:0;overflow:hidden;position:relative}
 .v2 .pg-music .t50-run{display:inline-flex;white-space:nowrap;animation:pgm-t50 linear infinite}
 .v2 .pg-music .t50-strip:hover .t50-run{animation-play-state:paused}
+/* touch/pen have no :hover — .hold pauses the strip from pointerdown to pointerup (3e) */
+.v2 .pg-music .t50-strip.hold .t50-run{animation-play-state:paused}
 .v2 .pg-music .t50-run a{color:var(--mid);text-decoration:none;cursor:pointer;margin-right:22px}
 .v2 .pg-music .t50-run a:hover{color:var(--ink)}
 @keyframes pgm-t50{from{transform:translateX(0)}to{transform:translateX(-50%)}}
```

## Registro

| Passo | Data | Resultado |
|---|---|---|
| Diagnóstico P2 + reprodução P3 + diff aplicado | 13/10 | este arquivo |
| OK do Bob (A-C) | 15/10 | P2 aprovado; P3 aprovado COM EXTENSÃO a Cinema e Literatura (mesmo diff, 3 páginas); ordem aprovada |
| Deploy do site | 16/10 | pages deploy 76bb5b0c (branch production), 00:44 UTC · bundle assets/index-D5S1FC05.js servido pelo domínio · regra .navskel presente na folha carregada · 100 âncoras com data-i em Música, Cinema e Literatura · sonda desktop (hover pausa; clique real): Música #8 The One That Got Away → card THE ONE THAT GOT AWAY / Katy Perry; Cinema #2 The Odyssey → H3 The Odyssey; Literatura #2 YESTERYEAR → H3 YESTERYEAR · teste de toque: Bob |
| Commits | 16/10 | ACEITE do Bob (header sem flicker, toque no ticker abre o item sob o dedo, sondas verdes) · P2: header: skeleton de sessao no primeiro paint · P3: ticker: clique acerta o item sob o cursor (musica, cinema, literatura), o commit que traz esta linha |
