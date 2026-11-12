import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { MISSION_STEPS } from '../../context/MissionContext';
import SpaceBaseScene, { ROCKET_ZONE_TARGETS } from './SpaceBaseScene';
import SolarSystemScene, {
  SOLAR_CAMERA_TARGETS,
  resolvePlanetKey,
} from './SolarSystemScene';

function CameraController({
  currentStep,
  inspectedSlotKey,
  solarOverviewMode,
  activePlanetKey,
}) {
  const { camera } = useThree();
  const controlsRef = useRef();
  const desiredCamPos = useRef(new THREE.Vector3(2.2, 6.2, 16.5));
  const desiredTarget = useRef(new THREE.Vector3(0.6, 4.4, 0));
  const isAutoFlying = useRef(true);

  const preset = useMemo(() => {
    if (currentStep === MISSION_STEPS.COMMAND_CENTER) {
      if (inspectedSlotKey && ROCKET_ZONE_TARGETS[inspectedSlotKey]) {
        return ROCKET_ZONE_TARGETS[inspectedSlotKey];
      }
      return ROCKET_ZONE_TARGETS.overview;
    }

    if (currentStep === MISSION_STEPS.MISSION_SELECT) {
      if (solarOverviewMode) {
        return SOLAR_CAMERA_TARGETS.overview;
      }
      return SOLAR_CAMERA_TARGETS[activePlanetKey] || SOLAR_CAMERA_TARGETS.overview;
    }

    // For VAB / Launch / Outcome placeholders, drift gently near the Solar System overview
    return SOLAR_CAMERA_TARGETS.overview;
  }, [currentStep, inspectedSlotKey, solarOverviewMode, activePlanetKey]);

  useEffect(() => {
    desiredCamPos.current.set(...preset.camera);
    desiredTarget.current.set(...preset.lookAt);
    isAutoFlying.current = true;
  }, [preset]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (isAutoFlying.current) {
      const stepAlpha = 1 - Math.exp(-3.4 * Math.min(delta, 0.05));
      camera.position.lerp(desiredCamPos.current, stepAlpha);
      controls.target.lerp(desiredTarget.current, stepAlpha);

      const camDist = camera.position.distanceTo(desiredCamPos.current);
      const tgtDist = controls.target.distanceTo(desiredTarget.current);
      if (camDist < 0.06 && tgtDist < 0.06) {
        isAutoFlying.current = false;
      }
    }
    controls.update();
  });

  const isBaseView = currentStep === MISSION_STEPS.COMMAND_CENTER;

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.06}
      enablePan={false}
      minDistance={isBaseView ? 3.5 : 5.0}
      maxDistance={isBaseView ? 25 : 42}
      minPolarAngle={isBaseView ? 0.25 : 0.35}
      maxPolarAngle={isBaseView ? Math.PI * 0.48 : Math.PI * 0.72}
      rotateSpeed={0.65}
      zoomSpeed={0.75}
      onStart={() => {
        isAutoFlying.current = false;
      }}
    />
  );
}

export default function GameWorldCanvas({
  currentStep,
  inspectedSlotKey,
  onSelectRocketSlot,
  selectedMission,
  solarOverviewMode,
  onSelectPlanet,
}) {
  const activePlanetKey = useMemo(
    () => resolvePlanetKey(selectedMission),
    [selectedMission]
  );

  const isDaytimeBase = currentStep === MISSION_STEPS.COMMAND_CENTER;

  return (
    <div className={`fixed inset-0 z-0 h-screen w-screen ${isDaytimeBase ? 'bg-[#38BDF8]' : 'bg-[#020409]'}`}>
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 6, 16], fov: 45, near: 0.1, far: 300 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={[isDaytimeBase ? '#38BDF8' : '#020409']} />
        <fog attach="fog" args={[isDaytimeBase ? '#BAE6FD' : '#020409', isDaytimeBase ? 48 : 42, isDaytimeBase ? 140 : 135]} />

        {/* Persistent Deep-Space Starfield for Solar System & Outcome */}
        {!isDaytimeBase && (
          <Stars
            radius={95}
            depth={60}
            count={4000}
            factor={3.8}
            saturation={0.35}
            fade
            speed={0.4}
          />
        )}

        {/* World 1: 3D Space Agency Launch Complex at y=0 */}
        <SpaceBaseScene
          activeSlotKey={currentStep === MISSION_STEPS.COMMAND_CENTER ? inspectedSlotKey : null}
          onSelectSlot={onSelectRocketSlot}
          isDaytime={isDaytimeBase}
        />

        {/* World 2: 3D Solar System & Planetary Targets high above at y=88 */}
        <SolarSystemScene
          activePlanetKey={activePlanetKey}
          onSelectPlanet={onSelectPlanet}
        />

        <CameraController
          currentStep={currentStep}
          inspectedSlotKey={inspectedSlotKey}
          solarOverviewMode={solarOverviewMode}
          activePlanetKey={activePlanetKey}
        />
      </Canvas>
    </div>
  );
}
