---
description: Auditoria de custódia — cada guarda confere seus pacotes do PLANO-MELHORIAS contra o código real e atualiza o ledger
argument-hint: [escopo — "completa", uma área (medicao|nascimento|constancia|vinculo|permanencia|sustento|plataforma), ou um WP (ex. WP2.1)]
---

Rode uma auditoria de custódia do `docs/PLANO-MELHORIAS.md`.

**Escopo pedido:** $ARGUMENTS
(Se vazio, assuma **completa**.)

## Passos

1. Leia `docs/plano-melhorias/LEDGER.md` — o mapa de custódia e o vocabulário de
   estado. **Não invente estado fora do vocabulário.**

2. Determine quais guardas rodar:
   - `completa` → os 6 guardas com WP + o `soulmon-guarda-plataforma` (ledger de
     paridades, não de WP), em paralelo (uma única mensagem com as 7 chamadas), e depois
     o `soulmon-guarda-linha-vermelha` sobre o consolidado.
   - área → só aquele guarda.
   - `WP<n>.<m>` → só o guarda dono (ver o mapa de custódia).

3. Cada guarda deve, para cada WP seu:
   - **rodar o comando de verificação** da tabela do seu ledger;
   - colar a saída real;
   - mover o estado **só** se a saída justificar;
   - registrar a data.

   Passe a cada guarda: o caminho do seu ledger, o `PLANO-MELHORIAS.md` e o seu
   anexo de evidência (`docs/plano-melhorias/<letra>-*.md`).

4. Consolide você mesmo a tabela de estado no fim de `LEDGER.md` (os guardas
   escrevem só nos próprios arquivos — é o que evita escrita concorrente).

5. Apresente ao usuário, em no máximo 15 linhas: quantos WPs em cada estado, **o
   que mudou desde a última auditoria**, os bloqueios por decisão do dono, e a
   contradição mais cara encontrada.

## Regras

- **`VERIFICADO` exige saída de comando colada.** Sem ela, o estado máximo é
  `IMPLEMENTADO`. Ler o diff nunca basta.
- Um guarda **só escreve no próprio ledger**.
- Se um guarda não conseguir rodar um comando (falta segredo, precisa de APK,
  precisa de navegador), ele diz isso e deixa o estado como está — não chuta.
- Não reescreva o `PLANO-MELHORIAS.md` numa auditoria. Se um WP estiver errado,
  registre no ledger e proponha; mudar o plano é ato separado.
- Se a auditoria descobrir que um documento mente sobre o código (número de
  pacotes, contagem de eventos, "o pet olha"), isso é achado de primeira classe —
  reporte junto, é o tipo de apodrecimento que este sistema existe para pegar.
