import { useState } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Compass,
  Crosshair,
  Eye,
  Flame,
  Gauge,
  Orbit,
  Package,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  Wind,
} from 'lucide-react';
import { MISSION_STEPS, useMission } from '../context/MissionContext';
import { soundEngine } from '../utils/soundEffects';
import { ChamferPanel, CrewPortrait, TypewriterDialogue } from './HudFrame';
import { resolvePlanetKey } from './three/SolarSystemScene';

function getDifficultyMeta(difficulty = '') {
  const lower = difficulty.toLowerCase();
  if (lower.includes('easy') || lower.includes('explorer')) {
    return {
      badge: 'EXPLORER',
      classes: 'border-[#10B981]/60 bg-[#10B981]/20 text-[#10B981]',
      rewards: '+450 RP · +$60M',
    };
  }
  if (lower.includes('normal') || lower.includes('pioneer')) {
    return {
      badge: 'PIONEER',
      classes: 'border-[#F59E0B]/60 bg-[#F59E0B]/20 text-[#F59E0B]',
      rewards: '+950 RP · +$130M',
    };
  }
  return {
    badge: 'VETERAN',
    classes: 'border-rose-500/60 bg-rose-500/20 text-rose-300',
    rewards: '+2,200 RP · +$260M',
  };
}

function getLandingZoneMeta(planetKey) {
  if (planetKey === 'moon') {
    return {
      zoneName: 'SHACKLETON CRATER RIM',
      coords: '89.54°S · 129.78°E // 0 kPa VACUUM',
      accent: '#F59E0B',
      mayaWarning:
        'WARNING: The Moon has a 0 kPa hard vacuum—parachutes do ZERO braking! You MUST equip Throttleable Retro-Thrusters in the VAB or your lander will crash into the crater!',
    };
  }
  if (planetKey === 'mars') {
    return {
      zoneName: 'JEZERO CRATER DELTA',
      coords: '18.38°N · 77.58°E // 0.6 kPa CO₂',
      accent: '#FF6B1A',
      mayaWarning:
        'CRITICAL: Mars has a thin 0.6 kPa CO2 atmosphere—you MUST equip BOTH a Heatshield, Supersonic Parachute, AND Retro-Thrusters in the VAB or your rover will crash!',
    };
  }
  return {
    zoneName: 'SUN-SYNCHRONOUS LEO SHELL',
    coords: '400 KM ORBIT // 101.3 kPa ASCENT',
    accent: '#00F0FF',
    mayaWarning:
      'ADVISORY: Earth’s dense 101.3 kPa air creates heavy Max-Q drag on ascent—equip a streamlined Nosecone Fairing and Drogue/Main Parachutes for safe orbital deployment & recovery!',
  };
}

function MiniPlanetIcon({ planetKey, active }) {
  if (planetKey === 'moon') {
    return (
      <div
        className={`relative h-10 w-10 shrink-0 rounded-full border ${
          active ? 'border-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.6)]' : 'border-slate-500/60'
        }`}
        style={{
          background:
            'radial-gradient(circle at 32% 30%, #e2e8f0 0%, #94a3b8 55%, #334155 100%)',
        }}
      >
        <span className="absolute left-2 top-2.5 h-2 w-2 rounded-full bg-slate-600/70" />
        <span className="absolute right-2.5 bottom-2.5 h-2.5 w-2.5 rounded-full bg-slate-700/70" />
      </div>
    );
  }
  if (planetKey === 'mars') {
    return (
      <div
        className={`relative h-10 w-10 shrink-0 rounded-full border ${
          active ? 'border-[#FF6B1A] shadow-[0_0_14px_rgba(255,107,26,0.7)]' : 'border-orange-500/50'
        }`}
        style={{
          background:
            'radial-gradient(circle at 32% 30%, #fb923c 0%, #c2410c 55%, #431407 100%)',
        }}
      >
        <span className="absolute inset-x-3 top-0.5 h-1 rounded-full bg-white/80" />
        <span className="absolute left-2.5 top-4 h-1.5 w-4 rotate-12 rounded-full bg-amber-950/60" />
      </div>
    );
  }
  return (
    <div
      className={`relative h-10 w-10 shrink-0 rounded-full border ${
        active ? 'border-[#00F0FF] shadow-[0_0_14px_rgba(0,240,255,0.7)]' : 'border-cyan-500/50'
      }`}
      style={{
        background:
          'radial-gradient(circle at 30% 28%, #38bdf8 0%, #0284c7 50%, #082f49 100%)',
      }}
    >
      <span className="absolute left-2 top-2 h-3 w-3 rounded-full bg-emerald-500/80" />
      <span className="absolute right-2 bottom-2.5 h-2.5 w-3.5 rounded-full bg-emerald-600/75" />
      <span className="absolute inset-x-1 top-4 h-1 rounded-full bg-white/40 blur-[0.5px]" />
    </div>
  );
}

