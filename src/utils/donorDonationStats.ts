import { DONATION_INTERVAL_DAYS } from '@/utils/donorEligibility';

export { DONATION_INTERVAL_DAYS };

export const getDaysUntilNextEligible = (lastDonationAt: string | null | undefined): number | null => {
  if (!lastDonationAt) {
    return null;
  }

  const lastDonation = new Date(lastDonationAt);
  if (Number.isNaN(lastDonation.getTime())) {
    return null;
  }

  const eligibleDate = new Date(lastDonation);
  eligibleDate.setDate(eligibleDate.getDate() + DONATION_INTERVAL_DAYS);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  eligibleDate.setHours(0, 0, 0, 0);

  const diffMs = eligibleDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  return Math.max(0, daysRemaining);
};

export const getDonorEligibilityStat = (lastDonationAt: string | null | undefined) => {
  const days = getDaysUntilNextEligible(lastDonationAt);

  if (days == null || days === 0) {
    return { label: 'Eligible to donate', value: 'Now' };
  }

  return {
    label: days === 1 ? 'Day until eligible' : 'Days until eligible',
    value: String(days),
  };
};

export const countDonationsThisYear = (completedDates: string[]) => {
  const currentYear = new Date().getFullYear();

  return completedDates.filter((dateValue) => {
    const date = new Date(dateValue);
    return !Number.isNaN(date.getTime()) && date.getFullYear() === currentYear;
  }).length;
};
