# ToS v2 — Etapas 2 e 3: Aplicação, Verificação e Diagnóstico de Produção

**Data:** 2026-08-29 · **Branch:** redesign/v2 · **Status:** aplicado no working tree — **nenhum commit, nenhum deploy** (ambos seus, após validação do PT-BR)

---

## 1. O que foi feito

- `docs/philosify-tos-v2-draft-EN.md` → renomeado para **`docs/philosify-tos-v2-canonical-EN.md`** (conteúdo intocado).
- **18 arquivos i18n** (`site/src/i18n/translations/*.json`): `legal.terms.content` substituído pelo ToS v2 (13 seções, HTML no formato da página), `v2.legal.updated` → 29/08/2026 no formato local de cada língua.
- **nl/pl/tr**: `legal.terms.title` traduzido (Servicevoorwaarden / Warunki korzystania z usługi / Hizmet Şartları).
- `site/src/pages/v2/LegalPage.jsx:136`: fallback do ticker → "Last updated // 29 Aug 2026".
- Seção 8 em todas as línguas linka **`/pp`** (caminho relativo), conforme decisão.
- Data efetiva em todas as línguas: **29 de agosto de 2026** (data da aplicação), no topo do texto.
- Build local do Vite: **OK em 56s** — os 18 JSONs compilam nos chunks por idioma.
- Diff completo: **`new_design/TOS_V2_DIFF_2026-08-29.diff`** (169 KB). Diff cirúrgico: 2 linhas por idioma (conteúdo + data), 3 em nl/pl/tr (+ título), 1 no componente. Nada fora do escopo.

## 2. Tabela final: idioma → arquivo → status

| Idioma | Arquivo | Status | Observações |
|---|---|---|---|
| en | translations/en.json | **substituído** (canônico integral) | única edição: link §8 → `/pp`; data efetiva preenchida |
| pt | translations/pt.json | **redigido** (não traduzido) | ⚠️ **aguarda sua validação pessoal** — texto integral abaixo |
| es | translations/es.json | traduzido | "créditos de bienvenida"; Zona Insegura; registro de "usted" |
| fr | translations/fr.json | traduzido | "crédits de bienvenue"; Zone Dangereuse; espaços finos francesas « » |
| de | translations/de.json | traduzido | "Willkommens-Credits"; Unsichere Zone; aspas „…" |
| it | translations/it.json | traduzido | "crediti di benvenuto"; Zona Insicura; registro "tu" (coerente com a UI) |
| nl | translations/nl.json | traduzido | "welkomstcredits"; Onveilige Zone; **título traduzido** |
| pl | translations/pl.json | traduzido | "kredyty powitalne"; Niebezpieczna Strefa; **título traduzido** |
| ru | translations/ru.json | traduzido | "приветственные кредиты"; Опасная Зона |
| tr | translations/tr.json | traduzido | "hoş geldin kredisi"; Güvensiz Bölge; **título traduzido** |
| hu | translations/hu.json | traduzido | "üdvözlő kreditek"; Veszélyes Zóna |
| ar | translations/ar.json | traduzido | "رصيدين ترحيبيين"; المنطقة الخطرة; dígitos latinos (padrão da UI ar) |
| fa | translations/fa.json | traduzido | "اعتبار خوش‌آمدگویی"; منطقه خطر; dígitos persas no corpo, latinos nos preços |
| he | translations/he.json | traduzido | "קרדיטים של ברוכים הבאים"; אזור לא בטוח |
| hi | translations/hi.json | traduzido | "स्वागत क्रेडिट"; असुरक्षित क्षेत्र |
| zh | translations/zh.json | traduzido | "欢迎积分"; 危险区域 |
| ja | translations/ja.json | traduzido | "ウェルカムクレジット"; 危険地帯 |
| ko | translations/ko.json | traduzido | "웰컴 크레딧"; 위험 구역 |

## 3. Invariantes — verificados língua a língua (18/18 OK)

Verificação automatizada (script) + leitura:

