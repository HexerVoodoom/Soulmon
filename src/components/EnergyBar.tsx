interface EnergyBarProps {
  /** Total number of segments (energy capacity) */
  totalSegments: number;
  /** How many segments are currently filled (current energy) */
  filledSegments: number;
}

export function EnergyBar({ totalSegments, filledSegments }: EnergyBarProps) {
  const segments = [];

  // Create segments from bottom to top
  for (let i = 0; i < totalSegments; i++) {
    const isFilled = i < filledSegments;

    segments.push(
      <div key={i} className="relative w-[11.998px] flex-1 min-h-[4px]">
        {isFilled ? (
          <>
            {/* Blur/glow effect layer */}
            <div
              className="absolute inset-0"
              style={{ background: 'var(--sm-energy)', filter: 'blur(2px)' }}
            />
            {/* Solid layer on top */}
            <div className="absolute inset-0" style={{ background: 'var(--sm-energy)' }} />
          </>
        ) : (
          <div className="absolute inset-0" style={{ background: 'var(--sm-energy-track)' }} />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col-reverse gap-[6px] h-full w-full items-center">
      {segments}
    </div>
  );
}
