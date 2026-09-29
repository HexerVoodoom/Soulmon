# Guilda: produto e telas (plano, sem código)

> **Autor:** `soulmon-product-designer` · **Data:** 29/09/2026 · **Tipo:** plano. Não decide regra; decide o dono.
> **Precedência:** código > teste > `CLAUDE.md` > manual > este documento.
> **Como avaliei:** só por código e docs. **Não vi nenhuma captura** desta superfície, porque a Guilda não tem tela própria além do `CoopPanel`.
> **Lido no código:** `src/components/guild/GuildSheet.tsx` (`GuildSheet`), `src/components/CoopPanel.tsx` (`CoopPanel`), `src/utils/community.ts` (`createCoop`/`joinCoop`/`coopCheckin`/`leaveCoop`/`getCoop`/`gift`/`getGifts`), `functions/api/community.js` (`COOP_MAX_MEMBERS`, ação `coopCreate`, erros `group full`/`invalid code`/`already in a group`), `src/utils/areaSheetCopy.ts` (`ArenaLotId`, `HallLotId`), `src/utils/areaNpcVoice.ts` (chaves `'arena:guilda'`/`'hall:guilda'`), `src/App.tsx` (`const interstitial`), `src/utils/backgrounds.ts` (campo `setting`).
> **Lido nos pareceres:** `02-psicologia.md` inteiro (LV-G1..G10) e `03-lore.md` inteiro. Os outros documentos citados no pedido (01-benchmark, 04-arena, manual 03/04, minimal-ui, PALCO, DECISOES §14) entram por referência ao que o próprio CLAUDE.md e os pareceres resumem. **Antes de virar wireframe, alguém precisa conferir linha a linha** os itens marcados com **[conferir]**.

Convenções: **[novo]** marca copy que não existe (é modelo, e quem escreve a string final é o `soulmon-copy-redator`; tudo passa por `narrative-critic` e `ip-brand-guardian`, porque Bosque/Grove/Feira/roda têm ⚠️ na lore). **[existe]** marca o que já está no código.

---

## 1. Objetivo e como ajuda

**Função dentro da essência.** O Soulmon é "um avatar que evolui COM o usuário e o encoraja, nunca um cobrador". A Guilda estende o "COM" do pet para outras pessoas **sem trazer o cobrador junto**. O maior risco dela é passar a cobrança para terceiros: o app não cobra, mas 11 pessoas cobram (02-psicologia §7.2). Por isso o valor não pode vir de os outros verem você. Ele vem de **saber que outros também estão cuidando de si**. É o sinal de "trabalhar junto" de Carr & Walton (2014), que funciona sem chat, sem placar e sem prazo.

**Relação com o `soulGoal`.** O porquê continua **privado**, e a guilda nunca o lê nem o mostra (02 §7.1). Só a própria pessoa recebe a ligação, no `DailyReportModal`: "o que você fez hoje por *[seu porquê]* também firmou um fio no bosque" [novo]. O Bosque é **consequência** do cuidado, nunca o motivo, e é isso que evita a superjustificação.

**Grupo íntimo de hoje × Guilda de 12.**

| | Grupo (hoje, `COOP_MAX_MEMBERS`) | Guilda (até 12) |
|---|---|---|
| Valor | Companhia de quem você conhece: "fulana apareceu hoje" | Pertencer a um lugar que cresce, mesmo com gente que você conhece pouco |
| Sinal por pessoa | Presença binária nominal (`CoopPanel`, lista com `check_circle`) | Presença binária nominal **só até 4**. Acima disso, número agregado ("7 firmaram fio hoje") (02 §2.2) |
| Objeto comum | Barra semanal `progress/target` (tem estado de "não bateu") | **Bosque** que só cresce, sem meta semanal com falha (02 §3.3) |
| Ritual | Nenhum | Feira semanal cooperativa (fenômeno com HP coletivo) |

Minha recomendação é que a Guilda **seja o Grupo com teto maior**, e não um segundo sistema. Um coletivo por pessoa e um nome só na UI (lore G2). Quem tem 3 pessoas vê exatamente o que vê hoje, mais o Bosque.

**Promessa em uma frase [novo]:**
- EN (base): "A grove that grows when anyone in the circle takes care of themselves, and never shrinks."
- PT: "Um bosque que cresce quando alguém da roda cuida de si, e nunca encolhe."

---

