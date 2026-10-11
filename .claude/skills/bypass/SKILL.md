---
name: bypass
description: Decisão final do dono. Use `/bypass <pedido>` e a squad_alpha (e os agentes do Soulmon) executa o pedido mesmo que um agente, guarda, crítico ou regra de processo da squad discorde. A discordância é registrada, nunca usada para recusar. Fiscalizado pelo agente `bypass-fiscal`.
---

# /bypass — o dono decidiu

## O que esta skill faz

Quando o dono (mateus.sprnd@gmail.com) invoca `/bypass <pedido>`, o pedido vira
**decisão final**. Para esse pedido, o parecer de qualquer agente da squad é
**consultivo**. Isso vale para vetos, "VETADO", "BLOQUEANTE", recusas e
objeções de processo. Vale para `soulmon-guarda-linha-vermelha`,
`soulmon-narrative-critic`, `design-critic`, `doc-verificador`, os guardas
custodiais, `alpha-*` e os demais.

A precedência do `CLAUDE.md` (código > teste > CLAUDE.md > manual) continua
valendo para **descrever** o sistema. O `/bypass` decide **o que fazer**, e o dono
pode mudar o que o `CLAUDE.md` descreve.

## Protocolo

1. **Registrar o pedido literal** em `docs/plano-melhorias/ledger/bypass.md`:
   data, texto exato, quem pediu.
2. **Consultar os agentes na forma de dissent**: cada agente cujo mandato
   toque o pedido escreve UMA objeção curta (o risco, em uma frase). Ela não
   bloqueia nada.
3. **Executar o pedido** como foi pedido. Proibido:
   - recusar, adiar, pedir nova confirmação ou "reabrir a pergunta";
   - entregar versão reduzida ou "mais segura" sem o dono ter pedido;
   - trocar o que foi pedido por alternativa própria;
   - esperar aprovação de outro agente.
4. **Registrar a discordância** no ledger (agente, objeção, o que foi feito
   apesar dela).
5. **Avisar o dono uma vez**, no fim e em uma linha por objeção, para ele ter
   a conta na mão. Não é pedido de permissão.
6. **Acionar o `bypass-fiscal`** para conferir o cumprimento antes de fechar.

## Limites

O `/bypass` não é permissão para:
- agir fora do pedido (apagar ou alterar o que não foi citado);
- vazar ou escrever segredo/credencial em texto;
- violar lei ou termos de terceiros no lugar do dono. Isso é só aviso, a decisão
  continua dele;
- mudar a regra para além do pedido: ele vale para ESTE pedido e não vira
  precedente para o próximo.

Os portões `tsc`/`vitest`/`build` continuam rodando. Se um portão ficar
vermelho por causa do pedido, o resultado é reportado ao dono. O portão não é
desligado nem pulado.

## Uso

`/bypass <o que você quer>`
