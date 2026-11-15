import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import ModularRocket3D from './ModularRocket3D';
import MissionControlHQ3D from './MissionControlHQ3D';

const DAY_COLOR = new THREE.Color('#38BDF8');
const TWILIGHT_COLOR = new THREE.Color('#0F172A');
const SPACE_COLOR = new THREE.Color('#020409');
const MARS_SKY_COLOR = new THREE.Color('#451A03');

function resolveBodyType(selectedMission) {
  const body = (selectedMission?.targetBody || selectedMission?.id || '').toLowerCase();
  if (body.includes('moon') || body.includes('lunar')) return 'moon';
  if (body.includes('mars')) return 'mars';
  return 'earth';
}

function useCurvedPlanetTexture(bodyType) {
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    const url =
      bodyType === 'mars'
        ? '/textures/mars.jpg'
        : bodyType === 'moon'
        ? '/textures/moon.jpg'
        : '/textures/earth.jpg';
    const tex = loader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }, [bodyType]);
}

function useEarthCloudsTexture() {
  return useMemo(() => {
    const loader = new THREE.TextureLoader();
    const tex = loader.load('/textures/clouds.png');
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
  }, []);
}

function LatticeLaunchTower({ clampsOpen }) {
  const upperArmRef = useRef();
  const lowerArmRef = useRef();

  useFrame((_, delta) => {
    const targetRot = clampsOpen ? -1.15 : 0;
    const step = 1 - Math.exp(-4.5 * delta);
    if (upperArmRef.current) {
      upperArmRef.current.rotation.y = THREE.MathUtils.lerp(upperArmRef.current.rotation.y, targetRot, step);
    }
    if (lowerArmRef.current) {
      lowerArmRef.current.rotation.y = THREE.MathUtils.lerp(lowerArmRef.current.rotation.y, targetRot, step);
    }
  });

  const levels = [0, 1.5, 3.0, 4.5, 6.0, 7.5];
  return (
    <group position={[-2.6, 0, -0.4]}>
      {/* 4 Main Vertical Lattice Columns */}
      {[
        [-0.45, -0.45],
        [0.45, -0.45],
        [-0.45, 0.45],
        [0.45, 0.45],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 4.5, z]} castShadow>
          <boxGeometry args={[0.14, 9.0, 0.14]} />
          <meshStandardMaterial color="#DC2626" roughness={0.5} metalness={0.45} />
        </mesh>
      ))}
      {/* Horizontal & Cross Truss Bracing */}
      {levels.map((y, idx) => (
        <group key={idx} position={[0, y + 0.75, 0]}>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[1.05, 0.1, 1.05]} />
            <meshStandardMaterial color={idx % 2 === 0 ? '#E2E8F0' : '#DC2626'} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh rotation={[0, 0, 0.68]} position={[0, 0, 0.45]}>
            <boxGeometry args={[0.07, 1.75, 0.07]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.5} />
          </mesh>
          <mesh rotation={[0, 0, -0.68]} position={[0, 0, -0.45]}>
            <boxGeometry args={[0.07, 1.75, 0.07]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.5} />
          </mesh>
        </group>
      ))}
      {/* Lightning Mast */}
      <mesh position={[0, 9.8, 0]}>
        <cylinderGeometry args={[0.03, 0.08, 1.6, 8]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.8} />
      </mesh>
      {/* Retracting Umbilical / Clamp Arms */}
      <group ref={upperArmRef} position={[0.45, 6.4, 0.35]}>
        <mesh position={[0.95, 0, 0]}>
          <boxGeometry args={[1.9, 0.16, 0.2]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>
      <group ref={lowerArmRef} position={[0.45, 3.6, 0.35]}>
        <mesh position={[0.95, 0, 0]}>
          <boxGeometry args={[1.9, 0.16, 0.2]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function VolumetricClouds({ altitudeKm, active }) {
  const groupRef = useRef();
  const clouds = useMemo(() => {
    const items = [];
    for (let i = 0; i < 18; i += 1) {
      const angle = (i / 18) * Math.PI * 2 + (i % 3) * 0.4;
      const dist = 10 + (i % 4) * 7.5;
      items.push({
        x: Math.cos(angle) * dist,
        y: 12 + (i % 5) * 6.5,
        z: Math.sin(angle) * dist - 8,
        scale: 1.4 + (i % 3) * 0.85,
      });
    }
    return items;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (altitudeKm > 0.5 && altitudeKm < 55) {
      groupRef.current.position.y -= delta * Math.min(28, 4 + altitudeKm * 0.45);
      if (groupRef.current.position.y < -30) {
        groupRef.current.position.y = 18;
      }
    } else if (altitudeKm <= 0.1) {
      groupRef.current.position.y = 0;
    }
  });

  if (!active || altitudeKm > 55) return null;

  return (
    <group ref={groupRef}>
      {clouds.map((c, idx) => (
        <group key={idx} position={[c.x, c.y, c.z]} scale={c.scale}>
          <mesh>
            <sphereGeometry args={[1.8, 12, 10]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.95} transparent opacity={0.86} />
          </mesh>
          <mesh position={[1.3, -0.25, 0.3]}>
            <sphereGeometry args={[1.3, 10, 8]} />
            <meshStandardMaterial color="#F8FAFC" roughness={0.95} transparent opacity={0.82} />
          </mesh>
          <mesh position={[-1.2, -0.3, -0.2]}>
            <sphereGeometry args={[1.25, 10, 8]} />
            <meshStandardMaterial color="#F1F5F9" roughness={0.95} transparent opacity={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PadLiftoffSmoke({ active }) {
  const smokeRef = useRef();
  const puffs = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        angle: (i / 14) * Math.PI * 2,
        speed: 1.8 + (i % 3) * 0.7,
        yOff: (i % 4) * 0.35,
        scale: 0.9 + (i % 3) * 0.45,
      })),
    []
  );

  useFrame(({ clock }) => {
    if (!smokeRef.current || !active) return;
    const t = (clock.getElapsedTime() * 1.4) % 2.4;
    smokeRef.current.children.forEach((mesh, idx) => {
      const p = puffs[idx];
      if (!p) return;
      const dist = 0.8 + t * p.speed * 2.2;
      mesh.position.set(Math.cos(p.angle) * dist, 0.35 + p.yOff + t * 0.6, Math.sin(p.angle) * dist);
      const s = p.scale * (0.6 + t * 1.35);
      mesh.scale.set(s, s * 0.75, s);
      if (mesh.material) {
        mesh.material.opacity = Math.max(0, 0.72 - t * 0.28);
      }
    });
  });

  if (!active) return null;

  return (
    <group ref={smokeRef} position={[0, 0.2, 0]}>
      {puffs.map((p, i) => (
        <mesh key={i}>
          <sphereGeometry args={[1.05, 12, 10]} />
          <meshStandardMaterial color={i % 2 === 0 ? '#F1F5F9' : '#CBD5E1'} transparent opacity={0.65} roughness={1} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function ExhaustPlume({ mode = 'off', position = [0, 0, 0] }) {
  const outerRef = useRef();
  const innerRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flicker = 0.92 + Math.sin(t * 48) * 0.12 + Math.cos(t * 73) * 0.08;
    if (outerRef.current) {
      outerRef.current.scale.set(1, flicker, 1);
    }
    if (innerRef.current) {
      innerRef.current.scale.set(1, flicker * 1.08, 1);
    }
  });

  if (mode === 'off') return null;

  const isVacuum = mode === 'vacuum' || mode === 'retro';
  const length = mode === 'preignite' ? 0.9 : mode === 'retro' ? 1.8 : isVacuum ? 3.2 : 4.2;
  const radius = mode === 'preignite' ? 0.28 : isVacuum ? 0.52 : 0.62;
  const outerColor = isVacuum ? '#38BDF8' : '#FF6B1A';
  const innerColor = isVacuum ? '#E0F2FE' : '#FEF08A';

  return (
    <group position={position}>
      <mesh ref={outerRef} position={[0, -length * 0.5, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[radius, length, 16, 1, true]} />
        <meshBasicMaterial color={outerColor} transparent opacity={0.78} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={innerRef} position={[0, -length * 0.34, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[radius * 0.48, length * 0.68, 12]} />
        <meshBasicMaterial color={innerColor} transparent opacity={0.95} depthWrite={false} />
      </mesh>
      <pointLight position={[0, -0.8, 0]} intensity={isVacuum ? 5 : 9} distance={14} color={outerColor} />
    </group>
  );
}

function ExplosionEffect({ active, position = [0, 2, 0] }) {
  const groupRef = useRef();
  const ringRef = useRef();
  const secondaryRingRef = useRef();
  const fireballCoreRef = useRef();
  const fireballOuterRef = useRef();

  const debris = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const phi = (i / 28) * Math.PI * 2;
        const speed = 3.5 + (i % 5) * 1.8;
        return {
          vx: Math.cos(phi) * speed,
          vy: 2.2 + (i % 6) * 1.8,
          vz: Math.sin(phi) * speed,
          size: 0.16 + (i % 4) * 0.12,
          rotSpeed: (i % 2 === 0 ? 1 : -1) * (2.5 + (i % 3) * 1.5),
        };
      }),
    []
  );

  const startRef = useRef(0);
  useFrame(({ clock }) => {
    if (!active) {
      startRef.current = 0;
      return;
    }
    if (startRef.current === 0) startRef.current = clock.getElapsedTime();
    const age = clock.getElapsedTime() - startRef.current;

    // Expanding multi-tier shockwaves
    if (ringRef.current) {
      const rScale = 1 + age * 11.5;
      ringRef.current.scale.set(rScale, rScale, 1);
      if (ringRef.current.material) {
        ringRef.current.material.opacity = Math.max(0, 0.95 - age * 0.38);
      }
    }
    if (secondaryRingRef.current) {
      const r2Scale = Math.max(0.1, (age - 0.2) * 14.0);
      secondaryRingRef.current.scale.set(r2Scale, r2Scale, 1);
      if (secondaryRingRef.current.material) {
        secondaryRingRef.current.material.opacity = Math.max(0, 0.8 - (age - 0.2) * 0.45);
      }
    }

    // Expanding & fading fireball spheres
    if (fireballCoreRef.current) {
      const sCore = Math.min(4.8, 1.2 + age * 4.2);
      fireballCoreRef.current.scale.set(sCore, sCore, sCore);
      if (fireballCoreRef.current.material) {
        fireballCoreRef.current.material.opacity = Math.max(0, 1.0 - age * 0.32);
      }
    }
    if (fireballOuterRef.current) {
      const sOuter = Math.min(7.5, 1.8 + age * 5.8);
      fireballOuterRef.current.scale.set(sOuter, sOuter, sOuter);
      if (fireballOuterRef.current.material) {
        fireballOuterRef.current.material.opacity = Math.max(0, 0.85 - age * 0.28);
      }
    }

    // Flying debris with ballistic gravity arc
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        const d = debris[idx];
        if (!d) return;
        child.position.set(d.vx * age, d.vy * age - 3.8 * age * age, d.vz * age);
        child.rotation.x += d.rotSpeed * 0.05;
        child.rotation.z += d.rotSpeed * 0.04;
      });
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      {/* Blinding White Detonation Core */}
      <mesh ref={fireballCoreRef}>
        <sphereGeometry args={[1.4, 20, 18]} />
        <meshBasicMaterial color="#FFFFFF" transparent opacity={1.0} />
      </mesh>
      {/* Outer Fiery Orange Explosion Plasma */}
      <mesh ref={fireballOuterRef}>
        <sphereGeometry args={[2.2, 22, 20]} />
        <meshBasicMaterial color="#FF4500" transparent opacity={0.88} />
      </mesh>
      <pointLight intensity={35} distance={42} color="#FF6B1A" />

      {/* Primary Expanding Shockwave Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.45, 36]} />
        <meshBasicMaterial color="#FBBF24" side={THREE.DoubleSide} transparent opacity={0.9} />
      </mesh>
      {/* Secondary Fast Shockwave */}
      <mesh ref={secondaryRingRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.2, 1.7, 36]} />
        <meshBasicMaterial color="#FF2200" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Flying 3D Shattered Rocket Hull & Engine Debris */}
      <group ref={groupRef}>
        {debris.map((d, i) => (
          <mesh key={i}>
            <boxGeometry args={[d.size, d.size * 1.8, d.size * 0.8]} />
            <meshStandardMaterial
              color={i % 3 === 0 ? '#1E293B' : i % 3 === 1 ? '#DC2626' : '#E2E8F0'}
              metalness={0.7}
              roughness={0.3}
            />
          </mesh>
        ))}
      </group>
      {/* Burning Smoke & Spark Clouds */}
      <Sparkles count={80} scale={[6, 6, 6]} size={8} speed={1.8} color="#EA580C" />
      <Sparkles count={50} scale={[5, 7, 5]} size={12} speed={0.9} color="#475569" />
    </group>
  );
}

function DestinationSurface({ bodyType, visible, landed, descentActive = false }) {
  if (!visible) return null;

  const isMoon = bodyType === 'moon';
  const isMars = bodyType === 'mars';
  const groundColor = isMoon ? '#475569' : isMars ? '#99350E' : '#2D6A4F';
  const rockColor = isMoon ? '#64748B' : isMars ? '#7C2D12' : '#334155';
  const rimColor = isMoon ? '#94A3B8' : isMars ? '#C2410C' : '#52796F';

  return (
    <group position={[0, -0.35, 0]}>
      {/* Broad Planetary Surface Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[95, 64]} />
        <meshStandardMaterial color={groundColor} roughness={0.95} metalness={0.08} />
      </mesh>

      {/* Concentric Impact Craters with Depth & Raised Rims */}
      {(isMoon || isMars) && (
        <group>
          {[
            { x: 7.5, z: -6.0, r: 3.8, depth: 0.15 },
            { x: -9.5, z: -8.5, r: 4.8, depth: 0.2 },
            { x: 14.0, z: 6.5, r: 3.2, depth: 0.12 },
            { x: -12.0, z: 8.0, r: 2.8, depth: 0.1 },
            { x: 0, z: 0, r: 2.2, depth: 0.08 }, // landing target crater
          ].map((c, i) => (
            <group key={i} position={[c.x, 0.04, c.z]}>
              {/* Crater Raised Outer Rim */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <torusGeometry args={[c.r, 0.35, 10, 32]} />
                <meshStandardMaterial color={rimColor} roughness={0.98} />
              </mesh>
              {/* Darker Crater Interior Floor */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
                <circleGeometry args={[c.r - 0.2, 24]} />
                <meshStandardMaterial color={rockColor} roughness={0.99} />
              </mesh>
            </group>
          ))}
          {/* Scattered Martian / Lunar Boulders */}
          {[
            [3.2, 0.2, -2.5, 0.45],
            [-4.5, 0.25, 3.2, 0.55],
            [5.8, 0.18, 4.1, 0.38],
            [-2.8, 0.3, -4.8, 0.62],
            [8.5, 0.22, -1.2, 0.4],
          ].map(([x, y, z, s], idx) => (
            <mesh key={idx} position={[x, y * 0.5, z]} rotation={[idx * 0.4, idx * 0.7, 0]} castShadow>
              <dodecahedronGeometry args={[s, 0]} />
              <meshStandardMaterial color={rockColor} roughness={0.9} />
            </mesh>
          ))}
        </group>
      )}

      {/* Terminal Descent: Expanding Regolith Dust Cloud from Retro-Thrusters */}
      {(descentActive || landed) && (isMars || isMoon) && (
        <group position={[0, 0.3, 0]}>
          <Sparkles
            count={90}
            scale={[9, 1.8, 9]}
            size={isMars ? 7 : 5}
            speed={1.6}
            color={isMars ? '#FB923C' : '#CBD5E1'}
          />
        </group>
      )}

      {/* Martian Atmospheric Dust Suspension */}
      {isMars && (
        <Sparkles count={60} scale={[25, 8, 25]} position={[0, 4, 0]} size={4} speed={0.4} color="#FDBA74" opacity={0.65} />
      )}

      {/* Scorch Ring at Landing Pad Center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <circleGeometry args={[2.8, 32]} />
        <meshBasicMaterial color="#0A0605" transparent opacity={0.65} />
      </mesh>

      {/* Glowing Green Touchdown Beacon */}
      {landed && (
        <group position={[0, 0.2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.4, 2.75, 42]} />
            <meshBasicMaterial color="#10B981" side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, 1.4, 0]} intensity={8} distance={12} color="#10B981" />
        </group>
      )}
    </group>
  );
}

export default function FlightSimulationScene({
  rocketConfig,
  selectedMission,
  telemetry,
  cameraMode = 'TRACKING',
}) {
  const { scene, camera } = useThree();
  const rocketGroupRef = useRef();
  const detachedBoosterRef = useRef();

  const bodyType = useMemo(() => resolveBodyType(selectedMission), [selectedMission]);
  const curvedPlanetTexture = useCurvedPlanetTexture(bodyType);
  const earthCloudsTexture = useEarthCloudsTexture();
  const altitudeKm = telemetry?.altitudeKm ?? 0;
  const phase = telemetry?.phase ?? 'PRELAUNCH';
  const status = telemetry?.status ?? 'PRELAUNCH';
  const countdownSec = telemetry?.countdownSec ?? 5;
  const stageSeparated = Boolean(telemetry?.stageSeparated);
  const edlDeployed = Boolean(telemetry?.edlDeployed);
  const anomalyType = telemetry?.anomalyType || null;

  const isPrelaunch = status === 'PRELAUNCH' || phase === 'COUNTDOWN';
  const isOrbitalPhase =
    bodyType === 'earth' &&
    (phase === 'PAYLOAD_DEPLOY' || phase === 'ORBIT_CONFIRMED' || phase === 'PAYLOAD_ERROR');
  const isDescending =
    !isOrbitalPhase && (phase === 'ENTRY_DESCENT' || phase === 'TERMINAL_DESCENT' || status === 'LANDED');
  const isCrashed = status === 'CRASHED' || phase === 'EXPLODING';
  const isLanded = status === 'LANDED' && !isOrbitalPhase;
  const isOrbited = status === 'LANDED' && isOrbitalPhase;

  // Compute rocket visual Y height for pad / landing / spaceflight
  const rocketVisualY = useMemo(() => {
    if (isPrelaunch) return 0;
    if (isLanded) return 0;
    if (isDescending) {
      return Math.max(0, (altitudeKm / 12) * 8.5);
    }
    if (altitudeKm < 6) {
      return altitudeKm * 3.2;
    }
    return 18;
  }, [isPrelaunch, isLanded, isDescending, altitudeKm]);

  // Smooth Sky-to-Space background + Camera Rig
  const bgColorRef = useRef(new THREE.Color('#38BDF8'));
  const camTargetRef = useRef(new THREE.Vector3());
  const camLookRef = useRef(new THREE.Vector3());

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();

    // 1. Sky-to-Space Color Transition
    let targetBg = DAY_COLOR;
    if (cameraMode === 'HQ_CAM') {
      targetBg = SPACE_COLOR;
    } else if (isDescending && bodyType === 'moon') {
      targetBg = SPACE_COLOR;
    } else if (isDescending && bodyType === 'mars') {
      targetBg = MARS_SKY_COLOR;
    } else if (altitudeKm <= 40) {
      targetBg = DAY_COLOR.clone().lerp(TWILIGHT_COLOR, Math.min(1, altitudeKm / 40));
    } else {
      targetBg = TWILIGHT_COLOR.clone().lerp(SPACE_COLOR, Math.min(1, (altitudeKm - 40) / 60));
    }

    bgColorRef.current.lerp(targetBg, 1 - Math.exp(-4.0 * delta));
    scene.background = bgColorRef.current;
    if (scene.fog) {
      scene.fog.color.copy(bgColorRef.current);
    }

    // 2. Rocket Attitude & Failure Physics
    if (rocketGroupRef.current) {
      rocketGroupRef.current.position.y = THREE.MathUtils.lerp(
        rocketGroupRef.current.position.y,
        rocketVisualY,
        1 - Math.exp(-8 * delta)
      );

      if (isCrashed && anomalyType === 'TWR_LOW') {
        rocketGroupRef.current.rotation.z = THREE.MathUtils.lerp(rocketGroupRef.current.rotation.z, 1.38, 1 - Math.exp(-3.5 * delta));
      } else if (isCrashed && anomalyType === 'DELTAV_LOW') {
        rocketGroupRef.current.rotation.x += delta * 2.4;
        rocketGroupRef.current.rotation.z += delta * 1.8;
      } else if (phase === 'ENTRY_DESCENT' && !isCrashed) {
        // Retro-braking pitch attitude
        rocketGroupRef.current.rotation.z = THREE.MathUtils.lerp(rocketGroupRef.current.rotation.z, 0.14, 1 - Math.exp(-3 * delta));
      } else if (phase === 'TERMINAL_DESCENT' || isLanded) {
        rocketGroupRef.current.rotation.z = THREE.MathUtils.lerp(rocketGroupRef.current.rotation.z, 0, 1 - Math.exp(-6 * delta));
      } else if ((isOrbitalPhase || isOrbited) && !isCrashed) {
        // LEO Orbit confirmed: pitch to horizontal orbit alignment & rotate satellite nadir-pointing to Earth
        rocketGroupRef.current.rotation.z = THREE.MathUtils.lerp(
          rocketGroupRef.current.rotation.z,
          -Math.PI * 0.48,
          1 - Math.exp(-2.5 * delta)
        );
        rocketGroupRef.current.rotation.y += delta * 0.22;
      } else if (!isPrelaunch && altitudeKm > 2 && !isCrashed) {
        // Subtle gravity turn pitch
        const pitch = Math.min(0.28, (altitudeKm / 80) * 0.28);
        rocketGroupRef.current.rotation.z = -pitch;
      } else {
        rocketGroupRef.current.rotation.set(0, 0, 0);
      }
    }

    // 3. Tumbling Detached First Stage / SRBs
    if (detachedBoosterRef.current) {
      if (stageSeparated && !isDescending && !isLanded) {
        detachedBoosterRef.current.position.y -= delta * 6.5;
        detachedBoosterRef.current.position.x -= delta * 1.4;
        detachedBoosterRef.current.rotation.z += delta * 1.6;
        detachedBoosterRef.current.rotation.x += delta * 0.9;
      } else {
        detachedBoosterRef.current.position.set(0, rocketVisualY, 0);
        detachedBoosterRef.current.rotation.set(0, 0, 0);
      }
    }

    // 4. Camera Switcher + Dynamic Launch / Detonation Shake
    const ry = rocketGroupRef.current ? rocketGroupRef.current.position.y : 0;
    const isBurning = !isPrelaunch && !isCrashed && !isLanded && phase !== 'FUEL_DEPLETED';
    const isExploding = phase === 'EXPLODING';
    const shakeMag = isExploding ? 0.38 : isBurning && altitudeKm < 45 ? 0.085 : 0;
    const shakeFreq = isExploding ? 88 : 53;
    const shakeX = shakeMag ? (Math.sin(t * shakeFreq) * 0.5 + Math.cos(t * 71) * 0.5) * shakeMag : 0;
    const shakeY = shakeMag ? (Math.cos(t * (shakeFreq + 8)) * 0.5 + Math.sin(t * 43) * 0.5) * shakeMag : 0;

    if (cameraMode === 'HQ_CAM') {
      camTargetRef.current.set(0, 2.3, 5.2);
      camLookRef.current.set(0, 2.0, -3.5);
    } else if (cameraMode === 'PAD') {
      camTargetRef.current.set(6.2 + shakeX, 1.3 + shakeY, 7.5);
      camLookRef.current.set(0, ry + 3.2, 0);
    } else if (cameraMode === 'ROCKET_CAM') {
      camTargetRef.current.set(1.25 + shakeX * 0.5, ry + 7.2 + shakeY * 0.5, 1.4);
      camLookRef.current.set(0, ry - 4.0, 0);
    } else {
      // TRACKING CAM
      if (isOrbitalPhase || isOrbited) {
        // High orbital vantage point with camera angled to keep both satellite AND Earth in full frame!
        const orbT = t * 0.25;
        camTargetRef.current.set(Math.cos(orbT) * 5.2, ry + 2.5, Math.sin(orbT) * 5.2 + 4.2);
        camLookRef.current.set(0, ry - 0.4, -4.5);
      } else {
        const finaleOrbit = isLanded || isCrashed ? Math.sin(t * 0.45) * 3.2 : 0;
        camTargetRef.current.set(6.4 + shakeX + finaleOrbit, ry + 4.4 + shakeY, 10.6);
        camLookRef.current.set(0, ry + 3.2, 0);
      }
    }

    camera.position.lerp(camTargetRef.current, 1 - Math.exp(-6.5 * delta));
    camera.lookAt(camLookRef.current);
  });

  if (cameraMode === 'HQ_CAM') {
    return <MissionControlHQ3D flightPhase={phase} flightStatus={status} altitudeKm={altitudeKm} />;
  }

  const clampsOpen = !isPrelaunch;
  const showPad = altitudeKm < 12 && !isDescending && !isLanded;
  const showCurvedEarth = altitudeKm > 35 && !isDescending && !isLanded;
  const showDestination = isDescending || isLanded;

  const exhaustMode = isCrashed || isLanded || isOrbited || isOrbitalPhase || phase === 'FUEL_DEPLETED'
    ? 'off'
    : phase === 'COUNTDOWN' && countdownSec <= 3 && countdownSec > 0
    ? 'preignite'
    : isPrelaunch
    ? 'off'
    : isDescending
    ? 'retro'
    : stageSeparated
    ? 'vacuum'
    : 'liftoff';

  const isOrbitalMission = bodyType === 'earth' || isOrbitalPhase || isOrbited;
  const deployChute = edlDeployed && Boolean(rocketConfig?.edlSystem?.parachute) && !isOrbitalMission && bodyType !== 'moon';
  const deployLegs = edlDeployed && rocketConfig?.edlSystem?.id === 'full_edl_package' && !isOrbitalMission;
  const heatGlow = (phase === 'ENTRY_DESCENT' || anomalyType === 'NO_HEATSHIELD') && !isLanded;

  return (
    <group>
      <fog attach="fog" args={['#38BDF8', 45, 165]} />
      <ambientLight intensity={altitudeKm > 60 ? 0.55 : 1.15} color="#FFFFFF" />
      <directionalLight position={[22, 34, 18]} intensity={2.6} color="#FFFBEB" castShadow />

      {/* 4,000+ Twinkling Stars fading in as we climb into space */}
      {(altitudeKm > 22 || (isDescending && bodyType === 'moon')) && (
        <Stars radius={95} depth={60} count={4200} factor={4.0} saturation={0.35} fade speed={0.5} />
      )}

      {/* White 3D Clouds rushing downward during ascent */}
      <VolumetricClouds altitudeKm={altitudeKm} active={!isDescending && !isLanded} />

      {/* Photorealistic Curved Earth or Mars Globe below when high in atmosphere / space */}
      {showCurvedEarth && (
        <group position={[0, isOrbitalPhase || isOrbited ? ry - 36 : -52 - Math.min(24, (altitudeKm - 35) * 0.12), isOrbitalPhase || isOrbited ? -6 : -12]}>
          <mesh rotation={[0.4, t * 0.03, 0]}>
            <sphereGeometry args={[42, 64, 48]} />
            <meshStandardMaterial
              map={curvedPlanetTexture}
              roughness={0.65}
              metalness={0.06}
            />
          </mesh>
          {bodyType === 'earth' && (
            <mesh rotation={[0.3, t * 0.05, 0]}>
              <sphereGeometry args={[42.35, 48, 36]} />
              <meshStandardMaterial
                map={earthCloudsTexture}
                transparent
                opacity={0.35}
                roughness={1.0}
                depthWrite={false}
              />
            </mesh>
          )}
          {/* Atmospheric Rayleigh Blue / Mars Haze Halo */}
          <mesh>
            <sphereGeometry args={[43.1, 48, 36]} />
            <meshBasicMaterial
              color={bodyType === 'mars' ? '#FB923C' : '#38BDF8'}
              transparent
              opacity={0.25}
              side={THREE.BackSide}
            />
          </mesh>
        </group>
      )}

      {/* Pre-Launch Coastal Spaceport Pad & Lattice Tower */}
      {showPad && (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.35, 0]} receiveShadow>
            <circleGeometry args={[75, 48]} />
            <meshStandardMaterial color="#3A7D44" roughness={0.92} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.32, 0]} receiveShadow>
            <circleGeometry args={[18, 36]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.85} />
          </mesh>
          <mesh position={[0, -0.1, 0]} receiveShadow>
            <cylinderGeometry args={[3.8, 4.5, 0.5, 8]} />
            <meshStandardMaterial color="#64748B" roughness={0.8} />
          </mesh>
          {/* Flame Trench */}
          <mesh position={[0, -0.05, 0]}>
            <boxGeometry args={[1.8, 0.35, 5.5]} />
            <meshStandardMaterial color="#0F172A" roughness={0.95} />
          </mesh>
          <LatticeLaunchTower clampsOpen={clampsOpen} />
          {/* Cryogenic Vapor Particles */}
          {isPrelaunch && (
            <Sparkles count={45} scale={[2.4, 3.8, 2.4]} position={[0, 2.6, 0]} size={5} speed={0.5} opacity={0.55} color="#E0F2FE" />
          )}
          {/* Massive Liftoff Smoke Clouds */}
          <PadLiftoffSmoke active={!isPrelaunch && altitudeKm < 4 && !isCrashed} />
        </group>
      )}

      {/* Destination Surface (Earth Recovery / Moon Craters / Mars Red Surface) */}
      <DestinationSurface
        bodyType={bodyType}
        visible={showDestination}
        landed={isLanded}
        descentActive={isDescending}
      />

      {/* Main Rocket Vehicle & Explosive Detonation Anchor */}
      <group ref={rocketGroupRef} position={[0, 0, 0]}>
        {!isCrashed && (
          <>
            <group position={[0, isLanded ? 0 : -0.5, 0]}>
              <ModularRocket3D
                rocketConfig={rocketConfig}
                activeSlot={null}
                nextEmptySlot={null}
                xrayMode={false}
                showSpatialLabels={false}
                stageFilter={stageSeparated ? 'upper_only' : 'all'}
                deployLegs={deployLegs}
                deployChute={deployChute}
                heatGlow={heatGlow}
              />
            </group>
            {/* Jettisoned Payload Fairing Halves Drifting into Deep Space */}
            {(isOrbitalPhase || isOrbited) && (
              <group position={[0, 4.2, 0]}>
                <mesh position={[-1.3, 0.2, 0]} rotation={[0, 0.2, 0.45]}>
                  <cylinderGeometry args={[0.55, 0.55, 1.8, 16, 1, false, 0, Math.PI]} />
                  <meshStandardMaterial color="#FFFFFF" metalness={0.2} roughness={0.4} side={THREE.DoubleSide} />
                </mesh>
                <mesh position={[1.3, 0.2, 0]} rotation={[0, -0.2, -0.45]}>
                  <cylinderGeometry args={[0.55, 0.55, 1.8, 16, 1, false, Math.PI, Math.PI]} />
                  <meshStandardMaterial color="#FFFFFF" metalness={0.2} roughness={0.4} side={THREE.DoubleSide} />
                </mesh>
              </group>
            )}
            <ExhaustPlume mode={exhaustMode} position={[0, stageSeparated ? 3.5 : 0.25, 0]} />
          </>
        )}

        {/* Dramatic 3D Fireball, Shockwave & Shattered Debris at Exact Vehicle Coordinates */}
        <ExplosionEffect active={isCrashed} position={[0, 1.2, 0]} />
      </group>

      {/* Tumbling Detached First Stage + SRBs */}
      {stageSeparated && !isDescending && !isLanded && !isOrbited && !isCrashed && (
        <group ref={detachedBoosterRef} position={[0, rocketVisualY, 0]}>
          <group position={[0, -0.5, 0]}>
            <ModularRocket3D
              rocketConfig={rocketConfig}
              showSpatialLabels={false}
              stageFilter="booster_only"
            />
          </group>
        </group>
      )}
    </group>
  );
}
