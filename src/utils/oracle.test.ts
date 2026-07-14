import { describe, it, expect } from 'vitest';
import {
  normalizeName, reduceNumber, computeNumerology, westernSunSign,
  approximateAscendant, computeChinese, computeVedic, generateOracle,
  ELEMENT_ORDER, ROLE_ORDER, ALIGNMENT_ORDER, REALM_ORDER,
  type OracleInput,
} from './oracle';

const INPUT: OracleInput = {
  fullName: 'Maria da Silva',
  birthDate: '1990-08-15',
  birthTime: '14:30',
  birthPlace: 'São Paulo, Brasil',
};

describe('normalizeName', () => {
  it('remove acentos, espaços e não-letras', () => {
    expect(normalizeName('José Ângelo-Núñez 3º')).toBe('JOSEANGELONUNEZ');
  });
});

describe('reduceNumber', () => {
  it('reduz a um dígito', () => {
    expect(reduceNumber(1990)).toBe(1); // 1+9+9+0=19 → 10 → 1
    expect(reduceNumber(15)).toBe(6);
  });
  it('preserva números mestres', () => {
    expect(reduceNumber(11)).toBe(11);
    expect(reduceNumber(22)).toBe(22);
    expect(reduceNumber(33)).toBe(33);
    expect(reduceNumber(29)).toBe(11); // 2+9=11 mantém
  });
});

describe('computeNumerology', () => {
  it('calcula caminho de vida (dia+mês+ano reduzidos)', () => {
    // 15→6, 08→8, 1990→1 ⇒ 6+8+1=15 → 6
    expect(computeNumerology('Maria', '1990-08-15').lifePath).toBe(6);
  });
  it('expressão/vogais/consoantes de nome conhecido', () => {
    // MARIA: M4+A1+R9+I9+A1 = 24 → 6; vogais A1+I9+A1=11 (mestre); consoantes M4+R9=13→4
    const n = computeNumerology('Maria', '1990-08-15');
    expect(n.expression).toBe(6);
    expect(n.soulUrge).toBe(11);
    expect(n.personality).toBe(4);
  });
  it('todo resultado tem significado definido', () => {
    const n = computeNumerology(INPUT.fullName, INPUT.birthDate);
    expect(n.meanings.lifePath).toBeDefined();
    expect(n.meanings.expression).toBeDefined();
    expect(n.meanings.soulUrge).toBeDefined();
    expect(n.meanings.personality).toBeDefined();
  });
});

describe('westernSunSign', () => {
  it('identifica signos e fronteiras', () => {
    expect(westernSunSign(8, 15).id).toBe('leao');
    expect(westernSunSign(3, 21).id).toBe('aries');
    expect(westernSunSign(3, 20).id).toBe('peixes');
    expect(westernSunSign(12, 22).id).toBe('capricornio');
    expect(westernSunSign(1, 19).id).toBe('capricornio');
    expect(westernSunSign(1, 20).id).toBe('aquario');
  });
});

describe('approximateAscendant', () => {
  it('ao nascer do sol (~6h) o ascendente ≈ signo solar', () => {
    expect(approximateAscendant('leao', 6, 0).id).toBe('leao');
  });
  it('avança um signo a cada 2h', () => {
    expect(approximateAscendant('leao', 8, 0).id).toBe('virgem');
    expect(approximateAscendant('leao', 10, 0).id).toBe('libra');
  });
});

describe('computeChinese', () => {
  it('1990 (após 4/fev) = Cavalo, Metal, yang', () => {
    const c = computeChinese(1990, 8, 15);
    expect(c.animal.en).toBe('Horse');
    expect(c.element.en).toBe('Metal');
    expect(c.yinYang).toBe('yang');
  });
  it('antes de 4/fev usa o ano anterior', () => {
    expect(computeChinese(1990, 1, 20).animal.en).toBe('Snake'); // 1989
  });
  it('2000 = Dragão', () => {
    expect(computeChinese(2000, 6, 1).animal.en).toBe('Dragon');
  });
});

describe('computeVedic', () => {
  it('15/08 = Karka (Câncer sideral)', () => {
    expect(computeVedic(8, 15).rashi).toBe('Karka');
  });
  it('17/08 = Simha', () => {
    expect(computeVedic(8, 17).rashi).toBe('Simha');
  });
  it('início de janeiro = Dhanu (wrap de ano)', () => {
    expect(computeVedic(1, 5).rashi).toBe('Dhanu');
    expect(computeVedic(1, 14).rashi).toBe('Makara');
  });
});

