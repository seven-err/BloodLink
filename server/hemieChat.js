const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_MESSAGES = 12;
const MAX_REPLY_TOKENS = 500;

const HEMIE_SYSTEM_PROMPT = `You are Hemie, the BloodLink AI assistant inside the BloodLink mobile app.

Your ONLY goal is to help users with BloodLink and blood donation coordination:
- Donor eligibility education (age, weight, transfusion wait, general health screening)
- ABO/Rh blood type compatibility basics
- How to use BloodLink (availability toggle, create/respond to blood requests, map, chat, QR verification, profile)
- Donation day preparation (ID, hydration, rest, what to expect)
- Urgency and emergency workflow guidance inside the app

Hard rules:
1. Stay strictly on BloodLink / blood donation topics. If asked about anything else (coding, weather, sports, homework, general chat, unrelated medical advice), briefly refuse and redirect to BloodLink topics.
2. You are NOT a doctor. Do not diagnose, prescribe, or triage medical conditions. For emergencies, tell the user to contact local emergency services (911) or healthcare personnel immediately.
3. Do not invent hospital policies, lab results, or BloodLink features that were not described to you.
4. Prefer short, clear mobile-friendly answers (usually under 120 words). Use bullet points when listing requirements.
5. If user context is provided, you may personalize eligibility education, but always say final clearance depends on on-site screening.
6. Never ask for passwords, OTP codes, or unnecessary sensitive health details.
7. If unsure, say so and suggest contacting blood bank / healthcare staff through BloodLink or in person.`;

const BLOOD_COMPATIBILITY_NOTES = `
Donor-to-recipient red cell compatibility (simplified education):
- O- can donate to all types
- O+ can donate to positive types
- A- → A-, A+, AB-, AB+
- A+ → A+, AB+
- B- → B-, B+, AB-, AB+
- B+ → B+, AB+
- AB- → AB-, AB+
- AB+ → AB+
`;

const DONOR_ELIGIBILITY_NOTES = `
General BloodLink donor eligibility education:
- Age 16–65 (16–17 need parental/guardian consent)
- Weight at least 50 kg
- Wait 12 months after a blood transfusion before donating
- Be in good general health on donation day
Final approval always depends on blood bank screening.
`;

const OFF_TOPIC_PATTERN =
  /\b(weather|recipe|crypto|bitcoin|stock market|homework|essay|poem|joke|movie|spotify|fortnite|minecraft|write (me )?(code|python|javascript)|who (won|is the president))\b/i;

