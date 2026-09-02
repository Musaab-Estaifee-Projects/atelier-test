import { z } from "zod";
import { ROLES } from "@/constants/const";

export type RoleId = (typeof ROLES)[number]["id"];

export const contactSchema = z.object({
  name: z.string().trim().min(1, "Please fill in name, email, and phone."),
  email: z.email("Enter a valid email address."),
  phone: z.string().trim().min(1, "Please fill in name, email, and phone."),
  role: z.enum(["considering", "owner", "agent"]),
  contactOk: z.boolean().refine((v) => v === true, {
    message: "Please accept the required agreements.",
  }),
  termsOk: z.boolean().refine((v) => v === true, {
    message: "Please accept the required agreements.",
  }),
});

export type ContactFormValues = z.infer<typeof contactSchema>;

/** What the parent actually receives after submit */
export type ContactInfo = {
  name: string;
  email: string;
  phone: string;
  role: RoleId;
};
