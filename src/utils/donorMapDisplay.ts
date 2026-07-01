import { formatRelativeTime } from '@/utils/relativeTime';

export const formatLastDonationLabel = (value: string | null | undefined): string => {
  if (!value) {
    return 'Last donation: not recorded yet';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Last donation: not recorded yet';
  }

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 30) {
    const months = Math.max(1, Math.floor(diffDays / 30));
    return `Last donation: ${months} month${months === 1 ? '' : 's'} ago`;
  }

  return `Last donation: ${formatRelativeTime(value)}`;
};
