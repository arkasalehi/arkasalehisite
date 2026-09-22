import {
  ICE_CONFIG,
  applySenderQuality,
  evaluateProbe,
  parseRtcStats,
  type ProbeResult,
} from "@/lib/workspace/callQuality";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitUntil(ok: () => boolean | Promise<boolean>, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await ok()) return true;
    await wait(80);
  }
  return ok();
}

export async function runLoopbackProbe(local: MediaStream): Promise<ProbeResult> {
  const a = new RTCPeerConnection(ICE_CONFIG);
  const b = new RTCPeerConnection(ICE_CONFIG);
  const remote = new MediaStream();
  const started = Date.now();
  let connectedMs = 9999;

  local.getTracks().forEach((track) => a.addTrack(track, local));
  b.ontrack = (event) => {
    event.streams[0]?.getTracks().forEach((t) => remote.addTrack(t));
    if (!event.streams[0]) remote.addTrack(event.track);
  };
  a.onicecandidate = (event) => {
    if (event.candidate) void b.addIceCandidate(event.candidate);
  };
  b.onicecandidate = (event) => {
    if (event.candidate) void a.addIceCandidate(event.candidate);
  };
  a.onconnectionstatechange = () => {
    if (a.connectionState === "connected") connectedMs = Math.min(connectedMs, Date.now() - started);
  };

  try {
    await applySenderQuality(a, "camera");
    const offer = await a.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
    await a.setLocalDescription(offer);
    await b.setRemoteDescription(offer);
    const answer = await b.createAnswer();
    await b.setLocalDescription(answer);
    await a.setRemoteDescription(answer);

    await waitUntil(
      () => a.connectionState === "connected" || a.iceConnectionState === "connected" || remote.getTracks().length > 0,
      8000,
    );
    if (connectedMs === 9999) connectedMs = Date.now() - started;
    await waitUntil(async () => {
      const snap = parseRtcStats(await a.getStats());
      return (snap.outboundBytes ?? 0) > 8_000 || (snap.fps ?? 0) > 0;
    }, 6000);
    await wait(2000);

    const first = parseRtcStats(await a.getStats());
    await wait(1500);
    const second = parseRtcStats(await a.getStats(), first);
    return evaluateProbe(
      { ...second, connection: "connected", ice: "connected" },
      connectedMs,
      remote.getTracks().length,
    );
  } finally {
    a.close();
    b.close();
  }
}
