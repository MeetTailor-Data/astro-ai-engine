import { useEffect, useState } from 'react';
import {
  Award,
  DollarSign,
  FlaskConical,
  RefreshCw,
  Rocket,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useMission } from '../context/MissionContext';
import { soundEngine } from '../utils/soundEffects';

export default function TopNavbar() {
  const {
    simulatorStatus,
    isCheckingHealth,
    recheckSimulatorHealth,
    agencyStats,
  } = useMission();

  const [isMuted, setIsMuted] = useState(() => soundEngine.isMuted());

  useEffect(() => {
    return soundEngine.subscribe((muted) => setIsMuted(muted));
  }, []);

  const isOnline = simulatorStatus?.online;

  return (
    <header className="pointer-events-auto relative z-40 flex h-14 w-full shrink-0 items-center justify-between border-b border-[#00F0FF]/30 bg-[#050811]/88 px-3 backdrop-blur-md sm:px-5">
      {/* Subtle top accent trace line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#FF6B1A] via-[#00F0FF] to-[#10B981] opacity-75" />

      {/* LEFT: Agency Emblem */}
      <div className="flex items-center gap-2.5">
        <div
          className="relative flex h-9 w-9 shrink-0 items-center justify-center border border-[#00F0FF]/60 bg-[#0A1328] shadow-[0_0_14px_rgba(0,240,255,0.25)]"
          style={{
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          }}
        >
          <Rocket className="h-4 w-4 text-[#00F0FF]" />
        </div>
        <div className="leading-tight whitespace-nowrap">
          <div className="font-display text-xs font-extrabold tracking-[0.16em] text-white sm:text-sm">
            AESTRO <span className="text-[#FF6B1A]">AI</span>
          </div>
          <div className="telemetry-num text-[10px] tracking-[0.2em] text-[#00F0FF]/80">
            ORBITAL COMMAND // PAD-39A
          </div>
        </div>
      </div>

      {/* CENTER: Mars Horizon Agency Resource Counters */}
      <div className="flex items-center gap-2">
        <div className="hud-chamfer-sm flex items-center gap-1.5 border border-amber-500/35 bg-[#0A1224]/90 px-3 py-1 whitespace-nowrap">
          <DollarSign className="h-3.5 w-3.5 shrink-0 text-amber-400" />
          <div className="leading-none">
            <span className="block text-[9px] font-bold tracking-widest text-slate-400">FUNDS</span>
            <span className="telemetry-num text-xs font-bold text-amber-300">${agencyStats?.fundsM ?? 250}M</span>
          </div>
        </div>

        <div className="hud-chamfer-sm flex items-center gap-1.5 border border-[#00F0FF]/35 bg-[#0A1224]/90 px-3 py-1 whitespace-nowrap">
          <FlaskConical className="h-3.5 w-3.5 shrink-0 text-[#00F0FF]" />
          <div className="leading-none">
            <span className="block text-[9px] font-bold tracking-widest text-slate-400">SCIENCE</span>
            <span className="telemetry-num text-xs font-bold text-[#00F0FF]">
              {(agencyStats?.scienceRp ?? 1420).toLocaleString()} RP
            </span>
          </div>
        </div>

        <div className="hud-chamfer-sm flex items-center gap-1.5 border border-[#10B981]/35 bg-[#0A1224]/90 px-3 py-1 whitespace-nowrap">
          <Award className="h-3.5 w-3.5 shrink-0 text-[#10B981]" />
          <div className="leading-none">
            <span className="block text-[9px] font-bold tracking-widest text-slate-400">SUPPORT</span>
            <span className="telemetry-num text-xs font-bold text-[#10B981]">{agencyStats?.supportPct ?? 84}%</span>
          </div>
        </div>
      </div>

      {/* RIGHT: Sound Mute/Unmute + Live GET /api/health Comms Link LED */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <button
          type="button"
          onMouseEnter={() => soundEngine.playHoverChirp()}
          onClick={() => {
            const nextMuted = soundEngine.toggleMute();
            if (!nextMuted) {
              soundEngine.startAmbientHum();
            }
          }}
          className={`hud-chamfer-sm flex h-8 items-center gap-1.5 border px-2.5 text-[11px] font-bold tracking-wider transition-colors ${
            isMuted
              ? 'border-rose-500/45 bg-rose-950/30 text-rose-300 hover:border-rose-400'
              : 'border-[#00F0FF]/45 bg-[#0A1224] text-[#00F0FF] hover:border-[#00F0FF]'
          }`}
          title={isMuted ? 'Unmute Game Audio & Radio Hum' : 'Mute Game Audio'}
        >
          {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
          <span className="telemetry-num hidden sm:inline">{isMuted ? 'MUTED' : 'AUDIO ON'}</span>
        </button>

        {/* Live Comms LED + Ping */}
        <div
          className={`hud-chamfer-sm flex h-8 items-center gap-2 border px-2.5 text-[11px] font-semibold ${
            isOnline
              ? 'border-[#10B981]/50 bg-[#10B981]/12 text-[#10B981]'
              : 'border-amber-500/45 bg-amber-500/10 text-amber-300'
          }`}
          title={`GET /api/health — ${simulatorStatus?.message}`}
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                isOnline ? 'bg-[#10B981]' : 'bg-amber-400'
              }`}
            />
            <span
              className={`relative inline-flex h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor] ${
                isOnline ? 'bg-[#10B981]' : 'bg-amber-400'
              }`}
            />
          </span>
          <span className="telemetry-num hidden md:inline">
            {isOnline ? 'COMMS: LIVE :3000' : 'COMMS: LOCAL SIM'}
          </span>
          <button
            type="button"
            onMouseEnter={() => soundEngine.playHoverChirp()}
            onClick={() => {
              soundEngine.playClickSound();
              recheckSimulatorHealth();
            }}
            disabled={isCheckingHealth}
            className="ml-0.5 text-slate-300 transition-colors hover:text-white disabled:opacity-50"
            title="Ping GET /api/health"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isCheckingHealth ? 'animate-spin text-[#00F0FF]' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
}
