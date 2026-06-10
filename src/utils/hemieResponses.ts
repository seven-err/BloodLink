import {
  DONOR_ELIGIBILITY_REQUIREMENTS,
  getDonorEligibilityIssues,
} from '@/utils/donorEligibility';

export const HEMIE_SUGGESTED_QUESTIONS = [
  'Am I eligible to donate?',
  'How does blood matching work?',
  'How do I create a blood request?',
  'What should I bring before donating?',
] as const;

const WELCOME_MESSAGE =
  "Hi! I'm Hemie, your BloodLink AI assistant. I'm here to help you with questions about blood donation, eligibility, and how BloodLink works. How can I assist you today?";

export const getHemieWelcomeMessage = () => WELCOME_MESSAGE;

type HemieContext = {
  birthdate?: string | null;
  weightKg?: number | null;
  lastTransfusionDate?: string | null;
  role?: string | null;
};

const normalizeQuestion = (question: string) => question.trim().toLowerCase();

export const getHemieResponse = (question: string, context: HemieContext = {}): string => {
  const normalized = normalizeQuestion(question);

  if (normalized.includes('eligible') || normalized.includes('eligibility')) {
    if (context.birthdate && context.weightKg != null) {
      const issues = getDonorEligibilityIssues({
        birthdate: context.birthdate,
        weightKg: context.weightKg,
        lastTransfusionDate: context.lastTransfusionDate,
      });

      if (issues.length === 0) {
        return 'Based on your profile, you meet the basic BloodLink eligibility requirements. Final approval still depends on a health screening on donation day.';
      }

      return `Here are eligibility items to review:\n\n${issues.map((issue) => `• ${issue}`).join('\n')}\n\nYou can update your profile or speak with staff at the blood bank for a full assessment.`;
    }

    return `General donor eligibility includes:\n\n${DONOR_ELIGIBILITY_REQUIREMENTS.map((item) => `• ${item}`).join('\n')}\n\nComplete your profile so I can give more personalized guidance.`;
  }

  if (normalized.includes('matching') || normalized.includes('match') || normalized.includes('blood type')) {
    return 'Blood matching follows ABO and Rh compatibility. Recipients need compatible blood types from donors. O- is the universal red cell donor type, while AB+ is the universal recipient type. BloodLink uses your blood type to surface compatible open requests.';
  }

  if (normalized.includes('create') && normalized.includes('request')) {
    if (context.role === 'recipient') {
      return 'Go to your home screen and tap Create blood request. Add the blood type, units needed, urgency, hospital details, and location so nearby compatible donors can respond.';
    }

    return 'Blood requests are created by recipients. If you need blood, switch to a recipient account or ask the patient\'s caregiver to create a request from the Recipient home screen.';
  }

  if (
    normalized.includes('bring') ||
    normalized.includes('before donating') ||
    normalized.includes('prepare')
  ) {
    return 'Before donating, bring a valid ID, eat a healthy meal, drink plenty of water, and get adequate rest. Avoid alcohol before donation and disclose medications or recent illnesses during screening.';
  }

  if (normalized.includes('availability') || normalized.includes('available')) {
    return 'Turn on Donation Availability from your home screen when you are ready to respond to nearby requests. Keep your profile verified and up to date so recipients can match with you faster.';
  }

  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) {
    return 'Hello! Ask me about eligibility, blood matching, creating requests, or what to bring before donating.';
  }

  return 'I can help with donor eligibility, blood type matching, creating blood requests, and donation preparation. Try one of the suggested questions or ask in your own words.';
};
