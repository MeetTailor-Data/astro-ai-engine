import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Grid, OrbitControls, Sparkles } from '@react-three/drei';
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

    const baseCableLen = 1.8;
    const targetDropLen = Math.max(1.2, Math.min(9.5, 14.0 - targetSlotY));
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
    <group position={[0, 14.4, 0]}>
      {/* Heavy Yellow Industrial Overhead Crane Girder */}
      <mesh castShadow>
        <boxGeometry args={[13.5, 0.45, 0.5]} />
        <meshStandardMaterial color="#EAB308" metalness={0.65} roughness={0.3} />
      </mesh>
      <group ref={trolleyRef} position={[0, -0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.9, 0.45, 0.55]} />
          <meshStandardMaterial color="#CA8A04" metalness={0.7} roughness={0.25} />
        </mesh>
        <mesh ref={cableRef} position={[0, -1.0, 0]}>
          <cylinderGeometry args={[0.024, 0.024, 2.0, 6]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.15} />
        </mesh>
        <mesh ref={hookRef} position={[0, -2.1, 0]}>
          <torusGeometry args={[0.16, 0.035, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#EAB308" metalness={0.85} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

function VabHighBayStructure() {
  const columnPositions = [
    [-6.8, -5.5],
    [6.8, -5.5],
    [-6.8, 5.5],
    [6.8, 5.5],
  ];

  return (
    <group>
      {/* 4 Massive Steel Support Towers */}
      {columnPositions.map(([x, z], idx) => (
        <group key={idx} position={[x, 7.5, z]}>
          <mesh castShadow>
            <boxGeometry args={[0.7, 16, 0.7]} />
            <meshStandardMaterial color="#1E293B" metalness={0.55} roughness={0.45} />
          </mesh>
          {/* NASA Red Safety Stripe */}
          <mesh position={[0, 0, z > 0 ? -0.36 : 0.36]}>
            <boxGeometry args={[0.32, 15.6, 0.04]} />
            <meshStandardMaterial color="#DC2626" roughness={0.35} />
          </mesh>
        </group>
      ))}

      {/* Ceiling Girders */}
      <group position={[0, 15.2, 0]}>
        <mesh>
          <boxGeometry args={[14.2, 0.45, 0.4]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, -5.5]}>
          <boxGeometry args={[14.2, 0.45, 0.4]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 5.5]}>
          <boxGeometry args={[14.2, 0.45, 0.4]} />
          <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* High-Bay Catwalk Platforms on Left & Right */}
      {[3.8, 8.2, 12.5].map((y, idx) => (
        <group key={idx}>
          {/* Left Catwalk */}
          <group position={[-5.8, y, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[1.5, 0.12, 11]} />
              <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[0.7, 0.45, 0]}>
              <boxGeometry args={[0.06, 0.8, 11]} />
              <meshStandardMaterial color="#EAB308" roughness={0.3} />
            </mesh>
          </group>

          {/* Right Catwalk */}
          <group position={[5.8, y, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[1.5, 0.12, 11]} />
              <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.35} />
            </mesh>
            <mesh position={[-0.7, 0.45, 0]}>
              <boxGeometry args={[0.06, 0.8, 11]} />
              <meshStandardMaterial color="#EAB308" roughness={0.3} />
            </mesh>
          </group>
        </group>
      ))}

      {/* High-Bay Halogen Floodlight Fixtures */}
      {[-3.5, 3.5].map((x, i) => (
        <group key={i} position={[x, 14.8, 0]}>
          <mesh>
            <boxGeometry args={[1.2, 0.25, 0.7]} />
            <meshStandardMaterial color="#E2E8F0" emissive="#F59E0B" emissiveIntensity={0.8} />
          </mesh>
          <pointLight intensity={3.8} distance={24} color="#FFFBEB" decay={1.8} />
        </group>
      ))}

      {/* High-Tech Floor Work Spotlights */}
      <pointLight position={[3.2, 0.6, 3.2]} intensity={2.5} distance={14} color="#00F0FF" />
      <pointLight position={[-3.2, 0.6, 3.2]} intensity={2.5} distance={14} color="#FFFBEB" />
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
      {/* Heavy Mobile Launcher Platform Mount */}
      <mesh position={[0, -0.12, 0]} receiveShadow>
        <cylinderGeometry args={[1.85, 2.1, 0.22, 32]} />
        <meshStandardMaterial color="#0F172A" metalness={0.65} roughness={0.35} />
      </mesh>
      {/* Hazard Warning Ring */}
      <mesh position={[0, -0.005, 0]} receiveShadow>
        <ringGeometry args={[1.56, 1.84, 32]} />
        <meshStandardMaterial color="#EAB308" metalness={0.2} roughness={0.6} />
      </mesh>
      {/* Rotating Precision Turntable */}
      <group ref={tableRef} position={[0, 0, 0]}>
        <mesh receiveShadow>
          <cylinderGeometry args={[1.55, 1.55, 0.08, 32]} />
          <meshStandardMaterial color="#1E293B" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Alignment markings */}
        <mesh position={[0, 0.045, 0]}>
          <ringGeometry args={[0.45, 0.48, 24]} />
          <meshBasicMaterial color="#00F0FF" />
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
      {/* NASA VAB High-Bay Deep Industrial Matte Slate Background */}
      <color attach="background" args={['#080C14']} />
      <fog attach="fog" args={['#080C14', 16, 42]} />

      {/* Realistic High-Bay Three-Point Lighting */}
      <ambientLight intensity={1.1} color="#E2E8F0" />
      <directionalLight
        position={[8, 16, 10]}
        intensity={2.6}
        color="#FFFBEB"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-9, 10, 6]} intensity={1.3} color="#94A3B8" />
      <directionalLight position={[0, 8, -10]} intensity={0.9} color="#38BDF8" />

      {/* High-Precision Dark Aerospace Engineering Floor Grid */}
      <Grid
        position={[0, -0.22, 0]}
        args={[36, 36]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.7}
        cellColor="#1E293B"
        sectionSize={2.5}
        sectionThickness={1.2}
        sectionColor="#00F0FF"
        fadeDistance={28}
        fadeStrength={1.2}
      />

      {/* Airborne Atmosphere Dust Motes Catching High-Bay Light Shafts */}
      <Sparkles count={55} scale={[12, 14, 12]} position={[0, 7, 0]} size={3.5} speed={0.3} opacity={0.35} color="#BAE6FD" />

      {/* NASA VAB Architecture: Heavy Truss Towers, Catwalks, Cranes & Halogen Fixtures */}
      <VabHighBayStructure />

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
