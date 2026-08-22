"use client";

import { useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConsoleCommand: (cmd: string) => void;
  onSendRawJson: (json: string) => void;
  onDisconnect: () => void;
  onEnableMic: () => void;
  onEnableCamera: () => void;
  onHoverMouse: (enabled: boolean) => void;
  lastUeResponse?: unknown;
  uiInteractionError?: string | null;
};

/**
 * DEV ONLY — gated by NEXT_PUBLIC_SHOW_DEV_TOOLS=true.
 * Never ship this panel to production users: it can call any UE Blueprint
 * exposed via emitUIInteraction.
 */
export default function DevToolsPanel({
  open,
  onClose,
  onConsoleCommand,
  onSendRawJson,
  onDisconnect,
  onEnableMic,
  onEnableCamera,
  onHoverMouse,
  lastUeResponse,
  uiInteractionError = null,
}: Props) {
  const [consoleCmd, setConsoleCmd] = useState("stat fps");
  const [uiJson, setUiJson] = useState(
    JSON.stringify({ Function: "ExitCamera" }, null, 2),
  );

  if (!open) return null;

  return (
    <div className="dev-tools-popup">
      <div className="stats-popup-header">
        <span className="stats-popup-title">Developer Tools</span>
        <button
          type="button"
          className="stats-popup-close"
          onClick={onClose}
          aria-label="Close developer tools"
        >
          &times;
        </button>
      </div>
      <div className="stats-popup-body">
        <p className="ui-interaction-warning">
          ⚠️ Unprotected — dev only. Do not ship to production users.
        </p>

        <div className="dev-tools-section">
          <label className="dev-tools-label">Console Command</label>
          <div className="dev-tools-row">
            <input
              className="dev-tools-input"
              type="text"
              value={consoleCmd}
              onChange={(e) => setConsoleCmd(e.target.value)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") onConsoleCommand(consoleCmd);
              }}
              placeholder="e.g. stat fps"
            />
            <button
              type="button"
              className="dev-tools-btn"
              onClick={() => onConsoleCommand(consoleCmd)}
            >
              Send
            </button>
          </div>
        </div>

        <div className="dev-tools-section">
          <label className="dev-tools-label">UI Interaction (JSON)</label>
          <textarea
            className="ui-interaction-textarea"
            value={uiJson}
            onChange={(e) => setUiJson(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            rows={4}
            placeholder='{"Function":"SwitchCameraByIndex","Index":3}'
          />
          {uiInteractionError && (
            <p className="ui-interaction-error">{uiInteractionError}</p>
          )}
          <div className="dev-tools-row">
            <button
              type="button"
              className="dev-tools-btn"
              onClick={() => onSendRawJson(uiJson)}
            >
              Send to UE
            </button>
          </div>
        </div>

        <div className="dev-tools-section">
          <label className="dev-tools-label">Connection</label>
          <div className="dev-tools-row">
            <button
              type="button"
              className="dev-tools-btn dev-tools-btn-danger"
              onClick={onDisconnect}
            >
              Disconnect
            </button>
          </div>
        </div>

        <div className="dev-tools-section">
          <label className="dev-tools-label">Microphone & Camera</label>
          <div className="dev-tools-row">
            <button
              type="button"
              className="dev-tools-btn"
              onClick={onEnableMic}
            >
              Enable Mic
            </button>
            <button
              type="button"
              className="dev-tools-btn"
              onClick={onEnableCamera}
            >
              Enable Camera
            </button>
          </div>
        </div>

        <div className="dev-tools-section">
          <label className="dev-tools-label">Hovering Mouse</label>
          <div className="dev-tools-row">
            <button
              type="button"
              className="dev-tools-btn"
              onClick={() => onHoverMouse(true)}
            >
              Enable
            </button>
            <button
              type="button"
              className="dev-tools-btn"
              onClick={() => onHoverMouse(false)}
            >
              Disable
            </button>
          </div>
        </div>

        {lastUeResponse != null && (
          <div className="ui-interaction-response">
            <label className="dev-tools-label">Last UE Response</label>
            <pre className="ui-interaction-response-body">
              {typeof lastUeResponse === "string"
                ? lastUeResponse
                : JSON.stringify(lastUeResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
