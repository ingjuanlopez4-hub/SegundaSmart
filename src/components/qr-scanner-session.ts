type Detector = { detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>> };

/** Each invocation owns its stream, timer and continuations; cancellation is terminal. */
export function startQrScannerSession({ video, getStream, detector, onResult, onError }: {
  video: HTMLVideoElement;
  getStream: () => Promise<MediaStream>;
  detector: Detector;
  onResult: (value: string) => void;
  onError: () => void;
}): () => void {
  let active = true;
  let stream: MediaStream | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function cancel() {
    active = false;
    clearTimeout(timer);
    stream?.getTracks().forEach((track) => track.stop());
    // Never detach a newer session's video source.
    if (stream && video.srcObject === stream) {
      video.pause();
      video.srcObject = null;
    }
    stream = null;
  }

  async function detect() {
    if (!active) return;
    try {
      const codes = await detector.detect(video);
      if (!active) return;
      const value = codes[0]?.rawValue;
      if (value) {
        cancel();
        onResult(value);
      } else {
        timer = setTimeout(() => { void detect(); }, 250);
      }
    } catch {
      if (!active) return;
      cancel();
      onError();
    }
  }

  void (async () => {
    try {
      const received = await getStream();
      // getUserMedia cannot be aborted: release permissions granted after close.
      if (!active) {
        received.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = received;
      video.srcObject = stream;
      await video.play();
      if (!active) return;
      await detect();
    } catch {
      if (!active) return;
      cancel();
      onError();
    }
  })();

  return cancel;
}
