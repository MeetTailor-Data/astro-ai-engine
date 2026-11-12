import { useEffect, useState } from 'react';
import { soundEngine } from '../utils/soundEffects';

/**
 * Chamfered Sci-Fi Game HUD Panel with metallic rim, corner brackets, rivets, and scanline overlay.
 */
export function ChamferPanel({
  children,
  className = '',
  innerClassName = '',
  variant = 'cyan', // 'cyan' | 'amber'
  showRivets = true,
}) {
  const shellClass = variant === 'amber' ? 'hud-shell-amber' : 'hud-shell';
  const bracketColor = variant === 'amber' ? '#FF6B1A' : '#00F0FF';

  return (
    <div className={`relative ${shellClass} ${className}`}>
      <div className={`hud-inner relative h-full w-full ${innerClassName}`}>
        {/* Subtle tactical scanline overlay */}
        <div className="hud-scanlines pointer-events-none absolute inset-0 z-0 opacity-60" />

        {/* Corner Brackets & Rivets */}
        {showRivets && (
          <>
            <span
              className="pointer-events-none absolute left-1.5 top-1.5 z-20 h-2.5 w-2.5 border-l-2 border-t-2 opacity-80"
              style={{ borderColor: bracketColor }}
            />
            <span
              className="pointer-events-none absolute bottom-1.5 right-1.5 z-20 h-2.5 w-2.5 border-b-2 border-r-2 opacity-80"
              style={{ borderColor: bracketColor }}
            />
            <span
              className="pointer-events-none absolute left-3 top-1.5 z-20 h-1 w-1 rounded-full opacity-70"
              style={{ backgroundColor: bracketColor }}
            />
            <span
              className="pointer-events-none absolute right-5 top-1.5 z-20 h-1 w-1 rounded-full opacity-70"
              style={{ backgroundColor: bracketColor }}
            />
          </>
        )}

        <div className="relative z-10 h-full w-full">{children}</div>
      </div>
    </div>
  );
}

/**
 * Animated SVG Character Portrait for Commander Rudra (Flight Director) & Chief Engineer Maya.
 * Features blinking eyes, animated headset boom mic, and live audio speaking waveform.
 */
