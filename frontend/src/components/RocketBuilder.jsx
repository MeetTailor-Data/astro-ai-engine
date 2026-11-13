import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Radio,
  RefreshCw,
} from 'lucide-react';
import { MISSION_STEPS, useMission } from '../context/MissionContext';
import { createCustomMission } from '../services/api';
import { computeResources } from '../utils/missionResources';
import { computeRocketPhysics, validateRocketForMission } from '../utils/missionPhysics';
import { soundEngine } from '../utils/soundEffects';
import GoNoGoPanel, { buildRoleChecks } from './GoNoGoPanel';
import { CrewPortrait } from './HudFrame';
import {
  HardwareToggleSwitch,
  TactileButton,
  TactileFuelSlider,
} from './TactileUI';
import VabHangarScene from './three/VabHangarScene';
import {
  AVIONICS_PARTS,
  BOOSTER_PARTS,
  EDL_PARTS,
  FUEL_MASS_DEFAULT,
  FUEL_MASS_MAX,
  FUEL_MASS_MIN,
  NOSECONE_PARTS,
  PROPELLANT_OPTIONS,
  UPPER_STAGE_PARTS,
  VAB_ASSEMBLY_ORDER,
} from '../data/vabParts';

// ─── Mars Horizon SVG Part Illustrations ─────────────────────────────────────

function PartSvgIcon({ slotKey, partId }) {
  if (slotKey === 'mainBooster') {
    const srbs = partId === 'heavy_core_4_strapon' ? 4 : partId === 'heavy_core_2_strapon' ? 2 : 0;
    const isTri = partId === 'tri_engine_cluster';
    return (
      <svg viewBox="0 0 64 64" className="h-11 w-11">
        {srbs >= 2 && (
          <>
            <rect x="12" y="22" width="7" height="28" rx="2" fill="#E2E8F0" />
            <polygon points="12,22 15.5,14 19,22" fill="#F59E0B" />
            <rect x="45" y="22" width="7" height="28" rx="2" fill="#E2E8F0" />
            <polygon points="45,22 48.5,14 52,22" fill="#F59E0B" />
          </>
        )}
        {srbs === 4 && (
          <>
            <rect x="6" y="26" width="5" height="24" rx="1.5" fill="#CBD5E1" />
            <rect x="53" y="26" width="5" height="24" rx="1.5" fill="#CBD5E1" />
          </>
        )}
        <rect x="24" y="10" width="16" height="38" rx="2" fill="#F8FAFC" />
        <rect x="24" y="18" width="16" height="5" fill="#0F172A" />
        <rect x="24" y="38" width="16" height="10" fill="#334155" />
        <polygon points="26,48 38,48 41,56 23,56" fill="#475569" />
        {isTri && (
          <>
            <polygon points="21,48 27,48 29,55 19,55" fill="#64748B" />
            <polygon points="37,48 43,48 45,55 35,55" fill="#64748B" />
          </>
        )}
      </svg>
    );
  }
  if (slotKey === 'propellantTank') {
    const color = partId === 'liquid_methane' ? '#10B981' : partId === 'rp1_kerosene' ? '#F59E0B' : '#94A3B8';
    return (
      <svg viewBox="0 0 64 64" className="h-11 w-11">
        <rect x="20" y="8" width="24" height="48" rx="4" fill="#F8FAFC" />
        <rect x="20" y="16" width="24" height="6" fill="#0F172A" />
        <rect x="22" y="26" width="20" height="20" rx="2" fill={color} opacity="0.85" />
      </svg>
    );
  }
  if (slotKey === 'upperStage') {
    const accent = partId === 'methalox_deep_space' ? '#10B981' : partId === 'liquid_hydrolox' ? '#38BDF8' : '#94A3B8';
    return (
      <svg viewBox="0 0 64 64" className="h-11 w-11">
        <rect x="21" y="12" width="22" height="28" rx="2" fill="#F8FAFC" />
        <rect x="21" y="18" width="22" height="5" fill={accent} />
        <rect x="21" y="34" width="22" height="6" fill="#64748B" />
        <polygon points="27,40 37,40 42,54 22,54" fill="#334155" />
      </svg>
    );
  }
  if (slotKey === 'edlSystem') {
    const hasHeat = ['heatshield_supersonic_chute', 'full_edl_package'].includes(partId);
    const hasLegs = partId === 'full_edl_package';
    return (
      <svg viewBox="0 0 64 64" className="h-11 w-11">
        <path d="M16,26 Q32,8 48,26 Z" fill="#FB923C" opacity="0.9" />
        <rect x="22" y="28" width="20" height="14" rx="2" fill="#E2E8F0" />
        {hasHeat && <ellipse cx="32" cy="44" rx="15" ry="4" fill="#B45309" />}
        {hasLegs && (
          <>
            <line x1="20" y1="42" x2="12" y2="54" stroke="#CBD5E1" strokeWidth="3" />
            <line x1="44" y1="42" x2="52" y2="54" stroke="#CBD5E1" strokeWidth="3" />
          </>
        )}
      </svg>
    );
  }
  if (slotKey === 'avionicsPayload') {
    const accent = partId === 'mars_rover' ? '#10B981' : partId === 'lunar_lander' ? '#818CF8' : partId === 'crew_capsule' ? '#FB7185' : '#38BDF8';
    return (
      <svg viewBox="0 0 64 64" className="h-11 w-11">
        <rect x="22" y="16" width="20" height="32" rx="3" fill="#F8FAFC" />
        <rect x="8" y="26" width="12" height="12" fill="#2563EB" />
        <rect x="44" y="26" width="12" height="12" fill="#2563EB" />
        <circle cx="32" cy="32" r="6" fill={accent} />
      </svg>
    );
  }
  // nosecone
  const tip = partId === 'heavy_thermal_fairing' ? '#F59E0B' : partId === 'reinforced_shroud' ? '#38BDF8' : '#E2E8F0';
  return (
    <svg viewBox="0 0 64 64" className="h-11 w-11">
      <path d="M20,48 L22,26 Q32,6 42,26 L44,48 Z" fill="#F8FAFC" />
      <path d="M27,16 Q32,8 37,16 Z" fill={tip} />
      <rect x="20" y="44" width="24" height="6" fill="#94A3B8" />
    </svg>
  );
}

