import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sky, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { ROCKET_ANATOMY_SLOTS } from '../../data/rocketAnatomy';

/**
 * Exact 3D focus coordinates on the launchpad rocket for each of the 6 anatomical zones.
 * Offset slightly right in X/Z so the rocket frames cleanly beside the right HUD inspector.
 */
export const ROCKET_ZONE_TARGETS = {
  overview: {
    camera: [2.2, 6.2, 16.5],
    lookAt: [0.6, 4.4, 0],
  },
  nosecone: {
    y: 9.25,
    radius: 0.72,
    height: 1.5,
    camera: [1.4, 9.6, 5.2],
    lookAt: [0.4, 9.15, 0],
  },
  avionicsPayload: {
    y: 8.05,
    radius: 0.78,
    height: 1.0,
    camera: [1.5, 8.2, 5.0],
    lookAt: [0.4, 8.05, 0],
  },
  edlSystem: {
    y: 7.0,
    radius: 0.85,
    height: 1.05,
    camera: [1.6, 7.1, 5.1],
    lookAt: [0.4, 7.0, 0],
  },
  upperStage: {
    y: 5.85,
    radius: 0.85,
    height: 1.2,
    camera: [1.7, 5.95, 5.4],
    lookAt: [0.4, 5.85, 0],
  },
  propellantTank: {
    y: 3.9,
    radius: 0.96,
    height: 2.5,
    camera: [2.0, 4.0, 6.6],
    lookAt: [0.5, 3.9, 0],
  },
  mainBooster: {
    y: 1.65,
    radius: 1.45,
    height: 2.1,
    camera: [2.2, 2.0, 6.8],
    lookAt: [0.5, 1.65, 0],
  },
};

