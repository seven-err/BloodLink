import { Platform } from 'react-native';

import type { LocalDocument } from '@/services/supabase/storageUpload';

export const base64ToArrayBuffer = (base64: string) => {
  const normalized = base64.replace(/^data:[^;]+;base64,/, '');
  const binary = globalThis.atob(normalized);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
};

const readWithXmlHttpRequest = (uri: string) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => {
      if (xhr.response instanceof ArrayBuffer && xhr.response.byteLength > 0) {
        resolve(xhr.response);
        return;
      }

      reject(new Error('Unable to read the selected file.'));
    };
    xhr.onerror = () => reject(new Error('Unable to read the selected file.'));
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', uri);
    xhr.send(null);
  });

export const readLocalFileAsArrayBuffer = async (uri: string) => {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);

    if (!response.ok) {
      throw new Error('Unable to read the selected file.');
    }

    return response.arrayBuffer();
  }

  try {
    const response = await fetch(uri);

    if (response.ok) {
      const buffer = await response.arrayBuffer();

      if (buffer.byteLength > 0) {
        return buffer;
      }
    }
  } catch {
    // Fall back to XMLHttpRequest for local URIs.
  }

  return readWithXmlHttpRequest(uri);
};

export const readDocumentAsArrayBuffer = async (document: LocalDocument) => {
  if (document.base64?.trim()) {
    return base64ToArrayBuffer(document.base64);
  }

  return readLocalFileAsArrayBuffer(document.uri);
};
