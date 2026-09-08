"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ShareableConfiguratorParams } from "@/types/configurator";
import { normalizeZone } from "@/lib/configurator/url-params";
import { DEFAULT_LAYOUT_CODE } from "@/lib/projects/catalog";

function firstParam(
  searchParams: URLSearchParams,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value != null && value.trim() !== "") return value.trim();
  }
  return null;
}

/**
 * Reads / writes shareable configurator state from the URL.
 * Mesh/material are NEVER in the URL.
 *
 * /configurator/{stream_id}?project_id=&layout_code=&design_code=&zone=&camera=
 */
export function useShareableParams(streamIdFromRoute: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: ShareableConfiguratorParams = useMemo(() => {
    const cameraRaw = firstParam(searchParams, "camera");
    const camera =
      cameraRaw && /^\d+$/.test(cameraRaw) ? null : cameraRaw;

    return {
      streamId: streamIdFromRoute,
      backendProjectId: firstParam(searchParams, "project_id", "projectId"),
      unit: firstParam(searchParams, "unit"),
      designCode: firstParam(searchParams, "design_code", "designCode", "loadId"),
      layoutCode:
        firstParam(searchParams, "layout_code", "layoutCode", "level") ??
        DEFAULT_LAYOUT_CODE,
      camera,
      zone: normalizeZone(searchParams.get("zone")),
      view: searchParams.get("view") === "1",
      streamerId: firstParam(searchParams, "streamerId"),
      sfuHost: firstParam(searchParams, "sfuHost"),
      sfuPlayer: firstParam(searchParams, "sfuPlayer"),
    };
  }, [streamIdFromRoute, searchParams]);

  useEffect(() => {
    const hasLegacy =
      searchParams.has("mesh") ||
      searchParams.has("material") ||
      searchParams.has("designCode") ||
      searchParams.has("loadId") ||
      searchParams.has("level") ||
      searchParams.has("projectId");
    const rawZone = searchParams.get("zone");
    const emptyZone =
      searchParams.has("zone") && normalizeZone(rawZone) == null;
    const missingCanonical = !searchParams.get("layout_code");
    if (!hasLegacy && !emptyZone && !missingCanonical && !searchParams.has("unit")) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("mesh");
    next.delete("material");
    next.delete("unit");
    if (emptyZone) next.delete("zone");

    const projectId = firstParam(next, "project_id", "projectId");
    const layout =
      firstParam(next, "layout_code", "layoutCode", "level") ??
      DEFAULT_LAYOUT_CODE;
    const design = firstParam(next, "design_code", "designCode", "loadId");

    if (projectId && projectId !== streamIdFromRoute) {
      next.set("project_id", projectId);
    } else if (projectId === streamIdFromRoute) {
      next.delete("project_id");
    }
    next.set("layout_code", layout);
    if (design) next.set("design_code", design);

    next.delete("projectId");
    next.delete("layoutCode");
    next.delete("level");
    next.delete("designCode");
    next.delete("loadId");

    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [searchParams, pathname, router, streamIdFromRoute]);

  const setParams = useCallback(
    (
      patch: Partial<ShareableConfiguratorParams>,
      options?: { replace?: boolean },
    ) => {
      const next = new URLSearchParams(searchParams.toString());
      next.delete("mesh");
      next.delete("material");
      next.delete("designCode");
      next.delete("loadId");
      next.delete("level");
      next.delete("projectId");
      next.delete("unit");

      if (patch.backendProjectId !== undefined) {
        if (
          patch.backendProjectId &&
          patch.backendProjectId !== streamIdFromRoute
        ) {
          next.set("project_id", patch.backendProjectId);
        } else next.delete("project_id");
      } else if (next.get("project_id") === streamIdFromRoute) {
        next.delete("project_id");
      }
      if (patch.layoutCode !== undefined) {
        if (patch.layoutCode) next.set("layout_code", patch.layoutCode);
        else next.delete("layout_code");
      }
      if (patch.designCode !== undefined) {
        if (patch.designCode) next.set("design_code", patch.designCode);
        else next.delete("design_code");
      }
      if (patch.camera !== undefined) {
        if (patch.camera) next.set("camera", patch.camera);
        else next.delete("camera");
      }
      if (patch.view !== undefined) {
        if (patch.view) next.set("view", "1");
        else next.delete("view");
      }
      if (patch.streamerId !== undefined) {
        if (patch.streamerId) next.set("streamerId", patch.streamerId);
        else next.delete("streamerId");
      }
      if (patch.sfuHost !== undefined) {
        if (patch.sfuHost) next.set("sfuHost", patch.sfuHost);
        else next.delete("sfuHost");
      }
      if (patch.sfuPlayer !== undefined) {
        if (patch.sfuPlayer) next.set("sfuPlayer", patch.sfuPlayer);
        else next.delete("sfuPlayer");
      }

      if (patch.zone !== undefined) {
        const z = normalizeZone(patch.zone);
        if (z) next.set("zone", z);
        else next.delete("zone");
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
