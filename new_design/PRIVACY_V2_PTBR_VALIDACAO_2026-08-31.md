# Privacy v2 — PT-BR redigido, para validação do Bob (ANTES de qualquer deploy)

**Data:** 2026-08-31 · **Status:** EN pronto (canônico integral) + PT-BR **redigido**. Os 16 idiomas restantes
estão **em espera** até você validar este PT-BR. **Nada aplicado nos JSONs, sem commit, sem deploy.**
**Data efetiva/deploy:** 31 de agosto de 2026 (Effective Date + `privacyUpdated`).

> **CORREÇÕES APLICADAS pós-validação (2026-08-31):**
> 1. **"Philosify" masculino** em todas as concordâncias — intro: "**O** Philosify … é **operado** pela Global Goods Corp";
>    §5: "gerada e mantida **pelo** Philosify", "Como **operador** da sala, **o** Philosify pode acessar".
>    (§13 mantém "empresa **operadora**, a Global Goods Corp" — concorda com *empresa*, não com Philosify.)
> 2. **"log de auditoria" → "registro de auditoria"** (verbo ajustado para "gravado" e evitar eco "registrado…registro").
>
> **Auditoria do ToS-PT em produção:** 7 ocorrências de "Philosify", **todas já masculinas**; nenhuma concordância
> feminina encontrada → **sem tarefa separada**. O texto abaixo já reflete as correções.

> Método: PT-BR **redigido** (não traduzido mecanicamente), registro jurídico natural. Termos da UI:
> **Zona Insegura**, **O Underground**, **Créditos**. Seção 5 do Underground **sem "ponta a ponta"**;
> "ponta a ponta" fica **só** nas DMs. HTML final (o que vai no JSON) em `scratchpad/privacy_pt.html`.

---

## ✅ Checklist de invariantes (PT-BR) — conferidos 1 a 1

- **§4 Zona Insegura:** "enviado **exclusivamente à Anthropic**" ✓ · "A exclusão é **física**, não uma marcação lógica" ✓ · "**Nunca** usamos … para **publicidade, perfilamento ou treinamento** de modelos" ✓
- **§5 Underground:** "cifradas **em repouso**" ✓ · "chave da sala é **gerada e mantida pela Philosify**" (KEK: "chave de criptografia de chaves separada") ✓ · "sua identidade fica **oculta dos outros membros, não da plataforma**" ✓ · "**apenas para moderação (quando denunciada) ou por obrigação legal**; … registrado em um **log de auditoria**" ✓ · **SEM "ponta a ponta"** no Underground ✓
- **§5 DMs:** "criptografadas **de ponta a ponta quando ambas as partes possuem chaves**" ✓
- **§12:** "**16 anos** ou mais" ✓
- **§13:** "banco de dados primário … **São Paulo**" ✓ · "processadores … **Estados Unidos e … outros países**" ✓ · "**Global Goods Corp**, está sediada nos **Estados Unidos**" ✓
- **Contato:** **bob@philosify.org** ✓ · **15 seções**, nenhuma add/removida ✓

---

## 🔍 Seção 5 — PT-BR (a mais delicada) — LEIA COM ATENÇÃO

**Mensagens diretas** são criptografadas de ponta a ponta quando ambas as partes possuem chaves de
criptografia (as chaves são geradas no seu navegador e nunca saem dele). Mensagens enviadas sem chaves
ficam armazenadas de forma legível pelo servidor. Os metadados (quem falou com quem, e quando) são sempre
visíveis ao servidor para operar o recurso.

**O Underground:** as publicações são cifradas em repouso: o seu navegador cifra cada publicação e o nosso
banco de dados armazena apenas o texto cifrado. A chave da sala é gerada e mantida pelo Philosify (protegida
por uma chave de criptografia de chaves separada) e entregue por TLS aos membros que desbloquearam o espaço.
As publicações exibem aos demais membros o pseudônimo que você escolheu — a sua identidade fica oculta dos
outros membros, não da plataforma. Como operador da sala, o Philosify pode acessar o conteúdo e a autoria de
uma publicação, e o faz apenas para moderação (quando uma publicação é denunciada) ou por obrigação legal;
cada acesso desse tipo é gravado em um registro de auditoria.

