/**
 * A POLÍTICA DE LOUDNESS — dono único, sem I/O — run `som-01`, Fase 2, fatia 2.
 *
 * Promovida de `squad-alpha-runs/som-01/prototyper/gate-loudness.mjs`, que rodava
 * o Chromium por CDP. **O arnês de CDP NÃO veio junto, de propósito**: ele flaka
 * (1 falha em 11, não diagnosticada) e exige Chrome instalado — um portão que
 * depende de um navegador na máquina é um portão que alguém desliga. O que veio
 * é o que é DETERMINÍSTICO e roda em Node: a escada, a calibração e as
 * assertivas que não precisam de motor real (`loudness.contract.test.ts`).
 *
 * ⚠️ **Este arquivo é o DONO ÚNICO dos números de loudness.** Nada aqui é
 * redeclarado no `sounds.ts`, no `audioBus.ts` nem em teste — footgun 9 do
 * `CLAUDE.md`, que já custou seis divergências silenciosas na família de
 * cuidado. Quem precisa de um alvo, importa daqui.
 *
 * Ancoragem: **S3** (08/09/2026, `docs/REGISTRO-DE-DECISOES.md` §6.1) — ≤ −16
 * LUFS integrado e true peak ≤ −1 dBTP, AES/EBU R 128. A escada por categoria e
 * a tolerância vêm de `squad-alpha-runs/som-01/discovery/spec-de-loudness.md`
 * §3.1/§3.2/§3.4; a linha `sintonia` vem do §3.1-ter (fecha a lacuna L-7).
 *
 * **Unidade**: os alvos por categoria são **LUFS-M** (R2 — janela deslizante de
 * 400 ms, K-weighting, sem gating, com zero-padding), nunca dBFS. As duas réguas
 * divergem, e a diferença medida no run foi **3,017 dB** — sem a decisão de
 * unidade o lote inteiro sai fora e nada fica vermelho.
 *
 * **O que NÃO está aqui, e por quê:** o contrato adaptativo de 7 estados
 * (E0–E6) da trilha segue como PROPOSTA NÃO VERIFICADA e **não foi promovido**.
 * O único número de trilha que entra é o alvo dela (§4.1), porque a trilha
 * nasce desligada (S2) e precisa de um alvo no dia em que ganhar asset.
 */

/** As categorias da escada. `trilha` é contínua e não é SFX. */
export type CategoriaSom =
  | 'marco' | 'presenca' | 'degeneracao' | 'sintonia'
  | 'cuidado' | 'conclusao' | 'transacao' | 'arcade';

/** S3 — teto de true peak, em dBTP, medido com oversampling ≥4×. */
export const TETO_DBTP = -1.0;

/** S3 — teto de programa, em LUFS integrado (R1). */
export const TETO_LUFS_INTEGRADO = -16.0;

/** §3.4 — tolerância do alvo por categoria, em LU. */
export const TOLERANCIA_LU = 1.0;

/**
 * §3.2 item 3 — o degrau da escada, em dB. É DERIVADO (razão de 2× em escala
 * sone), não escolhido: por isso não existe meio-degrau, e por isso `sintonia`
 * caiu em −19,0 em vez de num −17,5 inventado por conveniência de um só som.
 */
export const DEGRAU_DB = 3.0;

/**
 * §3.1 — a escada, em **LUFS-M** no ponto P-B, com o barramento daquela
 * categoria soando sozinho. A ordem é por REPETIÇÃO, nunca por importância:
 * quem repete mais entra mais baixo.
 */
export const ALVO_LUFS_M: Record<CategoriaSom, number> = {
  marco: -16.0,
  presenca: -16.0,
  degeneracao: -16.0,
  sintonia: -19.0,
  cuidado: -19.0,
  conclusao: -22.0,
  transacao: -22.0,
  arcade: -25.0,
};

/**
 * O nível em que os ARQUIVOS de música foram mestrados (trilha de duas camadas e
 * música-tema, medido em LUFS-S): é um fato sobre o arquivo, não uma escolha — só
 * muda se o arquivo for remasterizado. NÃO é o alvo de reprodução (abaixo).
 */
