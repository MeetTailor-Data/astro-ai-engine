import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

function AnimatedController({ position, rotationY = 0, shirtColor = '#1E3A8A', phaseOffset = 0, alertMode = 'nominal' }) {
  const headRef = useRef();
  const torsoRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phaseOffset;
    const speed = alertMode === 'critical' ? 4.2 : 1.8;
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * speed * 0.7) * 0.24;
      headRef.current.rotation.x = -0.08 + Math.sin(t * speed * 1.1) * 0.08;
    }
    if (torsoRef.current) {
      torsoRef.current.rotation.x = 0.08 + Math.sin(t * speed * 0.6) * 0.03;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = -0.85 + Math.sin(t * 7.5) * 0.08;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -0.85 + Math.cos(t * 8.2) * 0.08;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Swivel Chair */}
      <mesh position={[0, 0.35, 0.12]}>
        <boxGeometry args={[0.42, 0.08, 0.42]} />
        <meshStandardMaterial color="#1E293B" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.65, 0.32]}>
        <boxGeometry args={[0.38, 0.55, 0.07]} />
        <meshStandardMaterial color="#0F172A" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.18, 0.12]}>
        <cylinderGeometry args={[0.04, 0.04, 0.34, 8]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} />
      </mesh>

      {/* Seated Engineer */}
      <group ref={torsoRef} position={[0, 0.45, 0.1]}>
        {/* Torso */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.36, 0.46, 0.22]} />
          <meshStandardMaterial color={shirtColor} roughness={0.55} />
        </mesh>
        {/* Head + Headset */}
        <group ref={headRef} position={[0, 0.62, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.14, 14, 12]} />
            <meshStandardMaterial color="#F1C27D" roughness={0.6} />
          </mesh>
          {/* Headset band & glowing comms mic */}
          <mesh position={[0.14, 0, -0.02]}>
            <boxGeometry args={[0.04, 0.1, 0.08]} />
            <meshStandardMaterial color="#0F172A" />
          </mesh>
          <mesh position={[0.11, -0.04, -0.11]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color={alertMode === 'critical' ? '#EF4444' : '#00F0FF'} />
          </mesh>
        </group>
        {/* Typing Arms */}
        <mesh ref={leftArmRef} position={[-0.22, 0.36, -0.12]} rotation={[-0.85, 0, 0.1]}>
          <boxGeometry args={[0.1, 0.34, 0.1]} />
          <meshStandardMaterial color={shirtColor} roughness={0.55} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.22, 0.36, -0.12]} rotation={[-0.85, 0, -0.1]}>
          <boxGeometry args={[0.1, 0.34, 0.1]} />
          <meshStandardMaterial color={shirtColor} roughness={0.55} />
        </mesh>
      </group>
    </group>
  );
}

function TelemetryConsole({ position, rotationY = 0, ledColor = '#10B981', screenColor = '#0EA5E9' }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Desk */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.65, 0.08, 0.68]} />
        <meshStandardMaterial color="#1E293B" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.26, 0.15]}>
        <boxGeometry args={[1.55, 0.52, 0.12]} />
        <meshStandardMaterial color="#0F172A" roughness={0.6} />
      </mesh>
      {/* Dual Monitors */}
      {[-0.42, 0.42].map((x, idx) => (
        <group key={idx} position={[x, 0.85, -0.16]} rotation={[-0.12, idx === 0 ? 0.12 : -0.12, 0]}>
          <mesh>
            <boxGeometry args={[0.72, 0.44, 0.04]} />
            <meshStandardMaterial color="#090D16" metalness={0.6} />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.65, 0.37]} />
            <meshBasicMaterial color={screenColor} />
          </mesh>
        </group>
      ))}
      {/* Console Status LED Strip */}
      <mesh position={[0, 0.6, 0.32]}>
        <boxGeometry args={[1.4, 0.03, 0.02]} />
        <meshBasicMaterial color={ledColor} />
      </mesh>
    </group>
  );
}

