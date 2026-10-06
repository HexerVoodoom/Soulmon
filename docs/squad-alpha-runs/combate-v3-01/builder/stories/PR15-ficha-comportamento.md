# PR15 — Ficha reage ao comportamento na evolução (PLANEJAMENTO, alpha-architect, 06/10)

Status: plano. Não implementado. Depende do PR14 (`combate-v3/pr14`, f92eb7ad4, não mergeado).

## 0. Estado de hoje (verificado no código)
- `buildFichaESkills` (`fromInput.ts`) monta os 5 estágios de uma vez a partir de `oracleAxes` + `seedKey`. Sem comportamento.
- `buildFicha(nome, oracle, stage, seedKey, boost?, plano?)` já aceita `ElementPlan` (pesos por elemento BASE, fatia `ALLOC_FRACTION=0.25` do orçamento; par só vem da cascata com orçamento automático). Só os testes passam `plano`.
- Save tem `powerPoints/harmonyPoints/benevolencePoints` (totais) e `attributesSinceLastEvolution {power,harmony,benevolence}` (janela do estágio atual, `careRules.ts:127`). `soulXP` lê `perfectDays` + estágio.
- `_duel.js:duelStats` só usa `stage` + soma de attrs (cap 2 de atk). Família/lex ainda não derivados no servidor (PR13 em paralelo).
- PR14: `familiasDaJornada({stages, perfis[], escolas, elementosEspecial, tendencia, seedKey})` com `perfilMudouForte` (limiares ELEMENTO 0,06/0,06, GALHO 0,10/0,08, teto troca 25%).

## 1. O que mede "o que o usuário fez"
Fonte única: **`attributesSinceLastEvolution` no instante da evolução** (janela = estágio que termina). Não usar totais (`powerPoints…`) — misturam estágios e incham com tempo de conta.
- **Galho do estágio** = fatias de power/harmony/benevolence dessa janela (normalizadas). Alimenta `PerfilEstagio.galhos` do PR14.
- **Pontos de elemento**: cada galho distribui em elementos base por uma tabela fixa nomeada `GALHO_PARA_ELEMENTO` (ex. poder→fogo/raio/terra, harmonia→água/vento/luz, benevolência→planta/luz/água — tabela final a calibrar com classSystem.data.json; 3 linhas × 8 bases, soma 1 por linha). Resultado = `ElementPlan` (só bases; par continua exclusivo da cascata — mantém a proteção WP4.22).
- **Chips (PR6)**: já inclinam os attrs na origem; não contar de novo (evita duplo peso).
- **Degeneração**: a janela é capturada só no evento "evoluiu para cima". Degenerar NÃO reescreve estágio já vivido; ao reevoluir para o mesmo estágio, usa a ficha gravada (ver §3) — ponto de anti-farm: não dá para degenerar/reevoluir para rerolar elemento.
- **Anti-gaming / regra #16 (XP por esforço)**: o comportamento só mexe na DIREÇÃO (proporções), nunca no ORÇAMENTO. Orçamento segue de `budgetForStage` (estágio). Proporção é invariante a volume ⇒ farmar mais pontos não dá ficha mais forte; só dá ficha diferente. Janela com total < `MIN_AMOSTRA` (ex. 30 pontos) → plano nulo (ficha igual à de hoje). Limite diário de pontos já existe nos caps de cuidado (careCaps); o servidor clampa por dia (§4).

## 2. Função pura
```ts
evoluirFicha(entrada: {
  anterior: { stage, ficha, familia, perfil: PerfilEstagio } | null, // null = rookie
  janela: { power, harmony, benevolence },       // attributesSinceLastEvolution
  oracle: OracleAxes, nome, seedKey, stage, boost?,
}): { ficha, plano: ElementPlan | null, perfil: PerfilEstagio, familia, trocouFamilia, skills }
```
Passos:
1. `plano = planoDoComportamento(janela)` = `normaliza(janela) · GALHO_PARA_ELEMENTO`, com `PESO_COMPORTAMENTO` aplicado via `ALLOC_FRACTION` (0,25 hoje; nome `FRACAO_COMPORTAMENTO` separada se o dono quiser mais influência, teto 0,35).
2. `ficha = buildFicha(nome, oracle, stage, seedKey, boost, plano)` — reaproveita cascata ⇒ pares surgem quando duas bases cruzam o limiar (a "combinação gera elementos mais complexos" já é o mecanismo).
3. `perfil = { elementos: ficha.elementos(efetivo), galhos: fatias da janela }`.
4. Família: `familiasDaJornada` aplicado ao par (anterior, atual) — expor `proximaFamilia(anteriorFamilia, perfilAnterior, perfilAtual, base)` no PR14 para não recalcular a jornada inteira.
5. Skills: `stageSkillsFor(ficha, seedKey)`; nome do especial via `nomeEspecial` (família+elemento+estágio+seed).
Determinismo: nada de relógio/random; seed = `seedKey|stage`. Idempotência: mesma entrada = mesma saída; estágios vividos NUNCA são recalculados — são lidos do registro gravado (§3). Rookie sem anterior = ficha de hoje (plano null), retrocompatível.

