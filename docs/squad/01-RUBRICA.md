# Rubrica de Avaliação e Template de Relatório — Squad Soulmon

Todos os agentes usam esta rubrica e este template. Isso é o que torna 14 análises
comparáveis e sintetizáveis pelo Maestro.

---

## Parte A — Rubrica compartilhada

Cada agente pontua **apenas as dimensões do seu domínio** (indicadas no arquivo do
agente). Escala de 0 a 5:

| Nota | Significado |
|---|---|
| 0 | Ausente. Não existe no produto. |
| 1 | Existe mas prejudica — pior que não ter. |
| 2 | Rascunho. Reconhecível, mas não funcional para o usuário. |
| 3 | Aceitável. Faz o básico; não é motivo para usar nem para abandonar. |
| 4 | Bom. Competitivo com as melhores referências do mercado. |
| 5 | Diferencial. É motivo, sozinho, para escolher o Soulmon. |

### Dimensões

| # | Dimensão | Pergunta central | Dono principal |
|---|---|---|---|
| D1 | Clareza de proposta | Em 10s o usuário entende o que é e por quê? | PM, Designer |
| D2 | Time-to-value | Quanto tempo até o primeiro momento "isso é meu"? | Designer, User Research |
| D3 | Eficácia do núcleo (tarefas) | O app efetivamente faz a pessoa executar tarefas? | Produtividade, Psicologia |
| D4 | Força do vínculo alma↔criatura | A criatura parece *ser* o usuário? | Monster Taming, Psicologia |
| D5 | Qualidade do core loop | O loop diário é claro, justo e satisfatório? | Game Design, Gamificação |
| D6 | Sistema de progressão | A evolução é legível, desejável e bem ritmada? | Monster Taming, Game Design |
| D7 | Economia e recompensas | Moedas, drops e loja são equilibrados e significativos? | Game Design, Monetização |
| D8 | Motivação (intrínseca vs extrínseca) | Sustenta hábito ou só reforça pontos? | Psicologia, Gamificação |
| D9 | Retenção projetada | O produto tem o que é preciso para D1/D7/D30? | Retenção, PM |
| D10 | Diferenciação competitiva | Existe algo que só o Soulmon faz? | Todos, consolidado pelo PM |
| D11 | Monetizabilidade | Há caminho de receita compatível com a promessa? | Monetização, Growth |
| D12 | Risco (PI, plataforma, privacidade) | Isso pode ser publicado e vendido? | IP & Marca |
| D13 | Viabilidade técnica | Recomendações cabem na stack/custo/equipe? | Tech Feasibility |
| D14 | Acessibilidade e ética | Inclusivo, sem dark patterns, sem dano? | Designer, Psicologia |

---

## Parte B — Template obrigatório de relatório

Copie a estrutura abaixo. Não adicione seções decorativas. Não remova seções — escreva
"nada relevante no meu escopo" se for o caso.

```markdown
# [Nome do Agente] — Revisão Soulmon
**Data:** AAAA-MM-DD · **Escopo:** <seu domínio em uma linha>
**Evidência analisada:** <arquivos lidos + nº de fontes externas consultadas>

## 1. Veredito em uma frase
<Uma frase. A coisa mais importante que o dono do produto precisa ouvir de você.>

## 2. Notas da rubrica
| Dimensão | Nota | Justificativa em uma linha |
|---|---|---|
| Dx — nome | 0-5 | ... |

## 3. Pontos fortes
Máximo 5. Cada um com evidência (`arquivo:linha` ou doc) e por que importa
competitivamente. Força que qualquer concorrente também tem não é ponto forte —
é paridade; classifique como tal.

## 4. Pontos fracos
Máximo 7, ordenados por gravidade. Formato:
- **[Gravidade: Bloqueante / Grave / Moderado]** Problema.
  - *Evidência:* ...
  - *Consequência para o usuário/negócio:* ...

## 5. Benchmark de mercado
Tabela comparando o Soulmon com 3-6 referências reais do SEU domínio.
| Produto | Como resolve | Soulmon hoje | Lacuna |
|---|---|---|---|
Cada linha com link e data de acesso. Ao final, 2-3 parágrafos:
o que copiar, o que deliberadamente NÃO copiar e por quê.

## 6. Oportunidades e recomendações
Tabela priorizada. Nada de "melhorar X" — descreva a mudança concreta.
| # | Recomendação | Problema que resolve | Impacto (1-5) | Esforço (1-5) | Confiança (1-5) | Horizonte |
|---|---|---|---|---|---|---|
Horizonte: `Agora` (antes de lançar) / `Próximo` (3-6 meses) / `Depois` (visão).
Detalhe as 3 melhores em um parágrafo cada, com critério de sucesso mensurável.

## 7. O que falta para ser um produto de sucesso (do meu ângulo)
3-5 bullets. Sem hedging. Se falta algo que ninguém do squad cobre, diga aqui.

## 8. Discordâncias e riscos da minha própria análise
- Onde eu discordo da tese do produto ou de outro domínio, e por quê.
- Onde minha análise é fraca (dado que não achei, suposição que fiz).

## 9. Perguntas abertas para o dono do produto
Máximo 5. Só perguntas cuja resposta muda a recomendação.

## 10. Fontes
Lista numerada com URL e data de acesso.
```

---

## Parte C — Como o Maestro consolida

O Maestro produz `docs/reviews/<data>/00-CONSOLIDADO.md` com:

1. **Veredito único** — o Soulmon está pronto para quê, hoje.
2. **Matriz de rubrica** — as 14 dimensões com a nota de consenso e o desvio entre
   agentes (divergência alta = área que precisa de decisão humana).
3. **Top 10 problemas** consolidados, deduplicados, com dono de domínio.
4. **Convergências fortes** — o que 3+ agentes independentes apontaram. É o sinal mais
   confiável do relatório inteiro.
5. **Conflitos explícitos** — onde os especialistas discordam, com a arbitragem do
   Maestro e a lógica usada.
6. **Roadmap priorizado em 3 ondas** (Agora / Próximo / Depois), com esforço estimado.
7. **Os 5 experimentos** que mais reduzem incerteza pelo menor custo.
8. **Decisões que só o dono pode tomar** — a lista curta que trava tudo.
</content>
