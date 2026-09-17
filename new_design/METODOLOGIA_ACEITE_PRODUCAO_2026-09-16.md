# Metodologia — ACEITE EM PRODUÇÃO · verificação via extensão Chrome (navegador do Bob) · 16/09/2026

**Pré-requisito (§6) já executado antes desta verificação:** commit `92d7aae` em `origin/redesign/v2`; Pages Production
`d6873efd-52ff-414b-af69-472575a4ee27` (base `92d7aae`). Nada foi alterado durante o aceite — só leitura, navegação e as
ações de usuário descritas em §3.
**Navegador:** Chrome do Bob, logado como bob@bobrach.com, idioma salvo PT (restaurado ao fim). Viewport 1680×839 CSS
(zoom 80%).

## 1. Resultado ponto a ponto

| # | Ponto | Resultado | Evidência |
|---|---|---|---|
| 1a | `/methodology` PT — título | **ok** — h1 "Metodologia" | `01_methodology_pt_topo.jpg` |
| 1b | PT — índice com âncoras | **ok** — 5 entradas `#s1…#s5`; clique em "Como o Philosify avalia" rolou de 0 para 2278px e deixou o h2 a 76px do topo (scroll-margin) | DOM |
| 1c | PT — tabela dos 5 eixos | **ok** — Ética 40% · Metafísica 20% · Epistemologia 20% · Política 10% · Estética 10% (`<table>` sobrevive ao DOMPurify) | `02_methodology_pt_tabela.jpg` |
| 1d | PT — assinatura em itálico | **ok** — `<em>` "Por Bob Rach, fundador do Philosify." com `font-style: italic` | 01 |
| 1e | PT — cinco termos + polo | **ok** — "o real, o verdadeiro, o bom, o justo e o belo" e "Doutrinariamente Conformista" presentes no texto | DOM |
| 1f | `/methodology` EN — título / índice / tabela / assinatura / cinco termos | **ok** — "Methodology"; 5 âncoras (clique na 4ª rolou até `#s4`); Ethics 40% … Aesthetics 10%; `<em>` "By Bob Rach, founder of Philosify." itálico; "the real, the true, the good, the just and the beautiful" e "Doctrinaire Conformist" presentes | `03_methodology_en_topo.jpg` + DOM |
| 2 | Música — análise real ("End of Beginning — Djo", Top 50, gratuita; saldo 11 → 11) | **ok** — bloco `.verdict`: "VEREDITO PHILOSIFY" à esquerda (x 375–522) e "METODOLOGIA →" à direita (x 1189–1305), mesma linha (y 147), link a 26px da borda direita do card; clique levou a `/methodology` (h1 "Metodologia", índice com 5 entradas) | `04_musica_veredito_link.jpg` |
| 3a | Notícias — análise aberta | **ok** — "Retaliação comercial do Canadá aos EUA…" (CNN Brasil); 4 caixas (Os Fatos · Análise da Fonte · Acertos, Erros e Omissões · OPINIÃO DO PHILOSIFY) e "METODOLOGIA →" logo abaixo da quarta, antes do player de áudio | `05_noticias_link_abaixo_caixas_rodape_pt.jpg` |
| 3b | Ideias — veredito | **ok** — colóquio do dia (Emma Goldman vs. Zeno of Elea): "VEREDITO PHILOSIFY" + "METODOLOGIA →" na mesma linha, acima de "Ouvir o veredito" | `07_ideias_veredito_link.jpg` |
| 3c | `/panel/:id` | **NÃO VERIFICADO** — não há painel existente acessível sem id (painéis vivem no KV, sem listagem; o único caminho na UI é gerar um por 3 créditos). Preciso de uma URL `/panel/…` sua, ou autorização para gerar um painel (3 créditos) | — |
| 3d | Compartilhada `/a/:slug` | **ok** — `/a/ZhWIE3sJ` (slug criado pelo botão Compartilhar da notícia acima): 4 caixas + "METODOLOGIA →" abaixo delas | `06_compartilhada_a_slug_link.jpg` |
| 4 | Rótulo PT no polo conformista | **ok** — "Imagine — John Lennon" (em cache, saldo 9 → 9): nota 1, "DOUTRINARIAMENTE CONFORMISTA", pontuação −8.1; racional termina "…daí −8.1: Doutrinariamente Conformista" | `08_rotulo_pt_doutrinariamente_conformista.jpg` |
| 5a | Rodapé PT (módulos) | **ok** — philosify.org · Termos · Privacidade · Metodologia · © 2026 (visto em /music, /news, /ideas) | 05 (rodapé ao pé) |
| 5b | Rodapé ES | **ok** — Términos · Privacidad · Metodología, todos em ES (`/music` com idioma es) | `09_rodape_es.jpg` |

