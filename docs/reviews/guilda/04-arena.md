# Guilda 04 — Arena de guilda e a criatura dentro da guilda

Autor: monster-taming-designer. Data: 29/09/2026. Escopo: a ARENA (secundária) e a fantasia de criatura. A guilda é CONSTRUTIVA (horta/vila); a arena existe para servir a ela, nunca para virar o centro.

Ressalva de precedência: a camada 3 está CONGELADA até 10 usuários × 14 dias de dado (REGISTRO §5.6, 21/09). Este é plano, não pedido de código agora. O `match` de hoje (`community.js`) é um sorteio de poder (`stagePower*10 + atributos ≤20 + Math.random()*18`), resolvido só no servidor; não usa o motor de arena de `src/utils/arena.ts` (rounds, elementos, especiais), que é local e contra bestiário.

## 1. Referências do gênero (o que serve, o que não)

| Jogo | Mecanismo de ação conjunta | Transplanta? |
|---|---|---|
| Pokémon GO raids / Gym | Raid: N pessoas, um chefe, HP do chefe é a barra comum; o Gym é posse territorial competitiva (times) | Raid sim (barra única). Gym não: posse pressupõe perder |
| Palworld (raids/base) | Pals trabalham na base; raid é ameaça externa à base compartilhada | Sim, a ideia de "a base é o que se protege" casa com horta/vila |
| Temtem / Cassette Beasts | Co-op de 2 (campanha compartilhada), PvP à parte | Lição: co-op como modo próprio, sem contaminar o PvP |
| Digimon (V-Pet, Digivice) | Digivice conecta dois aparelhos; batalha é 1×1 | Lição de vínculo: o outro é a criatura do amigo, não um número |
| Monster Rancher | Torneios por rank/classe do monstro | É o precedente de faixa (b) |
| MMOs, guild wars (WoW, Ragnarok GvG) | Cerco/GvG: contribuição individual, DKP, cobrança de presença | Contraexemplo direto: gera vergonha e ausência cobrada. Fora |
| Chao Garden | Um jardim, criaturas convivem; corrida entre criaturas é evento | Modelo de "criatura no espaço comum + evento leve" |

Regra que sai daí: cooperação tem evidência mais forte que competição para adesão (PLANO-EVOLUCAO 4.3); 31,3% relatam efeito negativo de comparação em leaderboards (REGISTRO §5.5). O `coop` existente (`vistaDoGrupo`: coletivo + presença binária, sem recompensa) é o padrão a estender.

## 2. Três variantes

Comum às três: recompensa só cosmético/Emblemas (nunca coração, nunca Créditos); a tela mostra progresso da GUILDA, nunca número, nunca contribuição por pessoa; janela em DIAS (sex–dom, como `tournamentSeason`); perder não custa nada material.

### (a) Raid da guilda — recomendada

- **O quê**: um fenômeno ("Nevoeiro de Pendências", "Praga de Ervas") com HP coletivo. É temático: a ameaça é a mesma pilha de culpa que o app transforma em jogo (Assombrada).
- **Motor**: cada membro dispara UMA rodada da arena (`simulateArenaRun`/`buildArenaRound`) por dia, local, com sua criatura. O cliente afirma apenas "rodei"; o servidor NÃO confia no dano.
- **Servidor decide**: dano ao chefe = função fixa do estágio + escola/elemento do membro (vindos do perfil que o servidor já guarda, como `stagePower`), com o mesmo teto por pessoa por dia (`MATCHES_PER_DAY`), mais o sorteio no servidor. Cliente afirma só "participei hoje". Resultado igual ao princípio de `coopCk:<gid>:<saveId>`: cada membro escreve só a própria chave, sem read-modify-write do blob (bug já corrigido no coop, REGISTRO 5.5).
- **Tela**: barra do chefe caindo; presença binária ("a criatura de Ana veio hoje"); nenhum "causou X". Cada golpe aparece como golpe da guilda, animação do palco sem rótulo de autoria.
- **Meta encolhe**: `HP = membros × k` (como `target = members × 5`); sair não penaliza.
- **Recompensa**: se derrotado até domingo, todos os membros PRESENTES na semana e os ausentes também (não punir ausência: recompensa por participação coletiva, sem gate individual) recebem Emblemas fixos baixos + item cosmético da vila. Se não derrotado: o chefe "recua", ninguém perde nada, recompensa menor (piso, como sonho common).
- **Entrada em Bits**: nenhum na v1. Se farm de Bits virar problema, a alavanca é custo de ENTRADA em Bits (CLAUDE.md, Masmorra), aplicada à rodada individual, nunca retorno de coração.
- **Ligação com construção**: a raid rende SEMENTES/materiais cosméticos da horta/vila (um canteiro raro, um estandarte); o chefe é derrotado por criaturas, mas a horta é o que cresce. Reforça, não compete: ambos dependem de o membro ter aparecido no dia.
- **Quem "perde"**: ninguém. O chefe adia; a semana seguinte tem outro.

