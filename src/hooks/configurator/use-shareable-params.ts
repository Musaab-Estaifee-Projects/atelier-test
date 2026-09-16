"use client";

import { useCallback, useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ShareableConfiguratorParams } from "@/types/configurator";
import { normalizeZone } from "@/lib/configurator/url-params";
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

const STRIP_KEYS = [
  "mesh",
  "material",
  "design_code",
  "designCode",
  "loadId",
  "level",
  "projectId",
  "apartmentId",
  "unit",
  "project",
  "project_name",
  "projectName",
  "layout_category",
  "layoutCategory",
  "layout_type",
  "layoutType",
] as const;

/**
 * Reads / writes shareable configurator state from the URL.
 * Mesh/material, design_code, and residence display labels are NEVER in the URL.
 *
 * /configurator/{stream_id}?project_id=&layout_code=&apartment_id=&apartment_number=&zone=&camera=&renders=
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
      unit: firstParam(searchParams, "apartment_number", "unit"),
      apartmentId: firstParam(searchParams, "apartment_id", "apartmentId"),
      apartmentNumber: firstParam(searchParams, "apartment_number", "unit"),
      layoutCode: firstParam(searchParams, "layout_code", "layoutCode", "level"),
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
    const hasLegacy = STRIP_KEYS.some((key) => searchParams.has(key));
    const rawZone = searchParams.get("zone");
    const emptyZone =
      searchParams.has("zone") && normalizeZone(rawZone) == null;
    const aliasedLayout = firstParam(
      searchParams,
      "layoutCode",
      "level",
    );
    const missingCanonical =
      !searchParams.get("layout_code") && Boolean(aliasedLayout);
    const streamAsProject =
      searchParams.get("project_id") === streamIdFromRoute ||
      isStreamProjectId(searchParams.get("project_id"), streamIdFromRoute);

    if (!hasLegacy && !emptyZone && !missingCanonical && !streamAsProject) {
      return;
    }

    const projectId = firstParam(
      searchParams,
      "project_id",
      "projectId",
    );
    const layout = firstParam(searchParams, "layout_code", "layoutCode", "level");
    const apartmentId = firstParam(
      searchParams,
      "apartment_id",
      "apartmentId",
    );
    const apartmentNumber = firstParam(
      searchParams,
      "apartment_number",
      "unit",
    );

    const next = new URLSearchParams(searchParams.toString());
    for (const key of STRIP_KEYS) next.delete(key);
    if (emptyZone) next.delete("zone");

    if (projectId && !isStreamProjectId(projectId, streamIdFromRoute)) {
      next.set("project_id", projectId);
    } else {
      next.delete("project_id");
    }
    if (layout) next.set("layout_code", layout);
    else next.delete("layout_code");
    if (apartmentId) next.set("apartment_id", apartmentId);
    else next.delete("apartment_id");
    if (apartmentNumber) next.set("apartment_number", apartmentNumber);
    else next.delete("apartment_number");

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
      for (const key of STRIP_KEYS) next.delete(key);

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
      if (patch.apartmentNumber !== undefined || patch.unit !== undefined) {
        const number = patch.apartmentNumber ?? patch.unit;
        if (number) next.set("apartment_number", number);
        else next.delete("apartment_number");
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
