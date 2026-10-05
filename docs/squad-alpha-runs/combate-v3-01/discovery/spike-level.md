# Spike L1: level com teto por estágio + limite de concentração (contexto §2.7)

Script fora do repo: `E:\tmp\claude\C--Users-spera-Desktop\15e38906-06a4-414f-9e35-09198d7bb9f7\scratchpad\cv3-sim4.mjs`. Ele reusa o `fight()` do `cv3-sim3.mjs` literalmente. Rodar com `node cv3-sim4.mjs`; a saída completa fica em `s4.txt`.

Esta versão substitui a v0 (`cv3-sim4.v0.mjs`). A v0 multiplicava os pontos por 1,5^estágio, o que inflava o "+1 ponto", e testava só a aditiva com k=10. Aqui os pontos são crus sobre a base do estágio, k vai de 4 a 20 e o motor de luta entra.

- **Veredito: FECHA, e só com curva multiplicativa k=8 e limite X ≤ 45%.** Com X=0,45 e dano fracionário: pior gap −1,9% (L50 ATK×DIST), +1 level ≥ +2,4% (L35→36), DEF puro máx 36,2 s. Com X=0,40: −0,6% / +2,4% / 31,3 s. A versão com round também fecha.
- **X=50% e 60% não fecham.** O gap até passa (−3,9% e −8,7%), mas o DEF puro estoura: 41,9 s e 52,1 s no L50. Quem decide o limite é a regra dos 40 s, não o gap.
- **A curva aditiva não fecha com round em nenhum k de 4 a 20.** A fórmula testada foi `golpes = HP ÷ max(0,2; 1+(ATK−DEF)/k)`, e o DEF domina o SPD em todos os casos: +332,8% com k=4/X=0,4 e +11,1% com k=20/X=0,4. Com dano fracionário fecha só k=20/X=0,40 (+6,5%, 33,4 s). Com X=0,45 já falha (+16,1%).
- **Prova de vermelho.** A mesma curva multiplicativa sem limite (X=1) dá −46,2% de gap (L50 ATK×DIST) e 186,0 s de DEF, e a saída marca "REPROVA". A aditiva com X=1 vai a +103,7%.
- **Ressalva de design (para o dono).** Com X ≤ 45%, o build "puro" fica em 45/27,5/27,5 contra os 33/33/33 do DIST. O equilíbrio vem de os builds serem quase iguais, não de a curva compensar a especialização. A pergunta ao dono é: "um limite de 45% ainda é build?"
- **+1 level ≥2% passa com folga mínima (+2,4%).** O pior caso é o level que só dá HP (cada 4º level, L35→36), e é igual em todas as curvas. Com um teto de level maior no estágio, esse valor cai abaixo de 2%.
- **Talento e equipamento.** O talento de +5% de dano cria exatamente +5,0% de gap em todos os níveis, dentro de 10%. O equipamento plano estoura: +1 ponto já dá +11,1% (L1), +2 dá +22,2%, +3 dá +33,3% e +5 dá +55,6%. No L50, +1 ponto rende só +3,2%. Por isso o equipamento teria de ser percentual, ou ter um teto que escale com o level.
- **Motor sim3.** A energia 60/60/2 disparou o especial nos dois lados em 6000/6000 lutas (PASS). Já o controle `direto2` da régua ΔTTK deu −8,3% (L1/DEF): **FATAL, não investigado**. A hipótese é luta curta no L1 com fantasma e meio golpe. As 7 famílias não foram recalibradas.
- **Suposições.**
  - S-L1: teto de level 10/20/30/40/50 para Rookie/Champion/Ultimate/Mega/Ultra.
  - S-L2: XP rende 1 level por dia completo (66% do XP vem do bônus), e o teto é atingido antes de evoluir.
  - S-L3: 1 ponto por level, e cada 4º ponto vai para HP.
  - Base do estágio = ceil(1,5^s), HP = 10·1,5^s mais os pontos de HP.
  - A janela é normalizada para o espelho DIST durar 25 s.
  - Build puro = floor(X·pts) no atributo principal, o resto alternado nos outros dois.
  - Levels medidos: 1/5/10/11/15/20/21/25/30/31/35/40/41/45/50. Empate (0%) conta como válido.
- **Constantes da configuração mínima.**
  - `golpes = HP·(1+DEF/8)/(1+ATK/8)`, fracionário (a exibição arredonda).
  - `RITMO = 9·(1+SPD/8)/(1+1/8)`.
  - `X_MAX = 0,45`.
  - E = 3; energia +60/+60/+2/s, dispara a 100.
  - Talento ≤ +5%. Equipamento plano: nenhum valor ≥ +1.