export const ALVO_MASTERIZACAO_MUSICA_LUFS_S = -28.0;

/**
 * §4.1 — alvo da MÚSICA (trilha, tema e a faixa da Arena) na reprodução, em LUFS-S
 * (janela curta de 3 s, EBU Tech 3341).
 *
 * ⚠️ **Subiu de −28 para −22 em 11/10/2026 (pedido do dono: "a música está muito baixa").**
 * A regra antiga era "a trilha fica ABAIXO do último degrau de SFX (Arcade, −25)"; ela foi
 * relaxada para "NO MÁXIMO no degrau de Conclusão (−22)", e é por isso que a música em
 * combate desce de volta (`OFFSET_MUSICA_EM_COMBATE_DB`). A diferença entre este alvo e o
 * de masterização vira o ganho de reprodução (`GANHO_MUSICA_DB`), aplicado no nó de fade
 * de cada música — nunca um literal em `tema.ts`/`trilha.ts`.
 */
export const ALVO_TRILHA_LUFS_S = -22.0;

/** Ganho de reprodução da música: alvo − masterização. DERIVADO, nunca digitado. */
export const GANHO_MUSICA_DB = ALVO_TRILHA_LUFS_S - ALVO_MASTERIZACAO_MUSICA_LUFS_S;

/**
 * Em combate (Masmorra, Arena, Duelo, Pesadelo) a música desce este tanto, para o degrau mais baixo dos SFX
 * (Arcade, o golpe, que repete mais) não ser coberto por ela. O resultado
 * (`ALVO_TRILHA_LUFS_S + OFFSET`) fica no degrau do Arcade — há teste.
 */
export const OFFSET_MUSICA_EM_COMBATE_DB = -3.0;

/**
 * Trim da faixa derivada da ARENA (as duas camadas a 1,2× + a percussão procedural de `trilhaArena.ts`), em dB SOBRE o
 * `TRIM_TRILHA_POR_CAMADAS_DB[2]` (a percussão passa pelo mesmo nó de ganho que as camadas). Medido em 11/10/2026 com o
 * mesmo ffmpeg/`ebur128` (camadas aceleradas por `asetrate`, o equivalente do `playbackRate`, + a percussão sintetizada
 * pelo próprio `trilhaArena.ts`): a mistura SEM trim dá **−24,8** LUFS-S mediano (pico −5,2 dBFS) — a percussão a
 * deixa 5,8 dB mais alta que as camadas sozinhas; levá-la à referência de −28 pede **−3,2 dB** no total, ou seja,
 * `−3,2 − 2,6 = −5,8` sobre o trim das duas camadas. É medição offline e o nível relativo percussão/camadas é rascunho
 * até a escuta do dono (S8).
 */
export const TRIM_FAIXA_ARENA_DB = -5.8;

/** Trim das músicas de combate em streaming (dungeon/pvp theme, 19/10/2026), em dB sobre o ganho de reprodução: os arquivos
 * foram mestrados com ganho ÚNICO para `ALVO_MASTERIZACAO_MUSICA_LUFS_S` e medidos depois do encode com o mesmo ffmpeg/`ebur128`
 * (LUFS-S mediano) do tema: masmorra webm −28,0 / m4a −28,0 (integrado −28,3; true peak −13,6/−12,6 dBTP); pvp webm −28,0 /
 * m4a −27,9 (integrado −28,2/−28,2; true peak −15,7/−15,8 dBTP). Resíduo < 0,1 dB → 0. Remasterizar = medir de novo. */
export const TRIM_MUSICAS_DE_COMBATE_DB: Record<'masmorra' | 'pvp', number> = { masmorra: 0, pvp: 0 };

