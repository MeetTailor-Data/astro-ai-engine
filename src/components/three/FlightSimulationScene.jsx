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
  const debris = useMemo(
    () =>
      Array.from({ length: 16 }, (_, i) => ({
        vx: Math.cos((i / 16) * Math.PI * 2) * (2.5 + (i % 4) * 1.4),
        vy: 1.5 + (i % 5) * 1.2,
        vz: Math.sin((i / 16) * Math.PI * 2) * (2.5 + (i % 3) * 1.4),
        size: 0.14 + (i % 3) * 0.08,
      })),
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

    if (ringRef.current) {
      const rScale = 1 + age * 8.5;
      ringRef.current.scale.set(rScale, rScale, 1);
      if (ringRef.current.material) {
        ringRef.current.material.opacity = Math.max(0, 0.9 - age * 0.45);
      }
    }
    if (groupRef.current) {
      groupRef.current.children.forEach((child, idx) => {
        const d = debris[idx];
        if (!d) return;
        child.position.set(d.vx * age, d.vy * age - 2.2 * age * age, d.vz * age);
        child.rotation.x += 0.12;
        child.rotation.z += 0.09;
      });
    }
  });

  if (!active) return null;

  return (
    <group position={position}>
      {/* Fireball Core */}
      <mesh>
        <sphereGeometry args={[1.8, 18, 16]} />
        <meshBasicMaterial color="#FF6B1A" transparent opacity={0.88} />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.15, 14, 12]} />
        <meshBasicMaterial color="#FEF08A" transparent opacity={0.95} />
      </mesh>
      <pointLight intensity={18} distance={28} color="#FF4500" />
      {/* Expanding Shockwave Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.15, 32]} />
        <meshBasicMaterial color="#FBBF24" side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>
      {/* Flying 3D Debris Parts */}
      <group ref={groupRef}>
        {debris.map((d, i) => (
          <mesh key={i}>
            <boxGeometry args={[d.size, d.size * 1.6, d.size * 0.7]} />
            <meshStandardMaterial color={i % 2 === 0 ? '#E2E8F0' : '#475569'} metalness={0.6} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function DestinationSurface({ bodyType, visible, landed }) {
  if (!visible) return null;

  const isMoon = bodyType === 'moon';
  const isMars = bodyType === 'mars';
  const groundColor = isMoon ? '#64748B' : isMars ? '#B45309' : '#3A7D44';
  const padColor = isMoon ? '#94A3B8' : isMars ? '#9A3412' : '#64748B';

  return (
    <group position={[0, -0.35, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[70, 48]} />
        <meshStandardMaterial color={groundColor} roughness={0.92} />
      </mesh>
      {/* Crater Rim Rings on Moon / Mars */}
      {(isMoon || isMars) &&
        [
          [6, 0.08, -5, 2.8],
          [-8, 0.08, -7, 3.6],
          [11, 0.08, 4, 2.2],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[r, 0.25, 8, 24]} />
            <meshStandardMaterial color={padColor} roughness={0.95} />
          </mesh>
        ))}
      {/* Green Touchdown Beacon */}
      {landed && (
        <group position={[0, 0.2, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[2.1, 2.35, 36]} />
            <meshBasicMaterial color="#10B981" side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0, 1.2, 0]} intensity={6} distance={10} color="#10B981" />
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
  const isCrashed = status === 'CRASHED';
  const isLanded = status === 'LANDED' && !isOrbitalPhase;
  const isOrbited = status === 'LANDED' && isOrbitalPhase;

  // Compute rocket visual Y height for pad / landing / spaceflight
  const rocketVisualY = useMemo(() => {
    if (isPrelaunch) return 0;
    if (isLanded) return 0.35;
    if (isDescending) {
      return Math.max(0.35, (altitudeKm / 12) * 8.5);
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

    // 4. Camera Switcher + Dynamic Launch Shake
    const ry = rocketGroupRef.current ? rocketGroupRef.current.position.y : 0;
    const isBurning = !isPrelaunch && !isCrashed && !isLanded && phase !== 'FUEL_DEPLETED';
    const shakeMag = isBurning && altitudeKm < 45 ? 0.085 : 0;
    const shakeX = shakeMag ? (Math.sin(t * 53) * 0.5 + Math.cos(t * 71) * 0.5) * shakeMag : 0;
    const shakeY = shakeMag ? (Math.cos(t * 61) * 0.5 + Math.sin(t * 43) * 0.5) * shakeMag : 0;

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
      // TRACKING CAM (slow-motion orbital pan during finale)
      const finaleOrbit = isLanded || isOrbited || isCrashed ? Math.sin(t * 0.45) * 3.2 : 0;
      camTargetRef.current.set(6.4 + shakeX + finaleOrbit, ry + 4.4 + shakeY, 10.6);
      camLookRef.current.set(0, ry + 3.2, 0);
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

  const deployChute = edlDeployed && Boolean(rocketConfig?.edlSystem?.parachute) && bodyType !== 'moon';
  const deployLegs = edlDeployed && rocketConfig?.edlSystem?.id === 'full_edl_package';
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

      {/* Glowing Curved Earth Horizon below when high in atmosphere / space */}
      {showCurvedEarth && (
        <group position={[0, -52 - Math.min(24, (altitudeKm - 35) * 0.12), -12]}>
          <mesh>
            <sphereGeometry args={[48, 48, 36]} />
            <meshStandardMaterial color="#0369A1" roughness={0.7} />
          </mesh>
          <mesh>
            <sphereGeometry args={[48.6, 40, 32]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.22} side={THREE.BackSide} />
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
      <DestinationSurface bodyType={bodyType} visible={showDestination} landed={isLanded} />

      {/* Main Rocket Vehicle */}
      {!isCrashed && (
        <group ref={rocketGroupRef} position={[0, 0, 0]}>
          <group position={[0, -0.5, 0]}>
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
          <ExhaustPlume mode={exhaustMode} position={[0, stageSeparated ? 3.5 : 0.25, 0]} />
        </group>
      )}

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

      {/* Dramatic 3D Fireball, Shockwave & Debris on Crash */}
      <ExplosionEffect active={isCrashed} position={[0, Math.max(1.5, rocketVisualY + 1.5), 0]} />
    </group>
  );
}
