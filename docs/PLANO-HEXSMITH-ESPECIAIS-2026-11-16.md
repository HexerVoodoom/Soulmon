# Plano: Hexsmith e os especiais que faltam (levantamento e proposta)

Data: 16/11/2026. Base lida: `origin/main` @ `fde8a4056` (a main local está atrasada; toda referência é `arquivo:linha` desse commit). Escopo: SÓ levantamento e proposta. Nenhum código alterado, nada commitado. Complementa `docs/PLANO-COMPANHEIRO-INVOCADO-2026-11-16.md` e o REGISTRO §443 (nome coerente, #972) e §444 (companheiro, PR 1, #973).

Pedido do dono (16/11): "a Hexsmith ainda não tem coisa para fazer especial de buff, de velocidade, de debuff, de tirar armadura; criar TODOS os que faltam, inclusive gerar asset no ChatGPT; isso tem que afetar a criatura summonada; NÃO haverá opção de tornar 'summonável' pela Hexsmith; quem já é summonável só terá o CHIP afetando o PODER da criatura, nunca deixa de ser summonável".

---

## 0. Resumo executivo

1. **A premissa está só em parte certa, e isso muda o plano.** A Coroa da Hexsmith JÁ tem um item para cada uma das 7 famílias do motor, inclusive as 3 que o dono cita: reforço de ataque (`atkBuff`, "buff"), reforço de velocidade (`spdBuff`, "velocidade") e quebra de defesa (`defDebuff`, "tirar armadura"). As 7 têm arte própria (`coroa-*.png`, instaladas em 13/11, REGISTRO §323/§359). O que de fato NÃO existe é: (a) qualquer item para efeitos que o motor já sabe fazer mas só pelo elemento do Amuleto e só em PvE (cura contínua, lentidão, silêncio); (b) famílias que o motor nem tem (reforço de defesa, debuff de ataque, lentidão de verdade no PvP). Ver seção 1.3 e a pergunta Q1.
2. **A Hexsmith nunca liga nem desliga o companheiro.** `eEvocador` (`src/utils/companheiroInvocado.ts:70`) lê só arquétipo do estágio e escola dominante da ficha; nenhum slot da Hexsmith toca nisso. O plano mantém isso por construção e por teste (seção 2.1). Item novo que "torna summonável" não existe e não será criado.
3. **O companheiro executa o efeito da família que VALE na luta.** Pela decisão final do dono (§444: "turno 1 o especial do jogador, turnos 2-3 ataque"), o turno 1 do companheiro é o especial do jogador. Como a Coroa troca a família efetiva (`hexFamily`, `hexsmith.ts` ~`:265`), o companheiro passa a ter um papel por família efetiva. O plano estende o papel de 3 famílias (tanque/dano/cura, do plano de 16/11) para TODAS (seção 2.2).
4. **Chip e "poder" da criatura:** proposta segura = o chip (as três portas de ELEMENTO: Amuleto, Garra, Couraça, pagas com poções) dá ao companheiro elemento, cor, selo e o sabor de efeito que o elemento já dá ao especial; numericamente NEUTRO (mesmos eventos de `fight()`). Se o dono quiser poder numérico, ele entra pelo teto de 5% (`combinedAttrBonus`), nunca por multiplicador próprio (seção 2.3, Q3).
5. **Plano:** 2 trilhas separáveis. Trilha A (sem mexer no motor): 3 Coroas de EFEITO (cura contínua, lentidão, silêncio), só PvE como já é hoje. Trilha B (mexe no motor, calibração e servidor): 3 famílias novas (reforço de defesa, debuff de ataque, lentidão de verdade). Arte: 6 ícones de Coroa + 3 selos de status. 9 PRs pequenos (seção 5), cada um com rollback.

---

## 1. Hexsmith hoje

### 1.1 Os itens
Dono único das regras: `src/utils/hexsmith.ts`; espelho do servidor: `functions/api/_hexsmith.js` (`hexsmith.parity.test.js` trava as duas cópias). Textos: `src/utils/hexsmithCopy.ts`. Tela: `src/components/hex/HexsmithSheet.tsx`. Fica na Forja (lote `forja:hexsmith`).

| Slot | O que reescreve | Valores forjáveis | Custo (`HEX_COSTS`, `hexsmith.ts:63`, espelho `_hexsmith.js:81`) |
|---|---|---|---|
| Coroa | FAMÍLIA do especial | as 7 de `SPECIAL_FAMILIES` (`specials.ts:39`) | 2.000 Bits + 70 fragmentos (0 poções) |
| Amuleto (um "chip") | ELEMENTO do especial | qualquer um dos 210 do dex | 3 poções do próprio elemento + 1.500 Bits + 12 fragmentos |
| Garra (chip) | ELEMENTO do básico | os 210 | idem |
| Couraça (chip) | ELEMENTO na defesa (só dano recebido) | os 210 | idem |
| Luvas | alcance/acabamento do básico, SÓ VISUAL | 4 (`magic`, `ranged-slash`, `melee-slash`, `melee-smash`) | 500 Bits + 18 fragmentos |
| (à parte) Renomear | nome do Soulmon e do especial | texto | `HEX_RENAME_COST` (`_hexRename.js`) |

Regras que valem (cabeçalho de `hexsmith.ts`): itens CAROS, NUNCA se perdem, NÃO se vendem, posse só cresce, UM equipado por slot, valem em PvE e PvP, NÃO dão % de atributo (o teto de 5% de `combate/bonus.ts` não é tocado), sem sorteio, pagam com Bits do saldo (desde §373 o Bit vindo de Crédito também paga). Posse só cresce pelo servidor: `POST /api/save?action=hexForge` (`save.js:318`, `forgeOnServer` em `_hexsmith.js`); `enforceStoredHexOwned` impede o cliente de acrescentar posse. Estado: `GameState.hexsmith = { owned, equipped }`; `sanitizeHexsmith` descarta lixo item a item; teto `HEX_MAX_OWNED = 3*210 + 7 + 2` (`hexsmith.ts:113`, `_hexsmith.js:20`). O que o combate lê: `hexOverrides` (`specialFamily`, `specialElement`, `basicElement`, `defenseElement`, `strike`), aplicado no cliente em Arena, Masmorra, Pesadelo, Raid, Torneio, treino e Duelo, e no servidor em `_duel.js`.

Arte atual (`src/assets/soulmon/hex/`, resolvida por `import.meta.glob`, `index.ts`): `slot-*.png` 96×96 (os 5 slots vazios), `forjar.png` 96×96, `mapa-portas.png`, `chip-<elementoBase>.png` 128×128 (20, o "chip" de essência), `coroa-<familia>.png` 96×96 (7). Tudo pixel art, alfa real. `resolveHexCrownArt` cai na `slot-coroa.png` se a família não tiver arquivo (`index.ts:46`): arte nova por família entra só soltando o PNG, sem mudar código.

### 1.2 Todas as famílias e efeitos do motor

Famílias (`src/utils/combate/specials.ts:39`; espelho `functions/api/_combate.js:188`): `direct`, `dot`, `heal`, `shield`, `atkBuff`, `defDebuff`, `spdBuff`. Mecânica (PvP em `fight.ts:325-350`, grupo/PvE em `group.ts` `cast`/`tickOwnTurn`):

| Família | O que faz | Poder PvP / PvE (`specials.ts`) |
|---|---|---|
| `direct` | dano direto imediato | 1 / 1 |
| `dot` | dano contínuo, 3 ticks nos próximos golpes de quem recebe (`DOT_TICKS`, `fight.ts:231`) | 1,14 / 1 |
| `heal` | cura instantânea | 1 / 1 |
| `shield` | escudo (absorve 100% do básico, 50% do especial e do tick, §327) | 1 / 1 |
| `atkBuff` | os próximos golpes do conjurador batem mais (`nAtk`, `fight.ts:343`) | 1,01 / 1,01 |
| `defDebuff` | os próximos golpes que o alvo recebe doem mais ("tirar armadura", `nVuln`, `fight.ts:346`) | 1,01 / 1,01 |
| `spdBuff` | os próximos golpes do conjurador saem mais rápido (`nSpd`, `fight.ts:349`) | 2 / 1,82 |

Efeitos de PvE (`SpecialEffect = 'hot' | 'slow' | 'silence'`, `specials.ts`; escolhidos por `comEfeitoDoElemento`, `elementEffects.ts:101`, a partir da FAMÍLIA + ELEMENTO do especial; PvP nunca os chama): `hot` (escudo com cura em 3 pulsos), `slow` (lentidão; parte do orçamento segue como `defDebuff`), `silence` (o alvo fica sem soltar especial por N golpes). Sabores só visuais (queimadura, veneno, maldição, defesa de terra etc.) estão em `TABELA`/`TABELA_11` (`elementEffects.ts:24`/`:38`).

### 1.3 Matriz: o que a Hexsmith cobre e o que não cobre

| Efeito | Família/efeito | Item da Hexsmith? | Arte | PvP? | PvE? |
|---|---|---|---|---|---|
| Dano direto | `direct` | `coroa:direct` (existe) | `coroa-direct.png` | sim | sim |
| Dano contínuo | `dot` | `coroa:dot` (existe) | sim | sim | sim |
| Cura | `heal` | `coroa:heal` (existe) | sim | sim | sim |
| Escudo | `shield` | `coroa:shield` (existe) | sim | sim | sim |
| BUFF de ataque | `atkBuff` | `coroa:atkBuff` (existe) | sim | sim | sim |
| BUFF de velocidade | `spdBuff` | `coroa:spdBuff` (existe) | sim | sim | sim |
| TIRAR ARMADURA (debuff de defesa) | `defDebuff` | `coroa:defDebuff` (existe) | sim | sim | sim |
| Cura contínua | `shield` + `hot` | NÃO (só vem do Amuleto de Vida/Planta/Fada/Vigor com a Coroa de escudo) | não | não existe | sim |
| Lentidão | `defDebuff` + `slow` | NÃO (só Amuleto de Ar/Gravidade/Tempo/Industrial/Espaço com Coroa de quebra) | não | não existe | sim |
| Silêncio | `defDebuff` + `silence` | NÃO (só Amuleto de Som/Luz/Eletricidade/Marcial/Arcano com Coroa de quebra) | não | não existe | sim |
| REFORÇO DE DEFESA (buff de armadura própria) | não existe | NÃO | não | não existe | não existe |
| DEBUFF DE ATAQUE (enfraquecer o alvo) | não existe | NÃO | não | não existe | não existe |
| LENTIDÃO real (debuff de velocidade) | só como `slow` de PvE | NÃO | não | não existe | só efeito |

Conclusão: nenhuma família do motor está sem Coroa. Os buracos reais são as 6 linhas "NÃO". A pergunta Q1 pede ao dono para confirmar se é isso que ele quer completar.

### 1.4 Nomes e custo da escada
- Nome do item: `hexName` = "HEX de X" / "X HEX" (`hexsmithCopy.ts`), com X = `HEX_FAMILY_COPY[familia]` (ex.: "Reforço de ataque", "Quebra de defesa", "Reforço de velocidade").
- Nome do ESPECIAL coerente com o efeito (§443, #972): `nomeParaFamilia` (`nomeEspecial.ts:101`) troca só o substantivo pelo MESMO índice do léxico da família efetiva (8 substantivos por família, `SUBSTANTIVOS_ESPECIAL`, `nomeEspecial.ts:23`); `familiaDoNomeInimigo` manda `shield`+`hot` para o léxico de cura. Guarda: `nomeEspecialCoerente.test.ts` (nenhuma palavra de uma família no léxico de outra). O servidor só valida o índice (8 por família). Efeito novo exige léxico novo e teste novo.
- Escada de preço: elemento 1.500 Bits + 12 frag + 3 poções; Coroa 2.000 + 70; Luvas 500 + 18. Fragmentos foram elevados em 10/11 para sumidouro (§283). Item novo de Coroa entra no degrau da Coroa.

---

## 2. Interação com o companheiro invocado

### 2.1 A Hexsmith nunca liga nem desliga a invocação
- Gatilho: `eEvocador(estagio, {arquetipoId, escolaDominante})` (`companheiroInvocado.ts:70`) = arquétipo do estágio na lista de 9 OU escola dominante = Evocação. Depende só da ficha, que a Hexsmith não toca. Flag única `COMPANHEIRO_INVOCADO` (`:23`), hoje `false`.
- Decisão do dono (16/11): NÃO haverá item "summonável"; quem é, continua sendo; quem não é, não vira. Garantias propostas:
  1. `HexSlot` não ganha nenhum valor que carregue "invocação", e `parseHexItem` continua só reconhecendo famílias, efeitos e elementos.
  2. Teste de contrato: para qualquer combinação de itens equipados (lista fechada de todos os valores), `eEvocador` e `companheiroAtivo` devolvem o MESMO resultado que sem Hexsmith.
  3. Teste de grep estilo `fighterIdentity.owner.test.ts`: `companheiroInvocado*.ts` não importa `hexsmith`, e `hexsmith*.ts` não importa `companheiroInvocado`. O papel do companheiro recebe `{familia, efeito, elemento}` já resolvidos, não o objeto de Hexsmith.
- Jogador que NÃO é evocador e tem item: nada muda no combate além do que o item já faz hoje (o especial dele muda, sem companheiro).
- Jogador que É evocador e tem item: o item muda o EFEITO que o companheiro executa no turno 1 (seção 2.2) e, via chip, o poder (seção 2.3). Remover o item volta ao especial original; a invocação continua.

### 2.2 O papel do companheiro por família efetiva
Hoje o plano de 16/11 (seção 2.2/7.1 do `PLANO-COMPANHEIRO...`) só dá papel a `shield`/`dot`/`heal`/`hot`, deixando `direct`, `atkBuff`, `defDebuff`, `spdBuff` sem invocação. Com a decisão nova do dono, TODA família efetiva ganha papel. Proposta de tabela única, tipada (`Record<FamiliaEfetiva, Papel>`: família nova sem linha não compila, padrão de `FAMILY_STATUS`, `combatFx.ts:454`):

| Família efetiva (com efeito) | Papel do companheiro no turno 1 | O que se vê (animações já existentes) |
|---|---|---|
| `direct` | ataca o alvo | investida `sm-bs-lunge` + impacto |
| `dot` | dano | investida e selo `dot` no alvo |
| `heal` | cura | aura de cura no conjurador |
| `shield` | tanque | barreira em volta do conjurador (`sm-bs-hit` ao absorver) |
| `shield`+`hot` | cura contínua | aura repetida nos 3 pulsos |
| `atkBuff` | incentivo | rugido/aura vermelha no conjurador, selo `buff atk` |
| `spdBuff` | rapidez | rastro de vento no conjurador, selo `buff spd` |
| `defDebuff` | quebra de guarda | golpe na couraça do alvo, selo `debuff def` |
| `defDebuff`+`slow` | amarra | laço/atoleiro no alvo, selo `lento` |
| `defDebuff`+`silence` | cala | selo `silencio` no alvo |
| (nova) `defBuff` | guarda | postura à frente do conjurador, selo novo |
| (nova) `atkDebuff` | enfraquece | sopro/sombra sobre o alvo, selo novo |
| (nova) `spdDebuff` | atrasa | idem lentidão |

Regras:
- O companheiro é a EMBALAGEM do efeito; não cria dano nem cura além do que o especial já dava (linha vermelha do plano de 16/11, seção 6). A duração segue o contador real do núcleo (`StageStatus.turns`, via `withRealFx`), não um timer.
- Turnos 2-3 do companheiro (ataque) seguem a regra do §444, independente da família.
- A família efetiva é a que o servidor publica para o oponente: `duelSide.fx.familia` (`_duel.js`) já leva `hexOverrides`; o `fx.companheiro` do PR 6 do plano de 16/11 carrega a mesma família efetiva. Conferir que nenhum caminho (Arena em grupo, onde há 1 companheiro POR COMBATENTE, `COMPANHEIROS_POR_COMBATENTE`) lê a família de ficha em vez da efetiva: risco de o companheiro executar o efeito ANTIGO depois da troca de Coroa. Teste: para cada Coroa, o papel do companheiro bate com o selo de `FAMILY_STATUS` da família efetiva.
- Raid e Chefe (`boss`) seguem sem invocação (decisão do plano de 16/11, cena apertada).

### 2.3 O chip e o "poder" da criatura
O que é "chip" no jogo: as três portas de ELEMENTO (Amuleto, Garra, Couraça), pagas com POÇÕES de elemento ("chip" que o Lab fabrica, `elementPotion.ts`; arte `chip-<elemento>.png`). Pedido do dono: para quem já é summonável, o chip afeta o PODER da criatura e nada mais.

Opções de leitura de "poder" (Q3, recomendada primeiro):
- **A (recomendada, neutra no combate):** o chip do Amuleto define o elemento do companheiro (cor da aura, selo, partícula) e o sabor de efeito que o elemento já dá à família (`efeitoDoEspecial`, `elementEffects.ts`: ex. Amuleto de Fogo + dot = queimadura; Amuleto de Ar + `defDebuff` = lentidão em PvE). A Garra define o elemento dos ataques dos turnos 2-3 (só visual: a vantagem de elemento continua vindo da regra existente de `hexArenaElements`). A Couraça não muda o companheiro. NENHUM número novo: mesmo `fight()`, mesmo gate de calibração, zero risco de "pay to win".
- **B (poder numérico dentro do teto):** o chip soma uma fonte nova ao teto único `COMBAT_BONUS_CAP = 0,05` por `combinedAttrBonus` (nunca multiplicador próprio, regra de CLAUDE.md). Como desde §373 Bit de Crédito paga HEX, é ESTE teto que limita a vantagem paga. Exige: espelho em `_combate.js` e `_equipment.js`, teste de paridade, medição de calibração. Custo/risco médio-alto.
- **C:** poder escalado pelo "nível" do chip (quantidade de poções queimadas). Rejeitada: cria degrau pago de vantagem e foge de "sem odds/sem sorteio" de CLAUDE.md só no nome; não recomendada.

Em A, "afeta o poder da criatura" cumpre-se como poder QUALITATIVO (identidade de elemento e efeito), não numérico. Isso deve ser dito ao dono sem ambiguidade em Q3.

Regras de CLAUDE.md respeitadas em qualquer opção: nada pago com dinheiro real dá vantagem de combate além do teto de 5% já existente; sem sorteio/odds/pity (teste lê a fonte); posse só cresce, item não se vende; itens novos pagam só Bits + fragmentos (+ poções, nos chips).

---

## 3. Plano dos itens novos (família × item)

Convenção de id: `coroa:<valor>`. Os 7 atuais seguem iguais. Nomes seguem o padrão "HEX de X" / "X HEX" com X curto no substantivo-família (como `HEX_FAMILY_COPY`).

### 3.1 Trilha A: Coroas de EFEITO (sem mexer no motor)
Idea: um item fixa o EFEITO de PvE que hoje só aparece se o jogador tiver o Amuleto certo. Dá ao jogador a escolha direta e ao companheiro um papel claro. No PvP não existe `effect` (PvP nunca chama `comEfeitoDoElemento`): em PvP o item cai na família-base (`shield` ou `defDebuff`) e a tela diz isso.

| Valor | Nome EN / PT | Efeito (família + effect) | Descrição curta | Custo | Ícone |
|---|---|---|---|---|---|
| `coroa:hot` | Mending Crown / Cura contínua | `shield` + `hot` | "Cura em 3 pulsos nas suas próximas ações (PvE). No duelo vira Escudo." | 2.000 Bits + 70 frag | `coroa-hot.png` |
| `coroa:slow` | Slowing Crown / Lentidão | `defDebuff` + `slow` | "Atrasa os golpes do alvo (PvE). No duelo vira Quebra de defesa." | idem | `coroa-slow.png` |
| `coroa:silence` | Silencing Crown / Silêncio | `defDebuff` + `silence` | "O alvo fica sem soltar especial por alguns golpes (PvE). No duelo vira Quebra de defesa." | idem | `coroa-silence.png` |

Pontos de código: `HEX_CROWN_VARIANTS = { hot: {family:'shield', effect:'hot'}, slow: {family:'defDebuff', effect:'slow'}, silence: {family:'defDebuff', effect:'silence'} }`; `parseHexItem` aceita os 3 valores (cliente e `_hexsmith.js`, paridade); `hexOverrides` ganha `specialEffect` ao lado de `specialFamily` (que vira a família-base); `comEfeitoDoElemento` dá prioridade ao efeito da Coroa quando a família bate. Nomes: `nomeParaFamilia` precisa de léxicos próprios (um nome de "cura contínua" usa o léxico de cura, `familiaDoNomeInimigo`; "lentidão" e "silêncio" pedem 8 substantivos novos cada, disjuntos dos da básica e das outras famílias; teste do §443 estendido).

### 3.2 Trilha B: famílias NOVAS (mexe no motor)
Cada uma espelha o contador de uma família existente, trocando o lado:

| Valor | Nome EN / PT | Mecânica (espelho de qual) | Descrição curta |
|---|---|---|---|
| `coroa:defBuff` | Guard boost / Reforço de defesa | contador `nGuard` no conjurador: os próximos golpes que ele RECEBE doem menos (espelho de `nVuln`, `fight.ts:346`, lado invertido) | "Os próximos golpes que você recebe doem menos." |
| `coroa:atkDebuff` | Weaken / Enfraquecer | contador `nWeak` no alvo: os próximos golpes que ELE dá batem menos (espelho de `nAtk`, `fight.ts:343`, no alvo) | "Os próximos golpes do alvo batem mais fraco." |
| `coroa:spdDebuff` | Slowdown / Lentidão | contador `nSlow` no alvo: intervalo entre golpes dele maior (espelho de `nSpd`, `fight.ts:349`, no alvo) | "O alvo ataca mais devagar por alguns golpes." |

Substituem a Coroa `slow` da trilha A? Não: `slow` é efeito de PvE sobre `defDebuff`; `spdDebuff` é família de verdade, em PvP e PvE. Se o dono escolher a trilha B, a `coroa:slow` da trilha A deve ser descartada (duplicaria o conceito). Ver Q1.

O que cada família nova obriga (estimativa de superfície, a conferir no PR 1 da trilha):
- `SPECIAL_FAMILIES`, `BUFF_FAMILIES`, `SPECIAL_POWER`, `SPECIAL_POWER_PVE`, `PVE_FAMILY_POWER` (3 motores), `AREA_FAMILIES` (debuffs miram o inimigo), `fight.ts` e `group.ts` (`cast`, `tickOwnTurn`, `FighterFx`), espelho `_combate.js` + `combate.parity.test.js`;
- calibração: régua pareada ±5% do 1v1 (`ruler.ts`, gate 5) e gates PvE ±3pp (`efeitosPve.medicao.test.ts`, `efeitosRegraTotal.test.ts`): potência por família TEM de ser medida, não chutada (padrão dos §325/§334);
- `PESO_FAMILIA_ESCOLA` (`nomeEspecial.ts:119`, "toda família com peso > 0 em toda escola") e `AFINIDADE_ELEMENTO`: família nova entra no sorteio do especial de TODOS os jogadores novos, o que muda o que jogadores novos recebem (decisão do dono, Q2); `foeFamilies.ts` para inimigos;
- `combatFx.ts` `FAMILY_STATUS` (`:454`), selos, `withRealFx`; `HEX_FAMILY_COPY`; léxicos de nome (8 por família, PT/EN) + `_especialNomeRegra.js` (índice) + testes de coerência;
- salvaguarda do save: família gravada em `fichaJornada` é imutável (PR15c); jogador existente NÃO muda.

Léxicos propostos (8 por família, a passar pelo teste de disjunção; PT entre parênteses): defBuff: Temper (Têmpera), Fortitude (Fortitude), Resolve (Resolução), Steadfast (Firmeza), Hardening (Endurecimento), Ironclad (Blindagem de Ferro), Stoneskin (Pele de Pedra), Unyielding (Inflexível). atkDebuff: Wither (Definhar), Languor (Langor), Malaise (Mal-estar), Sapping (Esgotamento), Fatigue (Fadiga), Dulling (Embotamento), Dread (Pavor), Slump (Abatimento). spdDebuff: Mire (Lamaçal), Drag (Arrasto), Tar (Piche), Quagmire (Atoleiro), Sludge (Lodo), Stupor (Torpor), Ebb (Vazante), Shackles (Grilhões). Atenção: "Blindagem" e "Postura" já nomeiam efeitos de elemento (`elementEffects.ts`), conferir colisão no teste.

### 3.3 Resumo da matriz depois do plano

| Efeito | Item | Trilha |
|---|---|---|
| Dano direto, DoT, cura, escudo, buff de ataque, buff de velocidade, quebra de defesa | 7 Coroas existentes | já feito |
| Cura contínua, lentidão (PvE), silêncio (PvE) | `coroa:hot`, `coroa:slow`, `coroa:silence` | A |
| Reforço de defesa, debuff de ataque, lentidão (PvP+PvE) | `coroa:defBuff`, `coroa:atkDebuff`, `coroa:spdDebuff` | B |

Preço: 2.000 Bits + 70 fragmentos por Coroa (a mesma escada). Comprar as 13 = 26.000 Bits + 910 fragmentos, em linha com o sumidouro de §283. `HEX_MAX_OWNED` sobe de +6 (A+B), sem efeito prático.

---

## 4. Arte a gerar

Regra do dono (09/11): criatura/sprite NÃO vai no ChatGPT (essa trilha usa os 32 sprites fixos de companheiro). Aqui só ícone de item e selo de UI, que vão no ChatGPT desktop (`chatgpt-preferido-sobre-gemini`), com alfa real na 1ª imagem de cada conversa (`assets-transparencia-real`: nunca chroma, prévia nunca em magenta), e cada imagem guarda prompt + tags no banco (`arte-salvar-prompt-e-tags`: `registro.jsonl` + `meta.json`; tags `tipo:item`, `uso:hexsmith-coroa`, `familia:<id>`, `origem:chatgpt`). Antes de gerar, o lote passa pela squad de design (`asset-novo-chama-squad-design`). Identidade (`docs/REGRA-IDENTIDADE-SOULMON.md`): ícone de item pode ter UM motivo discreto de identidade, nunca engrenagem, nunca muitas folhas; nos prompts sem motivo, escrever "no copper pipes, no circuit lines, no leaves, no turquoise crystals".

### 4.1 Lista (9 peças)

| # | Arquivo | Uso | Caixa final | Trilha |
|---|---|---|---|---|
| 1 | `src/assets/soulmon/hex/coroa-hot.png` | Coroa de cura contínua | 96×96 RGBA | A |
| 2 | `coroa-slow.png` | Coroa de lentidão | 96×96 | A |
| 3 | `coroa-silence.png` | Coroa de silêncio | 96×96 | A |
| 4 | `coroa-defBuff.png` | Coroa de reforço de defesa | 96×96 | B |
| 5 | `coroa-atkDebuff.png` | Coroa de debuff de ataque | 96×96 | B |
| 6 | `coroa-spdDebuff.png` | Coroa de lentidão (família) | 96×96 | B |
| 7-9 | `src/assets/soulmon/combate-v3/status/st-buff-def.png`, `st-debuff-atk.png`, `st-debuff-spd.png` | selos de status dos 3 efeitos novos (o companheiro e o palco os usam, hoje há `st-buff-atk/spd`, `st-debuff-def`) | mesma caixa dos `st-*.png` existentes (conferir no PR de arte) | B |

O companheiro NÃO precisa de arte nova por efeito: reaproveita as animações CSS existentes (seção 2.2).

### 4.2 Método (igual ao das Coroas por família, `docs/ASSETS-A-GERAR.md` §"Coroas da Hexsmith por família")
Gerar 1024², recortar a bounding box, reescala *nearest* para 96×96, anexar `slot-coroa.png` como referência de ESTILO em toda conversa, máx. 3 imagens por conversa (o ChatGPT só garante alfa na 1ª; se a 2ª/3ª vier sem alfa, regerar numa conversa NOVA). Conversas sugeridas: C1 = `hot`, `slow`, `silence`; C2 = `defBuff`, `atkDebuff`, `spdDebuff`; C3 = os 3 selos (referência de estilo: `st-debuff-def.png`). Conferir alfa real (`getextrema` do canal A com 0) e hash diferente entre as imagens da conversa. Gerar também com o Higgsfield NÃO (veto de 09/11).

### 4.3 Prompts-base (cada um = prompt-base abaixo + o trecho da peça)
Prompt-base (idêntico ao das 7 coroas): `Pixel-art game item icon, in exactly the same pixel-art style, scale, outline weight, palette depth and 3/4 front view slightly from above as the attached crown icon (use it only as the STYLE reference, not as the design). Chunky crisp pixels, dark 1-2 pixel outline, soft light from the top left, the crown centered and filling about 85% of the frame, no text, no letters, no box, no frame, no panel, no ground shadow, no gears. Transparent background with real alpha (PNG with a true alpha channel, not a checkerboard, not a solid colour). Square 1:1.`

- **hot:** `A rounded, gentle crown of living pale-green wood and cream cloth, a thin ring of soft green light pulsing three times around it drawn as three faint concentric arcs, small drifting motes of light rising slowly. One round turquoise gem on the front, nothing else in turquoise. No copper pipes, no circuit lines, no gears.`
- **slow:** `A heavy crown of dark wet clay and tar, points drooping and dripping downward, thick sticky strands stretching from the points like honey in slow motion, a snail-shell spiral engraved on the front band. No turquoise, no copper pipes, no circuit lines, no leaves.`
- **silence:** `A muted crown of dull grey felt-wrapped stone, a thick stitched cloth band wrapped across the front like a gag with a crossed-out sound-wave rune, small mute stars dimmed. No turquoise, no copper pipes, no circuit lines, no leaves.`
- **defBuff:** `A broad crown of layered tempered steel plates like stacked shields, a short visor-like brim, polished with a faint blue glint that spreads from the front plate, an upward chevron stamped on the centre. One small turquoise gem on the front. No copper pipes, no circuit lines, no leaves.`
- **atkDebuff:** `A crown of withered pale bone and grey thorns with the points bent downward and drooping, a hanging cracked sword emblem on the front, faint dark smoke sagging off it. No turquoise, no copper pipes, no circuit lines, no leaves, no skulls.`
- **spdDebuff:** `A crown shaped like a heavy turtle shell with a low domed back, mossy dark green and brown scutes, tiny stone weights hanging from the rim by short chains, a faint spiral of slow dust. No turquoise, no copper pipes, no circuit lines, no leaves.`
- **selos (st-buff-def, st-debuff-atk, st-debuff-spd):** `Tiny pixel-art status badge in exactly the same style, size, outline and palette depth as the attached status icons: [escudo com seta para cima / espada rachada com seta para baixo / relógio de areia lento com seta para baixo], no text, no box, transparent background with real alpha, square 1:1.` (o dono revisa se o selo repete bem a leitura dos atuais).

Os prompts passam pela squad de design antes de gerar; nenhum nomeia franquia ou personagem.

---

## 5. Plano em PRs pequenos

| PR | Conteúdo | Testes e riscos |
|---|---|---|
| H1 | Trilha A, dados: `HEX_CROWN_VARIANTS`, `parseHexItem`, `hexValuesOf`, `HEX_MAX_OWNED`, `hexOverrides.specialEffect`, `hexsmithCopy` (nomes, descrições, aviso "só PvE"), espelho `_hexsmith.js`. Sem UI nova (a tela lista pelos valores). | `hexsmith.test.ts`, `hexsmith.parity.test.js`, `save.hexForge.test.js` estendidos; id novo desconhecido por cliente antigo é descartado item a item (`sanitizeHexsmith`), a posse segue no servidor (autoritativo). Ordem de deploy: servidor primeiro. Risco baixo. |
| H2 | Trilha A, combate: `comEfeitoDoElemento` respeita o efeito da Coroa; PvP cai na família-base; léxicos de nome para `slow`/`silence`/`hot`. | `elementEffects.test.ts`, `efeitosPve.medicao.test.ts` (nenhum gate se move: o efeito já existe), `nomeEspecialCoerente.test.ts`. Risco baixo-médio. |
| H3 | Arte da trilha A: 3 coroas (seção 4), só soltar os PNG. | `coroa.test.ts` (glob), render test da tela. |
| H4 | Companheiro: tabela `papelDoCompanheiro(familiaEfetiva, efeito)` para as 7 famílias + efeitos, derivada do que `hexFamily` e `comEfeitoDoElemento` resolveram; testes de contrato da seção 2.1 (Hexsmith nunca liga/desliga a invocação). Depende do PR 2 do companheiro (#973 é só fundação). | Teste de igualdade de eventos de `fight()` com e sem companheiro nas 7 famílias × 3 efeitos; grep de importação cruzada; flag segue desligada. |
| H5 | Chip e "poder" (Q3): opção A = elemento/aura/selo do companheiro lidos do Amuleto e da Garra; nada numérico. | Mesmo teste de igualdade de eventos; teste de que Amuleto/Garra/Couraça não alteram `eEvocador`. |
| H6 | Trilha B, núcleo: 3 famílias novas em `specials.ts`, `fight.ts`, `group.ts`, `_combate.js`, `PESO_FAMILIA_ESCOLA`, `foeFamilies`, `FAMILY_STATUS`, `HEX_FAMILY_COPY`, léxicos. SÓ dados e motor, ainda sem Coroa, e jogador novo NÃO sorteia a família ainda (peso 0 temporário atrás de constante). | Régua pareada ±5% e gates PvE ±3pp medem a potência de cada nova família; `combate.parity.test.js`; recalibração de `SPECIAL_POWER`/`PVE_FAMILY_POWER`. Risco ALTO (calibração, paridade). |
| H7 | Trilha B, Coroas: `coroa:defBuff/atkDebuff/spdDebuff` + espelho servidor + arte. | Idem H1/H3; a família efetiva do duelo vem de `_duel.js` (testar o espelho). |
| H8 | Ligar a nova família ao sorteio do especial de jogadores novos (se o dono decidir, Q2) ou deixar só como Coroa. | Muda o que jogador novo recebe: gate do dono. Jogador existente não muda (família imutável em `fichaJornada`). |
| H9 | Selos de status dos 3 efeitos e ligação ao companheiro. | Teste de render de `BattleStage`, `FAMILY_STATUS` sem linha não compila. |

Rollback de cada PR: `git revert` (dados e textos); o save é aditivo e ignorado por quem não conhece (`hexsmith.owned` com id desconhecido é descartado só na leitura do cliente antigo; o servidor segue dono da posse). Compatibilidade de saves: nenhum campo novo no save além de ids novos em `hexsmith.owned`/`equipped`; migração não existe; `HEX_MAX_OWNED` só sobe. Sem APK novo (regra 5): só web.

Testes obrigatórios no conjunto: (1) paridade `hexsmith` src↔functions; (2) todo id de Coroa novo tem custo, nome PT/EN, descrição e arte (ou fallback `slot-coroa.png`); (3) para toda combinação de itens, `eEvocador`/`companheiroAtivo` iguais ao sem item; (4) `fight()` emite os MESMOS eventos com e sem companheiro; (5) a família efetiva que o servidor publica é a que o companheiro executa; (6) sem `Math.random` em Hexsmith e equipamento (teste lê a fonte); (7) `nomeEspecialCoerente` para cada família/efeito novo.

---

## 6. Perguntas para o dono (cada uma com opções e UMA recomendada primeiro)

**Q1. O que exatamente "falta"?** Hoje a Coroa já tem item e arte para buff de ataque, buff de velocidade e quebra de defesa (tirar armadura), mais direto, DoT, cura e escudo (7 de 7). O que falta de verdade são efeitos que o motor faz só em PvE pelo elemento do Amuleto (cura contínua, lentidão, silêncio) e efeitos que o motor ainda nem tem (reforço de defesa, debuff de ataque, lentidão real).
- A (recomendada): FAZER A TRILHA A agora (3 Coroas de efeito, sem mexer no motor, só PvE) e deixar a TRILHA B (3 famílias novas, exige calibrar o motor) como projeto separado depois de ver A funcionando.
- B: fazer só a TRILHA B (as 3 famílias novas, PvP e PvE; a Coroa de lentidão de PvE sai por duplicar).
- C: fazer A e B juntas (mais completo, 9 PRs, risco de calibração do motor misturado com a entrega).
- D: nada de item novo; só estender o companheiro para as 7 famílias que já têm Coroa (a "falta" era do companheiro, não da Hexsmith).

**Q2. Se a trilha B entrar, a família nova pode SAIR no sorteio do especial dos jogadores novos?**
- A (recomendada): não; só existe como Coroa (jogador novo não recebe, jogador existente não muda).
- B: sim, entra no sorteio com peso baixo por escola.
- C: sim, com o mesmo peso das outras.

**Q3. O que "o chip afeta o PODER da criatura" quer dizer?**
- A (recomendada): poder QUALITATIVO: o chip do Amuleto dá ao companheiro elemento, cor, selo e o sabor de efeito do elemento; a Garra dá o elemento dos ataques dele; nada de número novo (mesma luta com e sem chip).
- B: poder NUMÉRICO pequeno, dentro do teto único de 5% de combate (`combinedAttrBonus`); exige espelho no servidor e medição; vantagem fica limitada, mas existe (Bit de Crédito já paga HEX desde §373).
- C: qualitativo agora (A) e decidir o numérico depois de ver o companheiro no ar.

**Q4. No duelo (PvP), as Coroas de efeito de PvE (cura contínua, lentidão, silêncio) fazem o quê?**
- A (recomendada): viram a família-base (`shield`, `defDebuff`) e a tela avisa "só PvE", igual aos efeitos de elemento de hoje (honesto, sem mexer na régua do 1v1).
- B: ligar os efeitos no PvP (exige recalibrar a régua do 1v1 e o espelho; é a trilha B por outro caminho).
- C: a Coroa de efeito só fica à venda/equipável fora do duelo.

**Q5. Preço das Coroas novas.**
- A (recomendada): o mesmo da Coroa de hoje (2.000 Bits + 70 fragmentos), sem poção.
- B: um degrau acima (por ex. 2.500 Bits + 90 fragmentos) por serem efeitos mais raros.
- C: pedir também 1 poção do elemento "base" do efeito (cria ponte com os chips).

**Q6. O companheiro de "debuff/buff" executa o efeito em TODO caso ou só quando o jogador já tem a Coroa daquela família?**
- A (recomendada): sempre executa o efeito da família que VALE (a original da ficha, ou a da Coroa se houver); sem Coroa, o companheiro faz o que o especial dele já é.
- B: só executa quando há Coroa equipada (sem Coroa, o companheiro faz só o ataque).

**Q7. Arte.** Os 9 ícones (6 coroas + 3 selos) passam pela squad de design e saem do ChatGPT desktop: confirma que posso gerar quando o PC estiver liberado, ou o dono prefere aprovar os prompts primeiro?
- A (recomendada): a squad de design revisa os prompts e eu mostro 1 coroa de amostra (a `hot`) antes de gerar o resto.
- B: gerar tudo direto e o dono revisa as 9 depois.
- C: gerar só as 3 coroas da trilha A agora.

---

## 7. Fora de escopo e limites
- Nada aqui muda dano, cura, duração ou potência de nenhum especial EXISTENTE. A calibração dos 7 atuais não se move.
- O companheiro em si (flag, cena, sprites) é dos PRs 2 a 7 do plano de 16/11; este plano só define o que ele lê da Hexsmith.
- Raid e Chefe seguem sem companheiro; Arena em grupo usa 1 por combatente (§444).
- A página de assets e a geração real dependem de o PC estar liberado e de a squad de design aprovar os prompts.
