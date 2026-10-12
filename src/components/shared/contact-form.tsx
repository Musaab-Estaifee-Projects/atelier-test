"use client";

import { useState } from "react";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";

import { cn } from "@/lib/utils";
import { ContactInfo, RoleId } from "@/types/types";
import {
  ContactFormValues,
  contactSchema,
} from "@/schemas/forms/contact-schema";
import { ROLES } from "@/constants/const";
import { PhoneInput } from "@/components/ui/phone-input";
import { toE164Phone } from "@/utils/utils";
import { pageNoiseStyle } from "@/lib/ui/page-noise";
import Link from "next/link";
import { Checkbox } from "../ui/checkbox";

type Props = {
  pending?: boolean;
  error?: string | null;
  /** Title shown above the form */
  title?: string;
  /** Button label when idle */
  submitLabel?: string;
  /** Button label while pending */
  pendingLabel?: string;
  /** Extra class on the <form> */
  className?: string;
  /** Called with cleaned values after validation */
  onSubmit: (info: ContactInfo) => void;
  /** Default role */
  defaultRole?: RoleId;
};

function validationSummary(
  current: ContactFormValues,
  errors: FieldErrors<ContactFormValues>,
): string {
  const missing: string[] = [];
  if (errors.name && !current.name.trim()) missing.push("full name");
  if (errors.email && !current.email.trim()) missing.push("email");
  if (errors.phone && !current.phone.trim()) missing.push("phone");
  const invalid = [
    current.email.trim() ? errors.email?.message : null,
    current.phone.trim() ? errors.phone?.message : null,
  ].filter((message): message is string => Boolean(message));
  const agreement =
    errors.contactOk?.message || errors.termsOk?.message || null;
  return [
    missing.length ? `Please enter your ${listPhrase(missing)}.` : null,
    ...invalid,
    agreement,
  ]
    .filter(Boolean)
    .join(" ");
}

function listPhrase(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

const ContactForm = ({
  pending = false,
  error = null,
  title = "Tell us About Yourself",
  submitLabel = "Continue",
  pendingLabel = "Checking…",
  className,
  onSubmit,
  defaultRole = "owner",
}: Props) => {
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: defaultRole,
      contactOk: false,
      termsOk: false,
    },
  });

  const [validationMessage, setValidationMessage] = useState("");

  const handleInvalid = (errors: FieldErrors<ContactFormValues>) => {
    setValidationMessage(validationSummary(form.getValues(), errors));
  };

  const handleSubmit = (values: ContactFormValues) => {
    setValidationMessage("");
    onSubmit({
      name: values.name,
      email: values.email,
      phone: toE164Phone(values.phone),
      role: values.role,
    });
  };

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit, handleInvalid)}
        className={cn(
          "relative z-10 flex w-full max-w-116.5 flex-col gap-8 overflow-y-auto hidden-scrollbar lg:border-0 justify-between sm:justify-center min-h-[calc(100dvh-14rem)] sm:min-h-auto",
          className,
        )}
        data-lenis-prevent
      >
        {title && (
          <h2 className="text-center font-baskerville text-[1.25rem] font-normal leading-[1.16] tracking-wider text-[#f2e9d8] capitalize md:text-[1.625rem]">
            {title}
          </h2>
        )}

        <div className="relative z-10 flex w-full flex-col gap-8 hidden-scrollbar lg:border-0">
          <div className="flex w-full flex-col gap-3">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <label className="w-full border-b border-dashed border-white/35 py-3.5">
                      <span className="sr-only">Full Name</span>
                      <input
                        className="w-full bg-transparent text-[12px] leading-[1.2] text-white outline-none placeholder:text-white/28"
                        placeholder="Full Name"
                        autoComplete="name"
                        disabled={pending}
                        {...field}
                      />
                    </label>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <label className="w-full border-b border-dashed border-white/35 py-3.5">
                      <span className="sr-only">Email</span>
                      <input
                        type="email"
                        className="w-full bg-transparent text-[12px] leading-[1.2] text-white outline-none placeholder:text-white/28"
                        placeholder="Enter your email"
                        autoComplete="email"
                        disabled={pending}
                        {...field}
                      />
                    </label>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <div className="w-full border-b border-dashed border-white/35 py-3.5">
                      <span className="sr-only">Phone</span>
                      <PhoneInput
                        variant="atelier"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        disabled={pending}
                      />
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <fieldset className="flex flex-col items-start">
                  <legend className="mb-3 text-[10px] font-medium leading-[1.2] tracking-[0.03em] text-white/50 uppercase">
                    I Am
                  </legend>
                  <div className="flex flex-wrap items-start gap-1.75">
                    {ROLES.map((item) => {
                      const selected = field.value === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => field.onChange(item.id)}
                          className={`inline-flex h-8 items-center justify-center rounded-full bg-white/5 px-5 text-[10px] font-medium leading-[1.2] tracking-[0.03em] text-white uppercase ${
                            selected
                              ? "border border-white/70"
                              : "border border-transparent text-white/80"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              </FormItem>
            )}
          />

          <div className="flex w-full flex-col gap-4">
            <FormField
              control={form.control}
              name="contactOk"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <label className="flex cursor-pointer items-start gap-1.75 text-[12px] leading-[1.2] text-white/70 select-none">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={pending}
                        className="mt-0.5 size-2.5 shrink-0 rounded-none border-0 bg-white shadow-none
                               data-[state=checked]:bg-[#007a85] data-[state=checked]:text-white
                                 focus-visible:ring-0 focus-visible:ring-offset-0 *:[&>svg]:size-2.5!"
                      />
                      I agree to be contacted about this quotation.
                    </label>
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termsOk"
              render={({ field }) => (
                <FormItem className="space-y-0">
                  <FormControl>
                    <label className="flex cursor-pointer items-start gap-1.75 text-[12px] leading-[1.2] text-white/70 select-none">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={pending}
                        className="mt-0.5 size-2.5 shrink-0 rounded-none border-0 bg-white shadow-none
                               data-[state=checked]:bg-[#007a85] data-[state=checked]:text-white
                                 focus-visible:ring-0 focus-visible:ring-offset-0 *:[&>svg]:size-2.5!"
                      />
                      <span>
                        I agree on the{" "}
                        <Link href="/terms" target="_blank">
                          <span className="underline">
                            Terms &amp; Conditions
                          </span>
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy-policy" target="_blank">
                          <span className="underline">Privacy Policy</span>
                        </Link>
                      </span>
                    </label>
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {(error || validationMessage) && (
            <p role="alert" className="text-sm text-[#e29584]">
              {error || validationMessage}
            </p>
          )}

          <Button
            type="submit"
            variant="pill"
            size="pill"
            className="w-full text-[12px] text-white"
            disabled={pending}
            style={{
              ...pageNoiseStyle(0.11),
            }}
          >
            {pending ? pendingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContactForm;
