import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  DollarSign,
  FlaskConical,
  Globe,
  RotateCcw,
  Wrench,
} from 'lucide-react';
import { MISSION_STEPS, useMission } from '../context/MissionContext';
import { validateRocketForMission } from '../utils/missionPhysics';
import {
  computeResources,
  computeScore,
  loadLeaderboard,
  MISSION_HERITAGE,
  saveRun,
} from '../utils/missionResources';
import { soundEngine } from '../utils/soundEffects';
import { ChamferPanel, CrewPortrait } from './HudFrame';
import { TactileButton } from './TactileUI';
import OutcomeCinematicScene from './three/OutcomeCinematicScene';

function getMissionRewards(selectedMission, willLand, resources) {
  const id = selectedMission?.id || 'leo-sat-01';
  if (!willLand) return { fundsDelta: 0, scienceDelta: 50, supportDelta: -10 };
  const savings = Math.max(0, Math.round(((resources?.capM ?? 150) - (resources?.costM ?? 0)) * 0.25));
  const base =
    id === 'mars-rover-03'
      ? { fundsDelta: 420, scienceDelta: 1200 }
      : id === 'lunar-lander-02'
      ? { fundsDelta: 280, scienceDelta: 750 }
      : { fundsDelta: 180, scienceDelta: 450 };
  return { ...base, fundsDelta: base.fundsDelta + savings, supportDelta: 15 };
}

