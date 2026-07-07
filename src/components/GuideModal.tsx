import { X } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'default' | 'win98' | 'glitch';
}

export function GuideModal({ isOpen, onClose, theme = 'default' }: GuideModalProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-2xl p-6 max-h-[85vh] overflow-y-auto ${
        isGlitch
          ? 'glitch-activity-card'
          : isWin98
          ? 'win98-activity-card'
          : 'bg-white border border-[#e5e6e7] shadow-lg'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl ${
            isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
          }`} style={{ fontFamily: 'Consolas, monospace' }}>
            📖 DigiApp Guide
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${
              isGlitch
                ? 'glitch-button'
                : isWin98
                ? 'win98-button'
                : 'bg-[#f3f4f6] hover:bg-gray-200 text-[#4a5565]'
            }`}
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        <div className={`space-y-4 ${
          isGlitch ? 'text-[#00ff00]' : isWin98 ? 'text-black' : 'text-[#4d5461]'
        }`} style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', lineHeight: '1.5' }}>
          
          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>1. Evolution System</h3>
            <p className="mb-2">
              Your Digimon evolves through <strong>perfect days</strong>.
              A day is perfect when you complete your <strong>daily goal</strong> — everything
              you registered, up to the stage requirement — AND your Digimon's
              <strong> energy is full at the end of the day</strong> (feed it!).
            </p>
            <p>
              Each evolution form requires a fixed number of perfect days to evolve to the next one.
            </p>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>2. What Each Action Does</h3>
            <ul className="space-y-2 ml-4 list-disc">
              <li>
                <strong>❤️ Hearts (HP)</strong> — Lost in proportion to what you leave undone,
                measured against your stage's <strong>daily requirement</strong>: meet the
                requirement (or finish everything you registered) and you're safe. Uncleaned
                <strong> poop</strong> also drains <strong>1 heart every 6 hours</strong>.
                Hearts are healed by <strong>rubbing your Digimon</strong> (up to
                <strong> 1 heart per day</strong>) or by using a <strong>Little Heart</strong> item
                (bought in the shop or dropped in the dungeon). If HP hits 0, your Digimon degenerates.
              </li>
              <li>
                <strong>⚡ Energy</strong> — The number of energy bars equals your stage's
                <strong> daily task requirement</strong> (e.g. Rookie needs 4 tasks → 4 bars).
                Fills only by <strong>feeding</strong> and resets daily. It must be
                <strong> full at the end of the day</strong> for the day to count as perfect.
              </li>
              <li>
                <strong>🍎 Food (Feed)</strong> — Refills energy and grants attribute points
                (which steer your evolution branch). <strong>It does not heal hearts.</strong>
                You can feed up to <strong>5 times per hour</strong>; once full, the pet just
                says it's full.
              </li>
              <li>
                <strong>🚿 Bath</strong> — Cleans up <strong>poop</strong> and washes your
                Digimon. Always available.
              </li>
              <li>
                <strong>🫶 Affection (Rub)</strong> — <strong>Rub your Digimon</strong> (press and
                drag over it) to make little hearts pop out. This is the <strong>only way to
                heal HP</strong>: every ~2 seconds of rubbing restores half a heart, up to
                <strong> 1 full heart per day</strong>.
              </li>
              <li>
                <strong>💤 Sleep</strong> — Your Digimon rests. It won't poop while asleep,
                so sleeping through the night protects it from overnight penalties.
              </li>
            </ul>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>3. Requirements per Form</h3>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Digiegg → Baby I: 1 perfect day</li>
              <li>Baby I → Baby II: 2 perfect days</li>
              <li>Baby II → Rookie: 3 perfect days</li>
              <li>Rookie → Champion: 7 perfect days</li>
              <li>Champion → Ultimate: 14 perfect days</li>
              <li>Ultimate → Mega: 21 perfect days</li>
              <li>Mega → Ultra: 30 perfect days (requires unlocking all 3 Megas)</li>
              <li>Ultra → Itto Mode: 45 perfect days</li>
            </ul>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>4. Activity Cap</h3>
            <p>
              Each form has a limit on activities you can register = <strong>2× the number of perfect days required</strong>.
            </p>
            <p className="mt-2">
              Example: Rookie needs 7 perfect days, so the cap is 14 activities.
            </p>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>5. Weekday Selection</h3>
            <p className="mb-2">
              <strong>Before Rookie</strong> (Digiegg, Baby I, Baby II): 
              No weekday selection. All activities are considered daily.
            </p>
            <p>
              <strong>From Rookie onwards</strong>: 
              You can choose which days of the week each activity will be available. 
              By default, all days are checked when creating an activity.
            </p>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>6. HP System (Hearts)</h3>
            <p className="mb-2">
              At the end of each day you lose hearts <strong>in proportion to what you left undone</strong>,
              measured against min(registered, stage requirement):
              lost hearts = ⌊(1 − done/goal) × maxHearts⌋. Meeting the stage requirement — or finishing
              everything you registered — means <strong>no loss</strong>, and registering extra activities
              never adds risk.
            </p>
            <p className="mb-2">
              Uncleaned <strong>poop</strong> drains an extra <strong>1 heart every 6 hours</strong> until you
              give a bath. Hearts are healed <strong>only by rubbing your Digimon</strong> — every ~2 seconds
              of rubbing restores half a heart, up to <strong>1 heart per day</strong>.
            </p>
            <p>
              Maximum HP per form:
            </p>
            <ul className="space-y-1 ml-4 list-disc mt-2">
              <li>Digiegg and Baby I: 1 heart</li>
              <li>Baby II: 2 hearts</li>
              <li>Rookie, Champion, Ultimate: 3 hearts</li>
              <li>Megas: 4 hearts</li>
              <li>Ultra: 5 hearts</li>
            </ul>
            <p className="mt-2">
              <strong>If HP reaches 0:</strong> Your Digimon degenerates to the previous form.
              Climbing back is easier: you keep a head start of half the perfect days
              needed for that stage (e.g. Rookie → Champion needs 4, but after a
              degeneration only 2 more are required). This discount doesn't stack —
              it's always half again if you degenerate a second time.
            </p>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>7. Branches (Evolution Lines)</h3>
            <p className="mb-2">
              From Rookie onwards, there are 3 branches available:
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li><span className="text-[#22A900]">Virus</span> (green)</li>
              <li><span className="text-[#009ED8]">Data</span> (blue)</li>
              <li><span className="text-[#E69600]">Vaccine</span> (yellow/orange)</li>
            </ul>
            <p className="mt-2">
              The dominant line is determined by the attribute points you accumulate completing activities.
              <strong> Perfect day requirements are the same for all lines.</strong>
            </p>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>8. Ultra and Itto Mode</h3>
            <p>
              To reach Ultra form, you need to unlock the <strong>3 Megas</strong> (one from each branch).
              After unlocking Ultra, continue accumulating perfect days to reach the final Itto Mode.
            </p>
          </section>

          <section className="border-t pt-4 mt-4" style={{ borderColor: isGlitch ? '#00ffff' : isWin98 ? '#000080' : '#e5e6e7' }}>
            <p className="text-center italic">
              Tip: Focus on completing 100% of daily tasks to evolve faster and keep your Digimon strong! 💪
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
