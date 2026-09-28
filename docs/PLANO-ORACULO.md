# Plano do Oráculo — O QUE ele deve ser (28/09/2026, rodada 2)

Duas rodadas da squad-alpha (Sonnet): arquiteto, discovery, comportamento, product manager, QA, designer de monstrinhos, cético ×2. Relatórios completos em `docs/oraculo-plano/`. Este arquivo é o consolidado; decide **o quê**. O **como** está no §8 (anexo).

## 1. Goal

> **O bicho nasce único e continua sendo só dela: a leitura dá a semente, o comportamento decide o rumo, e ninguém vê a classe.**

Para o universo: o Oráculo é a prova de que a Malha registra **padrões de vida**, não desempenho (`NARRATIVA-E-UNIVERSO.md`).

O Oráculo **não é**: gerador de avatar bonito · RPG com build otimizável · teste psicométrico clínico · motor de raridade/gacha.

## 2. Decisões do dono (28/09/2026) — não reabrir
1. "Melhor instrumento" = melhor para o universo e a narrativa.
2. Classes-ápice são raras por design (só precisam ser alcançáveis).
3. **A classe nunca aparece ao jogador.** Age por trás.
4. Metas numéricas (§5) aceitas.

## 3. Papel de cada recurso

| Recurso | Para que serve | Hoje | Deve virar |
|---|---|---|---|
| **Leitura da pessoa** (6 perguntas + 20 itens + mapa + numerologia) | A **semente**: 4 eixos (elemento/papel/caminho/reino) | ✅ | Só semente. Nada dela vira número visível. |
| **Class-system** (17 elementos, 6 escolas, 79 classes, 65 talentos, 11 profissões, 32 companheiros) | Motor de **ficha invisível** | Alimenta skills reais (`ficha/realSkillPower.ts`); classe salva e não exibida; talento/profissão/companheiro viram 1 linha de bio | Balanceador oculto de masmorra/torneio (dificuldade, drops). Talento → traço de personalidade do pet. Profissão → jeito de agir na masmorra. Companheiro → parceiro **nomeado e visível**. |
| **Bestiário** (194 originais, 23 grupos) | Lore + **linhagem de inspiração por estágio** | Inspiração visual e nome no prompt (D-B1) | Também captura/companheiro e lore da criatura; nunca catálogo de escolha. |
| **Famílias visuais** (72) | Identidade estética **herdável** entre estágios e no rebirth | ✅ | Silhueta reconhecível: é o "é único" lido a olho. |
| **Comportamento** (tarefas, ritmo, cuidado, masmorra) | O **rumo** | Ritmo desempata galho (`carePattern.ts`); perfectDays movem estágio | Tudo visível evolui por ele; o Oráculo só planta. |

**Regra nova: nenhum cálculo novo sem manifestação.** Toda saída do motor tem de virar algo que o jogador vê, ouve ou sente (forma, skill, fala de NPC, parceiro) — ou não se calcula. Foi o padrão de dívida repetido 3× (talento, profissão, companheiro; ficha calculada e morta).

## 4. Criação × evolução
- Leitura fixa a semente (4 eixos, família visual, criatura-inspiração rookie).
- Os 3 caminhos favorecem/dificultam elementos de forma assimétrica sustentada (±15–20%, nunca travam) — já implementado (`ALIGNMENT_ELEMENT_AFFINITY`).
- Linhagem: continuidade é o normal (~86% dos pares), travessia de família não é rara (~50% cruzam ao menos 1×) — já medido.
- **Rebirth carrega um traço herdado** do ciclo anterior (família visual ou elemento), em vez de reset puro. (Proposta — depende do dono.)

## 5. Balanceamento: o que é proporcional e o que é desigual de propósito

| Proporcional (nenhum vencedor estrutural) | Desigual por design |
|---|---|
| Os 4 eixos de criação · escola dominante · grupos do bestiário · famílias visuais · companheiros | Classes-ápice (Arauto do Fim, Demiurgo, Senhor do Clima…) raras como lendários |

**Como comunicar raridade sem ranking nem cobrança:** pela reação do mundo (NPC comenta) e pela forma/pose, nunca por número, selo, % ou "faltam N" (linha vermelha contra métrica de posse).

## 6. Critérios — métrica-norte e resultados-chave

**Métrica-norte anterior** (tupla visível única, 97,4%) mede unicidade **na largada** e está saturada. **Parar de investir nela.**

