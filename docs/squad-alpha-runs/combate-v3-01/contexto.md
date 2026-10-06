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
