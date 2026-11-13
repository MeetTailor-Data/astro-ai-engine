import { PROPELLANT_OPTIONS } from '../data/vabParts';

const BOOSTER_DV_MAP = {
  single_core: 3200,
  tri_engine_cluster: 4500,
  heavy_core_2_strapon: 5600,
  heavy_core_4_strapon: 6800,
};

const UPPER_STAGE_DV_MAP = {
  solid_kick_motor: 1800,
  liquid_hydrolox: 3200,
  methalox_deep_space: 4800,
};

const NOSECONE_AERO_BONUS_MAP = {
  standard_cone: 150,
  reinforced_shroud: 300,
  heavy_thermal_fairing: 450,
};

/**
 * Computes terminal touchdown / orbital deployment safety for a given EDL package & mission.
 */
export function computeTouchdownSpeed(edl, selectedMission) {
  const missionId = selectedMission?.id || '';
  const atmo = selectedMission?.atmosphereType ?? 'DENSE';

  if (missionId === 'leo-sat-01' || (atmo === 'DENSE' && selectedMission?.requiredPayloadName === 'Satellite')) {
    return {
      speedMs: 0,
      maxSafe: 5.0,
      safe: true,
      label: 'ORBITAL (0 m/s)',
    };
  }

  if (!edl) {
    return { speedMs: 999, maxSafe: 5.0, label: 'NO EDL', safe: false };
  }

  const maxSafe = selectedMission?.maxSafeTouchdownSpeedMs ?? selectedMission?.maxTouchdownSpeed ?? 5.0;

  let speedMs = edl.touchdownSpeedMs ?? 999;
  if (atmo === 'VACUUM') {
    speedMs = edl.retroThrusters ? (edl.touchdownSpeedMs ?? 2.0) : 1700;
  } else if (atmo === 'THIN_CO2') {
    if (!edl.heatshield) speedMs = 4500;
    else if (edl.retroThrusters) speedMs = edl.touchdownSpeedMs ?? 2.0;
    else if (edl.parachute) speedMs = 62;
    else speedMs = 320;
  } else {
    if (edl.retroThrusters) speedMs = edl.touchdownSpeedMs ?? 2.0;
    else if (edl.parachute) speedMs = edl.touchdownSpeedMs ?? 4.8;
    else speedMs = 140;
  }

  return {
    speedMs,
    maxSafe,
    safe: speedMs <= maxSafe,
    label: speedMs > 900 ? 'IMPACT' : `${speedMs.toFixed(1)} m/s`,
  };
}

/**
 * Computes deterministic mass, thrust, TWR, Delta-V, reliability, and touchdown speed.
 */
export function computeRocketPhysics(rocketConfig, selectedMission) {
  const { nosecone, avionicsPayload, edlSystem, upperStage, propellantTank, mainBooster } = rocketConfig || {};

  const fuelMassKg = propellantTank?.fuelMassKg ?? 0;
  const fuelTons = fuelMassKg / 1000;
  const propType = propellantTank?.propellantType ?? 'rp1_kerosene';
  const propOpt = PROPELLANT_OPTIONS.find((p) => p.id === propType) || PROPELLANT_OPTIONS[1];

  const dryMass =
    (nosecone?.dryMassKg ?? 0) +
    (avionicsPayload?.payloadMassKg ?? 0) +
    (edlSystem?.dryMassKg ?? 0) +
    (upperStage?.dryMassKg ?? 0) +
    (mainBooster?.dryMassKg ?? 0);

  const upperPropMass = upperStage?.propMassKg ?? 0;
  const totalMassKg = dryMass + fuelMassKg + upperPropMass;

  const boosterThrust = mainBooster?.thrustKn ?? 0;
  const upperThrust = upperStage?.thrustKn ?? 0;
  const totalThrustKn = boosterThrust + upperThrust * 0.15;

  // Liftoff TWR is always against Earth surface gravity (9.81 m/s^2)
  const twr = totalMassKg > 0 ? Number(((totalThrustKn * 1000) / (totalMassKg * 9.81)).toFixed(2)) : 0;

  // Deterministic Delta-V formula
  const boosterDv = mainBooster ? (BOOSTER_DV_MAP[mainBooster.id] ?? 3200) : 0;
  const srbCount = mainBooster?.straponCount ?? 0;
  const srbBonusDv = srbCount === 4 ? 3400 : srbCount === 2 ? 1800 : 0;
  const upperStageDv = upperStage ? (UPPER_STAGE_DV_MAP[upperStage.id] ?? 1800) : 0;
  const noseconeAeroBonus = nosecone ? (NOSECONE_AERO_BONUS_MAP[nosecone.id] ?? 150) : 0;
  const payloadKg = avionicsPayload?.payloadMassKg ?? 0;
  const propEfficiencyBonus = propType === 'liquid_methane' ? 250 : propType === 'solid' ? -200 : 0;

  const deltaV = Math.max(
    0,
    Math.round(
      boosterDv +
        srbBonusDv +
        upperStageDv +
        fuelTons * 55 +
        noseconeAeroBonus +
        propEfficiencyBonus -
        payloadKg * 0.25
    )
  );

  let reliability = 72;
  if (nosecone) reliability += nosecone.reliabilityBonus ?? 0;
  if (avionicsPayload) reliability += avionicsPayload.reliabilityBonus ?? 0;
  if (edlSystem) reliability -= edlSystem.reliabilityPenalty ?? 0;
  if (upperStage) reliability += upperStage.reliabilityBonus ?? 0;
  if (mainBooster) reliability += mainBooster.reliabilityBonus ?? 0;
  if (avionicsPayload) reliability += ((avionicsPayload.guidanceReliability ?? 88) - 88) / 2;
  if (propOpt?.id === 'liquid_methane') reliability += 2;
  reliability = Math.max(10, Math.min(99, Math.round(reliability)));

  return {
    totalMassKg: Math.round(totalMassKg),
    thrustKn: Math.round(totalThrustKn),
    twr,
    deltaV,
    reliabilityPct: reliability,
    touchdown: computeTouchdownSpeed(edlSystem, selectedMission),
  };
}

