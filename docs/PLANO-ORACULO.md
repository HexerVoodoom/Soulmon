# Plano do Oráculo — estratégia e goal (28/09/2026)

Fontes: `plano-arquitetura.md`, `plano-goal.md`, `plano-comportamento.md` (squad-alpha, Sonnet) + crítica do `alpha-skeptic` (abaixo, §7). Só planejamento; nada executado.

## 1. Goal

**O bicho é a pessoa, e é só dela.** Toda criação sai dos dados do jogador, usa a base inteira (class-system + bestiário), nenhuma opção tem vantagem estrutural, e a evolução reage ao que a pessoa FAZ, nunca só à leitura inicial.

**Métrica-norte (mensurável hoje, sem usuários):** Índice de Unicidade Percebível (IUP) = % de perfis sintéticos cuja tupla VISÍVEL (nome + família visual + elemento + classe + criatura-inspiração) é única, com fidelidade (respostas opostas → resultados opostos). Hoje: tupla 97,4% única.

**Critérios de pronto (todos por simulação, régua em `criacaoDistribuicao.test.ts`, seed fora da calibração):**

| # | Critério | Alvo | Hoje (28/09, N=800) |
|---|---|---|---|
| C1 | Cobertura: 17 elementos, 79 classes, 65 talentos, 11 profissões, 32 companheiros, 194 criaturas, 72 famílias | 100% alcançável (≥1 em N=3.200) | 77/79 classes, 188/194 criaturas |
| C2 | Sem vencedor estrutural nos 4 eixos | razão topo/piso ≤1,5× | elemento 1,23× · caminho 1,19× · reino 1,16× · **papel: não remedido** |
| C3 | Escola dominante | ≤2× | 1,81× |
| C4 | Grupos do bestiário / famílias visuais | ≤4× / topo ≤4% | 4,3× / 3,5% |
| C5 | Fidelidade direcional (respostas opostas → eixos opostos) | ≥80% | a medir |
| C6 | Caminho × elemento: 1/3 favorecido, 1/3 neutro, 1/3 dificultado, ±15–20% | assimetria sustentada | régua existe (`alinhamentoElemento.test.ts`) |
| C7 | Linhagem: continuidade × travessia | 80–90% dos pares continuam; 30–65% cruzam família | 86% / 51% |
| C8 | Unicidade (IUP) + colisão de nome | ≥97% / ≤2% | 97,4% / a remedir |

## 2. Estratégia — 4 fases, cada uma fecha com medição + commit/merge (salva progresso)

**Fase 0 — Régua única (antes de mexer em mais nada).**
- Transformar o `_diag.test.ts` temporário num relatório permanente (`scripts/oraculo-auditoria` ou teste marcado lento) que imprime C1–C8.
- Remedir o papel e remedir a tabela de `docs/ORACULO.md` §"Equilíbrio medido", que está velha (reino 0,5–22,5% era antes da PR #135). É a objeção fatal do crítico: nenhuma prioridade é decidida sobre número velho.
- Resolver a contradição "medir primeiro": a simulação é barata e vem antes; estudo com pessoas só depois de haver usuários.

**Fase 1 — Fechar as dívidas medidas (motor).**
- Papel, se estiver fora de C2.
- As 2 classes que nunca aparecem e as 6 criaturas que nunca são sorteadas: decidir por classe se ela é ápice raro por design (aceito, e fica documentado) ou inalcançável (conserto).
- Cobertura de SAÍDA da ponte 8→17 (objeção do crítico): testar que os 17 são alcançáveis, e não só que cada um dos 8 gera algum.

**Fase 2 — Arquitetura (plano do arquiteto, 6 fases pequenas, reversíveis).**
- Extrair `oracle/vocabulario.ts` e `oracle/familias.ts` do `oracle.ts` (3.800 linhas).
- Carregar as famílias só na tela de criação: paga os +15 KB do chunk de entrada e fica travado por teste de bundle.
- Ponte 8↔17 como tipo testado.
- `generateOracle` síncrono × dado assíncrono (`promptClassFlavor`): hoje é costura só por convenção, e deve virar contrato por tipo.
- O bestiário deixa de apontar para uma branch do repo irmão: o pool de originais já não depende dele.

**Fase 3 — Jogador (plano de comportamento).**
- Nunca expor pontuação; o jogador vê nome, bio e a linha de essência (já é assim).
- Traduzir o vocabulário numerológico negativo ("dívida cármica") antes de qualquer exposição, com checagem de `alpha-compliance`.
- A classe calculada fica persistida e **nunca é renderizada** (decisão 3); régua: nenhuma tela exibe o nome da classe.
- A evolução continua sendo função do comportamento real (esforço, ritmo), com a leitura só como tempero.
- Teste cego de Barnum × especificidade (bio trocada entre perfis): planejado agora, executado quando houver pessoas.

## 3. Ordem e custo estimado de sessão
Fase 0 (1 sessão curta) → Fase 1 (1–2) → Fase 2 (2–3, cada extração é um PR) → Fase 3 (1 + estudo futuro). Cada fase: loops com commit ao fim de cada um; parar em 95% do orçamento de tokens.

## 4. Decisões do dono — DECIDIDAS em 28/09/2026
1. "Melhor instrumento" = melhor para o UNIVERSO e a narrativa, não validade psicométrica clínica. ✅
2. Classes-ápice (Arauto do Fim, Demiurgo, Senhor do Clima…) são RARAS POR DESIGN, como lendários — C1 exige só que sejam alcançáveis. ✅
3. **A classe NUNCA aparece para o jogador diretamente.** Ela atua por trás (sprite, bio, ficha); a Fase 3 não renderiza a classe — remove esse item e garante que nenhuma tela a exponha. ✅
4. Metas numéricas da tabela §1 aceitas como estão. ✅

## 5. Riscos
- Toda subdivisão nova (famílias, grupos) reabre proporcionalidade: é obrigatório rodar C1–C8 depois (histórico: toda expansão já abriu buraco).
- Unicidade estrutural ≠ unicidade percebida. Só pessoas reais fecham isso; até lá o IUP é proxy.

## 6. Objeções do crítico e como o plano responde
- FATAL: número de reino velho → Fase 0 remede e corrige o `ORACULO.md`. Hoje o reino dominante está em 1,16× (mesma métrica).
- Ponte 8→17 testada do lado errado → Fase 1 testa cobertura de saída.
- Loop de instrumentação sem fim → Fase 0 tem escopo fechado (C1–C8); o que não cabe fica para quando houver usuários.
- Contradição comportamento × goal sobre o que medir primeiro → simulação primeiro, painel depois; o motor não espera o painel.

## 7. Crítica completa (alpha-skeptic)
Número de reino "0,5–22,5%" no plano-goal vem de `docs/ORACULO.md` (tabela sem data) e contradiz a medição atual (10,6–12,4%). Arquitetura: não cita o tamanho atual do pool (194/23); a ponte 8→17 testaria cobertura de chegada, não de saída. Goal: não decide quando parar de medir. Comportamento: prevê magnitude de efeito só por literatura (rotulado corretamente como previsão); o sequenciamento "Barnum antes de recalibrar" apoia-se em hipótese. Pergunta-chave: remedir com a mesma metodologia antes de priorizar.
