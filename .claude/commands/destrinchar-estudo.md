---
description: Destrincha uma parte do conteúdo estudado (relatórios, transcrições, vídeos) em contraste com o código real do Soulmon
argument-hint: <tema, arquivo ou pergunta — ex. "transcrição C4", "o que Finch faz que não fazemos", docs/guia-experiencia/03-*.md>
---

Pegue uma parte do corpus estudado e confronte com o Soulmon real.

**Alvo:** $ARGUMENTS

## O corpus disponível

- `docs/GUIA-EXPERIENCIA.md` — guia mestre (seção I = achados via transcrição)
- `docs/guia-experiencia/01-07` — os sete relatórios de pesquisa
- `docs/guia-experiencia/08-transcricoes-notebooklm.md` — respostas verbatim
  (A1–A5, B1–B5, C1–C6), a fonte mais forte
- `docs/guia-experiencia/00-LINKS-VIDEOS.md` — 84 vídeos verificados
- `docs/plano-melhorias/A-F` — os seis mapeamentos do código

## Passos

1. Leia o alvo. Se for um tema e não um arquivo, ache onde ele vive no corpus.

2. Identifique o **guarda dono** do domínio (`docs/plano-melhorias/LEDGER.md`) e
   delegue a ele — ou, se o tema cruzar domínios, a dois ou três em paralelo.

3. Cada guarda produz a análise em **três colunas**, sem exceção:

   | O que a fonte diz | O que o Soulmon faz hoje (arquivo + símbolo) | Veredito |

   Vereditos possíveis: **já faz** (e onde) · **lacuna** (vira proposta de WP) ·
   **conflita com a tese** (e por quê) · **não se aplica** (diga o motivo).

4. **Nenhuma afirmação sobre o código sem `grep`.** "O Soulmon não faz X" só é
   dizível depois de procurar. Se não achou, escreva `NÃO ENCONTRADO` — foi
   assim que se descobriu que `daysToEvolve` era dado morto e que "o pet olha"
   nunca existiu.

5. Se sair uma **lacuna** que valha um WP novo:
   - passe pelo `soulmon-guarda-linha-vermelha` antes de propor;
   - acrescente ao `PLANO-MELHORIAS.md` com número na série do domínio
     (ex. WP2.8), spec, aceite e comando de verificação;
   - acrescente a linha no ledger do guarda dono como `PROPOSTO`;
   - **atualize a contagem de WPs** no `LEDGER.md` e nos documentos que a citam.

## Regras

- Fonte de vídeo tem **timestamp aproximado** (o NotebookLM reconstrói da
  transcrição). Para citação pública, conferir no vídeo.
- Onde os relatórios **discordam entre si**, mostre o desacordo — não a média.
  O guia já arbitrou sete conflitos; releia C.3 antes de reabrir um.
- Uma fonte que **confirma** o que o Soulmon já faz é resultado valioso, não
  desperdício: é o que transforma tese em precedente com evidência.
