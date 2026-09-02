// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import OverlayDialog from "@/components/ui/overlay-dialog";

// export type SubmitContactForm = {
//   name: string;
//   email: string;
//   phone: string;
// };

// type Props = {
//   open: boolean;
//   pending?: boolean;
//   error?: string | null;
//   onClose: () => void;
//   onSubmit: (contact: SubmitContactForm) => void;
// };

// const SubmitModal = ({
//   open,
//   pending = false,
//   error = null,
//   onClose,
//   onSubmit,
// }: Props) => {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [localError, setLocalError] = useState<string | null>(null);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!name.trim() || !email.trim() || !phone.trim()) {
//       setLocalError("Please fill in name, email, and phone.");
//       return;
//     }
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
//       setLocalError("Enter a valid email address.");
//       return;
//     }
//     setLocalError(null);
//     onSubmit({ name: name.trim(), email: email.trim(), phone: phone.trim() });
//   };

//   return (
//     <OverlayDialog
//       open={open}
//       onOpenChange={(next) => {
//         if (!next) onClose();
//       }}
//       title="Submit your design"
//       blur={false}
//       overlayClassName="z-[80] bg-black/60"
//       contentClassName="z-[80] w-[min(100%-2rem,28rem)]"
//     >
//       <form
//         onSubmit={handleSubmit}
//         className="w-full rounded-xl border border-white/10 bg-[#1a1a1c] p-5 text-[#f5f0e8]"
//       >
//         <h2 id="submit-title" className="mb-1 text-base font-medium">
//           Submit your design
//         </h2>
//         <p className="mb-4 text-xs opacity-60">
//           Creates a Design Code you can share. Nothing is saved to the server
//           until you submit.
//         </p>
//         <label className="mb-3 block text-xs opacity-70">
//           Name
//           <input
//             className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
//             value={name}
//             onChange={(e) => setName(e.target.value)}
//             autoComplete="name"
//             disabled={pending}
//           />
//         </label>
//         <label className="mb-3 block text-xs opacity-70">
//           Email
//           <input
//             type="email"
//             className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             autoComplete="email"
//             disabled={pending}
//           />
//         </label>
//         <label className="mb-3 block text-xs opacity-70">
//           Phone
//           <input
//             className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
//             value={phone}
//             onChange={(e) => setPhone(e.target.value)}
//             autoComplete="tel"
//             disabled={pending}
//           />
//         </label>
//         {(localError || error) && (
//           <p className="mb-3 text-sm text-[#ff8a8a]">{localError || error}</p>
//         )}
//         <div className="flex justify-end gap-2">
//           <Button
//             type="button"
//             variant="ghost"
//             className="h-auto rounded-lg bg-white/10 px-3 py-2 text-sm text-[#f5f0e8] hover:bg-white/20 hover:text-[#f5f0e8]"
//             onClick={onClose}
//             disabled={pending}
//           >
//             Cancel
//           </Button>
//           <Button
//             type="submit"
//             className="h-auto rounded-lg bg-[#4e9cff] px-3 py-2 text-sm text-white hover:bg-[#4e9cff]/90"
//             disabled={pending}
//           >
//             {pending ? "Submitting…" : "Submit"}
//           </Button>
//         </div>
//       </form>
//     </OverlayDialog>
//   );
// };

// export default SubmitModal;

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import OverlayDialog from "@/components/ui/overlay-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export type SubmitContactForm = {
  name: string;
  email: string;
  phone: string;
};

const schema = z.object({
  name: z.string().trim().min(1, "Please fill in name, email, and phone."),
  email: z
    .string()
    .trim()
    .min(1, "Please fill in name, email, and phone.")
    .email("Enter a valid email address."),
  phone: z.string().trim().min(1, "Please fill in name, email, and phone."),
});

type FormValues = z.infer<typeof schema>;

type Props = {
  open: boolean;
  pending?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (contact: SubmitContactForm) => void;
};

const SubmitModal = ({
  open,
  pending = false,
  error = null,
  onClose,
  onSubmit,
}: Props) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  const handleSubmit = (values: FormValues) => {
    onSubmit({
      name: values.name,
      email: values.email,
      phone: values.phone,
    });
  };

  return (
    <OverlayDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Submit your design"
      blur={false}
      overlayClassName="z-[80] bg-black/60"
      contentClassName="z-[80] w-[min(100%-2rem,28rem)]"
    >
      <Form {...form}>
        <form
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full rounded-xl border border-white/10 bg-[#1a1a1c] p-5 text-[#f5f0e8]"
        >
          <h2 id="submit-title" className="mb-1 text-base font-medium">
            Submit your design
          </h2>
          <p className="mb-4 text-xs opacity-60">
            Creates a Design Code you can share. Nothing is saved to the server
            until you submit.
          </p>

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="mb-3 space-y-0">
                <FormLabel className="mb-0 block text-xs opacity-70">
                  Name
                </FormLabel>
                <FormControl>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    autoComplete="name"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="mb-3 space-y-0">
                <FormLabel className="mb-0 block text-xs opacity-70">
                  Email
                </FormLabel>
                <FormControl>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    autoComplete="email"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="mb-3 space-y-0">
                <FormLabel className="mb-0 block text-xs opacity-70">
                  Phone
                </FormLabel>
                <FormControl>
                  <input
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm"
                    autoComplete="tel"
                    disabled={pending}
                    {...field}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {(form.formState.errors.name ||
            form.formState.errors.email ||
            form.formState.errors.phone ||
            error) && (
            <p className="mb-3 text-sm text-[#ff8a8a]">
              {form.formState.errors.name?.message ||
                form.formState.errors.email?.message ||
                form.formState.errors.phone?.message ||
                error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              className="h-auto rounded-lg bg-white/10 px-3 py-2 text-sm text-[#f5f0e8] hover:bg-white/20 hover:text-[#f5f0e8]"
              onClick={onClose}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-auto rounded-lg bg-[#4e9cff] px-3 py-2 text-sm text-white hover:bg-[#4e9cff]/90"
              disabled={pending}
            >
              {pending ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </form>
      </Form>
    </OverlayDialog>
  );
};

export default SubmitModal;
