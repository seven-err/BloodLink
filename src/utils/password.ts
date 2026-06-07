import { z } from 'zod';

export const PASSWORD_RULES = {
  hints: [
    'At least 8 characters',
    'At least 1 number',
    'Both upper and lower case letters',
  ] as const,
  messages: {
    lowercase: 'Password must include lowercase letters.',
    minLength: 'Password must be at least 8 characters.',
    number: 'Password must include at least 1 number.',
    required: 'Enter your password.',
    uppercase: 'Password must include uppercase letters.',
  },
  minLength: 8,
} as const;

/** Strong password rules for new account registration. */
export const signupPasswordSchema = z
  .string()
  .min(PASSWORD_RULES.minLength, PASSWORD_RULES.messages.minLength)
  .regex(/\d/, PASSWORD_RULES.messages.number)
  .regex(/[a-z]/, PASSWORD_RULES.messages.lowercase)
  .regex(/[A-Z]/, PASSWORD_RULES.messages.uppercase);

/**
 * Login only requires a non-empty password so existing accounts with legacy
 * passwords are not blocked by client-side checks. Supabase Auth validates
 * credentials on sign-in.
 */
export const loginPasswordSchema = z.string().min(1, PASSWORD_RULES.messages.required);
