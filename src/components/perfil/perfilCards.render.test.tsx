// @vitest-environment jsdom
/** Perfil na Home: 3 cards (Perfil/Home/Widget) com imagem; Editar perfil: e-mail desabilitado, nickname salvo, nome do especial. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { SettingsPage } from '../SettingsPage';
import { ProfileEditor } from './ProfileEditor';
import { ThemeProvider } from '../../contexts/ThemeContext';

vi.mock('../../utils/community', async (orig) => ({
  ...(await orig<typeof import('../../utils/community')>()),
  reserveNickname: vi.fn(async () => ({ ok: true, name: 'x' })),
  getRank: vi.fn(async () => ({ rank: [] })),
}));

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: (q: string) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) });
});

const base = {
  saveId: 'abc', email: 'a@b.com', avatarId: null, equippedFrame: null, ownedFrames: [] as string[], petStage: 'rookie',
  onChangeAvatar() {}, onChangeFrame() {},
};

function renderSettings(language: 'pt-BR' | 'en-US') {
  const r = renderWithCss(
    <ThemeProvider>
      <SettingsPage useAI={false} onToggleAI={() => {}} language={language} onChangeLanguage={() => {}} onOpenGuide={() => {}} onOpenGlossary={() => {}}
        notificationsEnabled={false} onToggleNotifications={() => {}} onRestoreFromCloud={async () => true} onLoginWithEmail={async () => 'loaded' as const}
        profile={{
          ...base, totalXP: 0,
          editHome: { ownedFurniture: [], equippedDecor: {} as never, equippedBackground: null, ownedBackgrounds: [], onSave() {}, onOpenShop() {} },
          widgetFrames: { owned: [], selected: '', onSelect() {}, onBuy: async () => ({ ok: false, reason: 'x' }) },
        }} />
    </ThemeProvider>,
  );
  document.querySelectorAll<HTMLButtonElement>('[data-group-toggle][aria-expanded="false"]').forEach(b => fireEvent.click(b));
  return r;
}

describe('Perfil — 3 cards', () => {
  it('EN: Profile, Home e Widget, cada um com imagem e nome', () => {
    const r = renderSettings('en-US');
    const cards = r.container.querySelectorAll('[data-profile-cards] button');
    expect(cards.length).toBe(3);
    expect(Array.from(cards).map(c => c.textContent)).toEqual(['Profile', 'Home', 'Widget']);
    cards.forEach(c => expect(c.querySelector('img, [data-avatar], svg, span img, canvas, span > span')).toBeTruthy());
  });
  it('PT: Perfil/Home/Widget e o toque abre o editor de perfil', () => {
    const r = renderSettings('pt-BR');
    const cards = r.container.querySelectorAll('[data-profile-cards] button');
    expect(Array.from(cards).map(c => c.textContent)).toEqual(['Perfil', 'Home', 'Widget']);
    fireEvent.click(r.container.querySelector('[data-edit-profile]')!);
    expect(document.querySelector('[data-profile-editor]')).toBeTruthy();
  });
});

describe('Editar perfil', () => {
  it('e-mail desabilitado e fora da ordem de foco', () => {
    renderWithCss(<ProfileEditor open onClose={() => {}} language="en-US" {...base} />);
    const f = document.querySelector('[data-profile-email]') as HTMLInputElement;
    expect(f.disabled).toBe(true);
    expect(f.readOnly).toBe(true);
    expect(f.value).toBe('a@b.com');
  });
  it('apelido vem do nome já definido e salva reservando no servidor', async () => {
    const onChangeName = vi.fn();
    renderWithCss(<ProfileEditor open onClose={() => {}} language="en-US" {...base} userName="Ana" onChangeName={onChangeName} />);
    const f = document.getElementById('sm-profile-name') as HTMLInputElement;
    expect(f.value).toBe('Ana');
    fireEvent.change(f, { target: { value: 'Ana Maria' } });
    fireEvent.click(document.querySelector('[data-save-user-name]')!);
    await waitFor(() => expect(onChangeName).toHaveBeenCalledWith('Ana Maria'));
  });
  it('nome do especial e do Soulmon: só leitura, sem campo; a troca é na Hexsmith', () => {
    renderWithCss(<ProfileEditor open onClose={() => {}} language="pt-BR" {...base} petName="Brasa" especialNome="Raio Solar" />);
    expect(screen.getByText('Nome do seu especial')).toBeTruthy();
    expect(screen.getByText('Raio Solar')).toBeTruthy();
    expect(document.querySelector('[data-profile-pet-name-valor]')!.textContent).toBe('Brasa');
    expect(document.getElementById('especial-nome')).toBeNull();
    expect(document.getElementById('sm-profile-pet-name')).toBeNull();
    expect(document.querySelector('[data-save-pet-name]')).toBeNull();
    expect(document.querySelector('[data-especial-nome-salvar]')).toBeNull();
    expect(screen.getAllByText(/Troque na Hexsmith/i).length).toBeGreaterThanOrEqual(2);
  });
});
