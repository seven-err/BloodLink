import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { Alert } from 'react-native';

type UseUnsavedChangesGuardOptions = {
  enabled: boolean;
  message?: string;
  title?: string;
};

export function useUnsavedChangesGuard({
  enabled,
  message = 'You have unsaved changes. Discard them and leave this screen?',
  title = 'Discard changes?',
}: UseUnsavedChangesGuardOptions) {
  const navigation = useNavigation();
  const allowExitRef = useRef(false);

  const allowExit = useCallback(() => {
    allowExitRef.current = true;
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (!enabled || allowExitRef.current) {
        return;
      }

      event.preventDefault();

      Alert.alert(title, message, [
        { style: 'cancel', text: 'Keep editing' },
        {
          style: 'destructive',
          text: 'Discard',
          onPress: () => {
            allowExitRef.current = true;
            navigation.dispatch(event.data.action);
          },
        },
      ]);
    });

    return unsubscribe;
  }, [enabled, message, navigation, title]);

  return { allowExit };
}
