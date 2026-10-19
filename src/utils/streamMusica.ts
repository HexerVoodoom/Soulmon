/**
 * O PLAYER DE MÚSICA EM STREAMING — a maquinaria do `<audio>` que o tema (`tema.ts`) e as músicas de combate
 * (`musicaDeCombate.ts`) dividem, extraída do tema em 19/10/2026 para ter UM dono (decisão do dono: dungeon/pvp theme).
 *
 * Forma: um `<audio>` por player (3m30 decodificados seriam ~70 MB de PCM na RAM de um celular), `preload="none"` —
 * os ~2 MB só saem da rede quando o primeiro `comecar()` chega (S6: zero no bundle inicial). Formato por suporte
 * (`canPlayType`), com troca única para o outro se o primeiro falhar. O elemento entra no grafo por
 * `createMediaElementSource` → GainNode de fade → o barramento que o dono do player escolhe.
 *
 * Este módulo NÃO decide quando tocar (isso é do dono: sessão, gesto, pausas por motivo) nem quão alto (o ganho vem de
 * `alvo()`, calculado pelo dono com `utils/loudness.ts`). Ele só cumpre o gate recebido, o mudo global e a aba escondida.
 * `comecar` é SÍNCRONO até o `play()`: o iOS só honra o gesto se o `play()` sai na mesma pilha dele.
 */
import { garantirBarramento } from './audioBus';
import { CROSSFADE_MUSICA_S, type FormatoDoTema, type ManifestoDeMusica } from './sonsAssets';
import { isMuted } from './sounds';

type Barramento = NonNullable<ReturnType<typeof garantirBarramento>>;

/** O formato que este motor diz tocar; o primeiro (WebM/Opus, menor) que o navegador entende, M4A como rede. */
export function escolherFormatoDe(formatos: readonly FormatoDoTema[], probe: Pick<HTMLAudioElement, 'canPlayType'>): number {
  for (let i = 0; i < formatos.length; i++) {
    if (probe.canPlayType(formatos[i].mime) !== '') return i;
  }
  return 0;
}

export interface OpcoesDoStreaming {
  manifesto: ManifestoDeMusica;
  /** Onde o fade se liga: tema `b => b.busTema`; combate `b => b.busTrilha`. */
  bus: (b: Barramento) => AudioNode;
  /** O gate do DONO do player (sessão/pausas); o player soma `isMuted()` e `document.hidden`. */
  podeTocar: () => boolean;
  /** Ganho LINEAR do fade (o dono calcula com `loudness.ts`). */
  alvo: () => number;
  /** O navegador recusou o `play()` (gesto insuficiente): o tema reinstala os ouvintes de gesto. */
  aoRecusarPlay?: () => void;
}

export interface PlayerDeStreaming {
  /** Recomeço (`ended` ou `currentTime` 0) usa `manifesto.fadeInS`; retomada usa o parâmetro (padrão 0,4 s). */
  comecar(fadeDeRetomadaS?: number): boolean;
  parar(fadeS?: number): void;
  /** Aba escondida: para na hora (limpa o timer, pausa). */
  ocultar(): void;
  /** Se tocando, rampa do valor atual até `alvo()` em `s`. */
  rampaParaAlvo(s?: number): void;
  tocando(): boolean;
  /** Só teste: pausa e zera tudo. */
  esquecer(): void;
}

