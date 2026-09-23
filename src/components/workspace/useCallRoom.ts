"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { runLoopbackProbe } from "@/lib/workspace/callLoopback";
import {
  ICE_CONFIG,
  MEDIA_CONSTRAINTS,
  MAX_CALL_PEOPLE,
  applySenderQuality,
  applyReceiverLatency,
  lockCaptureQuality,
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

type PresenceMeta = { name?: string; id?: string; joinedAt?: number };

export type CallPeer = {
  id: string;
  name: string;
  stream: MediaStream | null;
};

export function useCallRoom(roomName: string, userId: string, displayName: string) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<CallPeer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [peopleCount, setPeopleCount] = useState(1);
  const [sessionStartedAt, setSessionStartedAt] = useState(() => Date.now());
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
  const streams = useRef(new Map<string, MediaStream>());
  const makingOffer = useRef(new Map<string, boolean>());
  const ignoreOffer = useRef(new Map<string, boolean>());
  const streamRef = useRef<MediaStream | null>(null);
  const cameraTrack = useRef<MediaStreamTrack | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabase>["channel"]> | null>(null);
  const userRef = useRef(userId);
  const tabRef = useRef("");
  const prevBytes = useRef<{ bytes: number; outboundBytes?: number; at: number } | undefined>(undefined);
  const shareMode = useRef<"camera" | "screen">("camera");
  const peopleCountRef = useRef(1);
  const seatedRef = useRef(false);
  const kickedRef = useRef(false);
  const joinedAtRef = useRef(Date.now());
  userRef.current = userId;

  const publishPeers = () => {
    const rows: CallPeer[] = [];
    for (const [id, name] of names.current) {
      if (id === tabRef.current) continue;
      rows.push({ id, name, stream: streams.current.get(id) ?? null });
    }
    setPeers(rows);
  };

  const dropPeer = (id: string) => {
    pcs.current.get(id)?.close();
    pcs.current.delete(id);
    iceBuf.current.delete(id);
    names.current.delete(id);
    streams.current.delete(id);
    makingOffer.current.delete(id);
    ignoreOffer.current.delete(id);
    queues.current.delete(id);
    publishPeers();
  };

  const send = async (payload: Signal) => {
    await channelRef.current?.send({ type: "broadcast", event: "signal", payload });
  };

  const attachLocal = (pc: RTCPeerConnection) => {
    const local = streamRef.current;
    if (!local) return;
    for (const track of local.getTracks()) {
      const sender = pc.getSenders().find((s) => s.track?.kind === track.kind);
      if (sender) {
        if (sender.track !== track) void sender.replaceTrack(track);
      } else {
        pc.addTrack(track, local);
      }
    }
    void applySenderQuality(pc, shareMode.current, peopleCountRef.current);
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
      if (pc.signalingState !== "stable") return;
      makingOffer.current.set(peerId, true);
      try {
        await applySenderQuality(pc, shareMode.current, peopleCountRef.current);
        const offer = await pc.createOffer({ iceRestart, offerToReceiveAudio: true, offerToReceiveVideo: true });
        await pc.setLocalDescription(offer);
        if (pc.localDescription) {
          await send({ kind: "offer", from: tabRef.current, to: peerId, sdp: pc.localDescription });
        }
      } finally {
        makingOffer.current.set(peerId, false);
      }
    });

  const ensurePc = (peerId: string) => {
    const existing = pcs.current.get(peerId);
    if (existing) {
      attachLocal(existing);
      return existing;
    }
    const pc = new RTCPeerConnection(ICE_CONFIG);
    pcs.current.set(peerId, pc);
    if (streamRef.current) {
      attachLocal(pc);
    } else {
      pc.addTransceiver("audio", { direction: "sendrecv" });
      pc.addTransceiver("video", { direction: "sendrecv" });
    }
    pc.onicecandidate = (event) => {
      void send({
        kind: "ice",
        from: tabRef.current,
        to: peerId,
        candidate: event.candidate?.toJSON() ?? null,
      });
    };
    pc.ontrack = (event) => {
      applyReceiverLatency(pc);
      const stream = event.streams[0] ?? streams.current.get(peerId) ?? new MediaStream();
      if (!event.streams[0]) stream.addTrack(event.track);
      streams.current.set(peerId, stream);
      publishPeers();
    };
    pc.onnegotiationneeded = () => {
      if (kickedRef.current || tabRef.current > peerId) return;
      void offerTo(peerId);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed") {
        try {
          pc.restartIce();
          if (tabRef.current < peerId) void offerTo(peerId, true);
        } catch {
          dropPeer(peerId);
        }
      }
      if (pc.connectionState === "closed") dropPeer(peerId);
    };
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed" && tabRef.current < peerId) void offerTo(peerId, true);
    };
    return pc;
  };

  const onSignal = (payload: Signal) => {
    const me = tabRef.current;
    if (kickedRef.current || !me) return;
    if (!payload || payload.to !== me || payload.from === me) return;
    if (pcs.current.size >= MAX_CALL_PEOPLE - 1 && !pcs.current.has(payload.from)) return;
    void run(payload.from, async () => {
      const pc = ensurePc(payload.from);
      const polite = me > payload.from;
      if (payload.kind === "offer" && payload.sdp) {
        const collision = Boolean(makingOffer.current.get(payload.from)) || pc.signalingState !== "stable";
        if (collision && !polite) {
          ignoreOffer.current.set(payload.from, true);
          return;
        }
        ignoreOffer.current.set(payload.from, false);
        if (collision && polite) {
          try {
            await pc.setLocalDescription({ type: "rollback" });
          } catch {
            pcs.current.delete(payload.from);
            pc.close();
            ensurePc(payload.from);
            const fresh = pcs.current.get(payload.from);
            if (!fresh) return;
            await fresh.setRemoteDescription(payload.sdp);
            await flushIce(payload.from, fresh);
            await applySenderQuality(fresh, shareMode.current, peopleCountRef.current);
            applyReceiverLatency(fresh);
            const answer = await fresh.createAnswer();
            await fresh.setLocalDescription(answer);
            if (fresh.localDescription) {
              await send({ kind: "answer", from: me, to: payload.from, sdp: fresh.localDescription });
            }
            return;
          }
        }
        await pc.setRemoteDescription(payload.sdp);
        attachLocal(pc);
        await flushIce(payload.from, pc);
        await applySenderQuality(pc, shareMode.current, peopleCountRef.current);
        applyReceiverLatency(pc);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        if (pc.localDescription) {
          await send({ kind: "answer", from: me, to: payload.from, sdp: pc.localDescription });
        }
        return;
      }
      if (payload.kind === "answer" && payload.sdp) {
        if (ignoreOffer.current.get(payload.from)) return;
        if (pc.signalingState !== "have-local-offer") return;
        await pc.setRemoteDescription(payload.sdp);
        await flushIce(payload.from, pc);
        applyReceiverLatency(pc);
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

  const syncPresence = (state: Record<string, Array<PresenceMeta>>) => {
    const tab = tabRef.current;
    const keys = Object.keys(state);
    const ranked = [...keys].sort();
    if (keys.includes(tab) && ranked.indexOf(tab) >= MAX_CALL_PEOPLE) {
      kickedRef.current = true;
      seatedRef.current = false;
      setError("This room is full (5 people).");
      void channelRef.current?.untrack();
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
      names.current.clear();
      streams.current.clear();
      setPeers([]);
      setPeopleCount(MAX_CALL_PEOPLE);
      return;
    }
    if (!keys.includes(tab)) return;
    kickedRef.current = false;
    seatedRef.current = true;
    setError(null);
    const people = keys.length;
    peopleCountRef.current = people;
    setPeopleCount(people);
    const starts = keys
      .map((id) => Number(state[id]?.[0]?.joinedAt) || joinedAtRef.current)
      .filter((n) => Number.isFinite(n) && n > 0);
    setSessionStartedAt(starts.length ? Math.min(...starts) : joinedAtRef.current);

    const seen = new Set<string>();
    for (const id of keys) {
      const meta = state[id]?.[0];
      names.current.set(id, meta?.name || "Teammate");
      if (id === tab) continue;
      seen.add(id);
      const pc = ensurePc(id);
      void applySenderQuality(pc, shareMode.current, people);
      if (tab < id && pc.signalingState === "stable" && pc.iceConnectionState === "new") {
        void offerTo(id);
      }
    }
    for (const id of [...pcs.current.keys()]) {
      if (!seen.has(id)) dropPeer(id);
    }
    for (const id of [...names.current.keys()]) {
      if (id !== tab && !seen.has(id)) names.current.delete(id);
    }
    publishPeers();
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
        await lockCaptureQuality(media);
        streamRef.current = media;
        cameraTrack.current = media.getVideoTracks()[0] ?? null;
        setLocalStream(media);
        pcs.current.forEach((pc, id) => {
          attachLocal(pc);
          if (tabRef.current < id && pc.signalingState === "stable") void offerTo(id);
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
          pcs.current.forEach((pc, id) => {
            attachLocal(pc);
            if (tabRef.current < id && pc.signalingState === "stable") void offerTo(id);
          });
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
    joinedAtRef.current = Date.now();
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
      syncPresence(channel.presenceState() as Record<string, Array<PresenceMeta>>);
    });
    channel.on("presence", { event: "join" }, () => {
      syncPresence(channel.presenceState() as Record<string, Array<PresenceMeta>>);
    });
    channel.on("presence", { event: "leave" }, () => {
      syncPresence(channel.presenceState() as Record<string, Array<PresenceMeta>>);
    });
    void channel.subscribe(async (status) => {
      if (status !== "SUBSCRIBED") return;
      const already = Object.keys(channel.presenceState()).length;
      if (already >= MAX_CALL_PEOPLE) {
        kickedRef.current = true;
        seatedRef.current = false;
        setError("This room is full (5 people).");
        setPeopleCount(MAX_CALL_PEOPLE);
        return;
      }
      seatedRef.current = true;
      kickedRef.current = false;
      await channel.track({ id: userId, name: displayName, tab, joinedAt: joinedAtRef.current });
    });
    const retry = window.setInterval(() => {
      if (kickedRef.current) return;
      const me = tabRef.current;
      for (const [id, pc] of pcs.current) {
        const ice = pc.iceConnectionState;
        const conn = pc.connectionState;
        if (conn === "connected" || ice === "connected" || ice === "completed") continue;
        if (me < id && (pc.signalingState === "stable" || conn === "failed" || ice === "disconnected" || ice === "failed")) {
          void offerTo(id, conn === "failed" || ice === "failed");
        }
      }
    }, 2000);
    return () => {
      window.clearInterval(retry);
      channelRef.current = null;
      pcs.current.forEach((pc) => pc.close());
      pcs.current.clear();
      names.current.clear();
      streams.current.clear();
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
          await applySenderQuality(pc, "camera", peopleCountRef.current);
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
        await applySenderQuality(pc, "screen", peopleCountRef.current);
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
              await applySenderQuality(pc, "camera", peopleCountRef.current);
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
    void channelRef.current?.untrack();
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
    peopleCount,
    maxPeople: MAX_CALL_PEOPLE,
    sessionStartedAt,
  };
}