**Espaços públicos e semipúblicos:** o chat da Ágora, as propostas de colóquio (exibidas com o seu nome de
exibição), o ranking do quiz (apelido e pontuação) e as análises que você compartilha por link público são,
por concepção, visíveis a outras pessoas. Os links de análise compartilhada não expõem a sua identidade a
quem os vê.

> **EN de referência (§5, canônico) — Underground:** "…encrypted at rest… The room key is generated and held
> by Philosify (protected by a separate key-encryption key) and delivered over TLS… your identity is hidden
> from fellow members, not from the platform… only for moderation (when a post is reported) or under legal
> obligation; every such access is recorded in an audit log."

---

## PT-BR completo (registro de leitura)

**Data de vigência:** 31 de agosto de 2026

O Philosify (philosify.org) é operado pela **Global Goods Corp** ("Philosify", "nós"). Esta política descreve
quais dados pessoais coletamos, por quê, e quais são as suas escolhas. Vigora em conjunto com os Termos de Serviço.

### 1. O que coletamos
**Dados de conta.** Endereço de e-mail, nome, senha (armazenada como hash pelo nosso provedor de autenticação),
idioma preferido e — se você entrar com o Google — o perfil básico que o Google compartilha (e-mail, nome,
avatar). Opcionalmente, um número de telefone caso você use o recurso de encontrar amigos; os números que você
importa do seu dispositivo para correspondência são comparados de forma transitória e nunca armazenados.

**Conteúdo que você cria.** Análises que você solicita, respostas de quiz, publicações da comunidade, mensagens
diretas, propostas de colóquio e conversas da Zona Insegura. O tratamento específico dos espaços sensíveis está
descrito nas Seções 4 a 6.

**Dados de pagamento.** Os pagamentos são processados integralmente pela Stripe, nas páginas da Stripe. Números
de cartão nunca passam pelos nossos servidores. Armazenamos apenas referências da transação: identificadores de
sessão e de preço, uma referência de cliente e um link para o recibo.

**Dados técnicos.** Endereço IP (usado para limitação de taxa e prevenção de fraude), user-agent do navegador,
país e registros de eventos de segurança. Os endereços IP registrados com impressões de anúncios são excluídos
em até 48 horas.

### 2. Como usamos os dados
Para operar o Serviço: executar análises, manter o seu saldo de créditos, entregar as notificações que você
ativou, manter a comunidade em funcionamento, prevenir fraude e abuso e cumprir a lei. Não vendemos dados
pessoais e não usamos rastreadores de publicidade.

### 3. Provedores de IA
As análises e os diálogos são gerados por modelos de IA de terceiros. O que enviamos a eles é o conteúdo
necessário para a tarefa — nunca o seu nome, e-mail, ID de usuário ou endereço IP:
- **Anthropic (Claude):** conversas da Zona Insegura (exclusivamente) e algumas análises.
- **OpenAI:** algumas análises e a conversão de texto em voz legada.
- **Google (Gemini):** algumas análises, conversão de texto em voz, quizzes e tradução — incluindo mensagens da comunidade que você pedir explicitamente para traduzir.
- **xAI (Grok):** algumas análises.

Esses provedores processam o conteúdo sob os termos de suas APIs; conforme as políticas atuais de API deles,
os dados de API não são usados para treinar seus modelos. O tratamento é regido pelos termos de privacidade de cada um.

### 4. Zona Insegura
A Zona Insegura foi feita para a introspecção pessoal, por isso segue regras específicas:
- Suas conversas ficam armazenadas no nosso banco de dados para que você possa retomá-las e revisitá-las. Elas são visíveis apenas para a sua conta.
- O conteúdo das conversas é enviado exclusivamente à Anthropic para gerar as respostas, sem nenhum identificador anexado.
- **Você pode excluir qualquer sessão, ou todas as sessões, a qualquer momento.** A exclusão é física, não uma marcação lógica.
- Nunca usamos o conteúdo da Zona Insegura para publicidade, perfilamento ou treinamento de modelos, e nossos sistemas não gravam o conteúdo das conversas em logs.

### 5. Comunidade e criptografia
*(ver bloco destacado acima)*

