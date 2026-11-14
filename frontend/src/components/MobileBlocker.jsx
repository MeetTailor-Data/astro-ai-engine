import { useEffect, useState } from 'react';
import { AlertTriangle, Laptop, RotateCw, Smartphone, ChevronRight } from 'lucide-react';

export default function MobileBlocker() {
  const [isMobile, setIsMobile] = useState(false);
  const [bypassed, setBypassed] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check width or mobile touch user agent
      const isSmallScreen = window.innerWidth < 1024;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
      setIsMobile(isSmallScreen || (isMobileUA && window.innerWidth < 1200));
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile || bypassed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050811]/95 p-4 text-white backdrop-blur-xl">
      <div className="relative w-full max-w-md overflow-hidden rounded-xl border border-amber-500/50 bg-[#0B1528] p-6 shadow-[0_0_50px_rgba(245,158,11,0.2)]">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'linear-gradient(rgba(0, 240, 255, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 240, 255, 0.2) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Header Badge */}
        <div className="relative z-10 flex items-center gap-2 border-b border-amber-500/30 pb-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
            <AlertTriangle className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="font-display text-xs font-black tracking-widest text-amber-400">
              MISSION CONTROL ADVISORY
            </div>
            <div className="text-[10px] text-blue-200">AESTRO AI // HARDWARE COMPATIBILITY</div>
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 mt-4 space-y-4">
          <div>
            <h3 className="font-display text-base font-bold text-white">
              Desktop Workstation Required
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              AESTRO AI is a high-fidelity systems engineering simulator featuring real-time 3D WebGL
              rocket assembly, 6-constraint telemetry meters, and orbital launch control designed for
              desktop displays.
            </p>
          </div>

          {/* Action Boxes */}
          <div className="space-y-2.5">
            <div className="flex items-start gap-3 rounded-lg border border-cyan-500/30 bg-cyan-950/40 p-3">
              <Laptop className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
              <div className="text-xs">
                <div className="font-bold text-cyan-200">Recommended: Open on PC / Laptop</div>
                <div className="mt-0.5 text-[11px] text-slate-300">
                  Access <span className="font-mono text-cyan-300">astro-ai-engine.vercel.app</span> on a
                  computer for the full flight experience.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-950/30 p-3">
              <RotateCw className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="text-xs">
                <div className="font-bold text-amber-200">On Phone: Use Desktop Mode</div>
                <div className="mt-0.5 text-[11px] text-slate-300">
                  Tap browser menu (<span className="font-semibold text-white">⋮</span> or{' '}
                  <span className="font-semibold text-white">aA</span>) ➔ enable{' '}
                  <span className="font-semibold text-amber-300">&quot;Desktop Site&quot;</span> and rotate phone to
                  Landscape.
                </div>
              </div>
            </div>
          </div>

          {/* Override button */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => setBypassed(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 underline decoration-slate-600 underline-offset-4 hover:text-white"
            >
              Continue anyway in mobile view <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
