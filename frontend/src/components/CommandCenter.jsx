import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Cpu,
  Crosshair,
  Eye,
  Flame,
  Fuel,
  Layers,
  MousePointerClick,
  Radio,
  Rocket,
  Shield,
  Sparkles,
} from 'lucide-react';
import { MISSION_STEPS, useMission } from '../context/MissionContext';
import { ROCKET_ANATOMY_SLOTS } from '../data/rocketAnatomy';
import { soundEngine } from '../utils/soundEffects';
import { ChamferPanel, CrewPortrait, TypewriterDialogue } from './HudFrame';

const SLOT_ICONS = {
  nosecone: Sparkles,
  avionicsPayload: Cpu,
  edlSystem: Shield,
  upperStage: Rocket,
  propellantTank: Fuel,
  mainBooster: Flame,
};

const SLOT_SHORT_TITLES = {
  nosecone: '1. Nosecone Fairing',
  avionicsPayload: '2. Avionics & Payload',
  edlSystem: '3. EDL Landing System',
  upperStage: '4. Upper Vacuum Stage',
  propellantTank: '5. LOX + Fuel Tanks',
  mainBooster: '6. Main Gimbal Boosters',
};

const SLOT_STACK_LOCATIONS = {
  nosecone: 'STAGE TOP // +8.6m – 10.2m',
  avionicsPayload: 'UPPER BAY // +7.6m – 8.6m',
  edlSystem: 'RECOVERY COLLAR // +6.5m – 7.6m',
  upperStage: 'INTERSTAGE // +5.2m – 6.5m',
  propellantTank: 'CORE TANK // +2.6m – 5.2m',
  mainBooster: 'PAD BASE // +0.6m – 2.6m',
};

const WELCOME_BRIEFING =
  'Commander Aestro here. Welcome to Pad-39A! Before we clear the tower, inspect our 6-part launch vehicle on the pad, then open the Solar System Map to select a planetary contract and assemble a rocket that meets every physics requirement.';

