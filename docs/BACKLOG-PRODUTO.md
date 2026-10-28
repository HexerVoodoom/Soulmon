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

## Soulmon / Laboratório
- **Apresentação do Soulmon** (origem 20/10/2026; feita no PR desta branch, contra `release/1.3.0-beta2`; REGISTRO §156). Fica de fora: demo grátis (o Soulmon guia emprestado), Nova Leitura e Renascimento não se apresentam; a fala é só por template (sem IA); o traço/caminho de iniciais (`STARTER_ALIGNMENT`) não é usado; rebasear a normalização planta/industrial no dono único do mapa oráculo->classe quando a frente `fix/elemento-oraculo-perfil` entregar.
- **"Gerar de novo" a aparência da forma atual** (origem 20/10/2026) no Laboratório › Perfil: mesmo prompt, só a forma atual; a pessoa escolhe manter a atual ou usar a nova. Custo em Créditos (gemas, dinheiro real; nome na UI Credits/Créditos); sem saldo abre o `CreditsModal`; só conta paga. Decisão do dono sobre o sorteio pago: "cobra antes e aceita o sorteio". Atenção: contradiz `public/termos.html` §5 ("not a random roll"); a execução EXIGE reescrever os Termos §5 e subir `TERMS_VERSION` (reconsentimento). Mexe na cota `AI_LIMITS.sprite.perFormLifetime` (hoje 1 geração por forma, REGISTRO §34). Débito no servidor, idempotente por `opId` (o cliente nunca manda preço); devolver o débito se a geração falhar; guardar a versão anterior (`revertVisor`); exige compatibilidade do save e plano de rollback (CLAUDE.md › Compatibilidade). Dúvidas abertas do dono: preço (50 como a Nova Leitura?), limite por forma/mês, guardar só a anterior ou todas. NÃO implementado.
- **Contagem de passos: pedir de cara, enxuta, conta com o app fechado** (origem 20/10/2026, pedido do dono). Literal: "na função de contar passos você tem que pedir, perguntar se o usuário quer fazer isso logo de cara e tira aquele textão todo, deixa só contar passos e ativar a missão. O cardzinho fala: você deseja usar a contagem de passos?; ao fazer isso você ativa uma missão bônus. Ele define quantos passos vai autorizar. Mostre quantos passos já foram dados naquele dia, lá na missão. E tem que contar os passos mesmo com o aplicativo fechado." NÃO implementado.
  - **Decisões do dono (modal, 20/10/2026):** (1) QUANDO pedir: logo depois da apresentação do Soulmon (fim do onboarding), pergunta curta sim/não; quem recusa nunca é cobrado. (2) COMO contar com o app fechado: **Health Connect**. Isso REVOGA a linha vermelha "Nunca… Google Fit" do `CLAUDE.md` (o texto diz Google Fit; Health Connect é outra API do Android, mas a intenção da regra era não ler dado de saúde de fora): a execução registra a mudança no `CLAUDE.md` e no REGISTRO. (3) RECOMPENSA: a já decidida: pesa como hábito diário, NÃO conta para dia completo, passos nunca pontuam sozinhos, a meta TRAVA no dia, só quem tem sensor e permite.
  - **Itens:** card curto no lugar do texto longo (`StepsCard` / `steps.ts`); a pessoa define a meta de passos que autoriza; a missão bônus mostra "N de M passos hoje" em tempo real; conta com o app fechado (leitura do dia no Health Connect ao abrir e em segundo plano); sem sensor ou sem permissão o cartão some sem culpa (§106); copy EN primeiro + PT, sem emoji, sem cobrança (L1..L12).
  - **O que a execução exige:** mudança em `android/` (plugin nativo + manifest com a permissão `READ_STEPS` do Health Connect, com feature detect porque o APK antigo não tem); AAB novo na Play (`versionCode` + 1); declaração de permissões de saúde/Health Connect no Play Console (formulário próprio); atualizar `PLAY-DATA-SAFETY` (§2.6 saúde e bem-estar: dado de exercício coletado); política de privacidade (`public/privacidade.html` §2/§6) e subir `PRIVACY_VERSION` (mudança material); § nova no REGISTRO (alternativa que perdeu: contador do Android + âncora periódica); manual 02/08; régua `widgetSemCobranca` e a de passos. Compatibilidade: campo novo de save só com sanitizador no servidor + teste de paridade; contrato de servidor só aditivo; plano de rollback.
  - **Dúvidas abertas do dono:** valor-padrão e opções da meta (ex.: 3k/5k/8k/10k); se o consentimento do app se separa da permissão do Health Connect; se mostra o total do dia também na Home.

