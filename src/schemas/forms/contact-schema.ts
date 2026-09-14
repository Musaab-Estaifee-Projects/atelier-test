import { z } from "zod";
import { isPhoneMatchingFormat } from "@/lib/phone";
import { ROLES } from "@/constants/const";

export type RoleId = (typeof ROLES)[number]["id"];

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please fill in name, email, and phone."),
  email: z.email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(1, "Please fill in name, email, and phone.")
    .refine((value) => isPhoneMatchingFormat(value), {
      message: "Enter a valid phone number.",
    }),
  role: z.enum(["considering_purchase", "owner", "agent"]),
  contactOk: z.boolean().refine((v) => v === true, {
    message: "Please accept the required agreements.",
  }),
  termsOk: z.boolean().refine((v) => v === true, {
    message: "Please accept the required agreements.",
  }),
});

export type ContactFormValues = z.infer<typeof contactSchema>;
