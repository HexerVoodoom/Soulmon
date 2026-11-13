import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Language } from '../../../utils/i18n';
import { prefersReducedMotion } from '../../../utils/combatFx';
import { EtapaAlimentar } from '../etapas/EtapaAlimentar';
import { EtapaCorda } from '../etapas/EtapaCorda';
import { EtapaDuelo } from '../etapas/EtapaDuelo';
import { EtapaTarefa, type TarefaMin } from '../etapas/EtapaTarefa';
import type { NovaTarefa } from '../etapas/tipos';
import { ArteIntro } from './ArteIntro';
import { FALANTE, t as tx, UI } from './copy';
import { aposPular, INICIO, proxima, quadroEm } from './introMaquina';
import { gravarProgresso, lerProgresso, limparProgresso } from './introProgresso';
import { ehInterativo, type Fala, type Posicao, type Progresso, type QCena, type Quadro } from './introTipos';
import { TunelCanvas } from './TunelCanvas';

/** O que o App liga às etapas reais (tarefa e comida passam pelos MESMOS handlers da Home). */
export interface LigacoesIntro {
  tasks?: readonly TarefaMin[];
  /** Cria pelo caminho normal e devolve o id da tarefa. */
  onCreateTask?: (item: NovaTarefa) => string | void;
  onCompleteTask?: (id: string) => void;
  foodInventory?: Record<string, number>;
  onFeed?: (emoji: string) => void;
  spriteUrl?: string;
  petName?: string;
}

export interface IntroNarrativaProps {
  language: Language;
  ligacoes: LigacoesIntro;
  /** Chamado uma vez, quando a intro acaba (ou o último Pular), logo depois do fade final. */
  onDone: () => void;
  /** `false` = não lê nem grava o progresso local ("Rever a história" nunca mexe em nada guardado). Padrão: `true`. */
  persistir?: boolean;
  /** Para teste/revisão: começa neste progresso em vez de ler o armazenamento. */
  inicial?: Progresso;
}

/** Tempos (ms). Exportados para os testes não duplicarem números mágicos. */
export const TEMPOS = {
  olhoMs: 1600,
  fadeFinalMs: 1400,
  cristalEscuroMs: 1000,
  cristalMs: 1800,
  /** Rampa da luz até o branco total: ≥ 0,6 s (acessibilidade, sem flash). */
  luzMs: 1400,
  brancoMs: 500,
  brancoSaidaMs: 1200,
  /** Toques em menos que isso depois de um avanço são ignorados (duplo toque). */
  antiDuploMs: 300,
} as const;

const srOnly: CSSProperties = { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };
const cobertura: CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none' };

/** Agenda `fn` depois de `ms` enquanto `chave` não mudar; usa a versão mais nova de `fn` e limpa ao sair. */
function useDepois(fn: () => void, ms: number | null, chave: unknown) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (ms === null) return;
    const id = setTimeout(() => ref.current(), ms);
    return () => clearTimeout(id);
  }, [ms, chave]);
}

function FalaBox({ fala, language }: { fala: Fala; language: Language }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const id = setTimeout(() => setVis(true), 20); return () => clearTimeout(id); }, [fala]);
  return (
    <div role="status" aria-live="polite" data-testid="intro-fala"
      style={{ position: 'absolute', left: 16, right: 16, bottom: 24, padding: '12px 14px', background: 'rgba(0,0,0,.72)', border: '1px solid #3b4a4f', borderRadius: 6, fontSize: 'var(--sm2-text-md)', lineHeight: 1.4, opacity: vis ? 1 : 0, transition: 'opacity .4s' }}>
      <b style={{ display: 'block', fontSize: 'var(--sm2-text-xs)', letterSpacing: '0.06em', marginBottom: 4, color: '#9fe6dc' }}>{tx(FALANTE[fala.quem], language)}</b>
      <p style={{ margin: 0 }}>{tx(fala.txt, language)}</p>
    </div>
  );
}

