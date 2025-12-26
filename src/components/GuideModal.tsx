import { useState } from 'react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GUIDE_SECTIONS = [
  {
    title: '🎮 Como Funciona',
    content: 'DigiApp é um aplicativo gamificado de produtividade. Complete tarefas da vida real para evoluir seu companheiro digital através de diferentes estágios evolutivos!'
  },
  {
    title: '⚡ Energia e Saúde',
    content: 'Ao concluir tarefas e atividades, seu parceiro ganha energia para evoluir. Mas cuidado: se você não cumprir uma tarefa, ele perderá saúde.'
  },
  {
    title: '🔄 Três Ramos Evolutivos',
    content: 'Virus (vermelho - criatividade), Data (azul - intelecto), e Vaccine (verde - disciplina). Cada categoria de atividade concede pontos específicos que determinam o caminho evolutivo.'
  },
  {
    title: '💬 Chat com IA',
    content: 'Converse com seu parceiro! Ele pode criar tarefas e atividades para você. Configure sua personalidade nas configurações.'
  },
  {
    title: '📊 Acompanhe seu Progresso',
    content: 'Use as abas de Estatísticas e Caminho de Evolução para ver seu progresso e prever a próxima evolução do seu parceiro.'
  }
];

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const currentSection = GUIDE_SECTIONS[currentPage];
  const isLastPage = currentPage === GUIDE_SECTIONS.length - 1;

  const handleNext = () => {
    if (isLastPage) {
      onClose();
      setCurrentPage(0);
    } else {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative w-full max-w-[400px]">
        <div className="bg-[#0d1420] relative rounded-xl w-full">
          <div className="px-8 py-8 min-h-[280px] flex flex-col justify-between">
            {/* Title */}
            <h2 
              className="text-[#00ff99] text-center mb-4"
              style={{
                fontFamily: 'Consolas, monospace',
                fontSize: '1.125rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
              }}
            >
              {currentSection.title}
            </h2>

            {/* Content */}
            <p 
              className="text-[#d0d0d0] text-center flex-1 flex items-center justify-center"
              style={{
                fontFamily: 'Consolas, monospace',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                letterSpacing: '0.01em',
              }}
            >
              {currentSection.content}
            </p>

            {/* Page Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {GUIDE_SECTIONS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentPage ? 'bg-[#00ff99] w-6' : 'bg-[#4a5568]'
                  }`}
                />
              ))}
            </div>
          </div>
          <div 
            aria-hidden="true" 
            className="absolute border-[#00ff99] border-2 border-solid inset-0 pointer-events-none rounded-xl" 
          />
        </div>

        {/* Buttons */}
        <div className="w-full flex justify-between gap-3 mt-4">
          {currentPage > 0 && (
            <button
              onClick={handlePrev}
              className="bg-[#4a5568] rounded-xl px-8 py-3 transition-all hover:brightness-110 active:scale-95"
              style={{
                fontFamily: 'Consolas, monospace',
                fontSize: '0.875rem',
                fontWeight: '700',
                color: '#fff',
                letterSpacing: '0.05em',
              }}
            >
              voltar
            </button>
          )}
          <button
            onClick={handleNext}
            className="bg-[#00ff99] rounded-xl px-8 py-3 transition-all hover:brightness-110 active:scale-95 flex-1"
            style={{
              fontFamily: 'Consolas, monospace',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: '#000',
              letterSpacing: '0.05em',
            }}
          >
            {isLastPage ? 'finalizar' : 'próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
