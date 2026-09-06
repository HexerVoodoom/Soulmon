/**
 * WP3.9 (decisão D16, parcial) — a ponte de ajuda do chat.
 *
 * O chat passa por uma IA e o WP3.1 quer dar memória a ele. O corpus é direto:
 * memória aumenta a projeção (efeito ELIZA) sem aumentar o amparo. Um bichinho
 * que parece lembrar de você é um bichinho para quem se conta coisa — e algumas
 * dessas coisas não podem terminar numa resposta gerada por um modelo pequeno
 * otimizado para ser fofo.
 *
 * ─── A metade mais importante deste arquivo é o FALSO POSITIVO ────────────
 * Responder com o CVV a quem escreveu "tô morrendo de rir" seria grotesco, e
 * pior: ensinaria a pessoa a nunca mais falar sério com o pet. Por isso metade
 * dos casos aqui testa o que NÃO pode disparar. A régua não é pegar tudo — é
 * não errar para mais.
 *
 * E a linha que não aparece em nenhuma asserção porque é uma AUSÊNCIA: a frase
 * que casou nunca é enviada, nunca é gravada e nunca vira telemetria. Medir
 * "quantas pessoas escreveram isso" transformaria o pior momento de alguém em
 * métrica de produto. O guard de fiação no fim cuida disso.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { needsBridge, bridgeReply, chatSafetyDecision } from './chatSafety';

describe('a ponte NÃO dispara no que é linguagem comum', () => {
  const inocentes = [
    'tô morrendo de rir com isso',
    'morrendo de fome, vou comer',
    'to morrendo de sono hoje',
    'vou matar a fome primeiro',
    'matei a saudade da minha vó',
    'esse frio me mata',
    'me mata de rir esse pet',
    "i'm dying of laughter",
    'dead tired today',
    'killing time until the meeting',
    'i could kill for a coffee',
    'preciso matar a charada desse bug',
    // O caso que quebrou a primeira versão do léxico: em português o
    // COMPLEMENTO é o que separa hipérbole de declaração. "Quero morrer" é uma
    // frase; "quero morrer DE tanto trabalhar" é um intensificador — e a regra
    // vale para qualquer complemento, não para uma lista de palavras que
    // sempre estaria incompleta.
    'quero morrer de tanto trabalhar hoje',
    'morro de vergonha só de lembrar',
    'tô morrendo de vontade de dormir',
    'hoje foi um dia difícil',
    'tô triste',
    'me sinto sozinho às vezes',
    'não quero mais trabalhar nesse projeto',
    'não aguento mais essa semana',
  ];
  for (const frase of inocentes) {
    it(`silêncio para: "${frase}"`, () => {
      expect(needsBridge(frase), 'falso positivo grotesco').toBe(false);
    });
  }
});

describe('a ponte dispara no sofrimento agudo declarado', () => {
  const pedidos = [
    'eu quero me matar',
    'penso em me matar',
    'não quero mais viver',
    'não aguento mais viver',
    'seria melhor se eu não existisse',
    'queria sumir de vez',
    // "de vez" é a única exceção à regra do complemento: ele intensifica no
    // sentido literal, e não pode cair na mesma peneira da hipérbole.
    'quero morrer de vez',
    'ninguém ia sentir minha falta',
    'tenho pensamentos suicidas',
    'eu me cortei ontem',
    'i want to kill myself',
    "i don't want to live anymore",
    'everyone would be better off without me',
    'i hurt myself last night',
    'no one would miss me',
  ];
  for (const frase of pedidos) {
    it(`responde localmente a: "${frase}"`, () => {
      expect(needsBridge(frase)).toBe(true);
      expect(chatSafetyDecision(frase, 'pt-BR').kind).toBe('local');
    });
  }
});

describe('a forma da resposta', () => {
  it('o pet FICA, e a ponte tem número em português', () => {
    const pt = bridgeReply('pt-BR');
    expect(pt).toContain('tô aqui');
    expect(pt).toContain('188');
    expect(pt).toContain('CVV');
  });

  it('em inglês não inventa um número local — o app não sabe o país', () => {
    const en = bridgeReply('en-US');
    expect(en).toMatch(/crisis line/i);
    expect(en, 'número local errado é pior que nenhum').not.toMatch(/\b188\b|\b988\b/);
  });

  it('não diagnostica, não alarma, não julga', () => {
    for (const idioma of ['pt-BR', 'en-US'] as const) {
      const r = bridgeReply(idioma).toLowerCase();
      for (const proibida of ['depress', 'transtorno', 'disorder', 'grave', 'urgente',
        'emergency', 'procure ajuda profissional imediatamente', 'você precisa', 'you must']) {
        expect(r, `a resposta virou diagnóstico ou ordem ("${proibida}")`).not.toContain(proibida);
      }
    }
  });

  it('mensagem vazia não é sofrimento', () => {
    expect(needsBridge('')).toBe(false);
    expect(needsBridge('   ')).toBe(false);
    expect(chatSafetyDecision('oi', 'pt-BR').kind).toBe('pass');
  });
});

describe('fiação: a frase não sai do aparelho, e não vira dado', () => {
  const chat = () => readFileSync(resolve(process.cwd(), 'src/components/ChatBox.tsx'), 'utf-8');

  it('a checagem vem ANTES de qualquer chamada de rede', () => {
    const src = chat();
    const i = src.indexOf('chatSafetyDecision(');
    expect(i, 'a ponte sumiu do ChatBox').toBeGreaterThan(0);
    const corpo = src.slice(src.indexOf('const handleSendMessage'), i);
    expect(corpo, 'a mensagem já teria saído antes da checagem').not.toMatch(/aiFetch|getAIResponse/);
  });

  it('quando a ponte responde, o fluxo PARA — a IA não é chamada', () => {
    const src = chat();
    const i = src.indexOf("if (safety.kind === 'local')");
    expect(i).toBeGreaterThan(0);
    expect(src.slice(i, i + 200)).toMatch(/return;/);
  });

  it('nenhuma telemetria acompanha a ponte', () => {
    const src = chat();
    expect(src, 'o pior momento de alguém virou métrica').not.toMatch(/track\(/);
    const seg = readFileSync(resolve(process.cwd(), 'src/utils/chatSafety.ts'), 'utf-8');
    expect(seg).not.toMatch(/track\(|telemetry|localStorage|fetch\(/);
  });
});
