/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import ContactConfirmDialog from "./apartment-form/contact-confirm-dialog";
import { persistCustomerSession, isJourneyValid, readJourney } from "@/lib/journey";
import { createCustomer } from "@/services/create-customer.service";
import { ContactInfo, TProject } from "@/types/types";
import ContactStep from "./apartment-form/contact-step";
import SelectStep from "./apartment-form/select-step";
import { readContact } from "@/utils/utils";
import { isAxiosError } from "axios";

export type ApartmentChoice = {
  unitId: string;
  apartmentId?: string;
  apartmentNumber?: string;
  levelName: string;
  designCode?: string;
  layoutCode?: string;
  categoryName?: string;
  typeName?: string;
};

type Props = {
  project: TProject;
  title?: string;
  titleId?: string;
  pending?: boolean;
  error?: string | null;
  autoFocus?: boolean;
  onSubmit: (choice: ApartmentChoice) => void;
};

const ApartmentForm = ({
  project,
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
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readContact();
    const journey = readJourney();
    setContact(stored && isJourneyValid(journey) ? stored : null);
  }, []);

  const handleRequestConfirm = (info: ContactInfo) => {
    setPendingContact(info);
    setSaveError(null);
    setDialogOpen(true);
  };

  const handleDialogConfirm = async () => {
    if (!pendingContact) return;

    setSaving(true);
    setSaveError(null);
    try {
      const data = await createCustomer({
        full_name: pendingContact.name,
        email: pendingContact.email,
        phone: pendingContact.phone.replace(/\s+/g, ""),
        customer_type: pendingContact.role,
      });
      setContact(persistCustomerSession(data));
      setDialogOpen(false);
      setPendingContact(null);
    } catch (err) {
      const message = isAxiosError(err)
        ? String(
            (err.response?.data as { message?: string } | undefined)?.message ??
              err.message,
          )
        : "Could not save your details. Please try again.";
      setSaveError(message);
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
      <div className="flex w-full max-w-116.5 flex-col gap-8" aria-hidden />
    );
  }

  if (contact) {
    return (
      <SelectStep
        project={project}
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
        error={error || saveError}
        onRequestConfirm={handleRequestConfirm}
      />

      <ContactConfirmDialog
        open={dialogOpen}
        contact={pendingContact}
        pending={saving}
        error={saveError}
        onConfirm={() => {
          void handleDialogConfirm();
        }}
        onClose={handleDialogClose}
      />
    </>
  );
};

export default ApartmentForm;
