import { aiFetch } from '../utils/aiClient';
import { chatSafetyDecision } from '../utils/chatSafety';
import { useCallback, useRef, useState } from 'react';
import { fetchServerConfig } from '../utils/serverConfig';
import { Icon } from './ui/Icon';
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
  onOpenAISettings?: () => void;
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
    points: { virus: number; data: number; vaccine: number };
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
  onOpenAISettings,
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
    <div className="sm2-chatbar">
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => { setIsInputReadOnly(false); void garantirConfig(); }}
          onBlur={() => setIsInputReadOnly(true)}
          readOnly={isInputReadOnly}
          placeholder=">_"
          /* NOME ACESSÍVEL. O único rótulo do campo era o placeholder `>_`,
             que um leitor de tela anuncia como "maior que sublinhado" — ou
             não anuncia nada. É o campo de conversa com o pet, o controle de
             texto mais visível da Home. */
          aria-label={language === 'pt-BR' ? 'Falar com seu Soulmon' : 'Talk to your Soulmon'}
          /* NÃO usar `disabled` durante o envio: um controle focado que fica
             `disabled` joga o foco no `<body>` (medido), e quem navega por
             teclado teria que tabular a Home inteira de novo a cada mensagem.
             `aria-busy` anuncia o estado e o `handleSendMessage` já ignora
             envio repetido enquanto `isLoading`. */
          aria-busy={isLoading || undefined}
          autoComplete="new-password"
          data-form-type="other"
          spellCheck="false"
          autoCapitalize="off"
          name={randomName}
          id={randomName}
          /* Cor, borda, foco e o mínimo de 16px (anti auto-zoom do iOS
             Safari) vivem em `.sm2-chat-input` no index.css. A fonte do
             campo continua MONOESPAÇADA (`--sm2-font-mono`), não a bitmap: é
             onde se digita frase livre em português, com acento. */
          className="sm2-chat-input"
          maxLength={200}
        />

        {/* Enviar ou Gravar — o microfone aparece com o campo vazio, o enviar
            aparece quando há texto.

            Antes esta barra sozinha carregava TRÊS linguagens visuais mortas:
            dois PNGs raster (`icon-send`/`icon-mic`), o `Square` do
            lucide-react e o `.sm-px-chat-btn-send` com o ciano do kit
            (chapado nos dois temas, hardcode `#04211f` por cima). Como a
            barra é `position: fixed`, isso aparecia em 100% da Home. Agora é
            só `<Icon>` + tokens `--sm2-*`.

            Sem preenchimento no botão de enviar: ícone NUNCA dentro de box
            (regra do dono). O estado "ativo" é o próprio glifo em tom
            primário, não uma placa colorida atrás dele. */}
        {/* UM botão só, que TROCA de ação — e não dois que se substituem.
            Eram dois elementos irmãos em `? :`: ao enviar, o campo esvazia no
            mesmo tique, o botão "enviar" DESMONTA e o "gravar" monta no lugar.
            Para o teclado isso é o foco caindo no `<body>` no instante exato
            em que a pessoa acabou de agir (medido) — e ela volta a tabular a
            Home desde o começo. Com um `<button>` estável só mudam o rótulo,
            o ícone e o handler; o nó do foco continua o mesmo.

            `flex-shrink: 0` e o mínimo de 44px de altura vivem em
            `.sm2-chat-btn`: sem eles o botão encolhia até ~18px num flex row
            de 320px (medido com Playwright).

            Sem preenchimento no botão de enviar: ícone NUNCA dentro de box
            (regra do dono). O estado "ativo" é o próprio glifo em tom
            primário, não uma placa colorida atrás dele. */}
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
            <Icon name="send" size={32} fill={1} tone={hasText ? 'primary' : 'muted'} />
          ) : isRecording ? (
            <Icon name="stop_circle" size={32} fill={1} tone="danger" />
          ) : (
            <Icon name="mic" size={32} tone="ink" />
          )}
        </button>
      </div>
    </div>
  );
}
