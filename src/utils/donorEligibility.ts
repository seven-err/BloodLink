const MIN_AGE = 16;
const MAX_AGE = 65;
export const MIN_DONOR_WEIGHT_KG = 50;
export const MAX_DONOR_WEIGHT_KG = 180;
const MIN_WEIGHT_KG = MIN_DONOR_WEIGHT_KG;
const TRANSFUSION_WAIT_MONTHS = 12;

export const DONOR_ELIGIBILITY_REQUIREMENTS = [
  'Age: 16 to 65 years old (16 and 17-year-olds require written parental or guardian consent).',
  'Weight: At least 50 kg (110 lbs) to safely donate a standard 350ml or 450ml blood bag.',
  'Wait 12 months from the date of your last blood transfusion before donating.',
  'Be in good general health on the day of donation.',
] as const;

export const calculateAge = (birthdate: string): number | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    return null;
  }

  const [year, month, day] = birthdate.split('-').map(Number);
  const born = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();

  if (
    born.getUTCFullYear() !== year ||
    born.getUTCMonth() !== month - 1 ||
    born.getUTCDate() !== day
  ) {
    return null;
  }

  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }

  return age;
};

export const isDonorAgeEligible = (birthdate: string): boolean => {
  const age = calculateAge(birthdate);
  return age !== null && age >= MIN_AGE && age <= MAX_AGE;
};

export const requiresParentalConsent = (birthdate: string): boolean => {
  const age = calculateAge(birthdate);
  return age === 16 || age === 17;
};

export const isDonorWeightEligible = (weightKg: number): boolean =>
  Number.isFinite(weightKg) && weightKg >= MIN_WEIGHT_KG;

export const isTransfusionWaitComplete = (lastTransfusionDate: string | null): boolean => {
  if (!lastTransfusionDate) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastTransfusionDate)) {
    return false;
  }

  const [year, month, day] = lastTransfusionDate.split('-').map(Number);
  const transfusionDate = new Date(Date.UTC(year, month - 1, day));
  const waitUntil = new Date(transfusionDate);
  waitUntil.setUTCMonth(waitUntil.getUTCMonth() + TRANSFUSION_WAIT_MONTHS);

  const today = new Date();
  return today.getTime() >= waitUntil.getTime();
};

export const getDonorEligibilityIssues = ({
  birthdate,
  weightKg,
  lastTransfusionDate,
}: {
  birthdate: string;
  weightKg: number | null;
  lastTransfusionDate?: string | null;
}): string[] => {
  const issues: string[] = [];
  const age = calculateAge(birthdate);

  if (age === null) {
    issues.push('Enter a valid birthdate.');
  } else if (age < MIN_AGE || age > MAX_AGE) {
    issues.push(`Donors must be between ${MIN_AGE} and ${MAX_AGE} years old.`);
  } else if (requiresParentalConsent(birthdate)) {
    issues.push('Parental or guardian written consent is required for donors aged 16 or 17.');
  }

  if (weightKg === null || !isDonorWeightEligible(weightKg)) {
    issues.push(`Weight must be at least ${MIN_WEIGHT_KG} kg (110 lbs).`);
  }

  if (lastTransfusionDate && !isTransfusionWaitComplete(lastTransfusionDate)) {
    issues.push(
      `You must wait ${TRANSFUSION_WAIT_MONTHS} months after a blood transfusion before donating.`,
    );
  }

  return issues;
};