function CrewPerson({
  startPos,
  endPos,
  speed = 0.65,
  suitColor = '#e2e8f0',
  accentColor = '#ff6b1a',
  hatColor = '#f59e0b',
  mode = 'walk', // 'walk' | 'inspect' | 'wave'
  phaseOffset = 0,
}) {
  const rootRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const headRef = useRef();

  const startVec = useMemo(() => new THREE.Vector3(...startPos), [startPos]);
  const endVec = useMemo(() => new THREE.Vector3(...endPos), [endPos]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phaseOffset;
    if (!rootRef.current) return;

    if (mode === 'walk') {
      const cycle = (t * speed) % 2;
      const alpha = cycle <= 1 ? cycle : 2 - cycle;
      const forward = cycle <= 1;

      rootRef.current.position.lerpVectors(startVec, endVec, alpha);
      const dir = new THREE.Vector3().subVectors(
        forward ? endVec : startVec,
        forward ? startVec : endVec
      );
      if (dir.lengthSq() > 0.0001) {
        rootRef.current.rotation.y = Math.atan2(dir.x, dir.z);
      }

      const swing = Math.sin(t * 7.5) * 0.55;
      if (leftLegRef.current) leftLegRef.current.rotation.x = swing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -swing;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -swing * 0.8;
      if (rightArmRef.current) rightArmRef.current.rotation.x = swing * 0.8;
      rootRef.current.position.y = startVec.y + Math.abs(Math.sin(t * 7.5)) * 0.03;
    } else if (mode === 'wave') {
      rootRef.current.position.copy(startVec);
      rootRef.current.rotation.y = Math.sin(t * 0.6) * 0.35 + (endPos[0] || 0);
      if (rightArmRef.current) {
        rightArmRef.current.rotation.z = -2.4 + Math.sin(t * 6.0) * 0.45;
      }
      if (headRef.current) {
        headRef.current.rotation.y = Math.sin(t * 1.4) * 0.35;
      }
    } else {
      // Inspecting rocket base / clipboard check
      rootRef.current.position.copy(startVec);
      if (headRef.current) {
        headRef.current.rotation.x = -0.25 + Math.sin(t * 1.8) * 0.14;
        headRef.current.rotation.y = Math.sin(t * 0.9) * 0.4;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -0.8 + Math.sin(t * 2.5) * 0.1;
      }
    }
  });

  return (
    <group ref={rootRef} position={startPos} scale={0.68}>
      {/* Left & Right Legs */}
      <group ref={leftLegRef} position={[-0.1, 0.42, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.25, 4, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.1, 0.42, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.065, 0.25, 4, 8]} />
          <meshStandardMaterial color="#334155" roughness={0.7} />
        </mesh>
      </group>

      {/* Torso */}
      <mesh position={[0, 0.68, 0]} castShadow>
        <capsuleGeometry args={[0.15, 0.28, 6, 10]} />
        <meshStandardMaterial color={suitColor} roughness={0.5} />
      </mesh>
      {/* Safety Vest / Space Backpack */}
      <mesh position={[0, 0.7, -0.13]} castShadow>
        <boxGeometry args={[0.22, 0.28, 0.1]} />
        <meshStandardMaterial color={accentColor} roughness={0.45} />
      </mesh>

      {/* Left & Right Arms */}
      <group ref={leftArmRef} position={[-0.2, 0.8, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
          <meshStandardMaterial color={suitColor} roughness={0.5} />
        </mesh>
      </group>
      <group ref={rightArmRef} position={[0.2, 0.8, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.055, 0.22, 4, 8]} />
          <meshStandardMaterial color={suitColor} roughness={0.5} />
        </mesh>
      </group>

      {/* Head & Hardhat / Visor */}
      <group ref={headRef} position={[0, 1.05, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.13, 12, 12]} />
          <meshStandardMaterial color="#e2b49a" roughness={0.6} />
        </mesh>
        {/* Hardhat Dome */}
        <mesh position={[0, 0.06, 0]} castShadow>
          <sphereGeometry args={[0.145, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={hatColor} roughness={0.35} metalness={0.2} />
        </mesh>
        {/* Glowing Cyan Visor Strip */}
        <mesh position={[0, 0.01, 0.11]}>
          <boxGeometry args={[0.14, 0.05, 0.04]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.9} />
        </mesh>
      </group>
    </group>
  );
}

function VolumetricClouds() {
  const cloudGroupRef = useRef();
  const clouds = useMemo(
    () => [
      { pos: [-16, 15.5, -14], scale: 1.5, speed: 0.25 },
      { pos: [12, 17, -18], scale: 1.9, speed: 0.18 },
      { pos: [-4, 18.5, -24], scale: 2.1, speed: 0.22 },
      { pos: [20, 14.5, -10], scale: 1.4, speed: 0.3 },
      { pos: [-22, 16.5, -8], scale: 1.6, speed: 0.2 },
    ],
    []
  );

  useFrame(({ clock }) => {
    if (!cloudGroupRef.current) return;
    const t = clock.getElapsedTime();
    cloudGroupRef.current.children.forEach((child, i) => {
      const cfg = clouds[i];
      child.position.x = ((cfg.pos[0] + t * cfg.speed + 30) % 60) - 30;
      child.position.y = cfg.pos[1] + Math.sin(t * 0.4 + i) * 0.25;
    });
  });

  return (
    <group ref={cloudGroupRef}>
      {clouds.map((c, idx) => (
        <group key={idx} position={c.pos} scale={c.scale}>
          <mesh position={[0, 0, 0]}>
            <icosahedronGeometry args={[1.4, 1]} />
            <meshStandardMaterial color="#3b4d70" transparent opacity={0.38} roughness={1} />
          </mesh>
          <mesh position={[1.1, -0.2, 0.3]}>
            <icosahedronGeometry args={[1.05, 1]} />
            <meshStandardMaterial color="#475b82" transparent opacity={0.35} roughness={1} />
          </mesh>
          <mesh position={[-1.05, -0.25, -0.2]}>
            <icosahedronGeometry args={[1.1, 1]} />
            <meshStandardMaterial color="#334466" transparent opacity={0.35} roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function SweepingSearchlights() {
  const beam1Ref = useRef();
  const beam2Ref = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (beam1Ref.current) {
      beam1Ref.current.rotation.z = Math.sin(t * 0.55) * 0.42 - 0.18;
      beam1Ref.current.rotation.x = Math.cos(t * 0.4) * 0.25;
    }
    if (beam2Ref.current) {
      beam2Ref.current.rotation.z = Math.cos(t * 0.48) * 0.42 + 0.18;
      beam2Ref.current.rotation.x = Math.sin(t * 0.35) * 0.25;
    }
  });

  return (
    <group>
      {/* Left Pad Searchlight */}
      <group position={[-6.8, 0.3, 4.2]}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.32, 0.4, 10]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
        <group ref={beam1Ref}>
          <mesh position={[0, 9, 0]}>
            <coneGeometry args={[2.2, 18, 16, 1, true]} />
            <meshBasicMaterial
              color="#7dd3fc"
              transparent
              opacity={0.075}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>

      {/* Right Pad Searchlight */}
      <group position={[6.8, 0.3, 4.2]}>
        <mesh>
          <cylinderGeometry args={[0.25, 0.32, 0.4, 10]} />
          <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.4} />
        </mesh>
        <group ref={beam2Ref}>
          <mesh position={[0, 9, 0]}>
            <coneGeometry args={[2.2, 18, 16, 1, true]} />
            <meshBasicMaterial
              color="#00f0ff"
              transparent
              opacity={0.07}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function RadarStation({ position }) {
  const dishRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (dishRef.current) {
      dishRef.current.rotation.y = t * 0.55;
      dishRef.current.rotation.x = -0.35 + Math.sin(t * 0.8) * 0.18;
    }
  });

  return (
    <group position={position}>
      {/* Concrete Pedestal */}
      <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.9, 1.15, 1.0, 8]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>
      {/* Lattice Mast */}
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.45, 1.3, 6]} />
        <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Rotating Parabolic Dish */}
      <group ref={dishRef} position={[0, 2.5, 0]}>
        <mesh rotation={[Math.PI * 0.5, 0, 0]} castShadow>
          <sphereGeometry args={[1.25, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.36]} />
          <meshStandardMaterial
            color="#cbd5e1"
            metalness={0.55}
            roughness={0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Feed Horn */}
        <mesh position={[0, 0, 0.75]} rotation={[Math.PI * 0.5, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.08, 0.9, 8]} />
          <meshStandardMaterial color="#ff6b1a" emissive="#ff6b1a" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[0, 0, 1.2]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.6} />
        </mesh>
      </group>
    </group>
  );
}

