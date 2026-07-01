import { z } from 'zod';

import { normalizePhoneNumber } from '@/utils/phone';

export const accountSettingsSchema = z.object({
  email: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || z.email().safeParse(value).success, {
      message: 'Enter a valid email address.',
    }),
  fullName: z.string().trim().min(2, 'Name is required.'),
  phone: z
    .string()
    .trim()
    .refine((value) => value.length === 0 || value.replace(/\D/g, '').length >= 10, {
      message: 'Enter a valid phone number.',
    }),
});

export type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>;

export const normalizeAccountPhone = (phone: string) => {
  const trimmed = phone.trim();

  if (!trimmed) {
    return null;
  }

  return normalizePhoneNumber(trimmed);
};
