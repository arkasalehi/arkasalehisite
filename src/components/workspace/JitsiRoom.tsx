"use client";

export function JitsiRoom({
  roomName,
  displayName,
  hash,
}: {
  roomName: string;
  displayName: string;
  hash?: string;
}) {
  const src = `https://meet.jit.si/${encodeURIComponent(roomName)}#${hash || `userInfo.displayName="${encodeURIComponent(displayName)}"&config.prejoinPageEnabled=false&config.disableDeepLinking=true`}`;
  return (
    <div className="h-full min-h-[420px] overflow-hidden bg-[#111] md:rounded-none" dir="ltr">
      <iframe
        title="Video meeting"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        className="h-full min-h-[360px] w-full border-0"
      />
    </div>
  );
}
