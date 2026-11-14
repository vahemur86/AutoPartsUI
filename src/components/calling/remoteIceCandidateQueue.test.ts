import { describe, expect, it } from "vitest";
import { RemoteIceCandidateQueue } from "./remoteIceCandidateQueue";

const makeCandidate = (candidate: string) => ({
  callId: "call-1",
  candidate,
  sdpMid: "audio",
  sdpMLineIndex: 0,
  usernameFragment: null,
});

describe("RemoteIceCandidateQueue", () => {
  it("applies candidates in order when another drain starts during an application", async () => {
    const queue = new RemoteIceCandidateQueue();
    const applied: string[] = [];
    let releaseFirst: () => void = () => {};
    const firstCandidateGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    queue.enqueue(makeCandidate("candidate:first"));
    const firstDrain = queue.flush(async ({ candidate }) => {
      applied.push(`start:${candidate}`);
      if (candidate === "candidate:first") await firstCandidateGate;
      applied.push(`end:${candidate}`);
    });

    await Promise.resolve();
    queue.enqueue(makeCandidate("candidate:second"));
    const secondDrain = queue.flush(async ({ candidate }) => {
      applied.push(`start:${candidate}`);
      applied.push(`end:${candidate}`);
    });
    releaseFirst();

    await Promise.all([firstDrain, secondDrain]);

    expect(applied).toEqual([
      "start:candidate:first",
      "end:candidate:first",
      "start:candidate:second",
      "end:candidate:second",
    ]);
  });

  it("clears candidates queued for a finished call", async () => {
    const queue = new RemoteIceCandidateQueue();
    const applied: string[] = [];
    queue.enqueue(makeCandidate("candidate:stale"));

    queue.clear();
    await queue.flush(async ({ candidate }) => {
      applied.push(candidate ?? "");
    });

    expect(applied).toEqual([]);
    expect(queue.size).toBe(0);
  });
});
