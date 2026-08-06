# WP7 v3 — Ajustes de cor e "Os Fatos" (31 Jul 2026)

**Deploy:** `b2f5d245` · **Commit:** `08eb46f` · **Branch:** `redesign/v2`
**Lint de tokens:** verde (64 arquivos v2)
**Verificado em produção:** `--ink-mid` = `#D2D2D9`, `--ink-low` = `#5E5E65` intacto,
`.v2 .state` resolve para `--ink-mid`, regra do container OS FATOS carregada.

---

## Item 1 — Cinza do chrome mais claro

`--ink-mid` subiu de `#9C9CA3` para `#D2D2D9` **apenas no tema escuro**.
O tema branco (`#4C4C54`) e `--ink-low` (`#5E5E65`) não foram tocados.

### O conflito que motivou a pergunta

Os rótulos nomeados na instrução original — ANALISANDO, POSIÇÕES FILOSÓFICAS,
telemetria, HUD — **não eram pintados por `--ink-mid`**. Eram `--ink-low`.
Subir o token sozinho não os alcançaria. Daí a Opção 1: subir o token **e**
remapear a camada de rótulo legível.

### Movidos de `--ink-low` para `--ink-mid`

Critério: o texto é informação que o usuário **precisa ler**.

| Rótulo | Superfície |
|---|---|
| Barra superior: idioma, saldo, nome | `.navr a` — já era `--ink-mid`; só clareou com o token |
| Strip "ANALISANDO" + telemetria inteira | `.state` (v2-components.css) — todos os módulos |
| Rótulo do card de veredicto | `.vlabel` |
| Nota declarada ("Nota final +7 · Note 8 de 10") | `.vscore` |
| "POSIÇÕES FILOSÓFICAS", "IDEIAS-CHAVE", "INFLUENCIADO POR" | `sectionLabel` — cartão do filósofo |
| Local de nascimento | `birthplace` — cartão do filósofo |
| Leitura do medidor ("fortemente orientado à razão") | `battleIntensity` — cartão do filósofo |
| Tipo de conexão (INFLUÊNCIA, OPOSIÇÃO) | `connectionType` — cartão do filósofo |
| Datas no painel de conexão | `edgeNodeDates` — mesmo componente |
| Rótulo de seção do cartão de evento histórico | `analysisBadge` — irmão direto do cartão do filósofo |
| Leitura da janela temporal (anos sob o slider) | `rangeLabels` — telemetria do HUD da Constellation |

### Mantidos em `--ink-low`

Critério: label ambiental que só emoldura.

- **HUD da página** — o texto é "Analysis Engine // Active"; emoldura, não informa
- **Cantos do HUD** (`.hc`) — decoração
- **Rodapé**
- **Carimbos de hora** — chat, DM, comentários
- **Placeholders** de todos os campos de busca e texto
- **Contadores** — caracteres, votos, reações, total de enquete
- **Notas transitórias de carregamento** (`.srload`, `.loadnote`)
- **Metadados discretos** — bandeira de idioma do membro, idioma do grupo,
  seta decorativa do painel de conexão
- **Rótulos de cabeçalho de busca e de seção dos módulos** (`.srhead`, `.slabel`,
  subtítulos de escola nos cards do painel)

### Onde a fronteira ficou

O **cartão do filósofo inteiro subiu** — é o conteúdo que o usuário abriu o
painel para ler. O **HUD da página não subiu** — só emoldura.

Os rótulos de seção dos módulos ficaram do lado ambiental. Se você quiser
movê-los, é uma linha por arquivo.

---

## Item 2 — Prosa de leitura permanece branca

Auditoria completa da prosa do v2.

**Um caso real encontrado:** no manifesto da Unsafe Zone, a classe `.quiet`
prendia frases inteiras em `--ink-low` (`#5E5E65` sobre `#070708`) — abaixo do
limiar de legibilidade para corpo de texto. Mapeado para `--ink-text`.

**Fora isso, nenhum vazamento.** Dentro de `.v2` o alias `--mid` já aponta para
`--ink-text` desde 29 de julho, então news, cinema, literatura, ideias, legal,
sinopses e a racionalidade do veredicto já renderizavam brancas. O próprio
mockup declara `--mid:#F5F5F6`, o que confirma a leitura.

