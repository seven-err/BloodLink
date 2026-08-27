import {
  DONATION_INTERVAL_DAYS,
  DONOR_ELIGIBILITY_REQUIREMENTS,
  getDonorEligibilityIssues,
} from '@/utils/donorEligibility';
import {
  getBloodTypeCompatibilityLabel,
  getRecipientCanReceiveFromLabel,
} from '@/utils/bloodTypeCompatibility';
import { getDaysUntilNextEligible } from '@/utils/donorDonationStats';

export const HEMIE_SUGGESTED_QUESTIONS = [
  'Am I eligible to donate?',
  'How does blood matching work?',
  'How do I create a blood request?',
  'What should I bring before donating?',
] as const;

const WELCOME_MESSAGE =
  "Hi! I'm Hemie, your BloodLink AI assistant. I'm here to help you with questions about blood donation, eligibility, and how BloodLink works. How can I assist you today?";

export const getHemieWelcomeMessage = () => WELCOME_MESSAGE;

export type HemieContext = {
  birthdate?: string | null;
  weightKg?: number | null;
  lastTransfusionDate?: string | null;
  lastDonationAt?: string | null;
  role?: string | null;
  bloodType?: string | null;
  isAvailable?: boolean | null;
};

type ReplyLocale = 'en' | 'fil';

const OFF_TOPIC_PATTERN =
  /\b(weather|recipe|crypto|bitcoin|stock market|homework|essay|poem|joke|movie|spotify|fortnite|minecraft|write (me )?(code|python|javascript)|who (won|is the president)|panahon|biro|pelikula)\b/i;

