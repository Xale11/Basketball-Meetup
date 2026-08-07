import { File } from 'expo-file-system';
import { supabase } from './supabase';

const DEFAULT_bucket = 'images';

const mimeTypeFromUri = (uri: string): { ext: string; mimeType: string } => {
  const lastSegment = uri.split('?')[0].split('/').pop() ?? '';
  const dotIndex = lastSegment.lastIndexOf('.');
  const ext = dotIndex !== -1 ? lastSegment.slice(dotIndex + 1).toLowerCase() : 'jpg';
  const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
  return { ext: ext === 'jpeg' ? 'jpg' : ext, mimeType };
};

export const uploadToSupabaseBucket = async (
  uri: string,
  folder: string,
  fileName: string,
  bucket: string = DEFAULT_bucket,
  assetMimeType?: string,
): Promise<string> => {
  const { ext, mimeType: inferredMimeType } = mimeTypeFromUri(uri);
  const mimeType = assetMimeType ?? inferredMimeType;
  const filePath = `${folder}/${fileName}.${ext}`;

  // expo-file-system v19 (SDK 54) reads bytes directly — no base64 round-trip.
  // The old readAsStringAsync/EncodingType path now throws by design.
  const bytes = await new File(uri).bytes();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, bytes, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error(`[uploadToSupabaseBucket] failed — ${error.message}`);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return data.publicUrl;
};
