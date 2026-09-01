/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";

import ContactConfirmDialog from "./apartment-form/contact-confirm-dialog";
import { CONTACT_STORAGE_KEY } from "@/constants/const";
import { ContactInfo } from "@/types/types";
import ContactStep from "./apartment-form/contact-step";
import SelectStep from "./apartment-form/select-step";
import { readContact } from "@/utils/utils";

export type ApartmentChoice = {
  unitId: string;
  levelName: string;
  designCode?: string;
};

type Props = {
  title?: string;
  titleId?: string;
  pending?: boolean;
  error?: string | null;
  autoFocus?: boolean;
  onSubmit: (choice: ApartmentChoice) => void;
};

function writeContact(info: ContactInfo): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(info));
  } catch {
    // QuotaExceeded / private mode
  }
}

const ApartmentForm = ({
  title = "Select Apartment",
  titleId,
  pending = false,
  error,
  autoFocus = false,
  onSubmit,
}: Props) => {
  const [contact, setContact] = useState<ContactInfo | null | undefined>(
    undefined,
  );
  const [pendingContact, setPendingContact] = useState<ContactInfo | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setContact(readContact());
  }, []);

  const handleRequestConfirm = (info: ContactInfo) => {
    setPendingContact(info);
    setDialogOpen(true);
  };

  const handleDialogConfirm = async () => {
    if (!pendingContact) return;

    setSaving(true);
    try {
      // TODO: API CALL
      writeContact(pendingContact);
      setContact(pendingContact);
      setDialogOpen(false);
      setPendingContact(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDialogClose = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  // Avoid flash while reading localStorage
  if (contact === undefined) {
    return (
      <div
        className="flex w-full max-w-[29.125rem] flex-col gap-8"
        aria-hidden
      />
    );
  }

  if (contact) {
    return (
      <SelectStep
        title={title}
        titleId={titleId}
        pending={pending}
        error={error}
        autoFocus={autoFocus}
        onSubmit={onSubmit}
      />
    );
  }

  return (
    <>
      <ContactStep
        pending={pending || saving}
        error={error}
        onRequestConfirm={handleRequestConfirm}
      />

      <ContactConfirmDialog
        open={dialogOpen}
        contact={pendingContact}
        pending={saving}
        onConfirm={() => {
          void handleDialogConfirm();
        }}
        onClose={handleDialogClose}
      />
    </>
  );
};

export default ApartmentForm;
