# Glossário pt-BR do Soulmon

Termo padrão por conceito. Nomes próprios e de marca ficam como estão. Regras de tom: tratamento "você", frase curta, sem promessa de saúde ou foco, 18+, sem culpa. Português é localização; o inglês é a base (ver `CLAUDE.md`).

## Capitalização e pontuação
- Rótulos e títulos em maiúscula só na primeira letra: "Nova tarefa", "Exportar save". Nada de Title Case.
- Pergunta de confirmação curta: "Excluir esta tarefa?". Evitar "Tem certeza que deseja...".
- "Ex.:" com ponto. Reticências só em campo de texto vazio ("...").
- Cabe em botão de celular: preferir até ~16 caracteres no botão.

## Ações
| Conceito | Padrão | Evitar |
|---|---|---|
| Reset | Redefinir | Resetar |
| Delete | Excluir | Deletar, Apagar (exceto "apagar progresso" em aviso) |
| Save (arquivo) | save (minúsculo) | Salvamento |
| Chat | Converse | Fale com |
| Hatch | Chocar | Eclodir |
| Evolve | Evoluir | Digivoluir |

## Conceitos do jogo
| Conceito | Padrão | Nota |
|---|---|---|
| Moeda | Bits | Sempre plural, maiúsculo |
| Reputação | Honra | Nunca "Reputação" |
| Fortaleza | Cidadela | |
| Treino | Treino | |
| Torneio | Torneio | |
| Arena | Arena | |
| Mercado | Feira | |
| Encontro raro da volta da Missão (loja com desconto) | Mercador | "feira" (nesse contexto; "Feira" segue sendo o Mercado fixo do mapa) |
| Desafio da volta (quebra-cabeça que dá Bits ao clã) | Desafio do Mercador | |
| Guilda | Clã | |
| Soulsmith, Hexsmith | manter | Nomes próprios |
| Fragmentos | Fragmentos | Sempre plural, minúsculo no meio da frase |
| Estágios | Desperto, Ascendente, Transcendente, Apoteose, Zênite | Concordar com o gênero do Soulmon ("Ele está Desperto") |
| Tipos de personalidade | Poder, Harmonia, Benevolência; no Ultra: Absoluto | Absoluto (en: Absolute) = os três tipos ao mesmo tempo, neutro; só o Ultra. Constante `ABSOLUTE_TYPE` em `src/types/attributes.ts` |
| Stats | Atributos | "Estatísticas" só para dados históricos |
| Mood/saúde do pet | "bem", "feliz" | Nunca prometer saúde real |

## Tom
- Amigável, direto, adulto (18+). Sem infantilizar, sem culpa por falhar.
- Nunca prometer saúde, foco ou resultado. Falar de hábito e constância.
- Erro: dizer o que houve e o que fazer ("Não deu para carregar o arquivo. Confira se ele é válido.").
