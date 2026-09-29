import { aiFetch } from '../utils/aiClient';
import { chatSafetyDecision } from '../utils/chatSafety';
import { useCallback, useRef, useState } from 'react';
import { fetchServerConfig } from '../utils/serverConfig';
import { Icon } from './ui/Icon';
import { PixelIcon } from './ui/PixelIcon';
import { toast } from 'sonner';
import { type AISettings } from './AISettingsModal';
import { type Language } from '../utils/i18n';
import { detectMessageCategory } from '../utils/chatKeywords';

interface ChatBoxProps {
  petName: string;
  mood: 'idle' | 'happy' | 'tired';
  evolutionStage: string;
  dominantBranch?: string;
  useAI: boolean;
  onSendMessage: (response: string) => void;
  aiSettings?: AISettings;
  language?: Language;
  /** WP3.1 — o estado de AGORA, em INTEIROS (contrato `CONTEXT_SCHEMA` de
   *  `functions/api/chat.js`). Nunca texto: `soulGoal`/`soulStruggle` não
   *  passam por rota de IA (D8). Ausente = o pet responde sem contexto, que é
   *  o comportamento antigo e continua válido. */
  chatContext?: {
    hp?: number;
    energy?: number;
    bond?: number;
    daysAway?: number;
    /** Humor do dia normalizado para 0..4 (a `MoodValue` é 1..5). */
    moodToday?: number;
  };
  onCreateActivity?: (activity: {
    name: string;
    category: string;
    points: { power: number; harmony: number; benevolence: number };
  }) => void;
}