export default function MissionOutcome() {
  const {
    selectedMission,
    rocketConfig,
    telemetryLog,
    missionResult,
    setCurrentStep,
    resetFlightSession,
    applyMissionRewards,
  } = useMission();

  const rewardsAppliedRef = useRef(false);

  const validation = useMemo(
    () => rocketConfig?.validationResult || validateRocketForMission(rocketConfig, selectedMission),
    [rocketConfig, selectedMission]
  );

  const willLand =
    typeof missionResult?.willLand === 'boolean'
      ? missionResult.willLand
      : validation.willLand;

  const isLeo = selectedMission?.id === 'leo-sat-01';
  const failedConstraints =
    missionResult?.failedConstraints?.length > 0
      ? missionResult.failedConstraints
      : (validation?.failedConstraints || []);
  const primaryFailure = missionResult?.primaryFailure || failedConstraints[0] || null;
  const failedSlotKey = primaryFailure?.slotKey || 'mainBooster';

  const resources = useMemo(
    () => computeResources(rocketConfig, selectedMission),
    [rocketConfig, selectedMission]
  );
  const score = useMemo(
    () => computeScore({ physics: validation.physics, resources, mission: selectedMission, willLand }),
    [validation, resources, selectedMission, willLand]
  );
  const heritage = MISSION_HERITAGE[selectedMission?.id] || MISSION_HERITAGE['leo-sat-01'];
  const rewards = useMemo(
    () => getMissionRewards(selectedMission, willLand, resources),
    [selectedMission, willLand, resources]
  );

  const [leaderboard, setLeaderboard] = useState(() => loadLeaderboard());
  const runSavedRef = useRef(false);
  useEffect(() => {
    if (runSavedRef.current) return;
    runSavedRef.current = true;
    setLeaderboard(
      saveRun({
        mission: selectedMission?.name ?? 'Unknown',
        score: score.total,
        grade: score.grade,
        landed: willLand,
        costM: resources.costM,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const telemetryStats = useMemo(() => {
    const peakAlt =
      telemetryLog?.length > 0
        ? Math.max(...telemetryLog.map((t) => t.altitudeKm ?? 0))
        : missionResult?.finalTelemetry?.altitudeKm ?? 0;
    const maxVel =
      telemetryLog?.length > 0
        ? Math.max(...telemetryLog.map((t) => t.velocityMs ?? 0))
        : missionResult?.finalTelemetry?.velocityMs ?? 0;
    const finalVel =
      missionResult?.finalTelemetry?.velocityMs ??
      (telemetryLog?.length > 0 ? telemetryLog[telemetryLog.length - 1].velocityMs : 0);
    const dvUsed = rocketConfig?.deltaV ?? validation?.physics?.deltaV ?? 0;

    return {
      peakAlt: Number(peakAlt).toFixed(1),
      maxVel: Math.round(maxVel).toLocaleString(),
      dvUsed: Math.round(dvUsed).toLocaleString(),
      finalVel: Number(finalVel).toFixed(1),
    };
  }, [telemetryLog, missionResult, rocketConfig, validation]);

  const commitRewardsOnce = () => {
    if (!rewardsAppliedRef.current) {
      rewardsAppliedRef.current = true;
      applyMissionRewards(rewards);
    }
  };

  const handleFixInVab = () => {
    soundEngine.playCameraWhoosh();
    commitRewardsOnce();
    resetFlightSession();
    setCurrentStep(MISSION_STEPS.ROCKET_BUILDER);
  };

  const handleRelaunch = () => {
    soundEngine.playCameraWhoosh();
    commitRewardsOnce();
    resetFlightSession();
    setCurrentStep(MISSION_STEPS.LAUNCH_CONTROL);
  };

  const handleNewMission = () => {
    soundEngine.playCameraWhoosh();
    commitRewardsOnce();
    resetFlightSession();
    setCurrentStep(MISSION_STEPS.MISSION_SELECT);
  };

  const partSummaryRows = useMemo(() => {
    const { mainBooster, propellantTank, upperStage, edlSystem, avionicsPayload, nosecone } = rocketConfig || {};
    return [
      {
        stage: 'LIFTOFF',
        part: mainBooster?.shortLabel || 'Main Booster',
        detail: `Delivered ${rocketConfig?.thrustKn?.toLocaleString() || 0} kN thrust (TWR ${rocketConfig?.twr || 0}) to clear Pad-39A.`,
      },
      {
        stage: 'MAX-Q',
        part: nosecone?.shortLabel || 'Nosecone Fairing',
        detail: 'Shielded spacecraft from supersonic airflow shear and jettisoned cleanly above the atmosphere.',
      },
      {
        stage: 'ASCENT FUEL',
        part: propellantTank?.shortLabel || 'Core Tank',
        detail: 'Supplied pressurized propellant through main turbopumps for orbital velocity.',
      },
      {
        stage: 'STAGE SEP',
        part: upperStage?.shortLabel || 'Upper Stage',
        detail: 'Ignited in vacuum to complete orbital / deep-space transfer burn.',
      },
      {
        stage: isLeo ? 'ORBIT DEPLOY' : 'EDL BRAKING',
        part: edlSystem?.shortLabel || 'EDL System',
        detail: isLeo
          ? 'Orbital profile required zero surface braking; payload deployed cleanly at 400 km.'
          : 'Executed thermal protection, descent stabilization, and retro-thruster braking.',
      },
      {
        stage: 'SCIENCE OPS',
        part: avionicsPayload?.shortLabel || 'Payload',
        detail: 'Autonomous AI guidance locked attitude and initiated primary science transmission.',
      },
    ];
  }, [rocketConfig, isLeo]);

  return (
    <div className="pointer-events-auto relative h-[calc(100vh-3.5rem)] w-screen overflow-hidden bg-[#020409]">
      {/* FULL-SCREEN 3D OUTCOME DIORAMA */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [4.8, 3.6, 8.6], fov: 46, near: 0.1, far: 250 }}
          gl={{ antialias: true, toneMappingExposure: 1.15 }}
        >
          <OutcomeCinematicScene
            willLand={willLand}
            selectedMission={selectedMission}
            rocketConfig={rocketConfig}
            failedSlotKey={failedSlotKey}
          />
        </Canvas>
      </div>

      {/* MARS HORIZON POST-FLIGHT DEBRIEF HUD */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-between p-3 sm:p-4">
        {/* TOP: MISSION VERDICT BANNER */}
        <div className="flex justify-center">
          <div
            className={`pointer-events-auto flex w-full max-w-4xl items-center justify-between gap-4 rounded-xl border-2 px-5 py-3 shadow-2xl backdrop-blur-md ${
              willLand
                ? 'border-emerald-400/80 bg-emerald-950/80 text-emerald-100 shadow-[0_0_28px_rgba(16,185,129,0.3)]'
                : 'border-rose-500/80 bg-rose-950/85 text-rose-100 shadow-[0_0_28px_rgba(244,63,94,0.35)]'
            }`}
          >
            <div className="flex items-center gap-3">
              {willLand ? (
                <CheckCircle2 className="h-9 w-9 shrink-0 text-emerald-400" />
              ) : (
                <AlertTriangle className="h-9 w-9 shrink-0 text-rose-400" />
              )}
              <div>
                <div className="text-[10px] font-extrabold tracking-[0.22em] opacity-80">
                  {selectedMission?.code || 'MISSION DEBRIEF'} // {selectedMission?.name}
                </div>
                <h1 className="font-display text-lg font-black tracking-wide sm:text-xl">
                  {willLand
                    ? isLeo
                      ? 'MISSION ACCOMPLISHED — ORBIT CONFIRMED'
                      : 'MISSION ACCOMPLISHED — TOUCHDOWN CONFIRMED'
                    : 'MISSION TERMINATED — VEHICLE LOST'}
                </h1>
              </div>
            </div>

            <div className="hidden text-right text-[10px] font-bold tracking-wider opacity-80 md:block">
              DRAG 3D VIEW TO INSPECT
              <div className="text-[#00F0FF]">SCROLL TO ZOOM</div>
            </div>
          </div>
        </div>

        {/* MIDDLE: LEFT REWARDS & SCORECARD + RIGHT AI BLACK-BOX DEBRIEF */}
        <div className="my-auto flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
          {/* LEFT: REWARDS & TELEMETRY SCORECARD */}
          <ChamferPanel className="pointer-events-auto w-full lg:w-[340px]" innerClassName="p-3.5 space-y-3">
            <div className="border-b border-cyan-400/20 pb-1.5 font-display text-xs font-extrabold tracking-wider text-[#00F0FF]">
              REWARDS &amp; TELEMETRY SCORECARD
            </div>

            {/* NASA Mission Score & Evaluation Grade */}
            <div className="flex items-center justify-between rounded border border-amber-400/30 bg-slate-950/75 p-2">
              <div>
                <div className="text-[9px] font-bold text-slate-400">MISSION SCORE</div>
                <div className="telemetry-num text-xl font-extrabold text-white">
                  {score.total} <span className="text-[10px] font-normal text-slate-400">/ 1000</span>
                </div>
              </div>
              <div className="font-display text-4xl font-black text-amber-300">{score.grade}</div>
            </div>
            <div className="grid grid-cols-5 gap-1 text-center text-[9px]">
              {Object.entries(score.breakdown).map(([k, v]) => (
                <div key={k} className="rounded bg-slate-900/75 p-1">
                  <div className="uppercase text-slate-400 text-[8px]">{k}</div>
                  <div className="telemetry-num font-bold text-white">{v}</div>
                </div>
              ))}
            </div>

            {/* Agency Rewards */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded border border-amber-400/30 bg-slate-950/75 p-2 text-center">
                <DollarSign className="mx-auto mb-0.5 h-4 w-4 text-amber-400" />
                <div className="text-[9px] font-bold text-slate-400">FUNDS</div>
                <div className="telemetry-num text-sm font-extrabold text-amber-300">
                  {rewards.fundsDelta > 0 ? `+$${rewards.fundsDelta}M` : '$0M'}
                </div>
              </div>
              <div className="rounded border border-cyan-400/30 bg-slate-950/75 p-2 text-center">
                <FlaskConical className="mx-auto mb-0.5 h-4 w-4 text-[#00F0FF]" />
                <div className="text-[9px] font-bold text-slate-400">SCIENCE</div>
                <div className="telemetry-num text-sm font-extrabold text-[#00F0FF]">
                  +{rewards.scienceDelta} RP
                </div>
              </div>
              <div className="rounded border border-emerald-400/30 bg-slate-950/75 p-2 text-center">
                <Award className="mx-auto mb-0.5 h-4 w-4 text-emerald-400" />
                <div className="text-[9px] font-bold text-slate-400">SUPPORT</div>
                <div
                  className={`telemetry-num text-sm font-extrabold ${
                    rewards.supportDelta >= 0 ? 'text-emerald-300' : 'text-rose-400'
                  }`}
                >
                  {rewards.supportDelta >= 0 ? `+${rewards.supportDelta}%` : `${rewards.supportDelta}%`}
                </div>
              </div>
            </div>

            {/* Flight Telemetry Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-white/10 bg-slate-900/75 p-2">
                <div className="text-[9px] text-slate-400">PEAK ALTITUDE</div>
                <div className="telemetry-num text-sm font-extrabold text-white">
                  {telemetryStats.peakAlt} <span className="text-[10px] font-normal text-slate-300">km</span>
                </div>
              </div>
              <div className="rounded border border-white/10 bg-slate-900/75 p-2">
                <div className="text-[9px] text-slate-400">MAX VELOCITY</div>
                <div className="telemetry-num text-sm font-extrabold text-amber-300">
                  {telemetryStats.maxVel} <span className="text-[10px] font-normal text-slate-300">m/s</span>
                </div>
              </div>
              <div className="rounded border border-white/10 bg-slate-900/75 p-2">
                <div className="text-[9px] text-slate-400">DELTA-V USED</div>
                <div className="telemetry-num text-sm font-extrabold text-[#00F0FF]">
                  {telemetryStats.dvUsed} <span className="text-[10px] font-normal text-slate-300">m/s</span>
                </div>
              </div>
              <div className="rounded border border-white/10 bg-slate-900/75 p-2">
                <div className="text-[9px] text-slate-400">
                  {isLeo && willLand ? 'ORBITAL SPEED' : 'TOUCHDOWN SPEED'}
                </div>
                <div
                  className={`telemetry-num text-sm font-extrabold ${
                    willLand ? 'text-emerald-300' : 'text-rose-400'
                  }`}
                >
                  {telemetryStats.finalVel} <span className="text-[10px] font-normal text-slate-300">m/s</span>
                </div>
              </div>
            </div>

            {/* Local Device Leaderboard */}
            <div className="rounded border border-white/10 bg-slate-900/75 p-2 text-[10px]">
              <div className="mb-1 font-bold tracking-wider text-[#00F0FF]">LEADERBOARD (THIS DEVICE)</div>
              {leaderboard.length === 0 ? (
                <div className="text-slate-400 italic">No mission records logged yet.</div>
              ) : (
                leaderboard.slice(0, 5).map((r, i) => (
                  <div key={i} className="flex justify-between text-slate-200">
                    <span className="truncate">{i + 1}. {r.mission}</span>
                    <span className="telemetry-num font-bold text-amber-300">{r.score} · {r.grade}</span>
                  </div>
                ))
              )}
            </div>
          </ChamferPanel>

          {/* RIGHT: AI FLIGHT RECORDER & ENGINEER MAYA'S DIAGNOSTIC REPORT */}
          <ChamferPanel className="pointer-events-auto w-full lg:w-[440px]" innerClassName="p-3.5 space-y-2.5">
            <div className="flex items-center gap-2.5 border-b border-cyan-400/20 pb-2">
              <CrewPortrait character="maya" isSpeaking={true} size={42} />
              <div>
                <div className="text-[9px] font-extrabold tracking-widest text-amber-300">
                  FLIGHT RECORDER TELEMETRY DEBRIEF // AVIONICS ANALYSIS
                </div>
                <div className="font-display text-xs font-bold text-white">
                  {willLand ? '6-Stage Nominal Flight Synthesis' : 'Root-Cause Failure Reconstruction'}
                </div>
              </div>
            </div>

            {/* NASA Heritage Match Line */}
            <div className="rounded border border-cyan-400/30 bg-cyan-950/30 p-2 text-[11px] text-cyan-100">
              <span className="font-bold text-[#00F0FF]">NASA HERITAGE: </span>
              {heritage.name}. {heritage.note}
            </div>

            {!willLand ? (
              <div className="hud-scroll max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
                <div className="rounded-lg border border-rose-500/45 bg-rose-950/60 p-2.5">
                  <div className="mb-1 text-[10px] font-extrabold tracking-wider text-rose-300">
                    1. FLIGHT ENVELOPE EXCURSIONS (PRIMARY FAILURE MODES)
                  </div>
                  <ul className="space-y-1 text-[11px] text-rose-100">
                    {failedConstraints.map((fc) => (
                      <li key={fc.code}>
                        <span className="font-bold text-white">[{fc.label}]</span> — {fc.reason}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg border border-amber-400/45 bg-amber-950/45 p-2.5">
                  <div className="mb-1 text-[10px] font-extrabold tracking-wider text-amber-300">
                    2. AVIONICS &amp; VAB REMEDIATION DIRECTIVES
                  </div>
                  <ul className="list-disc space-y-1 pl-4 text-[11px] text-amber-100">
                    {failedConstraints.map((fc) => (
                      <li key={fc.code} className="font-semibold">
                        {fc.fixTip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="hud-scroll max-h-56 space-y-1.5 overflow-y-auto pr-1 text-[11px]">
                {partSummaryRows.map((row) => (
                  <div
                    key={row.stage}
                    className="rounded border border-emerald-400/20 bg-slate-950/75 px-2.5 py-1.5"
                  >
                    <div className="flex items-center justify-between text-[10px] font-extrabold">
                      <span className="text-emerald-300">{row.stage}</span>
                      <span className="text-[#00F0FF]">{row.part}</span>
                    </div>
                    <div className="mt-0.5 text-slate-200">{row.detail}</div>
                  </div>
                ))}
              </div>
            )}
          </ChamferPanel>
        </div>

        {/* BOTTOM: ACTION BUTTONS */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-center gap-3 pb-1">
          <TactileButton variant="amber" onClick={handleFixInVab}>
            <Wrench className="h-4 w-4" />
            RECONFIGURE IN VAB
          </TactileButton>

          <TactileButton variant="slate" onClick={handleRelaunch}>
            <RotateCcw className="h-4 w-4" />
            RE-ENGAGE LAUNCH SEQUENCE
          </TactileButton>

          <TactileButton variant="emerald" onClick={handleNewMission}>
            <Globe className="h-4 w-4" />
            PLANETARY MISSION DIRECTORY
          </TactileButton>
        </div>
      </div>
    </div>
  );
}
