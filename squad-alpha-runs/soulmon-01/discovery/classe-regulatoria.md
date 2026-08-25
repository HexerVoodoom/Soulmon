# Classe regulatória — Soulmon · run `soulmon-01` · Fase 0

> Autor: `alpha-compliance`. Gravado pelo orquestrador (o agente rodou sem ferramenta de escrita).
> *P3–P8 respondidas por default do HANDOFF, não por escolha explícita do dono.*
> Checagem: 2026-08-25. Base: `contexto.md` §6 (24/08/2026) + repo em `claude/gamification-games-analysis-lk2mok`.
> **P7=B — não existe assessoria jurídica. NADA aqui é parecer jurídico.** Onde a norma não está
> documentada no bloco de contexto, o item vira **pergunta endereçada ao dono**, não conclusão.

> ## ⚠️ CORREÇÃO PÓS-GATE (2026-08-25)
>
> Este artefato foi escrito sob a premissa falsa de que o Soulmon está "em produção, com
> jogadores reais". **Não está — Soulmon tem zero usuários de terceiro; só o DigiApp tem 2
> (o dono e a namorada dele), e é outro app/deploy.** Ver `contexto.md` §1/§3 e `DECISOES.md`.
>
> **O que isso muda neste artefato, por item (ver `gate.md` → Recalibração):**
> - **E1 CAI** — de "reprovado, ação imediata, hoje" para **dívida com prazo** (`D-02`): não
>   há usuário de terceiro do Soulmon exposto; a exposição real, quando existe, é sobre os
>   2 usuários do DigiApp, compartilhando a mesma infraestrutura. Ainda precisa fechar antes
>   de existir o primeiro usuário de terceiro do Soulmon.
> - **E2 PERDE O AGRAVANTE "já vale hoje"** — ninguém pode comprar Crédito (billing
>   inexistente), logo não há reroll pago **acontecendo** em produção. O risco regulatório
>   sobre a mecânica em si permanece (é decisão do dono, D-05: implementar mitigação e
>   seguir), mas não é mais um evento já em curso contra alguém.
> - **E3 e E4 NÃO CAEM** — seguem como estavam: a declaração da Play precisa bater com o
>   código de qualquer forma, antes do lançamento.
> - **E8 CAI** — perfil público compartilhado sem PvP ligado deixa de ser risco de exposição
>   de jogador de terceiro do Soulmon (não há); o mesmo raciocínio de E1 se aplica.
> - **E5/E6 SOBEM** — `D-06` (idade mínima definida em **18+**) transforma o texto de
>   `privacidade.html:111-115` ("não direcionado a menores de 13") de lacuna em
>   **contradição direta com decisão já tomada pelo dono**. Isso é mais grave do que "lacuna
>   a preencher": é um documento publicado que contradiz uma decisão de produto vigente.
> - **Q5 está respondida** (idade mínima = 18+, `DECISOES.md` D-06); Q2 está respondida
>   (mitigar com tela e seguir, D-05); Q4 permanece aberta (Termos ainda não redigidos).
>
> Nenhuma tabela abaixo foi reescrita por inteiro — só as afirmações que ficaram literalmente
> falsas foram corrigidas in loco (marcadas com 🔧), preservando o raciocínio original.

## 4) Exposição — não é mais "hoje, com jogadores reais" 🔧

**`FIREBASE_PROJECT_ID` desligado.** `DEPENDE-DE-VOCE.md:28-41` documenta que `_auth.js:112`
devolve `{ok:true}` e `denyUnlessOwner` é **no-op**: quem souber um e-mail deriva o `saveId`
(algoritmo público) e **lê/sobrescreve o save alheio**.

O save trafega o `gameState` inteiro (`GameStateContext.saveContent.test.tsx:428,463-471`),
incluindo `soulGoal`/`soulStruggle` — **texto livre sobre o que a pessoa tenta melhorar** — e
`soulmonMeta` (`GameStateContext.tsx:191-197`: elemento/alinhamento/reino derivados do perfil
psicométrico e astral).

🔧 **Correção:** não há "jogador real" do Soulmon hoje — zero usuários de terceiro. A
infraestrutura exposta (`digiapp-a5e`, KV `DIGIAPP_SAVES`, Firebase) é compartilhada com o
**DigiApp**, que tem **2 usuários reais** (o dono e a namorada). São eles os titulares de
dado de terceiro que esta exposição, se explorada, atingiria — não um "jogador do Soulmon".
**Rebaixado de incidente-agora para dívida com prazo** (`D-02`), a fechar antes de existir o
primeiro usuário de terceiro do Soulmon, e sem tocar em `digiapp-a5e` para corrigi-lo (a
correção do Soulmon é infraestrutura própria, nova — ver `contexto.md` §10).
Qual norma isso aciona → **Q1**, ao dono.

