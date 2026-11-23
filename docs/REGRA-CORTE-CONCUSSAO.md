# Regra do corte × concussão (golpe corpo a corpo)

**Decisão do dono, 05/11/2026.** O golpe corpo a corpo pode acabar em CORTE (o risco de lâmina de sempre) ou em CONCUSSÃO (o splash de impacto que o golpe à distância usa, sem projétil). **Só visual:** a investida, o tempo, o som, o dano, a sorte e o resultado da luta são os mesmos. Pedido original: associar a palavra-chave do Soulmon quando der; senão, uma porcentagem por elemento (Ar 75/25 corte, Terra 25/75).

## Como se decide (função pura, por lutador)

Código: `src/utils/combate/golpeImpacto.ts` (`meleeImpactOf`). Não importa o RNG do combate, não lê relógio, não guarda estado.

1. **Palavra-chave do NOME, só de inimigo do bestiário** (dado confiável; PT e EN, palavra inteira, sem acento). Concussão: golem, pedra, rocha, martelo, clava, urso, touro, casco, colosso e afins. Corte: garra, lâmina, espada, presa, foice, espinho, asa, lobo, corvo e afins. Se as duas famílias casam, ou nenhuma, cai no passo 2. O nome que o JOGADOR digita nunca entra (não é dado confiável e não é igual nos dois aparelhos).
2. **Sorteio estável:** FNV-1a de `elemento|chave` módulo 100; abaixo do peso do elemento = corte, senão concussão. A chave é fixa por lutador, nunca por golpe ou turno, então o Soulmon não troca a cada ataque.
   - Jogador e oponente do PvP: a chave é a identidade de combate (elementos + escolas + família do especial: ids de lista fechada que o servidor já publica), idêntica nos dois aparelhos. Não se usa nome nem sprite, que diferem entre aparelhos.
   - Inimigo da Arena, Masmorra e Raid: o nome (PT + EN) ou o elemento; Pesadelo e chefe: o elemento.

## Tabela (% de golpes cortantes; o resto é concussão)

| Elemento | Corte | Concussão | Elemento | Corte | Concussão |
|---|---|---|---|---|---|
| Ar | 75 | 25 | Vigor | 25 | 75 |
| Terra | 25 | 75 | Marcial | 50 | 50 |
| Fogo | 60 | 40 | Tempo | 60 | 40 |
| Água | 35 | 65 | Som | 40 | 60 |
| Eletricidade | 60 | 40 | Gravidade | 15 | 85 |
| Arcano | 60 | 40 | Espaço | 70 | 30 |
| Sombra | 75 | 25 | Fada | 80 | 20 |
| Luz | 75 | 25 | Industrial | 40 | 60 |
| Vileza | 65 | 35 | Planta | 65 | 35 |
| Morte | 70 | 30 | Vida | 35 | 65 |

Ar e Terra são do dono; os outros 18 são proposta (ajustar em `PESO_CORTE`, sem mexer em mais nada). **Derivados herdam** a média inteira dos dois componentes (ex.: Lava = Fogo 60 + Terra 25 = 43). Elemento desconhecido ou neutro: 50/50.

## Onde aparece

`StageAction.impacto` (`'corte' | 'concussao'`, ausente = corte). Em `BattleStage`, golpe corpo a corpo com `concussao` troca a camada do corte pelo splash do impacto (`fxFrame(el, 'impact')`), o mesmo que o à distância usa, e não lança projétil. Movimento reduzido já mostrava só o flash de impacto: fica idêntico. Telas que preenchem: Arena, Masmorra, Pesadelo, Rogue, Raid do Bosque (via `GroupScene.playerImpact`/`foeImpact`), Duelo/Torneio e Chefe da Feira.

## Garantias (testes)

`src/utils/combate/golpeImpacto.test.ts`: tabela completa (20 base + derivados), taxa observada bate o peso, determinismo, palavra-chave, e a prova de que a luta não muda (a simulação com a mesma semente é idêntica antes e depois de chamar a função; o núcleo e o servidor do combate não importam o módulo). `BattleStage.golpeTipo.test.tsx` bloco (6): sem corte, com splash, sem projétil, som de corpo a corpo, reduced motion igual.

**O que falsificaria:** o dono achar a proporção de algum elemento errada (ajusta-se o número), ou o perfil público ganhar um id estável de Soulmon (aí a chave pode passar a ser por Soulmon, em vez de por identidade de combate).
