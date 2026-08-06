# SHARING — meta OG localizadas + permalink de painel e debate

**Instrução:** 1 Ago · **Execução:** 1 Ago
**Branch:** `redesign/v2` · **Commit:** `2404dc1`
**Deploys:** Worker `509b56af` · Pages `75ca91ae`

Esta instrução se sobrepôs à correção do permalink de painel/debate que você tinha aprovado minutos antes. Executei as duas como uma coisa só, porque a segunda depende da primeira: não adianta localizar o card de um link que não leva a lugar nenhum.

---

## 1. O que estava errado

Dois defeitos empilhados.

**(a) O card não falava a língua da análise.** Já diagnosticado e corrigido ontem: philosify.org é Pages servindo o mesmo `index.html` estático para todo caminho, e o crawler do WhatsApp não executa JavaScript. Corrigido em `_worker.js`.

**(b) O painel e o debate não tinham permalink.** O botão de compartilhar gerava `api.philosify.org/api/share-preview/panel/:id`, que devolvia um HTML de rodapé com `<meta http-equiv="refresh" url=https://philosify.org>`. O card aparecia; quem clicava caía na **home**. O conteúdo compartilhado era inalcançável.

---

## 2. Permalinks — os três agora existem

| Rota | Estado antes | Agora |
|---|---|---|
| `/a/:slug`, `/shared/:id` | existia, migrada para v2 ontem | inalterada |
| `/panel/:id` | **não existia** | nova página `PanelPermalink.jsx` |
| `/debate/:id` | já existia (`Router.jsx:135` → `/ideas?debate=`) | inalterada, só passou a ser o alvo do botão |

A página do painel lê `GET /api/panel/:id`, que já era pública e sem autenticação. Painéis são gravados no KV **sem TTL** — o comentário no código diz por quê: *"user paid credits, analysis must be permanent"*. O permalink não expira.

**Os 14 pontos de `shareUrl` foram repontados** para o site em vez da API: 10 de painel (Music, News, Cinema, Literature e os quatro sidebars v1) e 4 de debate/colóquio (DebatePanel ×2, DebateDetail, ColloquiumDetail).

**Links já compartilhados continuam funcionando e melhoram:** os dois stubs HTML antigos foram mantidos — há links no WhatsApp de outras pessoas apontando para eles — mas o `<meta refresh>` deixou de mandar para a home e passou a mandar para `/panel/:id` e `/debate/:id`. Quem clicar num link antigo agora chega ao conteúdo.

---

## 3. O card — conteúdo específico, veredito, idioma certo

Endpoint novo: `GET /api/share-card/{a|panel|debate}/:id`, read-only, **nunca conta visualização** (o RPC `get_shared_analysis` conta, e um link é pré-visualizado por todo crawler que o toca — contar isso queimaria o teto antes de um humano abrir).

**Título** — passou do slogan institucional para o conteúdo, no formato que você pediu:

```
antes:  Philosify - Algorithmic Philosophical System for Cultural Analysis
agora:  <obra> — <autor> · <veredito> · Philosify
painel: <obra> — <autor> · Painel de Filósofos · Philosify
debate: <tema> · Debates · Philosify
```

**Descrição** — veredito + fragmento do racional, no idioma do item, truncado em 200 caracteres numa fronteira de palavra.

**Idioma nos 18 locales.** A descrição não é traduzida: é o texto que a própria análise já tem, no idioma em que foi gerada. Não existe camada de tradução para divergir, e a Language Integrity Rule (pt-BR) vale automaticamente porque o texto vem da análise, que já sai em pt-BR desde o deploy `d85d07c`.

O veredito é a única coisa que precisa de tabela. Em vez de escrever 18 × 10 strings à mão — que divergiriam da interface na primeira vez que você mudasse uma palavra —, `api/src/config/share-labels.js` é **gerado a partir de `site/src/i18n/translations/*.json`**, os mesmos arquivos que a UI lê. Cabeçalho do arquivo diz isso e manda regerar. Conferido: 18 locales, nenhum rótulo faltando.

```
pt: Extremamente Revolucionária    ja: 極めて革命的
ko: 철학자 패널                      de: Debatten
```

**Guarda contra um erro sutil:** análises de News guardam o *tipo de mídia* em `classification` (`"news"`), não um veredito. Sem proteção, o card diria "… · news · Philosify". `isVerdict()` só aceita os dez vereditos canônicos; qualquer outro valor some do card. Verificado no link real: o card do Estadão sai sem veredito, corretamente.

---

## 4. og:image — confirmada

`https://philosify.org/brand/philosify-og-card.png`, URL absoluta, presente em `public/brand/` e no build publicado. Abri o arquivo: fundo preto, coruja v2 em traço branco, lockup "philosify", assinatura "THE FINAL WORD IS ALWAYS YOURS". É o branding v2. Não é o card antigo.

---

## 5. Verificação em produção

**Análise (`/a/uWvB7ml5`)** — com UA de crawler do Facebook:

```
<html lang="pt">
<title>Análise | Inviável nas urnas, Zema disputa Planalto… — Estadão · Philosify</title>
og:description  O quê: O governador Romeu Zema foi confirmado como candidato do Partido Novo…
og:url          https://philosify.org/a/uWvB7ml5
og:image        https://philosify.org/brand/philosify-og-card.png
twitter:*       idem, com twitter:url no permalink
```

**Endpoints** — `share-card/a` devolve `ok:true` com título e descrição em pt; `share-card/panel` e `share-card/debate` com id inexistente devolvem `{"ok":false}`; o alias antigo `/api/share-preview/a/:slug` continua respondendo (a deployment de rollback protegida até 06 Ago ainda o chama).

**Rotas** — `/panel/<inexistente>` e `/debate/<inexistente>` devolvem HTTP 200 com a página intacta e o card genérico. Degradam sem quebrar.

**Página do painel renderizada** — não verificada. Ver abaixo.

---

## 6. O que falta — preciso de dois links seus

Não tenho como gerar um painel nem um debate: criar exige sessão autenticada e créditos. Sem um id real, três coisas ficam sem prova empírica:

1. O card de um **painel** real (título com "Painel de Filósofos", descrição com os filósofos + trecho).
2. O card de um **debate** real.
3. A página `/panel/:id` renderizando um painel de verdade (o código está deployado e a rota responde; falta ver o conteúdo na tela).

**Manda dois links** — um painel e um debate, do jeito que o botão de compartilhar gera agora — e fecho os três. Os links são públicos por natureza.

O item 5 da sua instrução diz "testar cada um compartilhando no WhatsApp e conferindo o card real". Essa parte é sua: eu verifico o HTML que o WhatsApp lê (é exatamente o que ele consome), mas não mando mensagem no seu WhatsApp.

---

## 7. Pendências herdadas, ainda abertas

- Índice `pricing_config_active_unique` — nunca confirmado criado. Único item bloqueante da auditoria de fechamento.
- Diff consolidado do guia do News (pt-BR + `<hl>`) — aguarda aprovação, nada subiu ao KV.
- Contagem de análises em cache geradas em pt-PT — SQL pronto, nunca rodado.
- `new_design/` inteiro está **fora do git**. Um `git clean` apaga a Design Law, os mockups e todos estes relatórios.