function LaunchTower() {
  const beaconRef = useRef();

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(clock.getElapsedTime() * 4.5);
      beaconRef.current.material.emissiveIntensity = 0.4 + pulse * 2.2;
    }
  });

  const levels = [1.5, 3.0, 4.5, 6.0, 7.5, 9.0];

  return (
    <group position={[-2.45, 0.6, 0]}>
      {/* 4 Vertical Steel Lattice Columns */}
      {[
        [-0.55, -0.55],
        [0.55, -0.55],
        [-0.55, 0.55],
        [0.55, 0.55],
      ].map(([cx, cz], idx) => (
        <mesh key={idx} position={[cx, 4.8, cz]} castShadow>
          <boxGeometry args={[0.14, 9.6, 0.14]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}

      {/* Horizontal Deck Levels & Cross Braces */}
      {levels.map((ly, idx) => (
        <group key={idx} position={[0, ly, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.35, 0.12, 1.35]} />
            <meshStandardMaterial color="#475569" metalness={0.5} roughness={0.45} />
          </mesh>
          {/* Hazard orange corner accent */}
          <mesh position={[0.68, 0, 0]}>
            <boxGeometry args={[0.06, 0.14, 1.35]} />
            <meshStandardMaterial color="#ff6b1a" roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Umbilical Swing Arms reaching to rocket */}
      {[3.4, 5.6, 7.6].map((ay, idx) => (
        <group key={idx} position={[1.1, ay, 0]}>
          <mesh castShadow>
            <boxGeometry args={[1.4, 0.12, 0.22]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0.65, 0, 0]}>
            <boxGeometry args={[0.18, 0.22, 0.34]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.45} />
          </mesh>
        </group>
      ))}

      {/* Lightning Mast & Flashing Aviation Beacon */}
      <mesh position={[0, 10.2, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 1.3, 6]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.7} />
      </mesh>
      <mesh ref={beaconRef} position={[0, 10.9, 0]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <meshStandardMaterial color="#ff3b30" emissive="#ff3b30" emissiveIntensity={2} />
      </mesh>
    </group>
  );
}

function RocketHologramRing({ activeSlotKey }) {
  const ringRef = useRef();
  const outerRingRef = useRef();
  const zone = activeSlotKey ? ROCKET_ZONE_TARGETS[activeSlotKey] : null;
  const slotMeta = ROCKET_ANATOMY_SLOTS.find((s) => s.key === activeSlotKey);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 1.4;
      const pulse = 1 + Math.sin(t * 4) * 0.04;
      ringRef.current.scale.set(pulse, pulse, 1);
    }
    if (outerRingRef.current) {
      outerRingRef.current.rotation.z = -t * 0.8;
    }
  });

  if (!zone || !slotMeta) return null;

  return (
    <group position={[0, zone.y, 0]}>
      {/* Main Horizontal Glowing Holographic Ring */}
      <mesh ref={ringRef} rotation={[Math.PI * 0.5, 0, 0]}>
        <torusGeometry args={[zone.radius + 0.35, 0.04, 12, 40]} />
        <meshBasicMaterial color={slotMeta.accent} transparent opacity={0.95} />
      </mesh>

      {/* Secondary Dashed/Tilted Scanner Ring */}
      <mesh ref={outerRingRef} rotation={[Math.PI * 0.42, 0.18, 0]}>
        <torusGeometry args={[zone.radius + 0.52, 0.02, 8, 36]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.55} />
      </mesh>

      {/* Translucent Holographic Cylinder Envelope */}
      <mesh>
        <cylinderGeometry args={[zone.radius + 0.14, zone.radius + 0.14, zone.height, 24, 1, true]} />
        <meshBasicMaterial
          color={slotMeta.accent}
          transparent
          opacity={0.14}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

function MultiStageRocket({ activeSlotKey, onSelectSlot }) {
  const handleClick = (slotKey) => (e) => {
    e.stopPropagation();
    onSelectSlot?.(slotKey);
  };

  const isSelected = (slotKey) => activeSlotKey === slotKey;

  return (
    <group position={[0, 0.6, 0]}>
      {/* 6. MAIN BOOSTER & SEA-LEVEL ENGINES (local y: 0 .. 2.0 -> world 0.6 .. 2.6) */}
      <group onClick={handleClick('mainBooster')}>
        {/* Core Booster Skirt (Gleaming White NASA/ESA) */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <cylinderGeometry args={[0.72, 0.82, 1.7, 20]} />
          <meshStandardMaterial
            color="#f8fafc"
            metalness={0.25}
            roughness={0.25}
            emissive={isSelected('mainBooster') ? '#fb7185' : '#000000'}
            emissiveIntensity={isSelected('mainBooster') ? 0.35 : 0}
          />
        </mesh>
        {/* 2 Side Strap-on Boosters */}
        {[-0.95, 0.95].map((bx, i) => (
          <group key={i} position={[bx, 1.25, 0]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.28, 0.32, 2.2, 14]} />
              <meshStandardMaterial color="#e2e8f0" roughness={0.35} metalness={0.25} />
            </mesh>
            <mesh position={[0, 1.32, 0]} castShadow>
              <coneGeometry args={[0.28, 0.48, 14]} />
              <meshStandardMaterial color="#ff6b1a" roughness={0.4} />
            </mesh>
            <mesh position={[0, -1.25, 0]}>
              <cylinderGeometry args={[0.14, 0.24, 0.35, 12]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
          </group>
        ))}
        {/* 3 Gimbaled Core Engine Bells */}
        {[
          [0, 0.18, 0],
          [-0.36, 0.22, 0.22],
          [0.36, 0.22, -0.22],
        ].map(([ex, ey, ez], i) => (
          <mesh key={i} position={[ex, ey, ez]} castShadow>
            <cylinderGeometry args={[0.16, 0.28, 0.42, 14]} />
            <meshStandardMaterial color="#64748b" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
      </group>

      {/* 5. PROPELLANT TANK (LOX + FUEL) (local y: 2.0 .. 4.6 -> world 2.6 .. 5.2) */}
      <group onClick={handleClick('propellantTank')}>
        <mesh position={[0, 3.3, 0]} castShadow>
          <cylinderGeometry args={[0.7, 0.72, 2.6, 20]} />
          <meshStandardMaterial
            color="#f1f5f9"
            roughness={0.35}
            metalness={0.2}
            emissive={isSelected('propellantTank') ? '#10b981' : '#000000'}
            emissiveIntensity={isSelected('propellantTank') ? 0.3 : 0}
          />
        </mesh>
        {/* Roll Pattern Black/Orange Bands */}
        <mesh position={[0, 2.55, 0]}>
          <cylinderGeometry args={[0.715, 0.715, 0.22, 20]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
        <mesh position={[0, 4.15, 0]}>
          <cylinderGeometry args={[0.71, 0.71, 0.18, 20]} />
          <meshStandardMaterial color="#ff6b1a" roughness={0.45} />
        </mesh>
      </group>

      {/* 4. UPPER VACUUM STAGE (local y: 4.6 .. 5.9 -> world 5.2 .. 6.5) */}
      <group onClick={handleClick('upperStage')}>
        <mesh position={[0, 5.25, 0]} castShadow>
          <cylinderGeometry args={[0.62, 0.7, 1.3, 20]} />
          <meshStandardMaterial
            color="#334155"
            metalness={0.6}
            roughness={0.35}
            emissive={isSelected('upperStage') ? '#818cf8' : '#000000'}
            emissiveIntensity={isSelected('upperStage') ? 0.4 : 0}
          />
        </mesh>
        <mesh position={[0, 4.7, 0]}>
          <cylinderGeometry args={[0.73, 0.73, 0.14, 20]} />
          <meshStandardMaterial color="#818cf8" emissive="#818cf8" emissiveIntensity={0.45} />
        </mesh>
      </group>

      {/* 3. EDL LANDING SYSTEM (local y: 5.9 .. 7.0 -> world 6.5 .. 7.6) */}
      <group onClick={handleClick('edlSystem')}>
        <mesh position={[0, 6.45, 0]} castShadow>
          <cylinderGeometry args={[0.6, 0.64, 1.05, 18]} />
          <meshStandardMaterial
            color="#d97706"
            metalness={0.55}
            roughness={0.35}
            emissive={isSelected('edlSystem') ? '#f59e0b' : '#000000'}
            emissiveIntensity={isSelected('edlSystem') ? 0.45 : 0}
          />
        </mesh>
        {/* 4 Retro-thruster pods around EDL collar */}
        {[0, Math.PI * 0.5, Math.PI, Math.PI * 1.5].map((ang, i) => (
          <mesh
            key={i}
            position={[Math.cos(ang) * 0.64, 6.45, Math.sin(ang) * 0.64]}
            castShadow
          >
            <boxGeometry args={[0.16, 0.36, 0.16]} />
            <meshStandardMaterial color="#1e293b" metalness={0.7} />
          </mesh>
        ))}
      </group>

      {/* 2. AVIONICS & PAYLOAD BAY (local y: 7.0 .. 8.0 -> world 7.6 .. 8.6) */}
      <group onClick={handleClick('avionicsPayload')}>
        <mesh position={[0, 7.45, 0]} castShadow>
          <cylinderGeometry args={[0.58, 0.6, 0.98, 20]} />
          <meshStandardMaterial
            color="#e2e8f0"
            metalness={0.45}
            roughness={0.3}
            emissive={isSelected('avionicsPayload') ? '#38bdf8' : '#000000'}
            emissiveIntensity={isSelected('avionicsPayload') ? 0.45 : 0}
          />
        </mesh>
        {/* Glowing Cyan Guidance Band */}
        <mesh position={[0, 7.55, 0]}>
          <cylinderGeometry args={[0.605, 0.605, 0.14, 20]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* 1. NOSECONE FAIRING (local y: 8.0 .. 9.6 -> world 8.6 .. 10.2) */}
      <group onClick={handleClick('nosecone')}>
        <mesh position={[0, 8.65, 0]} castShadow>
          <coneGeometry args={[0.58, 1.45, 22]} />
          <meshStandardMaterial
            color="#f8fafc"
            roughness={0.28}
            metalness={0.25}
            emissive={isSelected('nosecone') ? '#00f0ff' : '#000000'}
            emissiveIntensity={isSelected('nosecone') ? 0.35 : 0}
          />
        </mesh>
        <mesh position={[0, 9.52, 0]}>
          <cylinderGeometry args={[0.02, 0.06, 0.45, 8]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.1} />
        </mesh>
      </group>
    </group>
  );
}

export default function SpaceBaseScene({ activeSlotKey, onSelectSlot, isDaytime = true }) {
  return (
    <group position={[0, 0, 0]}>
      {/* Bright Sunny Daytime Sky & Warm Sunlight (only when viewing Earth surface) */}
      {isDaytime && (
        <>
          <Sky sunPosition={[100, 60, 100]} turbidity={0.3} rayleigh={0.5} />
          <ambientLight intensity={1.2} color="#ffffff" />
          <hemisphereLight args={['#BAE6FD', '#3A7D44', 0.65]} />
          <directionalLight
            position={[24, 34, 20]}
            intensity={2.5}
            color="#FFFBEB"
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
        </>
      )}

      {/* Bright Coastal Green Spaceport Ground */}
      <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <circleGeometry args={[65, 48]} />
        <meshStandardMaterial color="#3A7D44" roughness={0.92} />
      </mesh>
      {/* Concrete Launchpad Apron */}
      <mesh rotation={[-Math.PI * 0.5, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <circleGeometry args={[18, 36]} />
        <meshStandardMaterial color="#94A3B8" roughness={0.85} />
      </mesh>

      {/* Subtle Concrete Pad Perimeter Grid Lines */}
      <gridHelper args={[36, 18, '#64748B', '#CBD5E1']} position={[0, 0.005, 0]} />

      {/* Raised Octagonal Concrete Launchpad Deck */}
      <mesh position={[0, 0.3, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[4.4, 5.2, 0.6, 8]} />
        <meshStandardMaterial color="#64748B" roughness={0.8} metalness={0.15} />
      </mesh>
      {/* Flame Trench & Deflector */}
      <mesh position={[0, 0.61, 0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.3, 0.06, 16]} />
        <meshStandardMaterial color="#334155" roughness={0.9} />
      </mesh>
      {/* Pad Perimeter Safety Lights */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((idx) => {
        const ang = (idx / 8) * Math.PI * 2;
        return (
          <mesh key={idx} position={[Math.cos(ang) * 4.3, 0.64, Math.sin(ang) * 4.3]}>
            <boxGeometry args={[0.24, 0.1, 0.24]} />
            <meshStandardMaterial
              color={idx % 2 === 0 ? '#f59e0b' : '#00f0ff'}
              emissive={idx % 2 === 0 ? '#f59e0b' : '#00f0ff'}
              emissiveIntensity={1.6}
            />
          </mesh>
        );
      })}

      {/* Raised Launchpad Catwalk Bridge from VAB to Pad */}
      <mesh position={[-5.4, 0.42, 0]} receiveShadow castShadow>
        <boxGeometry args={[6.4, 0.22, 1.5]} />
        <meshStandardMaterial color="#334155" roughness={0.7} />
      </mesh>
      {/* Catwalk Guardrails */}
      <mesh position={[-5.4, 0.72, 0.7]}>
        <boxGeometry args={[6.4, 0.06, 0.05]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[-5.4, 0.72, -0.7]}>
        <boxGeometry args={[6.4, 0.06, 0.05]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>

      {/* Giant Lattice Launch Tower */}
      <LaunchTower />

      {/* 6-Part Clickable Multi-Stage Rocket */}
      <MultiStageRocket activeSlotKey={activeSlotKey} onSelectSlot={onSelectSlot} />

      {/* Glowing Holographic Ring around Selected Rocket Zone */}
      <RocketHologramRing activeSlotKey={activeSlotKey} />

      {/* Venting Cryogenic Vapor Particles around Tank & Pad */}
      <Sparkles
        position={[0.6, 3.6, 0.5]}
        count={48}
        scale={[2.6, 4.5, 2.6]}
        size={3.2}
        speed={0.55}
        opacity={0.55}
        color="#bae6fd"
      />
      <Sparkles
        position={[0, 1.1, 0]}
        count={36}
        scale={[3.8, 1.3, 3.8]}
        size={4.5}
        speed={0.4}
        opacity={0.45}
        color="#e0f2fe"
      />

      {/* Vehicle Assembly Building (VAB Hangar) */}
      <group position={[-10.5, 0, -4.5]}>
        <mesh position={[0, 3.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[6.4, 7.2, 6.0]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} metalness={0.15} />
        </mesh>
        {/* VAB Roof Structure */}
        <mesh position={[0, 7.35, 0]}>
          <boxGeometry args={[6.8, 0.35, 6.4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.35} />
        </mesh>
        {/* Giant High-Bay Hangar Door facing East */}
        <mesh position={[3.22, 2.8, 0]}>
          <boxGeometry args={[0.12, 5.4, 3.4]} />
          <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.4} />
        </mesh>
        {/* Hangar Door Glowing Interior Light Strip */}
        <mesh position={[3.28, 5.55, 0]}>
          <boxGeometry args={[0.15, 0.2, 3.6]} />
          <meshStandardMaterial color="#ff6b1a" emissive="#ff6b1a" emissiveIntensity={1.5} />
        </mesh>
        {/* Glowing VAB Observation Windows */}
        {[1.6, 3.2, 4.8, 6.0].map((wy, idx) => (
          <mesh key={idx} position={[0, wy, 3.03]}>
            <boxGeometry args={[4.4, 0.42, 0.08]} />
            <meshStandardMaterial
              color={idx === 3 ? '#00f0ff' : '#fde68a'}
              emissive={idx === 3 ? '#00f0ff' : '#f59e0b'}
              emissiveIntensity={1.1}
            />
          </mesh>
        ))}
      </group>

      {/* Mission Control & Tracking Center */}
      <group position={[8.2, 0, -4.2]}>
        <mesh position={[0, 1.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[2.8, 3.2, 2.6, 6]} />
          <meshStandardMaterial color="#1e293b" roughness={0.65} metalness={0.3} />
        </mesh>
        {/* Glowing Cyan Telemetry Windows */}
        <mesh position={[0, 1.75, 0]}>
          <cylinderGeometry args={[2.95, 2.95, 0.45, 6]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.85} />
        </mesh>
        {/* Comms Antenna Spire */}
        <mesh position={[0, 3.8, 0]}>
          <cylinderGeometry args={[0.05, 0.14, 2.4, 6]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.7} />
        </mesh>
      </group>

      {/* Rotating 3D Radar Dish */}
      <RadarStation position={[8.6, 0, 2.6]} />

      {/* Sweeping Searchlights */}
      <SweepingSearchlights />

      {/* Drifting 3D Volumetric Clouds */}
      <VolumetricClouds />

      {/* 7 Animated Low-Poly Engineers & Astronauts */}
      {/* 2 Engineers walking along the launchpad catwalk */}
      <CrewPerson
        startPos={[-7.6, 0.54, -0.25]}
        endPos={[-3.3, 0.54, -0.25]}
        speed={0.45}
        suitColor="#f8fafc"
        accentColor="#ff6b1a"
        hatColor="#f59e0b"
        mode="walk"
        phaseOffset={0}
      />
      <CrewPerson
        startPos={[-3.6, 0.54, 0.3]}
        endPos={[-7.4, 0.54, 0.3]}
        speed={0.38}
        suitColor="#e2e8f0"
        accentColor="#00f0ff"
        hatColor="#ffffff"
        mode="walk"
        phaseOffset={1.6}
      />

      {/* 2 Pad Technicians inspecting the rocket base */}
      <CrewPerson
        startPos={[1.9, 0.6, 1.5]}
        endPos={[1.9, 0.6, 1.5]}
        suitColor="#f1f5f9"
        accentColor="#f59e0b"
        hatColor="#f59e0b"
        mode="inspect"
        phaseOffset={0.4}
      />
      <CrewPerson
        startPos={[-1.6, 0.6, 2.2]}
        endPos={[-1.6, 0.6, 2.2]}
        suitColor="#cbd5e1"
        accentColor="#00f0ff"
        hatColor="#38bdf8"
        mode="inspect"
        phaseOffset={2.1}
      />

      {/* 2 Astronauts walking from VAB toward Pad & waving */}
      <CrewPerson
        startPos={[-6.8, 0.0, 2.2]}
        endPos={[-3.2, 0.0, 3.1]}
        speed={0.32}
        suitColor="#ff6b1a"
        accentColor="#ffffff"
        hatColor="#ffffff"
        mode="walk"
        phaseOffset={0.8}
      />
      <CrewPerson
        startPos={[4.6, 0.0, 2.4]}
        endPos={[-0.4, 0, 0]}
        suitColor="#ff6b1a"
        accentColor="#00f0ff"
        hatColor="#ffffff"
        mode="wave"
        phaseOffset={1.1}
      />

      {/* 1 Flight Ops Engineer outside Mission Control */}
      <CrewPerson
        startPos={[6.1, 0.0, -1.6]}
        endPos={[7.8, 0.0, 0.4]}
        speed={0.42}
        suitColor="#e2e8f0"
        accentColor="#10b981"
        hatColor="#f59e0b"
        mode="walk"
        phaseOffset={2.9}
      />
    </group>
  );
}
