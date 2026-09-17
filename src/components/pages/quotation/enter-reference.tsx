"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import ReturnConfiguration from "@/components/pages/projects/return-configuration";

export default function EnterReference() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="pill-soft"
        size="pill-lg"
        className="mt-8"
        onClick={() => setOpen(true)}
      >
        Enter your reference
      </Button>

      <ReturnConfiguration open={open} onClose={() => setOpen(false)} />
    </>
  );
}
