# Guilda: produto e telas (plano, sem código)

> **Autor:** `soulmon-product-designer` · **Data:** 29/09/2026 (rev. 2 no mesmo dia: todos os pontos [conferir] foram resolvidos) · **Tipo:** plano. Não decide regra; quem decide é o dono.
> **Escopo decidido pelo dono (29/09/2026):** esta sessão entrega **só o plano e a fila de WPs, sem código**. A exceção ao congelamento da Camada 3 (02-psicologia §7.3) não foi pedida nem é necessária para este entregável.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este documento.
> **Como avaliei:** só por código e docs. **Não vi nenhuma captura** desta superfície, porque ela não tem tela própria além do `CoopPanel`.
> **Lido no código:** `src/components/guild/GuildSheet.tsx` (`GuildSheet`), `src/components/CoopPanel.tsx` (`CoopPanel`), `src/components/nav/AreaView.tsx` (`GuildSheet` lazy, ramos `area === 'arena'` e Hall, estado `sheet`), `src/components/arena/DueloSheet.tsx` (`DueloSheet`), `src/utils/playAreaLots.ts` (`exploracaoLots`/`jogosLots`, que não têm guilda), `src/utils/areaSheetCopy.ts` (`ArenaLotId`, `HallLotId`), `src/utils/areaNpcVoice.ts` (`'arena:guilda'`/`'hall:guilda'`), `src/utils/petStage.ts` (`GROUND_Y`, `SlotId`, `DECOR_SLOTS`, `PET_BOX`, `PET_TOP_OFFSET`, `BASE_SLOTS`), `src/utils/backgrounds.ts` (`PET_BACKGROUNDS`, `bg-mission-*`), `src/utils/dungeonScenes.ts` (`SHOP_BG_ACCENTS`, `SHOP_BG_SCENES`), `src/utils/community.ts` (`createCoop`/`joinCoop`/`coopCheckin`/`leaveCoop`/`getCoop`/`gift`/`getGifts`), `functions/api/community.js` (`COOP_MAX_MEMBERS`, erros `group full`/`invalid code`/`already in a group`), `src/App.tsx` (`const interstitial`), `src/styles/tokens.md` (inventário de `icon_names`).
> **Lido nos docs:** 01-benchmark §4–6, 02-psicologia (inteiro), 03-lore (inteiro), 04-arena §1–4, `docs/PALCO-E-DECORACAO.md`, `docs/design/DECISOES-WIREFRAME.md` §14, `docs/manual/03-FLUXO-DE-TELAS.md` (mapa §1, §4.22), `docs/manual/04-IDENTIDADE-VISUAL.md` §1, `docs/design/minimal-ui/README.md` (item 5).
> **Não reli:** `src/navigation.ts`. O grep por `guild`/`sheet` não achou nada nele, porque a abertura dos lotes mora no `AreaView.tsx`, que li.

Convenções: **[novo]** marca copy que não existe. É modelo, e a string final é do `soulmon-copy-redator`; tudo passa por `narrative-critic` e `ip-brand-guardian`, porque Bosque/Grove/Feira/roda levam ⚠️ na lore. **[existe]** marca o que já está no código.

---

## 1. Objetivo e como ajuda

**Função dentro da essência.** A essência é "um avatar que evolui COM o usuário e o encoraja, nunca um cobrador". A Guilda estende o "COM" do pet para outras pessoas **sem trazer o cobrador junto**. O risco é terceirizar a cobrança: o app não cobra, mas 11 pessoas cobram (02 §7.2). Por isso o valor não pode vir de os outros verem você. Ele vem de **saber que outros também estão cuidando de si** (Carr & Walton 2014). Na literatura isso funciona sem chat, sem placar e sem prazo.

**`soulGoal`.** O porquê fica **privado** e nunca é lido nem mostrado à guilda (02 §7.1). A ligação aparece só para a pessoa, no `DailyReportModal`: "o que você fez hoje por *[seu porquê]* também firmou um fio no bosque" [novo]. O Bosque é consequência do cuidado, nunca o motivo.

**Grupo íntimo de hoje × Guilda de 12.**

| | Grupo (hoje, `COOP_MAX_MEMBERS`) | Guilda (até 12) |
|---|---|---|
| Valor | Companhia de quem você conhece | Pertencer a um lugar que cresce |
| Sinal por pessoa | Presença binária nominal (`CoopPanel`, `check_circle`/`radio_button_unchecked`) | Nominal **só até 4**. De 5 a 12, só o agregado (02 §2.2) |
| Objeto comum | Barra `progress/target` semanal, que tem estado de "não bateu" | **Bosque** que só cresce, sem meta com falha (02 §3.3; benchmark §4 item 1, bundles do Stardew) |
| Ritual | Nenhum | Feira semanal cooperativa (04-arena §2a) |

