import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

/**
 * ModularRocket3D — Realistic Mars Horizon / NASA-style 6-part 3D rocket.
 * - Glossy white stages, metallic silver interstage rings, classic NASA black-and-white
 *   roll-pattern checkered bands, detailed conical engine bells, and 2/4 side SRBs with struts.
 * - Empty slots render as subtle translucent blueprint wireframes.
 * - Newly installed parts animate in with a smooth slide/snap + welding sparks.
 * - X-Ray Cutaway Mode turns outer skins into translucent blue hologram glass.
 */

function useCheckerTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const cols = 16;
    const rows = 2;
    const w = canvas.width / cols;
    const h = canvas.height / rows;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#0F172A' : '#F8FAFC';
        ctx.fillRect(c * w, r * h, w, h);
      }
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);
}

function HullMaterial({ color = '#F8FAFC', xray, metalness = 0.22, roughness = 0.18 }) {
  if (xray) {
    return (
      <meshPhysicalMaterial
        color="#38BDF8"
        emissive="#0284C7"
        emissiveIntensity={0.25}
        transparent
        opacity={0.18}
        roughness={0.1}
        metalness={0.15}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    );
  }
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />;
}

// ─── Empty Slot Blueprint Wireframe ──────────────────────────────────────────

function GhostSlotBlueprint({ type, height = 1.0, radius = 0.42, isNext = false, isActive = false }) {
  const wireRef = useRef();
  useFrame((state) => {
    if (wireRef.current) {
      const pulse = 0.25 + Math.sin(state.clock.elapsedTime * (isNext ? 4.5 : 2.0)) * 0.12;
      wireRef.current.material.opacity = isActive ? 0.65 : isNext ? pulse + 0.18 : pulse;
    }
  });

  const color = isNext ? '#FBBF24' : '#93C5FD';

  return (
    <group>
      {type === 'cone' ? (
        <mesh ref={wireRef} position={[0, 0.55, 0]}>
          <coneGeometry args={[radius, height, 16, 2]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.32} />
        </mesh>
      ) : (
        <mesh ref={wireRef}>
          <cylinderGeometry args={[radius, radius, height, 16, 2]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.32} />
        </mesh>
      )}
      {type === 'cone' ? (
        <mesh position={[0, 0.55, 0]}>
          <coneGeometry args={[radius * 0.96, height * 0.96, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.07} depthWrite={false} />
        </mesh>
      ) : (
        <mesh>
          <cylinderGeometry args={[radius * 0.96, radius * 0.96, height * 0.96, 16]} />
          <meshBasicMaterial color={color} transparent opacity={0.07} depthWrite={false} />
        </mesh>
      )}
    </group>
  );
}

// ─── Spring Drop-In + Welding Spark Wrapper ──────────────────────────────────

function AnimatedSlotDrop({ children, isJustInstalled, sparkY = 0 }) {
  const groupRef = useRef();
  const [showSparks, setShowSparks] = useState(false);
  const progressRef = useRef(1);

  useEffect(() => {
    if (isJustInstalled) {
      progressRef.current = 0;
      setShowSparks(true);
      const timer = setTimeout(() => setShowSparks(false), 950);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isJustInstalled]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    if (progressRef.current < 1) {
      progressRef.current = Math.min(1, progressRef.current + delta * 1.9);
      const t = progressRef.current;
      const easeOutBack = 1 - Math.pow(1 - t, 3);
      const overshoot = Math.sin(t * Math.PI * 2.2) * (1 - t) * 0.12;
      groupRef.current.position.y = (1 - easeOutBack) * 2.8 - overshoot;
    } else {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group>
      <group ref={groupRef}>{children}</group>
      {showSparks && (
        <group position={[0, sparkY, 0]}>
          <Sparkles
            count={36}
            scale={[1.4, 0.65, 1.4]}
            size={4.0}
            speed={2.2}
            opacity={0.95}
            color="#FBBF24"
          />
          <pointLight intensity={2.5} distance={3.5} color="#FF9E2C" />
        </group>
      )}
    </group>
  );
}

// ─── Realistic NASA / Mars Horizon Stage Geometries ──────────────────────────

function NoseconeGeom({ partId, xray }) {
  const isHeavy = partId === 'heavy_thermal_fairing';
  const isReinforced = partId === 'reinforced_shroud';
  const tipColor = isHeavy ? '#F59E0B' : isReinforced ? '#38BDF8' : '#F8FAFC';

  return (
    <group>
      <mesh position={[0, 0.85, 0]} castShadow>
        <coneGeometry args={[0.39, 1.15, 28]} />
        <HullMaterial color="#F8FAFC" xray={xray} />
      </mesh>
      {!xray && (
        <mesh position={[0, 1.32, 0]}>
          <coneGeometry args={[0.08, 0.24, 16]} />
          <meshStandardMaterial color={tipColor} metalness={0.35} roughness={0.25} />
        </mesh>
      )}
      {xray && (
        <mesh position={[0, 0.85, 0]}>
          <coneGeometry args={[0.395, 1.15, 16]} />
          <meshBasicMaterial color="#7DD3FC" wireframe transparent opacity={0.28} />
        </mesh>
      )}
      {/* Metallic Silver Interstage Ring */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.41, 0.18, 28]} />
        <HullMaterial color="#CBD5E1" xray={xray} metalness={0.75} roughness={0.25} />
      </mesh>
    </group>
  );
}

function InternalPayloadModel({ partId }) {
  if (partId === 'mars_rover') {
    return (
      <group scale={0.75}>
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.36, 0.16, 0.24]} />
          <meshStandardMaterial color="#F59E0B" emissive="#F59E0B" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0.1, 0.22, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.22, 8]} />
          <meshStandardMaterial color="#E2E8F0" />
        </mesh>
        <mesh position={[0.1, 0.34, 0]}>
          <boxGeometry args={[0.1, 0.07, 0.12]} />
          <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={0.8} />
        </mesh>
        {[-0.14, 0, 0.14].map((x, i) => (
          <group key={i}>
            <mesh position={[x, -0.08, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.04, 12]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
            <mesh position={[x, -0.08, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.055, 0.055, 0.04, 12]} />
              <meshStandardMaterial color="#334155" />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (partId === 'lunar_lander') {
    return (
      <group scale={0.8}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.16, 0.22, 0.22, 8]} />
          <meshStandardMaterial color="#FBBF24" metalness={0.8} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <sphereGeometry args={[0.14, 12, 10]} />
          <meshStandardMaterial color="#818CF8" />
        </mesh>
      </group>
    );
  }

  if (partId === 'crew_capsule') {
    return (
      <group scale={0.85}>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.14, 0.28, 0.34, 16]} />
          <meshStandardMaterial color="#FB7185" />
        </mesh>
      </group>
    );
  }

  return (
    <group scale={0.82}>
      <mesh>
        <boxGeometry args={[0.2, 0.26, 0.2]} />
        <meshStandardMaterial color="#38BDF8" metalness={0.6} roughness={0.25} />
      </mesh>
      <mesh position={[0.24, 0, 0]}>
        <boxGeometry args={[0.24, 0.14, 0.015]} />
        <meshStandardMaterial color="#1D4ED8" />
      </mesh>
      <mesh position={[-0.24, 0, 0]}>
        <boxGeometry args={[0.24, 0.14, 0.015]} />
        <meshStandardMaterial color="#1D4ED8" />
      </mesh>
    </group>
  );
}