export default function CommandCenter({ inspectedSlotKey, setInspectedSlotKey }) {
  const { setCurrentStep, missionProfiles } = useMission();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const activeSlot = ROCKET_ANATOMY_SLOTS.find((s) => s.key === inspectedSlotKey) || null;

  const dialogueText = activeSlot
    ? `MODULE 0${activeSlot.order} (${activeSlot.shortLabel.toUpperCase()}): ${activeSlot.marsHorizonNote}`
    : WELCOME_BRIEFING;

  const handleSelectZone = useCallback(
    (slotKey) => {
      soundEngine.ensureContext();
      soundEngine.startAmbientHum();
      soundEngine.playClickSound();
      setInspectedSlotKey((prev) => (prev === slotKey ? null : slotKey));
    },
    [setInspectedSlotKey]
  );

  const handleOpenMissionMap = () => {
    soundEngine.ensureContext();
    soundEngine.startAmbientHum();
    soundEngine.playClickSound();
    soundEngine.playCameraWhoosh();
    setInspectedSlotKey(null);
    setCurrentStep(MISSION_STEPS.MISSION_SELECT);
  };

  return (
    <div className="pointer-events-none relative z-20 h-[calc(100vh-3.5rem)] w-screen overflow-hidden">
      {/* TOP-LEFT FLOATING STATUS BADGE & CAMERA HINT */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="pointer-events-auto absolute left-3 top-3 flex flex-col gap-2 sm:left-5 sm:top-4"
      >
        <ChamferPanel className="w-[310px] sm:w-[350px]" innerClassName="px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 animate-pulse text-[#00F0FF]" />
              <span className="font-display text-[11px] font-bold tracking-[0.16em] text-[#00F0FF]">
                SPACEPORT // PAD-39A
              </span>
            </div>
            <span className="telemetry-num bg-[#10B981]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#10B981]">
              {missionProfiles.length || 3} CONTRACTS
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-300">
            <span className="flex items-center gap-1.5">
              <MousePointerClick className="h-3.5 w-3.5 text-[#FF6B1A]" />
              <span>Drag to orbit 3D base · Click rocket</span>
            </span>
            {inspectedSlotKey && (
              <button
                type="button"
                onMouseEnter={() => soundEngine.playHoverChirp()}
                onClick={() => {
                  soundEngine.playClickSound();
                  setInspectedSlotKey(null);
                }}
                className="telemetry-num flex items-center gap-1 border border-[#00F0FF]/50 bg-[#00F0FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#00F0FF] hover:bg-[#00F0FF]/25"
              >
                <Eye className="h-3 w-3" />
                OVERVIEW
              </button>
            )}
          </div>
        </ChamferPanel>
      </motion.div>

      {/* RIGHT HUD DRAWER: 3D ROCKET ANATOMY VEHICLE SCHEMATICS */}
      <motion.aside
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        className="pointer-events-auto absolute right-3 top-3 w-[320px] sm:right-5 sm:top-4 sm:w-[375px]"
      >
        <ChamferPanel innerClassName="p-3.5">
          <div className="flex max-h-[calc(100vh-11.5rem)] flex-col">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-[#00F0FF]/25 pb-2.5">
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-[#00F0FF]">
                  <Crosshair className="h-3.5 w-3.5" />
                  <span>VEHICLE SCHEMATICS</span>
                </div>
                <h2 className="font-display text-sm font-bold tracking-wider text-white">
                  6-STAGE INTEGRATED STACK
                </h2>
              </div>
              <span className="telemetry-num border border-slate-700 bg-[#050811] px-2 py-0.5 text-[10px] text-slate-300">
                {activeSlot ? `ZONE 0${activeSlot.order}` : 'FULL STACK'}
              </span>
            </div>

            {/* 6 Clickable Rocket Zones */}
            <div className="mt-2.5 grid grid-cols-1 gap-1.5">
              {ROCKET_ANATOMY_SLOTS.map((slot) => {
                const Icon = SLOT_ICONS[slot.key] || Layers;
                const isSelected = inspectedSlotKey === slot.key;

                return (
                  <button
                    key={slot.key}
                    type="button"
                    onMouseEnter={() => soundEngine.playHoverChirp()}
                    onClick={() => handleSelectZone(slot.key)}
                    className={`hud-chamfer-sm group flex items-center justify-between border px-3 py-2 text-left transition-all ${
                      isSelected
                        ? 'border-[#00F0FF] bg-[#00F0FF]/18 text-white shadow-[inset_0_0_16px_rgba(0,240,255,0.22)]'
                        : 'border-slate-700/70 bg-[#070E1E]/85 text-slate-300 hover:border-[#00F0FF]/55 hover:bg-[#0D1A36]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center border border-slate-700 bg-[#050811]"
                        style={{ color: slot.accent, borderColor: isSelected ? slot.accent : undefined }}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-display text-[11px] font-bold tracking-wide">
                          {SLOT_SHORT_TITLES[slot.key]}
                        </div>
                        <div className="telemetry-num truncate text-[9px] text-slate-400">
                          {SLOT_STACK_LOCATIONS[slot.key]}
                        </div>
                      </div>
                    </div>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full transition-transform group-hover:scale-125"
                      style={{
                        backgroundColor: slot.accent,
                        boxShadow: isSelected ? `0 0 10px ${slot.accent}` : 'none',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Holographic Zone Tooltip Card */}
            <div className="hud-scroll mt-2.5 overflow-y-auto border-t border-[#00F0FF]/20 pt-2.5">
              {activeSlot ? (
                <div className="border border-[#00F0FF]/35 bg-[#040914]/90 p-2.5">
                  <div className="flex items-center justify-between">
                    <span
                      className="telemetry-num text-[10px] font-bold tracking-widest"
                      style={{ color: activeSlot.accent }}
                    >
                      // {activeSlot.category}
                    </span>
                    <span className="telemetry-num text-[10px] text-slate-400">
                      {SLOT_STACK_LOCATIONS[activeSlot.key]}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-slate-200">{activeSlot.role}</p>
                  <div className="mt-2 border-t border-slate-800 pt-1.5">
                    <span className="telemetry-num text-[9px] font-bold uppercase tracking-wider text-[#00F0FF]">
                      TELEMETRY IMPACT:{' '}
                    </span>
                    <span className="telemetry-num text-[10px] text-slate-300">
                      {activeSlot.telemetryImpact}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-800 bg-[#040914]/80 p-2.5 text-xs text-slate-300">
                  <span className="font-display text-[10px] font-bold uppercase tracking-wider text-[#00F0FF]">
                    SELECT MODULE ON STACK OR 3D VIEW
                  </span>
                  <p className="mt-1 text-[11px] leading-snug text-slate-400">
                    Camera locks onto the selected stage with a holographic ring so you can inspect
                    aerodynamics, propulsion, and EDL placement before visiting the VAB.
                  </p>
                </div>
              )}
            </div>
          </div>
        </ChamferPanel>
      </motion.aside>

      {/* BOTTOM-LEFT: ANIMATED FLIGHT DIRECTOR DIALOGUE */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="pointer-events-auto absolute bottom-5 left-3 z-30 w-[calc(100vw-24rem)] min-w-[340px] max-w-[530px] sm:bottom-6 sm:left-5"
      >
        <ChamferPanel innerClassName="p-3">
          <div className="flex items-center gap-3.5">
            <CrewPortrait character="rudra" isSpeaking={isSpeaking} size={80} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2 border-b border-[#00F0FF]/25 pb-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
                  <span className="font-display text-xs font-extrabold tracking-wider text-white">
                    COMMANDER AESTRO
                  </span>
                </div>
                <span className="telemetry-num bg-[#00F0FF]/15 px-2 py-0.5 text-[10px] font-bold text-[#00F0FF]">
                  FLIGHT DIRECTOR
                </span>
              </div>
              <div className="mt-1.5 min-h-[52px]">
                <TypewriterDialogue
                  text={dialogueText}
                  pitchOffset={-40}
                  speedMs={16}
                  onSpeakingChange={setIsSpeaking}
                />
              </div>
            </div>
          </div>
        </ChamferPanel>
      </motion.div>

      {/* BOTTOM-RIGHT: BIG SLANTED LAUNCH-ORANGE GAME BUTTON */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.15 }}
        className="pointer-events-auto absolute bottom-5 right-3 z-30 sm:bottom-6 sm:right-5"
      >
        <button
          type="button"
          onMouseEnter={() => soundEngine.playHoverChirp()}
          onClick={handleOpenMissionMap}
          className="game-btn-slanted thruster-glow group relative flex items-center gap-3 border-2 border-[#FFB347] bg-gradient-to-r from-[#FF5500] via-[#FF6B1A] to-[#F59E0B] px-6 py-3.5 text-left text-[#050811] shadow-[0_0_32px_rgba(255,107,26,0.55)]"
        >
          <div>
            <span className="telemetry-num block text-[10px] font-extrabold tracking-[0.22em] text-[#050811]/85">
              STAGE 01 // PLANETARY CONTRACTS
            </span>
            <span className="font-display text-xs font-black tracking-wider text-white drop-shadow sm:text-sm">
              OPEN SOLAR SYSTEM MISSION MAP &gt;&gt;
            </span>
          </div>
          <ChevronRight className="h-5 w-5 text-white transition-transform group-hover:translate-x-1.5" />
        </button>
      </motion.div>
    </div>
  );
}
