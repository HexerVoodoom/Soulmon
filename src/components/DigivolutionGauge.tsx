import { Progress } from './ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface DigivolutionGaugeProps {
  daysCompleted: number;
  maxDays: number;
  currentStage?: string;
}

export function DigivolutionGauge({ daysCompleted, maxDays, currentStage }: DigivolutionGaugeProps) {
  const progress = (daysCompleted / maxDays) * 100;
  const daysRemaining = maxDays - daysCompleted;

  return (
    <div className="bg-teal-100 rounded-lg p-3 border border-teal-300">
      <div className="flex justify-between items-center mb-2">
        <span 
          style={{ 
            fontFamily: 'monospace', 
            fontSize: '0.75rem',
            background: 'linear-gradient(90deg, #2bff95, #14b8a6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontWeight: '600'
          }}
        >
          DIGIVOLUTION GAUGE
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span 
                className="cursor-help"
                style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '0.75rem',
                  background: 'linear-gradient(90deg, #2bff95, #14b8a6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: '600'
                }}
              >
                {daysCompleted}/{maxDays} DAYS
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {currentStage && `Current: ${currentStage}`}
                <br />
                {daysCompleted === maxDays 
                  ? 'Ready to digivolve!' 
                  : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} needed at this stage`}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <Progress 
        value={progress} 
        className="h-3 bg-teal-300"
        indicatorClassName="bg-gradient-to-r from-[#2bff95] to-teal-500"
      />
      <p 
        className="mt-2 text-center" 
        style={{ 
          fontFamily: 'monospace', 
          fontSize: '0.625rem',
          background: 'linear-gradient(90deg, #2bff95, #14b8a6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: '600'
        }}
      >
        {daysCompleted === maxDays 
          ? '⚡ READY TO DIGIVOLVE! ⚡' 
          : `${daysRemaining} more day${daysRemaining !== 1 ? 's' : ''} to evolution`}
      </p>
    </div>
  );
}
