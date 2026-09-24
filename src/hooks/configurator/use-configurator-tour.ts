"use client";

import { useCallback, useEffect, useState } from "react";

export type ConfiguratorTourStepId = "zones" | "materials" | "dock";

export type ConfiguratorTourStep = {
  id: ConfiguratorTourStepId;
  title: string;
  body: string;
  /** Where the tooltip sits relative to its target. */
  placement: "below" | "right" | "above";
  nextLabel: string;
};

export const CONFIGURATOR_TOUR_STEPS: ConfiguratorTourStep[] = [
  {
    id: "zones",
    title: "Welcome to Atelier by Reef",
    body: "Pick a room above to jump there, or simply walk in. Surfaces appear once a room is selected so you can lock the camera to a finish.",
    placement: "below",
    nextLabel: "Next",
  },
  {
    id: "materials",
    title: "Welcome to Atelier by Reef",
    body: "Use the materials panel to choose surfaces, finish types, and variations for the room you are viewing.",
    placement: "right",
    nextLabel: "Next",
  },
  {
    id: "dock",
    title: "Welcome to Atelier by Reef",
    body: "The dock keeps your selections, reset, settings, fullscreen, and quotation actions within reach.",
    placement: "above",
    nextLabel: "Done",
  },
];

const STORAGE_KEY = "atelier:configurator-tour-v1";

function readTourDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeTourDone() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* ignore quota / private mode */
  }
}

type Args = {
  /** Scene chrome is mounted and the user can customize. */
  enabled: boolean;
};

/**
 * Mandatory first-run UI tour (zones → materials → dock), with Skip / Done
 * persistence and an Info-button replay path.
 */
export function useConfiguratorTour({ enabled }: Args) {
  const [hydrated, setHydrated] = useState(false);
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // localStorage is client-only
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate LS flag
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!enabled || !hydrated) return;
    if (readTourDone()) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auto-start mandatory tour
    setStepIndex(0);
    setActive(true);
  }, [enabled, hydrated]);

  const complete = useCallback(() => {
    writeTourDone();
    setActive(false);
    setStepIndex(0);
  }, []);

  const next = useCallback(() => {
    setStepIndex((prev) => {
      if (prev >= CONFIGURATOR_TOUR_STEPS.length - 1) {
        writeTourDone();
        setActive(false);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const skip = useCallback(() => {
    complete();
  }, [complete]);

  const replay = useCallback(() => {
    setStepIndex(0);
    setActive(true);
  }, []);

  const step = active ? CONFIGURATOR_TOUR_STEPS[stepIndex] : null;
  const forceMaterialsPanel = Boolean(active && step?.id === "materials");

  return {
    active,
    step,
    stepIndex,
    stepCount: CONFIGURATOR_TOUR_STEPS.length,
    forceMaterialsPanel,
    next,
    skip,
    replay,
  };
}
