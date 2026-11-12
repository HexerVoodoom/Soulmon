import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { Icon } from './ui/Icon';
import { useBackLayer } from '../utils/backStack';
import './ChatPanel.css';

/**
 * Beta12 / C1 + C2 — o PAINEL do chat com o Soulmon.
 *
 * Só a casca visual: cabeçalho, lista de mensagens da sessão e o encaixe onde o
 * `ChatBox` põe a barra de digitar. Quem manda mensagem, grava memória e fala com
 * a IA continua sendo o `ChatBox`; aqui não há rede nem regra de chat.
 *
 * Dois modos:
 *  - `meia`  (C1): sobe até a METADE da tela, cobrindo a lista de tarefas. Fechar
 *    à esquerda, maximizar à direita (seta para cima).
 *  - `cheia` (C2): tela cheia, com o sprite do Soulmon no canto superior
 *    esquerdo e o botão de fechar. A seta à direita volta para a meia tela.
 *
 * Os ícones são os que já existem no subset da fonte (`close`, `expand_less`,
 * `expand_more`): nada de glifo novo, então a fonte não muda.
 */

export type ChatModo = 'barra' | 'meia' | 'cheia';

export interface ChatMsg {
  id: number;
  de: 'user' | 'pet';
  texto: string;
}

/** Quantas mensagens a tela guarda e mostra (decisão do dono, 11/11/2026, §F.11). */
export const CHAT_MSGS_VISIVEIS = 20;

/**
 * Altura/posição da área realmente visível. No Android (Capacitor) o teclado
 * redimensiona a viewport; no iOS ele só a cobre. `visualViewport` cobre os dois:
 * `bottom` é o quanto o teclado come embaixo do viewport de layout.
 */
function useAreaVisivel() {
  const ler = () => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null;
    const altura = vv?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 600);
    const topo = vv?.offsetTop ?? 0;
    const inner = typeof window !== 'undefined' ? window.innerHeight : altura;
    return { altura, topo, baixo: Math.max(0, Math.round(inner - (altura + topo))) };
  };
  const [area, setArea] = useState(ler);
  useEffect(() => {
    const vv = window.visualViewport;
    const atualiza = () => setArea(ler());
    vv?.addEventListener('resize', atualiza);
    vv?.addEventListener('scroll', atualiza);
    window.addEventListener('resize', atualiza);
    atualiza();
    return () => {
      vv?.removeEventListener('resize', atualiza);
      vv?.removeEventListener('scroll', atualiza);
      window.removeEventListener('resize', atualiza);
    };
  }, []);
  return area;
}

interface ChatPanelProps {
  modo: Exclude<ChatModo, 'barra'>;
  msgs: ChatMsg[];
  petName: string;
  spriteSrc?: string;
  isPt: boolean;
  carregando: boolean;
  onFechar: () => void;
  onMaximizar: () => void;
  onRestaurar: () => void;
  /** Onde o `ChatBox` encaixa a barra (campo, microfone, cartões de ação). */
  slotRef: RefObject<HTMLDivElement | null>;
}

export function ChatPanel({ modo, msgs, petName, spriteSrc, isPt, carregando, onFechar, onMaximizar, onRestaurar, slotRef }: ChatPanelProps) {
  const area = useAreaVisivel();
  const listaRef = useRef<HTMLUListElement | null>(null);
  const cheia = modo === 'cheia';
  // BUG-05: botão voltar do Android — tela cheia → meia tela → fechado (mesma pilha das folhas/minijogos).
  useBackLayer(true, cheia ? onRestaurar : onFechar);

  // A última fala sempre à vista (também quando o teclado sobe e a área encolhe).
  useLayoutEffect(() => {
    const el = listaRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs, carregando, area.altura, modo]);

  const estilo = cheia
    ? { top: Math.round(area.topo), bottom: area.baixo }
    : { bottom: area.baixo, height: Math.round(area.altura * 0.5) };

  const rotuloFechar = isPt ? 'Fechar conversa' : 'Close chat';

  return (
    <section
      className={cheia ? 'sm3-chatpanel sm3-chatpanel-cheia' : 'sm3-chatpanel sm3-chatpanel-meia'}
      style={estilo}
      role={cheia ? 'dialog' : 'region'}
      aria-modal={cheia ? true : undefined}
      aria-label={isPt ? `Conversa com ${petName}` : `Chat with ${petName}`}
      data-chat-modo={modo}
      onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); onFechar(); } }}
    >
      <header className="sm3-chatpanel-topo">
        {cheia && spriteSrc && (
          <img className="sm3-chatpanel-sprite" src={spriteSrc} alt={petName} width={56} height={56} data-chat-sprite />
        )}
        <button type="button" className="sm3-chatpanel-btn" onClick={onFechar} aria-label={rotuloFechar} title={rotuloFechar} data-chat-fechar>
          <Icon name="close" size={24} tone="muted" />
        </button>
        <span className="sm3-chatpanel-titulo">{petName}</span>
        {cheia ? (
          <button
            type="button"
            className="sm3-chatpanel-btn"
            onClick={onRestaurar}
            aria-label={isPt ? 'Voltar para meia tela' : 'Back to half screen'}
            title={isPt ? 'Voltar para meia tela' : 'Back to half screen'}
            data-chat-restaurar
          >
            <Icon name="expand_more" size={24} tone="muted" />
          </button>
        ) : (
          <button
            type="button"
            className="sm3-chatpanel-btn"
            onClick={onMaximizar}
            aria-label={isPt ? 'Abrir em tela cheia' : 'Open full screen'}
            title={isPt ? 'Abrir em tela cheia' : 'Open full screen'}
            data-chat-maximizar
          >
            <Icon name="expand_less" size={24} tone="muted" />
          </button>
        )}
      </header>

      {/* O log: leitor de tela anuncia só o que CHEGA (`additions`), educadamente. */}
      <ul
        ref={listaRef}
        className="sm3-chatpanel-msgs"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        aria-label={isPt ? 'Mensagens da conversa' : 'Conversation messages'}
        data-chat-log
      >
        {msgs.length === 0 && (
          <li className="sm3-chatmsg-vazio">{isPt ? `Diga oi para ${petName}.` : `Say hi to ${petName}.`}</li>
        )}
        {msgs.map(m => (
          <li key={m.id} className={m.de === 'user' ? 'sm3-chatmsg sm3-chatmsg-user' : 'sm3-chatmsg sm3-chatmsg-pet'} data-chat-msg={m.de}>
            <span className="sm3-chatmsg-balao">{m.texto}</span>
          </li>
        ))}
      </ul>

      <div ref={slotRef} className="sm3-chatpanel-slot" />
    </section>
  );
}
