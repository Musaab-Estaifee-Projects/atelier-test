"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import CustomChevron from "@/components/icons/custom-chevron";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";

import { cn } from "@/lib/utils";
import { ContactInfo, RoleId } from "@/types/types";
import {
  ContactFormValues,
  contactSchema,
} from "@/schemas/forms/contact-schema";
import { ROLES } from "@/constants/const";

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
      contactOk: true,
      termsOk: true,
    },
  });

  const handleSubmit = (values: ContactFormValues) => {
    onSubmit({
      name: values.name,
      email: values.email,
      phone: `+971 ${values.phone}`,
      role: values.role,
    });
  };

  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn(
          "relative z-10 flex w-full max-w-[29.125rem] flex-col gap-8 overflow-y-auto hidden-scrollbar lg:border-0",
          className,
        )}
        data-lenis-prevent
      >
        {title && (
          <h2 className="text-center font-baskerville text-[1.25rem] font-normal leading-[1.16] tracking-[0.05em] text-[#f2e9d8] capitalize md:text-[1.625rem]">
            {title}
          </h2>
        )}

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
                  <div className="flex w-full items-center gap-2 border-b border-dashed border-white/35 py-3.5">
                    <span className="shrink-0 text-[12px] leading-[1.2] text-white/70">
                      +971
                    </span>
                    <CustomChevron className="h-1.5 w-2.5" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-[12px] leading-[1.2] text-white outline-none placeholder:text-white/28"
                      placeholder="50 XXX XXXX"
                      autoComplete="tel"
                      inputMode="tel"
                      disabled={pending}
                      {...field}
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
                  <label className="flex cursor-pointer items-start gap-1.75 text-[12px] leading-[1.2] text-white/70">
                    <Input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5 size-2.5 shrink-0 bg-white"
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
                  <label className="flex cursor-pointer items-start gap-1.75 text-[12px] leading-[1.2] text-white/70">
                    <Input
                      type="checkbox"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="mt-0.5 size-2.5 shrink-0 bg-white"
                    />
                    <span>
                      I agree on the{" "}
                      <span className="underline">Terms &amp; Conditions</span>{" "}
                      and <span className="underline">Privacy Policy</span>
                    </span>
                  </label>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {(form.formState.errors.root || error) && (
          <p role="alert" className="text-sm text-[#e29584]">
            {form.formState.errors.root?.message || error}
          </p>
        )}

        {/* Show first field error if any (keeps the old single-error UX) */}
        {!error &&
          (form.formState.errors.name ||
            form.formState.errors.email ||
            form.formState.errors.phone ||
            form.formState.errors.contactOk ||
            form.formState.errors.termsOk) && (
            <p role="alert" className="text-sm text-[#e29584]">
              {form.formState.errors.name?.message ||
                form.formState.errors.email?.message ||
                form.formState.errors.phone?.message ||
                form.formState.errors.contactOk?.message ||
                form.formState.errors.termsOk?.message}
            </p>
          )}

        <Button
          type="submit"
          variant="pill"
          size="pill"
          className="w-full text-[12px] text-white"
          disabled={pending}
        >
          {pending ? pendingLabel : submitLabel}
        </Button>
      </form>
    </Form>
  );
};

export default ContactForm;
