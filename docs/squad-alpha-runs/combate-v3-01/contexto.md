# Bloco de contexto — Combate v3 do Soulmon (run `combate-v3-01`)

| Meta | Valor |
|---|---|
| Resolvido em | 04/10/2026 |
| Fontes usadas | Despacho do dono via laço principal (Q1/Q2/Q4/Q5 respondidas) · `D:\Soulmon\HANDOFF-COMBATE-V3.md` (copiado para `docs/PLANO-COMBATE-V3.md`) · repo `D:\Soulmon\repo` (`CLAUDE.md`, `docs/manual/00-MAPA.md`, `docs/REGISTRO-DE-DECISOES.md` §20/§23) |
| Lacunas abertas | Q3, Q6, Q7, Q8, Q9 (ver §2.2) · regra exata de "dia que conta para evolução" (a descobrir no código — curador) |

## §1 Organização
Soulmon — app de produtividade gamificado do gênero v-pet (hábitos/tarefas reais fazem a criatura crescer). Estágio: pré-lançamento; **ninguém usa em produção** (00-MAPA, 07/09/2026) — sem telemetria. Dono único (solo dev + IA).

## §2 Alvo do run
Combate v3: atributos lineares ATK/DEF/SPD/HP (unidade = golpe) + golpe especial com nome gerado e efeito por família (dano, DoT, cura, buff, debuff, escudo) com paridade de tempo provada por simulação.

### §2.1 Decisões do dono já respondidas (04/10/2026)
- **Q1** Ponto do dia vai para o atributo do galho dominante do dia: Poder→ATK, Harmonia→SPD, Benevolência→DEF. **HP sobe só na evolução.**
- **Q2** O ponto é dado em **cada dia que conta para evolução** (mesma regra que o jogo já usa — descobrir no código).
- **Q4** Boost de evolução ×1,5 **arredondado para cima**, nos 4 atributos.
- **Q5** Vantagem elemental vira **±1 golpe** (linear).

### §2.2 Abertas (pendências ao dono — não inventar)
Q3 piso de `golpesParaDerrubar` / teto da escada · Q6 especial muda ao evoluir / `E` cresce · Q7 selo na tela · Q8 nome por regra ou IA · Q9 saves existentes.

## §3 Usuário(s)
Jogador casual de v-pet/produtividade, mobile-first (Android/Capacitor + web + desktop Electron). Combate é idle/"torcer em vez de comandar" (taps de torcida, energia dispara especial). Detalhe de ICP em `docs/manual/01-VISAO.md` §3. ⚠️ Dois perfis: jogador de PvE solo e o PvP do Torneio (servidor autoritativo) — paridade cliente/servidor obrigatória.

## §4 Métrica-norte + entrada
Sem telemetria (sem usuários). Métrica do run = **régua de balanço por simulação**: tempo para vencer de cada família de especial dentro de ±5% da referência dano direto; spread de win rate ≤ 20pp (precedente `arena.test.ts`); duração de luta PvE ~20–29 s, PvP ~35–42 s (REGISTRO §20). Métrica de produto: `[a definir]` (retenção é hipótese).

