"use client";

import type { CallStats, ProbeResult, QualityGrade } from "@/lib/workspace/callQuality";

const TONE: Record<QualityGrade, string> = {
  excellent: "text-emerald-400",
  good: "text-lime-400",
  fair: "text-amber-400",
  poor: "text-red-400",
  idle: "text-white/45",
};

function metric(label: string, value: string) {
  return (
    <span>
      <span className="text-white/40">{label} </span>
      {value}
    </span>
  );
}

export function CallQualityBar({
  grade,
  stats,
  probe,
  probing,
  onRetest,
}: {
  grade: QualityGrade;
  stats: CallStats | null;
  probe: ProbeResult | null;
  probing: boolean;
  onRetest: () => void;
}) {
  const shown = stats ?? probe?.stats ?? null;
  const shownGrade = stats ? grade : probe?.grade ?? "idle";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 px-3 py-2 text-[11px] text-white/80">
      <strong className={`uppercase tracking-wide ${TONE[shownGrade]}`}>{shownGrade}</strong>
      {shown
        ? (
          <>
            {metric("RTT", shown.rttMs == null ? "—" : `${shown.rttMs}ms`)}
            {metric("loss", shown.lossPct == null ? "—" : `${shown.lossPct}%`)}
            {metric("size", shown.width && shown.height ? `${shown.width}×${shown.height}` : "—")}
            {metric("fps", shown.fps == null ? "—" : String(shown.fps))}
            {metric("rate", shown.bitrateKbps == null ? "—" : `${shown.bitrateKbps}kbps`)}
            {metric("codec", shown.codec ?? "—")}
            {metric("ice", shown.connection)}
          </>
        )
        : <span className="text-white/45">{probing ? "Self-test running…" : "Allow camera to start the self-test."}</span>}
      {probe ? (
        <span className={probe.ok ? "text-emerald-400" : "text-amber-400"}>
          self-test {probe.ok ? "pass" : "check"} · {probe.connectedMs}ms
          {probe.checks.map((c) => (
            <span key={c.id} className="ms-2 hidden text-white/45 md:inline">
              {c.ok ? "✓" : "!"} {c.detail}
            </span>
          ))}
        </span>
      ) : null}
      <button type="button" className="ms-auto text-white/55 underline-offset-2 hover:text-white hover:underline" onClick={onRetest} disabled={probing}>
        {probing ? "Testing…" : "Run quality test"}
      </button>
    </div>
  );
}
