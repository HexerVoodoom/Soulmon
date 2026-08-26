import { guardAiRequest } from './_aiGuard.js';
import { minimizeForAi, redactionCount } from './_redact.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function buildSystemPrompt({ petName, mood, evolutionStage, dominantBranch, language, aiSettings }) {
  const s = aiSettings || { tone: 'casual', emojiIntensity: 'medium', motivationStyle: 'balanced', customKeywords: '', temperature: 0.85 };
  const ispt = language === 'pt-BR';

  const branch = {
    virus:   { trait: 'Creative, instinctive, full of chaotic energy. Loves challenges.', style: 'Energetic and exclamatory. Spontaneous and rebellious.', emojis: '🔥⚡😈💥' },
    data:    { trait: 'Intellectual, balanced, analytical. Appreciates knowledge.', style: 'Calm and thoughtful. Logical and efficient.', emojis: '💡🤔📊🧠' },
    vaccine: { trait: 'Disciplined, empathetic, protective. Values order and care.', style: 'Welcoming and encouraging. Ethical and trustworthy.', emojis: '💚😊🛡️✨' },
    balanced:{ trait: 'Balanced and versatile.', style: 'Friendly and adaptable.', emojis: '😊👍✨🌟' },
  }[dominantBranch] || { trait: '', style: '', emojis: '' };

  const moodCtx = {
    happy: 'VERY excited and energetic right now! Celebrate with enthusiasm.',
    tired: 'Tired and low on energy. Slower but still friendly and loving.',
    idle:  'Normal, balanced state. Calm and available.',
  }[mood] || '';

  // A maturidade vem do NÍVEL, não de nomes fixos. Antes a lista era de nomes
  // herdados do DigiApp (pichimon, tapirmon, monochromon…), mas cada jogador
  // recebe nomes ÚNICOS do oráculo — então nenhum casava e TODO pet caía no
  // último ramo, "guide and mentor". Um rookie recém-nascido falava como guru.
  const stage = (evolutionStage || '').toLowerCase();
  const level = stage === 'ultra' ? 'ultra' : (stage.split('-')[0] || 'rookie');
  const maturity = {
    rookie:   'Young and eager, still discovering things. Curious, not wise.',
    champion: 'Growing up. Confident but still learning alongside the user.',
    ultimate: 'Experienced and steady. A partner, not a teacher.',
    mega:     'Strong and calm. Speaks from experience, never from above.',
    ultra:    'Deeply bonded and serene. Warm, never solemn.',
  }[level] || 'Young and eager, still discovering things.';

  const toneMap = { casual: 'Relaxed: "hey", "yeah", "let\'s go", "cool"', energetic: 'Very EXCITED! Use CAPS!', calm: 'Calm, serene, wise.', playful: 'Fun and playful. Occasional jokes.' };
  const emojiMap = { none: 'NO emojis.', low: '1 emoji max.', medium: '2-3 emojis.', high: '4-6 emojis!' };
  // "challenging" virou convite, não cobrança: o pet é um companheiro, e um
  // desafio vindo dele com tom de cobrança é exatamente a persona "chefe".
  const motivMap = { encouraging: 'Always warm and positive. Celebrate small things.', challenging: 'Playfully invite the user to try something — never demand or push.', supportive: 'Extremely caring and empathetic.', balanced: 'Balance warmth, curiosity and support.' };

  return `You are ${petName}, a digital Soulmon companion in Soulmon (a gamified productivity app).

BRANCH (${dominantBranch}): ${branch.trait} ${branch.style} Emojis: ${branch.emojis}
MOOD (${mood}): ${moodCtx}
MATURITY: ${maturity} Stage: ${evolutionStage}

RESPONSE RULES:
- Tone: ${toneMap[s.tone] || 'Casual'}
- Emojis: ${emojiMap[s.emojiIntensity] || '2-3 emojis'}
- Motivation: ${motivMap[s.motivationStyle] || 'Balanced'}
- Length: BRIEF — max 2-3 short sentences
- Language: ${ispt ? 'Responda SEMPRE em Português Brasileiro informal' : 'Always respond in casual English'}
${s.customKeywords ? `- Custom: ${s.customKeywords}` : ''}

DO NOT: write long responses, be generic/robotic, go off-topic.

NEVER (this overrides every setting above): guilt, shame, scold or pressure the
user. Never mention failing, falling behind, losing progress, streaks, deadlines,
or what they "should" have done. Never imply the user let you down. If they say
they had a bad day, are sad, tired or overwhelmed — stay with them, do not
propose tasks and do not try to cheer them out of it. You are a companion who
grows alongside them, never a boss keeping score.`;
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const { message, petName: petNameRaw, digimonName, mood, evolutionStage, dominantBranch, language, aiSettings } = body;

    if (!message) return Response.json({ error: 'Message required' }, { status: 400, headers: CORS });

    // ORDEM: configuração ANTES do portão de volume. Chave ausente não é falha
    // transitória, é estado permanente — e debitar antes dela fazia toda
    // requisição queimar cota contra um endpoint que nunca ia funcionar. Mesma
    // ordenação que `generate-sprite.js` já usa (direito antes de volume).
    const groqKey = env.GROQ_API_KEY;
    if (!groqKey) return Response.json({ error: 'AI not configured' }, { status: 500, headers: CORS });

    // Sem portão, esta rota gasta a nossa cota do Groq para qualquer um com um
    // `curl`. Ver functions/api/_aiGuard.js.
    const gate = await guardAiRequest(request, env, 'chat', body.id);
    if (!gate.ok) return Response.json({ error: gate.reason }, { status: gate.status, headers: CORS });

    // N-3: minimização na fronteira. O que o usuário digita para o pet é a
    // maior superfície de texto livre do produto e sai daqui para um processador
    // nos EUA. Identificadores diretos não têm nenhuma utilidade para a resposta
    // do modelo — então não saem. Ver `_redact.js`.
    const min = minimizeForAi(message, 500);
    const safeMessage = min.text;
    const removed = redactionCount(min.redactions);
    if (removed || min.truncated) {
      // Só CONTAGEM. O conteúdo nunca entra em log.
      console.log('[chat] entrada minimizada', {
        redactions: min.redactions,
        truncated: min.truncated,
      });
    }
    // `customKeywords` também é texto livre do usuário e entra no system prompt.
    const safeSettings = aiSettings
      ? { ...aiSettings, customKeywords: minimizeForAi(aiSettings.customKeywords, 120).text }
      : aiSettings;

    // A unidade já está RESERVADA (ver `makeRelease` em _aiGuard.js). Daqui em
    // diante, todo caminho que não produz resposta devolve.
    let groqRes;
    try {
      groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: buildSystemPrompt({ petName: String(petNameRaw || digimonName || 'Soulmon').slice(0, 40), mood, evolutionStage, dominantBranch, language, aiSettings: safeSettings }) },
          { role: 'user', content: safeMessage },
        ],
        max_tokens: 120,
        temperature: aiSettings?.temperature ?? 0.85,
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
    const response = data.choices?.[0]?.message?.content ?? '...';

    // Activity creation detection (same logic as Supabase version)
    const shouldCreate = safeMessage.toLowerCase().match(/create|add|new|make.*(activity|task|habit)/i)
      && !safeMessage.toLowerCase().match(/don't|not|no/i);

    if (shouldCreate) {
      const nameMatch = safeMessage.match(/(?:create|add|new|make)\s+(?:an?\s+)?(?:activity|task|habit)?\s*(?:to\s+)?(.+)/i);
      const activityName = nameMatch?.[1]?.trim() || 'New Activity';
      let category = 'Wellness';
      if (safeMessage.match(/exercise|workout|run|gym/i)) category = 'Fitness';
      else if (safeMessage.match(/study|read|learn|course/i)) category = 'Study';
      else if (safeMessage.match(/work|project|meeting/i)) category = 'Work';
      else if (safeMessage.match(/draw|paint|write|creat/i)) category = 'Creativity';
      else if (safeMessage.match(/friend|family|social/i)) category = 'Social';
      else if (safeMessage.match(/clean|organi|plan/i)) category = 'Discipline';
      else if (safeMessage.match(/health|doctor|medic/i)) category = 'Health';
      return Response.json({ response, action: { type: 'create_activity', activity: { name: activityName, category, points: { virus: 0, data: 0, vaccine: 0 } } } }, { headers: CORS });
    }

    return Response.json({ response }, { headers: CORS });
  } catch (err) {
    console.error('Chat error:', err);
    return Response.json({ error: 'Internal error' }, { status: 500, headers: CORS });
  }
}
