import { useEffect, useState } from 'react';
import { CheckCircle2, Users, User, XCircle } from 'lucide-react';
import { soundEngine } from '../utils/soundEffects';

const ROLES = [
  { key: 'propulsion', title: 'PROPULSION' },
  { key: 'spacecraft', title: 'SPACECRAFT' },
  { key: 'systems', title: 'POWER & COMMS' },
  { key: 'director', title: 'MISSION DIRECTOR' },
];

export function buildRoleChecks({ physics, validation, resources, mission }) {
  const minTwr = mission?.minTwr ?? 1.25;
  const targetDv = mission?.targetDeltaV ?? 9400;
  const codes = validation?.failedConstraints?.map((c) => c.code) || [];
  const has = (...c) => c.some((x) => codes.includes(x));
  const first = (arr) => arr.find(Boolean) || null;

  const result = (reason) => ({ ok: !reason, reason });

  return {
    propulsion: result(
      first([
        (physics?.twr ?? 0) < minTwr && `TWR ${(physics?.twr ?? 0).toFixed(2)} below ${minTwr.toFixed(2)}`,
        (physics?.twr ?? 0) > 5 && `TWR ${(physics?.twr ?? 0).toFixed(2)} exceeds 5.00 Max-Q limit`,
        (physics?.deltaV ?? 0) < targetDv && `ΔV short by ${(targetDv - (physics?.deltaV ?? 0)).toLocaleString()} m/s`,
      ])
    ),
    spacecraft: result(
      first([
        has('PAYLOAD_MISMATCH') && 'Wrong payload bus for this mission',
        has('NO_RETRO_JETS', 'NO_HEATSHIELD', 'EDL_FAIL') && 'EDL cannot survive this destination',
        has('FAIRING_FAIL') && 'Fairing inadequate for this mission',
      ])
    ),
    systems: result(
      first([
        (resources?.power?.marginPct ?? 0) < 0 && `Power deficit (${resources?.power?.marginPct ?? 0}%)`,
        (resources?.data?.marginDb ?? 0) < 0 && `Link margin ${resources?.data?.marginDb ?? 0} dB`,
      ])
    ),
    director: result(
      first([
        resources?.overBudget && `$${((resources?.costM ?? 0) - (resources?.capM ?? 0)).toFixed(1)}M over budget cap`,
        resources?.time?.late && `Schedule ${resources?.time?.months}/${resources?.time?.deadline} months`,
      ])
    ),
  };
}

export default function GoNoGoPanel({ checks, signature, teamMode, onTeamModeChange, onClearedChange }) {
  const [votes, setVotes] = useState({});

  // Any design change voids all approvals.
  useEffect(() => {
    setVotes({});
  }, [signature]);

  const isGo = (k) => Boolean(votes[k]) && checks?.[k]?.ok;
  const othersGo = ['propulsion', 'spacecraft', 'systems'].every(isGo);
  const cleared = othersGo && isGo('director');

  // Director approval is void if another role drops out.
  useEffect(() => {
    if (!othersGo) setVotes((v) => (v.director ? { ...v, director: false } : v));
  }, [othersGo]);

  useEffect(() => {
    onClearedChange?.(cleared);
  }, [cleared, onClearedChange]);

  const toggle = (k) => {
    if (!checks?.[k]?.ok) return;
    if (k === 'director' && !othersGo) return;
    soundEngine.playClickSound();
    setVotes((v) => ({ ...v, [k]: !v[k] }));
  };

  return (
    <div className="rounded-lg border border-blue-400/40 bg-[#0F3E8A]/85 p-2 text-white backdrop-blur-md">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="font-display text-[10px] font-extrabold tracking-wider text-amber-300">
          FLIGHT READINESS REVIEW
        </span>
        <div className="flex gap-1">
          {[
            { v: false, label: 'SOLO', Icon: User },
            { v: true, label: 'TEAM', Icon: Users },
          ].map(({ v, label, Icon }) => (
            <button
              key={label}
              type="button"
              onClick={() => onTeamModeChange?.(v)}
              className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                teamMode === v ? 'bg-amber-400 text-slate-950' : 'bg-blue-950/70 text-blue-100'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {teamMode && (
        <div className="grid grid-cols-2 gap-1.5">
          {ROLES.map((role) => {
            const chk = checks?.[role.key] || { ok: false, reason: 'Pending check' };
            const go = isGo(role.key);
            const locked = role.key === 'director' && !othersGo;
            return (
              <button
                key={role.key}
                type="button"
                disabled={!chk.ok || locked}
                onClick={() => toggle(role.key)}
                className={`rounded border p-1.5 text-left transition-all disabled:cursor-not-allowed ${
                  go
                    ? 'border-emerald-400 bg-emerald-900/60'
                    : chk.ok
                    ? 'border-blue-300/40 bg-blue-950/70 hover:bg-blue-900'
                    : 'border-rose-400/60 bg-rose-950/60'
                }`}
              >
                <div className="flex items-center justify-between text-[9px] font-extrabold tracking-wider">
                  <span>{role.title}</span>
                  {go ? (
                    <CheckCircle2 className="h-3 w-3 text-emerald-300" />
                  ) : !chk.ok ? (
                    <XCircle className="h-3 w-3 text-rose-300" />
                  ) : null}
                </div>
                <div className="mt-0.5 text-[9px] leading-tight text-blue-100">
                  {go ? 'GO FOR LAUNCH' : chk.ok ? (locked ? 'Awaiting other roles' : 'Tap to vote GO') : `NO-GO: ${chk.reason}`}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