A Guilda **é o Grupo com teto maior**: um coletivo por pessoa e um sistema só (lore G2).

**Promessa [novo].** EN (base): "A grove that grows when anyone in the circle takes care of themselves, and never shrinks." · PT: "Um bosque que cresce quando alguém da roda cuida de si, e nunca encolhe."

---

## 2. Encontrar, criar, entrar, sair

### 2.1 Critérios para criar
| Critério | Recomendação | Por quê |
|---|---|---|
| Tier pago | **NUNCA** | LV-G6. O item 7 do benchmark §4, "acesso não pago por pessoa", mostra a revolta do Remote Raid Pass do Pokémon GO contra cobrar para cooperar. O §5 item 7 lembra que o Habitica **removeu** as guildas em 08/08/2023: o que se sustenta é a meta concreta, não o acesso premium. Além disso, a guilda é canal de aquisição (02 §7.3). |
| Vínculo (`BOND_PVP_MIN_LEVEL` = 5) | **Não para entrar nem para criar.** Na Feira, também não: recomendo que o teto por pessoa/dia no servidor substitua o gate | **Divergência declarada com 04-arena §4**, que usa o gate contra alt accounts. O gate existe para PvP; a Feira não tem perdedor, e o risco de alt é inflar o HP coletivo, que se resolve com o teto diário por `saveId` e prêmio por guilda-semana (a outra metade da mitigação do próprio 04-arena §4). O gate barraria o novato convidado, que é o caso de uso principal. **Decisão do dono (§9)** |
| Conta | Exige `saveId` (as ações já exigem). O demo vê o convite para criar conta | — |
| Descoberta | Só por código, sem diretório (regra do coop; comentário no `CoopPanel` sobre "grupo achável é raide de estranho") | 02 §1.2, menores |

### 2.2 Como o jogador sem guilda descobre que ela existe
1. **Lotes no mapa** [existe]: `'guilda'` em `ArenaLotId` ("Guilda", `left 32% top 82%`) e em `HallLotId` ("Salão da Guilda"). Em `AreaView.tsx`, os dois ramos renderizam o **mesmo** `<GuildSheet>` com as mesmas props.
2. **NPC** [existe, precisa corrigir]: `'arena:guilda'`/`'hall:guilda'` dizem "grupo pequeno", o que fica falso com 12. Modelo [novo]: EN "Some creatures keep a grove together. It only grows." / PT "Algumas criaturas cuidam de um bosque juntas. Ele só cresce."
3. **Link de convite** com o código preenchido: é o caminho principal.
4. **Nunca** por push, aviso na Home ou nudge. É o mesmo adiamento de "gancho de descoberta fora da Biblioteca" (DECISOES §14.2 V3), e agora o mapa é esse gancho.

