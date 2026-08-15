import { env } from '@/config/env';
import { supabase } from '@/services/supabase/client';

export interface SendPushNotificationOptions {
  userId?: string;
  userIds?: string[];
  tokens?: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface SendPushNotificationResult {
  success: boolean;
  count?: number;
  message?: string;
  error?: string;
}

/**
 * Dispatches push notifications via the BloodLink backend server.
 */
export async function sendPushNotification({
  body,
  data,
  title,
  tokens,
  userId,
  userIds,
}: SendPushNotificationOptions): Promise<SendPushNotificationResult> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) {
      return {
        error: 'User must be authenticated to dispatch push notifications.',
        success: false,
      };
    }

    const response = await fetch(`${env.apiBaseUrl}/push/send`, {
      body: JSON.stringify({
        body,
        data,
        title,
        tokens,
        userId,
        userIds,
      }),
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    const result = (await response.json().catch(() => null)) as
      | { count?: number; message?: string; success?: boolean }
      | null;

    if (!response.ok) {
      return {
        error: result?.message || `Push dispatch failed (${response.status})`,
        success: false,
      };
    }

    return {
      count: result?.count ?? 0,
      message: result?.message,
      success: true,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      error: message,
      success: false,
    };
  }
}