function Glitch() {
  return (
    <div className="seq-anim" data-efeito="glitch" aria-hidden="true"
      style={{ ...cobertura, mixBlendMode: 'screen', animation: 'seq-pixels .5s steps(4) infinite',
        backgroundImage: 'repeating-linear-gradient(0deg,rgba(255,255,255,.08) 0 2px,transparent 2px 6px),radial-gradient(circle at 30% 40%,rgba(0,255,220,.25) 0 6px,transparent 7px),radial-gradient(circle at 70% 60%,rgba(255,0,120,.2) 0 8px,transparent 9px)' }} />
  );
}

function Personagem({ k, language, lado }: { k: Parameters<typeof ArteIntro>[0]['k']; language: Language; lado?: 'esq' | 'dir' }) {
  const pos: CSSProperties = lado === 'esq' ? { left: '4%' } : lado === 'dir' ? { right: '4%' } : { left: '50%', marginLeft: '-23%' };
  return <ArteIntro k={k} language={language} contain extra={{ position: 'absolute', bottom: '14%', width: '46%', height: '52%', ...pos }} />;
}

/** Cena 1, quadro 1: tela preta; a fala só entra depois de `falaAposMs` e só então o toque vale. */
function CenaPreto({ q, language, onAvancar }: { q: Extract<Quadro, { tipo: 'preto' }>; language: Language; onAvancar: () => void }) {
  const [falou, setFalou] = useState(false);
  useDepois(() => setFalou(true), q.falaAposMs, q);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }} data-testid="intro-preto" onClick={() => { if (falou) onAvancar(); }}>
      {falou && q.fala && <FalaBox fala={q.fala} language={language} />}
    </div>
  );
}

/** Cena 1, quadro 2: o olho abre (duas metades que sobem e descem) com o desfoque saindo. Sem movimento: já aberto. */
function CenaOlho({ q, language, reduzido, onAvancar }: { q: Extract<Quadro, { tipo: 'olho' }>; language: Language; reduzido: boolean; onAvancar: () => void }) {
  const [aberto, setAberto] = useState(reduzido);
  const [pronto, setPronto] = useState(reduzido);
  useEffect(() => {
    if (reduzido) return;
    const a = setTimeout(() => setAberto(true), 60);
    const b = setTimeout(() => setPronto(true), TEMPOS.olhoMs + 60);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [reduzido]);
  const tr = reduzido ? 'none' : `transform ${TEMPOS.olhoMs}ms cubic-bezier(.3,.1,.2,1), filter ${TEMPOS.olhoMs}ms ease-out`;
  const metade = (topo: boolean): CSSProperties => ({
    position: 'absolute', left: 0, right: 0, height: '50.5%', background: '#000', transition: tr, willChange: 'transform',
    ...(topo ? { top: 0, transform: aberto ? 'translateY(-101%)' : 'none' } : { bottom: 0, transform: aberto ? 'translateY(101%)' : 'none' }),
  });
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }} data-testid="intro-olho" data-aberto={aberto || undefined} data-pronto={pronto || undefined}
      onClick={() => { if (pronto) onAvancar(); }}>
      <div style={{ position: 'absolute', inset: 0, filter: aberto ? 'blur(0)' : 'blur(14px)', transition: tr }}>
        <ArteIntro k={q.fundo} language={language} extra={{ position: 'absolute', inset: '-3%', width: '106%', height: '106%' }} />
        <Personagem k={q.npc} language={language} />
      </div>
      <div aria-hidden="true" style={metade(true)} />
      <div aria-hidden="true" style={metade(false)} />
    </div>
  );
}