function AvionicsBayGeom({ partId, xray }) {
  const isLunar = partId === 'lunar_lander';
  const isMars = partId === 'mars_rover';
  const isCrew = partId === 'crew_capsule';
  const accent = isCrew ? '#FB7185' : isMars ? '#10B981' : isLunar ? '#818CF8' : '#38BDF8';
  const height = isCrew ? 0.95 : isMars ? 0.88 : isLunar ? 0.8 : 0.68;

  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.4, height, 28]} />
        <HullMaterial color="#F8FAFC" xray={xray} />
      </mesh>
      {/* Metallic Silver & Accent Guidance Band */}
      {!xray && (
        <>
          <mesh position={[0, height * 0.35, 0]}>
            <cylinderGeometry args={[0.406, 0.406, 0.1, 28]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.75} roughness={0.25} />
          </mesh>
          <mesh position={[0, -height * 0.32, 0]}>
            <cylinderGeometry args={[0.406, 0.406, 0.09, 28]} />
            <meshStandardMaterial color={accent} roughness={0.35} />
          </mesh>
        </>
      )}
      {xray && (
        <>
          <mesh>
            <cylinderGeometry args={[0.405, 0.405, height, 16]} />
            <meshBasicMaterial color="#7DD3FC" wireframe transparent opacity={0.22} />
          </mesh>
          <mesh position={[0, -height * 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.31, 0.04, 8, 24]} />
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.1} />
          </mesh>
          <group position={[0, 0.08, 0]}>
            <InternalPayloadModel partId={partId} />
          </group>
        </>
      )}
    </group>
  );
}

