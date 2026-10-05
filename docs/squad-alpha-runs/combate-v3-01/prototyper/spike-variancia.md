# Spike de variância (Fase 1 Prototyper, contexto §2.8/§2.9)

Script fora do repo: `E:\tmp\claude\C--Users-spera-Desktop\15e38906-06a4-414f-9e35-09198d7bb9f7\scratchpad\cv3-sim6.mjs`. Ele reusa as constantes do sim5 com o piso de 15% e o `fight()` do sim3 sem alterações. O PRNG é mulberry32, com um stream por lado derivado da seed da luta e as fases sorteadas da mesma seed. É determinístico: duas execuções dão saída idêntica (`cmp` OK). As saídas estão em `s6.txt` (por golpe), `s6l.txt` (por luta) e `s6l15.txt`, `s6l12.txt`, `s6l10.txt`.

- **Veredito: NÃO FECHA.** Nenhuma variante atinge as metas de win rate e passa ao mesmo tempo em todas as metas do sistema.
- **Range por golpe (o que foi pedido) não chega nas metas.**
  - Com v=30% e crit 10%×1,5, o mais fraco por 5% vence 15,8±0,9% (a meta é 25–40%).
  - Com 1 level abaixo, ele vence 8,1% / 1,8% / 0,5% nos levels baixo/médio/alto (a meta é 15–35%).
  - O motivo é que a luta tem dezenas de golpes e o ruído se cancela.
  - Para chegar perto seria preciso v≈95% com crit (33,2 / 27,1 / 19,8 / 15,5%), ou seja, dano de 5% a 195%, o que é degenerado.
  - A variante por golpe escolhida pelo script (30% + crit) passa em todo o resto (FECHA no sistema), mas erra a meta de variância por 43,9 pp.
- **Variante declarada como alternativa: sorteio por LUTA** (`--luta`). Cada lado sorteia um multiplicador U(1−v, 1+v) uma vez por luta. Com **v=20%, sem crit**, os resultados ficam quase todos dentro das metas:
  - 5% de talento: 38,6±1,2%.
  - L−1: 18,3 / 29,1 / 36,6%.
  - Espelho: 49,8±1,3%.
  - A distância às metas é de 1,6 pp (o nível alto passa 1,6 pp acima de 35%).
  - O crit 10% em v=15% dá 0,3 pp, mas descartei: um "crítico" que vale para a luta inteira não é crítico.
- **Com o sorteio por luta, o FATAL é o DEF P95.**
  - v=20%: 44,0 s. v=15%: 41,8 s. v=12%: 40,5 s.
  - Só v=10% passa (39,8 s), mas aí o L−1 no nível baixo cai para 3,9% e o meio para 14,8%, fora da meta.
  - Não existe v que passe ao mesmo tempo no P95 ≤40 s e na meta de L−1.
- **As demais metas passam com a variante por luta e v=20%.**
  - Gap entre builds no TTK médio: −4,1%.
  - +1 level mín: +3,7%.
  - Régua pareada, 7 famílias: 60/60 cada, pior −2,6% (buffSpdN, L1/ATK).
  - Teto: +5,1% contra +20,3% sem o cap.
  - Energia: 19200/19200.
- **Ruído de medida no teto.** Com v=10% por luta, o teto deu +5,7% (FATAL) com 200 seeds. A causa é a discretização dos golpes, não o cap. O núcleo precisa de mais seeds ou de uma tolerância declarada (sugestão: ±0,5 pp).
- **Prova de vermelho.**
  - Com v=0, o mais fraco por 5% vence 8,6% → "REPROVA: variância=0".
  - dot com p×1,5 fica em 46/60 → "REPROVA: família=dot".
  - Sem o cap, o gap chega a +20,3% → "REPROVA: bônus empilhado".
- **Decisão do dono (bloqueia).** Há três caminhos:
  - (a) Aceitar o sorteio por luta com v=20% e trocar o critério de DEF para o TTK médio (o determinístico é 36,2 s).
  - (b) Por luta com v=15% e aceitar o P95 de 41,8 s e o L−1 baixo de 11,7%.
  - (c) Manter por golpe e abandonar as metas de win rate. Nesse caso, o 5% de vantagem vence cerca de 85–90%.
