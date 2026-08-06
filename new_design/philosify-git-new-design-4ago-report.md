# GIT — rastrear `new_design/` · PASSO 1 (só leitura)

**Data:** 4 Ago · **Branch:** `redesign/v2`
**Nada foi staged, nada foi commitado.** Este é o passo de leitura que você pediu antes de qualquer decisão.

---

## (a) O `.gitignore` cobre `new_design/`?

**Não. E a pasta não é totalmente nova para o git — ela já está parcialmente rastreada.**

- Nenhum `.gitignore` do repositório menciona `new_design`.
- `git check-ignore -v` em amostras (`philosify-design-law.md`, `philosify-music.html`, o CSV, o PNG do og-card): **nenhum é ignorado**.
- Os padrões genéricos do `.gitignore` são de credencial e de build (`*.key`, `*.pem`, `*.dev.vars`, `*.log`, `*.msi`…) — nada que alcance `.md`, `.html`, `.png` ou `.csv`.

**Resposta: nunca foi adicionado, não foi excluído deliberadamente.** Não há decisão anterior a respeitar aqui.

**Correção ao enunciado da instrução:** você descreveu a pasta como "~50 arquivos, não rastreados". Os números reais:

| | Quantos |
|---|---|
| já **rastreados** | **7** |
| **não** rastreados | **92** |

Os 7 já versionados vieram de dois commits:

```
1a4c3b0  canon: sync deployed favicon set into new_design
         apple-touch-icon.png, favicon-16x16.png, favicon-32x32.png,
         favicon.ico, icon-192.png, icon-512.png
be8d5ad  Add system map of current frontend/backend for design review
         philosify-system-map.md
```

São 92 arquivos a decidir, não ~50 — e a pasta **não** está inteiramente fora do git, como venho repetindo nos relatórios anteriores. Aquele aviso estava impreciso.

---

## (b) Varredura de segredos — **nenhum achado**

47 arquivos de texto varridos (binários pulados por extensão). Padrões procurados:

`sk-…` (OpenAI) · `sk-ant-…` (Anthropic) · `sk_live_` / `sk_test_` (Stripe) · JWT (`eyJ….….…`) · `AIza…` (Google) · `service_role` · `Bearer <token>` · `xai-…` (Grok) · atribuições a `*KEY|TOKEN|SECRET|PASSWORD`.

**Resultado: nenhuma ocorrência.** Nenhum valor foi impresso em lugar nenhum — a varredura reporta rótulo, arquivo e linha, e aqui não houve o que reportar.

Ressalva honesta: isto cobre padrões conhecidos. Um segredo em formato incomum (uma senha em prosa, um id interno) não seria pego por regex. O que posso afirmar é que **nenhum formato de credencial reconhecível está presente**.

---

## (c) `Supabase Snippet Untitled query.csv`

```
bytes:   1 861
linhas:  76  (1 cabeçalho + 75 de dados)
COLUNAS: 1. column_name
         2. data_type
```

**Nenhuma linha de dados foi impressa**, conforme você determinou.

Mas o cabeçalho já responde a preocupação: **não é export de dados de usuário.** É o resultado de uma consulta ao catálogo do Postgres (`information_schema`) — 75 linhas de *nome de coluna* e *tipo de dado*, ou seja, a descrição de um esquema. Não há PII, não há valores de linha, não há credencial.

Continua **retido** aguardando sua decisão, como você pediu. Só registro que o motivo do receio não se confirma: o risco real dele é ser lixo de trabalho com nome ruim, não vazamento.

---

## (d) Tamanho

**Total: 9,2 MB.** Os dez maiores:

| Tamanho | Arquivo |
|---|---|
| 1 909 KB | `philosify-modules-review.html` |
| 288 KB | `philosify-landing.html` |
| 233 KB | `printscreen 01/print screen spanish/Captura de tela … 235357.png` |
| 227 KB | `printscreen 01/Captura de tela … 150359.png` |
| 217 KB | `printscreen 01/Captura de tela … 150337.png` |
| 209 KB | `philosify-music.html` |
| 208 KB | `philosify-legal.html` |
| 206 KB | `philosify-modals.html` |
| 205 KB | `philosify-news.html` |
| 204 KB | `philosify-unsafezone.html` |

O maior item **não é binário** — é o `philosify-modules-review.html`, com 1,9 MB, sozinho maior que qualquer imagem. Vale conferir se ele não carrega assets embutidos em base64.

### Pasta `printscreen 01/`

**29 arquivos, 3,3 MB.** São capturas de tela do dia 03/08, com nome no padrão `Captura de tela 2026-08-03 HHMMSS.png`, mais uma subpasta `print screen spanish/`.

Observação para a sua decisão: são **um terço do peso da pasta** e o material mais volátil dela — capturas de um dia de trabalho, sem nome que diga o que documentam. Nenhuma outra parte do repositório as referencia. Não sei o que elas provam; você sabe.

---

## PASSO 2 — proposta, **não executada**

| Grupo | O que é | Proposta |
|---|---|---|
| **Incluir** | 45 `.md` + `.html` (Design Law, specs de logo e reshape, protótipos por ala, todos os relatórios) e os 4 PNGs de logo + og-card | entram |
| **Reter** | `Supabase Snippet Untitled query.csv` | sua decisão — é catálogo de esquema, não dado de usuário |
| **Reter** | `printscreen 01/` (29 arquivos, 3,3 MB) | sua decisão |
| **Nada** | varredura (b) | não sinalizou nada a reter |

**Não incluir na mesma operação:** `api/src/ai/prompts/philosopher-panel-template.js`, que segue modificado na árvore de trabalho. Ele pertence à correção do painel e recebe commit próprio depois da ETAPA 4, como você determinou.

**Parado no Passo 1.** Nada staged, nada commitado.
