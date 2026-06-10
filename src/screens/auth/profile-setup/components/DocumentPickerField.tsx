import * as DocumentPicker from 'expo-document-picker';
import { Pressable, Text, View } from 'react-native';

import type { LocalDocument } from '@/services/supabase/storageUpload';
import { profileSetupStyles } from '../styles';

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

type DocumentPickerFieldProps = {
  documents: LocalDocument[];
  error?: string | null;
  onChange: (documents: LocalDocument[]) => void;
};

export function DocumentPickerField({
  documents,
  error,
  onChange,
}: DocumentPickerFieldProps) {
  const pickDocuments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: ACCEPTED_TYPES,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    const nextDocuments = result.assets.map((asset) => ({
      mimeType: asset.mimeType,
      name: asset.name,
      uri: asset.uri,
    }));

    onChange([...documents, ...nextDocuments]);
  };

  const removeDocument = (index: number) => {
    onChange(documents.filter((_, documentIndex) => documentIndex !== index));
  };

  return (
    <View style={profileSetupStyles.section}>
      <Text style={profileSetupStyles.sectionTitle}>Proof of affiliation</Text>
      <Text style={profileSetupStyles.stepSubtitle}>
        Upload at least one: staff ID, certificate of employment, authorization letter,
        PRC/license ID, or hospital/blood bank document.
      </Text>
      <Pressable style={profileSetupStyles.uploadButton} onPress={pickDocuments}>
        <Text style={profileSetupStyles.uploadButtonText}>Upload document</Text>
      </Pressable>
      {documents.length ? (
        <View style={profileSetupStyles.documentList}>
          {documents.map((document, index) => (
            <Pressable
              key={`${document.uri}-${index}`}
              style={profileSetupStyles.documentChip}
              onPress={() => removeDocument(index)}
            >
              <Text numberOfLines={1} style={profileSetupStyles.documentChipText}>
                {document.name}
              </Text>
              <Text style={profileSetupStyles.documentChipText}>Remove</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {error ? <Text style={{ color: '#dc2626', fontSize: 13 }}>{error}</Text> : null}
    </View>
  );
}
