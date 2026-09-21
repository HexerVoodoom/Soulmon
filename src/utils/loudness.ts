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

/** §4.1 — alvo da trilha, em LUFS-S (janela curta de 3 s, EBU Tech 3341). */
export const ALVO_TRILHA_LUFS_S = -28.0;

/**
 * Trim da trilha por NÚMERO de camadas tocando ao mesmo tempo, em dB — o
 * `trimEstadoDb` do arnês (`gate-loudness.mjs` A-5), medido e não calculado.
 * Cada camada sai do mestre no alvo SOZINHA (`mestre-trilha.mjs`); a soma de
 * duas sobe, e é este trim, aplicado igual às duas, que devolve a soma ao
 * `ALVO_TRILHA_LUFS_S`. Medido em 21/09/2026 sobre `base` + `ritmo`
 * (`E:/Soulmon-assets/som-01/mix-camadas.mjs`): soma −28,00 LUFS-S,
 * −15,86 dBTP, −31,46 LUFS integrado. Camada nova = medir de novo, nunca
 * derivar de 1/√n.
 */
export const TRIM_TRILHA_POR_CAMADAS_DB: Record<1 | 2, number> = { 1: 0, 2: -2.024 };

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
