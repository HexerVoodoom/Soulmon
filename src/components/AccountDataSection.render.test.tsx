// @vitest-environment jsdom
/**
 * Teste de render da seção SEUS DADOS.
 *
 * O que este arquivo trava, e por quê:
 *
 * 1. **503 é explicação, não erro.** As rotas de conta são fail-closed
 *    enquanto o login não existe. Se um dia alguém "consertar" isso
 *    devolvendo um erro genérico, a tela passa a acusar o usuário de um
 *    problema que é do produto. O caso exige o texto do motivo E os botões
 *    desabilitados.
 * 2. **Dois passos, com inventário no meio.** Confirmar sem ver o que some é
 *    a única forma de dark pattern que ainda cabia aqui.
 * 3. **O que SOBREVIVE aparece.** O `ord:` sobrevive por decisão do dono; a
 *    tela diz isso antes da confirmação, não depois.
 * 4. **Token vencido (15 min) tem tela própria** — 409 não pode virar "erro".
 * 5. **`naoIncluido` na TELA**, não só dentro do arquivo baixado.
 * 6. **PT-BR e EN**, e os dois conjuntos diferem de fato.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { AccountDataSection } from './AccountDataSection';

const NOT_INCLUDED = [
  {
    what: 'soulmon-profile (localStorage)',
    'pt-BR': 'Seu perfil psicométrico e sua data de nascimento NUNCA são enviados ao servidor.',
    en: 'Your psychometric profile and your date of birth are NEVER sent to the server.',
  },
];

const PLAN = {
  apaga: ['abc123 (save)', 'profile:abc123'],
  minimiza: ['ent:abc123 — sai o uso, ficam os campos de compra'],
  sobrevive: ['ord:GPA.1234'],
};

const DELETE_REQUEST = {
  confirmToken: 'deadbeef',
  expiresInSeconds: 900,
  plano: PLAN,
  naoIncluido: NOT_INCLUDED,
  aviso: { 'pt-BR': 'Está tudo pronto para apagar.', en: 'Everything is ready to be erased.' },
  prazo: { 'pt-BR': 'Sem pressa: este pedido vale por 15 minutos.', en: 'No rush: this request is valid for 15 minutes.' },
};

/** Uma resposta de `fetch` suficiente para o cliente de `accountData.ts`. */
function reply(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('AccountDataSection — indisponível (503) é estado, não falha', () => {
  it('sem login configurado: mostra o motivo e não deixa o botão disparar erro', () => {
    renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable={false} />);
    expect(screen.getByText(/Ainda não disponível/)).toBeTruthy();
    expect(screen.getByText(/liga junto com o login/)).toBeTruthy();
    // Não é culpa de quem está lendo, e isso está escrito.
    expect(screen.getByText(/Não é nada que você fez/)).toBeTruthy();
    for (const label of [/Baixar meus dados/, /Apagar minha conta/]) {
      const btn = screen.getByRole('button', { name: label }) as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    }
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(0);
  });

  it('503 vindo do servidor com a tela disponível: vira explicação, não vermelho de erro', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(
      reply(503, { error: 'auth-unavailable', aviso: { 'pt-BR': 'Esta função ainda não está disponível — ela liga junto com o login.', en: 'Not available yet.' } }),
    );
    renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Baixar meus dados/ }));
    const msg = await screen.findByText(/ainda não está disponível/);
    expect(msg.style.color).not.toContain('danger');
  });
});