const EMERGENCY_PATTERN =
  /\b(chest pain|can'?t breathe|not breathing|unconscious|severe bleeding|stroke|heart attack|overdose|hirap huminga|atake sa puso|matinding pagdurugo|nawalan ng malay)\b/i;

const ELIGIBILITY_PATTERN =
  /\b(eligib\w*|can i donate|am i able to donate|qualif\w*|requirements? to donate|allowed to donate|fit to donate|kwalipikado|(?:pwede|maaari)\b.{0,48}(?:mag[-\s]?donate|magbigay|\bdonate\b)|(?:ako(?:ng)?|ko(?:ng)?)\b.{0,24}(?:mag[-\s]?donate|magbigay|\bdonate\b)|karapat-dapat.{0,36}(?:mag[-\s]?donate|\bdonate\b))/i;

const COMPATIBILITY_PATTERN =
  /\b(match\w*|compatib\w*|blood\s*types?|abo(?:\s*\/?\s*rh)?|rh factor|who can (i |receive|donate)|universal donor|universal recipient|can (i |someone )?(give|receive|donate)|donate to|receive from|uri ng dugo|tumutugma)\b/i;

const REQUEST_PATTERN =
  /\b((create|make|post|submit).{0,24}request|blood request|request blood|need blood|gumawa.{0,24}(request|kahilingan)|kailangan (ng )?dugo|mag-?request ng dugo)\b/i;

const PREP_PATTERN =
  /\b(bring|before donat\w*|prepar\w*|what (should|do) i (bring|do)|donation day|hydrate|ano (ang )?dapat (dalhin|gawin)|bago mag[-\s]?donate|maghanda)\b/i;

const AVAILABILITY_PATTERN =
  /\b(availability|available to donate|donation availability|toggle|available (ba )?(ako|to donate)|i-?on ang availability)\b/i;

const QR_PATTERN = /\b(qr|verify donation|verification code|scan code|i-?scan|beripikasyon)\b/i;

const INTERVAL_PATTERN =
  /\b(how (soon|often|long).{0,40}(donat|again)|between donations|donation interval|wait (to|before) donat|56 day|8 week|gaano (katagal|kadalas).{0,40}(donat|magbigay)|kailan (ulit|pwede).{0,20}donat)\b/i;

const MAP_PATTERN =
  /\b(map|nearby donor|find donor|location|openstreetmap|mapa|malapit na donor|hanapin ang donor)\b/i;

const CHAT_PATTERN = /\b(chat|message|messaging|mag-?chat|mag-?message)\b/i;

const GREETING_PATTERN =
  /\b(hello|hi|hey|kumusta|kamusta|magandang (umaga|hapon|gabi)|hola|bonjour)\b|你好|こんにちは|안녕하세요/i;

const HELP_PATTERN =
  /\b(help|help me|tulong|tabang|assist( me)?|paano (ba )?(ito|gumana)|what can you (do|help))\b/i;

const normalizeQuestion = (question: string) => question.trim().toLowerCase().replace(/\s+/g, ' ');

const detectUserLocale = (text: string): ReplyLocale => {
  const normalized = normalizeQuestion(text);
  if (!normalized) {
    return 'en';
  }

  if (
    /^(tabang|tulong)[!?.]*$/i.test(normalized) ||
    /\b(tabang|unsa|asa|salamat kaayo)\b/i.test(normalized)
  ) {
    return 'fil';
  }

  if (
    /\b(pwede|maaari|ako(?:ng)?|ko(?:ng)?|tulong|kumusta|kamusta|dugo|opo|\bpo\b|paano|ano|salamat|mag[-\s]?donate|magbigay|ba ako|ba ko)\b/i.test(
      normalized,
    )
  ) {
    return 'fil';
  }

  return 'en';
};

const buildEligibilityReply = (context: HemieContext, locale: ReplyLocale): string => {
  if (context.birthdate && context.weightKg != null) {
    const issues = getDonorEligibilityIssues({
      birthdate: context.birthdate,
      weightKg: context.weightKg,
      lastTransfusionDate: context.lastTransfusionDate,
    });

    const daysUntilEligible = getDaysUntilNextEligible(context.lastDonationAt);
    if (daysUntilEligible != null && daysUntilEligible > 0) {
      issues.push(
        locale === 'fil'
          ? `Maghintay pa ng ${daysUntilEligible} araw bago ang susunod na whole-blood donation (${DONATION_INTERVAL_DAYS}-day interval).`
          : `Wait ${daysUntilEligible} more day${daysUntilEligible === 1 ? '' : 's'} before your next whole-blood donation (${DONATION_INTERVAL_DAYS}-day interval).`,
      );
    }

    if (issues.length === 0) {
      return locale === 'fil'
        ? 'Base sa BloodLink profile mo, pasok ka sa basic eligibility checks (edad, timbang, transfusion wait, at donation interval). Final approval pa rin ang health screening sa araw ng donation.'
        : 'Based on your BloodLink profile, you meet the basic eligibility checks (age, weight, transfusion wait, and donation interval). Final approval still depends on a health screening on donation day.';
    }

    return locale === 'fil'
      ? `Ito ang mga dapat mong i-review:\n\n${issues.map((issue) => `• ${issue}`).join('\n')}\n\nPwede mong i-update ang profile o makipag-usap sa blood bank staff para sa buong assessment.`
      : `Here are eligibility items to review:\n\n${issues.map((issue) => `• ${issue}`).join('\n')}\n\nYou can update your profile or speak with staff at the blood bank for a full assessment.`;
  }

  return locale === 'fil'
    ? `General donor eligibility:\n\n${DONOR_ELIGIBILITY_REQUIREMENTS.map((item) => `• ${item}`).join('\n')}\n\nKumpletuhin ang profile mo para mas personal ang gabay.`
    : `General donor eligibility includes:\n\n${DONOR_ELIGIBILITY_REQUIREMENTS.map((item) => `• ${item}`).join('\n')}\n\nComplete your profile so I can give more personalized guidance.`;
};

const buildCompatibilityReply = (context: HemieContext, locale: ReplyLocale): string => {
  if (context.bloodType) {
    if (context.role === 'recipient') {
      return locale === 'fil'
        ? `Ang blood type mo ay ${context.bloodType}. Bilang recipient, pwede kang tumanggap ng red cells mula sa: ${getRecipientCanReceiveFromLabel(context.bloodType)}.\n\nGinagamit ito ng BloodLink para ipakita ang compatible nearby donors. O- ang universal donor; AB+ ang universal recipient.`
        : `Your blood type is ${context.bloodType}. As a recipient, you can receive red cells from: ${getRecipientCanReceiveFromLabel(context.bloodType)}.\n\nBloodLink uses this ABO/Rh matching to surface compatible nearby donors. O- is the universal donor type; AB+ is the universal recipient type.`;
    }

    return locale === 'fil'
      ? `Ang blood type mo ay ${context.bloodType}. Bilang donor, pwede kang magbigay ng red cells sa: ${getBloodTypeCompatibilityLabel(context.bloodType)}.\n\nGinagamit ito ng BloodLink para ipakita ang compatible open requests. O- ang universal donor; AB+ ang universal recipient.`
      : `Your blood type is ${context.bloodType}. As a donor, you can give red cells to: ${getBloodTypeCompatibilityLabel(context.bloodType)}.\n\nBloodLink uses this ABO/Rh matching to surface compatible open requests. O- is the universal donor type; AB+ is the universal recipient type.`;
  }

  return locale === 'fil'
    ? 'Ang blood matching ay sumusunod sa ABO at Rh compatibility. O- ay pwedeng mag-donate sa lahat (universal donor). AB+ ay pwedeng tumanggap mula sa lahat (universal recipient). I-set ang blood type mo sa Profile para sa personalized guidance.'
    : 'Blood matching follows ABO and Rh compatibility. O- can donate to all types (universal donor). AB+ can receive from all types (universal recipient). BloodLink uses your profile blood type to surface compatible requests and donors. Set your blood type in Profile for personalized guidance.';
};

const buildDonationIntervalReply = (context: HemieContext, locale: ReplyLocale): string => {
  const daysUntilEligible = getDaysUntilNextEligible(context.lastDonationAt);

  if (daysUntilEligible == null) {
    return locale === 'fil'
      ? `May ${DONATION_INTERVAL_DAYS}-day wait ang BloodLink sa pagitan ng whole-blood donations. Kung wala kang recent donation (o hindi pa naka-log), baka pwede ka na—kumpirmahin sa on-site screening.`
      : `BloodLink follows a ${DONATION_INTERVAL_DAYS}-day wait between whole-blood donations. If you have not donated recently (or have not logged a donation), you may be ready now—confirm during on-site screening.`;
  }

  if (daysUntilEligible === 0) {
    return locale === 'fil'
      ? `Base sa last donation mo, tapos na ang ${DONATION_INTERVAL_DAYS}-day wait at pwede ka nang mag-donate ulit, subject sa on-site screening.`
      : `Based on your last donation on file, you have completed the ${DONATION_INTERVAL_DAYS}-day wait and may donate again, subject to on-site screening.`;
  }

  return locale === 'fil'
    ? `Base sa last donation mo, maghintay pa ng ${daysUntilEligible} araw bago ang susunod na whole-blood donation (${DONATION_INTERVAL_DAYS}-day interval ang BloodLink).`
    : `Based on your last donation on file, wait ${daysUntilEligible} more day${daysUntilEligible === 1 ? '' : 's'} before your next whole-blood donation (BloodLink uses a ${DONATION_INTERVAL_DAYS}-day interval).`;
};

export const getHemieResponse = (question: string, context: HemieContext = {}): string => {
  const normalized = normalizeQuestion(question);
  const locale = detectUserLocale(question);

  if (EMERGENCY_PATTERN.test(normalized)) {
    return locale === 'fil'
      ? 'Parang medical emergency ito. Tumawag agad sa local emergency services (911) o healthcare personnel. Hindi makakapagbigay ang Hemie ng emergency medical care.'
      : 'This sounds like a medical emergency. Contact local emergency services (911) or healthcare personnel immediately. Hemie cannot provide emergency medical care.';
  }

  if (OFF_TOPIC_PATTERN.test(normalized)) {
    return locale === 'fil'
      ? 'Ako si Hemie, BloodLink assistant mo. Tanging blood donation, eligibility, matching, at paggamit ng BloodLink ang kayang tulungan ko. Ano ang gusto mong malaman tungkol diyan?'
      : "I'm Hemie, your BloodLink assistant. I can only help with blood donation, eligibility, matching, and how to use BloodLink. What would you like to know about those?";
  }

  if (ELIGIBILITY_PATTERN.test(normalized)) {
    return buildEligibilityReply(context, locale);
  }

  if (INTERVAL_PATTERN.test(normalized)) {
    return buildDonationIntervalReply(context, locale);
  }

  if (COMPATIBILITY_PATTERN.test(normalized)) {
    return buildCompatibilityReply(context, locale);
  }

  if (REQUEST_PATTERN.test(normalized)) {
    if (context.role === 'recipient') {
      return locale === 'fil'
        ? 'Pumunta sa Recipient Home at i-tap ang Create blood request. Ilagay ang blood type, units needed, urgency, hospital details, at location para makasagot ang nearby compatible donors.'
        : 'Go to Recipient Home and tap Create blood request. Add the blood type, units needed, urgency, hospital details, and location so nearby compatible donors can respond.';
    }

    return locale === 'fil'
      ? 'Ang blood requests ay ginagawa ng recipients. Kung kailangan ng dugo, gamitin ang recipient mode o hilingin sa caregiver ng patient na gumawa ng request mula sa Recipient Home.'
      : "Blood requests are created by recipients. If you need blood, use recipient mode or ask the patient's caregiver to create a request from Recipient Home.";
  }

  if (PREP_PATTERN.test(normalized)) {
    return locale === 'fil'
      ? 'Bago mag-donate, magdala ng valid ID, kumain ng healthy meal, uminom ng maraming tubig, at magpahinga nang sapat. Iwasan ang alcohol bago mag-donate at i-disclose ang medications o recent illnesses sa screening.'
      : 'Before donating, bring a valid ID, eat a healthy meal, drink plenty of water, and get adequate rest. Avoid alcohol before donation and disclose medications or recent illnesses during screening.';
  }

  if (AVAILABILITY_PATTERN.test(normalized)) {
    return locale === 'fil'
      ? 'I-on ang Donation Availability sa iyong Profile tab katabi ng Edit Profile kapag handa ka nang tumugon sa nearby requests. Panatilihing updated ang profile at verification para mas mabilis kang ma-match.'
      : 'Turn on Donation Availability from your Profile tab next to Edit Profile when you are ready to respond to nearby requests. Keep your profile and verification up to date so recipients can match with you faster.';
  }

  if (QR_PATTERN.test(normalized)) {
    return locale === 'fil'
      ? 'Gumagamit ang BloodLink ng QR codes para i-verify ang donation sessions. Sundan ang on-screen QR flow sa donation site kasama ang authorized personnel.'
      : 'BloodLink uses QR codes to help verify donation sessions. Follow the on-screen QR flow when you are at the donation site with authorized personnel.';
  }

  if (MAP_PATTERN.test(normalized)) {
    return locale === 'fil'
      ? 'Gamitin ang Map tab para tingnan ang nearby donors at request locations sa OpenStreetMap. Pwede ring mag-browse ang recipients ng compatible nearby donors mula sa Recipient Home.'
      : 'Use the Map tab to explore nearby donors and request locations on OpenStreetMap. Recipients can also browse compatible nearby donors from Recipient Home.';
  }

  if (CHAT_PATTERN.test(normalized)) {
    return locale === 'fil'
      ? 'Buksan ang Messages tab para makipag-chat sa matched donors o requesters. Gamitin si Hemie (ang chat na ito) para sa donation education at BloodLink how-to questions.'
      : 'Open the Messages tab to chat with matched donors or requesters. Use Hemie (this chat) for donation education and BloodLink how-to questions.';
  }

  if (HELP_PATTERN.test(normalized) || GREETING_PATTERN.test(normalized)) {
    return locale === 'fil'
      ? 'Ako si Hemie, BloodLink assistant mo. Magtanong tungkol sa eligibility, blood matching, donation timing, paggawa ng blood request, preparation, o paano gamitin ang BloodLink.'
      : 'Hello! Ask me about eligibility, blood matching, donation timing, creating requests, preparation, or how BloodLink works.';
  }

  return locale === 'fil'
    ? 'Matutulungan kita sa donor eligibility, 56-day donation interval, blood type matching, paggawa ng blood request, donation preparation, at paggamit ng BloodLink. Subukan ang suggested questions o magtanong sa sarili mong salita.'
    : 'I can help with donor eligibility, the 56-day donation interval, blood type matching, creating blood requests, donation preparation, and using BloodLink. Try one of the suggested questions or ask in your own words.';
};
