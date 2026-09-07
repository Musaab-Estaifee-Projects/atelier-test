"use client";

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
};

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
}: OverlayDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
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