export default function MissionSelect({ solarOverviewMode, setSolarOverviewMode }) {
  const {
    missionProfiles,
    isLoadingProfiles,
    reloadMissionProfiles,
    selectedMission,
    setSelectedMission,
    setCurrentStep,
  } = useMission();

  const [isMayaSpeaking, setIsMayaSpeaking] = useState(false);

  const activeMission = selectedMission || missionProfiles[0] || null;
  const activePlanetKey = resolvePlanetKey(activeMission);
  const landingZone = getLandingZoneMeta(activePlanetKey);

  const handleSelectMission = (mission) => {
    soundEngine.ensureContext();
    soundEngine.playClickSound();
    if (selectedMission?.id !== mission.id || solarOverviewMode) {
      soundEngine.playCameraWhoosh();
    }
    setSolarOverviewMode(false);
    setSelectedMission(mission);
  };

  const handleReturnToBase = () => {
    soundEngine.playClickSound();
    soundEngine.playCameraWhoosh();
    setSolarOverviewMode(false);
    setCurrentStep(MISSION_STEPS.COMMAND_CENTER);
  };

  const handleEnterVab = () => {
    if (!activeMission) return;
    soundEngine.ensureContext();
    soundEngine.playHangarDoorSound();
    confetti({
      particleCount: 45,
      spread: 65,
      origin: { x: 0.78, y: 0.85 },
      colors: ['#00F0FF', '#FF6B1A', '#10B981', '#F59E0B'],
    });
    setSelectedMission(activeMission);
    setCurrentStep(MISSION_STEPS.ROCKET_BUILDER);
  };

  return (
    <div className="pointer-events-none relative z-20 flex h-[calc(100vh-3.5rem)] w-screen justify-between gap-3 p-3 sm:p-4">
      {/* LEFT HUD CAROUSEL: PLANETARY CONTRACTS */}
      <motion.section
        initial={{ opacity: 0, x: -32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="pointer-events-auto flex w-[320px] shrink-0 flex-col gap-2.5 sm:w-[360px]"
      >
        {/* Top Action Bar */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHoverChirp()}
            onClick={handleReturnToBase}
            className="game-btn-slanted flex items-center gap-1.5 border border-[#00F0FF]/45 bg-[#0A1328]/90 px-4 py-1.5 font-display text-[11px] font-bold tracking-wider text-slate-200 hover:text-[#00F0FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>BASE PAD</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onMouseEnter={() => soundEngine.playHoverChirp()}
              onClick={() => {
                soundEngine.playClickSound();
                soundEngine.playCameraWhoosh();
                setSolarOverviewMode((prev) => !prev);
              }}
              className={`hud-chamfer-sm flex items-center gap-1 border px-2.5 py-1.5 text-[10px] font-bold tracking-wider transition-colors ${
                solarOverviewMode
                  ? 'border-[#00F0FF] bg-[#00F0FF]/20 text-[#00F0FF]'
                  : 'border-slate-700 bg-[#0A1224]/90 text-slate-300 hover:border-[#00F0FF]/60'
              }`}
              title="Toggle full 3D Solar System Overview"
            >
              <Eye className="h-3 w-3" />
              <span className="telemetry-num">{solarOverviewMode ? 'PLANET ZOOM' : 'SOLAR MAP'}</span>
            </button>

            <button
              type="button"
              onMouseEnter={() => soundEngine.playHoverChirp()}
              onClick={() => {
                soundEngine.playClickSound();
                reloadMissionProfiles();
              }}
              disabled={isLoadingProfiles}
              className="hud-chamfer-sm flex h-7 w-7 items-center justify-center border border-slate-700 bg-[#0A1224]/90 text-slate-300 hover:border-[#00F0FF]/60 hover:text-[#00F0FF]"
              title="Refresh GET /api/missions/profiles"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingProfiles ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mission Contract Carousel Panel */}
        <ChamferPanel className="min-h-0 flex-1" innerClassName="flex flex-col p-3.5">
          <div className="flex items-center justify-between border-b border-[#00F0FF]/25 pb-2">
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-[#00F0FF]">
                <Compass className="h-3.5 w-3.5" />
                <span>SOLAR SYSTEM CONTRACTS</span>
              </div>
              <h1 className="font-display text-sm font-extrabold tracking-wider text-white">
                SELECT TARGET BODY
              </h1>
            </div>
            <span className="telemetry-num bg-[#00F0FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#00F0FF]">
              {missionProfiles.length} ACTIVE
            </span>
          </div>

          <div className="hud-scroll mt-2.5 flex-1 space-y-2.5 overflow-y-auto pr-1">
            {isLoadingProfiles && missionProfiles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Scanning Deep Space Telemetry Network...
              </div>
            ) : (
              missionProfiles.map((mission) => {
                const isSelected = activeMission?.id === mission.id;
                const pKey = resolvePlanetKey(mission);
                const diffMeta = getDifficultyMeta(mission.difficulty);

                return (
                  <button
                    key={mission.id}
                    type="button"
                    onMouseEnter={() => soundEngine.playHoverChirp()}
                    onClick={() => handleSelectMission(mission)}
                    className={`hud-chamfer-sm group relative w-full border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-[#00F0FF] bg-gradient-to-br from-[#0D1E3F]/95 to-[#070E1F]/95 shadow-[inset_0_0_20px_rgba(0,240,255,0.18)]'
                        : 'border-slate-700/80 bg-[#070D1D]/85 hover:border-[#00F0FF]/50 hover:bg-[#0B152C]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <MiniPlanetIcon planetKey={pKey} active={isSelected} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span
                            className={`border px-1.5 py-0.5 font-display text-[9px] font-extrabold tracking-widest ${diffMeta.classes}`}
                          >
                            {diffMeta.badge}
                          </span>
                          <span className="telemetry-num flex items-center gap-1 text-[10px] font-semibold text-amber-300">
                            <Sparkles className="h-2.5 w-2.5" />
                            {diffMeta.rewards}
                          </span>
                        </div>
                        <h2 className="mt-1 truncate font-display text-sm font-bold text-white">
                          {mission.name}
                        </h2>
                        <p className="telemetry-num text-[10px] text-slate-400">
                          {mission.code || mission.targetBody}
                        </p>
                      </div>
                    </div>

                    {/* Compact Telemetry Strip */}
                    <div className="telemetry-num mt-2.5 grid grid-cols-3 gap-1.5 border-t border-slate-800 pt-2 text-[10px]">
                      <div>
                        <span className="block text-[9px] text-slate-500">MIN TWR</span>
                        <span className="font-bold text-amber-300">≥ {Number(mission.minTwr).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500">TARGET ΔV</span>
                        <span className="font-bold text-[#00F0FF]">
                          {Number(mission.targetDeltaV).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-slate-500">TOUCHDOWN</span>
                        <span className="font-bold text-[#10B981]">
                          ≤ {Number(mission.maxSafeTouchdownSpeedMs).toFixed(1)} m/s
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-2 border-t border-slate-800 pt-2 text-center text-[10px] text-slate-400">
            TIP: Click any 3D planet directly in space or drag to orbit!
          </div>
        </ChamferPanel>
      </motion.section>

      {/* RIGHT HUD HOLOGRAPHIC DOSSIER: PLANETARY CRITERIA & CHIEF ENGINEER MAYA */}
      <motion.aside
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="pointer-events-auto flex w-[360px] shrink-0 flex-col sm:w-[420px]"
      >
        <ChamferPanel
          variant={activePlanetKey === 'mars' ? 'amber' : 'cyan'}
          className="min-h-0 flex-1"
          innerClassName="flex flex-col p-3.5"
        >
          {activeMission ? (
            <>
              {/* 3D Landing Zone Hologram Header */}
              <div className="flex items-center justify-between gap-3 border-b border-[#00F0FF]/25 pb-2.5">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-[#00F0FF]">
                    <Crosshair className="h-3.5 w-3.5" />
                    <span>HOLOGRAPHIC MISSION DOSSIER</span>
                  </div>
                  <h2 className="mt-0.5 truncate font-display text-base font-extrabold text-white">
                    {activeMission.name}
                  </h2>
                  <p className="telemetry-num text-[10px]" style={{ color: landingZone.accent }}>
                    LZ: {landingZone.zoneName}
                  </p>
                </div>

                {/* Spinning Hologram Landing Zone Reticle Widget */}
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center border border-[#00F0FF]/35 bg-[#040914]">
                  <svg viewBox="0 0 64 64" className="reticle-spin h-12 w-12">
                    <circle
                      cx="32"
                      cy="32"
                      r="24"
                      fill="none"
                      stroke={landingZone.accent}
                      strokeWidth="1.5"
                      strokeDasharray="6 4"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="14"
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="1.2"
                    />
                    <line x1="32" y1="2" x2="32" y2="14" stroke={landingZone.accent} strokeWidth="1.5" />
                    <line x1="32" y1="50" x2="32" y2="62" stroke={landingZone.accent} strokeWidth="1.5" />
                    <line x1="2" y1="32" x2="14" y2="32" stroke={landingZone.accent} strokeWidth="1.5" />
                    <line x1="50" y1="32" x2="62" y2="32" stroke={landingZone.accent} strokeWidth="1.5" />
                  </svg>
                  <span
                    className="absolute h-2 w-2 rounded-full"
                    style={{ backgroundColor: landingZone.accent, boxShadow: `0 0 8px ${landingZone.accent}` }}
                  />
                </div>
              </div>

              {/* Scrollable Internal Engineering Dossier */}
              <div className="hud-scroll mt-2.5 flex-1 space-y-2.5 overflow-y-auto pr-1">
                {/* 7 Exact Engineering Criteria */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="border border-slate-800 bg-[#050A17]/90 px-2.5 py-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">
                      Target Altitude
                    </span>
                    <p className="telemetry-num text-xs font-bold text-white">
                      {activeMission.targetAltitudeLabel ||
                        `${Number(activeMission.targetAltitudeKm || 0).toLocaleString()} km`}
                    </p>
                  </div>

                  <div className="border border-slate-800 bg-[#050A17]/90 px-2.5 py-1.5">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400">
                      Surface Gravity
                    </span>
                    <p className="telemetry-num text-xs font-bold text-white">
                      {activeMission.gravityLabel || `${activeMission.gravityMs2} m/s²`}
                    </p>
                  </div>

                  <div className="col-span-2 flex items-center justify-between border border-slate-800 bg-[#050A17]/90 px-2.5 py-1.5">
                    <div>
                      <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400">
                        <Wind className="h-3 w-3 text-[#00F0FF]" />
                        Atmosphere Density
                      </span>
                      <p className="telemetry-num text-xs font-bold text-[#00F0FF]">
                        {activeMission.atmospherePressureKpa} kPa · {activeMission.atmosphereType}
                      </p>
                    </div>
                    <span className="telemetry-num max-w-[175px] truncate text-right text-[10px] text-slate-300">
                      {activeMission.atmosphere}
                    </span>
                  </div>

                  <div className="border border-slate-800 bg-[#050A17]/90 px-2.5 py-1.5">
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400">
                      <Package className="h-3 w-3 text-slate-300" />
                      Required Payload
                    </span>
                    <p className="telemetry-num text-xs font-bold text-slate-100">
                      {activeMission.requiredPayload}
                    </p>
                  </div>

                  <div className="border border-slate-800 bg-[#050A17]/90 px-2.5 py-1.5">
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400">
                      <Gauge className="h-3 w-3 text-amber-400" />
                      Minimum TWR
                    </span>
                    <p className="telemetry-num text-xs font-bold text-amber-300">
                      ≥ {Number(activeMission.minTwr).toFixed(2)}
                    </p>
                  </div>

                  <div className="border border-slate-800 bg-[#050A17]/90 px-2.5 py-1.5">
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400">
                      <Orbit className="h-3 w-3 text-[#00F0FF]" />
                      Target Delta-V
                    </span>
                    <p className="telemetry-num text-xs font-bold text-[#00F0FF]">
                      {Number(activeMission.targetDeltaV).toLocaleString()} m/s
                    </p>
                  </div>

                  <div className="border border-slate-800 bg-[#050A17]/90 px-2.5 py-1.5">
                    <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-slate-400">
                      <Rocket className="h-3 w-3 text-[#10B981]" />
                      Max Touchdown
                    </span>
                    <p className="telemetry-num text-xs font-bold text-[#10B981]">
                      ≤ {Number(activeMission.maxSafeTouchdownSpeedMs).toFixed(1)} m/s
                    </p>
                  </div>
                </div>

                {/* Mandatory EDL Hardware Matrix */}
                {activeMission.edlRequirements && (
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                    <div
                      className={`border px-1.5 py-1.5 ${
                        activeMission.edlRequirements.heatshieldRequired
                          ? 'border-[#FF6B1A]/70 bg-[#FF6B1A]/15 text-orange-300'
                          : 'border-slate-800 bg-[#050A17] text-slate-500'
                      }`}
                    >
                      <Flame className="mx-auto mb-0.5 h-3.5 w-3.5" />
                      <div className="font-bold">HEATSHIELD</div>
                      <div className="telemetry-num text-[9px]">
                        {activeMission.edlRequirements.heatshieldRequired ? 'MANDATORY' : 'OPTIONAL'}
                      </div>
                    </div>
                    <div
                      className={`border px-1.5 py-1.5 ${
                        activeMission.edlRequirements.parachuteEffective
                          ? 'border-[#10B981]/60 bg-[#10B981]/15 text-[#10B981]'
                          : 'border-rose-500/60 bg-rose-500/15 text-rose-300'
                      }`}
                    >
                      <Wind className="mx-auto mb-0.5 h-3.5 w-3.5" />
                      <div className="font-bold">PARACHUTE</div>
                      <div className="telemetry-num text-[9px]">
                        {activeMission.edlRequirements.parachuteEffective ? 'EFFECTIVE' : 'USELESS'}
                      </div>
                    </div>
                    <div
                      className={`border px-1.5 py-1.5 ${
                        activeMission.edlRequirements.retroThrustersRequired
                          ? 'border-[#00F0FF]/70 bg-[#00F0FF]/15 text-[#00F0FF]'
                          : 'border-slate-800 bg-[#050A17] text-slate-500'
                      }`}
                    >
                      <Rocket className="mx-auto mb-0.5 h-3.5 w-3.5" />
                      <div className="font-bold">RETRO-JETS</div>
                      <div className="telemetry-num text-[9px]">
                        {activeMission.edlRequirements.retroThrustersRequired ? 'MANDATORY' : 'BACKUP'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Warning Badge from Chief Engineer Maya */}
                <div className="border border-[#FF6B1A]/55 bg-gradient-to-br from-[#231009]/95 to-[#0A0E1B]/95 p-2.5">
                  <div className="flex items-start gap-2.5">
                    <CrewPortrait character="maya" isSpeaking={isMayaSpeaking} size={64} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 border-b border-[#FF6B1A]/30 pb-1">
                        <span className="flex items-center gap-1 font-display text-[11px] font-extrabold text-[#FF6B1A]">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          CHIEF ENGINEER MAYA
                        </span>
                        <span className="telemetry-num bg-[#FF6B1A]/20 px-1.5 py-0.5 text-[9px] font-bold text-orange-300">
                          EDL ALERT
                        </span>
                      </div>
                      <div className="mt-1">
                        <TypewriterDialogue
                          text={landingZone.mayaWarning}
                          pitchOffset={90}
                          speedMs={15}
                          onSpeakingChange={setIsMayaSpeaking}
                          className="text-[12px] text-orange-100"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Game Action Button */}
              <div className="mt-3 border-t border-slate-800 pt-2.5">
                <button
                  type="button"
                  onMouseEnter={() => soundEngine.playHoverChirp()}
                  onClick={handleEnterVab}
                  className="game-btn-slanted thruster-glow group flex w-full items-center justify-center gap-2 border-2 border-[#FFB347] bg-gradient-to-r from-[#FF5500] via-[#FF6B1A] to-[#F59E0B] px-5 py-3 text-center font-display text-xs font-black tracking-wider text-white sm:text-sm"
                >
                  <span>STAGE 02 // CML-2 &rarr; ENTER VAB (POINT DESIGN) &gt;&gt;</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-slate-400">
              <AlertTriangle className="mb-2 h-8 w-8 text-amber-400" />
              <p className="text-xs">Select a planetary contract to inspect telemetry criteria.</p>
            </div>
          )}
        </ChamferPanel>
      </motion.aside>
    </div>
  );
}
