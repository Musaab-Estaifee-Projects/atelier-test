"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ShareableConfiguratorParams } from "@/types/configurator";
import { normalizeZone } from "@/lib/configurator/url-params";
import { DEFAULT_LAYOUT_CODE } from "@/lib/projects/catalog";
import { isStreamProjectId } from "@/lib/projects/project-id";

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
 * Mesh/material and design_code are NEVER in the URL.
 *
 * /configurator/{stream_id}?project_id=&layout_code=&apartment_id=&zone=&camera=&renders=
 */
export function useShareableParams(streamIdFromRoute: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params: ShareableConfiguratorParams = useMemo(() => {
    const cameraRaw = firstParam(searchParams, "camera");
    const camera = cameraRaw && /^\d+$/.test(cameraRaw) ? null : cameraRaw;

    return {
      streamId: streamIdFromRoute,
      backendProjectId: firstParam(searchParams, "project_id", "projectId"),
      unit: firstParam(searchParams, "unit"),
      apartmentId: firstParam(searchParams, "apartment_id", "apartmentId"),
      layoutCode:
        firstParam(searchParams, "layout_code", "layoutCode", "level") ??
        DEFAULT_LAYOUT_CODE,
      camera,
      zone: normalizeZone(searchParams.get("zone")),
      view: searchParams.get("view") === "1",
      renders:
        searchParams.get("renders") === "1" ||
        searchParams.get("renders") === "true",
      streamerId: firstParam(searchParams, "streamerId"),
      sfuHost: firstParam(searchParams, "sfuHost"),
      sfuPlayer: firstParam(searchParams, "sfuPlayer"),
    };
  }, [streamIdFromRoute, searchParams]);

  useEffect(() => {
    const hasLegacy =
      searchParams.has("mesh") ||
      searchParams.has("material") ||
      searchParams.has("design_code") ||
      searchParams.has("designCode") ||
      searchParams.has("loadId") ||
      searchParams.has("level") ||
      searchParams.has("projectId") ||
      searchParams.has("apartmentId");
    const rawZone = searchParams.get("zone");
    const emptyZone =
      searchParams.has("zone") && normalizeZone(rawZone) == null;
    const missingCanonical = !searchParams.get("layout_code");
    const streamAsProject =
      searchParams.get("project_id") === streamIdFromRoute ||
      isStreamProjectId(searchParams.get("project_id"), streamIdFromRoute);

    if (
      !hasLegacy &&
      !emptyZone &&
      !missingCanonical &&
      !streamAsProject
    ) {
      return;
    }

    const next = new URLSearchParams(searchParams.toString());
    next.delete("mesh");
    next.delete("material");
    next.delete("design_code");
    next.delete("designCode");
    next.delete("loadId");
    if (emptyZone) next.delete("zone");

    const projectId = firstParam(next, "project_id", "projectId");
    const layout =
      firstParam(next, "layout_code", "layoutCode", "level") ??
      DEFAULT_LAYOUT_CODE;
    const apartmentId = firstParam(next, "apartment_id", "apartmentId");

    if (projectId && !isStreamProjectId(projectId, streamIdFromRoute)) {
      next.set("project_id", projectId);
    } else {
      next.delete("project_id");
    }
    next.set("layout_code", layout);
    if (apartmentId) next.set("apartment_id", apartmentId);

    next.delete("projectId");
    next.delete("layoutCode");
    next.delete("level");
    next.delete("apartmentId");

    const qs = next.toString();
    const href = qs ? `${pathname}?${qs}` : pathname;
    if (href === `${pathname}?${searchParams.toString()}`) return;
    router.replace(href, { scroll: false });
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
      next.delete("design_code");
      next.delete("apartmentId");

      if (patch.backendProjectId !== undefined) {
        if (
          patch.backendProjectId &&
          !isStreamProjectId(patch.backendProjectId, streamIdFromRoute)
        ) {
          next.set("project_id", patch.backendProjectId);
        } else next.delete("project_id");
      } else if (isStreamProjectId(next.get("project_id"), streamIdFromRoute)) {
        next.delete("project_id");
      }
      if (patch.layoutCode !== undefined) {
        if (patch.layoutCode) next.set("layout_code", patch.layoutCode);
        else next.delete("layout_code");
      }
      if (patch.apartmentId !== undefined) {
        if (patch.apartmentId) next.set("apartment_id", patch.apartmentId);
        else next.delete("apartment_id");
      }
      if (patch.unit !== undefined) {
        if (patch.unit) next.set("unit", patch.unit);
        else next.delete("unit");
      }
      if (patch.renders !== undefined) {
        if (patch.renders) next.set("renders", "1");
        else next.delete("renders");
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
    [pathname, router, searchParams, streamIdFromRoute],
  );

  return { params, setParams };
}
