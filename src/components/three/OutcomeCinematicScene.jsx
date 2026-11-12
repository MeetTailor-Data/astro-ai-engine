import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import ModularRocket3D from './ModularRocket3D';

function OrbitalSuccessScene() {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const satGroupRef = useRef();
  const leftPanelRef = useRef();
  const rightPanelRef = useRef();
  const leftFairingRef = useRef();
  const rightFairingRef = useRef();
  const radarRef = useRef();

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.045;
    if (cloudsRef.current) cloudsRef.current.rotation.y += delta * 0.065;

    if (satGroupRef.current) {
      satGroupRef.current.position.y = 1.65 + Math.sin(t * 1.1) * 0.14;
      satGroupRef.current.rotation.y = Math.sin(t * 0.35) * 0.28;
    }

    // Unfold solar wings smoothly after scene mounts
    const unfold = Math.min(1, t / 2.2);
    const wingAngle = THREE.MathUtils.lerp(Math.PI * 0.48, 0, unfold);
    if (leftPanelRef.current) leftPanelRef.current.rotation.z = wingAngle;
    if (rightPanelRef.current) rightPanelRef.current.rotation.z = -wingAngle;

    // Fairing halves drifting away
    const drift = Math.min(6.5, t * 0.55);
    if (leftFairingRef.current) {
      leftFairingRef.current.position.set(-1.6 - drift, 1.3 - drift * 0.25, -0.8 - drift * 0.3);
      leftFairingRef.current.rotation.z += delta * 0.35;
      leftFairingRef.current.rotation.x += delta * 0.2;
    }
    if (rightFairingRef.current) {
      rightFairingRef.current.position.set(1.6 + drift, 1.1 - drift * 0.22, -0.8 - drift * 0.3);
      rightFairingRef.current.rotation.z -= delta * 0.32;
      rightFairingRef.current.rotation.y += delta * 0.22;
    }

    // Pulsing green radar scan cone
    if (radarRef.current?.material) {
      radarRef.current.material.opacity = 0.18 + Math.sin(t * 3.5) * 0.08;
    }
  });

  return (
    <group>
      <color attach="background" args={['#020409']} />
      <Stars radius={90} depth={50} count={4500} factor={4.0} saturation={0.35} fade speed={0.4} />
      <ambientLight intensity={0.45} color="#BAE6FD" />
      <directionalLight position={[14, 10, 12]} intensity={2.8} color="#FFFBEB" />

      {/* Sunlit Rotating 3D Earth Below */}
      <group position={[0, -14.5, -2]}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[12.5, 48, 48]} />
          <meshStandardMaterial color="#0284C7" roughness={0.65} metalness={0.1} />
        </mesh>
        {/* Continents / Landmass accents */}
        <mesh rotation={[0.4, 0.8, 0.2]}>
          <sphereGeometry args={[12.54, 32, 32]} />
          <meshStandardMaterial color="#15803D" roughness={0.85} wireframe transparent opacity={0.18} />
        </mesh>
        {/* Cloud Layer */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[12.72, 40, 40]} />
          <meshStandardMaterial color="#F8FAFC" transparent opacity={0.28} roughness={1} />
        </mesh>
        {/* Atmospheric Fresnel Halo */}
        <mesh>
          <sphereGeometry args={[13.15, 40, 40]} />
          <meshBasicMaterial color="#38BDF8" transparent opacity={0.22} side={THREE.BackSide} />
        </mesh>
      </group>

      {/* Drifting Nosecone Fairing Halves */}
      <mesh ref={leftFairingRef} position={[-1.6, 1.3, -0.8]}>
        <cylinderGeometry args={[0.35, 0.55, 1.6, 12, 1, true, 0, Math.PI]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.4} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightFairingRef} position={[1.6, 1.1, -0.8]}>
        <cylinderGeometry args={[0.35, 0.55, 1.6, 12, 1, true, Math.PI, Math.PI]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.4} roughness={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* 3D Weather Satellite with Unfolding Solar Wings & Green Radar Scan Cone */}
      <group ref={satGroupRef} position={[0, 1.65, 0]}>
        {/* Gold MLI Foil Bus */}
        <mesh castShadow>
          <boxGeometry args={[0.95, 0.95, 1.1]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.75} roughness={0.28} />
        </mesh>
        {/* Instrument Collar */}
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.32, 0.42, 0.35, 16]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* High-Gain Dish Antenna */}
        <mesh position={[0, 0.9, 0]} rotation={[0.35, 0, 0]}>
          <coneGeometry args={[0.48, 0.22, 20, 1, true]} />
          <meshStandardMaterial color="#F8FAFC" metalness={0.5} roughness={0.3} side={THREE.DoubleSide} />
        </mesh>

        {/* Left Glowing Blue Solar Wing */}
        <group ref={leftPanelRef} position={[-0.52, 0, 0]}>
          <mesh position={[-1.45, 0, 0]}>
            <boxGeometry args={[2.7, 0.06, 0.95]} />
            <meshStandardMaterial
              color="#1D4ED8"
              emissive="#2563EB"
              emissiveIntensity={0.45}
              metalness={0.55}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Right Glowing Blue Solar Wing */}
        <group ref={rightPanelRef} position={[0.52, 0, 0]}>
          <mesh position={[1.45, 0, 0]}>
            <boxGeometry args={[2.7, 0.06, 0.95]} />
            <meshStandardMaterial
              color="#1D4ED8"
              emissive="#2563EB"
              emissiveIntensity={0.45}
              metalness={0.55}
              roughness={0.2}
            />
          </mesh>
        </group>

        {/* Green Radar Scanning Cone projecting onto Earth clouds */}
        <mesh ref={radarRef} position={[0, -2.85, 0]}>
          <coneGeometry args={[2.3, 4.8, 28, 1, true]} />
          <meshBasicMaterial color="#10B981" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight position={[0, -1.0, 0]} intensity={4} distance={8} color="#10B981" />
      </group>
    </group>
  );
}

