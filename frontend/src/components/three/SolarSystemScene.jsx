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
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  // Pseudo-random deterministic generator for repeatable terrain mapping
  let seed = kind === 'earth' ? 1013904223 : kind === 'earthClouds' ? 84029481 : kind === 'moon' ? 20240915 : 30311247;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  if (kind === 'earth') {
    // 1. Deep Ocean Bathymetric Gradients (NASA Blue Marble Palette)
    const oceanGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    oceanGrad.addColorStop(0, '#020b1e');   // Arctic deep trench
    oceanGrad.addColorStop(0.12, '#052249');
    oceanGrad.addColorStop(0.35, '#0b3d68');
    oceanGrad.addColorStop(0.5, '#0d4a7a');  // Equatorial ocean
    oceanGrad.addColorStop(0.72, '#082d56');
    oceanGrad.addColorStop(0.9, '#031733');
    oceanGrad.addColorStop(1, '#020b1e');   // Antarctic abyssal
    ctx.fillStyle = oceanGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Oceanic Ridges & Mid-Atlantic Trench
    ctx.strokeStyle = 'rgba(10, 48, 88, 0.45)';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(850, 120);
    ctx.bezierCurveTo(920, 340, 810, 680, 890, 880);
    ctx.stroke();

    // 2. Continental Shelf Coastal Shallow Waters (Turquoise fringing)
    const shelves = [
      { x: 380, y: 310, rx: 270, ry: 170 }, // N. America shelf
      { x: 580, y: 640, rx: 170, ry: 240 }, // S. America shelf
      { x: 1040, y: 260, rx: 340, ry: 190 }, // Europe shelf
      { x: 1060, y: 560, rx: 230, ry: 250 }, // Africa shelf
      { x: 1480, y: 340, rx: 380, ry: 220 }, // Asia shelf
      { x: 1680, y: 720, rx: 190, ry: 150 }, // Australia shelf
    ];
    shelves.forEach((s) => {
      const grad = ctx.createRadialGradient(s.x, s.y, 40, s.x, s.y, Math.max(s.rx, s.ry));
      grad.addColorStop(0, 'rgba(17, 138, 153, 0.65)');
      grad.addColorStop(0.75, 'rgba(13, 94, 120, 0.35)');
      grad.addColorStop(1, 'rgba(13, 74, 122, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.rx + 35, s.ry + 35, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Real Continents (True NASA Equirectangular Landmass Polygons)
    const drawLandmass = (pathFn, baseColor, detailColor) => {
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      pathFn(ctx);
      ctx.fill();

      // Organic fractal coastline roughness
      for (let i = 0; i < 48; i += 1) {
        const cx = 50 + rand() * 1948;
        const cy = 120 + rand() * 780;
        if (ctx.isPointInPath(cx, cy)) {
          ctx.fillStyle = detailColor;
          ctx.beginPath();
          ctx.ellipse(cx, cy, 14 + rand() * 45, 10 + rand() * 32, rand() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // NORTH AMERICA & GREENLAND
    drawLandmass(
      (c) => {
        c.moveTo(180, 160); // Alaska
        c.bezierCurveTo(240, 130, 380, 150, 480, 180); // Canada
        c.bezierCurveTo(540, 240, 500, 380, 440, 420); // East Coast & Florida
        c.bezierCurveTo(340, 470, 270, 430, 250, 350); // Gulf & Mexico
        c.bezierCurveTo(220, 310, 170, 220, 180, 160); // West Coast
        c.closePath();
      },
      '#1b431e',
      '#2d5e2e'
    );
    // Greenland Ice Sheet
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(680, 160, 85, 60, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // SOUTH AMERICA
    drawLandmass(
      (c) => {
        c.moveTo(500, 440); // Panama/Colombia
        c.bezierCurveTo(620, 460, 680, 540, 640, 650); // Brazil horn
        c.bezierCurveTo(600, 750, 550, 840, 520, 880); // Patagonia tip
        c.bezierCurveTo(480, 840, 470, 680, 480, 540); // Andes coast
        c.closePath();
      },
      '#143d1a', // Amazon Basin deep jungle
      '#235c24'
    );

    // AFRICA
    drawLandmass(
      (c) => {
        c.moveTo(940, 360); // Gibraltar / Morocco
        c.bezierCurveTo(1120, 350, 1180, 420, 1220, 470); // Egypt / Horn
        c.bezierCurveTo(1190, 620, 1140, 780, 1080, 840); // Cape of Good Hope
        c.bezierCurveTo(1000, 810, 960, 680, 940, 550); // Gulf of Guinea
        c.bezierCurveTo(900, 470, 910, 400, 940, 360);
        c.closePath();
      },
      '#214a1e',
      '#356128'
    );
    // Sahara Desert & Sahel golden expanse
    const desertGrad = ctx.createLinearGradient(920, 360, 1200, 490);
    desertGrad.addColorStop(0, '#be8e46');
    desertGrad.addColorStop(0.5, '#d6a858');
    desertGrad.addColorStop(1, '#9a7b32');
    ctx.fillStyle = desertGrad;
    ctx.beginPath();
    ctx.ellipse(1060, 415, 140, 65, -0.05, 0, Math.PI * 2);
    ctx.fill();

    // EURASIA (Europe, Middle East, India, China, Siberia)
    drawLandmass(
      (c) => {
        c.moveTo(960, 240); // Western Europe
        c.bezierCurveTo(1080, 180, 1340, 150, 1680, 180); // Russian Siberia
        c.bezierCurveTo(1780, 260, 1720, 440, 1640, 480); // China / East Sea
        c.bezierCurveTo(1520, 500, 1440, 450, 1380, 480); // Southeast Asia
        c.bezierCurveTo(1340, 560, 1280, 540, 1260, 440); // Indian Subcontinent
        c.bezierCurveTo(1180, 430, 1140, 370, 1060, 340); // Middle East
        c.bezierCurveTo(1010, 310, 960, 290, 960, 240);
        c.closePath();
      },
      '#1e471f',
      '#2e6128'
    );
    // Indian Subcontinent distinct triangle
    ctx.fillStyle = '#265422';
    ctx.beginPath();
    ctx.moveTo(1270, 400);
    ctx.lineTo(1330, 430);
    ctx.lineTo(1295, 545);
    ctx.closePath();
    ctx.fill();

    // Gobi & Arabian Deserts
    ctx.fillStyle = '#caa153';
    ctx.beginPath();
    ctx.ellipse(1165, 395, 50, 35, 0.2, 0, Math.PI * 2); // Arabian peninsula
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1490, 350, 105, 45, 0.1, 0, Math.PI * 2); // Gobi desert
    ctx.fill();

    // Himalayan Snow Spine (Highest peaks visible from orbit)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(1300, 385);
    ctx.bezierCurveTo(1380, 375, 1460, 395, 1520, 380);
    ctx.stroke();

    // AUSTRALIA & NEW ZEALAND
    ctx.fillStyle = '#b85a2b'; // Famous red Australian Outback
    ctx.beginPath();
    ctx.ellipse(1680, 710, 130, 85, -0.05, 0, Math.PI * 2);
    ctx.fill();
    // Coastal green fringe
    ctx.strokeStyle = '#275225';
    ctx.lineWidth = 14;
    ctx.stroke();

    // 4. Polar Ice Caps & Sea Ice (Glacially fractured borders)
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 2048, 48); // North Pole
    ctx.fillRect(0, 960, 2048, 64); // Antarctica
    for (let i = 0; i < 40; i += 1) {
      const x = i * 52;
      ctx.beginPath();
      ctx.arc(x, 48 + Math.sin(i * 0.8) * 16, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, 960 - Math.cos(i * 0.7) * 22, 28, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'earthClouds') {
    // NASA Realistic Cloud Formations: Cyclones, Intertropical Convergence Zone & Wispy Cirrus
    ctx.clearRect(0, 0, 2048, 1024);

    // ITCZ Equatorial Cloud Band
    for (let i = 0; i < 180; i += 1) {
      const cx = (i * 12) % 2048;
      const cy = 480 + Math.sin(i * 0.08) * 45 + (rand() - 0.5) * 35;
      const rx = 35 + rand() * 75;
      const ry = 8 + rand() * 22;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.12 + rand() * 0.28})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, (rand() - 0.5) * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Two Great Cyclonic Storm Spirals (Hurricanes / Typhoons with Eye)
    const drawCyclone = (cx, cy, scale) => {
      for (let arm = 0; arm < 3; arm += 1) {
        const baseAngle = (arm * Math.PI * 2) / 3;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.42)';
        ctx.lineWidth = 18 * scale;
        ctx.beginPath();
        for (let t = 0; t < 18; t += 1) {
          const r = (10 + t * 9) * scale;
          const theta = baseAngle + t * 0.42;
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;
          if (t === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      // Cyclone central dense overcast
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.beginPath();
      ctx.arc(cx, cy, 26 * scale, 0, Math.PI * 2);
      ctx.fill();
      // Eye of the storm
      ctx.clearRect(cx - 5 * scale, cy - 5 * scale, 10 * scale, 10 * scale);
    };

    drawCyclone(480, 310, 1.4); // Atlantic hurricane
    drawCyclone(1540, 360, 1.6); // Pacific typhoon

    // Mid-Latitude Jetstream Wave Clouds
    for (let i = 0; i < 240; i += 1) {
      const cx = rand() * 2048;
      const isNorth = rand() > 0.45;
      const cy = isNorth ? 180 + rand() * 240 : 620 + rand() * 240;
      const rx = 40 + rand() * 110;
      const ry = 10 + rand() * 32;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.14 + rand() * 0.34})`;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, (rand() - 0.5) * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'moon') {
    // NASA SVS CGI Moon Kit: Lunar Regolith, Dark Basalt Maria & Radial Crater Rays
    ctx.fillStyle = '#a3aebc'; // Bright anorthositic highlands
    ctx.fillRect(0, 0, 2048, 1024);

    // Micro-texture noise of pulverized lunar regolith
    for (let i = 0; i < 600; i += 1) {
      const x = rand() * 2048;
      const y = rand() * 1024;
      ctx.fillStyle = rand() > 0.5 ? 'rgba(241, 245, 249, 0.22)' : 'rgba(51, 65, 85, 0.25)';
      ctx.fillRect(x, y, 4 + rand() * 8, 4 + rand() * 8);
    }

    // Great Lunar Maria (Dark volcanic basalt plains)
    const maria = [
      { name: 'Oceanus Procellarum', x: 620, y: 440, rx: 240, ry: 210 },
      { name: 'Mare Imbrium', x: 820, y: 310, rx: 170, ry: 130 },
      { name: 'Mare Serenitatis', x: 1040, y: 340, rx: 120, ry: 100 },
      { name: 'Mare Tranquillitatis', x: 1160, y: 450, rx: 140, ry: 110 },
      { name: 'Mare Crisium', x: 1380, y: 380, rx: 95, ry: 75 },
      { name: 'Mare Nubium', x: 800, y: 640, rx: 110, ry: 90 },
      { name: 'Mare Fecunditatis', x: 1320, y: 550, rx: 130, ry: 95 },
    ];
    maria.forEach((m) => {
      const grad = ctx.createRadialGradient(m.x, m.y, 20, m.x, m.y, Math.max(m.rx, m.ry));
      grad.addColorStop(0, '#2d3748');
      grad.addColorStop(0.7, '#3b4758');
      grad.addColorStop(1, '#5a687a');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, m.rx, m.ry, rand() * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Tycho Crater with Majestic Radiating Ejecta Rays (Spanning Southern Hemisphere)
    const tychoX = 860;
    const tychoY = 780;
    for (let r = 0; r < 44; r += 1) {
      const angle = (r * Math.PI * 2) / 44 + (rand() - 0.5) * 0.1;
      const len = 220 + rand() * 560;
      ctx.strokeStyle = `rgba(248, 250, 252, ${0.28 + rand() * 0.35})`;
      ctx.lineWidth = 1.8 + rand() * 2.5;
      ctx.beginPath();
      ctx.moveTo(tychoX, tychoY);
      ctx.lineTo(tychoX + Math.cos(angle) * len, tychoY + Math.sin(angle) * len);
      ctx.stroke();
    }

    // Impact Craters with Deep Shadowed Floors & Raised Bright Sunward Rims
    for (let i = 0; i < 280; i += 1) {
      const cx = rand() * 2048;
      const cy = 20 + rand() * 984;
      const rad = 3 + rand() * 28;

      // Dark sunken crater interior
      ctx.fillStyle = 'rgba(26, 32, 44, 0.72)';
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();

      // Sunlit eastern raised rim
      ctx.strokeStyle = 'rgba(248, 250, 252, 0.68)';
      ctx.lineWidth = Math.max(1.2, rad * 0.18);
      ctx.beginPath();
      ctx.arc(cx, cy, rad, -Math.PI * 0.4, Math.PI * 0.6);
      ctx.stroke();

      // Central peak for larger craters
      if (rad > 14) {
        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(cx, cy, rad * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (kind === 'mars') {
    // NASA Viking Mars 3D Model: Rust-Ochre Regolith, Basalt Plains, Valles Marineris & Olympus Mons
    const marsGrad = ctx.createLinearGradient(0, 0, 0, 1024);
    marsGrad.addColorStop(0, '#f8fafc');   // North Polar Cap (Water / CO2 ice)
    marsGrad.addColorStop(0.06, '#b45309');
    marsGrad.addColorStop(0.28, '#c2410c');
    marsGrad.addColorStop(0.5, '#9a3412');  // Equator
    marsGrad.addColorStop(0.78, '#c2410c');
    marsGrad.addColorStop(0.94, '#9a3412');
    marsGrad.addColorStop(1, '#f8fafc');   // South Polar Cap
    ctx.fillStyle = marsGrad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Dark Volcanic Basalt Markings (Syrtis Major & Acidalia Planitia)
    const basaltRegions = [
      { x: 1380, y: 480, rx: 180, ry: 140 }, // Syrtis Major Planum
      { x: 740, y: 310, rx: 220, ry: 120 },  // Acidalia Planitia
      { x: 1140, y: 580, rx: 280, ry: 110 }, // Sinus Sabaeus / Meridiani
      { x: 420, y: 640, rx: 190, ry: 130 },  // Cimmeria
    ];
    basaltRegions.forEach((b) => {
      const grad = ctx.createRadialGradient(b.x, b.y, 25, b.x, b.y, Math.max(b.rx, b.ry));
      grad.addColorStop(0, '#381608');
      grad.addColorStop(0.7, '#58210d');
      grad.addColorStop(1, 'rgba(154, 52, 18, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(b.x, b.y, b.rx, b.ry, rand() * 0.3, 0, Math.PI * 2);
      ctx.fill();
    });

    // VALLES MARINERIS (Grand Canyon of Mars - 4,000 km chasm across equator)
    ctx.strokeStyle = '#1e0802';
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(560, 520);
    ctx.bezierCurveTo(720, 505, 940, 560, 1120, 530);
    ctx.stroke();

    // Canyon tributary fractures (Chasmata branches)
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(760, 515);
    ctx.lineTo(840, 480);
    ctx.moveTo(910, 545);
    ctx.lineTo(990, 580);
    ctx.stroke();

    // OLYMPUS MONS (Solar System's largest shield volcano - 22 km summit caldera)
    const olyX = 420;
    const olyY = 430;
    const olyGrad = ctx.createRadialGradient(olyX, olyY, 12, olyX, olyY, 95);
    olyGrad.addColorStop(0, '#5a1d06');  // Summit Caldera
    olyGrad.addColorStop(0.35, '#d97706'); // High volcanic slopes
    olyGrad.addColorStop(0.85, '#9a3412');
    olyGrad.addColorStop(1, 'rgba(154, 52, 18, 0)');
    ctx.fillStyle = olyGrad;
    ctx.beginPath();
    ctx.arc(olyX, olyY, 95, 0, Math.PI * 2);
    ctx.fill();
    // Caldera crater ring
    ctx.strokeStyle = '#2b0b02';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(olyX, olyY, 18, 0, Math.PI * 2);
    ctx.stroke();

    // THARSIS MONTES (3 aligned giant shield volcanoes: Ascraeus, Pavonis, Arsia)
    [
      { x: 580, y: 390, r: 35 },
      { x: 550, y: 470, r: 32 },
      { x: 520, y: 550, r: 34 },
    ].forEach((m) => {
      ctx.fillStyle = '#6e2709';
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // HELLAS PLANITIA (Huge circular impact basin)
    ctx.fillStyle = 'rgba(217, 119, 6, 0.35)';
    ctx.beginPath();
    ctx.ellipse(1520, 710, 160, 110, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Scattered Impact Craters with Martian dust halos
    for (let i = 0; i < 160; i += 1) {
      const cx = rand() * 2048;
      const cy = 60 + rand() * 904;
      const rad = 2.5 + rand() * 18;
      ctx.fillStyle = 'rgba(56, 22, 8, 0.7)';
      ctx.beginPath();
      ctx.arc(cx, cy, rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(251, 146, 60, 0.55)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    // Polar Cap Spiral Chasmata (Perennial CO2 & water ice with radial dust fissures)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(1024, 25, 340, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1024, 1000, 290, 36, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
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
          <sphereGeometry args={[3.2, 64, 48]} />
          <meshStandardMaterial
            map={textures.earth}
            roughness={0.55}
            metalness={0.12}
          />
        </mesh>
        {/* Rotating Cloud Layer */}
        <mesh ref={earthCloudsRef}>
          <sphereGeometry args={[3.28, 56, 40]} />
          <meshStandardMaterial
            map={textures.earthClouds}
            transparent
            opacity={0.85}
            depthWrite={false}
          />
        </mesh>
        {/* Atmospheric Fresnel Glow */}
        <mesh material={shaders.earth}>
          <sphereGeometry args={[3.42, 56, 40]} />
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
          <sphereGeometry args={[2.0, 56, 40]} />
          <meshStandardMaterial
            map={textures.moon}
            bumpMap={textures.moon}
            bumpScale={0.14}
            roughness={0.94}
            metalness={0.02}
          />
        </mesh>
        <mesh material={shaders.moon}>
          <sphereGeometry args={[2.08, 44, 32]} />
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
          <sphereGeometry args={[2.9, 64, 48]} />
          <meshStandardMaterial
            map={textures.mars}
            bumpMap={textures.mars}
            bumpScale={0.12}
            roughness={0.88}
            metalness={0.05}
          />
        </mesh>
        <mesh material={shaders.mars}>
          <sphereGeometry args={[3.08, 56, 40]} />
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
