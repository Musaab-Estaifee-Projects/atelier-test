"use client";

import { Button } from "@/components/ui/button";
import type { ResolutionOption } from "@/lib/stream-pixel/types";
import { RESOLUTION_OPTIONS } from "@/lib/stream-pixel/types";

export type SaveStatus = "idle" | "saving" | "saved" | "unsaved";

export type DockSelectionPreview = {
  slot: string;
  label: string;
  thumbnailUrl: string;
};

type Props = {
  saveStatus: SaveStatus;
  selectionsOpen: boolean;
  onToggleSelections: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  settingsOpen: boolean;
  onToggleSettings: () => void;
  currentResolution: string;
  onChangeResolution: (option: ResolutionOption) => void;
  resolutionEnabled?: boolean;
  viewOnly?: boolean;
  materialsOpen?: boolean;
  onShowMaterials?: () => void;
  onQuote?: () => void;
  selectedItems?: DockSelectionPreview[];
  levels?: string[];
  activeLevel?: string;
  onLoadLevel?: (levelName: string) => void;
};

function saveLabel(status: SaveStatus, viewOnly?: boolean): string {
  if (viewOnly) return "View only";
  switch (status) {
    case "saving":
      return "Saving…";
    case "saved":
      return "Saved";
    case "unsaved":
      return "Not saved";
    default:
      return "Saved";
  }
}

