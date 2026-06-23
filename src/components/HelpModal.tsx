import { X } from 'lucide-react';
import { Language } from '../utils/i18n';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
}

const SECTIONS = [
  {
    titleEn: 'Your Digimon',
    titlePt: 'Seu Digimon',
    items: [
      {
        icon: '❤️',
        labelEn: 'HP (Hearts)',
        labelPt: 'HP (Corações)',
        descEn: 'Your Digimon\'s health. Lost when care events are missed (poop not cleaned, etc.). Reaches 0 → degeneration.',
        descPt: 'A saúde do seu Digimon. Perdida quando eventos de cuidado são ignorados (cocô não limpo, etc.). Chega a 0 → degeneração.',
      },
      {
        icon: '⚡',
        labelEn: 'Energy (right bar)',
        labelPt: 'Energia (barra lateral)',
        descEn: 'Fills only by feeding from the Items menu. Required to be full before giving a bath. Resets to 0 each day.',
        descPt: 'Sobe apenas alimentando pelo menu Itens. Deve estar cheia para dar banho. Zera todo dia.',
      },
    ],
  },
  {
    titleEn: 'Digivolution',
    titlePt: 'Digivolução',
    items: [
      {
        icon: '📊',
        labelEn: 'Perfect Days bar',
        labelPt: 'Barra de Dias Perfeitos',
        descEn: 'Each day you complete the required number of activities earns a Perfect Day. Fill the bar to Digivolve!',
        descPt: 'Cada dia em que você completa as atividades necessárias conta como Dia Perfeito. Encha a barra para Digivolucionar!',
      },
      {
        icon: '🦠',
        labelEn: 'Virus / 💾 Data / 💉 Vaccine',
        labelPt: 'Vírus / 💾 Dado / 💉 Vacina',
        descEn: 'Attribute points earned through feeding. The dominant attribute shapes which form your Digimon evolves into.',
        descPt: 'Pontos de atributo ganhos alimentando. O atributo dominante define para qual forma seu Digimon irá evoluir.',
      },
    ],
  },
  {
    titleEn: 'Daily Actions',
    titlePt: 'Ações do Dia',
    items: [
      {
        icon: '📁',
        labelEn: 'Items',
        labelPt: 'Itens',
        descEn: 'Your food inventory. Feed your Digimon to restore 1 HP and gain energy. Food is earned by completing activities.',
        descPt: 'Seu inventário de comida. Alimente seu Digimon para restaurar 1 HP e ganhar energia. Comida é gerada ao completar atividades.',
      },
      {
        icon: '🚿',
        labelEn: 'Bath',
        labelPt: 'Banho',
        descEn: 'Give your Digimon a shower. Only available when energy is full. Also cleans up active poop events.',
        descPt: 'Dê banho no seu Digimon. Disponível apenas com energia cheia. Também limpa eventos de cocô ativos.',
      },
      {
        icon: '💤',
        labelEn: 'Sleep',
        labelPt: 'Dormir',
        descEn: 'Let your Digimon rest. Purely cosmetic for now — your Digimon will show a sleep animation.',
        descPt: 'Deixe seu Digimon descansar. Visual apenas por enquanto — aparece uma animação de dormir.',
      },
      {
        icon: '🚽',
        labelEn: 'Poop indicator',
        labelPt: 'Indicador de cocô',
        descEn: 'Shows when a poop event is approaching. Clean it via the Bath button (requires full energy).',
        descPt: 'Mostra quando um evento de cocô está chegando. Limpe pelo botão Banho (requer energia cheia).',
      },
    ],
  },
  {
    titleEn: 'Care Events',
    titlePt: 'Eventos de Cuidado',
    items: [
      {
        icon: '💩',
        labelEn: 'Poop event',
        labelPt: 'Evento de cocô',
        descEn: 'Appears twice a day. Give your Digimon a bath (requires full energy) to clean it. Ignoring it costs HP.',
        descPt: 'Aparece duas vezes por dia. Dê banho (energia cheia necessária) para limpar. Ignorar custa HP.',
      },
    ],
  },
];

export function HelpModal({ isOpen, onClose, language, theme = 'default' }: HelpModalProps) {
  if (!isOpen) return null;

  const isPt = language === 'pt-BR';
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center p-0">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={`relative w-full max-w-md max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-4 duration-200 ${
          isGlitch
            ? 'bg-[#0a0a0a] border-t-2 border-[#00ffff] text-[#00ffff]'
            : isWin98
            ? 'bg-[#c0c0c0] border-t-2 border-white'
            : 'bg-[#1a2230] text-white rounded-t-2xl'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3 flex-shrink-0 ${
            isWin98
              ? 'bg-[linear-gradient(to_right,#000080,#1084d0)]'
              : isGlitch
              ? 'border-b border-[#00ffff]/30'
              : 'border-b border-white/10'
          }`}
        >
          <span
            className={`font-bold ${isWin98 ? 'text-white' : isGlitch ? 'text-[#00ffff]' : 'text-white'}`}
            style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
          >
            {isPt ? 'ℹ️ Ajuda' : 'ℹ️ Help'}
          </span>
          <button
            onClick={onClose}
            className={`p-1 ${isWin98 ? 'text-white hover:bg-[#000060]' : isGlitch ? 'text-[#00ffff] hover:bg-[#00ffff]/10' : 'text-white/60 hover:text-white'}`}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {SECTIONS.map(section => (
            <div key={section.titleEn}>
              <p
                className={`text-xs font-bold mb-2 uppercase tracking-wider ${
                  isGlitch ? 'text-[#ff00ff]' : isWin98 ? 'text-[#000080]' : 'text-[#2bff95]'
                }`}
                style={{ fontFamily: 'monospace' }}
              >
                {isPt ? section.titlePt : section.titleEn}
              </p>
              <div className="space-y-2">
                {section.items.map(item => (
                  <div
                    key={item.labelEn}
                    className={`flex gap-3 p-2 rounded ${
                      isGlitch
                        ? 'bg-[#00ffff]/5 border border-[#00ffff]/20'
                        : isWin98
                        ? 'bg-white border border-[#808080]'
                        : 'bg-white/5'
                    }`}
                  >
                    <span style={{ fontSize: '1.2rem', flexShrink: 0, lineHeight: 1.4 }}>{item.icon}</span>
                    <div>
                      <p
                        className={`font-bold text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#00ffff]' : 'text-white'}`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {isPt ? item.labelPt : item.labelEn}
                      </p>
                      <p
                        className={`text-xs mt-0.5 leading-snug ${isWin98 ? 'text-gray-700' : isGlitch ? 'text-[#00ff00]/80' : 'text-white/60'}`}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {isPt ? item.descPt : item.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer close button */}
        <div className={`flex-shrink-0 p-3 ${isWin98 ? 'border-t border-[#808080]' : 'border-t border-white/10'}`}>
          <button
            onClick={onClose}
            className={`w-full py-2 text-xs font-bold rounded ${
              isGlitch
                ? 'bg-[#00ffff] text-black'
                : isWin98
                ? 'bg-[#000080] text-white border-2 border-white'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {isPt ? 'Fechar' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