export function criarPlayerDeStreaming(o: OpcoesDoStreaming): PlayerDeStreaming {
  const m = o.manifesto;
  let el: HTMLAudioElement | null = null;
  let fade: GainNode | null = null;
  /** O contexto em que o `<audio>` foi ligado ao grafo: se o barramento for refeito (pagehide → bfcache), o elemento é refeito. */
  let ctxDoElemento: AudioContext | null = null;
  let tocando = false;
  let formatoIdx = 0;
  let formatosTentados = 0;
  let timerVolta: ReturnType<typeof setTimeout> | null = null;
  let tokenParada = 0;

  function limparTimer(): void {
    if (timerVolta) { clearTimeout(timerVolta); timerVolta = null; }
  }

  function aoAcabar(): void {
    tocando = false;
    limparTimer();
    // A faixa já terminou em fade: descansa em silêncio e volta. `comecar` rechecha
    // tudo (mudo, pausa, aba escondida); se algo impedir, a próxima liberação retoma.
    timerVolta = setTimeout(() => { timerVolta = null; comecar(); }, m.pausaEntreVoltasS * 1000);
  }

  function aoFalhar(): void {
    if (!el) return;
    tocando = false;
    // Troca UMA vez para o outro formato; se os dois falharem (offline, 404), cala.
    if (formatosTentados < m.formatos.length - 1) {
      formatosTentados++;
      formatoIdx = (formatoIdx + 1) % m.formatos.length;
      el.src = m.formatos[formatoIdx].url;
      if (o.podeTocar()) comecar();
    }
  }

  function criarElemento(): boolean {
    const b0 = garantirBarramento();
    if (el && b0 && ctxDoElemento && ctxDoElemento !== b0.ctx) {
      // O contexto foi refeito (pagehide fechou o antigo; o bfcache trouxe a página de volta): o `<audio>` está preso
      // a um grafo morto — `createMediaElementSource` só vale UMA vez por elemento, então o elemento é refeito.
      try { el.pause(); } catch { /* já parou */ }
      el = null; fade = null; ctxDoElemento = null; tocando = false;
    }
    if (el) return true;
    if (typeof Audio === 'undefined') return false;
    const b = b0;
    if (!b) return false;
    try {
      const a = new Audio();
      a.preload = 'none';
      a.loop = false;
      a.setAttribute('playsinline', '');
      formatoIdx = escolherFormatoDe(m.formatos, a);
      a.src = m.formatos[formatoIdx].url;
      const g = b.ctx.createGain();
      g.gain.value = 0;
      const src = b.ctx.createMediaElementSource(a);
      src.connect(g);
      g.connect(o.bus(b));
      a.addEventListener('ended', aoAcabar);
      a.addEventListener('error', aoFalhar);
      el = a;
      fade = g;
      ctxDoElemento = b.ctx;
      return true;
    } catch {
      el = null;
      fade = null;
      ctxDoElemento = null;
      return false;
    }
  }

  function comecar(fadeDeRetomadaS = 0.4): boolean {
    if (!o.podeTocar() || isMuted()) return false;
    if (typeof document !== 'undefined' && document.hidden) return false;
    if (tocando) return true;
    if (!criarElemento() || !el || !fade) return false;
    const b = garantirBarramento();
    if (!b) return false;
    tokenParada++;
    limparTimer();
    try {
      if (b.ctx.state === 'suspended') void b.ctx.resume?.();
      const recomeco = el.ended || el.currentTime === 0;
      if (el.ended) el.currentTime = 0;
      const agora = b.ctx.currentTime;
      fade.gain.cancelScheduledValues(agora);
      fade.gain.setValueAtTime(0, agora);
      fade.gain.linearRampToValueAtTime(o.alvo(), agora + (recomeco ? m.fadeInS : fadeDeRetomadaS));
      const p = el.play();
      tocando = true;
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          // Gesto insuficiente para este motor: não insiste (nada de autoplay cego) —
          // o dono rearma e o PRÓXIMO gesto tenta de novo.
          tocando = false;
          o.aoRecusarPlay?.();
        });
      }
      return true;
    } catch {
      tocando = false;
      return false;
    }
  }

  function parar(fadeS = 0.15): void {
    limparTimer();
    tocando = false;
    if (!el) return;
    const meu = ++tokenParada;
    const a = el;
    try {
      const b = garantirBarramento();
      if (b && fade) {
        const agora = b.ctx.currentTime;
        fade.gain.cancelScheduledValues(agora);
        fade.gain.setValueAtTime(fade.gain.value, agora);
        fade.gain.linearRampToValueAtTime(0, agora + fadeS);
      }
    } catch { /* sem rampa: o pause abaixo basta */ }
    setTimeout(() => { if (meu === tokenParada) { try { a.pause(); } catch { /* já parou */ } } }, Math.round(fadeS * 1000) + 20);
  }

  return {
    comecar,
    parar,
    ocultar() {
      // E0: aba escondida → o elemento para na hora (o `audioBus` já suspende o contexto).
      limparTimer();
      tocando = false;
      tokenParada++;
      try { el?.pause(); } catch { /* já parou */ }
    },
    rampaParaAlvo(s = CROSSFADE_MUSICA_S) {
      if (!el || !fade || !tocando) return;
      try {
        const b = garantirBarramento();
        if (!b) return;
        const agora = b.ctx.currentTime;
        fade.gain.cancelScheduledValues?.(agora);
        fade.gain.setValueAtTime?.(fade.gain.value, agora);
        fade.gain.linearRampToValueAtTime?.(o.alvo(), agora + s);
      } catch { /* sem rampa: o próximo início usa o alvo novo */ }
    },
    tocando: () => tocando,
    esquecer() {
      limparTimer();
      tokenParada++;
      try { el?.pause(); } catch { /* ignorado */ }
      el = null;
      fade = null;
      ctxDoElemento = null;
      tocando = false;
      formatoIdx = 0;
      formatosTentados = 0;
    },
  };
}
