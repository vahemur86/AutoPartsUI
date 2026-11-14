export class CallNegotiationGuard {
  private readonly offeredCallIds = new Set<string>();
  private readonly answeredCallIds = new Set<string>();

  claimOffer(callId: string) {
    if (this.offeredCallIds.has(callId)) return false;
    this.offeredCallIds.add(callId);
    return true;
  }

  claimAnswer(callId: string) {
    if (this.answeredCallIds.has(callId)) return false;
    this.answeredCallIds.add(callId);
    return true;
  }

  clear() {
    this.offeredCallIds.clear();
    this.answeredCallIds.clear();
  }
}
