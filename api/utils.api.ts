import {
  getDownloadURL,
  ref,
  uploadBytes,
  deleteObject,
} from 'firebase/storage';
import { storage } from './firebase';
import * as Crypto from 'expo-crypto';
import { getFileNameFromUri } from '@/utils/getFilenameFromUri';
import { getFirebaseFilePathFromUrl } from '@/utils/getFirebaseFilepathFromUrl';

// Upload a single image to Firebase Storage and return the download URL
export const uploadImagesToStorage = async (
  images: string[],
  folderPrefix: string,
  id: string
): Promise<string[]> => {
  // I created this array so that I can access the download urls in the catch scope of the tryctach
  let downloadUrls: string[] = [];
  try {
    // These are download urls that will be stored in firebase storage
    const storedDownloadUrls = Promise.all(
      images.map(async (image) => {
        // Read the file as a blob
        const response = await fetch(image);
        const blob = await response.blob();

        const filename = getFileNameFromUri(image);
        const filepath = `${folderPrefix}/${id}/${filename}_${Date.now()}.${blob.type}`;

        // Create a reference to the file in Firebase Storage
        const imageRef = ref(storage, filepath);

        // Upload the blob
        await uploadBytes(imageRef, blob);

        // Get the download URL
        const downloadURL = await getDownloadURL(imageRef);
        downloadUrls.push(downloadURL);

        return downloadURL;
      })
    );
    return storedDownloadUrls;
  } catch (error) {
    // if one the the upload fails, it removes all of the images that we're previously uploaded
    // to prevent dead content take up storage
    await removeImagesByUrlsFromStorage(downloadUrls);
    throw new Error(`Failed to upload image: ${JSON.stringify(error)}`);
  }
};

export const removeImagesByUrlsFromStorage = async (
  imageUrls: string[]
): Promise<void> => {
  try {
    await Promise.all(
      imageUrls.map(async (imageUrl) => {
        const filePath = getFirebaseFilePathFromUrl(imageUrl) ?? '';
        try {
          const imageRef = ref(storage, filePath);
          // Delete the image
          await deleteObject(imageRef);
        } catch (error) {
          // Log error but continue deleting other images
          console.error(`Failed to delete image ${filePath}:`, error);
          //FIXME: add logging to a db so I can track images that have been deleted. This also me to do it manually
          throw new Error(`Failed to delete image: ${JSON.stringify(error)}`);
        }
      })
    );
  } catch (error) {
    throw new Error(`Failed to remove images: ${JSON.stringify(error)}`);
  }
};
