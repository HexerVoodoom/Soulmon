# Spike do sistema completo (Fase 1 Prototyper, contexto §2.8 / PLANO §11)

Script fora do repo: `E:\tmp\claude\C--Users-spera-Desktop\15e38906-06a4-414f-9e35-09198d7bb9f7\scratchpad\cv3-sim5.mjs`. O motor de luta é o `fight()` do `cv3-sim3.mjs`, reusado literalmente. Rodar com `node cv3-sim5.mjs --min=0.15 [--red]`; a saída fica em `s5.txt`. É determinístico: duas execuções dão saída idêntica (verificado com `cmp`).

- **Veredito: FECHA com um acréscimo, o piso de 15% por atributo (`--min=0.15`).** Sem o piso, só com X_MAX=0,45, a configuração NÃO FECHA. O FATAL é o critério (6), chips: entre duas distribuições extremas no L40 o gap é de +10,7% (13/13/14 × 4/18/18 em atk/def/spd).
  - Com o piso de 15% o pior gap cai para +6,5%.
  - Alternativa sem piso: X_MAX=0,43 também fecha (+6,2%), mas mexe numa decisão do dono.
- **(1)(2)(3) PASS, medidos em L=1..40 nos 4 builds.**
  - Gap máx −2,0% (L40 ATK×DIST).
  - DEF puro máx 36,2 s (L38).
  - +1 level mín +5,3% (L39→40 SPD). O HP automático resolve o +1,7% do spike-level.
- **(4) As 7 famílias passam com p GLOBAL; não precisou de p por estágio.**
  - Pior Δ: direto2 −0,2%, dot −0,3%, buffAtkN/debuffDefN −0,9%, buffSpdN −1,4% (L1/SPD).
  - Regra de luta curta declarada: a régua ΔTTK mede com HP×3 nos dois lados.
  - Com HP×1 o direto2 também deu +0,0% nesta HP: o −8,3% do spike-level dependia do HP exato do L1 (11 golpes contra 9).
- **Prova de vermelho válida.**
  - dot com p×1,5 fica em 48/60 (+12,8% em L1/SPD) → "REPROVA: família=dot".
  - Com `--red`, buffSpdN×1,5 fica em 51/60 → REPROVA.
  - A energia 60/60/2 disparou o especial nos dois lados em 17280/17280 lutas, com HP real e 36 fases.
- **(5) PvP com 5% (talento + equipamento, dano ×1,05) contra 0%.**
  - O gap de TTK é exatamente +5,0% em todos os levels e builds.
  - No Torneio (mesmo level e build, luta completa com especial, 6000 lutas = 15 levels × 4 builds × 100 pares de fase) o lado com 5% vence **90,8%**, com 100 empates e ΔTTK médio de +4,4%. É uma vantagem pequena no tempo, mas decisiva no resultado.
  - Esses 5% valem de 0,2 a 0,8 level: 0,2 no L1 e 0,8 no L36. Na troca de estágio vale 0,0 porque a evolução dá um salto.
- **(6) Chips = só distribuição: PASS com o piso.** Foram 455 distribuições, todas com total = L. O pior gap entre quaisquer duas é +6,5% (L30 10/10/10 × 4/13/13).
- **(7) Degeneração: PASS.** Os stats são uma função pura de (level, caminho). No percurso 10→13→9→8→13→21→17→21→30→25→30, nos 4 builds, mesmo level dá sempre os mesmos stats e total = L. Exemplo: L13 DIST 7/6/6/34,5 → L9 5/5/5/28,5 → L13 7/6/6/34,5.
- **FATAIS: nenhum com o piso.** Ficam pendentes:
  - O dono precisa aprovar o piso de 15% (ou X=0,43).
  - O motor de PvP precisa decidir como trata 90,8% de vitória para uma diferença de 5%.
  - A fórmula de HP é suposição minha.
- **Constantes para o núcleo TS:**

| constante | valor |
|---|---|
| STAGE_LEVEL_CAP | 6/13/21/30/40 (`FORM_REQUIREMENTS.cap` acumulado) |
| POINTS | 1/level, só ATK/DEF/SPD; teto max(ceil(L/3), floor(0,45·L)); **piso floor(0,15·L)** |
| BASE | ATK/DEF/SPD = ceil(1,5^estágio) + pontos |
| HP (automático) | 10·1,5^estágio·(1 + L/10) |
| CURVA | golpes = HP·(1+DEF/8)/(1+ATK/8)/(1+bônus%), fracionário; exibição arredonda |
| RITMO | 9·(1+SPD/8)/(1+1/8) ataques por janela; janela normalizada para o espelho DIST = 25 s |
| E / ENERGIA | 3 golpes / +60×fração causada, +60×fração recebida, +2/s, dispara a 100 |
| RÉGUA | ΔTTK ±5% em lutas com HP×3; buffs −15% no estágio 0; empate válido |
| P_direto / direto2 / dot / cura / escudo | 1 / 1 / 1 / 1 / 1 |
| P_buffAtkN / debuffDefN / buffSpdN | 1,01 / 1,01 / 1,82 |
| BÔNUS talento+equipamento | ≤ 5% de dano (≈ 0,2–0,8 level) |