### 2.3 Fluxos e estados
| Estado | O que aparece | Copy |
|---|---|---|
| Carregando | `sync` girando [existe] | "Looking for your group…" [existe] |
| Sem guilda | Clareira vazia no visor, sem slot marcado nem "+". Embaixo, **Criar** `primary` e **Entrar** `outline` (estrutura [existe], D-C10 da DECISOES §28) | EN "No circle yet. Open a clearing, or join with a code." / PT "Ainda sem roda. Abra uma clareira ou entre com um código." [novo] |
| Criar | Nome (24; N-8 `_redact.js`) → código grande + `share` (está no inventário de `tokens.md`) com fallback `content_copy` [existe] | "Share this code with up to 11 people." [novo, o número vem de `COOP_MAX_MEMBERS − 1`] |
| Código inválido / cheia / já em outra / sem rede | Alerta âmbar [existe, `agir` em `CoopPanel`] mais uma saída: "já em outra" ganha o botão de sair ali | [existe] + [novo] |
| Sozinho | Texto próprio [existe]. O Bosque cresce com 1 | [existe] |
| Sair | **Um toque**, sem confirmação, sem aviso, sem perda [existe, `leaveCoop`] | "Go your own way" / "Seguir o próprio caminho" [novo] |
| Anfitrião sai | O papel passa, em silêncio, a quem entrou há mais tempo. Poder só administrativo (02 §6.2). **Não existe: precisa de campo `host` no grupo em `community.js`** | — |
| Removido | "You're no longer in this circle." / "Você não está mais nesta roda." [novo]. **Não existe: precisa de ação `coopRemove`** | — |
| Esvaziou | Apagada sem tombstone (lore §3). O postal do último estágio fica no save (02 §6.3). **Não existe: precisa de campo no GameState** | Nunca "seu grupo morreu" |
| Viajante (4 semanas) | Sai da contagem em silêncio e volta com um toque | "Hi. The grove's still here." (lore #5) |

---

## 3. Acesso no mapa e salas

### 3.1 Dois acessos, com papéis distintos
O código tem hoje **um estado `sheet` por área** (`AreaView.tsx`). Tocar num lote chama `setSheet(l.id)` e a `AreaSheet` monta o conteúdo. A `GuildSheet` **não recebe parâmetro de sala**. Proposta:
- **Hall → "Salão da Guilda"**: o lar, que abre no Bosque.
- **Arena → o lote vira "Feira"** (id novo `'feira'` em `ArenaLotId`, rótulo [novo]) e abre direto no fenômeno da semana. A Arena continua sendo o lugar dos encontros (torneio, duelo, Feira), e o Hall o de pertencer.
- **Não existe: precisa** de `'feira'` em `ArenaLotId` e nos testes `areaLotsNovos.test.ts`, de arte de lote (hoje `GUILDA_LOT_ART`) e de uma prop de sala inicial no `GuildSheet`, ou de um componente `FeiraSheet` próprio.

### 3.2 Salas: seções em um só scroll, não abas
A minimal-ui tirou as abas de dentro das folhas (comentário no `AreaView.tsx`: "As abas e filtros de dentro das folhas saíram; a construção é quem escolhe"; README item 5: a construção abre um bottom-sheet). Por isso **não proponho segmento**. A folha do Salão é **um scroll com 3 seções** (Bosque, Roda, Mural), a Feira tem o lote próprio e os Ajustes vivem num ícone `settings` (no inventário) no cabeçalho.

| Seção | Mostra | NÃO mostra (veto) | Gestos | Copy [novo] |
|---|---|---|---|---|
| **Bosque** (topo) | Visor com o cenário do estágio; "Your strand settled today" **só para você**; agregado "N strands settled today"; nome do estágio | "Faltam X", percentual, contribuição por pessoa (G1), ausentes (G2), desgaste (G3) | Tocar leva o seu pet a dar uma volta. **"Firmar meu fio"** substitui "Avisar que apareci hoje" [existe] | "A strand settled in the grove." (lore #3) |
| **Roda** | Até 4: nome + presença binária [existe]. De 5 a 12: lista de nomes em ordem de chegada, **sem estado de presença**, mais o agregado | HP, degeneração e estágio de evolução alheios (G10); "N dias"; ícone de inativo | Os 3 gestos (§4) | "Who's in the circle" / "Quem está na roda" |
| **Mural** | Marcos com DATA, postais, boas-vindas | Números por pessoa, quem saiu, "próximo marco em X" | Ler | "What the grove has become" / "O que o bosque já virou" |
| **Feira** (lote da Arena) | Fenômeno como FX no visor, HP **do fenômeno**, botão da rodada de hoje, cosmético da semana | Dano por membro, MVP, quem não jogou, horário (G9), efeito no Bosque (G7) | 1 rodada por dia | "The tide has opened the Fair." (lore #6) |

**As criaturas dos membros no palco: não existe hoje.** `petStage.ts` descreve um palco de **um pet só**: `PET_BOX` = 152 e `PET_TOP_OFFSET` são de um sprite, e `BASE_SLOTS` tem só `'nest'`. Os `DECOR_SLOTS` (`rug`/`floor-left`/`trophy`/`floor-right`/`wall`) têm caixa fixa para objeto.
- **Precisa de** um palco novo, "palco do Bosque", com posições próprias para criaturas pequenas na linha do chão. Os 5 slots não são reaproveitados e o palco pessoal não é tocado. Minha recomendação é **no máximo 4 criaturas e só em guilda de até 4**; acima disso, só a sua criatura.
- **Divergência declarada com 04-arena §3**, que propõe "até 20 sprites pequenos" rotacionados. Numa roda de 12, a fileira com lacunas é a sala de aula que a lore §1.4-C veta. Decisão do dono (§9).
- **Drift no doc:** `PALCO-E-DECORACAO.md` diz sprite de 80×80, mas o código diz 152 (`PET_BOX`, com o próprio comentário admitindo a defasagem de `GROUND_Y`). Quem desenhar o palco do Bosque precisa medir no código.

---

## 4. Como os jogadores interagem

- **Presença binária**, nominal até 4 [existe].
- **Sem chat livre**, por três motivos: menores e moderação (02 §1.2, §6.2), texto livre é onde a cobrança volta, e ninguém modera. O modelo é o benchmark §4 item 4 (Finch Good Vibes, velas do Sky).
- **3 gestos fixos** [novo], anônimos, para a roda inteira e nunca para uma pessoa escolhida. Um de cada por dia, recebidos em lote ao abrir, **sem push**:
  1. **Aceno**: ícone `waving_hand` **não está no inventário de `tokens.md`**. Precisa entrar no subset, senão renderiza um span vazio (aviso no `CoopPanel`). Alternativa já inventariada: `sentiment_satisfied`.
  2. **Luz** (`light_mode`, inventariado): "Someone left a little light." / "Alguém deixou uma luz."
  3. **Descanso** (`bedtime`, inventariado): "Someone wished everyone a good rest." / "Alguém desejou bom descanso."
- **Presentes** [existe]: `gift`/`getGifts` na aba de Amigos da `LibraryPage`, que exige energia cheia. Continuam lá, porque presente é 1:1.
- **Visita**: tocar no Bosque; fala do pet "It's taller than me now." (lore #4b).
- **Cerimônia de marco**: tipo novo `'groveMilestone'` na união de `const interstitial` (`App.tsx`, hoje `triage | dailyReport | checkIn | dream | nightmare | catalogOnboarding | catalogLevelInvite | welcome`). Posição: **depois de `dailyReport` e `checkIn`, antes de `dream`**. Espera o gesto (z-300, como a `MilestoneCeremony`); movimento reduzido reduz o movimento e nunca a pausa. Aparece uma vez por pessoa.
- **Home**: um aviso, **último** da ordem do slot (depois de "recomeço"), só no dia de marco novo.
- **NUNCA**: push sobre outro membro ou "a guilda precisa de você" (G4), widget com contagem, aviso de saída ou de ausência.

---

## 5. Benefícios

| Ganha | Como | Cabe no sistema? |
|---|---|---|
| Pertencimento | Bosque, gestos, Mural | — |
| **Cenário `bg-guild-<estágio>`** | Ao alcançar o estágio, todo membro atual recebe o cenário, e **fica com quem sai** (G5) | **Sim.** Entra em `PET_BACKGROUNDS` (`backgrounds.ts`) com `setting: 'outdoor'`, `slots`, `horizonY`, como os `bg-mission-*` ("never sold"). **Fora do sorteio da masmorra por construção**: o sorteio (`SHOP_BG_SCENES` em `dungeonScenes.ts`) só lê ids listados em `SHOP_BG_ACCENTS`, e é por isso que os `bg-mission-*` não caem lá. Basta não listá-los |
| Cosmético da Feira | Uma decoração por semana, **a mesma** tenha o fenômeno caído ou não, e obtível depois (G9) | Decoração num `SlotId` existente do palco **pessoal** |
| Emblemas | 04-arena §4 aceita Emblemas com teto semanal por guilda. **Eu recomendo não na v1**, porque puxa a Feira para o Torneio | Decisão do dono (§9) |
| **NUNCA** | Coração, Créditos, energia, `perfectDays`, Glitchtama, vantagem de evolução, fio comprável | LV-G6, G7 |

---

## 6. Estética

- **"O Visor"** (`04-IDENTIDADE-VISUAL.md` §1): pixel art só dentro do visor (`.sm2-viewport-screen`, `image-rendering: pixelated`). Seções, Roda e Mural ficam no aparelho: tokens `--sm2-*`, Material Symbols, ícone sempre pelado e nunca em box.
- **Paleta**: videira sobre cobre (lore §1.4-A), dentro dos tokens. Alerta em âmbar (`gold-ink`), nunca `danger`.
- **Fila para `docs/ASSETS-A-GERAR.md`**, família `cenario`: `bg-guild-clareira`, `bg-guild-ramagem`, `bg-guild-copa`, `bg-guild-mata`, `bg-guild-bosque-antigo`. Todos `outdoor`, com `horizonY ≤ GROUND_Y` (74), mesma composição com mais camadas a cada estágio. **Proibido**: folha seca, galho caído, cor desbotada, ruína. Mais uma arte de lote para `'feira'`.
- **FX da Feira** (sobre o visor, sem sprite de inimigo): `fx-fair-nevoa`, `fx-fair-mare`, `fx-fair-estatica`, `fx-fair-enxame`, em rotação. O tema do 04-arena §2a ("Nevoeiro de Pendências") casa com a névoa.
- **Movimento reduzido**: fio sem animação de crescimento, FX estático, cerimônia com pausa.
- **Contraste (footgun 10)**: texto com cor própria `--sm2-*`, nunca herdada de `--foreground`, e medido por pixel no Playwright. O agregado vai num painel, nunca direto sobre o pixel art.

---

## 7. Paridade

- **Widget Android**: no máximo o **nome do estágio** do Bosque, numa chave nova do bridge. Nunca contagem nem presença. `widgetSemCobranca.contract.test.ts` precisa varrer a chave nova.
- **Overlay desktop**: nada na v1. O fio já firma pelo cuidado feito lá, que grava no mesmo save.
- **Idioma**: EN como base, PT pelo padrão `language === 'pt-BR'`.

---

## 8. Wireframes (`INVENTARIO-WIREFRAMES.md`)

| id | Tela | Estado | Prio |
|---|---|---|---|
| GUI-01 | Salão › sem guilda | vazio (criar / entrar) | P0 |
| GUI-02 | Criar | código + compartilhar | P0 |
| GUI-03 | Entrar | inválido / cheia / já em outra / sem rede | P0 |
| GUI-04 | Salão › Bosque | Clareira, sozinho | P0 |
| GUI-05 | Salão › Bosque | fio firmado × meta própria ainda não cumprida | P0 |
| GUI-06 | Salão › Roda | ≤4 nominal + criaturas no palco do Bosque | P0 |
| GUI-07 | Salão › Roda | 5–12 agregado | P0 |
| GUI-08 | Cerimônia `'groveMilestone'` | normal + movimento reduzido | P1 |
| GUI-09 | Feira (lote Arena) | aberta / rodada feita / caiu / "drifted off" | P1 |
| GUI-10 | Salão › Mural | com marcos / vazio | P1 |
| GUI-11 | Ajustes | anfitrião × membro; sair | P0 |
| GUI-12 | Viajante / removido / esvaziada (postal) | 3 estados | P1 |
| GUI-13 | Gestos recebidos | lote | P2 |
| GUI-14 | Home › aviso de marco | último do slot | P2 |
| GUI-15 | Widget com estágio | — | P2 |
| GUI-16 | Mapa › Hall "Salão da Guilda" × Arena "Feira" | — | P1 |

Estes ids substituem, para a Guilda, a linha `SOC-06` do canvas Social (DECISOES §14.4, que já pedia para desdobrar os sete estados do `CoopPanel`).

**Fila de WPs que sai daqui** (sem código nesta sessão): `community.js` (teto 12, `host`, `coopRemove`, fio/estágio monotônico, Feira com teto diário) → `GuildSheet` (seções + prop de sala) → `'feira'` em `ArenaLotId` + arte → palco do Bosque → `'groveMilestone'` na fila → `bg-guild-*` em `PET_BACKGROUNDS` → ícone no subset → chave do widget + régua → copy do NPC e do `CoopPanel` ("2 a 4").

---

## 9. Decisões e perguntas para o dono

**Já decidido (29/09/2026):** esta sessão entrega só o plano e a fila de WPs, sem código. A exceção ao congelamento da Camada 3 não se aplica a este entregável, e implementar exige nova decisão quando a fila for puxada.

Perguntas abertas:
1. Limiar da presença nominal: 4 (recomendado) ou 5?
2. Na UI, "Guilda" ou "Grupo"? A lore desaconselha "guilda", mas os lotes já dizem "Guilda"/"Salão da Guilda". Um nome só.
3. O fio vale `heartGoalFor` (60%, recomendação de 02 §2.1) ou a meta inteira, como o `CoopPanel` faz hoje? A "semente" de cuidado mínimo (02 §2.3) entra?
4. Bosque perpétuo ou estação com colheita que vira peça (02 §5.2)?
5. Os limiares dos 5 estágios escalam com o número de membros ativos?
6. A Feira dá Emblemas? 04-arena diz que sim, com teto; eu recomendo que não na v1.
7. `bg-guild-*` fica com quem sai? Recomendo que sim.
8. Trocar o lote da Arena de "Guilda" para "Feira" (§3.1)?
9. Na Feira, gate de vínculo (04-arena) ou só teto diário (esta proposta)?
10. No palco do Bosque, até 20 sprites (04-arena §3) ou até 4 e só em guilda pequena (esta proposta)?
