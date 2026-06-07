import type { Database } from '@/types/database';

import { supabase } from './client';

export type AppMessage = Database['public']['Tables']['messages']['Row'];

export type MessageConversationContext = {
  bloodRequestId: string;
  donorMatchId: string;
  recipientId: string;
};

export type MessagingAuthorizationResult =
  | { kind: 'authorized' }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'error'; message: string };

const MESSAGING_ELIGIBLE_MATCH_STATUSES = ['accepted', 'completed'] as const;

export const verifyMessagingAuthorized = async (
  context: MessageConversationContext,
  currentUserId: string,
): Promise<MessagingAuthorizationResult> => {
  const { data: match, error: matchError } = await supabase
    .from('donor_matches')
    .select('id, donor_id, request_id, status')
    .eq('id', context.donorMatchId)
    .eq('request_id', context.bloodRequestId)
    .maybeSingle();

  if (matchError) {
    return { kind: 'error', message: matchError.message };
  }

  if (!match) {
    return { kind: 'unauthorized', message: 'This conversation is not available.' };
  }

  if (
    !MESSAGING_ELIGIBLE_MATCH_STATUSES.includes(
      match.status as (typeof MESSAGING_ELIGIBLE_MATCH_STATUSES)[number],
    )
  ) {
    return {
      kind: 'unauthorized',
      message: 'Messaging is only available after a match is accepted.',
    };
  }

  const { data: request, error: requestError } = await supabase
    .from('blood_requests')
    .select('requester_id')
    .eq('id', context.bloodRequestId)
    .maybeSingle();

  if (requestError) {
    return { kind: 'error', message: requestError.message };
  }

  if (!request) {
    return { kind: 'unauthorized', message: 'Blood request not found.' };
  }

  const requesterId = request.requester_id;
  const donorId = match.donor_id;

  const isRequester = currentUserId === requesterId;
  const isDonor = currentUserId === donorId;

  if (!isRequester && !isDonor) {
    return { kind: 'unauthorized', message: 'You are not a participant in this conversation.' };
  }

  const expectedOtherPartyId = isRequester ? donorId : requesterId;

  if (context.recipientId !== expectedOtherPartyId) {
    return { kind: 'unauthorized', message: 'Invalid conversation participant.' };
  }

  return { kind: 'authorized' };
};

export const listMessages = (context: MessageConversationContext) =>
  supabase
    .from('messages')
    .select('*')
    .eq('blood_request_id', context.bloodRequestId)
    .eq('donor_match_id', context.donorMatchId)
    .order('created_at', { ascending: true });

export type SendMessageResult =
  | { kind: 'success'; message: AppMessage }
  | { kind: 'unauthorized'; message: string }
  | { kind: 'validation_error'; message: string }
  | { kind: 'error'; message: string };

export const sendMessage = async (
  senderId: string,
  recipientId: string,
  body: string,
  context: Pick<MessageConversationContext, 'bloodRequestId' | 'donorMatchId'>,
): Promise<SendMessageResult> => {
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return { kind: 'validation_error', message: 'Message cannot be empty.' };
  }

  const authorization = await verifyMessagingAuthorized(
    { ...context, recipientId },
    senderId,
  );

  if (authorization.kind === 'error') {
    return { kind: 'error', message: authorization.message };
  }

  if (authorization.kind === 'unauthorized') {
    return { kind: 'unauthorized', message: authorization.message };
  }

  const { data, error } = await supabase
    .from('messages')
    .insert({
      blood_request_id: context.bloodRequestId,
      body: trimmedBody,
      donor_match_id: context.donorMatchId,
      recipient_id: recipientId,
      sender_id: senderId,
      status: 'sent',
    })
    .select()
    .single();

  if (error) {
    return { kind: 'error', message: error.message };
  }

  return { kind: 'success', message: data };
};

export const markMessageRead = (messageId: string) =>
  supabase
    .from('messages')
    .update({
      read_at: new Date().toISOString(),
      status: 'read',
    })
    .eq('id', messageId)
    .eq('status', 'sent')
    .select()
    .maybeSingle();

export const markUnreadMessagesRead = async (
  messages: AppMessage[],
  currentUserId: string,
) => {
  const unreadIds = messages
    .filter(
      (message) =>
        message.recipient_id === currentUserId &&
        message.status === 'sent' &&
        message.read_at === null,
    )
    .map((message) => message.id);

  if (unreadIds.length === 0) {
    return { error: null };
  }

  const { error } = await supabase
    .from('messages')
    .update({
      read_at: new Date().toISOString(),
      status: 'read',
    })
    .in('id', unreadIds)
    .eq('recipient_id', currentUserId)
    .eq('status', 'sent');

  return { error };
};
