# Plano — Onboarding do Velado, forma BB e CORE

> Etiqueta: **plano** (29/10/2026). Nada aqui está implementado. Este documento é o
> briefing da sessão que vai executar. Decisões do dono tomadas em 29/10/2026 (modais
> desta sessão) estão marcadas **[D]**; o que ainda depende dele está em §9.
> Vale a partir da **versão oficial**; até lá roda atrás de interruptor (§7).

## 1. Objetivo

Trazer a **evolução** para o primeiro dia (hoje ela demora semanas para aparecer) e
abrir o jogo com uma sequência narrativa curta que ensina o laço central:
**cumprir uma tarefa real dá força ao Soulmon**.

## 2. Decisões já tomadas [D]

| # | Tema | Decisão |
|---|---|---|
| D1 | Oráculo | Passa a ser um **Velado ancião** (arquétipo de mentor que apresenta a missão; inspiração livre, sem citar nome de franquia nos prompts nem copiar silhueta). O bichinho atual do oráculo vira **o Soulmon dele**. |
| D2 | Forma nova | **BB**, anterior a rookie. Simples: sem as regras das outras formas. |
| D3 | HP do BB | **6 corações**, e **não perde nada** (virada, fome, cocô). Fase-vitrine. |
| D4 | Evolução do BB | Evolui ao atingir **Vínculo nível 2** (`bondLevelFor`, XP de tarefa). |
| D5 | BB trancado em | **Torneio, Duelo PvP e Guilda (missão/guerra)**. Masmorra, Arena e Pesadelo ficam abertos. |
| D6 | Geração grátis | **1 por e-mail**, para sempre (apagar a conta e refazer não devolve). O sprite fica **associado ao e-mail**: quem recria a conta recebe o MESMO. |
| D7 | O que se gera ⚰️ (substituído por D18) | **BB na criação; rookie sob demanda**, só quando o BB está prestes a evoluir (paga a 2ª imagem só de quem voltou). |
| D8 | Free depois do BB | **Evolui até rookie e trava**; dali a evolução pede a compra. |
| D9 | Preço | Desbloqueio completo **US$ 3,99 / R$ 19,90** (hoje R$ 29,90 / US$ 6,99). ⚰️ Era US$ 1,99; revisto no mesmo dia pela conta do §6.1. |
| D17 | Custo do pagante | **Formas sob demanda**: só o galho que o jogador alcança é gerado (pior caso cai de 15 para ~8 imagens). |
| D10 | Iniciais prontos | **Continuam no modo DEMO** (e como reserva quando a geração falhar). |
| D11 | "Você fez de verdade?" | Pergunta **sem castigo**: "ainda não" → o ancião espera ("vamos juntos, faço companhia"); "sim" → avança. |
| D12 | Pular | **Pula a fala, não as etapas**. Puzzle, tarefa e duelo são obrigatórios; "Rever a história" nas Configurações. |
| D13 | Puzzle | **Match-3 com meta mínima** + `GameTutorialFlow` após erros repetidos. |
| D14 | CORE | **CORE é o mapa atual** da Home (Hall, Mercado, Oficina…): muda nome e apresentação. |
| D15 | Reset oficial | **Arquivar e recomeçar**: todo save do beta é copiado para arquivo; compras e Créditos reais são mantidos. |
| D16 | Duelo do onboarding | Dupla (jogador + ancião) contra o Desfeito e o Soulmon-pesadelo dele. **Quem toma dano é o ancião**, nunca o jogador. A luta corta em ~⅓ da vida do inimigo. |

## 3. O roteiro (sequência de interações, não vídeo)

| # | Cena | Interação | Reuso |
|---|---|---|---|
| 0 | Ritual do oráculo | perguntas atuais, conduzidas pelo ancião | `SoulmonOnboarding.tsx` |
| 1 | Nascimento | geração do BB (API) → ovo/reveal | `OnboardingOvo`, `generate-sprite.js` |
| 2 | "Acorde…" | tela preta, fala do ancião, **música de suspense**; clareia: o ancião com a mão estendida, num lugar da Malha | `musica.ts` (faixa nova) |
| 3 | Fuga | o Desfeito persegue no escuro; **glitch / pixels se desfazendo** na tela | overlay novo (base: `dungeon-vhs`) |
| 4 | A parede | Match-3 fácil; após N erros entra o passo a passo | `Match3Game`, `GameTutorialFlow` |
| 5 | A bifurcação | escolha de caminho (cosmética; pode virar sabor de lore) | — |
| 6 | O Desfeito alcança | ancião pede **uma tarefa real**; a lista de tarefas abre; "você fez de verdade?" (D11) | lista de atividades |
| 7 | Duelo em dupla | dano só no ancião; corta em ⅓ | `NightmareBattle` + modo 2v1 **novo** |
| 8 | Resgate | Velado da Mão lança a **lanterna-granada** (clarão turquesa); fogem | animação nova |
| 9 | CORE | apresentação da cidade → Home normal | mapa atual renomeado |

