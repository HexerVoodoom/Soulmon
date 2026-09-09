# Som do Soulmon — o mínimo para não errar

> **O que é:** o mínimo que um agente precisa saber para não quebrar o som do Soulmon.
> O runbook completo vive em `squad-alpha-runs/som-01/maintainer/runbook-som.md` — e essa
> pasta está no **`.gitignore`**, ou seja, **não vai para o git**. Por isso este arquivo
> existe: é a parte que precisa sobreviver. Se você precisar de detalhe que não está aqui,
> ele está lá, na máquina de quem rodou o run.
> **Origem:** run `som-01` (Fases 0 e 1, 08–09/09/2026). As decisões canônicas são **S1..S10**
> em `docs/REGISTRO-DE-DECISOES.md` §6.1 — este documento não decide nada, só orienta.
> Nenhum usuário jamais usou o app (`docs/STATUS.md`): tudo sobre "o usuário" é `[hipótese]`.

## 1. Onde o som mora

| O quê | Arquivo |
|---|---|
| Os sons (síntese procedural, um `play*` por evento) | `src/utils/sounds.ts` |
| **A política de loudness** (categorias, alvos, teto, degrau, offsets) — **dono único** | `src/utils/loudness.ts` |
| Barramento e despacho | `src/utils/audioBus.ts` |
| Guards que leem o fonte (AC-4 cobertura, AC-5 plausibilidade, escada) | `src/utils/loudness.contract.test.ts` |
| Guards de call-site (quem chama `play*`, quando, sob `prefers-reduced-motion`) | `src/utils/sounds.contract.test.ts`, `src/components/sintonia-chiado.render.test.tsx` |

**Nunca copie um alvo, um teto ou um degrau para outro arquivo.** A política tem dono único, e
há um teste (`footgun 9`) que reprova a cópia.

## 2. As seis regras que não se negociam

1. **D11 — som só por gesto do usuário.** Nunca agendado pelo app, nunca com `document.hidden`.
   *Porque* "som que sai sozinho não é presença, é alarme": o perfil `[hipótese]` "usuário em
   público" é punido por qualquer som não solicitado, e o app tem de funcionar **100% mudo** —
   som nunca é o único canal de nada. A fronteira da D11 é o **pacote inteiro**: ela mora no
   chamador tanto quanto em `sounds.ts`.
2. **S2 — a trilha nasce desligada** e só começa por gesto. *Porque* autoplay viola a D11 por
   extensão: música contínua não é presença nem confirmação de ação.
3. **S3 — ≤ −16 LUFS integrado e true peak ≤ −1 dBTP** (ITU-R BS.1770 / EBU R 128). *Porque* é o
   único alvo com norma citada; a alternativa em dBFS mistura régua de pico com régua de
   loudness (as duas estão a **3,017 dB medidos** uma da outra).
4. **S9 — atribuição obrigatória**, escrita no **mesmo passo** em que o arquivo nasce (origem,
   modelo, prompt, data, termos em `docs/Attributions.md` + hash casado com o manifesto nas duas
   direções). *Porque* o guard prova **procedência, nunca originalidade** — não existe `grep` por
   melodia; o único controle de originalidade é a escuta humana do dono (S8).
5. **R-EX — um gesto, uma fonte.** Dois `play*` a ≤ 120 ms são o mesmo gesto: toca a de classe
   mais alta; empate → a menos repetida; empate → a do gesto (não a da consequência); empate → a
   primeira despachada. A perdedora é **descartada, nunca enfileirada**. *Porque* o limitador
   **não** resolve colisão — medido, ele fez **0,00 dB** sobre uma soma de **+4,58 dB**; e
   enfileirar transformaria um gesto em dois sons.
6. **R-CAT — categoria vem do EVENTO, nunca do nível medido do arquivo.** Uma categoria pode ter
   um único membro se, e só se, o perfil de repetição do membro não coincidir com o de nenhuma
   outra. *Porque* categoria criada para caber na medição de um arquivo é decoração: foi assim
   que `playVisorTune` ficou **dois degraus errado** sem nada ficar vermelho.

## 3. A escada de loudness (o critério é REPETIÇÃO, não importância)

| Categoria | Alvo (LUFS-M em P-B) |
|---|---|
| Marco · Presença · Degeneração (voluntária) | **−16,0** |
| Sintonia · Cuidado | **−19,0** |
| Conclusão · Transação | **−22,0** |
| Arcade | **−25,0** |
| Trilha (E1–E5) | **−28,0 LUFS-S**, e ≤ −16 LUFS integrado |

