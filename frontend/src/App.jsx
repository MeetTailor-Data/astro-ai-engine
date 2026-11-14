import { useCallback, useEffect, useState } from 'react';
import CommandCenter from './components/CommandCenter';
import ErrorBoundary from './components/ErrorBoundary';
import LaunchControl from './components/LaunchControl';
import MissionOutcome from './components/MissionOutcome';
import MissionSelect from './components/MissionSelect';
import MobileBlocker from './components/MobileBlocker';
import RocketBuilder from './components/RocketBuilder';
import TopNavbar from './components/TopNavbar';
import GameWorldCanvas from './components/three/GameWorldCanvas';
import { resolvePlanetKey } from './components/three/SolarSystemScene';
import { MISSION_STEPS, MissionProvider, useMission } from './context/MissionContext';
import { soundEngine } from './utils/soundEffects';

function MissionControlRouter() {
  const {
    currentStep,
    selectedMission,
    setSelectedMission,
    missionProfiles,
  } = useMission();

  const [inspectedSlotKey, setInspectedSlotKey] = useState(null);
  const [solarOverviewMode, setSolarOverviewMode] = useState(false);

  // Start subtle ambient control room hum on first user gesture
  useEffect(() => {
    const startAudio = () => {
      soundEngine.ensureContext();
      if (!soundEngine.isMuted()) {
        soundEngine.startAmbientHum();
      }
      window.removeEventListener('pointerdown', startAudio);
    };
    window.addEventListener('pointerdown', startAudio, { once: true });
    return () => window.removeEventListener('pointerdown', startAudio);
  }, []);

  const handleSelectRocketSlot = useCallback((slotKey) => {
    soundEngine.ensureContext();
    soundEngine.playClickSound();
    setInspectedSlotKey((prev) => (prev === slotKey ? null : slotKey));
  }, []);

  const handleSelectPlanetFrom3D = useCallback(
    (planetKey) => {
      const matched = missionProfiles.find((m) => resolvePlanetKey(m) === planetKey);
      if (!matched) return;
      soundEngine.ensureContext();
      soundEngine.playClickSound();
      soundEngine.playCameraWhoosh();
      setSolarOverviewMode(false);
      setSelectedMission(matched);
    },
    [missionProfiles, setSelectedMission]
  );

  // The VAB (ROCKET_BUILDER), LAUNCH_CONTROL, and MISSION_OUTCOME have their own full-screen Canvas
  const showWorldCanvas =
    currentStep === MISSION_STEPS.COMMAND_CENTER ||
    currentStep === MISSION_STEPS.MISSION_SELECT;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#050811] text-slate-100">
      {/* Persistent Full-Screen 3D Game World Canvas — hidden during VAB / Launch Control */}
      {showWorldCanvas && (
        <GameWorldCanvas
          currentStep={currentStep}
          inspectedSlotKey={inspectedSlotKey}
          onSelectRocketSlot={handleSelectRocketSlot}
          selectedMission={selectedMission}
          solarOverviewMode={solarOverviewMode}
          onSelectPlanet={handleSelectPlanetFrom3D}
        />
      )}

      {/* Tactile Game HUD Layer (locked to 100vw x 100vh) */}
      <div className="pointer-events-none relative z-10 flex h-screen w-screen flex-col overflow-hidden">
        <TopNavbar />

        {currentStep === MISSION_STEPS.COMMAND_CENTER && (
          <CommandCenter
            inspectedSlotKey={inspectedSlotKey}
            setInspectedSlotKey={setInspectedSlotKey}
          />
        )}

        {currentStep === MISSION_STEPS.MISSION_SELECT && (
          <MissionSelect
            solarOverviewMode={solarOverviewMode}
            setSolarOverviewMode={setSolarOverviewMode}
          />
        )}

        {currentStep === MISSION_STEPS.ROCKET_BUILDER && (
          <RocketBuilder />
        )}

        {currentStep === MISSION_STEPS.LAUNCH_CONTROL && (
          <LaunchControl />
        )}

        {currentStep === MISSION_STEPS.MISSION_OUTCOME && (
          <MissionOutcome />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MobileBlocker />
      <MissionProvider>
        <MissionControlRouter />
      </MissionProvider>
    </ErrorBoundary>
  );
}