export function ChatBox({
  petName,
  mood,
  evolutionStage,
  dominantBranch,
  useAI,
  onSendMessage,
  aiSettings,
  onCreateActivity,
  chatContext,
  language = 'en-US',
}: ChatBoxProps) {
  const [inputValue, setInputValue] = useState('');
  /* WP3.1 — MEMÓRIA DE SESSÃO, e só de sessão.
     Sem isto o `getPetResponse` perguntava "E você?" e processava a resposta
     como se fosse a primeira frase da conversa — o pet perguntava e não
     escutava. Três trocas é o que o servidor aceita (`CHAT_MEMORY_TURNS`), e
     quem corta de verdade é ELE: este estado é conveniência, não contrato.
     Mora em `useState` de propósito — nada disto vai para o save nem para o
     `localStorage`. Fechou o app, a conversa acabou. */
  const [history, setHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const lembrar = (papel: 'user' | 'assistant', texto: string) =>
    setHistory(prev => [...prev, { role: papel, content: texto }].slice(-6));
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  /* No TOPO de propósito: `isPt` é lido pelos handlers de erro logo abaixo
     (microfone, transcrição, IA). Declarado no fim do componente, como estava,
     ele só não explodia porque handler roda depois da pintura — bastava alguém
     chamar um deles durante o render para virar zona morta temporal. */
  const isPt = language === 'pt-BR';
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  /* O microfone só EXISTE quando o servidor tem provedor de transcrição
     (`/api/config` → `transcribeAvailable`; ver `utils/serverConfig.ts`).
     `null` = ainda não perguntamos.

     ⚠️ O botão nasce OTIMISTA (`null` desenha o microfone) e só some quando o
     servidor diz que não há. O contrário — nascer escondido e aparecer depois —
     esconderia o microfone de quem abre o app para gravar e não toca no campo
     de texto antes, que é justamente o gesto que a funcionalidade existe para
     servir. Clicar com a resposta ainda desconhecida ESPERA por ela antes de
     abrir o microfone, então nunca há gravação que morre no envio. */
  const [micDisponivel, setMicDisponivel] = useState<boolean | null>(null);

  /* ⚠️ NÃO no `mount`. O `CompanionHUD` fica montado na Home o tempo todo, e
     existe um guard que exige que montá-lo não toque a rede — buscar a
     configuração ali seria uma requisição por abertura do app para um valor que
     só importa quando a pessoa vai usar o chat. A busca acontece na primeira
     INTERAÇÃO com a barra, e como `micDisponivel` começa `false` o botão já
     nasce no estado certo: nada pisca. */
  const garantirConfig = useCallback(async () => {
    const { transcribeAvailable } = await fetchServerConfig();
    setMicDisponivel(transcribeAvailable);
    return transcribeAvailable;
  }, []);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  
  // Anti-autofill trick
  const [isInputReadOnly, setIsInputReadOnly] = useState(true);
  /* minimal-ui F2 — o TERMINAL: o `_` pisca colado no `>` e SOME quando a
     pessoa começa a escrever (foco ou texto no campo), como no mock aprovado. */
  const [focado, setFocado] = useState(false);
  const [randomName] = useState(`chat-${Math.random().toString(36).substring(7)}`);

  // Soulmon responses based on keywords and mood
  const getPetResponse = (userMessage: string): string => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const category = detectMessageCategory(userMessage);
    // Respostas locais bilíngues. Antes só existiam em inglês, então TODO
    // usuário brasileiro conversava com um pet que respondia noutro idioma.
    const pt = language === 'pt-BR';

    switch (category) {
      case 'greeting':
        return pt
          ? pick([`Oi! Como você tá hoje?`, `Ei! Que bom te ver!`, `Olá! Tudo bem por aí?`, `Oi, parceiro!`, `Opa! Você apareceu!`, `Eaí! Como foi o dia?`])
          : pick([`Hello! How are you today?`, `Hey! Good to see you!`, `Hi! All good over there?`, `Hello, partner!`, `Yo! You showed up!`, `Hey! How was your day?`]);
      case 'farewell':
        // Sem "não suma!": culpa por ir embora contradiz o perdão de ausência.
        return pt
          ? pick([`Até mais!`, `Tchau! Vou ficar por aqui.`, `Até logo, parceiro!`, `Vai com calma!`, `Volta quando der.`])
          : pick([`See you!`, `Bye! I'll be around.`, `Later, partner!`, `Take it easy!`, `Come back whenever.`]);
      case 'feeling':
        if (mood === 'happy') return pt ? pick([`Muito bem!`, `Ótimo!`, `Tô radiante!`, `Feliz demais!`]) : pick([`Very happy!`, `Great!`, `Feeling amazing!`, `So happy!`]);
        if (mood === 'tired') return pt ? pick([`Meio cansado...`, `*bocejo*`, `Preciso de energia!`]) : pick([`A bit tired...`, `*yawn*`, `Need some energy!`]);
        return pt ? pick([`Tô bem!`, `Tranquilo!`, `De boa!`, `Por aqui, tudo certo.`]) : pick([`I'm good!`, `All chill!`, `Doing fine!`, `All good here.`]);
      case 'encouragement':
        return pt ? pick([`Bora!`, `Isso!`, `Tamo junto!`, `Vai dar certo!`]) : pick([`Let's go!`, `That's it!`, `We're in this together!`, `It'll work out!`]);
      case 'compliment':
        return pt ? pick([`Obrigado!`, `Que fofo!`, `Aww!`, `Você também!`, `Hehe!`]) : pick([`Thank you!`, `How sweet!`, `Aww!`, `You too!`, `Hehe!`]);
      case 'affection':
        return pt ? pick([`Também te amo!`, `Eu também!`, `Aww!`, `Você é o melhor!`]) : pick([`Love you too!`, `Me too!`, `Aww!`, `You're the best!`]);
      case 'food':
        // Antes respondia "Complete tasks!" — o pet transformava conversa
        // casual em cobrança de produtividade.
        return pt ? pick([`Também tô com fominha!`, `Comida é a melhor parte.`, `Adoro a hora do lanche.`, `Que fome, hein!`]) : pick([`I'm peckish too!`, `Food is the best part.`, `I love snack time.`, `Hungry, huh!`]);
      case 'evolution':
        return pt ? pick([`Ainda não, mas tô chegando lá!`, `Mal posso esperar!`, `Sinto que tá vindo!`, `No meu tempo.`]) : pick([`Not yet, but I'm getting there!`, `Can't wait!`, `I feel it coming!`, `In its own time.`]);
      case 'name':
        return pt ? pick([`Sou o ${petName}!`, `${petName}!`, `${petName}, ao seu dispor!`]) : pick([`I'm ${petName}!`, `${petName}!`, `${petName}, at your service!`]);
      case 'task':
        return pt ? pick([`Uma de cada vez.`, `No seu ritmo.`, `Adoro te ver fazendo as suas coisas.`, `O que der hoje, tá bom.`]) : pick([`One at a time.`, `At your pace.`, `I love watching you do your thing.`, `Whatever fits today is fine.`]);
      case 'time':
        return pt ? pick([`Dia novo!`, `O tempo voa!`, `Aproveita!`, `Mais uma volta juntos.`]) : pick([`A new day!`, `Time flies!`, `Enjoy it!`, `Another round together.`]);
      case 'help':
        return pt ? pick([`Tô aqui.`, `A gente resolve.`, `Conta comigo.`, `Lado a lado.`]) : pick([`I'm here.`, `We'll figure it out.`, `Count on me.`, `Side by side.`]);
      case 'sad':
        // O pool antigo respondia "Don't be sad!", "Cheer up!", "You're
        // strong!" — invalidação direta do sentimento. O mesmo registro que
        // utils/mood.test.ts já proíbe no resumo de humor.
        return pt ? pick([`Tô aqui.`, `Pode falar.`, `Não precisa estar bem agora.`, `Fico com você.`, `Sinto muito.`]) : pick([`I'm here.`, `You can talk.`, `You don't have to be okay right now.`, `I'll stay with you.`, `I'm sorry.`]);
      case 'happy':
        return pt ? pick([`Fico feliz também!`, `Que energia boa!`, `Adorei ouvir isso.`, `Tô sorrindo aqui.`]) : pick([`That makes me happy too!`, `What good energy!`, `Love hearing that.`, `I'm smiling here.`]);
      case 'yes':
        return pt ? pick([`Isso!`, `Boa!`, `Sabia!`, `Combinado!`]) : pick([`That's it!`, `Nice!`, `I knew it!`, `Deal!`]);
      case 'no':
        return pt ? pick([`Tudo bem!`, `Entendi.`, `Sem problema.`, `Beleza.`]) : pick([`That's alright!`, `I understand.`, `No problem.`, `Okay.`]);
      case 'question':
        return pt
          ? pick([`Boa pergunta!`, `Deixa eu pensar... hmm...`, `Nunca tinha pensado nisso!`, `Não sei muito disso, mas quero aprender!`, `O que você acha?`])
          : pick([`Good question!`, `Let me think... hmm...`, `Never thought about that!`, `I don't know much about it, but I want to learn!`, `What do you think?`]);
      default: {
        if (Math.random() < 0.25) {
          // Sem "fez as tarefas?": o pet parava a conversa para interrogar.
          return pt
            ? pick([`E você?`, `Como tá indo?`, `Me conta mais.`, `Tá tudo bem?`, `Quer conversar?`])
            : pick([`And you?`, `How's it going?`, `Tell me more.`, `Are you okay?`, `Want to talk?`]);
        }
        if (mood === 'happy') return pt ? pick([`Adorei!`, `Legal!`, `Hehe!`, `Que bom!`, `Massa!`]) : pick([`Love it!`, `Cool!`, `Hehe!`, `That's good!`, `Nice!`]);
        if (mood === 'tired') return pt ? pick([`Hmm...`, `Tá...`, `Zzz...`, `Devagarinho...`]) : pick([`Hmm...`, `Okay...`, `Zzz...`, `Slowly...`]);
        return pt ? pick([`Entendi!`, `Hmm...`, `Me conta mais!`, `Tô ouvindo!`, `Saquei!`, `Fala aí!`]) : pick([`I see!`, `Hmm...`, `Tell me more!`, `I'm listening!`, `Got it!`, `Go on!`]);
      }
    }
  };

  // AI-powered response using Groq API
  const getAIResponse = async (userMessage: string): Promise<string> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await aiFetch('/api/chat', {
        message: userMessage,
        petName,
        mood,
        evolutionStage,
        dominantBranch,
        language,
        aiSettings,
        context: chatContext,
        history,
      }, { signal: controller.signal });

      if (!response.ok) {
        if (import.meta.env.DEV) console.error('AI API error:', await response.text());
        toast.warning(language === 'pt-BR' ? 'IA indisponível — usando respostas locais' : 'AI unavailable, using local responses');
        return getPetResponse(userMessage);
      }

      const data = await response.json();

      if (data.action && data.action.type === 'create_activity' && onCreateActivity) {
        if (import.meta.env.DEV) console.log('Creating activity:', data.action.activity);
        onCreateActivity(data.action.activity);
      }

      return data.response;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.warning(isPt
          ? 'A IA demorou demais — usando respostas locais'
          : 'AI response timed out, using local responses');
      } else {
        if (import.meta.env.DEV) console.error('Failed to get AI response:', error);
        toast.warning(language === 'pt-BR' ? 'IA indisponível — usando respostas locais' : 'AI unavailable, using local responses');
      }
      return getPetResponse(userMessage);
    } finally {
      clearTimeout(timeout);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');

    /* WP3.9 (decisão D16) — A PONTE, antes de tudo.
       A checagem vem ANTES do `setIsLoading` e antes de qualquer rede: se a
       mensagem pede a ponte, ela **não sai do aparelho**. Nem para a IA, nem
       para telemetria, nem para o save. Quem escreveu aquilo não vira dado.
       A resposta é local, fixa, na voz do pet, sem alarme e sem push. */
    const safety = chatSafetyDecision(userMessage, language === 'pt-BR' ? 'pt-BR' : 'en-US');
    if (safety.kind === 'local') {
      onSendMessage(safety.reply);
      return;
    }

    setIsLoading(true);

    try {
      let response: string;
      
      if (useAI) {
        // Try AI response first
        response = await getAIResponse(userMessage);
      } else {
        // Use keyword-based response
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        response = getPetResponse(userMessage);
      }

      lembrar('user', userMessage);
      lembrar('assistant', response);
      onSendMessage(response);
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error sending message:', error);
      onSendMessage(language === 'pt-BR' ? 'Ops... deu algo errado aqui!' : 'Oops... something went wrong!');
    } finally {
      setIsLoading(false);
    }
  };

  /* `onKeyDown` e não `onKeyPress`: o evento `keypress` está DEPRECADO e não
     é disparado por todo teclado virtual/IME de Android. Mesmo contrato —
     Enter envia, Shift+Enter não. */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle audio recording
  const handleMicClick = async () => {
    if (isLoading) return;
    /* Ainda não sabemos se há provedor: perguntar AQUI é o que impede uma
       gravação inteira que morreria no envio. `fetchServerConfig` já é uma
       requisição por sessão, então isto não custa nada depois da primeira. */
    if (!isRecording && !(await garantirConfig())) {
      toast.error(isPt
        ? 'O recado falado não está disponível agora. Dá para escrever aqui do mesmo jeito.'
        : 'Spoken messages are not available right now. You can still type here.');
      return;
    }
    if (isRecording) {
      // Stop recording
      if (mediaRecorder) {
        mediaRecorder.stop();
        setIsRecording(false);
      }
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Use audio/webm with opus codec for better compatibility
        const options = { mimeType: 'audio/webm;codecs=opus' };
        let recorder: MediaRecorder;
        
        try {
          recorder = new MediaRecorder(stream, options);
        } catch (e) {
          // Fallback to default if opus not supported
          if (import.meta.env.DEV) console.log('Opus codec not supported, using default');
          recorder = new MediaRecorder(stream);
        }
        
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        recorder.onstop = async () => {
          setIsLoading(true);
          
          const audioBlob = new Blob(chunks, { type: recorder.mimeType });
          if (import.meta.env.DEV) console.log('Audio recorded:', { size: audioBlob.size, type: audioBlob.type, chunks: chunks.length });
          
          await transcribeAudio(audioBlob);
          
          // Stop all tracks to release the microphone
          stream.getTracks().forEach(track => track.stop());
        };

        // Start recording
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (error) {
        // Silently handle microphone permission errors
        if (error instanceof Error) {
          if (error.name === 'NotAllowedError' || error.name === 'NotFoundError') {
            // User denied permission or no microphone available
            onSendMessage(isPt
              ? 'Não consegui acessar o microfone. Dá para escrever aqui do mesmo jeito 🎤'
              : 'I could not reach the microphone. You can still type here 🎤');
            return;
          }
        }
        // Only log other unexpected errors
        if (import.meta.env.DEV) console.warn('Microphone access issue:', error);
        onSendMessage(isPt
          ? 'Deu algo errado com o microfone 🎤'
          : 'Something went wrong with the microphone 🎤');
      }
    }
  };

  // Transcribe audio using server endpoint
  const transcribeAudio = async (audioBlob: Blob) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('language', language.split('-')[0]);

      /* MESMA ORIGEM. Ate 09/09/2026 isto era um POST direto para
         `<projectId>.supabase.co` com o JWT do projeto embarcado no bundle —
         que a CSP bloqueava, entao NUNCA funcionou em producao. Passar por
         `/api/transcribe` mantem a credencial no servidor, poe a chamada sob
         teto por IP e limite de tamanho, e dispensa abrir `connect-src` para
         `*.supabase.co` (o que deixaria QUALQUER projeto Supabase ser destino
         de exfiltracao). Ver o cabecalho de `functions/api/transcribe.js`. */
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) {
        if (import.meta.env.DEV) console.error('Transcription failed:', response.status);
        /* "Tente de novo" é MENTIRA para dois destes: um áudio de 4 MB vai
           falhar igual na segunda vez, e quem levou 429 precisa esperar, não
           repetir. A rota já distingue os casos (ver
           `functions/api/transcribe.js`); a tela passa a distinguir também. */
        toast.error(
          response.status === 413
            ? (isPt ? 'A gravação ficou longa demais. Tente um recado mais curto.'
              : 'That recording is too long. Try a shorter message.')
            : response.status === 429
              ? (isPt ? 'Muitas gravações seguidas. Espere um pouquinho.'
                : 'Too many recordings in a row. Give it a moment.')
              : response.status === 503
                ? (isPt ? 'O recado falado não está disponível agora.'
                  : 'Spoken messages are not available right now.')
                : (isPt ? 'Não consegui transcrever o áudio. Tente de novo.'
                  : 'Audio transcription failed. Please try again.'),
        );
        throw new Error('Transcription failed');
      }

      const data = await response.json();
      const transcribedText = data.text || '';

      if (transcribedText.trim()) {
        setInputValue(transcribedText);
      } else {
        onSendMessage(isPt
          ? 'Não consegui entender o áudio 🤔'
          : 'Could not understand the audio 🤔');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error(isPt
          ? 'A transcrição demorou demais. Tente de novo.'
          : 'Transcription timed out. Please try again.');
      } else {
        if (import.meta.env.DEV) console.error('Transcription error:', error);
      }
      onSendMessage(isPt
        ? 'Deu erro ao transcrever o áudio 😅'
        : 'Error transcribing audio 😅');
    } finally {
      clearTimeout(timeout);
      setIsLoading(false);
    }
  };

  const hasText = inputValue.trim().length > 0;
  /* O rótulo acompanha a AÇÃO do botão único (enviar / gravar / parar), e há
     um estado para o envio em curso — antes o spinner ficava com o rótulo
     "Enviar mensagem", que é o que o leitor de tela anunciava enquanto a
     resposta não chegava. */
  const actionLabel = isLoading
    ? (isPt ? 'Enviando mensagem…' : 'Sending message…')
    : hasText || micDisponivel === false
      ? (isPt ? 'Enviar mensagem' : 'Send message')
      : isRecording
        ? (isPt ? 'Parar gravação' : 'Stop recording')
        : (isPt ? 'Gravar mensagem' : 'Record message');

  return (
    /* MIGRADO para `--sm2-*` (`.sm2-chatbar` / `.sm2-chat-input` /
       `.sm2-chat-btn`, no fim do `index.css`).

       Estas três classes eram a última linguagem `sm-px-*` da Home: como a
       barra é `position: fixed`, a moldura de cobre chanfrada aparecia em
       100% da tela mais vista do app, ao lado de superfícies já migradas.
       Some junto o hack que redefinia `--sm-px-cyan` no elemento raiz — o
       ciano do kit tinha UM valor nos dois temas e dava ~1,4:1 no claro;
       agora o foco e o hover saem de `--sm2-primary-ink`/`--sm2-primary-soft`,
       que respondem ao tema e estão medidos na nota do `index.css`. */
    <div
      className="sm2-chatbar sm3-chatbar"
      /* O foco mora na BARRA inteira (campo, botão e o link de apoio): sair do
         campo para tocar no link não pode esconder o link antes do toque. */
      onFocus={() => setFocado(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocado(false); }}
    >
      {/* O TERMINAL `>_` (minimal-ui F2): sempre aberto, o prompt `>` e o
          cursor `_` piscando à esquerda do campo. É um `<label>`: tocar em
          qualquer ponto da barra foca o campo. O `>` e o `_` são desenho
          (`aria-hidden`); o nome acessível do campo continua sendo o dele. */}
      <label className={`sm3-term${focado || inputValue ? ' sm3-term-digitando' : ''}`} data-terminal>
        <span className="sm3-term-prompt" aria-hidden="true">&gt;</span>
        {!(focado || inputValue) && (
          <span className="sm3-term-cur" aria-hidden="true" data-terminal-cursor>_</span>
        )}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { setIsInputReadOnly(false); void garantirConfig(); }}
          onBlur={() => setIsInputReadOnly(true)}
          readOnly={isInputReadOnly}
          /* NOME ACESSÍVEL. O `>_` é desenho, não rótulo — um leitor de tela
             o anunciaria como "maior que sublinhado". */
          aria-label={language === 'pt-BR' ? 'Falar com seu Soulmon' : 'Talk to your Soulmon'}
          /* NÃO usar `disabled` durante o envio: um controle focado que fica
             `disabled` joga o foco no `<body>` (medido). `aria-busy` anuncia o
             estado e o `handleSendMessage` já ignora envio repetido. */
          aria-busy={isLoading || undefined}
          autoComplete="new-password"
          data-form-type="other"
          spellCheck="false"
          autoCapitalize="off"
          name={randomName}
          id={randomName}
          /* Fonte MONO de dado (frase livre com acento) e o piso de 16px
             anti auto-zoom do iOS vivem em `.sm3-term-input` (index.css). */
          className="sm3-term-input"
          maxLength={200}
        />

        <button
          type="button"
          onClick={hasText || micDisponivel === false ? handleSendMessage : handleMicClick}
          /* `aria-disabled`, nunca `disabled`: ver a nota do campo acima —
             desabilitar de verdade tira o botão da ordem de tabulação no meio
             do uso e derruba o foco. Os dois handlers já ignoram `isLoading`. */
          /* Sem texto E sem microfone, o botao nao tem acao nenhuma — mas
             continua no DOM: o comentario acima explica que o no do foco tem
             que ser estavel, e sumir com ele no meio da digitacao derrubaria o
             foco de quem navega por teclado. */
          aria-disabled={isLoading || (!hasText && micDisponivel === false) || undefined}
          className="sm2-chat-btn"
          /* Paridade exata com o `&:disabled { opacity: .5 }` do
             `.sm2-chat-btn` (index.css), que o `aria-disabled` não dispara. */
          style={isLoading || (!hasText && micDisponivel === false)
            ? { opacity: 0.5, cursor: 'default' }
            : undefined}
          title={actionLabel}
          aria-label={actionLabel}
        >
          {isLoading ? (
            <Icon name="sync" size={32} tone="muted" className="animate-spin" />
          ) : hasText || micDisponivel === false ? (
            <PixelIcon name="enviar" size={32} />
          ) : isRecording ? (
            <Icon name="stop_circle" size={32} fill={1} tone="danger" />
          ) : (
            <Icon name="mic" size={32} tone="ink" />
          )}
        </button>
      </label>

      {/* A SUPERFÍCIE DE SUPORTE — parecer clínico de 21/09/2026.
          (`docs/NARRATIVA-COPY.md` §6; `docs/NARRATIVA-E-UNIVERSO.md` §16.)

          Por que ela mora AQUI e não nas Configurações: esta é a única tela do
          app onde a pessoa escreve texto livre e íntimo, para uma entidade que
          o produto apresenta como a alma dela, respondida por um modelo. Quem
          está mal às 2h da manhã não navega até Configurações — a frase precisa
          estar na tela em que ela está.

          Faz par com a cláusula SAFETY de `functions/api/chat.js`, que manda a
          criatura sair do personagem e encaminhar. Uma trava que encaminha para
          lugar nenhum é meia solução: aqui é o lugar.

          DISCRETA de propósito, e isso é decisão clínica, não de estética: um
          aviso de crise proeminente numa tela de bichinho virtual estigmatiza e
          assusta o uso normal. Texto pequeno, tom `muted`, sem ícone, sem caixa.

          A ORDEM da frase foi corrigida no parecer: o caminho vem primeiro, a
          limitação do produto depois — e a limitação é sobre O APP, nunca sobre
          a adequação de quem está lendo. A 1ª redação começava com "o Soulmon
          não é o lugar certo para isso" e foi reprovada: a pessoa acabou de se
          abrir, e a resposta começava dizendo que ela errou de lugar.

          SEM telefone e SEM nome de serviço, de propósito: caducam por país, e
          uma linha errada numa tela de crise pune quem teve a coragem de pedir
          ajuda. Se entra um diretório externo (e qual), é decisão do dono. */}
      {/* minimal-ui F2: com o terminal SEMPRE aberto no rodapé, a frase fica
          visível enquanto a pessoa ESCREVE (campo focado ou com texto) — é o
          momento em que o parecer quer o caminho na tela. Decisão de desenho
          registrada para o dono (PERGUNTAS-DO-DONO). */}
      {(focado || inputValue) && (
      <p className="sm2-chat-support">
        {isPt
          ? 'Se você está num momento difícil, procure ajuda de verdade: um serviço de saúde, uma linha de apoio da sua região, ou alguém de confiança. O Soulmon é um app de hábitos e não substitui isso.'
          : "If you're going through a hard time, please reach out for real help: a health service, a support line where you live, or someone you trust. Soulmon is a habit app and it is not a substitute for that."}
        {' '}
        {/* O CAMINHO — decisão do dono, 21/09/2026.
            Sem ele, a cláusula SAFETY de `functions/api/chat.js` manda procurar
            ajuda e não diz como chegar lá, o que transfere a pesquisa para
            quem está no estado em que iniciativa e função executiva estão mais
            comprometidas. O parecer clínico foi explícito: "nenhum caminho"
            não é opção.

            ⚠️ Esta lista é CURADA, ESTÁTICA e HUMANA — ela nunca pode sair do
            modelo. Um `llama-3.1-8b-instant` alucina número de telefone com
            facilidade, e número alucinado numa tela de crise pune quem teve a
            coragem de pedir ajuda. Por isso a cláusula SAFETY proíbe o modelo
            de citar qualquer número, serviço ou site: quem cita é esta linha.

            O diretório resolve POR PAÍS (é o que Apple e Google usam), e os
            dois serviços nomeados cobrem o público real medido do app. Manter
            só o diretório deixaria PT-BR e EN-US a um toque a mais do que
            precisam estar; manter só os dois deixaria todo o resto do mundo
            sem caminho nenhum. */}
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="sm2-chat-support-link"
        >
          {isPt ? 'Encontrar uma linha de apoio' : 'Find a helpline'}
        </a>
        {isPt ? ' · No Brasil: CVV, 188 (24h, gratuito).' : ' · US/Canada: 988. UK/IE: 116 123.'}
      </p>
      )}
    </div>
  );
}
