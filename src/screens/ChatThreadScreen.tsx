import { useCallback, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MessageBubble } from '@/components/chat/MessageBubble';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useAuth } from '@/context/AuthContext';
import type { AppStackParamList } from '@/navigation/types';
import { authStyles } from '@/screens/auth/styles';
import { recipientStyles } from '@/screens/recipient/styles';
import {
  listMessages,
  markUnreadMessagesRead,
  sendMessage,
  verifyMessagingAuthorized,
  type AppMessage,
} from '@/services/supabase/messages';
import { subscribeToMessages } from '@/services/supabase/realtime';

type Props = NativeStackScreenProps<AppStackParamList, 'ChatThread'>;

type SendState = 'idle' | 'sending' | 'error';

export function ChatThreadScreen({ route }: Props) {
  const { bloodRequestId, donorMatchId, recipientDisplayName, recipientId } = route.params;
  const { session } = useAuth();
  const currentUserId = session?.user.id;

  const [messages, setMessages] = useState<AppMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [draft, setDraft] = useState('');
  const [sendState, setSendState] = useState<SendState>('idle');
  const [sendError, setSendError] = useState<string | null>(null);

  const listRef = useRef<FlatList<AppMessage>>(null);

  const conversationContext = useMemo(
    () => ({
      bloodRequestId,
      donorMatchId,
      recipientId,
    }),
    [bloodRequestId, donorMatchId, recipientId],
  );

  const loadMessages = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!currentUserId) {
        setError('You must be signed in to view messages.');
        setLoading(false);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }

      setError(null);

      const authorization = await verifyMessagingAuthorized(conversationContext, currentUserId);

      if (authorization.kind === 'error') {
        setError(authorization.message);
        setMessages([]);
        setLoading(false);
        return;
      }

      if (authorization.kind === 'unauthorized') {
        setAccessDenied(true);
        setError(authorization.message);
        setMessages([]);
        setLoading(false);
        return;
      }

      setAccessDenied(false);

      const { data, error: fetchError } = await listMessages(conversationContext);

      if (fetchError) {
        setError(fetchError.message);
        setMessages([]);
        setLoading(false);
        return;
      }

      const nextMessages = data ?? [];
      setMessages(nextMessages);
      setLoading(false);

      await markUnreadMessagesRead(nextMessages, currentUserId);
    },
    [conversationContext, currentUserId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadMessages();

      if (!currentUserId || accessDenied) {
        return undefined;
      }

      const subscription = subscribeToMessages(
        { bloodRequestId, donorMatchId },
        () => {
          void loadMessages({ silent: true });
        },
      );

      return () => {
        subscription.stop();
      };
    }, [accessDenied, bloodRequestId, currentUserId, donorMatchId, loadMessages]),
  );

  const handleSend = useCallback(async () => {
    if (!currentUserId || !draft.trim()) {
      return;
    }

    setSendState('sending');
    setSendError(null);

    const result = await sendMessage(currentUserId, recipientId, draft, {
      bloodRequestId,
      donorMatchId,
    });

    if (result.kind === 'success') {
      setDraft('');
      setSendState('idle');
      setMessages((current) => [...current, result.message]);
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
      return;
    }

    setSendState('error');
    setSendError(result.message);
  }, [bloodRequestId, currentUserId, donorMatchId, draft, recipientId]);

  const headerLabel = recipientDisplayName?.trim() || 'Conversation';

  if (loading) {
    return (
      <View style={recipientStyles.centerContent}>
        <ActivityIndicator color="#b91c1c" size="large" />
        <Text style={recipientStyles.subtitle}>Loading messages…</Text>
      </View>
    );
  }

  if (error && (accessDenied || messages.length === 0)) {
    return (
      <View style={recipientStyles.centerContent}>
        <Text style={authStyles.error}>{error}</Text>
        {!accessDenied ? (
          <PrimaryButton title="Try again" onPress={() => void loadMessages()} />
        ) : null}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Secure chat</Text>
        <Text style={styles.headerTitle}>{headerLabel}</Text>
        <Text style={styles.headerSubtitle}>
          Coordinate donation details. Do not share sensitive contact info unless already authorized
          through your accepted match.
        </Text>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={recipientStyles.emptyText}>
            No messages yet. Send a message to start coordinating with your matched contact.
          </Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={styles.messageList}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => (
            <MessageBubble
              isOwnMessage={item.sender_id === currentUserId}
              message={item}
              showReadState
            />
          )}
          style={styles.messageListContainer}
        />
      )}

      {error ? <Text style={[authStyles.error, styles.inlineError]}>{error}</Text> : null}

      {!accessDenied ? (
        <View style={styles.composer}>
          <TextInput
            editable={sendState !== 'sending'}
            multiline
            placeholder="Type a message…"
            placeholderTextColor="#9ca3af"
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
          />
          <PrimaryButton
            disabled={!draft.trim()}
            loading={sendState === 'sending'}
            title="Send"
            onPress={() => void handleSend()}
          />
          {sendError ? <Text style={authStyles.error}>{sendError}</Text> : null}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  composer: {
    backgroundColor: '#fff',
    borderTopColor: '#fecaca',
    borderTopWidth: 1,
    gap: 10,
    padding: 16,
    paddingBottom: 24,
  },
  container: {
    backgroundColor: '#fef2f2',
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    backgroundColor: '#fff',
    borderBottomColor: '#fecaca',
    borderBottomWidth: 1,
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  headerEyebrow: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  headerSubtitle: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  headerTitle: {
    color: '#991b1b',
    fontSize: 20,
    fontWeight: '800',
  },
  inlineError: {
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff7f7',
    borderColor: '#fecaca',
    borderRadius: 14,
    borderWidth: 1,
    color: '#1f2937',
    fontSize: 16,
    maxHeight: 120,
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageList: {
    gap: 4,
    padding: 16,
    paddingBottom: 8,
  },
  messageListContainer: {
    flex: 1,
  },
});
