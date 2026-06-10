import { readDocumentAsArrayBuffer } from '@/utils/readLocalFile';

import { supabase } from './client';
const STAFF_DOCUMENTS_BUCKET = 'staff-documents';
const BLOOD_REQUEST_ATTACHMENTS_BUCKET = 'blood-request-attachments';

export type LocalDocument = {
  base64?: string | null;
  uri: string;
  name: string;
  mimeType?: string | null;
};

const extensionFromMime = (mimeType: string | null | undefined) => {
  switch (mimeType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'application/pdf':
      return 'pdf';
    default:
      return 'bin';
  }
};

export const uploadStaffDocuments = async (userId: string, documents: LocalDocument[]) => {
  const uploadedPaths: string[] = [];

  for (const [index, document] of documents.entries()) {
    const extension = extensionFromMime(document.mimeType);
    const safeName = document.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${Date.now()}-${index}-${safeName || `document.${extension}`}`;
    const arrayBuffer = await readDocumentAsArrayBuffer(document);
    const contentType = document.mimeType ?? 'application/octet-stream';

    const { error } = await supabase.storage.from(STAFF_DOCUMENTS_BUCKET).upload(path, arrayBuffer, {
      contentType,
      upsert: false,
    });

    if (error) {
      throw error;
    }

    uploadedPaths.push(path);
  }

  return uploadedPaths;
};

export const uploadBloodRequestAttachment = async (
  userId: string,
  document: LocalDocument,
) => {
  const extension = extensionFromMime(document.mimeType);
  const safeName = document.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}-${safeName || `attachment.${extension}`}`;
  const arrayBuffer = await readDocumentAsArrayBuffer(document);
  const contentType = document.mimeType ?? 'application/octet-stream';

  const { error } = await supabase.storage
    .from(BLOOD_REQUEST_ATTACHMENTS_BUCKET)
    .upload(path, arrayBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return path;
};
