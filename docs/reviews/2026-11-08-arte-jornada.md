# Revisão formal da arte da Jornada do Foco (§27, 08/11/2026)

Gate antes de gerar (alpha-design-critic). Resultado: 0 aprovados, 18 ajustar, 3 reprovar. **Nada é gerado até os ajustes entrarem no §27.**

## Achados transversais
1. FATAL: faltam prompts do baú aberto 4 quadros (27.2b), da cena de chegada (27.5) e do brilho de baú aberto (sprite 4 quadros, 128 px, pedido no plano §6.4 e ausente do §27).
2. Resolvido neste PR: tokens `--sm2-key-*` criados nos dois temas, ≥3:1 sobre bg, surface e surface-2 (medidos em `tokens.contrast.test.ts`).
3. Proporção tem que ir no FIM do prompt (`Vertical 1:2 aspect ratio, full-bleed.` / `Square 1:1.`).
4. Emenda de 128 px: gerar sem a faixa e colar por edição de pixel, não pedir "idêntica" no texto.
5. Cenários poluídos: 2–3 formas grandes protagonistas, "no small clutter" (regra de mapas limpos).
6. Risco steampunk: tirar "copper rails" (Caverna), um cabo de cobre só por bloco, Oficina sem máquinas/engrenagem/vapor.
7. Chaves e baús especiais diferem só pela cor: dar motivo de silhueta por tipo (bancada, raio, quadrante, junco, elo, pena); chave 128 px sem folha/cabo (ilegível em 24 px).
8. Transparência: proibir sombra-base/chão; prévia em xadrez neutro, nunca magenta.
9. A conferir com o padrão de 23/09: "pixel art" no prompt (pixelização de 30/09 foi revogada).

## Por asset
| Asset | Veredito | Correção |
|---|---|---|
| Blocos ×6 | ajustar | menos objetos, proporção no fim, emenda por pixel; Observatório sem céu no topo do bloco |
| Baú comum | ajustar | rim light, "no floor, no shadow plate. Square 1:1." |
| Baú aberto 4 quadros | reprovar | falta prompt; gerar a partir do baú comum aprovado, numa folha |
| Baú especial ×6 | ajustar | motivo de silhueta na tampa + cor do token |
| Chave ×6 | ajustar | 128 px, silhueta forte, arco com motivo, sem folha/cabo |
| Cena de chegada | reprovar | falta prompt; declarar fundo, personagem e proporção |

Mantém: prefixo de identidade, vista de cima vertical, "night sky kept in dark teal, not navy", área livre da trilha, alfa pelo parâmetro, fallback SVG.
