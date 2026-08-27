export const LOADING_CONFIG = {
  backgroundColor: "#18181A",
  accentColor: "#4e9cff",
  logoUrl: null as string | null,
  title: "Connecting to Stream",
  subtitle: "Please wait while we set up your experience...",
  disconnectedSubtitle: "The stream session has ended.",
  queueMessage: (position: number) =>
    `You are in queue at position ${position}`,
  showSpinner: true,
  statusMessages: {
    initializing: "Initializing...",
    connecting: "Connecting to server...",
    webRtcConnecting: "Establishing WebRTC connection...",
    sdpNegotiation: "Negotiating stream parameters...",
    webRtcConnected: "WebRTC connected, loading stream...",
    streamLoading: "Stream is loading...",
    playingStream: "Starting video playback...",
    inQueue: "Waiting in queue...",
    failed: "Connection failed. Please try again.",
    disconnected: "Disconnected from stream.",
    reconnecting: "Reconnecting to stream...",
    retrying: "Retrying connection...",
    reconnected: "Reconnected! Loading stream...",
    reconnectFailed: "Unable to reconnect. Please refresh the page.",
    idleTimedOut: "You were disconnected due to inactivity.",
  },
  reconnectingTitle: "Reconnecting",
  reconnectingSubtitle: "Please wait while we restore your session...",
  reconnectedTitle: "Reconnected",
  reconnectFailedTitle: "Reconnection Failed",
  reconnectFailedSubtitle: "We were unable to restore your session.",
  idleTitle: "Session Ended",
} as const;

export type StreamOverlayKind =
  | "loading"
  | "queue"
  | "disconnected"
  | "idle";

/**
 * StreamPixel WebRTC lifecycle → loading bar.
 * @see https://docs.streampixel.io/resources/web-sdk/ui-and-customization/custom-loading-screen
 */
export const LOADING_PROGRESS = {
  initializing: 10,
  autoConnect: 15,
  webRtcConnecting: 30,
  sdpNegotiation: 50,
  webRtcConnected: 70,
  streamLoading: 80,
  playingStream: 90,
  /** Hold here until onVideoInitialized — never hide the overlay before 100. */
  awaitingVideo: 94,
  ready: 100,
  reconnecting: 20,
  retrying: 40,
  reconnected: 70,
} as const;