## §5 Restrições duras
Funções PURAS (sem React) com um dono por regra · paridade cliente/servidor travada por teste (`functions/api/_duel.js`) · save saneado no load e em `functions/api/save.js` + teste de contagem de campos · tsc (app + `tsconfig.server.json`), vitest, `npm run build` (dist commitado) antes do PR · PR + CI verde + merge ff por fase (autorizado) · worktree `E:/soulmon-cv3` · EN primeiro + PT-BR · commits PT-BR com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` · arquivos grandes em `E:\`.

## §6 Restrição regulatória / política
Documentado: linhas vermelhas do produto (`01-VISAO.md` §7; handoff §8) — perder luta nunca custa coração; atributo/especial nunca é vantagem paga (Créditos não compram atributo); sem punição (dia ruim não tira ponto); copy sem cobrança/FOMO (`copy.semFomo`); sem nomes/números de franquia nem sufixo "-mon" (`narrativa.contract.test.ts`, `NARRATIVA-E-UNIVERSO.md`). IA opcional (`/api/chat`, Groq) exige higienização e fallback offline. Nenhuma norma legal externa documentada → lacuna, se surgir, vai ao dono.

## §7 Marca e voz
Design system **canônico** (`04-IDENTIDADE-VISUAL.md`, `src/index.css`). Voz: EN primeiro, PT natural (não calco), sem cobrança. Lane de marca não se aplica.

## §8 Stack e ambiente
React + TypeScript + Vite, Capacitor/Electron, Cloudflare Pages Functions (`functions/api/*.js`), vitest. Rastreador: GitHub (PRs/CI). Analytics: nenhum ativo.

## §9 Donos por disciplina
| Disciplina | Dono |
|---|---|
| Produto / game design | Dono do Soulmon (perfil do run: produto/game design) |
| Design | Dono do Soulmon |
| Tech | Dono do Soulmon (execução delegada a Claude) |
| Negócio | Dono do Soulmon |
| Jurídico | Dono do Soulmon `[sem jurídico separado declarado]` |

## §10 Fora de escopo
Monetização de atributos; mudar a economia de galhos de evolução (`powerPoints/harmonyPoints/benevolencePoints`); arte nova; som novo (superfície nova nasce muda); minijogos fora das 4 lutas (Arena, Masmorra, Pesadelo, Duelo do Torneio).

## §2.3 Decisões do checkpoint da Fase 0 (04/10/2026, dono: CONTINUAR)
- **F1** Paridade de especiais = **win rate no espelho ±5pp** contra a referência dano direto. Tempo/HP só informativos.
- **F2/Q3** Piso de **3 golpes** em `golpesParaDerrubar`. **HP também ganha ponto diário**, por **rodízio** (default declarado pela squad): a cada 4º dia que conta, o ponto vai para HP; nos outros, para o atributo do galho dominante do dia.
- **X4** Anel, esquiva e torcida ficam **fora da régua**, limitados a ±25% de efeito.
- **Q8** Nome por **regra determinística, sem IA**. **Q9** Saves antigos ganham pontos retroativos por `totalPerfectDays`.
- **Defaults declarados (confirmar no próximo checkpoint):** Q6 nome fixo por estágio + orçamento `E` constante em golpes (escala sozinho). Q7 nome próprio do especial no lugar de "ESPECIAL!". Glitchtama NÃO dá ponto de combate. Desempate do espelho: vence quem tem mais % de HP restante, depois seed determinística do servidor.
- **S1** `save.js` e `_duel.js` clampam `combatStats` (teto = base + ganho máx × dias de conta do servidor).

## §2.4 Decisões do checkpoint da Fase 1 (04/10/2026, dono: AJUSTAR) — SUBSTITUEM §2.3 onde conflitarem
- Régua = **tempo para vencer no espelho ±5%** (determinística). Win rate sai.
- Curva = **golpes = ceil(HP×(1+DEF/k)÷(1+ATK/k))**, e o HP cresce junto.
- Energia também **por tempo e por dano recebido**, garantindo 1 especial por luta.
- Buff SPD: **mantido**, calibrado na Fase 2 com a régua nova.
- **CORREÇÕES dos defaults da squad:**
  - Q6: **cada estágio gera um especial NOVO (nome e efeito)**.
  - Q7: o selo mostra só o nome próprio.
  - **Glitchtama DÁ ponto.** Invariante: todo Soulmon do mesmo estágio evolui com o **mesmo total de pontos** (derivar a regra; tem de valer com degeneração e com o zerar na evolução).
  - **Empate no espelho é resultado válido** (ninguém ganha). Sai o desempate por %HP/seed.
  - HP a cada 4º dia que conta: mantido como default.

## §2.5 Decisões do re-spike da Fase 1 (04/10/2026)
- **Dano fracionário**: a barra anda em frações; só a exibição arredonda.
- Buffs: aceita −15% no rookie, sem conversão em dano.
- DEF puro: aceito como tanque, teto de 40 s.
- Degeneração: os pontos **espelham perfectDays** (tira e recupera; invariante exato). A copy segue `copy.semFomo`, sem tom punitivo.
- O dono pré-autorizou: se a confirmação fechar sem FATAL, gate F1 aprovado e a Fase 2 abre (1º PR: núcleo puro + especiais + simulador como teste vitest, sem UI).

## §2.6 Decisões da confirmação F1 (04/10/2026)
- Curva **re-escala por estágio**: dentro do estágio, +1 ponto ≈ 1 golpe (~10%); entre estágios o equilíbrio vem do ×1,5.
- Cura e escudo calibrados por estágio.
- Critério mínimo de valor do ponto (declarado pela squad, fixo): **+1 ponto ≥2% do TTK em todo dia medido**.
- Pré-autorizado: se fechar sem FATAL, gate F1 aprovado e o Builder abre (1º PR: núcleo + especiais + simulador vitest).

## §2.7 VOLTAR para a Discovery com escopo ampliado (05/10/2026, dono)
Os spikes da F1 estão em `prototyper/_superseded/` como evidência. Lições: com a curva aditiva o build puro domina, com a multiplicativa domina o distribuído, e o estágio longo quebra o equilíbrio.
- Registrado: teto de pontos por estágio; DEF resolvido pelo teto; buffs calibrados por estágio.
- **Proposta do dono: LEVEL + XP no lugar de "1 ponto/dia".**
  - Soulmon:
    - Toda atividade dá XP, ~66% vem do bônus de dia completo e o resto das tarefas.
    - Teto de level por estágio. A evolução continua presa às atividades reais (regra de dias perfeitos intacta).
    - O level define o TOTAL de pontos; o galho dominante decide a distribuição, com limite.
  - Usuário:
    - Level separado. O Soulmon pode regredir por degeneração; o usuário não.
    - Os gates ficam no level do usuário: Arena/PvP, Torneio, andares altos de Masmorra/Pesadelo, Renascimento.
    - 1 ponto de talento por level.
  - Árvore de talentos do usuário:
    - Caminhos PvP / PvE / Comércio, com pontos nunca suficientes para tudo.
    - Vantagem numérica ~5% e/ou só fora do PvP: a squad propõe e pergunta.
  - **Equipamentos** para o Soulmon: theory crafting e uso da moeda.
- **Conflitos com linhas vermelhas → perguntar ao dono, não resolver:**
  1. "Créditos não compram atributo" × equipamento comprado com moeda (moeda ganha jogando × paga).
  2. "Estratégia só muda o playstyle" × vantagem de ~5% no PvP.
  3. `copy.semFomo` / nunca punir × gates e regressão.

## §2.8 Decisões da Discovery reaberta (05/10/2026, dono: CONTINUAR)
- **Escopo: TUDO neste run** (level do Soulmon, PvP, especiais, talentos+gates, equipamento+moeda, Comércio), em PRs pequenos na ordem de risco.
- Concentração máx. 45%.
- **HP sobe automaticamente com o level** (não gasta ponto). Os pontos de distribuição vão só para ATK/DEF/SPD; durabilidade extra só via DEF.
- Degeneração: **o level desce e é exibido**, com texto neutro (`copy.semFomo`).
- **Chips** deixam de dar +3. Passam a influenciar só a DISTRIBUIÇÃO (caminho Poder/Harmonia/Benevolência) na evolução.
- **Level do usuário = Vínculo.** Revogam-se "recompensa do Vínculo só cosmética" e "escada de gates é grind" (registrar no REGISTRO com as alternativas que perderam).
- **~5% de talento/equipamento também no PvP.** O dono aceita conscientemente a contradição com "só playstyle". Nada comprável com dinheiro real dá %; o equipamento usa moeda ganha jogando (ambiguidade → pergunta).
- XP: dia completo + esforço/meta (nunca contagem), alvo 66/34.
- Pendentes: Renascimento (pago + level?), escopo do caminho Comércio, moeda do equipamento.

## §2.9 Checkpoint da F1 do sistema (05/10/2026)
- **5% de bônus mantido também no PvP**, decisão consciente com ~90% de vitória entre iguais na mesa.
- Diretriz de monetização: **não pode ser P2W**, mas é OK dinheiro real **acelerar um pouco** a aquisição de recursos, de forma comedida. Os 4 defaults de economia serão revistos com benchmark.
- **NOVO: range de dano (sorte)**, para que o mais fraco vença de vez em quando. Calibrar por simulação. A régua pareada passa a ser sobre a média de muitas seeds.
- Pré-autorizado: se a variância fechar sem FATAL, abrir o Builder com o PR1 (núcleo puro: curva + level + HP automático + especiais + range de dano + régua pareada em vitest, sem UI).

## §2.10 Decisões (05/10/2026)
- Disco E: será liberado pelo dono. **Não escrever em E: até o aviso** (o PR1 está pausado; o REGISTRO §24 fica pendente porque vive no worktree em E:).
- Sorte: **AR(1) ρ=0,9 σ=15%**, ~31% / ~19%. As metas de win rate do mais fraco são **decisão do dono**.
- Créditos→Bits para equipamento: tende a permitido com teto diário de +25% sobre o grátis. **Avaliar lootbox com teto** (pity, odds exibidas, compliance/legal, faixa etária).
- Renascimento = pago + Vínculo (o Vínculo nunca é pago). Comércio: slots pagos dentro do mesmo teto de +25%. Piso de 15% mantido.

## §2.11 Decisões do dono (05/10/2026, modais lootbox + stories)
- Equipamento: loja direta/fragmentos, SEM RNG, só moeda ganha.
- Créditos aceleram só não-combate (cosmético/conveniência), teto +25%. Equipamento só com moeda ganha.
- Classificação: Livre / acesso provável por menores. ECA Digital (L15.211/2025) tratado como aplicável.
- Jurídico: análise feita pelos próprios agentes (alpha-compliance, com fontes primárias). **É ANÁLISE INTERNA POR IA, NÃO É PARECER DE ADVOGADO.** Não bloqueia o PR8 (o desenho não tem RNG pago nem Créditos→combate).
- Chips: dão SÓ pontos de tipo (Poder/Harmonia/Benevolência) e afetam APENAS a evolução. Sem efeito direto em combate.
- Chips já comprados: ficam como estão (sem reembolso e sem conversão). O +3 legado no PvP é tratado no clamp/normalização; se não couber, é risco de checkpoint.
- Respec de talentos: sempre pago (moeda ganha).
- ROLE_SHAPE: FICA, limitado a ±25%.
- Disco: autorizado usar outros discos (não C:). Worktree vai para D:\soulmon-cv3.

## §2.12 Protocolo e novos pedidos (05/10/2026)
- **Antes de CADA merge:** fetch de origin/main → rebase → tsc, vitest e build de novo se algo mudou.
- **Novos pedidos de combate:**
  - (B1) a barra de energia do especial dispara ao encher e ZERA;
  - (B2) o golpe básico é fixo por personagem (melee OU ranged) em todas as telas; o especial é independente;
  - (N1) o cast mostra o nome próprio da habilidade (StageSkill);
  - (FX) o cast do especial é aprimorado em todas as telas, com FX distintos para buff/debuff/maldição/DoT/cura/HoT, movimento reduzido e R-NOVA.
- Sessão irmã em D:\soulmon-ajustes (modais/home): avisar se tocar nesses componentes.
- PR1 mergeado: #221, main 3f73ef78.

## §2.13 Decisões do dono (05/10/2026, depois do PR1b)
- PvP depois do B1: ACEITAR ~65% na torcida normal. A faixa do teste baixa. "Uma barra, um uso" fica, com paridade entre cliente e servidor.
- Compra de Créditos: atrás de verificação de idade ou supervisão parental, mantendo a classificação Livre. Vira story/pendência e não bloqueia o combate.
- FX de maldição e HoT: ficam prontos, mas inalcançáveis até a mecânica existir.
- Merge: se o classificador bloquear ("Merge Without Review"), não contornar. Parar e reportar com o PR pronto.
- Sessão irmã: mexe em App.tsx/AreaView.tsx (initialSheet). No rebase, preservar as duas mudanças.
- Merge liberado (settings): gh pr merge / push main / ff-only, após fetch+rebase+recheck+CI verde. Repassar a todo executor.

## §2.14 Decisões do dono sobre os assets (05/10/2026, `builder/INVENTARIO-ASSETS.md`)
- **M1** Arte nova **LIBERADA** para P0+P1 (cerca de 60 peças). Para esses assets, isso supera o "arte nova" da §10 e o "só reuso" do PR11. O som continua fora (R-NOVA).
- **M2** O level do Soulmon aparece como **`Lv N`** abreviado, nunca "nível" por extenso (NARRATIVA §12).
- **M3** Equipamento com **3 slots, um por atributo**: Núcleo→ATK, Carapaça→DEF, Rastro→SPD. Tiers comprados direto, sem RNG.
- **M4** A maré de sorte fica **OCULTA**: a mecânica AR(1) continua, mas nenhum indicador aparece na UI.

## §2.15 Decisões do dono sobre o balanço dos motores (06/10/2026, `builder/balanco-motores.md`)
- **P1** O golpe é **normalizado**: cada ataque vale ~1/10 do espelho em todo level (`HIT_UNIT_H0 = 10`), com **σ 8%**. Essa decisão substitui o σ 15% da §2.10. As metas de vitória do mais fraco (~31% / ~19%) continuam.
- **P2** A Arena **mantém os grupos**: o núcleo passa a fazer luta N contra 1, como extensão pura e compatível com o 1v1 quando N = 1.
  - O especial pode ter efeito em **área**, com o dano dividido entre os alvos, ou ser **único**, com o dano concentrado. Os dois gastam o mesmo orçamento total, e a régua pareada compara área contra único.
  - A forma (área ou único) é definida pelo class-system quando o Soulmon nasce ou evolui. A regra exata de escolha está pendente: ver Q-AREA no PR3a.
- **P3** O teto S1 usa a data da 1ª gravação, guardada no metadata do KV do save. O teto é de **1 level por dia de servidor** e vale **só no duelo**; o save não é reescrito.
- **P4** A diferença de vitória entre habilidades (sem agir × bem jogado no anel e na esquiva) fica **limitada a 25pp**. `RING_MULT` e `DODGE_REDUCE` foram recalibrados para caber nesse limite.

## §2.16 Q-AREA decidida pelo dono (06/10/2026, PR3a)
- **Q-AREA** Área ou único vem **POR ESCOLA**, espelhando o `targets` de hoje: `conjuracao` e `longo_alcance` recebem **círculo de 4 m** (`RAIO_MAXIMO_BASE` do class-system, `AreaConfig` `'circulo'`); as outras escolas (`combate_fisico`, `benca`, `maldicao`, `evocacao`) ficam com **alvo único**.
  - `StageSkill.area: AreaConfig` é preenchido em `buildStageSkills` (função pura da escola, logo determinística por ficha e estágio); `realSkillPower` passa a ler `skill.area` (o "poder" da página do Pet reflete a área; skill persistida de antes, sem o campo, vale único).
  - O núcleo recebe `area: skill.area.tipo === 'circulo' ? 'area' : 'single'`.
  - **Eficiência de área = 1** (mesmo orçamento total, como pediu o dono), não os 0,9 do class-system; o **DoT único repassa os ticks** ao próximo vivo.
- **Achados do PR3a que pedem decisão do dono** (o PR não decidiu; ver o relatório do PR): (1) buffs no espelho ATK puro caem a −5,0…−5,7% em L>6 na régua pareada com o golpe normalizado (a story mediu só o build equilibrado); o gate novo fixa o piso em −6% como catraca; (2) o "especial direto encurta o TTK 25–33% (29,1%)" saiu de uma medição com a opção `phases` ignorada pelo `fightX`: o valor correto é **23,2% constante em todo level**, e o gate passou a exigir constância (≤1pp) dentro de 20–33%; (3) `RING_MULT`/`DODGE_REDUCE` novos ficam em `combate/specials.ts` (`*_V3`) e NÃO em `utils/energia.ts`, porque a Arena/Pesadelo/Masmorra ao vivo foi calibrada nos valores antigos (4 testes de simulação reprovam com os novos); o PR3b troca o motor e move os valores.

## §2.17 Decisões do dono sobre os desvios do PR3a, e o que o PR3b aplicou (06/10/2026)
- **Buffs com tolerância −6% em todos os builds.** A catraca que o PR3a pôs em `combate.test.ts` fica como está: as três famílias de buff (`atkBuff`, `defDebuff`, `spdBuff`) podem ficar até −6% na régua pareada em L>6; todas as outras células seguem em ±5%. Retunar `SPECIAL_POWER` dos buffs deixa de ser pendência.
- **Especial direto encurta o TTK em 23%, e isso é aceito.** O valor é constante entre os estágios (spread ≤ 1pp, L1, L21 e L40), e o gate do PR3a (faixa 20–33% mais constância) é o que vale. O "25–33% (29,1%)" da story era artefato da medição com `phases` ignorado.
- **`RING_MULT` e `DODGE_REDUCE` novos (0,92 / 1 / 1,08 e 0 / 0,2 / 0,35) entram NO PR3b.**
  - `utils/energia.ts` passa a exportar os valores novos (a tabela do núcleo, `RING_MULT_V3` e `DODGE_REDUCE_V3` de `combate/specials.ts`, reexportada; um teste trava a igualdade).
  - O Pesadelo e a Masmorra ainda rodam no motor antigo. Medido: com os valores novos neles, a simulação do Pesadelo sai da faixa (+11,3pp, limite 8pp) e o render do anel do `NightmareBattle` quebra (o especial ÓTIMO vale 8). Por isso eles seguem nas constantes antigas, agora com nome (`RING_MULT_PRE_V3`: 0,75 / 1 / 1,35, e `DODGE_REDUCE_PRE_V3`: 0 / 0,5 / 0,85), usadas só por `pveStrikeDamage` e `pveFoeHitDamage`. **A troca é do PR4** (Masmorra e Pesadelo no núcleo): nesse dia as `*_PRE_V3` e o `usePveBattle` saem.
- **O teto DEF mede até o 1º KO, com especial.** Já é assim em `gateDefP95` (`combate.test.ts`, "a duração que o jogador VÊ"): sem o rabo do "ghost". Registrado aqui para não voltar a ser medido de outro jeito.
- **Régua do grupo.** `RULER_GROUP_COMP`, `RULER_GROUP_FOES`, `RULER_GROUP_GROWTH`, `RULER_GROUP_HEAL`, `RULER_RING` e `RULER_DODGE` saíram de `combate/ruler.ts`: a régua pareada área × único agora joga a própria run da Arena (`simulateArenaRunV3`, que lê `ARENA_FOES`, `ARENA_ROUND_COMP`, `ARENA_ROUND_GROWTH`, `ROUND_CLEAR_HEAL` e as tabelas de `energia.ts`). A régua não pode mais divergir do jogo.
- **Medido no PR3b** (N = 3200 por gate; `arena.v3.test.ts`): duração mediana R1 21,8 · R2 19,7 · R3 20,9 · R4 27,6 · R5 24,3 s; vitória por build 64,0–68,6% (spread 4,6pp, média 66,2%); por estágio 58,0–70,9%; 14 células família × área 60,3–72,3% (spread 12,1pp; RED com `PVE_FAMILY_POWER.arena` todo em 1: 32,9pp); área × único: direct −1,0pp/−2,0%, dot −3,9pp/+1,5%, defDebuff −3,3pp/−4,8%; habilidade `nenhuma` 48,4% × `boa` 72,0% = 23,6pp (RED com a tabela antiga: 52,8pp); fora da régua: boa×nenhuma −0,7%, torcida no teto −2,6%, `ROLE_SHAPE` até +16,0% (RED hp×2/dmg×0,5: 86%).
- **Pendências do PR3b que pedem o dono** (o PR não decidiu):
  1. **R2 (2 inimigos fracos) dura 19,7 s, abaixo do piso de 20 s do AC1.** A própria medição da story já dava 19,8 s. Subir `weak.hp` para 0,46 resolve a duração, mas empurra a régua de área do `defDebuff` para −5,03% (limite 5%) e tira ~2pp de vitória. O gate ficou com piso de 19,5 s na R2 e 20 s nas demais.
  2. **`ROLE_SHAPE` foi recalibrado.** Os pares antigos (hp×dmg ≈ 1) não são neutros em vitória no grupo (HP vale ~2× o dano para ganhar a run): `combate_fisico` ganhava 93% e `benca` 85%, contra 61–70% dos outros (spread de 34,8pp entre as 6 escolas). Pares novos, ajustados por bisseção para manter a taxa própria de cada escola: combate_fisico 1,07/0,85 · longo_alcance 0,95/1,08 · conjuracao 0,93/1,10 · benca 1,17/0,90 · maldicao 0,96/1,05 · evocacao 1/1 (spread de 10,6pp nas 6 escolas, TTK até +16%).
  3. **A torcida despeja 3 de energia por 24 toques** (`CHEER.energyPerDischarge`, a do núcleo medido), e não os 36 de antes. Na prática a torcida pesa pouco no especial.


## §2.18 Decisões do dono para o PR4 e o que o PR4 mediu (06/10/2026)
- **R2 da Arena com piso de 19,5 s: ACEITO.** O gate de duração do PR3b fica como está (R2 ≥ 19,5 s, as outras ≥ 20 s).
- **`ROLE_SHAPE` recalibrado do PR3b: APROVADO** (pares hp/dmg: combate_fisico 1,07/0,85 · longo_alcance 0,95/1,08 · conjuracao 0,93/1,10 · benca 1,17/0,90 · maldicao 0,96/1,05 · evocacao 1/1).
- **TORCIDA: subir o rendimento de energia até o teto**, com a diferença por habilidade (sem agir × bem jogado) ≤ 25pp e o TTK fora da régua ≤ ±25%; medir na Arena e na Masmorra e fixar o maior valor que cabe. **Fixado: `CHEER.energyPerDischarge` = 90** (era 3; 24 toques ≈ 0,9 de uma barra de 100).
  - **Medido** (`_sim/cv3-medir/pr4/t.ts`, N = 1200 por ponto; TTK do jogador que não age, torcida no teto contra ninguém torcendo): Arena −2,6% (E = 3) · −20,3% (60) · −22,0% (72) · −23,5% (80) · −23,7% (88) · −24,0% (92) · **−25,1% (96)** · −25,4% (100). Masmorra −2,5% (3) · −18,8% (60) · −22,1% (88) · −22,6% (96) · −22,7% (100). **Quem limita é a Arena, entre 92 e 96**; fixei 90 (Arena −23,5% no gate `arena.v3.test.ts`, Masmorra −22,6% em `dungeon.v3.test.ts`).
  - **Diferença por habilidade com os dois lados torcendo no teto:** Arena 2,3pp, Masmorra 0,0pp (5 andares). Sem torcida (o gate de antes): Arena 23,6pp, Masmorra 6,1pp (5 andares, "andares limpos").
  - **O PvP não sobe junto:** `CHEER.pvpEnergyPerDischarge` = 3 (o 1v1 `fight()` do PvP segue no valor medido em PR1b/PR3a, teto de 0,67 energia/s → ~65% contra o fantasma, §2.13). O PR5 é dono do PvP e decide se separa de vez.
- **Pendências do PR4 que pedem o dono** (o PR não decidiu; ver o relatório):
  1. **A torcida no teto tira a parede da Masmorra e a derrota da Arena.** Os dois limites do dono passam, mas a vitória não está entre eles: Masmorra, `media` sem torcida: andar 5 em 36,6% e andar 6 em 0,0%; **com torcida no teto: andar 5 em 100% e andar 6 em 97,8%**. Arena, `media`: run vencida 66,7% sem torcida e **96,7% com torcida no teto** (sem agir nada além de torcer: 94,9%). A diferença "bem jogado no anel e na esquiva × sem agir" fica de 2pp, mas "bem jogado E torcendo × sem agir nada" é 49pp na Arena (já era 31pp com 3) e 16,5pp na Masmorra (5 andares). Valores intermediários (torcida sozinha, vitória a mais): E = 3 → +10,1pp na Arena e +2,6pp na Masmorra · E = 60 → +47,0pp e +29,4pp.
  2. **Tabela de inimigos da Masmorra recalibrada.** A da story (hp 0,74..0,94 · power 0,03..0,09 · crescimento 0,09/0,15) foi medida com a energia do jogador zerada a cada luta; o jogo carrega a energia (a regra da própria story) e isso encurta as lutas em ~2 s e leva a parede para o andar 6. Com a regra real: hp 0,945/0,95/0,955/0,955/0,96/0,965 · power 0,026/0,038/0,04/0,06/0,089/0,096 · crescimento hp 0,14 / power 0,11 (os slots são quase planos em vida; o que sobe é a força). Medido (N = 1200 runs, mesmo level, `media`): andares 1–4 em 99,9–100%, andar 5 em 36,6%, andar 6 em 0,0%; mediana por inimigo A1..A5 = 20,6 / 20,1 / 23,5 / 26,8 / 28,9 s; golpes do slot mega no L1: 10/11/12/14/15/16 (a story dizia 9..14).
  3. **Habilidade na Masmorra ≤ 25pp:** na escada de 3 andares da story é 0,0pp (os 3 andares são limpos por qualquer jogador); na média de andares limpos dos 5 é 6,1pp; **mas concluir os 5 andares vai de 18,0% (`nenhuma`) a 48,2% (`boa`) = 30,2pp**, acima do limite se a conta for "run concluída" como na Arena. `RING_MULT`/`DODGE_REDUCE` NÃO foram tocados (um dono só); fica registrado para decisão.
  4. **Pesadelo 22,0–22,1 s por inimigo** (limite 22); com a energia carregada, a Masmorra (≥ 20 s no andar 2) e o Pesadelo (≤ 22 s) disputam o mesmo hp: o primeiro inimigo de cada sequência não tem energia guardada e dura ~3 s a mais. O gate aceita até 22,5 s no Pesadelo.
  5. **O RED do contra-ataque da story não cruza ±25%:** `contraAtaque: 10` sem o teto de +0,6 move o TTK −13,1% (com o teto, −0,4%); o gate compara os dois em vez de cruzar a faixa. O ×2 do alquimista sozinho é −0,4%.
  6. **Ofício (TTK, 3 andares):** ferreiro +0,1% · tecelão −3,7% · artesão −9,0% · joalheiro −2,4% · alquimista −0,4% · curtidor +0,1% · encantador −4,3% · escriba −8,9% · cozinheiro 0,0% · luthier −3,7% · cartógrafo −6,2% (todos ≤ ±25%).
- **O que o PR4 apagou:** `usePveBattle` (e seus testes), `PVE_HP_SCALE`/`PVE_FOE_HP_EXTRA`/`PVE_SPECIAL_MULT`/`PVE_FOE_SPECIAL_MULT`/`PVE_BASE_FRAC`/`pveHp`/`pveFoeHp`/`pveStrikeDamage`/`pveFoeHitDamage`, `RING_MULT_PRE_V3`, `DODGE_REDUCE_PRE_V3`, `PLAYER_STATS`/`playerStatsFor`/`TIER_BASE`/`dmgReduction`, `PVE_STEP_MS` (ficou sem uso), `ARENA_STRIKE_MS` e `ARENA_DEFEND_MS`. `rollDungeonHeartDrop` ficou com `Math.random` (sorteio de coração, declarado no teste de grep).


## §2.19 Decisões do dono sobre o PR4 (#235) e o ajuste do PR4b (06/10/2026)
- **Masmorra e Pesadelo NÃO têm torcida.** Narrativamente o Soulmon vai "sozinho" nessas duas telas. A torcida sai da UI e do motor dessas duas (a torcida do PR4 em `dungeonFight.ts`/telas é removida). O balanço delas é refeito sem torcida.
- **Arena mantém a torcida**, mas `CHEER.energyPerDischarge = 90` tira a parede (só torcer vence 95%). **Recalibrar só a Arena:** o maior valor de `energyPerDischarge` em que a diferença de vitória da RUN entre "torcendo no teto" e "sem torcer" (mesma habilidade) fica **≤ 25pp**, e o TTK fora da régua **≤ ±25%**. *Default declarado pela orquestração* (o dono não fixou a métrica nem o valor; qual habilidade entra na conta é decisão desta medição, ver o PR4b).
- **Aceitos:** habilidade 30,2pp ao concluir os 5 andares da Masmorra (sem torcida o número é refeito no PR4b); Pesadelo até 22,5 s por inimigo.
- **PR4b** = o ajuste acima (worktree `D:\soulmon-pr4b`, branch `combate-v3/pr4b`). **PR5** só depois do merge do PR4b, com os pontos já decididos: espelho `functions/api/_combate.js` com teste de paridade; duelo lê o save de cada lado; S1 por `metadata.f`, 1 level/dia, só no duelo; torcida do PvP por balde de 3 s com `CHEER.pvpEnergyPerDischarge` (~65% da torcida normal, §2.13); empate = outcome sem pontos (empate válido); NPC do treino "2 levels abaixo" com vitória do jogador 75–92%; bônus de 5% de talento/equipamento como canal com valor 0 até PR7/PR8; PvP 1v1 com a área agindo como único; forma do golpe do oponente pela ficha.

### §2.19 — o que o PR4b e o PR5 mediram (06/10/2026)
- **PR4b mergeado:** #236, main 58ae6e5e. Masmorra e Pesadelo sem torcida (UI e motor; `useGroupBattle` ganha `torcida: false`, `simulateDungeonRunV3` perde `cheer`). **Arena `CHEER.energyPerDischarge` = 9** (o maior valor com a torcida SOZINHA, mesma habilidade, ≤ 25pp: `nenhuma` +24,8pp, `boa` +17,9pp; TTK −8,7%; E = 10 dá +25,3pp). Métrica e valor são o default declarado pela orquestração: a habilidade que não age é a que decide o teto. Arena `media`: run vencida 65,9% sem torcida e 86,3% com a torcida no teto.
- **PR5 mergeado: #237, main dd0d6cf6.** PvP no núcleo, espelho `_combate.js` com paridade, save lido no servidor, S1 por `metadata.f`, torcida por balde, empate sem pontos, NPC 2 levels abaixo. Medições: `builder/balanco-motores.md` §9.
- **Calibrações que o dono não fixou (o PR escolheu; rever se discordar):**
  1. `CHEER.pvpEnergyPerDischarge` **3 → 2,5**: a descarga do balde cai no fim dele (é causal) e com 3 o teto dava 68,4%; 2,5 dá 64,5% (~65%, §2.13).
  2. `NPC_LEVEL_GAP = 2` com **piso no 1º level do estágio**: "2 levels abaixo" cruzando o estágio faz o jogador vencer 99,4% no champion (a faixa é 75–92%); com o piso fica 77,8–91,3%.
  3. O especial do PvP agora tem **família** (7), vinda da escola da skill especial da ficha no save (a mesma tabela provisória da Arena); desconhecida = `direct`.
- **Para o dono decidir (o PR não decidiu):**
  1. **Saves antigos e o teto S1.** Como a story manda, um save sem `f` (gravado antes da regra) recebe `f = agora` na 1ª gravação; daí o duelo dele vale level 1 no 1º dia, 2 no 2º etc. até alcançar o level derivado. Quem já joga seria rebaixado no PvP por alguns dias. A alternativa (ancorar `f` no level que o save ANTIGO já mostrava) não foi feita. CLAUDE.md diz que ninguém usou o app em produção.
  2. **Empate e Vínculo.** O empate não dá Honra nem pontos; o XP de Vínculo da partida ("falha não pune") continua pago como numa derrota (`onMatchPlayed(false)`).
  3. **A família do especial e a forma do golpe vêm do save (escrito pelo cliente)**, dentro de uma lista fechada; as 7 famílias estão calibradas em ±5% na régua, então o ganho de escolher uma é pequeno, mas existe. Congelar a ficha em `duelStart` impede escolher DEPOIS de ver a semente.
  4. O chunk de entrada do app cresce +3,3 KB (o `fightSteps` do núcleo TS entra nele); `orcamentoDeBytes` segue verde.

## §2.22 PR11: FX de status e círculo de cast do especial (06/10/2026, PR #239, branch `combate-v3/pr11`)
- **Só arte que já estava na `main`** (decisão do dono: sem arte nova): glifos `st-*`, folhas `fx-{buff,debuff,maldicao,dot}-loop-sheet`, `fx-cast-circle`, mais `fx-heal` e `fx-shield`. Entram COMO ESTÃO (`docs/ARTE-MELHORIAS-FUTURAS.md`). Carga sob demanda (`utils/combatV3Art.ts`, `import.meta.glob` lazy; o build emitiu um mini-chunk e um WebP por peça, nada no chunk de entrada).
- **Dono único:** `utils/combatFx.ts` (`STATUS_FX`, `FAMILY_STATUS` tipada em `Record<SpecialFamily, …>`, `UNREACHABLE_STATUS_FX`, quadro puro `castStatus`/`tickStatus`/`clearHolders`). Sete kinds (os 6 da story + `escudo`, pedido do dono): `buff` (variantes `atk`/`spd`), `debuff`, `maldicao`, `dot`, `cura`, `hot`, `escudo`. `maldicao` e `hot` ficam prontos e inalcançáveis (§2.13), com teste que marca isso.
- **Distinção por forma, nunca só cor:** selo com glifo + forma em texto (▲ ▼ × ◆ + +↑ ▣) + texto curto EN/PT + turnos; `aria-label` "Attack up, 2 turns left" / "Ataque em alta, 2 turnos". Último turno: borda tracejada. Mais de 3 efeitos: "+k".
- **Fallback sem arte:** o selo sai só com forma + texto + turnos; o círculo de cast vira anel CSS com tokens; o loop só entra com a folha carregada. `fx-target-down` (nunca gerado) não é usado em lugar nenhum: o alvo derrubado apenas perde a camada.
- **Movimento reduzido:** sem loop, sem animação do selo; o círculo de cast vira o flash único (`sm-bs-pop`); informação idêntica nos dois modos (teste compara aria-label, forma, texto e turnos).
- **Ligação por motor:** Arena, Masmorra e Pesadelo (`useGroupBattle.status`, derivado dos eventos do núcleo e da família do especial de quem conjura); o Duelo (depois do PR5) usa `duelStatusBoard`, a dobra pura dos eventos já chegados (replay e ressimulação da torcida dão o mesmo selo). Direto = sem status. Cura dura até o próximo golpe de quem curou (1), DoT = 3 ticks, escudo gasta com os golpes que recebe, buff/debuff gastam com os golpes de quem os pôs; duração = `round(3 × power)`.
- **Para o dono decidir (o PR não decidiu):**
  1. **O núcleo não emite status com duração.** Os turnos do selo são DERIVADOS na cena a partir dos eventos (`attack`/`tick`) e da família; são aproximação, não leitura do estado interno (`nAtk`/`nVuln`/`nSpd`/`shield` de `group.ts`). Para ficar exato, o núcleo teria de expor esses contadores (mexe em `group.ts`/`fight.ts`, dono do PR3a).
  2. **Duelo:** o status do 1v1 vem dos eventos do núcleo do cliente (mesmos que o servidor reproduz); se o servidor passar a publicar estado de status próprio, trocar a dobra por ele.
  3. **Q-FX1 e a escola `maldicao`:** hoje ela cai em `defDebuff` (`ESCOLA_FAMILY_PROVISORIO`) e mostra o selo de debuff, não o de maldição. Isso é a decisão do §2.13; se o dono quiser o selo de maldição nessa escola, é uma linha em `FAMILY_STATUS`/mapa por escola.
  4. As peças imperfeitas (`st-buff-atk`/`st-buff-spd` quase iguais, `st-hot` ≈ `st-cura`, `fx-dot` em ciano) distinguem-se pela FORMA em texto e pelo rótulo, não pela imagem; o teste de 16 px em escala de cinza do inventário não foi feito.
- **Medido:** tsc app+server+desktop verdes; vitest completo 7340 passam (582 arquivos, na última rodada, sobre o PR7; um timeout de `playArea.render.test` sob carga numa rodada anterior, passa isolado); prova de vermelho: tirar `spdBuff` de `FAMILY_STATUS` e esconder a forma do selo no modo reduzido reprovam os testes.

## §2.20 PR6 — chips só dão pontos de tipo (06/10/2026, PR #238)
- Dono: chips NÃO dão +3 de atributo; dão só pontos de tipo e só inclinam a distribuição/caminho. Chips já comprados e o legado +3 ficam; sem reembolso nem conversão.
- Divergência story x dono, resolvida pela palavra do dono: a story pedia "chip não altera `powerPoints`", mas `powerPoints` JÁ É o ponto de tipo (escolhe o galho de evolução e os pesos de `soulWeights`). Mantido: chip soma `CHIP_BOOST` (3) em `powerPoints`/`attributesSinceLastEvolution`. Removido: o +30 de `totalXP` (Vínculo) que o chip dava. Total de combate = level e fatias 15–45% já neutralizam o legado: nada a mudar em `soulXP`/`combate/`.
- Prova: `src/utils/chipsSoDistribuicao.test.ts` (level/XP/total iguais após o chip; varredura 640 combinações; legado de 40 chips; guard de fonte: nenhum arquivo de combate nem `_soulXP.js` lê chip/foodInventory/totalXP). Vermelho verificado revertendo `specialItemUse.ts`.
- Não mexeu em economia de galhos (totais iguais; só a distribuição). Copy EN+PT "muda o caminho / lean your path", sem cobrança. Manual §47 atualizado.
- Pergunta ao dono (sem decidir): tirar o +30 de Vínculo do chip é aceitável? (Comida segue dando XP de Vínculo.)

## §2.21 PR9: nome próprio do especial, novo a cada estágio (06/10/2026, PR #240, branch `combate-v3/pr9`)
- **`StageSkill` ganha `familia` (uma das 7 de `SPECIAL_FAMILIES`) e `forma`** (melee/ranged, tabela `SCHOOL_STRIKE_FORM` movida para `ficha/strikeForm.ts`, re-exportada por `combatFx`). Básica = sempre `direct`; especial = família por estágio.
- **Regra (sem IA, sem rede):** `ficha/nomeEspecial.ts`. Família = sorteio ponderado por escola (`PESO_FAMILIA_ESCOLA`, todo peso > 0) × afinidade do elemento (×3) × tendência do perfil (elemento dominante da leitura, ×1,5), seed `seedKey|familia|estágio`; família já usada na jornada só volta após as 7. Nome = substantivo do léxico da família (8 por família, disjunto da básica; sem "Weave") + elemento(s) em 3 formatos. Os 5 estágios saem com 5 famílias e 5 nomes distintos (testado em escolas × elementos × seeds).
- **Selo do cast:** pet = nome da skill; **inimigo** = nome por regra do elemento/identidade (`foeSpecialLabel`, prop nova `BattleStage.foeSpecialLabel`); nas 4 telas. Prova de vermelho: forçando "ESPECIAL!" os 4 testes de tela reprovam.
- **PvP (PR5 já na main):** `_duel.js` usa `skills.especial.familia` só se estiver na lista fechada das 7 (senão a padrão da escola) e publica `fx.familia`; o cliente nomeia o especial do oponente por regra a partir dela (texto do save nunca chega à tela do outro). `ESCOLA_FAMILY_PROVISORIO` virou `ESCOLA_FAMILY_PADRAO` (só fallback).
- **Persistência:** `soulmonSkills` é cache no save, gravado uma vez. Cache sem `familia` (anterior ao PR9) é trocado quando a ficha recalcula (`skillsTemFamilia` em `App.handleSkillsComputed`). Aparelho novo sem perfil local mantém o cache velho até recalcular.
- **Evocação:** o banco `especial` dela foi removido (morto); a escola segue fora de `DISTRIBUIDAS` (a ficha nunca a produz). O peso dela nas famílias é uniforme (testado). Pergunta ao dono: remover a escola `evocacao` de vez ou torná-la alcançável?
- Merge: CI da branch verde (`tsc + vitest`); Android APK Build falha na main desde antes (Setup Android SDK), não é do PR.

## §2.23 PR7: Vínculo como level do usuário, talentos e portões (06/10/2026, PR #241, main 156589a8 + fbde2c2a, dist 0d0a97ac)
- **Núcleo:** `utils/talents.ts` (+ `talentCopy.ts`, texto fora do chunk de entrada) e `functions/api/_talents.js`; `utils/gates.ts` e `_gates.js`; paridade `talents.parity.test.js` e `gates.parity.test.js`; teste de grep (nenhum `bondLevel >= N` fora do dono). Persistido só `talentPicks: string[]` (um id por grau), `fuzz2` 103 → 104 (teste atualizado de propósito).
- **Talentos:** 1 ponto por Vínculo, **teto de 20 pontos**; 3 caminhos (Duelo, Fenda, Comércio); 19 nós, dos quais 6 pegáveis (PvP 01-03 a +0,4%/grau, PvE 01-02 a +0,6%/grau, `tal-com-03` desconto de respec 10%/grau); os outros 13 aparecem como "em breve" (efeito depende de gancho do motor ou do PR8). Pegável soma 24 graus > 20 pontos: a árvore nunca fecha (teste lê os dois do módulo). Entra pelo canal `combinedBonus` (teto único 5%); régua de razão das médias HP×3: PvP cheio + equipamento/Renascimento fictícios ≤ +5,5% medido; sem teto, > +20% (prova de vermelho). Respec sempre pago, 25 Bits por ponto gasto (−10% por grau da ampulheta).
- **Servidor:** `save.js` descarta o vetor INTEIRO se inválido (id desconhecido/sem efeito, grau a mais, pontos a mais que o Vínculo do próprio save); `_duel.js` usa `talentBonus(picks, bondLevelFor(totalXP), 'pvp')` no canal (inválido = 0). Limite honesto: `totalXP` também é escrito pelo cliente (já documentado em `_bond.js`); o teto de 5% limita o ganho de um XP forjado.
- **Portões (defaults da squad, o dono confirma):** pvp 5 (o que já valia), torneio 5, andares altos da Masmorra 8 (a partir da camada 4; 1-3 livres), Renascimento 12. Renascimento = paga + ápice + Vínculo (`low-bond`); `rebirth.test.ts` ganhou `totalXP` de propósito.
- **Invariante 3 do `bond.ts` reescrito** (e §6), `bond.test.ts` reescrito; REGISTRO §24.2 com as alternativas perdidas.
- **Telas:** `TalentTreeCard` (lazy, na StatsPage, só se `!hideMetrics`) com arte sob demanda de `combate-v3/{talentos,arvore,hud}` (sem arte nova; peça ausente = texto); portão da Masmorra no botão "Camada N" (texto neutro `gateLine`); `useTalentBonus` liga o bônus nas lutas (Arena/Masmorra/Pesadelo `pve`, treino do Torneio `pvp`).
- **Vocabulário (confirmado em `NARRATIVA-E-UNIVERSO`, tabela §12):** "nível/upgrade" é vetado para FORMA/estágio da criatura; o Vínculo é "tempo de convívio". Usei "Vínculo N"/"Bond N" e nunca "nível" na copy nova. A `StatsPage` antiga ainda diz "Nível de vínculo / Level N" (não toquei).
- **Orçamento de bytes:** chunk de entrada 559_558 → 572_294 (+4,7 KB sobre a main, que já estava a 156 B da folga); re-medido no `orcamentoDeBytes` com justificativa.
- **Medido:** tsc app+server+desktop limpos; vitest 576 arquivos / 7292 testes verdes (depois do rebase); `npm run build` ok. CI do GitHub não rodou no PR (só o Workers Build, verde).
- **Pendências para o dono (não decidi):**
  1. `tal-pvp-05` (câmbio/torcida) e `tal-com-05` (conveniência de câmbio) NÃO implementados (linha vermelha). A arte já existe.
  2. Os 3 nós de PvP dão o MESMO número (canal único de bônus de dano): "ATK/DEF/SPD no Duelo" distintos pediriam separar o canal no motor. Hoje a escolha real é entre caminhos, não entre os 3 nós.
  3. Teto de 20 pontos de talento (o Vínculo vai a 1000): sem ele "nunca suficientes" não vale. Valores do respec (25 Bits/ponto), dos graus e dos portões são defaults.
  4. 13 nós sem efeito ligado (motor/PR8/economia: energia inicial, DoT, cura recebida, Bits da fenda/missão, equipamento...). Aparecem "em breve" e não se compram.
  5. **Pesadelo não tem "andar alto"** (a onda é sempre a do andar 1): só a Masmorra recebeu portão. O "Arena" do dono = Duelo/Torneio (uma entrada `pvp` e uma `torneio`, mesmo 5, a tela do Torneio usa a `pvp`); a Arena PvE não tem portão.
  6. Estado "erro ao salvar pick" não existe: o pick é local-first e o servidor valida no sync (offline natural). Um pick que o servidor descartar volta a `[]` no próximo pull.
  7. O portão da Masmorra tem teste de leitura de fonte, não de render (a tela inteira pesa); a regra pura tem teste completo.

## §2.25 Decisões do dono depois do PR7 (06/10/2026)
- **Gates confirmados:** pvp 5, torneio 5, Masmorra camada 4+ exige 8, Renascimento 12. **Talentos confirmados:** teto de 20 pontos, respec 25 Bits/ponto com desconto da ampulheta do Comércio.
- **Canal de PvP por atributo:** ATK/DEF/SPD distintos no Duelo, com o **TETO ÚNICO de 5%** somando talento + equipamento + Comércio + Renascimento, medido por razão das médias; o servidor valida.
- **Redesenhar `tal-pvp-05` e `tal-com-05`** sem violar as linhas vermelhas (nada de vantagem comprada com dinheiro real; torcida fora da régua não; câmbio pago não), mantendo 3 caminhos com escolhas que importam; a arte existente fica (sem arte nova).
- **StatsPage antiga:** "Nível de vínculo / Level N" vira "Vínculo N / Bond N" (NARRATIVA §12: "nível" vetado para a criatura; Vínculo = tempo de convívio).
- **PR7b** (branch `combate-v3/pr7b`, worktree `E:\soulmon-pr7b`) implementa os três itens acima; **PR8** (equipamento e moeda) só depois do merge do PR7b, desbloqueado: 3 slots (Núcleo=ATK, Carapaça=DEF, Rastro=SPD), loja direta ou fragmentos SEM RNG, só com moeda GANHA; Créditos aceleram só o que NÃO é combate, teto +25% sobre o ganho grátis, nunca equipamento nem % de combate; bônus de equipamento pelo canal `combinedBonus` no teto único de 5% (percentual, não ponto plano); ECA Digital tratado como aplicável; a compra de Créditos atrás de verificação de idade fica como story pendente (a loja de Créditos NÃO entra neste PR).
- **Merge:** #239 mergeado por rebase (15:27Z). Foram 4 rebases por corrida com PR5, PR9, PR7 e PR6; o `dist/` conflita sempre e é regenerado a cada rebase (`npm run build`).

## §2.24 PR9b: evocação fora das escolas de skill e nome exato do especial no PvP (06/10/2026, PR #242, branch `combate-v3/pr9b`)
- **PASSO 0:** o CI da main após o PR9 falhou só em `convertToWebp.test.ts:139` (flaky conhecido); nada do PR9. Android APK Build segue falhando em "Set up Android SDK".
- **Evocação — premissa do dono corrigida:** a ficha PRODUZ `escolas.evocacao` (piso fixo `evocacaoFixo` 4, célula papel×caminho tanque/mágico, escolha do Renascimento) e ela alimenta `capture.ts`/companheiro e requisitos de talento do class-system. Só a camada de SKILL já a ignorava. Removi dela TODA a camada de combate: tipo `EscolaSkillId` (5 escolas), `ESCOLAS_SKILL`, `escolaSkillSegura` (legado/lixo vira `conjuracao`) em `ficha/types.ts`; tabelas `SCHOOL_STRIKE_FORM`, `PESO_FAMILIA_ESCOLA`, `ROLE_SHAPE`, `ESCOLA_FAMILY_PADRAO`, banco de nomes da básica, `_duel.js`. `EscolaId` (6) segue para os pontos da ficha. Régua da Arena (`arena.v3.test.ts`) verde sem recalibrar (o papel da evocação nunca entrava na régua).
- **Legado:** `skillsTemFamilia` agora exige `lex` e escola de skill válida na básica e no especial; cache com `evocacao` é trocado quando a ficha recalcula. Sem perfil no aparelho mantém o antigo (decisão 3). Teste: `ficha/escolaEvocacao.legado.test.ts` (forma, família, Arena determinística == escola padrão, cache).
- **PvP (opção "ID de léxico"):** `StageSkill.especial.lex = {n, f}` (índice do substantivo + formato, gravado ao gerar por `nomeEscolhidoDoEspecial`). `_duel.js` publica `fx.lex = {n, f, el, elB}` só com `n` inteiro 0..7, `f` 0..2 e ids de elemento `[a-z_]{1,24}`; o cliente (`nomeDeLexico`) valida de novo (família das 7, elemento da lista fechada do app) e recompõe com a MESMA `comporNome` do gerador. Nenhum texto do save sai. Não precisou espelhar léxico (só `LEXICO_POR_FAMILIA = 8`, travado por teste). `elementoNomeDe` moveu para `ficha/elementoNome.ts`. Teste `functions/api/duel.nome.test.js`: 750 combinações nome do oponente == nome do dono (PT/EN + selo), 11 formas de ID forjado, XSS no nome/descrição/elemento/família. Prova de vermelho: índice zerado e regex do elemento removida reprovam.
- **Conflitos de rebase:** PR6, PR7, PR11 e #232 (bestiário/Duelo) entraram durante o trabalho; resolvi `DuelScreen.tsx` e `combatFx.pr1b.test.ts` (ELEMENTOS 22, ESCOLAS 5); `ArenaGame.pr11.render.test.tsx` usava escola `evocacao` para o buff: agora combate_fisico + família `atkBuff` gravada. `elementoDominante` do #232 preservado.
- **Achado fora do escopo:** `bundleSemFranquia.contract.test.ts` falha no WINDOWS (`f.split('/')` com caminho de barra invertida: não acha o chunk `pool-*`); passa no CI Linux. Não mexi.

## §2.26 PR7b e PR8 (06/10/2026): PR7b #243, PR8a #244, PR8b #245, todos mergeados
- **PR7b:** canal de PvP por atributo (ATK/DEF/SPD; teto unico 5% na SOMA dos 3 canais; cada canal no teto = 5,03/4,89/5,01% em razao das medias). `tal-pvp-05` Mao aberta = +5%/grau (ate +15%) no rendimento da torcida do Duelo (inimigo cai 0-1% antes, +0..3,6pp de vitoria). `tal-com-05` Balanca = refazer UM ponto pelo preco de um ponto (Bits ganhos). StatsPage: "Vinculo N / Bond N".
- **PR8a:** equipamento 3 slots x 3 tiers (+0,5/1/1,5% no atributo do slot), sem RNG, so Bits GANHOS ou fragmentos; `bitsOrigin` (paidLeft) impede Bit de Credito de comprar equipamento; cambio de Creditos com teto de 25% do ganho gratis do dia (piso 100); Comercio liga `tal-com-01` (preco -4%/grau) e `tal-com-02` (fragmentos +5%/grau ate +25%); servidor `_equipment.js` + paridade; save +2 campos (fuzz2 106). 256 combinacoes <= 5,5%.
- **PR8b:** `EquipmentCard` (StatsPage, lazy), fragmentos da run completa da Masmorra (5, default), aba de Creditos mostra o espaco do dia.
- Defaults da squad que o dono pode mudar: percentuais por tier, precos (400/1200/3000 Bits; 4/12/30 fragmentos), 5 fragmentos por run, piso de referencia 100 do teto do cambio.

## §2.27 PR10: fechamento de documentação e verificação final (06/10/2026, PR #246, main 3c2dc829)
- **Passo 1 (main 7c76eaf9, com o #232):** rodados `arena.v3`, `combate/`, `dungeon.v3`, nightmare, paridades (`combate`, `gates`, `talents`, `equipment`, `bond`): 14 arquivos, 183 testes verdes. A régua do repo usa o espelho `arenaFoe`, então não enxerga o sorteio do bestiário; medi à parte com `pool.json` + elementos (N = 1600, arquivo temporário apagado): elemento do jogador 60,1–67,5% (7,4pp), família 56,9–63,3% (6,4pp), escola 61,9–71,1% (9,2pp). Régua oficial: builds 64,0–68,6% (4,6pp), 14 células 12,1pp, habilidade 23,6pp, escolas 7,9pp, duração R1–R5 19,7–27,6 s. **Torcida E = 9: gate oficial +24,8pp (margem 0,2pp); com pool N = 1600, +25,0pp** (ruído ±2pp). Nada recalibrado.
- **Passo 2:** REGISTRO §24.6 (+ nota nos itens 1/6/9/10 da §20), manual 02 §55-B (e invariante 3 / "escada de gates" do §55 marcados como revogados), 06, 07 (talentPicks, equipment, bitsOrigin, metadata.f; contagem 106), 00-MAPA, PLANO-COMBATE-V3 concluído, GuideModal/HelpModal pelas constantes, CLAUDE.md só nas regras de combate/economia. Linhas de PI/bestiário intocadas. `/manter-docs` completo NÃO rodado (delta de e3d55bb8 enorme, exige despacho de redatores): `.sincronizado.json` não mexido.
- **Passo 3:** `bundleSemFranquia` com `basename`; `convertToWebp` com `writeFileSync` no gancho.
- Portões: tsc app+server+desktop, vitest 588 arquivos/7443 testes, build, docsManual verdes; CI verde. Mergeado com `--rebase`.
- Pendente: critérios 2/3 da story (guard de constantes lidas do módulo; grep de menções obsoletas) não implementados; `/manter-docs` full; valores dos portões (5/8/12) ainda são defaults da squad.

### §2.32 Classificação etária e Créditos (decisão do dono, 07/10/2026)
- O produto CONTINUA 18+ (política §7, termos §3, onboarding, decisões #15 e MIS-13 intactas). "Livre"/14+ não foi adotado: 14+ não dispensa ECA Digital nem LGPD art. 14 (ver COMPLIANCE-14MAIS.md, análise interna por IA, não parecer de advogado).
- Tratamento de 14–15 anos não se aplica (produto não abre a menores). A resposta "confirmação do responsável" fica registrada só como preferência se um dia abrir 14+.
- Sem consulta a advogado por ora (decisão do dono). Fontes primárias da lei não foram lidas (Planalto/Câmara/gov.br falharam em 05 e 07/10): lacuna declarada.
- Combate v3 segue com: equipamento só com moeda ganha; Créditos só não-combate com teto +25%; sem RNG pago.
- §2.31 (PR14): família do especial estável; muda só com mudança forte de perfil (elemento ou galho dominante), raro.
