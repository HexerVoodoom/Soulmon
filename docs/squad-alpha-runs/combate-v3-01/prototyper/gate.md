# Gate — fase `prototyper` (sistema completo), run `combate-v3-01`, 05/10/2026
> Os gates/spikes anteriores estão em `_superseded/` (invalidados por VOLTAR).

## Veredito
**PASS COM 1 DECISÃO BLOQUEANTE.** A premissa "o núcleo level→stats + especiais + bônus fecha as metas" foi respondida **SIM**. A prova está em `spike-sistema.md` (+ Passe 1, saída real).

## Agentes: backend (spike + 1 passe), skeptic. Arquitetura já vinha da Discovery.

## Resultados (cv3-sim5, `--min=0.15`)
- Gap entre builds: −2,0%.
- DEF puro: ≤36,2 s.
- +1 level: ≥+5,2%, com HP automático `HP = 10·1,5^s·(1+L/10)`, robusto a ±20% no coeficiente.
- Chips: 455 distribuições, gap +6,5%, total = L.
- Degeneração: stats = f(level, caminho), sem perda escondida.
- Energia: 17.280/17.280.
- 7 famílias passam na **régua pareada** (Δ família − Δ direto×direto, nas mesmas fases) com HP×3. No holdout com HP×1: rookie buffs −10,7% (tolerado), estágios 1–4 ≤1,4%. Constantes: buffSpdN 1,82, buffAtk/debuffDef 1,01, demais 1.
- Teto global não empilhável de 5% (talento + equipamento + Comércio + Renascimento): gap máx. +5,0% em 256 combinações. Vermelho sem teto: +20% REPROVA.

## Objeções
| # | Objeção | Sev. | Estado |
|---|---|---|---|
| F1 | escopo: bônus empilhando vira grind | FATAL | **resolvida**: teto global min(soma, 5%) provado |
| X1 | buffSpd 1,82 tautológico | FIXÁVEL | resolvida: holdout passa |
| X2 | HP×3 esconde luta curta | FIXÁVEL | resolvida: a régua bruta reprovava até direto×direto (+8,3%, quem bate primeiro); régua pareada adotada |
| X3 | 5% no PvP sem ruído | FIXÁVEL | medido com ±25%: **5% vence 90,0% (IC95 89,3–90,7)** → dono |
| X4 | valor do ponto medido só internamente | FIXÁVEL | declarado como critério interno (≥2% TTK) |
| X5 | fórmula de HP suposta | FIXÁVEL | resolvida: sensibilidade ±20% sem virada |
| X6 | piso 15% por atributo é regra nova | FIXÁVEL | **default declarado: piso 15%** (sem ele, os chips dão +10,7%) |
| R | régua pareada não enxerga <~10% em ticks inteiros (direto2/dot 0,0%) | ressalva | no núcleo TS medir em tempo contínuo |

## Maior risco sobrevivente
**5% de bônus decide ~90% dos duelos entre jogadores iguais, mesmo com ruído.** Num jogo de lutas longas e equilibradas, uma vantagem pequena no tempo vira quase certeza de vitória.

## Defaults declarados (não bloqueiam)
- Piso de 15% por atributo.
- Fórmula de HP acima.
- Régua pareada + HP×3 + tempo contínuo no núcleo.
- Teto global de 5% não empilhável.
- Moeda do equipamento = Bits sem câmbio de Créditos para itens com %. Alternativa: moeda nova.
- Renascimento = pago E Vínculo (soma).
- Comércio = só preço/ganho de moeda ganha, sem %.

---
# Spike de variância + monetização (05/10/2026)
## Veredito: **PASS sem FATAL, com o default b-r0.9s15** (pré-autorização do dono → Builder PR1)
- A variância por golpe uniforme se cancela: o mais fraco por 5% vence ≤16%.
- **Escolhida: AR(1) por golpe, ρ=0,9, σ=15%.** É visível (o dano varia em "maré" de sorte), não um dado invisível.
  - Mais fraco por 5%: **31,5%**. 1 level abaixo: **18/20/18%** (baixo/médio/alto).
  - DEF P95 39,1 s. Todos os gates passam (gap, +1 level ≥5,1%, régua pareada 60/60, energia 100%).
  - Prova de vermelho: v=0 REPROVA, dot ×1,5 REPROVA, sem teto REPROVA.
- Metas de win rate eram **premissa da squad** (skeptic). O dono pediu "chance real mas pequena". Os 31,5%/~19% ficam como default declarado, e o leque está no checkpoint.
- O gate do teto tinha um defeito de medida (o controle sem ruído falhava, por Jensen + discretização). No núcleo TS o teto é medido pela razão das médias com HP×3.
- Sorteio por luta descartado: dado invisível, P95 >40 s.
- Monetização: `prototyper/benchmark-monetizacao.md` (10 fontes). Regra: dinheiro compra **tempo de recurso com teto diário**, nunca level, atributo ou vitória. Teto combinado sugerido: +25% sobre o grátis.

## Decisões do dono (05/10/2026)
Sorte AR(1) ρ0,9 σ15 (31%/19%) aprovada; metas de win rate são do dono. Economia: ver contexto §2.10. PR1 pausado por disco.
