"use client";

import { forwardRef } from "react";

const StreamViewport = forwardRef<HTMLDivElement>(
  function StreamViewport(_, ref) {
    return (
      <div
        ref={ref}
        className="stream-viewport"
        data-testid="stream-viewport"
      />
    );
  },
);

export default StreamViewport;