const EMERGENCY_PATTERN =
  /\b(chest pain|can'?t breathe|not breathing|unconscious|severe bleeding|stroke|heart attack|overdose)\b/i;

function normalizeText(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

function buildLocalEligibilityReply(context = {}) {
  const requirements = [
    'Age: 16 to 65 years old (16 and 17-year-olds require written parental or guardian consent).',
    'Weight: At least 50 kg (110 lbs).',
    'Wait 12 months from your last blood transfusion before donating.',
    'Be in good general health on donation day.',
  ];

  if (!context.birthdate || context.weightKg == null) {
    return `General donor eligibility includes:\n\n${requirements.map((item) => `• ${item}`).join('\n')}\n\nComplete your profile so I can give more personalized guidance. Final clearance still depends on blood bank screening.`;
  }

  const issues = [];
  const birthdate = String(context.birthdate);
  const weightKg = Number(context.weightKg);

  if (/^\d{4}-\d{2}-\d{2}$/.test(birthdate)) {
    const [year, month, day] = birthdate.split('-').map(Number);
    const born = new Date(Date.UTC(year, month - 1, day));
    const today = new Date();
    let age = today.getFullYear() - born.getFullYear();
    const monthDiff = today.getMonth() - born.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
      age -= 1;
    }

    if (age < 16 || age > 65) {
      issues.push('Your age may be outside the usual 16–65 donation range.');
    } else if (age === 16 || age === 17) {
      issues.push('Donors aged 16–17 typically need parental or guardian consent.');
    }
  }

  if (!Number.isFinite(weightKg) || weightKg < 50) {
    issues.push('Donors usually need to weigh at least 50 kg.');
  }

  if (issues.length === 0) {
    return 'Based on your profile, you meet the basic BloodLink eligibility requirements. Final approval still depends on a health screening on donation day.';
  }

  return `Here are eligibility items to review:\n\n${issues.map((issue) => `• ${issue}`).join('\n')}\n\nYou can update your profile or speak with staff at the blood bank for a full assessment.`;
}

function getLocalHemieReply(question, context = {}) {
  const normalized = normalizeText(question).toLowerCase();

  if (EMERGENCY_PATTERN.test(normalized)) {
    return 'This sounds like a medical emergency. Contact local emergency services (911) or healthcare personnel immediately. Hemie cannot provide emergency medical care.';
  }

  if (OFF_TOPIC_PATTERN.test(normalized)) {
    return "I'm Hemie, your BloodLink assistant. I can only help with blood donation, eligibility, matching, and how to use BloodLink. What would you like to know about those?";
  }

  if (normalized.includes('eligible') || normalized.includes('eligibility')) {
    return buildLocalEligibilityReply(context);
  }

  if (
    normalized.includes('matching') ||
    normalized.includes('match') ||
    normalized.includes('blood type') ||
    normalized.includes('compatible')
  ) {
    return 'Blood matching follows ABO and Rh compatibility. Recipients need compatible blood types from donors. O- is the universal red cell donor type, while AB+ is the universal recipient type. BloodLink uses your blood type to surface compatible open requests.';
  }

  if (
    (normalized.includes('create') && normalized.includes('request')) ||
    normalized.includes('blood request')
  ) {
    if (context.role === 'recipient') {
      return 'Go to your home screen and tap Create blood request. Add the blood type, units needed, urgency, hospital details, and location so nearby compatible donors can respond.';
    }

    return "Blood requests are created by recipients. If you need blood, switch to recipient mode or ask the patient's caregiver to create a request from the Recipient home screen.";
  }

  if (
    normalized.includes('bring') ||
    normalized.includes('before donating') ||
    normalized.includes('prepare') ||
    normalized.includes('preparation')
  ) {
    return 'Before donating, bring a valid ID, eat a healthy meal, drink plenty of water, and get adequate rest. Avoid alcohol before donation and disclose medications or recent illnesses during screening.';
  }

  if (normalized.includes('availability') || normalized.includes('available')) {
    return 'Turn on Donation Availability from your home screen when you are ready to respond to nearby requests. Keep your profile verified and up to date so recipients can match with you faster.';
  }

  if (normalized.includes('qr') || normalized.includes('verify')) {
    return 'BloodLink uses QR codes to help verify donation sessions. Follow the on-screen QR flow when you are at the donation site with authorized personnel.';
  }

  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) {
    return 'Hello! Ask me about eligibility, blood matching, creating requests, donation preparation, or how BloodLink works.';
  }

  return 'I can help with donor eligibility, blood type matching, creating blood requests, donation preparation, and using BloodLink. Try one of the suggested questions or ask in your own words.';
}

function sanitizeContext(rawContext) {
  if (!rawContext || typeof rawContext !== 'object' || Array.isArray(rawContext)) {
    return {};
  }

  const context = {};

  if (typeof rawContext.role === 'string' && rawContext.role.trim()) {
    context.role = rawContext.role.trim().slice(0, 40);
  }

  if (typeof rawContext.bloodType === 'string' && rawContext.bloodType.trim()) {
    context.bloodType = rawContext.bloodType.trim().slice(0, 8);
  }

  if (typeof rawContext.birthdate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(rawContext.birthdate)) {
    context.birthdate = rawContext.birthdate;
  }

  if (rawContext.weightKg != null) {
    const weightKg = Number(rawContext.weightKg);
    if (Number.isFinite(weightKg) && weightKg > 0 && weightKg < 500) {
      context.weightKg = weightKg;
    }
  }

  if (
    typeof rawContext.lastTransfusionDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(rawContext.lastTransfusionDate)
  ) {
    context.lastTransfusionDate = rawContext.lastTransfusionDate;
  }

  return context;
}

function sanitizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
    return { error: 'Provide at least one chat message.' };
  }

  const messages = [];

  for (const entry of rawMessages.slice(-MAX_HISTORY_MESSAGES)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { error: 'Each message must be an object.' };
    }

    const role = entry.role === 'assistant' ? 'assistant' : entry.role === 'user' ? 'user' : null;
    const content = normalizeText(entry.content);

    if (!role) {
      return { error: 'Message role must be user or assistant.' };
    }

    if (!content) {
      return { error: 'Message content cannot be empty.' };
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return { error: `Messages must be ${MAX_MESSAGE_LENGTH} characters or fewer.` };
    }

    messages.push({ role, content });
  }

  if (messages[messages.length - 1]?.role !== 'user') {
    return { error: 'The latest message must come from the user.' };
  }

  return { messages };
}