describe('AccountDataSection — exclusão em dois passos', () => {
  it('pedir mostra o inventário (some / fica / SOBREVIVE) antes de qualquer confirmação', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(reply(200, DELETE_REQUEST));
    renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Apagar minha conta/ }));

    expect(await screen.findByText(/Some para sempre/)).toBeTruthy();
    expect(screen.getByText('abc123 (save)')).toBeTruthy();
    expect(screen.getByText(/Continua existindo/)).toBeTruthy();
    expect(screen.getByText('ord:GPA.1234')).toBeTruthy();
    // K6: as explicações moram atrás do "?" — abre o do bloco que sobrevive.
    fireEvent.click(screen.getByRole('button', { name: /Sobre: Continua existindo/ }));
    expect(screen.getByText(/restaurar a compra/)).toBeTruthy();
    expect(screen.getByText(/vale por 15 minutos/)).toBeTruthy();
    // O `naoIncluido` também aqui: quem apaga precisa saber o que não é alcançado.
    fireEvent.click(screen.getAllByRole('button', { name: /Por que não está aqui/ })[0]);
    expect(screen.getByText(/NUNCA são enviados ao servidor/)).toBeTruthy();
    // Só o segundo passo apaga: nenhuma chamada de confirmação saiu sozinha.
    const calls = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls.every(c => !String(c[0]).includes('delete-confirm'))).toBe(true);
  });

  it('sem dark pattern: a saída é clara e o "Voltar" é o botão quieto', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(reply(200, DELETE_REQUEST));
    renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Apagar minha conta/ }));
    const back = await screen.findByRole('button', { name: /Voltar/ });
    // Quieto = sem preenchimento e sem borda. Nada de cancelar destacado.
    // (jsdom expande `border: none` em width/style/color; a leitura confiável
    // é o `border-style`.)
    expect(back.style.borderStyle).toBe('none');
    expect(back.style.background).toBe('none');
    // E o "Apagar agora" é `outline` (canvas Conta D-K6): perda irreversível
    // nunca em primário, nunca no acento de perigo — e nunca quieto como o
    // "Voltar", que é o oposto do padrão escuro.
    const confirm = screen.getByRole('button', { name: /Apagar agora/ });
    expect(confirm.style.border).toContain('--sm2-muted');
    expect(confirm.style.border).not.toContain('danger');
    expect(confirm.style.backgroundColor).toContain('--sm2-surface');
    // E nenhum sermão de "tem certeza? você vai perder tudo".
    expect(screen.queryByText(/tem certeza/i)).toBeNull();
    expect(screen.queryByText(/perder tudo/i)).toBeNull();
  });

  it('confirmar com o token executa e devolve uma despedida, não um aviso', async () => {
    const f = globalThis.fetch as ReturnType<typeof vi.fn>;
    f.mockImplementation(async (url: string) => (String(url).includes('delete-confirm')
      ? reply(200, {
        ok: true,
        executado: { ...PLAN, listasDeAmigosLimpas: 2 },
        naoIncluido: NOT_INCLUDED,
        aviso: { 'pt-BR': 'Pronto, apagamos. Obrigado pelo tempo que você passou aqui.', en: 'Done, it is erased.' },
      })
      : reply(200, DELETE_REQUEST)));

    renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Apagar minha conta/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Apagar agora/ }));

    expect(await screen.findByText(/Obrigado pelo tempo/)).toBeTruthy();
    const confirmCall = f.mock.calls.find(c => String(c[0]).includes('delete-confirm'));
    expect(confirmCall).toBeTruthy();
    expect(JSON.parse(String(confirmCall![1].body)).confirmToken).toBe('deadbeef');
  });

  it('token vencido (409) tem tela própria: convida a pedir de novo, sem culpar', async () => {
    const f = globalThis.fetch as ReturnType<typeof vi.fn>;
    f.mockImplementation(async (url: string) => (String(url).includes('delete-confirm')
      ? reply(409, { error: 'confirmation-required' })
      : reply(200, DELETE_REQUEST)));

    renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Apagar minha conta/ }));
    fireEvent.click(await screen.findByRole('button', { name: /Apagar agora/ }));

    expect(await screen.findByText(/Este pedido venceu/)).toBeTruthy();
    // Volta ao passo 1, com o pedido disponível de novo.
    await waitFor(() => expect(screen.getByRole('button', { name: /Apagar minha conta/ })).toBeTruthy());
  });

  it('rede caída: diz que nada foi alterado e deixa tentar de novo', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new TypeError('offline'));
    renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Apagar minha conta/ }));
    expect(await screen.findByText(/Nada foi alterado/)).toBeTruthy();
    expect((screen.getByRole('button', { name: /Apagar minha conta/ }) as HTMLButtonElement).disabled).toBe(false);
  });
});

describe('AccountDataSection — exportação', () => {
  it('mostra o `naoIncluido` NA TELA, não só dentro do arquivo', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(reply(200, {
      format: 'soulmon.account-export/1',
      generatedAt: '2026-08-25T00:00:00.000Z',
      account: { saveId: 'abc123', publicId: 'pub' },
      aviso: { 'pt-BR': 'Isto é tudo que o Soulmon guarda de você.', en: 'This is everything Soulmon keeps about you.' },
      data: {},
      naoIncluido: NOT_INCLUDED,
    }));
    renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Baixar meus dados/ }));
    expect(await screen.findByText(/O que NÃO está aqui/)).toBeTruthy();
    fireEvent.click(screen.getAllByRole('button', { name: /Por que não está aqui/ })[0]);
    expect(screen.getByText(/NUNCA são enviados ao servidor/)).toBeTruthy();
    expect(screen.getByText('soulmon-profile (localStorage)')).toBeTruthy();
  });
});

describe('AccountDataSection — PT-BR e EN', () => {
  it('os dois idiomas existem e diferem, no estado indisponível e no inventário', async () => {
    const pt = renderWithCss(<AccountDataSection language="pt-BR" saveId="abc123" authAvailable={false} />);
    expect(pt.container.textContent).toContain('Ainda não disponível');
    pt.unmount();

    const en = renderWithCss(<AccountDataSection language="en-US" saveId="abc123" authAvailable={false} />);
    expect(en.container.textContent).toContain('Not available yet');
    expect(en.container.textContent).not.toContain('Ainda não disponível');
    expect(en.container.textContent).toContain('Download my data');
    expect(en.container.textContent).toContain('Delete my account');
    en.unmount();

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValue(reply(200, DELETE_REQUEST));
    renderWithCss(<AccountDataSection language="en-US" saveId="abc123" authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Delete my account/ }));
    expect(await screen.findByText(/Stays around/)).toBeTruthy();
    expect(screen.getByText(/No rush/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Erase now/ })).toBeTruthy();
  });
});
