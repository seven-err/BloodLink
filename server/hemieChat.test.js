const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  callHemieLlm,
  generateHemieReply,
  getLocalHemieReply,
  getGroundedHemieReply,
  getLlmConfig,
  sanitizeContext,
  sanitizeMessages,
} = require('./hemieChat');

test('refuses off-topic questions locally', () => {
  const reply = getLocalHemieReply('What is the weather today?');

  assert.match(reply, /BloodLink assistant/i);
  assert.match(reply, /blood donation|eligibility|matching/i);
});

test('returns eligibility guidance from local replies', () => {
  const reply = getLocalHemieReply('Am I eligible to donate?');

  assert.match(reply, /eligibility/i);
  assert.match(reply, /50 kg|weight/i);
  assert.match(reply, /56/);
});

test('personalizes compatibility for donor blood type', () => {
  const reply = getLocalHemieReply('How does blood matching work?', {
    bloodType: 'A+',
    role: 'donor',
  });

  assert.match(reply, /A\+/);
  assert.match(reply, /AB\+/);
});

test('personalizes eligibility with donation interval wait', () => {
  const recentDonation = new Date();
  recentDonation.setDate(recentDonation.getDate() - 10);

  const reply = getLocalHemieReply('Can I donate blood?', {
    birthdate: '1995-06-15',
    weightKg: 65,
    lastDonationAt: recentDonation.toISOString().slice(0, 10),
  });

  assert.match(reply, /day/i);
  assert.match(reply, /56/);
});

test('matches bloodtypes without a space', () => {
  const grounded = getGroundedHemieReply('what are bloodtypes', {});

  assert.equal(grounded?.kind, 'grounded');
  assert.match(grounded.reply, /O-|AB\+|compatibility|universal/i);
});

test('matches explain bloodtypes phrasing', () => {
  const reply = getLocalHemieReply('explain bloodtypes', { bloodType: 'B+', role: 'donor' });

  assert.match(reply, /B\+/);
  assert.doesNotMatch(reply, /Try one of the suggested questions/i);
});

test('sanitizeMessages rejects bad input', () => {
  assert.equal(sanitizeMessages(null).error, 'Provide at least one chat message.');
  assert.equal(sanitizeMessages([]).error, 'Provide at least one chat message.');
  assert.equal(
    sanitizeMessages([{ role: 'system', content: 'hi' }]).error,
    'Message role must be user or assistant.',
  );
  assert.equal(
    sanitizeMessages([{ role: 'user', content: '   ' }]).error,
    'Message content cannot be empty.',
  );
  assert.equal(
    sanitizeMessages([{ role: 'assistant', content: 'Hello' }]).error,
    'The latest message must come from the user.',
  );
});

test('sanitizeContext accepts lastDonationAt and isAvailable', () => {
  const context = sanitizeContext({
    role: 'donor',
    bloodType: 'o+',
    lastDonationAt: '2026-01-15',
    isAvailable: true,
    weightKg: 70,
  });

  assert.equal(context.bloodType, 'O+');
  assert.equal(context.lastDonationAt, '2026-01-15');
  assert.equal(context.isAvailable, true);
  assert.equal(context.weightKg, 70);
});

test('getLlmConfig defaults to gemini-3.5-flash-lite with fallbacks', () => {
  const config = getLlmConfig({
    HEMIE_LLM_API_KEY: 'test-key',
  });

  assert.equal(config.provider, 'gemini');
  assert.equal(config.models[0], 'gemini-3.5-flash-lite');
  assert.ok(config.models.includes('gemini-3.1-flash-lite'));
});

test('generateHemieReply uses grounded source when no API key', async () => {
  const result = await generateHemieReply({
    messages: [{ role: 'user', content: 'How does blood matching work?' }],
    context: { bloodType: 'O-', role: 'donor' },
    env: {},
  });

  assert.equal(result.source, 'grounded');
  assert.match(result.reply, /O-/);
  assert.match(result.reply, /all types|universal/i);
});

