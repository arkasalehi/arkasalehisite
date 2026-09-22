import assert from "node:assert/strict";
import { evaluateProbe, gradeStats, parseRtcStats, type CallStats } from "./callQuality.ts";

function report(items: object[]) {
  return { forEach: (cb: (item: object) => void) => items.forEach(cb) } as unknown as RTCStatsReport;
}

const first = parseRtcStats(
  report([
    { type: "codec", id: "c1", mimeType: "video/H264" },
    { type: "candidate-pair", state: "succeeded", currentRoundTripTime: 0.042 },
    { type: "transport", dtlsState: "connected" },
    { type: "outbound-rtp", kind: "video", bytesSent: 80_000, frameWidth: 1280, frameHeight: 720, framesPerSecond: 30, codecId: "c1" },
    { type: "inbound-rtp", kind: "video", bytesReceived: 70_000, packetsReceived: 200, packetsLost: 1, frameWidth: 1280, frameHeight: 720, framesPerSecond: 29, jitter: 0.004, codecId: "c1" },
  ]),
);

assert.equal(first.rttMs, 42);
assert.equal(first.height, 720);
assert.equal(first.codec, "H264");
assert.equal(first.connection, "connected");

const second = parseRtcStats(
  report([
    { type: "candidate-pair", state: "succeeded", currentRoundTripTime: 0.055 },
    { type: "transport", dtlsState: "connected" },
    { type: "outbound-rtp", kind: "video", bytesSent: 230_000, frameWidth: 1280, frameHeight: 720, framesPerSecond: 28 },
    { type: "inbound-rtp", kind: "video", bytesReceived: 190_000, packetsReceived: 400, packetsLost: 2, framesPerSecond: 28, jitter: 0.006 },
  ]),
  { bytes: first.bytes, at: first.at - 1000 },
);

assert.ok((second.bitrateKbps ?? 0) > 200);
assert.equal(gradeStats(second), "excellent");

const live: CallStats = {
  rttMs: 55,
  jitterMs: 6,
  lossPct: 0.5,
  fps: 28,
  width: 1280,
  height: 720,
  bitrateKbps: second.bitrateKbps,
  codec: "H264",
  ice: "connected",
  connection: "connected",
};
const probe = evaluateProbe(live, 180, 2);
assert.equal(probe.ok, true);
assert.equal(probe.grade, "excellent");

const stillScene = evaluateProbe({ ...live, bitrateKbps: 104, fps: 18, connection: "connected" }, 29, 2);
assert.equal(stillScene.ok, true);
assert.equal(stillScene.grade, "good");

const weak = evaluateProbe({ ...live, rttMs: 400, lossPct: 12, fps: 8, height: 180, bitrateKbps: 40, connection: "connected" }, 6000, 1);
assert.equal(weak.ok, false);

console.log("callQuality stats parser and grading: pass");
