const mobileCameraPattern = /Android|iPhone|iPad|iPod|Mobile/i;

export function getCameraConstraints(userAgent = typeof navigator !== "undefined" ? navigator.userAgent : ""): MediaStreamConstraints {
  const mobile = mobileCameraPattern.test(userAgent);

  return {
    video: mobile
      ? {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      : {
          // Desktop browsers are more reliable when allowed to choose their default camera.
          // In particular, forcing a mobile-facing-mode hint can produce a live track with no
          // rendered frames on external webcams and virtual cameras.
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
    audio: false,
  };
}

export function bindCameraStream(video: HTMLVideoElement | null, stream: MediaStream | null) {
  if (!video || !stream) return false;

  if (video.srcObject !== stream) video.srcObject = stream;
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute("autoplay", "true");
  video.setAttribute("muted", "true");
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

export function hasRenderableCameraFrame(video: HTMLVideoElement | null) {
  return Boolean(video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0);
}
