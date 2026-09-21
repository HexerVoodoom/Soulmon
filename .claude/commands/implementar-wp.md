---
description: Implementa um pacote do PLANO-MELHORIAS com o guarda dono verificando o aceite antes do commit
argument-hint: <WP — ex. WP2.3> [observação opcional]
---

Implemente um pacote de trabalho do `docs/PLANO-MELHORIAS.md`.

**Pacote:** $ARGUMENTS

## Passos

1. Leia a spec do WP no `docs/PLANO-MELHORIAS.md` e a linha dele no ledger do
   guarda dono (`docs/plano-melhorias/LEDGER.md` tem o mapa).

2. **Antes de escrever código, cheque o bloqueio.** Se o estado for
   `BLOQUEADO:<D#>`, pare e diga ao usuário qual decisão falta (seção 10 do
   plano). Não implemente por cima de uma decisão do dono não tomada.

3. Se o WP **muda regra de jogo, tira algo do usuário, cobra dinheiro ou toca
   dado pessoal**, chame primeiro o `soulmon-guarda-linha-vermelha` para
   parecer. Ressalva vira critério de aceite.

4. Implemente seguindo a spec. Respeite o que o `CLAUDE.md` manda:
   - texto de UI sempre **PT-BR + EN**;
   - regra nova vai no **dono único**, nunca em updater inline nem duplicada;
   - CSS novo só em `src/index.css`;
   - ao mudar regra: `GuideModal.tsx` + `HelpModal.tsx` + testes de
     `useDailyReset.test.ts`.

5. Rode o gate: `npx tsc --noEmit`, `npx tsc -p tsconfig.server.json --noEmit`
   (`functions/` e `workers/` — dinheiro, conta, save; já voltou vermelho no CI
   por ficar de fora daqui), `npx tsc -p desktop/tsconfig.json --noEmit`,
   `npx vitest run`. Se o WP mexe em UI, screenshot via Playwright.

6. **Chame o guarda dono para verificar o aceite** — ele roda o comando da
   tabela, cola a saída e move o estado no ledger dele. É ele quem decide se
   virou `VERIFICADO`; você não carimba por ele.

7. Commit em PT-BR (`tipo(escopo): resumo`), citando o WP. Merge ff-only em
   `main` conforme a regra de autonomia do `CLAUDE.md`.

## Regras

- **Um WP por vez.** Se a spec sugerir tocar outro pacote, pare e diga.
- Se durante a implementação você descobrir que a spec está errada (o código não
  é o que o plano diz), **pare e corrija o plano primeiro** — implementar por
  cima de uma spec falsa é como o "instrumentar do zero" nasceu.
- Nenhum WP pode ser marcado `VERIFICADO` no mesmo passo em que foi escrito sem
  o comando ter rodado de verdade.
