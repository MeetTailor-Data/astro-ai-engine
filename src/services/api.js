import { validateRocketForMission } from '../utils/missionPhysics';

const HEALTH_TIMEOUT_MS = 1500;
const REQUEST_TIMEOUT_MS = 2500;
const STREAM_BASE_URL = 'http://localhost:3000';
const SESSION_STORAGE_PREFIX = 'astro_ai_mission_';
const SESSION_INDEX_KEY = 'astro_ai_custom_missions';

/**
 * Scientifically grounded fallback mission profiles inspired by Mars Horizon.
 * Used automatically whenever the Astro-AI backend (/api/missions/profiles) is offline.
 */
export const FALLBACK_MISSION_PROFILES = [
  {
    id: 'leo-sat-01',
    code: 'MSN-01 // EARTH ORBIT',
    name: 'LEO Weather Satellite',
    targetBody: 'Earth (LEO)',
    targetAltitudeKm: 400,
    targetAltitudeLabel: '400 km',
    gravityMs2: 9.81,
    gravityLabel: '9.81 m/s² (Earth)',
    atmosphere: 'Dense (101.3 kPa)',
    atmosphereType: 'DENSE',
    atmospherePressureKpa: 101.3,
    atmosphereDetail: '101.3 kPa Sea-Level N₂/O₂ — High Max-Q & aerodynamic drag on ascent',
    requiredPayload: 'Satellite (1,200 kg)',
    requiredPayloadName: 'Satellite',
    requiredPayloadKg: 1200,
    minTwr: 1.25,
    targetDeltaV: 9400,
    maxSafeTouchdownSpeedMs: 5.0,
    difficulty: 'Easy (Explorer)',
    difficultyTier: 'EASY',
    summary:
      'Deploy a meteorological observation satellite into a 400 km sun-synchronous Low Earth Orbit and safely recover/stabilize the mission profile.',
    edlRequirements: {
      heatshieldRequired: false,
      parachuteEffective: true,
      retroThrustersRequired: false,
      summary: 'Aerodynamic fairing required for dense lower atmosphere; drogue/main parachutes effective during Earth recovery.',
    },
    engineeringBrief: {
      gravityNote:
        'High surface gravity (9.81 m/s²) demands a strong Main Booster cluster to clear the pad with TWR ≥ 1.25.',
      atmosphereNote:
        'Dense 101.3 kPa atmosphere generates severe Max-Q structural loads during ascent—streamlined Nosecone Fairing reduces drag losses, while thick air allows parachutes to decelerate returning stages.',
      edlRationale:
        'Parachutes are highly effective in Earth’s dense atmosphere (≤ 5.0 m/s safe touchdown threshold). Thermal shielding is minimal for standard LEO orbital deployment.',
      safeCriteria: [
        'Liftoff TWR ≥ 1.25 to overcome 9.81 m/s² gravity & atmospheric drag',
        'Total Vehicle Delta-V ≥ 9,400 m/s for 400 km orbital insertion',
        'Payload capacity ≥ 1,200 kg for meteorological satellite bus',
        'Touchdown / terminal velocity ≤ 5.0 m/s',
      ],
      crashRisks: [
        'TWR < 1.25 causes pad stall or excessive gravity losses during ascent',
        'Blunt or missing nosecone spikes Max-Q dynamic pressure stress',
        'Insufficient Delta-V (< 9,400 m/s) results in sub-orbital atmospheric re-impact',
      ],
    },
  },
  {
    id: 'lunar-lander-02',
    code: 'MSN-02 // CISLUNAR',
    name: 'Lunar Crater Lander',
    targetBody: 'Moon',
    targetAltitudeKm: 384400,
    targetAltitudeLabel: '384,400 km',
    gravityMs2: 1.62,
    gravityLabel: '1.62 m/s² (Moon)',
    atmosphere: 'Vacuum (0 kPa - Parachutes ineffective, Retro-Thrusters required)',
    atmosphereType: 'VACUUM',
    atmospherePressureKpa: 0,
    atmosphereDetail: '0 kPa Hard Vacuum — Zero aerodynamic drag; parachutes provide zero deceleration',
    requiredPayload: 'Lunar Lander (2,800 kg)',
    requiredPayloadName: 'Lunar Lander',
    requiredPayloadKg: 2800,
    minTwr: 1.35,
    targetDeltaV: 12200,
    maxSafeTouchdownSpeedMs: 3.5,
    difficulty: 'Normal (Pioneer)',
    difficultyTier: 'NORMAL',
    summary:
      'Execute a trans-lunar injection across 384,400 km and perform a powered terminal descent into Shackleton Crater Rim.',
    edlRequirements: {
      heatshieldRequired: false,
      parachuteEffective: false,
      retroThrustersRequired: true,
      summary: 'Vacuum environment (0 kPa): Parachutes are completely ineffective. Powered Retro-Thrusters are mandatory.',
    },
    engineeringBrief: {
      gravityNote:
        'Earth departure requires TWR ≥ 1.35 with heavy payload (2,800 kg). Once in lunar orbit, 1.62 m/s² gravity permits precision hovering and powered descent.',
      atmosphereNote:
        'Total vacuum (0 kPa) means zero aerodynamic braking and zero parachute lift—relying on parachutes guarantees an uncontrolled ballistic impact.',
      edlRationale:
        'Retro-Thrusters are 100% mandatory for terminal deceleration below 3.5 m/s. Heatshields add dead mass at the Moon since there is no entry plasma.',
      safeCriteria: [
        'Liftoff TWR ≥ 1.35 to lift 2,800 kg Lunar Lander + trans-lunar propellant',
        'Total Vehicle Delta-V ≥ 12,200 m/s (LEO + TLI + Lunar Orbit Insertion + Powered Descent)',
        'EDL equipped with Throttleable Retro-Thrusters (parachutes disabled/bypassed)',
        'Terminal touchdown speed ≤ 3.5 m/s on uneven crater regolith',
      ],
      crashRisks: [
        'Equipping a parachute-only EDL in 0 kPa vacuum causes catastrophic crater impact',
        'Running out of upper-stage/EDL propellant (< 12,200 m/s Δv) causes hard landing',
        'Touchdown speed > 3.5 m/s fractures landing struts and destroys lander',
      ],
    },
  },
  {
    id: 'mars-rover-03',
    code: 'MSN-03 // DEEP SPACE',
    name: 'Mars Jezero Rover Touchdown',
    targetBody: 'Mars',
    targetAltitudeKm: 54600000,
    targetAltitudeLabel: '54,600,000 km',
    gravityMs2: 3.71,
    gravityLabel: '3.71 m/s² (Mars)',
    atmosphere: 'Thin CO2 (0.6 kPa - Heatshield + Supersonic Parachute + Retro-Thrusters required)',
    atmosphereType: 'THIN_CO2',
    atmospherePressureKpa: 0.6,
    atmosphereDetail: '0.6 kPa Thin CO₂ — Intense hypersonic entry heating, insufficient air for parachute-only landing',
    requiredPayload: 'Mars Rover (3,500 kg)',
    requiredPayloadName: 'Mars Rover',
    requiredPayloadKg: 3500,
    minTwr: 1.45,
    targetDeltaV: 15800,
    maxSafeTouchdownSpeedMs: 2.5,
    difficulty: 'Hard (Veteran)',
    difficultyTier: 'HARD',
    summary:
      'Launch a 3,500 kg nuclear-powered science rover across interplanetary space and survive the "7 Minutes of Terror" into Jezero Crater.',
    edlRequirements: {
      heatshieldRequired: true,
      parachuteEffective: true,
      retroThrustersRequired: true,
      summary: 'Full 3-stage EDL required: Ablative Heatshield + Supersonic Parachute + Skycrane Retro-Thrusters.',
    },
    engineeringBrief: {
      gravityNote:
        'Heavy-lift Earth escape with a 3,500 kg rover demands TWR ≥ 1.45 and high-Isp Upper Stage propulsion. Mars gravity (3.71 m/s²) pulls fast during terminal descent.',
      atmosphereNote:
        'At just 0.6 kPa (~1% of Earth sea-level pressure), the CO₂ atmosphere is dense enough to create extreme hypersonic entry heating—yet far too thin for parachutes alone to slow the rover to safe speeds.',
      edlRationale:
        'All three EDL layers are non-negotiable: (1) Ablative Heatshield sheds 98% of kinetic energy at > 1,600 °C, (2) Supersonic Parachute slows descent from Mach 2 to subsonic, and (3) Retro-Thrusters / Skycrane execute final braking to ≤ 2.5 m/s.',
      safeCriteria: [
        'Liftoff TWR ≥ 1.45 to boost heavy 3,500 kg rover into interplanetary transfer',
        'Total Vehicle Delta-V ≥ 15,800 m/s for Earth escape & Mars trajectory insertion',
        'Integrated Heatshield + Supersonic Chute + Retro-Thrusters EDL package',
        'Precision terminal touchdown speed ≤ 2.5 m/s in Jezero Crater',
      ],
      crashRisks: [
        'Missing Heatshield causes spacecraft burn-up during Mach 25 Martian entry',
        'Parachutes without Retro-Thrusters leave terminal velocity > 60 m/s (guaranteed crash)',
        'Delta-V < 15,800 m/s fails trans-Mars injection window',
      ],
    },
  },
];

