import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const SOLAR_SYSTEM_ORIGIN = [0, 88, -28];

export const PLANET_WORLD_POSITIONS = {
  earth: [-11.5, 88, -26],
  moon: [0, 91.5, -36],
  mars: [12, 87, -25],
};

export const SOLAR_CAMERA_TARGETS = {
  overview: {
    camera: [0, 94, 4],
    lookAt: [0, 88.5, -28],
  },
  earth: {
    camera: [-10.2, 89.2, -16.8],
    lookAt: [-11.3, 88, -26],
  },
  moon: {
    camera: [0.6, 92.4, -29.2],
    lookAt: [0.1, 91.5, -36],
  },
  mars: {
    camera: [12.8, 88.1, -16.2],
    lookAt: [12.1, 87, -25],
  },
};

export function resolvePlanetKey(mission) {
  const id = (mission?.id || '').toLowerCase();
  const body = (mission?.targetBody || '').toLowerCase();
  if (id.includes('lunar') || body.includes('moon')) return 'moon';
  if (id.includes('mars') || body.includes('mars')) return 'mars';
  return 'earth';
}

function createProceduralTexture(kind) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Seeded pseudo-random for deterministic planetary terrain
  let seed = kind === 'earth' ? 101 : kind === 'moon' ? 202 : 303;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  if (kind === 'earth') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#dbeafe');
    grad.addColorStop(0.1, '#0c4a6e');
    grad.addColorStop(0.5, '#0369a1');
    grad.addColorStop(0.9, '#0c4a6e');
    grad.addColorStop(1, '#dbeafe');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Continents
    for (let i = 0; i < 42; i += 1) {
      const cx = rand() * 512;
      const cy = 36 + rand() * 184;
      const rx = 14 + rand() * 44;
      const ry = 10 + rand() * 28;
      ctx.fillStyle = rand() > 0.35 ? '#15803d' : '#a16207';
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    // Polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 18);
    ctx.fillRect(0, 238, 512, 18);
  } else if (kind === 'earthClouds') {
    ctx.clearRect(0, 0, 512, 256);
    for (let i = 0; i < 75; i += 1) {
      const cx = rand() * 512;
      const cy = 18 + rand() * 220;
      const rx = 16 + rand() * 52;
      const ry = 5 + rand() * 14;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.18 + rand() * 0.32})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, (rand() - 0.5) * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'moon') {
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 512, 256);
    // Dark lunar maria
    for (let i = 0; i < 16; i += 1) {
      ctx.fillStyle = 'rgba(51, 65, 85, 0.48)';
      ctx.beginPath();
      ctx.ellipse(rand() * 512, 30 + rand() * 196, 20 + rand() * 48, 16 + rand() * 32, rand() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Craters with highlights & dark centers
    for (let i = 0; i < 95; i += 1) {
      const x = rand() * 512;
      const y = 12 + rand() * 232;
      const r = 3 + rand() * 14;
      ctx.fillStyle = 'rgba(30, 41, 59, 0.55)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
  } else if (kind === 'mars') {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#f1f5f9');
    grad.addColorStop(0.08, '#b45309');
    grad.addColorStop(0.5, '#c2410c');
    grad.addColorStop(0.92, '#9a3412');
    grad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);

    // Dark basalt plains (Syrtis Major style)
    for (let i = 0; i < 22; i += 1) {
      ctx.fillStyle = 'rgba(69, 26, 3, 0.42)';
      ctx.beginPath();
      ctx.ellipse(rand() * 512, 34 + rand() * 188, 18 + rand() * 55, 12 + rand() * 28, rand() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // Valles Marineris canyon scar
    ctx.strokeStyle = 'rgba(67, 20, 7, 0.72)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(150, 128);
    ctx.bezierCurveTo(210, 118, 280, 140, 355, 126);
    ctx.stroke();

    // Craters
    for (let i = 0; i < 55; i += 1) {
      const x = rand() * 512;
      const y = 24 + rand() * 208;
      const r = 2.5 + rand() * 10;
      ctx.fillStyle = 'rgba(124, 45, 18, 0.48)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.45)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 16);
    ctx.fillRect(0, 240, 512, 16);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createFresnelMaterial(glowColor, power = 3.2, intensity = 1.15) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(glowColor) },
      uPower: { value: power },
      uIntensity: { value: intensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vViewPosition = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uPower;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);
        float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), uPower);
        gl_FragColor = vec4(uColor, fresnel * uIntensity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
  });
}