function DockIcon({
  src,
  label,
  onClick,
  disabled,
  active,
}: {
  src: string;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:cursor-default disabled:opacity-45 ${
        active ? "ring-1 ring-white/40" : ""
      }`}
    >
      <span className="relative block size-[18px] overflow-clip">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full" />
      </span>
    </button>
  );
}

export default function ConfiguratorDock({
  saveStatus,
  selectionsOpen,
  onToggleSelections,
  onReset,
  onFullscreen,
  settingsOpen,
  onToggleSettings,
  currentResolution,
  onChangeResolution,
  resolutionEnabled = true,
  viewOnly,
  materialsOpen,
  onShowMaterials,
  onQuote,
  selectedItems = [],
  levels = [],
  activeLevel,
  onLoadLevel,
}: Props) {
  const summary =
    selectedItems.length > 0
      ? selectedItems.map((item) => item.label).join(" , ")
      : "No selections yet";

  return (
    <div className="cfg-dock-wrap pointer-events-none absolute inset-x-0 bottom-[max(12px,env(safe-area-inset-bottom))] z-[32] flex justify-center px-2 sm:bottom-[max(20px,env(safe-area-inset-bottom))]">
      <div
        className="cfg-dock pointer-events-auto flex max-w-[calc(100vw-16px)] flex-wrap items-center justify-center gap-1.5 rounded-[28px] border-[0.5px] border-white/25 bg-gradient-to-l from-[rgba(173,165,153,0.5)] to-[rgba(77,69,57,0.5)] p-1.5 backdrop-blur-[25px] sm:flex-nowrap sm:gap-2 sm:rounded-full sm:p-1.5"
        role="toolbar"
        aria-label="Configurator tools"
      >
        {!materialsOpen && onShowMaterials ? (
          <button
            type="button"
            className="flex h-8 shrink-0 items-center justify-center gap-[5px] rounded-full bg-[#00272d] px-[13px] font-sans font-medium text-[10px] uppercase tracking-[0.3px] text-[#f2e9d8] transition hover:bg-[#003840] disabled:opacity-45"
            onClick={onShowMaterials}
            disabled={viewOnly}
          >
            <span className="relative block size-[11px] overflow-clip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/configurator/diamond.svg"
                alt=""
                className="h-full w-full"
              />
            </span>
            <span className="hidden sm:inline">Show Materials</span>
            <span className="sm:hidden">Materials</span>
            <span className="relative block size-[11px] overflow-clip">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/configurator/diamond.svg"
                alt=""
                className="h-full w-full"
              />
            </span>
          </button>
        ) : null}

        <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="flex min-w-0 items-center gap-2"
            onClick={onToggleSelections}
            aria-pressed={selectionsOpen}
            title="Selected items"
          >
            <span className="relative flex items-center">
              <span className="flex items-center">
                {(selectedItems.length
                  ? selectedItems
                  : [
                      {
                        slot: "empty-1",
                        label: "",
                        thumbnailUrl: "/images/configurator/swatch-1.png",
                      },
                      {
                        slot: "empty-2",
                        label: "",
                        thumbnailUrl: "/images/configurator/swatch-2.png",
                      },
                      {
                        slot: "empty-3",
                        label: "",
                        thumbnailUrl: "/images/configurator/swatch-3.png",
                      },
                    ]
                )
                  .slice(0, 3)
                  .map((item, index, list) => (
                    <span
                      key={item.slot}
                      className={`relative size-8 overflow-clip rounded-full border-[1.2px] border-white ${
                        index < list.length - 1 ? "-mr-[10px]" : ""
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.thumbnailUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </span>
                  ))}
              </span>
              <span className="relative -ml-1 flex size-[22px] items-center justify-center rounded-full bg-[#1a5e63]">
                <span className="relative block size-[10.5px] overflow-clip">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/configurator/pen.svg"
                    alt=""
                    className="h-full w-full"
                  />
                </span>
              </span>
            </span>
            <span className="hidden min-w-0 flex-col items-start gap-1.5 sm:flex">
              <span className="font-sans text-[10px] uppercase tracking-[1.1px] text-white/70">
                Selected Items
              </span>
              <span className="max-w-[144px] truncate font-sans text-[13px] leading-[1.16] text-white">
                {summary}
              </span>
            </span>
          </button>

          <DockIcon
            src="/images/configurator/reset.svg"
            label="Reset selections"
            onClick={onReset}
            disabled={viewOnly}
          />

          <span
            className={`relative block size-8 shrink-0 overflow-clip ${
              saveStatus === "saving"
                ? "opacity-70"
                : saveStatus === "unsaved"
                  ? "opacity-55"
                  : ""
            }`}
            title={saveLabel(saveStatus, viewOnly)}
            aria-label={saveLabel(saveStatus, viewOnly)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/configurator/cloud-saved.svg"
              alt=""
              className="h-full w-full"
            />
          </span>
        </div>

        {onQuote ? (
          <Button
            type="button"
            variant="pill"
            className="h-8 rounded-full border-transparent bg-[#00272d] px-[13px] text-[10px] tracking-[0.3px] hover:bg-[#003840]"
            onClick={onQuote}
            disabled={viewOnly}
          >
            <span className="hidden sm:inline">Get My Quotation</span>
            <span className="sm:hidden">Quote</span>
          </Button>
        ) : null}

        <span className="hidden h-8 w-px self-stretch bg-white/45 sm:block" />

        <div className="flex items-center gap-1.5">
          <div className="cfg-dock-settings relative">
            <DockIcon
              src="/images/configurator/settings.svg"
              label="Stream settings"
              onClick={onToggleSettings}
              active={settingsOpen}
            />
            {settingsOpen ? (
              <div className="cfg-settings-pop">
                {levels.length > 0 && onLoadLevel ? (
                  <>
                    <p className="cfg-settings-title">Floor plan</p>
                    {levels.map((levelName) => (
                      <button
                        key={levelName}
                        type="button"
                        className={`cfg-settings-opt${
                          activeLevel === levelName ? " is-active" : ""
                        }`}
                        disabled={viewOnly}
                        onClick={() => onLoadLevel(levelName)}
                      >
                        {levelName}
                      </button>
                    ))}
                    <div className="cfg-settings-divider" />
                  </>
                ) : null}
                <p className="cfg-settings-title">Stream resolution</p>
                {!resolutionEnabled ? (
                  <p className="cfg-muted">Resolution locked by stream</p>
                ) : null}
                {RESOLUTION_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    className={`cfg-settings-opt${
                      currentResolution === option.label ? " is-active" : ""
                    }`}
                    disabled={!resolutionEnabled && option.width != null}
                    onClick={() => onChangeResolution(option)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <DockIcon
            src="/images/configurator/expand.svg"
            label="Fullscreen"
            onClick={onFullscreen}
          />
        </div>
      </div>
    </div>
  );
}