## 2. Encontrar, criar, entrar, sair

### 2.1 Critérios para criar
| Critério | Recomendação | Por quê |
|---|---|---|
| Tier pago | **NUNCA** | LV-G6 ("nada da guilda é à venda"). Benchmark #7: Habitica deixa criar Party sem pagar e cobra Gems pela *Guild*, e o efeito é o social virar vitrine de quem pagou. Finch e Pokémon Sleep mantêm o vínculo social inteiro grátis. A guilda também é o **único canal de aquisição** do app (02 §7.3), e pedágio no convite fecha a porta por onde o usuário entraria. **[conferir 01-benchmark §4–6 para a numeração do item 7]** |
| Vínculo mínimo (`BOND_PVP_MIN_LEVEL` = 5) | **Não** para entrar nem para criar | O gate de vínculo existe para PvP, e a guilda não é PvP. Exigir 5 níveis afastaria justamente o novato convidado por um amigo. Isso vale para a Feira também, porque ela é cooperativa e ninguém perde. |
| Conta | **Exige save na nuvem** (já exige, porque as ações usam `saveId`) | Sem `saveId` não há servidor. O demo sem login vê o convite para entrar com conta, nunca uma tela quebrada. |
| Idade | Só por **código de convite**, sem diretório e sem busca | Já é regra do coop (comentário em `CoopPanel` sobre "grupo achável é raide de estranho"). Evita contato não supervisionado com menores (02 §1.2). |

### 2.2 Como o jogador sem guilda descobre que ela existe
1. **Lote no mapa** [existe]: `'guilda'` em `ArenaLotId` e em `HallLotId` (`areaSheetCopy.ts`), rótulos "Guilda" e "Salão da Guilda".
2. **NPC** [existe, precisa corrigir]: a fala de `'arena:guilda'`/`'hall:guilda'` diz "grupo pequeno", o que fica falso com 12. Modelo [novo]: EN "Some creatures keep a grove together. It only grows." / PT "Algumas criaturas cuidam de um bosque juntas. Ele só cresce."
3. **Convite recebido** (link com o código preenchido): é o caminho principal, porque ninguém descobre guilda sozinho numa base vazia.
4. **Nunca** por push, aviso na Home ou nudge. Descobrir é gesto do jogador.