- **Constantes para o núcleo TS:** a tabela abaixo segue o caminho (a). Os itens marcados "pendente" dependem da decisão do dono.

| constante | valor |
|---|---|
| (sim5) STAGE_CAP / POINTS / BASE / HP / CURVA / RITMO / ENERGIA / P_família | sem alteração (ver spike-sistema.md); piso floor(0,15·L) |
| VARIANCE_MODE | `perFight` (pendente; a alternativa `perHit` não atinge as metas) |
| VARIANCE_V | 0,20: mult = 1 − v + 2v·r, r∈[0,1) |
| CRIT | nenhum (crit 10%×1,5 por golpe, normalizado ÷1,05, testado: efeito pequeno) |
| APLICAÇÃO | golpes = HP·(1+DEF/8)/(1+ATK/8)/(1+bônus)/mult; o mult entra também no especial |
| RNG | mulberry32(seed) de 32 bits; seed por luta; stream do lado i = mulberry32(subSeed(seed,i)), com subSeed = imul(seed^0x9E3779B9, 0x85EBCA6B) + i·0x632BE59B; fases = mulberry32(seed^0x51ED). No PvP, o servidor sorteia a seed e o cliente só reproduz. Teste de conformidade: mulberry32(42) → 0.601104, 0.448291, 0.852466 |
| RÉGUA | pareada: média sobre seeds de Δ(família×direto) − Δ(direto×direto) com a MESMA seed, HP×3, ±5% (buffs −15% no estágio 0) |
| TETO | bônus = min(soma, 5%); a medida tem ruído de cerca de ±0,7 pp com 200 seeds |

```
function mulberry32(a){return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
```

## Saída real: por golpe (`node cv3-sim6.mjs`)
```
variante | v | (i) 5% talento: fraco vence | (ii) L-1 baixo | médio | alto | (iii) espelho A | dist. às metas (pp)
uniforme | 0% | 8.6±0.7 | 0.0±0.0 | 0.0±0.0 | 0.0±0.0 | 49.5±1.3 OK | 61.4
uniforme | 5% | 5.4±0.6 | 0.0±0.0 | 0.0±0.0 | 0.0±0.0 | 49.5±1.3 OK | 64.6
uniforme | 10% | 5.3±0.6 | 0.1±0.1 | 0.0±0.0 | 0.0±0.0 | 50.2±1.3 OK | 64.7
uniforme | 15% | 6.4±0.6 | 0.2±0.1 | 0.0±0.0 | 0.0±0.0 | 50.7±1.3 OK | 63.4
uniforme | 20% | 8.0±0.7 | 0.8±0.2 | 0.0±0.0 | 0.0±0.0 | 50.6±1.3 OK | 61.1
uniforme | 25% | 10.1±0.8 | 2.2±0.4 | 0.1±0.1 | 0.0±0.0 | 51.1±1.3 OK | 57.6
uniforme | 30% | 12.1±0.8 | 4.0±0.5 | 0.4±0.2 | 0.0±0.0 | 50.8±1.3 OK | 53.4
crit 10%×1,5 | 0% | 8.1±0.7 | 2.5±0.4 | 0.1±0.1 | 0.0±0.0 | 50.7±1.3 OK | 59.4
crit 10%×1,5 | 30% | 15.8±0.9 | 8.1±0.7 | 1.8±0.3 | 0.5±0.2 | 50.9±1.3 OK | 43.9
ESCOLHA: v=30% + crit 10%×1,5 (menor distância às metas: 43.9 pp)
PROVA DE VERMELHO (meta): v=0 -> 5% vence-fraco 8.6±0.7 -> REPROVA: variância=0
gap TTK médio máx -2.0% (L40 DEF×DIST) PASS · DEF×DEF P95 máx 37.1s (L29) PASS · +1 level mín (média) +5.3% (L39→40 DEF) PASS
(7 famílias 60/60 PASS, pior -1.4%) · PROVA DE VERMELHO: dot p×1,5 -> 47/60 REPROVA: família=dot
Teto PAREADO: gap máx +5.0% PASS · sem cap +20.2% -> REPROVA: bônus empilhado · energia 19200/19200 PASS
## VEREDITO: FECHA   (sistema; meta de variância a 43.9 pp)
```
`--vs=40,50,60,80,95` (por golpe): `uniforme 95% | 31.9 | 26.4 | 18.6 | 13.6` · `crit 95% | 33.2±1.2 | 27.1±1.1 | 19.8±1.0 | 15.5±0.9 | dist 0.0`.

