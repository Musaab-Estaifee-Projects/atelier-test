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
    body: "Select a room from the navigation above to jump directly to that space or walk through your home freely to explore.",
    placement: "below",
    nextLabel: "Next",
  },
  {
    id: "materials",
    title: "make this 3 steps :",
    body: `
    <ol class="list-decimal list-outside flex flex-col gap-2 pl-3">
      <li>
        <span class="font-medium">Select Your Surface:</span>
        <p>Choose the surface you would like to customize.</p>
      </li>
      <li>
        <span class="font-medium">Choose Your Finish:</span>
        <p>Explore the available finish types for the selected surface.</p>
      </li>
      <li>
        <span class="font-medium">Select Your Variation:</span>
        <p>Choose your preferred color/material variation to complete your customization.</p>
      </li>
    </ol>`,
    placement: "right",
    nextLabel: "Next",
  },
  {
    id: "dock",
    title: "Action Bar",
    body: "Generate your quotation, access your material selections, track saving status, explore materials, and manage configurator settings, all in one place.",
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