Tolerância **±1,0 LU**; degrau **3,0 dB**, sem meio-degrau; teto **≤ −1 dBTP** em tudo.
**Quem repete mais entra mais baixo.** Nível ≠ importância: se algo "deve soar como perda ou como
conquista", isso é timbre/envelope/duração, não nível.

## 4. Mudar ou acrescentar um som

- **Mudar o ganho:** provavelmente errado. O nível é derivado da categoria. Se o som está longe
  do alvo, mude a **forma** (envelope, duração, filtro) e **regere a calibração por medição**
  (`gate-loudness.mjs --calibrar`, que grava e sai, depois o gate de verdade); transcreva os
  offsets para `OFFSET_POR_SOM_DB`.
- **Som novo:** evento → categoria (por repetição) → alvo (cai da categoria) → calibração → gate.
  Pular passo faz o **AC-4 reprovar nomeando o som**, porque ele lê o fonte de `sounds.ts`.
- **Aprovação auditiva não é do gate.** "Soa bem" é do dono (S8): fone **e** alto-falante de
  celular, três perguntas fechadas por asset, lote de no máximo 8.

## 5. Áudio gerado por IA — bloqueado hoje

Prompts (12) e a sequência de 6 passos estão prontos em
`squad-alpha-runs/som-01/prototyper/pacote-prompts.md`. **Não gere nada antes de:**
crédito no gerador (a conta estava em **0,45**), **termos comerciais confirmados** (§13.2 nega
garantia de originalidade e põe o *rights clearance* no usuário) e política de loja sobre IA.
⚠️ **`dist/` é commitado: todo byte é permanente no histórico do git.** Orçamento: **S6 — 300 KB
no total, zero no bundle inicial**. Enquanto isso vale o **S10**: o procedural é a solução
provisória, calibrado contra a escada.

## 6. O gate — e a regra de ouro

`node squad-alpha-runs/som-01/prototyper/gate-loudness.mjs` (exige Chromium). Assertivas:
**AC-0** amostra existe · **AC-1** teto −1 dBTP · **AC-2** catraca −3,29 dBTP (pior caso medido
+ 1 dB de folga; **não é o teto**) · **AC-3** o medidor não pode ser cego (autovalida com
senoide em fs/4 a 45° e **aborta**) · **AC-4** cobertura · **AC-5** `|offset| ≤ 20 dB` ·
**A-3** desvio por asset · **A-5** alvo único da trilha.

> ### ***"Conserte a ESCADA, não a catraca."*** — está escrito na saída do próprio gate.

**Por que confiar nele:** ele já foi visto vermelho, com as saídas gravadas em disco
(`prototyper/saida-gate-vermelho.txt`, `prova-vermelho-C-amostra-vazia.txt`,
`provas-vermelho-pos-ataque.txt`). Isso importa porque o run achou **dois verdes vazios** — um
deles dentro do próprio gate (`classe0` **removia** o som da medição em vez de reprová-lo), o
outro na calibração (desvio 0,00 era **identidade algébrica**, não medição).
**Regra geral que sai daí: alguma assertiva tem de olhar para quem define a amostra.**

## 7. Aberto, com dono

Do **dono**: crédito no gerador · termos comerciais · política de loja sobre IA · o 🔴 do
microfone (`ChatBox.tsx` grava e envia áudio ao Supabase contra a Data Safety declarada — fora do
escopo do som, **bloqueia publicação**).
Do **engenheiro de áudio**: o flake do gate (**1 falha em 11**, não diagnosticada — requisito de
promoção: persistir diagnóstico ao falhar) · **O-5** (sons cortados ainda entram na medição) ·
**O-7** (a lista auditável `FORA_DO_AC1` discorda do filtro real `/^g[1-7]-/`, que exclui mais em
silêncio — pode haver cenário nunca aferido).

## 8. Quatro armadilhas que este run pagou para aprender

1. **Só afirme sobre o código o que você acabou de executar contra o código.** 7 erros de fato
   caíram assim; nenhum caiu por leitura de documento.
2. **Nunca ancore medição em renderização própria sem validar contra o motor real** — o baseline
   em Node divergiu do Chromium em **7 de 10 sons, 1,44–1,76 dB**.
3. **Desconfie de resultado perfeito.** Pergunte que entrada faria a assertiva falhar; se a
   resposta for "nenhuma", ela não mede nada.
4. **Fonte estocástica só se afere sobre a distribuição (N ≥ 12)**, nunca sobre uma realização —
   uma folga anunciada de 3,24 dB era, na distribuição, de **0,08 dB**.

Detalhe completo, com saídas coladas e proveniência de cada número:
`squad-alpha-runs/som-01/maintainer/runbook-som.md` (não versionado).
