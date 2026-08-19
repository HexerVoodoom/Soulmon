---
description: Dispara uma rodada de revisão do Soulmon pelo squad de 14 agentes especialistas
argument-hint: [escopo — ex. "completa", "o loop retém?", "pré-lançamento na Play Store"]
---

Conduza uma rodada de revisão do produto Soulmon usando o squad de especialistas.

**Escopo pedido:** $ARGUMENTS
(Se vazio, assuma rodada **completa**.)

## Passos

1. Leia `docs/squad/00-BRIEFING.md`, `docs/squad/01-RUBRICA.md` e
   `docs/squad/02-SQUAD.md`.

2. Delegue a condução ao agente `soulmon-maestro`, passando o escopo acima. Ele deve:
   - declarar por escrito a pergunta da rodada e quais agentes vão rodar;
   - criar `docs/reviews/<AAAA-MM-DD>/`;
   - disparar os agentes em ondas (0 → 1 → 2 → 3), passando a cada um o caminho do
     relatório e os relatórios anteriores que deve ler;
   - consolidar em `docs/reviews/<AAAA-MM-DD>/00-CONSOLIDADO.md`.

3. Ao final, apresente ao usuário: o veredito de uma frase, as convergências fortes,
   os conflitos arbitrados e a onda "Agora" do roadmap. Não cole os relatórios inteiros.

## Regras

- Nenhum agente modifica código. A única escrita permitida é em `docs/reviews/`.
- Uma rodada completa consome bastante tempo e tokens. Se o escopo for temático,
  o Maestro deve rodar só os 3-5 agentes relevantes.
- Não invente resultado de agente que ainda não terminou.
</content>