/**
 * Trim da trilha por NÚMERO de camadas tocando ao mesmo tempo, em dB: o que leva a SOMA ao nível de masterização
 * (`ALVO_MASTERIZACAO_MUSICA_LUFS_S`), medido com a MESMA estatística da música-tema — LUFS-S mediano do filtro
 * `ebur128` do ffmpeg, BS.1770, sobre o arquivo `.webm` que o app serve.
 *
 * ⚠️ **Corrigido em 11/10/2026 (auditoria "a música está muito baixa").** Os valores antigos (`{1: 0, 2: −2,024}`)
 * vinham de `mix-camadas.mjs`, que anunciava a soma em "−28,00 LUFS-S" — mas medida sobre o arquivo servido, com a
 * estatística do tema, a soma das duas camadas com aquele trim dá **−32,6** (mediano; integrado −31,5, que bate com o
 * "−31,46" do próprio registro antigo): a trilha tocava **4,6 dB abaixo** do que a política dizia e do que o tema
 * toca. Medido hoje: `base` sozinha −32,1 · `ritmo` sozinha −33,5 · soma SEM trim −30,6. Trim = referência (−28) menos
 * o mediano sem trim: 2 camadas **+2,6 dB**; 1 camada (média das duas sozinhas, −32,8) **+4,8 dB**. Pico da soma sem trim:
 * −14,1 dBFS; com este trim e o `GANHO_MUSICA_DB`, −5,5 dBFS (≤ teto S3 com folga). Camada nova = medir de novo.
 */
export const TRIM_TRILHA_POR_CAMADAS_DB: Record<1 | 2, number> = { 1: 4.8, 2: 2.6 };

/**
 * A ordem da escada, do mais alto ao mais baixo. Existe como declaração
 * SEPARADA do mapa acima para o teste poder provar que a ordem foi preservada —
 * um `Object.keys` provaria só que o mapa é igual a si mesmo.
 */
export const ORDEM_DA_ESCADA: CategoriaSom[] = [
  'marco', 'presenca', 'degeneracao', 'sintonia', 'cuidado', 'conclusao', 'transacao', 'arcade',
];

/**
 * **AC-4 / cobertura** — a categoria de cada som exportado por `sounds.ts`.
 * Dono único do vínculo som↔categoria: o `sounds.ts` importa daqui e não
 * redeclara. O teste de contrato lê o FONTE de `sounds.ts` (precedente:
 * `src/plugins/widgetSemCobranca.contract.test.ts`) e exige que os dois
 * conjuntos sejam idênticos — som de produção fora deste mapa é som que
 * nenhuma medição alcança, ou seja, verde vazio.
 */
export const CATEGORIA_DO_SOM: Record<string, CategoriaSom> = {
  playEvolve: 'marco',
  playPresence: 'presenca',
  playDegenerate: 'degeneracao',
  playVisorTune: 'sintonia',
  playFeed: 'cuidado',
  playShower: 'cuidado',
  playSleep: 'cuidado',
  playTaskComplete: 'conclusao',
  // PR18 (06/10/2026): combate = minijogo → `arcade` (R-CAT: o EVENTO decide; ver o bloco em sounds.ts).
  playAttack: 'arcade',
  playAttackRanged: 'arcade', // 11/10/2026: o golpe à distância — mesmo evento, mesma categoria (R-CAT); 19/10: vira o ataque MÁGICO (D-88)
  playSpecial: 'arcade',
  playVictory: 'arcade',
  // 19/10/2026 (pedido do dono, D-86..D-92): os três eventos que faltavam no combate. R-CAT: o EVENTO é combate → `arcade`
  // (derrota de minijogo não é a degeneração real: C-6; defesa e carga repetem tanto quanto o golpe).
  playDefend: 'arcade',
  playCharge: 'arcade',
  playDefeat: 'arcade',
  // 11/10/2026 (pedido do dono, LEVEL UP): subir de Vínculo é MARCO — raro, voluntário (vem de um gesto) e sem
  // vizinho de repetição (R-CAT: o EVENTO decide, não o arquivo). Mesma categoria de `playEvolve`.
  playLevelUp: 'marco',
};

/**
 * **AC-5** — `|offset| > 20 dB` reprova. *"Não é calibração, é fonte errada."*
 * O número veio da medição da Fase 1: a forma de 180 ms do `playVisorTune`
 * pedia **+36 dB** para alcançar o alvo, e o conserto não era o ganho — era o
 * envelope e a duração. Um gate que aceitasse aquele offset teria declarado
 * calibrada uma fonte 42 dB fora do alvo.
 */