function buildContextBlock(context) {
  const lines = [DONOR_ELIGIBILITY_NOTES.trim(), BLOOD_COMPATIBILITY_NOTES.trim(), 'Current user context:'];

  lines.push(`- role: ${context.role || 'unknown'}`);
  lines.push(`- bloodType: ${context.bloodType || 'unknown'}`);
  lines.push(`- birthdate: ${context.birthdate || 'unknown'}`);
  lines.push(`- weightKg: ${context.weightKg != null ? context.weightKg : 'unknown'}`);
  lines.push(`- lastTransfusionDate: ${context.lastTransfusionDate || 'none on file'}`);

  return lines.join('\n');
}

function isLlmConfigured(env = process.env) {
  return Boolean(env.HEMIE_LLM_API_KEY && env.HEMIE_LLM_API_KEY.trim());
}

function getLlmConfig(env = process.env) {
  return {
    apiKey: (env.HEMIE_LLM_API_KEY || '').trim(),
    baseUrl: (env.HEMIE_LLM_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta/openai').replace(
      /\/$/,
      '',
    ),
    model: (env.HEMIE_LLM_MODEL || 'gemini-2.0-flash').trim(),
  };
}

async function callHemieLlm({ messages, context, fetchImpl = fetch, env = process.env }) {
  const { apiKey, baseUrl, model } = getLlmConfig(env);

  const response = await fetchImpl(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: MAX_REPLY_TOKENS,
      messages: [
        { role: 'system', content: HEMIE_SYSTEM_PROMPT },
        { role: 'system', content: buildContextBlock(context) },
        ...messages,
      ],
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload?.error?.message || payload?.message || `LLM request failed with status ${response.status}`;
    const error = new Error(detail);
    error.status = response.status;
    throw error;
  }

  const reply = normalizeText(payload?.choices?.[0]?.message?.content);

  if (!reply) {
    throw new Error('LLM returned an empty reply.');
  }

  return reply;
}

async function generateHemieReply({
  messages,
  context = {},
  fetchImpl = fetch,
  env = process.env,
}) {
  const latestUserMessage = messages[messages.length - 1]?.content || '';

  if (EMERGENCY_PATTERN.test(latestUserMessage)) {
    return {
      reply: getLocalHemieReply(latestUserMessage, context),
      source: 'safety',
    };
  }

  if (OFF_TOPIC_PATTERN.test(latestUserMessage)) {
    return {
      reply: getLocalHemieReply(latestUserMessage, context),
      source: 'guardrail',
    };
  }

  if (!isLlmConfigured(env)) {
    return {
      reply: getLocalHemieReply(latestUserMessage, context),
      source: 'local',
    };
  }

  try {
    const reply = await callHemieLlm({ messages, context, fetchImpl, env });
    return { reply, source: 'llm' };
  } catch (error) {
    console.error('Hemie LLM failed, using local fallback:', error);
    return {
      reply: getLocalHemieReply(latestUserMessage, context),
      source: 'local_fallback',
    };
  }
}

async function verifySupabaseAccessToken(token, { fetchImpl = fetch, env = process.env } = {}) {
  const supabaseUrl = (env.SUPABASE_URL || '').replace(/\/$/, '');
  const anonKey = env.SUPABASE_ANON_KEY || '';

  if (!supabaseUrl || !anonKey) {
    const error = new Error('Hemie auth is not configured on the server.');
    error.status = 503;
    throw error;
  }

  const response = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
  });

  if (!response.ok) {
    const error = new Error('Invalid or expired session.');
    error.status = 401;
    throw error;
  }

  const user = await response.json();
  if (!user?.id) {
    const error = new Error('Invalid or expired session.');
    error.status = 401;
    throw error;
  }

  return user;
}

module.exports = {
  HEMIE_SYSTEM_PROMPT,
  generateHemieReply,
  getLocalHemieReply,
  isLlmConfigured,
  sanitizeContext,
  sanitizeMessages,
  verifySupabaseAccessToken,
};