## 1) Classe regulatória declarada

> Aplicativo de consumo com **(a)** tratamento de dado pessoal de perfil (nome completo,
> data/hora/local de nascimento, respostas psicométricas e texto livre sobre dificuldades
> pessoais), **(b)** monetização com dinheiro real incluindo **um resultado aleatório pago**
> (hoje sem população possível — nenhum billing funciona), e **(c)** sem público infantil
> declarado, com idade mínima **18+ já decidida pelo dono** (`D-06`) mas ainda sem gate de
> idade implementado — hoje distribuído **fora de loja** (web/PWA + APK), com lançamento em
> Play Store previsto (`soulmon-04`), sob conta **pessoal, dev solo, sem CNPJ**.

**Não é hoje "app de saúde":** `PLANO-TAREFAS.md:186` só se aplica se a Fase 4 andar, e ela
está fora de escopo (`contexto.md §10`), agora também bloqueada pela ausência de conta
verificada.

## 2) Exposições

| # | Exposição | Documentado em | Sev | Bloqueia `soulmon-04`? | O que precisa acontecer |
|---|---|---|---|---|---|
| **E1** 🔧 | Autorização de save desligada → save de terceiro (hoje: os 2 usuários do DigiApp) legível/sobrescrevível | `DEPENDE-DE-VOCE.md:28-41`; §6 | 🔴→**dívida com prazo** | Não é mais "hoje" — é antes do 1º usuário de terceiro do Soulmon | Dono liga `FIREBASE_PROJECT_ID` na sequência de deploy da infra própria; decide se houve/pode ter havido acesso indevido aos 2 usuários do DigiApp (**Q1**) |
| **E2** 🔧 | Reroll por Créditos = aleatório pago com dinheiro real; mitigação de tela **não implementada**. Perdeu o agravante "já vale hoje": ninguém pode comprar Crédito hoje (billing inexistente) | `STATUS.md:698`, `DEPENDE-DE-VOCE.md:132-137`; UI real em `CreditsModal.tsx:216,228-229` não menciona equivalência | 🔴 | Sim (bloqueia lançamento; não é evento em curso hoje) | **Resolvido pelo dono (D-05):** implementar mitigação de tela e seguir, assumindo o risco. Texto → `alpha-redator-ux` |
| **E3** | Política afirma que dados de nascimento "nunca são enviados aos nossos servidores" — **verdadeiro para os campos crus**, mas os eixos derivados vão para a nuvem e não estão declarados na §2 da política | `public/privacidade.html:43-73`; `GameStateContext.tsx:191-197`; `App.tsx:2339-2345` | 🟠 | Sim — **não cai** com a correção | Dono decide se derivado de psicometria entra na tabela §2 e no formulário de Segurança de Dados (**Q3**, ainda aberta) |
| **E4** | Formulário de Segurança de Dados da Play pendente | `DEPENDE-DE-VOCE.md:145`, `STATUS.md:711` | 🔴 | Sim — **não cai** | Só o dono preenche; depende de E3 resolvido, senão declara errado |
| **E5** 🔺 SOBE | Política só alcançável em Configurações; **nenhum link de Termos de Uso existe no app** | medido no repo | 🟠→considerar 🔴 junto de E6 | Sim | Dono decide se haverá Termos e onde os dois aparecem no onboarding (**Q4**, ainda aberta) |
| **E6** 🔺 SOBE — vira contradição, não lacuna | Política diz "não direcionado a menores de 13" (`privacidade.html:111-115`), **mas o dono já decidiu 18+** (`D-06`) e não há gate de idade no app. Isso não é mais uma lacuna a preencher: é um documento publicado contradizendo uma decisão já tomada | `privacidade.html:111-115` vs. `DECISOES.md` D-06 | 🟠→🔴 | Sim | **Ação imediata recomendada:** corrigir o texto de `privacidade.html` para refletir 18+ e implementar o gate de idade antes do lançamento |
| **E7** | Anúncio recompensado dá moeda premium; **não está ativo** (sem SDK, gated por flag do servidor) | `monetization.ts:5-7,97-98`, `CreditsModal.tsx:63-65` | 🟡 | Não hoje | Não ligar antes de E6 corrigida. Dono sinalizou (Q11/`DECISOES.md`): manter desligado, custo zero hoje |
| **E8** 🔧 CAI | Perfil público (apelido, nome/estágio do pet, atributos, nº de tarefas) empurrado à nuvem. Sem usuário de terceiro do Soulmon, deixa de ser exposição de jogador de terceiro do Soulmon — mesma lógica de E1 | `GameStateContext.saveContent.test.tsx:463-471`; política §3 declara | 🟡→baixo | Não | Confirmar que "recursos sociais" são opt-in de verdade (`pvpEnabled`) — verificação técnica, e já é item O-4/O-3 de `requisitos.md` por razão comportamental (C3), não regulatória |
| **E9** | LGPD art. 11 / Health Connect / conta de organização verificada | `PLANO-TAREFAS.md:186-187`, `STATUS.md:715` | 🟡 | Não (Fase 4 fora de escopo) | Nada neste run; **agora também bloqueado por §1**: conta será pessoal, sem CNPJ |
| **E10** | Direitos autorais de sprites/nomes | `STATUS.md:697`, `docs/Attributions.md` | ✅ | Não | Encerrado 09/08/2026; guard de prompt (`oracle.ts`) tem teste |