⚠️ A cena 6 exige que a pessoa já tenha **cadastrado** ao menos uma tarefa. O ritual
atual já pergunta objetivos; a sessão de execução precisa garantir que a criação de
1ª tarefa venha ANTES da cena 6 (ou dentro dela, com o ancião ajudando a escolher uma
pequena).

## 4. A forma BB — regra

- Estágio novo `bb` em `src/types/progression.ts`, **antes** de `rookie`. HP máx 6.
- **Sem**: requisito diário, gauge de evolução, perda de coração, dreno de cocô/fome,
  folga semanal. É o único estágio em que `computeDailyReset` não cobra nada.
- Evolução: `bondLevelFor(totalXP) >= 2` habilita a cerimônia (manual, como hoje).
- Trancado (D5) com recusa motivada, no padrão de `rebirthRefusal`.
- Servidor: espelho em `functions/api/_*.js` (Torneio/Duelo/Guilda recusam BB) com
  teste de paridade. Save: leitura tolerante + migração idempotente (regra 1 de
  Compatibilidade do `CLAUDE.md`). `saveCompat.contract.test.ts` precisa da linha nova.
- ⚠️ O `CLAUDE.md` diz que um estágio antes de rookie "não foi reintroduzido" e lista
  o custo (sprite, HP, requisito, masmorra). Esta decisão revoga isso só para `bb`;
  a sessão de execução registra no `REGISTRO-DE-DECISOES.md` e atualiza o `CLAUDE.md`.

## 5. Geração grátis por e-mail (D6/D7)

- Chave no servidor: `freeGen:<saveId>` (saveId já é SHA-256 do e-mail). Guarda a URL
  do BB e, depois, a do rookie. **Nunca é apagada** junto com a conta — é o que
  impede refazer a conta para gerar de novo e o que devolve o MESMO sprite.
  ⚠️ Privacidade: guardar o hash (não o e-mail) e declarar na política, porque
  sobrevive à exclusão de conta. Validar com `PRIVACY_VERSION` se for material.
- O rookie sob demanda dispara quando Vínculo ≥ 2 é atingido (ou ao abrir a cerimônia),
  com fallback para um inicial pronto se o provedor falhar.
- Custo: medir em `custo-geracao-sprite.md` (Higgsfield 2.0 Alpha) × projeção de contas.

## 6. Monetização (D8/D9)

- Free: BB → rookie de graça; a partir de rookie, `canEvolve` exige `accountTier:'paid'`
  e a cerimônia mostra o `UnlockNudge` (motivo novo `evolve-free`).
- Preço: trocar `FULL_UNLOCK_PRICE_LABEL(_USD)` + Play Console + `publishedPrice.test.ts`.
- Linha vermelha que continua: dinheiro nunca compra cuidado nem HP.

### 6.1 Reanálise do preço (29/10/2026)

O dono pediu para refazer a conta: custo de TODOS os sprites (com 3 rerolls do rookie),
margem e o subsídio de quem gera até o rookie e para.

**Premissas** (trocar quando houver dado real):

| Item | Valor | Fonte |
|---|---|---|
| Custo por imagem | **US$ 0,024** (Higgsfield 2.0 Alpha, low, 1k) | medido, `INVENTARIO-ASSETS.md` (NPCs do Torneio) |
| Margem de segurança (falha, refação por recusa, fallback) | ×1,3 | estimativa |
| Taxa da Play | 15% (programa para pequenos devs) | Play Console |
| Impostos/IOF no BR (sobre o líquido) | ~10% | estimativa — confirmar com contador |
| Chat de IA por pagante, vida útil | ~US$ 0,10 | review de monetização 03/08/2026 (Groq barato) |

