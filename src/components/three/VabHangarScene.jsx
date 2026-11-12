import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ModularRocket3D, { computeSlotWorldPositions } from './ModularRocket3D';

function GantryCrane({ targetSlotY = 3.0, lastInstalledAt }) {
  const trolleyRef = useRef();
  const cableRef = useRef();
  const hookRef = useRef();
  const dropPhaseRef = useRef(0);

  useEffect(() => {
    if (lastInstalledAt) {
      dropPhaseRef.current = 1.0;
    }
  }, [lastInstalledAt]);

  useFrame((state, delta) => {
    if (dropPhaseRef.current > 0) {
      dropPhaseRef.current = Math.max(0, dropPhaseRef.current - delta * 1.15);
    }

    const isDropping = dropPhaseRef.current > 0.05;
    const idleX = Math.sin(state.clock.elapsedTime * 0.25) * 1.2;
    const desiredTrolleyX = isDropping ? 0 : idleX;

    if (trolleyRef.current) {
      trolleyRef.current.position.x = THREE.MathUtils.lerp(
        trolleyRef.current.position.x,
        desiredTrolleyX,
        delta * 4.5
      );
    }

    const baseCableLen = 1.3;
    const targetDropLen = Math.max(1.0, Math.min(4.8, 8.2 - targetSlotY));
    const desiredLen = isDropping
      ? THREE.MathUtils.lerp(baseCableLen, targetDropLen, Math.sin(dropPhaseRef.current * Math.PI))
      : baseCableLen;

    if (cableRef.current && hookRef.current) {
      cableRef.current.scale.y = THREE.MathUtils.lerp(cableRef.current.scale.y, desiredLen / 2.0, delta * 6);
      cableRef.current.position.y = -0.25 - (cableRef.current.scale.y * 2.0) / 2;
      hookRef.current.position.y = -0.25 - cableRef.current.scale.y * 2.0 - 0.12;
    }
  });

  return (
    <group position={[0, 8.5, 0]}>
      <mesh castShadow>
        <boxGeometry args={[10.5, 0.2, 0.3]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.6} roughness={0.25} />
      </mesh>
      <group ref={trolleyRef} position={[0, -0.2, 0]}>
        <mesh>
          <boxGeometry args={[0.68, 0.34, 0.38]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh ref={cableRef} position={[0, -1.0, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 2.0, 6]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh ref={hookRef} position={[0, -2.1, 0]}>
          <torusGeometry args={[0.12, 0.028, 6, 14, Math.PI]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function AssemblyTurntable({ children }) {
  const tableRef = useRef();
  useFrame((_, delta) => {
    if (tableRef.current) {
      tableRef.current.rotation.y += delta * 0.08;
    }
  });

  return (
    <group>
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[1.65, 1.85, 0.18, 36]} />
        <meshStandardMaterial color="#1E3A8A" metalness={0.45} roughness={0.4} />
      </mesh>
      <group ref={tableRef} position={[0, 0, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.55, 1.55, 0.06, 36]} />
          <meshStandardMaterial color="#2563EB" metalness={0.35} roughness={0.35} />
        </mesh>
        {children}
      </group>
    </group>
  );
}

function CameraRig({ targetY, lastInstalledAt }) {
  const controlsRef = useRef();
  const { camera } = useThree();
  const shakeRef = useRef(0);

  useEffect(() => {
    if (lastInstalledAt) {
      const t = setTimeout(() => {
        shakeRef.current = 0.06;
      }, 140);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [lastInstalledAt]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (Math.abs(controlsRef.current.target.y - targetY) > 0.01) {
      controlsRef.current.target.y = THREE.MathUtils.lerp(
        controlsRef.current.target.y,
        targetY,
        delta * 3.2
      );
    }

    if (shakeRef.current > 0.002) {
      camera.position.x += (Math.random() - 0.5) * shakeRef.current;
      camera.position.y += (Math.random() - 0.5) * shakeRef.current;
      shakeRef.current = THREE.MathUtils.lerp(shakeRef.current, 0, delta * 9);
    }

    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={4.0}
      maxDistance={14.5}
      minPolarAngle={Math.PI / 8}
      maxPolarAngle={Math.PI / 2 - 0.02}
      target={[0, 3.0, 0]}
    />
  );
}

export default function VabHangarScene({
  rocketConfig,
  activeSlot,
  nextEmptySlot,
  xrayMode,
  lastInstalledSlot,
  lastInstalledAt,
  onSelectSlot,
}) {
  const slotPositions = useMemo(() => computeSlotWorldPositions(rocketConfig), [rocketConfig]);
  const activeSlotY = slotPositions[activeSlot] ?? 3.0;

  return (
    <>
      {/* Mars Horizon Royal Blueprint Blue Studio Background */}
      <color attach="background" args={['#1455AD']} />
      <fog attach="fog" args={['#1D6FD8', 18, 46]} />

      {/* Bright Studio Three-Point Lighting */}
      <ambientLight intensity={1.6} color="#FFFFFF" />
      <directionalLight
        position={[8, 14, 10]}
        intensity={2.2}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-9, 8, 6]} intensity={1.1} color="#BAE6FD" />
      <directionalLight position={[0, 6, -10]} intensity={0.8} color="#93C5FD" />

      {/* Glowing 3D Perspective Blueprint Grid Floor */}
      <Grid
        position={[0, -0.18, 0]}
        args={[30, 30]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.75}
        cellColor="#3B82F6"
        sectionSize={2.5}
        sectionThickness={1.3}
        sectionColor="#60A5FA"
        fadeDistance={26}
        fadeStrength={1.1}
      />

      <GantryCrane targetSlotY={activeSlotY} lastInstalledAt={lastInstalledAt} />

      <AssemblyTurntable>
        <ModularRocket3D
          rocketConfig={rocketConfig}
          activeSlot={activeSlot}
          nextEmptySlot={nextEmptySlot}
          xrayMode={xrayMode}
          lastInstalledSlot={lastInstalledSlot}
          lastInstalledAt={lastInstalledAt}
          onSelectSlot={onSelectSlot}
        />
      </AssemblyTurntable>

      <CameraRig targetY={3.0} lastInstalledAt={lastInstalledAt} />
    </>
  );
}
