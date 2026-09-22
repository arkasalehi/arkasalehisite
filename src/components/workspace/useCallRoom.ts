"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { runLoopbackProbe } from "@/lib/workspace/callLoopback";
import {
  ICE_CONFIG,
  MEDIA_CONSTRAINTS,
  applySenderQuality,
  gradeStats,
  parseRtcStats,
  tabClientId,
  type CallStats,
  type ProbeResult,
  type QualityGrade,
} from "@/lib/workspace/callQuality";

type Signal = {
  kind: "offer" | "answer" | "ice";
  from: string;
  to: string;
  sdp?: RTCSessionDescriptionInit;
  candidate?: RTCIceCandidateInit | null;
};

export type CallPeer = {
  id: string;
  name: string;
  stream: MediaStream;
};

export function useCallRoom(roomName: string, userId: string, displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<CallPeer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [stats, setStats] = useState<CallStats | null>(null);
  const [grade, setGrade] = useState<QualityGrade>("idle");
  const [probe, setProbe] = useState<ProbeResult | null>(null);
  const [probing, setProbing] = useState(false);

  const pcs = useRef(new Map<string, RTCPeerConnection>());
  const queues = useRef(new Map<string, Promise<void>>());
  const iceBuf = useRef(new Map<string, RTCIceCandidateInit[]>());
  const names = useRef(new Map<string, string>());
  const streamRef = useRef<MediaStream | null>(null);
  const cameraTrack = useRef<MediaStreamTrack | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabase>["channel"]> | null>(null);
  const userRef = useRef(userId);
  const tabRef = useRef("");
  const prevBytes = useRef<{ bytes: number; outboundBytes?: number; at: number } | undefined>(undefined);
  const shareMode = useRef<"camera" | "screen">("camera");
  userRef.current = userId;

  const setPeerStream = (id: string, stream: MediaStream) => {
    setPeers((prev) => {
      const rest = prev.filter((p) => p.id !== id);
      return [...rest, { id, name: names.current.get(id) ?? "Teammate", stream }];
    });
  };

  const dropPeer = (id: string) => {
    pcs.current.get(id)?.close();
    pcs.current.delete(id);
    iceBuf.current.delete(id);
    names.current.delete(id);
    setPeers((prev) => prev.filter((p) => p.id !== id));
  };

  const send = async (payload: Signal) => {
    await channelRef.current?.send({ type: "broadcast", event: "signal", payload });
  };

  const attachLocal = (pc: RTCPeerConnection) => {
    const local = streamRef.current;
    if (!local) return;
    const senders = pc.getSenders();
    for (const track of local.getTracks()) {
      const has = senders.some((s) => s.track?.id === track.id || s.track?.kind === track.kind);
      if (!has) pc.addTrack(track, local);
    }
    void applySenderQuality(pc, shareMode.current);
  };

  const ensurePc = (peerId: string) => {
    const existing = pcs.current.get(peerId);
    if (existing) {
      attachLocal(existing);
      return existing;
    }
    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcs.current.set(peerId, pc);
    attachLocal(pc);
    pc.onicecandidate = (event) => {
      void send({
        kind: "ice",
        from: tabRef.current,
        to: peerId,
        candidate: event.candidate?.toJSON() ?? null,
      });
    };
    pc.ontrack = (event) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      setPeerStream(peerId, stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        try {
          pc.restartIce();
        } catch {
          dropPeer(peerId);
        }
      }
      if (pc.connectionState === "closed") dropPeer(peerId);
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        try {
          pc.restartIce();
        } catch {
          /* ignore */
        }
      }
    };
    return pc;
  };

  const run = (peerId: string, task: () => Promise<void>) => {
    const next = (queues.current.get(peerId) ?? Promise.resolve()).then(task, task);
    queues.current.set(peerId, next.catch(() => undefined));
    return next;
  };

  const flushIce = async (id: string, pc: RTCPeerConnection) => {
    const pending = iceBuf.current.get(id) ?? [];
    iceBuf.current.set(id, []);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        /* ignore */
      }
    }
  };

  const offerTo = (peerId: string, iceRestart = false) =>
    run(peerId, async () => {
      const pc = ensurePc(peerId);
      if (!iceRestart && pc.signalingState !== "stable") return;
      await applySenderQuality(pc, shareMode.current);
      const offer = await pc.createOffer({ iceRestart, offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      if (pc.localDescription) {
        await send({ kind: "offer", from: tabRef.current, to: peerId, sdp: pc.localDescription });
      }
    });

  const onSignal = (payload: Signal) => {
    const me = tabRef.current;
    if (!payload || payload.to !== me || payload.from === me) return;
    void run(payload.from, async () => {
      const pc = ensurePc(payload.from);
      if (payload.kind === "offer" && payload.sdp) {
        if (pc.signalingState !== "stable") return;
        await pc.setRemoteDescription(payload.sdp);
        await flushIce(payload.from, pc);
        await applySenderQuality(pc, shareMode.current);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) {
          await send({ kind: "answer", from: me, to: payload.from, sdp: pc.localDescription });
        }
        return;
      }
      if (payload.kind === "answer" && payload.sdp && pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(payload.sdp);
        await flushIce(payload.from, pc);
        return;
      }
      if (payload.kind === "ice" && payload.candidate) {
        if (pc.remoteDescription) await pc.addIceCandidate(payload.candidate);
        else {
          const buf = iceBuf.current.get(payload.from) ?? [];
          buf.push(payload.candidate);
          iceBuf.current.set(payload.from, buf);
        }
      }
    });
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia(MEDIA_CONSTRAINTS);
        if (cancelled) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        media.getVideoTracks().forEach((t) => {
          t.contentHint = "motion";
        });
        streamRef.current = media;
        cameraTrack.current = media.getVideoTracks()[0] ?? null;
        setLocalStream(media);
        pcs.current.forEach((pc, id) => {
          attachLocal(pc);
          if (tabRef.current < id && !pc.remoteDescription && pc.signalingState === "stable") void offerTo(id);
        });
      } catch {
        try {
          const audio = await navigator.mediaDevices.getUserMedia({
            audio: MEDIA_CONSTRAINTS.audio,
            video: false,
          });
          if (cancelled) {
            audio.getTracks().forEach((t) => t.stop());
            return;
          }
          streamRef.current = audio;
          setLocalStream(audio);
          setCamOn(false);
        } catch {
          if (!cancelled) setError("Camera and microphone were blocked. Allow access to join the call.");
        }
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!roomName || !userId) return;
    const tab = tabClientId();
    tabRef.current = tab;
    let supabase: ReturnType<typeof createBrowserSupabase>;
    try {
      supabase = createBrowserSupabase();
    } catch {
      setError("Realtime is unavailable, so other people cannot join this room.");
      return;
    }
    const channel = supabase.channel(`arka-call:${roomName}`, {
      config: { presence: { key: tab }, broadcast: { ack: false } },
    });
    channelRef.current = channel;
    channel.on("broadcast", { event: "signal" }, ({ payload }) => onSignal(payload as Signal));
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState() as Record<string, Array<{ name?: string; id?: string }>>;
      const seen = new Set<string>();
      for (const [key, metas] of Object.entries(state)) {
        const meta = metas[0];
        const id = key;
        if (id === tab) continue;
        seen.add(id);
        names.current.set(id, meta?.name || "Teammate");
        const pc = ensurePc(id);
        if (tab < id && !pc.remoteDescription && pc.signalingState === "stable") void offerTo(id);
      }
      for (const id of [...pcs.current.keys()]) {
        if (!seen.has(id)) dropPeer(id);
      }
    });
    void channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await channel.track({ id: userId, name: displayName, tab });
    });
    return () => {
      channelRef.current = null;
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
      setPeers([]);
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, roomName, userId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const pc = [...pcs.current.values()].find((item) => item.connectionState === "connected") ?? [...pcs.current.values()][0];
      if (!pc) {
        setStats(null);
        setGrade("idle");
        return;
      }
      void pc.getStats().then((report) => {
        const next = parseRtcStats(report, prevBytes.current);
        prevBytes.current = { bytes: next.bytes, outboundBytes: next.outboundBytes, at: next.at };
        const live: CallStats = {
          rttMs: next.rttMs,
          jitterMs: next.jitterMs,
          lossPct: next.lossPct,
          fps: next.fps,
          width: next.width,
          height: next.height,
          bitrateKbps: next.bitrateKbps,
          codec: next.codec,
          ice: pc.iceConnectionState,
          connection: pc.connectionState,
        };
        setStats(live);
        setGrade(gradeStats(live));
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const runProbe = useCallback(async () => {
    const local = streamRef.current;
    if (!local) return;
    setProbing(true);
    try {
      setProbe(await runLoopbackProbe(local));
    } catch {
      setProbe({
        ok: false,
        grade: "poor",
        connectedMs: 9999,
        inboundTracks: 0,
        stats: {
          rttMs: null,
          jitterMs: null,
          lossPct: null,
          fps: null,
          width: null,
          height: null,
          bitrateKbps: null,
          codec: null,
          ice: "failed",
          connection: "failed",
        },
        checks: [{ id: "connect", ok: false, detail: "loopback failed" }],
      });
    } finally {
      setProbing(false);
    }
  }, []);

  useEffect(() => {
    if (!localStream || probe || probing) return;
    const t = window.setTimeout(() => void runProbe(), 400);
    return () => window.clearTimeout(t);
  }, [localStream, probe, probing, runProbe]);

  const toggleMic = useCallback(() => {
    const next = !micOn;
    streamRef.current?.getAudioTracks().forEach((t) => {
      t.enabled = next;
    });
    setMicOn(next);
  }, [micOn]);

  const toggleCam = useCallback(() => {
    const next = !camOn;
    streamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = next;
    });
    setCamOn(next);
  }, [camOn]);

  const toggleShare = useCallback(async () => {
    if (sharing) {
      const cam = cameraTrack.current;
      shareMode.current = "camera";
      if (cam) {
        for (const pc of pcs.current.values()) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) await sender.replaceTrack(cam);
          await applySenderQuality(pc, "camera");
        }
        const local = streamRef.current;
        const old = local?.getVideoTracks()[0];
        if (local && old && old !== cam) {
          local.removeTrack(old);
          old.stop();
          local.addTrack(cam);
          setLocalStream(new MediaStream(local.getTracks()));
        }
      }
      setSharing(false);
      return;
    }
    try {
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 24 }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      const track = display.getVideoTracks()[0];
      if (!track) return;
      track.contentHint = "detail";
      shareMode.current = "screen";
      for (const pc of pcs.current.values()) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(track);
        else pc.addTrack(track, display);
        await applySenderQuality(pc, "screen");
      }
      const local = streamRef.current ?? new MediaStream();
      const old = local.getVideoTracks()[0];
      if (old && old !== cameraTrack.current) old.stop();
      if (old) local.removeTrack(old);
      local.addTrack(track);
      streamRef.current = local;
      setLocalStream(new MediaStream(local.getTracks()));
      setSharing(true);
      track.onended = () => {
        void (async () => {
          shareMode.current = "camera";
          const cam = cameraTrack.current;
          if (cam) {
            for (const pc of pcs.current.values()) {
              const sender = pc.getSenders().find((s) => s.track?.kind === "video");
              if (sender) await sender.replaceTrack(cam);
              await applySenderQuality(pc, "camera");
            }
            const current = streamRef.current;
            const screen = current?.getVideoTracks()[0];
            if (current && screen && screen !== cam) {
              current.removeTrack(screen);
              current.addTrack(cam);
              setLocalStream(new MediaStream(current.getTracks()));
            }
          }
          setSharing(false);
        })();
      };
    } catch {
      /* cancelled */
    }
  }, [sharing]);

  const hangUp = useCallback(() => {
    pcs.current.forEach((pc) => pc.close());
    pcs.current.clear();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setLocalStream(null);
    setPeers([]);
  }, []);

  return {
    localStream,
    peers,
    error,
    micOn,
    camOn,
    sharing,
    stats,
    grade,
    probe,
    probing,
    runProbe,
    toggleMic,
    toggleCam,
    toggleShare,
    hangUp,
  };
}
