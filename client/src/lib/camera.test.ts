import { describe, expect, it, vi } from "vitest";
import { bindCameraStream, getCameraConstraints, hasRenderableCameraFrame } from "./camera";

describe("getCameraConstraints", () => {
  it("lets desktop browsers choose their default camera without a mobile facing hint", () => {
    const constraints = getCameraConstraints("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/140 Safari/537.36");
    expect(constraints).toMatchObject({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
    expect(constraints.video).not.toHaveProperty("facingMode");
  });

  it("keeps the rear-camera preference for mobile browsers", () => {
    const constraints = getCameraConstraints("Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/140 Mobile Safari/537.36");
    expect(constraints).toMatchObject({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
  });
});

describe("bindCameraStream", () => {
  it("binds a stream, enables muted inline playback, and starts playback", () => {
    const play = vi.fn(() => Promise.resolve());
    const setAttribute = vi.fn();
    const video = {
      srcObject: null,
      autoplay: false,
      muted: false,
      playsInline: false,
      play,
      setAttribute,
    } as unknown as HTMLVideoElement;
    const stream = {} as MediaStream;

    expect(bindCameraStream(video, stream)).toBe(true);
    expect(video.srcObject).toBe(stream);
    expect(video.autoplay).toBe(true);
    expect(video.muted).toBe(true);
    expect(video.playsInline).toBe(true);
    expect(setAttribute).toHaveBeenCalledWith("autoplay", "true");
    expect(setAttribute).toHaveBeenCalledWith("muted", "true");
    expect(setAttribute).toHaveBeenCalledWith("playsinline", "true");
    expect(play).toHaveBeenCalledOnce();
  });

  it("does not try to play when the video or stream is unavailable", () => {
    expect(bindCameraStream(null, {} as MediaStream)).toBe(false);
    expect(bindCameraStream({} as HTMLVideoElement, null)).toBe(false);
  });
});

describe("hasRenderableCameraFrame", () => {
  it("requires loaded metadata and nonzero video dimensions", () => {
    expect(hasRenderableCameraFrame({ readyState: 1, videoWidth: 1280, videoHeight: 720 } as HTMLVideoElement)).toBe(false);
    expect(hasRenderableCameraFrame({ readyState: 2, videoWidth: 0, videoHeight: 720 } as HTMLVideoElement)).toBe(false);
    expect(hasRenderableCameraFrame({ readyState: 2, videoWidth: 1280, videoHeight: 720 } as HTMLVideoElement)).toBe(true);
    expect(hasRenderableCameraFrame(null)).toBe(false);
  });
});
