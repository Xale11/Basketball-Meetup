export function getFirebaseFilePathFromUrl(downloadUrl: string) {
    try {
      // Example URL:
      // https://firebasestorage.googleapis.com/v0/b/<bucket>/o/<encoded-path>?alt=media&token=...
  
      // 1. Extract the part after '/o/' and before '?'
      const startIndex = downloadUrl.indexOf('/o/') + 3;
      const endIndex = downloadUrl.indexOf('?');
  
      if (startIndex === -1 || endIndex === -1) {
        throw new Error('Invalid Firebase Storage URL');
      }
  
      const encodedPath = downloadUrl.substring(startIndex, endIndex);
  
      // 2. Decode the URL-encoded path
      const storagePath = decodeURIComponent(encodedPath);
  
      return storagePath;
    } catch (error) {
      console.error('Error extracting storage path:', error);
      return null;
    }
  }