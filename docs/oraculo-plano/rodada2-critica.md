# Crítica adversarial — rodada 2 (roadmap / régua / fase2)

## Verificações de código feitas

1. **`OraclePage` é `lazy()` em `App.tsx:642`, consumida em `App.tsx:6219`.** VERIFICADO.
2. **`ELEMENT_INFO`/`ROLE_INFO`/`REALM_INFO` só lidos fora de `oracle.ts` em `OraclePage.tsx`.** VERIFICADO (`CLASS_MATRIX`/`CREATURE_FAMILIES`/`MOTIVO_ELEMENTO_CLASSE` não aparecem fora de `oracle.ts`/testes).
3. **"~20 call sites de teste + 2 reais (`SoulmonOnboarding.tsx`, `App.tsx`)".** PARCIALMENTE FALSO — grep de `generateOracle(` fora de testes acha chamadas em **4 arquivos de produção**: `App.tsx` (2x), `SoulmonOnboarding.tsx` (2x), `GameStateContext.tsx` (1x, comentário) e **`OraclePage.tsx` (6x, chamadas reais, não comentário)**. O roadmap/fase2 tratam `OraclePage.tsx` como se suas chamadas fossem cobertas pelo lazy-load e por isso irrelevantes — mas o PR 2 da fase2.md diz explicitamente "Nenhum arquivo de produção muda (já migraram no PR 1.5)" e remove o alias síncrono `generateOracle`. **`OraclePage.tsx` não migra no PR 1.5** (só `SoulmonOnboarding.tsx`/`App.tsx` são citados) e chama `generateOracle` síncrono 6 vezes — com o alias removido no PR 2, isso é erro de compilação/quebra de produção, não just teste.
4. **DIVIDA_ATUAL `'index.js': 667_718`** confere exatamente (`orcamentoDeBytes.contract.test.ts:60`, comentário linha 56 "652_255 → 667_718 (+15,1 KB)"). VERIFICADO.
5. **`timeUnknown` sempre `false` nos sintéticos.** VERIFICADO — único hit no arquivo é `timeUnknown: false` fixo (linha 55).
6. **`_diag.test.ts`, citado como fonte-base pelos três docs (seeds `20260928`/`19870412`, protótipo de auditoria) NÃO EXISTE no repo** — busca por `*diag*` fora de `node_modules` não encontra nenhum arquivo desse nome em `src/`. NÃO VERIFICADO / possivelmente fabricado ou já apagado sem nota. Isso mina o §3 e §9 inteiros da régua (seed de calibração vazando, JSON de exemplo) — sem o arquivo, a citação de linha/comportamento é inventada ou desatualizada.
7. **Teste bloqueante hoje NÃO mede `dominantRole` nem `dominantRealm`** — grep em `criacaoDistribuicao.test.ts` por esses dois termos: zero resultado. Confirma a suspeita que a própria régua levanta ("CONFERIR se reino já está no bloqueante") — reino também está fora, não só papel.

## Objeções fatais

- **FATAL (viabilidade).** Fase2 PR 1.5→PR 2: ao cortar o alias `generateOracle` síncrono, `OraclePage.tsx` (produção, `lazy()` mas ainda produção) quebra — 6 call sites não migrados, e o próprio PR 2 afirma "nenhum arquivo de produção muda". Cenário de falha: PR 2 mergeia, `npx tsc --noEmit` fica vermelho (ou pior, se `OraclePage.tsx` não for coberto por tsc estrito no caminho lazy, quebra em runtime só quando alguém abrir `/oracle`). Fixável: listar `OraclePage.tsx` explicitamente no PR 1.5/PR 2 e ajustar o texto "2 call sites reais".

- **FATAL (evidência/premissa).** A fonte primária da régua (`_diag.test.ts`) não existe no repo hoje. Toda a seção de seeds de calibração×validação e o "protótipo já roda 2 seeds, mas está errado" é uma afirmação sobre um arquivo fantasma — ou foi apagado sem registro, ou nunca existiu com esse nome/local. Antes de abrir qualquer story de Fase 0, confirmar onde esse código realmente está (ou se é para ser escrito do zero, o que muda drasticamente o escopo/tamanho de 0.1).

## Objeções fixáveis

- Roadmap Fase 2 (2.1→2.6) não cita explicitamente onde `OraclePage.tsx` entra na migração — depende da correção acima.
- "~20 call sites" é estimativa não conferida por grep publicado nos docs; medi 72 ocorrências textuais de `generateOracle(` no repo (inclui comentários/testes/strings) — o número real de call sites vivos de teste é plausível perto de 20, mas ninguém colou o grep. Baixo risco, mas os docs deveriam citar o comando usado, não só o número.
- Contradição régua × roadmap: régua diz script de auditoria roda "fora do vitest" e nunca bloqueia; roadmap 0.1 aceita ambíguo ("script OU teste lento") — a régua já decidiu (ambos, com papéis diferentes), mas o roadmap não foi atualizado para refletir essa decisão como fechada; ainda lista como pendência "escolher UM dos dois formatos". Fixável — só sincronizar os dois docs.
- Fase 2, ordem 1→1.5→2→4→3→5→6: nenhum PR isolado deixa o app quebrado *em produção* se seguido como descrito, EXCETO o problema do `OraclePage.tsx` acima — sem esse fix, o app fica quebrado entre PR 1.5 e PR 2 especificamente na tela `/oracle`.
