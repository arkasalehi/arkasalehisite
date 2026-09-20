"use client";

export function JitsiRoom({ roomName, displayName }: { roomName: string; displayName: string }) {
  const src = `https://meet.jit.si/${encodeURIComponent(roomName)}#userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinPageEnabled=false&config.disableDeepLinking=true&interfaceConfig.DISABLE_JOIN_LEAVE_NOTIFICATIONS=true`;
  return (
    <div className="overflow-hidden rounded-2xl bg-[#111] shadow-sm" dir="ltr">
      <iframe
        title="Video meeting"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        className="h-[min(78svh,720px)] w-full border-0"
      />
    </div>
  );
}
