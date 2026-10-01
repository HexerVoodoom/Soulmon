import { useId, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { EarningGameProps } from './types';
import { sm2Button, sm2Hint, sm2Label, sm2Text, SM2_SHADOW_CARD } from '../form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, phaseTitle, phaseLine } from '../games/GameKit';
import { ATELIE_SCENE } from '../../utils/visorScenes';
import { getSpriteForStage } from '../../utils/sprites';
import {
  REVIEW_MAX_CARDS, REVIEW_TEXT_MAX, addCard, editCard, removeCard, dueCards, answerCard,
  completeSession, type ReviewCard, type ReviewState,
} from '../../utils/mente/revisao';

/**
 * REVISÃO DA MALHA (`docs/BENCHMARK-MINIJOGOS.md` §6.1) — o pet pergunta os
 * cartões do PRÓPRIO jogador, na ordem de Leitner (`utils/mente/revisao.ts`,
 * dono único da regra; aqui só se aplica).
 *
 * Nasce MUDO (R-NOVA). Sem vermelho, sem "errou", sem "faltam"/"atrasado":
 * "Ainda não" tem a MESMA tinta de "Lembrei". A copy DESCREVE a técnica, não
 * promete efeito. Texto do jogador é sempre texto puro (nunca HTML).
 */

type Screen = 'home' | 'list' | 'form' | 'session' | 'done';

function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return c?.randomUUID?.() ?? `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const areaStyle: CSSProperties = {
  width: '100%', boxSizing: 'border-box', minHeight: 88, resize: 'vertical',
  padding: '10px 12px', borderRadius: 'var(--sm2-radius-md)',
  border: '1px solid var(--sm2-muted)', backgroundColor: 'var(--sm2-surface-2)',
  fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-md)', lineHeight: 'var(--sm2-leading-body)',
  color: 'var(--sm2-ink)',
};

const panel: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 8, padding: 12, boxSizing: 'border-box',
  backgroundColor: 'var(--sm2-surface)', border: '1px solid var(--sm2-line)',
  borderRadius: 'var(--sm2-radius-md)', boxShadow: SM2_SHADOW_CARD,
};

// Texto do jogador: quebra palavra longa, preserva as quebras de linha.
const userText: CSSProperties = { ...sm2Text, margin: 0, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' };

export function RevisaoGame({
  language, evolutionStage, demoCharacterId, onExit, onEarnPoints, review, onReviewChange, todayKey,
}: EarningGameProps & { review: ReviewState; onReviewChange: (next: ReviewState) => void; todayKey: string }) {
  const isPt = language === 'pt-BR';
  const [screen, setScreen] = useState<Screen>('home');
  // Formulário (novo ou edição).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  // Sessão: a fila é FOTOGRAFADA no começo; o estado de trabalho vive no ref
  // para não depender de o pai re-renderizar entre uma resposta e outra.
  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [earned, setEarned] = useState(0);
  const working = useRef<ReviewState>(review);
  const frontId = useId();
  const backId = useId();

  const due = dueCards(review, todayKey);
  const sprite = getSpriteForStage(evolutionStage, demoCharacterId);
  const explain = isPt
    ? 'Revisar no intervalo certo ajuda a lembrar: o que você lembra volta mais tarde, o que não lembra volta amanhã.'
    : 'Reviewing at the right interval helps you remember: what you remember comes back later, what you don’t comes back tomorrow.';

  const openForm = (card?: ReviewCard) => {
    setEditingId(card?.id ?? null);
    setFront(card?.front ?? '');
    setBack(card?.back ?? '');
    setScreen('form');
  };

  const saveForm = () => {
    const next = editingId
      ? editCard(review, editingId, front, back)
      : addCard(review, front, back, todayKey, newId());
    if (next !== review) onReviewChange(next);
    setScreen('list');
  };

  const start = () => {
    if (due.length === 0) return;
    working.current = review;
    setQueue(due);
    setIndex(0);
    setRevealed(false);
    setEarned(0);
    setScreen('session');
  };

  const answer = (remembered: boolean) => {
    const card = queue[index];
    if (!card) return;
    let next = answerCard(working.current, card.id, remembered, todayKey);
    const last = index + 1 >= queue.length;
    if (last) {
      const done = completeSession(next, todayKey);
      next = done.state;
      working.current = next;
      onReviewChange(next);
      if (done.bits > 0) onEarnPoints(done.bits);
      setEarned(done.bits);
      setScreen('done');
      return;
    }
    working.current = next;
    // Grava a cada resposta: sair no meio não perde o que já foi respondido.
    onReviewChange(next);
    setIndex(index + 1);
    setRevealed(false);
  };

  const title = isPt ? 'Revisão da Malha' : 'Mesh Review';
  const closeLabel = isPt ? 'Sair' : 'Exit';

  const petVisor = (
    <GameVisor height={72} scene={ATELIE_SCENE}>
      <VisorSprite src={sprite} data-visor-pet style={{ left: 'calc(50% - 64px)', top: 8 }} />
    </GameVisor>
  );

  // ---- (a) início ----
  if (screen === 'home') {
    return (
      <GameRoot>
        <GameHeader title={title} sub={explain} closeLabel={closeLabel} onClose={onExit} />
        {petVisor}
        <p role="status" data-revisao-due style={phaseTitle}>
          {due.length === 0
            ? (isPt ? 'Nada para revisar hoje — volte amanhã, ou adicione cartões.' : 'Nothing to review today — come back tomorrow, or add cards.')
            : isPt
              ? `${due.length} ${due.length === 1 ? 'cartão' : 'cartões'} para hoje`
              : `${due.length} ${due.length === 1 ? 'card' : 'cards'} for today`}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {due.length > 0 && (
            <button type="button" data-revisao-start onClick={start} style={sm2Button('primary')}>
              {isPt ? 'Começar' : 'Start'}
            </button>
          )}
          <button type="button" data-revisao-cards onClick={() => setScreen('list')} style={sm2Button('outline')}>
            {isPt ? 'Meus cartões' : 'My cards'}
          </button>
        </div>
      </GameRoot>
    );
  }

  // ---- (b) lista ----
  if (screen === 'list') {
    const full = review.cards.length >= REVIEW_MAX_CARDS;
    return (
      <GameRoot>
        <GameHeader
          title={isPt ? 'Meus cartões' : 'My cards'}
          sub={isPt ? `${review.cards.length} de até ${REVIEW_MAX_CARDS}` : `${review.cards.length} of up to ${REVIEW_MAX_CARDS}`}
          closeLabel={closeLabel}
          onClose={onExit}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={() => setScreen('home')} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0 }}>
            {isPt ? 'Voltar' : 'Back'}
          </button>
          <button type="button" data-revisao-new disabled={full} onClick={() => openForm()} style={{ ...sm2Button('primary', full), flex: 1, minWidth: 0 }}>
            {isPt ? 'Novo cartão' : 'New card'}
          </button>
        </div>
        {full && <p style={sm2Hint}>{isPt ? 'A pasta está cheia. Apague um cartão para abrir espaço.' : 'Your deck is full. Delete a card to make room.'}</p>}
        {review.cards.length === 0 ? (
          <p style={phaseLine}>
            {isPt ? 'Nenhum cartão ainda. Escreva uma pergunta e a resposta — o que você quiser lembrar.' : 'No cards yet. Write a question and its answer — anything you want to remember.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {review.cards.map(c => (
              <li key={c.id} data-revisao-card={c.id} style={panel}>
                <p style={userText}>{c.front}</p>
                <p style={{ ...userText, color: 'var(--sm2-muted)' }}>{c.back}</p>
                {confirmDelete === c.id ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                    <span style={{ ...sm2Text, flex: '1 1 100%' }}>{isPt ? 'Apagar este cartão?' : 'Delete this card?'}</span>
                    <button
                      type="button"
                      data-revisao-delete-confirm
                      onClick={() => { onReviewChange(removeCard(review, c.id)); setConfirmDelete(null); }}
                      style={{ ...sm2Button('outline', false, 'sm'), flex: 1 }}
                    >
                      {isPt ? 'Apagar' : 'Delete'}
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(null)} style={{ ...sm2Button('quiet', false, 'sm'), flex: 1 }}>
                      {isPt ? 'Cancelar' : 'Cancel'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => openForm(c)} style={sm2Button('ghost', false, 'sm')}>
                      {isPt ? 'Editar' : 'Edit'}
                    </button>
                    <button type="button" data-revisao-delete onClick={() => setConfirmDelete(c.id)} style={sm2Button('quiet', false, 'sm')}>
                      {isPt ? 'Apagar' : 'Delete'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </GameRoot>
    );
  }

  // ---- (b') formulário ----
  if (screen === 'form') {
    const ok = front.trim().length > 0 && back.trim().length > 0;
    return (
      <GameRoot>
        <GameHeader
          title={editingId ? (isPt ? 'Editar cartão' : 'Edit card') : (isPt ? 'Novo cartão' : 'New card')}
          closeLabel={closeLabel}
          onClose={onExit}
        />
        <form
          onSubmit={(e) => { e.preventDefault(); if (ok) saveForm(); }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div>
            <label htmlFor={frontId} style={sm2Label}>{isPt ? 'Pergunta (frente)' : 'Question (front)'}</label>
            <textarea id={frontId} data-revisao-front value={front} maxLength={REVIEW_TEXT_MAX} onChange={e => setFront(e.target.value)} style={areaStyle} />
            <p style={{ ...sm2Hint, textAlign: 'right' }} className="sm2-num">{front.length}/{REVIEW_TEXT_MAX}</p>
          </div>
          <div>
            <label htmlFor={backId} style={sm2Label}>{isPt ? 'Resposta (verso)' : 'Answer (back)'}</label>
            <textarea id={backId} data-revisao-back value={back} maxLength={REVIEW_TEXT_MAX} onChange={e => setBack(e.target.value)} style={areaStyle} />
            <p style={{ ...sm2Hint, textAlign: 'right' }} className="sm2-num">{back.length}/{REVIEW_TEXT_MAX}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setScreen('list')} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0 }}>
              {isPt ? 'Cancelar' : 'Cancel'}
            </button>
            <button type="submit" data-revisao-save disabled={!ok} style={{ ...sm2Button('primary', !ok), flex: 1, minWidth: 0 }}>
              {isPt ? 'Salvar' : 'Save'}
            </button>
          </div>
        </form>
      </GameRoot>
    );
  }

  // ---- (c) sessão ----
  if (screen === 'session') {
    const card = queue[index];
    return (
      <GameRoot>
        <GameHeader
          run
          title={title}
          sub={isPt ? `Cartão ${index + 1} de ${queue.length}` : `Card ${index + 1} of ${queue.length}`}
          closeLabel={closeLabel}
          onClose={onExit}
        />
        {petVisor}
        {card && (
          <div style={panel} aria-live="polite">
            <p style={sm2Hint}>{isPt ? 'Seu Soulmon pergunta:' : 'Your Soulmon asks:'}</p>
            <p data-revisao-q style={{ ...userText, fontSize: 'var(--sm2-text-md)', fontWeight: 500 }}>{card.front}</p>
            {revealed && (
              <>
                <p style={sm2Hint}>{isPt ? 'Resposta:' : 'Answer:'}</p>
                <p data-revisao-a style={userText}>{card.back}</p>
              </>
            )}
          </div>
        )}
        {!revealed ? (
          <button type="button" data-revisao-reveal onClick={() => setRevealed(true)} style={sm2Button('primary')}>
            {isPt ? 'Mostrar resposta' : 'Show answer'}
          </button>
        ) : (
          // Mesma tinta nos dois: "ainda não" é informação, não erro.
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" data-revisao-yes onClick={() => answer(true)} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Lembrei' : 'I remembered'}
            </button>
            <button type="button" data-revisao-no onClick={() => answer(false)} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Ainda não' : 'Not yet'}
            </button>
          </div>
        )}
      </GameRoot>
    );
  }

  // ---- fim ----
  return (
    <GameRoot>
      <GameHeader title={title} closeLabel={closeLabel} onClose={onExit} />
      {petVisor}
      <div role="status" data-revisao-done style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <p style={phaseTitle}>{isPt ? 'Revisão feita.' : 'Review done.'}</p>
        <p style={phaseLine}>
          {isPt ? 'O que você lembrou volta mais tarde; o resto volta amanhã.' : 'What you remembered comes back later; the rest comes back tomorrow.'}
        </p>
        {earned > 0 && <p className="sm2-num" style={phaseLine}>+{earned} Bits</p>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setScreen('home')} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0 }}>
          {isPt ? 'Voltar' : 'Back'}
        </button>
        <button type="button" onClick={onExit} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0 }}>
          {isPt ? 'Sair' : 'Exit'}
        </button>
      </div>
    </GameRoot>
  );
}
