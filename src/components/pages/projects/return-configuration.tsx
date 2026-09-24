"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import { CustomShape } from "@/components/shared/custom-shape";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import {
  isQuotationDesignCode,
  normalizeQuotationDesignCode,
} from "@/lib/quotation/design-code";
import { quotationPath } from "@/lib/quotation/share-url";

type Props = {
  open: boolean;
  onClose: () => void;
};

const schema = z.object({
  reference: z
    .string()
    .trim()
    .min(1, "Invalid Reference")
    .transform((value) => normalizeQuotationDesignCode(value))
    .refine((value) => isQuotationDesignCode(value), {
      message: "Invalid Reference",
    }),
});

type FormValues = z.infer<typeof schema>;

const ReturnConfiguration = ({ open, onClose }: Props) => {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reference: "" },
  });

  useEffect(() => {
    if (!open) return;
    form.reset({ reference: "" });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(false);
    const id = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open, form]);

  const handleSubmit = (values: FormValues) => {
    setPending(true);
    router.push(quotationPath(values.reference));
  };

  const invalid = !!form.formState.errors.reference;

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
          className="w-auto h-auto max-w-161.5"
          radius={{ base: 18, sm: 20, md: 24 }}
          stroke="rgba(255,255,255,0.10)"
          strokeWidth={1}
        >
          <Form {...form}>
            <form
              noValidate
              onSubmit={form.handleSubmit(handleSubmit)}
              className="relative z-10 flex flex-col items-center gap-6 px-6 py-8 sm:px-11.5 sm:py-11.5"
            >
              <h2 className="font-baskerville text-[1.25rem] md:text-[1.625rem] leading-[1.16] font-normal text-[#f2e9d8] capitalize">
                Return to your Configuration
              </h2>

              <div className="flex w-full max-w-86.75 flex-col items-center gap-1.75">
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem className="w-full space-y-0">
                      <FormControl>
                        <input
                          {...field}
                          ref={(el) => {
                            field.ref(el);
                            inputRef.current = el;
                          }}
                          onChange={(e) => {
                            field.onChange(e);
                            if (invalid) form.clearErrors("reference");
                          }}
                          placeholder="Enter your reference number"
                          autoComplete="off"
                          spellCheck={false}
                          autoCapitalize="characters"
                          disabled={pending}
                          aria-invalid={invalid}
                          aria-describedby="return-config-hint"
                          className="w-full border-0 border-b border-dashed border-white/34 bg-transparent py-6.25 text-center text-[14px] leading-[1.2] text-white outline-none placeholder:text-white/28 disabled:opacity-50"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <p
                  role={invalid ? "alert" : undefined}
                  className={`min-h-3 w-full text-center text-[10px] leading-[1.2] ${
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
                className="w-full max-w-87"
                disabled={pending}
              >
                {pending ? "Opening…" : "Continue"}
              </Button>

              <p
                id="return-config-hint"
                className="w-full text-center text-[10px] leading-[1.2] text-white/35"
              >
                The reference on your quotation PDF, e.g. Q-2026-04821
              </p>
            </form>
          </Form>
        </CustomShape>
      </div>
    </OverlayDialog>
  );
};

export default ReturnConfiguration;
