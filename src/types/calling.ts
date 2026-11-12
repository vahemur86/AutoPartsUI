export type CallStatus =
  | "Ringing"
  | "Accepted"
  | "Ended"
  | "Cancelled"
  | "Rejected"
  | "Failed";

export interface CallCreatedResponse {
  callId: string;
  status: "Ringing";
  startedAt: string;
}

export interface CallAcceptedResponse {
  callId: string;
  status: "Accepted";
  assignedCashierId: number;
  acceptedAt: string;
}

export interface IncomingCallEvent {
  callId: string;
  agentId: string;
  agentName: string;
  startedAt: string;
  shopId: number;
}

export interface CallAcceptedEvent {
  callId: string;
  assignedCashierId: number;
  acceptedAt: string;
}

export interface CallTerminalEvent {
  callId: string;
  status: string;
  endedAt: string;
  durationSeconds: number | null;
}

export interface CallFailedEvent {
  callId: string;
  reason: string;
}

export interface WebRtcDescriptionEvent {
  callId: string;
  sdp: string;
}

export interface WebRtcIceCandidateEvent {
  callId: string;
  candidate: string | null;
  sdpMid: string | null;
  sdpMLineIndex: number | null;
  usernameFragment: string | null;
}

export interface CallDetails {
  callId: string;
  agentId: string;
  agentName: string;
  shopId: number;
  assignedCashierId: number | null;
  status: CallStatus;
  startedAt: string;
  acceptedAt: string | null;
  endedAt: string | null;
  durationSeconds: number | null;
}

export interface CallHistoryPage {
  items: CallDetails[];
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface IceServerResponse {
  iceServers: Array<{
    urls: string | string[];
    username: string | null;
    credential: string | null;
  }>;
}

export interface SendWebRtcDescription {
  callId: string;
  sdp: string;
}

export type SendWebRtcIceCandidate = WebRtcIceCandidateEvent;
