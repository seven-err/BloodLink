const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  generateHemieReply,
  getLocalHemieReply,
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

test('generateHemieReply uses local source when no API key', async () => {
  const result = await generateHemieReply({
    messages: [{ role: 'user', content: 'How does blood matching work?' }],
    context: {},
    env: {},
  });

  assert.equal(result.source, 'local');
  assert.match(result.reply, /ABO|Rh|compatibility/i);
});