function CenaQuadro({ q, language, reduzido, onAvancar }: { q: QCena; language: Language; reduzido: boolean; onAvancar: () => void }) {
  const [branco, setBranco] = useState(!!q.entradaBranco);
  useEffect(() => {
    if (!q.entradaBranco) return;
    const id = setTimeout(() => setBranco(false), 60);
    return () => clearTimeout(id);
  }, [q]);
  useDepois(onAvancar, q.autoMs ?? null, q);
  const anim = (dir: 'normal' | 'reverse'): CSSProperties => (q.parallax && !reduzido ? { animation: `seq-parallax 9s ease-in-out infinite alternate${dir === 'reverse' ? '-reverse' : ''}` } : {});
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'pointer' }} data-testid="intro-cena" onClick={onAvancar}>
      {q.fundo && <ArteIntro k={q.fundo} language={language} extra={{ position: 'absolute', inset: '-3%', width: '106%', height: '106%', ...(q.parallax && !reduzido ? { animation: 'seq-parallax 9s ease-in-out infinite alternate' } : {}) }} />}
      {q.npc && <Personagem k={q.npc} language={language} />}
      {q.cristal && <ArteIntro k="cristal-praca" language={language} contain extra={{ position: 'absolute', right: '6%', bottom: '14%', width: '26%', height: '34%' }} />}
      {q.frente && <ArteIntro k={q.frente} language={language} contain extra={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '30%', ...anim('reverse') }} />}
      {q.efeito === 'glitch' && <Glitch />}
      {q.fala && <FalaBox fala={q.fala} language={language} />}
      {q.entradaBranco && (
        <div aria-hidden="true" data-testid="intro-branco-saida"
          style={{ ...cobertura, background: '#fff', opacity: branco ? 1 : 0, transition: `opacity ${TEMPOS.brancoSaidaMs}ms linear` }} />
      )}
    </div>
  );
}

/** Cena 7: escuro → cristal com os dois → luz em rampa → branco. Tudo automático. */
function CenaCristal({ language, reduzido, onFim }: { language: Language; reduzido: boolean; onFim: () => void }) {
  const [fase, setFase] = useState<'escuro' | 'cristal' | 'luz' | 'branco'>('escuro');
  useEffect(() => {
    const t1 = setTimeout(() => setFase('cristal'), TEMPOS.cristalEscuroMs);
    const t2 = setTimeout(() => setFase('luz'), TEMPOS.cristalEscuroMs + TEMPOS.cristalMs);
    const t3 = setTimeout(() => setFase('branco'), TEMPOS.cristalEscuroMs + TEMPOS.cristalMs + TEMPOS.luzMs);
    const t4 = setTimeout(onFim, TEMPOS.cristalEscuroMs + TEMPOS.cristalMs + TEMPOS.luzMs + TEMPOS.brancoMs);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onFim]);
  const luz = fase === 'luz' || fase === 'branco';
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000', overflow: 'hidden' }} data-testid="intro-cristal" data-fase={fase}>
      <div style={{ position: 'absolute', inset: 0, opacity: fase === 'escuro' ? 0 : 1, transition: 'opacity .8s' }}>
        <ArteIntro k="bg-penhasco-topo" language={language} extra={{ position: 'absolute', inset: 0 }} />
        <ArteIntro k="velado-anciao-mao" language={language} contain extra={{ position: 'absolute', bottom: '14%', left: '4%', width: '34%', height: '46%' }} />
        <ArteIntro k="cristal-praca" language={language} contain extra={{ position: 'absolute', left: '32%', bottom: '27%', width: '36%', height: '52%' }} />
        <ArteIntro k="velado-mao" language={language} contain extra={{ position: 'absolute', bottom: '14%', right: '4%', width: '34%', height: '46%' }} />
      </div>
      <div aria-hidden="true" data-testid="intro-luz-radial"
        style={{ ...cobertura, background: 'radial-gradient(circle at 50% 52%, #fff 0, rgba(255,255,255,.85) 30%, rgba(255,255,255,0) 70%)',
          opacity: luz ? 1 : 0, transform: luz && !reduzido ? 'scale(3.2)' : 'scale(.4)',
          transition: reduzido ? `opacity ${TEMPOS.luzMs}ms linear` : `opacity ${TEMPOS.luzMs * 0.5}ms linear, transform ${TEMPOS.luzMs}ms ease-in` }} />
      <div aria-hidden="true" data-testid="intro-branco"
        style={{ ...cobertura, background: '#fff', opacity: luz ? 1 : 0, transition: `opacity ${Math.round(TEMPOS.luzMs * 0.7)}ms linear ${Math.round(TEMPOS.luzMs * 0.3)}ms` }} />
    </div>
  );
}

