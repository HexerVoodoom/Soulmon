// Cloudflare Pages Function — sugestão de tarefas via IA (mesmo provedor/chave
// do chat do pet, ver functions/api/chat.js: Groq llama-3.1-8b-instant).
// Usada no segundo onboarding (tutorial + criação da 1ª tarefa obrigatória):
// o jogador digita um objetivo livre + escolhe tags de área da vida, e essa
// rota devolve um pool de tarefas sugeridas pra ele escolher quais adicionar.
//
// POST { goalText: string, categories: string[], language: 'pt-BR'|'en-US' }
// → { suggestions: [{ name, category }] }  (emoji é resolvido no cliente
//   via CATEGORY_ICONS — não confiamos no modelo pra emoji consistente)

import { guardAiRequest } from './_aiGuard.js';
import { minimizeForAi, redactionCount } from './_redact.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_CATEGORIES = ['Health', 'Creativity', 'Discipline', 'Study', 'Work', 'Social', 'Wellness', 'Fitness'];

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    // N-3: o objetivo é texto livre do usuário e sai para um processador nos
    // EUA. Identificadores diretos não ajudam a sugerir hábito — não saem daqui.
    const goalMin = minimizeForAi((body.goalText || '').toString().trim(), 300);
    const goalText = goalMin.text;
    if (redactionCount(goalMin.redactions) || goalMin.truncated) {
      console.log('[suggest-tasks] entrada minimizada', {
        redactions: goalMin.redactions,
        truncated: goalMin.truncated,
      });
    }
    const categories = Array.isArray(body.categories) ? body.categories.filter(c => VALID_CATEGORIES.includes(c)) : [];
    const isPt = body.language === 'pt-BR';

    if (!goalText && categories.length === 0) {
      return Response.json({ error: 'goalText or categories required' }, { status: 400, headers: CORS });
    }

    // ORDEM: configuração ANTES do portão de volume. Esta rota é o segundo
    // onboarding, com criação de 1ª tarefa obrigatória, e tem o MENOR teto do
    // sistema (30/dia). Debitar antes de saber que não há chave esvaziava a cota
    // do jogador no caminho de primeira impressão.
    const groqKey = env.GROQ_API_KEY;
    if (!groqKey) return Response.json({ error: 'AI not configured' }, { status: 500, headers: CORS });

    const gate = await guardAiRequest(request, env, 'suggest', body.id);
    if (!gate.ok) return Response.json({ error: gate.reason }, { status: gate.status, headers: CORS });

    const systemPrompt = `You are a productivity coach inside a gamified habit-tracking app (Soulmon).
Given a user's goal and optional life-area tags, suggest 5 concrete, actionable RECURRING tasks/habits
that would help achieve that goal. Each task name must be short (max 40 chars), action-oriented, and
written in ${isPt ? 'Brazilian Portuguese' : 'English'}.
Reply with ONLY a raw JSON array (no markdown fences, no prose, no explanation). Each item:
{"name": string, "category": one of ${JSON.stringify(VALID_CATEGORIES)}}`;

    const userMsg = [
      goalText ? `Goal: ${goalText}` : '',
      categories.length ? `Life-area tags: ${categories.join(', ')}` : '',
    ].filter(Boolean).join('\n');

    // Unidade reservada daqui para baixo (ver `makeRelease` em _aiGuard.js).
    let groqRes;
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMsg },
        ],
        max_tokens: 400,
        temperature: 0.7,
      }),
      });
    } catch (err) {
      await gate.release(`rede/timeout no Groq: ${err?.message}`);
      throw err;
    }

    if (!groqRes.ok) {
      console.error('Groq error:', await groqRes.text());
      await gate.release(`Groq respondeu ${groqRes.status}`);
      return Response.json({ error: 'AI service error' }, { status: 500, headers: CORS });
    }

    const data = await groqRes.json();
    const raw = data.choices?.[0]?.message?.content ?? '[]';

    let parsed;
    try {
      const match = raw.match(/\[[\s\S]*\]/);
      parsed = JSON.parse(match ? match[0] : raw);
    } catch {
      // NÃO devolve: o Groq respondeu e cobrou. É o análogo exato da recusa de
      // conteúdo no sprite — o modelo trabalhou, só entregou torto.
      return Response.json({ error: 'Could not parse suggestions' }, { status: 502, headers: CORS });
    }

    const suggestions = (Array.isArray(parsed) ? parsed : [])
      .map(item => ({
        name: (item?.name || '').toString().trim().slice(0, 60),
        category: VALID_CATEGORIES.includes(item?.category) ? item.category : 'Wellness',
      }))
      .filter(item => item.name.length > 0)
      .slice(0, 6);

    return Response.json({ suggestions }, { headers: CORS });
  } catch (err) {
    console.error('suggest-tasks error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500, headers: CORS });
  }
}
