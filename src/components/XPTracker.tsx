import { Progress } from './ui/progress';
import { Zap } from 'lucide-react';

interface XPTrackerProps {
  currentXP: number;
  nextLevelXP: number;
  currentStage: string;
}

export function XPTracker({ currentXP, nextLevelXP, currentStage }: XPTrackerProps) {
  const progress = (currentXP / nextLevelXP) * 100;
  
  const getNextStageName = () => {
    switch (currentStage.toLowerCase()) {
      case 'tapirmon':
        return 'Rookie';
      case 'monochromon':
        return 'Champion';
      case 'triceramon':
        return 'Ultimate';
      case 'ultimatebrachiomon':
        return 'Mega';
      default:
        return 'Next Stage';
    }
  };

  return (
    <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg p-3 border-2 border-yellow-400 mb-4">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-yellow-600" fill="currentColor" />
          <span className="text-yellow-900" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
            EXPERIENCE POINTS
          </span>
        </div>
        <span className="text-yellow-900" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {currentXP} / {nextLevelXP} XP
        </span>
      </div>
      <Progress 
        value={progress} 
        className="h-3 bg-yellow-300"
        indicatorClassName="bg-gradient-to-r from-yellow-500 to-amber-500"
      />
      <p className="text-yellow-800 mt-2 text-center" style={{ fontFamily: 'monospace', fontSize: '0.625rem' }}>
        {currentXP >= nextLevelXP 
          ? `⚡ READY TO EVOLVE TO ${getNextStageName().toUpperCase()}! ⚡` 
          : `${nextLevelXP - currentXP} XP to ${getNextStageName()}`}
      </p>
    </div>
  );
}