function CenaFade({ onFim }: { onFim: () => void }) {
  const [preto, setPreto] = useState(false);
  useEffect(() => { const id = setTimeout(() => setPreto(true), 30); return () => clearTimeout(id); }, []);
  useDepois(onFim, TEMPOS.fadeFinalMs, 'fade');
  return <div data-testid="intro-fade" aria-hidden="true" style={{ ...cobertura, background: '#000', opacity: preto ? 1 : 0, transition: `opacity ${TEMPOS.fadeFinalMs}ms linear` }} />;
}

function SlotAlimentar({ language, l, jaAlimentou, onAlimentou, onDone }: { language: Language; l: LigacoesIntro; jaAlimentou: boolean; onAlimentou: () => void; onDone: () => void }) {
  const seguiu = useRef(false);
  // Só vale o que já estava gravado ao montar: alimentar AGORA não desmonta a etapa no meio da mordida.
  const retomou = useRef(jaAlimentou).current;
  // Retomar depois de alimentar: pula a etapa sem gastar outra comida (§11.1).
  useEffect(() => { if (retomou && !seguiu.current) { seguiu.current = true; onDone(); } }, [retomou, onDone]);
  if (retomou) return null;
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.55)', color: '#f2f2f2' }}>
      <EtapaAlimentar language={language} onDone={onDone} foodInventory={l.foodInventory} spriteUrl={l.spriteUrl} petName={l.petName}
        onFeed={(emoji) => { onAlimentou(); l.onFeed?.(emoji); }} />
    </div>
  );
}

/**
 * A intro narrativa jogável (pós-criação até a Home). Máquina de cenas em `introMaquina.ts`; progresso local
 * por cena em `introProgresso.ts`. Pular pula só as falas (as etapas jogáveis ficam). Retomar nunca repete
 * `onCompleteTask` nem `onFeed`. Quem decide se ela aparece é o interruptor `INTRO_NARRATIVA` (`flagIntro.ts`).
 */
