import { memo } from 'react';
import { Language } from '../utils/i18n';
import iconEdit from '../assets/soulmon/icons/icon-edit.png';
import { PixelCheckbox, PixelPanel } from './pixel/PixelKit';
import { categoryIconImg } from '../types/category-icons';

interface TaskCardProps {
  id: string;
  name: string;
  category: string;
  emoji: string;
  completed: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
  language?: Language;
}

export const TaskCard = memo(function TaskCard({
  id,
  name,
  category,
  emoji,
  completed,
  onToggleComplete,
  onEdit,
  language = 'en-US',
}: TaskCardProps) {
  const isPt = language === 'pt-BR';
  // Ícone emoldurado do kit no lugar do emoji do sistema (📚 🧘 📖): o emoji
  // é desenho de OUTRA linguagem visual — colorido, arredondado, e diferente
  // em cada plataforma. O emoji continua sendo o dado gravado na tarefa e é o
  // fallback quando a categoria não tem ícone (save antigo, categoria vazia).
  const catIcon = categoryIconImg(category);

  return (
    /* Moldura de cobre 9-slice no lugar do card arredondado neutro: é a
       linguagem da Ref C ("DAILY RITUALS"). O miolo continua sendo o token de
       superfície do TEMA, então o tema claro segue claro. */
    <PixelPanel style={completed ? { opacity: 0.72 } : undefined}>
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        {/* Marcar como concluída é a AÇÃO CENTRAL do app. Era uma <div> com
            onClick: não recebia foco de teclado nem era anunciada por leitor de
            tela, ou seja, quem não usa o toque simplesmente não conseguia usar
            o app. Hoje é o PixelCheckbox (quadrado de cobre da referência),
            que mantém o <button role="checkbox"> e os 44×44 de alvo. */}
        <PixelCheckbox
          checked={completed}
          disabled={completed}
          onToggle={() => { if (!completed) onToggleComplete(id); }}
          language={language}
          labelPt={completed ? 'Tarefa concluída' : 'Marcar tarefa como concluída'}
          labelEn={completed ? 'Task completed' : 'Mark task as completed'}
        />
        {/* Task content — sem a legenda "realização única" repetida em toda
            ficha: era a mesma frase em CADA card dessa lista (todo item aqui
            é de execução única por definição), zero informação nova por
            card. O nome já carrega o essencial. */}
        <div className="flex-1">
          <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: completed ? 'var(--sm-muted)' : 'var(--sm-ink)' }}>
            {catIcon
              ? <img src={catIcon} alt="" className="sm-px-cat-icon" style={{ display: 'inline-block', marginRight: 8 }} />
              : <>{emoji} </>}
            {name}
          </p>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(id)}
          className="flex items-center justify-center transition-all shrink-0"
          aria-label={isPt ? 'Editar tarefa' : 'Edit task'}
          /* 44×44 é o alvo de toque mínimo confortável; o padding do Tailwind
             dava 32×32. Inline porque min-w-11 não existe no index.css
             pré-compilado (footgun 1). */
          style={{ minWidth: 44, minHeight: 44, background: 'none', border: 'none' }}
        >
          <img src={iconEdit} alt="" width={26} height={26} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
        </button>
      </div>
    </PixelPanel>
  );
});
