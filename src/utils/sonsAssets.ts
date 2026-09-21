/**
 * ASSETS DE ÁUDIO GERADOS POR IA — o manifesto e a carga preguiçosa.
 *
 * Decisão do dono em 21/09/2026 (`docs/REGISTRO-DE-DECISOES.md` §6.1, S16):
 * instalar os candidatos de IA dos três eventos LONGOS (Marco, Degeneração,
 * Conclusão) e a camada-base da trilha **sem** o A/B cego ter rodado — "só pra
 * gente ter pronto; depois melhoramos". A S10 muda de dono, não de método: o
 * procedural continua sendo o **fallback** de cada um desses três sons (se o
 * arquivo ainda não chegou, não decodificou, ou o `fetch` falhou, o som que
 * toca é o de sempre), e os cinco sons CURTOS continuam procedurais porque o
 * gerador reprovou neles (`docs/PERGUNTAS-DO-DONO.md` #10).
 *
 * Regras que este arquivo cumpre, e o teste que as trava
 * (`sonsAssets.contract.test.ts`):
 * - **S6 — zero no bundle inicial.** Nada aqui é `import`ado como asset: os
 *   arquivos vivem em `public/sounds/` e só saem da rede na PRIMEIRA chamada
 *   de `prepararAssets()`, que acontece dentro de um `play*` — ou seja, depois
 *   de um gesto, nunca no carregamento. E nenhum deles pode estar em
 *   `PRECACHE_URLS` do `public/sw.js`.
 * - **S6 — 300 KB no total.** O teste soma os bytes dos arquivos em disco.
 * - **S9 — procedência.** Hash SHA-256 casado nas duas direções: o manifesto
 *   aqui ↔ o arquivo em `public/sounds/` ↔ a linha em `docs/Attributions.md`.
 *   O guard prova procedência, nunca originalidade (S9/S15).
 * - **Loudness.** Os WAVs mestres saíram do `pos-processar.mjs` já no alvo da
 *   categoria (P-A); o bus da categoria fica em 0 dB. Por isso o buffer toca
 *   com ganho **1** e este arquivo NÃO declara alvo nenhum — a política é de
 *   `utils/loudness.ts`, dono único (footgun 9).
 * - **Formato.** WebM/Opus 48 kbps mono, codificado pelo MediaRecorder do
 *   Chrome (não há codec nesta máquina) e decodificado por `decodeAudioData`
 *   no mesmo motor. O MediaRecorder grava um pré-rolo de silêncio na cabeça:
 *   `recortarSilencio` acha o onset ao decodificar, então o som começa no
 *   gesto, não 240 ms depois.
 */
import type { CategoriaSom } from './loudness';

export interface AssetDeSom {
  /** Caminho servido, relativo à origem. */
  url: string;
  /** SHA-256 do arquivo em `public/`, minúsculo. */
  sha256: string;
  /** Bytes do arquivo — para o S6 ser conferido sem abrir o arquivo. */
  bytes: number;
  categoria: CategoriaSom;
  /** Duração ÚTIL (sem o pré-rolo), em segundos — fecha os duckings D-1/D-2. */
  duracaoS: number;
  origem: 'higgsfield/seed_audio' | 'higgsfield/sonilo_music';
  /** Onde está o prompt literal (não o texto — o texto fica fora do bundle). */
  promptRef: string;
  geradoEm: '2026-09-21';
}

export const ASSETS_DE_SOM = {
  playEvolve: {
    url: '/sounds/evolve.webm',
    sha256: 'cc8e814b51c7eb5df5a3827cde0674492e869db35f30a4fef778094dc1fc1dfe',
    bytes: 7641,
    categoria: 'marco',
    duracaoS: 1.2,
    origem: 'higgsfield/seed_audio',
    promptRef: 'squad-alpha-runs/som-01/prototyper/pacote-prompts.md §2.1',
    geradoEm: '2026-09-21',
  },
  playDegenerate: {
    url: '/sounds/degenerate.webm',
    sha256: '1508cfaff0c4889152a94bf7b2735b1e03762dd3b228f7186397b89fb79d904b',
    bytes: 4498,
    categoria: 'degeneracao',
    duracaoS: 0.7,
    origem: 'higgsfield/seed_audio',
    promptRef: 'squad-alpha-runs/som-01/prototyper/pacote-prompts.md §2.12',
    geradoEm: '2026-09-21',
  },
  playTaskComplete: {
    url: '/sounds/task-complete.webm',
    sha256: '798225a0dd836866b886506fa8d697fcda87e7eaafd30a783724211bff2d9520',
    bytes: 1570,
    categoria: 'conclusao',
    duracaoS: 0.2,
    origem: 'higgsfield/seed_audio',
    promptRef: 'squad-alpha-runs/som-01/prototyper/pacote-prompts.md §2.7',
    geradoEm: '2026-09-21',
  },
} as const satisfies Record<string, AssetDeSom>;

export type NomeDeAsset = keyof typeof ASSETS_DE_SOM;