### 6. Cookies e armazenamento local
Usamos apenas cookies essenciais: um cookie de sessão de autenticação (HttpOnly, 7 dias) e um cookie de curta
duração durante o login com o Google. Não há cookies de publicidade ou de rastreamento. O armazenamento local
do seu navegador guarda preferências (idioma, tema) e rascunhos. Como não usamos cookies não essenciais, não é
necessário nenhum banner de consentimento de cookies.

### 7. Monitoramento de erros
Usamos o Sentry para detectar erros e, para uma amostra de sessões, reproduzir sequências de interação
anonimizadas (todo o texto mascarado) a fim de corrigir falhas. Os relatórios de erro são associados apenas ao
seu ID de usuário — nunca ao seu e-mail. Eventos de segurança (como requisições suspeitas bloqueadas) podem
incluir o endereço IP e os dados de navegador da requisição, usados exclusivamente para prevenção de fraude e abuso.

### 8. Notificações
As notificações push usam o serviço de push do seu navegador. Armazenamos o endpoint da sua inscrição e o
identificador do navegador; o conteúdo das notificações fica retido brevemente em nossos servidores (excluído
em 24 a 48 horas após a entrega). Você pode desativar as notificações nas configurações da sua conta ou no seu navegador.

### 9. Prestadores de serviço
Compartilhamos dados apenas com os processadores necessários para operar o Serviço: Supabase (banco de dados e
autenticação), Cloudflare (hospedagem e entrega), Stripe (pagamentos), Resend (e-mail transacional), os
provedores de IA da Seção 3 e catálogos de conteúdo (Spotify, TMDB, Google Books, provedores de notícias) que
recebem apenas as suas consultas de busca. O Google Fonts fornece as nossas fontes tipográficas e recebe dados
padrão de requisição web (IP, user-agent).

### 10. Retenção
- Sessões da Zona Insegura: até você excluí-las.
- Endereços IP de impressões de anúncios: excluídos em até 48 horas.
- Conteúdo de notificações: 24 a 48 horas.
- Registros de conta, créditos e transações: durante a vida da sua conta e conforme exigido para contabilidade e prevenção de fraude.
- Dados excluídos podem persistir em backups criptografados do banco de dados por um período limitado antes de serem rotacionados.

### 11. Seus direitos
Você pode acessar e atualizar o seu perfil nas configurações da conta e excluir o seu conteúdo onde há controles
de exclusão (sessões da Zona Insegura, suas mensagens e publicações). Para exercer outros direitos — incluindo a
exclusão total da conta, o acesso aos dados ou a correção — escreva para **bob@philosify.org**. A exclusão da
conta remove os seus dados pessoais dos nossos sistemas; créditos não utilizados são perdidos na exclusão, e os
registros de transação exigidos por lei são mantidos. Dependendo de onde você mora (inclusive sob a LGPD e o
GDPR), você pode ter direitos legais adicionais, que respeitamos.

### 12. Idade
O Serviço é destinado a pessoas com 16 anos ou mais. Não coletamos intencionalmente dados de menores de 16 anos;
se soubermos que o fizemos, excluiremos esses dados.

### 13. Transferências internacionais
Nosso banco de dados primário está hospedado na América do Sul (região de São Paulo). Alguns dos nossos
processadores — incluindo os de pagamento, e-mail e IA — operam nos Estados Unidos e em outros países, de modo
que os dados enviados a eles são processados nesses locais, com as salvaguardas exigidas pela lei aplicável.
Nossa empresa operadora, a Global Goods Corp, está sediada nos Estados Unidos.

### 14. Alterações
Podemos atualizar esta política; alterações relevantes serão anunciadas no Serviço. O uso continuado após as
alterações constitui aceitação.

### 15. Contato
Global Goods Corp — bob@philosify.org

---

## Próximo passo (após seu OK do PT-BR)

1. Traduzo os **16 restantes** (terminologia da Etapa 1d, diacríticos preservados, invariantes 1 a 1).
2. Aplico os 18 JSONs cirurgicamente (CRLF-aware) + split do ticker + títulos nl/pl/tr.
3. Diff do `LegalPage.jsx`; build; amostragem en/pt/zh no dist.
4. Entrego o diff completo → **seu OK** → commit (autoria Bob) → push → deploy → teste de aceitação.

**Ajustes no PT-BR? Me diga os pontos que eu corrijo antes de propagar aos 16.**
