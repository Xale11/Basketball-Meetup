import { supabase } from './supabase';

const BUCKET = 'images';

export const uploadToSupabaseBucket = async (
  uri: string,
  folder: string,
  fileName: string
): Promise<string> => {
  const ext = uri.split('.').pop()?.split('?')[0]?.toLowerCase() || 'jpg';
  const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
  const filePath = `${folder}/${fileName}.${ext}`;
  console.log(`[uploadToSupabaseBucket] uploading ${filePath}`);

  const formData = new FormData();
  formData.append('file', { uri, name: `${fileName}.${ext}`, type: mimeType } as any);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, formData, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error(`[uploadToSupabaseBucket] failed — ${error.message}`);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  console.log(`[uploadToSupabaseBucket] success`);

  return data.publicUrl;
};
