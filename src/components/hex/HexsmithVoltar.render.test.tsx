// @vitest-environment jsdom
/**
 * Spec do dono (16/11/2026, 16.2): o modal PRINCIPAL da Hexsmith mantém o ✕ (fecha tudo); toda tela INTERNA (Porta, renomear,
 * confirmação do renomear) troca o ✕ por Voltar, que volta UM nível sem fechar o principal. Sem controle de fechar duplicado.
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
      it(`${t.nome}: tem Voltar, sem ✕ duplicado; Voltar volta ao mapa e o principal segue aberto`, async () => {
        abrir();
        await t.abre();
        expect(q(t.esperado)).toBeTruthy();
        const dlg = interno()!;
        expect(dlg).toBeTruthy();
        expect(dlg.querySelectorAll('[data-back-circle]')).toHaveLength(1);
        expect(fechaveis(dlg)).toHaveLength(0);
        // o ✕ do principal é o ÚNICO ✕ do conjunto (apagado enquanto a tela interna está por cima)
        const todos = document.querySelectorAll('[data-area-sheet-close]');
        expect(todos).toHaveLength(1);
        expect(todos[0].closest('[data-area-sheet]')).toBeTruthy();
        await click(dlg.querySelector('[data-back-circle]')!);
        expect(document.querySelector(t.esperado)).toBeNull();
        expect(document.querySelector('[data-area-sheet]')).toBeTruthy();
        expect(q('[data-hex-map]')).toBeTruthy();
        expect(onClosePrincipal).not.toHaveBeenCalled();
        // de volta ao mapa, o ✕ principal fecha tudo
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
      const dlg = interno()!;
      expect(dlg.querySelectorAll('[data-back-circle]')).toHaveLength(1);
      await click(dlg.querySelector('[data-back-circle]')!);
      expect(document.querySelector('[data-hex-rename-confirm]')).toBeNull();
      expect(q('[data-hex-rename-panel="pet"]')).toBeTruthy();
      await click(interno()!.querySelector('[data-back-circle]')!);
      expect(document.querySelector('[data-hex-rename-panel]')).toBeNull();
      expect(onClosePrincipal).not.toHaveBeenCalled();
    });
  });
}