**Custo por perfil:**

| Perfil | Imagens | Custo (×1,3) |
|---|---|---|
| Grátis que para no BB | 1 | US$ 0,031 |
| Grátis que chega ao rookie | 2 | US$ 0,062 |
| **Grátis médio** (50% chegam ao rookie) | 1,5 | **US$ 0,047** |
| **Pagante** — BB + rookie + 3 rerolls + 10 formas restantes (pior caso: árvore inteira) | 15 | US$ 0,47 + chat 0,10 = **US$ 0,57** |

**Custo total por pagante** = custo dele + subsídio dos grátis (grátis por pagante =
(1 − conversão) / conversão):

| Conversão grátis→pago | Grátis por pagante | Subsídio | **Custo por pagante** |
|---|---|---|---|
| 2% | 49 | US$ 2,30 | **US$ 2,87** |
| 3% | 32 | US$ 1,52 | **US$ 2,09** |
| 5% | 19 | US$ 0,89 | **US$ 1,46** |
| 8% | 11,5 | US$ 0,54 | **US$ 1,11** |

**Receita líquida por preço** (após 15% da Play e ~10% de imposto ≈ 76,5% do bruto):

| Preço | Líquido | Margem a 3% de conversão | Margem a 5% |
|---|---|---|---|
| US$ 1,99 / R$ 9,90 | US$ 1,52 | **−37%** (prejuízo) | **+4%** |
| US$ 2,99 / R$ 14,90 | US$ 2,29 | +9% | +36% |
| US$ 3,99 / R$ 19,90 | US$ 3,05 | +31% | +52% |
| US$ 4,99 / R$ 24,90 | US$ 3,82 | +45% | +62% |
| US$ 6,99 / R$ 29,90 (hoje) | US$ 5,35 | +61% | +73% |

**Leitura:**
- A US$ 1,99 o produto **só fecha a conta se ≥ 5% dos grátis comprarem**, e com margem
  quase zero. A 3% (comum em app freemium), cada venda dá prejuízo.
- O subsídio do grátis é o que mais pesa (mais que os 15 sprites do pagante). As
  alavancas que mais mexem: **conversão** e **custo do grátis**.
- Alavancas para baixar o custo do grátis: gerar o BB num modelo mais barato; só gerar
  o rookie de quem voltou no dia 2 (já é D7); limitar a geração grátis por aparelho além
  do e-mail (contas descartáveis).
- Alavanca para o pagante: gerar as formas **sob demanda** (só o galho que ele de fato
  alcança), o que corta o pior caso de 15 para ~8 imagens.
- Os Créditos (reroll extra, troca por Bits) são receita **adicional** e não entram
  nesta conta.

**Faixa recomendada para decisão:** US$ 3,99 / R$ 19,90 (margem saudável já a 3%),
ou US$ 2,99 / R$ 14,90 com geração sob demanda + meta de conversão ≥ 5% medida na 1ª
semana. **Decidido (29/10/2026): US$ 3,99 / R$ 19,90 + formas sob demanda (D9, D17).**

## 7. Como testar em paralelo

Interruptor `ONBOARDING_VELADO` (servidor decide, por lista de e-mails de teste),
desligado em produção. O beta segue igual. No lançamento oficial: liga + reset (D15).

## 8. Ordem de execução sugerida (uma sessão por bloco, cada um com PR)

1. **Roteiro e copy** (EN primeiro, PT depois) — `/squad-narrativa`.
2. **Forma BB** — regra, save, servidor, testes, guia (`GuideModal`/`HelpModal`).
3. **Geração por e-mail** — `freeGen`, rookie sob demanda, fallback, política.
4. **Player de sequência** + cenas 2/3/5/8/9 (glitch, música) — atrás do interruptor.
5. **Puzzle e tarefa** (cenas 4 e 6).
6. **Duelo 2v1 com dano só no ancião** (cena 7).
7. **Arte e som** — `/squad-arte` (ancião, Desfeito, Soulmon-pesadelo, Velado da Mão,
   lanterna-granada, prompt do BB fofinho e redondo) e `/squad-som` (faixa de suspense).
8. **Preço e trava de evolução do free**.
9. **Reset oficial** (arquivo dos saves, preservação de compras) — só no lançamento.

## 9. Ainda depende do dono

