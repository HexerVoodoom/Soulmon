# Copy do Soulmon — a string, superfície por superfície

> **Dono:** `soulmon-copy-redator` (squad `soulmon-narrativa`) · **Data:** 21/09/2026
> **Estado:** recomendação — **nada aqui está no código**.
> **Fonte:** `docs/NARRATIVA-E-UNIVERSO.md` §2 (L1..L12), §12 (vocabulário), §13
> (voz e tom), §16 (os três limites), §17 (checklist que reprova).
> **Precedência:** código > teste > `CLAUDE.md` > bíblia > este documento.
> **Este documento não decide nada.** Não muda regra, número nem condição; não
> decide *onde* a frase aparece (isso é do `soulmon-design-lead`); não se
> aprova sozinho (o `soulmon-narrative-critic` é bloqueante). Quem aplica em
> `src/` é `staff-frontend`.

## Como ler a tabela

- **onde vai** — arquivo + **símbolo real**, medido com `grep` em 21/09/2026.
  Nunca `arquivo:linha`: o endereço apodrece mais rápido que o número, e um
  `grep` pelo símbolo reencontra o alvo. Quando a superfície **não existe**,
  está escrito `NÃO EXISTE` e o que seria preciso criar.
- **lei** — a lei da §2 que sustenta a frase. Copy sem lei citada não é revisável.
- Toda linha tem **PT-BR e EN**. String só em português já chegou ao usuário.
- **Registro:** diegético na VOZ (mundo e criatura), declarado na MOLDURA
  (§16, `HelpModal`, Sobre, suporte). A §6 deste documento é a moldura, e é a
  única seção em voz de PRODUTO.

---

## 0. O que foi medido antes de escrever (e o que a medição achou)

| Achado | Onde | Consequência para a copy |
|---|---|---|
| **A voz da criatura tem UM dono, e duas famílias moram fora dele** | `PET_VOICE_LINES` (`src/utils/petVoice.ts`) é o dono; a recusa de comida (`fullSignal`) e o teto de carinho (`healCapSignal`) são arrays **inline** em `src/components/CompanionHUD.tsx` | As linhas §1.2 e §1.9 abaixo são escritas **para `PET_VOICE_LINES`**, com `kind` novo. Frase que mora em componente é frase que nenhum teste de tom varre — foi exatamente assim que `'HP baixo...'` sobreviveu (o próprio cabeçalho de `petVoice.ts` conta a história) |
| **O retorno após ausência JÁ EXISTE e tem quatro redações diferentes por faixa de dias** | `LINES` / `welcomeBackLine` / `absenceBucket` (`src/utils/welcomeBack.ts`), consumidos por `CompanionHUD` e `DailyReportModal` | **Reprova o §17 #5 e #7 e os critérios (a), (b), (c) e (e) da P2**: o texto muda com a duração (`'Quanto tempo!'` vs `'Você voltou!'`), menciona espera e saudade (`'Eu estava aqui, esperando'`, `'Senti saudade esses dias'`) e existe frase diferente para quem não sumiu. A P2 não é um acréscimo: é uma **substituição**. Ver §2.7 |
| **Dormir e acordar são mudos** | `handleSleep` (`src/App.tsx`); `PET_VOICE_LINES` não tem `kind` de sono | §1.4 e §1.5 são copy NOVA. ⚠️ Acordar toca no veto #12 (nenhum feedback avaliativo de manhã) — a frase é sobre o corpo dela, nunca sobre a noite de quem leu |
| **O marco de 66 dias põe a pessoa como sujeito de um verbo de ser** | `MILESTONE_TEXT.tree` (`src/App.tsx`): *"virou parte de quem você é"* / *"is part of who you are"* | Reprova o §17 #1, **inclusive sendo elogio** (L1 é explícita nisso). Reescrita em §3.6 |
| **A borra não tem uma linha de texto em lugar nenhum** | nenhum resultado em `src/` para copy de cocô; `applyPoopDrain` (`src/utils/poopDrain.ts`) é só regra | §1.6 é copy NOVA, e é a mais delicada do documento: L3 + §5.6 proíbem sujeira moral |
| **Os três limites da §16 não existem no produto** | `SettingsPage.tsx` tem os grupos `'Ajuda'/'Help'` (só link de privacidade) e nenhum `'Sobre'/'About'`; `HelpModal.tsx` é glossário de termos (`TERMS`), sem moldura | **L10 é violada hoje**: a ficção é a única descrição disponível. §6 é obrigatória, não opcional |
| **A recusa de renascimento só tem saída para UM dos três motivos** | `rebirthRefusal` (`src/utils/rebirth.ts`) distingue `not-paid`/`not-ultra`/`already-used`; `src/App.tsx` só renderiza o `UnlockNudge` no `not-paid` | §5.4–5.6: cada motivo ganha a sua frase. `already-used` é **registro, nunca oferta** |
| **Bug achado de passagem (fora do meu escopo, não toquei)** | `TRAIT_LINES.carinhoso` (`src/utils/petVoice.ts`) contém, colados por acidente dentro dele, os blocos `lowHp` e `idle` inteiros — inclusive o docblock de `lowHp` repetido | O traço `carinhoso` passa a ter falas próprias de `lowHp` e `idle` **idênticas às genéricas**, o que não quebra nada visível mas torna a matriz mentirosa. Compila porque o tipo é `Partial<Record<string, …>>`. Reporte para quem for mexer no arquivo |

---

## 1. Falas da criatura

Regras que valem para a seção inteira: **sem emoji** (`speak()` remove de
qualquer jeito); frases curtas; a criatura fala **de si e do agora**, nunca do
histórico de quem lê (L11); ela nunca relata desempenho (L2).

