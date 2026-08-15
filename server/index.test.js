const assert = require('node:assert/strict');
const { afterEach, beforeEach, test } = require('node:test');

const { buildEmailFromTemplate, createApp } = require('./index');

const apiKey = 'test-email-api-key';
let server;
let baseUrl;
let sentMail;

beforeEach(async () => {
  sentMail = [];

  const app = createApp({
    allowedOrigins: ['http://localhost:8081'],
    apiKey,
    rateLimit: {
      max: 10,
      windowMs: 60_000,
    },
    smtpFrom: 'BloodLink <sender@example.com>',
    transporter: {
      sendMail: async (mail) => {
        sentMail.push(mail);
      },
    },
  });

  server = await new Promise((resolve) => {
    const listener = app.listen(0, () => resolve(listener));
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('rejects unauthenticated email requests', async () => {
  const response = await fetch(`${baseUrl}/email/send`, {
    body: JSON.stringify({
      template: 'welcome',
      to: 'recipient@example.com',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  assert.equal(response.status, 401);
  assert.equal(sentMail.length, 0);
});

test('rejects arbitrary email content', () => {
  const result = buildEmailFromTemplate({
    html: '<p>untrusted</p>',
    subject: 'User supplied subject',
    text: 'untrusted',
    to: 'recipient@example.com',
  });

  assert.equal(result.error, 'Email request contains unsupported fields.');
});

test('rejects the legacy generic email endpoint', async () => {
  const response = await fetch(`${baseUrl}/send-email`, {
    body: JSON.stringify({
      html: '<p>untrusted</p>',
      subject: 'User supplied subject',
      to: 'recipient@example.com',
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  assert.equal(response.status, 410);
  assert.equal(sentMail.length, 0);
});

test('requires a strong email API key at startup', () => {
  assert.throws(
    () =>
      createApp({
        apiKey: 'short',
        smtpFrom: 'BloodLink <sender@example.com>',
        transporter: {
          sendMail: async () => undefined,
        },
      }),
    /EMAIL_API_KEY must be at least 16 characters long/,
  );
});

test('rejects invalid template data', () => {
  const result = buildEmailFromTemplate({
    data: '<script>alert("xss")</script>',
    template: 'welcome',
    to: 'recipient@example.com',
  });

  assert.equal(result.error, 'Template data must be an object.');
});

test('rate limits unauthenticated requests', async () => {
  const requests = Array.from({ length: 11 }, () =>
    fetch(`${baseUrl}/email/send`, {
      body: JSON.stringify({
        template: 'welcome',
        to: 'recipient@example.com',
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    }),
  );
  const responses = await Promise.all(requests);

  assert.equal(responses.at(-1).status, 429);
  assert.equal(sentMail.length, 0);
});

test('sends supported template emails with backend-owned content', async () => {
  const response = await fetch(`${baseUrl}/email/send`, {
    body: JSON.stringify({
      data: {
        name: '<Juan>',
      },
      template: 'welcome',
      to: 'recipient@example.com',
    }),
    headers: {
      'Content-Type': 'application/json',
      'X-Email-API-Key': apiKey,
    },
    method: 'POST',
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { success: true });
  assert.equal(sentMail.length, 1);
  assert.equal(sentMail[0].subject, 'Welcome to BloodLink');
  assert.equal(sentMail[0].to, 'recipient@example.com');
  assert.match(sentMail[0].html, /&lt;Juan&gt;/);
});

test('rejects unauthenticated push notification requests', async () => {
  const response = await fetch(`${baseUrl}/push/send`, {
    body: JSON.stringify({
      body: 'Urgent blood request',
      title: 'BloodLink Alert',
      tokens: ['ExponentPushToken[mock-token-12345]'],
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  assert.equal(response.status, 401);
});

test('rejects push notification requests with missing title or body', async () => {
  const response = await fetch(`${baseUrl}/push/send`, {
    body: JSON.stringify({
      title: '',
      tokens: ['ExponentPushToken[mock-token-12345]'],
    }),
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    method: 'POST',
  });

  assert.equal(response.status, 400);
  const data = await response.json();
  assert.match(data.message, /title is required/i);
});

test('handles push notification sending with explicit tokens', async () => {
  const response = await fetch(`${baseUrl}/push/send`, {
    body: JSON.stringify({
      body: 'Blood request nearby',
      title: 'BloodLink Alert',
      tokens: [],
    }),
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    method: 'POST',
  });

  assert.equal(response.status, 200);
  const data = await response.json();
  assert.equal(data.success, true);
  assert.equal(data.count, 0);
});