/**
 * Evaluates the 4 canonical Mission Constraints to determine willLand & exact failedConstraints.
 */
export function validateRocketForMission(rocketConfig, selectedMission) {
  const physics = computeRocketPhysics(rocketConfig, selectedMission);
  const missionId = selectedMission?.id || 'leo-sat-01';
  const minTwr = selectedMission?.minTwr ?? 1.25;
  const targetDv = selectedMission?.targetDeltaV ?? 9400;
  const requiredPayload = selectedMission?.requiredPayloadName ?? 'Satellite';

  const { nosecone, avionicsPayload, edlSystem, mainBooster, propellantTank, upperStage } = rocketConfig || {};
  const failedConstraints = [];

  // Constraint 1 — Payload Match
  const payloadOk = avionicsPayload?.targetPayload === requiredPayload;
  if (!payloadOk) {
    const expectedLabel =
      missionId === 'mars-rover-03'
        ? 'Mars Rover'
        : missionId === 'lunar-lander-02'
        ? 'Lunar Lander'
        : 'Weather Satellite';
    failedConstraints.push({
      id: 'PAYLOAD',
      code: 'PAYLOAD_MISMATCH',
      slotKey: 'avionicsPayload',
      phase: 'ORBIT_INSERT',
      label: `Payload: Equip ${expectedLabel}`,
      reason: `Payload mismatch detected. Mission flight envelope requires ${expectedLabel} bus. Currently equipped: ${avionicsPayload?.shortLabel || 'Unassigned'}.`,
      fixTip: `Payload Bay (Slot 05): Integrate certified '${expectedLabel}' bus`,
    });
  }

  // Constraint 2 — Lift Power (TWR >= Min TWR)
  if (!mainBooster || physics.twr < minTwr) {
    const recommendedBooster =
      missionId === 'mars-rover-03'
        ? "'Super Heavy + 4x SRBs'"
        : missionId === 'lunar-lander-02'
        ? "'Tri-Core' or 'Heavy + 2x SRBs'"
        : "'Single Core' or 'Tri-Core'";
    failedConstraints.push({
      id: 'TWR',
      code: 'TWR_LOW',
      slotKey: 'mainBooster',
      phase: 'LIFTOFF',
      label: `Liftoff TWR ${physics.twr.toFixed(2)} < ${minTwr.toFixed(2)}`,
      reason: `Liftoff thrust-to-weight ratio (${physics.twr.toFixed(2)}) is below minimum margin (${minTwr.toFixed(2)}) — vehicle lacks sufficient liftoff thrust.`,
      fixTip: `Main Booster (Slot 01): Equip ${recommendedBooster} to satisfy TWR >= ${minTwr.toFixed(2)}`,
    });
  } else if (physics.twr > 5.0) {
    failedConstraints.push({
      id: 'TWR',
      code: 'OVER_G',
      slotKey: 'mainBooster',
      phase: 'MAX_Q',
      label: `Over-G TWR ${physics.twr.toFixed(2)} > 5.00`,
      reason: `Liftoff acceleration (${physics.twr.toFixed(2)} G) exceeds maximum dynamic pressure structural limits at Max-Q.`,
      fixTip: 'Main Booster (Slot 01) / Fuel Tank (Slot 02): Increase propellant load or step down booster thrust',
    });
  }

  // Constraint 3 — Flight Range (Delta-V >= Target Delta-V)
  if (physics.deltaV < targetDv) {
    const shortfall = targetDv - physics.deltaV;
    const fuelRec =
      missionId === 'mars-rover-03'
        ? '95t+'
        : missionId === 'lunar-lander-02'
        ? '70t+'
        : '45t+';
    const stageRec =
      missionId === 'mars-rover-03'
        ? "'Methalox Stage'"
        : missionId === 'lunar-lander-02'
        ? "'Hydrolox' or 'Methalox Stage'"
        : "'Solid Kick' or 'Hydrolox'";
    const missingParts = [];
    if (!propellantTank || (propellantTank.fuelMassKg ?? 0) < (missionId === 'mars-rover-03' ? 90000 : missionId === 'lunar-lander-02' ? 65000 : 40000)) {
      missingParts.push(`Propellant Tank (Slot 02): Increase fuel mass to >= ${fuelRec}`);
    }
    if (!upperStage || (missionId === 'mars-rover-03' && upperStage.id !== 'methalox_deep_space')) {
      missingParts.push(`Upper Vacuum Stage (Slot 03): Equip ${stageRec}`);
    }
    if (missingParts.length === 0) {
      missingParts.push(`Slot 1 (Booster) / Slot 2 (Fuel): Upgrade booster or slide fuel to ${fuelRec}`);
    }

    failedConstraints.push({
      id: 'DELTAV',
      code: 'DELTAV_LOW',
      slotKey: !upperStage ? 'upperStage' : 'propellantTank',
      phase: 'ASCENT_BURN',
      label: `Delta-V ${physics.deltaV.toLocaleString()} < ${targetDv.toLocaleString()} m/s`,
      reason: `Your Delta-V is ${shortfall.toLocaleString()} m/s short (${physics.deltaV.toLocaleString()} vs ${targetDv.toLocaleString()} m/s needed) — rocket will run out of fuel before reaching target!`,
      fixTip: missingParts.join(' • '),
    });
  }

  // Constraint 4 — Mission Recovery / Orbit System (EDL & Fairing)
  if (missionId === 'leo-sat-01') {
    if (!nosecone) {
      failedConstraints.push({
        id: 'RECOVERY',
        code: 'FAIRING_FAIL',
        slotKey: 'nosecone',
        phase: 'MAX_Q',
        label: 'Missing Aerodynamic Fairing',
        reason: 'Satellite exposed to supersonic airflow during Earth ascent — aerodynamic shear destroys payload at Max-Q.',
        fixTip: "Slot 6 (Nosecone): Select any Fairing (e.g. 'Std. Ogive')",
      });
    }
  } else if (missionId === 'lunar-lander-02') {
    if (!edlSystem?.retroThrusters) {
      failedConstraints.push({
        id: 'RECOVERY',
        code: 'EDL_FAIL',
        slotKey: 'edlSystem',
        phase: 'TERMINAL_DESCENT',
        label: 'Moon Vacuum Requires Retro-Thrusters',
        reason:
          edlSystem?.parachute
            ? 'Parachutes alone FAIL on the airless Moon (0 kPa vacuum) — lander will slam into the crater!'
            : 'No powered retro-thrusters equipped — lander cannot brake in lunar vacuum.',
        fixTip: "Slot 4 (EDL): Select 'Full Heatshield + Chute + Retro + Legs'",
      });
    }
  } else if (missionId === 'mars-rover-03') {
    const hasFullEdl = Boolean(edlSystem?.heatshield && edlSystem?.parachute && edlSystem?.retroThrusters);
    const hasMarsFairing = nosecone?.id === 'heavy_thermal_fairing' || nosecone?.id === 'reinforced_shroud';

    if (!edlSystem?.heatshield) {
      failedConstraints.push({
        id: 'RECOVERY',
        code: 'NO_HEATSHIELD',
        slotKey: 'edlSystem',
        phase: 'ENTRY_DESCENT',
        label: 'Missing Mars Ablative Heatshield',
        reason: 'Spacecraft enters Mars thin CO₂ atmosphere at Mach 25 without a heatshield — burns up in 1,650 °C plasma!',
        fixTip: "Slot 4 (EDL): Select 'Full Heatshield + Chute + Retro + Legs'",
      });
    } else if (!hasFullEdl) {
      failedConstraints.push({
        id: 'RECOVERY',
        code: 'EDL_FAIL',
        slotKey: 'edlSystem',
        phase: 'TERMINAL_DESCENT',
        label: 'Mars Requires Full EDL (Heat + Chute + Retro)',
        reason: 'Thin Martian air (0.6 kPa) cannot slow parachutes below 60 m/s — retro-thrusters are mandatory for soft rover touchdown.',
        fixTip: "Slot 4 (EDL): Select 'Full Heatshield + Chute + Retro + Legs'",
      });
    } else if (!hasMarsFairing) {
      failedConstraints.push({
        id: 'RECOVERY',
        code: 'FAIRING_FAIL',
        slotKey: 'nosecone',
        phase: 'MAX_Q',
        label: 'Requires Thermal / Reinforced Fairing',
        reason: 'Standard Ogive fairing cannot protect the Mars Rover through severe ascent & interplanetary thermal loads.',
        fixTip: "Slot 6 (Nosecone): Select 'Heavy Thermal Fairing' (or 'Reinforced Aero-Shroud')",
      });
    }
  }

  const willLand = failedConstraints.length === 0;
  const primaryFailure = failedConstraints[0] || null;

  return {
    willLand,
    failedConstraints,
    primaryFailure,
    failureReason: primaryFailure?.reason || null,
    physics,
  };
}
