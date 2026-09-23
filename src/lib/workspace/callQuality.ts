export const ICE_CONFIG: RTCConfiguration = {
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceCandidatePoolSize: 8,
  iceTransportPolicy: "all",
  iceServers: [{ urls: ["stun:stun.cloudflare.com:3478", "stun:stun.l.google.com:19302"] }],
};

export const MEDIA_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: { ideal: true },
    noiseSuppression: { ideal: true },
    autoGainControl: { ideal: false },
    channelCount: { ideal: 1 },
    sampleRate: { ideal: 48000 },
  },
  video: {
    facingMode: { ideal: "user" },
    width: { min: 640, ideal: 1920, max: 1920 },
    height: { min: 360, ideal: 1080, max: 1080 },
    frameRate: { min: 24, ideal: 30, max: 30 },
    aspectRatio: { ideal: 16 / 9 },
  },
};

export type CallStats = {
  rttMs: number | null;
  jitterMs: number | null;
  lossPct: number | null;
  fps: number | null;
  width: number | null;
  height: number | null;
  bitrateKbps: number | null;
  codec: string | null;
  ice: string;
  connection: string;
};

export type QualityGrade = "excellent" | "good" | "fair" | "poor" | "idle";

export type ProbeResult = {
  ok: boolean;
  grade: QualityGrade;
  connectedMs: number;
  inboundTracks: number;
  stats: CallStats;
  checks: Array<{ id: string; ok: boolean; detail: string }>;
};

export function gradeStats(stats: CallStats): QualityGrade {
  if (stats.connection !== "connected" && stats.ice !== "connected" && stats.ice !== "completed") return "idle";
  const rtt = stats.rttMs ?? 999;
  const loss = stats.lossPct ?? 100;
  const fps = stats.fps ?? 0;
  const h = stats.height ?? 0;
  if (rtt < 80 && loss < 1 && fps >= 24 && h >= 720) return "excellent";
  if (rtt < 150 && loss < 3 && fps >= 15 && h >= 360) return "good";
  if (rtt < 300 && loss < 8) return "fair";
  return "poor";
}

export function parseRtcStats(
  report: RTCStatsReport,
  prev?: { bytes: number; outboundBytes?: number; at: number },
): CallStats & { bytes: number; outboundBytes: number; at: number } {
  let rttMs: number | null = null;
  let jitterMs: number | null = null;
  let packetsLost = 0;
  let packets = 0;
  let fps: number | null = null;
  let width: number | null = null;
  let height: number | null = null;
  let codec: string | null = null;
  let bytes = 0;
  let outboundBytes = 0;
  let ice = "new";
  let connection = "new";
  const codecMap = new Map<string, string>();

  report.forEach((item) => {
    if (item.type === "codec" && "mimeType" in item) {
      codecMap.set(item.id, String(item.mimeType).replace("video/", "").replace("audio/", ""));
    }
    if (item.type === "candidate-pair" && "state" in item && item.state === "succeeded") {
      ice = "connected";
      if (typeof item.currentRoundTripTime === "number") rttMs = Math.round(item.currentRoundTripTime * 1000);
    }
    if (item.type === "transport" && typeof item.dtlsState === "string" && item.dtlsState === "connected") {
      connection = "connected";
    }
    if (item.type === "inbound-rtp" && item.kind === "video") {
      if (typeof item.framesPerSecond === "number") fps = Math.round(item.framesPerSecond);
      if (typeof item.frameWidth === "number") width = item.frameWidth;
      if (typeof item.frameHeight === "number") height = item.frameHeight;
      if (typeof item.packetsLost === "number") packetsLost += item.packetsLost;
      if (typeof item.packetsReceived === "number") packets += item.packetsReceived;
      if (typeof item.bytesReceived === "number") bytes += item.bytesReceived;
      if (typeof item.jitter === "number") jitterMs = Math.round(item.jitter * 1000);
      if (typeof item.codecId === "string") codec = codecMap.get(item.codecId) ?? codec;
    }
    if (item.type === "outbound-rtp" && item.kind === "video") {
      if (typeof item.bytesSent === "number") {
        bytes += item.bytesSent;
        outboundBytes += item.bytesSent;
      }
      if (typeof item.frameWidth === "number") width = width ?? item.frameWidth;
      if (typeof item.frameHeight === "number") height = height ?? item.frameHeight;
      if (typeof item.framesPerSecond === "number") fps = fps ?? Math.round(item.framesPerSecond);
      if (typeof item.codecId === "string") codec = codecMap.get(item.codecId) ?? codec;
    }
    if (item.type === "remote-inbound-rtp") {
      if (typeof item.roundTripTime === "number") rttMs = Math.round(item.roundTripTime * 1000);
      if (typeof item.packetsLost === "number") packetsLost += item.packetsLost;
      if (typeof item.jitter === "number") jitterMs = jitterMs ?? Math.round(item.jitter * 1000);
    }
  });

  const at = Date.now();
  let bitrateKbps: number | null = null;
  const prevOut = prev && "outboundBytes" in prev ? Number(prev.outboundBytes) : prev?.bytes;
  if (prev && prevOut != null && at > prev.at) {
    bitrateKbps = Math.max(0, Math.round(((outboundBytes - prevOut) * 8) / Math.max(1, at - prev.at)));
  }
  const lossPct = packets + packetsLost > 0 ? Math.round((packetsLost / (packets + packetsLost)) * 1000) / 10 : 0;

  return {
    rttMs,
    jitterMs,
    lossPct,
    fps,
    width,
    height,
    bitrateKbps,
    codec,
    ice,
    connection,
    bytes,
    outboundBytes,
    at,
  };
}

