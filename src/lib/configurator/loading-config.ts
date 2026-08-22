// src/lib/configurator/loading-config.ts

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
  },
  reconnectingTitle: "Reconnecting",
  reconnectingSubtitle: "Please wait while we restore your session...",
  reconnectedTitle: "Reconnected",
  reconnectFailedTitle: "Reconnection Failed",
  reconnectFailedSubtitle: "We were unable to restore your session.",
} as const;