function EdlSystemGeom({ partId, xray, deployLegs = false, deployChute = false, heatGlow = false }) {
  const hasHeatshield = ['heatshield_supersonic_chute', 'full_edl_package'].includes(partId);
  const hasLegs = partId === 'full_edl_package';
  const hasChute = ['drogue_main_chute', 'heatshield_supersonic_chute', 'full_edl_package'].includes(partId);

  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.42, 0.55, 28]} />
        <HullMaterial color="#E2E8F0" xray={xray} metalness={0.45} roughness={0.28} />
      </mesh>
      {!xray && (
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.415, 0.425, 0.12, 28]} />
          <meshStandardMaterial color="#1E293B" roughness={0.5} />
        </mesh>
      )}
      {hasHeatshield && (
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.46, 0.42, 0.08, 28]} />
          <meshStandardMaterial
            color={heatGlow ? '#FF6B1A' : '#B45309'}
            emissive={heatGlow ? '#EF4444' : '#000000'}
            emissiveIntensity={heatGlow ? 1.8 : 0}
            roughness={0.75}
          />
        </mesh>
      )}
      {hasChute && (
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.18, 0.16, 0.24, 14]} />
          <meshStandardMaterial
            color="#FB923C"
            emissive={xray ? '#F97316' : '#000000'}
            emissiveIntensity={xray ? 0.7 : 0}
          />
        </mesh>
      )}
      {hasChute && deployChute && (
        <group position={[0, 3.2, 0]}>
          {/* 3D Inflated Parachute Canopy */}
          <mesh>
            <sphereGeometry args={[1.45, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshStandardMaterial color="#F97316" side={THREE.DoubleSide} roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <sphereGeometry args={[1.46, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.22]} />
            <meshStandardMaterial color="#F8FAFC" side={THREE.DoubleSide} roughness={0.5} />
          </mesh>
          {/* Suspension Risers */}
          {[0, 1, 2, 3].map((i) => {
            const ang = (i / 4) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.sin(ang) * 0.65, -1.45, Math.cos(ang) * 0.65]}
                rotation={[Math.cos(ang) * 0.36, 0, -Math.sin(ang) * 0.36]}
              >
                <cylinderGeometry args={[0.012, 0.012, 3.0, 6]} />
                <meshBasicMaterial color="#CBD5E1" />
              </mesh>
            );
          })}
        </group>
      )}
      {hasLegs && (
        <>
          {[0, 1, 2, 3].map((i) => {
            const ang = (i / 4) * Math.PI * 2;
            const spread = deployLegs ? 0.72 : 0.48;
            const yPos = deployLegs ? -0.45 : -0.25;
            const tilt = deployLegs ? 0.75 : 0.32;
            const len = deployLegs ? 0.92 : 0.5;
            return (
              <group key={i} position={[Math.sin(ang) * spread, yPos, Math.cos(ang) * spread]} rotation={[0, ang, 0]}>
                <mesh rotation={[tilt, 0, 0]}>
                  <cylinderGeometry args={[0.024, 0.018, len, 8]} />
                  <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.25} />
                </mesh>
                {deployLegs && (
                  <mesh position={[0, -0.35, 0.32]}>
                    <cylinderGeometry args={[0.09, 0.11, 0.04, 12]} />
                    <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
                  </mesh>
                )}
              </group>
            );
          })}
        </>
      )}
    </group>
  );
}