| Invariante | Resultado |
|---|---|
| 2 créditos de boas-vindas | ✅ 18/18 |
| 20/US$6.00 · 40/US$10.00 · 100/US$20.00 (literal, sem conversão) | ✅ 18/18 |
| Custos de 1 a 10 créditos | ✅ 18/18 |
| Ressalva do consumidor na Seção 11 **e** na Seção 12 | ✅ 18/18 (termo local: consumer/consumidor/Verbraucher/потребитель/المستهلك/消费者/소비자/…) |
| Seção 7: "não é terapia/aconselhamento/atendimento médico" + busca de ajuda local em crise | ✅ 18/18 |
| bob@philosify.org e Global Goods Corp inalterados | ✅ 18/18 |
| 13 seções, nenhuma adicionada/removida (contagem de `<h2>`) | ✅ 18/18 |
| Link §8 → `/pp` | ✅ 18/18 |
| SHA-256 na Seção 6 | ✅ 18/18 |
| HTML balanceado (p/ul/li/strong/h2/a) | ✅ 18/18 |

Nota de formatação: mantive **"US$6.00 / US$10.00 / US$20.00" literais em todas as línguas** (inclusive PT), para que o invariante seja verificável byte a byte e não haja aparência de conversão. Se preferir "US$ 6,00" no PT-BR (vírgula decimal), é 1 linha — diga na validação.

## 4. ⚠️ PT-BR PARA SUA VALIDAÇÃO (texto integral como será renderizado)

> Armazenado como HTML em `pt.json` → `legal.terms.content`. Abaixo, transcrição fiel.

**Data de vigência:** 29 de agosto de 2026

O Philosify (philosify.org) é operado pela **Global Goods Corp** ("Philosify", "nós"). Ao utilizar o Serviço, você concorda com estes Termos.

**1. O Serviço** — O Philosify oferece análise filosófica de conteúdo cultural — música, cinema, literatura, notícias e ideias — fundamentada em um referencial explicitamente Objetivista. As análises são obras editoriais e interpretativas, geradas com o auxílio de IA. Constituem opiniões, não fatos, e não representam aconselhamento profissional, jurídico, médico, psicológico ou financeiro.

**2. Contas** — É necessário criar uma conta para usar os recursos pagos. Você é responsável por suas credenciais e pela atividade realizada em sua conta. Uma conta por pessoa.

**3. Créditos** — O Serviço funciona à base de créditos.
- Contas novas recebem **2 créditos de boas-vindas**, gratuitamente.
- Pacotes de créditos: **20 créditos por US$6.00 · 40 créditos por US$10.00 · 100 créditos por US$20.00**.
- Cada ação exibe seu custo em créditos antes de você confirmá-la. Os custos variam de 1 crédito (por exemplo, uma análise de música, cinema ou notícia) a 10 créditos (por exemplo, iniciar uma sessão da Zona Insegura).
- Se uma ação falhar por motivos técnicos depois de os créditos terem sido cobrados, eles retornam automaticamente ao seu saldo.
- Créditos não têm valor em dinheiro, são intransferíveis e não podem ser convertidos em moeda. Créditos comprados não expiram enquanto sua conta permanecer ativa.

**4. Pagamentos** — Os preços são fixados em **dólares americanos (US$)** e processados pela Stripe. No checkout, a Stripe pode exibir um valor estimado na sua moeda local; o valor efetivamente cobrado na sua moeda pode variar ligeiramente conforme o câmbio. Salvo quando a lei exigir o contrário, as compras são finais; créditos devolvidos por falha técnica (Seção 3) não são reembolsos, e sim re-crédito automático.

**5. Uso Aceitável** — Você se compromete a não fazer mau uso do Serviço: nada de acesso não autorizado, raspagem de dados (scraping), interferência no funcionamento, engenharia reversa, revenda de conteúdo ou de créditos, nem uso do Serviço para violar qualquer lei ou direito de terceiros. Os espaços de comunidade devem ser usados de acordo com as diretrizes de comunidade publicadas.