describe('generateOracle', () => {
  it('é reproduzível com o mesmo seed', () => {
    const a = generateOracle(INPUT, 12345);
    const b = generateOracle(INPUT, 12345);
    expect(a.archetype.phrase.pt).toBe(b.archetype.phrase.pt);
    expect(a.creature.stages.map(s => s.name)).toEqual(b.creature.stages.map(s => s.name));
    expect(a.elementScores).toEqual(b.elementScores);
  });

  it('pontuações determinísticas independem do seed', () => {
    const a = generateOracle(INPUT, 1);
    const b = generateOracle(INPUT, 999999);
    expect(a.elementScores).toEqual(b.elementScores);
    expect(a.roleScores).toEqual(b.roleScores);
    expect(a.alignmentScores).toEqual(b.alignmentScores);
    expect(a.realmScores).toEqual(b.realmScores);
    expect(a.dominantElement).toBe(b.dominantElement);
    expect(a.dominantRole).toBe(b.dominantRole);
    expect(a.dominantAlignment).toBe(b.dominantAlignment);
    expect(a.dominantRealm).toBe(b.dominantRealm);
    expect(a.numerology).toEqual(b.numerology);
  });

  it('alinhamento e reino dominantes são os de maior pontuação', () => {
    const r = generateOracle(INPUT, 42);
    const maxAlign = Math.max(...ALIGNMENT_ORDER.map(a => r.alignmentScores[a]));
    expect(r.alignmentScores[r.dominantAlignment]).toBe(maxAlign);
    const maxRealm = Math.max(...REALM_ORDER.map(x => r.realmScores[x]));
    expect(r.realmScores[r.dominantRealm]).toBe(maxRealm);
  });

  it('criatura tem família com 2 slots (dominante + secundário)', () => {
    const r = generateOracle(INPUT, 42);
    const fam = r.creature.family;
    expect(fam.primary.family.en.length).toBeGreaterThan(0);
    expect(fam.primary.subfamily.en.length).toBeGreaterThan(0);
    expect(fam.primary.noun.en.length).toBeGreaterThan(0);
    expect(fam.secondary.noun.en.length).toBeGreaterThan(0);
    // fusion.a/b derivam dos nouns dos dois slots
    expect(r.creature.fusion.a.en).toBe(fam.primary.noun.en);
    expect(r.creature.fusion.b.en).toBe(fam.secondary.noun.en);
    // mono ⇒ mesmo bicho nos dois slots; não-mono ⇒ distintos
    if (fam.mono) expect(fam.primary.noun.en).toBe(fam.secondary.noun.en);
    // objeto só pode aparecer no 2º slot
    expect(fam.primary.isObject).toBe(false);
  });

  it('distribuição das famílias: maioria mono, rara dupla, raríssimo objeto', () => {
    let mono = 0, dual = 0, obj = 0;
    for (let s = 0; s < 400; s++) {
      const f = generateOracle(INPUT, s).creature.family;
      if (f.secondary.isObject) obj++;
      else if (f.mono) mono++;
      else dual++;
    }
    expect(mono).toBeGreaterThan(dual);      // mono é a maioria
    expect(dual).toBeGreaterThan(obj);       // dupla mais comum que objeto
    expect(obj).toBeGreaterThan(0);          // objeto acontece, mas raro
    expect(obj).toBeLessThan(mono / 3);      // objeto é bem raro
  });

  it('inputs diferentes geram perfis diferentes (unicidade)', () => {
    const inputs: OracleInput[] = [
      INPUT,
      { fullName: 'João Pedro Alves', birthDate: '1988-03-02', birthTime: '07:15', birthPlace: 'Recife, Brasil' },
      { fullName: 'Ana Beatriz Rocha', birthDate: '2001-12-25', birthTime: '23:50', birthPlace: 'Manaus, Brasil' },
      { fullName: 'Carlos Eduardo Lima', birthDate: '1975-06-10', birthTime: '03:33', birthPlace: 'Curitiba, Brasil' },
    ];
    const signatures = inputs.map(i => {
      const r = generateOracle(i, 42); // mesmo seed — diferença vem só do input
      return `${r.dominantElement}|${r.dominantRole}|${r.dominantAlignment}|${r.dominantRealm}|${r.creature.fusion.a.en}|${r.creature.fusion.b.en}`;
    });
    expect(new Set(signatures).size).toBe(inputs.length);
  });

  it('elemento dominante é o de maior pontuação', () => {
    const r = generateOracle(INPUT, 42);
    const max = Math.max(...ELEMENT_ORDER.map(e => r.elementScores[e]));
    expect(r.elementScores[r.dominantElement]).toBe(max);
    expect(r.dominantElement).not.toBe(r.secondaryElement);
  });

  it('função dominante é a de maior pontuação', () => {
    const r = generateOracle(INPUT, 42);
    const max = Math.max(...ROLE_ORDER.map(x => r.roleScores[x]));
    expect(r.roleScores[r.dominantRole]).toBe(max);
  });

  it('arquétipo = 1 substantivo + 2 adjetivos', () => {
    const r = generateOracle(INPUT, 42);
    expect(r.archetype.noun.pt.length).toBeGreaterThan(0);
    expect(r.archetype.adjectives).toHaveLength(2);
    expect(r.archetype.phrase.pt).toContain(r.archetype.noun.pt);
  });

  it('gera 11 formas: rookie + 3 linhas (champion/perfeito/mega) + ultra', () => {
    const r = generateOracle(INPUT, 42);
    expect(r.creature.stages).toHaveLength(11);
    // rookie e ultra são únicos; champion/perfeito/mega têm 1 por tipo
    expect(r.creature.stages.filter(s => s.stage === 'rookie')).toHaveLength(1);
    expect(r.creature.stages.filter(s => s.stage === 'ultra')).toHaveLength(1);
    for (const level of ['champion', 'perfeito', 'mega'] as const) {
      const forms = r.creature.stages.filter(s => s.stage === level);
      expect(forms).toHaveLength(3);
      expect(new Set(forms.map(f => f.branch)).size).toBe(3); // uma por tipo
    }
    for (const s of r.creature.stages) {
      expect(s.name.length).toBeGreaterThan(2);
      expect(s.description.pt.length).toBeGreaterThan(20);
      expect(s.description.en.length).toBeGreaterThan(20);
      // Template validado empiricamente: prompt CURTO estilo Tamagotchi, sem
      // fundo, sem outline/shading/anti-aliasing (frases longas geram sprites
      // piores — ver composeSpritePrompt).
      expect(s.imagePrompt.startsWith('Tamagotchi-style v-pet sprite, 16x16 pixel art, no background')).toBe(true);
      expect(s.imagePrompt).toContain('transparent background');
      expect(s.imagePrompt).toContain('no outlines');
      expect(s.imagePrompt).toContain('no anti-aliasing');
      // Bloco conceito no slot do subject: espécie curta + classe (+ adjetivo)
      const conceptMatch = s.imagePrompt.match(/transparent background: (.+?)\. /);
      expect(conceptMatch).not.toBeNull();
      expect(conceptMatch![1].length).toBeGreaterThan(5);
      // Cláusula de consistência: prompts são independentes (a IA não vê os
      // outros estágios), então cada um precisa reforçar isso explicitamente
      expect(s.imagePrompt).toContain('other evolution stages');
    }
  });

  it('conceito é curto (espécie + classe definitiva) e constante entre estágios', () => {
    const r = generateOracle(INPUT, 42);
    // Mesmo conceito em todos os estágios (identidade da espécie)
    const concepts = r.creature.stages.map(s => s.imagePrompt.match(/transparent background: (.+?)\. /)![1]);
    expect(new Set(concepts).size).toBe(1);
    const concept = concepts[0];
    // Curto de propósito: espécie + classe (+ adjetivo do elemento secundário)
    expect(concept.split(/\s+/).length).toBeLessThan(10);
    expect(concept).not.toContain('wielding');
  });

  it('creature.bio traz uma descrição narrativa breve e legível (classe + linhagem)', () => {
    const r = generateOracle(INPUT, 42);
    expect(r.creature.bio.pt.length).toBeGreaterThan(5);
    expect(r.creature.bio.en.length).toBeGreaterThan(5);
    expect(r.creature.bio.pt).toContain('linhagem');
  });

  it('suporte+sombra+poder é sempre "Witch Doctor" (classe fixa pinada)', () => {
    const r = generateOracle(INPUT, 42, { dominantRole: 'suporte', dominantAlignment: 'poder', dominantElement: 'sombra' });
    const rookie = r.creature.stages.find(s => s.stage === 'rookie')!;
    expect(rookie.imagePrompt).toContain('Witch Doctor');
  });

  it('formas de evolução vêm do pool sem repetir entre as 9 evoluções', () => {
    const r = generateOracle(INPUT, 42);
    const evolved = r.creature.stages.filter(s => s.branch);
    expect(evolved).toHaveLength(9);
    // Cada evolução cita a forma do estágio no prompt
    const shapeLines = evolved.map(s => {
      const m = s.imagePrompt.match(/has evolved into ([^.]+)\.|has transformed into ([^.]+)\.|in its final form, it is ([^.]+)\./);
      expect(m).not.toBeNull();
      return m![1] ?? m![2] ?? m![3];
    });
    expect(new Set(shapeLines).size).toBe(9); // todas distintas
  });

  it('ultra é a fusão dos 3 megas', () => {
    const r = generateOracle(INPUT, 42);
    const ultra = r.creature.stages.find(s => s.stage === 'ultra')!;
    const megas = r.creature.stages.filter(s => s.stage === 'mega');
    expect(ultra.name.startsWith('Omni')).toBe(true);
    expect(ultra.imagePrompt).toContain('ultra fusion of its three mega forms');
    // As três formas mega são citadas nas DESCRIÇÕES; o prompt do ultra
    // carrega o bloco de nível ultra
    for (const mega of megas) {
      expect(mega.imagePrompt).toMatch(/in its final form, it is [^.]+\./);
    }
  });

  it('acento de cor marca o tipo: rookie=dominante, cada linha o seu, ultra=todos', () => {
    const r = generateOracle(INPUT, 42);
    const accent: Record<string, string> = { poder: 'red', harmonia: 'cyan', benevolencia: 'gold' };
    const rookie = r.creature.stages.find(s => s.stage === 'rookie')!;
    expect(rookie.imagePrompt).toContain(`with ${accent[r.dominantAlignment]} accents`);
    for (const s of r.creature.stages.filter(x => x.branch)) {
      expect(s.imagePrompt).toContain(`with ${accent[s.branch!]} accents`);
    }
    const ultra = r.creature.stages.find(s => s.stage === 'ultra')!;
    expect(ultra.imagePrompt).toContain('with red, cyan and gold accents');
    // Conceito exibe a equivalência (Vírus/Data/Vacina)
    expect(r.creature.concept.pt).toMatch(/atributo (Vírus|Data|Vacina)/);
  });

  it('cada nível carrega seu bloco de nível no prompt', () => {
    const r = generateOracle(INPUT, 42);
    const line = (stage: string) => r.creature.stages.find(s => s.stage === stage && s.branch === 'poder')!;
    const rookie = r.creature.stages.find(s => s.stage === 'rookie')!;
    // Rookie: bloco de nível do pool ROOKIE_LOOK (corpinho pequeno/simples)
    expect(rookie.imagePrompt).toMatch(/tiny|small|little|blob|round|chibi|baby|squishy|pint-sized|button-eyed|bouncy/);
    expect(line('champion').imagePrompt).toContain('has evolved into');
    expect(line('perfeito').imagePrompt).toContain('has transformed into');
    expect(line('mega').imagePrompt).toContain('in its final form, it is');
    // Prompts da mesma linha são todos diferentes
    const prompts = ['champion', 'perfeito', 'mega'].map(st => line(st).imagePrompt);
    expect(new Set([rookie.imagePrompt, ...prompts]).size).toBe(4);
  });

  it('seeds diferentes variam a parte criativa mantendo o perfil', () => {
    const results = [1, 2, 3, 4, 5, 6, 7, 8].map(s => generateOracle(INPUT, s));
    const phrases = new Set(results.map(r => r.archetype.phrase.pt));
    expect(phrases.size).toBeGreaterThan(1); // salt muda o arquétipo
    const dominants = new Set(results.map(r => r.dominantElement));
    expect(dominants.size).toBe(1); // ...mas não o elemento dominante
  });

  it('overrides do usuário mudam o resultado criativo, não a leitura', () => {
    const base = generateOracle(INPUT, 42);
    const r = generateOracle(INPUT, 42, {
      dominantElement: 'industrial',
      secondaryElement: 'sombra',
      dominantRole: 'tanque',
      dominantAlignment: 'poder',
      dominantRealm: 'akasha',
    });
    // Vencedores respeitam os ajustes
    expect(r.dominantElement).toBe('industrial');
    expect(r.secondaryElement).toBe('sombra');
    expect(r.dominantRole).toBe('tanque');
    expect(r.dominantAlignment).toBe('poder');
    expect(r.dominantRealm).toBe('akasha');
    // A leitura (pontuações) continua a mesma
    expect(r.elementScores).toEqual(base.elementScores);
    expect(r.roleScores).toEqual(base.roleScores);
    expect(r.alignmentScores).toEqual(base.alignmentScores);
    // A criatura reflete os ajustes (rookie: acento do tipo Poder = red)
    const prompt = r.creature.stages[0].imagePrompt;
    expect(prompt).toContain('with red accents');
    expect(prompt).toMatch(/steel gray|brass and copper|chrome and hazard/); // paleta industrial (pool)
    expect(r.creature.concept.pt).toContain('Akasha');
  });

  it('secundário igual ao dominante é corrigido para um distinto', () => {
    const r = generateOracle(INPUT, 42, { dominantElement: 'fogo', secondaryElement: 'fogo' });
    expect(r.dominantElement).toBe('fogo');
    expect(r.secondaryElement).not.toBe('fogo');
  });

  it('elemento secundário só existe se a pontuação for próxima (≥75%)', () => {
    const r = generateOracle(INPUT, 42);
    const sorted = [...ELEMENT_ORDER].sort((a, b) => r.elementScores[b] - r.elementScores[a]);
    if (r.secondaryElement !== null) {
      expect(r.elementScores[sorted[1]]).toBeGreaterThanOrEqual(r.elementScores[sorted[0]] * 0.75);
    } else {
      expect(r.elementScores[sorted[1]]).toBeLessThan(r.elementScores[sorted[0]] * 0.75);
    }
  });

  it('override secundário = null força elemento único', () => {
    const r = generateOracle(INPUT, 42, { secondaryElement: null });
    expect(r.secondaryElement).toBeNull();
    expect(r.creature.concept.pt).toContain('puro');
  });

  it('respostas do quiz pontuam nos eixos', () => {
    const semQuiz = generateOracle(INPUT, 42);
    const comQuiz = generateOracle({
      ...INPUT,
      answers: { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme', energia: 'natureza', lugar: 'floresta', conflito: 'defende' },
    }, 42);
    // Perfil todo puxado p/ benevolência/tanque/floresta deve refletir
    expect(comQuiz.alignmentScores.benevolencia).toBeGreaterThan(semQuiz.alignmentScores.benevolencia);
    expect(comQuiz.roleScores.tanque).toBeGreaterThan(semQuiz.roleScores.tanque);
    expect(comQuiz.realmScores.floresta).toBeGreaterThan(semQuiz.realmScores.floresta);
  });

  it('preferência direta pesa 25% no eixo escolhido', () => {
    const sem = generateOracle(INPUT, 42);
    const com = generateOracle({ ...INPUT, preferences: { element: 'industrial' } }, 42);
    expect(com.elementScores.industrial).toBeGreaterThan(sem.elementScores.industrial);
    expect(com.elementScores.industrial).toBeGreaterThanOrEqual(25); // fatia da preferência
    // Só o eixo com preferência muda de composição; reino segue a leitura
    expect(com.dominantRealm).toBe(sem.dominantRealm);
  });

  it('descrição do pet pesa 50%, prioriza bases citadas e entra no prompt', () => {
    const r = generateOracle({
      ...INPUT,
      petDescription: 'um lobo de gelo protetor, calmo, com olhos azuis',
    }, 42);
    // Palavras-chave: gelo → reino; lobo → base da fusão
    expect(r.realmScores.gelo).toBeGreaterThanOrEqual(40); // 50% concentrado em gelo
    expect([r.creature.fusion.a.en, r.creature.fusion.b.en]).toContain('wolf');
    // A descrição do pet SUBSTITUI o conceito (no slot do subject) em TODOS
    for (const s of r.creature.stages) {
      const concept = s.imagePrompt.match(/transparent background: (.+?)\. /)![1];
      expect(concept).toBe('um lobo de gelo protetor, calmo, com olhos azuis'.slice(0, 200));
    }
    // A bio também vira a descrição literal do dono (não a narrativa gerada)
    expect(r.creature.bio.pt).toBe('um lobo de gelo protetor, calmo, com olhos azuis');
  });

  it('horóscopo NÃO aparece simbolicamente na criatura (só pontua)', () => {
    const r = generateOracle(INPUT, 42);
    // 1993 = Galo (rooster); Sol em Escorpião (scorpio) — nada disso no prompt
    for (const s of r.creature.stages) {
      const p = s.imagePrompt.toLowerCase();
      expect(p).not.toContain('rooster');
      expect(p).not.toContain('scorpio');
      expect(p).not.toContain('zodiac');
    }
  });

  it('sem seed usa salt aleatório e o devolve no resultado', () => {
    const r = generateOracle(INPUT);
    expect(Number.isInteger(r.seed)).toBe(true);
    const again = generateOracle(INPUT, r.seed);
    expect(again.archetype.phrase.pt).toBe(r.archetype.phrase.pt);
  });
});