function UpperStageGeom({ partId, xray, checkerTex }) {
  const isMethalox = partId === 'methalox_deep_space';
  const isHydrolox = partId === 'liquid_hydrolox';
  const height = isMethalox ? 0.92 : isHydrolox ? 0.75 : 0.52;

  return (
    <group>
      <mesh castShadow>
        <cylinderGeometry args={[0.4, 0.42, height, 28]} />
        <HullMaterial color="#F8FAFC" xray={xray} />
      </mesh>
      {/* Classic NASA Checkered Roll-Pattern Band + Metallic Interstage Ring */}
      {!xray && (
        <>
          <mesh position={[0, height * 0.25, 0]}>
            <cylinderGeometry args={[0.412, 0.412, 0.16, 28]} />
            <meshStandardMaterial map={checkerTex} roughness={0.35} />
          </mesh>
          <mesh position={[0, -height * 0.42, 0]}>
            <cylinderGeometry args={[0.425, 0.43, 0.14, 28]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.75} roughness={0.22} />
          </mesh>
        </>
      )}
      {xray && (
        <>
          <mesh>
            <cylinderGeometry args={[0.405, 0.425, height, 16]} />
            <meshBasicMaterial color="#7DD3FC" wireframe transparent opacity={0.22} />
          </mesh>
          <mesh position={[0, height * 0.2, 0]}>
            <sphereGeometry args={[0.28, 14, 12]} />
            <meshStandardMaterial color="#38BDF8" emissive="#0EA5E9" emissiveIntensity={0.6} />
          </mesh>
          <mesh position={[0, -height * 0.16, 0]}>
            <sphereGeometry args={[0.26, 14, 12]} />
            <meshStandardMaterial color="#F59E0B" emissive="#D97706" emissiveIntensity={0.5} />
          </mesh>
        </>
      )}
      <mesh position={[0, -(height / 2 + 0.18), 0]}>
        <cylinderGeometry args={[0.11, 0.25, 0.34, 18]} />
        <HullMaterial color="#334155" xray={xray} metalness={0.88} roughness={0.2} />
      </mesh>
    </group>
  );
}

function PropellantTankGeom({ fuelMass, propellantType, xray, checkerTex }) {
  const scaleY = 0.55 + (fuelMass / 120000) * 1.05;
  const scaleXZ = 0.94 + (fuelMass / 120000) * 0.14;
  const fuelColor =
    propellantType === 'liquid_methane'
      ? '#10B981'
      : propellantType === 'rp1_kerosene'
      ? '#F59E0B'
      : '#94A3B8';

  return (
    <group scale={[scaleXZ, scaleY, scaleXZ]}>
      {/* Glossy White NASA Core Tank */}
      <mesh castShadow>
        <cylinderGeometry args={[0.46, 0.46, 2.0, 28]} />
        <HullMaterial color="#F8FAFC" xray={xray} />
      </mesh>
      {xray ? (
        <>
          <mesh>
            <cylinderGeometry args={[0.465, 0.465, 2.0, 16, 3]} />
            <meshBasicMaterial color="#7DD3FC" wireframe transparent opacity={0.24} />
          </mesh>
          <mesh position={[0, 0.48, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.78, 20]} />
            <meshStandardMaterial color="#38BDF8" emissive="#0EA5E9" emissiveIntensity={0.65} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, -0.42, 0]}>
            <cylinderGeometry args={[0.38, 0.38, 0.78, 20]} />
            <meshStandardMaterial color={fuelColor} emissive={fuelColor} emissiveIntensity={0.55} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.41, 0, 0]}>
            <cylinderGeometry args={[0.028, 0.028, 1.82, 8]} />
            <meshStandardMaterial color="#00F0FF" emissive="#00F0FF" emissiveIntensity={1.2} />
          </mesh>
          <mesh position={[0, -0.88, 0]}>
            <sphereGeometry args={[0.15, 12, 10]} />
            <meshStandardMaterial color="#FF6B1A" emissive="#FF6B1A" emissiveIntensity={1.0} />
          </mesh>
        </>
      ) : (
        <>
          {/* Classic Black-and-White Checkered Roll-Pattern Band */}
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.466, 0.466, 0.24, 28]} />
            <meshStandardMaterial map={checkerTex} roughness={0.35} />
          </mesh>
          {/* Metallic Silver Interstage & Dark Accent */}
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.468, 0.468, 0.28, 28]} />
            <meshStandardMaterial color="#64748B" metalness={0.55} roughness={0.3} />
          </mesh>
          <mesh position={[0, -0.68, 0]}>
            <cylinderGeometry args={[0.466, 0.466, 0.22, 28]} />
            <meshStandardMaterial color="#1E293B" roughness={0.45} />
          </mesh>
        </>
      )}
    </group>
  );
}

