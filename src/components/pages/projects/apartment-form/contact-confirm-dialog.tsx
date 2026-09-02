"use client";

import { useEffect, useRef } from "react";
import { ContactInfo } from "@/types/types";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { ROLES } from "@/constants/const";

type Props = {
  open: boolean;
  contact: ContactInfo | null;
  pending: boolean;
  onConfirm: () => void;
  onClose: () => void;
};

const ContactConfirmDialog = ({
  open,
  contact,
  pending,
  onConfirm,
  onClose,
}: Props) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus trap-ish: focus the dialog when it opens
  useEffect(() => {
    if (open) dialogRef.current?.focus();
  }, [open]);

  if (!open || !contact) return null;

  const roleLabel =
    ROLES.find((r) => r.id === contact.role)?.label ?? contact.role;

  return (
    <OverlayDialog
      open={open}
      titleHidden
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Confirm Your Information"
      blur={false}
      overlayClassName="z-52"
      contentClassName="z-52 w-[min(100%-2rem,674px)] flex items-center justify-center"
    >
      <div className="relative w-auto overflow-hidden">
        <CustomShape
          className="h-auto w-auto max-w-[40.375rem]"
          radius={{
            base: 18,
            sm: 20,
            md: 24,
          }}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <div className="relative z-10 flex flex-col items-center gap-[0.875rem] px-6 py-8 sm:px-11.5 sm:py-11.5">
            <ShieldCheck
              className="size-[2.5rem] text-[#F2E9D8]"
              strokeWidth={1.33}
            />

            <h2 className="font-baskerville text-[1.25rem] font-normal leading-[1.16] text-[#f2e9d8] capitalize md:text-[1.625rem] text-center">
              Confirm Your Information
            </h2>

            <p className="text-sm leading-[1.6] text-white/70 text-center">
              The following will be used as our primary method to contact you.
              Please make sure they are correct before proceeding.
            </p>

            <dl className="grid grid-cols-1 sm:grid-cols-2 sm:gap-y-4 gap-3 border-y border-dashed border-white/20 py-4 my-6 w-full">
              <div>
                <dt className="text-[10px] tracking-[0.04em] text-white/45 uppercase">
                  Name
                </dt>
                <dd className="mt-0.5 text-[12px] text-white/90">
                  {contact.name}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.04em] text-white/45 uppercase">
                  Email
                </dt>
                <dd className="mt-0.5 text-[12px] text-white/90">
                  {contact.email}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.04em] text-white/45 uppercase">
                  Phone
                </dt>
                <dd className="mt-0.5 text-[12px] text-white/90">
                  {contact.phone}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] tracking-[0.04em] text-white/45 uppercase">
                  I am
                </dt>
                <dd className="mt-0.5 text-[12px] text-white/90">
                  {roleLabel}
                </dd>
              </div>
            </dl>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[0.625rem] w-full sm:w-auto">
              <Button
                type="button"
                variant="pill-outline"
                size="pill"
                disabled={pending}
                onClick={onClose}
              >
                Go Back
              </Button>

              <Button
                type="button"
                variant="pill-soft"
                size="pill"
                disabled={pending}
                onClick={onConfirm}
              >
                {pending ? "Saving…" : "Confirm & Proceed"}
              </Button>
            </div>
          </div>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default ContactConfirmDialog;
