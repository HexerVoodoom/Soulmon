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
          : 'sm-card'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl ${
            isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
          }`} style={{ fontFamily: 'Consolas, monospace' }}>
            📖 Soulmon Guide
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
              Your Soulmon evolves through <strong>perfect days</strong>.
              A day is perfect when you complete your <strong>daily goal</strong> — everything
              you registered, up to the stage requirement — AND your Soulmon's
              <strong> energy is full at the end of the day</strong> (feed it!).
            </p>
            <p className="mb-2">
              Each evolution form requires a fixed number of perfect days to evolve to the next one.
            </p>
            <p>
              Don't want to evolve yet? On the <strong>Evolution page</strong>, tap your
              <strong> current Soulmon</strong> to toggle a <strong>🔒 padlock</strong>: while
              locked it never evolves (perfect days still accumulate), and after unlocking it
              evolves at the <strong>next day turn</strong>. Rare items can also shape evolution:
              the <strong>🌀 Glitchtama</strong> (clear all 5 dungeon floors) grants a perfect day
              when used; <strong>Digimentals</strong> (ultra-rare dungeon drops, never consumed)
              turn your champion into <strong>Flamedramon</strong> or <strong>Raidramon</strong>;
              and <strong>rookie items</strong> (rare Dino Run / RPS drops, consumed on use) pick
              which rookie your Baby II becomes.
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
                requirement (or finish everything you registered) and you're safe. You never
                lose <strong>more than 1 heart per day</strong>, so a single bad day can't
                undo your Soulmon. Uncleaned <strong>poop</strong> also drains
                <strong> 1 heart every 6 hours</strong>. Hearts are healed by
                <strong> rubbing your Soulmon</strong> (up to <strong>1 heart per day</strong>)
                or by using a <strong>Little Heart</strong> item (bought in the shop or dropped
                in the dungeon). Every <strong>Monday</strong> your Soulmon gets
                <strong> half a heart back</strong> — a new week starts with breathing room.
                If HP hits 0, your Soulmon degenerates.
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
                Soulmon. Always available.
              </li>
              <li>
                <strong>🫶 Affection (Rub)</strong> — <strong>Rub your Soulmon</strong> (press and
                drag over it) to make little hearts pop out. This is the <strong>only way to
                heal HP</strong>: every ~2 seconds of rubbing restores half a heart, up to
                <strong> 1 full heart per day</strong>.
              </li>
              <li>
                <strong>💤 Sleep</strong> — Your Soulmon rests. It won't poop while asleep,
                so sleeping through the night protects it from overnight penalties.
              </li>
            </ul>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>3. Requirements per Form</h3>
            <p className="mb-2">
              Your Soulmon is born a <strong>Rookie</strong> — there are no egg or baby stages.
              Each form needs a number of <strong>perfect days</strong> to evolve, and a number of
              <strong> tasks per day</strong> to call a day perfect:
            </p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Rookie → Champion: <strong>10</strong> perfect days · 4 tasks/day</li>
              <li>Champion → Ultimate: <strong>20</strong> perfect days · 5 tasks/day</li>
              <li>Ultimate → Mega: <strong>30</strong> perfect days · 5 tasks/day</li>
              <li>Mega → Ultra: <strong>40</strong> perfect days · 6 tasks/day (requires unlocking all 3 Megas)</li>
              <li>Ultra: the top of the tree · 6 tasks/day</li>
            </ul>
            <p className="mt-2">
              Notice the daily load <strong>flattens</strong> near the top while the perfect days keep
              growing. What the late game asks for is <strong>consistency across weeks</strong>, not
              more tasks crammed into one day.
            </p>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>4. Activity Cap</h3>
            <p>
              Each form caps how many activities you can keep registered: <strong>6</strong> at Rookie,
              then 7, 8, 9 and <strong>10</strong> at Ultra.
            </p>
            <p className="mt-2">
              The cap is always above the daily requirement on purpose — you can register more than
              you need to do, and the extra never counts against you.
            </p>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>5. Weekday Selection</h3>
            <p>
              You can choose which days of the week each activity is available, at every stage.
              By default, all days are checked when creating an activity — and an activity that
              isn't scheduled for today never counts against your daily goal.
            </p>
          </section>

          <section>
            <h3 className={`font-bold mb-2 ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : 'text-[#101828]'
            }`}>6. HP System (Hearts)</h3>
            <p className="mb-2">
              At the end of each day you lose hearts <strong>in proportion to what you left undone</strong>,
              measured against min(registered, stage requirement):
              lost hearts = min(⌊(1 − done/goal) × maxHearts⌋, <strong>1</strong>). Meeting the stage
              requirement — or finishing everything you registered — means <strong>no loss</strong>, and
              registering extra activities never adds risk. The daily cap of <strong>1 heart</strong> means
              a bad day is a nudge, never a wipe.
            </p>
            <p className="mb-2">
              If you're away for <strong>two days or more</strong>, coming back costs you
              <strong> nothing</strong> — your Soulmon just missed you. And on every
              <strong> Monday</strong> it recovers <strong>half a heart</strong>, so one rough week
              never bleeds into the next.
            </p>
            <p className="mb-2">
              Uncleaned <strong>poop</strong> drains an extra <strong>1 heart every 6 hours</strong> until you
              give a bath. Hearts are healed <strong>only by rubbing your Soulmon</strong> — every ~2 seconds
              of rubbing restores half a heart, up to <strong>1 heart per day</strong>.
            </p>
            <p className="mb-2">
              Every Soulmon is born with one <strong>trait</strong> — Foodie, Cuddly, Stubborn,
              Lucky or Early Bird — visible in Stats. It nudges one small everyday detail, and
              every trait is an upside: none of them is a handicap.
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
              <strong>If HP reaches 0:</strong> Your Soulmon degenerates to the previous form.
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
              Tip: Focus on completing 100% of daily tasks to evolve faster and keep your Soulmon strong! 💪
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