### 2.3 Fluxos e estados
| Estado | O que aparece | Copy |
|---|---|---|
| Carregando | `sync` girando [existe] | "Looking for your group…" [existe] |
| Sem guilda (vazio) | Uma Clareira vazia desenhada no visor (sem slot marcado nem "+"), com **Criar** `primary` e **Entrar com código** `outline` [existe, estrutura] | EN "No circle yet. Open a clearing, or join with a code." PT "Ainda sem roda. Abra uma clareira ou entre com um código." [novo] |
| Criar | Nome (24, passa pelo `_redact.js`, N-8) → cria → mostra o código **grande** e o botão de compartilhar (share sheet nativo, com fallback para copiar) | "Share this code with up to 11 people." [novo, o número vem da constante] |
| Código inválido | Alerta âmbar [existe] | "That code doesn't exist (or the group is gone)." [existe] |
| Guilda cheia | Alerta âmbar [existe]. Proponho uma saída: "ask them to open a new clearing" | [existe] + complemento [novo] |
| Já em outra | [existe] "You're already in a group." Acrescentar a saída de um toque ali mesmo | [novo] |
| Sozinho (1 membro) | Texto próprio [existe], e o Bosque **já cresce com 1**, para ninguém ficar esperando | [existe] |
| Sair | **Um toque, sem confirmação, sem aviso aos outros, sem perda** [existe, `leaveCoop`] (LV-G5). O que a pessoa ajudou a firmar fica no Bosque | Botão "Go your own way" / "Seguir o próprio caminho" (lore §2) [novo]. **Veto:** "tem certeza?" |
| Anfitrião sai | O papel passa sozinho, em silêncio, a quem entrou há mais tempo. Ninguém é notificado. O anfitrião só tem poder administrativo (renomear, remover) e nunca vê atividade (02 §6.2) | — |
| Removido pelo anfitrião | "You're no longer in this circle." / "Você não está mais nesta roda." Sem motivo exposto (02 §6.2) | [novo] |
| Guilda esvazia | Apagada sem tombstone e sem notificação (lore §3). A pessoa guarda um **postal** do último estágio no próprio save (02 §6.3) | Nunca dizer "seu grupo morreu" |
| Viajante (4 semanas sem presença) | Sai da contagem de forma silenciosa e volta com um toque (02 §3.2) | "Hi. The grove's still here." (lore §4 #5) |
| Sem rede | Alerta âmbar [existe] "Couldn't reach the server." | [existe] |

---

## 3. Acesso no mapa e salas

### 3.1 Dois acessos ou um?
**Um lugar e duas portas, mas com a Arena como porta secundária.** Hoje as duas abrem a mesma `GuildSheet` (comentário do próprio arquivo). O lar natural é o **Hall**, porque é social, cooperativo e fica ao lado da Biblioteca/Amigos. Na **Arena** fica só a **Feira** (a raid), abrindo a `GuildSheet` direto na sala Feira. Assim a Arena continua sendo o lugar de encontro e o Hall o lugar de pertencer. Duas portas para a mesma sala inicial ensinam um modelo mental errado ("a guilda é da Arena?"). **[conferir `src/navigation.ts` e `playAreaLots.ts`, que não li: se o lote da Arena não aceita parâmetro de sala, esta proposta custa uma prop]**

### 3.2 Salas dentro da GuildSheet
Uso um segmento tonal com 4 salas (padrão da Loja). Nada de modal sobre modal: as salas são abas da mesma folha.

| Sala | Mostra | NÃO mostra (veto) | Gestos | Copy [novo] |
|---|---|---|---|---|
| **Bosque** (inicial) | O palco compartilhado: o cenário do estágio atual no visor pixel art; o fio de hoje ("Your strand settled today", **só para você**); agregado "N strands settled today"; nome do estágio | Barra com "faltam X" ou percentual (02 §1.2, perfeccionismo), contribuição por pessoa (G1), ausentes (G2), qualquer desgaste (G3) | Tocar no bosque → a criatura dá uma volta nele (visita). **"Firmar meu fio"** substitui "Avisar que apareci hoje" | "A strand settled in the grove." / "Um fio firmou no bosque." (lore #3) |
| **Roda** | Até 4 membros: nome + presença binária [existe] e a criatura de cada um **em pé no palco** (ver regra dos slots abaixo). De 5 a 12: grade de nomes **sem estado de presença**, mais o número agregado | HP, degeneração e estágio de evolução dos outros (G10); "3 dias sem aparecer"; ícone cinza de inativo; ordem por contribuição (lista em ordem de chegada) | Os 3 gestos (§4) | "Who's in the circle" / "Quem está na roda" |
| **Feira** | O fenômeno da semana (FX sobre o visor), a barra de HP **do fenômeno** (desce, e isso é do inimigo, não da guilda), o botão da rodada de hoje e o cosmético da semana | Dano por membro, "MVP", quem não jogou, horário marcado (G9), qualquer efeito no Bosque (G7) | Uma rodada por dia. Ninguém perde: se o fenômeno não cair, "it drifted off with the tide" | "The tide has opened the Fair." (lore #6) |
| **Mural** | Marcos do Bosque com DATA ("Canopy, 14 Oct"), postais das estações e boas-vindas de quem entrou | Números por pessoa, quem saiu (02 §2.2), lacunas ou "próximo marco em X" | Ler | "What the grove has become" / "O que o bosque já virou" |
| Ajustes | Não é sala, é um ícone `settings` no cabeçalho: código, compartilhar, renomear (anfitrião), sair | — | — | — |

**Regra dos 5 slots do palco** (`docs/PALCO-E-DECORACAO.md`: `rug`/`floor-left`/`trophy`/`floor-right`/`wall`, `GROUND_Y`). As criaturas dos membros **não ocupam slots de decoração**, porque slots são de objeto, com tamanho fixo em px. Proponho no máximo **4 criaturas no chão** (`GROUND_Y`), em posições fixas, e só em guilda de até 4. Com mais membros, o Bosque mostra só a SUA criatura. Isso resolve o veto de lugar vazio desenhado (lore §1.4-C): numa roda de 12, uma fileira com buracos seria chamada de sala de aula. **[conferir se `petStage.ts` admite mais de um sprite, porque hoje o palco é de um pet só]**

---

## 4. Como os jogadores interagem

- **Presença binária**, nominal só até 4 (acima disso, agregada). Já existe no `CoopPanel`.
- **Sem chat livre.** Três motivos: menores e moderação (02 §1.2 e §6.2), texto livre é onde a cobrança volta ("cadê você?"), e não há equipe para moderar. O modelo é Finch (Good Vibes) e Sky (velas).
- **3 gestos fixos** [novo], enviados à roda inteira e **nunca** a uma pessoa escolhida. Escolher o destinatário cria "quem recebeu menos":
  1. **Aceno** (`waving_hand`): "Someone in the circle waved." / "Alguém da roda acenou."
  2. **Luz** (`light_mode`): "Someone left a little light." / "Alguém deixou uma luz."
  3. **Descanso** (`bedtime`): "Someone wished everyone a good rest." / "Alguém desejou bom descanso."
  - Anônimos, um de cada por dia, recebidos em lote ao abrir a Guilda. **Nunca geram push.** Ícones precisam estar no subset de `src/styles/tokens.md` **[conferir]**.
- **Presentes** [existe] `gift`/`getGifts` em `community.ts` e na aba de Amigos da `LibraryPage` (exige energia cheia). Não duplicar na Guilda: presente é 1:1 e mora em Amigos.
- **Visita ao Bosque**: tocar no bosque faz o seu pet andar nele, com fala do pet ("It's taller than me now.", lore #4b).
- **Cerimônia de marco do Bosque**: entra na **fila de intersticiais** (`const interstitial` em `App.tsx`) como tipo novo `'groveMilestone'`. Posição proposta: **depois de `dailyReport`/`checkIn` e antes de `dream`**. É rara e boa, mas não pode tapar o ritual pessoal. Espera o gesto, como a `MilestoneCeremony` (z-300). Com movimento reduzido, reduz o movimento e não a pausa. Aparece uma vez por pessoa, na próxima abertura.
- **Home**: um aviso só, no slot de avisos, **por último** na ordem (depois de "recomeço"), e só no dia de um marco novo do Bosque. Presença de membros e gestos recebidos **nunca** vão para a Home.
- **NUNCA**: push de cobrança ou sobre outro membro (G4), widget com contagem, "a guilda precisa de você", notificação de saída ou de ausência.

---

## 5. Benefícios

| Ganha | Como | Cabe no sistema? |
|---|---|---|
| Pertencimento | Bosque, gestos, Mural | — |
| **Cenário do Bosque no palco pessoal** | Ao alcançar cada estágio, todo membro **atual** recebe `bg-guild-<estágio>` como cenário (`setting: 'outdoor'`). **Fica com a pessoa se ela sair** (G5, sem perda) | `backgrounds.ts` já tem `setting`/`slots`/`horizonY` por cenário. Fora do sorteio da masmorra, como os `bg-mission-*`. **[conferir se o sorteio exclui por prefixo]** |
| Cosmético da Feira | 1 decoração por semana concluída ou não ("drifted off" também dá o **mesmo** item, sem exclusivo por vitória, 02 §4.1 item 5). Também obtível fora da semana (G9) | Decoração num slot existente |
| Emblemas | **Não** na v1. A moeda é do Torneio, e dar Emblema pela Feira puxa a Feira para o torneio. Pergunta ao dono (§9) | — |
| **NUNCA** | Coração, Créditos, Bits em volume, energia, `perfectDays`, Glitchtama, vantagem de evolução, fio "comprável" | LV-G6, G7 |

---

## 6. Estética

- **Direção "O Visor"**: o Bosque é pixel art **só dentro do visor**. Moldura, segmento, lista da Roda e Mural são UI `--sm2-*` com Material Symbols, ícone sempre pelado e nunca em box.
- **Paleta**: videira sobre cobre (assinatura da Malha, lore §1.4-A), dentro dos tokens. Nada novo fora de `--sm2-*`. Âmbar (`gold-ink`) para alerta, nunca `danger`.
- **5 artes de cenário**, família `cenario`, fila para `docs/ASSETS-A-GERAR.md`: `bg-guild-clareira`, `bg-guild-ramagem`, `bg-guild-copa`, `bg-guild-mata`, `bg-guild-bosque-antigo`. Todas `outdoor`, com `horizonY ≤ GROUND_Y`. **Proibido na arte**: folha seca, galho caído, cor desbotada, ruína (lore §1.4-A). Cada estágio **acrescenta** ao anterior, com a mesma composição e mais camadas, para ler como crescimento.
- **Fenômeno da Feira como FX**, não sprite de inimigo: névoa, maré e estática sobre o visor. Ele se dissolve quando cai. Uma arte por semana é caro, então proponho 4 FX em rotação: `fx-fair-nevoa`, `fx-fair-mare`, `fx-fair-estatica`, `fx-fair-enxame`.
- **Movimento reduzido**: fio aparece sem crescer em animação, FX vira overlay estático, cerimônia mantém a pausa.
- **Contraste (footgun 10)**: texto sobre o visor escuro tem cor própria `--sm-ink`/`--sm2-*`, nunca herdada de `--foreground`. A validação é por pixel amostrado no Playwright e não por screenshot pequeno. O número agregado sobre a arte vai num painel, não direto sobre o pixel art.

---

## 7. Paridade

- **Widget Android**: no máximo o **nome do estágio** do Bosque ("Canopy"), numa chave NOVA do bridge (as antigas são congeladas). Nunca contagem de fios, presença ou "N de 12". A régua é `src/plugins/widgetSemCobranca.contract.test.ts`, que precisa passar a varrer a chave nova.
- **Overlay desktop**: nada na v1. É controle remoto de cuidado, e o fio já firma pelo cuidado feito lá.
- **Idioma**: EN como base, PT como localização, pelo padrão `language === 'pt-BR'`. As falas do NPC em `areaNpcVoice.ts` já seguem o par.

---

## 8. Wireframes para a squad-design (`INVENTARIO-WIREFRAMES.md`)

| id | Tela | Estado | Prio |
|---|---|---|---|
| GUI-01 | GuildSheet › sem guilda | vazio (criar / entrar) | P0 |
| GUI-02 | Criar | código gerado + compartilhar | P0 |
| GUI-03 | Entrar | erros: inválido / cheia / já em outra / sem rede | P0 |
| GUI-04 | Bosque | Clareira, 1 membro (sozinho) | P0 |
| GUI-05 | Bosque | fio de hoje firmado × ainda não (meta não cumprida, texto sem cobrança) | P0 |
| GUI-06 | Roda | ≤4 (nominal + criaturas no chão) | P0 |
| GUI-07 | Roda | 5–12 (agregado, sem presença) | P0 |
| GUI-08 | Cerimônia de marco do Bosque | intersticial + movimento reduzido | P1 |
| GUI-09 | Feira | aberta / rodada feita hoje / fenômeno caiu / "drifted off" | P1 |
| GUI-10 | Mural | com marcos e vazio | P1 |
| GUI-11 | Ajustes | anfitrião × membro; sair | P0 |
| GUI-12 | Retorno de viajante / removido / guilda esvaziada (postal) | 3 estados | P1 |
| GUI-13 | Gestos recebidos | lote ao abrir | P2 |
| GUI-14 | Home › aviso de marco (último da fila) | — | P2 |
| GUI-15 | Widget com estágio do Bosque | — | P2 |
| GUI-16 | Mapa › lote Hall × lote Arena (abre na Feira) | — | P1 |

---

## 9. Perguntas para o dono

1. **Congelamento da Camada 3**: a psicologia recomenda não construir antes de 10 usuários × 14 dias (02 §7.3). A decisão de 29/09 abre exceção registrada? Se não abrir, este plano fica na gaveta.
2. **Limiar da presença nominal**: 4 (recomendado) ou 5?
3. **UI diz "Guilda" ou "Grupo"?** A lore desaconselha "guilda" em UI, mas o mapa já diz "Guilda"/"Salão da Guilda". Um nome só.
4. **O fio vale `heartGoalFor` (60%) ou a meta inteira?** A psicologia recomenda a de coração, e o `CoopPanel` hoje usa "meta do dia cumprida". A "semente" por cuidado mínimo (02 §2.3) entra?
5. **Estação**: o Bosque é perpétuo (decisão) ou tem estação com colheita que vira peça (02 §5.2)? A decisão atual diz "nunca regride", o que é compatível com as duas.
6. **Limiares dos 5 estágios**: devem escalar com o número de membros ativos, para que 3 pessoas não levem 4× mais tempo que 12?
7. **Feira dá Emblemas?** Recomendo que não na v1.
8. **O cenário `bg-guild-*` fica com quem sai?** Recomendo que sim (LV-G5).
9. **Arena como porta da Feira e Hall como porta da Guilda** (§3.1): aprova separar as portas?
