import { soundEngine } from '../utils/soundEffects';

/**
 * Caution hazard-stripe accent bar.
 */
export function HazardStripeBar({ className = '' }) {
  return (
    <div
      className={`h-1.5 w-full ${className}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(-45deg, #f59e0b 0 8px, #0a0e17 8px 16px)',
      }}
    />
  );
}

/**
 * Corner screw rivets for spacecraft hardware consoles.
 */
export function CornerRivets({ color = '#475569' }) {
  const rivetStyle = {
    background: `radial-gradient(circle at 35% 35%, #cbd5e1 0%, ${color} 60%, #0f172a 100%)`,
    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4), 0 1px 2px rgba(0,0,0,0.8)',
  };
  return (
    <>
      <span className="pointer-events-none absolute left-1.5 top-1.5 z-20 h-1.5 w-1.5 rounded-full" style={rivetStyle} />
      <span className="pointer-events-none absolute right-1.5 top-1.5 z-20 h-1.5 w-1.5 rounded-full" style={rivetStyle} />
      <span className="pointer-events-none absolute bottom-1.5 left-1.5 z-20 h-1.5 w-1.5 rounded-full" style={rivetStyle} />
      <span className="pointer-events-none absolute bottom-1.5 right-1.5 z-20 h-1.5 w-1.5 rounded-full" style={rivetStyle} />
    </>
  );
}

const BUTTON_VARIANTS = {
  cyan: {
    bg: 'bg-gradient-to-b from-[#0e3a53] to-[#082233] hover:from-[#124b6b] hover:to-[#0a2b40]',
    bevel: 'border-b-4 border-cyan-700 active:border-b-0 active:translate-y-1',
    ring: 'border border-cyan-400/50',
    text: 'text-cyan-100',
    led: '#00F0FF',
  },
  amber: {
    bg: 'bg-gradient-to-b from-[#b45309] to-[#78350f] hover:from-[#d97706] hover:to-[#92400e]',
    bevel: 'border-b-4 border-amber-900 active:border-b-0 active:translate-y-1',
    ring: 'border border-amber-400/70',
    text: 'text-amber-50',
    led: '#F59E0B',
  },
  orange: {
    bg: 'bg-gradient-to-b from-[#ea580c] to-[#9a3412] hover:from-[#f97316] hover:to-[#c2410c]',
    bevel: 'border-b-4 border-orange-950 active:border-b-0 active:translate-y-1',
    ring: 'border border-orange-300/70',
    text: 'text-white',
    led: '#FF6B1A',
  },
  emerald: {
    bg: 'bg-gradient-to-b from-[#047857] to-[#064e3b] hover:from-[#059669] hover:to-[#065f46]',
    bevel: 'border-b-4 border-emerald-950 active:border-b-0 active:translate-y-1',
    ring: 'border border-emerald-400/60',
    text: 'text-emerald-50',
    led: '#10B981',
  },
  danger: {
    bg: 'bg-gradient-to-b from-[#b91c1c] to-[#7f1d1d] hover:from-[#dc2626] hover:to-[#991b1b]',
    bevel: 'border-b-4 border-red-950 active:border-b-0 active:translate-y-1',
    ring: 'border border-red-400/60',
    text: 'text-red-50',
    led: '#EF4444',
  },
  slate: {
    bg: 'bg-gradient-to-b from-[#1e293b] to-[#0f172a] hover:from-[#334155] hover:to-[#1e293b]',
    bevel: 'border-b-4 border-slate-950 active:border-b-0 active:translate-y-1',
    ring: 'border border-slate-500/40',
    text: 'text-slate-200',
    led: '#94A3B8',
  },
};

/**
 * 3D Tactile Push-Button with metallic bottom bevel, angled chamfered corners,
 * screw rivets, glowing LED dot, and optional hazard-stripe accent.
 */
export function TactileButton({
  children,
  onClick,
  disabled = false,
  variant = 'cyan',
  ledOn = true,
  hazard = false,
  className = '',
  title,
}) {
  const style = BUTTON_VARIANTS[variant] || BUTTON_VARIANTS.cyan;

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseEnter={() => {
        if (!disabled) soundEngine.playHoverChirp();
      }}
      onClick={onClick}
      className={`group relative overflow-hidden px-3.5 py-2 font-display text-[11px] font-bold tracking-wider transition-all duration-75 disabled:cursor-not-allowed disabled:opacity-45 ${style.bg} ${style.bevel} ${style.ring} ${style.text} ${className}`}
      style={{
        clipPath: 'polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)',
        boxShadow: disabled ? 'none' : '0 4px 14px rgba(0, 0, 0, 0.55)',
      }}
    >
      {hazard && <HazardStripeBar className="absolute inset-x-0 top-0 h-1 opacity-90" />}

      {/* Subtle top metallic highlight */}
      <span className="pointer-events-none absolute inset-x-2 top-0.5 h-[1px] bg-white/25" />

      <span className="relative z-10 flex items-center justify-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full transition-all"
          style={{
            backgroundColor: ledOn && !disabled ? style.led : '#334155',
            boxShadow: ledOn && !disabled ? `0 0 8px ${style.led}` : 'none',
          }}
        />
        {children}
      </span>
    </button>
  );
}

