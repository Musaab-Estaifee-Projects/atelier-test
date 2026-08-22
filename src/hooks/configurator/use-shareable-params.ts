// src/hooks/configurator/useShareableParams.ts
"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ShareableConfiguratorParams } from "@/types/configurator";
import { normalizeZone } from "@/lib/configurator/url-params";

/**
 * Reads / writes shareable configurator state from the URL.
 * Mesh/material are NEVER in the URL — only localStorage until submit.
 * Zone is only present when a real non-empty zone exists.
 *
 * Route shape:
 * /configurator/[projectId]?unit=...&designCode=...&level=...&camera=...&zone=...
 */
export function useShareableParams(projectIdFromRoute: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: ShareableConfiguratorParams = useMemo(() => {
    const cameraRaw = searchParams.get("camera");
    const camera =
      cameraRaw !== null && cameraRaw !== "" && !Number.isNaN(Number(cameraRaw))
        ? Number(cameraRaw)
        : null;

    return {
      projectId: projectIdFromRoute,
      unit: searchParams.get("unit"),
      designCode: searchParams.get("designCode") ?? searchParams.get("loadId"),
      level: searchParams.get("level"),
      camera,
      zone: normalizeZone(searchParams.get("zone")),
      streamerId: searchParams.get("streamerId"),
      sfuHost: searchParams.get("sfuHost"),
      sfuPlayer: searchParams.get("sfuPlayer"),
    };
  }, [projectIdFromRoute, searchParams]);

  // Strip legacy mesh/material and empty zone from the URL
  useEffect(() => {
    const hasLegacy =
      searchParams.has("mesh") || searchParams.has("material");
    const rawZone = searchParams.get("zone");
    const emptyZone =
      searchParams.has("zone") && normalizeZone(rawZone) == null;
    if (!hasLegacy && !emptyZone) return;

    const next = new URLSearchParams(searchParams.toString());
    next.delete("mesh");
    next.delete("material");
    if (emptyZone) next.delete("zone");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router]);

  const setParams = useCallback(
    (
      patch: Partial<ShareableConfiguratorParams>,
      options?: { replace?: boolean },
    ) => {
      const next = new URLSearchParams(searchParams.toString());

      next.delete("mesh");
      next.delete("material");

      const map: Record<string, string | number | null | undefined> = {
        unit: patch.unit,
        designCode: patch.designCode,
        level: patch.level,
        camera: patch.camera,
        streamerId: patch.streamerId,
        sfuHost: patch.sfuHost,
        sfuPlayer: patch.sfuPlayer,
      };

      for (const [key, value] of Object.entries(map)) {
        if (value === undefined) continue;
        if (value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      }

      // Zone: only append when real; null/"" deletes; undefined leaves unchanged
      if (patch.zone !== undefined) {
        const z = normalizeZone(patch.zone);
        if (z) next.set("zone", z);
        else next.delete("zone");
      }

      if (patch.designCode !== undefined) {
        next.delete("loadId");
      }

      const qs = next.toString();
      const href = qs ? `${pathname}?${qs}` : pathname;
      if (options?.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { params, setParams };
}
