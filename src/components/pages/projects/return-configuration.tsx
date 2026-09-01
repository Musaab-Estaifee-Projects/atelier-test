/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { getDesign } from "@/lib/configurator/api";
import { isDesignCode, normalizeDesignCode } from "@/lib/projects/apartments";
import { configuratorHref } from "@/lib/projects/catalog";
import { CustomShape } from "@/components/shared/custom-shape";

type Props = {
  open: boolean;
  onClose: () => void;
};

function normalizeReference(raw: string): string {
  const trimmed = raw.trim().replace(/\s+/g, "").toUpperCase();
  if (isDesignCode(trimmed)) return normalizeDesignCode(trimmed);
  return trimmed;
}

const ReturnConfiguration = ({ open, onClose }: Props) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const [pending, setPending] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValue("");
    setInvalid(false);
    setPending(false);
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const reference = normalizeReference(value);
    if (!reference) {
      setInvalid(true);
      return;
    }

    setPending(true);
    setInvalid(false);
    try {
      const design = await getDesign(reference);
      router.push(
        configuratorHref(
          {
            streamProjectId: design.streamProjectId,
            unitId: design.unitId,
            levelName: design.configuration.levelName,
          },
          { designCode: design.designCode },
        ),
      );
    } catch {
      setInvalid(true);
    } finally {
      setPending(false);
    }
  };

  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Return to your Configuration"
      blur
      contentClassName="w-[min(100%-2rem,615px)]"
    >
      <div className="relative w-full overflow-hidden">
        <CustomShape
          className="w-auto h-auto max-w-[40.375rem]"
          radius={{
            base: 18,
            sm: 20,
            md: 24,
          }}
          // fill="#0a2f35"
          // fill="gradient"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <form
            onSubmit={(event) => {
              void handleSubmit(event);
            }}
            className="relative z-10 flex flex-col items-center gap-6 px-6 py-8 sm:px-[46px] sm:py-[46px]"
          >
            <h2 className="font-libre-baskerville text-[1.25rem] md:text-[1.625rem] leading-[1.16] font-normal text-[#f2e9d8] capitalize">
              Return to your Configuration
            </h2>

            <div className="flex w-full max-w-[347px] flex-col items-center gap-[7px]">
              <input
                ref={inputRef}
                value={value}
                onChange={(event) => {
                  setValue(event.target.value);
                  if (invalid) setInvalid(false);
                }}
                placeholder="Enter your reference number"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="characters"
                disabled={pending}
                aria-invalid={invalid}
                aria-describedby="return-config-hint"
                className="w-full border-0 border-b border-dashed border-white/34 bg-transparent py-[25px] text-center text-[14px] leading-[1.2] text-white outline-none placeholder:text-white/28 disabled:opacity-50"
              />

              <p
                role={invalid ? "alert" : undefined}
                className={`min-h-[12px] w-full text-center text-[10px] leading-[1.2] ${
                  invalid ? "text-[#ff8585]" : "invisible"
                }`}
              >
                Invalid Reference
              </p>
            </div>

            <Button
              type="submit"
              variant="pill"
              size="pill"
              className="w-full max-w-[348px]"
              disabled={pending}
            >
              {pending ? "Checking…" : "Continue"}
            </Button>

            <p
              id="return-config-hint"
              className="w-full text-center text-[10px] leading-[1.2] text-white/35"
            >
              The reference on your quotation PDF, e.g. Q-2026-04821
            </p>
          </form>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default ReturnConfiguration;