/**
 * As camadas da trilha — DUAS, `base` e `ritmo`, no mesmo BPM fixo (100), cada
 * uma mestrada no alvo sozinha; a soma é trazida ao alvo pelo
 * `TRIM_TRILHA_POR_CAMADAS_DB` de `utils/loudness.ts`. Os arquivos carregam
 * 1 s de cauda (a cabeça do loop repetida) porque o codec perde a ponta; o loop
 * fecha em `duracaoS`, o ponto exato (12 compassos). Com isto a condição (1) da
 * S13 está satisfeita no repositório; a (2) — o dono ligar a trilha por gesto
 * numa sessão real — não é verificável por código, e a máquina E0–E6 continua
 * congelada: hoje as duas camadas tocam juntas, um estado só.
 */
export const CAMADAS_DA_TRILHA = {
  base: {
    url: '/sounds/trilha-base.webm',
    sha256: '2122e7ed4d330a117eb27b067781a2fcbd90ce1113d800d2839a3702acd10688',
    bytes: 122447,
    categoria: 'marco', // não usado: a trilha vai ao busTrilha, não a um bus de categoria
    duracaoS: 28.8,
    origem: 'higgsfield/sonilo_music',
    promptRef: 'squad-alpha-runs/som-01/prototyper/pacote-prompts.md §2.14',
    geradoEm: '2026-09-21',
  },
  ritmo: {
    url: '/sounds/trilha-ritmo.webm',
    sha256: '6182a9f6ed468a77cfb3c65a6224907b8f7abdce3ce1c7d84df0745a16e175f8',
    bytes: 122092,
    categoria: 'marco',
    duracaoS: 28.8,
    origem: 'higgsfield/sonilo_music',
    promptRef: 'squad-alpha-runs/som-01/prototyper/pacote-prompts.md §2.15',
    geradoEm: '2026-09-21',
  },
} as const satisfies Record<string, AssetDeSom>;

export type CamadaDaTrilha = keyof typeof CAMADAS_DA_TRILHA;

/** Compatibilidade: a primeira camada. */
export const TRILHA_BASE: AssetDeSom = CAMADAS_DA_TRILHA.base;

const buffers = new Map<string, AudioBuffer>();
const emCurso = new Map<string, Promise<AudioBuffer | null>>();

/** Limiar de onset: −60 dBFS. Abaixo disso é o pré-rolo do MediaRecorder. */
const LIMIAR_ONSET = 0.001;

export function recortarSilencio(ctx: BaseAudioContext, buf: AudioBuffer): AudioBuffer {
  const d = buf.getChannelData(0);
  let ini = 0;
  while (ini < d.length && Math.abs(d[ini]) < LIMIAR_ONSET) ini++;
  if (ini === 0 || ini >= d.length) return buf;
  const n = buf.length - ini;
  const out = ctx.createBuffer(buf.numberOfChannels, n, buf.sampleRate);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    out.copyToChannel(buf.getChannelData(c).subarray(ini), c);
  }
  return out;
}

/**
 * Baixa e decodifica UM asset. Nunca lança: qualquer falha devolve `null` e o
 * chamador fica no procedural. Idempotente — a segunda chamada devolve a mesma
 * promessa ou o buffer já pronto.
 */
export function carregarAsset(ctx: BaseAudioContext, asset: AssetDeSom): Promise<AudioBuffer | null> {
  const pronto = buffers.get(asset.url);
  if (pronto) return Promise.resolve(pronto);
  const andando = emCurso.get(asset.url);
  if (andando) return andando;
  if (typeof fetch !== 'function' || typeof ctx.decodeAudioData !== 'function') return Promise.resolve(null);
  const p = fetch(asset.url)
    .then(r => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then(ab => ctx.decodeAudioData(ab))
    .then(buf => {
      const rec = recortarSilencio(ctx, buf);
      buffers.set(asset.url, rec);
      return rec;
    })
    .catch(() => null)
    .finally(() => emCurso.delete(asset.url));
  emCurso.set(asset.url, p);
  return p;
}

/** O buffer se JÁ estiver decodificado; `null` = toca o procedural desta vez. */
export function assetPronto(nome: NomeDeAsset): AudioBuffer | null {
  return buffers.get(ASSETS_DE_SOM[nome].url) ?? null;
}

let preparado = false;
/**
 * Dispara a carga dos três SFX de uma vez, na primeira chamada. É chamada de
 * dentro de `play()` — depois do gate de mudo e do gesto — e não espera nada.
 */
export function prepararAssets(ctx: BaseAudioContext): void {
  if (preparado) return;
  preparado = true;
  for (const nome of Object.keys(ASSETS_DE_SOM) as NomeDeAsset[]) void carregarAsset(ctx, ASSETS_DE_SOM[nome]);
}

/** Só para teste: esquece tudo o que foi carregado. */
export function esquecerAssets(): void {
  buffers.clear();
  emCurso.clear();
  preparado = false;
}

/** Toca um buffer já no alvo: ganho 1, sem oferta de nível (footgun 9). */
export function tocarBuffer(ctx: BaseAudioContext, destino: AudioNode, buf: AudioBuffer): number {
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(destino);
  src.start(ctx.currentTime);
  return buf.duration;
}
