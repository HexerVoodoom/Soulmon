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
- **Apresentação do Soulmon** (origem 20/10/2026; feita no PR desta branch, contra `release/1.3.0-beta2`; REGISTRO §150). Fica de fora: demo grátis (o Soulmon guia emprestado), Nova Leitura e Renascimento não se apresentam; a fala é só por template (sem IA); o traço/caminho de iniciais (`STARTER_ALIGNMENT`) não é usado; rebasear a normalização planta/industrial no dono único do mapa oráculo->classe quando a frente `fix/elemento-oraculo-perfil` entregar.
- **"Gerar de novo" a aparência da forma atual** (origem 20/10/2026) no Laboratório › Perfil: mesmo prompt, só a forma atual; a pessoa escolhe manter a atual ou usar a nova. Custo em Créditos (gemas, dinheiro real; nome na UI Credits/Créditos); sem saldo abre o `CreditsModal`; só conta paga. Decisão do dono sobre o sorteio pago: "cobra antes e aceita o sorteio". Atenção: contradiz `public/termos.html` §5 ("not a random roll"); a execução EXIGE reescrever os Termos §5 e subir `TERMS_VERSION` (reconsentimento). Mexe na cota `AI_LIMITS.sprite.perFormLifetime` (hoje 1 geração por forma, REGISTRO §34). Débito no servidor, idempotente por `opId` (o cliente nunca manda preço); devolver o débito se a geração falhar; guardar a versão anterior (`revertVisor`); exige compatibilidade do save e plano de rollback (CLAUDE.md › Compatibilidade). Dúvidas abertas do dono: preço (50 como a Nova Leitura?), limite por forma/mês, guardar só a anterior ou todas. NÃO implementado.
- **Contagem de passos: pedir de cara, enxuta, conta com o app fechado** (origem 20/10/2026, pedido do dono). Literal: "na função de contar passos você tem que pedir, perguntar se o usuário quer fazer isso logo de cara e tira aquele textão todo, deixa só contar passos e ativar a missão. O cardzinho fala: você deseja usar a contagem de passos?; ao fazer isso você ativa uma missão bônus. Ele define quantos passos vai autorizar. Mostre quantos passos já foram dados naquele dia, lá na missão. E tem que contar os passos mesmo com o aplicativo fechado." NÃO implementado.
  - **Decisões do dono (modal, 20/10/2026):** (1) QUANDO pedir: logo depois da apresentação do Soulmon (fim do onboarding), pergunta curta sim/não; quem recusa nunca é cobrado. (2) COMO contar com o app fechado: **Health Connect**. Isso REVOGA a linha vermelha "Nunca… Google Fit" do `CLAUDE.md` (o texto diz Google Fit; Health Connect é outra API do Android, mas a intenção da regra era não ler dado de saúde de fora): a execução registra a mudança no `CLAUDE.md` e no REGISTRO. (3) RECOMPENSA: a já decidida: pesa como hábito diário, NÃO conta para dia completo, passos nunca pontuam sozinhos, a meta TRAVA no dia, só quem tem sensor e permite.
  - **Itens:** card curto no lugar do texto longo (`StepsCard` / `steps.ts`); a pessoa define a meta de passos que autoriza; a missão bônus mostra "N de M passos hoje" em tempo real; conta com o app fechado (leitura do dia no Health Connect ao abrir e em segundo plano); sem sensor ou sem permissão o cartão some sem culpa (§106); copy EN primeiro + PT, sem emoji, sem cobrança (L1..L12).
  - **O que a execução exige:** mudança em `android/` (plugin nativo + manifest com a permissão `READ_STEPS` do Health Connect, com feature detect porque o APK antigo não tem); AAB novo na Play (`versionCode` + 1); declaração de permissões de saúde/Health Connect no Play Console (formulário próprio); atualizar `PLAY-DATA-SAFETY` (§2.6 saúde e bem-estar: dado de exercício coletado); política de privacidade (`public/privacidade.html` §2/§6) e subir `PRIVACY_VERSION` (mudança material); § nova no REGISTRO (alternativa que perdeu: contador do Android + âncora periódica); manual 02/08; régua `widgetSemCobranca` e a de passos. Compatibilidade: campo novo de save só com sanitizador no servidor + teste de paridade; contrato de servidor só aditivo; plano de rollback.
  - **Dúvidas abertas do dono:** valor-padrão e opções da meta (ex.: 3k/5k/8k/10k); se o consentimento do app se separa da permissão do Health Connect; se mostra o total do dia também na Home.

## Som
- **Trocar o som do poder do ataque mágico** (20/10/2026, dono): hoje soa como um "plim", muito ruim. Procurar outro barulhinho, algo tipo "push" (impulso/rajada). O "plim" é o D-88 `attack-ranged` (confirmado pelo dono) em `SFX_DE_COMBATE_LIVRES` (`sonsAssets.ts`); trocar o arquivo `sfx-combate-attack-ranged.webm`. Entra no próximo update.