**6. Conteúdo e Propriedade Intelectual**
- O **conteúdo da plataforma** (análises, painéis, vereditos, notas e todos os materiais do Serviço) pertence ao Philosify.
- **Sua licença:** concedemos a você uma licença mundial, não exclusiva e isenta de royalties para usar, reproduzir e compartilhar as análises que você desbloquear, para fins pessoais e não comerciais, com atribuição ao Philosify. Cada análise carrega uma assinatura SHA-256 que permite a verificação pública de sua autenticidade.
- **Seu conteúdo:** o material que você enviar (publicações na comunidade, registros da Zona Insegura, preferências) continua sendo seu. Você concede ao Philosify uma licença para processá-lo e armazená-lo na medida necessária à operação do Serviço, nos termos da Política de Privacidade.

**7. Zona Insegura** — A Zona Insegura é uma ferramenta de diálogo socrático para introspecção pessoal. Ela é deliberadamente direta e pode desafiar suas convicções. **Não** é terapia, aconselhamento nem atendimento médico, e não é adequada para situações de crise. Se você estiver em crise, procure imediatamente ajuda qualificada na sua região.

**8. Privacidade** — O tratamento que damos aos dados pessoais está descrito na [Política de Privacidade](/pp), que vigora em conjunto com estes Termos.

**9. Disponibilidade e Alterações** — O Serviço é fornecido "no estado em que se encontra" e "conforme a disponibilidade". Podemos modificar funcionalidades, os preços de compras futuras ou estes Termos; alterações relevantes serão anunciadas no próprio Serviço. O uso continuado após as alterações constitui aceitação. Créditos já comprados conservam os termos vigentes no momento da compra.

**10. Encerramento** — Você pode encerrar sua conta a qualquer momento. Podemos suspender ou encerrar contas que violem estes Termos. Créditos não utilizados são perdidos em caso de encerramento por violação; em encerramentos voluntários, entre em contato conosco antes de fechar a conta para resolver qualquer saldo.

**11. Isenções e Limitação de Responsabilidade** — Na máxima extensão permitida pela lei, o Philosify se exime de todas as garantias, e a responsabilidade total da Global Goods Corp decorrente do Serviço não excederá os valores pagos por você nos doze (12) meses anteriores à reclamação. Nada nestes Termos exclui responsabilidade que não possa ser excluída por lei, incluindo as proteções obrigatórias ao consumidor do seu país de residência.

**12. Lei Aplicável** — Estes Termos são regidos pelas leis do Estado de Nova York, EUA. Qualquer disputa será resolvida nos tribunais estaduais ou federais situados no Condado de Nova York, Nova York, sem prejuízo dos direitos e foros de consumidor de observância obrigatória na sua jurisdição.

**13. Contato** — Global Goods Corp — bob@philosify.org

## 5. 🔴 Mistério da produção — RESOLVIDO

**A produção não serve nem o i18n nem o código morto: serve HTML estático.**

- `philosify.org/tos` (verificado no seu Chrome, 29/08) redireciona para **`/tos/`** e entrega uma página estática de 7 seções — "US$0.60", "Effective Date: November 10, 2025", "← Back to Philosify".
- Origem no repo: **`site/public/tos/`** e **`site/public/pp/`** — `index.html` + 14 variantes por língua (`pt.html`, `ar.html`, …; de março/2026, era de 14 idiomas — sem nl/pl/tr). O Vite copia `public/` inteiro para `dist/` em todo build.
- Mecânica exata (`site/public/_worker.js`, modo avançado do Pages): para `/tos`, o worker faz `env.ASSETS.fetch()` primeiro — o estático responde **200** e o fallback do SPA **nunca roda**. A rota React `/tos` → `LegalPage` é inalcançável em produção.
- Prova final: o build local desta sessão (pós-edição) ainda produz `dist/tos/*.html` e `dist/pp/index.html`. **Um deploy hoje continuaria servindo o texto de novembro.**
- Nada em `site/src` referencia os arquivos estáticos; o curl direto é bloqueado por challenge do Cloudflare (por isso a inspeção foi via Chrome).

### O que precisa acontecer no deploy (decisão sua)