function StraponBoosterMesh({ angle, radius, xray }) {
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle) * radius;
  return (
    <group position={[x, 0.2, z]}>
      {/* White SRB Body */}
      <mesh castShadow>
        <cylinderGeometry args={[0.17, 0.17, 1.35, 16]} />
        <HullMaterial color="#F8FAFC" xray={xray} />
      </mesh>
      {/* Metallic Silver SRB Ring */}
      {!xray && (
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.175, 0.175, 0.1, 16]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.75} roughness={0.25} />
        </mesh>
      )}
      {/* Nosecone */}
      <mesh position={[0, 0.82, 0]}>
        <coneGeometry args={[0.17, 0.3, 16]} />
        <HullMaterial color="#F8FAFC" xray={xray} />
      </mesh>
      {/* Conical Nozzle Bell */}
      <mesh position={[0, -0.82, 0]}>
        <cylinderGeometry args={[0.09, 0.16, 0.28, 14]} />
        <HullMaterial color="#475569" xray={xray} metalness={0.85} roughness={0.22} />
      </mesh>
      {/* Orange/Yellow Attachment Struts */}
      {!xray && (
        <>
          <mesh position={[-x * 0.32, 0.42, -z * 0.32]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.32]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.4} />
          </mesh>
          <mesh position={[-x * 0.32, -0.35, -z * 0.32]} rotation={[0, -angle, 0]}>
            <boxGeometry args={[0.06, 0.06, 0.32]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.4} roughness={0.4} />
          </mesh>
        </>
      )}
    </group>
  );
}

function EngineNozzleMesh({ x, z, xray }) {
  return (
    <group position={[x, -0.94, z]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.09, 0.19, 0.4, 18]} />
        <HullMaterial color="#334155" xray={xray} metalness={0.9} roughness={0.18} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <torusGeometry args={[0.16, 0.02, 6, 20]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.2} />
      </mesh>
      {xray && (
        <mesh position={[0, 0.26, 0]}>
          <cylinderGeometry args={[0.09, 0.09, 0.26, 12]} />
          <meshStandardMaterial color="#FF6B1A" emissive="#FF6B1A" emissiveIntensity={1.2} />
        </mesh>
      )}
    </group>
  );
}

function MainBoosterGeom({ partId, xray, checkerTex }) {
  const strapon2 = ['heavy_core_2_strapon', 'heavy_core_4_strapon'].includes(partId);
  const strapon4 = partId === 'heavy_core_4_strapon';
  const isTri = partId === 'tri_engine_cluster';

  return (
    <group>
      {/* Glossy White Core Booster */}
      <mesh castShadow>
        <cylinderGeometry args={[0.46, 0.48, 1.55, 28]} />
        <HullMaterial color="#F8FAFC" xray={xray} />
      </mesh>
      {!xray && (
        <>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.466, 0.466, 0.2, 28]} />
            <meshStandardMaterial map={checkerTex} roughness={0.35} />
          </mesh>
          <mesh position={[0, -0.58, 0]}>
            <cylinderGeometry args={[0.475, 0.49, 0.34, 28]} />
            <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.35} />
          </mesh>
        </>
      )}
      {xray && (
        <mesh>
          <cylinderGeometry args={[0.465, 0.485, 1.55, 16]} />
          <meshBasicMaterial color="#7DD3FC" wireframe transparent opacity={0.22} />
        </mesh>
      )}
      {isTri || strapon2 ? (
        <>
          <EngineNozzleMesh x={0} z={-0.14} xray={xray} />
          <EngineNozzleMesh x={0.22} z={0.14} xray={xray} />
          <EngineNozzleMesh x={-0.22} z={0.14} xray={xray} />
        </>
      ) : (
        <EngineNozzleMesh x={0} z={0} xray={xray} />
      )}
      {strapon2 && (
        <>
          <StraponBoosterMesh angle={0} radius={0.74} xray={xray} />
          <StraponBoosterMesh angle={Math.PI} radius={0.74} xray={xray} />
        </>
      )}
      {strapon4 && (
        <>
          <StraponBoosterMesh angle={Math.PI / 2} radius={0.74} xray={xray} />
          <StraponBoosterMesh angle={(3 * Math.PI) / 2} radius={0.74} xray={xray} />
        </>
      )}
    </group>
  );
}

// ─── Holographic Highlight Ring ───────────────────────────────────────────────

function HighlightRing({ radius = 0.65, active }) {
  const meshRef = useRef();
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.z += delta * 1.4;
      meshRef.current.material.opacity = active ? 0.72 + Math.sin(state.clock.elapsedTime * 4) * 0.2 : 0;
    }
  });

  if (!active) return null;

  return (
    <mesh ref={meshRef} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.025, 6, 48]} />
      <meshStandardMaterial
        color="#FBBF24"
        emissive="#F59E0B"
        emissiveIntensity={1.8}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

// ─── Floating 3D Spatial Callout Label with Leader Line ───────────────────────