---

## Item 3 — Scorecard da Constellation em mono

| Elemento | Antes | Agora |
|---|---|---|
| Trilho | `--line` | `--ink-low` |
| Preenchimento | cor por eixo (ouro/ciano/magenta/…) | `--silver` |
| Nome do eixo dominante | cor por eixo | `--ink-text` |
| Nome do eixo oposto | `--ink-low` | `--ink-mid` |
| Valor numérico | `--ink-hi` | `--ink-text` |
| Marcador de zero | `--line-strong` | `--bg` |

O marcador de zero mudou porque sobre o preenchimento prateado ele desaparecia,
e ele existe para marcar o centro da escala — **funcionalidade não se sacrifica**.

O mapa `BATTLE_COLORS` — ouro, ciano, magenta, lima, tomate, roxo, rosa-choque,
verde-mar — foi **apagado do código**, junto com dois imports mortos que
sobravam em outros dois arquivos. Não resta nenhuma referência.

**A cor de escola no mapa não foi tocada** — é dado, e continua sendo o único
acento colorido da Constellation.

---

## Item 4 — Container OS FATOS, perguntas em branco bold

**Causa.** Existe uma única regra pintando ênfase na prosa de notícias, e ela
vale para os quatro campos:

```css
.v2 .pg-news .prose :where(strong,b,em){color:var(--silver);font-weight:400}
```

Os rótulos das perguntas caíam nela — saíam prateados e sem peso.

**Correção.** Classe `facts` no container e override escopado:

```css
.v2 .pg-news .facts .prose :where(strong,b){
 font-family:var(--fu);font-weight:500;font-size:15px;color:var(--ink-text)}
```

Os 15px compensam a altura-x maior do Inter dentro do corpo em Newsreader.
O `<em>` mantém o registro prateado. FRAMING, RELIABILITY e PHILOSIFY OPINION
seguem inalterados.

**Nada de guia, nada de `<hl>`.** O draft do `<hl>` segue intacto aguardando
sua leitura.

### Ressalva honesta

O navegador desta sessão não está logado, então **não consegui ler o corpo de
uma análise real** para confirmar em que forma exata os rótulos chegam. A
existência da regra que os pintava de prata é a prova de que ênfase chega
marcada — mas se o modelo estiver emitindo markdown cru (`**O quê:**`), você
veria asteriscos em vez de negrito, e o conserto seria outro. Você confirma
abrindo qualquer análise.

---

## Dois achados fora da lista — não tocados

**`ads.css`** usa `#9c9ca3` fixo no rótulo do anúncio. Era o tom de `--ink-mid`,
que agora mudou. Continua um cinza-claro válido sobre o scrim preto e o arquivo
está fora do escopo do lint — nada quebrou, apenas deixou de espelhar o token.

**`music-sidebar.css`** tem `strong { color:#c4b5fd }` violeta da paleta antiga.
Verificado em produção: esse arquivo **não carrega** nas rotas v2. É resíduo
dormente da v1, invisível para o usuário.

---

## Arquivos tocados

```
site/src/styles/tokens.css                          item 1
site/src/styles/v2-components.css                   item 1
site/src/styles/v2-pages/unsafe-zone.css            item 2
site/src/styles/v2-pages/news.css                   item 4
site/src/pages/v2/NewsPage.jsx                      item 4
site/src/components/history/ConstellationInfoPanel.jsx    itens 1 e 3
site/src/components/history/HistoricalEventInfoPanel.jsx  item 1
site/src/components/history/TimelineControls.jsx          item 1
site/src/components/history/ConstellationScene.jsx        item 3 (import morto)
site/src/components/history/ConstellationOfIdeas.jsx      item 3 (import morto)
site/src/hooks/useConstellation.js                        item 3 (BATTLE_COLORS)
```

---

## Anexo — a análise errada da Joana

Fora do escopo de cor, incluído aqui a pedido do Roberto para ficar registrado.

