import { describe, expect, it, vi } from "vitest";
import { bindCameraStream } from "./camera";

describe("bindCameraStream", () => {
  it("binds a stream, enables muted inline playback, and starts playback", () => {
    const play = vi.fn(() => Promise.resolve());
    const setAttribute = vi.fn();
    const video = {
      srcObject: null,
      muted: false,
      play,
      setAttribute,
    } as unknown as HTMLVideoElement;
    const stream = {} as MediaStream;

    expect(bindCameraStream(video, stream)).toBe(true);
    expect(video.srcObject).toBe(stream);
    expect(video.muted).toBe(true);
    expect(setAttribute).toHaveBeenCalledWith("playsinline", "true");
    expect(play).toHaveBeenCalledOnce();
  });

  it("does not try to play when the video or stream is unavailable", () => {
    expect(bindCameraStream(null, {} as MediaStream)).toBe(false);
    expect(bindCameraStream({} as HTMLVideoElement, null)).toBe(false);
  });
});
