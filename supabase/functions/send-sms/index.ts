import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';

const SMS_API_URL =
  Deno.env.get('SMS_API_URL') ?? 'https://smsapiph.onrender.com/api/v1/send/sms';

const MENSAHERO_API_URL =
  Deno.env.get('MENSAHERO_API_URL') ?? 'https://mensahero.onrender.com/api/messages/create';

type SendSmsPayload = {
  user: {
    phone: string;
  };
  sms: {
    otp: string;
  };
};

const toE164 = (phone: string) => {
  const digits = phone.replace(/\D/g, '');
  return digits ? `+${digits}` : phone;
};

const sendViaSmsApiPh = async (to: string, message: string) => {
  const apiKey = Deno.env.get('SMS_API_KEY') ?? Deno.env.get('MENSAHERO_API_KEY');

  if (!apiKey) {
    throw new Error('SMS_API_KEY is not configured.');
  }

  const response = await fetch(SMS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      recipient: to,
      message,
    }),
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};

  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `SMS API PH request failed (${response.status}): ${typeof data === 'object' ? JSON.stringify(data) : text}`,
    );
  }

  return data;
};

const sendViaMensaHero = async (to: string, message: string) => {
  const apiKey = Deno.env.get('MENSAHERO_API_KEY');
  const deviceName = Deno.env.get('MENSAHERO_DEVICE_NAME');

  if (!apiKey || !deviceName) {
    throw new Error('MensaHero credentials are not configured.');
  }

  const response = await fetch(MENSAHERO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      from: deviceName,
      sender: deviceName,
      to,
      message,
    }),
  });

  const text = await response.text();
  let data: Record<string, unknown> = {};

  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = { raw: text };
  }

  if (!response.ok) {
    throw new Error(
      `MensaHero request failed (${response.status}): ${typeof data === 'object' ? JSON.stringify(data) : text}`,
    );
  }

  return data;
};

const sendSms = async (to: string, message: string) => {
  const smsApiKey = Deno.env.get('SMS_API_KEY');
  const mensaHeroDevice = Deno.env.get('MENSAHERO_DEVICE_NAME');

  if (smsApiKey) {
    try {
      return await sendViaSmsApiPh(to, message);
    } catch (error) {
      if (mensaHeroDevice) {
        console.warn('SMS API PH failed, attempting MensaHero fallback:', error);
        return await sendViaMensaHero(to, message);
      }
      throw error;
    }
  }

  if (mensaHeroDevice) {
    return await sendViaMensaHero(to, message);
  }

  // If neither explicitly set, try SMS API PH default
  return await sendViaSmsApiPh(to, message);
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: { http_code: 405, message: 'Method not allowed' } }, 405);
  }

  const hookSecret = Deno.env.get('SEND_SMS_HOOK_SECRET');
  if (!hookSecret) {
    return jsonResponse(
      { error: { http_code: 500, message: 'SEND_SMS_HOOK_SECRET is not configured.' } },
      500,
    );
  }

  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const base64Secret = hookSecret.replace(/^v1,whsec_/, '');
  const wh = new Webhook(base64Secret);

  try {
    const { user, sms } = wh.verify(payload, headers) as SendSmsPayload;
    const phone = toE164(user.phone);
    const message = `Your BloodLink code is ${sms.otp}. Do not share this code with anyone.`;

    await sendSms(phone, message);

    return jsonResponse({});
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('send-sms hook failed:', message);

    return jsonResponse(
      {
        error: {
          http_code: 500,
          message: `Failed to send SMS: ${message}`,
        },
      },
      500,
    );
  }
});
