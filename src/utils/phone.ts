export const normalizePhoneNumber = (phone: string) => {
  const trimmed = phone.trim();

  if (trimmed.startsWith('+')) {
    return `+${trimmed.slice(1).replace(/\D/g, '')}`;
  }

  const digits = trimmed.replace(/\D/g, '');

  if (digits.startsWith('0')) {
    return `+63${digits.slice(1)}`;
  }

  if (digits.startsWith('63')) {
    return `+${digits}`;
  }

  return `+${digits}`;
};