export const OFFSET_MAX_DB = 20;

/**
 * A CALIBRAÇÃO — `alvo_da_categoria − LUFS-M do som`, em dB, medida no motor
 * real (Chrome 152.0.7977.76, 09/09/2026) e transcrita de
 * `squad-alpha-runs/som-01/prototyper/calibracao-loudness.json`.
 *
 * ⚠️ As linhas de `playPoopClean` e `playMenuOpen` do JSON **não vieram**: os
 * dois foram cortados na Fase 0 e não existem mais no fonte. O offset de
 * `playVisorTune` é o da forma de 400 ms com platô (0,037 dB); o 36,176 dB da
 * versão anterior media a forma de 180 ms e está MORTO.
 */
export const OFFSET_POR_SOM_DB: Record<string, number> = {
  playPresence: 18.053,
  playTaskComplete: -0.538,
  playFeed: 6.39,
  playShower: 10.433,
  playEvolve: 3.545,
  playDegenerate: 4.975,
  playSleep: 8.025,
  playVisorTune: 0.037,
  // 19/10/2026 (D-86..D-92): os SETE efeitos de combate são buffers procedurais de `utils/sfxCombate.ts` (sinal determinístico,
  // pico nominal 0,8). Aqui o offset é `alvo − LUFS-M do sinal NOMINAL` (≠ dos antigos, que eram relativos ao ganho 0,12), medido
  // em Node com o medidor K-weighting de `src/test/lufsM.ts` (mesma definição: LUFS-M máx., janela 400 ms, zero-padding; o medidor
  // reproduz `playFeed` em −25,39 a 0,12, ou seja, −19,00 com o offset de 6,39). `sfxCombate.loudness.test.ts` re-mede e reprova se
  // o offset sair da tolerância. Substituem os de PR18/11-10 de `playAttack`/`playAttackRanged`/`playSpecial`/`playVictory`.
  // Falta só o gate humano de escuta (S8).
  playAttack: -6.87,
  playDefend: -5.765,
  playAttackRanged: -12.816,
  playCharge: -13.5,
  playSpecial: -8.656,
  playVictory: -9.975,
  playDefeat: -13.378,
  // 11/10/2026: -16,0 (alvo de `marco`) - (-17,893 LUFS-M do recorte a ganho 0,12), medido em Chromium
  // (OfflineAudioContext + K-weighting BS.1770, o MESMO arnês que reproduz playTaskComplete -22,00). Pico -11,5 dBFS.
  // Falta o gate humano de escuta (S8).
  playLevelUp: 1.893,
};

/** dB → linear. A conversão mora aqui porque o alvo mora aqui. */
export function db2lin(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * §6.4 item 1 — o bus de categoria fica em **0,00 dB**. A correção de nível é
 * OFFSET DE PRODUÇÃO por asset (cada fonte entra no grafo já no alvo da própria
 * categoria), nunca um ganho de categoria arbitrário: um arquivo conforme
 * multiplicado por um ganho de categoria inventado sai verde no gate com o app
 * fora do alvo.
 */
export const GANHO_DE_CATEGORIA_DB = 0.0;

/**
 * Rótulos de superfície, **PT-BR e EN** — o `CLAUDE.md` é explícito: nunca
 * string só em português. Usados pelo controle de volume por categoria.
 */
export function rotuloCategoria(cat: CategoriaSom, language: string): string {
  const pt: Record<CategoriaSom, string> = {
    marco: 'Marcos', presenca: 'Presença', degeneracao: 'Degeneração', sintonia: 'Sintonia',
    cuidado: 'Cuidado', conclusao: 'Conclusão', transacao: 'Transação', arcade: 'Minijogos',
  };
  const en: Record<CategoriaSom, string> = {
    marco: 'Milestones', presenca: 'Presence', degeneracao: 'Degeneration', sintonia: 'Tuning',
    cuidado: 'Care', conclusao: 'Completion', transacao: 'Transaction', arcade: 'Arcade',
  };
  return language === 'pt-BR' ? pt[cat] : en[cat];
}
