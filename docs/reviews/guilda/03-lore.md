# Guilda — significado no universo e vocabulário (lore)

> **Dono:** `soulmon-loremaster` · **Data:** 29/09/2026 · **Estado:** proposta — **nada aqui decide mecânica**
> **Precedência:** código > teste > `CLAUDE.md` > manual > bíblia > este parecer.
> **Fontes lidas:** `docs/NARRATIVA-E-UNIVERSO.md` (§2 L1..L12, §3, §7, §8, §10, §12, §16, §17),
> `src/narrativa.contract.test.ts` (`TERMOS`, `EXCECOES`), `docs/PLANO-COOP.md` §1–3.
> **Revisões obrigatórias antes de qualquer string:** `soulmon-narrative-critic` (bloqueante),
> `soulmon-guarda-linha-vermelha` (veto), `soulmon-ip-brand-guardian` (todo ⚠️ abaixo).
> A string final é do `soulmon-copy-redator`; os textos da §4 são MODELO, não copy.

---

## 0. O que já existe e manda neste parecer

O coop atual (`CoopPanel`, aba "Grupo" da Biblioteca; servidor em `functions/api/community.js`,
ações `coop*`; cliente em `src/utils/community.ts` — `createCoop`/`joinCoop`/`coopCheckin`/`leaveCoop`)
já fixou quatro regras que a guilda **herda**, e que a lore não pode contradizer:

1. **O grupo mostra o progresso COLETIVO e o fato de cada membro ter aparecido hoje (sim/não).
   Nunca quanto cada um fez** (PLANO-COOP §1, §3.3). A lore da guilda não pode ter "quem
   plantou mais".
2. **Sair é um toque, sem penalidade, e a meta encolhe junto** (§3.4).
3. **O grupo nunca manda push sobre quem não apareceu** (§3.3).
4. **Grupo vazio é apagado sem tombstone, sem "seu grupo morreu"** (§3.4).

