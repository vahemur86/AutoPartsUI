import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type HubConnection,
} from "@microsoft/signalr";
import {
  AudioLines,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  PhoneIncoming,
  Radio,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@/store/hooks";
import { callingService } from "@/services/calling";
import { getApiErrorMessage } from "@/utils/getApiErrorMessage.util";
import { isValidCallAcceptance } from "./callAcceptance";
import { CallNegotiationGuard } from "./callNegotiationGuard";
import { RemoteIceCandidateQueue } from "./remoteIceCandidateQueue";
import { getUserIdFromToken } from "./userIdFromToken";
import type {
  CallAcceptedEvent,
  CallDetails,
  CallFailedEvent,
  IncomingCallEvent,
  WebRtcDescriptionEvent,
  WebRtcIceCandidateEvent,
} from "@/types/calling";
import styles from "./Calling.module.css";

type UiCallStatus =
  | "Ringing"
  | "Incoming"
  | "Accepting"
  | "ConnectingAudio"
  | "InCall"
  | "Ending";

interface UiCall {
  callId: string;
  status: UiCallStatus;
  direction: "incoming" | "outgoing";
  agentName: string;
  assignedCashierId?: number;
  startedAt: string;
  acceptedAt?: string;
  muted: boolean;
  connectionState: RTCPeerConnectionState | "new";
}

interface CallingContextValue {
  isConnected: boolean;
  startCall: () => Promise<void>;
  call: UiCall | null;
  openIncomingCallDialog: () => void;
}

const CallingContext = createContext<CallingContextValue | null>(null);

const CALL_ACCEPTED_BROADCAST_CHANNEL = "prp-calling-accepted";

interface CallAcceptedBroadcastMessage {
  type: "call-accepted";
  callId: string;
}

const isCallAcceptedBroadcastMessage = (
  value: unknown,
): value is CallAcceptedBroadcastMessage => (
  !!value
  && typeof value === "object"
  && "type" in value
  && value.type === "call-accepted"
  && "callId" in value
  && typeof value.callId === "string"
);

const isGuid = (value: string) =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

const getHttpStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object" || !("response" in error)) return undefined;
  const response = error.response;
  if (!response || typeof response !== "object" || !("status" in response)) return undefined;
  return typeof response.status === "number" ? response.status : undefined;
};

const redactDiagnosticText = (text: string) => text
    .replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+\b/g, "[REDACTED_TOKEN]")
    .replace(/access_token=[^\s&]+/gi, "access_token=[REDACTED]")
    .replace(/candidate:[^\s,;]+/gi, "candidate:[REDACTED]");

const getSafeErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  return redactDiagnosticText(message);
};

const getErrorDiagnosticDetails = (error: unknown) => ({
  errorName: error instanceof Error ? error.name : "UnknownError",
  errorMessage: getSafeErrorMessage(error),
  errorStack: error instanceof Error && error.stack
    ? redactDiagnosticText(error.stack)
    : null,
});

const getPeerDiagnosticDetails = (peer: RTCPeerConnection | null) => ({
  signalingState: peer?.signalingState ?? "no-peer",
  connectionState: peer?.connectionState ?? "no-peer",
  iceConnectionState: peer?.iceConnectionState ?? "no-peer",
});

const getHubDiagnosticDetails = (connection: HubConnection | null) => ({
  hubConnectionState: connection?.state ?? "no-connection",
  connectionId: connection?.connectionId ?? null,
});

const getHubUrl = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "");
  if (!baseUrl) throw new Error("VITE_API_BASE_URL is not configured.");
  const apiBase = baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
  return `${apiBase}/hubs/calling`;
};

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const playEffect = (url: string, onError: () => void) => {
  const audio = new Audio(url);
  audio.play().catch(onError);
};

const logAudioDiagnostic = (
  role: string,
  callId: string,
  event: string,
  details: Record<string, unknown> = {},
) => {
  console.info("[Calling][Audio]", {
    timestamp: new Date().toISOString(),
    role,
    callId,
    event,
    ...details,
  });
};