## Saída real: por luta (`node cv3-sim6.mjs --luta --nocrit`)
```
uniforme | 10% | 29.5±1.2 | 3.9±0.5 | 14.8±0.9 | 25.8±1.1 | 49.5±1.3 OK | 11.3
uniforme | 15% | 35.4±1.2 | 11.7±0.8 | 23.8±1.1 | 32.6±1.2 | 49.6±1.3 OK | 3.3
uniforme | 20% | 38.6±1.2 | 18.3±1.0 | 29.1±1.1 | 36.6±1.2 | 49.8±1.3 OK | 1.6
uniforme | 25% | 40.7±1.2 | 23.9±1.1 | 32.7±1.2 | 39.4±1.2 | 50.0±1.3 OK | 5.1
crit 10%×1,5 | 15% | 37.8±1.2 | 17.8±1.0 | 28.0±1.1 | 35.3±1.2 | 49.9±1.3 OK | 0.3
ESCOLHA: v=20% uniforme (sem crit) (menor distância às metas: 1.6 pp; crit excluído da escolha por --nocrit)
gap TTK médio máx -4.1% (L25 ATK×DIST) PASS · DEF×DEF P95 máx 44.0s (L40) FATAL · +1 level mín (média) +3.7% (L34→35 DIST) PASS
buffSpdN | p 1.82 | pior -2.6% (L1/ATK) | 60/60 | PASS   (todas as 7: 60/60 PASS)
PROVA DE VERMELHO: dot p×1,5 -> 46/60, pior +11.3% (L1/DEF) -> REPROVA: família=dot
Teto PAREADO: gap máx +5.1% PASS · sem cap +20.3% -> REPROVA: bônus empilhado
energia 60/60/2 (HP real, 40 seeds): especial nos 2 lados 19200/19200 PASS
## VEREDITO: NÃO — FATAL em: def40
```
Varredura do P95 (`--luta --nocrit --vs=N`): v=15 → `P95 41.8s (L38) FATAL` · v=12 → `40.5s FATAL` · v=10 → `39.8s PASS` mas `Teto +5.7% FATAL` (ruído).

## Passe 1 (skeptic): `node cv3-sim6.mjs --p1=<id>`, saídas em `p1-<id>.txt`

**Tolerância declarada ANTES de rodar, a mesma para todos os gates.** Um gate PASSA se o limite está dentro de estimativa ± IC95. Amostras: win rate com N=6000 por medida; gates com 300 seeds por ponto; régua com 150 seeds por célula. O IC é normal para proporção e média, e por estatística de ordem para o P95. Os gates são os mesmos para todas as variantes.