**Opção A (recomendada): apagar `site/public/tos/` e `site/public/pp/` (30 arquivos) antes do build.** O asset some do `dist/`, o `_worker.js` cai no fallback do SPA e o `LegalPage` passa a servir o ToS v2 nos 18 idiomas, no idioma escolhido pelo usuário. Sem mudança de código. Efeitos colaterais: (1) `/pp` também passa a ser servido pelo SPA — com o texto de Privacy **antigo** do i18n (já registrado como próxima tarefa legal); (2) perde-se o HTML estático que crawlers sem JS liam — se SEO das páginas legais importar, dá para regenerar estáticos a partir do texto novo depois.

**Opção B: regenerar os estáticos** com o texto v2 (index + 17 línguas, incluindo nl/pl/tr) — mantém o prerender, mas cria manutenção dupla permanente do mesmo texto em dois formatos.

**Checklist do deploy (Opção A):**
1. OK do Bob no PT-BR (seção 4 acima) e nesta opção.
2. `rm -rf site/public/tos site/public/pp` (aguarda seu OK — não executei).
3. `cd site && npm run build` e conferir que `dist/tos/` **não existe** mais.
4. `wrangler pages deploy dist --project-name=philosify-frontend --branch=production`.
5. Verificar em produção: `/tos` deve carregar o SPA (título "Termos de Serviço" no idioma do usuário, ticker "29 ago 2026"), sem redirecionar para `/tos/`.
6. Purga de cache do Cloudflare para `/tos*` e `/pp*` se o estático persistir (cache de edge).

## 6. Arquivos alterados (working tree, sem commit)

- 18 × `site/src/i18n/translations/*.json` (2–3 linhas cada)
- `site/src/pages/v2/LegalPage.jsx` (1 linha)
- `docs/philosify-tos-v2-draft-EN.md` → `docs/philosify-tos-v2-canonical-EN.md` (rename, arquivo não rastreado)
- Diff completo: `new_design/TOS_V2_DIFF_2026-08-29.diff`

**Pendências do Bob:** ~~validar PT-BR~~ ✅ validado sem alterações (29/08) · ~~decidir Opção A/B~~ ✅ Opção A executada (estáticos removidos) · ~~vírgula decimal~~ ✅ US$6.00 literal em todas as línguas · **commit e deploy (seus)**.

## 7. Execução da Opção A (29/08, pós-validação)

- `site/public/tos/` e `site/public/pp/` removidos (30 arquivos: 15 + 15). Nada mais em `site/public/` foi tocado.
- Rebuild do Vite: **OK, exit 0, 56s**. `dist/tos/` e `dist/pp/` **não existem mais**.
- Chunks compilados carregam o texto novo: en (bundle principal `index-*.js`) US$6.00 ✓ "August 29, 2026" ✓ · pt (`pt-*.js`) US$6.00 ✓ "29 de agosto de 2026" ✓ · zh (`zh-*.js`) US$6.00 ✓ "2026年8月29日" ✓.
- Únicos vestígios de "November 10, 2025" no dist: as chaves `terms.date`/`privacy.date` dos **modais mortos** (não roteados, não importados) — intocados por decisão registrada. Nenhum texto de ToS velho alcançável.
- `git status`: 30 D (estáticos) + 18 M (i18n) + 1 M (`LegalPage.jsx`) — nada modificado fora da lista. Não rastreados novos desta tarefa: `docs/philosify-tos-v2-canonical-EN.md` + 3 arquivos `new_design/TOS_V2_*`. Demais não rastreados (DIAGNOSTICO, LAUNCH_READINESS, MARKET_LAUNCH_PLAN, TAREFA2, 2 migrations, philosify-modules-review.html, printscreen 01/) **pré-existiam à tarefa** e não foram tocados.

## 8. Teste de aceitação pós-deploy (documentado — executar após o deploy do Bob)

1. Janela anônima → `philosify.org/tos` deve carregar o **SPA sem redirecionar para `/tos/`**, com título "Termos de Serviço" e ticker "Última atualização // 29 ago 2026" em PT.
2. Se o texto velho persistir: **purga de cache do Cloudflare** para `/tos*` e `/pp*`.
3. Conferir também `/pp` carregando pelo SPA (Privacy antiga do i18n — revisão é a próxima tarefa legal).