function SpatialSlotLabel({ order, label, installed, isActive, isNext, side = 'right', onSelect }) {
  const xPos = side === 'right' ? 1.15 : -1.15;
  const dotColor = installed ? '#10B981' : isNext ? '#F59E0B' : '#94A3B8';

  return (
    <Html position={[xPos, 0, 0]} center distanceFactor={8.5} zIndexRange={[10, 0]}>
      <div className={`pointer-events-auto flex items-center ${side === 'left' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className="h-[1.5px] w-6 shrink-0"
          style={{ backgroundColor: isActive ? '#FBBF24' : isNext ? '#F59E0B' : 'rgba(255,255,255,0.45)' }}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.();
          }}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded border px-2 py-0.5 text-[9px] font-bold tracking-wider transition-all ${
            isActive
              ? 'border-amber-400 bg-[#0F3E8A]/95 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.45)]'
              : isNext
              ? 'border-amber-400/80 bg-[#0F3E8A]/90 text-amber-200'
              : 'border-blue-300/40 bg-[#0B2D66]/85 text-white hover:border-amber-300'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${isNext && !installed ? 'animate-ping' : ''}`}
            style={{ backgroundColor: dotColor }}
          />
          <span className="telemetry-num text-[8px] opacity-75">0{order}</span>
          <span>{label}</span>
        </button>
      </div>
    </Html>
  );
}

// ─── Main ModularRocket3D Component ──────────────────────────────────────────

