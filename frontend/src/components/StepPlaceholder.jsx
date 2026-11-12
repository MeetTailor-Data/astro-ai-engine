import { ArrowLeft, Layers, Rocket, Wrench } from 'lucide-react';
import { MISSION_STEPS, useMission } from '../context/MissionContext';
import { ROCKET_ANATOMY_SLOTS } from '../data/rocketAnatomy';
import { soundEngine } from '../utils/soundEffects';
import { ChamferPanel } from './HudFrame';

export default function StepPlaceholder({ stepName }) {
  const { selectedMission, rocketConfig, setCurrentStep } = useMission();

  return (
    <div className="pointer-events-none relative z-20 flex h-[calc(100vh-3.5rem)] w-screen items-center justify-center p-4 sm:p-6">
      <ChamferPanel className="pointer-events-auto w-full max-w-4xl" innerClassName="p-6 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#00F0FF]/25 pb-4">
          <div className="flex items-center gap-3">
            <div className="hud-chamfer-sm flex h-12 w-12 items-center justify-center border border-[#00F0FF]/50 bg-[#050A17] text-[#00F0FF]">
              {stepName === MISSION_STEPS.ROCKET_BUILDER ? (
                <Wrench className="h-6 w-6" />
              ) : (
                <Rocket className="h-6 w-6" />
              )}
            </div>
            <div>
              <span className="telemetry-num text-[11px] font-bold uppercase tracking-widest text-[#FF6B1A]">
                MODULAR HANDOFF READY // {stepName}
              </span>
              <h1 className="font-display text-xl font-bold text-white sm:text-2xl">
                {stepName === MISSION_STEPS.ROCKET_BUILDER
                  ? 'Vehicle Assembly Building (VAB) — Step 2 Slot'
                  : `${stepName} — Pending Implementation`}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onMouseEnter={() => soundEngine.playHoverChirp()}
            onClick={() => {
              soundEngine.playClickSound();
              soundEngine.playCameraWhoosh();
              setCurrentStep(MISSION_STEPS.MISSION_SELECT);
            }}
            className="game-btn-slanted flex items-center gap-2 border border-[#00F0FF]/45 bg-[#0A1328] px-4 py-2 font-display text-xs font-bold tracking-wider text-slate-200 hover:text-[#00F0FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>MISSION MAP</span>
          </button>
        </div>

        {/* Active MissionContext Snapshot */}
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <div className="border border-slate-800 bg-[#050A17]/90 p-4">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-[#00F0FF]">
              Persisted Selected Mission
            </h2>
            {selectedMission ? (
              <div className="mt-3 space-y-2 text-sm">
                <p className="font-display text-lg font-bold text-white">
                  {selectedMission.name}
                </p>
                <p className="text-xs text-slate-400">
                  ID: <span className="telemetry-num text-slate-200">{selectedMission.id}</span> ·
                  Target: <span className="text-slate-200">{selectedMission.targetBody}</span>
                </p>
                <div className="telemetry-num mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="border border-slate-800 bg-[#0A1224] p-2">
                    <span className="text-slate-400">MIN TWR:</span>{' '}
                    <span className="text-amber-300">{selectedMission.minTwr}</span>
                  </div>
                  <div className="border border-slate-800 bg-[#0A1224] p-2">
                    <span className="text-slate-400">TARGET ΔV:</span>{' '}
                    <span className="text-[#00F0FF]">{selectedMission.targetDeltaV} m/s</span>
                  </div>
                  <div className="border border-slate-800 bg-[#0A1224] p-2">
                    <span className="text-slate-400">GRAVITY:</span>{' '}
                    <span className="text-slate-100">{selectedMission.gravityMs2} m/s²</span>
                  </div>
                  <div className="border border-slate-800 bg-[#0A1224] p-2">
                    <span className="text-slate-400">TOUCHDOWN:</span>{' '}
                    <span className="text-[#10B981]">
                      ≤ {selectedMission.maxSafeTouchdownSpeedMs} m/s
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-400">No mission selected yet.</p>
            )}
          </div>

          <div className="border border-slate-800 bg-[#050A17]/90 p-4">
            <div className="flex items-center gap-2 font-display text-xs font-bold uppercase tracking-wider text-[#10B981]">
              <Layers className="h-4 w-4" />
              <span>MissionContext rocketConfig Slots</span>
            </div>
            <div className="mt-3 space-y-1.5">
              {ROCKET_ANATOMY_SLOTS.map((slot) => (
                <div
                  key={slot.key}
                  className="flex items-center justify-between border border-slate-800/90 bg-[#0A1224]/80 px-3 py-1.5 text-xs"
                >
                  <span className="font-medium text-slate-300">{slot.shortLabel}</span>
                  <span className="telemetry-num text-slate-400">
                    {rocketConfig[slot.key]?.name || 'Awaiting Step 2 Part'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ChamferPanel>
    </div>
  );
}