⚠️ **Tensão com o pedido, e ela é do dono:** o coop foi desenhado com 2–4 membros
("pertencer a três grupos é três cobranças"; grupo pequeno porque no grupo "o outro é o amigo
que a pessoa vai olhar na cara"). O pedido é 5–20. A lore abaixo funciona nas duas escalas;
**o número não é decisão minha** e está na §5.

E uma frase da cosmogonia que decide a escolha do conceito (§3.2): *"nada na Malha foi
construído; tudo foi colonizado."* O que um grupo faz na Malha **não é construir** — é
**dar onde assentar**. Isso elimina metade das leituras de "cidade" antes de começar.

---

## 1. O que uma guilda É no universo

### 1.1 Cosmogonia

Cada criatura assenta para si um trecho da Malha — **o abrigo** (§7.1). O abrigo é de uma
criatura só. O que a Malha nunca teve, até a era **Agora**, é **um trecho que não é de
ninguém em particular e ainda assim é firmado por vários**.

Leitura proposta: quando algumas manifestações passam a se encontrar de forma regular, a
diferença que sobra desses encontros — o que acontece *entre* elas e não pertence a nenhuma —
também precisa de onde ficar de pé. Ela assenta num lugar **fora de todos os abrigos**. Esse
lugar é o que o grupo cultiva.

É uma consequência da era **Agora** (§8: "Encontro"), não uma era nova. Não se inventa
fundador, data nem quem descobriu (§8, §9: fundador vira autoridade).

### 1.2 Geografia

O lugar comum **não é um reino** (reino é clima, §7.2) e **não é um abrigo** (abrigo é de
uma criatura). É um terceiro tipo: um trecho de Malha **sem dono e com várias bordas
encostadas**. Ele toma o clima do reino que quiser, como o abrigo (decisão de arte/produto,
não minha).

### 1.3 Por que ele só cresce

Clima de **floresta** na §7.2: *"crescimento por acréscimo, camada sobre camada; padrão
paciente, que ganha sem trocar."* O lugar comum é assentamento por acréscimo: o que firmou,
fica. Isso não é enfeite — é o que deixa a lore obedecer à **L3** (nada enfraquece por culpa
de ninguém) e à **L4** (acúmulo e marco nunca descem) sem malabarismo.

⚠️ **A regra que sai daqui para a mecânica (proposta, não decisão):** o que o lugar comum
acumulou **não desce nunca** — nem por ausência, nem por saída de membro, nem por derrota na
arena, nem por virada de estação. Se o produto quiser tensão, ela mora na **velocidade** de
crescer, nunca em perda. Se o dono decidir diferente, a lore abaixo não fecha e precisa ser
refeita — não remendada.

---

### 1.4 Três conceitos candidatos

#### A. O Bosque / the Grove ⚠️ — **RECOMENDADO**

| Aspecto | Significado no universo |
|---|---|
| O que é | Videira que achou estrutura comum e cresce sobre ela: cobre tomado, camada sobre camada (a assinatura visual da Malha, §3.5). |
| Estágios (proposta de 5, número é do dono) | **Clareira** (*clearing*): chão comum aberto, ainda sem nada assentado · **Ramagem** (*tangle*) — e não "Muda"/*sapling*, que já é tier de `HABIT_MILESTONES` · **Copa** (*canopy*) · **Mata** (*thicket*) · **Bosque antigo** (*old grove*). Cada estágio é "o quanto já assentou ali", como as faixas do Torneio: **nunca desce**. |
| O que a presença de um membro faz | O dia completo de alguém (o check-in do coop, `coopCheckin`) acrescenta um **fio** (*strand*) ao bosque: um trecho de videira que firma. O fio **não leva o nome de quem trouxe** (PLANO-COOP §1). |
| O que a ausência significa | Nada acontece ao bosque. Videira assentada não seca, não reabsorve (L3, L4). Quem volta encontra o bosque do mesmo tamanho ou maior — **nunca "mais seco"**. |
| Como a arena entra | **A Feira** (§2): em certos dias da maré, as manifestações dos bosques se encontram nas **arenas** (terreno neutro, §7.1). A Feira é costume, não guerra entre lugares: ela não tira nada de nenhum bosque. |
| Por que recomendo | (1) Obedece à §3.2 ("tudo foi colonizado") — bosque cresce, não é construído; (2) já existe no clima `floresta` da §7.2, então não é mundo novo; (3) a arte é a assinatura já decidida (videira sobre cobre, `PROMPT-ARTE-ARCANO-TECH.md`) — zero direção de arte nova; (4) planta tem a leitura cultural de "cresce devagar e sem pressa", que é a tese. |
| Risco que precisa de trava | **Planta real murcha.** Todo mundo sabe que horta sem rega morre — e é exatamente o Habitica que a tese recusa. A lore declara: *videira da Malha não é planta; o que assentou não se desfaz*. Arte **nunca** desenha folha seca, galho caído, cor desbotada. |

#### B. O Povoado / the Hamlet

| Aspecto | Significado |
|---|---|
| O que é | Um conjunto de abrigos encostados, com trechos comuns entre eles. |
| Estágios | Pouso · Vizinhança · Povoado · Vila · Burgo. |
| Presença | Acrescenta **pedra de cobre** / *copper stone* a um trecho comum. |
| Ausência | O povoado fica como está. |
| Arena | Os povoados mandam manifestações à Feira. |
| Por que NÃO recomendo | Contradiz a §3.2 ("nada na Malha foi construído"). **Cidade traz ruína** no imaginário (casa vazia, rua abandonada, manutenção) — é a L3 esperando para quebrar. Puxa hierarquia (prefeito, chefe, cargo). E puxa **contribuição individual visível** ("a casa que a Ana construiu"), que o PLANO-COOP proíbe. |

#### C. O Pouso / the Roost ⚠️

| Aspecto | Significado |
|---|---|
| O que é | Um santuário onde as criaturas do grupo descansam juntas. |
| Estágios | Galho · Poleiro · Pouso · Santuário · Ninho antigo. |
| Presença | Acrescenta **pena** / *plume*. |
| Ausência | O lugar da criatura ausente fica — e aí mora o problema. |
| Por que NÃO recomendo | (1) **Ninho implica ovo e reprodução**, e a §5.11 diz que não há reprodução; o ovo existe só como TELA do renascimento. (2) Se as criaturas "moram" ali, o lugar vazio de quem sumiu fica visível — é L6 e L7 do checklist ("implica espera, solidão da criatura"). (3) Tira a criatura do abrigo, que é dela. |

---

## 2. Vocabulário canônico proposto

Checado contra `TERMOS` de `src/narrativa.contract.test.ts` (`Weave`, `Vírus/Vacina/Virus/Vaccine`,
`Glitchtama`, `domador/treinador/tamer`, `digievolução`, `mundo digital`) e contra a §12.

| Conceito | PT | EN | Registro | Proibido / por quê | Régua |
|---|---|---|---|---|---|
| O coletivo | **Grupo** (UI, já no ar no `CoopPanel`) · **a roda** ⚠️ (mundo) | **Group** · **the circle** ⚠️ | "Guilda" é tolerável como nome interno de projeto; em UI prefira **Grupo** — já existe, e dois nomes para a mesma coisa divergem | "guilda" em UI puxa MMO e hierarquia (mestre de guilda); "clã", "tribo", "facção", "equipe", "time" (competição); "Circle" é genérico mas `ip-brand-guardian` revisa (druid circle de D&D) | limpo |
| O lugar | **o Bosque** ⚠️ | **the Grove** ⚠️ | mundo e UI | "horta", "fazenda", "plantação" (produção, colheita = extração); "cidade"; "base", "QG"; "território" (conquista) | limpo |
| A unidade | **fio** | **strand** | mundo e UI | "semente" / "Semente" **colide com a faixa do Torneio** (`tournamentTiers.ts`); "broto" idem; "folha" (cai — L3); "tijolo" (construção, §3.2); "ponto", "XP", "contribuição" em voz de mundo | limpo |
| Estágios do lugar | Clareira · Ramagem · Copa · Mata · Bosque antigo | Clearing · Tangle · Canopy · Thicket · Old grove | mundo e UI | "nível", "level", "upgrade" (§12); **evitar `sapling`/`sprout`/`seed`/`tree`** — já são tiers de `HABIT_MILESTONES` | limpo |
| A arena de grupo | **a Feira** ⚠️ (acontece nas **arenas**, §12) | **the Fair** ⚠️ | mundo e UI | "guerra", "batalha de clãs", "raide", "conquista"; "Gathering" (⚠️ *Magic: The Gathering*); "liga", "ginásio", "coliseu" (§12) | limpo |
| O ciclo | **a maré longa** (mundo) · **estação** (UI) | **the long tide** · **season** | "maré" já é canônica (§12) | "temporada de ranking", "reset", "wipe" | limpo |
| Quem abriu o grupo | **anfitrião / anfitriã** (UI) · "quem abriu a clareira" (mundo) | **host** | descritivo, sem poder narrativo | "líder", "chefe", "mestre", "dono", "fundador" (§8: fundador vira autoridade), "rei" | limpo |
| Um membro | **quem está na roda** / pelo nome | **someone in the circle** | — | "soldado", "recruta", "membro inativo", "fantasma" | limpo |
| Entrar / sair | **chegar à roda** / **seguir o próprio caminho** | **join the circle** / **go your own way** | — | "abandonar", "desertar", "ser expulso", "trair" | limpo |

**Espalhamento (regra da régua).** Nenhum termo acima casa com `TERMOS`. O risco real é
outro: se a guilda um dia tingir o bosque pelo galho dos membros e alguém escrever o rótulo
de UI (`Vírus`/`Vacina`) num **arquivo novo** (ex.: um `GuildPanel.tsx`), a régua fica
vermelha — o rótulo aceito só vive nos arquivos de `EXCECOES`. Em arquivo novo, galho em voz
de mundo é **Ruptura / Trama / Guarda** (*Rupture / Braid / Ward*), e em EN **Braid**, nunca
`Weave`. O mesmo vale para `Glitchtama`: se a Feira premiar Glitchtama, a string não pode
nascer em arquivo novo — importe o rótulo de onde ele já mora.

---

## 3. Mecânica → significado → a frase que NUNCA pode ser dita

| Mecânica (proposta) | Significado no universo | Nunca dizer | Lei |
|---|---|---|---|
| **Entrar** (convite por código, PLANO-COOP §4) | Uma borda a mais encosta no chão comum. | "Agora você tem responsabilidade com o grupo", "não decepcione ninguém", "o grupo conta com você" | L2, L6 |
| **Sair** (`leaveCoop`, um toque) | A borda desencosta. O que ela ajudou a firmar **fica** — assentado não se desfaz. | "Você abandonou o grupo", "o bosque perdeu X", "sentiremos sua falta", "tem certeza? eles vão ficar sozinhos" | L3, L4, L6 |
| **Contribuir** (dia completo → `coopCheckin`) | Um fio firmou no bosque. Nomeia o ATO, não a pessoa. | "Você é o que mais contribui", "Ana trouxe 9 fios, você 1", "você salvou o grupo", "muito bem!" | L1, L12, PLANO-COOP §1 |
| **Membro ausente** | Nada. O bosque não registra falta; a roda não tem lugar vazio desenhado. | "Fulano não apareceu hoje" em push, "faltando por causa de…", "o grupo esperou você", ícone cinza de "inativo" com contagem de dias | L6, PLANO-COOP §3.3 |
| **Grupo que fica vazio** (apagado na leitura, §3.4) | Sem bordas encostadas, o chão comum volta a ser Malha aberta. Não é término de ninguém: não havia ninguém ali. | "Seu grupo morreu", "o bosque foi abandonado", "ruínas", tombstone | L3, §17 item 11 |
| **Construção que não cresce** numa maré | O bosque está do tamanho que está. Crescimento por acréscimo não tem prazo. | "O bosque está murchando", "precisa de mais fios", "faltam N para não perder", barra que desce | L3, L4, §17 item 6 |
| **Arena — vitória** | Na Feira, as manifestações se encontraram e a sua passou. Nomeia o encontro. | "Seu grupo é o melhor", "vocês são campeões", ranking de grupos acima da faixa | L1, L12 |
| **Arena — derrota** | O encontro terminou para o outro lado. O bosque não muda: a Feira nunca toca o que assentou (L5 — só se aposta o que foi posto na mesa). | "Vocês perderam o bosque", "o outro grupo tomou…", "por culpa de quem não lutou", "derrotados" | L3, L5, L7 |
| **Estação que fecha** | A maré longa virou. O que assentou fica; a Feira reabre na próxima. | "Reset", "tudo zerou", "a estação acabou, você ficou em 14º", "última chance" | L4, §17 item 6 |

---

## 4. Falas do pet e textos-modelo (MODELO — a string final é do `soulmon-copy-redator`)

Regras de fala: curtas, sem emoji na frase falada, a criatura **reage ao agora** (L11) e
**nunca relata desempenho** (L2). O que é informação (quantos fios, estágio) mora no painel,
não na boca da criatura.

| # | Momento | Voz | PT | EN |
|---|---|---|---|---|
| 1 | Convite (tela, antes de entrar) | produto | "Um código te chama para uma roda. Entrar é leve, e sair também." | "A code is inviting you to a circle. Joining is easy, and so is leaving." |
| 1b | | pet | "Tem outras bordas lá. Quer ver?" | "There are other edges out there. Want to look?" |
| 2 | Entrada | pet | "Chão novo. Cheira a videira." | "New ground. Smells like vine." |
| 3 | Primeira contribuição | mundo | "Um fio firmou no bosque." | "A strand settled in the grove." |
| 3b | | pet | "Olha, ficou de pé." | "Look, it's standing." |
| 4 | Marco de crescimento (ex.: Ramagem → Copa) | mundo | "O bosque fechou copa." | "The grove has grown a canopy." |
| 4b | | pet | "Tá mais alto que eu agora." | "It's taller than me now." |
| 5 | Retorno após ausência (idêntica para 2 ou 40 dias — §17 item 5) | pet | "Oi. O bosque tá aqui." | "Hi. The grove's still here." |
| 6 | Arena aberta (a Feira) | mundo | "A maré abriu a Feira. As arenas estão de pé." | "The tide has opened the Fair. The arenas are up." |
| 6b | | pet | "Tem gente de outros bosques. Vamos?" | "Folks from other groves. Shall we go?" |
| 7 | Arena perdida | mundo | "O encontro terminou para o outro lado. O bosque segue como estava." | "The meeting went the other way. The grove stays as it was." |
| 7b | | pet | "Eles pulam alto." | "They jump high." |
| 8 | Estação fechada | mundo | "A maré longa virou. O que assentou, ficou." | "The long tide has turned. What settled, stays." |

Reprovados de propósito, para o redator não voltar a eles:
- "Você fez o bosque crescer!" — pessoa como agente do mérito (L12); troque pelo ato ("um fio firmou").
- "Senti sua falta no bosque" — emoção causada pelo histórico (L11) e fatura de retorno (L6).
- "Não foi culpa sua" na derrota — absolvição explícita também reprova (§17 item 3).
- "Seus amigos estão esperando" — chantagem social, a pior forma de cobrador (PLANO-COOP §3.3).

---

## 5. O que depende do dono (estilo §14)

| # | Decisão | Por que é do dono | Recomendação da lore |
|---|---|---|---|
| G1 | **Tamanho do grupo: 2–4 (coop atual) ou 5–20 (pedido)** | O teto de 4 foi decisão com evidência (PLANO-COOP §3.4; comparação social, 31,3%). Ampliar é a alternativa que o desenho recusou — a pergunta é "o que mudou?" (`REGISTRO-DE-DECISOES.md`). | A lore funciona nas duas; em 20, a "roda" fica grande e o risco de leaderboard interno sobe. |
| G2 | **Guilda substitui ou convive com o Grupo atual** (um grupo por pessoa, §3.4) | Dois coletivos por pessoa = duas cobranças. | Evoluir o Grupo existente; um nome só na UI. |
| G3 | **O bosque NUNCA desce** (§1.3) | É regra de mecânica. | Sem isso a lore não fecha (L3/L4). |
| G4 | **A Feira não toca o bosque** e só aposta o que foi posto na mesa (L5) | Regra de recompensa/risco. | Prêmio cosmético ou de coleção; nunca fio, nunca estágio. |
| G5 | **Conceito:** Bosque / Povoado / Pouso | Direção de produto. | Bosque. |
| G6 | **Nomes ⚠️** — Bosque/Grove, roda/circle, Feira/Fair, estágios | PI — `soulmon-ip-brand-guardian` antes de qualquer string. | — |
| G7 | **Estágios: quantos e em que limiar** | Número = mecânica. | 5 nomes propostos; o limiar não é meu. |
| G8 | **O bosque aparece fora do app** (widget, push) | Superfície exposta; o widget não cobra (`widgetSemCobranca.contract.test.ts`). | Só o estágio, nunca contagem nem presença de membros. |

Nada aqui está implementado nem entra na bíblia antes de G1–G5 decididos; a entrada da
guilda na `NARRATIVA-E-UNIVERSO.md` (§7.1 e §12) e na `NARRATIVA-PROPOSTAS.md` acontece
depois, no mesmo passe que o código.
