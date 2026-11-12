import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import confetti from 'canvas-confetti';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ChevronRight,
  Flame,
  Gauge,
  Radio,
  Rocket,
} from 'lucide-react';
import { MISSION_STEPS, useMission } from '../context/MissionContext';
import { runMission, streamMissionTelemetry } from '../services/api';
import { validateRocketForMission } from '../utils/missionPhysics';
import { soundEngine } from '../utils/soundEffects';
import { ChamferPanel } from './HudFrame';
import { TactileButton } from './TactileUI';
import FlightSimulationScene from './three/FlightSimulationScene';
import MissionControlHQ3D from './three/MissionControlHQ3D';

const CAMERA_MODES = [
  { id: 'TRACKING', label: 'TRACKING CAM' },
  { id: 'PAD', label: 'PAD CAM' },
  { id: 'ROCKET_CAM', label: 'ROCKET-CAM' },
  { id: 'HQ_CAM', label: 'HQ CONTROL ROOM' },
];

const INITIAL_TELEMETRY = {
  tSec: 0,
  countdownSec: 5,
  altitudeKm: 0,
  velocityMs: 0,
  fuelPct: 100,
  gForce: 1.0,
  phase: 'PRELAUNCH',
  status: 'PRELAUNCH',
  stageSeparated: false,
  edlDeployed: false,
  anomalyType: null,
};

