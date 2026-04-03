import { supabase } from './supabase';

const DEFAULT_bucket = 'images';

export const uploadToSupabaseBucket = async (
  uri: string,
  folder: string,
  fileName: string,
  bucket: string = DEFAULT_bucket,
): Promise<string> => {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const filePath = `${folder}/${fileName}.${ext}`;
  console.log(`[uploadToSupabaseBucket] uploading ${filePath} to bucket: ${bucket}`);

  const response = await fetch(uri);
  const blob = await response.blob();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, blob, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error(`[uploadToSupabaseBucket] failed — ${error.message}`);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  console.log(`[uploadToSupabaseBucket] success`);

  return data.publicUrl;
};
