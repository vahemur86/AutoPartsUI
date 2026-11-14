import type { WebRtcIceCandidateEvent } from "@/types/calling";

export class RemoteIceCandidateQueue {
  private candidates: WebRtcIceCandidateEvent[] = [];
  private drainPromise: Promise<void> | null = null;

  get size() {
    return this.candidates.length;
  }

  enqueue(candidate: WebRtcIceCandidateEvent) {
    this.candidates.push(candidate);
  }

  clear() {
    this.candidates = [];
  }

  async flush(apply: (candidate: WebRtcIceCandidateEvent) => Promise<void>) {
    if (this.drainPromise) {
      await this.drainPromise;
      if (this.candidates.length > 0) await this.flush(apply);
      return;
    }

    if (this.candidates.length === 0) return;

    const drainPromise = (async () => {
      while (this.candidates.length > 0) {
        const candidate = this.candidates.shift();
        if (candidate) await apply(candidate);
      }
    })();
    this.drainPromise = drainPromise;

    try {
      await drainPromise;
    } finally {
      if (this.drainPromise === drainPromise) this.drainPromise = null;
    }

    if (this.candidates.length > 0) await this.flush(apply);
  }
}