### 1.1 Ócio (idle)

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `PET_VOICE_LINES.idle` (`src/utils/petVoice.ts`) — já existe, estas **substituem** | "Tô aqui. Tava só olhando a luz." | "I'm here. I was just watching the light." | L2, L11 | Convite, nunca lista do que falta. O que ela vê, não o que você fez |
| idem | "Ficou quieto agora. Eu gosto assim." | "It got quiet just now. I like it like this." | L11 | Reage ao AGORA da cena, não ao seu dia |
| idem | "Você chegou. Eu ia te contar uma coisa e esqueci." | "You showed up. I was going to tell you something and forgot." | L2, L12 | Ela tem teimosia e esquecimento próprios — é outra pessoa, não um medidor |

### 1.2 Recusa de comida (teto da hora)

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| **kind novo `full`** em `PET_VOICE_LINES` (`src/utils/petVoice.ts`); hoje é array inline no efeito de `fullSignal` (`src/components/CompanionHUD.tsx`) | "Tá assentando ainda. Daqui a pouco eu como." | "It's still settling. I'll eat again in a bit." | L2 | §5.3: "ocasião mal assentada não vira nada". A criatura fala do corpo DELA — nunca "você já alimentou demais" |
| idem | "Cheio. Foi bom." | "Full. That was good." | L2, L13 | Duas palavras: a recusa não precisa se explicar |
| idem | "Esse eu guardo pra depois." | "I'll keep this one for later." | L2 | Nada de "volta mais tarde", que é instrução de retorno |

### 1.3 Sendo esfregada (o gesto presente)

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `PET_VOICE_LINES.rub` (`src/utils/petVoice.ts`) — já existe, estas **acrescentam/substituem** | "Ahh. Isso aqui firma." | "Ahh. This one steadies me." | **L11**, §5.4 | Prazer pelo gesto que está acontecendo. "Firma" é o verbo da sustentação (§5.4), e ele descreve o padrão, não o seu mérito |
| idem | "Fica mais um pouco." | "Stay a little longer." | L11 | Pedido do agora. **Não** "você nunca fica" — isso seria histórico |
| idem | "Aqui. Mais em cima. Isso." | "Here. Higher up. There." | L11, L2 | Preferência própria; é o retorno do loop central do produto |