export function IntroNarrativa({ language, ligacoes, onDone, persistir = true, inicial }: IntroNarrativaProps) {
  const [prog, setProg] = useState<Progresso>(() => inicial ?? (persistir ? lerProgresso() : { ...INICIO }));
  const progRef = useRef(prog);
  const reduzido = useRef(prefersReducedMotion()).current;
  const fim = useRef(false);
  const ultimoAvanco = useRef(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const ligRef = useRef(ligacoes);
  ligRef.current = ligacoes;

  const atualizar = useCallback((patch: Partial<Progresso>) => {
    const n = { ...progRef.current, ...patch };
    progRef.current = n;
    setProg(n);
    if (persistir) gravarProgresso(n);
  }, [persistir]);

  const terminar = useCallback(() => {
    if (fim.current) return;
    fim.current = true;
    if (persistir) limparProgresso();
    onDoneRef.current();
  }, [persistir]);

  const ir = useCallback((p: Posicao | null) => {
    ultimoAvanco.current = Date.now();
    if (!p) { terminar(); return; }
    atualizar({ cena: p.cena, quadro: p.quadro });
  }, [atualizar, terminar]);

  /** Avança um quadro, ignorando o segundo toque do duplo toque. */
  const avancar = useCallback(() => {
    if (Date.now() - ultimoAvanco.current < TEMPOS.antiDuploMs) return;
    ir(proxima(progRef.current));
  }, [ir]);
  /** Avanço por timer ou por fim de etapa: nunca é duplo toque. */
  const seguir = useCallback(() => ir(proxima(progRef.current)), [ir]);

  const q = quadroEm(prog);
  useEffect(() => { if (!q) terminar(); }, [q, terminar]);
  if (!q) return null;

  const l = ligacoes;
  const posKey = `${prog.cena}:${prog.quadro}`;

  let corpo: ReactNode;
  switch (q.tipo) {
    case 'preto': corpo = <CenaPreto key={posKey} q={q} language={language} onAvancar={avancar} />; break;
    case 'olho': corpo = <CenaOlho key={posKey} q={q} language={language} reduzido={reduzido} onAvancar={avancar} />; break;
    case 'cena': corpo = <CenaQuadro key={posKey} q={q} language={language} reduzido={reduzido} onAvancar={avancar} />; break;
    case 'tunel':
      corpo = <TunelAuto key={posKey} ms={q.ms} reduzido={reduzido} aria={tx(q.aria, language)} onFim={seguir} />;
      break;
    case 'cristal': corpo = <CenaCristal key={posKey} language={language} reduzido={reduzido} onFim={seguir} />; break;
    case 'fade': corpo = <CenaFade key={posKey} onFim={() => ir(null)} />; break;
    case 'slot':
      switch (q.slot) {
        case 'tarefa':
          corpo = (
            <EtapaTarefa key={posKey} language={language} tasks={l.tasks} tarefaId={prog.tarefaId}
              onCreateTask={l.onCreateTask} onCompleteTask={l.onCompleteTask}
              onTarefa={(id) => atualizar({ tarefaId: id })} onDone={seguir} />
          );
          break;
        case 'alimentar':
          corpo = <SlotAlimentar key={posKey} language={language} l={l} jaAlimentou={prog.alimentou === true}
            onAlimentou={() => atualizar({ alimentou: true })} onDone={seguir} />;
          break;
        case 'duelo': corpo = <EtapaDuelo key={posKey} language={language} playerSprite={l.spriteUrl} onDone={seguir} />; break;
        case 'corda': corpo = <EtapaCorda key={posKey} language={language} onDone={seguir} />; break;
      }
      break;
  }

  const podePular = !ehInterativo(q) && q.tipo !== 'fade';
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', color: '#f2f2f2', zIndex: 1000, overflow: 'hidden' }}
      data-testid="intro-narrativa" data-cena={prog.cena} data-quadro={prog.quadro} data-tipo={q.tipo}>
      <p aria-live="polite" data-testid="intro-aria" style={srOnly}>{tx(q.aria, language)}</p>
      {corpo}
      {podePular && (
        <button type="button" onClick={() => ir(aposPular(progRef.current))}
          style={{ position: 'absolute', top: 12, right: 12, zIndex: 6, minHeight: 44, minWidth: 44, padding: '0 16px', background: '#1d2b2f', color: '#f2f2f2', border: '1px solid #4a6068', borderRadius: 6, fontSize: 'var(--sm2-text-md)', opacity: 0.85 }}>
          {tx(UI.pular, language)}
        </button>
      )}
    </div>
  );
}

/** Quadro do túnel: canvas + avanço automático depois de `ms` (a narração em texto vai no aria do canvas). */
function TunelAuto({ ms, reduzido, aria, onFim }: { ms: number; reduzido: boolean; aria: string; onFim: () => void }) {
  useDepois(onFim, ms, 'tunel');
  return <div style={{ position: 'absolute', inset: 0 }} data-testid="intro-tunel"><TunelCanvas aria={aria} reduzido={reduzido} /></div>;
}

export type { Posicao, Progresso };

/**
 * "Rever a história" das Configurações: as mesmas cenas e etapas, mas com tarefas e comida num estado LOCAL e
 * sem ler nem gravar o progresso guardado. Rever nunca mexe no save (nem conclui tarefa, nem gasta comida).
 */
export function IntroRevisao({ language, ligacoes, onDone }: { language: Language; ligacoes: Pick<LigacoesIntro, 'spriteUrl' | 'petName'>; onDone: () => void }) {
  const [tasks, setTasks] = useState<TarefaMin[]>([]);
  const n = useRef(0);
  const lig: LigacoesIntro = {
    ...ligacoes,
    tasks,
    onCreateTask: (item) => { const id = `revisao-${n.current++}`; setTasks(t => [...t, { id, name: item.name, completed: false }]); return id; },
    onCompleteTask: (id) => setTasks(t => t.map(x => (x.id === id ? { ...x, completed: true } : x))),
    foodInventory: {},
    onFeed: () => {},
  };
  return <IntroNarrativa language={language} ligacoes={lig} onDone={onDone} persistir={false} />;
}
