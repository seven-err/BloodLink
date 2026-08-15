import { env } from '@/config/env';

export type HemieChatRole = 'user' | 'assistant';

export type HemieChatMessage = {
  role: HemieChatRole;
  content: string;
};

export type HemieChatContext = {
  role?: string | null;
  bloodType?: string | null;
  birthdate?: string | null;
  weightKg?: number | null;
  lastTransfusionDate?: string | null;
  lastDonationAt?: string | null;
  isAvailable?: boolean | null;
};

export type HemieChatResult = {
  reply: string;
  source?: string;
};

type AskHemieParams = {
  messages: HemieChatMessage[];
  context?: HemieChatContext;
  accessToken: string;
};

export async function askHemie({
  messages,
  context,
  accessToken,
}: AskHemieParams): Promise<HemieChatResult> {
  if (!accessToken.trim()) {
    throw new Error('Sign in to chat with Hemie.');
  }

  const response = await fetch(`${env.apiBaseUrl}/hemie/chat`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages,
      context,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { reply?: string; source?: string; message?: string }
    | null;

  if (!response.ok) {
    throw new Error(
      payload?.message || 'Hemie is temporarily unavailable. Please try again.',
    );
  }

  const reply = typeof payload?.reply === 'string' ? payload.reply.trim() : '';
  if (!reply) {
    throw new Error('Hemie returned an empty reply.');
  }

  return {
    reply,
    source: typeof payload?.source === 'string' ? payload.source : undefined,
  };
}
