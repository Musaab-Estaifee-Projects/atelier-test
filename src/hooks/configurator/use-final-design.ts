/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/refs */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { UeInteractionPayload } from "@/lib/stream-pixel/ue-protocol";
import {
  extractRenderEvent,
  stillSrcFromPayload,
  toBlobUrl,
  type RenderCameraPayload,
  type RenderEvent,
} from "@/lib/stream-pixel/parse-render-response";
import { delay, sendUntilAccepted } from "@/lib/stream-pixel/share-restore";
import {
  FINAL_COMPLETED_MS,
  FINAL_STILL_HEIGHT,
  FINAL_STILL_WIDTH,
  FINAL_STARTED_MS,
  FINAL_UPLOAD_MS,
  UE_CAPTURE_CAMERAS,
  buildRoomCards,
  mockStillJpeg,
  newCaptureJobId,
  resolveCaptureCamera,
  revokeUrl,
  zoneIdForCaptureCamera,
} from "@/lib/configurator/final-design";
import type {
  FinalDesignPhase,
  MeshRulesConfig,
  RoomRenderCard,
} from "@/types/configurator";

type SendFn = (payload: UeInteractionPayload) => boolean;

type Args = {
  send: SendFn;
  mockUe: boolean;
  sceneConfig: MeshRulesConfig;
  videoContainerRef: React.RefObject<HTMLDivElement | null>;
};

function patchRooms(
  rooms: RoomRenderCard[],
  zoneId: string,
  patch: (room: RoomRenderCard) => RoomRenderCard,
): RoomRenderCard[] {
  return rooms.map((r) => (r.zoneId === zoneId ? patch(r) : r));
}

function attachStill(
  room: RoomRenderCard,
  still: {
    cameraName: string;
    cameraIndex?: number;
    file?: string;
    imageUrl?: string;
  },
): RoomRenderCard {
  const stills = [...room.stills];
  const idx = stills.findIndex(
    (s) =>
      s.cameraName === still.cameraName ||
      (still.cameraIndex != null && s.cameraIndex === still.cameraIndex) ||
      (still.file != null && s.file === still.file),
  );
  if (idx >= 0) {
    stills[idx] = {
      ...stills[idx],
      ...still,
      imageUrl: still.imageUrl ?? stills[idx].imageUrl,
    };
  } else stills.push(still);

  return withRoomProgress({ ...room, stills });
}

function withRoomProgress(room: RoomRenderCard): RoomRenderCard {
  const needed = room.stills.filter((s) => s.cameraName);
  const done = needed.filter((s) => s.imageUrl).length;
  const heroHit =
    needed.find((s) => s.cameraName === room.heroCameraName && s.imageUrl) ??
    needed.find((s) => s.imageUrl);

  if (needed.length > 0 && done >= needed.length) {
    return {
      ...room,
      imageUrl: heroHit?.imageUrl ?? room.imageUrl,
      status: "completed",
      error: undefined,
    };
  }
  if (room.status === "error") {
    return { ...room, imageUrl: heroHit?.imageUrl ?? room.imageUrl };
  }
  if (done > 0 || needed.some((s) => s.file)) {
    return {
      ...room,
      imageUrl: heroHit?.imageUrl ?? room.imageUrl,
      status: "rendering",
    };
  }
  return { ...room, imageUrl: heroHit?.imageUrl ?? room.imageUrl };
}

