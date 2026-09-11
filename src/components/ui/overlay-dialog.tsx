/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
} from "@/components/ui/dialog";

type OverlayDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleHidden?: boolean;
  blur?: boolean;
  overlayClassName?: string;
  contentClassName?: string;
  children: React.ReactNode;
  onPointerDownOutside?: (event: Event) => void;
  onInteractOutside?: (event: Event) => void;
  container?: HTMLElement | null;
};

function getFullscreenRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  const fs = (document.fullscreenElement ??
    doc.webkitFullscreenElement) as HTMLElement | null;
  return fs ?? document.body;
}

const OverlayDialog = ({
  open,
  onOpenChange,
  title,
  titleHidden = true,
  blur = true,
  overlayClassName,
  contentClassName,
  children,
  onPointerDownOutside,
  onInteractOutside,
  container,
}: OverlayDialogProps) => {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const sync = () => setPortalEl(container ?? getFullscreenRoot());
    sync();
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync);
    };
  }, [container]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal
        container={portalEl ?? undefined}
        key={portalEl && portalEl !== document.body ? "fs" : "body"}
      >
        <DialogOverlay
          className={cn(
            "bg-black/80",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "duration-200",
            blur
              ? "backdrop-blur-[6px] supports-backdrop-filter:backdrop-blur-[6px]"
              : "backdrop-blur-none supports-backdrop-filter:backdrop-blur-none",
            overlayClassName,
          )}
        />
        <DialogPrimitive.Content
          data-slot="overlay-dialog-content"
          aria-describedby={undefined}
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-[min(100%-2.5rem,466px)] -translate-x-1/2 -translate-y-1/2 outline-none",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "duration-200",
            contentClassName,
          )}
          onPointerDownOutside={onPointerDownOutside}
          onInteractOutside={onInteractOutside}
        >
          <DialogTitle className={titleHidden ? "sr-only" : undefined}>
            {title}
          </DialogTitle>
          {children}
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default OverlayDialog;