- Nome do ancião e do Velado da Mão (EN primeiro).
- Se a bifurcação (cena 5) muda algo (ex.: inclina o caminho Poder/Harmonia/Benevolência).
- Data do lançamento oficial (dispara §7 e D15) e aviso aos testadores.
- Aprovar o texto da política de privacidade sobre o hash que sobrevive à exclusão.

## 10. Brainstorm (ideias extra, não decididas)

- **Ancião como NPC fixo na CORE**: depois do onboarding, ele mora num prédio e entrega
  a 1ª missão semanal — reaproveita a arte e dá continuidade.
- **O Desfeito volta**: o mesmo Desfeito reaparece como chefe da Feira mais tarde
  (gancho narrativo sem custo de regra).
- **Pré-gerar o rookie em segundo plano** só quando Vínculo chegar a 1, para a
  cerimônia não esperar a API.
- **Cartão de compartilhar** a 1ª evolução (BB → rookie lado a lado) — canal de
  distribuição, que é o gargalo do projeto.
- **Telemetria do funil**: medir onde a pessoa para no onboarding (cena a cena) para
  decidir o que encurtar.

## 11. Prédio novo: Guilda dos Mercenários (29/10/2026)

Um prédio novo da CORE com **um Velado de cada clã principal** (Filtradores =
Benevolência, Tecelões = Harmonia, Rompentes = Poder). Por dia o jogador escolhe **um**
dos três e recebe dele **uma missão**: uma atividade benéfica, com evidência, do tipo
daquele clã.

| # | Decisão do dono |
|---|---|
| M1 | **1 missão por dia do jogador**, de um clã só (`playerDayKey`). Escolheu, os outros dois esperam o dia seguinte. |
| M2 | A atividade é **sorteada dentro do tipo**, só entre itens do `activityCatalog.ts` com evidência **A ou B** (`catalogo-evidencia`). |
| M3 | Confirmação pela **pergunta de honestidade** (a mesma do onboarding, D11): "ainda não" deixa a missão aberta até o fim do dia, sem castigo. |
| M4 | Recompensa: **só pontos do tipo do clã**: **3** (atividade rápida, `effort` 1) ou **5** (média/projeto, `effort` 2–3). Não entra na meta diária, não dá XP nem Bits. |
| M5 | Só a partir do **rookie** (o BB fica de fora). |

**Que categoria é de que tipo** (dono: `CATEGORY_ATTRIBUTES`, `src/types/attributes.ts`;
vale a categoria cujo maior valor é o do tipo):

| Clã | Tipo | Categorias |
|---|---|---|
| Rompentes | Poder | Creativity (3), Fitness (2) |
| Tecelões | Harmonia | Study (3), Work (2), Wellness (2) |
| Filtradores | Benevolência | Discipline (3), Health (2), Social (2) |

**Regras para a sessão de execução:**
- Estado novo no save, por exemplo `mercMission {day, clan, activityId, done}`, com
  leitura tolerante, migração idempotente e espelho no servidor com paridade (regra 1
  de Compatibilidade). Os pontos passam pelo mesmo caminho dos atributos
  (`powerPoints`/`attributesSinceLastEvolution`), nunca por um somador próprio.
- O sorteio é **determinístico por dia** (semente = dia do jogador + clã): reabrir o app
  não troca a missão. Mesma lição das missões semanais.
- Linhas vermelhas: a missão é **convite**, não cobrança. Não fazer não custa nada,
  sem contador de missões perdidas e sem streak. A copy não pode prometer saúde (L8):
  o Velado diz o que a atividade é, nunca o que ela cura.
- Os pontos de tipo **inclinam a evolução**. 5 pontos por dia num tipo pesa no galho.
  Antes de executar, o `catalogo-balanceador` simula se isso não domina a categoria
  das tarefas normais (comida dá 1–3 por refeição).
- Arte: três NPCs reaproveitando as folhas de conceito dos clãs; o prédio entra no
  lote do mapa pela `/squad-arte`.

**Ainda depende do dono:** nome do prédio em inglês (proposta: *Mercenary Guild*), nome
de cada um dos três Velados e se a missão vira uma tarefa na lista de atividades ou
fica só no prédio.

