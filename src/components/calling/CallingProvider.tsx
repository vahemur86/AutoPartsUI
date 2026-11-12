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
}

const CallingContext = createContext<CallingContextValue | null>(null);

const isGuid = (value: string) =>
  /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);

const getHttpStatus = (error: unknown): number | undefined => {
  if (!error || typeof error !== "object" || !("response" in error)) return undefined;
  const response = error.response;
  if (!response || typeof response !== "object" || !("status" in response)) return undefined;
  return typeof response.status === "number" ? response.status : undefined;
};

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
  console.info("[Calling][Audio]", { role, callId, event, ...details });
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
  const isAllowedRole = role === "agent" || role === "cashier";
  const [isConnected, setIsConnected] = useState(false);
  const [call, setCallState] = useState<UiCall | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const connectionRef = useRef<HubConnection | null>(null);
  const callRef = useRef<UiCall | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const peerStartingRef = useRef(false);
  const peerStatsTimerRef = useRef<number | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<WebRtcIceCandidateEvent[]>([]);
  const pendingLocalCandidatesRef = useRef<WebRtcIceCandidateEvent[]>([]);
  const localDescriptionSentCallIdRef = useRef<string | null>(null);
  const pendingOfferRef = useRef<WebRtcDescriptionEvent | null>(null);
  const ringtoneContextRef = useRef<AudioContext | null>(null);
  const ringtoneTimerRef = useRef<number | null>(null);
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
      audio.play().catch(() => {
        logAudioDiagnostic(role, callRef.current?.callId ?? "unknown", "audio.play rejected", {
          error: "Remote audio playback was blocked by the browser.",
        });
        toast.warning(translationRef.current("calling.remoteAudioPlaybackFailed"));
      });
    }
  }, [role]);

  const stopRingtone = useCallback(() => {
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
    ringtoneContextRef.current = null;
    if (context && context.state !== "closed") {
      void context.close();
    }
  }, []);

  const startTonePattern = useCallback((
    notes: Array<{ frequency: number; offset: number; duration: number }>,
    interval: number,
  ) => {
    stopRingtone();
    if (typeof window.AudioContext === "undefined") {
      toast.warning(translationRef.current("calling.ringtonePlaybackFailed"));
      return;
    }

    const context = new AudioContext();
    ringtoneContextRef.current = context;
    const playRingBurst = () => {
      if (ringtoneContextRef.current !== context || context.state !== "running") return;
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
        if (ringtoneContextRef.current === context) stopRingtone();
        toast.warning(translationRef.current("calling.ringtonePlaybackFailed"));
      });
  }, [stopRingtone]);

  const startRingtone = useCallback(() => {
    startTonePattern([
      { frequency: 740, offset: 0, duration: 0.2 },
      { frequency: 880, offset: 0.26, duration: 0.28 },
    ], 2200);
  }, [startTonePattern]);

  const startAgentRingback = useCallback(() => {
    stopRingtone();
    const ringback = new Audio("/audio/agent-call-ringback.mp3");
    ringback.loop = true;
    agentRingbackRef.current = ringback;
    void ringback.play().catch(() => {
      if (agentRingbackRef.current === ringback) agentRingbackRef.current = null;
      toast.warning(translationRef.current("calling.ringtonePlaybackFailed"));
    });
  }, [stopRingtone]);

  const closeMedia = useCallback(() => {
    if (peerStatsTimerRef.current !== null) {
      window.clearInterval(peerStatsTimerRef.current);
      peerStatsTimerRef.current = null;
    }
    peerRef.current?.close();
    peerRef.current = null;
    peerStartingRef.current = false;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) {
      remoteAudioRef.current.pause();
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current = null;
    }
    remoteStreamRef.current = null;
    pendingCandidatesRef.current = [];
    pendingLocalCandidatesRef.current = [];
    localDescriptionSentCallIdRef.current = null;
    pendingOfferRef.current = null;
  }, []);

  const finishCall = useCallback(() => {
    stopRingtone();
    closeMedia();
    updateCall(null);
    setDurationSeconds(0);
    setIsBusy(false);
  }, [closeMedia, stopRingtone, updateCall]);

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
        logAudioDiagnostic(role, callRef.current?.callId ?? "pending", "getUserMedia failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
      const tracks = localStreamRef.current.getAudioTracks();
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
    const connection = connectionRef.current;
    if (!connection || connection.state !== HubConnectionState.Connected) {
      logAudioDiagnostic(role, typeof payload === "object" && payload && "callId" in payload && typeof payload.callId === "string" ? payload.callId : "unknown", "SignalR invoke skipped", {
        method,
        connectionState: connection?.state ?? "no-connection",
      });
      throw new Error(translationRef.current("calling.connectionUnavailable"));
    }
    const callId = "callId" in payload && typeof payload.callId === "string" ? payload.callId : "unknown";
    logAudioDiagnostic(role, callId, "SignalR invoke started", { method });
    await connection.invoke(method, payload);
    logAudioDiagnostic(role, callId, "SignalR invoke succeeded", { method });
  }, [role]);

  const flushCandidates = useCallback(async (peer: RTCPeerConnection, callId: string) => {
    const candidates = pendingCandidatesRef.current.splice(0);
    for (const candidate of candidates) {
      if (!candidate.candidate) continue;
      await peer.addIceCandidate(new RTCIceCandidate({
        candidate: candidate.candidate,
        sdpMid: candidate.sdpMid,
        sdpMLineIndex: candidate.sdpMLineIndex,
        usernameFragment: candidate.usernameFragment ?? undefined,
      }));
      logAudioDiagnostic(role, callId, "queued remote ICE candidate applied");
    }
    if (callRef.current?.callId !== callId) return;
  }, [role]);

  const flushLocalCandidates = useCallback(async (callId: string) => {
    if (callRef.current?.callId !== callId) return;
    while (pendingLocalCandidatesRef.current.length > 0) {
      const candidates = pendingLocalCandidatesRef.current.splice(0);
      for (const candidate of candidates) {
        if (callRef.current?.callId !== callId) return;
        await invokeSignal("SendWebRtcIceCandidate", candidate);
      }
    }
    if (callRef.current?.callId === callId) {
      localDescriptionSentCallIdRef.current = callId;
    }
  }, [invokeSignal]);

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
    try {
      await peer.setRemoteDescription(new RTCSessionDescription({
        type: "offer",
        sdp: offer.sdp,
      }));
      logAudioDiagnostic(role, offer.callId, "remote offer applied", {
        signalingState: peer.signalingState,
      });
      await flushCandidates(peer, offer.callId);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      logAudioDiagnostic(role, offer.callId, "local answer set", {
        signalingState: peer.signalingState,
      });
      await invokeSignal("SendWebRtcAnswer", {
        callId: offer.callId,
        sdp: answer.sdp,
      });
      logAudioDiagnostic(role, offer.callId, "answer sent");
      await flushLocalCandidates(offer.callId);
    } catch (error) {
      logAudioDiagnostic(role, offer.callId, "offer processing failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      });
      notifyCallError(error, "calling.audioConnectionFailed");
    }
  }, [flushCandidates, flushLocalCandidates, invokeSignal, notifyCallError, role]);

  const startPeerConnection = useCallback(async (callId: string, createOffer: boolean) => {
    if (peerRef.current || peerStartingRef.current) return;
    peerStartingRef.current = true;
    try {
      const stream = await ensureMedia();
      const { iceServers } = await callingService.getIceServers();
      if (callRef.current?.callId !== callId) return;
      logAudioDiagnostic(role, callId, "ICE servers loaded", {
        serverCount: iceServers.length,
        turnServerCount: iceServers.filter((server) =>
          (Array.isArray(server.urls) ? server.urls : [server.urls])
            .some((url) => url.toLowerCase().startsWith("turn:") || url.toLowerCase().startsWith("turns:")),
        ).length,
      });
      const peer = new RTCPeerConnection({
        iceServers: iceServers.map((server) => ({
          urls: server.urls,
          username: server.username ?? undefined,
          credential: server.credential ?? undefined,
        })),
      });
      peerRef.current = peer;
      localDescriptionSentCallIdRef.current = null;
      pendingLocalCandidatesRef.current = [];
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => {
        peer.addTrack(track, stream);
        logAudioDiagnostic(role, callId, "local audio track added", {
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
        });
        const audio = remoteAudioRef.current;
        if (audio) {
          audio.muted = false;
          audio.volume = 1;
          audio.setAttribute("playsinline", "");
          audio.srcObject = remoteStream;
          void audio.play().then(() => {
            logAudioDiagnostic(role, callId, "remote audio playback started", {
              muted: audio.muted,
              volume: audio.volume,
              paused: audio.paused,
              readyState: audio.readyState,
            });
          }).catch((error: unknown) => {
            logAudioDiagnostic(role, callId, "remote audio playback rejected", {
              errorName: error instanceof Error ? error.name : "UnknownError",
              message: error instanceof Error ? error.message : String(error),
              muted: audio.muted,
              volume: audio.volume,
              paused: audio.paused,
              readyState: audio.readyState,
            });
            toast.warning(translationRef.current("calling.remoteAudioPlaybackFailed"));
          });
        } else {
          logAudioDiagnostic(role, callId, "remote audio element not mounted yet");
        }
      };
      peer.onicecandidate = (event) => {
        if (!event.candidate) {
          logAudioDiagnostic(role, callId, "local ICE gathering complete");
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
        });
        if (localDescriptionSentCallIdRef.current !== callId) {
          pendingLocalCandidatesRef.current.push(candidate);
          return;
        }
        void invokeSignal("SendWebRtcIceCandidate", candidate)
          .catch((error: unknown) => {
            logAudioDiagnostic(role, callId, "sending ICE candidate failed", {
              errorName: error instanceof Error ? error.name : "UnknownError",
              message: error instanceof Error ? error.message : String(error),
            });
            notifyCallError(error, "calling.signalingFailed");
          });
      };
      peer.onsignalingstatechange = () => {
        logAudioDiagnostic(role, callId, "signaling state changed", {
          signalingState: peer.signalingState,
        });
      };
      peer.oniceconnectionstatechange = () => {
        logAudioDiagnostic(role, callId, "ICE connection state changed", {
          iceConnectionState: peer.iceConnectionState,
          iceGatheringState: peer.iceGatheringState,
        });
      };
      peer.onconnectionstatechange = () => {
        const connectionState = peer.connectionState;
        logAudioDiagnostic(role, callId, "peer connection state changed", {
          connectionState,
          iceConnectionState: peer.iceConnectionState,
          signalingState: peer.signalingState,
        });
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
      peerStatsTimerRef.current = window.setInterval(() => {
        if (peerRef.current !== peer) return;
        void peer.getStats().then((stats) => {
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
            inboundAudio,
            outboundAudio,
          });
        }).catch((error: unknown) => {
          logAudioDiagnostic(role, callId, "getStats failed", {
            message: error instanceof Error ? error.message : String(error),
          });
        });
      }, 5000);
      updateCall((current) => current?.callId === callId
        ? { ...current, status: "ConnectingAudio", connectionState: "new" }
        : current);

      if (createOffer) {
        logAudioDiagnostic(role, callId, "creating offer");
        const offer = await peer.createOffer();
        if (callRef.current?.callId !== callId) return;
        await peer.setLocalDescription(offer);
        logAudioDiagnostic(role, callId, "local offer set", {
          signalingState: peer.signalingState,
        });
        if (callRef.current?.callId !== callId) return;
        await invokeSignal("SendWebRtcOffer", { callId, sdp: offer.sdp });
        logAudioDiagnostic(role, callId, "offer sent");
        await flushLocalCandidates(callId);
      } else if (pendingOfferRef.current?.callId === callId) {
        const offer = pendingOfferRef.current;
        pendingOfferRef.current = null;
        await processOffer(offer);
      }
    } catch (error) {
      closeMedia();
      if (callRef.current?.callId !== callId) return;
      logAudioDiagnostic(role, callId, "peer connection setup failed", {
        errorName: error instanceof Error ? error.name : "UnknownError",
        message: error instanceof Error ? error.message : String(error),
      });
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
      finishCall();
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

    connection.on("IncomingCall", (event: IncomingCallEvent) => {
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
      updateCall(incoming);
      startRingtone();
    });

    connection.on("CallAccepted", (event: CallAcceptedEvent) => {
      const current = callRef.current;
      if (role !== "agent" || !current || current.callId !== event?.callId) return;
      logAudioDiagnostic(role, event.callId, "CallAccepted received");
      stopRingtone();
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
      finishCall();
      toast.info(translationRef.current("calling.takenByAnotherCashier"));
    });

    connection.on("CallRejected", (event: { callId: string; status?: string }) => {
      if (callRef.current?.callId !== event?.callId) return;
      finishCall();
      if (role === "agent" || event.status === "Rejected") {
        toast.info(translationRef.current("calling.callRejected"));
      }
    });

    connection.on("CallEnded", (event: CallDetails | { callId: string; status: string }) => {
      if (callRef.current?.callId !== event?.callId) return;
      finishCall();
      toast.info(translationRef.current("calling.callEnded"));
    });

    connection.on("CallFailed", (event: CallFailedEvent) => {
      if (callRef.current?.callId !== event?.callId) return;
      finishCall();
      toast.error(event.reason || translationRef.current("calling.callFailed"));
    });

    connection.on("WebRtcOffer", (event: WebRtcDescriptionEvent) => {
      if (callRef.current?.callId !== event?.callId) return;
      logAudioDiagnostic(role, event.callId, "WebRtcOffer received");
      if (role === "cashier") void processOffer(event);
    });

    connection.on("WebRtcAnswer", async (event: WebRtcDescriptionEvent) => {
      const peer = peerRef.current;
      if (role !== "agent" || callRef.current?.callId !== event?.callId || !peer) return;
      logAudioDiagnostic(role, event.callId, "WebRtcAnswer received");
      try {
        await peer.setRemoteDescription(new RTCSessionDescription({
          type: "answer",
          sdp: event.sdp,
        }));
        logAudioDiagnostic(role, event.callId, "remote answer applied", {
          signalingState: peer.signalingState,
        });
        await flushCandidates(peer, event.callId);
      } catch (error) {
        logAudioDiagnostic(role, event.callId, "remote answer failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        });
        notifyCallError(error, "calling.audioConnectionFailed");
      }
    });

    connection.on("WebRtcIceCandidate", async (event: WebRtcIceCandidateEvent) => {
      if (callRef.current?.callId !== event?.callId) return;
      if (!event.candidate) return;
      const peer = peerRef.current;
      if (!peer?.remoteDescription) {
        pendingCandidatesRef.current.push(event);
        logAudioDiagnostic(role, event.callId, "remote ICE candidate queued", {
          peerAvailable: !!peer,
          remoteDescriptionSet: !!peer?.remoteDescription,
          queuedCandidateCount: pendingCandidatesRef.current.length,
        });
        return;
      }
      logAudioDiagnostic(role, event.callId, "remote ICE candidate received", {
        sdpMid: event.sdpMid,
        sdpMLineIndex: event.sdpMLineIndex,
        usernameFragmentPresent: !!event.usernameFragment,
      });
      try {
        await peer.addIceCandidate(new RTCIceCandidate({
          candidate: event.candidate,
          sdpMid: event.sdpMid,
          sdpMLineIndex: event.sdpMLineIndex,
          usernameFragment: event.usernameFragment ?? undefined,
        }));
        logAudioDiagnostic(role, event.callId, "remote ICE candidate applied");
      } catch (error) {
        logAudioDiagnostic(role, event.callId, "remote ICE candidate failed", {
          errorName: error instanceof Error ? error.name : "UnknownError",
          message: error instanceof Error ? error.message : String(error),
        });
        notifyCallError(error, "calling.signalingFailed");
      }
    });

    const refreshCurrentCall = async () => {
      const current = callRef.current;
      if (!current) return;
      try {
        const latest = await callingService.getCall(current.callId);
        if (callRef.current?.callId !== current.callId) return;
        if (["Ended", "Cancelled", "Rejected", "Failed"].includes(latest.status)) {
          finishCall();
          return;
        }
        if (
          role === "agent"
          && current.direction === "outgoing"
          && latest.status === "Accepted"
          && !current.acceptedAt
        ) {
          updateCall({
            ...current,
            status: "ConnectingAudio",
            assignedCashierId: latest.assignedCashierId ?? undefined,
            acceptedAt: latest.acceptedAt ?? undefined,
          });
          void startPeerConnection(current.callId, true);
        }
      } catch (error) {
        notifyCallError(error, "calling.callRefreshFailed");
      }
    };

    connection.onreconnecting(() => setIsConnected(false));
    connection.onreconnected(async () => {
      setIsConnected(true);
      await refreshCurrentCall();
    });
    connection.onclose(() => setIsConnected(false));
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refreshCurrentCall();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const start = async () => {
      try {
        await connection.start();
        if (!active) {
          await connection.stop();
          return;
        }
        retryAttempt = 0;
        setIsConnected(true);
      } catch (error) {
        if (!active) return;
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
      void connection.stop();
      finishCall();
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
    if (connectionRef.current?.state !== HubConnectionState.Connected) {
      toast.error(translationRef.current("calling.connectionUnavailable"));
      return;
    }
    if (callRef.current) {
      toast.error(translationRef.current("calling.alreadyOnCall"));
      return;
    }
    setIsBusy(true);
    try {
      await ensureMedia();
      const created = await callingService.startCall();
      if (!created.callId || !isGuid(created.callId)) {
        throw new Error(translationRef.current("calling.invalidCallResponse"));
      }
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
      stopRingtone();
      closeMedia();
      if (getHttpStatus(error) === 409) {
        toast.info(translationRef.current("calling.noCashierOnline"));
      } else {
        notifyCallError(error, "calling.startFailed");
      }
    } finally {
      setIsBusy(false);
    }
  }, [closeMedia, ensureMedia, notifyCallError, role, startAgentRingback, stopRingtone, updateCall, username]);

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    if (role !== "cashier" || !current || current.direction !== "incoming") return;
    setIsBusy(true);
    stopRingtone();
    updateCall({ ...current, status: "Accepting" });
    try {
      await ensureMedia();
      const accepted = await callingService.acceptCall(current.callId);
      if (callRef.current?.callId !== current.callId) return;
      if (accepted.callId !== current.callId || accepted.status !== "Accepted") {
        throw new Error(translationRef.current("calling.acceptFailed"));
      }
      const activeCall = callRef.current;
      if (!activeCall) return;
      logAudioDiagnostic(role, current.callId, "accept succeeded", {
        responseCallId: accepted.callId,
        status: accepted.status,
        assignedCashierId: accepted.assignedCashierId,
      });
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
      if (callRef.current?.callId !== current.callId) return;
      closeMedia();
      if (getHttpStatus(error) === 409) {
        finishCall();
        toast.info(translationRef.current("calling.takenByAnotherCashier"));
      } else {
        updateCall({ ...current, status: "Incoming" });
        startRingtone();
        notifyCallError(error, "calling.acceptFailed");
      }
    } finally {
      setIsBusy(false);
    }
  }, [closeMedia, ensureMedia, finishCall, notifyCallError, role, startPeerConnection, startRingtone, stopRingtone, updateCall]);

  const rejectCall = useCallback(async () => {
    const current = callRef.current;
    if (!current || current.direction !== "incoming") return;
    setIsBusy(true);
    stopRingtone();
    try {
      await callingService.rejectCall(current.callId);
      finishCall();
    } catch (error) {
      notifyCallError(error, "calling.rejectFailed");
      startRingtone();
    } finally {
      setIsBusy(false);
    }
  }, [finishCall, notifyCallError, startRingtone, stopRingtone]);

  const endCall = useCallback(async () => {
    const current = callRef.current;
    if (!current) return;
    setIsBusy(true);
    updateCall({ ...current, status: "Ending" });
    stopRingtone();
    try {
      await callingService.endCall(current.callId);
      finishCall();
    } catch (error) {
      updateCall(current);
      notifyCallError(error, "calling.endFailed");
    } finally {
      setIsBusy(false);
    }
  }, [finishCall, notifyCallError, stopRingtone, updateCall]);

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

  const value = useMemo<CallingContextValue>(() => ({
    isConnected,
    startCall,
    call,
  }), [call, isConnected, startCall]);

  return (
    <CallingContext.Provider value={value}>
      {children}
      <CallingOverlays
        call={call}
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

export const CashierCallingStatusButton = () => {
  const { isConnected } = useCalling();
  const { t } = useTranslation();

  return (
    <a
      href="#calling-history"
      className={styles.cashierCallStatus}
      title={t(isConnected ? "calling.readyForCalls" : "calling.callsUnavailable")}
    >
      <PhoneIncoming size={16} aria-hidden="true" />
      <span>{t(isConnected ? "calling.readyForCalls" : "calling.callsUnavailable")}</span>
      <span
        className={`${styles.callConnectionDot} ${isConnected ? styles.callConnectionDotActive : ""}`}
        aria-hidden="true"
      />
    </a>
  );
};
