# Método SQUAD-DOCS — como se escreve documentação que não apodrece

Este é o método que **todo** agente da squad de documentação segue, e que qualquer sessão
que toque em `docs/manual/` deve seguir mesmo sem a squad. Ele nasceu de uma medição, não
de preferência: em 09/09/2026 o `CLAUDE.md` carregava **cinco** referências `arquivo:linha`
apodrecidas, **quatro** contagens erradas (o `App.tsx` "de 1500 linhas" tinha 6212) e um
número de cache (`CACHE_VERSION`) que, lido e obedecido, andaria o cache para TRÁS. Doc que
mente é pior que doc que falta — quem lê acredita.

## As dez regras (R1–R10)

| # | Regra | Por quê / como se verifica |
|---|---|---|
| **R1** | Referência de código é **`caminho` + SÍMBOLO**, nunca `arquivo:linha`. | Linha escorrega no primeiro commit; um `grep` pelo símbolo reencontra o alvo. O `doc-verificador` reprova qualquer `:\d+` colado a um caminho de código. |
| **R2** | Toda REGRA DE NEGÓCIO tem três âncoras: **dono** (o símbolo que decide), **régua** (o teste que trava) e **decisão** (a linha do `REGISTRO-DE-DECISOES.md` ou do `STATUS.md`). Sem régua, escreve-se `régua: nenhuma` — explícito, nunca omitido. | É o que permite a uma sessão nova ir da regra ao código e ao motivo em um salto. |
| **R3** | **Número vem com nome.** Valor copiado do código cita a CONSTANTE (`REST_SHIELD_MAX`, não "3"); contagem cita o COMANDO que mediu (`wc -l`, `grep -c`), com data. Nunca "cerca de", nunca "~". | Constante renomeia sem quebrar o doc; contagem sem comando é opinião. |
| **R4** | **Nada morto sem lápide.** Regra que não existe mais só entra com a marca (`⚰️`, "não existe mais", "era …") na mesma linha; doc inteiro de registro leva `<!-- doc-historico -->` no cabeçalho. | Guard `src/docsSemMentira.contract.test.ts`. |
| **R5** | **Um dono por documento**, declarado no cabeçalho, e **um assunto por documento**. Duas fontes para o mesmo fato é o footgun 9 aplicado a prosa. Onde outro doc já é dono, **aponte**, não copie. | O `00-MAPA.md` é o único que lista todos; ninguém mais mantém índice paralelo. |
| **R6** | **Cabeçalho obrigatório** em todo doc do manual: dono · data (dd/mm/aaaa) · como verificar (o comando ou o teste) · o que NÃO cobre · precedência (código > teste > `CLAUDE.md` > este doc). | Sem "o que não cobre", o leitor assume completude que não existe. |
| **R7** | **Datas absolutas** (dd/mm/aaaa). Proibido "hoje", "recentemente", "atual", "nova", "antiga" sem data ao lado. | "Atual" é a palavra que envelhece primeiro. |
| **R8** | **Todo doc é alcançável a partir de `docs/manual/00-MAPA.md`** em um salto, e todo link relativo resolve. | Guard `src/docsManual.contract.test.ts`. |
| **R9** | **Cobertura de referência é executável**: todo módulo não-teste das árvores listadas em `scripts/docs-inventario.mjs` (`ARVORES`) tem entrada em `docs/manual/06-REFERENCIA/`. Módulo novo sem entrada = teste vermelho. | Mesmo guard. É o que impede a referência de virar foto de setembro/2026. |
| **R10** | **Nada é VERIFICADO por quem escreveu.** O `doc-verificador` confere símbolo por símbolo (`grep`), caminho por caminho (`ls`), número por número (roda o comando), e só então carimba `verificado em dd/mm/aaaa por doc-verificador` no cabeçalho. Sem carimbo, o doc é rascunho. | Autor lê o que quis escrever; verificador lê o que está escrito. |

## Ciclo (abrir → medir → redigir → verificar → indexar → travar)

1. **Medir** (passo do orquestrador; ex-`doc-cartografo`, absorvido em 21/09/2026):
   `node scripts/docs-inventario.mjs > <scratch>/inventario.md`, data + SHA no topo; toda
   contagem afirmada por um doc é reconferida pelo comando declarado ao lado dela (R3).
   O inventário é a ÚNICA lista de módulos que os redatores recebem — ninguém lista de
   memória.
2. **Redigir** (`doc-redator-*`, `doc-historiador`): cada redator escreve **um** doc, do
   inventário e do código, com as âncoras da R2 e o cabeçalho da R6. O redator lê o código
   de verdade (`Read`), não o `CLAUDE.md` — o `CLAUDE.md` é a segunda fonte, e onde ele
   discordar do código, o código ganha e o achado vai para o `STATUS.md`.
3. **Verificar** (`doc-verificador`, bloqueante): adversarial, doc por doc. Devolve uma
   lista `caminho — afirmação — evidência — veredito`. Corrige o que é trivial (símbolo
   renomeado, caminho errado) e **devolve** ao redator o que muda sentido.
4. **Indexar** (`doc-bibliotecario`): atualiza o `00-MAPA.md` — índice por assunto, por
   pergunta ("quero mudar X → leia Y, dono Z, régua W") e por superfície (arquivo → doc).
5. **Travar**: `npx vitest run src/docsManual.contract.test.ts src/docsSemMentira.contract.test.ts`
   verde, e só então commit.

## O que conta como evidência

| Afirmação | Evidência aceita |
|---|---|
| "a função X faz Y" | o corpo de X lido; se há JSDoc, ele é citado, mas o corpo manda |
| "a regra é N" | a constante com nome + o teste que a usa |
| "a tela A leva à B" | o handler/`setPage`/`setState` que faz a transição, com o símbolo |
| "existem N módulos/telas/campos" | o comando que contou, colado, com data |
| "foi decidido que" | a seção do `REGISTRO-DE-DECISOES.md` ou o bloco datado do `STATUS.md` |
| "mudou na versão V" | o hash/tag do git (`git log --format=%h -S<símbolo>`) |

Não é evidência: "o CLAUDE.md diz", "pelo nome do arquivo", "provavelmente", memória de
sessão anterior.

## Vocabulário de estado do cabeçalho

`rascunho` → `verificado em dd/mm/aaaa por doc-verificador` → `desatualizado desde <commit>`
(quando um guard ou uma sessão descobre divergência e não pode consertar na hora — nunca se
apaga o carimbo em silêncio; troca-se pela marca de desatualização com o motivo).