export default function ModularRocket3D({
  rocketConfig,
  activeSlot,
  nextEmptySlot,
  xrayMode,
  lastInstalledSlot,
  lastInstalledAt,
  onSelectSlot,
  showSpatialLabels = true,
  stageFilter = 'all', // 'all' | 'upper_only' | 'booster_only'
  deployLegs = false,
  deployChute = false,
  heatGlow = false,
}) {
  const checkerTex = useCheckerTexture();
  const {
    nosecone,
    avionicsPayload,
    edlSystem,
    upperStage,
    propellantTank,
    mainBooster,
  } = rocketConfig;

  const fuelMass = propellantTank?.fuelMassKg ?? 45000;
  const propellantType = propellantTank?.propellantType ?? 'rp1_kerosene';
  const fuelScale = 0.55 + (fuelMass / 120000) * 1.05;

  const boosterH = 1.55;
  const tankH = propellantTank ? 2.0 * fuelScale : 1.45;
  const upperH = upperStage?.id === 'methalox_deep_space' ? 0.92 : upperStage?.id === 'liquid_hydrolox' ? 0.75 : 0.52;
  const edlH = 0.55;
  const avioH =
    avionicsPayload?.id === 'crew_capsule'
      ? 0.95
      : avionicsPayload?.id === 'mars_rover'
      ? 0.88
      : avionicsPayload?.id === 'lunar_lander'
      ? 0.8
      : 0.68;
  const noseH = 1.15;

  const GAP = 0.04;
  const boosterY = boosterH / 2 + 0.95;
  const tankY = boosterY + boosterH / 2 + GAP + tankH / 2;
  const upperY = tankY + tankH / 2 + GAP + upperH / 2;
  const edlY = upperY + upperH / 2 + GAP + edlH / 2;
  const avioY = edlY + edlH / 2 + GAP + avioH / 2;
  const noseY = avioY + avioH / 2 + GAP;

  const isFresh = (slotKey) =>
    lastInstalledSlot === slotKey && lastInstalledAt && Date.now() - lastInstalledAt < 1400;

  const showLower = stageFilter === 'all' || stageFilter === 'booster_only';
  const showUpper = stageFilter === 'all' || stageFilter === 'upper_only';

  return (
    <group position={[0, -0.2, 0]}>
      {/* SLOT 1: Main Booster */}
      {showLower && (
        <group position={[0, boosterY, 0]} onClick={(e) => { e.stopPropagation(); onSelectSlot?.('mainBooster'); }}>
          {mainBooster ? (
            <AnimatedSlotDrop key={`mainBooster-${mainBooster.id}-${lastInstalledAt || 0}`} isJustInstalled={isFresh('mainBooster')}>
              <MainBoosterGeom partId={mainBooster.id} xray={xrayMode} checkerTex={checkerTex} />
            </AnimatedSlotDrop>
          ) : (
            <GhostSlotBlueprint type="cylinder" height={boosterH} radius={0.46} isNext={nextEmptySlot === 'mainBooster'} isActive={activeSlot === 'mainBooster'} />
          )}
          <HighlightRing radius={0.75} active={activeSlot === 'mainBooster'} />
          {showSpatialLabels && (
            <SpatialSlotLabel order={1} label={mainBooster ? mainBooster.shortLabel : 'MAIN BOOSTER'} installed={Boolean(mainBooster)} isActive={activeSlot === 'mainBooster'} isNext={nextEmptySlot === 'mainBooster'} side="right" onSelect={() => onSelectSlot?.('mainBooster')} />
          )}
        </group>
      )}

      {/* SLOT 2: Core Propellant Tank */}
      {showLower && (
        <group position={[0, tankY, 0]} onClick={(e) => { e.stopPropagation(); onSelectSlot?.('propellantTank'); }}>
          {propellantTank ? (
            <AnimatedSlotDrop key={`propellantTank-${lastInstalledSlot === 'propellantTank' ? lastInstalledAt : 'static'}`} isJustInstalled={isFresh('propellantTank')}>
              <PropellantTankGeom fuelMass={fuelMass} propellantType={propellantType} xray={xrayMode} checkerTex={checkerTex} />
            </AnimatedSlotDrop>
          ) : (
            <GhostSlotBlueprint type="cylinder" height={tankH} radius={0.46} isNext={nextEmptySlot === 'propellantTank'} isActive={activeSlot === 'propellantTank'} />
          )}
          <HighlightRing radius={0.62} active={activeSlot === 'propellantTank'} />
          {showSpatialLabels && (
            <SpatialSlotLabel order={2} label={propellantTank ? `${(fuelMass / 1000).toFixed(0)}t FUEL TANK` : 'FUEL TANK'} installed={Boolean(propellantTank)} isActive={activeSlot === 'propellantTank'} isNext={nextEmptySlot === 'propellantTank'} side="left" onSelect={() => onSelectSlot?.('propellantTank')} />
          )}
        </group>
      )}

      {/* SLOT 3: Upper Vacuum Stage */}
      {showUpper && (
        <group position={[0, upperY, 0]} onClick={(e) => { e.stopPropagation(); onSelectSlot?.('upperStage'); }}>
          {upperStage ? (
            <AnimatedSlotDrop key={`upperStage-${upperStage.id}-${lastInstalledAt || 0}`} isJustInstalled={isFresh('upperStage')}>
              <UpperStageGeom partId={upperStage.id} xray={xrayMode} checkerTex={checkerTex} />
            </AnimatedSlotDrop>
          ) : (
            <GhostSlotBlueprint type="cylinder" height={upperH} radius={0.4} isNext={nextEmptySlot === 'upperStage'} isActive={activeSlot === 'upperStage'} />
          )}
          <HighlightRing radius={0.54} active={activeSlot === 'upperStage'} />
          {showSpatialLabels && (
            <SpatialSlotLabel order={3} label={upperStage ? upperStage.shortLabel : 'UPPER STAGE'} installed={Boolean(upperStage)} isActive={activeSlot === 'upperStage'} isNext={nextEmptySlot === 'upperStage'} side="right" onSelect={() => onSelectSlot?.('upperStage')} />
          )}
        </group>
      )}

      {/* SLOT 4: EDL Landing System */}
      {showUpper && (
        <group position={[0, edlY, 0]} onClick={(e) => { e.stopPropagation(); onSelectSlot?.('edlSystem'); }}>
          {edlSystem ? (
            <AnimatedSlotDrop key={`edlSystem-${edlSystem.id}-${lastInstalledAt || 0}`} isJustInstalled={isFresh('edlSystem')}>
              <EdlSystemGeom partId={edlSystem.id} xray={xrayMode} deployLegs={deployLegs} deployChute={deployChute} heatGlow={heatGlow} />
            </AnimatedSlotDrop>
          ) : (
            <GhostSlotBlueprint type="cylinder" height={edlH} radius={0.42} isNext={nextEmptySlot === 'edlSystem'} isActive={activeSlot === 'edlSystem'} />
          )}
          <HighlightRing radius={0.56} active={activeSlot === 'edlSystem'} />
          {showSpatialLabels && (
            <SpatialSlotLabel order={4} label={edlSystem ? edlSystem.shortLabel : 'EDL SYSTEM'} installed={Boolean(edlSystem)} isActive={activeSlot === 'edlSystem'} isNext={nextEmptySlot === 'edlSystem'} side="left" onSelect={() => onSelectSlot?.('edlSystem')} />
          )}
        </group>
      )}

      {/* SLOT 5: Avionics & Payload */}
      {showUpper && (
        <group position={[0, avioY, 0]} onClick={(e) => { e.stopPropagation(); onSelectSlot?.('avionicsPayload'); }}>
          {avionicsPayload ? (
            <AnimatedSlotDrop key={`avionicsPayload-${avionicsPayload.id}-${lastInstalledAt || 0}`} isJustInstalled={isFresh('avionicsPayload')}>
              <AvionicsBayGeom partId={avionicsPayload.id} xray={xrayMode} />
            </AnimatedSlotDrop>
          ) : (
            <GhostSlotBlueprint type="cylinder" height={avioH} radius={0.4} isNext={nextEmptySlot === 'avionicsPayload'} isActive={activeSlot === 'avionicsPayload'} />
          )}
          <HighlightRing radius={0.54} active={activeSlot === 'avionicsPayload'} />
          {showSpatialLabels && (
            <SpatialSlotLabel order={5} label={avionicsPayload ? avionicsPayload.shortLabel : 'PAYLOAD BAY'} installed={Boolean(avionicsPayload)} isActive={activeSlot === 'avionicsPayload'} isNext={nextEmptySlot === 'avionicsPayload'} side="right" onSelect={() => onSelectSlot?.('avionicsPayload')} />
          )}
        </group>
      )}

      {/* SLOT 6: Nosecone Fairing */}
      {showUpper && (
        <group position={[0, noseY, 0]} onClick={(e) => { e.stopPropagation(); onSelectSlot?.('nosecone'); }}>
          {nosecone ? (
            <AnimatedSlotDrop key={`nosecone-${nosecone.id}-${lastInstalledAt || 0}`} isJustInstalled={isFresh('nosecone')}>
              <NoseconeGeom partId={nosecone.id} xray={xrayMode} />
            </AnimatedSlotDrop>
          ) : (
            <GhostSlotBlueprint type="cone" height={noseH} radius={0.4} isNext={nextEmptySlot === 'nosecone'} isActive={activeSlot === 'nosecone'} />
          )}
          <HighlightRing radius={0.52} active={activeSlot === 'nosecone'} />
          {showSpatialLabels && (
            <SpatialSlotLabel order={6} label={nosecone ? nosecone.shortLabel : 'NOSECONE'} installed={Boolean(nosecone)} isActive={activeSlot === 'nosecone'} isNext={nextEmptySlot === 'nosecone'} side="left" onSelect={() => onSelectSlot?.('nosecone')} />
          )}
        </group>
      )}
    </group>
  );
}

