# Auditoria 09/11/2026 — assets frente à regra "quando usar a identidade"

> Regra: `docs/REGRA-IDENTIDADE-SOULMON.md` (REGISTRO §275). Auditoria só de leitura, sem regenerar nada.
> Método: folhas de contato (miniaturas lado a lado) dos assets do dia, julgadas pela categoria. Julgamento visual: confirmar peça a peça antes de refazer.
> Referência do aceitável (ressalva do dono): chips atuais e `icones-ui/stat-*`.

## Resumo: o que refazer

| Prioridade | Assets | Por quê |
|---|---|---|
| Refazer | FX de ataque de `pira_eterna`, `fornalha_estelar`, `obsidiana` (7 peças cada) | folha, cristal turquesa, circuito e relógio em fogo/obsidiana |
| Refazer | FX de ataque de `chama_solar` (7) | folha e circuito em volta do fogo (menos que os outros) |
| Refazer | FX dos 6 elementos novos do #672 (`alto_forno`, `bencao_feerica`, `clareira`, `colosso_blindado`, `corte_feerica`, `floresta_ancestral`) | uma gema turquesa com chama em TODA peça, mais cano/cabo/folha |
| Refazer | Ícones de elemento `el-*` novos do #672 (9) | categoria "não usar" e todos levam gema+folha+cabo+cobre |
| Refazer (2) | rookies `263-alto_forno` e `266-colosso_blindado` | canos de cobre no corpo + cristais |
| Opcional | rookies `262`, `264`, `265`, `267`, `009` | coroa/pingente de cristal turquesa em 6 de 7: decidir se o tema pede |
| Cena a cena | 45 cenários de masmorra v2 (não instalados) | cristal turquesa em quase todo canto; cano de cobre em ~9 |
| Manter | poções e chips (40), glifos `st-*` (29), paralelas (10 vistas) | dentro do limite |

## Tabela detalhada

| Asset | Problema (evidência) | Sugestão |
|---|---|---|
| `fx-ataque/fx-pira_eterna-*` (aura, cast, defended, impact, orb, slash) | Anel de fogo com ramos de folha; cast com relógio de areia e círculo de circuito; defended com disco-relógio; 5 a 6 cristais turquesa espalhados por peça. Fogo eterno não pede planta nem cristal | REFAZER com a linha "no copper pipes, no circuit lines, no leaves, no turquoise crystals" |
| `fx-ataque/fx-fornalha_estelar-*` | Mesma família: folhinhas, fios de circuito e cristais turquesa nos seis estados, em fogo roxo-laranja | REFAZER |
| `fx-ataque/fx-obsidiana-*` | Cristais turquesa e verdes brotando entre estilhaços roxos, ramos de folha em aura e slash, ponto de circuito no orb. Estilhaço de obsidiana é do tema; o turquesa e a folha não | REFAZER (manter estilhaço roxo-negro, tirar turquesa/folha/circuito) |
| `fx-ataque/fx-chama_solar-*` | Fogo dourado correto, mas com folhinhas em aura/slash e fios de circuito no impact/orb | REFAZER leve (ou retocar) |
| `fx-ataque/fx-{alto_forno,bencao_feerica,clareira,colosso_blindado,corte_feerica,floresta_ancestral}-*` (#672) | Gema turquesa com chama presente em quase todas as peças (aura/cast/impact/orb) mais cabo de cobre, folha e circuito. Nas de natureza (clareira, floresta) folha é tema; a gema e o cabo não | REFAZER; folha só nas de planta |
| `elementos/el-{alto_forno,bencao_feerica,clareira,colosso_blindado,corte_feerica,floresta_ancestral,cyber,maldicao,pestilencia}.png` (#672) | Todos no mesmo molde: objeto + gema turquesa com chama + ramo de folha + cabo de circuito/cobre. Ícone de elemento é categoria "não usar" e o molde repete o bloco 9 vezes (maldição e pestilência com folha e gema não combinam com o tema) | REFAZER sem gema/folha/cabo; elemento e símbolo mandam |
| `elementos/el-neutro.png` (#676) | Esfera de cristal com moldura ornamentada, tons de cobre e folhinhas pequenas nas bordas | Manter, no limite (revisar se quiser zerar folha) |
| `novos-arquivo/combinados/263-alto_forno.png` | Dois canos de cobre sobre o corpo, cristais turquesa nas placas, tubo com chama. Cano combina com forno, mas é o motivo "cano" pedido pelo bloco | REFAZER sem cano e sem cristal turquesa (forja = ferro, brasa, escória) |
| `novos-arquivo/combinados/266-colosso_blindado.png` | Cano de cobre em arco no capacete e nas costas, cristal turquesa no elmo, raio no escudo | REFAZER sem cano nem cristal |
| `novos-arquivo/combinados/262-clareira.png`, `265-floresta_ancestral.png` | Folhas são do tema (planta); cristal turquesa na testa/coroa e ampulheta pendurada na floresta são o acento fora de lugar | Manter, ou retocar o cristal |
| `novos-arquivo/combinados/264-bencao_feerica.png`, `267-corte_feerica.png` | Cristal turquesa no peito/coroa; folhinha solta na asa da 267 | Manter ou retocar (acento único) |
| `novos-arquivo/combinados/009-chama_azul.png` | Pingente turquesa e uma folha no colar; elemento e espécie legíveis | Manter |
| `items/pocao-*.png` (20) e `hex/chip-*.png` (20) | Cada peça tem UMA gema turquesa com chama + uma folha + fio/aro de cobre, igual nas 40. Consistente e discreto (chips foram citados pelo dono como referência) | Manter; se um dia afinar, tirar a folha e deixar só a gema |
| `combate-v3/status/st-*` (29, #672) | Moldura de crachá turquesa com folha e cabo em todos, mas são glifos de HUD de status (categoria UI), ícone interno pelo elemento | Manter |
| `novos-arquivo/paralelos/*` (10 vistas de 5 pares) | Sem cano, folha ou cristal turquesa. `parindustrial` tem peças de cobre e `parraizprofunda` tem raízes, ambos do tema | Manter |
| `E:\Soulmon-assets\masmorra-cenarios-v2` (45 cenas, não instaladas) | Cristais turquesa em quase todas (3 a 6 por cena, nos cantos), contra o limite de 1 a 2. Canos de cobre em cerca de 9: `aco`, `aco_voltaico`, `alto_forno`, `artificio`, `biomecanica`, `brinquedo`, `britadeira` e `singularidade`. Vários com cabo/pipe por cima de cenário que não pede (brinquedo, brisa) | NÃO instalar como está. Refazer as de cano; nas demais, aceitar só se o dono tolerar mais cristal que o acento sutil, senão refazer com "1-2 small turquoise crystals" |

## Observações

- Folha de contato não mostra pixel a pixel: o número de cristais por cena é contagem aproximada.
- `icones-ui/stat-*` não foi alterado hoje e não entrou na auditoria.
- A fila de refazer deve entrar em `docs/ASSETS-A-GERAR.md` quando o dono decidir (e o prompt deve usar os blocos de `REGRA-IDENTIDADE-SOULMON.md`).
