import { z } from 'zod';

import { BLOOD_TYPES } from '@/constants/bloodTypes';
import type { BloodType } from '@/types/database';
import { isValidPastBirthdate } from '@/utils/birthdate';
import {
  isDonorAgeEligible,
  MAX_DONOR_WEIGHT_KG,
  MIN_DONOR_WEIGHT_KG,
} from '@/utils/donorEligibility';

export const editProfileSchema = z
  .object({
    address: z.string().trim().min(3, 'Address is required.'),
    birthdate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid birthdate.')
      .refine(isValidPastBirthdate, 'Birthdate cannot be in the future.'),
    bloodType: z.enum(BLOOD_TYPES as [BloodType, ...BloodType[]]).nullable(),
    fullName: z.string().trim().min(2, 'Name is required.'),
    weightKg: z.string().trim(),
  })
  .superRefine((value, context) => {
    if (!value.weightKg) {
      return;
    }

    if (!/^\d+(\.\d{1,2})?$/.test(value.weightKg)) {
      context.addIssue({
        code: 'custom',
        message: 'Enter a valid weight in kilograms.',
        path: ['weightKg'],
      });
      return;
    }

    const weight = Number(value.weightKg);

    if (weight < MIN_DONOR_WEIGHT_KG || weight > MAX_DONOR_WEIGHT_KG) {
      context.addIssue({
        code: 'custom',
        message: `Weight must be between ${MIN_DONOR_WEIGHT_KG} and ${MAX_DONOR_WEIGHT_KG} kg.`,
        path: ['weightKg'],
      });
    }
  });

export const donorEditProfileSchema = editProfileSchema.superRefine((value, context) => {
  if (!value.bloodType) {
    context.addIssue({
      code: 'custom',
      message: 'Blood type is required for donors.',
      path: ['bloodType'],
    });
  }

  if (!isDonorAgeEligible(value.birthdate)) {
    context.addIssue({
      code: 'custom',
      message: 'Donors must be between 16 and 65 years old.',
      path: ['birthdate'],
    });
  }
});

export type EditProfileFormValues = z.infer<typeof editProfileSchema>;
