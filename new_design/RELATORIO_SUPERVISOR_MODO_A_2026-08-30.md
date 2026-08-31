# Underground — Redesenho MODO A (cifragem em repouso)

**Data:** 2026-08-30
**Autor:** Bob Rach
**Status geral:** desenho aprovado; **migração de banco aplicada** e **KEK criado**; **worker implementado e validado** (dry-run verde, ainda não publicado); **frontend em andamento**. Nenhum deploy, nenhum commit.

---

## 1. Sumário executivo

O Underground está migrando de um modelo **E2E por membro** (cada membro guardava uma cópia da chave, com distribuição, fingerprint e rekey) para o **MODO A**: **cifragem em repouso + pseudonimato**, com uma **única chave de sala detida pelo servidor** e protegida por um KEK. A mudança foi motivada por fragilidades **reais expostas no smoke de produção** — o modelo anterior tinha um ponto único de falha que podia deixar a sala permanentemente travada. O MODO A elimina essa classe inteira de problemas e simplifica radicalmente o código.

---

## 2. Por que mudou (o que o smoke expôs)

O modelo anterior dependia do registro da chave pública de cada membro — que, descobriu-se, **nunca funcionou em produção** (um erro de formato base64, já corrigido). Pior: a chave da sala vivia só nos navegadores dos membros; a **perda do keypair do fundador** tornava a chave **irrecuperável** e a sala **inutilizável**, sem caminho de recuperação (o smoke reproduziu exatamente isso). O MODO A remove a dependência de chaves por membro e, com ela, todo esse risco.

---

## 3. Modelo de segurança (o que a Política de Privacidade declarará)

**Cifragem em repouso + pseudonimato — não é E2E.** A sala existe porque o Philosify a abriu, está sempre aberta e não depende de usuário. O **servidor detém a chave** (protegida por um KEK guardado em cofre de segredos). O modelo protege contra **vazamento do banco de dados** e terceiros; o **pseudônimo** protege a identidade **entre membros**; o **responsável pela plataforma lê e conhece a autoria** para fins de moderação. A chave da sala é entregue ao membro autenticado sobre canal seguro (TLS) — isso será declarado explicitamente na Privacidade.

---

## 4. O que muda (arquitetura)

- **Chave única:** gerada uma vez pelo servidor, guardada **cifrada** no banco (nunca em claro), entregue a qualquer membro autenticado quando abre a sala.
- **Posts:** cifrados em repouso; o banco guarda só o texto cifrado. Realtime segue cifrado.
- **Moderação:** o servidor decifra um post específico **sob demanda** (denúncia ou ordem legal), com registro de auditoria.
- **Removidos:** cópias de chave por membro, distribuição, fingerprint, rekey e a exigência de par de chaves para desbloquear. Perda da chave no navegador deixa de ser um problema (o próximo acesso a reentrega).

---

## 5. Status por etapa

| Etapa | Estado |
|---|---|
| Desenho (1 página) | ✅ aprovado |
| Migração de banco (schema + reset) | ✅ **aplicada em produção** |
| Chave-mestra (KEK) | ✅ **criada e guardada em cofre** |
| Backend (worker) | ✅ implementado; **validação de build verde** — não publicado |
| Frontend (site) | 🔄 em andamento |
| Publicação (deploy) | ⏳ pendente (após revisão) |
| Teste de fumaça (2 contas) | ⏳ pendente |
| Commit consolidado | ⏳ pendente (só após o teste passar) |

---

## 6. Moderação e auditoria

A decifra de moderação é uma **rota administrativa** protegida por segredo, limitada por taxa, que responde a falhas **sem revelar detalhe** (padrão de segurança do projeto). **Toda decifra é registrada** numa tabela de auditoria dedicada (quem, quando, qual post, motivo/denúncia) além do log do servidor. Denúncias passam a carregar apenas **referência do post + motivo** — sem cópia de texto legível trafegando do denunciante (o servidor decifra quando preciso).

---

## 7. Riscos e mitigação

- **Perda do KEK = posts ilegíveis permanentemente.** Mitigação: o KEK foi **guardado em gerenciador de senhas** antes de ativar (feito).
- **Chave entregue ao membro:** inerente ao modelo (o membro já lê tudo na interface); protege contra dump do banco sem o KEK, não entre membros. **Declarado na Privacidade.**
- **Nova dependência no servidor** (biblioteca de cifra pequena, para a moderação): sem impacto operacional.
- **Reset limpo:** a sala não tinha conteúdo (0 posts), então o reset e a geração de chave nova **não perdem dados**.

---

## 8. Método (garantias de qualidade)

- Migração e criação do KEK executadas **pelo próprio Bob** (nada sensível automatizado às cegas).
- Cada etapa **apresentada e aprovada** antes de avançar; código não publicado sem validação de build.
- **Nenhum commit até o teste de fumaça passar** — o histórico só registra o pacote inteiro depois de verificado em produção.
- Fragilidades foram **diagnosticadas com evidência** (logs e SQL de produção), não por suposição.

---

## 9. Próximos passos

Concluir o frontend (remoção do fluxo antigo, recepção/entrega da chave, ajustes de interface e traduções) → validação de build → publicar servidor e site → teste de fumaça com duas contas (desbloquear, publicar, tempo real, denúncia, e conferir no banco que o conteúdo fica cifrado e só é legível pela via de moderação) → commit consolidado. **Pendências paralelas** (não neste pacote): renovação de token em loop, saldo no cabeçalho após desbloqueio, validação de apelido.
