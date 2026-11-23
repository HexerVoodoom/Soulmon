// @vitest-environment jsdom
/**
 * Spec do dono (16/11/2026, 16.2): o modal PRINCIPAL da Hexsmith mantém o ✕ (fecha tudo); toda tela INTERNA (Porta, renomear,
 * confirmação do renomear) tem Voltar que volta UM nível sem fechar o principal. 23/11/2026: o Voltar mora no medalhão ESQUERDO da moldura de aço (nunca no corpo) e o ✕ principal no DIREITO, ativo, fechando tudo.
 * Montado como em produção: `AreaSheet moldura="aco"` (✕ do principal) com a `HexsmithSheet` dentro, em 360/375/412 px.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, fireEvent, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../../test/renderEnv';
import { GameStateProvider } from '../../contexts/GameStateContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { HEX_SLOTS } from '../../utils/hexsmith';
import { ALL_ELEMENT_IDS } from '../../utils/elementDex';
import { closeTopBackLayer } from '../../utils/backStack';
import { AreaSheet } from '../nav/AreaSheet';
import HexsmithSheet from './HexsmithSheet';

vi.mock('../../utils/cloudSave', () => ({
  cloudHexForge: async () => ({ ok: false, kind: 'server' }),
  cloudHexRename: async () => ({ ok: false, kind: 'offline' }),
  cloudSave: () => Promise.resolve({ ok: true }),
  cloudSaveComRetry: () => Promise.resolve({ ok: true }),
  emailToSaveId: async () => 'x',
  adoptCloudSave: async () => false,
}));
vi.mock('../../utils/community', () => ({ pushProfile: () => Promise.resolve({ ok: true }) }));
vi.mock('sonner', () => ({ toast: { warning: () => {}, error: () => {}, success: () => {}, info: () => {} } }));

const onClosePrincipal = vi.fn();
function abrir() {
  localStorage.setItem(STORAGE_KEYS.SAVE_ID, 'a'.repeat(32));
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], soulmonMeta: { baseName: 'Fagulha' }, defeatedElements: [...ALL_ELEMENT_IDS], gamePoints: 1000 }));
  render(
    <GameStateProvider>
      <AreaSheet areaId="forja" lotId="hexsmith" language="pt-BR" title="Hexsmith" closeLabel="Fechar" open onClose={onClosePrincipal} moldura="aco">
        <HexsmithSheet language="pt-BR" sprite="/x.png" petElement="fogo" />
      </AreaSheet>
    </GameStateProvider>,
  );
}
const q = (sel: string) => document.querySelector<HTMLElement>(sel)!;
const click = async (el: Element) => act(async () => { fireEvent.click(el); await Promise.resolve(); });
const dialogos = () => Array.from(document.querySelectorAll('[role="dialog"]'));
const interno = () => dialogos().filter((d) => !d.hasAttribute('data-area-sheet')).pop() as HTMLElement | undefined;
const fechaveis = (root: ParentNode) => Array.from(root.querySelectorAll<HTMLElement>('button')).filter((b) => /^(fechar|close)$/i.test(b.getAttribute('aria-label') ?? ''));

const TELAS: Array<{ nome: string; abre: () => Promise<void>; esperado: string }> = [
  ...HEX_SLOTS.map((s) => ({ nome: `Porta ${s}`, abre: () => click(q(`[data-hex-slot="${s}"]`)), esperado: `[data-hex-panel="${s}"]` })),
  { nome: 'renomear Soulmon', abre: () => click(q('[data-hex-rename="pet"]')), esperado: '[data-hex-rename-panel="pet"]' },
  { nome: 'renomear especial', abre: () => click(q('[data-hex-rename="especial"]')), esperado: '[data-hex-rename-panel="especial"]' },
];

beforeEach(() => { installDomGlobals(); localStorage.clear(); onClosePrincipal.mockClear(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

for (const largura of [360, 375, 412]) {
  describe(`Hexsmith: Voltar nas telas internas a ${largura}px`, () => {
    beforeEach(() => { Object.defineProperty(window, 'innerWidth', { configurable: true, value: largura }); window.dispatchEvent(new Event('resize')); });

    it('principal: UM ✕, que fecha tudo', async () => {
      abrir();
      const x = document.querySelectorAll('[data-area-sheet-close]');
      expect(x).toHaveLength(1);
      await click(x[0]);
      expect(onClosePrincipal).toHaveBeenCalledTimes(1);
    });

    for (const t of TELAS) {
      it(`${t.nome}: Voltar no medalhão ESQUERDO (não no corpo), ✕ no DIREITO ativo; Voltar volta um nível`, async () => {
        abrir();
        await t.abre();
        expect(q(t.esperado)).toBeTruthy();
        const dlg = interno()!;
        expect(dlg).toBeTruthy();
        // nenhuma seta no corpo nem controle de fechar dentro da tela interna
        expect(document.querySelectorAll('[data-back-circle]')).toHaveLength(0);
        expect(dlg.querySelectorAll('[data-aco-voltar]')).toHaveLength(0);
        expect(fechaveis(dlg)).toHaveLength(0);
        // Voltar: UM, no medalhão esquerdo da moldura
        const voltar = document.querySelectorAll<HTMLElement>('[data-aco-voltar]');
        expect(voltar).toHaveLength(1);
        expect(voltar[0].closest('[data-area-sheet]')).toBeTruthy();
        expect(dlg.contains(voltar[0])).toBe(false);
        expect(voltar[0].getAttribute('aria-label')).toBe('Voltar');
        expect(voltar[0].hasAttribute('disabled')).toBe(false);
        // ✕ principal: UM, no medalhão direito, visível e ativo
        const todos = document.querySelectorAll<HTMLElement>('[data-area-sheet-close]');
        expect(todos).toHaveLength(1);
        expect(todos[0].classList.contains('sm2-moldura-aco__fechar--dir')).toBe(true);
        expect(todos[0].hasAttribute('disabled')).toBe(false);
        expect(todos[0].hasAttribute('data-modal-dimmed')).toBe(false);
        expect(dlg.contains(todos[0])).toBe(false);
        await click(voltar[0]);
        expect(document.querySelector(t.esperado)).toBeNull();
        expect(document.querySelector('[data-area-sheet]')).toBeTruthy();
        expect(q('[data-hex-map]')).toBeTruthy();
        expect(onClosePrincipal).not.toHaveBeenCalled();
        expect(document.querySelector('[data-aco-voltar]')).toBeNull();
        // de volta ao mapa, o ✕ principal fecha tudo
        await click(document.querySelector('[data-area-sheet-close]')!);
        expect(onClosePrincipal).toHaveBeenCalledTimes(1);
      });

      it(`${t.nome}: o ✕ do medalhão direito fecha o fluxo inteiro`, async () => {
        abrir();
        await t.abre();
        await click(document.querySelector('[data-area-sheet-close]')!);
        expect(onClosePrincipal).toHaveBeenCalledTimes(1);
      });

      it(`${t.nome}: o voltar do sistema desfaz só a tela interna`, async () => {
        abrir();
        await t.abre();
        await act(async () => { closeTopBackLayer(); });
        expect(document.querySelector(t.esperado)).toBeNull();
        expect(q('[data-hex-map]')).toBeTruthy();
        expect(onClosePrincipal).not.toHaveBeenCalled();
        await act(async () => { closeTopBackLayer(); });
        expect(onClosePrincipal).toHaveBeenCalledTimes(1);
      });
    }

    it('renomear, na confirmação: Voltar volta ao campo (não ao mapa) e o segundo Voltar volta ao mapa', async () => {
      abrir();
      await click(q('[data-hex-rename="pet"]'));
      await act(async () => { fireEvent.change(q('#hex-rename-input'), { target: { value: 'Brasa' } }); });
      await click(q('[data-hex-rename-go]'));
      expect(q('[data-hex-rename-confirm]')).toBeTruthy();
      expect(document.querySelectorAll('[data-back-circle]')).toHaveLength(0);
      expect(document.querySelectorAll('[data-aco-voltar]')).toHaveLength(1);
      await click(q('[data-aco-voltar]'));
      expect(document.querySelector('[data-hex-rename-confirm]')).toBeNull();
      expect(q('[data-hex-rename-panel="pet"]')).toBeTruthy();
      await click(q('[data-aco-voltar]'));
      expect(document.querySelector('[data-hex-rename-panel]')).toBeNull();
      expect(onClosePrincipal).not.toHaveBeenCalled();
    });
  });
}