export function CrewPortrait({ character = 'rudra', isSpeaking = false, size = 88 }) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [micOffset, setMicOffset] = useState(0);

  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    }, 3400);
    return () => clearInterval(blinkTimer);
  }, []);

  useEffect(() => {
    if (!isSpeaking) return undefined;
    const talkTimer = setInterval(() => {
      setMicOffset((prev) => (prev === 0 ? 1 : 0));
    }, 130);
    return () => clearInterval(talkTimer);
  }, [isSpeaking]);

  const activeMicOffset = isSpeaking ? micOffset : 0;

  const isMaya = character === 'maya';
  const accent = isMaya ? '#FF6B1A' : '#00F0FF';
  const suitPrimary = isMaya ? '#C2410C' : '#0E7490';
  const suitTrim = isMaya ? '#FDBA74' : '#67E8F9';
  const skinTone = isMaya ? '#D99B78' : '#C68B66';
  const hairColor = isMaya ? '#1E1B2E' : '#111827';

  return (
    <div
      className="relative shrink-0 overflow-hidden border bg-[#050A16]"
      style={{
        width: size,
        height: size,
        borderColor: `${accent}66`,
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
      }}
    >
      {/* Background holographic grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 35%, ${accent}44, transparent 70%)`,
        }}
      />

      <svg viewBox="0 0 100 100" className="relative z-10 h-full w-full">
        {/* Flight Suit Shoulders */}
        <path
          d="M12 100 C16 76, 30 70, 50 70 C70 70, 84 76, 88 100 Z"
          fill={suitPrimary}
        />
        <path
          d="M28 73 L40 100 M72 73 L60 100"
          stroke={suitTrim}
          strokeWidth="2.5"
          opacity="0.85"
        />
        {/* Collar */}
        <rect x="38" y="64" width="24" height="10" rx="3" fill="#1E293B" stroke={accent} strokeWidth="1" />

        {/* Neck */}
        <rect x="43" y="56" width="14" height="12" rx="4" fill={skinTone} />

        {/* Maya ponytail / hair back */}
        {isMaya && (
          <path
            d="M26 32 C22 50, 26 66, 34 72 L66 72 C74 66, 78 50, 74 32 Z"
            fill={hairColor}
          />
        )}

        {/* Head */}
        <ellipse cx="50" cy="40" rx="17" ry="20" fill={skinTone} />

        {/* Hair Top */}
        {isMaya ? (
          <path
            d="M31 36 C31 20, 42 15, 52 16 C64 17, 69 25, 69 36 C63 29, 55 28, 46 30 C39 31, 35 33, 31 36 Z"
            fill={hairColor}
          />
        ) : (
          <path
            d="M32 34 C33 19, 43 16, 51 16 C61 16, 67 22, 68 34 C63 26, 56 24, 48 25 C40 26, 35 29, 32 34 Z"
            fill={hairColor}
          />
        )}

        {/* Eyebrows */}
        <path d="M38 34 Q42 32 45 34" stroke="#1E293B" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M55 34 Q58 32 62 34" stroke="#1E293B" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Blinking Eyes */}
        {isBlinking ? (
          <>
            <line x1="38" y1="39" x2="45" y2="39" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
            <line x1="55" y1="39" x2="62" y2="39" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="41.5" cy="39" rx="2.6" ry="2.2" fill="#0F172A" />
            <circle cx="42.3" cy="38.2" r="0.8" fill="#FFFFFF" />
            <ellipse cx="58.5" cy="39" rx="2.6" ry="2.2" fill="#0F172A" />
            <circle cx="59.3" cy="38.2" r="0.8" fill="#FFFFFF" />
          </>
        )}

        {/* Nose */}
        <path d="M50 40 L48.5 46 L51 47" stroke="#9A6144" strokeWidth="1.3" fill="none" strokeLinecap="round" />

        {/* Animated Speaking Mouth */}
        {isSpeaking && activeMicOffset === 1 ? (
          <ellipse cx="50" cy="52" rx="4.2" ry="2.3" fill="#4C1D24" />
        ) : (
          <path d="M45 51.5 Q50 54 55 51.5" stroke="#6B2D35" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}

        {/* Comms Headset Band + Earcup */}
        <path d="M31 38 C30 16, 70 16, 69 38" stroke="#334155" strokeWidth="3.2" fill="none" />
        <rect x="27" y="34" width="6" height="12" rx="2.5" fill="#1E293B" stroke={accent} strokeWidth="1.2" />
        <rect x="67" y="34" width="6" height="12" rx="2.5" fill="#1E293B" stroke={accent} strokeWidth="1.2" />

        {/* Moving Boom Mic */}
        <g transform={`translate(0, ${activeMicOffset * 1.2})`}>
          <path d="M30 43 Q34 54 46 53" stroke="#94A3B8" strokeWidth="1.6" fill="none" />
          <circle cx="46" cy="53" r="2.2" fill={accent} />
        </g>

        {/* Holographic HUD Visor Overlay (semi-transparent) */}
        <path
          d="M35 35 L65 35 L63 43 L37 43 Z"
          fill={accent}
          opacity="0.14"
        />
      </svg>

      {/* Live Audio Equalizer Bar at bottom of portrait */}
      <div className="absolute bottom-1 right-1.5 z-20 flex items-end gap-0.5">
        {[0.5, 1, 0.7, 0.9].map((h, idx) => (
          <span
            key={idx}
            className="w-1 transition-all duration-100"
            style={{
              height: isSpeaking ? `${Math.round((activeMicOffset === 1 ? h : 1.15 - h * 0.6) * 11)}px` : '3px',
              backgroundColor: accent,
              opacity: isSpeaking ? 0.95 : 0.4,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Typewriter Dialogue Box with Web Audio voice-blip effects.
 */
export function TypewriterDialogue({
  text,
  pitchOffset = 0,
  speedMs = 20,
  onSpeakingChange,
  className = '',
}) {
  const [progress, setProgress] = useState({ text: '', count: 0 });

  useEffect(() => {
    if (!text) {
      onSpeakingChange?.(false);
      return undefined;
    }

    onSpeakingChange?.(true);
    let idx = 0;
    const timer = setInterval(() => {
      idx += 1;
      setProgress({ text, count: idx });
      const ch = text[idx - 1];
      if (ch && ch !== ' ' && idx % 2 === 1) {
        soundEngine.playDialogueBlip(pitchOffset);
      }
      if (idx >= text.length) {
        clearInterval(timer);
        onSpeakingChange?.(false);
      }
    }, speedMs);

    return () => {
      clearInterval(timer);
      onSpeakingChange?.(false);
    };
  }, [text, pitchOffset, speedMs, onSpeakingChange]);

  const visibleCount = progress.text === text ? progress.count : 0;
  const shown = (text || '').slice(0, visibleCount);
  const done = visibleCount >= (text || '').length;

  return (
    <p className={`text-[13px] leading-snug text-slate-200 ${className}`}>
      {shown}
      {!done && <span className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-[#00F0FF] align-middle" />}
    </p>
  );
}
