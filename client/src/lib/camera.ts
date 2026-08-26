export function bindCameraStream(video: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!video || !stream) return false;

  video.srcObject = stream;
  video.muted = true;
  video.setAttribute("playsinline", "true");

  try {
    const playback = video.play?.();
    if (playback && typeof playback.catch === "function") {
      void playback.catch(() => undefined);
    }
  } catch {
    // Some mobile browsers can throw synchronously before metadata is ready.
  }

  return true;
}