## Saída real (trechos de s4.txt)
```
mult k=8 frac | 0.40 | -0.6% (L40 SPD×DIST) | +2.4% (L35→36) | 31.3s (L50) | FECHA
mult k=8 frac | 0.45 | -1.9% (L50 ATK×DIST) | +2.4% (L35→36) | 36.2s (L50) | FECHA
mult k=8 frac | 0.50 | -3.9% (L50 ATK×DIST) | +2.4% (L35→36) | 41.9s (L50) | NÃO
mult k=8 frac | 0.60 | -8.7% (L40 ATK×DIST) | +2.4% (L35→36) | 52.1s (L50) | NÃO
mult k=8 frac | 1.00 | -46.2% (L50 ATK×DIST) | +2.4% (L35→36) | 186.0s (L50) | NÃO
adit k=10 round | 0.40 | +34.6% (L50 DEF×SPD) | +2.4% (L35→36) | 42.2s (L50) | NÃO
adit k=20 round | 0.40 | +11.1% (L1 ATK×DEF) | +2.4% (L35→36) | 33.3s (L50) | NÃO
adit k=20 frac | 0.40 | +6.5% (L50 DEF×SPD) | +2.4% (L35→36) | 33.4s (L50) | FECHA
adit k=20 frac | 0.45 | +16.1% (L50 DEF×SPD) | +2.4% (L35→36) | 42.2s (L50) | NÃO
fecham (X<1): mult k=8 frac X=0.45; mult k=8 round X=0.45; mult k=8 frac X=0.4; mult k=8 round X=0.4; adit k=20 frac X=0.4
PROVA DE VERMELHO: mesma curva sem limite (X=1) -> gap -46.2% (L50 ATK×DIST) -> REPROVA
talento +5% dano | máx +5.0% (L20/ATK) · mín +5.0% | dentro de 10%
equip +1 pts no principal | máx +11.1% (L1/ATK) · mín +3.2% | ESTOURA 10%
equip +2 pts no principal | máx +22.2% (L1/ATK) · mín +6.5% | ESTOURA 10%
equip +5 pts no principal | máx +55.6% (L1/ATK) · mín +16.1% | ESTOURA 10%
## 3. Motor sim3: energia 60/60/2 -> especial nos 2 lados em 6000/6000 lutas PASS · régua ΔTTK controle direto2 pior -8.3% (L1/DEF) FATAL
## VEREDITO: FECHA com mult k=8 frac X=0.45
```

## Passe 1 (revisão do skeptic, F1/F2): `node cv3-sim4.mjs --cap-code --p1` -> `p1L.txt`

- **Teto do código confirmado.** `progression.ts` traz `FORM_REQUIREMENTS.cap` 6/7/8/9/10, que acumulado dá **6/13/21/30/40**, igual ao que o architect estimou. Repare que `required` (4/5/5/6/6) é menor que o `cap`.
- **Com esse teto a configuração NÃO FECHA, e nenhum X resolve.** Com X=0,45 o gap fica em −1,3% e o DEF em 34,4 s (PASS), mas o +1 level cai para **+1,7%** (L31→32). Os X de 0,35 a 1,0 dão todos +1,7%.
- **A causa é o level que só dá HP.** No estágio 4 (HP base 50,6) um ponto de HP vale menos de 2%, e o limite de concentração não mexe nisso.
- **Para fechar, a alavanca é o HP, não o X.** As saídas possíveis são o level de HP dar mais de 1 HP, ou o HP não ocupar o slot do level. Nada disso foi testado.
- **O direto2 é artefato da régua em luta curta, não bug do motor.** Com HP×1 (9 golpes, 1 cast) o Δ é −8,3%. Com HP×3, ×10 e ×30 o Δ é +0,0%, e o espelho direto×direto também dá +0,0%. Nas 400 fases do L1/DEF o Δ médio é −6,0% e o pior é −16,0%.
- **Origem do direto2.** A 2ª metade chega 0,5 intervalo depois, e quando a luta tem um só cast esse atraso pesa cerca de 1/18 da luta. Não corrigi o motor porque ele está correto. Para passar no L1, o direto2 precisa de uma regra de régua para luta curta, ou de p ligeiramente maior que 1.
- **O skeptic está certo: dentro do mesmo estágio o PvE difere bem mais que 5%.** Contra um inimigo fixo (DIST no level mínimo do estágio), o DIST do level mínimo ao teto encurta o TTK em 16,0% a 25,6%, e o DEF em 12,5% a 18,2%.
  ```
  estágio 0 L1→L6 DIST: TTK 25.0s → 18.6s (-25.6%) >5%
  estágio 4 L31→L40 DIST: TTK 25.0s → 21.0s (-16.0%) >5%
  ```
- **Saída da varredura com o teto do código:**
  ```
  mult k=8 frac | 0.45 | -1.3% (L36 ATK×DIST) | +1.7% (L31→32) | 34.4s (L26) | NÃO
  mult k=8 frac | 1.00 | -37.6% (L40 DEF×DIST) | +1.7% (L31→32) | 134.7s (L40) | NÃO
  fecham (X<1): NENHUMA
  HP×1: golpes 9.0 · direto2 Δ -8.3% (castA 1) · espelho direto×direto Δ +0.0%
  HP×3: golpes 27.0 · direto2 Δ +0.0% (castA 2) · espelho direto×direto Δ +0.0%
  ```