async function fetchWithTimeout(url, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timerId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timerId);
  }
}

/**
 * Checks backend simulator health via GET /api/health with a 1.5s timeout.
 * Automatically falls back to LOCAL_PHYSICS_SIM if offline or unreachable.
 * @returns {Promise<{ online: boolean, mode: 'LIVE_BACKEND' | 'LOCAL_PHYSICS_SIM', message: string }>}
 */
export async function checkSimulatorHealth() {
  try {
    const res = await fetchWithTimeout('/api/health', { method: 'GET' }, HEALTH_TIMEOUT_MS);
    if (res.ok) {
      return {
        online: true,
        mode: 'LIVE_BACKEND',
        message: 'Astro-AI Simulator Connected',
      };
    }
  } catch {
    // Fall through to local physics fallback
  }

  return {
    online: false,
    mode: 'LOCAL_PHYSICS_SIM',
    message: 'Offline Physics Simulator Active',
  };
}

/**
 * Fetches available mission profiles via GET /api/missions/profiles.
 * Falls back to the 3 Mars Horizon-inspired mission profiles when offline.
 * @returns {Promise<Array<object>>}
 */
export async function fetchMissionProfiles() {
  try {
    const res = await fetchWithTimeout('/api/missions/profiles', { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : data?.profiles;
      if (Array.isArray(list) && list.length > 0) {
        return list;
      }
    }
  } catch {
    // Fall through to local fallback profiles
  }

  return FALLBACK_MISSION_PROFILES;
}

/**
 * Submits a custom rocket & mission configuration via POST /api/missions/custom.
 * When offline, persists the payload to sessionStorage and returns a local simulation ID.
 * @param {object} missionPayload
 * @returns {Promise<{ missionId: string, [key: string]: any }>}
 */
export async function createCustomMission(missionPayload) {
  try {
    const res = await fetchWithTimeout('/api/missions/custom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(missionPayload),
    });

    if (res.ok) {
      const data = await res.json();
      const missionId = data?.missionId || data?.id || `live-${Date.now()}`;
      return { ...missionPayload, ...data, missionId };
    }
  } catch {
    // Fall through to sessionStorage offline persistence
  }

  const missionId = `sim-${Date.now()}`;
  const offlineRecord = {
    missionId,
    ...missionPayload,
    offlineMode: true,
    createdAt: new Date().toISOString(),
  };

  try {
    sessionStorage.setItem(`${SESSION_STORAGE_PREFIX}${missionId}`, JSON.stringify(offlineRecord));
    const existingIndex = JSON.parse(sessionStorage.getItem(SESSION_INDEX_KEY) || '[]');
    existingIndex.push(missionId);
    sessionStorage.setItem(SESSION_INDEX_KEY, JSON.stringify(existingIndex));
  } catch {
    // Ignore sessionStorage quota issues
  }

  return offlineRecord;
}

