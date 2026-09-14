"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import ContactConfirmDialog from "@/components/pages/projects/apartment-form/contact-confirm-dialog";
import ContactStep from "@/components/pages/projects/apartment-form/contact-step";
import { CONTACT_STORAGE_KEY } from "@/constants/const";
import { writeJourney } from "@/lib/journey";
import { createCustomer } from "@/services/create-customer.service";
import type { ContactInfo } from "@/types/types";

function writeContact(info: ContactInfo): void {
  try {
    localStorage.setItem(CONTACT_STORAGE_KEY, JSON.stringify(info));
  } catch {
    /* quota / private mode */
  }
}

type Props = {
  onReady: () => void;
};

export default function JourneyGate({ onReady }: Props) {
  const [pendingContact, setPendingContact] = useState<ContactInfo | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      writeJourney({
        token: data.journey_token,
        expiresAt: data.expires_at,
        customer: data.customer,
      });
      writeContact({
        name: data.customer.full_name,
        email: data.customer.email,
        phone: data.customer.phone,
        role: pendingContact.role,
      });
      setDialogOpen(false);
      setPendingContact(null);
      onReady();
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

  return (
    <div className="absolute inset-0 z-[70] flex items-center justify-center bg-[#00272d] px-5">
      <div className="w-full max-w-116.5">
        <ContactStep
          pending={saving}
          error={saveError}
          onRequestConfirm={(info) => {
            setPendingContact(info);
            setSaveError(null);
            setDialogOpen(true);
          }}
        />
      </div>
      <ContactConfirmDialog
        open={dialogOpen}
        contact={pendingContact}
        pending={saving}
        error={saveError}
        onConfirm={() => {
          void handleDialogConfirm();
        }}
        onClose={() => {
          if (!saving) setDialogOpen(false);
        }}
      />
    </div>
  );
}
