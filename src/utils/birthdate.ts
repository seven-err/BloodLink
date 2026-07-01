export const formatBirthdateIso = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const parseBirthdateIso = (value: string | null | undefined) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const formatBirthdateDisplay = (value: string | null | undefined) => {
  const date = parseBirthdateIso(value);

  if (!date) {
    return '';
  }

  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const isValidPastBirthdate = (value: string) => {
  const date = parseBirthdateIso(value);

  if (!date) {
    return false;
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  return date.getTime() <= today.getTime();
};
