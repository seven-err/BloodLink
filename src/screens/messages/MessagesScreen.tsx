import { useFocusEffect } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Search } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HemieFloatingButton } from '@/components/hemie/HemieFloatingButton';
import { ConversationListItem } from '@/components/messages/ConversationListItem';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Skeleton } from '@/components/common/Skeleton';
import { colors } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { AppTabParamList } from '@/navigation/AppTabNavigator';
import type { AppStackParamList } from '@/navigation/types';
import { messagesStyles } from '@/screens/messages/styles';
import {
  listConversations,
  type ConversationPreview,
} from '@/services/supabase/messages';

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, 'Chat'>,
  NativeStackScreenProps<AppStackParamList>
>;

function MessagesSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={messagesStyles.screen}>
      <View style={[messagesStyles.header, { paddingTop: topInset + 8 }]}>
        <Skeleton borderRadius={8} height={26} width={140} />
        <Skeleton borderRadius={16} height={46} width="100%" />
      </View>
      <View style={messagesStyles.skeletonList}>
        <View style={messagesStyles.skeletonRow}>
          <Skeleton borderRadius={24} height={48} width={48} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton borderRadius={8} height={16} width="55%" />
            <Skeleton borderRadius={8} height={14} width="80%" />
          </View>
        </View>
        {[0, 1, 2].map((index) => (
          <View key={index} style={messagesStyles.skeletonRow}>
            <Skeleton borderRadius={24} height={48} width={48} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton borderRadius={8} height={16} width="45%" />
              <Skeleton borderRadius={8} height={14} width="70%" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MessagesScreen({ navigation }: Props) {
  const { top: topInset } = useSafeAreaInsets();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadConversations = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setError('You must be signed in to view messages.');
        setConversations([]);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      const { data, error: loadError } = await listConversations(userId);

      if (loadError) {
        setError(loadError.message);
        setConversations([]);
      } else {
        setConversations(data ?? []);
      }

      setLoading(false);
      setRefreshing(false);
    },
    [userId],
  );

  useFocusEffect(
    useCallback(() => {
      void loadConversations();
    }, [loadConversations]),
  );

  const filteredConversations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return conversations;
    }

    return conversations.filter(
      (conversation) =>
        conversation.displayName.toLowerCase().includes(query) ||
        conversation.lastMessageBody.toLowerCase().includes(query),
    );
  }, [conversations, searchQuery]);

  const openHemie = useCallback(() => {
    navigation.getParent()?.navigate('HemieAI');
  }, [navigation]);

  const openConversation = useCallback(
    (conversation: ConversationPreview) => {
      navigation.getParent()?.navigate('ChatThread', {
        bloodRequestId: conversation.bloodRequestId,
        donorMatchId: conversation.donorMatchId,
        recipientDisplayName: conversation.displayName,
        recipientId: conversation.otherPartyId,
      });
    },
    [navigation],
  );

  if (loading) {
    return <MessagesSkeleton topInset={topInset} />;
  }

  return (
    <View style={messagesStyles.screen}>
      <View style={[messagesStyles.header, { paddingTop: topInset + 8 }]}>
        <Text style={messagesStyles.title}>Messages</Text>
        <View style={messagesStyles.searchBar}>
          <Search color={colors.muted} size={20} />
          <TextInput
            accessibilityLabel="Search conversations"
            placeholder="Search conversations..."
            placeholderTextColor={colors.muted}
            style={messagesStyles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.donorMatchId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void loadConversations(true)} />
        }
        renderItem={({ item }) => (
          <ConversationListItem conversation={item} onPress={() => openConversation(item)} />
        )}
        ListEmptyComponent={
          error ? (
            <View style={messagesStyles.emptyCard}>
              <Text style={messagesStyles.emptyText}>{error}</Text>
              <PrimaryButton title="Try again" onPress={() => void loadConversations()} />
            </View>
          ) : searchQuery.trim() ? (
            <View style={messagesStyles.emptyCard}>
              <Text style={messagesStyles.emptyText}>No conversations match your search.</Text>
            </View>
          ) : (
            <View style={messagesStyles.emptyCard}>
              <Text style={messagesStyles.emptyText}>
                No conversations yet. Accepted donation matches will appear here so you can
                coordinate securely.
              </Text>
            </View>
          )
        }
        style={messagesStyles.list}
      />

      <HemieFloatingButton onPress={openHemie} />
    </View>
  );
}