export function evaluateProbe(stats: CallStats, connectedMs: number, inboundTracks: number): ProbeResult {
  const grade = gradeStats({ ...stats, connection: inboundTracks > 0 ? "connected" : stats.connection });
  const checks = [
    { id: "connect", ok: connectedMs < 4000 && inboundTracks > 0, detail: inboundTracks ? `ICE ${connectedMs}ms` : "no remote media" },
    { id: "latency", ok: (stats.rttMs ?? 999) < 150, detail: stats.rttMs == null ? "RTT n/a (loopback)" : `${stats.rttMs}ms RTT` },
    { id: "video", ok: (stats.height ?? 0) >= 360 && (stats.fps ?? 0) >= 12, detail: `${stats.width ?? 0}×${stats.height ?? 0} @ ${stats.fps ?? 0}fps` },
    { id: "loss", ok: (stats.lossPct ?? 0) < 5, detail: `${stats.lossPct ?? 0}% loss` },
    {
      id: "bitrate",
      ok: (stats.bitrateKbps ?? 0) >= 80 || ((stats.height ?? 0) >= 540 && (stats.fps ?? 0) >= 12),
      detail: `${stats.bitrateKbps ?? 0} kbps`,
    },
  ];
  return { ok: checks.filter((c) => c.id !== "latency").every((c) => c.ok), grade, connectedMs, inboundTracks, stats, checks };
}

export const MAX_CALL_PEOPLE = 5;

export function meshEncode(people: number, mode: "camera" | "screen") {
  const n = Math.min(MAX_CALL_PEOPLE, Math.max(1, people));
  if (mode === "screen") {
    if (n <= 2) return { maxBitrate: 8_000_000, minBitrate: 2_000_000, scale: 1, fps: 30 };
    return { maxBitrate: 3_000_000, minBitrate: 800_000, scale: 1.5, fps: 24 };
  }
  if (n <= 2) return { maxBitrate: 6_000_000, minBitrate: 1_500_000, scale: 1, fps: 30 };
  if (n === 3) return { maxBitrate: 2_500_000, minBitrate: 800_000, scale: 1.5, fps: 30 };
  return { maxBitrate: 1_200_000, minBitrate: 400_000, scale: 2, fps: 24 };
}

export async function applySenderQuality(pc: RTCPeerConnection, mode: "camera" | "screen" = "camera", people = 2) {
  const videoCaps = RTCRtpSender.getCapabilities?.("video");
  if (videoCaps) {
    const ranked = [...videoCaps.codecs].sort((a, b) => codecRank(a) - codecRank(b));
    for (const t of pc.getTransceivers()) {
      if (t.receiver.track?.kind === "video" || t.sender.track?.kind === "video") {
        try {
          t.setCodecPreferences(ranked);
        } catch {
          /* Safari */
        }
      }
    }
  }

  const mesh = meshEncode(people, mode);
  for (const sender of pc.getSenders()) {
    const kind = sender.track?.kind;
    if (!kind) continue;
    if (kind === "video") sender.track.contentHint = mode === "screen" ? "detail" : "motion";
    try {
      const params = sender.getParameters();
      params.degradationPreference = "maintain-resolution";
      params.encodings = [
        {
          ...(params.encodings?.[0] ?? {}),
          maxBitrate: kind === "audio" ? 96_000 : mesh.maxBitrate,
          maxFramerate: kind === "video" ? mesh.fps : undefined,
          scaleResolutionDownBy: kind === "video" ? mesh.scale : 1,
          ...(kind === "video" ? { minBitrate: mesh.minBitrate } : {}),
        } as RTCRtpEncodingParameters,
      ];
      await sender.setParameters(params);
    } catch {
      /* encodings may be immutable until negotiation */
    }
  }

  applyReceiverLatency(pc);
}

function codecRank(codec: RTCRtpCodec) {
  const mime = codec.mimeType.toLowerCase();
  const fmtp = codec.sdpFmtpLine ?? "";
  if (mime === "video/h264") {
    if (/profile-level-id=640c|profile-level-id=6400/i.test(fmtp)) return 0;
    if (/profile-level-id=4d00/i.test(fmtp)) return 1;
    return 2;
  }
  if (mime === "video/av1") return 3;
  if (mime === "video/vp9") return 4;
  if (mime === "video/vp8") return 5;
  return 9;
}

export function applyReceiverLatency(pc: RTCPeerConnection) {
  for (const receiver of pc.getReceivers()) {
    try {
      if ("jitterBufferTarget" in receiver) {
        (receiver as RTCRtpReceiver & { jitterBufferTarget?: number }).jitterBufferTarget = 40;
      }
    } catch {
      /* unsupported */
    }
  }
}

export async function lockCaptureQuality(stream: MediaStream) {
  const video = stream.getVideoTracks()[0];
  if (!video) return;
  video.contentHint = "motion";
  try {
    await video.applyConstraints({
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      frameRate: { ideal: 30, max: 30 },
    });
  } catch {
    try {
      await video.applyConstraints({ width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } });
    } catch {
      /* keep device default */
    }
  }
}

export function tabClientId(): string {
  const key = "arka-call-tab";
  try {
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = `tab-${crypto.randomUUID()}`;
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return `tab-${crypto.randomUUID()}`;
  }
}

export function formatCallClock(elapsedMs: number) {
  const total = Math.max(0, Math.floor(elapsedMs / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) return `${hours}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}
