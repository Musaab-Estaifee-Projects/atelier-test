"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { EllipsisVertical } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  selected: boolean;
  onRemove?: () => void;
  onEdit?: () => void;
  disabled?: boolean;
};

type MenuPos = { top: number; left: number };

function getMenuPortalRoot(): HTMLElement {
  const doc = document as Document & {
    webkitFullscreenElement?: Element | null;
  };
  const fs = (document.fullscreenElement ??
    doc.webkitFullscreenElement) as HTMLElement | null;
  return fs ?? document.body;
}

const MENU_WIDTH = 102;

const SelectionRowMenu = ({
  selected,
  onRemove,
  onEdit,
  disabled = false,
}: Props) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<MenuPos>({ top: 0, left: 0 });
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setPos({
      top: rect.bottom + 6,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  };

  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPortalEl(null);
      return;
    }
    const root = getMenuPortalRoot();
    setPortalEl(root);
    updatePosition();

    const isInMenuTree = (target: EventTarget | null) => {
      const node = target as Node | null;
      return Boolean(
        (node && menuRef.current?.contains(node)) ||
          (node && buttonRef.current?.contains(node)),
      );
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (isInMenuTree(e.target)) return;
      setOpen(false);
    };

    const handleScroll = () => updatePosition();

    document.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleScroll);
    document.addEventListener("fullscreenchange", handleScroll);
    document.addEventListener("webkitfullscreenchange", handleScroll);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleScroll);
      document.removeEventListener("fullscreenchange", handleScroll);
      document.removeEventListener("webkitfullscreenchange", handleScroll);
    };
  }, [open]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (disabled) setOpen(false);
  }, [disabled]);

  if (!onRemove && !onEdit) return null;

  const runRemove = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selected) return;
    onRemove?.();
    setOpen(false);
  };

  const runEdit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.();
    setOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Row actions"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          if (disabled) return;
          if (!open) updatePosition();
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 p-1 text-white transition",
          disabled ? "cursor-not-allowed opacity-40" : "hover:bg-white/20",
        )}
      >
        <EllipsisVertical className="size-4.5" strokeWidth={1.75} />
      </button>

      {open &&
        !disabled &&
        portalEl &&
        createPortal(
          <div
            ref={menuRef}
            data-selection-row-menu
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              zIndex: 400,
            }}
            className="pointer-events-auto w-25.5! h-21.25! space-y-1 rounded-none border border-white/5 bg-[#001f24] p-1.25 text-[12px] text-white/70 shadow-lg"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {onRemove ? (
              <button
                type="button"
                disabled={!selected}
                className="w-full bg-white/5 p-2.5 text-left leading-[1.2] text-white/70 transition hover:bg-white/10 disabled:opacity-40"
                onPointerDown={runRemove}
              >
                Remove
              </button>
            ) : null}

            {onEdit ? (
              <button
                type="button"
                className="w-full p-2.5 text-left leading-[1.2] text-white/70 transition hover:bg-white/5"
                onPointerDown={runEdit}
              >
                Edit
              </button>
            ) : null}
          </div>,
          portalEl,
        )}
    </>
  );
};

export default SelectionRowMenu;
