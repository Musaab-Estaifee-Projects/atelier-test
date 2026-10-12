"use client";

import { useState } from "react";
import ReturnConfiguration from "@/components/pages/projects/return-configuration";
import { Button } from "@/components/ui/button";
import { pageNoiseStyle } from "@/lib/ui/page-noise";

const ReturnConfigurationCta = ({
  initialReturn = false,
}: {
  initialReturn?: boolean;
}) => {
  const [returnOpen, setReturnOpen] = useState(initialReturn);

  return (
    <>
      <div className="mt-16 md:mt-12! flex shrink-0 flex-col items-center lg:mt-8 mb-6 md:mb-0">
        <p className="text-center text-[12px] leading-[1.2] text-white underline decoration-white/54 underline-offset-8">
          Already configured your apartment?
        </p>
        <Button
          type="button"
          variant="pill-soft"
          size="pill-lg"
          className="mt-4 w-full"
          onClick={() => setReturnOpen(true)}
          style={{
            ...pageNoiseStyle(0.18),
          }}
        >
          Return to your configuration
        </Button>
      </div>

      <ReturnConfiguration
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
      />
    </>
  );
};

export default ReturnConfigurationCta;
