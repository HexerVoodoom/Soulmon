# L5 — crítica de copy das 6 chaves PENDENTE (29/09/2026)

Escopo: as 6 chaves da L4 + literais de UI novos desde 855d16b0 em `guild/`, `mercado/`, `App.tsx`, `nav/`. Só texto; lógica intocada.

Lentes: cobrança, veredito, indiferença, contradição com código, franquia, fronteira da ficção, quem mais lê, voz. Todas passadas nas 6 chaves.

| Chave | Parecer |
|---|---|
| `guild.criar.nome.dica` "Dê um nome à roda." | FINAL. Instrução funcional de formulário, só leitor de tela; nomeia o que falta sem contar dívida. Não mexer. |
| `guild.entrar.codigo.dica` "O código tem {n} caracteres." | FINAL. Fato puro, `{n}` vem de `GUILD_CODE_LENGTH` (sem número escrito à mão). |
| `guild.erro.entrar` "Entrar na conta" | FINAL. Rótulo de botão; fecha o beco do 401 (L3 A1). |
| `guild.feira.semroda` | CORRIGIDA e FINAL. Era "...e a roda o encontra junta." Dano: para quem está sem roda (demo, sozinho, enlutado, sem amigos) "junta" transforma a ausência de roda em falta de companhia, exatamente a leitura que L2 (fatura de ausência) e L7 vetam. Substituta: "A Feira é da roda: toda semana algo chega da névoa, e a roda o recebe." / "...and the circle receives it." |
| `guild.aria.feira.ferido` | FINAL. Idêntica à sugestão do L3 M2; "luz passando entre as camadas" descreve o visor sem HP, "ferido" nem "metade". |
| `guild.aria.feira.dissipado` | FINAL. "desfeito"/"come apart" constata, não celebra nem lamenta; camada sóbria alcançável (L10) para leitor de tela. |

Certo e a preservar: as três frases do visor são neutras entre estados (o mundo constata); `guild.erro.*` nunca acusa o jogador.

Varredura de literais: nenhuma string PT/EN nova hardcoded em `guild/`, `mercado/`, `App.tsx`, `nav/` (o resto do diff é código, teste ou chave já em `guildCopy.ts`). `EXCECOES` do contract test não tinha nenhum PENDENTE: nada a remover.