/**
 * Physical Spacecraft Hardware Toggle Switch for X-Ray Internal View.
 */
export function HardwareToggleSwitch({ checked, onChange, label = 'X-RAY INTERNAL VIEW' }) {
  return (
    <button
      type="button"
      onMouseEnter={() => soundEngine.playHoverChirp()}
      onClick={() => {
        soundEngine.playClickSound();
        onChange(!checked);
      }}
      className={`relative flex items-center gap-2.5 border-b-4 px-3.5 py-2 transition-all active:translate-y-0.5 active:border-b-2 ${
        checked
          ? 'border-cyan-700 bg-gradient-to-b from-[#0b334a] to-[#061c2b] shadow-[0_0_22px_rgba(0,240,255,0.35)]'
          : 'border-slate-950 bg-gradient-to-b from-[#172133] to-[#0b111e] shadow-[0_4px_14px_rgba(0,0,0,0.6)]'
      }`}
      style={{
        clipPath: 'polygon(10px 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
      }}
    >
      <CornerRivets color={checked ? '#38BDF8' : '#475569'} />

      {/* Status LED */}
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full transition-all"
        style={{
          backgroundColor: checked ? '#00F0FF' : '#334155',
          boxShadow: checked ? '0 0 10px #00F0FF' : 'inset 0 1px 2px rgba(0,0,0,0.8)',
        }}
      />

      <span className={`font-display text-[11px] font-extrabold tracking-widest ${checked ? 'text-[#00F0FF]' : 'text-slate-300'}`}>
        {label}
      </span>

      {/* Physical Switch Track */}
      <span
        className={`relative flex h-5 w-10 items-center border p-0.5 transition-colors ${
          checked ? 'border-cyan-400/70 bg-cyan-950' : 'border-slate-600/60 bg-slate-950'
        }`}
      >
        <span
          className={`h-3.5 w-4 border-b-2 transition-transform duration-150 ${
            checked
              ? 'translate-x-4 border-cyan-900 bg-cyan-300 shadow-[0_0_8px_#00F0FF]'
              : 'translate-x-0 border-slate-800 bg-slate-400'
          }`}
        />
      </span>
    </button>
  );
}

/**
 * Bespoke Spacecraft Hardware Console Panel with chamfered edges, metallic bezel, and rivets.
 */
export function HardwareConsolePanel({
  children,
  className = '',
  accent = '#00F0FF',
  hazardTop = false,
}) {
  return (
    <div
      className={`relative border bg-gradient-to-b from-[#0b1426]/95 to-[#060b16]/95 shadow-[0_8px_28px_rgba(0,0,0,0.75)] backdrop-blur-md ${className}`}
      style={{
        borderColor: `${accent}55`,
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))',
      }}
    >
      {hazardTop && <HazardStripeBar />}
      <CornerRivets color="#64748B" />
      <div className="hud-scanlines pointer-events-none absolute inset-0 opacity-45" />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}

/**
 * Industrial Throttle-Style Fuel Mass Slider with tick marks & live readout.
 */
export function TactileFuelSlider({ value, min, max, step = 1000, onChange }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative border border-emerald-500/35 bg-[#060d18] p-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-display text-[10px] font-bold tracking-widest text-emerald-300">
          PROPELLANT LOAD
        </span>
        <span className="telemetry-num text-sm font-extrabold text-[#10B981]">
          {value.toLocaleString()} <span className="text-[10px] text-slate-400">kg</span>
        </span>
      </div>

      {/* Track bar with fill */}
      <div className="relative flex h-6 items-center">
        <div className="pointer-events-none absolute inset-x-0 h-2.5 border border-slate-700 bg-slate-950">
          <div
            className="h-full bg-gradient-to-r from-emerald-700 to-[#10B981] transition-all duration-75"
            style={{ width: `${pct}%`, boxShadow: '0 0 10px rgba(16,185,129,0.5)' }}
          />
        </div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const nextVal = Number(e.target.value);
            soundEngine.playHydraulicHum((nextVal - min) / (max - min));
            onChange(nextVal);
          }}
          className="relative z-10 h-6 w-full cursor-pointer appearance-none bg-transparent accent-emerald-400"
        />
      </div>

      {/* Tick marks */}
      <div className="mt-1 flex justify-between px-0.5">
        {[10, 30, 50, 75, 100, 120].map((t) => (
          <span key={t} className="telemetry-num text-[8px] text-slate-500">
            {t}t
          </span>
        ))}
      </div>
    </div>
  );
}