export function computeSlotWorldPositions(rocketConfig) {
  const fuelMass = rocketConfig?.propellantTank?.fuelMassKg ?? 45000;
  const fuelScale = 0.55 + (fuelMass / 120000) * 1.05;
  const boosterH = 1.55;
  const tankH = rocketConfig?.propellantTank ? 2.0 * fuelScale : 1.45;
  const upperH =
    rocketConfig?.upperStage?.id === 'methalox_deep_space'
      ? 0.92
      : rocketConfig?.upperStage?.id === 'liquid_hydrolox'
      ? 0.75
      : 0.52;
  const edlH = 0.55;
  const avioH =
    rocketConfig?.avionicsPayload?.id === 'crew_capsule'
      ? 0.95
      : rocketConfig?.avionicsPayload?.id === 'mars_rover'
      ? 0.88
      : rocketConfig?.avionicsPayload?.id === 'lunar_lander'
      ? 0.8
      : 0.68;

  const GAP = 0.04;
  const baseOffset = -0.2;
  const boosterY = boosterH / 2 + 0.95;
  const tankY = boosterY + boosterH / 2 + GAP + tankH / 2;
  const upperY = tankY + tankH / 2 + GAP + upperH / 2;
  const edlY = upperY + upperH / 2 + GAP + edlH / 2;
  const avioY = edlY + edlH / 2 + GAP + avioH / 2;
  const noseY = avioY + avioH / 2 + GAP + 0.45;

  return {
    mainBooster: baseOffset + boosterY,
    propellantTank: baseOffset + tankY,
    upperStage: baseOffset + upperY,
    edlSystem: baseOffset + edlY,
    avionicsPayload: baseOffset + avioY,
    nosecone: baseOffset + noseY,
  };
}
