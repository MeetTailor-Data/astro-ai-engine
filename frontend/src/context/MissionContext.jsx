import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createInitialRocketConfig } from '../data/rocketAnatomy';
import { checkSimulatorHealth, fetchMissionProfiles } from '../services/api';

export const MISSION_STEPS = {
  COMMAND_CENTER: 'COMMAND_CENTER',
  MISSION_SELECT: 'MISSION_SELECT',
  ROCKET_BUILDER: 'ROCKET_BUILDER',
  LAUNCH_CONTROL: 'LAUNCH_CONTROL',
  MISSION_OUTCOME: 'MISSION_OUTCOME',
};

const MissionContext = createContext(null);

export function MissionProvider({ children }) {
  const [simulatorStatus, setSimulatorStatus] = useState({
    online: false,
    mode: 'LOCAL_PHYSICS_SIM',
    message: 'Probing Astro-AI Simulator...',
  });
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);

  const [currentStep, setCurrentStep] = useState(MISSION_STEPS.COMMAND_CENTER);
  const [missionProfiles, setMissionProfiles] = useState([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [selectedMission, setSelectedMission] = useState(null);

  const [rocketConfig, setRocketConfig] = useState(() => createInitialRocketConfig());
  const [activeMissionId, setActiveMissionId] = useState(null);
  const [telemetryLog, setTelemetryLog] = useState([]);
  const [missionResult, setMissionResult] = useState(null);
  const [agencyStats, setAgencyStats] = useState({
    fundsM: 250,
    scienceRp: 1420,
    supportPct: 84,
  });

  const applyMissionRewards = useCallback(({ fundsDelta = 0, scienceDelta = 0, supportDelta = 0 }) => {
    setAgencyStats((prev) => ({
      fundsM: Math.max(0, prev.fundsM + fundsDelta),
      scienceRp: Math.max(0, prev.scienceRp + scienceDelta),
      supportPct: Math.max(0, Math.min(100, prev.supportPct + supportDelta)),
    }));
  }, []);

  const recheckSimulatorHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    const status = await checkSimulatorHealth();
    setSimulatorStatus(status);
    setIsCheckingHealth(false);
    return status;
  }, []);

  const reloadMissionProfiles = useCallback(async () => {
    setIsLoadingProfiles(true);
    const profiles = await fetchMissionProfiles();
    setMissionProfiles(profiles);
    setSelectedMission((prev) => prev || profiles[0] || null);
    setIsLoadingProfiles(false);
    return profiles;
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const [health, profiles] = await Promise.all([
        checkSimulatorHealth(),
        fetchMissionProfiles(),
      ]);
      if (!active) return;
      setSimulatorStatus(health);
      setIsCheckingHealth(false);
      setMissionProfiles(profiles);
      setSelectedMission((prev) => prev || profiles[0] || null);
      setIsLoadingProfiles(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const updateRocketSlot = useCallback((slotKey, partValue) => {
    setRocketConfig((prev) => ({
      ...prev,
      [slotKey]: partValue,
    }));
  }, []);

  const updateRocketMetrics = useCallback((metrics) => {
    setRocketConfig((prev) => ({
      ...prev,
      ...metrics,
    }));
  }, []);

  const appendTelemetryTick = useCallback((tick) => {
    setTelemetryLog((prev) => [...prev, tick]);
  }, []);

  const clearTelemetryLog = useCallback(() => {
    setTelemetryLog([]);
  }, []);

  const resetFlightSession = useCallback(() => {
    setActiveMissionId(null);
    setTelemetryLog([]);
    setMissionResult(null);
  }, []);

  const value = {
    simulatorStatus,
    isCheckingHealth,
    recheckSimulatorHealth,
    currentStep,
    setCurrentStep,
    missionProfiles,
    isLoadingProfiles,
    reloadMissionProfiles,
    selectedMission,
    setSelectedMission,
    rocketConfig,
    setRocketConfig,
    updateRocketSlot,
    updateRocketMetrics,
    activeMissionId,
    setActiveMissionId,
    telemetryLog,
    setTelemetryLog,
    appendTelemetryTick,
    clearTelemetryLog,
    missionResult,
    setMissionResult,
    resetFlightSession,
    agencyStats,
    applyMissionRewards,
  };

  return <MissionContext.Provider value={value}>{children}</MissionContext.Provider>;
}

export function useMission() {
  const ctx = useContext(MissionContext);
  if (!ctx) {
    throw new Error('useMission must be used inside a MissionProvider');
  }
  return ctx;
}
