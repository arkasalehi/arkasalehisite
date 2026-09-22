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
    <div className="h-full min-h-0 overflow-hidden bg-black" dir="ltr">
      <iframe
        title="Video meeting"
        src={src}
        allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
        className="h-full w-full border-0"
      />
    </div>
  );
}
