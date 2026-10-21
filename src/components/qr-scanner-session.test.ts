import { afterEach, describe, expect, it, vi } from "vitest";
import { startQrScannerSession } from "./qr-scanner-session";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function settle() {
  for (let index = 0; index < 6; index++) await Promise.resolve();
}

function setup() {
  const stop = vi.fn();
  const stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
  const video = { srcObject: null, play: vi.fn().mockResolvedValue(undefined), pause: vi.fn() } as unknown as HTMLVideoElement;
  const onResult = vi.fn();
  const onError = vi.fn();
  const detector = { detect: vi.fn().mockResolvedValue([]) };
  const getStream = vi.fn().mockResolvedValue(stream);
  return { stop, stream, video, onResult, onError, detector, getStream };
}

afterEach(() => { vi.useRealTimers(); });

describe("QR scanner session cancellation", () => {
  it("stops tracks received after closing without playing or reporting", async () => {
    const options = setup();
    const media = deferred<MediaStream>();
    options.getStream.mockReturnValue(media.promise);
    const cancel = startQrScannerSession(options);
    cancel();
    media.resolve(options.stream);
    await settle();
    expect(options.stop).toHaveBeenCalledOnce();
    expect(options.video.play).not.toHaveBeenCalled();
    expect(options.detector.detect).not.toHaveBeenCalled();
    expect(options.onError).not.toHaveBeenCalled();
    expect(options.onResult).not.toHaveBeenCalled();
  });

  it.each(["resolve", "reject"] as const)("ignores a late video.play %s after unmount", async (outcome) => {
    const options = setup();
    const playing = deferred<void>();
    vi.mocked(options.video.play).mockReturnValue(playing.promise);
    const cancel = startQrScannerSession(options);
    await settle();
    cancel();
    if (outcome === "resolve") playing.resolve();
    else playing.reject(new Error("Playback interrupted"));
    await settle();
    expect(options.stop).toHaveBeenCalledOnce();
    expect(options.video.srcObject).toBeNull();
    expect(options.detector.detect).not.toHaveBeenCalled();
    expect(options.onError).not.toHaveBeenCalled();
  });

  it.each(["code", "empty", "error"] as const)("ignores obsolete detection: %s, including after reopen", async (outcome) => {
    vi.useFakeTimers();
    const old = setup();
    const detection = deferred<Array<{ rawValue: string }>>();
    old.detector.detect.mockReturnValue(detection.promise);
    const cancelOld = startQrScannerSession(old);
    await settle();
    cancelOld();
    const current = setup();
    current.video = old.video;
    const cancelCurrent = startQrScannerSession(current);
    await settle();
    if (outcome === "error") detection.reject(new Error("Detection interrupted"));
    else detection.resolve(outcome === "code" ? [{ rawValue: "old-code" }] : []);
    await settle();
    expect(old.onResult).not.toHaveBeenCalled();
    expect(old.onError).not.toHaveBeenCalled();
    expect(old.detector.detect).toHaveBeenCalledOnce();
    expect(current.video.srcObject).toBe(current.stream);
    expect(current.stop).not.toHaveBeenCalled();
    cancelCurrent();
    await vi.runAllTimersAsync();
    expect(current.detector.detect).toHaveBeenCalledOnce();
  });

  it("suppresses a late permission rejection", async () => {
    const options = setup();
    const media = deferred<MediaStream>();
    options.getStream.mockReturnValue(media.promise);
    const cancel = startQrScannerSession(options);
    cancel();
    media.reject(new Error("Permission denied"));
    await settle();
    expect(options.onError).not.toHaveBeenCalled();
  });

  it("releases an active session before reporting a result", async () => {
    const options = setup();
    options.detector.detect.mockResolvedValue([{ rawValue: "PZ-123" }]);
    startQrScannerSession(options);
    await settle();
    expect(options.onResult).toHaveBeenCalledWith("PZ-123");
    expect(options.stop).toHaveBeenCalledOnce();
    expect(options.video.srcObject).toBeNull();
    expect(options.onError).not.toHaveBeenCalled();
  });

  it("releases camera and reports an active detection error", async () => {
    const options = setup();
    options.detector.detect.mockRejectedValue(new Error("Camera unavailable"));
    startQrScannerSession(options);
    await settle();
    expect(options.onError).toHaveBeenCalledOnce();
    expect(options.stop).toHaveBeenCalledOnce();
    expect(options.video.srcObject).toBeNull();
  });
});