## Som
- ✅ **FEITO, pendente de escuta do dono (20/10/2026, §152):** o D-88 agora é o "push" `thrusterFire_001` (Kenney, CC0); 3 candidatos em `D:/Soulmon/_gemini_out/w10-sfx/para-ouvir/D-88-push-{a,b,c}.wav` (a = instalado). **Trocar o som do poder do ataque mágico** (20/10/2026, dono): hoje soa como um "plim", muito ruim. Procurar outro barulhinho, algo tipo "push" (impulso/rajada). O "plim" é o D-88 `attack-ranged` (confirmado pelo dono) em `SFX_DE_COMBATE_LIVRES` (`sonsAssets.ts`); trocar o arquivo `sfx-combate-attack-ranged.webm`. Entra no próximo update.

## Combate (efeitos de ataque)
- ✅ **FEITO em 20/10/2026 (REGISTRO §151; falta conferir no aparelho)** — **Poderzinhos (FX de ataque) virados ao contrário** (20/10/2026, dono; pedido REPETIDO e ainda não corrigido): o efeito tem que
  apontar do atacante para o alvo, nos DOIS lados do palco. Casos vistos: o ataque de **espaço** do inimigo sai "de trás pra frente";
  o **especial de luz** do jogador também; o ataque **físico** do inimigo **Nocterix** (sombra) está espelhado na horizontal e tem que ser
  flipado para o outro lado. "Acontece com vários": NÃO consertar caso a caso. Auditar TODOS os elementos × (ataque básico, especial,
  físico) × (jogador, inimigo) em `utils/attackFxArt.ts` / `utils/combatFx.ts` / `BattleStage` / `ArenaGame` / `DungeonGame`, com uma
  tabela "arte olha para onde" por FX + um teste que reprova FX do inimigo sem o espelho inverso do do jogador (mesmo molde de
  `spriteUrlFacesLeft` em `utils/sprites.ts`). Conferir no aparelho, lado a lado, antes de dar como feito.

## Evolução
- ✅ **FEITO (20/10/2026, REGISTRO §153; fragmento por esforço, `utils/soulFragment.ts`)** — **"Steps" viram Fragmentos de Alma** (20/10/2026, dono): trocar o nome/medida "steps" da evolução por uma MOEDA nova, **Fragmento de Alma**,
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

## Essências dos elementos (ditado do dono, 28/10/2026)
- **O que é:** todo inimigo derrotado dropa uma **essência do elemento dele**, em qualquer modo: minigames, PvP, PvE (Fenda/Masmorra, Combina 3, Arena, Duelo, Torneio, Guerra). Elemento composto dropa a essência do composto (ex.: pântano dá essência de pântano). O **Pesadelo** dropa essência de **pesadelo** (elemento próprio). Os **chefes da Feira** têm elemento e dropam **mais** essências; quanto mais forte o chefe, mais essência.
- **Não mexe nas outras recompensas** (Bits, itens, fragmentos, Honra, seiva): a essência é drop ADICIONAL.
- **Uso:** nenhum por enquanto. Só coletar. O uso vem depois (decisão futura do dono).
- **Onde aparece:** Laboratório > Arquivo, em uma seção **Essências** logo abaixo da coleção de Sonhos. Lista só as essências com quantidade > 0 (zero não aparece). Cada uma é um ícone + quantidade; ao tocar, mostra só um tooltip com o **nome** da essência (e o ícone e a quantidade).
- **Pontos em aberto (perguntar ao dono antes de construir):** quantidade base por derrota e a escala por força do inimigo; se há teto diário (anti-farm na Masmorra idle); se a descida automática (`dungeonAway`) também coleta; ícones (a proposta é derivar do ícone do elemento, `elementIcon`, com uma gota/cristal por cima, em vez de gerar 211 peças + Pesadelo); campo novo no save (`essences: Record<elementId, number>`, leitura tolerante, espelho no servidor com teto de ganho por dia/ação, regras de Compatibilidade do CLAUDE.md); relação com a `defeatedElements` do Dex (a essência não desbloqueia nada; o Dex continua por vitória).
