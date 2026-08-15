import { z } from 'zod';

export const PASSWORD_RULES = {
  hints: [
    'At least 8 characters',
    'At least 1 number',
    'At least 1 lowercase letter',
    'At least 1 uppercase letter',
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

export type PasswordRequirementId = 'minLength' | 'number' | 'lowercase' | 'uppercase';

export type PasswordRequirementStatus = {
  id: PasswordRequirementId;
  label: string;
  met: boolean;
};

/** Live checklist status for signup password guidance. */
export const getPasswordRequirementStatus = (
  password: string,
): PasswordRequirementStatus[] => [
  {
    id: 'minLength',
    label: PASSWORD_RULES.hints[0],
    met: password.length >= PASSWORD_RULES.minLength,
  },
  {
    id: 'number',
    label: PASSWORD_RULES.hints[1],
    met: /\d/.test(password),
  },
  {
    id: 'lowercase',
    label: PASSWORD_RULES.hints[2],
    met: /[a-z]/.test(password),
  },
  {
    id: 'uppercase',
    label: PASSWORD_RULES.hints[3],
    met: /[A-Z]/.test(password),
  },
];

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