| variante | 5% talento | L−1 baixo | L−1 médio | L−1 alto | DEF P95 [IC] / média | gap · +1 lv | régua 7 fam. | teto | energia |
|---|---|---|---|---|---|---|---|---|---|
| controle (sem ruído) | 8,6 | 0,0 | 0,0 | 0,0 | 36,3 / 36,2 | +7,3 · +5,2 | PASS | +5,5 FATAL* | PASS |
| (a) 3% ×2,5 | 13,8 | 7,0 | 2,8 | 0,9 | 37,0 / 36,2 | +3,5 · +5,3 | PASS | +7,4 FATAL | PASS |
| (a) 3% ×3 | 21,2 | 12,4 | 6,7 | 3,5 | 37,4 / 36,2 | +4,6 · +5,3 | PASS | +10,9 FATAL | PASS |
| (a) 5% ×2,5 | 20,9 | 8,7 | 5,4 | 2,9 | 37,3 / 36,2 | +4,4 · +5,2 | PASS | +5,0 PASS | PASS |
| (a) 5% ×3 | 25,1 | 14,2 | 10,5 | 6,6 | 37,8 / 36,2 | +10,4±2,6 · +5,2 | PASS | +5,1±0,1 FATAL | PASS |
| (b) ρ0,7 σ15 | 23,3 | 12,4 | 7,2 | 4,8 | 37,7 / 36,2 | −2,0 · +5,4 | PASS | +5,0 PASS | PASS |
| (b) ρ0,7 σ25 | 32,0 | 22,5 | 19,5 | 16,3 | 40,2 [38,6–41,3] / 36,2 | +3,6 · +5,3 | PASS | +6,1 FATAL | PASS |
| (b) ρ0,9 σ15 | 31,5 | 18,1 | 20,3 | 17,6 | 39,1 / 36,2 | +2,8 · +5,3 | PASS | +5,0 PASS | PASS |
| (b) ρ0,9 σ25 | 38,5 | 28,0 | 30,4 | 28,5 | **46,3 FATAL** / 36,3 | +5,9 · +5,2 | PASS | +5,4 PASS | PASS |
| (c) v10 | 37,9 | 10,2 | 26,5 | 35,9 | 39,8 [39,7–40,0] / 36,3 | −2,3 · +5,1 | PASS | +5,7 FATAL | PASS |
| (c) v15 | 41,9 | 22,3 | 34,4 | 40,9 | **41,9 FATAL** / 36,5 | +3,3 · +5,1 | PASS | +5,1 PASS | PASS |
| (c) v20 | 43,9 | 29,3 | 38,1 | 42,9 | **44,3 FATAL** / 36,7 | +5,2 · +5,4 | PASS | +5,2 FATAL | PASS |

(win rate em %, ±0,2–1,3 pp de IC95; tempos em s; vermelho dot p×1,5 → 48/60 "REPROVA: família=dot" em todas; sem cap +20–24% "REPROVA: bônus empilhado" em todas.)

- **O gate do teto, do jeito que foi medido, não é válido.** O controle sem ruído falha com +5,5% (o analítico dá +5,0% exato), e o gap do controle sai +7,3% contra −2,0% no determinístico. A medida é a média por seed de razões tA/tB em HP×1, o que mistura a discretização das lutas curtas (L1) com o efeito de Jensen da cauda. **Os FATAIS de teto de (a)3%, (b)ρ0,7σ25, (c)v10 e (c)v20 não condenam a variante.** O teto precisa ser medido pela razão das médias, ou em HP×3, antes de virar gate. A exceção é (a) 3% ×3 com +10,9%: ali a cauda infla de verdade a razão média por luta.
- **Leque alcançável com DEF P95 ≤40 s** (sem escolher vencedor):
  - (a), cauda visível: 5% de talento 14–25%, L−1 1–14%. Não cobre níveis médio/alto.
  - (b), AR(1) até ρ0,9 σ15 ou ρ0,7 σ25: 5% de talento 23–32%, L−1 5–23%. É o leque mais **uniforme entre faixas de level**: em ρ0,9 σ15, baixo/médio/alto ficam em 18/20/18.
  - (c) v10, híbrido: 5% de talento 38%, L−1 10/27/36. **Forte dependência de level**: o L−1 baixo é 3,5× mais fácil de virar que o alto.
- **O limite comum a todas é o DEF P95.** Toda variante com L−1 acima de ~25% em todas as faixas, como (b) ρ0,9 σ25 e (c) v15/v20, passa de 40 s no P95, embora a média fique em 36,2–36,7 s. Esse limite é estrutural: com DEF×DEF a 36 s, mais de 10% de dispersão no TTK estoura o P95.
- **Os gates de sistema que restam passam em todas as 12 configurações:**
  - gap ≤10% dentro do IC; o único estimado acima de 10% é (a) 5% ×3, com +10,4±2,6;
  - +1 level ≥ +5,1%;
  - régua pareada 60/60 nas 7 famílias, pior −2,8% (σ25);
  - energia 9600/9600.
- **Base inalterada.** `node cv3-sim6.mjs` reproduz o `s6.txt` byte a byte (`cmp` OK) depois das alterações do Passe 1.