**Aprovado em 12 de 13 pontos; 1 não verificado (painel) por falta de id, não por falha.**

## 2. Divergências e observações (sem correção, conforme instrução)

1. **Nada divergente no escopo da Metodologia.** Todos os pontos verificados batem com o entregue e aprovado.
2. **Observação fora do escopo (Ideias):** o texto do veredito do colóquio renderiza marcação Markdown crua ("# Veredito
   Filosófico: …", "## Seção 1 — …") — visível em `07_ideias_veredito_link.jpg`. Pré-existente, não tocado por este ciclo.
   Fica registrado para a fila.
3. **Rótulo PT antigo:** em nenhuma tela apareceu "Conformista Doutrinária".

## 3. Ações com efeito na conta do Bob durante o aceite

| Ação | Efeito |
|---|---|
| Análise de música "End of Beginning" (Top 50 · FREE) | 0 crédito (saldo 11 → 11) |
| Análise de notícia (CNN Brasil, Canadá/EUA) | **−1 crédito** (11 → 10) — não estava em cache; era necessária uma análise de notícia aberta |
| Link compartilhado `/a/ZhWIE3sJ` | criado (token de compartilhamento da notícia acima) |
| Desbloqueio do colóquio do dia (Emma Goldman vs. Zeno) | **−1 crédito** (10 → 9) — os 50 colóquios listados estavam bloqueados; era necessário um veredito de Ideias aberto |
| Análise "Imagine" | 0 crédito (em cache; 9 → 9) |
| Idioma salvo | pt → en / es durante a verificação → **restaurado para pt** |

Saldo final: **9** (era 11). Nenhum painel gerado.

## 4. Limitações da captura

- A aba de automação ficou **oculta** para o Chrome (`visibilityState: hidden`, janela em segundo plano), e o Chrome
  não pinta abas ocultas: as capturas saem com o quadro defasado/parcial e a parte inferior preta, além de duplicações
  de compositor em algumas (02, 05). Cada captura foi refeita até mostrar o elemento verificado; o que está nas imagens
  é fiel ao DOM medido, mas o enquadramento não é o de uma janela em primeiro plano.
- O navegador de automação secundário (chrome-devtools) cai na verificação anti-bot da Cloudflare em philosify.org e
  **não foi usado** (não contornei).
- A tabela EN não tem captura própria (a PT tem); a tabela EN foi verificada por DOM (5 linhas, pesos corretos).

## 5. Capturas (`new_design/printscreen_metodologia_2026-09-16/`)

01_methodology_pt_topo.jpg · 02_methodology_pt_tabela.jpg · 03_methodology_en_topo.jpg · 04_musica_veredito_link.jpg ·
05_noticias_link_abaixo_caixas_rodape_pt.jpg · 06_compartilhada_a_slug_link.jpg · 07_ideias_veredito_link.jpg ·
08_rotulo_pt_doutrinariamente_conformista.jpg · 09_rodape_es.jpg

## 6. Pendência

- **Painel (`/panel/:id`)**: enviar uma URL de painel existente para eu conferir o link, ou autorizar a geração de um
  painel (3 créditos). O código do ponto é o mesmo `MethodologyLink` em `<p class="methrow">` após os cards do painel,
  coberto pelo build; só falta a vista em produção.

## 7. Fechamento (17/09/2026)

Bob declarou o aceite da Metodologia **COMPLETO** em 17/09 e mandou commitar este relatório com as 9 capturas. A
mensagem trouxe o menu de decisão do ponto 3c literal — `[(a) URL: … | (b) autorizado 1 painel de 3 créditos |
(c) aceito como coberto pelo build]` — sem uma opção marcada. Por isso **nenhum painel foi gerado e nenhum crédito foi
gasto**; o ponto 3c permanece registrado como "não verificado em produção, coberto pelo build" até o Bob indicar (a) ou
(b). Se a intenção era (c), este relatório já reflete o estado final. Placar mantido: 12 ok · 1 coberto pelo build.