**Novo gargalo:** a *trajetória*. Dois perfis parecidos na largada, com comportamento oposto (Constante × Explosivo, cuidado × abandono), têm de terminar em criaturas diferentes. Hoje não existe métrica disso.

| # | Resultado-chave | Medível por simulação hoje? |
|---|---|---|
| KR1 | Unicidade na largada ≥97% (manter, não investir mais) | ✅ (C8) |
| KR2 | **Divergência comportamental**: perfis próximos + trajetórias opostas → resultados finais diferentes (forma, skills, companheiro) | ✅ novo **C9** — entra na Fase 0/1 |
| KR3 | Raridade das classes-ápice percebida sem nome/número | ❌ só com usuário |
| KR4 | Fidelidade percebida ("é eu") — Barnum × especificidade | ❌ só com usuário (teste cego já planejado) |
| KR5 | Rebirth mantém identidade (traço herdado) | parcial |

Critérios C1–C8 (cobertura, sem vencedor estrutural nos 4 eixos ≤1,5×, escola ≤2×, grupos ≤4×/famílias topo ≤4%, fidelidade direcional ≥80%, caminho×elemento, linhagem 80–90%/30–65%, unicidade ≥97%/colisão de nome ≤2%) permanecem como estão (decisão 4). **Achado do crítico:** a régua bloqueante atual não mede nem papel nem reino — C2 ainda está aberto para os dois.

## 7. Riscos de produto
1. Unicidade estrutural ≠ percebida — só pessoas reais fecham; até lá, simulação é proxy.
2. Classe vazar numa tela nova — régua automática em CI (Fase 3).
3. Cálculo morto (talento/profissão/companheiro) — regra "sem manifestação, não se calcula".
4. Bio genérica (Barnum) — teste cego pendente.
5. Vocabulário negativo da numerologia ("dívida cármica") vazar — checagem de compliance obrigatória antes de qualquer exposição.

## 8. Anexo — o COMO (fases; detalhes em `docs/oraculo-plano/`)

**Fase 0 — régua única.** Régua em 2 lugares: `criacaoDistribuicao.test.ts` pequeno e bloqueante (C2/C4/C6/C7 + papel + reino); `scripts/oraculo-auditoria.mjs` grande (N≥800, C1/C8/C9), fora do vitest, grava JSON/MD em `docs/reviews/`. Seed de auditoria ≠ seed de calibração. Corrigir tabela velha de `docs/ORACULO.md` (reino 0,5–22,5% → 1,16× medido). Cobrir `timeUnknown` e "só 6 perguntas" na população sintética. Escopo fechado: sem loop de instrumentação.

**Fase 1 — dívidas do motor.** Papel/reino se fora de C2; C9; ponte 8→17 testada pela **saída** (17 alcançáveis); 2 classes e 6 criaturas nunca sorteadas: cada uma decidida "ápice raro" ou "conserto", registrada.

**Fase 2 — arquitetura** (6 PRs, `rodada2-fase2.md`): extrair `oracle/familias.ts` por import dinâmico (chunk de entrada −15 KB, provado por guard de bundle); `oracle/vocabulario.ts` (medir antes — pode não valer); tipar ponte 8↔17; `promptClassFlavor` sync×async por tipo. ⚠️ **Crítico:** `OraclePage.tsx` tem 6 chamadas de produção a `generateOracle` e ficou fora da lista de migração — cortar o alias síncrono antes de migrá-lo quebra a tela. Ordem: 1 → 1.5 (App, Onboarding **e OraclePage**) → 2 → 4 → 3 → 5 → 6.

**Fase 3 — manifestação e jogador.** Régua "classe/pontuação nunca renderizada"; traduzir numerologia negativa (compliance); companheiro nomeado e visível; talento→traço, profissão→masmorra; teste cego de Barnum (planejar; executar com usuários).

## 9. Decisões novas — DECIDIDAS pelo dono (28/09/2026, todas pela recomendação)
1. Rebirth **herda um traço** do ciclo anterior (família visual ou elemento); nunca reset puro. ✅
2. Companheiro vira **parceiro visível e nomeado** (Home/masmorra). ✅
3. Class-system é **balanceador oculto** de masmorra/torneio (dificuldade, drops). ✅
4. Raridade comunicada só por NPC/forma; **nunca** selo, porcentagem ou "faltam N". ✅