/**
 * Starts a mission simulation via POST /api/missions/:id/run.
 * Returns { status: 'RUNNING', missionId } in offline mode.
 * @param {string} missionId
 * @returns {Promise<{ status: string, missionId: string }>}
 */
export async function runMission(missionId) {
  if (!missionId || String(missionId).startsWith('sim-')) {
    return { status: 'RUNNING', missionId };
  }

  try {
    const res = await fetchWithTimeout(`/api/missions/${encodeURIComponent(missionId)}/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (res.ok) {
      const data = await res.json();
      return {
        status: data?.status || 'RUNNING',
        missionId,
        ...data,
      };
    }
  } catch {
    // Fall through to offline running status
  }

  return { status: 'RUNNING', missionId };
}

/**
 * Retrieves an offline custom mission saved in sessionStorage (utility for Step 3/4).
 * @param {string} missionId
 * @returns {object|null}
 */
export function getStoredLocalMission(missionId) {
  try {
    const raw = sessionStorage.getItem(`${SESSION_STORAGE_PREFIX}${missionId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Smooth 60fps local physics stream generator used automatically when the backend SSE
 * stream is offline or running an offline `sim-*` mission.
 */
export function createLocalPhysicsStream({
  missionId,
  rocketConfig,
  selectedMission,
  validationResult,
  getSpeedMultiplier,
  onTick,
  onComplete,
}) {
  const validation = validationResult || validateRocketForMission(rocketConfig, selectedMission);
  const failureCode = validation.willLand ? null : validation.primaryFailure?.code;
  const targetAltKm = selectedMission?.targetAltitudeKm ?? 400;
  const isEarthLeo = (selectedMission?.targetBody || '').toLowerCase().includes('earth');

  let rafId = null;
  let stopped = false;
  let lastNow = performance.now();
  let simTime = 0; // 0..5 = countdown, 5..30 = flight
  let lastTickEmit = 0;
  const emittedCallouts = new Set();

  const emitOnce = (key, text) => {
    if (emittedCallouts.has(key)) return null;
    emittedCallouts.add(key);
    return text;
  };

  const finishMission = (status, finalTick) => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    onTick?.(finalTick);
    onComplete?.({
      status,
      outcome: status,
      missionId,
      willLand: status === 'LANDED',
      failedConstraints: validation.failedConstraints,
      failureReason: validation.failureReason,
      primaryFailure: validation.primaryFailure,
      physics: validation.physics,
      finalTelemetry: finalTick,
    });
  };

  const step = (now) => {
    if (stopped) return;
    const rawDt = Math.min(0.05, (now - lastNow) / 1000);
    lastNow = now;
    const speed = Math.max(1, Math.min(4, getSpeedMultiplier?.() || 1));
    simTime += rawDt * speed;

    let altitudeKm = 0;
    let velocityMs = 0;
    let fuelPct = 100;
    let gForce = 1.0;
    let phase = 'COUNTDOWN';
    let hqCallout = null;
    let stageSeparated = false;
    let edlDeployed = false;
    let anomalyType = null;
    let status = 'IN_FLIGHT';
    const countdownSec = simTime < 5 ? Math.max(0, Math.ceil(5 - simTime)) : 0;

    if (simTime < 5) {
      phase = 'COUNTDOWN';
      if (simTime >= 0.1) hqCallout = emitOnce('T5', 'FLIGHT DIRECTOR: All stations GO for launch. Auto-sequence start.');
      if (simTime >= 2.0) hqCallout = emitOnce('T3', 'PROPULSION: Main engine ignition sequence start. Chamber pressure rising.');
    } else {
      const flightT = simTime - 5; // seconds since T-0

      if (failureCode === 'TWR_LOW') {
        if (flightT < 3.6) {
          phase = 'LIFTOFF';
          altitudeKm = Math.max(0, Math.sin((flightT / 3.6) * Math.PI) * 0.045);
          velocityMs = 12 * Math.cos((flightT / 3.6) * (Math.PI * 0.5));
          fuelPct = Math.max(88, 100 - flightT * 2.8);
          gForce = 0.88;
          hqCallout = emitOnce('TWR_WARN', 'PROPULSION: WARNING — Liftoff TWR below minimum! Vehicle losing vertical stability!');
        } else {
          const crashTick = {
            tSec: Number(flightT.toFixed(2)),
            countdownSec: 0,
            altitudeKm: 0,
            velocityMs: 28,
            fuelPct: 86,
            gForce: 9.4,
            phase: 'PAD_ANOMALY',
            hqCallout: 'FLIGHT DIRECTOR: Pad stall! Vehicle tipped over — RSO destruct triggered!',
            status: 'CRASHED',
            stageSeparated: false,
            edlDeployed: false,
            anomalyType: 'TWR_LOW',
          };
          finishMission('CRASHED', crashTick);
          return;
        }
      } else if (failureCode === 'OVER_G' || failureCode === 'FAIRING_FAIL') {
        if (flightT < 6.4) {
          phase = flightT < 3.0 ? 'LIFTOFF' : 'MAX_Q';
          altitudeKm = Math.pow(flightT, 2.05) * 0.85;
          velocityMs = flightT * 310;
          fuelPct = Math.max(62, 100 - flightT * 5.8);
          gForce = failureCode === 'OVER_G' ? 4.6 + flightT * 0.36 : 2.1 + flightT * 0.25;
          if (flightT >= 0.2) {
            hqCallout = emitOnce(
              'LIFTOFF',
              failureCode === 'OVER_G'
                ? 'FLIGHT DIRECTOR: Liftoff! Tower cleared — acceleration way above nominal!'
                : 'FLIGHT DIRECTOR: Liftoff! Tower cleared — aerodynamic vibration rising on payload fairing!'
            );
          }
          if (flightT >= 3.2) {
            hqCallout = emitOnce(
              'OVER_G_WARN',
              failureCode === 'OVER_G'
                ? 'GUIDANCE: CRITICAL — Extreme G-load approaching Max-Q structural limit!'
                : 'GUIDANCE: CRITICAL — Fairing thermal/aerodynamic shear exceeding design limit at Max-Q!'
            );
          }
        } else {
          const crashTick = {
            tSec: Number(flightT.toFixed(2)),
            countdownSec: 0,
            altitudeKm: 38.4,
            velocityMs: 1980,
            fuelPct: 62,
            gForce: failureCode === 'OVER_G' ? 7.2 : 4.8,
            phase: 'MAX_Q_BREAKUP',
            hqCallout:
              failureCode === 'OVER_G'
                ? 'GUIDANCE: Structural failure at Max-Q! Telemetry signal lost!'
                : 'GUIDANCE: Payload fairing breached at Max-Q! Vehicle lost!',
            status: 'CRASHED',
            stageSeparated: false,
            edlDeployed: false,
            anomalyType: failureCode,
          };
          finishMission('CRASHED', crashTick);
          return;
        }
      } else {
        // Normal ascent up to Stage Separation (flightT = 9.5s)
        if (flightT < 9.5) {
          const p = flightT / 9.5;
          phase = flightT < 3.0 ? 'LIFTOFF' : flightT < 6.5 ? 'MAX_Q' : 'ASCENT';
          altitudeKm = Math.pow(p, 1.85) * 78;
          velocityMs = Math.pow(p, 1.35) * 2450;
          fuelPct = Math.max(42, 100 - p * 58);
          gForce = 1.35 + p * 1.9;
          if (flightT >= 0.15) hqCallout = emitOnce('LIFTOFF', 'FLIGHT DIRECTOR: Liftoff! Vehicle has cleared the tower!');
          if (flightT >= 3.5) hqCallout = emitOnce('MAXQ', 'GUIDANCE: Max-Q passed. Aerodynamic loads nominal.');
        } else if (failureCode === 'DELTAV_LOW') {
          stageSeparated = true;
          const postT = flightT - 9.5;
          if (postT < 4.5) {
            phase = 'STAGE_SEP';
            altitudeKm = 78 + postT * 8.5;
            velocityMs = 2450 + postT * 260;
            fuelPct = Math.max(0, 42 - (postT / 4.2) * 42);
            gForce = fuelPct > 0 ? 2.4 : 0.05;
            hqCallout = emitOnce('SEP', 'FIDO: Stage 1 separation confirmed! Upper stage burn in progress.');
            if (postT >= 3.8) hqCallout = emitOnce('DV_WARN', 'PROPULSION: CRITICAL — Upper stage propellant depleted! Insufficient Delta-V!');
          } else if (postT < 7.2) {
            phase = 'FUEL_DEPLETED';
            const fallP = (postT - 4.5) / 2.7;
            altitudeKm = Math.max(12, 116 - fallP * fallP * 104);
            velocityMs = Math.max(420, 3620 - fallP * 1400);
            fuelPct = 0;
            gForce = 0.2 + fallP * 3.8;
          } else {
            const crashTick = {
              tSec: Number(flightT.toFixed(2)),
              countdownSec: 0,
              altitudeKm: 8.5,
              velocityMs: 2150,
              fuelPct: 0,
              gForce: 8.5,
              phase: 'FUEL_DEPLETED',
              hqCallout: 'FIDO: Suborbital re-impact! Vehicle lost due to Delta-V shortfall.',
              status: 'CRASHED',
              stageSeparated: true,
              edlDeployed: false,
              anomalyType: 'DELTAV_LOW',
            };
            finishMission('CRASHED', crashTick);
            return;
          }
        } else if (flightT < 15.5) {
          // Upper stage burn to space / orbit insertion (flightT 9.5 -> 15.5)
          stageSeparated = true;
          const p = (flightT - 9.5) / 6.0;
          phase = p < 0.35 ? 'STAGE_SEP' : 'ORBIT_INSERT';
          const peakAlt = isEarthLeo ? targetAltKm : 240;
          altitudeKm = 78 + p * (peakAlt - 78);
          velocityMs = 2450 + p * 5350;
          fuelPct = Math.max(16, 42 - p * 26);
          gForce = 1.8 + p * 1.4;
          if (flightT >= 9.6) hqCallout = emitOnce('SEP', 'FIDO: Stage 1 separation confirmed! Upper vacuum engine ignition!');
          if (flightT >= 13.0) hqCallout = emitOnce('ORBIT', 'EECOM: Karman line crossed. Deep space trajectory nominal.');
        } else if (isEarthLeo) {
          // Earth LEO mission stays in space at 400 km to deploy satellite!
          stageSeparated = true;
          edlDeployed = true;
          if (flightT < 20.5) {
            phase = 'PAYLOAD_DEPLOY';
            altitudeKm = targetAltKm;
            velocityMs = 7670;
            fuelPct = 14;
            gForce = 0.02;
            hqCallout = emitOnce(
              'LEO_DEPLOY',
              'GUIDANCE: 400 km Sun-Synchronous Orbit stabilized! Fairing jettisoned — deploying Weather Satellite!'
            );
          } else {
            const isSuccess = validation.willLand;
            const finalStatus = isSuccess ? 'LANDED' : 'CRASHED';
            const finalTick = {
              tSec: Number(flightT.toFixed(2)),
              countdownSec: 0,
              altitudeKm: targetAltKm,
              velocityMs: 7670,
              fuelPct: 14,
              gForce: 0.0,
              phase: isSuccess ? 'ORBIT_CONFIRMED' : 'PAYLOAD_ERROR',
              hqCallout: isSuccess
                ? 'FLIGHT DIRECTOR: ORBIT CONFIRMED! Weather Satellite solar arrays deployed & radar online!'
                : `GUIDANCE: MISSION FAILED IN ORBIT! ${validation.failureReason}`,
              status: finalStatus,
              stageSeparated: true,
              edlDeployed: true,
              anomalyType: isSuccess ? null : (failureCode || 'PAYLOAD_MISMATCH'),
            };
            finishMission(finalStatus, finalTick);
            return;
          }
        } else if (flightT < 20.5) {
          // Entry / Approach (flightT 15.5 -> 20.5)
          stageSeparated = true;
          const p = (flightT - 15.5) / 5.0;
          phase = 'ENTRY_DESCENT';
          const peakAlt = isEarthLeo ? targetAltKm : 240;

          if (failureCode === 'NO_HEATSHIELD' && p >= 0.65) {
            const crashTick = {
              tSec: Number(flightT.toFixed(2)),
              countdownSec: 0,
              altitudeKm: Number((peakAlt * 0.22).toFixed(1)),
              velocityMs: 5800,
              fuelPct: 16,
              gForce: 11.2,
              phase: 'THERMAL_BURNUP',
              hqCallout: 'THERMAL: CRITICAL — No ablative heatshield! Vehicle disintegrated in entry plasma!',
              status: 'CRASHED',
              stageSeparated: true,
              edlDeployed: false,
              anomalyType: 'NO_HEATSHIELD',
            };
            finishMission('CRASHED', crashTick);
            return;
          }

          edlDeployed = p >= 0.55;
          altitudeKm = Math.max(12, peakAlt * (1 - p * 0.92));
          velocityMs = Math.max(280, 7800 * (1 - p * 0.94));
          fuelPct = Math.max(6, 16 - p * 10);
          gForce = 2.6 + Math.sin(p * Math.PI) * 2.1;
          if (flightT >= 15.8) {
            hqCallout = emitOnce(
              'EDL_INIT',
              failureCode === 'NO_HEATSHIELD'
                ? 'THERMAL: WARNING — Entry interface plasma spike! Heatshield missing!'
                : 'EDL OFFICER: Retro-burn initiated. Atmospheric / target approach nominal.'
            );
          }
        } else if (flightT < 24.5) {
          // Terminal Descent & Touchdown (flightT 20.5 -> 24.5)
          stageSeparated = true;
          edlDeployed = true;
          const p = (flightT - 20.5) / 4.0;
          phase = 'TERMINAL_DESCENT';
          altitudeKm = Math.max(0, 12 * (1 - p));
          const targetSpeed = validation.physics?.touchdown?.speedMs ?? 2.5;
          velocityMs = failureCode === 'EDL_FAIL' ? Math.max(180, 280 - p * 80) : Math.max(targetSpeed, 280 * (1 - p * 0.99));
          fuelPct = Math.max(1, 6 - p * 5);
          gForce = failureCode === 'EDL_FAIL' ? 1.6 : 1.15;
          if (flightT >= 20.7) {
            hqCallout = emitOnce(
              'TERM',
              failureCode === 'EDL_FAIL'
                ? 'EDL OFFICER: CRITICAL — Deceleration failure! Surface impact imminent!'
                : 'EDL OFFICER: Landing legs deployed. Final retro-thruster burn nominal.'
            );
          }
        } else {
          // Final outcome at flightT >= 24.5
          const finalStatus = validation.willLand ? 'LANDED' : 'CRASHED';
          const finalSpeed = validation.willLand ? (validation.physics?.touchdown?.speedMs ?? 2.2) : 240;
          const finalTick = {
            tSec: Number(flightT.toFixed(2)),
            countdownSec: 0,
            altitudeKm: 0,
            velocityMs: Number(finalSpeed.toFixed(1)),
            fuelPct: 1,
            gForce: finalStatus === 'LANDED' ? 1.0 : 14.5,
            phase: finalStatus === 'LANDED' ? 'TOUCHDOWN' : 'HARD_IMPACT',
            hqCallout:
              finalStatus === 'LANDED'
                ? 'FLIGHT DIRECTOR: TOUCHDOWN CONFIRMED! All stations report vehicle safe on surface!'
                : `EDL OFFICER: IMPACT DETECTED! ${validation.failureReason}`,
            status: finalStatus,
            stageSeparated: true,
            edlDeployed: true,
            anomalyType: finalStatus === 'CRASHED' ? (failureCode || 'EDL_FAIL') : null,
          };
          finishMission(finalStatus, finalTick);
          return;
        }
      }
    }

    // Throttle React state ticks to ~20Hz while keeping 3D smooth
    if (now - lastTickEmit >= 45 || hqCallout) {
      lastTickEmit = now;
      onTick?.({
        tSec: Number(Math.max(0, simTime - 5).toFixed(2)),
        countdownSec,
        altitudeKm: Number(altitudeKm.toFixed(2)),
        velocityMs: Math.round(velocityMs),
        fuelPct: Number(fuelPct.toFixed(1)),
        gForce: Number(gForce.toFixed(2)),
        phase,
        hqCallout,
        status,
        stageSeparated,
        edlDeployed,
        anomalyType,
      });
    }

    rafId = requestAnimationFrame(step);
  };

  rafId = requestAnimationFrame(step);

  return () => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}

/**
 * Connects to GET /api/missions/:id/stream via EventSource.
 * Automatically falls back to `createLocalPhysicsStream` when offline or running `sim-*`.
 */
export function streamMissionTelemetry(missionId, onTick, onComplete, options = {}) {
  const {
    onFallback,
    onError,
    forceLocalFallback = false,
    connectTimeoutMs = 2000,
    rocketConfig,
    selectedMission,
    validationResult,
    getSpeedMultiplier,
  } = options;

  let fallbackCleanup = null;
  let closed = false;
  let completed = false;
  let hasOpened = false;
  let eventSource = null;
  let connectTimer = null;

  const triggerLocalFallback = (reason) => {
    if (closed || completed) return;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }

    if (typeof onFallback === 'function') {
      const maybeCleanup = onFallback({ missionId, onTick, onComplete, reason });
      if (typeof maybeCleanup === 'function') {
        fallbackCleanup = maybeCleanup;
      }
    } else if (rocketConfig || selectedMission) {
      fallbackCleanup = createLocalPhysicsStream({
        missionId,
        rocketConfig,
        selectedMission,
        validationResult,
        getSpeedMultiplier,
        onTick,
        onComplete,
      });
    }
  };

  if (forceLocalFallback || !missionId || String(missionId).startsWith('sim-') || typeof EventSource === 'undefined') {
    triggerLocalFallback('OFFLINE_SIM_ID');
    return {
      mode: 'LOCAL_FALLBACK',
      close: () => {
        closed = true;
        if (fallbackCleanup) fallbackCleanup();
      },
    };
  }

  const streamUrl = `${STREAM_BASE_URL}/api/missions/${encodeURIComponent(missionId)}/stream`;
  eventSource = new EventSource(streamUrl);

  connectTimer = setTimeout(() => {
    if (!hasOpened && !closed && !completed) {
      triggerLocalFallback('SSE_CONNECT_TIMEOUT');
    }
  }, connectTimeoutMs);

  eventSource.onopen = () => {
    hasOpened = true;
    if (connectTimer) {
      clearTimeout(connectTimer);
      connectTimer = null;
    }
  };

  const handlePayload = (rawData) => {
    try {
      const payload = JSON.parse(rawData);
      if (payload?.type === 'COMPLETE' || payload?.status === 'COMPLETED' || payload?.outcome) {
        completed = true;
        if (eventSource) eventSource.close();
        onComplete?.(payload);
      } else {
        onTick?.(payload);
      }
    } catch {
      // Ignore malformed SSE frames
    }
  };

  eventSource.onmessage = (event) => handlePayload(event.data);
  eventSource.addEventListener('telemetry', (event) => handlePayload(event.data));
  eventSource.addEventListener('tick', (event) => handlePayload(event.data));
  eventSource.addEventListener('complete', (event) => {
    completed = true;
    try {
      const payload = JSON.parse(event.data);
      eventSource?.close();
      onComplete?.(payload);
    } catch {
      eventSource?.close();
      onComplete?.({ status: 'COMPLETED', missionId });
    }
  });

  eventSource.onerror = (err) => {
    if (closed || completed) return;
    if (!hasOpened) {
      triggerLocalFallback('SSE_CONNECTION_ERROR');
    } else {
      onError?.(err);
      triggerLocalFallback('SSE_STREAM_INTERRUPTED');
    }
  };

  return {
    mode: 'LIVE_SSE',
    close: () => {
      closed = true;
      if (connectTimer) clearTimeout(connectTimer);
      if (eventSource) eventSource.close();
      if (fallbackCleanup) fallbackCleanup();
    },
  };
}