> **Continuação:** a auditoria retroativa, a purga do cache e a checagem dos
> demais módulos estão em **`philosify-lyrics-audit-31jul-report.md`**.
> Uma correção ao texto abaixo: o fluxo tem **duas** fontes de letra — Genius e,
> como fallback, Letras.mus.br. **As duas tinham o defeito.** O Letras
> redireciona um slug desconhecido para outra música do mesmo artista e responde
> 200 com letra de verdade, então o conserto do Genius sozinho não fechava o
> buraco. Corrigido em `c74448d`. A recusa só ocorre quando as duas falham.

### Causa

Duas fontes alimentam uma análise. **Spotify** dá título, capa, ano e preview —
achou Joana corretamente, por isso a tela inteira parecia certa. **Genius** dá a
letra, e o Genius não tem Joana.

A ausência não é o problema. O problema é o que o código fazia com ela: a busca
do Genius **ordena por relevância de artista**, então ao pedir uma faixa que ele
não indexa ele não responde "não tenho" — devolve as *outras* músicas daquele
artista. Pediu Joana do Bob Rach, veio Realize do Bob Rach.

E o código validava **apenas o artista**. Conferia "é Bob Rach? é" e pegava o
primeiro resultado, sem nunca conferir o título. A letra de Realize foi entregue
à IA, que analisou fielmente o que recebeu; a interface, alimentada pelo Spotify,
exibia Joana em volta.

Em uma frase: *"não tenho essa música"* virou silenciosamente *"toma outra música
do mesmo artista"*.

### Por que é grave, e não cosmético

O registro salvo diz que é a análise de Joana; as notas são de Realize. E notas
são imutáveis por `(música, artista, modelo)` — por desenho. Aquele registro
virou **a resposta em cache permanente** para Joana naquele modelo: quem pedir
Joana recebe Realize instantaneamente, sem nova chamada de IA. Não se autocorrige.

### Conserto — já em produção

Commit `71c52b5`, deploy do Worker em 31/07 às 03:53 UTC.
Arquivo: `api/src/lyrics/genius.js`.

- O laço percorre os **10 primeiros** resultados em vez de pegar o primeiro.
- Cada candidato passa por validação de **título** além da de artista.
- A normalização remove acentos, colchetes, parênteses, sufixos tipo
  `- Remastered` e pontuação — para "Não Vou Me Adaptar" casar com
  "Nao Vou Me Adaptar (Ao Vivo)".
- Cada descarte fica logado: `[Genius] Skipped "Realize" — not "Joana"`.
- Se nenhum casar, retorna nulo.

**Escolha deliberada: falhar alto em vez de baixo.** Sem letra a análise não roda
— devolve `LYRICS_NOT_FOUND`, e a reserva de crédito é liberada (verificado em
`index.js`: caminho de resposta não-ok chama `releaseReservation`).

**Custo a saber:** algumas músicas que "funcionavam" antes passam a recusar. Elas
nunca funcionaram — estavam mentindo. Joana é uma delas: enquanto o Genius não a
tiver, ela não terá análise.

### O que continua pendente

1. **O registro errado da Joana ainda está no banco.** Imutável por desenho e sem
   endpoint administrativo para removê-lo. Precisa de deleção no Supabase — a
   tabela tem `deleted_at`, então dá para soft-delete sem destruir o histórico.
   Preparo o SQL exato quando você mandar.

2. **Outras músicas podem estar contaminadas.** As letras ficam gravadas na tabela
   `songs`, o que torna a detecção precisa em vez de heurística: para cada música
   armazenada, consultar o Genius e verificar se algum dos 10 primeiros resultados
   tem título compatível. Se nenhum tiver mas houver letra gravada, aquela letra
   veio de outra faixa. O script só lê e produz a lista para você decidir.

---

## Pendências suas

1. **Migração `009_ads_30s_duration.sql`** no Supabase — só depois disso subo a
   interface do Ateliê (está construída e commitada, não deployada de propósito).
2. **Análise errada da Joana** — deleção no Supabase e, se quiser, o script de
   detecção das demais. Detalhes no anexo acima.
3. **Draft do `<hl>`** — nada aplicado em guia ou KV, aguardando sua leitura.