export default function MissionControlHQ3D({ flightPhase = 'PRELAUNCH', flightStatus = 'PRELAUNCH', altitudeKm = 0 }) {
  const pulseRef = useRef();
  const isCritical = flightStatus === 'CRASHED' || flightPhase.includes('ANOMALY') || flightPhase.includes('BREAKUP') || flightPhase.includes('DEPLETED') || flightPhase.includes('BURNUP') || flightPhase.includes('IMPACT');
  const isLanded = flightStatus === 'LANDED';
  const alertMode = isCritical ? 'critical' : 'nominal';

  const ledColor = isCritical ? '#EF4444' : isLanded ? '#10B981' : '#00F0FF';
  const screenColor = isCritical ? '#7F1D1D' : isLanded ? '#065F46' : '#0C4A6E';

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.06;
      pulseRef.current.scale.set(s, s, 1);
    }
  });

  // Normalized progress dot on the big front trajectory wall
  const progressX = Math.min(2.6, -2.6 + (Math.min(240, altitudeKm) / 240) * 5.2);
  const progressY = 2.1 + Math.sin(Math.min(1, altitudeKm / 240) * Math.PI * 0.5) * 1.15;

  return (
    <group>
      <color attach="background" args={['#050914']} />
      <ambientLight intensity={0.75} color="#BAE6FD" />
      <pointLight position={[0, 4.5, 1.5]} intensity={14} distance={16} color={isCritical ? '#FCA5A5' : '#38BDF8'} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} color="#E0F2FE" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 14]} />
        <meshStandardMaterial color="#0F172A" roughness={0.75} metalness={0.2} />
      </mesh>
      {/* Raised Tier 2 Platform */}
      <mesh position={[0, 0.14, 2.3]} receiveShadow>
        <boxGeometry args={[11, 0.28, 3.2]} />
        <meshStandardMaterial color="#1E293B" roughness={0.7} />
      </mesh>
      {/* Back/Front Wall */}
      <mesh position={[0, 2.8, -3.8]}>
        <boxGeometry args={[14, 5.6, 0.25]} />
        <meshStandardMaterial color="#0B1221" roughness={0.85} />
      </mesh>

      {/* Master Wall Trajectory Projection Screen */}
      <group position={[0, 2.75, -3.62]}>
        <mesh>
          <boxGeometry args={[7.4, 3.3, 0.08]} />
          <meshStandardMaterial color="#020617" metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.05]}>
          <planeGeometry args={[7.0, 2.95]} />
          <meshBasicMaterial color={isCritical ? '#1F0909' : '#041428'} />
        </mesh>
        {/* Trajectory Arc Line */}
        <mesh position={[0, -0.35, 0.07]} rotation={[0, 0, 0.18]}>
          <boxGeometry args={[5.4, 0.035, 0.01]} />
          <meshBasicMaterial color={ledColor} />
        </mesh>
        {/* Live Vehicle Marker */}
        <mesh ref={pulseRef} position={[progressX, progressY - 2.4, 0.09]}>
          <circleGeometry args={[0.14, 16]} />
          <meshBasicMaterial color={isCritical ? '#EF4444' : '#F59E0B'} />
        </mesh>
        {/* Wall Status Banner Strip */}
        <mesh position={[0, 1.32, 0.08]}>
          <planeGeometry args={[6.8, 0.16]} />
          <meshBasicMaterial color={ledColor} />
        </mesh>
      </group>

      {/* Front Row Consoles & 3 Engineers */}
      <TelemetryConsole position={[-2.1, 0, -1.2]} rotationY={0.18} ledColor={ledColor} screenColor={screenColor} />
      <TelemetryConsole position={[0, 0, -1.45]} rotationY={0} ledColor={ledColor} screenColor={screenColor} />
      <TelemetryConsole position={[2.1, 0, -1.2]} rotationY={-0.18} ledColor={ledColor} screenColor={screenColor} />

      <AnimatedController position={[-2.0, 0, -0.45]} rotationY={0.18} shirtColor="#1D4ED8" phaseOffset={0.2} alertMode={alertMode} />
      <AnimatedController position={[0, 0, -0.7]} rotationY={0} shirtColor="#0F766E" phaseOffset={1.4} alertMode={alertMode} />
      <AnimatedController position={[2.0, 0, -0.45]} rotationY={-0.18} shirtColor="#3730A3" phaseOffset={2.6} alertMode={alertMode} />

      {/* Tier 2 Consoles & 3 Senior Flight Directors */}
      <TelemetryConsole position={[-2.3, 0.28, 1.45]} rotationY={0.14} ledColor={ledColor} screenColor={screenColor} />
      <TelemetryConsole position={[0, 0.28, 1.25]} rotationY={0} ledColor={ledColor} screenColor={screenColor} />
      <TelemetryConsole position={[2.3, 0.28, 1.45]} rotationY={-0.14} ledColor={ledColor} screenColor={screenColor} />

      <AnimatedController position={[-2.2, 0.28, 2.2]} rotationY={0.14} shirtColor="#0369A1" phaseOffset={3.1} alertMode={alertMode} />
      <AnimatedController position={[0, 0.28, 2.0]} rotationY={0} shirtColor="#B45309" phaseOffset={0.9} alertMode={alertMode} />
      <AnimatedController position={[2.2, 0.28, 2.2]} rotationY={-0.14} shirtColor="#1E40AF" phaseOffset={4.0} alertMode={alertMode} />
    </group>
  );
}
