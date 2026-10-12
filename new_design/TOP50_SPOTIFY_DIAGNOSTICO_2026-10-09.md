# TOP 50 · DIAGNÓSTICO — ticker de música não reflete o Spotify

**Status:** DIAGNÓSTICO somente leitura · 09/10/2026 · **nada aplicado**. Conserto mínimo no § 5 aguarda OK.
**Pergunta do Bob:** o ticker deveria refletir o Top 50 Global do próprio Spotify; o marquee roda, mas os títulos parecem os mesmos há semanas.
**Resposta curta:** os títulos são os mesmos há **37 semanas** (desde a semana de 18/01/2026). A corrente cron → Spotify → tabela → ticker está **inteira e viva**; o que ela lê é uma **playlist própria da Philosify, cópia manual** do Top 50 Global feita em 22/01/2026 e nunca mais tocada. O Spotify não deixa o app ler o Top 50 Global oficial (restrição da Web API de 27/11/2024 para apps sem *extended quota mode*), e foi por isso que a cópia manual existiu.

---

## 1. Cadeia atual

| Elo | Onde | Fato |
|---|---|---|
| Fonte | `api/src/handlers/top10.js:13` | `TOP_50_GLOBAL_PLAYLIST = "3gkmUxBX2zrKL0eQv6mwN4"`, comentário: "Philosify's own playlist (copy of Top 50 Global)". Dona: **Philosify**, pública, 50 faixas |
| Leitura | `top10.js:24-70` `fetchSpotifyTop10` | token *client credentials* (`getSpotifyToken`) → `GET /v1/playlists/{id}/tracks?limit=50`. Nenhum endpoint de charts; é a playlist, na ordem em que está |
| Gatilho | `api/index.js:4500-4519` `scheduled()` | bloco `if (hour === 12)` → `if (getUTCDay() === 0)` → `handleScheduledTop10(env)`: **domingos, 12h UTC**. Também exposto em `POST /api/top10/refresh` com `ADMIN_SECRET` (`index.js:594`) |
| Armazenamento | `top10.js:160-245` `saveFeaturedSongs` | tabela **Supabase `featured_songs`**: apaga a semana corrente, desativa as anteriores (`is_active=false`), insere 50 linhas com `week_start` (domingo) e `updated_at`. Não usa KV |
| Entrega | `top10.js:255` `GET /api/top10` | `featured_songs?is_active=eq.true&order=position` → `{ week_start, tracks }`. `week_start` é **calculado na hora da requisição** (`getWeekStart()`), não lido da tabela: parece sempre atual mesmo com conteúdo velho. `Cache-Control: max-age=3600` |
| Ticker | `site/src/components/TopTenTicker.jsx:20` | `fetch(API_URL + '/api/top10')`, usa `song_title, artist, spotify_id, is_free` |

## 2. Refresh

- **Cron existe e está entre os 5 do `wrangler.toml:109`:** `"*/5 * * * *"` e `"0 12 * * *"` ambos disparam às 12h; a checagem `hour === 12` dentro de `scheduled()` é satisfeita por **cada tick de 5 min entre 12:00 e 12:55** (12 execuções por domingo; a última grava por cima). Colateral, não causa.
- **Última execução, pela própria tabela:** domingo **04/10/2026 12:55:51 UTC**, 50 linhas, `week_start=2026-10-04`, `is_active=true`. Antes: 27/09 12:55:23, 20/09 12:55:34, 13/09 12:55:02 … **toda semana desde 18/01/2026, sem falha** (37 semanas, 1 842 linhas acumuladas: 50 ativas + 1 792 inativas, nunca apagadas).
- **Último payload:** `GET /api/top10` hoje devolve 50 faixas; as 10 primeiras estão no § 3. Logs históricos do cron não são consultáveis por CLI (só o dashboard); a tabela é a prova.

Logo: **o refresh roda e grava toda semana.** O que ele grava é sempre o mesmo, porque a fonte não muda.

## 3. Idade do conteúdo (conferido ao vivo, 09/10/2026)

**Desde quando é igual:** a assinatura (posições 1, 2, 3 e 10) é idêntica em todas as 37 semanas de `featured_songs`, de `2026-01-18` a `2026-10-04`. Na página pública da playlist no Spotify, as faixas visíveis mostram **"Date added: Jan 22, 2026"** (7 primeiras linhas lidas; a lista é virtualizada e o restante não foi rolado). Cópia feita em 22/01/2026, nunca atualizada.

**Nosso ticker (= `/api/top10` = playlist Philosify, 10/10 iguais) vs Top 50 Global oficial do Spotify hoje** (embed público de `37i9dQZEVXbMDoHDwVN2tF`, cruzado com o chart diário global de 07/10 no kworb):

| # | Nosso ticker | Top 50 Global do Spotify hoje |
|---|---|---|
| 1 | End of Beginning — Djo | BbY WOW — KAROL G, Judeline, rusowsky |
| 2 | The Fate of Ophelia — Taylor Swift | Nicole Kidman — ADÉLA |
| 3 | I Just Might — Bruno Mars | Ain't In LA — ADÉLA |
| 4 | back to friends — sombr | the cure — Olivia Rodrigo |
| 5 | Golden — HUNTR/X, EJAE, AUDREY NUNA, REI AMI | Patient Zero — Taylor Swift |
| 6 | Man I Need — Olivia Dean | Earrings — Malcolm Todd |
| 7 | WHERE IS MY HUSBAND! — RAYE | Stop The Wedding! — Ashe |
| 8 | Lush Life — Zara Larsson | The One That Got Away — Katy Perry |
| 9 | Die On This Hill — SIENNA SPIRO | stupid song — Olivia Rodrigo |
| 10 | So Easy (To Fall In Love) — Olivia Dean | Beauty And A Beat — Justin Bieber, Nicki Minaj |

