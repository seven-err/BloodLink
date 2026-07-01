import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Info, Send } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HemieAvatar } from '@/components/hemie/HemieAvatar';
import { HemieEmergencyDisclaimer } from '@/components/hemie/HemieEmergencyDisclaimer';
import { HemieMessageBubble } from '@/components/hemie/HemieMessageBubble';
import { SuggestedQuestionCard } from '@/components/hemie/SuggestedQuestionCard';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import type { AppStackParamList } from '@/navigation/types';
import { hemieStyles } from '@/screens/hemie/styles';
import {
  getHemieResponse,
  getHemieWelcomeMessage,
  HEMIE_SUGGESTED_QUESTIONS,
} from '@/utils/hemieResponses';

type Props = NativeStackScreenProps<AppStackParamList, 'HemieAI'>;

type ChatMessage = {
  id: string;
  isUser: boolean;
  text: string;
  timestamp: string;
};

const DISCLAIMER_STORAGE_KEY = 'hemie_emergency_disclaimer_hidden';
const COMPOSER_SPACE = 88;
const KEYBOARD_COMPOSER_LIFT = 20;

const formatChatTimestamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

let messageCounter = 0;
const createMessageId = () => `hemie-${Date.now()}-${messageCounter++}`;

export function HemieAIScreen({ navigation }: Props) {
  const { bottom: bottomInset, top: topInset } = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const { profile } = useAuth();
  const scrollRef = useRef<ScrollView>(null);
  const [draft, setDraft] = useState('');
  const [disclaimerVisible, setDisclaimerVisible] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: createMessageId(),
      isUser: false,
      text: getHemieWelcomeMessage(),
      timestamp: formatChatTimestamp(),
    },
  ]);

  useEffect(() => {
    void AsyncStorage.getItem(DISCLAIMER_STORAGE_KEY).then((value) => {
      if (value === 'true') {
        setDisclaimerVisible(false);
      }
    });
  }, []);

  const hideDisclaimer = useCallback(() => {
    setDisclaimerVisible(false);
    void AsyncStorage.setItem(DISCLAIMER_STORAGE_KEY, 'true');
  }, []);

  const showDisclaimer = useCallback(() => {
    setDisclaimerVisible(true);
    void AsyncStorage.removeItem(DISCLAIMER_STORAGE_KEY);
    scrollRef.current?.scrollTo({ animated: true, y: 0 });
  }, []);

  const hemieContext = useMemo(
    () => ({
      birthdate: profile?.birthdate,
      lastTransfusionDate: null,
      role: profile?.role,
      weightKg: profile?.weight_kg,
    }),
    [profile?.birthdate, profile?.role, profile?.weight_kg],
  );

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  useEffect(() => {
    if (keyboardHeight > 0) {
      scrollToBottom();
    }
  }, [keyboardHeight, scrollToBottom]);

  const appendExchange = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) {
        return;
      }

      const userMessage: ChatMessage = {
        id: createMessageId(),
        isUser: true,
        text: trimmed,
        timestamp: formatChatTimestamp(),
      };

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        isUser: false,
        text: getHemieResponse(trimmed, hemieContext),
        timestamp: formatChatTimestamp(),
      };

      setMessages((current) => [...current, userMessage, assistantMessage]);
      setDraft('');
      scrollToBottom();
    },
    [hemieContext, scrollToBottom],
  );

  const showSuggestedQuestions = messages.length === 1;
  const keyboardOpen = keyboardHeight > 0;
  const composerBottom = keyboardOpen ? keyboardHeight + KEYBOARD_COMPOSER_LIFT : 0;
  const composerPaddingBottom = keyboardOpen ? 12 : Math.max(bottomInset, 12);
  const scrollBottomInset = keyboardOpen
    ? COMPOSER_SPACE + keyboardHeight + KEYBOARD_COMPOSER_LIFT
    : COMPOSER_SPACE + bottomInset;

  return (
    <View style={hemieStyles.screen}>
      <View style={[hemieStyles.header, { paddingTop: topInset + 8 }]}>
        {navigation.canGoBack() ? (
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft color={colors.foreground} size={22} />
          </Pressable>
        ) : (
          <View style={{ width: 22 }} />
        )}
        <HemieAvatar size={42} />
        <View style={hemieStyles.headerCopy}>
          <Text style={hemieStyles.headerTitle}>Hemie AI</Text>
          <Text style={hemieStyles.headerSubtitle}>Your BloodLink Assistant</Text>
        </View>
        {!disclaimerVisible ? (
          <Pressable
            accessibilityLabel="Show emergency disclaimer"
            accessibilityRole="button"
            style={hemieStyles.headerInfoButton}
            onPress={showDisclaimer}
          >
            <Info color={colors.primary} size={18} />
          </Pressable>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[hemieStyles.chatContent, { paddingBottom: scrollBottomInset }]}
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        keyboardShouldPersistTaps="handled"
        style={hemieStyles.chatBody}
        onContentSizeChange={() => {
          if (keyboardOpen) {
            scrollToBottom();
          }
        }}
      >
        {disclaimerVisible ? <HemieEmergencyDisclaimer onDismiss={hideDisclaimer} /> : null}

        {showSuggestedQuestions ? (
          <View style={hemieStyles.suggestedSection}>
            <Text style={hemieStyles.suggestedLabel}>Try asking:</Text>
            <View style={hemieStyles.suggestedGrid}>
              {HEMIE_SUGGESTED_QUESTIONS.map((question) => (
                <SuggestedQuestionCard
                  key={question}
                  question={question}
                  onPress={() => appendExchange(question)}
                />
              ))}
            </View>
          </View>
        ) : null}

        {messages.map((message) => (
          <HemieMessageBubble
            key={message.id}
            isUser={message.isUser}
            text={message.text}
            timestamp={message.timestamp}
          />
        ))}
      </ScrollView>

      <View style={[hemieStyles.composerDock, { bottom: composerBottom, paddingBottom: composerPaddingBottom }]}>
        <View style={hemieStyles.footer}>
          <View style={hemieStyles.inputRow}>
            <TextInput
              multiline
              placeholder="Ask me anything about blood donation..."
              placeholderTextColor={colors.muted}
              returnKeyType="send"
              style={hemieStyles.input}
              value={draft}
              blurOnSubmit={false}
              onChangeText={setDraft}
              onFocus={scrollToBottom}
              onSubmitEditing={() => appendExchange(draft)}
            />
            <Pressable
              accessibilityLabel="Send message"
              accessibilityRole="button"
              disabled={!draft.trim()}
              style={[hemieStyles.sendButton, !draft.trim() ? hemieStyles.sendButtonDisabled : null]}
              onPress={() => appendExchange(draft)}
            >
              <Send color={colors.primaryForeground} size={20} />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
