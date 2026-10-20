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
- **Trocar o som do poder do ataque mágico** (20/10/2026, dono): hoje soa como um "plim", muito ruim. Procurar outro barulhinho, algo tipo "push" (impulso/rajada). O "plim" é o D-88 `attack-ranged` (confirmado pelo dono) em `SFX_DE_COMBATE_LIVRES` (`sonsAssets.ts`); trocar o arquivo `sfx-combate-attack-ranged.webm`. Entra no próximo update.