export function useFinalDesign({
  send,
  mockUe,
  sceneConfig,
  videoContainerRef,
}: Args) {
  void videoContainerRef;

  const [phase, setPhase] = useState<FinalDesignPhase>("idle");
  const [rooms, setRooms] = useState<RoomRenderCard[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);
  const [viewerZoneId, setViewerZoneId] = useState<string | null>(null);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const jobIdRef = useRef<string | null>(null);
  const roomsRef = useRef<RoomRenderCard[]>([]);
  const phaseRef = useRef<FinalDesignPhase>("idle");
  const sceneRef = useRef(sceneConfig);
  const sendRef = useRef(send);
  const mockRef = useRef(mockUe);
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const timersRef = useRef<number[]>([]);
  const startedRef = useRef(false);
  const completedRef = useRef(false);
  const uploadAttemptRef = useRef(0);
  const loggedCompletedRef = useRef(false);

  phaseRef.current = phase;
  sceneRef.current = sceneConfig;
  sendRef.current = send;
  mockRef.current = mockUe;

  const commitRooms = useCallback(
    (
      update: RoomRenderCard[] | ((prev: RoomRenderCard[]) => RoomRenderCard[]),
    ) => {
      const next =
        typeof update === "function" ? update(roomsRef.current) : update;
      roomsRef.current = next;
      setRooms(next);
      return next;
    },
    [],
  );

  const trackBlob = useCallback((url: string) => {
    if (url.startsWith("blob:")) blobUrlsRef.current.add(url);
    return url;
  }, []);

  const materializeImage = useCallback(
    (raw?: string): string | undefined => {
      const src = stillSrcFromPayload(raw);
      if (!src) return undefined;
      return trackBlob(toBlobUrl(src));
    },
    [trackBlob],
  );

  const emit = useCallback(async (payload: UeInteractionPayload) => {
    if (mockRef.current) {
      console.info("[mock UE]", payload);
      return true;
    }
    return sendUntilAccepted(sendRef.current, payload, {
      attempts: 10,
      gapMs: 250,
      label: String(payload.Function ?? "UE"),
    });
  }, []);

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) window.clearTimeout(id);
    timersRef.current = [];
  }, []);

  const schedule = useCallback((ms: number, fn: () => void) => {
    const id = window.setTimeout(fn, ms);
    timersRef.current.push(id);
    return id;
  }, []);

  const resetBlobs = useCallback(() => {
    for (const url of blobUrlsRef.current) revokeUrl(url);
    blobUrlsRef.current.clear();
  }, []);

  const missingStillFiles = useCallback(() => {
    const files: string[] = [];
    for (const room of roomsRef.current) {
      for (const s of room.stills) {
        if (!s.imageUrl && s.file) files.push(s.file);
      }
    }
    return files;
  }, []);

  const failRoomsMissingImages = useCallback(
    (message: string) => {
      commitRooms((prev) =>
        prev.map((r) => {
          const ready = withRoomProgress(r);
          if (ready.status === "completed") return ready;
          return {
            ...ready,
            status: "error",
            error: r.error ?? message,
          };
        }),
      );
    },
    [commitRooms],
  );

  const requestUpload = useCallback(
    (job: string) => {
      const files = missingStillFiles();
      if (!files.length) {
        const pending = roomsRef.current.some(
          (r) => r.status !== "completed" && r.status !== "error",
        );
        if (pending) {
          failRoomsMissingImages(
            "UE did not return stills for this room. Retry to try again.",
          );
        }
        return;
      }
      uploadAttemptRef.current += 1;
      const attempt = uploadAttemptRef.current;
      console.info("[FinalDesign] UploadScreenshots", files);
      void emit({ Function: "UploadScreenshots", JobId: job, Files: files });
      schedule(FINAL_UPLOAD_MS, () => {
        if (jobIdRef.current !== job) return;
        const stillMissing = missingStillFiles();
        if (!stillMissing.length) return;
        if (attempt < 2) {
          requestUpload(job);
          return;
        }
        failRoomsMissingImages(
          "UE did not return stills for this room. Retry to try again.",
        );
      });
    },
    [emit, failRoomsMissingImages, missingStillFiles, schedule],
  );

  const applyCameraStill = useCallback(
    (payload: RenderCameraPayload, file?: string) => {
      const resolved = resolveCaptureCamera({
        name: payload.name,
        index: payload.index,
        file: payload.file ?? file,
      });
      const cameraName = resolved?.name ?? payload.name;
      const cameraIndex = resolved?.index ?? payload.index;
      const zoneId = zoneIdForCaptureCamera(
        cameraName,
        cameraIndex,
        undefined,
        payload.file ?? file,
      );
      if (!zoneId) {
        console.warn("[FinalDesign] unmapped camera", payload);
        return;
      }
      const imageUrl = materializeImage(payload.image);
      commitRooms((prev) => {
        const hasRoom = prev.some((r) => r.zoneId === zoneId);
        if (!hasRoom) return prev;
        return patchRooms(prev, zoneId, (room) =>
          attachStill(room, {
            cameraName,
            cameraIndex,
            file: payload.file ?? file,
            imageUrl,
          }),
        );
      });
    },
    [materializeImage, commitRooms],
  );

  const ingestRender = useCallback(
    (event: RenderEvent) => {
      if (phaseRef.current !== "capturing" && phaseRef.current !== "review") {
        return;
      }
      if (event.jobId && jobIdRef.current && event.jobId !== jobIdRef.current) {
        return;
      }

      if (event.kind === "error") {
        setGlobalError(event.message ?? "Capture failed.");
        failRoomsMissingImages(event.message ?? "Capture failed.");
        return;
      }

      if (event.kind === "started") {
        startedRef.current = true;
        commitRooms((prev) =>
          prev.map((r) =>
            r.status === "queued" ? { ...r, status: "rendering" } : r,
          ),
        );
      }

      if (
        event.cameraName ||
        event.image ||
        event.file ||
        event.cameraIndex != null
      ) {
        applyCameraStill(
          {
            name:
              event.cameraName ??
              resolveCaptureCamera({
                index: event.cameraIndex,
                file: event.file,
              })?.name ??
              `Camera ${event.cameraIndex ?? 0}`,
            index: event.cameraIndex,
            file: event.file,
            image: event.image,
          },
          event.file,
        );
      }
      event.cameras?.forEach((c) => applyCameraStill(c, c.file ?? event.file));

      if (event.kind === "completed" || event.kind === "uploaded") {
        if (event.kind === "completed") {
          completedRef.current = true;
          if (!loggedCompletedRef.current) {
            loggedCompletedRef.current = true;
            console.info("[FinalDesign] UE completed cameras", event.cameras);
          }
        }
        const job = jobIdRef.current;
        const missing = missingStillFiles();
        const pendingRooms = roomsRef.current.some(
          (r) => r.status !== "completed" && r.status !== "error",
        );
        if (
          job &&
          (missing.length || pendingRooms) &&
          event.kind === "completed"
        ) {
          requestUpload(job);
        }
      }
    },
    [
      applyCameraStill,
      commitRooms,
      failRoomsMissingImages,
      missingStillFiles,
      requestUpload,
    ],
  );

  const ingestUeResponse = useCallback(
    (response: unknown) => {
      const event = extractRenderEvent(response);
      if (event) ingestRender(event);
    },
    [ingestRender],
  );

  const startWatchdogs = useCallback(
    (job: string) => {
      schedule(FINAL_STARTED_MS, () => {
        if (jobIdRef.current !== job || startedRef.current) return;
        setGlobalError("Capture did not start. Retry.");
        failRoomsMissingImages("Capture did not start. Retry.");
      });
      schedule(FINAL_COMPLETED_MS, () => {
        if (jobIdRef.current !== job || completedRef.current) return;
        failRoomsMissingImages(
          "Capture timed out. Retry this room to try again.",
        );
      });
    },
    [failRoomsMissingImages, schedule],
  );

  const fireBulkCapture = useCallback(
    (job: string) => {
      void emit({
        Function: "CaptureCamerasHighRes",
        JobId: job,
        Width: FINAL_STILL_WIDTH,
        Height: FINAL_STILL_HEIGHT,
        Format: "png",
      });
    },
    [emit],
  );

  const simulateMockCapture = useCallback(
    async (job: string) => {
      await delay(180);
      if (jobIdRef.current !== job) return;
      ingestRender({
        kind: "started",
        cameraCount: UE_CAPTURE_CAMERAS.length,
        cameras: UE_CAPTURE_CAMERAS.map((c) => ({
          name: c.name,
          index: c.index,
        })),
        jobId: job,
      });
      for (const cam of UE_CAPTURE_CAMERAS) {
        await delay(70);
        if (jobIdRef.current !== job) return;
        ingestRender({
          kind: "capturing",
          cameraName: cam.name,
          cameraIndex: cam.index,
          file: `Cam_${cam.index}.png`,
          image: mockStillJpeg(cam.name.replace(/^CAM-/, "")),
          jobId: job,
        });
      }
      if (jobIdRef.current !== job) return;
      ingestRender({
        kind: "completed",
        cameraCount: UE_CAPTURE_CAMERAS.length,
        cameras: UE_CAPTURE_CAMERAS.map((c) => ({
          name: c.name,
          index: c.index,
          file: `Cam_${c.index}.png`,
          image: mockStillJpeg(c.name.replace(/^CAM-/, "")),
        })),
        jobId: job,
        message: "All renders completed",
      });
    },
    [ingestRender],
  );

  const startCapture = useCallback(() => {
    clearTimers();
    resetBlobs();
    startedRef.current = false;
    completedRef.current = false;
    uploadAttemptRef.current = 0;
    loggedCompletedRef.current = false;

    const cards = buildRoomCards(sceneRef.current);
    if (!cards.length) {
      setGlobalError("No room cameras are available to capture.");
      phaseRef.current = "confirm";
      setPhase("confirm");
      return;
    }

    const id = newCaptureJobId();
    jobIdRef.current = id;
    setJobId(id);

    const nextRooms = cards.map((c) => ({
      ...c,
      status: "queued" as const,
      attempt: 0,
      imageUrl: undefined,
      error: undefined,
      stills: c.stills.map((s) => ({
        ...s,
        imageUrl: undefined,
        file: undefined,
      })),
    }));
    commitRooms(nextRooms);
    setGlobalError(null);
    setViewerZoneId(null);
    phaseRef.current = "capturing";
    setPhase("capturing");
    startWatchdogs(id);

    if (mockRef.current) {
      void simulateMockCapture(id);
      return;
    }
    fireBulkCapture(id);
  }, [
    clearTimers,
    resetBlobs,
    commitRooms,
    startWatchdogs,
    simulateMockCapture,
    fireBulkCapture,
  ]);

  const openConfirm = useCallback(() => {
    setGlobalError(null);
    setPhase("confirm");
  }, []);

  const backToCustomize = useCallback(() => {
    jobIdRef.current = null;
    clearTimers();
    setViewerZoneId(null);
    phaseRef.current = "idle";
    setPhase("idle");
  }, [clearTimers]);

  const retryRoom = useCallback(
    (zoneId: string) => {
      const current = roomsRef.current.find((r) => r.zoneId === zoneId);
      if (!current) return;

      const missing = current.stills.filter((s) => !s.imageUrl);
      const targets = missing.length ? missing : current.stills;
      if (!missing.length) {
        current.stills.forEach((s) => {
          if (s.imageUrl) revokeUrl(s.imageUrl);
        });
        if (current.imageUrl) revokeUrl(current.imageUrl);
      }

      commitRooms((prev) =>
        patchRooms(prev, zoneId, (r) => ({
          ...r,
          status: "rendering",
          attempt: r.attempt + 1,
          error: undefined,
          imageUrl: missing.length ? r.imageUrl : undefined,
          stills: r.stills.map((s) =>
            targets.some((t) => t.cameraName === s.cameraName)
              ? { ...s, imageUrl: undefined, file: undefined }
              : s,
          ),
        })),
      );

      let job = jobIdRef.current;
      if (!job) {
        job = newCaptureJobId();
        jobIdRef.current = job;
        setJobId(job);
      }
      phaseRef.current = "capturing";
      setPhase("capturing");
      setGlobalError(null);

      const room = roomsRef.current.find((r) => r.zoneId === zoneId);
      if (!room) return;
      const retryTargets = room.stills.filter((s) => !s.imageUrl);

      if (mockRef.current) {
        void (async () => {
          for (const s of retryTargets) {
            await delay(80);
            ingestRender({
              kind: "capturing",
              cameraName: s.cameraName,
              cameraIndex: s.cameraIndex,
              file: `Cam_${s.cameraIndex ?? 0}.png`,
              image: mockStillJpeg(s.cameraName.replace(/^CAM-/, "")),
              jobId: jobIdRef.current ?? undefined,
            });
          }
        })();
        return;
      }

      for (const s of retryTargets) {
        void emit({
          Function: "CaptureCameraHighRes",
          JobId: job,
          CameraName: s.cameraName,
          CameraIndex: s.cameraIndex,
          Index: s.cameraIndex,
          Width: FINAL_STILL_WIDTH,
          Height: FINAL_STILL_HEIGHT,
          Format: "png",
        });
      }
      const retryJob = job;
      schedule(FINAL_STARTED_MS, () => {
        if (jobIdRef.current !== retryJob) return;
        const latest = roomsRef.current.find((r) => r.zoneId === zoneId);
        if (!latest || latest.status === "completed") return;
        const files = latest.stills
          .filter((s) => !s.imageUrl && s.file)
          .map((s) => s.file!);
        if (files.length) {
          void emit({
            Function: "UploadScreenshots",
            JobId: retryJob,
            Files: files,
          });
        }
      });
      schedule(FINAL_STARTED_MS + FINAL_UPLOAD_MS, () => {
        if (jobIdRef.current !== retryJob) return;
        const latest = roomsRef.current.find((r) => r.zoneId === zoneId);
        if (!latest || latest.status === "completed") return;
        commitRooms((prev) =>
          patchRooms(prev, zoneId, (r) => ({
            ...withRoomProgress(r),
            status: r.stills.every((s) => s.imageUrl) ? "completed" : "error",
            error: r.stills.every((s) => s.imageUrl)
              ? undefined
              : "Could not capture this room. Retry to try again.",
          })),
        );
      });
    },
    [commitRooms, emit, ingestRender, schedule],
  );

  const openViewer = useCallback((zoneId: string) => {
    const room = roomsRef.current.find((r) => r.zoneId === zoneId);
    if (!room?.imageUrl) return;
    setViewerZoneId(zoneId);
  }, []);

  const closeViewer = useCallback(() => setViewerZoneId(null), []);

  const goReview = useCallback(() => {
    setViewerZoneId(null);
    setPhase("review");
  }, []);

  const completedCount = useMemo(
    () => rooms.filter((r) => r.status === "completed" && r.imageUrl).length,
    [rooms],
  );
  const progressPct = rooms.length
    ? Math.round((completedCount / rooms.length) * 100)
    : 0;
  const allReady = rooms.length > 0 && completedCount === rooms.length;
  const canReview = allReady;
  const viewerRoom = rooms.find((r) => r.zoneId === viewerZoneId) ?? null;

  useEffect(() => {
    return () => {
      jobIdRef.current = null;
      clearTimers();
      resetBlobs();
    };
  }, [clearTimers, resetBlobs]);

  return {
    phase,
    rooms,
    jobId,
    globalError,
    completedCount,
    progressPct,
    allReady,
    canReview,
    viewerRoom,
    openConfirm,
    startCapture,
    backToCustomize,
    retryRoom,
    openViewer,
    closeViewer,
    goReview,
    ingestUeResponse,
  };
}
