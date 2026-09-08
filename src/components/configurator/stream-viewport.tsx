"use client";

import { forwardRef } from "react";

const StreamViewport = forwardRef<HTMLDivElement>(
  function StreamViewport(_, ref) {
    return (
      <div
        ref={ref}
        className="stream-viewport"
        data-testid="stream-viewport"
      >
        <div id="playOverlay" hidden aria-hidden="true" />
        <div id="connectOverlay" hidden aria-hidden="true" />
        <div id="infoOverlay" hidden aria-hidden="true" />
        <div id="videoPlayOverlay" hidden aria-hidden="true" />
        <div id="streamingStateOverlay" hidden aria-hidden="true" />
        <div id="uiFeatures" hidden aria-hidden="true" />
        <div id="afkOverlay" hidden aria-hidden="true" />
      </div>
    );
  },
);

export default StreamViewport;