## Saída real (`node cv3-sim5.mjs --min=0.15`)
```
## (1) gap máx -2.0% (L40 ATK×DIST) PASS · (2) DEF puro máx 36.2s (L38) PASS · (3) +1 level mín +5.3% (L39→40 SPD) PASS  [L=1..40, 4 builds]
direto2 | 1 | -0.2% (L18/DEF) | 60/60 | PASS
dot | 1 | -0.3% (L18/DEF) | 60/60 | PASS
cura | 1 | +0.0% () | 60/60 | PASS
escudo | 1 | +0.0% () | 60/60 | PASS
buffAtkN | 1.01 | -0.9% (L18/DEF) | 60/60 | PASS
debuffDefN | 1.01 | -0.9% (L18/DEF) | 60/60 | PASS
buffSpdN | 1.82 | -1.4% (L1/SPD) | 60/60 | PASS
PROVA DE VERMELHO: dot p×1,5 -> 48/60, pior +12.8% (L1/SPD) -> REPROVA: família=dot
energia 60/60/2 (HP real, 36 fases): especial nos 2 lados 17280/17280 PASS
gap TTK +5.0%..+5.0% PASS (~5%) · torneio (...): o de 5% vence 5450/6000 (90.8%), empates 100, ΔTTK médio +4.4%
455 distribuições; total = L em todas: SIM; pior gap entre quaisquer duas +6.5% (L30 10/10/10 × 4/13/13 (atk/def/spd)) PASS
caminho 10→...→30 × 4 builds: mesmo level = mesmos stats e total = L: PASS
## VEREDITO: FECHA
```
Sem o piso (`node cv3-sim5.mjs`): `467 distribuições; ... pior gap +10.7% (L40 13/13/14 × 4/18/18) FATAL` → `## VEREDITO: NÃO — FATAL em: chips`.

## Passe 1 (skeptic): `node cv3-sim5.mjs --min=0.15 --p1` -> `p1s5.txt`

- **(a) Holdout com HP×1, p congelados.** A amostra usa 15 levels ímpares fora da calibração, 4 builds e 16 pares de fase assimétricos (0,13/0,37/0,71/0,89).
  - **Pela medida bruta, todas as famílias dão FATAL, inclusive a referência `direto`** contra ela mesma (+8,3% em L3/ATK).
  - A conclusão é que o Δ bruto com fases desiguais mede quem bate primeiro, não a família. Em luta curta um golpe vale cerca de 11% da luta.
- **(a) Régua pareada: Δ(família) − Δ(direto×direto) nas mesmas fases.** Todas passam em 960/960 com a tolerância da régua.
  - Pior Δ no estágio 0: buffAtkN, debuffDefN e buffSpdN −10,7% (dentro dos −15% do rookie); cura/escudo −2,1%.
  - Nos estágios 1 a 4: pior +1,4% (buffSpdN, estágio 1).
  - **buffSpdN = 1,82 se sustenta no holdout.**
  - Ressalva: direto2/dot dão +0,0% pareado porque em HP×1 o golpe que derruba é o mesmo. A resolução de 1 tick esconde diferenças menores que ~10%.
  - **Proposta de regra para o núcleo: régua pareada contra direto×direto mais lutas de referência com HP×3.**
- **(b) Critérios 1–3 com HP×1 são idênticos por construção.** Eles são razões de TTK, e o HP multiplica os dois lados igualmente.
  - O pior Δ por família e estágio está na tabela acima: decai de 8–16% bruto no estágio 0 para menos de 1% no estágio 4.
- **(c) Sensibilidade do HP (L/8 e L/12, ±20%): nenhum critério vira.**
  - c=8: gap −2,0%, DEF 36,2 s, +1 level +5,4%, chips +6,5%, buffSpdN recalibra para 1,84. FECHA.
  - c=12: −2,0%, 36,2 s, +5,2%, +6,5%, buffSpdN 1,76. FECHA.
- **(d) PvP com ruído de ±25% multiplicativo por golpe** (uniforme, seed 7, fases aleatórias, N=7200): o lado com 5% vence **90,0% (IC95% 89,3–90,7%)**, com 17 empates. O ruído quase não dilui o bônus. Em tempo 5% é pouco, mas em vitórias é quase decisivo.
- **(e) Teto global não empilhável:** bônus = min(talento + equip + Comércio + Renascimento, 5%).
  - Foram testadas 4^4 combinações (0/1/2,5/5% cada), em 15 levels e 4 builds.
  - Com o cap, o gap máximo é **+5,0%** (PASS).
  - **Prova de vermelho sem o cap:** o gap chega a +20,0% e a saída marca "REPROVA: bônus empilhado".
- **Veredito do passe: FECHA, condicionado à régua pareada.** Pela régua bruta com HP×1, as 8 famílias dão FATAL, mas é artefato da medida: a própria referência falha.
- **Pendente para o dono:** 5% de bônus dá ~90% de vitória no Torneio entre iguais. Isso precisa ser aceito conscientemente ou reduzido.
