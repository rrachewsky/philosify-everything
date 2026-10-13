# VASSOURA · V3 · Termos § 2 — idade mínima de 16 anos (×18)

**Status:** RESOLVIDO · deploy 34f07a79 em 13/10/2026, /tos conferido pelo Bob · commit `tos: idade minima de 16 anos (x18)`.
**Pendência legal:** 30/08 (a Política de Privacidade § 12 já diz "16 anos ou mais", `PRIVACY_V2_PTBR_VALIDACAO_2026-08-31.md:27,151`; os Termos nunca ganharam a cláusula espelho).

---

## 1. Onde a frase entra

- Página: `/tos` → `site/src/pages/v2/LegalPage.jsx` (`Router.jsx:159`). Renderiza o HTML da chave **`legal.terms.content`** (sanitizado por DOMPurify) e monta o índice lateral pelos `<h2>`. O legado `terms.section2Content` (`TermsOfService.jsx`) não está roteado: fica como está.
- § 2 em todos os 18 arquivos tem a mesma forma: `<h2>2. <título></h2><p><3 frases: conta para recursos pagos · responsabilidade pelas credenciais · uma conta por pessoa></p>`. Em `fa` o numeral é persa (`<h2>۲. …</h2>`); a âncora do script trata os dois.
- **Ponto de inserção:** a frase nova é a **4ª frase do mesmo `<p>`**, logo após "Uma conta por pessoa." — fecha o parágrafo de contas com a condição de elegibilidade. Uma frase por arquivo, nada mais muda no HTML. **Layout:** texto corrido dentro de um `<p>` já existente, sem novo heading, logo o índice lateral e os anchors `s1..s7` não mudam; conferência visual em `/tos` no build antes do deploy.

## 2. Redação de referência (APROVADA 13/10)

| | Frase |
|---|---|
| **EN** | You must be at least 16 years old to create an account or use the Service. |
| **PT** | É necessário ter pelo menos 16 anos para criar uma conta ou usar o Serviço. |

Terminologia alinhada à Privacidade § 12 ("16 anos ou mais" / "16 years or older") e ao vocabulário do próprio § 2 ("criar uma conta", "o Serviço" com maiúscula, como definido no preâmbulo).

## 2b. As 16 restantes (para conferência; mesmo molde, terminologia de cada arquivo)

Em cada linha, "criar conta" copia o verbo do § 2 do próprio arquivo e "Serviço" copia o substantivo definido no preâmbulo ("Ao utilizar o Serviço…") do mesmo arquivo. O `fa` usa algarismos persas como o restante do seu texto.

| Idioma | Verbo do § 2 · Serviço no preâmbulo | Frase |
|---|---|---|
| es | crear una cuenta · el Servicio | Debe tener al menos 16 años para crear una cuenta o utilizar el Servicio. |
| de | ein Konto anlegen · der Dienst | Sie müssen mindestens 16 Jahre alt sein, um ein Konto anzulegen oder den Dienst zu nutzen. |
| fr | créer un compte · le Service | Vous devez avoir au moins 16 ans pour créer un compte ou utiliser le Service. |
| it | creare un account · il Servizio | Devi avere almeno 16 anni per creare un account o utilizzare il Servizio. |
| nl | een account aanmaken · de Dienst | U moet minstens 16 jaar oud zijn om een account aan te maken of de Dienst te gebruiken. |
| pl | utworzyć konto · Usługa | Aby utworzyć konto lub korzystać z Usługi, musisz mieć co najmniej 16 lat. |
| hu | fiókot létrehozni · a Szolgáltatás | Fiók létrehozásához és a Szolgáltatás használatához legalább 16 évesnek kell lennie. |
| tr | hesap oluşturmak · Hizmet | Hesap oluşturmak veya Hizmeti kullanmak için en az 16 yaşında olmanız gerekir. |
| ru | создать учётную запись · Сервис | Для создания учётной записи и использования Сервиса вам должно быть не менее 16 лет. |
| he | ליצור חשבון · השירות | עליכם להיות בני 16 לפחות כדי ליצור חשבון או להשתמש בשירות. |
| ar | إنشاء حساب · الخدمة | يجب أن يكون عمرك 16 عامًا على الأقل لإنشاء حساب أو استخدام الخدمة. |
| fa | ساختن حساب کاربری · سرویس | برای ساختن حساب کاربری یا استفاده از سرویس باید دست‌کم ۱۶ سال داشته باشید. |
| hi | खाता बनाना · सेवा | खाता बनाने या सेवा का उपयोग करने के लिए आपकी आयु कम से कम 16 वर्ष होनी चाहिए। |
| zh | 创建账户 · 本服务 | 您须年满 16 周岁方可创建账户或使用本服务。 |
| ja | アカウントの作成 · 本サービス | アカウントを作成し、または本サービスを利用するには、16 歳以上である必要があります。 |
| ko | 계정을 만들다 · 서비스 | 계정을 만들거나 서비스를 이용하려면 만 16세 이상이어야 합니다. |

## 3. Datas (DECIDIDO 13/10: atualizar as duas)

Cada arquivo traz **duas** datas de 29/08/2026: a linha `<p><strong>Data de vigência:</strong> …</p>` dentro de `legal.terms.content` e a chave `v2.legal.termsUpdated` ("Última atualização // 29 ago 2026"). Alteração material → **as duas vão para a data do deploy**, no formato que cada arquivo já usa (só dia e mês mudam; ex. `pt` "29 de agosto de 2026" → "<D> de outubro de 2026" e "29 ago 2026" → "<D> out 2026"; `hu` "2026. augusztus 29." → "2026. október <D>."; `fa` em algarismos persas). O script recebe a data como parâmetro no dia do deploy.

## 4. Método (após os pré-flights do banco)

Script no padrão do extrato (inserção textual, CRLF preservado, JSON validado depois): para cada um dos 18, localiza o `<p>` do § 2 pelo `<h2>2.`/`<h2>۲.` e acrescenta a frase antes do `</p>`; substitui as duas datas. Validação: 18/18 com a frase presente uma vez, as duas datas trocadas, nenhuma outra chave alterada, `npm run build`, conferência de `/tos` em pt e en no navegador (índice, âncoras, parágrafo). Deploy do site junto com o restante do ciclo. Commit: `tos: idade minima de 16 anos (x18)`.

## 5. Registro

| Passo | Data | Resultado |
|---|---|---|
| Redação EN/PT + plano | 12/10 | este arquivo |
| OK do Bob (frases + datas) | 13/10 | EN/PT aprovadas como redigidas; as DUAS datas vão para a data do deploy (alteração material) |
| 16 redações | 13/10 | § 2b, para conferência |
| Inserção ×18 + build + /tos | 13/10 | script: 18/18 com a frase uma vez no fim do p do § 2, vigência e termsUpdated → 13/10/2026 no formato de cada arquivo, nenhuma outra chave alterada, CRLF preservado · vite build OK · /tos no preview local: pt, en e he (RTL) com a 4ª frase, as duas datas novas, 13 h2 como antes, sem overflow horizontal |
| Deploy do site | 13/10 | pages deploy 34f07a79 (branch production), 04:17 UTC · bundle assets/index-DVFuDHm5.js · data gravada 13/10/2026 confere com o dia do deploy · conferência de /tos no domínio pelo navegador (abaixo) + olhar do Bob |
| Commit | 13/10 | OK do Bob em /tos (deployment 34f07a79: 4ª frase no § 2, datas 13/10, layout intacto) · 18 JSON + este md: o commit que traz esta linha |
