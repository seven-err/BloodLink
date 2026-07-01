import * as DocumentPicker from 'expo-document-picker';
import { Upload } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { createBloodRequestStyles } from '@/screens/recipient/createBloodRequestStyles';
import type { LocalDocument } from '@/services/supabase/storageUpload';

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

type MedicalDocumentUploadFieldProps = {
  document: LocalDocument | null;
  error?: string;
  onChange: (document: LocalDocument | null) => void;
};

export function MedicalDocumentUploadField({
  document,
  error,
  onChange,
}: MedicalDocumentUploadFieldProps) {
  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: ACCEPTED_TYPES,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    onChange({
      mimeType: asset.mimeType,
      name: asset.name,
      uri: asset.uri,
    });
  };

  return (
    <View style={createBloodRequestStyles.field}>
      <Text style={createBloodRequestStyles.fieldLabel}>Upload Document (Optional)</Text>
      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          createBloodRequestStyles.uploadBox,
          pressed ? createBloodRequestStyles.uploadBoxPressed : null,
        ]}
        onPress={pickDocument}
      >
        <Upload color={colors.muted} size={28} />
        <Text style={createBloodRequestStyles.uploadHint}>
          {document ? 'Tap to replace medical document' : 'Click to upload medical documents'}
        </Text>
        {document ? (
          <Text numberOfLines={2} style={createBloodRequestStyles.uploadName}>
            {document.name}
          </Text>
        ) : null}
      </Pressable>
      {error ? <Text style={createBloodRequestStyles.errorText}>{error}</Text> : null}
    </View>
  );
}