function TelemetryCurveChart({ history }) {
  const width = 280;
  const height = 96;
  const maxAlt = Math.max(100, ...history.map((h) => h.altitudeKm));
  const maxVel = Math.max(2500, ...history.map((h) => h.velocityMs));

  const buildPath = (accessor, maxVal) => {
    if (history.length < 2) return `M 0 ${height - 4} L ${width} ${height - 4}`;
    return history
      .map((pt, idx) => {
        const x = (idx / Math.max(1, history.length - 1)) * width;
        const y = height - 6 - (Math.min(maxVal, accessor(pt)) / maxVal) * (height - 14);
        return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const altPath = buildPath((h) => h.altitudeKm, maxAlt);
  const velPath = buildPath((h) => h.velocityMs, maxVel);

  return (
    <div className="rounded border border-cyan-400/20 bg-slate-950/80 p-2">
      <div className="mb-1 flex items-center justify-between text-[9px] font-bold tracking-wider">
        <span className="flex items-center gap-1 text-cyan-300">
          <span className="h-1.5 w-3 rounded-full bg-[#00F0FF]" /> ALTITUDE
        </span>
        <span className="flex items-center gap-1 text-amber-300">
          <span className="h-1.5 w-3 rounded-full bg-[#F59E0B]" /> VELOCITY
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full overflow-visible">
        <line x1="0" y1={height * 0.25} x2={width} y2={height * 0.25} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
        <line x1="0" y1={height * 0.55} x2={width} y2={height * 0.55} stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" />
        <path d={velPath} fill="none" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
        <path d={altPath} fill="none" stroke="#00F0FF" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function LaunchControl() {
  const {
    activeMissionId,
    rocketConfig,
    selectedMission,
    setCurrentStep,
    setTelemetryLog,
    setMissionResult,
  } = useMission();

  const [cameraMode, setCameraMode] = useState('TRACKING');
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const speedRef = useRef(1);
  speedRef.current = speedMultiplier;

  const [telemetry, setTelemetry] = useState(INITIAL_TELEMETRY);
  const [curveHistory, setCurveHistory] = useState([INITIAL_TELEMETRY]);
  const [radioLog, setRadioLog] = useState([
    { id: 'init-1', time: 'T-00:05', text: 'FLIGHT DIRECTOR: Vehicle on internal power. Pad-39A cleared for launch.' },
  ]);
  const [finalOutcome, setFinalOutcome] = useState(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [finaleSecondsLeft, setFinaleSecondsLeft] = useState(3);

  const streamRef = useRef(null);
  const logContainerRef = useRef(null);
  const prevCountdownRef = useRef(null);
  const prevStageSepRef = useRef(false);
  const fullTicksRef = useRef([]);

  const validationResult = useMemo(
    () => rocketConfig?.validationResult || validateRocketForMission(rocketConfig, selectedMission),
    [rocketConfig, selectedMission]
  );

  // Auto-scroll radio log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [radioLog]);

  // Cleanup stream and audio on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.close();
      soundEngine.stopThrusterRumble();
    };
  }, []);

  const startLaunchSequence = useCallback(async () => {
    if (telemetry.status !== 'PRELAUNCH') return;

    soundEngine.ensureContext();
    soundEngine.playClickSound();
    fullTicksRef.current = [];
    setCurveHistory([INITIAL_TELEMETRY]);
    setFinalOutcome(null);
    prevCountdownRef.current = null;
    prevStageSepRef.current = false;

    const missionId = activeMissionId || `sim-${Date.now()}`;
    setTelemetry((prev) => ({ ...prev, status: 'IN_FLIGHT', phase: 'COUNTDOWN', countdownSec: 5 }));

    try {
      await runMission(missionId);
    } catch {
      // Offline fallback continues seamlessly
    }

    streamRef.current?.close();
    streamRef.current = streamMissionTelemetry(
      missionId,
      (tick) => {
        fullTicksRef.current.push(tick);
        setTelemetry(tick);

        // Append chart point every ~0.35s or phase change
        setCurveHistory((prev) => {
          const last = prev[prev.length - 1];
          if (!last || tick.tSec - last.tSec >= 0.35 || tick.phase !== last.phase) {
            return [...prev.slice(-75), tick];
          }
          return prev;
        });

        // Countdown audio
        if (tick.phase === 'COUNTDOWN' && tick.countdownSec > 0 && tick.countdownSec !== prevCountdownRef.current) {
          prevCountdownRef.current = tick.countdownSec;
          soundEngine.playCountdownBeep(false);
        }

        // Liftoff thruster rumble
        if (tick.phase !== 'COUNTDOWN' && tick.status === 'IN_FLIGHT') {
          if (prevCountdownRef.current !== 0) {
            prevCountdownRef.current = 0;
            soundEngine.playCountdownBeep(true);
            soundEngine.startThrusterRumble();
          }
          const rumbleIntensity = tick.phase === 'FUEL_DEPLETED' ? 0 : tick.stageSeparated ? 0.55 : 1.05;
          soundEngine.updateThrusterRumble(rumbleIntensity);
        }

        // Stage separation pneumatic clunk
        if (tick.stageSeparated && !prevStageSepRef.current) {
          prevStageSepRef.current = true;
          soundEngine.playStageSeparationSound();
        }

        // HQ Callout radio log
        if (tick.hqCallout) {
          soundEngine.playRadioChirp();
          const tLabel = tick.phase === 'COUNTDOWN' ? `T-00:0${tick.countdownSec || 1}` : `T+${String(Math.floor(tick.tSec)).padStart(2, '0')}s`;
          setRadioLog((prev) => [...prev.slice(-14), { id: `${Date.now()}-${Math.random()}`, time: tLabel, text: tick.hqCallout }]);
        }
      },
      (result) => {
        soundEngine.stopThrusterRumble();
        const outcomeStatus = result?.status || result?.outcome || (result?.willLand ? 'LANDED' : 'CRASHED');
        setFinalOutcome({
          ...result,
          status: outcomeStatus,
          willLand: outcomeStatus === 'LANDED',
        });

        if (outcomeStatus === 'LANDED') {
          soundEngine.playLandingFanfare();
          confetti({ particleCount: 95, spread: 75, origin: { y: 0.65 } });
        } else {
          soundEngine.playExplosionBoom();
        }
      },
      {
        rocketConfig,
        selectedMission,
        validationResult,
        getSpeedMultiplier: () => speedRef.current,
      }
    );
  }, [telemetry.status, activeMissionId, rocketConfig, selectedMission, validationResult]);

  // Bind [Space] shortcut for pre-launch initiation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && telemetry.status === 'PRELAUNCH') {
        e.preventDefault();
        startLaunchSequence();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [telemetry.status, startLaunchSequence]);

  const handleOpenDebrief = useCallback(() => {
    soundEngine.playCameraWhoosh();
    setTelemetryLog(fullTicksRef.current);
    setMissionResult(finalOutcome);
    setCurrentStep(MISSION_STEPS.MISSION_OUTCOME);
  }, [finalOutcome, setTelemetryLog, setMissionResult, setCurrentStep]);

  // 3-second cinematic slow-motion finale + optional auto-advance to MISSION_OUTCOME
  useEffect(() => {
    if (!finalOutcome) {
      setFinaleSecondsLeft(3);
      return undefined;
    }
    if (!autoAdvance) return undefined;

    setFinaleSecondsLeft(3);
    const interval = setInterval(() => {
      setFinaleSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleOpenDebrief();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [finalOutcome, autoAdvance, handleOpenDebrief]);

  const isPrelaunch = telemetry.status === 'PRELAUNCH';
  const isFinished = Boolean(finalOutcome);
  const isLanded = finalOutcome?.status === 'LANDED';

  const phaseBadgeColor = isFinished
    ? isLanded
      ? 'border-emerald-400/60 bg-emerald-950/90 text-emerald-300'
      : 'border-rose-400/60 bg-rose-950/90 text-rose-300'
    : telemetry.phase === 'COUNTDOWN'
    ? 'border-amber-400/60 bg-amber-950/90 text-amber-300'
    : 'border-cyan-400/50 bg-slate-900/90 text-[#00F0FF]';

  return (
    <div className="pointer-events-auto relative h-[calc(100vh-3.5rem)] w-screen overflow-hidden bg-[#020409]">
      {/* FULL-SCREEN 3D FLIGHT SIMULATION CANVAS */}
      <div className="absolute inset-0 z-0">
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{ position: [6.4, 4.4, 10.6], fov: 46, near: 0.1, far: 300 }}
          gl={{ antialias: true, toneMappingExposure: 1.15 }}
        >
          <FlightSimulationScene
            rocketConfig={rocketConfig}
            selectedMission={selectedMission}
            telemetry={telemetry}
            cameraMode={cameraMode}
          />
        </Canvas>
      </div>

      {/* TOP-CENTER: LIVE 3D CAMERA SWITCHER + FLIGHT PHASE */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-between p-3">
        <div className="flex items-start justify-between gap-3">
          {/* Mission Title Tag */}
          <div className="pointer-events-auto rounded-lg border border-white/15 bg-slate-950/75 px-3 py-1.5 backdrop-blur-md">
            <div className="flex items-center gap-1.5 text-[9px] font-extrabold tracking-[0.2em] text-[#FF6B1A]">
              <Rocket className="h-3.5 w-3.5" />
              {selectedMission?.code || 'LAUNCH CONTROL'}
            </div>
            <div className="font-display text-sm font-bold text-white">
              {selectedMission?.name || 'Custom Orbital Flight'}
            </div>
          </div>

          {/* Camera Switcher Pills */}
          <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-cyan-400/25 bg-slate-950/80 p-1 backdrop-blur-md">
            <Camera className="mx-1.5 h-3.5 w-3.5 text-[#00F0FF]" />
            {CAMERA_MODES.map((cam) => (
              <button
                key={cam.id}
                type="button"
                onClick={() => {
                  soundEngine.playClickSound();
                  setCameraMode(cam.id);
                }}
                className={`rounded px-2.5 py-1 text-[10px] font-bold tracking-wider transition-all ${
                  cameraMode === cam.id
                    ? 'bg-[#00F0FF] text-slate-950 shadow-[0_0_12px_rgba(0,240,255,0.45)]'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cam.label}
              </button>
            ))}
          </div>

          {/* Flight Phase / Countdown Badge */}
          <div className={`pointer-events-auto rounded-lg border px-3.5 py-1.5 text-right backdrop-blur-md ${phaseBadgeColor}`}>
            <div className="text-[9px] font-bold tracking-widest opacity-80">FLIGHT PHASE</div>
            <div className="telemetry-num text-sm font-extrabold">
              {telemetry.phase === 'COUNTDOWN' ? `T - 00:0${telemetry.countdownSec}` : telemetry.phase.replace(/_/g, ' ')}
            </div>
          </div>
        </div>

        {/* BIG COUNTDOWN OVERLAY */}
        {telemetry.phase === 'COUNTDOWN' && telemetry.countdownSec > 0 && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="rounded-2xl border border-amber-400/40 bg-slate-950/60 px-10 py-5 text-center backdrop-blur-sm">
              <div className="text-[11px] font-bold tracking-[0.3em] text-amber-300">IGNITION SEQUENCE</div>
              <div className="telemetry-num text-6xl font-black text-white">T-{telemetry.countdownSec}</div>
            </div>
          </div>
        )}

        {/* POST-FLIGHT STATUS BANNER */}
        {isFinished && (
          <div className="pointer-events-none flex justify-center">
            <div
              className={`pointer-events-auto flex max-w-3xl flex-col gap-2.5 rounded-xl border-2 px-6 py-4 shadow-2xl backdrop-blur-md ${
                isLanded
                  ? 'border-emerald-400 bg-emerald-950/90 text-emerald-100'
                  : 'border-rose-500 bg-rose-950/90 text-rose-100'
              }`}
            >
              <div className="flex items-center gap-4">
                {isLanded ? (
                  <CheckCircle2 className="h-8 w-8 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-8 w-8 shrink-0 text-rose-400" />
                )}
                <div className="flex-1">
                  <div className="font-display text-lg font-extrabold tracking-wide">
                    {isLanded
                      ? selectedMission?.id === 'leo-sat-01'
                        ? 'MISSION ACCOMPLISHED — ORBIT CONFIRMED'
                        : 'MISSION ACCOMPLISHED — SAFE TOUCHDOWN'
                      : 'MISSION FAILED — VEHICLE LOST'}
                  </div>
                  <div className="text-xs opacity-90">
                    {isLanded
                      ? selectedMission?.id === 'leo-sat-01'
                        ? `400 km Sun-Synchronous Orbit stabilized at ${telemetry.velocityMs.toLocaleString()} m/s. Weather Satellite deployed.`
                        : `Touchdown velocity ${telemetry.velocityMs} m/s within safe limits. Payload & telemetry secured.`
                      : finalOutcome?.failureReason || 'Catastrophic flight anomaly detected.'}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-2.5">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playClickSound();
                    setAutoAdvance((prev) => !prev);
                  }}
                  className="rounded border border-white/25 bg-slate-950/60 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-200 hover:bg-slate-900"
                >
                  {autoAdvance ? `AUTO-ADVANCE IN ${finaleSecondsLeft}s (PAUSE)` : 'AUTO-ADVANCE: OFF'}
                </button>

                <TactileButton variant={isLanded ? 'emerald' : 'orange'} onClick={handleOpenDebrief}>
                  VIEW 3D OUTCOME &amp; AI DEBRIEF REPORT &gt;&gt;
                  <ChevronRight className="h-4 w-4" />
                </TactileButton>
              </div>
            </div>
          </div>
        )}

        {/* MIDDLE / BOTTOM ROW: LEFT HQ ANALYTICS + RIGHT TELEMETRY HUD */}
        <div className="flex items-end justify-between gap-3">
          {/* BOTTOM-LEFT: MISSION CONTROL HQ // LIVE ANALYTICS */}
          <ChamferPanel className="pointer-events-auto w-[340px]" innerClassName="p-2.5">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-[#00F0FF]">
                <Radio className="h-3.5 w-3.5 animate-pulse" />
                MISSION CONTROL HQ // LIVE ANALYTICS
              </span>
              <button
                type="button"
                onClick={() => setCameraMode(cameraMode === 'HQ_CAM' ? 'TRACKING' : 'HQ_CAM')}
                className="rounded border border-cyan-400/30 bg-cyan-950/60 px-1.5 py-0.5 text-[9px] font-bold text-cyan-200 hover:bg-cyan-900"
              >
                {cameraMode === 'HQ_CAM' ? 'EXIT HQ' : 'EXPAND'}
              </button>
            </div>

            {/* 3D Animated HQ Room PiP */}
            <div className="relative h-32 w-full overflow-hidden rounded border border-white/10 bg-[#050914]">
              <Canvas dpr={[1, 1.5]} camera={{ position: [0, 2.2, 4.9], fov: 46 }}>
                <MissionControlHQ3D
                  flightPhase={telemetry.phase}
                  flightStatus={telemetry.status}
                  altitudeKm={telemetry.altitudeKm}
                />
              </Canvas>
              <div className="pointer-events-none absolute bottom-1 left-1.5 rounded bg-slate-950/75 px-1.5 py-0.5 text-[8px] font-bold text-emerald-300">
                6 FLIGHT CONTROLLERS ACTIVE
              </div>
            </div>

            {/* Live Scrolling Flight Director Radio Log */}
            <div
              ref={logContainerRef}
              className="hud-scroll mt-2 h-24 space-y-1 overflow-y-auto rounded border border-white/10 bg-slate-950/85 p-2 text-[10px]"
            >
              {radioLog.map((entry) => (
                <div key={entry.id} className="leading-snug">
                  <span className="telemetry-num mr-1.5 font-bold text-amber-400">[{entry.time}]</span>
                  <span className="text-slate-200">{entry.text}</span>
                </div>
              ))}
            </div>
          </ChamferPanel>

          {/* BOTTOM-CENTER: PRE-LAUNCH ACTIONS */}
          {isPrelaunch && (
            <div className="pointer-events-auto flex items-center gap-3 pb-1">
              <TactileButton
                variant="slate"
                onClick={() => {
                  soundEngine.playCameraWhoosh();
                  setCurrentStep(MISSION_STEPS.ROCKET_BUILDER);
                }}
              >
                <ArrowLeft className="h-4 w-4" />
                MODIFY ROCKET IN VAB
              </TactileButton>

              <TactileButton
                variant="orange"
                hazard
                onClick={startLaunchSequence}
                className="px-6 py-3 text-sm shadow-[0_0_24px_rgba(255,107,26,0.5)]"
              >
                <Flame className="h-4 w-4" />
                INITIATE LAUNCH SEQUENCE [SPACE]
              </TactileButton>
            </div>
          )}

          {/* RIGHT HUD: LIVE TELEMETRY GAUGES & TRAJECTORY GRAPH */}
          <ChamferPanel className="pointer-events-auto w-[320px]" innerClassName="p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-wider text-white">
                <Activity className="h-3.5 w-3.5 text-[#00F0FF]" />
                LIVE FLIGHT TELEMETRY
              </span>
              {/* 1x / 2x / 4x Speed Controls */}
              <div className="flex items-center gap-1">
                {[1, 2, 4].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => {
                      soundEngine.playClickSound();
                      setSpeedMultiplier(spd);
                    }}
                    className={`rounded px-1.5 py-0.5 text-[9px] font-extrabold transition ${
                      speedMultiplier === spd
                        ? 'bg-[#FF6B1A] text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            {/* 4 Telemetry Readouts + Progress Bars */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-white/10 bg-slate-900/75 p-2">
                <div className="text-[9px] text-slate-400">ALTITUDE</div>
                <div className="telemetry-num text-base font-extrabold text-[#00F0FF]">
                  {telemetry.altitudeKm.toFixed(1)} <span className="text-[10px] font-normal">km</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full bg-[#00F0FF] transition-all duration-100"
                    style={{ width: `${Math.min(100, (telemetry.altitudeKm / 240) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded border border-white/10 bg-slate-900/75 p-2">
                <div className="text-[9px] text-slate-400">VELOCITY</div>
                <div className="telemetry-num text-base font-extrabold text-amber-300">
                  {telemetry.velocityMs.toLocaleString()} <span className="text-[10px] font-normal">m/s</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full bg-amber-400 transition-all duration-100"
                    style={{ width: `${Math.min(100, (telemetry.velocityMs / 8000) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="rounded border border-white/10 bg-slate-900/75 p-2">
                <div className="text-[9px] text-slate-400">FUEL REMAINING</div>
                <div className="telemetry-num text-base font-extrabold text-emerald-400">
                  {telemetry.fuelPct.toFixed(0)}<span className="text-[10px] font-normal">%</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded bg-slate-800">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-100"
                    style={{ width: `${Math.max(0, Math.min(100, telemetry.fuelPct))}%` }}
                  />
                </div>
              </div>

              <div className="rounded border border-white/10 bg-slate-900/75 p-2">
                <div className="flex items-center gap-1 text-[9px] text-slate-400">
                  <Gauge className="h-3 w-3" /> G-FORCE
                </div>
                <div className={`telemetry-num text-base font-extrabold ${telemetry.gForce > 4.5 ? 'text-rose-400' : 'text-white'}`}>
                  {telemetry.gForce.toFixed(2)} <span className="text-[10px] font-normal">G</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded bg-slate-800">
                  <div
                    className={`h-full transition-all duration-100 ${telemetry.gForce > 4.5 ? 'bg-rose-500' : 'bg-sky-400'}`}
                    style={{ width: `${Math.min(100, (telemetry.gForce / 8) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Real-Time Altitude & Velocity Curve Graph */}
            <div className="mt-2.5">
              <TelemetryCurveChart history={curveHistory} />
            </div>
          </ChamferPanel>
        </div>
      </div>
    </div>
  );
}