function OrbitingProbe({ radius, speed, color = '#00f0ff', tilt = [0.25, 0, 0.1] }) {
  const orbitRef = useRef();

  useFrame(({ clock }) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y = clock.getElapsedTime() * speed;
    }
  });

  return (
    <group rotation={tilt}>
      <group ref={orbitRef}>
        <group position={[radius, 0, 0]}>
          {/* Gold foil satellite bus */}
          <mesh>
            <boxGeometry args={[0.2, 0.18, 0.2]} />
            <meshStandardMaterial color="#f59e0b" metalness={0.8} roughness={0.25} />
          </mesh>
          {/* Solar wings */}
          <mesh position={[0, 0, 0.34]}>
            <boxGeometry args={[0.14, 0.02, 0.42]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#1d4ed8" emissiveIntensity={0.4} />
          </mesh>
          <mesh position={[0, 0, -0.34]}>
            <boxGeometry args={[0.14, 0.02, 0.42]} />
            <meshStandardMaterial color="#1d4ed8" emissive="#1d4ed8" emissiveIntensity={0.4} />
          </mesh>
          {/* Telemetry beacon */}
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color={color} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function LandingTargetReticle({ radius, color = '#00f0ff' }) {
  const groupRef = useRef();
  const reticleRef = useRef();

  useFrame(({ clock }) => {
    if (reticleRef.current) {
      const t = clock.getElapsedTime();
      reticleRef.current.rotation.z = t * 1.1;
      const s = 1 + Math.sin(t * 4) * 0.08;
      reticleRef.current.scale.set(s, s, 1);
    }
  });

  // Positioned on front-upper hemisphere facing camera & oriented along surface normal
  const { pos, normalTarget } = useMemo(() => {
    const dir = new THREE.Vector3(0.18, 0.28, 0.94).normalize();
    return {
      pos: dir.clone().multiplyScalar(radius + 0.08),
      normalTarget: dir.clone().multiplyScalar(radius + 5),
    };
  }, [radius]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.lookAt(normalTarget);
    }
  }, [normalTarget]);

  return (
    <group ref={groupRef} position={pos}>
      <group ref={reticleRef}>
        <mesh>
          <ringGeometry args={[0.24, 0.3, 24]} />
          <meshBasicMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
        <mesh>
          <ringGeometry args={[0.42, 0.45, 24]} />
          <meshBasicMaterial color="#ff6b1a" side={THREE.DoubleSide} transparent opacity={0.85} />
        </mesh>
      </group>
      {/* Pulsing Surface Pin */}
      <mesh position={[0, 0, 0.32]} rotation={[Math.PI * 0.5, 0, 0]}>
        <cylinderGeometry args={[0.015, 0.05, 0.65, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

export default function SolarSystemScene({ activePlanetKey, onSelectPlanet }) {
  const earthRef = useRef();
  const earthCloudsRef = useRef();
  const moonRef = useRef();
  const marsRef = useRef();

  const textures = useMemo(() => {
    return {
      earth: createProceduralTexture('earth'),
      earthClouds: createProceduralTexture('earthClouds'),
      moon: createProceduralTexture('moon'),
      mars: createProceduralTexture('mars'),
    };
  }, []);

  const shaders = useMemo(() => {
    return {
      earth: createFresnelMaterial('#38bdf8', 2.8, 1.35),
      moon: createFresnelMaterial('#cbd5e1', 3.8, 0.55),
      mars: createFresnelMaterial('#ff6b1a', 2.9, 1.15),
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(textures).forEach((t) => t.dispose());
      Object.values(shaders).forEach((s) => s.dispose());
    };
  }, [textures, shaders]);

  useFrame((_, delta) => {
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.14;
    if (earthCloudsRef.current) earthCloudsRef.current.rotation.y += delta * 0.2;
    if (moonRef.current) moonRef.current.rotation.y += delta * 0.08;
    if (marsRef.current) marsRef.current.rotation.y += delta * 0.12;
  });

  return (
    <group>
      {/* Solar Key Light + Rim Fill */}
      <ambientLight intensity={0.22} color="#cbd5e1" />
      <directionalLight position={[-25, 110, 15]} intensity={2.85} color="#fff7ed" />
      <pointLight position={[0, 96, -12]} intensity={35} distance={75} color="#bae6fd" />

      {/* EARTH (LEO) */}
      <group
        position={PLANET_WORLD_POSITIONS.earth}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPlanet?.('earth');
        }}
      >
        <mesh ref={earthRef}>
          <sphereGeometry args={[3.2, 48, 36]} />
          <meshStandardMaterial map={textures.earth} roughness={0.65} metalness={0.08} />
        </mesh>
        {/* Rotating Cloud Layer */}
        <mesh ref={earthCloudsRef}>
          <sphereGeometry args={[3.27, 40, 32]} />
          <meshStandardMaterial
            map={textures.earthClouds}
            transparent
            opacity={0.78}
            depthWrite={false}
          />
        </mesh>
        {/* Atmospheric Fresnel Glow */}
        <mesh material={shaders.earth}>
          <sphereGeometry args={[3.38, 40, 32]} />
        </mesh>
        {/* LEO Orbital Ring */}
        <mesh rotation={[Math.PI * 0.42, 0.25, 0]}>
          <torusGeometry args={[4.45, 0.025, 8, 64]} />
          <meshBasicMaterial
            color={activePlanetKey === 'earth' ? '#00f0ff' : '#38bdf8'}
            transparent
            opacity={activePlanetKey === 'earth' ? 0.85 : 0.35}
          />
        </mesh>
        <OrbitingProbe radius={4.45} speed={0.55} color="#00f0ff" tilt={[0.25, 0.2, 0]} />
        {activePlanetKey === 'earth' && <LandingTargetReticle radius={3.2} color="#00f0ff" />}
      </group>

      {/* THE MOON (SHACKLETON CRATER) */}
      <group
        position={PLANET_WORLD_POSITIONS.moon}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPlanet?.('moon');
        }}
      >
        <mesh ref={moonRef}>
          <sphereGeometry args={[2.0, 42, 32]} />
          <meshStandardMaterial
            map={textures.moon}
            bumpMap={textures.moon}
            bumpScale={0.08}
            roughness={0.92}
          />
        </mesh>
        <mesh material={shaders.moon}>
          <sphereGeometry args={[2.08, 32, 24]} />
        </mesh>
        <mesh rotation={[Math.PI * 0.54, -0.3, 0]}>
          <torusGeometry args={[3.05, 0.02, 8, 56]} />
          <meshBasicMaterial
            color={activePlanetKey === 'moon' ? '#00f0ff' : '#94a3b8'}
            transparent
            opacity={activePlanetKey === 'moon' ? 0.85 : 0.35}
          />
        </mesh>
        <OrbitingProbe radius={3.05} speed={0.7} color="#f59e0b" tilt={[-0.2, 0.3, 0.15]} />
        {activePlanetKey === 'moon' && <LandingTargetReticle radius={2.0} color="#f59e0b" />}
      </group>

      {/* MARS (JEZERO CRATER) */}
      <group
        position={PLANET_WORLD_POSITIONS.mars}
        onClick={(e) => {
          e.stopPropagation();
          onSelectPlanet?.('mars');
        }}
      >
        <mesh ref={marsRef}>
          <sphereGeometry args={[2.9, 48, 36]} />
          <meshStandardMaterial
            map={textures.mars}
            bumpMap={textures.mars}
            bumpScale={0.07}
            roughness={0.82}
          />
        </mesh>
        <mesh material={shaders.mars}>
          <sphereGeometry args={[3.05, 40, 32]} />
        </mesh>
        <mesh rotation={[Math.PI * 0.45, -0.22, 0]}>
          <torusGeometry args={[4.15, 0.025, 8, 64]} />
          <meshBasicMaterial
            color={activePlanetKey === 'mars' ? '#ff6b1a' : '#fb923c'}
            transparent
            opacity={activePlanetKey === 'mars' ? 0.9 : 0.35}
          />
        </mesh>
        <OrbitingProbe radius={4.15} speed={0.48} color="#ff6b1a" tilt={[0.2, -0.2, 0.1]} />
        {activePlanetKey === 'mars' && <LandingTargetReticle radius={2.9} color="#ff6b1a" />}
      </group>
    </group>
  );
}