test('generateHemieReply uses LLM when configured', async () => {
  const fetchImpl = async (url, options) => {
    assert.match(String(url), /generateContent/);
    const body = JSON.parse(options.body);
    assert.equal(body.generationConfig.temperature, 0.2);
    assert.ok(body.systemInstruction.parts[0].text.includes('Hemie'));

    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'LLM says donate safely with screening.' }] } }],
      }),
    };
  };

  const result = await generateHemieReply({
    messages: [{ role: 'user', content: 'How does blood matching work?' }],
    context: { bloodType: 'O-', role: 'donor' },
    env: {
      HEMIE_LLM_API_KEY: 'test-key',
      HEMIE_LLM_MODEL: 'gemini-3.5-flash-lite',
    },
    fetchImpl,
  });

  assert.equal(result.source, 'llm');
  assert.match(result.reply, /LLM says donate safely/);
});

test('callHemieLlm falls back to next model on quota errors', async () => {
  const calls = [];

  const fetchImpl = async (url) => {
    calls.push(String(url));

    if (calls.length === 1) {
      return {
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'quota exceeded' } }),
      };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Fallback model reply' }] } }],
      }),
    };
  };

  const reply = await callHemieLlm({
    messages: [{ role: 'user', content: 'What should I bring before donating?' }],
    context: {},
    env: {
      HEMIE_LLM_API_KEY: 'test-key',
      HEMIE_LLM_MODEL: 'gemini-3.5-flash-lite',
      HEMIE_LLM_FALLBACK_MODELS: 'gemini-3.1-flash-lite',
    },
    fetchImpl,
  });

  assert.equal(reply, 'Fallback model reply');
  assert.equal(calls.length, 2);
  assert.match(calls[0], /gemini-3\.5-flash-lite:generateContent/);
  assert.match(calls[1], /gemini-3\.1-flash-lite:generateContent/);
});

test('generateHemieReply uses local source when no API key for open questions', async () => {
  const result = await generateHemieReply({
    messages: [{ role: 'user', content: 'Tell me something useful about donating safely today' }],
    context: {},
    env: {},
  });

  assert.equal(result.source, 'local');
  assert.match(result.reply, /eligibility|BloodLink|donation/i);
});

test('detects Filipino eligibility phrasing for grounded replies', () => {
  const grounded = getGroundedHemieReply('Pwede ba akong mag-donate?', {});

  assert.equal(grounded?.kind, 'grounded');
  assert.match(grounded.reply, /eligibility|pasok ka sa basic eligibility/i);
});

test('detects informal Tagalog eligibility phrasing', () => {
  const grounded = getGroundedHemieReply('pwede ba kong mag donate?', {
    birthdate: '1995-06-15',
    weightKg: 65,
  });

  assert.equal(grounded?.kind, 'grounded');
  assert.match(grounded.reply, /pasok ka sa basic eligibility|meet the basic eligibility/i);
});

test('detects Cebuano help cue and replies in Filipino', () => {
  const reply = getLocalHemieReply('tabang');

  assert.match(reply, /Hemie|BloodLink/i);
  assert.match(reply, /Magtanong|eligibility/i);
  assert.doesNotMatch(reply, /Try one of the suggested questions/i);
});

test('system prompt instructs multilingual replies', async () => {
  let systemText = '';

  const fetchImpl = async (_url, options) => {
    const body = JSON.parse(options.body);
    systemText = body.systemInstruction.parts[0].text;

    return {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'Oo, maaari mong tingnan ang eligibility mo.' }] } }],
      }),
    };
  };

  const result = await generateHemieReply({
    messages: [{ role: 'user', content: 'Pwede ba akong mag-donate?' }],
    context: {},
    env: {
      HEMIE_LLM_API_KEY: 'test-key',
      HEMIE_LLM_MODEL: 'gemini-3.5-flash-lite',
    },
    fetchImpl,
  });

  assert.equal(result.source, 'llm');
  assert.match(systemText, /Detect the language/i);
  assert.match(systemText, /Reply in that same language/i);
  assert.match(result.reply, /eligibility|maaari/i);
});
