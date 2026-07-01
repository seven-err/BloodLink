export const formatPhoneDisplay = (phone: string) => {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('63') && digits.length >= 12) {
    const local = digits.slice(2, 12);
    return `+63 (${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
  }

  if (digits.startsWith('1') && digits.length === 11) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  if (phone.startsWith('+')) {
    return phone;
  }

  return `+${digits}`;
};

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
