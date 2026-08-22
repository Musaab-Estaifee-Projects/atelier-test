// src/components/configurator/ControlBar.tsx
"use client";

type Props = {
  isMuted: boolean;
  onToggleMute: () => void;
  onFullscreen: () => void;
  showCameraPanel: boolean;
  onToggleCameraPanel: () => void;
};

export default function ControlBar({
  isMuted,
  onToggleMute,
  onFullscreen,
  showCameraPanel,
  onToggleCameraPanel,
}: Props) {
  return (
    <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2 rounded-full bg-black/50 px-3 py-2 backdrop-blur">
      <button
        type="button"
        className="rounded-full px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
        onClick={onToggleMute}
      >
        {isMuted ? "Unmute" : "Mute"}
      </button>
      <button
        type="button"
        className="rounded-full px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
        onClick={onFullscreen}
      >
        Fullscreen
      </button>
      <button
        type="button"
        className={`rounded-full px-3 py-1.5 text-xs hover:bg-white/10 ${
          showCameraPanel ? "bg-white/15 text-white" : "text-white/80"
        }`}
        onClick={onToggleCameraPanel}
      >
        Cameras
      </button>
    </div>
  );
}