**Batem: 0 de 10.** Nenhuma faixa do nosso top 10 está no top 10 real.

## 4. Veredito

A corrente **não quebra**; ela está apontada para uma fonte estática. Causa exata, em dois níveis:

1. **Imediata:** a fonte é uma playlist própria, cópia manual de 22/01/2026. Ninguém a atualizou desde então; o cron semanal relê fielmente as mesmas 50 faixas e regrava a tabela (daí `updated_at` sempre recente e `week_start` sempre da semana, mascarando a idade).
2. **De fundo (por que a cópia existe):** desde **27/11/2024** a Web API do Spotify não entrega playlists editoriais/algorítmicas da própria Spotify (Top 50 Global incluído) a apps em *development mode* ou registrados após essa data: `GET /playlists/{id}` responde **404** como se não existissem. Só apps com *extended quota mode* aprovado continuam lendo. O app da Philosify evidentemente não tem (não consigo verificar o dashboard do Spotify; se tivesse, o código apontaria para `37i9dQZEVXbMDoHDwVN2tF` e não para uma cópia). Token e scope não são o problema: *client credentials* lê playlists de usuário normalmente, e é exatamente o que funciona toda semana.

Descartados: cron morto (roda), id de playlist mudado (é o mesmo e responde), token sem scope (lê), erro silencioso no save (as linhas estão lá, semana a semana).

## 5. Conserto mínimo (proposta, para OK)

O cron, a tabela e o ticker ficam. Troca-se **só a fonte** dentro de `fetchSpotifyTop10`, com fallback.

**Opção A — chart público via kworb (recomendada como mínimo com cadência real).** `kworb.net/spotify/country/global_daily.html` publica diariamente o Spotify Global Daily (posições, artista, título e, nos links, o **id Spotify da faixa**: `../track/<id>.html`). O cron de domingo passa a ler essa página, extrai as 50 primeiras `{position, song_title, artist, spotify_id}` (os mesmos campos que gravamos hoje) e segue para `saveFeaturedSongs`. Se a página falhar ou vier com menos de 50 linhas válidas, **não grava** e mantém a semana anterior ativa (fallback ao payload anterior, que é o comportamento natural da tabela). Custo: zero quota Spotify (a chamada ao Spotify some), 1 `fetch` por semana. Risco: fonte terceira sem SLA nem API; HTML pode mudar; o parser tem de ser defensivo e a falha tem de aparecer no log. Opcional: se preferir diário em vez de semanal, é só mudar a condição do cron; a tabela já suporta.

**Opção B — Extended Quota Mode no Spotify (caminho oficial, em paralelo).** Pedir a extensão no dashboard do app (requer descrição do caso de uso, screenshots, revisão humana; prazo de semanas, sem garantia). Aprovada, o código volta a ler `37i9dQZEVXbMDoHDwVN2tF` direto, 1 chamada por semana. Zero código até lá; não resolve agora.

**Opção C — manter a cópia manual.** É o desenho atual: alguém abre o Top 50 Global no app do Spotify e refaz a playlist Philosify toda semana. Funciona, mas depende de disciplina e já falhou por 37 semanas.

**Recomendação:** A agora + B em paralelo. Quando B chegar, A vira fallback.

**Fora do escopo, só registrado:**
- `featured_songs` acumula 50 linhas por semana sem purga (1 842 hoje); um `DELETE` das semanas com mais de N semanas no mesmo cron resolve.
- O bloco `hour === 12` em `scheduled()` executa 12 vezes por hora de cron (`*/5`): a pergunta do dia e o Top 10 são regenerados/regravados 12 vezes aos domingos. Idempotente no efeito final, desperdício em chamadas.
- `GET /api/top10` deveria devolver o `week_start` lido da tabela, não calculado, para a idade ser visível.

**Cinema e literatura (checagem rápida):** não padecem do mesmo padrão. Ambos têm cron próprio (`index.js`: livros a cada 6 h na janela do minuto 10, cinema a cada 3 h na janela do minuto 15), leem **fontes vivas** (NYT, Google Books e Open Library; TMDb) e gravam em KV com TTL (`books:v1:top`, `cinema:v1:top`). Hoje em produção: livros `fetchedAt 2026-10-09T12:10:37Z`, cinema `timestamp 2026-10-09T12:15:40Z`, 50 itens cada. Fonte dinâmica, relida de fato.

## 6. Evidências

- `top10.js` (fonte, leitura, save, handlers), `index.js:4500-4519` (cron), `wrangler.toml:109` (crons), `TopTenTicker.jsx:20` (consumo).
- `featured_songs` lida pela policy pública de leitura com a anon key de `/api/config`: 37 semanas, assinatura idêntica, timestamps de domingo 12:55 UTC.
- Embed público das duas playlists (`open.spotify.com/embed/playlist/…`) e página da playlist Philosify (coluna *Date added*).
- Chart diário global do kworb (07/10/2026) para o cruzamento.
- Anúncio do Spotify: *Introducing some changes to our Web API*, 27/11/2024 (`developer.spotify.com/blog/2024-11-27-changes-to-the-web-api`).