### (b) Festival entre guildas por FAIXA

- Cada guilda é medida contra ela mesma: pontuação MONOTÔNICA (`lifetimePoints`, só soma; lição do WP4.13) da guilda → faixa (Semente…Lendário, reaproveitando `tournamentTiers`). Nenhum ranking entre guildas.
- Servidor decide tudo (soma de raids concluídas + colheitas). Cliente só mostra a faixa. "Festival" celebra a colheita: quando a horta atinge marco, a vila faz festa visível a todas, sem comparar.
- Recompensa: cosmético de faixa. Risco: "N pts" da guilda vira a métrica que se cobra dos membros (REGISTRO 13.13: sem número por pessoa; aqui número só coletivo e como faixa, nunca pontos crus). Aceitável só se exibido como faixa.

### (c) Confronto direto guilda × guilda

- Reuso literal do `match` (poder somado, sorteio, pontos +20/−8). Servidor decide; cliente nomeia o oponente.
- Contamina a parte construtiva por três vias: (1) cria perdedor, e perda de guilda vira pressão de um membro sobre outro ("faz a rodada, estamos perdendo") = contribuição individual por baixo do pano; (2) exige ranking, contra os 31,3%; (3) gera incentivo a alt accounts para inflar poder. Além disso o `match` de hoje debita o oponente (−4), punição a quem nem jogou, defeito já corrigido nas faixas.
- Não recomendo.

### Recomendação: (a), com (b) apenas como leitura de faixa da própria guilda

(b) e (c) importam um "contra" que a horta não tem. (a) preserva o mesmo verbo do resto do app: aparecer e cuidar, o grupo cresce. É também a mais barata: uma rota, um chefe por semana, sem matchmaking, sem pontuação por pessoa.

## 3. A criatura de cada membro na horta/vila

- Recomendação: **sprites dos membros no palco, sem nome nem número, em POSES DE TRABALHO**, não em fila de placar. Fantasia: a criatura de cada um cuida de um canteiro. É o Chao Garden de gente real.
- Palco compartilhado usa a regra dos 5 slots (`rug`/`floor-left`/`trophy`/`floor-right`/`wall`, `GROUND_Y` 74%): a vila tem faixa de chão comum onde entram até 20 sprites pequenos, mas o slot `trophy` fica para o troféu da guilda (não para um membro). Ordem por ORDEM DE CHEGADA HOJE (presença binária), nunca por contribuição, e rotacionada por seed do dia para nenhum membro ficar sempre "na frente".
- Quem não veio hoje: silhueta apagada, sem culpa (mesmo gesto do "olhar" da Assombrada: gesto, não texto). Sem estado interno visível (não mostrar criatura abatida: pergunta aberta REGISTRO §5.5, "estado da criatura é visível socialmente?" — a resposta segura é NÃO; a vila mostra só "veio/não veio", nunca HP/estágio doente).
- Arte: só `src/assets/soulmon/`. O servidor guarda `demoCharacterId`/linha e forma, não imagem; o cliente resolve sprite por `getSpriteForStage`. Sprites gerados por IA de terceiros NÃO são carregados de outros jogadores (URL de sprite alheia é vetor de beacon; ver `isSafeSpriteUrl`, que não fixa host). Para a vila usar somente a linha + estágio e renderizar arte local. Isso resolve também "20 jogadores × arte": 20 sprites pequenos reaproveitando o atlas local, sem rede.
- Exibir GALHO, não altura (REGISTRO §5.5): a vila mostra a linha/afinidade, nunca "estágio 5 de 5".

## 4. Riscos

| Risco | Tratamento |
|---|---|
| Farm de raid | Teto por pessoa/dia no servidor; sem retorno de Bits além de Emblemas com teto semanal por guilda |
| Alt accounts | Entrada por código (já é regra do coop); recompensa é por guilda-semana, não por conta; alt não gera dano que o servidor não limite; gate de Vínculo (`BOND_PVP_MIN_LEVEL` 5, servidor) |
| Save editável / Emblemas no cliente | Dano e HP do chefe só no servidor; o cliente só afirma presença. Regra existente: Emblemas só cosméticos (teste trava). Se um dia comprarem vantagem, vão ao servidor com os Créditos. Recompensa de raid concedida via `pendingTrophies`-like, servidor-lado |
| Corrida de escrita | Chave por membro (`raid:<gid>:<semana>:<saveId>`), padrão `coopCk`; ninguém regrava blob comum |
| Varredura de KV | Limite ~20 membros, leitura por prefixo com `_rateLimit.js` classe cara |
| Vergonha implícita | Testes de invariante como o `vistaDoGrupo`: nenhum campo por membro além de `presente` |
| Camada 3 congelada | Não iniciar antes do gatilho de 10 usuários × 14 dias; ou registrar exceção no REGISTRO |

Precisa de servidor: chefe/HP, dano, teto diário, presença, distribuição de recompensa, índice de guilda. Tudo o mais é cliente.