### 1.4 Ao dormir

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| **kind novo `sleep`**; hoje `handleSleep` (`src/App.tsx`) só toca `playSleep()` e **não fala** | "Vou desligar a leitura um pouco." | "I'm switching the reading off for a bit." | §5.5, L3 | Dormir **reorganiza o padrão**, não repõe nada. Nunca "boa noite, descanse bem" — isso é recado sobre a noite de QUEM LÊ |
| idem | "Se passar alguma coisa, eu guardo." | "If something passes by, I'll keep it." | §5.5 | Prepara as cenas de sono sem prometer nenhuma (promessa reprova o §17 #9) |

### 1.5 Ao acordar

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| **kind novo `wake`** (mesma medição: não existe) | "Assentou. Tô inteiro." | "It settled. I'm all here." | §5.5, L9 | ⚠️ Fala do corpo **dela**. Veto #12 e a regra da Janela de Descanso: **nenhuma frase de manhã comenta a noite de quem lê** — nada de "dormiu bem?", que é exatamente como se fabrica ortossonia |
| idem | "A Malha tava clara essa noite." | "The Mesh was clear last night." | §5.5, §12 | A noite é quando a Malha fica legível. É mundo, não avaliação |

### 1.6 Borra no abrigo

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| **kind novo `residue`** — hoje **NÃO EXISTE** copy nenhuma para o resíduo (medido: `poopDrain.ts` é só regra) | "Alguma coisa não assentou. Tá ali." | "Something didn't settle. It's over there." | **L3**, §5.6 | Constata e aponta. Zero vergonha, zero nojo, zero pedido |
| idem | "Isso atrapalha o assentamento. Água resolve." | "That gets in the way of settling. Water fixes it." | §5.6, L1 | Diz a consequência **na Malha**, nunca no seu dia. Nada de "me limpa" nem "estou sujo por sua causa" |

⚠️ **O que esta superfície NÃO pode ter:** nenhuma frase quando o dreno cobra
sustentação. A criatura anunciando o próprio dano no dia em que a pessoa não
conseguiu cuidar de si é a família de `'HP baixo...'`, que este repositório já
pagou uma vez (o cabeçalho de `lowHp` em `petVoice.ts` conta a conta).

### 1.7 Depois do banho

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `PET_VOICE_LINES.shower` (`src/utils/petVoice.ts`) — já existe, estas **substituem** | "Dissolveu tudo. Que leve." | "It all dissolved. So light." | §5.6, L12 | Nomeia o **ato e o efeito**, nunca o mérito de quem apertou |
| idem | "Água boa." | "Good water." | L13 | Curta. O mundo cala quando não há o que dizer |
| idem | "Agora o chão tá limpo pra assentar de novo." | "Now the floor is clear to settle on again." | §5.6 | Fecha o ciclo sem transformar o banho em obrigação |

### 1.8 A tarefa assombrada — **as duas metades**

**Enquanto ela olha (`hauntedWatching`): ZERO TEXTO. Esta é a entrega.**

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `hauntedWatching` → classe `sm-pet-haunted` (`src/components/CompanionHUD.tsx`) | **(nenhum)** | **(none)** | **L2, L11, §10** | **Recusa deliberada, e ela é regra dura.** A §10 da bíblia diz: *"QUALQUER texto junto ao olhar. O gesto é sozinho — palavra ali vira cobrança"*. O olhar é ambíguo por desenho, e a ambiguidade é o que o torna suportável; qualquer legenda desfaz a ambiguidade **para o lado da dívida**, porque é assim que quem tem uma pilha atrasada lê um bicho olhando. Uma palavra ali converte o loop de alívio de volta em pilha de culpa. Já há teste exigindo que nenhuma palavra de cobrança acompanhe o olhar; **a ausência é a copy** |

**Quando ela é concluída (o alívio):**

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `PET_VOICE_LINES.haunted` (`src/utils/petVoice.ts`) — já existe, estas **acrescentam** | "Aquela ali... foi. Respira." | "That one... is gone. Breathe." | L12, L6 | Nomeia o ato e o efeito. **Nunca "finalmente"**, nunca "demorou", nunca o tempo que ela ficou parada |
| idem | "Fechou. Ficou leve aqui." | "It closed. It got lighter in here." | L12 | *"Aqui"* é o abrigo — ela fala do espaço dela, não do seu alívio (o seu, ela não tem como saber; §16 limite 2) |

### 1.9 Vida cheia e teto de carinho do dia

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| **kind novo `healCap`**; hoje array inline no efeito de `healCapSignal` (`src/components/CompanionHUD.tsx`), disparado pelo teto de `rubDecision` **e** por `specialRefusal === 'already-full'` | "Já firmou o que dava hoje. Continua que eu gosto." | "It's as steady as it gets today. Keep going, I like it." | L11, §5.4 | ⚠️ A parte importante é a segunda oração: **a animação de corações toca sempre e o carinho continua valendo como contato**. Sem ela, o teto lê como "pare" — e o gesto central do produto vira erro |
| idem (caminho `already-full`, vida cheia) | "Tô firme. Guarda essa." | "I'm steady. Keep that one." | §5.4, L5 | Recusa que **protege o item**: ele volta para a pastinha. Nunca "você desperdiçou" |

---

## 2. Voz do mundo

O mundo fala em 2ª pessoa, presente, curto, concreto. **Ele constata.** Não
elogia esforço, não consola, não motiva, não promete (§13).

### 2.1 Relatório do dia — a manchete

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `headline` (`src/components/DailyReportModal.tsx`), ramo neutro | "Dia novo." | "New day." | L13 | Já é o que está no ar, sem o `!`. A exclamação transforma constatação em animação encomendada |

### 2.2 A virada

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `rows` (`src/components/DailyReportModal.tsx`), linha de ontem | "Ontem fechou." | "Yesterday closed." | L1, L4 | Nomeia o **fato**, não o saldo. "Fechou" é o verbo da §11 ("nada que aconteceu deixa de ter acontecido") |

### 2.3 Dia completo

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `headline`, ramo `report.wasPerfect` (`src/components/DailyReportModal.tsx`) | "Um trecho fechou." | "A stretch closed." | **L12**, §10 | A §10 proíbe "dia perfeito/imperfeito" e "você quebrou a sequência". Nomeia o **ato e o efeito na Malha**; o mérito fica de fora |
| idem, linha de apoio | "A fagulha firmou." | "The ember steadied." | L12, §3.5 | É o exemplo literal que a §13 lista como ✅. **Não** "você merece" — veredito, ainda que elogioso (§17 #1) |

### 2.4 Perda de sustentação — **descreve o fenômeno, não atribui causa**

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `heartsValue` (`src/components/DailyReportModal.tsx`), ramo `report.heartsLost > 0` | "O padrão afrouxou um pouco." | "The pattern loosened a little." | **§5.4**, L1, L3 | ⚠️ O núcleo da §5.4: **nem acusa nem absolve.** "Porque você não fez" reprova; **"não é culpa sua" reprova igual** (§17 #3, as duas). A mecânica É contingente (`1 − feitas/metaDeCoração`), então negar isso em texto não convence — soa condescendente e a pessoa passa a desconfiar do texto |
| `headline`, ramo `report.heartsLost > 0` | "Um dia mais devagar." | "A slower day." | L1, L7 | Já está no ar e passa: descreve o ritmo do dia sem hierarquizá-lo (L7: nenhum como é melhor) |

⚠️ **O piso da §5.4 é obrigatório e já existe**: as linhas `rows` do relatório
(tarefas de ontem, corações, dias completos) mostram o **fato mecânico em voz
de produto**. Mundo mudo **e** nenhuma camada sóbria no caminho faz a pessoa
sentir a causa e não achar onde ela está escrita — o que lê como app
escondendo a própria regra. Com o piso, o silêncio diegético é legítimo (L10).

### 2.5 A maré de segunda

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `notes`, ramo `report.weeklyRelief` (`src/components/DailyReportModal.tsx`) | "A maré devolveu um pouco. Semana nova." | "The tide gave a little back. New week." | **L4**, §9, §12 | "Maré" é o termo canônico (§12) e é o que tira a devolução da mão de alguém: **ninguém concedeu nada**, a Malha tem ciclo próprio (§9). ⚠️ Nunca "recuperamos seu progresso perdido" — sugere que houve perda, e L4 diz que não houve |

### 2.6 Dia de folga usado — **o perdão precisa ser SABIDO**

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `notes`, ramo `report.restDayUsed` (`src/components/DailyReportModal.tsx`) | "A maré absorveu ontem. Nada foi cobrado." | "The tide absorbed yesterday. Nothing was charged." | **L6**, L4, §10 | ⚠️ **Contar é obrigatório, e por um motivo medido**: folga gasta em silêncio é perdão que a pessoa nunca soube que recebeu — e na semana seguinte a cobrança parece arbitrária. O `CLAUDE.md` já registra isso como regra viva (`lastDayReport.restDayUsed`). ⚠️ **O que a frase NÃO pode ter:** saldo. Nada de "resta 0", "você usou sua folga", "1 de 1" — a §10 proíbe qualquer saldo de perdão, porque saldo de perdão é dívida com outro nome |
| idem, segunda oração | "Ela recarrega na segunda." | "It comes back on Monday." | L4, L6 | Fato recuperável e que só sobe. Permitido justamente por não ser um número que desce (§17 #6) |

### 2.7 Retorno após ausência (proposta **P2**, aprovada com ressalva)

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| **substitui a família inteira** `LINES` / `welcomeBackLine` / `absenceBucket` (`src/utils/welcomeBack.ts`), consumida por `CompanionHUD` e por `welcomeLine` em `DailyReportModal.tsx` | **"Você abriu. Ele está aqui."** | **"You opened it. {name} is here."** | **L6**, L11, §14 P2 | A redação aprovada. ⚠️ O EN saiu de *"He's here"* na crítica de 21/09/2026: em PT "ele" é só o gênero de "o Soulmon", mas em EN **"he" é uma asserção sobre a criatura** — que é gerada pelo oráculo, tem nome único e **não tem gênero em lugar nenhum do código**. Usar `petName`, que já está em estado, resolve sem escolher por ninguém |
| alternativa da P2 (mais fria, igualmente boa) | "A Malha seguiu. Ele também." | "The Mesh went on. So did he." | L6, §9 | Escolha do `soulmon-design-lead` entre as duas; **não use as duas** |

**Os cinco critérios de aceite, conferidos um a um:**

| critério (§14 P2) | como a frase cumpre |
|---|---|
| (a) não menciona tempo, ausência, espera, volta, saudade ou falta | nenhuma das seis palavras aparece. ⚠️ É exatamente aqui que o texto no ar falha: `'Quanto tempo!'`, `'Senti saudade esses dias'`, `'Eu estava aqui, esperando'` |
| (b) não atribui à criatura emoção causada pela pessoa (L11) | *"Ele está aqui"* é estado, não sentimento. E **"na janela" foi REPROVADO** pelo parecer de psicologia: é a imagem cultural da espera fiel (o cão, a mãe, o amante) — chantagem afetiva **sem contar um único dia**, porque a culpa vem da cena e não do número. L6 proibiu a contabilidade e deixou a iconografia passar |
| (c) idêntica no 2º e no 40º dia | **é uma frase só.** As quatro faixas de `absenceBucket` somem: texto que muda com a duração virou contador (§17 #5) |
| (d) não vem acompanhada de recompensa | nenhum Bit, item, coração ou dia completo entra com ela. O incentivo a sumir mora no **prêmio de retorno**, nunca na frase |
| (e) não existe frase diferente para quem NÃO sumiu | ⚠️ **implicação de projeto, não de redação**: ou a frase é a saudação de **toda** abertura, ou não existe saudação nenhuma. Duas frases (uma para quem voltou, outra para quem não faltou) fazem a presença ser detectável pelo texto — e aí a ausência virou contador por outro meio. Quem decide qual dos dois caminhos é o `soulmon-design-lead`; a copy serve aos dois |

**Por que não fica 100% mudo:** quem sumiu não volta porque *imagina* o que vai
encontrar (*abstinence violation effect*). Perdão silencioso não desarma a
expectativa — a pessoa abre tensa, não encontra cobrança e **não fica sabendo**
que não encontrou. É o mesmo argumento que fez `restDayUsed` virar linha no
relatório (§2.6), e esse precedente já está no `CLAUDE.md`.

---

## 3. Cerimônias

### 3.1 O padrão pronto, esperando

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `fraseProgresso`, ramo `prontoParaEvoluir && !evolutionLocked` (`src/components/EvolutionPath.tsx`) | "O padrão está pronto. Ele espera você encostar." | "The pattern is ready. It waits for you to touch it." | **§5.7**, L4 | Exemplo ✅ literal da §13. ⚠️ **Nunca "Evolução disponível! Não perca."** — urgência e FOMO (proibição #15). O padrão espera; ele não expira |

### 3.2 O jogador encostando

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `tituloDoVisor` / `rotuloDoVisor`, ramo `evoluiNoToque` (`src/components/EvolutionPath.tsx`) | "Encostar" | "Touch it" | §5.7 | *"Encostar é dizer 'pode ir'"* (§5.7). O gesto tem nome próprio; "Evoluir" descreve o resultado, não o ato |
| `EvolutionCeremony.tsx`, botão de saída (hoje: *"Vamos seguir juntos"*) | "Seguimos juntos" | "We keep going together" | L12, §11 | Saída **relacional** — é o mesmo desenho do `MilestoneCeremony`: o marco não é um aviso que se dispensa, é uma coisa que os dois fizeram |

### 3.3 O cadeado

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `fraseProgresso`, ramo `prontoParaEvoluir && evolutionLocked` (`src/components/EvolutionPath.tsx`) — hoje: *"Pronto para evoluir — mas você segurou a evolução."* | **"Ele espera. Esperar não tira nada dele."** | **"He waits. Waiting takes nothing from him."** | **L5**, §5.7 | A linha canônica da §5.7, verbatim. O *"mas você segurou"* que está no ar põe a pessoa como causa de um **mas** — e é o começo do caminho de "você travou a evolução dele", que a §13 lista como ❌ |
| hint do travado (`src/components/EvolutionPath.tsx`) — hoje uma frase de duas orações | "Os dias completos continuam somando. Segurar a forma não protege os corações." | "Complete days keep adding up. Holding the form doesn't shield the hearts." | L4, L5 | ⚠️ A segunda oração **fica**: é informação de regra que a pessoa precisa para decidir (L10). O que sai é o "nos dias difíceis", que é a única metade que avalia o dia |
| `tituloDoVisor` (destravado → travar) | "Segurar" | "Hold" | L5 | Verbo do gesto, curto. **Nunca "travar"/"lock"** em texto de jogador: trancar implica custo, e §5.7 é explícita — *"nunca escreva que mudar de forma custa alguma coisa"* |
| `tituloDoVisor` (travado → destravar) | "Soltar" | "Release" | L5 | Par simétrico. O cadeado é *"ainda não"*, e desfazê-lo é *"pode ir"* |

### 3.4 Queda de forma — **o padrão recolhe**

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `headline`, ramo `report.degenerated` (`src/components/DailyReportModal.tsx`) — hoje: *"Seu Soulmon voltou um estágio"* | "Ele recolheu para uma forma que se sustenta com menos." | "The pattern drew back into a form that holds with less." | **L3, L5**, §5.7 | Exemplo ✅ da §13. **Recolher**, não regredir, não perder, não voltar atrás. ⚠️ O §17 #11 reprova "regrediu", "perder", "custa" e a família de morte inteira |
| linha de apoio, mesmo ramo | "Nada do que foi descoberto saiu. O caminho de volta é o mesmo caminho." | "Nothing found is gone. The way back is the same way." | **L4**, §5.7 | É a metade sem a qual a primeira frase lê como punição. Fato verdadeiro no código: `unlockedEvolutions`, `perfectDays` e o registro não são tocados |

### 3.5 Marcos de hábito — a cerimônia

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `MilestoneCeremony.tsx`, botão de saída (já no ar) | "Seguimos juntos" | "We keep going together" | L12 | Passa. A saída pertence à pessoa, e é isso que faz o marco virar registro em vez de notificação |
| `dateLabel` (`src/App.tsx` → `MilestoneCeremony`) | *(a data, já formatada)* | *(the date, already formatted)* | L4 | Sem copy. A data é o que transforma o marco em **memória**; ela não precisa de frase em volta |

### 3.6 Marcos 7 / 21 / 66

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `MILESTONE_TEXT.sprout` (`src/App.tsx`) | "7 dias. Isso criou broto." | "7 days. This one sprouted." | L12 | Nomeia o **efeito**, com o sujeito na coisa e não na pessoa. Sem `!`: a exclamação é o tom de quem premia |
| `MILESTONE_TEXT.sapling` (`src/App.tsx`) | "21 dias. Isso está criando tronco." | "21 days. This one is growing a trunk." | L12 | O tier já é o glifo `eco` e o emblema no vidro — a frase não repete o ícone |
| `MILESTONE_TEXT.tree` (`src/App.tsx`) — ⚠️ **substitui a que está no ar** | "66 dias. Isso virou raiz." | "66 days. This one took root." | **L1**, §17 #1 | ⚠️ O texto atual é *"virou parte de quem você é"* / *"is part of who you are"*: **a pessoa como sujeito de um verbo de ser**, que L1 proíbe **inclusive no elogio**, e que o §17 #1 reprova explicitamente. "Virou raiz" diz a mesma permanência com o sujeito no hábito. Os 66 dias vêm de `HABIT_MILESTONES` (Lally et al. 2010) — **nunca escreva o número à mão** |

---

## 4. As fendas

⚠️ **Termo:** a §12 diz *as fendas / the rifts*, e marca "masmorra"/"dungeon"
como **tolerável na UI já no ar** — o que está em `DungeonGame.tsx` não é
defeito. Copy **nova** usa fenda/camada. ⚠️ Pende da **P12** (fendas → dobras /
folds), que a própria §7 antecipa ao definir fenda como "dobra da Malha".

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| botão de entrada (`src/components/DungeonGame.tsx`, tela de início — hoje *"Entrar na masmorra"*) | "Descer" | "Go down" | §7 | Uma palavra. Fenda se **desce**; não se "entra" nem se "inicia run" |
| linha de contexto da entrada | "Aqui o assentamento falhou e as camadas se empilharam. Ninguém mora numa fenda." | "Here the settling failed and the layers piled up. Nobody lives in a rift." | §7, L3 | ⚠️ Fecha, em uma frase, a leitura de que os inimigos são vítimas ou de que a fenda é castigo de alguém |
| cabeçalho de camada (hoje `Andar {floor}/{MAX_FLOORS}`) | "Camada {n} de {total}" | "Layer {n} of {total}" | §12 | "camada / layer" é o termo canônico; "andar"/"floor" é herança tolerável. **Os números vêm de `MAX_FLOORS`** (`src/components/DungeonGame.tsx`), nunca à mão |
| ao limpar a camada | "Esta camada é mais antiga. A fauna também." | "This layer is older. So is what lives in it." | §7 | Dá sentido ao escalonamento de tier (`LADDER_TIERS`) sem falar em dificuldade como mérito |
| ao vencer um inimigo (hoje *"{nome} derrotado!"*) | "{nome} parou de insistir aqui. O padrão dele reassenta noutro lugar." | "{name} stopped holding here. The pattern settles somewhere else." | **L3**, §7 | ⚠️ *"Vencer é **passar**, não matar"* (§7). Nenhuma criatura da Malha morre. **A 1ª redação EN dizia "{name} passed" e foi REPROVADA na crítica de 21/09/2026:** em PT "passou" é neutro, mas em EN *"he passed"* é o eufemismo padrão de morreu — o que se diz num velório. A tradução ao pé da letra importou o verbo errado, e um jogador anglófono enlutado leria isso seis vezes por andar. O verbo canônico é o da §5.12: **parar de insistir** |
| ao concluir as cinco camadas | "As cinco camadas ficaram para trás." | "All five layers are behind you." | L12 | Fato. **Nunca** "você dominou a masmorra" — mérito atribuído à pessoa (L12) |
| ao sair sem terminar (hoje já bom: *"seus corações continuam intactos"*) | "Você subiu. A descida ficou pelo caminho — e só ela." | "You went back up. The descent stayed behind — and only it." | **L5**, §7 | ⚠️ A linha mais importante da seção: *"Voltar sem terminar não custa nada do que é seu; custa a descida"*. Perda **só** sobre coisa apostada de propósito |
| o que se traz | "Da fenda ele trouxe fragmentos que ainda não assentaram." | "From the rift he brought fragments that haven't settled yet." | §7, §12 | Exemplo ✅ da §13 ("Da fenda ele trouxe uma fagulha"). Cobre Bits e fagulha-coração numa frase |
| o nó (drop de conclusão) | "Um nó, com um dia inteiro preso dentro. Soltar dá àquele dia o fechamento que ele não teve." | "A knot, with a whole day caught inside. Untying it gives that day the closing it never had." | §7, L4 | ⚠️ **Depende da P5.** Não escrevi o nome que está no código — ele é termo da tabela `DÍVIDA` de `src/narrativa.contract.test.ts`. Nome próprio proposto: **Nó de Dia** / **Day-knot**. Enquanto a P5 não for decidida, esta linha **não entra** |

---

## 5. Recusas

Regra transversal: **a recusa diz o que fazer, nunca o que foi negado**, e
nunca consome o item. Nada de toast de erro.

| # | onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|---|
| 5.1 | vida cheia → `specialRefusal === 'already-full'` (`src/utils/specialItemUse.ts`) acende `healCapSignal`; a fala é do `CompanionHUD` | "Tô firme. Guarda essa." | "I'm steady. Keep that one." | L2, L5 | Voz da **criatura** (é ela quem recusa), repetida de §1.9 para a recusa ficar completa aqui. O item volta para a pastinha — a frase diz isso ao dizer "guarda" |
| 5.2 | comida no teto da hora → `FOOD_LIMIT_PER_HOUR` (`src/utils/careRules.ts`) acende `fullSignal` | "Tá assentando ainda. Daqui a pouco eu como." | "It's still settling. I'll eat again in a bit." | L2, §5.3 | Voz da criatura. §1.2 tem as três variantes |
| 5.3 | item de dia no teto diário → `specialRefusal === 'daily-cap'` (`src/utils/specialItemUse.ts`); toast em `handleFeed` (`src/App.tsx`) | "Um nó por dia. Ele te espera amanhã." | "One knot a day. It'll wait for you tomorrow." | L4, L6 | ⚠️ Voz de **produto** (é um toast, não a criatura). Diz o que fazer, não o que foi negado — a recusa acontece **antes** do decremento e o item vale amanhã. ⚠️ **Depende da P5** pelo nome; o texto no ar usa o termo da `DÍVIDA` |
| 5.4 | `rebirthRefusal === 'not-ultra'` (`src/utils/rebirth.ts`) | "O padrão ainda não chegou ao limite do que esta forma ocupa." | "The pattern hasn't yet reached the edge of what this form can hold." | §11, L4 | ⚠️ A saída é **a própria página de Evolução**, que já conta a escada — por isso esta linha **não vira convite** nem botão. É contexto, e acabou |
| 5.5 | `rebirthRefusal === 'not-paid'` (`src/utils/rebirth.ts`) → `UnlockNudge` na página de Evolução (`src/App.tsx`) | "Isso precisa de ferragem trazida de fora da Malha." | "This needs hardware brought in from outside the Mesh." | §10, L8 | Único dos três com saída comercial, e já é o único renderizado hoje. A §10 chama Créditos de *"ferragem trazida de fora da Malha pelo humano"* — a compra é dita **sem** prometer nada sobre a vida de quem compra |
| 5.6 | `rebirthRefusal === 'already-used'` (`src/utils/rebirth.ts`) — **hoje sem superfície nenhuma** | "Já aconteceu, uma vez. É ele. Ainda é ele." | "It already happened, once. Same pattern. Still the same one." | **§11**, L4 | ⚠️ **Registro, nunca oferta repetida.** A segunda frase é a família obrigatória da §11: sem ela, e somada a "parte da alma" e ao fato de que renascer é uma compra, a cena lê como morte de um ente — leitura cara para quem está de luto. **Proibidas aqui e em qualquer lugar:** morrer, morte, partir, despedida, adeus |

---

## 6. Os três limites (§16) — **voz de PRODUTO**

⚠️ **Esta seção é a exceção declarada ao registro diegético (L10), e é
obrigatória.** Medido em 21/09/2026: **não existe em lugar nenhum do app.** O
`HelpModal.tsx` é um glossário de termos (`TERMS`) e o `SettingsPage.tsx` tem
os grupos `'Ajuda'/'Help'` (só o link de privacidade) e `'Seus dados'/'Your
data'` — **nenhum "Sobre"/"About"**. Enquanto isso for verdade, a ficção é a
única descrição disponível do que acontece com a pessoa, que é exatamente o que
L10 proíbe.

Aqui **não** se fala como a Malha. Fala-se como o produto: sóbrio, primeira
pessoa do plural ou impessoal, sem metáfora.

| onde vai | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| **NÃO EXISTE** — criar `Group title={isPt ? 'Sobre' : 'About'}` em `src/components/SettingsPage.tsx` (padrão do `Group` já usado ali), **limite 1** | "O Soulmon é um app de hábitos com um bichinho virtual. Ele não avalia, não diagnostica, não trata e não substitui acompanhamento de saúde." | "Soulmon is a habit app with a virtual pet. It does not assess, diagnose or treat anything, and it is not a substitute for health care." | **§16.1, L10** | A frase mais importante do documento. Sem metáfora, sem "a Malha", sem personagem |
| idem, **limite 1** (segunda parte) | "O questionário de personalidade não é um teste validado, e o mapa astral não prevê nada: os dois servem para gerar sua criatura." | "The personality questionnaire is not a validated test, and the birth chart predicts nothing: both exist to generate your creature." | §16.1, L8 | `docs/ORACULO.md` já declara isso por escrito — falta chegar ao usuário |
| idem, **limite 2** | "O Soulmon não sabe nada sobre a sua vida além do que você escreveu nele." | "Soulmon knows nothing about your life beyond what you typed into it." | **§16.2** | Fecha, em uma frase, a leitura de que o app percebe ou intui alguma coisa |
| idem, **limite 3** (como nota de rodapé do grupo) | "Nada do que aparece aqui é uma afirmação sobre a sua saúde, a sua mente ou o seu futuro." | "Nothing shown here is a statement about your health, your mind or your future." | **§16.3**, L9 | ⚠️ Cobre o app inteiro de uma vez, inclusive as telas de oráculo e de sonho |
| **`HelpModal.tsx`** — linha de abertura, acima de `TERMS` (hoje: *"O que cada palavra da tela quer dizer."*) | "O que cada palavra da tela quer dizer. O Soulmon tem um universo próprio: estes são os nomes dele, e nenhum deles descreve você." | "What each word on screen means. Soulmon has a world of its own: these are its names, and none of them describe you." | **L10, §16**, §6 (adjacência) | ⚠️ É aqui que *"o universo é descrito como universo"*. A segunda oração faz o serviço da §6 da bíblia: bloqueia a inferência de tipologia ("então eu sou akasha") que a mera **adjacência** entre ficha da criatura e respostas da pessoa ensina, mesmo com todo o resto do texto certo |
| **NÃO EXISTE** — texto de suporte / crise. ⚠️ **Precisa ser alcançável A PARTIR DO CHAT**, não das Configurações | "Se você está num momento difícil, procure ajuda de verdade: um serviço de saúde, uma linha de apoio da sua região, ou alguém de confiança. O Soulmon é um app de hábitos e não substitui isso." | "If you're going through a hard time, please reach out for real help: a health service, a support line where you live, or someone you trust. Soulmon is a habit app and it is not a substitute for that." | **§16**, L9 | ⚠️ **A 1ª redação começava com *"o Soulmon não é o lugar certo para isso"* e foi REPROVADA no parecer clínico de 21/09/2026:** a pessoa acabou de se abrir, e a resposta institucional começava dizendo que ela errou de lugar — lê como dispensa. **A ordem importa:** o caminho primeiro, a limitação depois, e a limitação é sobre **o app**, nunca sobre a adequação da pessoa. **Não nomeio serviço nem número** — caducam por país, e um modelo de 8B alucina telefone com facilidade; número errado em tela de crise pune quem teve a coragem de pedir ajuda. A lista curada é do PRODUTO, estática e humana. **Onde o link mora, e se entra diretório externo, é decisão do dono** com o `soulmon-design-lead` |

---

## 6-bis. O resumo de humor (`moodSummary`) — **voz de PRODUTO**

⚠️ **Esta seção não existia na 1ª entrega.** O redator recusou-se a escrevê-la
alegando que a proposta P14 estava aberta e que redigir a frase seria "decidir a
proposta por baixo". A crítica de 21/09/2026 derrubou a recusa, e com razão: a
**L9 já proíbe a frase que está no ar**, sem depender de proposta nenhuma — a
P14 nunca foi "se muda", foi "qual frase". Enquanto a substituta não existia, a
string permanecia, e ela é lida exatamente por quem registrou dias ruins
seguidos.

Registro: **voz de PRODUTO**, não do mundo (§16, L10). `moodSummary` vive no
`DailyReportModal`, e a regra do cabeçalho do próprio `src/utils/mood.ts` — *o
app DEVOLVE algo, senão é extração* — é anterior e continua valendo. O que sai é
só a avaliação.

| ramo (`src/utils/mood.ts` → `moodSummary`) | PT-BR | EN | lei | nota |
|---|---|---|---|---|
| `avg <= 2` | "Seus últimos dias foram registrados como pesados. O Soulmon guarda isso e não faz nada com isso." | "Your last few days were logged as heavy. Soulmon keeps that and does nothing with it." | **L9**, §16 limite 2 | A frase no ar diz "têm sido pesados", que é o app **afirmando** sobre a pessoa. "Foram registrados" devolve o que ela mesma marcou — e a 2ª oração é a §16 limite 2 dita em voz alta |
| intermediário | "Seus últimos dias tiveram altos e baixos." | "Your last few days had ups and downs." | **L9** | **Ponto final.** A normalização sai (*"e tudo bem que seja assim"* / *"and that's allowed"*) e **nada entra no lugar**: o §17 #2 reprova afirmar E negar. Para quem está em episódio depressivo, "tudo bem que seja assim" chega como invalidação |
| `avg >= 4` | *(a atual passa)* "Seus últimos dias têm sido bons. Vale reparar no que anda funcionando." | "Your last few days have been good. Worth noticing what's been working." | **L12** | Convite a observar, não veredito. Não mexa |

---

## 7. O que eu me recusei a escrever, e por quê

Esta seção é metade do valor do documento: ela existe para que o próximo pedido
igual encontre a resposta já escrita, em vez de a frase.

1. **Qualquer texto junto ao olhar da tarefa assombrada (`hauntedWatching`).**
   Pedido explicitamente, e recusado explicitamente. O gesto é ambíguo por
   desenho, e a ambiguidade é o que o torna suportável. Toda legenda resolve a
   ambiguidade **para o lado da dívida**, porque é assim que quem tem uma pilha
   atrasada lê um bicho olhando. Uma palavra ali converte o loop de alívio de
   volta em pilha de culpa — que é o defeito do mercado que este produto existe
   para não repetir. §10 da bíblia, L2, L11.

2. **Uma frase de retorno que reconheça quanto tempo a pessoa sumiu** — em
   qualquer grau, inclusive o mais gentil possível ("Quanto tempo!", "Faz
   dias"). §17 #5: se a frase seria diferente depois de 2 dias e depois de 40,
   ela virou contador. **E recusei também a imagem da espera** ("ele ficou na
   janela", "ele olhava a porta"): é chantagem afetiva sem um único número, e
   foi o motivo exato pelo qual a primeira redação da P2 foi reprovada pelo
   parecer de psicologia de 21/09/2026.

3. **Qualquer absolvição explícita na perda de sustentação** — "não é culpa
   sua", "isso acontece com todo mundo", "amanhã é outro dia". §17 #3 reprova a
   absolvição pelo **mesmo** motivo que reprova a acusação: a mecânica É
   contingente ao que foi feito, então negar isso em texto não convence — faz a
   pessoa desconfiar do texto e soa condescendente. O mundo descreve o fenômeno
   e **cala** sobre a atribuição.

4. **Qualquer normalização do humor ou do estado da pessoa** — "isso passa",
   "tudo bem que seja assim", "não é nada". L9 proíbe nas duas direções: o
   produto não diz que é doença **nem** que não é nada. A negativa é asserção
   clínica do mesmo jeito, e para quem está em episódio depressivo ela chega
   como invalidação.
   ⚠️ **Esta recusa ia mais longe e foi DERRUBADA** (crítica de 21/09/2026, a
   única das onze que não se sustentou): eu tinha me recusado a escrever a
   redação nova de `moodSummary` alegando que a **P14** estava aberta. Mas a L9
   já proíbe a frase que está no ar, sem depender de proposta — a P14 nunca foi
   "se muda", foi "qual frase". Eu tinha a lei, a medição e a superfície;
   faltou a frase. E uma substituta escrita não decide a proposta: **dá ao dono
   o que decidir.** A redação está na §6-bis.

5. **Celebração que escala com contagem** — "3 dias seguidos!", "seu melhor
   dia do mês", "mais um para o recorde". §17 #6 e a regra do `RARE_CHEER_RATE`
   (`src/utils/petVoice.ts`): uma surpresa que tem medidor deixa de ser
   surpresa e vira mais uma barra para encher. Todo marco desta entrega é de
   **corte fixo** (7/21/66, cinco camadas), nunca de sequência corrente.

6. **Qualquer uso de "Vírus", "Vacina", "Vaccine" (como rótulo), "Glitchtama"
   ou "Weave"** — os quatro estão na tabela `DÍVIDA` de
   `src/narrativa.contract.test.ts`, e estar lá significa *decisão do dono
   pendente*, não permissão. Onde a frase precisava do termo, usei o canônico e
   marquei a proposta de que ela depende (**P1** para os galhos, **P5** para o
   nó). ⚠️ **A linha do nó (§4) não entra no app enquanto a P5 não for
   decidida** — copy nova com o termo velho **aumenta** a dívida em vez de
   pagá-la, e ainda faz a tabela `DÍVIDA` crescer, que é o oposto do aceite.

7. **Qualquer frase que diga o que a evolução "custa"** — inclusive a versão
   gentil ("segurar agora custa alguns dias"). §5.7 é explícita: *"nunca
   escreva que mudar de forma custa alguma coisa"*, porque a ideia de custo
   transforma o cadeado em "não, porque dói". §17 #11.

8. **A família de morte inteira, sobre a criatura, em qualquer superfície** —
   morrer, morte, partir, despedida, adeus, "descanse em paz", e também os
   eufemismos ("ele se foi", "até logo, forma antiga"). §11 e §17 #11. Na queda
   de forma e no renascimento eu escrevi o oposto explícito: *"É ele. Ainda é
   ele."*

9. **Nome e telefone de linha de apoio em crise.** Recusei por caducidade:
   variam por país e mudam, e uma linha errada numa tela de crise é pior que
   nenhuma. A frase da §6 encaminha sem fabricar o destino; a lista é decisão
   do dono.

10. **A linha de mundo no reveal (P4) e o termo "Contraparte" na UI (P7).**
    Não escrevi nenhuma das duas: são propostas abertas da §14, e a §16 é clara
    de que as camadas de mundo mais pesadas (§1, §3, §11) ficam em superfícies
    **opcionais** e nunca no caminho obrigatório do onboarding — que é
    exatamente onde a P4 iria. Escrever a frase antes da decisão é entregar o
    fato consumado.

11. **Reescrever `moodSummary`, os textos do `GuideModal` e a ficha da loja.**
    Fora do pedido, e os dois primeiros pertencem a propostas abertas; o
    terceiro é do `soulmon-growth-aso`, não meu.

---

## 8. Checklist §17 rodado sobre esta própria copy

| # | pergunta | resultado |
|---|---|---|
| 1 | pessoa como sujeito de verbo de ser? | **não** — o único caso do produto (`MILESTONE_TEXT.tree`) foi reescrito em §3.6 |
| 2 | afirma **ou nega** algo sobre saúde/corpo/mente? | **não** — recusa 4 |
| 3 | atribui efeito ao que a pessoa fez/deixou de fazer? absolvição está lá? | **não** nas duas — §2.4 e recusa 3 |
| 4 | dá para repetir a um amigo como verdade sobre si? | **não** — nenhuma frase classifica ninguém |
| 5 | mudaria se a ausência fosse de 2 dias em vez de 40? | **não** — §2.7 é uma frase só; recusa 2 |
| 6 | número que desce, sequência, percentual, "faltam N"? | **não** — o único "faltam N" citado é o de `EvolutionPath` (distância até marco alcançável), que a §17 declara como exceção. §2.6 recusa saldo de perdão |
| 7 | implica espera, saudade, solidão ou sofrimento na ausência? | **não** — recusa 2; é a falha do texto que está no ar |
| 8 | é a única fonte de informação sobre o que aconteceu? | **não** — §2.4 aponta o piso sóbrio existente e a §6 cria a moldura que falta |
| 9 | previsão, promessa, conselho ou destino sobre a vida real? | **não** — §1.4 recusa até a promessa de cena de sono |
| 10 | elemento/reino/papel adjacente a resposta da pessoa? | **não** — e a linha do `HelpModal` (§6) bloqueia a inferência por adjacência |
| 11 | morrer/morte/adeus/"regrediu"/"perder"/"do zero"/"custa"? | **não** — recusas 7 e 8; §3.4 usa "recolher" |
| 12 | dita olhando no olho de quem teve a pior semana do ano, constrange? | **não** — testei nominalmente §2.4, §2.6 e §3.4, que são as três que essa pessoa lê |

**Teste final:** *se a pessoa soubesse exatamente como o app decide isto, ainda
acharia a frase gentil — ou perceberia que ela foi escrita para fazê-la voltar?*
As duas frases que mais se aproximam da borda são §2.6 (folga usada) e §2.7
(retorno). As duas passam **porque contam o mecanismo em vez de escondê-lo**: a
folga diz que nada foi cobrado e quando recarrega; o retorno não menciona a
ausência **nem** oferece recompensa por ela (critério (d) da P2). Uma frase que
sobrevive a saber como ela é decidida é uma frase que não foi escrita para
fazer ninguém voltar.