function SurfaceTouchdownScene({ rocketConfig, isMars }) {
  const roverRef = useRef();
  const laserRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (roverRef.current) {
      // Rover rolls out from lander ramp and patrols gently
      const rollout = Math.min(1, t / 3.5);
      roverRef.current.position.x = 1.6 + rollout * 1.45 + Math.sin(t * 0.5) * 0.25;
      roverRef.current.position.z = 1.2 + Math.cos(t * 0.4) * 0.2;
    }
    if (laserRef.current?.material) {
      laserRef.current.material.opacity = 0.35 + Math.sin(t * 8) * 0.25;
    }
  });

  const groundColor = isMars ? '#B45309' : '#64748B';
  const craterColor = isMars ? '#9A3412' : '#94A3B8';
  const skyColor = isMars ? '#3B1406' : '#020409';

  const craters = useMemo(
    () => [
      [-6.5, 0.05, -4.5, 2.4],
      [7.2, 0.05, -6.0, 3.1],
      [-9.0, 0.05, 5.2, 1.9],
      [5.8, 0.05, 5.5, 2.2],
    ],
    []
  );

  return (
    <group>
      <color attach="background" args={[skyColor]} />
      <Stars radius={95} depth={50} count={isMars ? 1800 : 4200} factor={3.5} fade speed={0.3} />
      <ambientLight intensity={isMars ? 0.85 : 0.65} color={isMars ? '#FED7AA' : '#E2E8F0'} />
      <directionalLight position={[14, 18, 12]} intensity={2.6} color="#FFFBEB" castShadow />

      {/* Earth in Lunar Sky */}
      {!isMars && (
        <group position={[-12, 11, -24]}>
          <mesh>
            <sphereGeometry args={[2.2, 32, 32]} />
            <meshStandardMaterial color="#0284C7" emissive="#0369A1" emissiveIntensity={0.35} roughness={0.6} />
          </mesh>
          <mesh>
            <sphereGeometry args={[2.35, 32, 32]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.25} side={THREE.BackSide} />
          </mesh>
        </group>
      )}

      {/* Mars Floating Dust or Moon Celebration Beacons */}
      <Sparkles
        count={isMars ? 70 : 55}
        scale={[14, 7, 14]}
        position={[0, 3.0, 0]}
        size={isMars ? 3.5 : 5}
        speed={0.65}
        color={isMars ? '#FDBA74' : '#10B981'}
      />

      {/* Planetary Surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <circleGeometry args={[55, 48]} />
        <meshStandardMaterial color={groundColor} roughness={0.94} />
      </mesh>

      {/* Crater Rings */}
      {craters.map(([x, y, z, r], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[r, 0.22, 8, 24]} />
          <meshStandardMaterial color={craterColor} roughness={0.95} />
        </mesh>
      ))}

      {/* Retro-Thruster Scorch Mark under Lander */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-1.4, 0.02, -0.5]}>
        <circleGeometry args={[2.2, 32]} />
        <meshBasicMaterial color="#0F172A" transparent opacity={0.62} />
      </mesh>

      {/* Landed Spacecraft on Deployed Landing Legs */}
      <group position={[-1.4, 0.2, -0.5]}>
        <ModularRocket3D
          rocketConfig={rocketConfig}
          stageFilter="upper_only"
          deployLegs={true}
          showSpatialLabels={false}
        />
        {/* Pulsing Green Touchdown Beacon */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
          <ringGeometry args={[2.3, 2.55, 36]} />
          <meshBasicMaterial color="#10B981" side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0, 1.5, 0]} intensity={5} distance={10} color="#10B981" />
      </group>

      {/* 3D Surface Rover with Headlights & Laser Scanner */}
      <group ref={roverRef} position={[2.2, 0.35, 1.2]} rotation={[0, -0.45, 0]}>
        {/* Rover Chassis */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <boxGeometry args={[1.1, 0.32, 0.78]} />
          <meshStandardMaterial color="#F8FAFC" metalness={0.45} roughness={0.35} />
        </mesh>
        {/* Gold RTG / Solar Deck */}
        <mesh position={[-0.25, 0.42, 0]}>
          <boxGeometry args={[0.45, 0.12, 0.62]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Mast & Camera Head */}
        <mesh position={[0.35, 0.62, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.52, 8]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.6} />
        </mesh>
        <mesh position={[0.38, 0.9, 0]}>
          <boxGeometry args={[0.2, 0.14, 0.28]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.5} />
        </mesh>
        {/* Headlight & Laser Scanner Beam */}
        <mesh ref={laserRef} position={[1.1, 0.45, 0]} rotation={[0, 0, -Math.PI / 2 + 0.35]}>
          <coneGeometry args={[0.45, 1.45, 16, 1, true]} />
          <meshBasicMaterial color="#00F0FF" transparent opacity={0.45} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <pointLight position={[0.55, 0.85, 0]} intensity={3.5} distance={5} color="#00F0FF" />
        {/* 6 Wheels */}
        {[-0.4, 0, 0.4].map((wx, idx) => (
          <group key={idx}>
            <mesh position={[wx, 0, 0.44]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
              <meshStandardMaterial color="#1E293B" roughness={0.9} />
            </mesh>
            <mesh position={[wx, 0, -0.44]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.16, 0.16, 0.12, 12]} />
              <meshStandardMaterial color="#1E293B" roughness={0.9} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

function CrashReconstructionScene({ rocketConfig, failedSlotKey }) {
  const holoRef = useRef();

  useFrame((_, delta) => {
    if (holoRef.current) {
      holoRef.current.rotation.y += delta * 0.55;
    }
  });

  const debrisPieces = useMemo(
    () => [
      [-3.1, 0.18, 0.8, 0.4, 0.2, 0.7],
      [-2.2, 0.22, -1.1, 0.6, 0.25, 0.4],
      [-4.0, 0.15, -0.4, 0.5, 0.18, 0.5],
      [-1.7, 0.2, 1.3, 0.35, 0.3, 0.35],
    ],
    []
  );

  return (
    <group>
      <color attach="background" args={['#090408']} />
      <Stars radius={90} depth={50} count={2500} factor={3.2} fade speed={0.2} />
      <ambientLight intensity={0.45} color="#FECDD3" />
      <directionalLight position={[10, 14, 10]} intensity={1.8} color="#FFE4E6" />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[55, 48]} />
        <meshStandardMaterial color="#1E1B24" roughness={0.95} />
      </mesh>

      {/* Left Side: Smoking Impact Crater & Glowing Debris Field */}
      <group position={[-2.6, 0, 0.4]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[1.4, 2.6, 32]} />
          <meshStandardMaterial color="#451A03" roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[1.45, 28]} />
          <meshBasicMaterial color="#EA580C" transparent opacity={0.45} />
        </mesh>
        <pointLight position={[0, 1.0, 0]} intensity={9} distance={10} color="#FF4500" />
        <Sparkles count={65} scale={[3.2, 3.5, 3.2]} position={[0, 1.4, 0]} size={5.5} speed={1.1} color="#FB923C" />
        <Sparkles count={40} scale={[2.6, 4.2, 2.6]} position={[0, 2.1, 0]} size={7} speed={0.5} color="#64748B" />
      </group>

      {debrisPieces.map(([x, y, z, w, h, d], idx) => (
        <mesh key={idx} position={[x, y, z]} rotation={[idx * 0.4, idx * 0.7, idx * 0.3]}>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color="#475569" emissive="#9A3412" emissiveIntensity={0.45} metalness={0.6} />
        </mesh>
      ))}

      {/* Right/Center: Rotating Red-Wireframe 3D Hologram Flashing the Exact Failed Slot */}
      <group ref={holoRef} position={[2.2, 0.25, -0.4]} scale={0.78}>
        <ModularRocket3D
          rocketConfig={rocketConfig}
          activeSlot={failedSlotKey}
          xrayMode={true}
          showSpatialLabels={false}
        />
        <pointLight position={[0, 3.2, 0]} intensity={7} distance={12} color="#F43F5E" />
      </group>
    </group>
  );
}

export default function OutcomeCinematicScene({
  willLand,
  selectedMission,
  rocketConfig,
  failedSlotKey,
}) {
  const missionId = selectedMission?.id || '';
  const isLeo = missionId === 'leo-sat-01';
  const isMars = missionId === 'mars-rover-03' || (selectedMission?.targetBody || '').toLowerCase().includes('mars');

  return (
    <>
      <OrbitControls
        enablePan={false}
        minDistance={4.5}
        maxDistance={16}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 2.0, 0]}
      />
      {!willLand ? (
        <CrashReconstructionScene rocketConfig={rocketConfig} failedSlotKey={failedSlotKey} />
      ) : isLeo ? (
        <OrbitalSuccessScene />
      ) : (
        <SurfaceTouchdownScene rocketConfig={rocketConfig} isMars={isMars} />
      )}
    </>
  );
}