const SLOT_PARTS_MAP = {
  mainBooster: BOOSTER_PARTS,
  propellantTank: null,
  upperStage: UPPER_STAGE_PARTS,
  edlSystem: EDL_PARTS,
  avionicsPayload: AVIONICS_PARTS,
  nosecone: NOSECONE_PARTS,
};

const TIER_LABELS = ['LV I', 'LV II', 'LV III', 'LV IV'];

function ResourceBlock({ title, status, ok, rows, barPct, barBad }) {
  return (
    <div className="mb-3 border-b border-blue-300/20 pb-2.5">
      <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
        <span>{title}</span>
        <span className={ok ? 'text-emerald-300' : 'text-rose-300'}>{status}</span>
      </div>
      {rows.map(([label, value]) => (
        <div key={label} className="mt-1 flex justify-between text-xs">
          <span className="text-blue-200">{label}</span>
          <span className="telemetry-num font-bold">{value}</span>
        </div>
      ))}
      {barPct != null && (
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-blue-950">
          <div
            className={`h-full transition-all ${barBad ? 'bg-rose-400' : 'bg-amber-400'}`}
            style={{ width: `${Math.max(0, Math.min(100, barPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main RocketBuilder Component ─────────────────────────────────────────────

export default function RocketBuilder() {
  const {
    selectedMission,
    rocketConfig,
    setRocketConfig,
    updateRocketSlot,
    updateRocketMetrics,
    setActiveMissionId,
    setCurrentStep,
  } = useMission();

  const [activeSlot, setActiveSlot] = useState('mainBooster');
  const [previewPartId, setPreviewPartId] = useState(null);
  const [xrayMode, setXrayMode] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchError, setLaunchError] = useState(null);

  const [lastInstalledSlot, setLastInstalledSlot] = useState(null);
  const [lastInstalledAt, setLastInstalledAt] = useState(0);

  const [fuelMass, setFuelMass] = useState(
    rocketConfig.propellantTank?.fuelMassKg ?? FUEL_MASS_DEFAULT
  );
  const [propellantType, setPropellantType] = useState(
    rocketConfig.propellantTank?.propellantType ?? 'rp1_kerosene'
  );
  const [teamMode, setTeamMode] = useState(false);
  const [teamCleared, setTeamCleared] = useState(false);

  const nextEmptySlot = useMemo(() => {
    const found = VAB_ASSEMBLY_ORDER.find((s) => rocketConfig[s.key] === null);
    return found ? found.key : null;
  }, [rocketConfig]);

  const installedCount = useMemo(
    () => VAB_ASSEMBLY_ORDER.filter((s) => rocketConfig[s.key] !== null).length,
    [rocketConfig]
  );
  const allSixInstalled = installedCount === 6;

  const physics = useMemo(
    () => computeRocketPhysics(rocketConfig, selectedMission),
    [rocketConfig, selectedMission]
  );

  const validationResult = useMemo(
    () => validateRocketForMission(rocketConfig, selectedMission),
    [rocketConfig, selectedMission]
  );

  const resources = useMemo(
    () => computeResources(rocketConfig, selectedMission),
    [rocketConfig, selectedMission]
  );

  const roleChecks = useMemo(
    () => buildRoleChecks({ physics, validation: validationResult, resources, mission: selectedMission }),
    [physics, validationResult, resources, selectedMission]
  );

  const rosterSignature = `${VAB_ASSEMBLY_ORDER.map((s) => rocketConfig[s.key]?.id ?? '-').join('|')}|${
    rocketConfig.propellantTank?.fuelMassKg ?? 0
  }|${rocketConfig.propellantTank?.propellantType ?? ''}`;

  const launchBlocked = resources.overBudget || (teamMode && !teamCleared);

  useEffect(() => {
    updateRocketMetrics({
      totalMassKg: physics.totalMassKg,
      thrustKn: physics.thrustKn,
      twr: physics.twr,
      deltaV: physics.deltaV,
      reliabilityPct: physics.reliabilityPct,
      validationResult,
    });
  }, [physics, validationResult, updateRocketMetrics]);

  const prevTwrRef = useRef(physics.twr);
  useEffect(() => {
    if (rocketConfig.mainBooster && physics.twr > 0 && physics.twr < 1.0 && prevTwrRef.current >= 1.0) {
      soundEngine.playKlaxonChirp();
    }
    prevTwrRef.current = physics.twr;
  }, [physics.twr, rocketConfig.mainBooster]);

  const activeSlotMeta = VAB_ASSEMBLY_ORDER.find((s) => s.key === activeSlot) || VAB_ASSEMBLY_ORDER[0];
  const activePartsList = SLOT_PARTS_MAP[activeSlot] || [];
  const installedPart = rocketConfig[activeSlot];
  const inspectedPart =
    activePartsList.find((p) => p.id === previewPartId) || installedPart || activePartsList[0] || null;

  const handleSelectSlot = useCallback((slotKey) => {
    soundEngine.playCraneServoSound();
    setActiveSlot(slotKey);
    setPreviewPartId(null);
  }, []);

  const handleCycleSlot = useCallback(
    (dir) => {
      const idx = VAB_ASSEMBLY_ORDER.findIndex((s) => s.key === activeSlot);
      const nextIdx = (idx + dir + VAB_ASSEMBLY_ORDER.length) % VAB_ASSEMBLY_ORDER.length;
      handleSelectSlot(VAB_ASSEMBLY_ORDER[nextIdx].key);
    },
    [activeSlot, handleSelectSlot]
  );

  const handleAutoOptimize = useCallback(() => {
    soundEngine.playPartInstallSound();
    const mId = selectedMission?.id || 'leo-sat-01';
    let booster, fuelKgs, fuelType, upper, edl, payload, cone;

    if (mId === 'mars-rover-03') {
      booster = BOOSTER_PARTS.find((p) => p.id === 'heavy_core_4_strapon') || BOOSTER_PARTS[3];
      fuelKgs = 95000;
      fuelType = 'liquid_methane';
      upper = UPPER_STAGE_PARTS.find((p) => p.id === 'methalox_deep_space') || UPPER_STAGE_PARTS[2];
      edl = EDL_PARTS.find((p) => p.id === 'full_edl_package') || EDL_PARTS[3];
      payload = AVIONICS_PARTS.find((p) => p.id === 'mars_rover') || AVIONICS_PARTS[2];
      cone = NOSECONE_PARTS.find((p) => p.id === 'heavy_thermal_fairing') || NOSECONE_PARTS[2];
    } else if (mId === 'lunar-lander-02') {
      booster = BOOSTER_PARTS.find((p) => p.id === 'heavy_core_2_strapon') || BOOSTER_PARTS[2];
      fuelKgs = 65000;
      fuelType = 'rp1_kerosene';
      upper = UPPER_STAGE_PARTS.find((p) => p.id === 'liquid_hydrolox') || UPPER_STAGE_PARTS[1];
      edl = EDL_PARTS.find((p) => p.id === 'full_edl_package') || EDL_PARTS[3];
      payload = AVIONICS_PARTS.find((p) => p.id === 'lunar_lander') || AVIONICS_PARTS[1];
      cone = NOSECONE_PARTS.find((p) => p.id === 'reinforced_shroud') || NOSECONE_PARTS[1];
    } else {
      // LEO Weather Satellite default
      booster = BOOSTER_PARTS.find((p) => p.id === 'tri_engine_cluster') || BOOSTER_PARTS[1];
      fuelKgs = 45000;
      fuelType = 'rp1_kerosene';
      upper = UPPER_STAGE_PARTS.find((p) => p.id === 'liquid_hydrolox') || UPPER_STAGE_PARTS[1];
      edl = EDL_PARTS.find((p) => p.id === 'drogue_main_chute') || EDL_PARTS[1];
      payload = AVIONICS_PARTS.find((p) => p.id === 'weather_sat') || AVIONICS_PARTS[0];
      cone = NOSECONE_PARTS.find((p) => p.id === 'standard_cone') || NOSECONE_PARTS[0];
    }

    const tank = {
      id: 'propellant_tank',
      shortLabel: `${fuelType.replace(/_/g, ' ')} / ${(fuelKgs / 1000).toFixed(0)}t`,
      fuelMassKg: fuelKgs,
      propellantType: fuelType,
    };

    setPropellantType(fuelType);
    setFuelMass(fuelKgs);
    setRocketConfig((prev) => ({
      ...prev,
      mainBooster: booster,
      propellantTank: tank,
      upperStage: upper,
      edlSystem: edl,
      avionicsPayload: payload,
      nosecone: cone,
    }));
    setLastInstalledSlot('avionicsPayload');
    setLastInstalledAt(Date.now());
  }, [selectedMission, setRocketConfig]);

  const handleInstallPart = useCallback(
    (slotKey, part) => {
      soundEngine.playPartInstallSound();
      updateRocketSlot(slotKey, part);
      setLastInstalledSlot(slotKey);
      setLastInstalledAt(Date.now());
    },
    [updateRocketSlot]
  );

  const handlePropellantChange = useCallback(
    (nextType, nextMass, triggerInstallAnim = false) => {
      setPropellantType(nextType);
      setFuelMass(nextMass);
      const tankObj = {
        id: 'propellant_tank',
        shortLabel: `${nextType.replace(/_/g, ' ')} / ${(nextMass / 1000).toFixed(0)}t`,
        fuelMassKg: nextMass,
        propellantType: nextType,
      };
      if (triggerInstallAnim) {
        handleInstallPart('propellantTank', tankObj);
      } else {
        updateRocketSlot('propellantTank', tankObj);
      }
    },
    [handleInstallPart, updateRocketSlot]
  );

  const handleLaunch = useCallback(async () => {
    if (!allSixInstalled || isLaunching || launchBlocked) return;
    soundEngine.playRolloutSiren();
    setIsLaunching(true);
    setLaunchError(null);

    try {
      const payload = {
        missionId: selectedMission?.id ?? 'unknown',
        missionProfile: selectedMission,
        rocketConfig: {
          ...rocketConfig,
          propellantTank: rocketConfig.propellantTank ?? { fuelMassKg: fuelMass, propellantType },
        },
        totalMassKg: physics.totalMassKg,
        thrustKn: physics.thrustKn,
        twr: physics.twr,
        deltaV: physics.deltaV,
        reliabilityPct: physics.reliabilityPct,
      };
      const result = await createCustomMission(payload);
      setActiveMissionId(result.missionId);
      setTimeout(() => setCurrentStep(MISSION_STEPS.LAUNCH_CONTROL), 850);
    } catch {
      setLaunchError('Offline mode active — launching with local simulator.');
      setActiveMissionId(`sim-${Date.now()}`);
      setTimeout(() => setCurrentStep(MISSION_STEPS.LAUNCH_CONTROL), 1000);
    }
  }, [
    allSixInstalled,
    isLaunching,
    launchBlocked,
    selectedMission,
    rocketConfig,
    fuelMass,
    propellantType,
    physics,
    setActiveMissionId,
    setCurrentStep,
  ]);

  const minTwr = selectedMission?.minTwr ?? 1.25;
  const targetDv = selectedMission?.targetDeltaV ?? 9400;
  const payloadMatch =
    rocketConfig.avionicsPayload?.targetPayload === selectedMission?.requiredPayloadName;
  const payloadRel = rocketConfig.avionicsPayload?.guidanceReliability ?? 0;

  return (
    <div className="pointer-events-auto relative h-[calc(100vh-3.5rem)] w-screen overflow-hidden">
      {/* FULL-SCREEN MARS HORIZON BLUEPRINT 3D STUDIO */}
      <div className="absolute inset-0 z-0">
        <Canvas shadows camera={{ position: [0, 3.3, 8.8], fov: 46 }} gl={{ antialias: true }}>
          <VabHangarScene
            rocketConfig={rocketConfig}
            activeSlot={activeSlot}
            nextEmptySlot={nextEmptySlot}
            xrayMode={xrayMode}
            lastInstalledSlot={lastInstalledSlot}
            lastInstalledAt={lastInstalledAt}
            onSelectSlot={handleSelectSlot}
          />
        </Canvas>
      </div>

      {/* HUD OVERLAY — Middle 45%+ completely clear of UI! */}
      <div className="pointer-events-none relative z-10 flex h-full w-full justify-between p-2.5">
        {/* ── LEFT PANEL (w-[385px]) — Mars Horizon Visual Icon Grid + Part Inspector ── */}
        <div className="pointer-events-auto flex h-full w-[385px] shrink-0 flex-col gap-2">
          <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-blue-400/40 bg-[#0F3E8A]/85 p-2.5 shadow-2xl backdrop-blur-md">
            {/* Stage Selector Tabs */}
            <div className="mb-2 flex items-center justify-between border-b border-blue-300/25 pb-2">
              <span className="font-display text-xs font-extrabold tracking-wider text-white uppercase">
                {activeSlotMeta.shortLabel}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoOptimize}
                  className="flex items-center gap-1 rounded bg-[#00F0FF]/20 border border-[#00F0FF]/60 px-2 py-0.5 text-[9px] font-extrabold text-[#00F0FF] hover:bg-[#00F0FF]/35 transition shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                  title="Automatically equip verified flight-certified parts for this mission"
                >
                  <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                  AUTO-OPTIMIZE STACK
                </button>
                <span className="telemetry-num rounded bg-blue-950/70 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  {installedCount}/6 SLOTS
                </span>
              </div>
            </div>

            <div className="mb-2.5 grid grid-cols-6 gap-1">
              {VAB_ASSEMBLY_ORDER.map((slot) => {
                const isActive = activeSlot === slot.key;
                const isDone = rocketConfig[slot.key] !== null;
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onMouseEnter={() => soundEngine.playHoverChirp()}
                    onClick={() => handleSelectSlot(slot.key)}
                    className={`rounded py-1 text-center text-[9px] font-bold transition-all ${
                      isActive
                        ? 'bg-amber-400 text-slate-950 shadow'
                        : isDone
                        ? 'bg-emerald-500/25 text-emerald-200 ring-1 ring-emerald-400/50'
                        : 'bg-blue-950/60 text-blue-200 hover:bg-blue-800/70'
                    }`}
                  >
                    0{slot.order}
                  </button>
                );
              })}
            </div>

            {/* Two-Column Mars Horizon Layout: Square Tiles (Left) + Part Specs (Right) */}
            <div className="grid min-h-0 flex-1 grid-cols-[164px_1fr] gap-2.5 overflow-y-auto pr-0.5 hud-scroll">
              {activeSlot === 'propellantTank' ? (
                <div className="col-span-2 flex flex-col gap-2.5">
                  <div className="grid grid-cols-3 gap-2">
                    {PROPELLANT_OPTIONS.map((opt) => {
                      const selected = propellantType === opt.id && Boolean(rocketConfig.propellantTank);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onMouseEnter={() => soundEngine.playHoverChirp()}
                          onClick={() => handlePropellantChange(opt.id, fuelMass, !rocketConfig.propellantTank)}
                          className={`flex flex-col items-center justify-center rounded-xl p-2 text-center transition-all ${
                            selected
                              ? 'bg-amber-400/20 ring-4 ring-amber-400'
                              : 'bg-blue-950/65 hover:bg-blue-900/80 ring-1 ring-blue-300/30'
                          }`}
                        >
                          <PartSvgIcon slotKey="propellantTank" partId={opt.id} />
                          <span className="mt-1 text-[10px] font-bold text-white">{opt.label.split(' ')[0]}</span>
                          <span className="telemetry-num text-[9px] text-blue-200">{opt.isp}s Isp</span>
                        </button>
                      );
                    })}
                  </div>
                  <TactileFuelSlider
                    value={fuelMass}
                    min={FUEL_MASS_MIN}
                    max={FUEL_MASS_MAX}
                    step={1000}
                    onChange={(val) => handlePropellantChange(propellantType, val, !rocketConfig.propellantTank)}
                  />
                  <div className="flex gap-2">
                    <TactileButton
                      variant="slate"
                      onClick={() => handleInstallPart('propellantTank', null)}
                      className="flex-1"
                    >
                      Remove
                    </TactileButton>
                    <TactileButton
                      variant="emerald"
                      onClick={() => handlePropellantChange(propellantType, fuelMass, true)}
                      className="flex-[2]"
                    >
                      Attach Core Tank
                    </TactileButton>
                  </div>
                </div>
              ) : (
                <>
                  {/* Left Column: Square 76px x 76px Visual Part Tiles */}
                  <div className="grid grid-cols-2 content-start gap-2">
                    {/* None Tile */}
                    <button
                      type="button"
                      onMouseEnter={() => soundEngine.playHoverChirp()}
                      onClick={() => handleInstallPart(activeSlot, null)}
                      className={`relative flex h-[76px] w-[76px] flex-col items-center justify-center rounded-xl font-bold transition-all ${
                        installedPart === null
                          ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-300'
                          : 'bg-blue-950/70 text-blue-100 ring-1 ring-blue-300/30 hover:bg-blue-900/80'
                      }`}
                    >
                      <span className="text-xs font-extrabold">None</span>
                      {installedPart === null && (
                        <CheckCircle2 className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 text-slate-900" />
                      )}
                    </button>

                    {activePartsList.map((part, idx) => {
                      const isInstalled = installedPart?.id === part.id;
                      const isFocused = inspectedPart?.id === part.id;
                      return (
                        <button
                          key={part.id}
                          type="button"
                          onMouseEnter={() => {
                            soundEngine.playHoverChirp();
                            setPreviewPartId(part.id);
                          }}
                          onClick={() => {
                            setPreviewPartId(part.id);
                            handleInstallPart(activeSlot, part);
                          }}
                          className={`relative flex h-[76px] w-[76px] flex-col items-center justify-center rounded-xl transition-all ${
                            isInstalled
                              ? 'bg-amber-400/20 ring-4 ring-amber-400'
                              : isFocused
                              ? 'bg-blue-800/80 ring-2 ring-blue-300'
                              : 'bg-blue-950/70 ring-1 ring-blue-300/30 hover:bg-blue-900/80'
                          }`}
                        >
                          <PartSvgIcon slotKey={activeSlot} partId={part.id} />
                          <span className="telemetry-num absolute left-1.5 top-1 rounded bg-slate-950/80 px-1 text-[8px] font-bold text-blue-200">
                            {TIER_LABELS[idx] || `LV ${idx + 1}`}
                          </span>
                          {part.straponCount > 0 && (
                            <span className="telemetry-num absolute right-1.5 top-1 rounded bg-amber-400 px-1 text-[8px] font-black text-slate-950">
                              {part.straponCount}x
                            </span>
                          )}
                          {isInstalled && (
                            <CheckCircle2 className="absolute bottom-1 right-1 h-3.5 w-3.5 text-emerald-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right Column inside Left Panel: Selected Part Specs */}
                  {inspectedPart && (
                    <div className="flex flex-col gap-2 text-xs text-white">
                      <div>
                        <div className="font-display text-xs font-extrabold text-white">
                          {inspectedPart.shortLabel}
                        </div>
                        <div className="text-[10px] text-blue-200">{inspectedPart.label}</div>
                      </div>

                      <div className="space-y-1 text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-blue-200">Weight</span>
                          <span className="telemetry-num font-bold">
                            {(inspectedPart.dryMassKg ?? inspectedPart.payloadMassKg ?? 0).toLocaleString()} Kg
                          </span>
                        </div>
                        <div>
                          <div className="mb-0.5 flex justify-between">
                            <span className="text-blue-200">Reliability</span>
                            <span className="telemetry-num font-bold text-emerald-300">
                              {Math.min(99, 88 + (inspectedPart.reliabilityBonus ?? 0))}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-blue-950">
                            <div
                              className="h-full bg-[#22C55E]"
                              style={{ width: `${Math.min(99, 88 + (inspectedPart.reliabilityBonus ?? 0))}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-200">Cost</span>
                          <span className="telemetry-num font-bold text-amber-300">
                            ${inspectedPart.costM ?? 0}M
                          </span>
                        </div>
                      </div>

                      {/* Supplementary Strap-On Booster Tiles when on Main Booster */}
                      {activeSlot === 'mainBooster' && (
                        <div className="border-t border-blue-300/20 pt-1.5">
                          <div className="mb-1 text-[9px] font-bold tracking-wider text-blue-200">
                            SUPPLEMENTARY BOOSTER
                          </div>
                          <div className="grid grid-cols-3 gap-1">
                            {[
                              { label: 'None', id: 'single_core' },
                              { label: '2x SRBs', id: 'heavy_core_2_strapon' },
                              { label: '4x SRBs', id: 'heavy_core_4_strapon' },
                            ].map((srb) => {
                              const target = BOOSTER_PARTS.find((b) => b.id === srb.id);
                              const active = installedPart?.id === srb.id;
                              return (
                                <button
                                  key={srb.id}
                                  type="button"
                                  onClick={() => target && handleInstallPart('mainBooster', target)}
                                  className={`rounded-lg py-1.5 text-[9px] font-bold ${
                                    active
                                      ? 'bg-amber-400 text-slate-950'
                                      : 'bg-blue-950/70 text-blue-100 hover:bg-blue-900'
                                  }`}
                                >
                                  {srb.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <p className="text-[10px] leading-snug text-blue-100/90">
                        {inspectedPart.role || inspectedPart.description}
                      </p>

                      <TactileButton
                        variant={installedPart?.id === inspectedPart.id ? 'emerald' : 'amber'}
                        onClick={() => handleInstallPart(activeSlot, inspectedPart)}
                        className="mt-auto w-full"
                      >
                        {installedPart?.id === inspectedPart.id ? 'Module Installed' : 'Install Module'}
                      </TactileButton>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <TactileButton
            variant="slate"
            onClick={() => {
              soundEngine.playCameraWhoosh();
              setCurrentStep(MISSION_STEPS.MISSION_SELECT);
            }}
            className="shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            BACK TO MISSION MAP
          </TactileButton>
        </div>

        {/* ── CENTER (Middle 45%+ completely clear for 3D Rocket!) ── */}
        <div className="pointer-events-none relative flex flex-1 flex-col items-center justify-between px-4 py-1">
          <div className="pointer-events-auto">
            <HardwareToggleSwitch checked={xrayMode} onChange={setXrayMode} label="X-RAY INTERNAL VIEW" />
          </div>

          <div className="flex w-full items-center justify-between">
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHoverChirp()}
              onClick={() => handleCycleSlot(-1)}
              className="pointer-events-auto flex h-14 w-9 items-center justify-center rounded-lg bg-[#0F3E8A]/60 text-white/80 hover:bg-[#0F3E8A]/90 hover:text-white"
              title="Previous Rocket Stage"
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHoverChirp()}
              onClick={() => handleCycleSlot(1)}
              className="pointer-events-auto flex h-14 w-9 items-center justify-center rounded-lg bg-[#0F3E8A]/60 text-white/80 hover:bg-[#0F3E8A]/90 hover:text-white"
              title="Next Rocket Stage"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
          </div>

          <div className="rounded bg-[#0F3E8A]/70 px-3 py-1 text-[10px] font-semibold tracking-wider text-blue-100 backdrop-blur-sm">
            DRAG TO ROTATE 360° • SCROLL TO ZOOM
          </div>
        </div>

        {/* ── RIGHT PANEL (Fixed-height internal scroll, Mars Horizon Royal Blue) ── */}
        <div className="pointer-events-auto flex h-full w-[300px] shrink-0 flex-col justify-between gap-2 xl:w-[320px]">
          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-blue-400/40 bg-[#0F3E8A]/85 p-3 pr-2 text-white shadow-2xl backdrop-blur-md hud-scroll">
            <div className="mb-2 border-b border-blue-300/25 pb-1.5 font-display text-xs font-extrabold tracking-wider text-amber-300">
              VEHICLE READINESS // {selectedMission?.targetBody ?? 'EARTH'}
            </div>

            {/* PAYLOAD */}
            <div className="mb-3 border-b border-blue-300/20 pb-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>PAYLOAD</span>
                <span className={payloadMatch ? 'text-emerald-300' : 'text-amber-300'}>
                  {payloadMatch ? 'NOMINAL' : 'REQUIRED'}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-blue-200">Mass</span>
                <span className="telemetry-num font-bold">
                  {(rocketConfig.avionicsPayload?.payloadMassKg ?? 0).toLocaleString()} Kg
                </span>
              </div>
              <div className="mt-1.5">
                <div className="mb-0.5 flex justify-between text-[10px]">
                  <span className="text-blue-200">Payload Reliability</span>
                  <span className="telemetry-num font-bold">{payloadRel}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-blue-950">
                  <div className="h-full bg-amber-400 transition-all" style={{ width: `${payloadRel}%` }} />
                </div>
              </div>
            </div>

            {/* UPPER STAGE & FUEL */}
            <div className="mb-3 border-b border-blue-300/20 pb-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>UPPER STAGE & FUEL</span>
                <span className={physics.deltaV >= targetDv ? 'text-emerald-300' : 'text-amber-300'}>
                  {physics.deltaV >= targetDv ? 'NOMINAL' : 'SHORT'}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-blue-200">Delta-V</span>
                <span className="telemetry-num font-bold">
                  {physics.deltaV.toLocaleString()} / {targetDv.toLocaleString()} m/s
                </span>
              </div>
            </div>

            {/* BOOSTER & LIFT */}
            <div className="mb-3 border-b border-blue-300/20 pb-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>BOOSTER & LIFT</span>
                <span className={physics.twr >= minTwr ? 'text-emerald-300' : 'text-amber-300'}>
                  {physics.twr >= minTwr ? 'NOMINAL' : 'DEFICIT'}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-blue-200">TWR</span>
                <span className="telemetry-num font-bold">
                  {physics.twr.toFixed(2)} (Min {minTwr})
                </span>
              </div>
              <div className="mt-0.5 flex justify-between text-xs">
                <span className="text-blue-200">Total Mass</span>
                <span className="telemetry-num font-bold">{physics.totalMassKg.toLocaleString()} Kg</span>
              </div>
            </div>

            {/* EDL & FAIRING SYSTEM */}
            <div className="mb-3 border-b border-blue-300/20 pb-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
                <span>EDL &amp; FAIRING SYSTEM</span>
                <span
                  className={
                    !validationResult.failedConstraints.some((c) => c.id === 'RECOVERY')
                      ? 'text-emerald-300'
                      : 'text-rose-300'
                  }
                >
                  {!validationResult.failedConstraints.some((c) => c.id === 'RECOVERY') ? 'CERTIFIED' : 'HAZARD'}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-xs">
                <span className="text-blue-200">Touchdown</span>
                <span className="telemetry-num font-bold">
                  {physics.touchdown.label} (≤ {physics.touchdown.maxSafe} m/s)
                </span>
              </div>
              <div className="mt-2">
                <div className="mb-0.5 flex justify-between text-[10px]">
                  <span className="text-blue-200">Launch Reliability</span>
                  <span className="telemetry-num font-bold text-emerald-300">{physics.reliabilityPct}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-950">
                  <div
                    className="h-full bg-[#22C55E] transition-all"
                    style={{ width: `${physics.reliabilityPct}%` }}
                  />
                </div>
              </div>
            </div>

            <ResourceBlock
              title="BUDGET & SCHEDULE"
              status={resources.overBudget ? 'OVER CAP' : 'WITHIN CAP'}
              ok={!resources.overBudget}
              rows={[
                ['Cost', `$${resources.costM}M / $${resources.capM}M`],
                ['Schedule', `${resources.time.months} / ${resources.time.deadline} mo${resources.time.late ? ' (LATE)' : ''}`],
              ]}
              barPct={(resources.costM / resources.capM) * 100}
              barBad={resources.overBudget}
            />
            <ResourceBlock
              title="POWER"
              status={resources.power.marginPct < 0 ? 'DEFICIT' : resources.power.marginPct < 8 ? 'TIGHT' : 'NOMINAL'}
              ok={resources.power.marginPct >= 8}
              rows={[
                ['Supply / Demand', `${resources.power.genW} / ${resources.power.useW} W`],
                ['Margin', `${resources.power.marginPct}%`],
              ]}
              barPct={resources.power.genW ? (resources.power.useW / resources.power.genW) * 100 : 0}
              barBad={resources.power.marginPct < 0}
            />
            <ResourceBlock
              title="DATA & COMMS"
              status={resources.data.marginDb < 0 ? 'LINK DEFICIT' : 'NOMINAL'}
              ok={resources.data.marginDb >= 0}
              rows={[
                ['Data / Downlink', `${resources.data.genMbps} / ${resources.data.linkMbps} Mbps`],
                ['Link margin', `${resources.data.marginDb} dB`],
              ]}
            />

            {/* Chief Engineer Maya — Live Constraint Solver Guide */}
            {(() => {
              const allPassed = validationResult.willLand && allSixInstalled;
              const physicsPassedNeedSlots = validationResult.willLand && !allSixInstalled;
              const emptySlots = VAB_ASSEMBLY_ORDER.filter((s) => rocketConfig[s.key] === null);

              return (
                <div
                  className={`flex items-start gap-2 rounded-lg border p-2.5 transition-all ${
                    allPassed
                      ? 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_20px_rgba(16,185,129,0.45)]'
                      : physicsPassedNeedSlots
                      ? 'border-amber-400/70 bg-blue-950/80'
                      : 'border-rose-400/60 bg-slate-950/85'
                  }`}
                >
                  <CrewPortrait character="maya" isSpeaking={!allPassed} size={44} />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div
                      className={`flex items-center gap-1 text-[9px] font-extrabold tracking-wider ${
                        allPassed ? 'text-emerald-300' : 'text-amber-300'
                      }`}
                    >
                      <Radio className="h-3 w-3 animate-pulse" />
                      AVIONICS READINESS // INTEGRATION ADVISORY
                    </div>

                    {allPassed ? (
                      <p className="text-[10.5px] font-semibold leading-snug text-emerald-100">
                        FLIGHT INTEGRITY CERTIFIED: Vehicle configuration satisfies all structural, propulsion, and recovery criteria. Authorized for launchpad rollout.
                      </p>
                    ) : physicsPassedNeedSlots ? (
                      <div className="space-y-1 text-[10px] leading-snug text-amber-100">
                        <div className="font-bold text-emerald-300">
                          4 primary flight constraints nominal. Complete integration for remaining {emptySlots.length} slot(s) to clear rollout:
                        </div>
                        <ul className="list-disc space-y-0.5 pl-3.5 text-blue-100">
                          {emptySlots.map((s) => (
                            <li key={s.key}>
                              Slot {s.order} ({s.shortLabel}): Select any part (or &apos;None&apos; if optional)
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="space-y-1.5 text-[10px] leading-snug">
                        <div className="rounded bg-rose-950/75 px-1.5 py-1 font-semibold text-rose-200">
                          FLIGHT ENVELOPE EXCURSION: {validationResult.failedConstraints[0]?.reason}
                        </div>
                        <div className="font-bold tracking-wide text-amber-300">
                          AVIONICS REMEDIATION DIRECTIVES:
                        </div>
                        <ul className="list-disc space-y-0.5 pl-3.5 text-blue-100">
                          {validationResult.failedConstraints.map((c) => (
                            <li key={c.code}>
                              <span className="font-semibold text-white">{c.fixTip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="shrink-0 space-y-1">
            <GoNoGoPanel
              checks={roleChecks}
              signature={rosterSignature}
              teamMode={teamMode}
              onTeamModeChange={setTeamMode}
              onClearedChange={setTeamCleared}
            />
            {launchError && (
              <div className="text-center text-[10px] font-semibold text-amber-300">{launchError}</div>
            )}
            <TactileButton
              variant="orange"
              hazard
              disabled={!allSixInstalled || isLaunching || launchBlocked}
              onClick={handleLaunch}
              className="w-full py-3 text-xs"
            >
              {isLaunching ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  ROLLING OUT...
                </>
              ) : resources.overBudget ? (
                `OVER BUDGET BY $${(resources.costM - resources.capM).toFixed(1)}M`
              ) : teamMode && allSixInstalled && !teamCleared ? (
                'AWAITING TEAM GO / NO-GO'
              ) : allSixInstalled ? (
                'CML-4 // CONFIRM & ROLLOUT TO LAUNCHPAD >>'
              ) : (
                `ATTACH ALL 6 PARTS (${installedCount}/6) TO ROLLOUT`
              )}
            </TactileButton>
          </div>
        </div>
      </div>
    </div>
  );
}