const CallingOverlays = ({
  call,
  durationSeconds,
  isBusy,
  onAccept,
  onReject,
  onEnd,
  onMute,
  onRemoteAudio,
}: {
  call: UiCall | null;
  durationSeconds: number;
  isBusy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onEnd: () => void;
  onMute: () => void;
  onRemoteAudio: (audio: HTMLAudioElement | null) => void;
}) => {
  const { t } = useTranslation();
  if (!call) return null;

  const incoming = call.status === "Incoming" || call.status === "Accepting";
  const participant = call.direction === "incoming"
    ? call.agentName
    : call.assignedCashierId
      ? `${t("calling.cashier")} #${call.assignedCashierId}`
      : t("calling.cashier");

  return (
    <>
      <audio ref={onRemoteAudio} autoPlay playsInline />
      <div className={styles.overlay} role="presentation">
        <section
          className={styles.callDialog}
          role="dialog"
          aria-modal="true"
          aria-labelledby="calling-title"
          aria-describedby="calling-status"
        >
          <button
            type="button"
            className={styles.closeButton}
            aria-label={t("common.close")}
            onClick={incoming ? onReject : onEnd}
            disabled={isBusy}
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div className={styles.callIcon} aria-hidden="true">
            {incoming ? <PhoneIncoming size={25} /> : <AudioLines size={25} />}
          </div>
          <span className={styles.callEyebrow}>
            {incoming ? t("calling.incomingCall") : t("calling.conversation")}
          </span>
          <h2 id="calling-title">{participant}</h2>
          <p id="calling-status" className={styles.callStatus}>
            {call.status === "Incoming" && t("calling.incomingStatus")}
            {call.status === "Accepting" && t("calling.accepting")}
            {call.status === "Ringing" && t("calling.ringing")}
            {call.status === "ConnectingAudio" && t("calling.connecting")}
            {call.status === "InCall" && t("calling.connected")}
            {call.status === "Ending" && t("calling.ending")}
          </p>
          {!incoming && (
            <div className={styles.callMeta}>
              <span className={call.connectionState === "connected" ? styles.connectionConnected : ""}>
                <Radio size={14} aria-hidden="true" />
                {call.connectionState === "connected"
                  ? t("calling.connected")
                  : call.connectionState === "failed"
                    ? t("calling.connectionLost")
                    : call.connectionState === "disconnected"
                      ? t("calling.connectionUnstable")
                    : t("calling.connecting")}
              </span>
              <strong>{formatDuration(durationSeconds)}</strong>
            </div>
          )}
          <div className={styles.callActions}>
            {incoming ? (
              <>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={onReject}
                  disabled={isBusy}
                >
                  <PhoneOff size={17} aria-hidden="true" />
                  {t("calling.reject")}
                </button>
                <button
                  type="button"
                  className={styles.acceptButton}
                  onClick={onAccept}
                  disabled={isBusy}
                  aria-busy={call.status === "Accepting"}
                >
                  <Phone size={17} aria-hidden="true" />
                  {t("calling.answer")}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.muteButton}
                  onClick={onMute}
                  disabled={isBusy || call.status === "Ending"}
                  aria-pressed={call.muted}
                >
                  {call.muted
                    ? <MicOff size={17} aria-hidden="true" />
                    : <Mic size={17} aria-hidden="true" />}
                  {t(call.muted ? "calling.unmute" : "calling.mute")}
                </button>
                <button
                  type="button"
                  className={styles.rejectButton}
                  onClick={onEnd}
                  disabled={isBusy || call.status === "Ending"}
                >
                  <PhoneOff size={17} aria-hidden="true" />
                  {t("calling.end")}
                </button>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
};

export const CallingProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const translationRef = useRef(t);
  translationRef.current = t;
  const token = useAppSelector((state) => state.auth.token);
  const role = useAppSelector((state) => state.auth.user?.role.toLowerCase() ?? "");
  const username = useAppSelector((state) => state.auth.user?.username ?? "");
  const usernameRef = useRef(username);
  usernameRef.current = username;
  const isAllowedRole = role === "agent" || role === "cashier";
  const [isConnected, setIsConnected] = useState(false);
  const [call, setCallState] = useState<UiCall | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const [isIncomingCallDialogOpen, setIsIncomingCallDialogOpen] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const callRef = useRef<UiCall | null>(null);
  const callAcceptedCallIdRef = useRef<string | null>(null);
  const callAcceptedChannelRef = useRef<BroadcastChannel | null>(null);
  const negotiationGuardRef = useRef(new CallNegotiationGuard());
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const peerStartingRef = useRef(false);
  const startCallInProgressRef = useRef(false);
  const peerStatsTimerRef = useRef<number | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef(new RemoteIceCandidateQueue());
  const pendingLocalCandidatesRef = useRef<WebRtcIceCandidateEvent[]>([]);
  const localDescriptionSentCallIdRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<WebRtcDescriptionEvent | null>(null);
  const ringtoneContextRef = useRef<AudioContext | null>(null);
  const ringtoneTimerRef = useRef<number | null>(null);
  const ringtoneCallIdRef = useRef<string | null>(null);
  const ringtoneNodesRef = useRef(new Set<{
    oscillator: OscillatorNode;
    gain: GainNode;
  }>());
  const agentRingbackRef = useRef<HTMLAudioElement | null>(null);
  const updateCall = useCallback((next: UiCall | null | ((current: UiCall | null) => UiCall | null)) => {
    const updated = typeof next === "function" ? next(callRef.current) : next;
    callRef.current = updated;
    setCallState(updated);
  }, []);

  const setRemoteAudio = useCallback((audio: HTMLAudioElement | null) => {
    remoteAudioRef.current = audio;
    if (audio) {
      audio.autoplay = true;
      audio.setAttribute("playsinline", "");
      audio.muted = false;
      audio.volume = 1;
    }
    if (audio && remoteStreamRef.current) {
      audio.srcObject = remoteStreamRef.current;
      logAudioDiagnostic(role, callRef.current?.callId ?? "unknown", "remote audio attached to element", {
        attached: audio.srcObject === remoteStreamRef.current,
        trackCount: remoteStreamRef.current.getAudioTracks().length,
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      void audio.play().then(() => {
        logAudioDiagnostic(role, callRef.current?.callId ?? "unknown", "remote audio playback started", {
          muted: audio.muted,
          volume: audio.volume,
          paused: audio.paused,
          readyState: audio.readyState,
          ...getPeerDiagnosticDetails(peerRef.current),
        });
      }).catch((error: unknown) => {
        logAudioDiagnostic(role, callRef.current?.callId ?? "unknown", "audio.play rejected", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          message: getSafeErrorMessage(error),
          ...getPeerDiagnosticDetails(peerRef.current),
        });
        toast.warning(translationRef.current("calling.remoteAudioPlaybackFailed"));
      });
    }
  }, [role]);

  const stopRingtone = useCallback((reason = "unspecified") => {
    const agentRingback = agentRingbackRef.current;
    if (agentRingback) {
      agentRingback.pause();
      agentRingback.currentTime = 0;
      agentRingbackRef.current = null;
    }
    if (ringtoneTimerRef.current !== null) {
      window.clearTimeout(ringtoneTimerRef.current);
      ringtoneTimerRef.current = null;
    }
    const context = ringtoneContextRef.current;
    const hadRingtone = !!context || ringtoneNodesRef.current.size > 0;
    if (hadRingtone) {
      logAudioDiagnostic(role, callRef.current?.callId ?? ringtoneCallIdRef.current ?? "none", "incoming ringtone stopped", {
        reason,
        contextState: context?.state ?? "no-context",
        activeOscillatorCount: ringtoneNodesRef.current.size,
        callStatus: callRef.current?.status ?? null,
      });
    }
    ringtoneContextRef.current = null;
    ringtoneCallIdRef.current = null;
    ringtoneNodesRef.current.forEach(({ oscillator, gain }) => {
      if (context && context.state !== "closed") {
        gain.gain.cancelScheduledValues(context.currentTime);
        gain.gain.setValueAtTime(0, context.currentTime);
      }
      oscillator.stop();
      oscillator.disconnect();
      gain.disconnect();
    });
    ringtoneNodesRef.current.clear();
    if (context && context.state !== "closed") {
      void context.close();
    }
  }, [role]);

  const startTonePattern = useCallback((
    notes: Array<{ frequency: number; offset: number; duration: number }>,
    interval: number,
  ) => {
    const currentCall = callRef.current;
    if (
      !currentCall
      || currentCall.direction !== "incoming"
      || currentCall.status !== "Incoming"
    ) return;
    if (
      ringtoneContextRef.current
      && ringtoneContextRef.current.state !== "closed"
      && ringtoneCallIdRef.current === currentCall.callId
    ) return;
    stopRingtone("starting ringtone for a new incoming call");
    if (typeof window.AudioContext === "undefined") {
      toast.warning(translationRef.current("calling.ringtonePlaybackFailed"));
      return;
    }

    const context = new AudioContext();
    ringtoneContextRef.current = context;
    ringtoneCallIdRef.current = currentCall.callId;
    logAudioDiagnostic(role, currentCall.callId, "incoming ringtone started", {
      contextState: context.state,
    });
    const playRingBurst = () => {
      if (ringtoneContextRef.current !== context || context.state !== "running") return;
      const activeCall = callRef.current;
      if (
        activeCall?.callId !== ringtoneCallIdRef.current
        || activeCall.direction !== "incoming"
        || activeCall.status !== "Incoming"
      ) {
        stopRingtone("call is no longer waiting for an answer");
        return;
      }
      const startAt = context.currentTime;
      for (const note of notes) {
        const noteStart = startAt + note.offset;
        const gain = context.createGain();
        gain.gain.setValueAtTime(0, noteStart);
        gain.gain.linearRampToValueAtTime(0.16, noteStart + 0.025);
        gain.gain.setValueAtTime(0.16, noteStart + note.duration * 0.75);
        gain.gain.linearRampToValueAtTime(0, noteStart + note.duration);
        gain.connect(context.destination);

        const oscillator = context.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = note.frequency;
        oscillator.connect(gain);
        const nodes = { oscillator, gain };
        ringtoneNodesRef.current.add(nodes);
        oscillator.addEventListener("ended", () => {
          ringtoneNodesRef.current.delete(nodes);
          oscillator.disconnect();
          gain.disconnect();
        }, { once: true });
        oscillator.start(noteStart);
        oscillator.stop(noteStart + note.duration);
      }

      ringtoneTimerRef.current = window.setTimeout(playRingBurst, interval);
    };

    void context.resume()
      .then(() => {
        if (ringtoneContextRef.current === context) playRingBurst();
      })
      .catch(() => {
        if (ringtoneContextRef.current !== context) return;
        stopRingtone("ringtone AudioContext resume failed");
        toast.warning(translationRef.current("calling.ringtonePlaybackFailed"));
      });
  }, [role, stopRingtone]);

  const startRingtone = useCallback(() => {
    startTonePattern([
      { frequency: 740, offset: 0, duration: 0.2 },
      { frequency: 880, offset: 0.26, duration: 0.28 },
    ], 2200);
  }, [startTonePattern]);

  const startAgentRingback = useCallback(() => {
    stopRingtone("starting Agent ringback");
    const ringback = new Audio("/audio/agent-call-ringback.mp3");
    ringback.loop = true;
    agentRingbackRef.current = ringback;
    void ringback.play().catch(() => {
      if (agentRingbackRef.current === ringback) agentRingbackRef.current = null;
      toast.warning(translationRef.current("calling.ringtonePlaybackFailed"));
    });
  }, [stopRingtone]);

  const closeMedia = useCallback((reason: string) => {
    if (peerStatsTimerRef.current !== null) {
      window.clearInterval(peerStatsTimerRef.current);
      peerStatsTimerRef.current = null;
    }
    const callId = callRef.current?.callId ?? "none";
    const peer = peerRef.current;
    if (peer) {
      logAudioDiagnostic(role, callId, "RTCPeerConnection close started", {
        reason,
        signalingState: peer.signalingState,
        connectionState: peer.connectionState,
        iceConnectionState: peer.iceConnectionState,
      });
      peer.close();
      logAudioDiagnostic(role, callId, "RTCPeerConnection closed", { reason });
    }
    peerRef.current = null;
    peerStartingRef.current = false;
    const tracks = localStreamRef.current?.getTracks() ?? [];
    if (tracks.length > 0) {
      logAudioDiagnostic(role, callId, "local media track stop started", {
        reason,
        trackCount: tracks.length,
        audioTrackCount: tracks.filter((track) => track.kind === "audio").length,
      });
      tracks.forEach((track) => track.stop());
      logAudioDiagnostic(role, callId, "local media tracks stopped", {
        reason,
        trackCount: tracks.length,
      });
    }
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    remoteStreamRef.current = null;
    pendingCandidatesRef.current.clear();
    pendingLocalCandidatesRef.current = [];
    localDescriptionSentCallIdRef.current = null;
    pendingOfferRef.current = null;
  }, [role]);

  const finishCall = useCallback((reason: string) => {
    const callId = callRef.current?.callId ?? "none";
    if (callId !== "none") {
      logAudioDiagnostic(role, callId, "call cleanup started", { reason });
    }
    stopRingtone(`call cleanup: ${reason}`);
    closeMedia(reason);
    callAcceptedCallIdRef.current = null;
    negotiationGuardRef.current.clear();
    setIsIncomingCallDialogOpen(false);
    updateCall(null);
    setDurationSeconds(0);
    setIsBusy(false);
    if (callId !== "none") {
      logAudioDiagnostic(role, callId, "call cleanup completed", { reason });
    }
  }, [closeMedia, role, stopRingtone, updateCall]);

  useEffect(() => {
    if (role !== "cashier" || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(CALL_ACCEPTED_BROADCAST_CHANNEL);
    callAcceptedChannelRef.current = channel;
    const onMessage = (event: MessageEvent<unknown>) => {
      if (!isCallAcceptedBroadcastMessage(event.data)) return;
      const current = callRef.current;
      if (
        current?.callId !== event.data.callId
        || current.direction !== "incoming"
        || current.status !== "Incoming"
      ) return;
      logAudioDiagnostic(role, current.callId, "call accepted in another cashier tab");
      finishCall("call accepted in another cashier tab");
    };
    channel.addEventListener("message", onMessage);
    return () => {
      channel.removeEventListener("message", onMessage);
      if (callAcceptedChannelRef.current === channel) {
        callAcceptedChannelRef.current = null;
      }
      channel.close();
    };
  }, [finishCall, role]);

  const notifyCallError = useCallback((error: unknown, fallbackKey: string) => {
    toast.error(getApiErrorMessage(error, translationRef.current(fallbackKey)));
  }, []);

  const ensureMedia = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      logAudioDiagnostic(role, callRef.current?.callId ?? "pending", "getUserMedia unavailable");
      throw new Error(translationRef.current("calling.microphoneUnavailable"));
    }
    if (!localStreamRef.current) {
      logAudioDiagnostic(role, callRef.current?.callId ?? "pending", "requesting microphone");
      try {
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
      } catch (error) {
        logAudioDiagnostic(role, callRef.current?.callId ?? "pending", "microphone permission result", {
          result: "failed",
          ...getErrorDiagnosticDetails(error),
        });
        logAudioDiagnostic(role, callRef.current?.callId ?? "pending", "getUserMedia failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          message: getSafeErrorMessage(error),
        });
        throw error;
      }
      const tracks = localStreamRef.current.getAudioTracks();
      logAudioDiagnostic(role, callRef.current?.callId ?? "pending", "microphone permission result", {
        result: "granted",
        audioTrackCount: tracks.length,
      });
      logAudioDiagnostic(role, callRef.current?.callId ?? "pending", "microphone acquired", {
        audioTrackCount: tracks.length,
        tracks: tracks.map((track) => ({
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        })),
      });
    }
    return localStreamRef.current;
  }, [role]);

  const invokeSignal = useCallback(async (method: string, payload: object) => {
    const callId = "callId" in payload && typeof payload.callId === "string" ? payload.callId : "unknown";
    const connection = connectionRef.current;
    if (method === "SendWebRtcOffer" && callAcceptedCallIdRef.current !== callId) {
      const error = new Error("Offer requires a matching accepted call.");
      logAudioDiagnostic(role, callId, "SignalR invocation skipped", {
        method,
        outcome: "exception",
        ...getErrorDiagnosticDetails(error),
        ...getHubDiagnosticDetails(connection),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      throw error;
    }
    if (!connection || connection.state !== HubConnectionState.Connected) {
      const error = new Error(translationRef.current("calling.connectionUnavailable"));
      logAudioDiagnostic(role, callId, "SignalR invocation skipped", {
        method,
        outcome: "exception",
        ...getErrorDiagnosticDetails(error),
        ...getHubDiagnosticDetails(connection),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      throw error;
    }
    const startedAt = performance.now();
    const eventPrefix = method === "SendWebRtcOffer"
      || method === "SendWebRtcAnswer"
      || method === "SendWebRtcIceCandidate"
      ? method
      : "SignalR invocation";
    logAudioDiagnostic(role, callId, `${eventPrefix} started`, {
      method,
      ...getHubDiagnosticDetails(connection),
      ...getPeerDiagnosticDetails(peerRef.current),
    });
    try {
      await connection.invoke(method, payload);
      logAudioDiagnostic(role, callId, `${eventPrefix} succeeded`, {
        method,
        elapsedMs: Math.round(performance.now() - startedAt),
        ...getHubDiagnosticDetails(connection),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
    } catch (error) {
      logAudioDiagnostic(role, callId, `${eventPrefix} failed`, {
        method,
        outcome: "exception",
        ...getErrorDiagnosticDetails(error),
        elapsedMs: Math.round(performance.now() - startedAt),
        ...getHubDiagnosticDetails(connection),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      throw error;
    }
  }, [role]);

  const flushCandidates = useCallback(async (peer: RTCPeerConnection, callId: string) => {
    logAudioDiagnostic(role, callId, "flushing queued remote ICE candidates", {
      queuedCandidateCount: pendingCandidatesRef.current.size,
      remoteDescriptionSet: !!peer.remoteDescription,
    });
    if (!peer.remoteDescription) return;
    await pendingCandidatesRef.current.flush(async (candidate) => {
      if (callRef.current?.callId !== callId || peerRef.current !== peer) return;
      if (candidate.callId !== callId) {
        logAudioDiagnostic(role, callId, "queued remote ICE candidate ignored: callId mismatch", {
          candidateCallId: candidate.callId,
        });
        return;
      }
      if (!candidate.candidate) return;
      try {
        await peer.addIceCandidate(new RTCIceCandidate({
          candidate: candidate.candidate,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          usernameFragment: candidate.usernameFragment ?? undefined,
        }));
        logAudioDiagnostic(role, callId, "queued remote ICE candidate applied", {
          candidateCallId: candidate.callId,
          callIdMatches: candidate.callId === callId,
          ...getPeerDiagnosticDetails(peer),
        });
      } catch (error) {
        logAudioDiagnostic(role, callId, "queued remote ICE candidate failed", {
          candidateCallId: candidate.callId,
          callIdMatches: candidate.callId === callId,
          ...getErrorDiagnosticDetails(error),
          ...getPeerDiagnosticDetails(peer),
        });
        throw error;
      }
    });
  }, [role]);

  const flushLocalCandidates = useCallback(async (callId: string) => {
    if (callRef.current?.callId !== callId) return;
    while (pendingLocalCandidatesRef.current.length > 0) {
      const candidates = pendingLocalCandidatesRef.current.splice(0);
      for (const candidate of candidates) {
        if (callRef.current?.callId !== callId) return;
        logAudioDiagnostic(role, callId, "queued local ICE candidate send started", {
          candidateCallId: candidate.callId,
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          usernameFragmentPresent: !!candidate.usernameFragment,
          batchCandidateCount: candidates.length,
          remainingQueuedCandidateCount: pendingLocalCandidatesRef.current.length,
          ...getPeerDiagnosticDetails(peerRef.current),
        });
        await invokeSignal("SendWebRtcIceCandidate", candidate);
        logAudioDiagnostic(role, callId, "queued local ICE candidate sent", {
          candidateCallId: candidate.callId,
          ...getPeerDiagnosticDetails(peerRef.current),
        });
      }
    }
    if (callRef.current?.callId === callId) {
      localDescriptionSentCallIdRef.current = callId;
    }
  }, [invokeSignal, role]);

  const processOffer = useCallback(async (offer: WebRtcDescriptionEvent) => {
    const peer = peerRef.current;
    if (!peer || peer.signalingState !== "stable") {
      logAudioDiagnostic(role, offer.callId, "offer queued until peer is ready", {
        peerAvailable: !!peer,
        signalingState: peer?.signalingState ?? "no-peer",
      });
      pendingOfferRef.current = offer;
      return;
    }
    if (!negotiationGuardRef.current.claimAnswer(offer.callId)) {
      logAudioDiagnostic(role, offer.callId, "duplicate WebRtcOffer ignored");
      return;
    }
    let stage = "setRemoteDescription(offer)";
    logAudioDiagnostic(role, offer.callId, "offer processing started", {
      ...getPeerDiagnosticDetails(peer),
    });
    try {
      logAudioDiagnostic(role, offer.callId, "setRemoteDescription(offer) started", {
        ...getPeerDiagnosticDetails(peer),
      });
      await peer.setRemoteDescription(new RTCSessionDescription({
        type: "offer",
        sdp: offer.sdp,
      }));
      if (callRef.current?.callId !== offer.callId || peerRef.current !== peer) return;
      logAudioDiagnostic(role, offer.callId, "setRemoteDescription(offer) completed", {
        ...getPeerDiagnosticDetails(peer),
      });
      stage = "flush remote ICE candidates";
      await flushCandidates(peer, offer.callId);
      if (callRef.current?.callId !== offer.callId || peerRef.current !== peer) return;
      stage = "createAnswer";
      logAudioDiagnostic(role, offer.callId, "createAnswer started", {
        ...getPeerDiagnosticDetails(peer),
      });
      const answer = await peer.createAnswer();
      logAudioDiagnostic(role, offer.callId, "createAnswer completed", {
        sdpType: answer.type,
        sdpPresent: !!answer.sdp,
        sdpLength: answer.sdp?.length ?? 0,
        ...getPeerDiagnosticDetails(peer),
      });
      stage = "setLocalDescription(answer)";
      logAudioDiagnostic(role, offer.callId, "setLocalDescription(answer) started", {
        sdpType: answer.type,
        ...getPeerDiagnosticDetails(peer),
      });
      await peer.setLocalDescription(answer);
      if (callRef.current?.callId !== offer.callId || peerRef.current !== peer) return;
      logAudioDiagnostic(role, offer.callId, "setLocalDescription(answer) completed", {
        ...getPeerDiagnosticDetails(peer),
      });
      stage = "SendWebRtcAnswer";
      await invokeSignal("SendWebRtcAnswer", {
        callId: offer.callId,
        sdp: answer.sdp,
      });
      stage = "flush local ICE candidates";
      await flushLocalCandidates(offer.callId);
    } catch (error) {
      logAudioDiagnostic(role, offer.callId, "offer processing failed", {
        stage,
        ...getErrorDiagnosticDetails(error),
        ...getHubDiagnosticDetails(connectionRef.current),
        ...getPeerDiagnosticDetails(peer),
      });
      if (callRef.current?.callId !== offer.callId || peerRef.current !== peer) return;
      notifyCallError(error, "calling.audioConnectionFailed");
    }
  }, [flushCandidates, flushLocalCandidates, invokeSignal, notifyCallError, role]);

  const startPeerConnection = useCallback(async (callId: string, createOffer: boolean) => {
    if (peerRef.current || peerStartingRef.current) return;
    peerStartingRef.current = true;
    const startedAt = performance.now();
    let stage = "microphone acquisition";
    try {
      const stream = await ensureMedia();
      stage = "ICE server lookup";
      const { iceServers } = await callingService.getIceServers();
      if (callRef.current?.callId !== callId) return;
      logAudioDiagnostic(role, callId, "ICE servers loaded", {
        serverCount: iceServers.length,
        turnServerCount: iceServers.filter((server) =>
          (Array.isArray(server.urls) ? server.urls : [server.urls])
            .some((url) => url.toLowerCase().startsWith("turn:") || url.toLowerCase().startsWith("turns:")),
        ).length,
      });
      stage = "RTCPeerConnection creation";
      const peer = new RTCPeerConnection({
        iceServers: iceServers.map((server) => ({
          urls: server.urls,
          username: server.username ?? undefined,
          credential: server.credential ?? undefined,
        })),
      });
      peerRef.current = peer;
      logAudioDiagnostic(role, callId, "RTCPeerConnection created", {
        ...getPeerDiagnosticDetails(peer),
      });
      stage = "RTCPeerConnection setup";
      localDescriptionSentCallIdRef.current = null;
      pendingLocalCandidatesRef.current = [];
      let previousSignalingState = peer.signalingState;
      let previousConnectionState = peer.connectionState;
      let previousIceConnectionState = peer.iceConnectionState;
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        peer.addTrack(track, stream);
        logAudioDiagnostic(role, callId, "local audio track added", {
          audioTrackCount: audioTracks.length,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState,
        });
      });
      peer.ontrack = (event) => {
        const remoteStream = event.streams[0] ?? new MediaStream([event.track]);
        remoteStreamRef.current = remoteStream;
        logAudioDiagnostic(role, callId, "remote track received", {
          trackKind: event.track.kind,
          trackEnabled: event.track.enabled,
          trackMuted: event.track.muted,
          trackReadyState: event.track.readyState,
          streamCount: event.streams.length,
          ...getPeerDiagnosticDetails(peer),
        });
        const audio = remoteAudioRef.current;
        if (audio) {
          audio.muted = false;
          audio.volume = 1;
          audio.setAttribute("playsinline", "");
          audio.srcObject = remoteStream;
          logAudioDiagnostic(role, callId, "remote audio attached to element", {
            attached: audio.srcObject === remoteStream,
            trackCount: remoteStream.getAudioTracks().length,
            ...getPeerDiagnosticDetails(peer),
          });
          void audio.play().then(() => {
            logAudioDiagnostic(role, callId, "remote audio playback started", {
              muted: audio.muted,
              volume: audio.volume,
              paused: audio.paused,
              readyState: audio.readyState,
              ...getPeerDiagnosticDetails(peer),
            });
          }).catch((error: unknown) => {
            logAudioDiagnostic(role, callId, "remote audio playback rejected", {
              errorName: error instanceof Error ? error.name : "UnknownError",
              message: getSafeErrorMessage(error),
              muted: audio.muted,
              volume: audio.volume,
              paused: audio.paused,
              readyState: audio.readyState,
              ...getPeerDiagnosticDetails(peer),
            });
            toast.warning(translationRef.current("calling.remoteAudioPlaybackFailed"));
          });
        } else {
          logAudioDiagnostic(role, callId, "remote audio element not mounted yet");
        }
      };
      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          logAudioDiagnostic(role, callId, "local ICE candidate gathering complete", {
            iceGatheringState: peer.iceGatheringState,
            ...getPeerDiagnosticDetails(peer),
          });
          return;
        }
        const candidate: WebRtcIceCandidateEvent = {
          callId,
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid,
          sdpMLineIndex: event.candidate.sdpMLineIndex,
          usernameFragment: event.candidate.usernameFragment,
        };
        logAudioDiagnostic(role, callId, "local ICE candidate", {
          sdpMid: candidate.sdpMid,
          sdpMLineIndex: candidate.sdpMLineIndex,
          usernameFragmentPresent: !!candidate.usernameFragment,
          signalingState: peer.signalingState,
          connectionState: peer.connectionState,
          iceConnectionState: peer.iceConnectionState,
        });
        if (localDescriptionSentCallIdRef.current !== callId) {
          pendingLocalCandidatesRef.current.push(candidate);
          logAudioDiagnostic(role, callId, "local ICE candidate queued until description sent", {
            candidateCallId: candidate.callId,
            queuedCandidateCount: pendingLocalCandidatesRef.current.length,
            signalingState: peer.signalingState,
            connectionState: peer.connectionState,
            iceConnectionState: peer.iceConnectionState,
          });
          return;
        }
        void invokeSignal("SendWebRtcIceCandidate", candidate)
          .catch((error: unknown) => {
            notifyCallError(error, "calling.signalingFailed");
          });
      };
      peer.onsignalingstatechange = () => {
        const nextSignalingState = peer.signalingState;
        logAudioDiagnostic(role, callId, "signaling state changed", {
          previousState: previousSignalingState,
          newState: nextSignalingState,
        });
        previousSignalingState = nextSignalingState;
      };
      peer.oniceconnectionstatechange = () => {
        const nextIceConnectionState = peer.iceConnectionState;
        logAudioDiagnostic(role, callId, "ICE connection state changed", {
          previousState: previousIceConnectionState,
          newState: nextIceConnectionState,
          connectionState: peer.connectionState,
          iceGatheringState: peer.iceGatheringState,
          signalingState: peer.signalingState,
        });
        previousIceConnectionState = nextIceConnectionState;
      };
      peer.onicegatheringstatechange = () => {
        logAudioDiagnostic(role, callId, "ICE gathering state changed", {
          iceGatheringState: peer.iceGatheringState,
          iceConnectionState: peer.iceConnectionState,
          signalingState: peer.signalingState,
        });
      };
      peer.onicecandidateerror = (event) => {
        logAudioDiagnostic(role, callId, "ICE candidate error", {
          errorCode: event.errorCode,
          errorText: event.errorText,
          url: event.url,
          addressPresent: !!event.address,
          port: event.port,
        });
      };
      peer.onconnectionstatechange = () => {
        const connectionState = peer.connectionState;
        logAudioDiagnostic(role, callId, "peer connection state changed", {
          previousState: previousConnectionState,
          newState: connectionState,
          iceConnectionState: peer.iceConnectionState,
          signalingState: peer.signalingState,
        });
        previousConnectionState = connectionState;
        updateCall((current) => current?.callId === callId
          ? {
              ...current,
              connectionState,
              status: connectionState === "connected" ? "InCall" : "ConnectingAudio",
            }
          : current);
        if (connectionState === "failed") {
          toast.error(translationRef.current("calling.audioConnectionFailed"));
        }
      };
      logAudioDiagnostic(role, callId, "peer connection event listeners registered", {
        connectionState: peer.connectionState,
        iceConnectionState: peer.iceConnectionState,
        iceGatheringState: peer.iceGatheringState,
        signalingState: peer.signalingState,
      });
      peerStatsTimerRef.current = window.setInterval(() => {
        if (peerRef.current !== peer) return;
        void peer.getStats().then((stats) => {
          const transport = Array.from(stats.values())
            .find((report) => report.type === "transport") as RTCTransportStats | undefined;
          const selectedPairId = transport?.selectedCandidatePairId;
          const selectedPair = selectedPairId
            ? stats.get(selectedPairId) as RTCIceCandidatePairStats | undefined
            : undefined;
          const localCandidate = selectedPair?.localCandidateId
            ? stats.get(selectedPair.localCandidateId) as (RTCStats & {
              candidateType?: string;
              protocol?: string;
              relayProtocol?: string;
            }) | undefined
            : undefined;
          const remoteCandidate = selectedPair?.remoteCandidateId
            ? stats.get(selectedPair.remoteCandidateId) as (RTCStats & {
              candidateType?: string;
              protocol?: string;
            }) | undefined
            : undefined;
          const inboundAudio = Array.from(stats.values())
            .filter((report) =>
              report.type === "inbound-rtp"
              && (report as RTCInboundRtpStreamStats).kind === "audio",
            )
            .map((report) => {
              const audioReport = report as RTCInboundRtpStreamStats;
              return {
                bytesReceived: audioReport.bytesReceived,
                packetsReceived: audioReport.packetsReceived,
                packetsLost: audioReport.packetsLost,
              };
            });
          const outboundAudio = Array.from(stats.values())
            .filter((report) =>
              report.type === "outbound-rtp"
              && (report as RTCOutboundRtpStreamStats).kind === "audio",
            )
            .map((report) => {
              const audioReport = report as RTCOutboundRtpStreamStats;
              return {
                bytesSent: audioReport.bytesSent,
                packetsSent: audioReport.packetsSent,
              };
            });
          logAudioDiagnostic(role, callId, "audio stats", {
            connectionState: peer.connectionState,
            iceConnectionState: peer.iceConnectionState,
            signalingState: peer.signalingState,
            inboundAudio,
            outboundAudio,
            selectedCandidatePair: selectedPair ? {
              id: selectedPair.id,
              state: selectedPair.state,
              nominated: selectedPair.nominated,
              bytesSent: selectedPair.bytesSent,
              bytesReceived: selectedPair.bytesReceived,
              currentRoundTripTime: selectedPair.currentRoundTripTime,
              localCandidate: localCandidate ? {
                candidateType: localCandidate.candidateType,
                protocol: localCandidate.protocol,
                relayProtocol: localCandidate.relayProtocol,
              } : null,
              remoteCandidate: remoteCandidate ? {
                candidateType: remoteCandidate.candidateType,
                protocol: remoteCandidate.protocol,
              } : null,
            } : null,
          });
        }).catch((error: unknown) => {
          logAudioDiagnostic(role, callId, "getStats failed", {
            message: getSafeErrorMessage(error),
          });
        });
      }, 5000);
      updateCall((current) => current?.callId === callId
        ? { ...current, status: "ConnectingAudio", connectionState: "new" }
        : current);

      if (createOffer) {
        stage = "createOffer";
        logAudioDiagnostic(role, callId, "createOffer started", {
          ...getPeerDiagnosticDetails(peer),
        });
        const offer = await peer.createOffer();
        if (callRef.current?.callId !== callId) return;
        logAudioDiagnostic(role, callId, "createOffer completed", {
          sdpType: offer.type,
          sdpPresent: !!offer.sdp,
          sdpLength: offer.sdp?.length ?? 0,
          ...getPeerDiagnosticDetails(peer),
        });
        stage = "setLocalDescription(offer)";
        logAudioDiagnostic(role, callId, "setLocalDescription(offer) started", {
          sdpType: offer.type,
          ...getPeerDiagnosticDetails(peer),
        });
        await peer.setLocalDescription(offer);
        logAudioDiagnostic(role, callId, "setLocalDescription(offer) completed", {
          ...getPeerDiagnosticDetails(peer),
        });
        if (callRef.current?.callId !== callId) return;
        stage = "SendWebRtcOffer";
        await invokeSignal("SendWebRtcOffer", { callId, sdp: offer.sdp });
        stage = "flush local ICE candidates";
        await flushLocalCandidates(callId);
      } else if (pendingOfferRef.current?.callId === callId) {
        const offer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        await processOffer(offer);
      }
    } catch (error) {
      logAudioDiagnostic(role, callId, "peer connection setup failed", {
        stage,
        elapsedMs: Math.round(performance.now() - startedAt),
        ...getErrorDiagnosticDetails(error),
        ...getHubDiagnosticDetails(connectionRef.current),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      closeMedia("peer connection setup failed");
      if (callRef.current?.callId !== callId) return;
      updateCall((current) => current?.callId === callId
        ? { ...current, status: "ConnectingAudio", connectionState: "failed" }
        : current);
      notifyCallError(error, "calling.audioConnectionFailed");
    } finally {
      peerStartingRef.current = false;
    }
  }, [closeMedia, ensureMedia, flushLocalCandidates, invokeSignal, notifyCallError, processOffer, role, updateCall]);

  useEffect(() => {
    if (!token || !isAllowedRole) {
      setIsConnected(false);
      connectionRef.current = null;
      finishCall("authentication removed or role unsupported");
      return;
    }

    let active = true;
    let retryAttempt = 0;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let hubUrl: string;
    try {
      hubUrl = getHubUrl();
    } catch (error) {
      notifyCallError(error, "calling.connectionUnavailable");
      return;
    }
    const connection = new HubConnectionBuilder()
      .withUrl(hubUrl, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();
    connectionRef.current = connection;
    const getHubDiagnosticContext = () => ({
      user: usernameRef.current || null,
      userId: getUserIdFromToken(token),
      connectionId: connection.connectionId ?? null,
      hubConnectionState: connection.state,
    });
    let stoppingCallId: string | null = null;
    const stopHubConnection = async (reason: string) => {
      const callId = callRef.current?.callId ?? "none";
      stoppingCallId = callId;
      logAudioDiagnostic(role, callId, "Calling Hub stop started", {
        reason,
        ...getHubDiagnosticContext(),
      });
      try {
        await connection.stop();
        logAudioDiagnostic(role, callId, "Calling Hub stop succeeded", {
          reason,
          ...getHubDiagnosticContext(),
        });
      } catch (error) {
        logAudioDiagnostic(role, callId, "Calling Hub stop failed", {
          reason,
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorMessage: getSafeErrorMessage(error),
          ...getHubDiagnosticContext(),
        });
      }
    };

    connection.on("IncomingCall", (event: IncomingCallEvent) => {
      logAudioDiagnostic(role, event?.callId ?? "unknown", "IncomingCall received", {
        currentCallId: callRef.current?.callId ?? null,
        currentCallStatus: callRef.current?.status ?? null,
        ...getHubDiagnosticContext(),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      if (role !== "cashier" || !event?.callId || callRef.current?.callId === event.callId) return;
      if (callRef.current) {
        toast.info(translationRef.current("calling.alreadyOnCall"));
        return;
      }
      const incoming: UiCall = {
        callId: event.callId,
        status: "Incoming",
        direction: "incoming",
        agentName: event.agentName,
        startedAt: event.startedAt,
        muted: false,
        connectionState: "new",
      };
      setIsIncomingCallDialogOpen(false);
      logAudioDiagnostic(role, event.callId, "incoming call displayed", {
        ...getHubDiagnosticContext(),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      updateCall(incoming);
      startRingtone();
    });

    connection.on("CallAccepted", (event: CallAcceptedEvent) => {
      const current = callRef.current;
      const peer = peerRef.current;
      logAudioDiagnostic(role, event?.callId ?? "unknown", "CallAccepted received", {
        currentCallId: current?.callId ?? null,
        callIdMatches: current?.callId === event?.callId,
        assignedCashierId: event?.assignedCashierId ?? null,
        acceptedAt: event?.acceptedAt ?? null,
        currentCallStatus: current?.status ?? null,
        ...getHubDiagnosticContext(),
        ...getPeerDiagnosticDetails(peer),
      });
      if (
        role === "cashier"
        && current?.direction === "incoming"
        && current.callId === event?.callId
      ) {
        if (current.status === "Incoming") {
          finishCall("CallAccepted received by another cashier session");
        } else {
          stopRingtone("matching CallAccepted event received");
        }
      }
      if (role !== "agent" || !current || current.callId !== event?.callId) return;
      if (!Number.isInteger(event.assignedCashierId) || event.assignedCashierId <= 0) {
        logAudioDiagnostic(role, event.callId, "CallAccepted ignored: invalid assignedCashierId");
        return;
      }
      if (!negotiationGuardRef.current.claimOffer(event.callId)) {
        logAudioDiagnostic(role, event.callId, "duplicate CallAccepted ignored");
        return;
      }
      callAcceptedCallIdRef.current = event.callId;
      stopRingtone("Agent received CallAccepted");
      playEffect("/audio/prp-option-confirmation-hy.mp3", () => {
        toast.warning(translationRef.current("calling.soundPlaybackFailed"));
      });
      updateCall({
        ...current,
        status: "ConnectingAudio",
        assignedCashierId: event.assignedCashierId,
        acceptedAt: event.acceptedAt,
      });
      void startPeerConnection(event.callId, true);
    });

    connection.on("CallTakenByAnotherCashier", (event: CallAcceptedEvent) => {
      if (callRef.current?.callId !== event?.callId || role !== "cashier") return;
      finishCall("CallTakenByAnotherCashier event");
      toast.info(translationRef.current("calling.takenByAnotherCashier"));
    });

    connection.on("CallRejected", (event: { callId: string; status?: string }) => {
      if (callRef.current?.callId !== event?.callId) return;
      finishCall("CallRejected event");
      if (role === "agent" || event.status === "Rejected") {
        toast.info(translationRef.current("calling.callRejected"));
      }
    });

    connection.on("CallEnded", (event: CallDetails | { callId: string; status: string }) => {
      if (callRef.current?.callId !== event?.callId) return;
      finishCall("CallEnded event");
      toast.info(translationRef.current("calling.callEnded"));
    });

    connection.on("CallFailed", (event: CallFailedEvent) => {
      if (callRef.current?.callId !== event?.callId) return;
      finishCall("CallFailed event");
      toast.error(event.reason || translationRef.current("calling.callFailed"));
    });

    connection.on("WebRtcOffer", (event: WebRtcDescriptionEvent) => {
      const currentCallId = callRef.current?.callId;
      if (currentCallId !== event?.callId) {
        logAudioDiagnostic(role, event?.callId ?? "unknown", "WebRtcOffer ignored: callId mismatch", {
          currentCallId: currentCallId ?? "none",
        });
        return;
      }
      logAudioDiagnostic(role, event.callId, "WebRtcOffer received", {
        currentCallStatus: callRef.current?.status ?? null,
        ...getHubDiagnosticContext(),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      if (role === "cashier") void processOffer(event);
    });

    connection.on("WebRtcAnswer", async (event: WebRtcDescriptionEvent) => {
      const peer = peerRef.current;
      const currentCallId = callRef.current?.callId;
      if (role !== "agent" || currentCallId !== event?.callId || !peer) {
        logAudioDiagnostic(role, event?.callId ?? "unknown", "WebRtcAnswer ignored", {
          isAgent: role === "agent",
          currentCallId: currentCallId ?? "none",
          peerAvailable: !!peer,
          callIdMatches: currentCallId === event?.callId,
        });
        return;
      }
      logAudioDiagnostic(role, event.callId, "WebRtcAnswer received", {
        currentCallStatus: callRef.current?.status ?? null,
        ...getHubDiagnosticContext(),
        ...getPeerDiagnosticDetails(peer),
      });
      try {
        logAudioDiagnostic(role, event.callId, "setRemoteDescription(answer) started", {
          ...getPeerDiagnosticDetails(peer),
        });
        await peer.setRemoteDescription(new RTCSessionDescription({
          type: "answer",
          sdp: event.sdp,
        }));
        logAudioDiagnostic(role, event.callId, "setRemoteDescription(answer) completed", {
          ...getPeerDiagnosticDetails(peer),
        });
        await flushCandidates(peer, event.callId);
      } catch (error) {
        logAudioDiagnostic(role, event.callId, "remote answer failed", {
          ...getErrorDiagnosticDetails(error),
          ...getHubDiagnosticDetails(connectionRef.current),
          ...getPeerDiagnosticDetails(peer),
        });
        notifyCallError(error, "calling.audioConnectionFailed");
      }
    });

    connection.on("WebRtcIceCandidate", async (event: WebRtcIceCandidateEvent) => {
      const currentCallId = callRef.current?.callId;
      if (currentCallId !== event?.callId) {
        logAudioDiagnostic(role, event?.callId ?? "unknown", "remote ICE candidate ignored: callId mismatch", {
          currentCallId: currentCallId ?? "none",
        });
        return;
      }
      logAudioDiagnostic(role, event.callId, "remote ICE candidate received", {
        candidatePresent: !!event.candidate,
        candidateLength: event.candidate?.length ?? 0,
        sdpMid: event.sdpMid,
        sdpMLineIndex: event.sdpMLineIndex,
        usernameFragmentPresent: !!event.usernameFragment,
        ...getHubDiagnosticContext(),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      if (!event.candidate) return;
      const peer = peerRef.current;
      pendingCandidatesRef.current.enqueue(event);
      if (!peer?.remoteDescription) {
        logAudioDiagnostic(role, event.callId, "remote ICE candidate queued", {
          peerAvailable: !!peer,
          remoteDescriptionSet: !!peer?.remoteDescription,
          queuedCandidateCount: pendingCandidatesRef.current.size,
        });
        return;
      }
      try {
        await flushCandidates(peer, event.callId);
      } catch (error) {
        logAudioDiagnostic(role, event.callId, "remote ICE candidate failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          message: getSafeErrorMessage(error),
        });
        notifyCallError(error, "calling.signalingFailed");
      }
    });

    let callStatusRefreshInProgress = false;
    let callStatusRefreshFailureCallId: string | null = null;
    const refreshCurrentCall = async () => {
      const current = callRef.current;
      if (!current || callStatusRefreshInProgress) return;
      callStatusRefreshInProgress = true;
      try {
        const latest = await callingService.getCall(current.callId);
        const latestUiCall = callRef.current;
        if (latestUiCall?.callId !== current.callId) return;
        callStatusRefreshFailureCallId = null;
        if (["Ended", "Cancelled", "Rejected", "Failed"].includes(latest.status)) {
          finishCall("terminal call status recovered after Hub reconnect/visibility refresh");
          return;
        }
        if (
          role === "cashier"
          && latestUiCall.direction === "incoming"
          && latestUiCall.status === "Incoming"
          && latest.status === "Accepted"
        ) {
          logAudioDiagnostic(role, current.callId, "call accepted in another cashier session", {
            assignedCashierId: latest.assignedCashierId,
            acceptedAt: latest.acceptedAt,
          });
          finishCall("call accepted in another cashier session");
          return;
        }
        if (
          role === "agent"
          && latestUiCall.direction === "outgoing"
          && latest.status === "Accepted"
          && !latestUiCall.acceptedAt
        ) {
          if (!Number.isInteger(latest.assignedCashierId) || (latest.assignedCashierId ?? 0) <= 0) {
            logAudioDiagnostic(role, current.callId, "CallAccepted recovery skipped: invalid assignedCashierId");
            return;
          }
          callAcceptedCallIdRef.current = current.callId;
          if (!negotiationGuardRef.current.claimOffer(current.callId)) return;
          logAudioDiagnostic(role, current.callId, "CallAccepted recovered from call status", {
            assignedCashierId: latest.assignedCashierId,
            acceptedAt: latest.acceptedAt,
          });
          updateCall({
            ...latestUiCall,
            status: "ConnectingAudio",
            assignedCashierId: latest.assignedCashierId ?? undefined,
            acceptedAt: latest.acceptedAt ?? undefined,
          });
          void startPeerConnection(current.callId, true);
        }
      } catch (error) {
        if (callStatusRefreshFailureCallId !== current.callId) {
          callStatusRefreshFailureCallId = current.callId;
          logAudioDiagnostic(role, current.callId, "call status refresh failed", {
            httpStatus: getHttpStatus(error) ?? null,
            errorName: error instanceof Error ? error.name : "UnknownError",
            errorMessage: getSafeErrorMessage(error),
          });
          notifyCallError(error, "calling.callRefreshFailed");
        }
      } finally {
        callStatusRefreshInProgress = false;
      }
    };
    const callStatusPollTimer = role === "cashier"
      ? window.setInterval(() => {
        const current = callRef.current;
        if (current?.direction === "incoming" && current.status === "Incoming") {
          void refreshCurrentCall();
        }
      }, 1000)
      : null;

    connection.onreconnecting((error) => {
      logAudioDiagnostic(role, callRef.current?.callId ?? "none", "Calling Hub onreconnecting", {
        ...getHubDiagnosticContext(),
        errorName: error instanceof Error ? error.name : null,
        errorMessage: error ? getSafeErrorMessage(error) : null,
      });
      setIsConnected(false);
    });
    connection.onreconnected(async (connectionId) => {
      logAudioDiagnostic(role, callRef.current?.callId ?? "none", "Calling Hub onreconnected", {
        ...getHubDiagnosticContext(),
        connectionId: connectionId ?? connection.connectionId ?? null,
      });
      setIsConnected(true);
      await refreshCurrentCall();
    });
    connection.onclose((error) => {
      logAudioDiagnostic(role, callRef.current?.callId ?? stoppingCallId ?? "none", "Calling Hub onclose", {
        ...getHubDiagnosticContext(),
        errorName: error instanceof Error ? error.name : null,
        errorMessage: error ? getSafeErrorMessage(error) : null,
      });
      setIsConnected(false);
    });
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshCurrentCall();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const start = async () => {
      logAudioDiagnostic(role, callRef.current?.callId ?? "none", "Calling Hub start attempt", {
        user: usernameRef.current || null,
        attempt: retryAttempt + 1,
        connectionState: connection.state,
      });
      try {
        await connection.start();
        if (!active) {
          await stopHubConnection("provider disposed while Hub start was completing");
          return;
        }
        retryAttempt = 0;
        setIsConnected(true);
        logAudioDiagnostic(role, callRef.current?.callId ?? "none", "Calling Hub started", {
          ...getHubDiagnosticContext(),
        });
      } catch (error) {
        if (!active) return;
        logAudioDiagnostic(role, callRef.current?.callId ?? "none", "Calling Hub start failed", {
          user: usernameRef.current || null,
          userId: getUserIdFromToken(token),
          attempt: retryAttempt + 1,
          errorName: error instanceof Error ? error.name : "UnknownError",
          errorMessage: getSafeErrorMessage(error),
          connectionState: connection.state,
        });
        setIsConnected(false);
        retryAttempt += 1;
        if (retryAttempt <= 5) {
          retryTimer = setTimeout(() => void start(), Math.min(1000 * 2 ** (retryAttempt - 1), 15000));
        } else {
          notifyCallError(error, "calling.connectionUnavailable");
        }
      }
    };
    void start();

    return () => {
      active = false;
      if (retryTimer) clearTimeout(retryTimer);
      if (callStatusPollTimer !== null) window.clearInterval(callStatusPollTimer);
      connection.off("IncomingCall");
      connection.off("CallAccepted");
      connection.off("CallTakenByAnotherCashier");
      connection.off("CallRejected");
      connection.off("CallEnded");
      connection.off("CallFailed");
      connection.off("WebRtcOffer");
      connection.off("WebRtcAnswer");
      connection.off("WebRtcIceCandidate");
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (connectionRef.current === connection) connectionRef.current = null;
      void stopHubConnection("CallingProvider effect cleanup");
      finishCall("CallingProvider effect cleanup");
    };
  }, [
    finishCall,
    flushCandidates,
    isAllowedRole,
    notifyCallError,
    processOffer,
    role,
    startPeerConnection,
    stopRingtone,
    startRingtone,
    token,
    updateCall,
  ]);

  const startCall = useCallback(async () => {
    if (role !== "agent") return;
    if (startCallInProgressRef.current) return;
    if (connectionRef.current?.state !== HubConnectionState.Connected) {
      logAudioDiagnostic(role, "none", "call start skipped: Calling Hub not connected", {
        connectionState: connectionRef.current?.state ?? "no-connection",
      });
      toast.error(translationRef.current("calling.connectionUnavailable"));
      return;
    }
    if (callRef.current) {
      toast.error(translationRef.current("calling.alreadyOnCall"));
      return;
    }
    startCallInProgressRef.current = true;
    setIsBusy(true);
    try {
      await ensureMedia();
      logAudioDiagnostic(role, "pending", "POST /api/calls started");
      const created = await callingService.startCall();
      if (!created.callId || !isGuid(created.callId)) {
        throw new Error(translationRef.current("calling.invalidCallResponse"));
      }
      logAudioDiagnostic(role, created.callId, "POST /api/calls succeeded", {
        status: created.status,
        startedAt: created.startedAt,
      });
      updateCall({
        callId: created.callId,
        status: "Ringing",
        direction: "outgoing",
        agentName: username || translationRef.current("calling.agent"),
        startedAt: created.startedAt,
        muted: false,
        connectionState: "new",
      });
      startAgentRingback();
    } catch (error) {
      logAudioDiagnostic(role, "pending", "POST /api/calls failed", {
        httpStatus: getHttpStatus(error) ?? null,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      stopRingtone("call start request failed");
      closeMedia("call start request failed");
      if (getHttpStatus(error) === 409) {
        toast.info(translationRef.current("calling.noCashierOnline"));
      } else {
        notifyCallError(error, "calling.startFailed");
      }
    } finally {
      startCallInProgressRef.current = false;
      setIsBusy(false);
    }
  }, [closeMedia, ensureMedia, notifyCallError, role, startAgentRingback, stopRingtone, updateCall, username]);

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (
      role !== "cashier"
      || !current
      || current.direction !== "incoming"
      || current.status !== "Incoming"
    ) return;
    logAudioDiagnostic(role, current.callId, "Answer button clicked", {
      currentCallStatus: current.status,
      ...getHubDiagnosticDetails(connectionRef.current),
      ...getPeerDiagnosticDetails(peerRef.current),
    });
    if (connectionRef.current?.state !== HubConnectionState.Connected) {
      logAudioDiagnostic(role, current.callId, "accept skipped: Calling Hub not connected", {
        connectionState: connectionRef.current?.state ?? "no-connection",
      });
      toast.error(translationRef.current("calling.connectionUnavailable"));
      return;
    }
    setIsBusy(true);
    stopRingtone("Cashier clicked Answer");
    updateCall({ ...current, status: "Accepting" });
    try {
      const stream = await ensureMedia();
      if (callRef.current?.callId !== current.callId) {
        logAudioDiagnostic(role, current.callId, "accept abandoned: call changed before request");
        if (!callRef.current && localStreamRef.current === stream) {
          closeMedia("accept abandoned after call ended");
        }
        return;
      }
      if (connectionRef.current?.state !== HubConnectionState.Connected) {
        logAudioDiagnostic(role, current.callId, "accept skipped: Calling Hub disconnected before request", {
          connectionState: connectionRef.current?.state ?? "no-connection",
        });
        closeMedia("Calling Hub disconnected before accept request");
        updateCall({ ...current, status: "Incoming" });
        startRingtone();
        toast.error(translationRef.current("calling.connectionUnavailable"));
        return;
      }
      logAudioDiagnostic(role, current.callId, "POST /api/calls/{callId}/accept started", {
        currentCallStatus: callRef.current?.status ?? null,
        ...getHubDiagnosticDetails(connectionRef.current),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      const acceptResponse = await callingService.acceptCall(current.callId);
      const accepted = acceptResponse.data;
      logAudioDiagnostic(role, current.callId, "POST /api/calls/{callId}/accept response", {
        httpStatus: acceptResponse.httpStatus,
        responseCallId: accepted.callId,
        status: accepted.status,
        assignedCashierId: accepted.assignedCashierId,
        userId: getUserIdFromToken(token),
        ...getHubDiagnosticDetails(connectionRef.current),
        ...getPeerDiagnosticDetails(peerRef.current),
      });
      if (acceptResponse.httpStatus === 409) {
        finishCall("accept request returned HTTP 409");
        toast.info(translationRef.current("calling.takenByAnotherCashier"));
        return;
      }
      if (callRef.current?.callId !== current.callId) {
        logAudioDiagnostic(role, current.callId, "accept response ignored: call changed", {
          responseCallId: accepted.callId,
          assignedCashierId: accepted.assignedCashierId,
        });
        if (!callRef.current && localStreamRef.current === stream) {
          closeMedia("accept response arrived after call ended");
        }
        return;
      }
      if (!isValidCallAcceptance(
        accepted,
        current.callId,
        getUserIdFromToken(token),
        acceptResponse.httpStatus,
      )) {
        throw new Error(translationRef.current("calling.acceptFailed"));
      }
      const activeCall = callRef.current;
      if (!activeCall) return;
      logAudioDiagnostic(role, current.callId, "accept succeeded", {
        httpStatus: acceptResponse.httpStatus,
        responseCallId: accepted.callId,
        status: accepted.status,
        assignedCashierId: accepted.assignedCashierId,
        userId: getUserIdFromToken(token),
      });
      callAcceptedChannelRef.current?.postMessage({
        type: "call-accepted",
        callId: current.callId,
      } satisfies CallAcceptedBroadcastMessage);
      stopRingtone("Cashier accept API succeeded");
      updateCall({
        ...activeCall,
        status: "ConnectingAudio",
        assignedCashierId: accepted.assignedCashierId,
        acceptedAt: accepted.acceptedAt,
      });
      playEffect("/audio/prp-option-confirmation-hy.mp3", () => {
        toast.warning(translationRef.current("calling.soundPlaybackFailed"));
      });
      await startPeerConnection(current.callId, false);
    } catch (error) {
      logAudioDiagnostic(role, current.callId, "accept failed", {
        httpStatus: getHttpStatus(error) ?? null,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: getSafeErrorMessage(error),
      });
      if (callRef.current?.callId !== current.callId) {
        if (!callRef.current && localStreamRef.current) closeMedia("stale accept attempt failed");
        return;
      }
      if (getHttpStatus(error) === 409) {
        finishCall("accept request returned HTTP 409");
        toast.info(translationRef.current("calling.takenByAnotherCashier"));
      } else {
        closeMedia("accept request failed");
        updateCall({ ...current, status: "Incoming" });
        startRingtone();
        notifyCallError(error, "calling.acceptFailed");
      }
    } finally {
      setIsBusy(false);
    }
  }, [closeMedia, ensureMedia, finishCall, notifyCallError, role, startPeerConnection, startRingtone, stopRingtone, token, updateCall]);

  const rejectCall = useCallback(async () => {
    const current = callRef.current;
    if (!current || current.direction !== "incoming") return;
    setIsBusy(true);
    stopRingtone();
    try {
      await callingService.rejectCall(current.callId);
      logAudioDiagnostic(role, current.callId, "POST /api/calls/{callId}/reject succeeded");
      finishCall("reject API succeeded");
    } catch (error) {
      logAudioDiagnostic(role, current.callId, "POST /api/calls/{callId}/reject failed", {
        httpStatus: getHttpStatus(error) ?? null,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      notifyCallError(error, "calling.rejectFailed");
      startRingtone();
    } finally {
      setIsBusy(false);
    }
  }, [finishCall, notifyCallError, role, startRingtone, stopRingtone]);

  const endCall = useCallback(async () => {
    const current = callRef.current;
    if (!current) return;
    setIsBusy(true);
    updateCall({ ...current, status: "Ending" });
    stopRingtone();
    try {
      logAudioDiagnostic(role, current.callId, "POST /api/calls/{callId}/end started");
      await callingService.endCall(current.callId);
      logAudioDiagnostic(role, current.callId, "POST /api/calls/{callId}/end succeeded");
      finishCall("end API succeeded");
    } catch (error) {
      logAudioDiagnostic(role, current.callId, "POST /api/calls/{callId}/end failed", {
        httpStatus: getHttpStatus(error) ?? null,
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      updateCall(current);
      notifyCallError(error, "calling.endFailed");
    } finally {
      setIsBusy(false);
    }
  }, [finishCall, notifyCallError, role, stopRingtone, updateCall]);

  const toggleMute = useCallback(() => {
    const current = callRef.current;
    const stream = localStreamRef.current;
    if (!current || !stream) return;
    const nextMuted = !current.muted;
    stream.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
    updateCall({ ...current, muted: nextMuted });
  }, [updateCall]);

  useEffect(() => {
    if (!call?.acceptedAt) {
      setDurationSeconds(0);
      return;
    }
    const updateDuration = () => {
      const acceptedAt = new Date(call.acceptedAt as string).getTime();
      setDurationSeconds(Math.max(0, Math.floor((Date.now() - acceptedAt) / 1000)));
    };
    updateDuration();
    const intervalId = window.setInterval(updateDuration, 1000);
    return () => window.clearInterval(intervalId);
  }, [call?.acceptedAt]);

  const openIncomingCallDialog = useCallback(() => {
    const current = callRef.current;
    if (
      role === "cashier"
      && current?.direction === "incoming"
      && (current.status === "Incoming" || current.status === "Accepting")
    ) {
      setIsIncomingCallDialogOpen(true);
    }
  }, [role]);

  const value = useMemo<CallingContextValue>(() => ({
    isConnected,
    startCall,
    call,
    openIncomingCallDialog,
  }), [call, isConnected, openIncomingCallDialog, startCall]);

  const visibleCall = call && (
    role !== "cashier"
    || call.direction !== "incoming"
    || isIncomingCallDialogOpen
  ) ? call : null;

  return (
    <CallingContext.Provider value={value}>
      {children}
      <CallingOverlays
        call={visibleCall}
        durationSeconds={durationSeconds}
        isBusy={isBusy}
        onAccept={() => void acceptCall()}
        onReject={() => void rejectCall()}
        onEnd={() => void endCall()}
        onMute={toggleMute}
        onRemoteAudio={setRemoteAudio}
      />
    </CallingContext.Provider>
  );
};

// Keep the context private while exporting its consumer hook alongside the provider.
// eslint-disable-next-line react-refresh/only-export-components
export const useCalling = () => {
  const context = useContext(CallingContext);
  if (!context) throw new Error("useCalling must be used within CallingProvider.");
  return context;
};

export const CallingStatusButton = () => {
  const { isConnected, startCall, call } = useCalling();
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={styles.startCallButton}
      onClick={() => void startCall()}
      disabled={!isConnected || !!call}
      title={!isConnected ? t("calling.connecting") : undefined}
      aria-label={t("calling.callShop")}
    >
      <Phone size={16} aria-hidden="true" />
      <span>{t("calling.callShop")}</span>
    </button>
  );
};

export const CashierCallingStatus = () => {
  const { isConnected, call, openIncomingCallDialog } = useCalling();
  const { t } = useTranslation();
  const incomingCall = call?.direction === "incoming" && call.status === "Incoming"
    ? call
    : null;

  const statusContent = (
    <>
      <PhoneIncoming size={16} aria-hidden="true" />
      <span>{t(incomingCall ? "calling.incomingCall" : isConnected ? "calling.readyForCalls" : "calling.callsUnavailable")}</span>
      <span
        className={`${styles.callConnectionDot} ${isConnected ? styles.callConnectionDotActive : ""}`}
        aria-hidden="true"
      />
    </>
  );

  return incomingCall ? (
    <button
      type="button"
      className={`${styles.cashierCallStatus} ${styles.cashierCallStatusIncoming}`}
      onClick={openIncomingCallDialog}
      aria-haspopup="dialog"
      aria-live="assertive"
      aria-label={`${t("calling.incomingCall")}: ${incomingCall.agentName}`}
      title={`${t("calling.incomingCall")}: ${incomingCall.agentName}`}
    >
      {statusContent}
    </button>
  ) : (
    <div
      className={styles.cashierCallStatus}
      role="status"
      aria-live="polite"
      title={t(isConnected ? "calling.readyForCalls" : "calling.callsUnavailable")}
    >
      {statusContent}
    </div>
  );
};