**Execução (30/10/2026, branch `ob-guilda`).** Feito: estado `mercMission {day, ordem, activityId, done}`
(`src/utils/mercMission.ts`; espelho `functions/api/_mercMission.js`, paridade e linha no
`saveCompat.contract.test.ts`); sorteio por dia + Ordem entre itens A/B (sem `optInOnly`); pontos 3 (esforço do
nível 1 = 1) ou 5 (2-3) pelo caminho do `feedFood`; BB recusa; painel `MercGuildSheet` (retratos placeholder
`merc-filtrador/tecelao/rompente.png`, ainda sem arquivo) aberto por um chip no mapa atrás de `ONBOARDING_VELADO`.
Sem prédio nem arte. **Rollback:** reverter os commits; um save já com `mercMission` volta a ignorar o campo e os
pontos pagos ficam (são pontos de atributo comuns).

**Simulação de 30 dias** (`mercMission.simulacao.test.ts`; tarefa normal = 1 comida de categoria sorteada, 4 pts):

| Tarefas/dia | Ordem | Normais | Missão | Missão no total | Pior tipo (parte da missão) |
|---|---|---|---|---|---|
| 2 | rotativa | 240 | 98 | 29,0% | 36,9% |
| 2 | sempre Rompentes | 240 | 110 | 31,4% | 62,5% |
| 4 | rotativa | 480 | 106 | 18,1% | 19,9% |
| 4 | sempre Rompentes | 480 | 110 | 18,6% | 45,6% |
| 6 | rotativa | 720 | 108 | 13,0% | 18,6% |
| 6 | sempre Rompentes | 720 | 110 | 13,3% | 32,5% |

Leitura: no total a missão não domina (13-31%). **Achado:** quem repete a mesma Ordem todo dia e faz poucas tarefas
(2/dia) tira ~62% do tipo daquela Ordem da missão; com 4/dia, ~46%. A recompensa foi ligada como o dono decidiu
(3/5); se o dono quiser frear, a alavanca é `pontosMerc` (ex.: 2/3).

## 12. Pool de BBs prontos (29/10/2026) — muda D6/D7

| # | Decisão do dono |
|---|---|
| D18 | O BB **não é gerado por usuário**. Existe um **pool de ~200 BBs** prontos, e cada jogador recebe um por sorteio. A forma única começa no **rookie**. |
| D19 | O sorteio é **filtrado pelo oráculo**: cada BB do pool é marcado por elemento/reino, e o sorteio fica dentro do que combina com a leitura. Determinístico pelo saveId, para o mesmo e-mail cair no mesmo BB. |
| D20 | O sprite do BB **não é referência** para gerar o rookie. O BB é berço; o rookie nasce só da leitura do oráculo. |
| D21 | O pool é **gerado uma vez pela `/squad-arte`** (~200 × US$ 0,024 ≈ US$ 5), conferido e instalado como arte nossa (`src/assets/soulmon/`, régua de franquia valendo). |

**O que muda no resto do plano:**
- D6 continua (1 geração grátis por e-mail), mas agora a geração grátis é **o rookie**,
  feita quando o BB atinge o Vínculo 2. Quem nunca chega lá custa **zero** de API.
- Cena 1 do roteiro (§3): o "nascimento" passa a revelar o BB sorteado, sem esperar a API.
  O onboarding fica mais rápido e não depende do provedor estar no ar.
- O prompt do rookie não recebe imagem do BB (D20); a cerimônia BB → rookie é a
  revelação da forma única. A copy pode tratar isso como "o berço ficou pequeno".

**Conta de custo refeita (substitui as linhas de custo do §6.1):**

| Perfil | Imagens | Custo (×1,3) |
|---|---|---|
| Grátis que para no BB | 0 | US$ 0 |
| Grátis que chega ao rookie | 1 | US$ 0,031 |
| **Grátis médio** (50% chegam ao rookie) | 0,5 | **US$ 0,016** |
| **Pagante** — rookie + 3 rerolls + formas sob demanda (~4) | ~8 | US$ 0,25 + chat 0,10 = **US$ 0,35** |

| Conversão | Custo por pagante (com subsídio) | Margem a US$ 3,99 (líquido US$ 3,05) |
|---|---|---|
| 2% | US$ 1,13 | +63% |
| 3% | US$ 0,87 | +71% |
| 5% | US$ 0,65 | +79% |

Com o pool, até **US$ 2,99** (líquido US$ 2,29) fica com ~62% de margem a 3% de conversão.
O preço decidido (D9, US$ 3,99) segue; se quiser baixar, a conta agora permite.

