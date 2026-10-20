# Backlog de produto (ditado do dono)

> Itens decididos como "depois". Nada aqui está em andamento. Cada item diz de onde veio e o que ele desbloqueia.
> Regra: o REGISTRO-DE-DECISOES guarda o que foi DECIDIDO; este arquivo guarda o que foi ADIADO.

## Guilda
- **Loja do clã** (20/10/2026): itens comprados com os Bits TOTAIS do clã (o total já aparece no Clan Hall > Casa > "Bring Bits",
  `casa.bitsTotal`, REGISTRO §141). Onde ela cabe no Mercado fica para decidir depois. Sem contribuição individual com nome+número
  (linha vermelha da Guilda).

## Match 3
- **17 Novos Soulmon como inimigos** (20/10/2026): hoje os inimigos usam as 6 linhas da masmorra. Futuro: a cada fase sortear
  6 dos 17; afinidade elemental no dano (bônus de dano no próprio elemento, p.ex. água/pântano; resistência, p.ex. água resiste a fogo,
  reduzindo o dano recebido); sistema de NÍVEIS e dificuldade progressiva que RESETA todo mês; e um RANK.

## Arte (parado: "vamos usar o que já temos", 20/10/2026)
- Cena própria da Casa da Guilda (hoje usa o recorte do panorama do Grove) e busto próprio do Grove (hoje Lilia, a musa): sem geração agora.
- Silhuetas do Pesadelo dos slots `1b`, `2c`, `3`, `4b` (ficaram repetindo outra silhueta depois que Serah/Nautil/Akashai saíram): exige rodar o oráculo.
- Widget Android: o Kotlin novo (`WidgetRenderer`) não foi compilado nem testado em aparelho: conferir no APK.

## Textos
- 149 trechos longos (160+ caracteres) ficaram fora dos 10 cortados na W13-D: relatório em `D:/Soulmon/prompts/d72-textos-longos.md`.

## Infra
- Medir no APK: tamanho do instalador, tempo até a Home e memória com o Grove andando (dono: "depois a gente se preocupa").

## Som
- ✅ **FEITO, pendente de escuta do dono (20/10/2026, §151):** o D-88 agora é o "push" `thrusterFire_001` (Kenney, CC0); 3 candidatos em `D:/Soulmon/_gemini_out/w10-sfx/para-ouvir/D-88-push-{a,b,c}.wav` (a = instalado). **Trocar o som do poder do ataque mágico** (20/10/2026, dono): hoje soa como um "plim", muito ruim. Procurar outro barulhinho, algo tipo "push" (impulso/rajada). O "plim" é o D-88 `attack-ranged` (confirmado pelo dono) em `SFX_DE_COMBATE_LIVRES` (`sonsAssets.ts`); trocar o arquivo `sfx-combate-attack-ranged.webm`. Entra no próximo update.

## Combate (efeitos de ataque)
- **Poderzinhos (FX de ataque) virados ao contrário** (20/10/2026, dono; pedido REPETIDO e ainda não corrigido): o efeito tem que
  apontar do atacante para o alvo, nos DOIS lados do palco. Casos vistos: o ataque de **espaço** do inimigo sai "de trás pra frente";
  o **especial de luz** do jogador também; o ataque **físico** do inimigo **Nocterix** (sombra) está espelhado na horizontal e tem que ser
  flipado para o outro lado. "Acontece com vários": NÃO consertar caso a caso. Auditar TODOS os elementos × (ataque básico, especial,
  físico) × (jogador, inimigo) em `utils/attackFxArt.ts` / `utils/combatFx.ts` / `BattleStage` / `ArenaGame` / `DungeonGame`, com uma
  tabela "arte olha para onde" por FX + um teste que reprova FX do inimigo sem o espelho inverso do do jogador (mesmo molde de
  `spriteUrlFacesLeft` em `utils/sprites.ts`). Conferir no aparelho, lado a lado, antes de dar como feito.

## Evolução
- **"Steps" viram Fragmentos de Alma** (20/10/2026, dono): trocar o nome/medida "steps" da evolução por uma MOEDA nova, **Fragmento de Alma**,
  para ficar claro. Ideia do dono: cada ação concluída dá 1 fragmento; ao juntar X fragmentos eles são CONSUMIDOS e o Soulmon evolui.
  A pensar antes de construir (hoje a regra mora em `utils/evolutionGauge.ts`, decisão de 11/10/2026):
  - **Choque com a linha vermelha do gauge**: hoje a barra enche pelo PESO DE ESFORÇO (hábito = `HABIT_WEIGHT`, tarefa = `effort` 1–3), tem
    TETO DIÁRIO igual à meta do estágio e é creditada na VIRADA do dia — "recompensa por contagem de tarefas é proibida" (anti-farm).
    "1 ação = 1 fragmento" é contagem. Decidir: (a) fragmento = unidade do mesmo peso de esforço (tarefa de esforço 3 dá 3), mantendo teto
    diário e crédito na virada; ou (b) 1 por ação com teto diário de fragmentos. O dono decide (registrar em REGISTRO-DE-DECISOES).
  - X por estágio (hoje `FORM_REQUIREMENTS[estágio].required` e `ULTRA_PATIENCE_POINTS`), consumo ao evoluir (já "zera ao evoluir") e o piso na
    queda por HP (`degeneratedEvolutionPoints`) precisam virar o mesmo número em fragmentos.
  - Nova moeda = novo ícone de alma (nada de reuso de Bits/Emblemas), texto PT/EN, migração do save (progresso atual do gauge convertido sem perder nada),
    e a Home/Evolução mostrando "fragmentos" no lugar dos pontos.

## Tamanho do Soulmon
- **Rookie tem que ser pequeno** (20/10/2026, dono): o Soulmon criado pelo dono (o primeiro, em `rookie`) aparece ENORME. Regra desejada:
  o tamanho na tela depende do estágio — `rookie` pequeno por padrão e pode crescer (ou não) ao evoluir. Nada obriga crescer: pode existir
  Soulmon que continua pequenininho até no `mega`. Um `rookie` grande pode existir, mas tem que ser EXTREMAMENTE raro. Pensar em: um fator de
  escala por estágio (+ variação por criatura, com o "grande no rookie" como exceção rara e declarada), aplicado em UM lugar e lido por Home,
  jogos, arena, masmorra e combate (hoje cada tela dimensiona o sprite por conta própria — medir antes: Home/`CompanionHUD`, `BattleStage`,
  `DungeonGame`, `ArenaGame`). Cuidado: o sprite gerado do Oráculo (acervo) vem em 512² com bbox variável; normalizar pela caixa visível, não
  pelo canvas, senão o "enorme" volta em outra tela.