## 3. Onde guardar + migração
Novo campo único no save: `fichaJornada: { v:1, estagios: { [stage]: { plano: ElementPlan|null, galhos:{p,h,b}, familia, at } } }` (1 campo; ~150 B/estágio). Grava-se no evento de evolução (careRules/useDailyReset, onde zera `attributesSinceLastEvolution`). Cache `soulmonSkills` continua derivado (recalculável a partir de `fichaJornada` + oráculo), não é fonte da verdade.
Migração (lazy, reversível): save sem `fichaJornada` → estágios já vividos recebem `{plano:null}` (= ficha pré-calculada de hoje, idêntica bit a bit); só a PRÓXIMA evolução usa comportamento. Nenhum pet existente muda de ficha ao abrir o app. Reverter = ignorar o campo. Ponto de não retorno: quando o servidor passar a exigir `fichaJornada` para duelo (15c).

## 4. Servidor e segurança
- Servidor NÃO lê o comportamento cru no duelo; lê `fichaJornada[stage]` e re-deriva ficha/família/lex/elemento com o mesmo módulo puro (paridade = fixtures compartilhadas, como `cascata.fixtures.json`). Congela em `duelStart` como hoje.
- Forja: `plano` é só pesos de BASE dentro de 25% do orçamento ⇒ pior caso de save forjado = ficha "escolhida a dedo" com mesmo orçamento (mesmo risco já aceito no WP4.22 para renascido). Mitigações: (a) servidor recalcula `plano` a partir de `galhos` gravados e ignora o `plano` enviado; (b) `save.js` rejeita `fichaJornada` de estágio passado alterado (imutável após gravado: compara com o KV anterior); (c) clamp diário de attrs na janela via metadata (`metadata.f` = pontos/dia aceitos), teto = cap diário de cuidado × dias desde a última evolução.
- Coordenar com PR13 (derivação família/lex no servidor) e fix de identidade: PR15c entra DEPOIS do PR13.

## 5. Balanço
Réguas: 7 famílias ±5% de winrate; arena.v3 torcida ≤0,2pp da margem; builds/escolas sem dominante. Medir: simulador gera N=2000 jornadas com 4 políticas de comportamento (uniforme, só-poder, só-harmonia, só-benevolência, + alternante) → fichas por `evoluirFicha` → round-robin. Comparar com baseline (plano null). Aceite: réguas mantidas; taxa de troca de família ≤25% por evolução; nenhuma política com winrate > +3pp sobre uniforme (senão comportamento vira meta de min-max).

## 6. Opções
| Opção | O que | Esforço | Prós | Contras |
|---|---|---|---|---|
| A mínima | janela → `ElementPlan` → elemento/skill recalculados; família fixa (seed) | P | reusa `plano` já testado; risco de balanço baixo | ignora PR14; nome do especial muda pouco |
| B recomendada | A + família via PR14 (`proximaFamilia`) + `fichaJornada` gravado + servidor re-deriva | M | entrega a visão inteira; idempotente; anti-reroll | depende do PR14/PR13; 1 campo novo |
| C completa+ | B + pares "de comportamento" fora da cascata, fração variável por estágio | G | mais expressivo | reabre compra de geração (WP4.23); balanço difícil |
Recomendação: **B**, entregue como A primeiro (15a já é a opção mínima se o dono parar ali).
Quebra: **15a** núcleo puro (`planoDoComportamento`, `GALHO_PARA_ELEMENTO`, `evoluirFicha`, `proximaFamilia`, fixtures, simulador) — P/M. **15b** integração+migração (`fichaJornada` no evento de evolução, `buildFichaESkills` lê registro, cache soulmonSkills, migração lazy) — M. **15c** servidor/paridade (save.js imutabilidade + clamp diário, duelStart re-deriva, fixtures cliente=servidor) — M.

Riscos top-3: (1) save forjado/imutabilidade de estágio passado — mitigado por 15c; (2) comportamento vira meta de min-max (uma política domina) — régua +3pp no simulador; (3) dependência de branches não mergeadas (PR14, PR13) — 15a só depende do PR14; ordem PR14 → 15a → PR13 → 15b → 15c.
Classe invisível: nada disso aparece em UI; o jogador só vê skill/nome/elemento novos.

## 7. Critérios de aceite
1. `evoluirFicha` com plano null == `buildFicha` atual (todas as fixtures de `pipeline.test.ts` sem mudança).
2. Mesma entrada 2× = saída deep-equal; recalcular o save não altera estágios gravados.
3. Escalar a janela ×10 (mesmas proporções) = mesma ficha (invariância a volume).
4. Janela < MIN_AMOSTRA = plano null.
5. Plano nunca contém id de par; orçamento total == `budgetForStage`.
6. Degenerar e reevoluir ao mesmo estágio = mesma ficha gravada.
7. Taxa de troca de família no simulador ≤ 25%; réguas §5 verdes.
8. Save legado abre com fichas idênticas às de antes (snapshot).
9. Servidor: `fichaJornada` de estágio passado alterado → 400; derivação servidor == cliente nas fixtures.

## 8. Perguntas ao dono
1. **Peso do comportamento** na ficha? (a) 25% (= renascido, recomendado) (b) 35% (c) 15%.
2. **Janela**: (a) só o estágio que termina (recomendado) (b) acumulado da vida toda (c) média ponderada (recente pesa 2×).
3. **Saves existentes**: (a) só a próxima evolução usa comportamento (recomendado, nada muda hoje) (b) recalcular o estágio atual com a janela já acumulada.
4. **Escopo**: (a) B completa em 3 PRs (recomendado) (b) só A mínima agora, família depois.