**Veredito por item (atualizado):** E1 **rebaixado a dívida com prazo, ação do dono antes do
1º usuário de terceiro** · E2 **resolvido por decisão do dono (D-05)** · E3 **aprovado com
ajuste, não cai** (alinhar a tabela §2 antes de preencher E4) · E4 **escalado (Q3/Q5 — Q5
resolvida)** · E5 **escalado, subiu de severidade (Q4)** · E6 **subiu — vira contradição
documental a corrigir, não só lacuna** · E7 **aprovado com ajuste** (não ativar antes de E6
corrigida) · E8 **cai, deixa de ser exposição de jogador de terceiro do Soulmon** ·
E9 **fora de escopo, bloqueio reforçado** · E10 **aprovado**.

## 3) Perguntas ao dono (formato `DEPENDE-DE-VOCE.md`, por impacto)

- 🔴 **Q1 — `FIREBASE_PROJECT_ID`: quando liga, e houve acesso indevido — aos 2 usuários do
  DigiApp, não a "jogadores do Soulmon"?**
  *Trava:* a exposição de saves reais (do DigiApp) continua aberta indefinidamente. **Nenhum
  agente da squad pode decidir isso.**
- ✅ **Q2 — RESOLVIDA (D-05):** implementar mitigação de tela e seguir, dono assume o risco
  sem revisão jurídica.
- 🔴 **Q3 — O que exatamente declarar no formulário de Segurança de Dados** sobre os eixos
  derivados do perfil psicométrico/astral que vão ao servidor? *Trava:* E4 e o envio à Play.
  **Ainda aberta.**
- 🟠 **Q4 — Vão existir Termos de Uso, e política/termos aparecem no onboarding ou só em
  Configurações?** *Trava:* trabalho do `alpha-redator-ux` nas telas de entrada e a revisão da
  `privacidade.html` (que ainda diz "última atualização 29/07/2026", e agora também precisa
  corrigir a idade mínima — E6). **Ainda aberta.**
- ✅ **Q5 — RESOLVIDA (D-06):** idade mínima = 18+. **Ação pendente:** gate de idade no app e
  correção do texto de `privacidade.html`.
- 🟡 **Q6 — TTL de 365 dias no save** (`DEPENDE-DE-VOCE.md:127-130`): decisão de retenção de
  dado pessoal ou efeito colateral? *Trava:* a resposta de "por quanto tempo guardamos" em E4.
  **Ainda aberta** (ver `DECISOES.md`, pendências).

## 5) Superfícies que precisam de revisão de texto por implicação regulatória

→ `alpha-redator-ux`, **depois** do veredito de Q4 (Q2/Q5 já resolvidas):

- `src/components/CreditsModal.tsx:208-256` — compra de créditos, confirmação de reroll, rótulo do anúncio (texto de equivalência mecânica, D-05)
- `src/components/UnlockAccountModal.tsx` — compra dentro do jogo
- `src/components/SoulmonOnboarding.tsx:719-761` — coleta de nome completo e data/hora/local de nascimento, **hoje sem aviso de uso**
- a bifurcação do teste de 20 itens antes do reveal (mesmo arquivo)
- `src/components/SettingsPage.tsx:279-283` — privacidade / termos / exclusão de conta
- `public/privacidade.html` §1/§2/§5 — **agora inclui corrigir a idade mínima para 18+ (E6)**
- ficha da Play Store (fora do repo)

**Não redijo o texto exigido por norma** — a redação sai depois do veredito de Q4.