## 13. Execução — decisões de 30/10/2026

| # | Decisão do dono |
|---|---|
| D22 | Os 5 grupos dos Velados se chamam **Ordem** (EN *Order*), ex.: Ordem dos Tecelões. "Clã" fica só para Salão do Clã / Guerra de Clãs. |
| D23 | Cinemática **híbrida**: quadro a quadro estilo PS1/PS2 (fundos + NPC em 2–4 poses, cortes secos, parallax leve, legenda) nas cenas 2, 5, 8 e 9; **vídeo Gemini mudo + legenda** só na fuga (3) e no resgate (8, se valer). Áudio = música/ambiente do app, sem voz. |
| D24 | **Tutorial de alimentar** entra na **cena 6, depois da tarefa**: o ancião diz que força = tarefa + alimento; abre a bolsa, arrasta a comida até o BB. |
| D25 | Arte dos Velados: **busto no padrão NPC** do app (molde canônico), inspirado nas folhas de conceito das 5 Ordens (refs GPT em estilo diferente: servem de ideia, não de estilo). Gerar no ChatGPT. |

## 6.2 Implementação D8/D9/D17 (30/10/2026)

- **D8**: `src/utils/evolutionPaywall.ts` (fonte única) chamada em `canEvolve`, `handleEvolve` e `handleEvolveRequest` (App.tsx). Grátis evolui BB→rookie; do rookie em diante pede `accountTier:'paid'`. Convite `UnlockNudge` motivo `evolve-free` na aba Evolução (copy EN+PT), mesmo funil de telemetria de `evolution`. Não existe validação de evolução no servidor (é 100% cliente); o espelho é `generate-sprite.js` (402 `paid-tier-required`), coberto por teste de paridade.
- **D9**: `FULL_UNLOCK_PRICE_LABEL(_USD)` viram R$ 19,90 / US$ 3.99 com o interruptor ligado (`*_VELADO` em `monetization.ts`). Play Console e `termos.html` são do dono (ver PERGUNTAS-DO-DONO).
- **D17 (não implementado)**: as formas são geradas hoje por `useRegenAparencia`/`spriteTrigger.ts` (`spriteBatch`/`birthBatch`: lote da forma-destino + próximas) chamando `functions/api/generate-sprite.js` (exige conta paga, cap por forma e vitalício). Ponto de troca para "sob demanda": `spriteBatch` em `src/utils/spriteTrigger.ts`, limitando o lote à forma que o jogador alcança (`targetFormId`) em vez de pré-gerar o galho; fica para uma tarefa própria por tocar custo/caps do servidor.
## Cenas 0 e 1 (implementação, ob-cena0)

- Cena 0 (D1): com `ONBOARDING_VELADO`, a apresentação (AMBRA_INTRO) e o passo do nome mostram o ancião (`velado-anciao`) com as falas `ROTEIRO.c0`, e o bichinho do oráculo (placeholder `dormant`) ao lado como o Soulmon dele. Mesmas perguntas e resultado. Desligado = Ambra/oráculo atuais.
- Cena 1 (D18): prop injetável `obterBB()` em `SoulmonOnboarding`; devolve `{url, formId}` e o nascimento revela na hora, sem API, com a copy "o berço" (`BERCO`, EN+PT). Default ausente/null = nascimento atual. TODO: ligar a `sortearBB` de `src/data/bbPool.ts` (outra frente).
- 1ª tarefa antes da cena 6: o ritual já cria a tarefa (`firstTaskValue` -> `firstTaskFrom` -> `initialActivities` no `onComplete`, campo com sugestão pré-preenchida). Escolha: não criar outra; a `EtapaTarefa` da cena 6 só pede o "fez de verdade?" sobre ela.

## 14. Decisões de 30/10/2026 (2ª rodada)

| # | Decisão do dono |
|---|---|
| D26 | Prédio: **Mercenary Guild** / Guilda dos Mercenários. |
| D27 | Recompensa da missão **mantém 3/5** pontos, mesmo com a simulação (46–62% de um tipo para quem repete a Ordem). |
| D28 | O `freeGen` que sobrevive à exclusão de conta é **declarado na política** (hash irreversível + imagem gerada); sobe a `PRIVACY_VERSION`. |
| D29 | Pool de BBs começa com **50** (~US$ 1,20), amplia depois. |
